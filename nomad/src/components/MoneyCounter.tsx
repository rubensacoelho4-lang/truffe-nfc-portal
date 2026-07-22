// MoneyCounter.tsx — compteur qui "monte" en douceur entre deux ticks.
// L'animation est COSMÉTIQUE et découplée de la logique (spec §2.1) :
// la valeur logique saute chaque seconde, l'affichage interpole vers elle.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { formatMoney } from '@/lib/format';
import { COLORS, FONT_SIZE, FONT_WEIGHT } from '@/theme/theme';

interface Props {
  value: number;
  prefix?: string;
  color?: string;
  size?: number;
}

function MoneyCounterBase({ value, prefix = '', color = COLORS.money, size = FONT_SIZE.display }: Props) {
  // Animated.Value pilote l'interpolation ; useNativeDriver:false (valeur JS, pas un style natif).
  const anim = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(v));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    const a = Animated.timing(anim, {
      toValue: value,
      duration: 850,
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [value, anim]);

  return (
    <View style={styles.row}>
      {prefix ? <Text style={[styles.prefix, { color }]}>{prefix}</Text> : null}
      <Text style={[styles.value, { color, fontSize: size }]} numberOfLines={1}>
        {formatMoney(display)}
      </Text>
    </View>
  );
}

export const MoneyCounter = React.memo(MoneyCounterBase);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline' },
  prefix: { fontSize: FONT_SIZE.subtitle, fontWeight: FONT_WEIGHT.bold, marginRight: 4 },
  value: { fontWeight: FONT_WEIGHT.heavy, letterSpacing: 0.3 },
});
