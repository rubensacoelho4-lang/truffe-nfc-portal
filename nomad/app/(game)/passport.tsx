// (game)/passport.tsx — passeport : collection persistante (le hook rétention).
// Souvenirs par pays + tampons. Total du bonus passif de revenu global.

import React, { useMemo } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COUNTRIES } from '@/data/countries';
import { COLLECTIBLES, passiveBonusFromCollection } from '@/data/collectibles';
import { useScreenEntrance } from '@/lib/useScreenEntrance';
import { useGameStore } from '@/store/gameStore';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/theme/theme';

export default function PassportScreen() {
  const insets = useSafeAreaInsets();
  const entrance = useScreenEntrance();
  const collection = useGameStore((s) => s.state.collection);
  const stamps = useGameStore((s) => s.state.stamps);

  const owned = useMemo(() => new Set(collection), [collection]);
  const bonusPct = Math.round(passiveBonusFromCollection(collection) * 100);
  const totalOwned = collection.length;
  const totalItems = COLLECTIBLES.length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: SPACING.lg, paddingTop: insets.top + SPACING.lg, paddingBottom: SPACING.xxxl }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={entrance}>
        <Text style={styles.title}>🛂 Passeport</Text>
        <Text style={styles.subtitle}>Tes souvenirs restent à vie et boostent tes revenus.</Text>

        {/* Résumé */}
        <View style={styles.summary}>
          <Stat value={`${totalOwned}/${totalItems}`} label="souvenirs" />
          <Stat value={`+${bonusPct}%`} label="revenu global" accent={COLORS.success} />
          <Stat value={`${stamps.length}`} label="tampons" accent={COLORS.miles} />
        </View>

        {/* Tampons de pays */}
        <View style={styles.stampsRow}>
          {COUNTRIES.map((c) => {
            const has = stamps.includes(c.id);
            return (
              <View key={c.id} style={[styles.stamp, has ? styles.stampOn : styles.stampOff]}>
                <Text style={[styles.stampFlag, !has && styles.dim]}>{c.flag ?? '🏳️'}</Text>
                <Text style={[styles.stampName, !has && styles.dim]}>{c.name}</Text>
                {has ? <Text style={styles.stampMark}>✓</Text> : null}
              </View>
            );
          })}
        </View>

        {/* Souvenirs par pays */}
        {COUNTRIES.map((country) => {
          const items = COLLECTIBLES.filter((c) => c.countryId === country.id);
          if (items.length === 0) return null;
          return (
            <View key={country.id} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {country.flag} {country.name}
              </Text>
              <View style={styles.grid}>
                {items.map((item) => {
                  const has = owned.has(item.id);
                  return (
                    <View key={item.id} style={[styles.cell, has ? styles.cellOn : styles.cellOff]}>
                      <Text style={[styles.cellIcon, !has && styles.dim]}>{has ? item.icon ?? '❔' : '🔒'}</Text>
                      <Text style={[styles.cellName, !has && styles.dim]} numberOfLines={1}>
                        {has ? item.name : '???'}
                      </Text>
                      {item.globalRevenueBonus ? (
                        <Text style={[styles.cellBonus, !has && styles.dim]}>
                          +{Math.round(item.globalRevenueBonus * 100)}%
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        <Text style={styles.hint}>
          Les souvenirs d'un pays entrent au passeport quand tu le quittes en voyageant.
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

function Stat({ value, label, accent = COLORS.text }: { value: string; label: string; accent?: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  title: { color: COLORS.text, fontSize: FONT_SIZE.headline, fontWeight: FONT_WEIGHT.heavy },
  subtitle: { color: COLORS.textMuted, fontSize: FONT_SIZE.body, marginTop: 4, marginBottom: SPACING.lg },
  summary: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.title, fontWeight: FONT_WEIGHT.heavy },
  statLabel: { color: COLORS.textFaint, fontSize: FONT_SIZE.xs, marginTop: 2 },
  stampsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  stamp: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  stampOn: { backgroundColor: COLORS.card, borderColor: COLORS.miles },
  stampOff: { backgroundColor: COLORS.bgElevated, borderColor: COLORS.border },
  stampFlag: { fontSize: 26 },
  stampName: { color: COLORS.text, fontSize: FONT_SIZE.caption, marginTop: 4 },
  stampMark: { color: COLORS.miles, fontSize: FONT_SIZE.caption, fontWeight: FONT_WEIGHT.bold, marginTop: 2 },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { color: COLORS.text, fontSize: FONT_SIZE.subtitle, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  cell: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  cellOn: { backgroundColor: COLORS.card, borderColor: COLORS.border },
  cellOff: { backgroundColor: COLORS.bgElevated, borderColor: COLORS.border, borderStyle: 'dashed' },
  cellIcon: { fontSize: 28 },
  cellName: { color: COLORS.text, fontSize: FONT_SIZE.xs, marginTop: 4, maxWidth: '90%' },
  cellBonus: { color: COLORS.success, fontSize: FONT_SIZE.xs, marginTop: 2, fontWeight: FONT_WEIGHT.bold },
  dim: { opacity: 0.4 },
  hint: { color: COLORS.textFaint, fontSize: FONT_SIZE.xs, marginTop: SPACING.sm, lineHeight: 16 },
});
