// gameLoop.ts — tick central + calcul du gain offline.
// Pur TS. Le store appelle ces fonctions ; elles ne connaissent ni RN ni Zustand.
//
// Principe idle robuste : on ne compte JAMAIS avec un compteur naïf incrémenté.
// On calcule tout par différence de timestamps → survit au background/kill.

import type { Country } from '@/data/types';
import { totalRevenuePerSecond } from './economy';
import type { GameState } from './types';
import type { OfflineResult } from './types';

/** Taux appliqué aux gains offline (0.5 = 50% du passif pendant l'absence). */
export const OFFLINE_RATE = 0.5;
/** Plafond de temps offline crédité, en secondes (4h). Extensible par pub/IAP. */
export const OFFLINE_CAP_SECONDS = 4 * 60 * 60;

/**
 * Multiplicateur global de revenu = travelBonus du pays × bonus passifs.
 * `passiveBonus` regroupe les bonus de collection etc. (0.05 = +5%).
 */
export function globalMultiplier(country: Country, passiveBonus = 0): number {
  return country.travelBonusMultiplier * (1 + passiveBonus);
}

/**
 * Revenu passif par seconde de l'état courant dans le pays courant.
 */
export function revenuePerSecond(
  state: GameState,
  country: Country,
  passiveBonus = 0,
): number {
  const levels: Record<string, number> = {};
  const managers: Record<string, boolean> = {};
  for (const job of country.jobs) {
    const rt = state.jobs[job.id];
    levels[job.id] = rt?.level ?? 0;
    managers[job.id] = rt?.hasManager ?? false;
  }
  return totalRevenuePerSecond(
    country.jobs,
    levels,
    managers,
    globalMultiplier(country, passiveBonus),
  );
}

/**
 * Applique un tick de `deltaSeconds` : crédite le revenu passif produit.
 * Retourne un NOUVEL état (immutable) — le store remplace le sien.
 * `rate` = 1 en jeu actif, OFFLINE_RATE au retour d'absence.
 */
export function applyTick(
  state: GameState,
  country: Country,
  deltaSeconds: number,
  now: number,
  passiveBonus = 0,
  rate = 1,
): GameState {
  if (deltaSeconds <= 0) return { ...state, lastSeen: now };
  const rps = revenuePerSecond(state, country, passiveBonus);
  const gain = rps * deltaSeconds * rate;
  return {
    ...state,
    money: state.money + gain,
    earnedInCountry: state.earnedInCountry + gain,
    totalEarned: state.totalEarned + gain,
    lastSeen: now,
  };
}

/**
 * Calcule le gain offline entre `state.lastSeen` et `now`, sans muter l'état.
 * Plafonné à OFFLINE_CAP_SECONDS. Le taux OFFLINE_RATE est appliqué.
 * L'UI peut ensuite proposer de doubler ce gain via pub récompensée.
 */
export function computeOfflineGain(
  state: GameState,
  country: Country,
  now: number,
  passiveBonus = 0,
): OfflineResult {
  const elapsedSec = Math.max(0, (now - state.lastSeen) / 1000);
  const capped = elapsedSec > OFFLINE_CAP_SECONDS;
  const creditedSec = Math.min(elapsedSec, OFFLINE_CAP_SECONDS);
  const rps = revenuePerSecond(state, country, passiveBonus);
  const rawGain = rps * creditedSec;
  return {
    seconds: creditedSec,
    rawGain,
    gain: rawGain * OFFLINE_RATE,
    capped,
  };
}
