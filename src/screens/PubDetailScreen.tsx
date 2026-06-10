import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AddBeerModal } from '../components/AddBeerModal';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { Badge } from '../components/Badge';
import { BeerRow } from '../components/BeerRow';
import { Card } from '../components/Card';
import { FavoriteHeart } from '../components/FavoriteHeart';
import { PriceEditorModal } from '../components/PriceEditorModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { TypeIcon } from '../components/TypeIcon';
import { useVenue } from '../hooks/useNearbyVenues';
import { useFavorites } from '../state/FavoritesProvider';
import { usePubs } from '../state/PubsProvider';
import { useToast } from '../state/ToastProvider';
import { darkMapStyle } from '../theme/mapStyle';
import { radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import { openExternalWalkingDirections } from '../utils/externalNav';
import { formatDistance, formatHoursRange, formatVolume } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';
import type { TapBeer } from '../types/models';

/** Venue detail: hero info, mini-map, and the crowdsourced tap list. */
export function PubDetailScreen() {
  const { theme, scheme } = useAppTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'PubDetail'>>();

  const venue = useVenue(params.venueId);
  const { voteCorrect, reportPriceChanged, addBeerToTap, removeBeerFromTap } = usePubs();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();

  const [editingBeer, setEditingBeer] = useState<TapBeer | null>(null);
  const [addingBeer, setAddingBeer] = useState(false);

  // If the guard hides this venue (last beer removed), exit gracefully.
  const wasPresentRef = useRef(false);
  useEffect(() => {
    if (venue) {
      wasPresentRef.current = true;
    } else if (wasPresentRef.current) {
      showToast({ message: t('detail.gone'), tone: 'info' });
      navigation.goBack();
    } else {
      navigation.goBack();
    }
  }, [venue, navigation, showToast, t]);

  if (!venue) return null;

  // Snapshot from favorites, outside the loaded surroundings → read-only.
  const readOnly = !venue.isLive;

  const confirmRemove = (beer: TapBeer) => {
    Alert.alert(
      t('detail.removeBeerTitle', { beer: beer.name }),
      t('detail.removeBeerBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            void removeBeerFromTap(venue.id, beer.id).then(() =>
              showToast({ message: t('detail.beerRemoved'), tone: 'success' }),
            );
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title={venue.name}
        subtitle={`${t(`venueType.${venue.type}`)} • ${formatDistance(venue.distanceMeters, i18n.language)}`}
        onBack={() => navigation.goBack()}
        right={
          <FavoriteHeart
            active={isFavorite(venue.id)}
            onToggle={() => toggleFavorite(venue)}
            size={24}
          />
        }
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <Card style={styles.heroCard}>
          <View style={styles.heroTop}>
            <TypeIcon type={venue.type} size={56} />
            <View style={styles.heroInfo}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={15} color={theme.colors.accentStrong} />
                <AppText variant="bodyStrong">{venue.rating.toFixed(1)}</AppText>
                <AppText variant="caption">
                  {t('detail.ratingCount', { count: venue.ratingCount })}
                </AppText>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
                <AppText variant="caption" numberOfLines={1} style={styles.metaText}>
                  {venue.address}
                </AppText>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
                <AppText variant="caption">
                  {formatHoursRange(venue.openingHours)} •{' '}
                  {venue.isOpen
                    ? t('nearby.closesAt', { time: venue.openingHours.closesAt })
                    : t('nearby.opensAt', { time: venue.openingHours.opensAt })}
                </AppText>
              </View>
            </View>
          </View>

          <View style={styles.badges}>
            <Badge
              label={venue.isOpen ? t('nearby.open') : t('nearby.closed')}
              tone={venue.isOpen ? 'success' : 'neutral'}
            />
            {venue.features.map((feature) => (
              <Badge key={feature} label={t(`features.${feature}`)} tone="neutral" />
            ))}
          </View>

          <View style={styles.actions}>
            <AppButton
              label={t('detail.route')}
              icon="navigate"
              onPress={() => navigation.navigate('WalkRoute', { venueId: venue.id })}
              style={styles.actionButton}
            />
            <AppButton
              label={t('detail.compass')}
              icon="compass"
              variant="secondary"
              onPress={() => navigation.navigate('Compass', { venueId: venue.id })}
              style={styles.actionButton}
            />
          </View>
          <AppButton
            label={t('detail.openInMaps')}
            icon="map-outline"
            variant="ghost"
            onPress={() => void openExternalWalkingDirections(venue.coordinate, venue.name)}
          />
        </Card>

        {/* Mini-map → opens the route screen */}
        <Pressable onPress={() => navigation.navigate('WalkRoute', { venueId: venue.id })}>
          <View style={[styles.mapPreview, { borderColor: theme.colors.hairline }]}>
            <MapView
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
              liteMode
              initialRegion={{
                ...venue.coordinate,
                latitudeDelta: 0.006,
                longitudeDelta: 0.006,
              }}
              customMapStyle={scheme === 'dark' ? darkMapStyle : []}
              userInterfaceStyle={scheme}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
            >
              <Marker coordinate={venue.coordinate} pinColor={theme.colors.accent} />
            </MapView>
            <View style={[styles.mapHintChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline }]}>
              <Ionicons name="navigate" size={13} color={theme.colors.accent} />
              <AppText variant="label">{t('detail.route')}</AppText>
            </View>
          </View>
        </Pressable>

        {/* Tap list with crowdsourced verification */}
        <Card style={styles.tapCard}>
          <View style={styles.tapHeader}>
            <AppText variant="title">{t('detail.onTap')}</AppText>
            {!readOnly ? (
              <AppButton
                label={t('detail.addBeer')}
                variant="secondary"
                icon="add"
                onPress={() => setAddingBeer(true)}
              />
            ) : null}
          </View>
          <AppText variant="caption">
            {readOnly ? t('detail.offlineSnapshot') : t('detail.verifyHint')}
          </AppText>

          <View>
            {venue.tapBeers.map((beer) => (
              <BeerRow
                key={beer.id}
                beer={beer}
                readOnly={readOnly}
                onConfirmPrice={() => void voteCorrect(venue.id, beer.id)}
                onReportChanged={() => setEditingBeer(beer)}
                onRemove={() => confirmRemove(beer)}
              />
            ))}
          </View>
        </Card>
      </ScrollView>

      {editingBeer ? (
        <PriceEditorModal
          visible
          beerName={editingBeer.name}
          venueName={venue.name}
          currentPriceCzk={editingBeer.priceCzk}
          volumeLabel={formatVolume(editingBeer.volumeMl, i18n.language)}
          onCancel={() => setEditingBeer(null)}
          onSave={(newPrice) => {
            const beerId = editingBeer.id;
            setEditingBeer(null);
            void reportPriceChanged(venue.id, beerId, newPrice).then(() =>
              showToast({ message: t('detail.priceUpdated'), tone: 'success' }),
            );
          }}
        />
      ) : null}

      <AddBeerModal
        visible={addingBeer}
        venue={venue}
        onCancel={() => setAddingBeer(false)}
        onAdd={(catalogBeerId, price) => {
          setAddingBeer(false);
          void addBeerToTap(venue.id, catalogBeerId, price).then(() =>
            showToast({ message: t('detail.beerAdded'), tone: 'success' }),
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  heroCard: {
    gap: spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  metaText: {
    flexShrink: 1,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  mapPreview: {
    height: 150,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapHintChip: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tapCard: {
    gap: spacing.sm,
  },
  tapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
