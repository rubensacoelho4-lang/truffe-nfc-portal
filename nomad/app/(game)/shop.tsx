// (game)/shop.tsx — boutique : boosts (gemmes ou pub), gemmes gratuites (pub),
// packs de gemmes (IAP) et "sans pub". Dev = récompenses simulées (voir ads.ts).

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showRewardedAd } from '@/services/ads';
import { PRODUCTS, purchaseProduct, restorePurchases } from '@/services/purchases';
import { formatDuration, formatMoney } from '@/lib/format';
import { notifyError, notifySuccess, tapMedium } from '@/lib/haptics';
import { useScreenEntrance } from '@/lib/useScreenEntrance';
import { useGameStore } from '@/store/gameStore';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/theme/theme';

const BOOST_GEM_COST = 50;

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const entrance = useScreenEntrance();

  const gems = useGameStore((s) => s.state.gems);
  const boostUntil = useGameStore((s) => s.state.boostUntil);
  const boostFactor = useGameStore((s) => s.state.boostFactor);
  const noAds = useGameStore((s) => s.state.noAds);
  const addGems = useGameStore((s) => s.addGems);
  const spendGems = useGameStore((s) => s.spendGems);
  const activateBoost = useGameStore((s) => s.activateBoost);
  const setNoAds = useGameStore((s) => s.setNoAds);

  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Rafraîchit le compte à rebours du boost tant qu'il est actif.
  const boostActive = Boolean(boostUntil && boostUntil > now);
  useEffect(() => {
    if (!boostActive) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [boostActive]);

  const run = async (key: string, fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    tapMedium();
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const watchForGems = () =>
    run('free_gems', async () => {
      const ok = await showRewardedAd('free_gems');
      if (ok) {
        addGems(25);
        notifySuccess();
      } else {
        notifyError();
      }
    });

  const boostViaAd = () =>
    run('boost_ad', async () => {
      const ok = await showRewardedAd('boost_2x');
      if (ok) {
        activateBoost(2, 15 * 60);
        notifySuccess();
      } else {
        notifyError();
      }
    });

  const boostViaGems = () =>
    run('boost_gems', async () => {
      if (spendGems(BOOST_GEM_COST)) {
        activateBoost(3, 30 * 60);
        notifySuccess();
      } else {
        notifyError();
      }
    });

  const buy = (id: string) =>
    run(id, async () => {
      const res = await purchaseProduct(id);
      if (res.ok && res.product) {
        if (res.product.kind === 'gems' && res.product.gems) addGems(res.product.gems);
        if (res.product.kind === 'noads') setNoAds();
        notifySuccess();
      } else if (!res.cancelled) {
        notifyError();
      }
    });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: SPACING.lg, paddingTop: insets.top + SPACING.lg, paddingBottom: SPACING.xxxl }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={entrance}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>💎 Boutique</Text>
          <View style={styles.gemsPill}>
            <Text style={styles.gemsPillText}>💎 {formatMoney(gems)}</Text>
          </View>
        </View>

        {boostActive ? (
          <View style={styles.boostBanner}>
            <Text style={styles.boostBannerText}>
              ⚡ Boost ×{boostFactor} actif — {formatDuration(((boostUntil ?? now) - now) / 1000)}
            </Text>
          </View>
        ) : null}

        {/* Boosts */}
        <Section title="Boosts de revenus" />
        <ShopCard
          icon="⚡"
          title="Boost ×2 · 15 min"
          sub="Regarde une courte pub"
          action={boostViaAd}
          busy={busy === 'boost_ad'}
          cta="Pub"
          ctaColor={COLORS.accent}
        />
        <ShopCard
          icon="🔥"
          title="Boost ×3 · 30 min"
          sub={`${BOOST_GEM_COST} gemmes`}
          action={boostViaGems}
          busy={busy === 'boost_gems'}
          cta={`${BOOST_GEM_COST} 💎`}
          ctaColor={COLORS.gems}
          disabled={gems < BOOST_GEM_COST}
        />

        {/* Gemmes gratuites */}
        <Section title="Gemmes gratuites" />
        <ShopCard
          icon="🎁"
          title="+25 gemmes"
          sub="Regarde une courte pub"
          action={watchForGems}
          busy={busy === 'free_gems'}
          cta="Pub"
          ctaColor={COLORS.accent}
        />

        {/* IAP */}
        <Section title="Acheter des gemmes" />
        {PRODUCTS.filter((p) => p.kind === 'gems').map((p) => (
          <ShopCard
            key={p.id}
            icon="💎"
            title={p.title}
            sub={p.description}
            action={() => buy(p.id)}
            busy={busy === p.id}
            cta={p.priceLabel}
            ctaColor={COLORS.primary}
          />
        ))}

        {/* No ads */}
        <Section title="Confort" />
        {noAds ? (
          <View style={styles.ownedCard}>
            <Text style={styles.ownedText}>✅ Sans pub — activé. Merci !</Text>
          </View>
        ) : (
          PRODUCTS.filter((p) => p.kind === 'noads').map((p) => (
            <ShopCard
              key={p.id}
              icon="🚫"
              title={p.title}
              sub={p.description}
              action={() => buy(p.id)}
              busy={busy === p.id}
              cta={p.priceLabel}
              ctaColor={COLORS.primary}
            />
          ))
        )}

        <Pressable style={styles.restore} onPress={() => run('restore', async () => {
          const ok = await restorePurchases();
          if (ok) notifySuccess();
        })}>
          <Text style={styles.restoreText}>Restaurer mes achats</Text>
        </Pressable>

        <Text style={styles.devNote}>
          Mode dev : pubs et achats sont simulés. Brancher AdMob + RevenueCat en Phase 4
          (voir services/ads.ts et purchases.ts).
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

function Section({ title }: { title: string }) {
  return <Text style={styles.section}>{title}</Text>;
}

function ShopCard({
  icon,
  title,
  sub,
  action,
  busy,
  cta,
  ctaColor,
  disabled,
}: {
  icon: string;
  title: string;
  sub: string;
  action: () => void;
  busy: boolean;
  cta: string;
  ctaColor: string;
  disabled?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <View style={styles.cardMid}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{sub}</Text>
      </View>
      <Pressable
        onPress={action}
        disabled={busy || disabled}
        style={[styles.cardBtn, { backgroundColor: disabled ? COLORS.cardAlt : ctaColor }]}
      >
        {busy ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.cardBtnText}>{cta}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  title: { color: COLORS.text, fontSize: FONT_SIZE.headline, fontWeight: FONT_WEIGHT.heavy },
  gemsPill: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gemsPillText: { color: COLORS.gems, fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.bold },
  boostBanner: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accent,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  boostBannerText: { color: COLORS.accent, fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.bold, textAlign: 'center' },
  section: { color: COLORS.textMuted, fontSize: FONT_SIZE.caption, fontWeight: FONT_WEIGHT.bold, textTransform: 'uppercase', marginTop: SPACING.lg, marginBottom: SPACING.sm, letterSpacing: 0.5 },
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
  cardIcon: { fontSize: 26, marginRight: SPACING.md },
  cardMid: { flex: 1 },
  cardTitle: { color: COLORS.text, fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold },
  cardSub: { color: COLORS.textFaint, fontSize: FONT_SIZE.caption, marginTop: 2 },
  cardBtn: { minWidth: 72, minHeight: 40, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, alignItems: 'center', justifyContent: 'center' },
  cardBtnText: { color: COLORS.bg, fontSize: FONT_SIZE.caption, fontWeight: FONT_WEIGHT.heavy },
  ownedCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.success, padding: SPACING.md },
  ownedText: { color: COLORS.success, fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.bold, textAlign: 'center' },
  restore: { alignItems: 'center', paddingVertical: SPACING.lg },
  restoreText: { color: COLORS.textMuted, fontSize: FONT_SIZE.caption, textDecorationLine: 'underline' },
  devNote: { color: COLORS.textFaint, fontSize: FONT_SIZE.xs, textAlign: 'center', lineHeight: 16, marginTop: SPACING.sm },
});
