import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

import { themes, type AppTheme } from './palette';
import { useSettings } from '../state/SettingsProvider';
import type { ThemeFamily, ThemeMode, ThemeModePreference } from '../types/models';

interface ThemeContextValue {
  theme: AppTheme;
  /** Coarse light/dark bucket, used for map styling and the status bar. */
  scheme: ThemeMode;
  family: ThemeFamily;
  modePreference: ThemeModePreference;
  setFamily: (family: ThemeFamily) => void;
  setModePreference: (mode: ThemeModePreference) => void;
  navigationTheme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function resolveThemeMode(
  preference: ThemeModePreference,
  systemScheme: 'light' | 'dark' | null | undefined,
): ThemeMode {
  if (preference === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

/** Family × mode → one of the six premium theme configurations. */
export function resolveTheme(
  family: ThemeFamily,
  preference: ThemeModePreference,
  systemScheme: 'light' | 'dark' | null | undefined,
): AppTheme {
  return themes[family][resolveThemeMode(preference, systemScheme)];
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { settings, setThemeFamily, setThemeMode } = useSettings();

  const mode = resolveThemeMode(settings.themeMode, systemScheme);

  const value = useMemo<ThemeContextValue>(() => {
    const theme = themes[settings.themeFamily][mode];
    const base = theme.isDark ? DarkTheme : DefaultTheme;
    return {
      theme,
      scheme: mode,
      family: settings.themeFamily,
      modePreference: settings.themeMode,
      setFamily: setThemeFamily,
      setModePreference: setThemeMode,
      navigationTheme: {
        ...base,
        colors: {
          ...base.colors,
          primary: theme.colors.accent,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.hairline,
          notification: theme.colors.accent,
        },
      },
    };
  }, [settings.themeFamily, settings.themeMode, mode, setThemeFamily, setThemeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
}
