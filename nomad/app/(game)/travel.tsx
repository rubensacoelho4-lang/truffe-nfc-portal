// (game)/travel.tsx — écran de VOYAGE (prestige). Quitter le pays courant pour
// le suivant : reset des boulots + argent, gain de miles, souvenirs, tampon.

import React, { useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCountry, nextCountry } from '@/data/countries';
import { getCollectible } from '@/data/collectibles';
import { canTravel, milesFromTravel } from '@/engine/prestige';
import { Confetti } from '@/components/fx/Confetti';
import { formatMoney } from '@/lib/format';
import { celebrate, notifyWarning } from '@/lib/haptics';
import { useScreenEntrance } from '@/lib/useScreenEntrance';
import { useGameStore } from '@/store/gameStore';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/theme/theme';

export default function TravelScreen() {
  const insets = useSafeAreaInsets();
  const entrance = useScreenEntrance();
  const state = useGameStore((s) => s.state);
  const travel = useGameStore((s) => s.travel);

  const [fireKey, setFireKey] = useState(0);

  const country = getCountry(state.currentCountryId) ?? getCountry('france')!;
  const next = nextCountry(country.id);
  const ready = canTravel(state, country);
  const milesToGain = useMemo(() => milesFromTravel(state.earnedInCountry), [state.earnedInCountry]);
  const travelPct = Math.min(1, state.money / country.travelCost);

  const onTravel = () => {
    if (!ready || !next) {
      notifyWarning();
      return;
    }
    void celebrate();
    setFireKey((k) => k + 1);
    travel();
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          padding: SPACING.lg,
          paddingTop: insets.top + SPACING.lg,
          paddingBottom: SPACING.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={entrance}>
          <Text style={styles.title}>Voyager</Text>
          <Text style={styles.subtitle}>
            Repartir de zéro dans un nouveau pays, plus riche et plus rapide.
          </Text>

          {/* Pays courant → suivant */}
          <View style={styles.routeCard}>
            <View style={styles.routeSide}>
              <Text style={styles.routeFlag}>{country.flag ?? '🌍'}</Text>
              <Text style={styles.routeName}>{country.name}</Text>
              <Text style={styles.routeMult}>×{country.travelBonusMultiplier}</Text>
            </View>
            <Text style={styles.routeArrow}>✈️</Text>
            <View style={styles.routeSide}>
              <Text style={styles.routeFlag}>{next?.flag ?? '🏁'}</Text>
              <Text style={styles.routeName}>{next?.name ?? 'Fin de la sortie'}</Text>
              {next ? <Text style={[styles.routeMult, styles.routeMultNext]}>×{next.travelBonusMultiplier}</Text> : null}
            </View>
          </View>

          {/* Ce que tu gagnes */}
          <View style={styles.gainCard}>
            <Text style={styles.gainTitle}>En voyageant, tu gagnes</Text>
            <Row label="🧭 Miles de prestige" value={`+${formatMoney(milesToGain)}`} accent={COLORS.miles} />
            <Row label="🛂 Tampon passeport" value={country.name} accent={COLORS.text} />
            <View style={styles.souvenirRow}>
              <Text style={styles.gainLabel}>🎁 Souvenirs</Text>
              <View style={styles.souvenirs}>
                {country.collectibles.map((id) => {
                  const c = getCollectible(id);
                  const owned = state.collection.includes(id);
                  return (
                    <Text key={id} style={[styles.souvenir, owned && styles.souvenirOwned]}>
                      {c?.icon ?? '❔'}
                    </Text>
                  );
                })}
              </View>
            </View>
            <Text style={styles.gainWarn}>
              ⚠️ Ton argent et tes boulots repartent à zéro. Gemmes, miles et collection restent.
            </Text>
          </View>

          {/* Progression */}
          {!ready ? (
            <View style={styles.progressCard}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${travelPct * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {formatMoney(state.money)} / {formatMoney(country.travelCost)}  ·  {Math.floor(travelPct * 100)}%
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={onTravel}
            disabled={!ready || !next}
            style={[styles.cta, ready && next ? styles.ctaOn : styles.ctaOff]}
          >
            <Text style={[styles.ctaText, !(ready && next) && styles.ctaTextOff]}>
              {!next
                ? '🏁 Dernier pays de la sortie'
                : ready
                  ? `✈️ Voyager vers ${next.name}`
                  : `Encore ${formatMoney(country.travelCost - state.money)}`}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <Confetti fireKey={fireKey} />
    </View>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.gainLabel}>{label}</Text>
      <Text style={[styles.gainValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  title: { color: COLORS.text, fontSize: FONT_SIZE.headline, fontWeight: FONT_WEIGHT.heavy },
  subtitle: { color: COLORS.textMuted, fontSize: FONT_SIZE.body, marginTop: 4, marginBottom: SPACING.lg },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  routeSide: { alignItems: 'center', flex: 1 },
  routeFlag: { fontSize: 34 },
  routeName: { color: COLORS.text, fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.bold, marginTop: 4 },
  routeMult: { color: COLORS.textMuted, fontSize: FONT_SIZE.caption, marginTop: 2 },
  routeMultNext: { color: COLORS.accent, fontWeight: FONT_WEIGHT.bold },
  routeArrow: { fontSize: 22, marginHorizontal: SPACING.sm },
  gainCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  gainTitle: { color: COLORS.text, fontSize: FONT_SIZE.subtitle, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  gainLabel: { color: COLORS.textMuted, fontSize: FONT_SIZE.body },
  gainValue: { fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.bold },
  souvenirRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  souvenirs: { flexDirection: 'row', gap: SPACING.sm },
  souvenir: { fontSize: 20, opacity: 0.35 },
  souvenirOwned: { opacity: 1 },
  gainWarn: { color: COLORS.textFaint, fontSize: FONT_SIZE.xs, marginTop: SPACING.sm, lineHeight: 16 },
  progressCard: { marginBottom: SPACING.md },
  progressTrack: {
    height: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.progressTrack,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.miles },
  progressText: { color: COLORS.textMuted, fontSize: FONT_SIZE.caption, textAlign: 'center' },
  cta: { borderRadius: RADIUS.full, paddingVertical: SPACING.lg, alignItems: 'center', marginTop: SPACING.sm },
  ctaOn: { backgroundColor: COLORS.accent },
  ctaOff: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  ctaText: { color: COLORS.bg, fontSize: FONT_SIZE.subtitle, fontWeight: FONT_WEIGHT.heavy },
  ctaTextOff: { color: COLORS.textMuted },
});
