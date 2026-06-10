import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { BEER_CATALOG } from '../services/czechData';
import { useFilters } from '../state/FiltersProvider';
import { cardShadow, radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import type { BeerStyle, PriceBucket } from '../types/models';

const PRICE_OPTIONS: { bucket: PriceBucket; labelKey: string }[] = [
  { bucket: 'any', labelKey: 'filters.priceAny' },
  { bucket: 'budget', labelKey: 'filters.priceBudget' },
  { bucket: 'moderate', labelKey: 'filters.priceModerate' },
  { bucket: 'premium', labelKey: 'filters.pricePremium' },
];

const ALL_STYLES: BeerStyle[] = [
  'paleLager',
  'darkLager',
  'amberLager',
  'unfiltered',
  'wheat',
  'ipa',
  'apa',
  'stout',
  'sour',
];

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function Chip({ label, selected, onPress }: ChipProps) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected
            ? theme.colors.accentSoft
            : pressed
              ? theme.colors.surfacePressed
              : theme.colors.surface,
          borderColor: selected ? theme.colors.accent : theme.colors.border,
        },
      ]}
    >
      <AppText
        variant="label"
        color={selected ? theme.colors.accent : theme.colors.textSecondary}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Bottom sheet with the three filter dimensions: price, brewery, style. */
export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    filters,
    activeCount,
    setPriceBucket,
    toggleStyle,
    toggleBrewery,
    clearFilters,
  } = useFilters();

  const breweries = useMemo(
    () => [...new Set(BEER_CATALOG.map((beer) => beer.brewery))],
    [],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheet,
          cardShadow(theme),
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: theme.colors.border }]} />
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Ionicons name="funnel" size={18} color={theme.colors.accent} />
            <AppText variant="title">{t('filters.title')}</AppText>
          </View>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button">
            <Ionicons name="close" size={22} color={theme.colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="micro" style={styles.sectionLabel}>
            {t('filters.priceSection').toUpperCase()}
          </AppText>
          <View style={styles.chipRow}>
            {PRICE_OPTIONS.map(({ bucket, labelKey }) => (
              <Chip
                key={bucket}
                label={t(labelKey)}
                selected={filters.price === bucket}
                onPress={() => setPriceBucket(bucket)}
              />
            ))}
          </View>

          <AppText variant="micro" style={styles.sectionLabel}>
            {t('filters.brewerySection').toUpperCase()}
          </AppText>
          <View style={styles.chipRow}>
            {breweries.map((brewery) => (
              <Chip
                key={brewery}
                label={brewery}
                selected={filters.breweries.includes(brewery)}
                onPress={() => toggleBrewery(brewery)}
              />
            ))}
          </View>

          <AppText variant="micro" style={styles.sectionLabel}>
            {t('filters.styleSection').toUpperCase()}
          </AppText>
          <View style={styles.chipRow}>
            {ALL_STYLES.map((style) => (
              <Chip
                key={style}
                label={t(`beerStyle.${style}`)}
                selected={filters.styles.includes(style)}
                onPress={() => toggleStyle(style)}
              />
            ))}
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <AppButton
            label={t('filters.clear')}
            variant="ghost"
            onPress={clearFilters}
            disabled={activeCount === 0}
            style={styles.actionButton}
          />
          <AppButton label={t('filters.done')} onPress={onClose} style={styles.actionButton} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '82%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  sectionLabel: {
    letterSpacing: 1.2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
