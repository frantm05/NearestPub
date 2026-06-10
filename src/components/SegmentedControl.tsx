import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppText } from './AppText';
import { radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

const THUMB_INSET = 3;

/** Animated three-state pill selector used in Settings. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { theme } = useAppTheme();
  const [width, setWidth] = useState(0);
  const position = useRef(new Animated.Value(0)).current;

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const segmentWidth = width > 0 ? (width - THUMB_INSET * 2) / options.length : 0;

  useEffect(() => {
    Animated.spring(position, {
      toValue: selectedIndex * segmentWidth,
      useNativeDriver: true,
      speed: 22,
      bounciness: 6,
    }).start();
  }, [selectedIndex, segmentWidth, position]);

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: theme.colors.surfacePressed }]}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            styles.thumb,
            {
              width: segmentWidth,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              transform: [{ translateX: position }],
            },
          ]}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={styles.segment}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync().catch(() => undefined);
              onChange(option.value);
            }}
          >
            {option.icon ? (
              <Ionicons
                name={option.icon}
                size={15}
                color={selected ? theme.colors.accent : theme.colors.textMuted}
              />
            ) : null}
            <AppText
              variant="label"
              color={selected ? theme.colors.text : theme.colors.textMuted}
              numberOfLines={1}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: THUMB_INSET,
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: THUMB_INSET,
    bottom: THUMB_INSET,
    left: THUMB_INSET,
    borderRadius: radius.md - 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.sm + 2,
  },
});
