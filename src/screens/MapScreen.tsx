import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { FavoriteHeart } from '../components/FavoriteHeart';
import { FilterSheet } from '../components/FilterSheet';
import { TypeIcon } from '../components/TypeIcon';
import { VenueMarker, type MarkerTier } from '../components/VenueMarker';
import { useNearbyVenues, type DecoratedVenue } from '../hooks/useNearbyVenues';
import { useRasterWarmup } from '../hooks/useRasterWarmup';
import { useFavorites } from '../state/FavoritesProvider';
import { useFilters } from '../state/FiltersProvider';
import { useLocationContext } from '../state/LocationProvider';
import { usePubs } from '../state/PubsProvider';
import { haversineMeters } from '../services/geo';
import { darkMapStyle } from '../theme/mapStyle';
import { cardShadow, radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import { formatDistance } from '../utils/format';
import type { LatLng, LatLngBounds } from '../types/models';

const INITIAL_DELTA = 0.018;

/** Marker detail by zoom: price pills close up, glyph bubbles mid, dots far. */
function markerTier(region: Region): MarkerTier {
  const zoom = Math.log2(360 / Math.max(region.longitudeDelta, 0.0005));
  if (zoom >= 13.8) return 'full';
  if (zoom >= 12.3) return 'compact';
  return 'dot';
}

function regionCenter(region: Region): LatLng {
  return { latitude: region.latitude, longitude: region.longitude };
}

/**
 * The visible bounding box of a region — what "Search this area" hands to the
 * data layer. Always derived from the latest `onRegionChangeComplete` payload.
 */
function boundsFromRegion(region: Region): LatLngBounds {
  return {
    southWest: {
      latitude: region.latitude - region.latitudeDelta / 2,
      longitude: region.longitude - region.longitudeDelta / 2,
    },
    northEast: {
      latitude: region.latitude + region.latitudeDelta / 2,
      longitude: region.longitude + region.longitudeDelta / 2,
    },
  };
}

/** Approximate visible radius of the current viewport, in meters. */
function regionRadiusM(region: Region): number {
  return (
    Math.max(region.latitudeDelta * 111320, region.longitudeDelta * 71500) / 2
  );
}

interface VenuePinMarkerProps {
  venue: DecoratedVenue;
  tier: MarkerTier;
  selected: boolean;
  label: string;
  onSelect: (venueId: string) => void;
}

/**
 * One venue pin. Each marker owns its rasterization warm-up: it tracks view
 * changes briefly after (re)mount so the snapshot is taken only once the
 * pin's text has laid out, then freezes for map-pan performance.
 */
function VenuePinMarker({ venue, tier, selected, label, onSelect }: VenuePinMarkerProps) {
  const tracking = useRasterWarmup();
  return (
    <Marker
      coordinate={venue.coordinate}
      anchor={tier === 'dot' ? { x: 0.5, y: 0.5 } : { x: 0.5, y: 1 }}
      tracksViewChanges={tracking}
      onPress={(event) => {
        event.stopPropagation();
        onSelect(venue.id);
      }}
    >
      <VenueMarker label={label} selected={selected} tier={tier} />
    </Marker>
  );
}

/** Map tab: explorable beer map with area search and zoom-aware markers. */
export function MapScreen() {
  const { theme, scheme } = useAppTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const { venues, status } = useNearbyVenues();
  const { loadedCenter, searchedArea, searchArea, clearAreaSearch } = usePubs();
  const { effectiveCoords, isFallback } = useLocationContext();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { activeCount } = useFilters();

  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [region, setRegion] = useState<Region>({
    ...effectiveCoords,
    latitudeDelta: INITIAL_DELTA,
    longitudeDelta: INITIAL_DELTA,
  });

  const selected = useMemo(
    () => venues.find((venue) => venue.id === selectedId) ?? null,
    [venues, selectedId],
  );

  // When the first REAL fix replaces the fallback, snap the map to the user —
  // part of the location-bias fix: the map must follow reality, not the seed.
  const wasFallbackRef = useRef(isFallback);
  useEffect(() => {
    if (wasFallbackRef.current && !isFallback) {
      mapRef.current?.animateToRegion(
        { ...effectiveCoords, latitudeDelta: INITIAL_DELTA, longitudeDelta: INITIAL_DELTA },
        600,
      );
    }
    wasFallbackRef.current = isFallback;
  }, [isFallback, effectiveCoords]);

  const tier = markerTier(region);
  const visibleRadius = regionRadiusM(region);
  const areaSearching = status === 'loading' && searchedArea !== null;

  // Offer "Search this area" once the viewport has clearly left the loaded zone.
  const showSearchButton =
    !areaSearching &&
    loadedCenter !== null &&
    haversineMeters(regionCenter(region), loadedCenter) >
      Math.max(400, visibleRadius * 0.4);

  const handleSearchArea = () => {
    setSelectedId(null);
    void searchArea(boundsFromRegion(region));
  };

  const recenter = () => {
    clearAreaSearch();
    mapRef.current?.animateToRegion(
      { ...effectiveCoords, latitudeDelta: INITIAL_DELTA, longitudeDelta: INITIAL_DELTA },
      450,
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        customMapStyle={scheme === 'dark' ? darkMapStyle : []}
        userInterfaceStyle={scheme}
        showsUserLocation={!isFallback}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onPress={() => setSelectedId(null)}
      >
        {isFallback ? (
          <Marker coordinate={effectiveCoords} anchor={{ x: 0.5, y: 0.5 }}>
            <View
              style={[
                styles.fallbackDot,
                { borderColor: theme.colors.surface, backgroundColor: theme.colors.info },
              ]}
            />
          </Marker>
        ) : null}
        {venues.map((venue) => {
          const isSelected = venue.id === selectedId;
          return (
            <VenuePinMarker
              // Tier/selection/price in the key force a remount, which re-warms
              // the rasterization window and re-snapshots the pin.
              key={`${venue.id}:${tier}:${isSelected}:${venue.cheapestPriceCzk}`}
              venue={venue}
              tier={tier}
              selected={isSelected}
              label={t('common.priceCzk', { value: venue.cheapestPriceCzk })}
              onSelect={setSelectedId}
            />
          );
        })}
      </MapView>

      {/* Floating title chip */}
      <View
        style={[
          styles.titleChip,
          cardShadow(theme),
          {
            top: insets.top + spacing.sm,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.hairline,
          },
        ]}
      >
        <Ionicons name="beer" size={15} color={theme.colors.accent} />
        <AppText variant="label">{t('map.title')}</AppText>
      </View>

      {/* "Search this area" pill */}
      {showSearchButton || areaSearching ? (
        <Pressable
          onPress={areaSearching ? undefined : handleSearchArea}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.searchPill,
            cardShadow(theme),
            {
              top: insets.top + spacing.sm + 46,
              backgroundColor: pressed
                ? theme.colors.surfacePressed
                : theme.colors.surface,
              borderColor: theme.colors.accent,
            },
          ]}
        >
          {areaSearching ? (
            <ActivityIndicator size="small" color={theme.colors.accent} />
          ) : (
            <Ionicons name="search" size={14} color={theme.colors.accent} />
          )}
          <AppText variant="label" color={theme.colors.accent}>
            {t('map.searchArea')}
          </AppText>
        </Pressable>
      ) : null}

      {/* Filter FAB (badge shows active count) */}
      <Pressable
        onPress={() => setFilterSheetOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('filters.title')}
        style={({ pressed }) => [
          styles.fab,
          cardShadow(theme),
          {
            bottom: tabBarHeight + spacing.lg + 60,
            backgroundColor: pressed ? theme.colors.surfacePressed : theme.colors.surface,
            borderColor: activeCount > 0 ? theme.colors.accent : theme.colors.hairline,
          },
        ]}
      >
        <Ionicons
          name="funnel-outline"
          size={19}
          color={activeCount > 0 ? theme.colors.accent : theme.colors.textSecondary}
        />
        {activeCount > 0 ? (
          <View style={[styles.fabBadge, { backgroundColor: theme.colors.accent }]}>
            <AppText variant="micro" color={theme.colors.onAccent}>
              {activeCount}
            </AppText>
          </View>
        ) : null}
      </Pressable>

      {/* Recenter FAB — hidden while the preview card is open */}
      {!selected ? (
        <Pressable
          onPress={recenter}
          accessibilityRole="button"
          accessibilityLabel={t('map.recenter')}
          style={({ pressed }) => [
            styles.fab,
            cardShadow(theme),
            {
              bottom: tabBarHeight + spacing.lg,
              backgroundColor: pressed ? theme.colors.surfacePressed : theme.colors.surface,
              borderColor: theme.colors.hairline,
            },
          ]}
        >
          <Ionicons name="locate" size={20} color={theme.colors.accent} />
        </Pressable>
      ) : null}

      {/* Selected venue preview */}
      {selected ? (
        <View style={[styles.previewWrapper, { bottom: tabBarHeight + spacing.md }]}>
          <Card elevated style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <TypeIcon type={selected.type} size={40} />
              <View style={styles.previewInfo}>
                <AppText variant="heading" numberOfLines={1}>
                  {selected.name}
                </AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {formatDistance(selected.distanceMeters, i18n.language)} •{' '}
                  {t('common.walkMinutes', { count: selected.walkMinutes })}
                </AppText>
              </View>
              <FavoriteHeart
                active={isFavorite(selected.id)}
                onToggle={() => toggleFavorite(selected)}
                size={20}
              />
              <Pressable onPress={() => setSelectedId(null)} hitSlop={8}>
                <Ionicons name="close" size={20} color={theme.colors.textMuted} />
              </Pressable>
            </View>
            <View style={styles.previewBadges}>
              <Badge
                label={selected.isOpen ? t('nearby.open') : t('nearby.closed')}
                tone={selected.isOpen ? 'success' : 'neutral'}
              />
              <Badge
                label={t('nearby.beersOnTap', { count: selected.tapBeers.length })}
                tone="accent"
                icon="beer"
              />
            </View>
            <View style={styles.previewActions}>
              <AppButton
                label={t('map.detail')}
                variant="ghost"
                onPress={() => navigation.navigate('PubDetail', { venueId: selected.id })}
                style={styles.previewButton}
              />
              <AppButton
                label={t('detail.route')}
                icon="navigate"
                onPress={() => navigation.navigate('WalkRoute', { venueId: selected.id })}
                style={styles.previewButton}
              />
            </View>
          </Card>
        </View>
      ) : null}

      <FilterSheet visible={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleChip: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  searchPill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    borderWidth: 1.2,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  fallbackDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  previewWrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
  previewCard: {
    gap: spacing.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewInfo: {
    flex: 1,
    gap: 1,
  },
  previewBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  previewButton: {
    flex: 1,
  },
});
