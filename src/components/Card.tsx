import React, { useRef } from 'react';
import { Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { cardShadow, radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
}

/** Surface container with warm elevation; presses settle with a soft spring. */
export function Card({ children, onPress, style, padded = true, elevated = true }: CardProps) {
  const { theme } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const baseStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: theme.colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.hairline,
    },
    elevated && cardShadow(theme),
    padded && { padding: spacing.lg },
    style,
  ];

  if (!onPress) {
    return <Animated.View style={baseStyle}>{children}</Animated.View>;
  }

  const animateTo = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(0.975)}
      onPressOut={() => animateTo(1)}
    >
      <Animated.View style={[baseStyle, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
