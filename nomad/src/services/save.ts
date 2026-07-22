// save.ts — persistance LOCALE (AsyncStorage = source de vérité pour un idle).
// La sync Supabase (Phase 3) viendra se greffer ici (syncUp/syncDown) avec
// fallback offline. Pour l'instant : local only.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIRST_COUNTRY } from '@/data/countries';
import type { GameState } from '@/engine/types';
import { ensureAuth } from './auth';
import { isSupabaseConfigured, supabase } from './supabase';

const SAVE_KEY = 'nomad:save:v1';
const PENDING_KEY = 'nomad:pendingSync';
export const SAVE_VERSION = 2;

/** Champs dénormalisés poussés au leaderboard lors de la sync. */
export interface LeaderboardStat {
  totalMiles: number;
  countriesUnlocked: number;
}

/** État de départ d'une nouvelle partie. */
export function createInitialState(now: number): GameState {
  // Bootstrap : le joueur démarre en possédant le 1er boulot (niveau 1) et le
  // tape pour générer ses premiers revenus (pattern idle standard).
  const firstJob = FIRST_COUNTRY.jobs[0];
  return {
    money: 0,
    gems: 0,
    miles: 0,
    currentCountryId: FIRST_COUNTRY.id,
    jobs: firstJob ? { [firstJob.id]: { level: 1, hasManager: false } } : {},
    collection: [],
    stamps: [],
    earnedInCountry: 0,
    totalEarned: 0,
    lastSeen: now,
    version: SAVE_VERSION,
  };
}

/**
 * Migration défensive d'un save partiel vers le schéma courant.
 * Remplit les champs ajoutés au fil des versions (`?? []`, valeurs par défaut).
 */
function migrate(s: Partial<GameState>): GameState {
  return {
    money: s.money ?? 0,
    gems: s.gems ?? 0,
    miles: s.miles ?? 0,
    currentCountryId: s.currentCountryId ?? FIRST_COUNTRY.id,
    jobs: s.jobs ?? {},
    collection: s.collection ?? [],
    stamps: s.stamps ?? [],
    earnedInCountry: s.earnedInCountry ?? 0,
    totalEarned: s.totalEarned ?? 0,
    lastSeen: s.lastSeen ?? Date.now(),
    version: SAVE_VERSION,
  };
}

/** Charge la partie locale, ou null si aucune / corrompue. */
export async function loadLocal(): Promise<GameState | null> {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    // Garde défensif : un save corrompu est ignoré (repart à neuf).
    if (typeof parsed?.money !== 'number' || typeof parsed?.currentCountryId !== 'string') {
      console.warn('[Nomad] Save locale invalide, réinitialisation.');
      return null;
    }
    return migrate(parsed);
  } catch (e) {
    console.warn('[Nomad] Échec du chargement local', e);
    return null;
  }
}

/** Écrit la partie en local. */
export async function saveLocal(state: GameState): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[Nomad] Échec de la sauvegarde locale', e);
  }
}

/** Efface la partie locale (debug / reset). */
export async function clearLocal(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.warn('[Nomad] Échec de l\'effacement local', e);
  }
}

// ————————————————— Sync distante (Supabase) — fallback offline —————————————————

/**
 * Pousse l'état vers Supabase via la RPC atomique `sync_game_state`.
 * En cas d'échec (offline, non configuré), marque une sync en attente et
 * retourne false — le local reste la source de vérité.
 */
export async function pushRemote(state: GameState, stat: LeaderboardStat): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const uid = await ensureAuth();
    if (!uid) throw new Error('pas de session');
    const { error } = await supabase.rpc('sync_game_state', {
      p_state: state,
      p_total_miles: stat.totalMiles,
      p_countries_unlocked: stat.countriesUnlocked,
    });
    if (error) throw error;
    await AsyncStorage.removeItem(PENDING_KEY);
    return true;
  } catch (e) {
    console.warn('[Nomad] Sync distante échouée (offline ?)', e);
    try {
      await AsyncStorage.setItem(PENDING_KEY, '1');
    } catch (e2) {
      console.warn('[Nomad] Impossible de marquer la sync en attente', e2);
    }
    return false;
  }
}

/** Récupère l'état distant du joueur (restauration sur nouvel appareil), ou null. */
export async function pullRemote(): Promise<GameState | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const uid = await ensureAuth();
    if (!uid) return null;
    const { data, error } = await supabase
      .from('game_saves')
      .select('state')
      .eq('user_id', uid)
      .maybeSingle();
    if (error) throw error;
    if (!data?.state) return null;
    return migrate(data.state as Partial<GameState>);
  } catch (e) {
    console.warn('[Nomad] Pull distant échoué', e);
    return null;
  }
}

/** Y a-t-il une sync en attente (échec précédent) ? Pour l'indicateur UI. */
export async function hasPendingSync(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PENDING_KEY)) === '1';
  } catch (e) {
    console.warn('[Nomad] Lecture pendingSync échouée', e);
    return false;
  }
}
