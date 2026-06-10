import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from './AppText';
import { cardShadow } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import { normalizeDeg, shortestAngleDelta } from '../services/geo';

interface CompassDialProps {
  size?: number;
  /** Device heading from north; null when the sensor is unavailable. */
  headingDeg: number | null;
  /** Absolute bearing from the user to the target venue. */
  bearingDeg: number;
  /** Rendered in the fixed center cap (distance readout). */
  children?: React.ReactNode;
}

/**
 * Drives an Animated angle along the shortest rotation path, accumulating
 * past ±360° so the needle never unwinds through a full turn.
 */
function useSmoothedAngle(targetDeg: number): Animated.Value {
  const animated = useRef(new Animated.Value(targetDeg)).current;
  const accumulated = useRef(targetDeg);

  useEffect(() => {
    const delta = shortestAngleDelta(normalizeDeg(accumulated.current), targetDeg);
    accumulated.current += delta;
    Animated.timing(animated, {
      toValue: accumulated.current,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [targetDeg, animated]);

  return animated;
}

function toRotation(value: Animated.Value): Animated.AnimatedInterpolation<string> {
  return value.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });
}

const TICK_COUNT = 24;

/** Rotating compass card with cardinal labels and a gold needle to the pub. */
export function CompassDial({ size = 300, headingDeg, bearingDeg, children }: CompassDialProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  const heading = headingDeg ?? 0;
  const cardAngle = useSmoothedAngle(normalizeDeg(-heading));
  const needleAngle = useSmoothedAngle(normalizeDeg(bearingDeg - heading));

  const ringRadius = size * 0.4;
  const needleLength = size * 0.32;

  const cardinals = [
    { key: 'n', angle: 0, color: theme.colors.accent },
    { key: 'e', angle: 90, color: theme.colors.textMuted },
    { key: 's', angle: 180, color: theme.colors.textMuted },
    { key: 'w', angle: 270, color: theme.colors.textMuted },
  ] as const;

  return (
    <View style={{ width: size, height: size }}>
      {/* Dial face */}
      <View
        style={[
          styles.face,
          cardShadow(theme),
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      />
      <View
        style={[
          styles.innerRing,
          {
            top: size * 0.09,
            left: size * 0.09,
            width: size * 0.82,
            height: size * 0.82,
            borderRadius: (size * 0.82) / 2,
            borderColor: theme.colors.hairline,
          },
        ]}
      />

      {/* Rotating compass card: ticks + cardinal letters */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: toRotation(cardAngle) }] }]}
      >
        {Array.from({ length: TICK_COUNT }, (_, index) => {
          const major = index % 6 === 0;
          return (
            <View
              key={index}
              style={[
                StyleSheet.absoluteFill,
                styles.tickWrapper,
                { transform: [{ rotate: `${(index * 360) / TICK_COUNT}deg` }] },
              ]}
            >
              <View
                style={{
                  width: major ? 3 : 2,
                  height: major ? 16 : 9,
                  borderRadius: 2,
                  marginTop: size * 0.045,
                  backgroundColor: major ? theme.colors.accent : theme.colors.textMuted,
                  opacity: major ? 0.95 : 0.45,
                }}
              />
            </View>
          );
        })}
        {cardinals.map((cardinal) => (
          <View
            key={cardinal.key}
            style={[
              StyleSheet.absoluteFill,
              styles.tickWrapper,
              { transform: [{ rotate: `${cardinal.angle}deg` }] },
            ]}
          >
            <AppText
              variant="heading"
              color={cardinal.color}
              style={{ marginTop: size * 0.115 }}
            >
              {t(`compass.cardinals.${cardinal.key}`)}
            </AppText>
          </View>
        ))}
      </Animated.View>

      {/* Needle pointing at the target */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.needleWrapper,
          { transform: [{ rotate: toRotation(needleAngle) }] },
        ]}
      >
        <View style={{ height: ringRadius * 2, alignItems: 'center' }}>
          <View
            style={[
              styles.needleHead,
              {
                borderBottomColor: theme.colors.accent,
                marginTop: ringRadius - needleLength,
              },
            ]}
          />
          <View
            style={{
              width: 7,
              height: needleLength - 30,
              borderRadius: 4,
              backgroundColor: theme.colors.accent,
            }}
          />
          <View
            style={{
              width: 7,
              height: needleLength * 0.42,
              borderRadius: 4,
              marginTop: 2,
              backgroundColor: theme.colors.surfacePressed,
            }}
          />
        </View>
      </Animated.View>

      {/* Fixed center cap with live distance */}
      <View style={[StyleSheet.absoluteFill, styles.capWrapper]}>
        <View
          style={[
            styles.cap,
            cardShadow(theme),
            {
              width: size * 0.37,
              height: size * 0.37,
              borderRadius: (size * 0.37) / 2,
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.accent,
            },
          ]}
        >
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    borderWidth: 1,
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  tickWrapper: {
    alignItems: 'center',
  },
  needleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  capWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cap: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
