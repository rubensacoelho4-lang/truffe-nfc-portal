// collectibles.ts — objets de collection (passeport / souvenirs).
// Méta-progression persistante : ne reset JAMAIS au voyage. Certains donnent
// un bonus passif de revenu global (branché en Phase 2 avec le passeport).

import type { CollectibleDef } from '@/data/types';

export const COLLECTIBLES: CollectibleDef[] = [
  { id: 'baguette', name: 'Baguette', countryId: 'france', icon: '🥖', globalRevenueBonus: 0.02 },
  { id: 'tour_eiffel_photo', name: 'Photo Tour Eiffel', countryId: 'france', icon: '📸', globalRevenueBonus: 0.03 },
  { id: 'macaron', name: 'Macaron', countryId: 'france', icon: '🍬', globalRevenueBonus: 0.02 },
];

const BY_ID: Record<string, CollectibleDef> = Object.fromEntries(
  COLLECTIBLES.map((c) => [c.id, c]),
);

export function getCollectible(id: string): CollectibleDef | undefined {
  return BY_ID[id];
}

/**
 * Bonus passif total (fraction, ex. 0.07 = +7%) apporté par les objets possédés.
 * `owned` vient de l'état de jeu (state.collection) et peut contenir des ids
 * inconnus → on filtre défensivement.
 */
export function passiveBonusFromCollection(owned: string[] | undefined): number {
  return (owned ?? []).reduce((sum, id) => sum + (BY_ID[id]?.globalRevenueBonus ?? 0), 0);
}
