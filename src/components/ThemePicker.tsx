import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { AppText } from './AppText';
import { SegmentedControl, type SegmentOption } from './SegmentedControl';
import { radius, spacing, themes, type AppTheme } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import type { ThemeFamily, ThemeMode, ThemeModePreference } from '../types/models';

const FAMILY_LABEL_KEYS: Record<ThemeFamily, string> = {
  crispPilsner: 'settings.themeCrispPilsner',
  amberLager: 'settings.themeAmberLager',
  darkStout: 'settings.themeDarkStout',
};

const FAMILIES = Object.keys(FAMILY_LABEL_KEYS) as ThemeFamily[];

/** One half (or the whole) of a family preview: background, card, accent. */
function SwatchFace({ variant, style }: { variant: AppTheme; style?: object }) {
  const palette = variant.colors;
  return (
    <View style={[styles.swatchFace, { backgroundColor: palette.background }, style]}>
      <View
        style={[
          styles.swatchCard,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      />
      <View style={[styles.swatchDot, { backgroundColor: palette.accent }]} />
    </View>
  );
}

/**
 * Family preview that mirrors the active mode: the light variant in light
 * mode, the dark variant in dark mode, and a day/night split when following
 * the system.
 */
function FamilySwatch({
  family,
  preference,
  borderColor,
}: {
  family: ThemeFamily;
  preference: ThemeModePreference;
  borderColor: string;
}) {
  const pair = themes[family];
  if (preference === 'system') {
    return (
      <View style={[styles.swatch, styles.splitSwatch, { borderColor }]}>
        <SwatchFace variant={pair.light} />
        <SwatchFace variant={pair.dark} />
      </View>
    );
  }
  return (
    <View style={[styles.swatch, { borderColor }]}>
      <SwatchFace variant={pair[preference]} />
    </View>
  );
}

/**
 * Theme picker for the 3 premium families × light/dark variants.
 * Mode (system/light/dark) and family combine into one of six palettes.
 */
export function ThemePicker() {
  const { theme, family, modePreference, setFamily, setModePreference } = useAppTheme();
  const { t } = useTranslation();

  const modeOptions: SegmentOption<ThemeModePreference>[] = [
    { value: 'system', label: t('settings.themeModeSystem'), icon: 'contrast-outline' },
    { value: 'light', label: t('settings.themeModeLight'), icon: 'sunny-outline' },
    { value: 'dark', label: t('settings.themeModeDark'), icon: 'moon-outline' },
  ];

  const select = (next: ThemeFamily) => {
    if (next === family) return;
    Haptics.selectionAsync().catch(() => undefined);
    setFamily(next);
  };

  return (
    <View style={styles.container}>
      <SegmentedControl
        options={modeOptions}
        value={modePreference}
        onChange={setModePreference}
      />
      <View style={styles.grid}>
        {FAMILIES.map((candidate) => {
          const selected = candidate === family;
          const variantLabel =
            modePreference === 'system'
              ? t('settings.themeModeSystem')
              : modePreference === 'dark'
                ? t('settings.themeModeDark')
                : t('settings.themeModeLight');
          return (
            <Pressable
              key={candidate}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t(FAMILY_LABEL_KEYS[candidate])} · ${variantLabel}`}
              onPress={() => select(candidate)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: pressed
                    ? theme.colors.surfacePressed
                    : theme.colors.surface,
                  borderColor: selected ? theme.colors.accent : theme.colors.hairline,
                  borderWidth: selected ? 1.8 : 1,
                },
              ]}
            >
              <FamilySwatch
                family={candidate}
                preference={modePreference}
                borderColor={selected ? theme.colors.accent : theme.colors.border}
              />
              <View style={styles.labelRow}>
                <AppText
                  variant="label"
                  color={selected ? theme.colors.text : theme.colors.textSecondary}
                  numberOfLines={1}
                  style={styles.label}
                >
                  {t(FAMILY_LABEL_KEYS[candidate])}
                </AppText>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.accent} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
  },
  card: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  swatch: {
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  splitSwatch: {
    flexDirection: 'row',
  },
  swatchFace: {
    flex: 1,
    padding: spacing.sm - 2,
    justifyContent: 'flex-end',
  },
  swatchCard: {
    position: 'absolute',
    top: spacing.sm - 2,
    left: spacing.sm - 2,
    right: '38%',
    height: 14,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  swatchDot: {
    alignSelf: 'flex-end',
    width: 13,
    height: 13,
    borderRadius: 7,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  label: {
    flexShrink: 1,
  },
});
