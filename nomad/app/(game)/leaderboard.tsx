// (game)/leaderboard.tsx — classement global (miles). Nécessite Supabase configuré.
// Sans backend : écran informatif (mode local). Permet aussi de choisir son pseudo.

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setUsername } from '@/services/auth';
import { fetchLeaderboard, type LeaderboardRow } from '@/services/social';
import { formatMoney } from '@/lib/format';
import { notifyError, notifySuccess, tapMedium } from '@/lib/haptics';
import { useScreenEntrance } from '@/lib/useScreenEntrance';
import { useGameStore } from '@/store/gameStore';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/theme/theme';

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const entrance = useScreenEntrance();
  const cloudEnabled = useGameStore((s) => s.cloudEnabled);
  const syncNow = useGameStore((s) => s.syncNow);

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const load = useCallback(async () => {
    if (!cloudEnabled) return;
    setLoading(true);
    const data = await fetchLeaderboard();
    setRows(data);
    setLoading(false);
  }, [cloudEnabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSaveName = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 3) return;
    setSavingName(true);
    tapMedium();
    const res = await setUsername(trimmed);
    setSavingName(false);
    if (res === 'ok') {
      notifySuccess();
      await syncNow();
      await load();
    } else if (res === 'taken') {
      notifyError();
    } else {
      notifyError();
    }
  };

  if (!cloudEnabled) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.emoji}>🏆</Text>
        <Text style={styles.title}>Classement</Text>
        <Text style={styles.offlineNote}>
          Mode local : le classement global s'active quand Supabase est configuré
          (voir .env.example). Ta progression reste sauvegardée sur l'appareil.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: SPACING.lg, paddingTop: insets.top + SPACING.lg, paddingBottom: SPACING.xxxl }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.textMuted} />}
    >
      <Animated.View style={entrance}>
        <Text style={styles.title}>🏆 Classement mondial</Text>

        {/* Choix du pseudo */}
        <View style={styles.nameCard}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ton pseudo (3+ caractères)"
            placeholderTextColor={COLORS.textFaint}
            maxLength={20}
            autoCapitalize="none"
          />
          <Pressable
            onPress={onSaveName}
            disabled={savingName || name.trim().length < 3}
            style={[styles.nameBtn, name.trim().length >= 3 ? styles.nameBtnOn : styles.nameBtnOff]}
          >
            <Text style={styles.nameBtnText}>{savingName ? '…' : 'OK'}</Text>
          </Pressable>
        </View>

        {loading && rows.length === 0 ? (
          <ActivityIndicator color={COLORS.textMuted} style={{ marginTop: SPACING.xl }} />
        ) : rows.length === 0 ? (
          <Text style={styles.offlineNote}>Personne au classement pour l'instant. Voyage pour gagner des miles !</Text>
        ) : (
          rows.map((row, i) => (
            <View key={row.userId} style={[styles.row, row.isMe && styles.rowMe]}>
              <Text style={[styles.rank, i < 3 && styles.rankTop]}>{i + 1}</Text>
              <View style={styles.rowMid}>
                <Text style={[styles.rowName, row.isMe && styles.rowNameMe]} numberOfLines={1}>
                  {row.username} {row.isMe ? '(toi)' : ''}
                </Text>
                <Text style={styles.rowSub}>{row.countriesUnlocked} pays</Text>
              </View>
              <Text style={styles.rowMiles}>🧭 {formatMoney(row.totalMiles)}</Text>
            </View>
          ))
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emoji: { fontSize: 48, marginBottom: SPACING.md },
  title: { color: COLORS.text, fontSize: FONT_SIZE.headline, fontWeight: FONT_WEIGHT.heavy, marginBottom: SPACING.lg },
  offlineNote: { color: COLORS.textMuted, fontSize: FONT_SIZE.body, textAlign: 'center', lineHeight: 20, marginTop: SPACING.sm },
  nameCard: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: FONT_SIZE.body,
  },
  nameBtn: { borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, justifyContent: 'center' },
  nameBtnOn: { backgroundColor: COLORS.primary },
  nameBtnOff: { backgroundColor: COLORS.cardAlt },
  nameBtnText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.body },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rowMe: { borderColor: COLORS.miles },
  rank: { color: COLORS.textMuted, fontSize: FONT_SIZE.subtitle, fontWeight: FONT_WEIGHT.heavy, width: 32 },
  rankTop: { color: COLORS.accent },
  rowMid: { flex: 1, marginHorizontal: SPACING.sm },
  rowName: { color: COLORS.text, fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.semibold },
  rowNameMe: { color: COLORS.miles },
  rowSub: { color: COLORS.textFaint, fontSize: FONT_SIZE.xs, marginTop: 2 },
  rowMiles: { color: COLORS.miles, fontSize: FONT_SIZE.body, fontWeight: FONT_WEIGHT.bold },
});
