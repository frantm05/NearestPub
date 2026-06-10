import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '../components/AppText';
import { EmptyState } from '../components/EmptyState';
import { PubCard } from '../components/PubCard';
import { decorateVenue, type DecoratedVenue } from '../hooks/useNearbyVenues';
import { useFavorites } from '../state/FavoritesProvider';
import { useLocationContext } from '../state/LocationProvider';
import { spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';

/** Saved pubs, openable from anywhere — even far outside the loaded area. */
export function FavoritesScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const { favoritesList, toggleFavorite } = useFavorites();
  const { effectiveCoords } = useLocationContext();

  const venues = useMemo(() => {
    const now = new Date();
    return favoritesList
      .map((favorite) => decorateVenue(favorite.venue, effectiveCoords, now))
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [favoritesList, effectiveCoords]);

  const renderItem = useCallback(
    ({ item }: { item: DecoratedVenue }) => (
      <PubCard
        venue={item}
        favorite
        onToggleFavorite={() => toggleFavorite(item)}
        onPress={() => navigation.navigate('PubDetail', { venueId: item.id })}
      />
    ),
    [navigation, toggleFavorite],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={venues}
        keyExtractor={(venue) => venue.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="display">{t('favorites.title')}</AppText>
            <AppText variant="caption">
              {t('favorites.subtitle', { count: venues.length })}
            </AppText>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title={t('favorites.emptyTitle')}
            body={t('favorites.emptyBody')}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.lg,
          paddingBottom: tabBarHeight + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
});
