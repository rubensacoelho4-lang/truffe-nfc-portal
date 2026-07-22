// data/countries/france.ts — pays de départ (order 1).
// Ajouter un pays = créer un fichier comme celui-ci puis l'enregistrer dans
// src/data/countries/index.ts. Aucune modif du moteur.

import type { Country } from '@/data/types';

export const FRANCE: Country = {
  id: 'france',
  name: 'France',
  order: 1,
  flag: '🇫🇷',
  // Argent requis pour débloquer le pays suivant (calibré ~1 journée idle au début).
  travelCost: 1_000_000,
  // Premier pays : multiplicateur global de base.
  travelBonusMultiplier: 1.0,
  theme: { primary: '#0055A4', accent: '#EF4135' },
  jobs: [
    {
      id: 'croissant',
      name: 'Vendeur de croissants',
      icon: '🥐',
      baseCost: 4,
      baseRevenue: 1,
      cycleTime: 1.0,
      costGrowth: 1.07,
      milestones: [25, 50, 100, 200, 300, 400],
      managerCost: 1_000,
    },
    {
      id: 'cafe',
      name: 'Serveur de café',
      icon: '☕',
      baseCost: 60,
      baseRevenue: 8,
      cycleTime: 3.0,
      costGrowth: 1.08,
      milestones: [25, 50, 100, 200, 300],
      managerCost: 15_000,
    },
    {
      id: 'guide',
      name: 'Guide touristique',
      icon: '🗼',
      baseCost: 720,
      baseRevenue: 47,
      cycleTime: 6.0,
      costGrowth: 1.09,
      milestones: [25, 50, 100, 200],
      managerCost: 100_000,
    },
    {
      id: 'vigneron',
      name: 'Vigneron',
      icon: '🍷',
      baseCost: 8_640,
      baseRevenue: 260,
      cycleTime: 12.0,
      costGrowth: 1.10,
      milestones: [25, 50, 100, 200],
      managerCost: 500_000,
    },
  ],
  collectibles: ['baguette', 'tour_eiffel_photo', 'macaron'],
};
