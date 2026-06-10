import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { BEER_CATALOG, type CatalogBeer } from '../services/czechData';
import { cardShadow, radius, spacing, typography } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import { parsePriceInput, PRICE_LIMITS } from '../utils/format';
import type { Venue } from '../types/models';

interface AddBeerModalProps {
  visible: boolean;
  venue: Venue;
  onCancel: () => void;
  onAdd: (catalogBeerId: string, priceCzk: number) => void;
}

/** Two-step sheet: pick a catalog beer not yet on tap, set its price, done. */
export function AddBeerModal({ visible, venue, onCancel, onAdd }: AddBeerModalProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');

  const available = useMemo(() => {
    const onTap = new Set(venue.tapBeers.map((beer) => beer.catalogId));
    return BEER_CATALOG.filter((beer) => !onTap.has(beer.id));
  }, [venue.tapBeers]);

  useEffect(() => {
    if (visible) {
      setSelectedId(null);
      setPriceInput('');
    }
  }, [visible]);

  const selected = available.find((beer) => beer.id === selectedId) ?? null;
  const parsed = parsePriceInput(priceInput);
  const isValid =
    selected !== null &&
    parsed !== null &&
    parsed >= PRICE_LIMITS.min &&
    parsed <= PRICE_LIMITS.max;

  const handleSelect = (beer: CatalogBeer) => {
    setSelectedId(beer.id);
    setPriceInput(String(beer.basePriceCzk));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]} onPress={onCancel}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.avoider}
          pointerEvents="box-none"
        >
          <Pressable
            style={[
              styles.sheet,
              cardShadow(theme),
              { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
            ]}
            onPress={() => undefined}
          >
            <AppText variant="title">{t('addBeer.title')}</AppText>
            <AppText variant="caption">{t('addBeer.subtitle')}</AppText>

            {available.length === 0 ? (
              <AppText variant="body" color={theme.colors.textMuted} style={styles.empty}>
                {t('addBeer.empty')}
              </AppText>
            ) : (
              <FlatList
                data={available}
                keyExtractor={(beer) => beer.id}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <Pressable
                      onPress={() => handleSelect(item)}
                      style={({ pressed }) => [
                        styles.beerRow,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.accentSoft
                            : pressed
                              ? theme.colors.surfacePressed
                              : 'transparent',
                          borderColor: isSelected ? theme.colors.accent : 'transparent',
                        },
                      ]}
                    >
                      <View style={styles.beerInfo}>
                        <AppText variant="bodyStrong" numberOfLines={1}>
                          {item.name}
                        </AppText>
                        <AppText variant="caption" numberOfLines={1}>
                          {item.brewery} • {t(`beerStyle.${item.style}`)}
                        </AppText>
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.accent} />
                      ) : (
                        <AppText variant="caption">
                          {t('common.priceCzk', { value: item.basePriceCzk })}
                        </AppText>
                      )}
                    </Pressable>
                  );
                }}
              />
            )}

            {selected ? (
              <View style={styles.priceRow}>
                <AppText variant="label" style={styles.priceLabel}>
                  {t('addBeer.priceLabel')}
                </AppText>
                <TextInput
                  value={priceInput}
                  onChangeText={(text) => setPriceInput(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={3}
                  selectTextOnFocus
                  style={[
                    typography.heading,
                    styles.priceInput,
                    {
                      color: theme.colors.text,
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                />
              </View>
            ) : null}

            <View style={styles.actions}>
              <AppButton
                label={t('common.cancel')}
                onPress={onCancel}
                variant="ghost"
                style={styles.actionButton}
              />
              <AppButton
                label={t('addBeer.cta')}
                onPress={() => {
                  if (selected && parsed !== null) onAdd(selected.id, parsed);
                }}
                disabled={!isValid}
                icon="beer"
                style={styles.actionButton}
              />
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  avoider: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '78%',
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  list: {
    marginVertical: spacing.sm,
    flexGrow: 0,
  },
  beerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  beerInfo: {
    flex: 1,
    gap: 1,
  },
  empty: {
    paddingVertical: spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  priceLabel: {
    flex: 1,
  },
  priceInput: {
    width: 110,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
});
