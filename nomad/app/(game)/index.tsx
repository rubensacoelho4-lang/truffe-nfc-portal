// (game)/index.tsx — écran principal : pays courant + boulots.
// Le "GATE de fun" de la Phase 1 se joue ici.

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCountry, nextCountry } from '@/data/countries';
import { passiveBonusFromCollection } from '@/data/collectibles';
import { globalMultiplier, revenuePerSecond } from '@/engine/gameLoop';
import { canTravel } from '@/engine/prestige';
import { JobCard } from '@/components/JobCard';
import { MoneyCounter } from '@/components/MoneyCounter';
import { OfflineModal } from '@/components/OfflineModal';
import { formatMoney } from '@/lib/format';
import { selectionTick, celebrate } from '@/lib/haptics';
import { useGameStore, type BuyAmount } from '@/store/gameStore';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/theme/theme';

const BUY_AMOUNTS: BuyAmount[] = [1, 10, 100, 'max'];

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const hydrated = useGameStore((s) => s.hydrated);
  const state = useGameStore((s) => s.state);
  const pendingOffline = useGameStore((s) => s.pendingOffline);
  const clearPendingOffline = useGameStore((s) => s.clearPendingOffline);
  const travel = useGameStore((s) => s.travel);

  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);

  const country = getCountry(state.currentCountryId) ?? getCountry('france')!;
  const bonus = passiveBonusFromCollection(state.collection);
  const mult = globalMultiplier(country, bonus);
  const rps = useMemo(
    () => revenuePerSecond(state, country, bonus),
    [state, country, bonus],
  );
  const travelReady = canTravel(state, country);
  const hasNext = nextCountry(country.id) != null;
  const travelPct = Math.min(1, state.money / country.travelCost);

  const onTravel = () => {
    if (!travelReady || !hasNext) return;
    void celebrate();
    travel();
  };

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
          <View style={styles.milesPill}>
            <Text style={styles.milesText}>🧭 {formatMoney(state.miles)} miles</Text>
          </View>
        </View>

        <MoneyCounter value={state.money} prefix="€" />
        <Text style={styles.rps}>+{formatMoney(rps)}/s</Text>

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
      </View>

      {/* ————— Boulots ————— */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 140 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {country.jobs.map((job) => (
          <JobCard key={job.id} job={job} buyAmount={buyAmount} globalMult={mult} />
        ))}
      </ScrollView>

      {/* ————— Barre de voyage (prestige) ————— */}
      <View style={[styles.travelBar, { paddingBottom: insets.bottom + SPACING.md }]}>
        <View style={styles.travelTrack}>
          <View style={[styles.travelFill, { width: `${travelPct * 100}%` }]} />
        </View>
        <Pressable
          onPress={onTravel}
          disabled={!travelReady || !hasNext}
          style={[styles.travelBtn, travelReady && hasNext ? styles.travelOn : styles.travelOff]}
        >
          <Text style={styles.travelLabel}>
            {!hasNext
              ? `Prochain pays bientôt · ${formatMoney(state.money)} / ${formatMoney(country.travelCost)}`
              : travelReady
                ? '✈️ Voyager vers le pays suivant'
                : `Voyage à ${formatMoney(country.travelCost)} · ${Math.floor(travelPct * 100)}%`}
          </Text>
        </Pressable>
      </View>

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
  list: { flex: 1 },
  travelBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.bgElevated,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  travelTrack: {
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.progressTrack,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  travelFill: { height: '100%', backgroundColor: COLORS.miles },
  travelBtn: { borderRadius: RADIUS.full, paddingVertical: SPACING.md, alignItems: 'center' },
  travelOn: { backgroundColor: COLORS.accent },
  travelOff: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  travelLabel: { color: COLORS.text, fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.bold },
});
