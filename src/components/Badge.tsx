import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from './AppText';
import { radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'accent';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Badge({ label, tone = 'neutral', icon }: BadgeProps) {
  const { theme } = useAppTheme();

  const palette = {
    neutral: { background: theme.colors.surfacePressed, foreground: theme.colors.textSecondary },
    success: { background: theme.colors.successSoft, foreground: theme.colors.success },
    danger: { background: theme.colors.dangerSoft, foreground: theme.colors.danger },
    accent: { background: theme.colors.accentSoft, foreground: theme.colors.accent },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      {icon ? <Ionicons name={icon} size={12} color={palette.foreground} /> : null}
      <AppText variant="label" color={palette.foreground} style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
});
