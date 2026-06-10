import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import i18n, { resolveLanguage } from '../i18n';
import { loadJson, saveJson, STORAGE_KEYS } from '../services/storage';
import type {
  AppSettings,
  LanguagePreference,
  ThemeFamily,
  ThemeMode,
  ThemeModePreference,
} from '../types/models';

const DEFAULT_SETTINGS: AppSettings = {
  themeFamily: 'crispPilsner',
  themeMode: 'system',
  language: 'system',
};

const VALID_FAMILIES: readonly ThemeFamily[] = ['crispPilsner', 'amberLager', 'darkStout'];
const VALID_MODES: readonly ThemeModePreference[] = ['system', 'light', 'dark'];

/**
 * Migrates every historical settings shape to family × mode:
 *  - v1 stored `theme: 'light' | 'dark'`;
 *  - v2 stored `theme: 'system' | <family name>` (a flat premium theme);
 *  - v3 stores `themeFamily` + `themeMode` natively.
 */
function sanitizeThemeSettings(stored: Record<string, unknown>): {
  themeFamily: ThemeFamily;
  themeMode: ThemeModePreference;
} {
  if (VALID_FAMILIES.includes(stored.themeFamily as ThemeFamily)) {
    return {
      themeFamily: stored.themeFamily as ThemeFamily,
      themeMode: VALID_MODES.includes(stored.themeMode as ThemeModePreference)
        ? (stored.themeMode as ThemeModePreference)
        : 'system',
    };
  }
  const legacy = stored.theme;
  if (legacy === 'light') return { themeFamily: 'crispPilsner', themeMode: 'light' };
  if (legacy === 'dark') return { themeFamily: 'darkStout', themeMode: 'dark' };
  if (VALID_FAMILIES.includes(legacy as ThemeFamily)) {
    // Flat premium themes had one canonical appearance each.
    const mode: ThemeMode = legacy === 'darkStout' ? 'dark' : 'light';
    return { themeFamily: legacy as ThemeFamily, themeMode: mode };
  }
  return { themeFamily: DEFAULT_SETTINGS.themeFamily, themeMode: DEFAULT_SETTINGS.themeMode };
}

interface SettingsContextValue {
  settings: AppSettings;
  hydrated: boolean;
  setThemeFamily: (family: ThemeFamily) => void;
  setThemeMode: (mode: ThemeModePreference) => void;
  setLanguagePreference: (preference: LanguagePreference) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    void loadJson<Record<string, unknown>>(STORAGE_KEYS.settings).then((stored) => {
      if (!mountedRef.current) return;
      if (stored) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...sanitizeThemeSettings(stored),
          language: (['system', 'cs', 'en'] as const).includes(
            stored.language as LanguagePreference,
          )
            ? (stored.language as LanguagePreference)
            : 'system',
        });
      }
      setHydrated(true);
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Keep i18next in sync with the language preference (and hydration).
  useEffect(() => {
    const target = resolveLanguage(settings.language);
    if (i18n.language !== target) {
      void i18n.changeLanguage(target);
    }
  }, [settings.language, hydrated]);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      void saveJson(STORAGE_KEYS.settings, next);
      return next;
    });
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      hydrated,
      setThemeFamily: (themeFamily) => update({ themeFamily }),
      setThemeMode: (themeMode) => update({ themeMode }),
      setLanguagePreference: (language) => update({ language }),
    }),
    [settings, hydrated, update],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
