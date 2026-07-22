// gameStore.ts — état runtime + actions + tick central (Zustand).
// Le store orchestre ; toute la MATH vit dans src/engine (pur, testable).
// Règles CLAUDE.md : selectors individuels côté composants, getState() en async.

import { create } from 'zustand';
import { getCountry, nextCountry } from '@/data/countries';
import { passiveBonusFromCollection } from '@/data/collectibles';
import type { Country } from '@/data/types';
import { bulkCost, costOfLevel, jobCycleRevenue, maxAffordable } from '@/engine/economy';
import { applyTick, computeOfflineGain } from '@/engine/gameLoop';
import { canTravel, milesFromTravel, travelTo } from '@/engine/prestige';
import type { GameState, OfflineResult } from '@/engine/types';
import { createInitialState, loadLocal, saveLocal } from '@/services/save';

export type BuyAmount = 1 | 10 | 100 | 'max';

interface GameStore {
  state: GameState;
  hydrated: boolean;
  /** Résultat offline en attente d'affichage (modal au retour). Null sinon. */
  pendingOffline: OfflineResult | null;

  hydrate: () => Promise<void>;
  persist: () => Promise<void>;

  /** Tick passif : crédite le revenu automatisé + clôt les cycles manuels échus. */
  tick: (now: number) => void;

  /** Retour de background : crédite le gain offline (taux réduit) depuis lastSeen. */
  resume: (now: number) => void;

  /** Démarre un cycle manuel sur un boulot non automatisé (le tap). */
  tapJob: (jobId: string) => void;

  buyJob: (jobId: string, amount: BuyAmount) => void;
  buyManager: (jobId: string) => void;
  travel: () => void;

  clearPendingOffline: () => void;
  reset: (now: number) => void;
}

/** Bonus passif de revenu global déduit de la collection courante. */
function passiveBonus(state: GameState): number {
  return passiveBonusFromCollection(state.collection);
}

/** Country courant garanti non-null (fallback défensif sur le pays de départ). */
function currentCountry(state: GameState): Country {
  const c = getCountry(state.currentCountryId);
  if (c) return c;
  console.warn('[Nomad] Pays courant inconnu:', state.currentCountryId);
  // getCountry du 1er pays via nextCountry est indirect ; on relit le registre.
  const fallback = getCountry('france');
  if (!fallback) throw new Error('[Nomad] Aucun pays enregistré');
  return fallback;
}

/**
 * Clôt les cycles manuels arrivés à terme et crédite leur revenu.
 * Retourne l'état modifié (nouvel objet) + le total crédité.
 */
function settleManualCycles(state: GameState, country: Country, now: number): GameState {
  const mult = country.travelBonusMultiplier * (1 + passiveBonus(state));
  let money = state.money;
  let earnedInCountry = state.earnedInCountry;
  let totalEarned = state.totalEarned;
  let touched = false;
  const jobs = { ...state.jobs };

  for (const job of country.jobs) {
    const rt = jobs[job.id];
    if (!rt || rt.hasManager || rt.level <= 0 || rt.cycleStart == null) continue;
    if (now - rt.cycleStart >= job.cycleTime * 1000) {
      const gain = jobCycleRevenue(job, rt.level, mult);
      money += gain;
      earnedInCountry += gain;
      totalEarned += gain;
      jobs[job.id] = { ...rt, cycleStart: undefined };
      touched = true;
    }
  }

  if (!touched) return state;
  return { ...state, jobs, money, earnedInCountry, totalEarned };
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(Date.now()),
  hydrated: false,
  pendingOffline: null,

  hydrate: async () => {
    const now = Date.now();
    const loaded = await loadLocal();
    if (!loaded) {
      set({ state: createInitialState(now), hydrated: true, pendingOffline: null });
      return;
    }
    const country = currentCountry(loaded);
    const offline = computeOfflineGain(loaded, country, now, passiveBonusFromCollection(loaded.collection));
    const next: GameState = {
      ...loaded,
      money: loaded.money + offline.gain,
      earnedInCountry: loaded.earnedInCountry + offline.gain,
      totalEarned: loaded.totalEarned + offline.gain,
      lastSeen: now,
    };
    set({
      state: next,
      hydrated: true,
      // On ne montre le modal offline que si le gain vaut la peine.
      pendingOffline: offline.gain > 0 ? offline : null,
    });
  },

  persist: async () => {
    await saveLocal(get().state);
  },

  tick: (now) => {
    const { state } = get();
    const country = currentCountry(state);
    // 1) clôturer les cycles manuels échus, 2) créditer le passif automatisé.
    const settled = settleManualCycles(state, country, now);
    const deltaSec = Math.max(0, (now - settled.lastSeen) / 1000);
    const ticked = applyTick(settled, country, deltaSec, now, passiveBonus(settled), 1);
    set({ state: ticked });
  },

  resume: (now) => {
    const { state } = get();
    const country = currentCountry(state);
    const bonus = passiveBonus(state);
    const offline = computeOfflineGain(state, country, now, bonus);
    const next: GameState = {
      ...state,
      money: state.money + offline.gain,
      earnedInCountry: state.earnedInCountry + offline.gain,
      totalEarned: state.totalEarned + offline.gain,
      lastSeen: now,
    };
    set({ state: next, pendingOffline: offline.gain > 0 ? offline : null });
  },

  tapJob: (jobId) => {
    const { state } = get();
    const rt = state.jobs[jobId];
    // Tap valide seulement si acheté, non automatisé, et aucun cycle en cours.
    if (!rt || rt.level <= 0 || rt.hasManager || rt.cycleStart != null) return;
    set({
      state: {
        ...state,
        jobs: { ...state.jobs, [jobId]: { ...rt, cycleStart: Date.now() } },
      },
    });
  },

  buyJob: (jobId, amount) => {
    const { state } = get();
    const country = currentCountry(state);
    const job = country.jobs.find((j) => j.id === jobId);
    if (!job) return;

    const rt = state.jobs[jobId] ?? { level: 0, hasManager: false };
    const count =
      amount === 'max' ? maxAffordable(job, rt.level, state.money) : amount;
    if (count <= 0) return;

    const cost = bulkCost(job, rt.level, count);
    if (state.money < cost) {
      // Achat partiel refusé : on n'achète pas ce qu'on ne peut pas payer.
      return;
    }

    set({
      state: {
        ...state,
        money: state.money - cost,
        jobs: {
          ...state.jobs,
          [jobId]: { ...rt, level: rt.level + count },
        },
      },
    });
  },

  buyManager: (jobId) => {
    const { state } = get();
    const country = currentCountry(state);
    const job = country.jobs.find((j) => j.id === jobId);
    if (!job) return;
    const rt = state.jobs[jobId] ?? { level: 0, hasManager: false };
    if (rt.hasManager || rt.level <= 0 || state.money < job.managerCost) return;
    set({
      state: {
        ...state,
        money: state.money - job.managerCost,
        jobs: { ...state.jobs, [jobId]: { ...rt, hasManager: true, cycleStart: undefined } },
      },
    });
  },

  travel: () => {
    const { state } = get();
    const country = currentCountry(state);
    if (!canTravel(state, country)) return;
    const next = nextCountry(country.id);
    if (!next) return; // dernier pays débloqué disponible.
    set({ state: travelTo(state, country, next, Date.now()) });
  },

  clearPendingOffline: () => set({ pendingOffline: null }),

  reset: (now) => set({ state: createInitialState(now), pendingOffline: null }),
}));

// ————— Sélecteurs utilitaires (à utiliser individuellement dans les composants) —————

export const selectState = (s: GameStore) => s.state;
export const selectHydrated = (s: GameStore) => s.hydrated;

/** Coût du prochain palier (×1) d'un boulot, pour l'affichage du bouton. */
export function nextLevelCost(state: GameState, jobId: string): number {
  const country = getCountry(state.currentCountryId);
  const job = country?.jobs.find((j) => j.id === jobId);
  if (!job) return Infinity;
  const level = state.jobs[jobId]?.level ?? 0;
  return costOfLevel(job, level);
}

export { milesFromTravel };
