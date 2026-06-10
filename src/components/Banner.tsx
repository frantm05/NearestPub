import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from './AppText';
import { radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';

interface BannerProps {
  message: string;
  tone?: 'warning' | 'danger' | 'info';
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}

/** Inline notice for degraded states (no location, permission denied…). */
export function Banner({
  message,
  tone = 'warning',
  icon = 'location-outline',
  actionLabel,
  onAction,
}: BannerProps) {
  const { theme } = useAppTheme();

  const palette = {
    warning: { background: theme.colors.accentSoft, foreground: theme.colors.accent },
    danger: { background: theme.colors.dangerSoft, foreground: theme.colors.danger },
    info: { background: theme.colors.infoSoft, foreground: theme.colors.info },
  }[tone];

  return (
    <View style={[styles.banner, { backgroundColor: palette.background }]}>
      <Ionicons name={icon} size={18} color={palette.foreground} style={styles.icon} />
      <View style={styles.content}>
        <AppText variant="caption" color={theme.colors.textSecondary}>
          {message}
        </AppText>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={6}>
            <AppText variant="label" color={palette.foreground}>
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  icon: {
    marginTop: 1,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
});
