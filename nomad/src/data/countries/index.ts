// Registre des pays. LE seul endroit à toucher pour ajouter un pays :
// importer le fichier et l'ajouter à COUNTRIES. Le moteur lit ce registre.

import type { Country } from '@/data/types';
import { FRANCE } from './france';

// Trié par `order` pour garantir la séquence de voyage.
export const COUNTRIES: Country[] = [FRANCE].sort((a, b) => a.order - b.order);

const BY_ID: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.id, c]),
);

/** Pays de départ (order le plus bas). */
export const FIRST_COUNTRY: Country = COUNTRIES[0];

export function getCountry(id: string): Country | undefined {
  return BY_ID[id];
}

/** Pays suivant dans la séquence de voyage, ou null si c'est le dernier débloqué. */
export function nextCountry(id: string): Country | null {
  const current = BY_ID[id];
  if (!current) return null;
  const next = COUNTRIES.find((c) => c.order === current.order + 1);
  return next ?? null;
}
