// social.ts — lecture du classement global (leaderboard_entries + profiles).
// Lecture publique (RLS select using true). Écriture uniquement via RPC (save.ts).

import { getUserId } from './auth';
import { isSupabaseConfigured, supabase } from './supabase';

export interface LeaderboardRow {
  userId: string;
  username: string;
  totalMiles: number;
  countriesUnlocked: number;
  isMe: boolean;
}

/** Top N du classement par miles. Retourne [] si non configuré / erreur (défensif). */
export async function fetchLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const [meId, entriesRes] = await Promise.all([
      getUserId(),
      supabase
        .from('leaderboard_entries')
        .select('user_id, total_miles, countries_unlocked')
        .order('total_miles', { ascending: false })
        .limit(limit),
    ]);
    if (entriesRes.error) throw entriesRes.error;

    const entries = entriesRes.data ?? [];
    const ids = entries.map((e) => e.user_id);
    // Récupère les pseudos en une requête (pas de FK PostgREST entre les 2 tables).
    const namesRes = ids.length
      ? await supabase.from('profiles').select('id, username').in('id', ids)
      : { data: [], error: null };
    if (namesRes.error) throw namesRes.error;

    const nameById = new Map<string, string>();
    for (const p of namesRes.data ?? []) {
      if (p.username) nameById.set(p.id, p.username);
    }

    return entries.map((e) => ({
      userId: e.user_id,
      username: nameById.get(e.user_id) ?? 'Voyageur anonyme',
      totalMiles: Number(e.total_miles ?? 0),
      countriesUnlocked: Number(e.countries_unlocked ?? 0),
      isMe: e.user_id === meId,
    }));
  } catch (e) {
    console.warn('[Nomad] Chargement du classement échoué', e);
    return [];
  }
}
