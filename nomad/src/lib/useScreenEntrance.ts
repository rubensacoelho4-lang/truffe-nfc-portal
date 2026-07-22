// useScreenEntrance.ts — entrée d'écran (fade + slide up). Animated, useNativeDriver:true.
// Retourne un style animé à appliquer sur un Animated.View racine.

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export function useScreenEntrance(delay = 0) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 380,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [fade, slide, delay]);

  return { opacity: fade, transform: [{ translateY: slide }] };
}
