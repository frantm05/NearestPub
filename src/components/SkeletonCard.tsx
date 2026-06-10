import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';

/** Pulsing placeholder shown while the first venue fetch is in flight. */
export function SkeletonCard() {
  const { theme } = useAppTheme();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const block = (width: number | `${number}%`, height: number) => (
    <Animated.View
      style={{
        width,
        height,
        borderRadius: radius.sm,
        backgroundColor: theme.colors.surfacePressed,
        opacity: pulse,
      }}
    />
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
      ]}
    >
      <Animated.View
        style={[
          styles.iconCircle,
          { backgroundColor: theme.colors.surfacePressed, opacity: pulse },
        ]}
      />
      <View style={styles.lines}>
        {block('62%', 16)}
        {block('40%', 12)}
        {block('78%', 12)}
      </View>
      <View style={styles.right}>
        {block(54, 18)}
        {block(40, 11)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
  },
  lines: {
    flex: 1,
    gap: spacing.sm,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
});
