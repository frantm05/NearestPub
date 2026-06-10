import 'intl-pluralrules';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import cs from '../locales/cs.json';
import en from '../locales/en.json';
import type { LanguagePreference } from '../types/models';

export type SupportedLanguage = 'cs' | 'en';

export function deviceLanguage(): SupportedLanguage {
  const code = getLocales()[0]?.languageCode;
  return code === 'cs' || code === 'sk' ? 'cs' : 'en';
}

export function resolveLanguage(preference: LanguagePreference): SupportedLanguage {
  return preference === 'system' ? deviceLanguage() : preference;
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    cs: { translation: cs },
  },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
