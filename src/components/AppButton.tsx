import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppText } from './AppText';
import { radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dangerGhost';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  style,
}: AppButtonProps) {
  const { theme } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const palette = {
    primary: {
      background: theme.colors.accent,
      foreground: theme.colors.onAccent,
      border: 'transparent',
    },
    secondary: {
      background: theme.colors.accentSoft,
      foreground: theme.colors.accent,
      border: 'transparent',
    },
    ghost: {
      background: 'transparent',
      foreground: theme.colors.accent,
      border: theme.colors.border,
    },
    dangerGhost: {
      background: 'transparent',
      foreground: theme.colors.danger,
      border: theme.colors.dangerSoft,
    },
  }[variant];

  const animateTo = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 5,
    }).start();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onPress();
  };

  const blocked = disabled || loading;

  return (
    <Pressable
      onPress={blocked ? undefined : handlePress}
      onPressIn={blocked ? undefined : () => animateTo(0.96)}
      onPressOut={blocked ? undefined : () => animateTo(1)}
      disabled={blocked}
      style={style}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: palette.background,
            borderColor: palette.border,
            borderWidth: variant === 'ghost' || variant === 'dangerGhost' ? 1 : 0,
            opacity: blocked && !loading ? 0.5 : 1,
            transform: [{ scale }],
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={palette.foreground} />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={17} color={palette.foreground} /> : null}
            <AppText variant="bodyStrong" color={palette.foreground}>
              {label}
            </AppText>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minHeight: 46,
  },
});
