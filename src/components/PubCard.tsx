import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AppText } from './AppText';
import { Badge } from './Badge';
import { Card } from './Card';
import { FavoriteHeart } from './FavoriteHeart';
import { TypeIcon } from './TypeIcon';
import { spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import { formatDistance } from '../utils/format';
import type { DecoratedVenue } from '../hooks/useNearbyVenues';

interface PubCardProps {
  venue: DecoratedVenue;
  onPress: () => void;
  highlightNearest?: boolean;
  favorite?: boolean;
  onToggleFavorite?: () => void;
}

export function PubCard({
  venue,
  onPress,
  highlightNearest = false,
  favorite = false,
  onToggleFavorite,
}: PubCardProps) {
  const { theme } = useAppTheme();
  const { t, i18n } = useTranslation();

  return (
    <Card
      onPress={onPress}
      style={highlightNearest ? { borderColor: theme.colors.accent, borderWidth: 1.5 } : undefined}
    >
      <View style={styles.row}>
        <TypeIcon type={venue.type} />
        <View style={styles.middle}>
          <View style={styles.nameRow}>
            <AppText variant="heading" numberOfLines={1} style={styles.name}>
              {venue.name}
            </AppText>
            {venue.features.includes('tankBeer') ? (
              <Ionicons name="water" size={14} color={theme.colors.accentStrong} />
            ) : null}
            {onToggleFavorite ? (
              <View style={styles.heart}>
                <FavoriteHeart active={favorite} onToggle={onToggleFavorite} size={18} />
              </View>
            ) : null}
          </View>
          <AppText variant="caption" numberOfLines={1}>
            {t(`venueType.${venue.type}`)} • {venue.address}
          </AppText>
          <View style={styles.badges}>
            {highlightNearest ? (
              <Badge label={t('nearby.nearestBadge')} tone="accent" icon="flash" />
            ) : null}
            <Badge
              label={venue.isOpen ? t('nearby.open') : t('nearby.closed')}
              tone={venue.isOpen ? 'success' : 'neutral'}
            />
            <Badge
              label={t('nearby.beersOnTap', { count: venue.tapBeers.length })}
              tone="accent"
              icon="beer"
            />
          </View>
        </View>
        <View style={styles.right}>
          <AppText variant="heading" color={theme.colors.accent}>
            {formatDistance(venue.distanceMeters, i18n.language)}
          </AppText>
          {venue.walkMinutes <= 120 ? (
            <AppText variant="caption">
              {t('common.walkMinutes', { count: venue.walkMinutes })}
            </AppText>
          ) : null}
          <AppText variant="caption" color={theme.colors.textSecondary}>
            {t('nearby.fromPrice', {
              price: t('common.priceCzk', { value: venue.cheapestPriceCzk }),
            })}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  middle: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  name: {
    flexShrink: 1,
  },
  heart: {
    marginLeft: 'auto',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
