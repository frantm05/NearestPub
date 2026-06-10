import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { cardShadow, radius, spacing, typography } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import { parsePriceInput, PRICE_LIMITS } from '../utils/format';

interface PriceEditorModalProps {
  visible: boolean;
  beerName: string;
  venueName: string;
  currentPriceCzk: number;
  volumeLabel: string;
  onCancel: () => void;
  onSave: (newPriceCzk: number) => void;
}

const QUICK_ADJUSTMENTS = [-5, -1, +1, +5] as const;

/** Centered modal for correcting a beer price, with ±1/±5 quick chips. */
export function PriceEditorModal({
  visible,
  beerName,
  venueName,
  currentPriceCzk,
  volumeLabel,
  onCancel,
  onSave,
}: PriceEditorModalProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const [input, setInput] = useState(String(currentPriceCzk));
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (visible) {
      setInput(String(currentPriceCzk));
      setShowValidation(false);
    }
  }, [visible, currentPriceCzk]);

  const parsed = parsePriceInput(input);
  const isValid =
    parsed !== null && parsed >= PRICE_LIMITS.min && parsed <= PRICE_LIMITS.max;

  const adjust = (delta: number) => {
    const base = parsed ?? currentPriceCzk;
    const next = Math.min(PRICE_LIMITS.max, Math.max(PRICE_LIMITS.min, base + delta));
    setInput(String(next));
    setShowValidation(false);
  };

  const handleSave = () => {
    if (!isValid || parsed === null) {
      setShowValidation(true);
      return;
    }
    onSave(parsed);
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
            <AppText variant="title">{t('priceEditor.title')}</AppText>
            <AppText variant="caption">
              {t('priceEditor.subtitle', { beer: beerName, venue: venueName })}
            </AppText>
            <AppText variant="caption" color={theme.colors.textMuted}>
              {t('priceEditor.current', {
                price: t('common.priceCzk', { value: currentPriceCzk }),
              })}
            </AppText>

            <AppText variant="label" style={styles.inputLabel}>
              {t('priceEditor.inputLabel', { volume: volumeLabel })}
            </AppText>
            <TextInput
              value={input}
              onChangeText={(text) => {
                setInput(text.replace(/[^0-9]/g, ''));
                setShowValidation(false);
              }}
              keyboardType="number-pad"
              maxLength={3}
              autoFocus
              selectTextOnFocus
              style={[
                typography.title,
                styles.input,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surface,
                  borderColor: showValidation && !isValid ? theme.colors.danger : theme.colors.border,
                },
              ]}
            />

            <View style={styles.chips}>
              {QUICK_ADJUSTMENTS.map((delta) => (
                <Pressable
                  key={delta}
                  onPress={() => adjust(delta)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: theme.colors.accentSoft,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <AppText variant="label" color={theme.colors.accent}>
                    {delta > 0 ? `+${delta}` : delta}
                  </AppText>
                </Pressable>
              ))}
            </View>

            {showValidation && !isValid ? (
              <AppText variant="caption" color={theme.colors.danger}>
                {t('priceEditor.validation', {
                  min: PRICE_LIMITS.min,
                  max: PRICE_LIMITS.max,
                })}
              </AppText>
            ) : null}

            <View style={styles.actions}>
              <AppButton
                label={t('common.cancel')}
                onPress={onCancel}
                variant="ghost"
                style={styles.actionButton}
              />
              <AppButton
                label={t('priceEditor.saveCta')}
                onPress={handleSave}
                disabled={!isValid}
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
    maxWidth: 380,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  inputLabel: {
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
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
