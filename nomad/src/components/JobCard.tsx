// JobCard.tsx — un boulot (générateur). Le tap EST le produit (spec §6.3).
//  - level 0        → carte "Débloquer" (coût = baseCost)
//  - level>0 manuel → tap pour lancer un cycle ; barre se remplit puis paye
//  - automatisé     → barre en boucle continue (le manager bosse tout seul)
// Barre de progression : Animated + useNativeDriver:false (animation de width).

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { JobDef } from '@/data/types';
import { bulkCost, jobCycleRevenue, maxAffordable, milestoneMultiplier, nextMilestone } from '@/engine/economy';
import { formatMoney } from '@/lib/format';
import { tapLight, tapMedium, selectionTick } from '@/lib/haptics';
import { useGameStore, type BuyAmount } from '@/store/gameStore';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/theme/theme';

interface Props {
  job: JobDef;
  buyAmount: BuyAmount;
  /** Multiplicateur global courant (travelBonus × bonus passifs) pour l'affichage du payout. */
  globalMult: number;
}

function JobCardBase({ job, buyAmount, globalMult }: Props) {
  const rt = useGameStore((s) => s.state.jobs[job.id]);
  const money = useGameStore((s) => s.state.money);
  const buyJob = useGameStore((s) => s.buyJob);
  const buyManager = useGameStore((s) => s.buyManager);
  const tapJob = useGameStore((s) => s.tapJob);

  const level = rt?.level ?? 0;
  const hasManager = rt?.hasManager ?? false;
  const owned = level > 0;
  const cycleStart = rt?.cycleStart;

  const progress = useRef(new Animated.Value(0)).current;

  // ————— Coûts / revenus dérivés (mémoïsés hors money pour limiter le churn) —————
  const buyCount = useMemo(
    () => (buyAmount === 'max' ? maxAffordable(job, level, money) : buyAmount),
    [buyAmount, job, level, money],
  );
  const buyCost = useMemo(
    () => (owned ? bulkCost(job, level, Math.max(1, buyCount)) : job.baseCost),
    [job, level, owned, buyCount],
  );
  const payout = jobCycleRevenue(job, level, globalMult);
  const mult = milestoneMultiplier(job, level);
  const nextMs = nextMilestone(job, level);
  const canAfford = owned ? money >= buyCost && buyCount > 0 : money >= job.baseCost;
  const canBuyManager = owned && !hasManager && money >= job.managerCost;

  // ————— Barre de progression (cosmétique) —————
  useEffect(() => {
    progress.stopAnimation();
    if (!owned) {
      progress.setValue(0);
      return;
    }
    if (hasManager) {
      // Boucle continue : le manager relance le cycle indéfiniment.
      progress.setValue(0);
      const loop = Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: job.cycleTime * 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      );
      loop.start();
      return () => loop.stop();
    }
    if (cycleStart != null) {
      // Cycle manuel en cours : remplir sur le temps restant.
      const elapsed = Date.now() - cycleStart;
      const remaining = Math.max(0, job.cycleTime * 1000 - elapsed);
      progress.setValue(Math.min(1, elapsed / (job.cycleTime * 1000)));
      const anim = Animated.timing(progress, {
        toValue: 1,
        duration: remaining,
        easing: Easing.linear,
        useNativeDriver: false,
      });
      anim.start();
      return () => anim.stop();
    }
    // Manuel, au repos : barre vide, prêt à taper.
    progress.setValue(0);
  }, [owned, hasManager, cycleStart, job.cycleTime, progress]);

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ————— Handlers —————
  const onTapBar = () => {
    if (!owned || hasManager || cycleStart != null) return;
    tapLight();
    tapJob(job.id);
  };
  const onBuy = () => {
    if (!canAfford) return;
    selectionTick();
    buyJob(job.id, owned ? buyAmount : 1);
  };
  const onBuyManager = () => {
    if (!canBuyManager) return;
    tapMedium();
    buyManager(job.id);
  };

  // ————— Carte non débloquée : un seul CTA d'achat —————
  if (!owned) {
    return (
      <Pressable
        onPress={onBuy}
        disabled={!canAfford}
        style={[styles.card, styles.locked, !canAfford && styles.dim]}
      >
        <View style={styles.iconWrapLocked}>
          <Text style={styles.icon}>{job.icon ?? '💼'}</Text>
        </View>
        <View style={styles.lockedMid}>
          <Text style={styles.name}>{job.name}</Text>
          <Text style={styles.lockedHint}>Débloquer ce boulot</Text>
        </View>
        <View style={[styles.buyBtn, canAfford ? styles.buyBtnOn : styles.buyBtnOff]}>
          <Text style={styles.buyLabel}>Acheter</Text>
          <Text style={styles.buyCost}>{formatMoney(job.baseCost)}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      {/* Icône = zone de tap pour les boulots manuels */}
      <Pressable
        onPress={onTapBar}
        disabled={hasManager}
        style={[styles.iconWrap, hasManager && styles.iconWrapAuto]}
      >
        <Text style={styles.icon}>{job.icon ?? '💼'}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>{level}</Text>
        </View>
      </Pressable>

      <View style={styles.middle}>
        <View style={styles.midTop}>
          <Text style={styles.name} numberOfLines={1}>{job.name}</Text>
          {mult > 1 ? <Text style={styles.multTag}>×{mult}</Text> : null}
        </View>

        {/* Barre de progression (Animated width → useNativeDriver:false) */}
        <Pressable onPress={onTapBar} disabled={hasManager} style={styles.track}>
          <Animated.View style={[styles.fill, { width: widthInterpolate }]} />
          <Text style={styles.payout}>{formatMoney(payout)}</Text>
        </Pressable>

        <Text style={styles.subline}>
          {hasManager
            ? `Auto · ${formatMoney(payout / job.cycleTime)}/s`
            : cycleStart != null
              ? 'Au travail…'
              : 'Appuie pour bosser'}
          {nextMs != null ? `  ·  ×2 au niv. ${nextMs}` : ''}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onBuy}
          disabled={!canAfford}
          style={[styles.buyBtn, canAfford ? styles.buyBtnOn : styles.buyBtnOff]}
        >
          <Text style={styles.buyLabel}>
            +{buyAmount === 'max' ? `${Math.max(1, buyCount)}` : buyAmount}
          </Text>
          <Text style={styles.buyCost}>{formatMoney(buyCost)}</Text>
        </Pressable>

        {!hasManager ? (
          <Pressable
            onPress={onBuyManager}
            disabled={!canBuyManager}
            style={[styles.mgrBtn, canBuyManager ? styles.mgrOn : styles.mgrOff]}
          >
            <Text style={styles.mgrLabel}>👤 Manager</Text>
            <Text style={styles.mgrCost}>{formatMoney(job.managerCost)}</Text>
          </Pressable>
        ) : (
          <View style={styles.mgrOwned}>
            <Text style={styles.mgrOwnedText}>👤 Auto</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export const JobCard = React.memo(JobCardBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  locked: { opacity: 1 },
  dim: { opacity: 0.55 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  iconWrapAuto: { backgroundColor: COLORS.bgElevated },
  iconWrapLocked: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.locked,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  icon: { fontSize: 26 },
  levelBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  levelBadgeText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  middle: { flex: 1, marginRight: SPACING.md },
  lockedMid: { flex: 1, marginRight: SPACING.md },
  midTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  name: { color: COLORS.text, fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold, flexShrink: 1 },
  multTag: { color: COLORS.accent, fontSize: FONT_SIZE.caption, fontWeight: FONT_WEIGHT.bold, marginLeft: 6 },
  lockedHint: { color: COLORS.textMuted, fontSize: FONT_SIZE.caption, marginTop: 2 },
  track: {
    height: 26,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.progressTrack,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: COLORS.progress },
  payout: {
    alignSelf: 'center',
    color: COLORS.text,
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.bold,
  },
  subline: { color: COLORS.textFaint, fontSize: FONT_SIZE.xs, marginTop: 4 },
  actions: { alignItems: 'stretch', width: 96 },
  buyBtn: { borderRadius: RADIUS.md, paddingVertical: 8, alignItems: 'center', marginBottom: 6 },
  buyBtnOn: { backgroundColor: COLORS.primary },
  buyBtnOff: { backgroundColor: COLORS.cardAlt },
  buyLabel: { color: '#fff', fontSize: FONT_SIZE.caption, fontWeight: FONT_WEIGHT.bold },
  buyCost: { color: '#e8eefc', fontSize: FONT_SIZE.xs, marginTop: 1 },
  mgrBtn: { borderRadius: RADIUS.md, paddingVertical: 6, alignItems: 'center' },
  mgrOn: { backgroundColor: COLORS.accent },
  mgrOff: { backgroundColor: COLORS.cardAlt },
  mgrLabel: { color: '#1a1206', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  mgrCost: { color: '#3a2c10', fontSize: FONT_SIZE.xs },
  mgrOwned: { borderRadius: RADIUS.md, paddingVertical: 6, alignItems: 'center', backgroundColor: COLORS.bgElevated },
  mgrOwnedText: { color: COLORS.success, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
});
