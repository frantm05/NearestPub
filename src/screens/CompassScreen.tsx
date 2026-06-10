import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { Banner } from '../components/Banner';
import { Card } from '../components/Card';
import { CompassDial } from '../components/CompassDial';
import { ScreenHeader } from '../components/ScreenHeader';
import { useHeading } from '../hooks/useHeading';
import { useVenue } from '../hooks/useNearbyVenues';
import { radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import { formatDistance } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';

const ARRIVAL_THRESHOLD_M = 40;

/** Live hardware compass pointing straight at the chosen pub. */
export function CompassScreen() {
  const { theme } = useAppTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Compass'>>();
  const isFocused = useIsFocused();

  useKeepAwake();

  const venue = useVenue(params.venueId);
  const { heading, lowAccuracy, unavailable } = useHeading(isFocused);

  useEffect(() => {
    if (!venue) navigation.goBack();
  }, [venue, navigation]);

  const arrived = venue ? venue.distanceMeters <= ARRIVAL_THRESHOLD_M : false;
  const celebratedRef = useRef(false);
  useEffect(() => {
    if (arrived && !celebratedRef.current) {
      celebratedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    }
  }, [arrived]);

  if (!venue) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title={t('compass.title')}
        subtitle={venue.name}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.body}>
        {unavailable ? (
          <View style={styles.bannerWrapper}>
            <Banner tone="info" icon="compass-outline" message={t('compass.unavailable')} />
          </View>
        ) : lowAccuracy ? (
          <View style={styles.bannerWrapper}>
            <Banner tone="warning" icon="sync-outline" message={t('compass.lowAccuracy')} />
          </View>
        ) : null}

        {arrived ? (
          <View style={styles.arrival}>
            <View style={[styles.arrivalBubble, { backgroundColor: theme.colors.successSoft }]}>
              <Ionicons name="beer" size={64} color={theme.colors.success} />
            </View>
            <AppText variant="title" center>
              {t('compass.arrived')}
            </AppText>
          </View>
        ) : (
          <>
            <CompassDial headingDeg={unavailable ? null : heading} bearingDeg={venue.bearingDeg}>
              <AppText variant="title" color={theme.colors.accent}>
                {formatDistance(venue.distanceMeters, i18n.language)}
              </AppText>
              <AppText variant="caption" center>
                {t('common.walkMinutes', { count: venue.walkMinutes })}
              </AppText>
            </CompassDial>
            <AppText variant="caption" center style={styles.hint}>
              {t('compass.pointing')}
            </AppText>
          </>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Card style={styles.footerCard}>
          <View style={styles.footerInfo}>
            <Ionicons name="location" size={16} color={theme.colors.accent} />
            <AppText variant="caption" numberOfLines={1} style={styles.footerAddress}>
              {venue.address}
            </AppText>
          </View>
          <AppButton
            label={t('detail.route')}
            variant="secondary"
            icon="navigate"
            onPress={() => navigation.navigate('WalkRoute', { venueId: venue.id })}
          />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  bannerWrapper: {
    alignSelf: 'stretch',
  },
  hint: {
    marginTop: -spacing.sm,
  },
  arrival: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  arrivalBubble: {
    width: 140,
    height: 140,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
  },
  footerCard: {
    gap: spacing.md,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerAddress: {
    flexShrink: 1,
  },
});
