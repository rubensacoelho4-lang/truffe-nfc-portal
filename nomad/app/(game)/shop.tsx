// (game)/shop.tsx — placeholder. Rempli en Phase 4 (gemmes/boosts/IAP + pubs).

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/store/gameStore';
import { formatMoney } from '@/lib/format';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/theme/theme';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const gems = useGameStore((s) => s.state.gems);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: SPACING.lg, paddingTop: insets.top + SPACING.lg }}
    >
      <Text style={styles.title}>💎 Boutique</Text>
      <View style={styles.gemsCard}>
        <Text style={styles.gemsValue}>{formatMoney(gems)}</Text>
        <Text style={styles.gemsLabel}>gemmes</Text>
      </View>
      <Text style={styles.soon}>Boosts, pubs récompensées et achats arrivent en Phase 4.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  title: { color: COLORS.text, fontSize: FONT_SIZE.headline, fontWeight: FONT_WEIGHT.heavy, marginBottom: SPACING.lg },
  gemsCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  gemsValue: { color: COLORS.gems, fontSize: FONT_SIZE.display, fontWeight: FONT_WEIGHT.heavy },
  gemsLabel: { color: COLORS.textMuted, fontSize: FONT_SIZE.body },
  soon: { color: COLORS.textFaint, fontSize: FONT_SIZE.body, marginTop: SPACING.xl, textAlign: 'center' },
});
