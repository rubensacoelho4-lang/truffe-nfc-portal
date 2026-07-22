// Confetti.tsx — burst de particules (Animated, useNativeDriver:true).
// Recette skill §9.1 : configs générées une fois dans useRef, chaque particule
// est un composant memo avec son propre Animated.Value, container pointerEvents none.
// Se déclenche quand la prop `fireKey` change (nouvelle valeur = nouveau burst).

import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const COLORS = ['#F59E0B', '#3B82F6', '#22C55E', '#EF4444', '#A78BFA', '#FBBF24'];
const COUNT = 28;

interface ParticleConfig {
  color: string;
  dx: number;
  delay: number;
  size: number;
  rotateTo: string;
}

// Valeurs "aléatoires" DÉTERMINISTES par index (pas de Math.random dans le render).
function buildConfigs(): ParticleConfig[] {
  return Array.from({ length: COUNT }, (_, i) => {
    const t = i / COUNT;
    return {
      color: COLORS[i % COLORS.length],
      dx: (t - 0.5) * SCREEN_W * 1.1,
      delay: (i % 6) * 40,
      size: 8 + (i % 4) * 3,
      rotateTo: `${(i % 2 === 0 ? 1 : -1) * (360 + (i % 5) * 90)}deg`,
    };
  });
}

const Particle = React.memo(function Particle({ cfg }: { cfg: ParticleConfig }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 1400,
      delay: cfg.delay,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, cfg.delay]);

  const translateY = progress.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, -SCREEN_H * 0.18, SCREEN_H * 0.55],
  });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, cfg.dx] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', cfg.rotateTo] });
  const opacity = progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: cfg.size,
        height: cfg.size * 0.6,
        borderRadius: 2,
        backgroundColor: cfg.color,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate }],
      }}
    />
  );
});

export function Confetti({ fireKey }: { fireKey: number }) {
  // Regénère un jeu de particules par burst (useRef par instance = pas de random au render).
  const configs = useRef(buildConfigs()).current;
  if (fireKey <= 0) return null;
  return (
    <View pointerEvents="none" style={styles.container} key={fireKey}>
      {configs.map((cfg, i) => (
        <Particle key={i} cfg={cfg} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
});
