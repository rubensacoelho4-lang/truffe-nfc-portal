// _layout.tsx — layout racine. Monte le game loop une seule fois, configure
// SafeArea + StatusBar (skill §4). Zéro logique de jeu ici, juste le shell.

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useGameLoop } from '@/lib/useGameLoop';
import { COLORS } from '@/theme/theme';

export default function RootLayout() {
  useGameLoop();
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bg },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}
