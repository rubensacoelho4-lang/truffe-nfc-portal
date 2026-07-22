// (game)/index.tsx — écran principal : pays courant + boulots.
// Le "GATE de fun" de la Phase 1 se joue ici. Le voyage a son propre onglet.

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCountry } from '@/data/countries';
import { passiveBonusFromCollection } from '@/data/collectibles';
import { activeBoostFactor, globalMultiplier, revenuePerSecond } from '@/engine/gameLoop';
import { canTravel } from '@/engine/prestige';
import { JobCard } from '@/components/JobCard';
import { MoneyCounter } from '@/components/MoneyCounter';
import { OfflineModal } from '@/components/OfflineModal';
import { formatMoney } from '@/lib/format';
import { selectionTick } from '@/lib/haptics';
import { useGameStore, type BuyAmount } from '@/store/gameStore';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/theme/theme';

const BUY_AMOUNTS: BuyAmount[] = [1, 10, 100, 'max'];

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const hydrated = useGameStore((s) => s.hydrated);
  const state = useGameStore((s) => s.state);
  const pendingOffline = useGameStore((s) => s.pendingOffline);
  const clearPendingOffline = useGameStore((s) => s.clearPendingOffline);
  const cloudEnabled = useGameStore((s) => s.cloudEnabled);
  const syncPending = useGameStore((s) => s.syncPending);

  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);

  const country = getCountry(state.currentCountryId) ?? getCountry('france')!;
  const bonus = passiveBonusFromCollection(state.collection);
  const boost = activeBoostFactor(state, Date.now());
  const mult = globalMultiplier(country, bonus, boost);
  const rps = useMemo(() => revenuePerSecond(state, country, bonus, boost), [state, country, bonus, boost]);
  const travelReady = canTravel(state, country);
  const travelPct = Math.min(1, state.money / country.travelCost);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Chargement du voyage…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ————— Header ————— */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={styles.countryRow}>
          <Text style={styles.flag}>{country.flag ?? '🌍'}</Text>
          <Text style={styles.countryName}>{country.name}</Text>
          {cloudEnabled && syncPending ? (
            <View style={styles.syncPill}>
              <Text style={styles.syncText}>⏳ sync</Text>
            </View>
          ) : null}
          <View style={styles.milesPill}>
            <Text style={styles.milesText}>🧭 {formatMoney(state.miles)} miles</Text>
          </View>
        </View>

        <MoneyCounter value={state.money} prefix="€" />
        <Text style={styles.rps}>
          +{formatMoney(rps)}/s
          {bonus > 0 ? `  ·  collection +${Math.round(bonus * 100)}%` : ''}
          {boost > 1 ? `  ·  ⚡×${boost}` : ''}
        </Text>

        <View style={styles.buyToggle}>
          {BUY_AMOUNTS.map((amt) => {
            const active = amt === buyAmount;
            return (
              <Pressable
                key={String(amt)}
                onPress={() => {
                  selectionTick();
                  setBuyAmount(amt);
                }}
                style={[styles.buyChip, active && styles.buyChipActive]}
              >
                <Text style={[styles.buyChipText, active && styles.buyChipTextActive]}>
                  {amt === 'max' ? 'MAX' : `×${amt}`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Progression vers le voyage → tape pour aller à l'onglet Voyage */}
        <Pressable style={styles.voyageHint} onPress={() => router.navigate('/travel')}>
          <View style={styles.voyageTrack}>
            <View style={[styles.voyageFill, { width: `${travelPct * 100}%` }]} />
          </View>
          <Text style={[styles.voyageLabel, travelReady && styles.voyageReady]}>
            {travelReady
              ? '✈️ Prêt à voyager — appuie ici'
              : `Voyage à ${formatMoney(country.travelCost)} · ${Math.floor(travelPct * 100)}%`}
          </Text>
        </Pressable>
      </View>

      {/* ————— Boulots ————— */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {country.jobs.map((job) => (
          <JobCard key={job.id} job={job} buyAmount={buyAmount} globalMult={mult} />
        ))}
      </ScrollView>

      <OfflineModal result={pendingOffline} onClose={clearPendingOffline} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  loading: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: COLORS.textMuted, fontSize: FONT_SIZE.subtitle },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  countryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  flag: { fontSize: 22, marginRight: SPACING.sm },
  countryName: { color: COLORS.text, fontSize: FONT_SIZE.title, fontWeight: FONT_WEIGHT.bold, flex: 1 },
  milesPill: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  milesText: { color: COLORS.miles, fontSize: FONT_SIZE.caption, fontWeight: FONT_WEIGHT.semibold },
  syncPill: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  syncText: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs },
  rps: { color: COLORS.success, fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold, marginTop: 2 },
  buyToggle: { flexDirection: 'row', marginTop: SPACING.md, gap: SPACING.sm },
  buyChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buyChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  buyChipText: { color: COLORS.textMuted, fontSize: FONT_SIZE.caption, fontWeight: FONT_WEIGHT.bold },
  buyChipTextActive: { color: '#fff' },
  voyageHint: { marginTop: SPACING.md },
  voyageTrack: {
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.progressTrack,
    overflow: 'hidden',
    marginBottom: 4,
  },
  voyageFill: { height: '100%', backgroundColor: COLORS.miles },
  voyageLabel: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium },
  voyageReady: { color: COLORS.accent, fontWeight: FONT_WEIGHT.bold },
  list: { flex: 1 },
});
