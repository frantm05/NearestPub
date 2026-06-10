import React, { useCallback, useState } from 'react';
import { FlatList, Linking, RefreshControl, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '../components/AppText';
import { Banner } from '../components/Banner';
import { EmptyState } from '../components/EmptyState';
import { FilterBar } from '../components/FilterBar';
import { FilterSheet } from '../components/FilterSheet';
import { LiveDot } from '../components/LiveDot';
import { PubCard } from '../components/PubCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useNearbyVenues, type DecoratedVenue } from '../hooks/useNearbyVenues';
import { useFavorites } from '../state/FavoritesProvider';
import { useFilters } from '../state/FiltersProvider';
import { useLocationContext } from '../state/LocationProvider';
import { radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';

/** Home tab: brand header, live status, filters and the nearest-first list. */
export function NearbyScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const { status, venues, totalCount, refreshing, refresh, isFallback } = useNearbyVenues();
  const { status: locationStatus, canAskAgain, requestPermission } = useLocationContext();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { activeCount, clearFilters } = useFilters();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const renderItem = useCallback(
    ({ item, index }: { item: DecoratedVenue; index: number }) => (
      <PubCard
        venue={item}
        highlightNearest={index === 0}
        favorite={isFavorite(item.id)}
        onToggleFavorite={() => toggleFavorite(item)}
        onPress={() => navigation.navigate('PubDetail', { venueId: item.id })}
      />
    ),
    [navigation, isFavorite, toggleFavorite],
  );

  const header = (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={[styles.brandBubble, { backgroundColor: theme.colors.accentSoft }]}>
          <Ionicons name="beer" size={18} color={theme.colors.accent} />
        </View>
        <AppText variant="bodyStrong">
          Nearest
          <AppText variant="bodyStrong" color={theme.colors.accent}>
            Pub
          </AppText>
        </AppText>
      </View>

      <AppText variant="display" style={styles.title}>
        {t('nearby.title')}
      </AppText>

      <View style={styles.subtitleRow}>
        <AppText variant="caption" style={styles.subtitleText}>
          {status === 'ready'
            ? t('nearby.subtitle', { count: venues.length })
            : locationStatus === 'loading'
              ? t('nearby.locating')
              : t('nearby.searching')}
        </AppText>
        {status === 'ready' ? <LiveDot /> : null}
      </View>

      <FilterBar onOpenSheet={() => setFilterSheetOpen(true)} />

      {locationStatus === 'denied' ? (
        <Banner
          tone="danger"
          icon="location-outline"
          message={t('nearby.deniedBanner')}
          actionLabel={canAskAgain ? t('nearby.grantButton') : t('common.openSettings')}
          onAction={() => {
            if (canAskAgain) {
              void requestPermission();
            } else {
              void Linking.openSettings();
            }
          }}
        />
      ) : isFallback && locationStatus !== 'loading' ? (
        <Banner tone="warning" icon="navigate-outline" message={t('nearby.fallbackBanner')} />
      ) : null}
    </View>
  );

  const showSkeletons = status === 'loading' || status === 'idle';
  const filteredOut = !showSkeletons && venues.length === 0 && totalCount > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={showSkeletons ? [] : venues}
        keyExtractor={(venue) => venue.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={
          showSkeletons ? (
            <View style={styles.skeletons}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : filteredOut ? (
            <EmptyState
              icon="funnel-outline"
              title={t('filters.emptyTitle')}
              body={t('filters.emptyBody')}
              actionLabel={activeCount > 0 ? t('filters.clear') : undefined}
              onAction={activeCount > 0 ? clearFilters : undefined}
            />
          ) : (
            <EmptyState
              title={t('nearby.emptyTitle')}
              body={t('nearby.emptyBody')}
              actionLabel={t('common.retry')}
              onAction={() => void refresh()}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: tabBarHeight + spacing.xl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
            progressViewOffset={insets.top}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <FilterSheet visible={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandBubble: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.xs,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  subtitleText: {
    flexShrink: 1,
  },
  skeletons: {
    gap: spacing.md,
  },
});
