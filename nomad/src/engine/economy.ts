// economy.ts — TOUTES les formules d'économie du jeu.
// Pur TypeScript, zéro dépendance RN → testable en Node (voir tools/simulate.ts).
//
// Conventions :
//  - "level" = nombre de niveaux ACHETÉS d'un boulot. 0 = pas encore acheté.
//  - Un boulot au niveau N a payé les coûts des niveaux 0..N-1.

import type { JobDef } from '@/data/types';

/**
 * Coût pour acheter LE niveau `level` (0-indexé) d'un boulot.
 * Passer du niveau 0 à 1 coûte `costOfLevel(job, 0)` = baseCost.
 *   coût = baseCost × growth^level
 */
export function costOfLevel(job: JobDef, level: number): number {
  return job.baseCost * Math.pow(job.costGrowth, level);
}

/**
 * Coût cumulé pour acheter `count` niveaux à partir de `fromLevel`.
 * Somme géométrique :
 *   baseCost × growth^fromLevel × (growth^count − 1) / (growth − 1)
 * Utilisé pour les achats ×1 / ×10 / ×100 / max.
 */
export function bulkCost(job: JobDef, fromLevel: number, count: number): number {
  if (count <= 0) return 0;
  const g = job.costGrowth;
  const first = job.baseCost * Math.pow(g, fromLevel);
  if (g === 1) return first * count;
  return (first * (Math.pow(g, count) - 1)) / (g - 1);
}

/**
 * Nombre max de niveaux achetables avec `money` à partir de `fromLevel`.
 * Inverse de la somme géométrique, borné par `cap` par sécurité.
 */
export function maxAffordable(
  job: JobDef,
  fromLevel: number,
  money: number,
  cap = 100_000,
): number {
  if (money <= 0) return 0;
  const g = job.costGrowth;
  const first = job.baseCost * Math.pow(g, fromLevel);
  if (first > money) return 0;
  if (g === 1) return Math.min(cap, Math.floor(money / first));
  // money >= first × (g^n − 1)/(g − 1)  ⇒  n <= log_g(1 + money(g−1)/first)
  const n = Math.log(1 + (money * (g - 1)) / first) / Math.log(g);
  return Math.min(cap, Math.floor(n + 1e-9));
}

/**
 * Multiplicateur de paliers atteints : ×2 cumulatif par milestone franchi.
 * Un boulot niveau 60 avec milestones [25,50,100] a franchi 25 et 50 → ×4.
 */
export function milestoneMultiplier(job: JobDef, level: number): number {
  let passed = 0;
  for (const m of job.milestones) {
    if (level >= m) passed += 1;
  }
  return Math.pow(2, passed);
}

/**
 * Prochain palier non atteint (pour l'UI : "plus que X niveaux avant ×2").
 * Retourne null si tous les paliers sont franchis.
 */
export function nextMilestone(job: JobDef, level: number): number | null {
  for (const m of job.milestones) {
    if (level < m) return m;
  }
  return null;
}

/**
 * Revenu produit à la FIN d'un cycle complet du boulot.
 *   baseRevenue × level × milestoneMult × globalMult
 * `globalMult` regroupe le travelBonus du pays + bonus passifs (collection…).
 */
export function jobCycleRevenue(job: JobDef, level: number, globalMult: number): number {
  if (level <= 0) return 0;
  return job.baseRevenue * level * milestoneMultiplier(job, level) * globalMult;
}

/**
 * Revenu par seconde d'un boulot AUTOMATISÉ (manager acquis).
 * Un boulot sans manager ne produit qu'au tap → 0 en passif.
 */
export function jobRevenuePerSecond(
  job: JobDef,
  level: number,
  hasManager: boolean,
  globalMult: number,
): number {
  if (!hasManager || level <= 0) return 0;
  return jobCycleRevenue(job, level, globalMult) / job.cycleTime;
}

/** Somme du revenu/seconde passif de tous les boulots automatisés d'un pays. */
export function totalRevenuePerSecond(
  jobs: JobDef[],
  levels: Record<string, number>,
  managers: Record<string, boolean>,
  globalMult: number,
): number {
  let sum = 0;
  for (const job of jobs) {
    sum += jobRevenuePerSecond(
      job,
      levels[job.id] ?? 0,
      managers[job.id] ?? false,
      globalMult,
    );
  }
  return sum;
}
