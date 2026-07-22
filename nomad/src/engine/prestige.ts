// prestige.ts — logique de VOYAGE (le prestige de Nomad).
// Voyager = quitter le pays courant pour le suivant : reset des boulots + argent,
// gain de miles, MAIS on garde gemmes, collection et miles.
//
// Pur TS, zéro RN.

import type { Country } from '@/data/types';
import type { GameState } from './types';

/** Constante de calibrage des miles gagnés (racine carrée = rendement décroissant). */
export const MILES_K = 0.5;

/**
 * Miles gagnés en voyageant, fonction de l'argent total gagné dans le pays.
 *   miles = floor(k × sqrt(earnedInCountry))
 * Racine carrée = standard prestige (chaque prestige rapporte proportionnellement moins).
 */
export function milesFromTravel(earnedInCountry: number): number {
  if (earnedInCountry <= 0) return 0;
  return Math.floor(MILES_K * Math.sqrt(earnedInCountry));
}

/** Peut-on voyager ? Il faut avoir atteint le coût de voyage du pays courant. */
export function canTravel(state: GameState, country: Country): boolean {
  return state.money >= country.travelCost;
}

/** Fusionne des ids dans une liste sans doublon (méta-progression). */
function mergeUnique(current: string[], add: string[]): string[] {
  const set = new Set(current);
  for (const id of add) set.add(id);
  return Array.from(set);
}

/**
 * Applique le voyage depuis `leftCountry` vers `nextCountry`. Retourne un NOUVEL état.
 *  - crédite les miles gagnés
 *  - engrange les souvenirs (collectibles) + le tampon du pays quitté (passeport)
 *  - reset argent + boulots (générateurs remis à zéro)
 *  - garde gemmes, miles cumulés, collection, stamps
 *  - repart avec earnedInCountry = 0 dans le nouveau pays
 * L'appelant doit avoir vérifié canTravel() au préalable.
 */
export function travelTo(
  state: GameState,
  leftCountry: Country,
  nextCountry: Country,
  now: number,
): GameState {
  const earnedMiles = milesFromTravel(state.earnedInCountry);
  // Bootstrap du nouveau pays : 1er boulot au niveau 1 (comme au démarrage),
  // sinon le joueur arrive à 0€ sans rien à taper.
  const firstJob = nextCountry.jobs[0];
  return {
    ...state,
    money: 0,
    miles: state.miles + earnedMiles,
    currentCountryId: nextCountry.id,
    jobs: firstJob ? { [firstJob.id]: { level: 1, hasManager: false } } : {},
    collection: mergeUnique(state.collection, leftCountry.collectibles),
    stamps: mergeUnique(state.stamps, [leftCountry.id]),
    earnedInCountry: 0,
    lastSeen: now,
  };
}
