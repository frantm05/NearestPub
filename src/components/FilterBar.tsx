import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AppText } from './AppText';
import { useFilters } from '../state/FiltersProvider';
import { radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';

interface FilterBarProps {
  onOpenSheet: () => void;
}

/** Trigger pill + horizontally scrollable active-filter chips with removal. */
export function FilterBar({ onOpenSheet }: FilterBarProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const { filters, activeCount, setPriceBucket, toggleStyle, toggleBrewery } = useFilters();

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...(filters.price !== 'any'
      ? [
          {
            key: `price:${filters.price}`,
            label: t(
              filters.price === 'budget'
                ? 'filters.priceBudget'
                : filters.price === 'moderate'
                  ? 'filters.priceModerate'
                  : 'filters.pricePremium',
            ),
            onRemove: () => setPriceBucket('any'),
          },
        ]
      : []),
    ...filters.breweries.map((brewery) => ({
      key: `brewery:${brewery}`,
      label: brewery,
      onRemove: () => toggleBrewery(brewery),
    })),
    ...filters.styles.map((style) => ({
      key: `style:${style}`,
      label: t(`beerStyle.${style}`),
      onRemove: () => toggleStyle(style),
    })),
  ];

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onOpenSheet}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor:
              activeCount > 0
                ? theme.colors.accentSoft
                : pressed
                  ? theme.colors.surfacePressed
                  : theme.colors.surface,
            borderColor: activeCount > 0 ? theme.colors.accent : theme.colors.border,
          },
        ]}
      >
        <Ionicons
          name="funnel-outline"
          size={14}
          color={activeCount > 0 ? theme.colors.accent : theme.colors.textSecondary}
        />
        <AppText
          variant="label"
          color={activeCount > 0 ? theme.colors.accent : theme.colors.textSecondary}
        >
          {t('filters.trigger')}
        </AppText>
        {activeCount > 0 ? (
          <View style={[styles.countBubble, { backgroundColor: theme.colors.accent }]}>
            <AppText variant="micro" color={theme.colors.onAccent}>
              {activeCount}
            </AppText>
          </View>
        ) : null}
      </Pressable>

      {activeChips.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {activeChips.map((chip) => (
            <Pressable
              key={chip.key}
              onPress={chip.onRemove}
              accessibilityRole="button"
              style={[
                styles.activeChip,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <AppText variant="label" color={theme.colors.textSecondary} numberOfLines={1}>
                {chip.label}
              </AppText>
              <Ionicons name="close" size={12} color={theme.colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.2,
  },
  countBubble: {
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: 180,
  },
});
