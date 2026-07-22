# NOMAD — Idle Travel Tycoon

Jeu idle mobile : un voyageur fauché enchaîne des petits boulots pour financer son
tour du monde. Boulots (générateurs) → managers (automatisation) → voyage (prestige)
→ nouveau pays plus rentable. Collection passeport pour la rétention.

> **État : Phases 1→4 implémentées** (fondation, progression, persistance, monétisation).
> Jouable en local sans configuration. Le cloud save, le classement et les pubs/IAP
> réels s'activent en branchant Supabase + les SDK natifs (voir ci-dessous).

## Stack
React Native + Expo (Expo Router) · Zustand · AsyncStorage · Supabase · AdMob +
RevenueCat. Animations : **`Animated` RN uniquement** (jamais reanimated).

## Démarrer

```bash
npm install --legacy-peer-deps   # obligatoire (conflits peer deps Expo)
npm start                        # Expo dev server
npm run typecheck                # tsc --noEmit (doit être à 0)
npm run simulate                 # simulateur d'économie (équilibrage)
```

Le jeu tourne **sans backend** : la partie vit en local (AsyncStorage). Le cloud
save et le classement s'activent en copiant `.env.example` → `.env` et en
renseignant l'URL + la clé anon Supabase, puis en appliquant `supabase/migrations`.

## Architecture (data-driven)

```
src/engine/     moteur idle PUR (economy, gameLoop, prestige) — zéro RN, testable en Node
src/data/       contenu : 1 fichier = 1 pays (France, Japon, Brésil) + collectibles
src/store/      Zustand : état runtime + actions + tick central
src/components/  JobCard, MoneyCounter, OfflineModal, fx/Confetti (Animated)
src/lib/        haptics, format (grands nombres), useGameLoop, useScreenEntrance
src/services/   supabase, auth, save (local+sync+offline), social, ads, purchases
app/(game)/     onglets : Boulots · Voyage · Passeport · Classement · Boutique
tools/          simulate.ts — rejoue une partie pour caler les courbes
supabase/       migrations (schéma + RLS + RPC atomique)
```

**Le point clé** : ajouter un pays = créer `src/data/countries/<pays>.ts` + une
ligne dans `index.ts`. Le moteur lit le registre, aucune modif du code de simulation.

## Boucle de jeu
1. Tape le 1er boulot pour tes premiers euros, puis achète des niveaux.
2. Achète un **manager** → le boulot s'automatise (produit hors-ligne aussi).
3. Franchis des paliers (×2 revenus) qui rapportent aussi des gemmes.
4. Atteins le `travelCost` → **voyage** : reset, +miles, +souvenirs, ×mult global.
5. Reviens plus tard → gain offline (doublable par pub). Boosts temporaires en boutique.

## Équilibrage (simulate)
Parcours actif-optimal : France ~2h → Japon ~6h → Brésil ~24h. Le jeu idle réel
est plus lent (borne haute). Retuner via `travelCost` / `costGrowth` dans les
fichiers pays, revalider avec `npm run simulate`.

## Ce qui reste avant le store (Phases 4→5 réelles)
- **Pubs & IAP** : `services/ads.ts` et `purchases.ts` tournent en **mock dev**
  (récompenses simulées). Brancher `react-native-google-mobile-ads` + RevenueCat
  en **dev client / EAS** (ne marchent pas dans Expo Go). Points de swap documentés
  dans chaque fichier ; passer `ADS_READY` / `IAP_READY` à true.
- **Assets** : icônes emoji en placeholder. Le vrai goulot = décors/illustrations
  cohérents des pays (d'où la sortie à 3).
- **Test device** : valider sur iOS/Android réel, puis build EAS + soumission.

## Conventions
Voir `CLAUDE.md` (règles projet, lues par tous les agents) et `.claude/agents/`
(6 subagents spécialisés du plan de build multi-agents).

## Discipline de scope
Architecture pour 12 pays, **sortie à 3**. Valider le fun (les GATES) avant de
produire les assets des autres pays.
