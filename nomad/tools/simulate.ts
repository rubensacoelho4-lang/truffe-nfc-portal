// simulate.ts — simulateur d'économie (équilibrage AVANT playtest).
// Rejoue une partie "idle optimale" seconde par seconde et rapporte les jalons :
// déblocage de chaque boulot, achat des managers, et temps jusqu'au voyage.
//
// Lancer :  npm run simulate     (via tsx)
//
// N.B. imports RELATIFS volontaires : ce script tourne en Node pur, hors Expo.
// Les imports de types du moteur sont erasés à l'exécution, donc aucun alias
// "@/..." n'a besoin d'être résolu ici.

import type { Country, JobDef } from '../src/data/types';
import {
  bulkCost,
  costOfLevel,
  jobRevenuePerSecond,
  maxAffordable,
} from '../src/engine/economy';
import { COUNTRIES } from '../src/data/countries';

interface SimJob {
  def: JobDef;
  level: number;
  manager: boolean;
}

interface Milestone {
  label: string;
  atSeconds: number;
  money: number;
}

const HORIZON_SECONDS = 60 * 60 * 72; // 72h max de simulation
const REPORT = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${h}h${m.toString().padStart(2, '0')}m${sec.toString().padStart(2, '0')}s`;
};
const fmt = (n: number) => {
  const suf = ['', 'K', 'M', 'B', 'T'];
  if (n < 1000) return n.toFixed(0);
  const t = Math.floor(Math.log10(n) / 3);
  return (n / 10 ** (t * 3)).toFixed(2) + (suf[t] ?? `e${t * 3}`);
};

/**
 * rps en supposant que tout boulot POSSÉDÉ produit (manager = auto ;
 * sans manager = le joueur tape assez pour le garder actif). Modèle optimiste
 * mais représentatif de la courbe de progression.
 */
function activeRps(jobs: SimJob[], mult: number): number {
  let rps = 0;
  for (const j of jobs) {
    if (j.level <= 0) continue;
    // On force hasManager=true dans le calcul de rps pour modéliser la production active.
    rps += jobRevenuePerSecond(j.def, j.level, true, mult);
  }
  return rps;
}

/** Stratégie d'achat gloutonne : débloque, prend les managers, puis empile le meilleur ratio. */
function spend(jobs: SimJob[], money: number): number {
  let budget = money;
  let progress = true;
  let guard = 0;

  while (progress && guard++ < 500) {
    progress = false;

    // 1) Débloquer les boulots pas encore possédés (ordre = prix croissant).
    for (const j of jobs) {
      if (j.level === 0 && budget >= j.def.baseCost) {
        budget -= j.def.baseCost;
        j.level = 1;
        progress = true;
      }
    }

    // 2) Managers : priorité, ils débloquent l'idle.
    for (const j of jobs) {
      if (j.level > 0 && !j.manager && budget >= j.def.managerCost) {
        budget -= j.def.managerCost;
        j.manager = true;
        progress = true;
      }
    }

    // 3) Meilleur upgrade au ratio revenu/coût, acheté par lots.
    let best: SimJob | null = null;
    let bestRatio = 0;
    for (const j of jobs) {
      if (j.level === 0) continue;
      const cost = costOfLevel(j.def, j.level);
      if (cost > budget) continue;
      const ratio = (j.def.baseRevenue / j.def.cycleTime) / cost;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = j;
      }
    }
    if (best) {
      // Achète jusqu'à 10 niveaux d'un coup si abordable, sinon 1.
      const n = Math.min(10, maxAffordable(best.def, best.level, budget));
      const count = Math.max(1, n);
      const cost = bulkCost(best.def, best.level, count);
      if (cost <= budget) {
        budget -= cost;
        best.level += count;
        progress = true;
      }
    }
  }
  return budget;
}

function simulate(country: Country) {
  // Bootstrap identique au jeu : le 1er boulot démarre au niveau 1 (voir save.ts).
  const jobs: SimJob[] = country.jobs.map((def, i) => ({ def, level: i === 0 ? 1 : 0, manager: false }));
  const mult = country.travelBonusMultiplier;
  const milestones: Milestone[] = [];
  const unlocked = new Set<string>();
  const managed = new Set<string>();

  let money = 0;
  let travelAt = -1;

  for (let t = 0; t <= HORIZON_SECONDS; t++) {
    money += activeRps(jobs, mult);
    money = spend(jobs, money);

    for (const j of jobs) {
      if (j.level > 0 && !unlocked.has(j.def.id)) {
        unlocked.add(j.def.id);
        milestones.push({ label: `Débloque ${j.def.name}`, atSeconds: t, money });
      }
      if (j.manager && !managed.has(j.def.id)) {
        managed.add(j.def.id);
        milestones.push({ label: `Manager · ${j.def.name}`, atSeconds: t, money });
      }
    }

    if (travelAt < 0 && money >= country.travelCost) {
      travelAt = t;
      milestones.push({ label: `🎯 VOYAGE possible (${fmt(country.travelCost)})`, atSeconds: t, money });
      break;
    }
  }

  return { milestones, travelAt, jobs, money };
}

function main() {
  console.log('\n════════ Simulation d\'économie NOMAD (jeu idle optimal) ════════');
  let cumulative = 0;

  for (const country of COUNTRIES) {
    console.log(`\n=== ${country.flag ?? ''} ${country.name}  (mult ×${country.travelBonusMultiplier}) ===`);
    console.log(`Objectif de voyage : ${fmt(country.travelCost)}€`);

    const { milestones, travelAt, jobs } = simulate(country);

    for (const m of milestones) {
      console.log(`  ${REPORT(m.atSeconds).padEnd(12)} ${m.label.padEnd(34)} money=${fmt(m.money)}`);
    }

    const finalLevels = jobs.map((j) => `${j.def.icon ?? '·'}${j.level}`).join('  ');
    console.log(`  boulots: ${finalLevels}`);

    if (travelAt < 0) {
      console.log(`  ⚠️  Voyage NON atteint en ${REPORT(HORIZON_SECONDS)} → à retuner.`);
    } else {
      cumulative += travelAt;
      console.log(`  ✅ Voyage en ~${REPORT(travelAt)}  (cumul ~${REPORT(cumulative)})`);
    }
  }

  console.log(`\n📊 Parcours complet des ${COUNTRIES.length} pays en ~${REPORT(cumulative)} de jeu optimal.`);
  console.log('   (Le jeu idle réel est plus lent : ce chiffre est une borne "actif optimal".)\n');
}

main();
