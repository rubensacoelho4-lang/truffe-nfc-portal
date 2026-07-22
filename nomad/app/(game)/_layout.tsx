// (game)/_layout.tsx — groupe des écrans de jeu. En Phase 2/4 : travel,
// passport, shop viendront s'ajouter ici.

import { Stack } from 'expo-router';

export default function GameLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
