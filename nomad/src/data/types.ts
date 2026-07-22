// Types du CONTENU data-driven. Lus par le moteur (src/engine).
// Aucun import RN ici — c'est de la donnée pure.

export interface JobDef {
  id: string;
  name: string;
  /** Coût du 1er niveau (achat du boulot). */
  baseCost: number;
  /** Revenu d'un cycle à niveau 1, avant multiplicateurs. */
  baseRevenue: number;
  /** Durée d'un cycle de production, en secondes. */
  cycleTime: number;
  /** Coût ×costGrowth par niveau (croissance exponentielle, ~1.06–1.15). */
  costGrowth: number;
  /** Paliers qui doublent la vitesse/revenu (×2 cumulatif à chaque palier atteint). */
  milestones: number[];
  /** Coût du manager qui automatise le boulot. */
  managerCost: number;
  /** Emoji / clé d'icône pour l'UI (assets plus tard). */
  icon?: string;
}

export interface CountryTheme {
  primary: string;
  accent: string;
}

export interface Country {
  id: string;
  name: string;
  /** Ordre de déblocage (1 = pays de départ). */
  order: number;
  /** Argent requis pour débloquer le pays SUIVANT (coût de voyage / prestige). */
  travelCost: number;
  /** Multiplicateur global permanent appliqué tant qu'on est dans ce pays. */
  travelBonusMultiplier: number;
  theme: CountryTheme;
  jobs: JobDef[];
  /** Ids de collectibles débloquables dans ce pays. */
  collectibles: string[];
  flag?: string;
}

export interface CollectibleDef {
  id: string;
  name: string;
  countryId: string;
  icon?: string;
  /** Bonus passif de revenu global apporté par cet objet (ex. 0.02 = +2%). */
  globalRevenueBonus?: number;
}
