import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../theme/ThemeProvider';

interface FavoriteHeartProps {
  active: boolean;
  onToggle: () => void;
  size?: number;
}

/** Heart toggle with a pop animation; gold when favorited. */
export function FavoriteHeart({ active, onToggle, size = 22 }: FavoriteHeartProps) {
  const { theme } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => undefined);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.35, useNativeDriver: true, speed: 60, bounciness: 12 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();
    onToggle();
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={active ? 'heart' : 'heart-outline'}
          size={size}
          color={active ? theme.colors.accent : theme.colors.textMuted}
        />
      </Animated.View>
    </Pressable>
  );
}
