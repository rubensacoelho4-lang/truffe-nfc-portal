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

/**
 * Applique le voyage vers `nextCountry`. Retourne un NOUVEL état.
 *  - crédite les miles gagnés
 *  - reset argent + boulots (générateurs remis à zéro)
 *  - garde gemmes, miles cumulés, collection
 *  - repart avec earnedInCountry = 0 dans le nouveau pays
 * L'appelant doit avoir vérifié canTravel() au préalable.
 */
export function travelTo(
  state: GameState,
  nextCountry: Country,
  now: number,
): GameState {
  const earnedMiles = milesFromTravel(state.earnedInCountry);
  return {
    ...state,
    money: 0,
    miles: state.miles + earnedMiles,
    currentCountryId: nextCountry.id,
    jobs: {},
    earnedInCountry: 0,
    lastSeen: now,
  };
}
