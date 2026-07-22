// OfflineModal.tsx — "pendant ton absence, tes managers ont bossé".
// Levier de rétention + accroche monétisation (doubler via pub = Phase 4).
// Entrée d'écran : spring scale + fade (Animated, useNativeDriver:true).

import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDuration, formatMoney } from '@/lib/format';
import { notifySuccess } from '@/lib/haptics';
import type { OfflineResult } from '@/engine/types';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/theme/theme';

interface Props {
  result: OfflineResult | null;
  onClose: () => void;
}

export function OfflineModal({ result, onClose }: Props) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!result) return;
    notifySuccess();
    scale.setValue(0.7);
    fade.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [result, scale, fade]);

  if (!result) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity: fade, transform: [{ scale }] }]}>
          <Text style={styles.title}>✈️ De retour !</Text>
          <Text style={styles.sub}>
            Tes managers ont bossé pendant {formatDuration(result.seconds)}
            {result.capped ? ' (plafond atteint)' : ''}.
          </Text>
          <Text style={styles.amount}>+{formatMoney(result.gain)}</Text>
          <Pressable style={styles.cta} onPress={onClose}>
            <Text style={styles.ctaText}>Encaisser</Text>
          </Pressable>
          {/* Phase 4 : bouton "Doubler (pub)" viendra ici. */}
          <Text style={styles.hint}>Bientôt : regarde une pub pour doubler.</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  title: { color: COLORS.text, fontSize: FONT_SIZE.headline, fontWeight: FONT_WEIGHT.heavy },
  sub: { color: COLORS.textMuted, fontSize: FONT_SIZE.body, textAlign: 'center', marginTop: SPACING.sm },
  amount: { color: COLORS.money, fontSize: FONT_SIZE.display, fontWeight: FONT_WEIGHT.heavy, marginVertical: SPACING.lg },
  cta: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: FONT_SIZE.subtitle, fontWeight: FONT_WEIGHT.bold },
  hint: { color: COLORS.textFaint, fontSize: FONT_SIZE.xs, marginTop: SPACING.md },
});
