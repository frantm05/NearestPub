import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { VenueMarker } from '../components/VenueMarker';
import { useVenue } from '../hooks/useNearbyVenues';
import { useRasterWarmup } from '../hooks/useRasterWarmup';
import { useWalkingRoute } from '../hooks/useWalkingRoute';
import { useLocationContext } from '../state/LocationProvider';
import { darkMapStyle } from '../theme/mapStyle';
import { cardShadow, radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import { openExternalWalkingDirections } from '../utils/externalNav';
import { formatDistance } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';

const ARRIVAL_THRESHOLD_M = 40;

/** Full-bleed map with the mock walking route, live stats and re-routing. */
export function WalkRouteScreen() {
  const { theme, scheme } = useAppTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'WalkRoute'>>();

  const venue = useVenue(params.venueId);
  const { effectiveCoords, isFallback } = useLocationContext();

  // The venue can vanish if the community empties its tap list — leave calmly.
  useEffect(() => {
    if (!venue) navigation.goBack();
  }, [venue, navigation]);

  const destination = venue?.coordinate ?? effectiveCoords;
  const { route, status, refetching, retry } = useWalkingRoute(effectiveCoords, destination);

  const mapRef = useRef<MapView>(null);
  const fittedRef = useRef(false);
  const markerTracking = useRasterWarmup();

  useEffect(() => {
    if (!route || fittedRef.current) return;
    fittedRef.current = true;
    mapRef.current?.fitToCoordinates(route.points, {
      edgePadding: { top: 110, right: 60, bottom: 240, left: 60 },
      animated: true,
    });
  }, [route]);

  if (!venue) return null;

  const arrived = venue.distanceMeters <= ARRIVAL_THRESHOLD_M;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: (effectiveCoords.latitude + destination.latitude) / 2,
          longitude: (effectiveCoords.longitude + destination.longitude) / 2,
          latitudeDelta: Math.max(0.008, Math.abs(effectiveCoords.latitude - destination.latitude) * 2.6),
          longitudeDelta: Math.max(0.008, Math.abs(effectiveCoords.longitude - destination.longitude) * 2.6),
        }}
        customMapStyle={scheme === 'dark' ? darkMapStyle : []}
        userInterfaceStyle={scheme}
        showsUserLocation={!isFallback}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {route ? (
          <>
            {/* Outline + gold core = premium route stroke */}
            <Polyline
              coordinates={route.points}
              strokeWidth={8}
              strokeColor={scheme === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(122,90,46,0.35)'}
            />
            <Polyline
              coordinates={route.points}
              strokeWidth={4.5}
              strokeColor={theme.colors.accent}
            />
          </>
        ) : null}
        {isFallback ? (
          <Marker coordinate={effectiveCoords} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.originDot, { borderColor: theme.colors.surface, backgroundColor: theme.colors.info }]} />
          </Marker>
        ) : null}
        <Marker coordinate={venue.coordinate} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={markerTracking}>
          <VenueMarker
            label={t('common.priceCzk', { value: venue.cheapestPriceCzk })}
            selected
            tier="full"
            type={venue.type}
          />
        </Marker>
      </MapView>

      {/* Back chip */}
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.backChip,
          cardShadow(theme),
          {
            top: insets.top + spacing.sm,
            backgroundColor: pressed ? theme.colors.surfacePressed : theme.colors.surface,
            borderColor: theme.colors.hairline,
          },
        ]}
      >
        <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
      </Pressable>

      {/* Re-routing chip */}
      {refetching ? (
        <View
          style={[
            styles.reroutingChip,
            cardShadow(theme),
            {
              top: insets.top + spacing.sm,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.hairline,
            },
          ]}
        >
          <ActivityIndicator size="small" color={theme.colors.accent} />
          <AppText variant="label">{t('route.recalculating')}</AppText>
        </View>
      ) : null}

      {/* Bottom card */}
      <View style={[styles.bottomWrapper, { bottom: insets.bottom + spacing.lg }]}>
        {status === 'error' ? (
          <Card>
            <EmptyState
              icon="cloud-offline-outline"
              title={t('common.errorGeneric')}
              body={t('route.recalculating')}
              actionLabel={t('common.retry')}
              onAction={retry}
            />
          </Card>
        ) : (
          <Card style={styles.bottomCard}>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryIcon, { backgroundColor: theme.colors.accentSoft }]}>
                <Ionicons
                  name={arrived ? 'beer' : 'walk'}
                  size={22}
                  color={theme.colors.accent}
                />
              </View>
              <View style={styles.summaryText}>
                <AppText variant="heading" numberOfLines={1}>
                  {venue.name}
                </AppText>
                {arrived ? (
                  <AppText variant="bodyStrong" color={theme.colors.success}>
                    {t('route.arrived')}
                  </AppText>
                ) : route ? (
                  <AppText variant="caption">
                    {t('route.walkSummary', {
                      distance: formatDistance(route.distanceMeters, i18n.language),
                      minutes: route.durationMinutes,
                    })}
                    {route.source === 'simulated' ? ` • ${t('route.approximate')}` : ''}
                  </AppText>
                ) : (
                  <ActivityIndicator size="small" color={theme.colors.accent} />
                )}
              </View>
            </View>
            <View style={styles.actions}>
              <AppButton
                label={t('route.openCompass')}
                icon="compass"
                onPress={() => navigation.navigate('Compass', { venueId: venue.id })}
                style={styles.actionButton}
              />
              <AppButton
                label={t('detail.openInMaps')}
                variant="ghost"
                icon="map-outline"
                onPress={() => void openExternalWalkingDirections(venue.coordinate, venue.name)}
                style={styles.actionButton}
              />
            </View>
          </Card>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backChip: {
    position: 'absolute',
    left: spacing.lg,
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reroutingChip: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  originDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  bottomWrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
  bottomCard: {
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
