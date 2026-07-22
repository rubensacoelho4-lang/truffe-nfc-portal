# NOMAD — Idle Travel Tycoon

Jeu idle mobile : un voyageur fauché enchaîne des petits boulots pour financer son
tour du monde. Boulots (générateurs) → managers (automatisation) → voyage (prestige).

> **État : Phase 1 — Fondation (jouable en local).** Moteur + France + écran principal.
> Backend, prestige multi-pays et monétisation viennent aux phases suivantes.

## Stack
React Native + Expo (Expo Router) · Zustand · AsyncStorage · Supabase (Phase 3) ·
AdMob + RevenueCat (Phase 4). Animations : **`Animated` RN uniquement** (pas de reanimated).

## Démarrer

```bash
npm install --legacy-peer-deps   # obligatoire (conflits peer deps Expo)
npm start                        # Expo dev server
npm run typecheck                # tsc --noEmit
npm run simulate                 # simulateur d'économie (équilibrage)
```

## Architecture (data-driven)

```
src/engine/    moteur idle PUR (economy, gameLoop, prestige) — zéro RN, testable en Node
src/data/      contenu : 1 fichier = 1 pays. Ajouter un pays ≠ toucher le moteur.
src/store/     Zustand : état runtime + actions + tick central
src/components/ JobCard, MoneyCounter, OfflineModal (Animated)
src/lib/       haptics, format (grands nombres), useGameLoop (cycle de vie)
src/services/  save local (+ sync Supabase en Phase 3)
app/           écrans Expo Router
tools/         simulate.ts — rejoue une partie pour caler les courbes
supabase/      migrations (schéma + RLS + RPC) — Phase 3
```

**Le point clé** : ajouter un pays = créer `src/data/countries/<pays>.ts` + une ligne
dans `index.ts`. Le moteur lit le registre, aucune modif de code de simulation.

## Boucle de jeu
1. Achète un boulot → il produit de l'argent par cycle.
2. Upgrade (coût `baseCost × growth^niveau`, revenu `baseRevenue × niveau × paliers`).
3. Achète un **manager** → le boulot s'automatise (produit sans tap).
4. Accumule jusqu'au `travelCost` → **voyage** (prestige) : reset + miles + bonus global.

## Conventions
Voir `CLAUDE.md` (règles projet, lues par tous les agents) et `.claude/agents/`
(les 6 subagents spécialisés du plan de build multi-agents).

## Discipline de scope
Architecture pour 12 pays, **sortie à 3**. On valide le fun sur la France avant de
produire les assets des autres pays. Les GATES de fun ne se sautent pas.
