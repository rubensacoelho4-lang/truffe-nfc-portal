// save.ts — persistance LOCALE (AsyncStorage = source de vérité pour un idle).
// La sync Supabase (Phase 3) viendra se greffer ici (syncUp/syncDown) avec
// fallback offline. Pour l'instant : local only.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIRST_COUNTRY } from '@/data/countries';
import type { GameState } from '@/engine/types';

const SAVE_KEY = 'nomad:save:v1';
export const SAVE_VERSION = 1;

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
    earnedInCountry: 0,
    totalEarned: 0,
    lastSeen: now,
    version: SAVE_VERSION,
  };
}

/** Charge la partie locale, ou null si aucune / corrompue. */
export async function loadLocal(): Promise<GameState | null> {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    // Garde défensif : un save d'une version inconnue est ignoré (repart à neuf).
    if (typeof parsed?.money !== 'number' || typeof parsed?.currentCountryId !== 'string') {
      console.warn('[Nomad] Save locale invalide, réinitialisation.');
      return null;
    }
    return parsed;
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
