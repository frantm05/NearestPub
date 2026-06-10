import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from './AppText';
import { spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';

/** Pulsing "LIVE" indicator for the simulated community feed. */
export function LiveDot() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(ring, { toValue: 1, duration: 1600, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [ring]);

  return (
    <View style={styles.container}>
      <View style={styles.dotStack}>
        <Animated.View
          style={[
            styles.ring,
            {
              backgroundColor: theme.colors.accent,
              opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
              transform: [
                { scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) },
              ],
            },
          ]}
        />
        <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} />
      </View>
      <AppText variant="micro" color={theme.colors.accent}>
        {t('nearby.liveLabel')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  dotStack: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
