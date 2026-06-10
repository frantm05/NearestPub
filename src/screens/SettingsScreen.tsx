import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { Card } from '../components/Card';
import { SegmentedControl, type SegmentOption } from '../components/SegmentedControl';
import { ThemePicker } from '../components/ThemePicker';
import { usePubs } from '../state/PubsProvider';
import { useSettings } from '../state/SettingsProvider';
import { useToast } from '../state/ToastProvider';
import { radius, spacing } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import type { LanguagePreference } from '../types/models';

export function SettingsScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { settings, setLanguagePreference } = useSettings();
  const { resetCommunityEdits } = usePubs();
  const { showToast } = useToast();

  const languageOptions: SegmentOption<LanguagePreference>[] = [
    { value: 'system', label: t('settings.langSystem'), icon: 'globe-outline' },
    { value: 'cs', label: t('settings.langCs') },
    { value: 'en', label: t('settings.langEn') },
  ];

  const confirmReset = () => {
    Alert.alert(t('settings.resetConfirmTitle'), t('settings.resetEditsBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.resetEdits'),
        style: 'destructive',
        onPress: () => {
          void resetCommunityEdits().then(() =>
            showToast({ message: t('settings.resetDone'), tone: 'success' }),
          );
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingBottom: tabBarHeight + spacing.xl,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="display">{t('settings.title')}</AppText>

      <Card style={styles.section}>
        <AppText variant="micro" style={styles.sectionLabel}>
          {t('settings.appearance').toUpperCase()}
        </AppText>
        <ThemePicker />
      </Card>

      <Card style={styles.section}>
        <AppText variant="micro" style={styles.sectionLabel}>
          {t('settings.language').toUpperCase()}
        </AppText>
        <SegmentedControl
          options={languageOptions}
          value={settings.language}
          onChange={setLanguagePreference}
        />
      </Card>

      <Card style={styles.section}>
        <AppText variant="micro" style={styles.sectionLabel}>
          {t('settings.dataSection').toUpperCase()}
        </AppText>
        <AppText variant="caption">{t('settings.resetEditsBody')}</AppText>
        <AppButton
          label={t('settings.resetEdits')}
          onPress={confirmReset}
          variant="dangerGhost"
          icon="refresh-outline"
        />
      </Card>

      <Card style={styles.aboutCard}>
        <View style={[styles.aboutIcon, { backgroundColor: theme.colors.accentSoft }]}>
          <Ionicons name="beer" size={30} color={theme.colors.accent} />
        </View>
        <AppText variant="heading">{t('common.appName')}</AppText>
        <AppText variant="caption">
          {t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
        </AppText>
        <AppText variant="body" color={theme.colors.textSecondary} center style={styles.aboutBody}>
          {t('settings.aboutBody')}
        </AppText>
        <AppText variant="caption" center>
          {t('settings.madeWith')}
        </AppText>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    letterSpacing: 1.2,
  },
  aboutCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  aboutIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  aboutBody: {
    marginTop: spacing.xs,
  },
});
