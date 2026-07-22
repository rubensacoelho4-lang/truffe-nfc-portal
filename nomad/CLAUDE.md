# CLAUDE.md — NOMAD (Idle Travel Tycoon)

> Règles projet lues par **tous** les agents. Elles encodent des erreurs déjà
> vécues sur RN+Expo+Supabase. Ne pas les contourner sans raison explicite.

## Le jeu en une phrase

Idle/tycoon mobile : un voyageur fauché enchaîne des petits boulots pour financer
son tour du monde. Boulots (générateurs) → managers (automatisation) → voyage
(prestige). Data-driven : **un pays = un fichier**, jamais du code moteur.

## Architecture (source de vérité §4 de la spec)

- `src/engine/` — moteur idle **pur TypeScript, zéro import RN**. Testable en Node.
  (`economy.ts`, `gameLoop.ts`, `prestige.ts`). C'est le cœur : il ne connaît pas
  l'UI ni le contenu, il calcule.
- `src/data/` — contenu data-driven (pays, boulots, collectibles). Ajouter un pays
  = ajouter un fichier ici. **Aucune** modif du moteur.
- `src/store/gameStore.ts` — Zustand : état runtime + actions + tick central.
- `src/components/`, `app/` — UI et écrans (Expo Router).
- `src/services/` — supabase, save/sync, ads, purchases.
- `tools/simulate.ts` — simulateur d'économie (équilibrage avant playtest).

## Règles absolues

### Animations
- `Animated` de `react-native` **UNIQUEMENT**. Ne JAMAIS installer
  `react-native-reanimated` (crashs de worklet vécus en prod).
- `useNativeDriver: true` partout **SAUF** animations de `width`/`height`/`padding`/
  `margin` → `useNativeDriver: false` (barres de progression).
- Pas de `Math.random()` dans le render. Pré-calculer au module level ou dans un
  `useRef`.

### State (Zustand)
- Selectors individuels : `useStore(s => s.action)`, jamais `const s = useStore()`.
- `getState()` dans les callbacks async (éviter les stale closures).
- Le moteur (`src/engine`) reste pur ; le store l'appelle, il n'importe pas le store.

### Robustesse
- Zéro `catch {}` vide **sauf haptics** (fire-and-forget).
- Tous les `console.warn` taggés `[Nomad]`.
- `?? []` défensif sur tout tableau venu de la DB ; null guards dans chaque handler.
- Idle = calcul par **delta de timestamps**, jamais un compteur naïf incrémenté.
  Robuste au background / kill de l'app.

### UI mobile
- `useSafeAreaInsets()` partout, jamais de `top`/`bottom` hardcodé sous le notch.
- `StatusBar` configuré explicitement dans le layout racine.
- Haptics sur boutons et interactions clés (`src/lib/haptics.ts`).

### Backend (quand on y arrive — Phase 3)
- RLS sur **toutes** les tables Supabase.
- Pas de clé API en clair côté client.
- Transactions atomiques via RPC PostgreSQL (pas 4 queries séparées).
- Local (AsyncStorage) = source de vérité pour un idle ; Supabase = backup/sync
  avec fallback offline.

### Install & build
- `npm install --legacy-peer-deps` **obligatoire** (jamais `npx expo install` seul).
- Vérifier les noms de packages (communautaires = `react-native-*`, Expo = `expo-*`).
- `npx tsc --noEmit` = **0 erreur** avant tout commit.

## Discipline de scope (le vrai risque projet)

Architecture pour 12 pays, **sortie à 3**. On valide le FUN sur France avant de
produire les assets des autres. Les GATES de fun (§5.2 spec) ne se sautent pas.

## Phases

1. **Fondation** — engine + data(France) + UI principale → jouable local. ← *ici*
2. Progression — prestige + Japon/Brésil + passeport.
3. Persistance — Supabase + save/sync + auth.
4. Monétisation — AdMob rewarded + RevenueCat IAP.
5. Polish & ship — haptics, entrées d'écran, audit, EAS build.
