// Types de l'ÉTAT RUNTIME du jeu (ce qui est sérialisé/persisté).
// Pur TS, zéro RN. Le store Zustand encapsule cet état + les actions.

/** État d'un boulot en cours de partie. */
export interface JobRuntime {
  level: number;
  hasManager: boolean;
  /**
   * Timestamp (ms) du début du cycle en cours, pour les boulots NON automatisés
   * (progression de la barre au tap). Les boulots automatisés produisent en
   * continu, calculés par delta.
   */
  cycleStart?: number;
}

/** État persistant complet d'une partie (ce qui va dans AsyncStorage / game_saves.state). */
export interface GameState {
  /** Monnaie soft (argent). */
  money: number;
  /** Monnaie hard (gemmes). */
  gems: number;
  /** Monnaie de prestige (miles). */
  miles: number;
  /** Pays courant (id). */
  currentCountryId: string;
  /** Niveaux + managers par boulot, indexés par jobId. */
  jobs: Record<string, JobRuntime>;
  /** Ids de collectibles obtenus (méta-progression, ne reset jamais au voyage). */
  collection: string[];
  /** Ids des pays dont on a obtenu le tampon (passeport). Ne reset jamais. */
  stamps: string[];
  /** Total d'argent gagné dans le pays courant (base du calcul des miles au voyage). */
  earnedInCountry: number;
  /** Total d'argent gagné sur toute la partie (stats / leaderboard). */
  totalEarned: number;
  /** Dernier instant (ms) où l'état a été mis à jour (base du calcul offline). */
  lastSeen: number;
  /** Fin (ms) du boost temporaire actif, ou undefined si aucun. */
  boostUntil?: number;
  /** Facteur du boost temporaire (ex. 2 = ×2 revenus) tant que boostUntil > now. */
  boostFactor?: number;
  /** Entitlement "sans pub" (IAP non-consommable). */
  noAds?: boolean;
  /** Version du schéma de save, pour les migrations futures. */
  version: number;
}

export interface OfflineResult {
  seconds: number;
  /** Gain brut avant plafond et avant taux offline. */
  rawGain: number;
  /** Gain effectivement crédité (après taux + plafond). */
  gain: number;
  /** True si le plafond de temps offline a été atteint. */
  capped: boolean;
}
