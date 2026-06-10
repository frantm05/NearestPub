import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { AppText } from './AppText';
import { radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import { formatRelativeTime, formatVolume } from '../utils/format';
import type { TapBeer } from '../types/models';

interface BeerRowProps {
  beer: TapBeer;
  onConfirmPrice: () => void;
  onReportChanged: () => void;
  onRemove: () => void;
  /** Hides the verification widgets (favorite snapshots out of range). */
  readOnly?: boolean;
}

/**
 * One beer on tap, with the frictionless crowdsourcing widget: one tap to
 * confirm the price, one tap to start a correction, long-affordance trash to
 * prune the tap list.
 */
export function BeerRow({
  beer,
  onConfirmPrice,
  onReportChanged,
  onRemove,
  readOnly = false,
}: BeerRowProps) {
  const { theme } = useAppTheme();
  const { t, i18n } = useTranslation();
  const [voted, setVoted] = useState(false);

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setVoted(true);
    onConfirmPrice();
  };

  return (
    <View style={[styles.container, { borderColor: theme.colors.hairline }]}>
      <View style={styles.mainRow}>
        <View style={[styles.degreeChip, { backgroundColor: theme.colors.accentSoft }]}>
          <AppText variant="label" color={theme.colors.accent}>
            {beer.degreesPlato}°
          </AppText>
        </View>
        <View style={styles.info}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {beer.name}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            {beer.brewery} • {t(`beerStyle.${beer.style}`)} •{' '}
            {formatVolume(beer.volumeMl, i18n.language)}
          </AppText>
        </View>
        <AppText variant="heading" color={theme.colors.accent}>
          {t('common.priceCzk', { value: beer.priceCzk })}
        </AppText>
      </View>

      <View style={styles.verifyRow}>
        <AppText variant="caption" style={styles.verifiedText} numberOfLines={1}>
          {t('detail.verifiedAgo', { time: formatRelativeTime(beer.lastVerifiedAt, t) })} •{' '}
          {beer.confirmations}×
        </AppText>

        {readOnly ? null : voted ? (
          <View style={[styles.thanksChip, { backgroundColor: theme.colors.successSoft }]}>
            <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
            <AppText variant="label" color={theme.colors.success}>
              {t('detail.thanksVote')}
            </AppText>
          </View>
        ) : (
          <View style={styles.voteButtons}>
            <Pressable
              onPress={handleConfirm}
              hitSlop={4}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.voteChip,
                {
                  backgroundColor: theme.colors.successSoft,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="checkmark" size={14} color={theme.colors.success} />
              <AppText variant="label" color={theme.colors.success}>
                {t('detail.priceCorrect')}
              </AppText>
            </Pressable>
            <Pressable
              onPress={onReportChanged}
              hitSlop={4}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.voteChip,
                {
                  backgroundColor: theme.colors.dangerSoft,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="trending-up" size={14} color={theme.colors.danger} />
              <AppText variant="label" color={theme.colors.danger}>
                {t('detail.priceChanged')}
              </AppText>
            </Pressable>
            <Pressable
              onPress={onRemove}
              hitSlop={4}
              accessibilityRole="button"
              style={({ pressed }) => [styles.trash, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Ionicons name="trash-outline" size={16} color={theme.colors.textMuted} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  degreeChip: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 1,
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  verifiedText: {
    flexShrink: 1,
  },
  voteButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  voteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  thanksChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  trash: {
    padding: spacing.xs,
  },
});
