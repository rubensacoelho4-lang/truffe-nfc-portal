// (game)/_layout.tsx — navigation par onglets du jeu.
// Boulots (écran principal), Voyage (prestige), Passeport (collection), Boutique.

import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { selectionTick } from '@/lib/haptics';
import { COLORS, FONT_SIZE } from '@/theme/theme';

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  // Emoji comme icône (pas de lib d'icônes en Phase 2). Couleur via opacité du parent.
  return <Text style={{ fontSize: 20, opacity: color === COLORS.textFaint ? 0.5 : 1 }}>{emoji}</Text>;
}

export default function GameLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgElevated,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.textFaint,
        tabBarLabelStyle: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
      }}
      screenListeners={{ tabPress: () => selectionTick() }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Boulots', tabBarIcon: ({ color }) => <TabIcon emoji="💼" color={color} /> }}
      />
      <Tabs.Screen
        name="travel"
        options={{ title: 'Voyage', tabBarIcon: ({ color }) => <TabIcon emoji="✈️" color={color} /> }}
      />
      <Tabs.Screen
        name="passport"
        options={{ title: 'Passeport', tabBarIcon: ({ color }) => <TabIcon emoji="🛂" color={color} /> }}
      />
      <Tabs.Screen
        name="shop"
        options={{ title: 'Boutique', tabBarIcon: ({ color }) => <TabIcon emoji="💎" color={color} /> }}
      />
    </Tabs>
  );
}
