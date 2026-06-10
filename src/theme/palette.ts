import type { TextStyle, ViewStyle } from 'react-native';

import type { ThemeFamily, ThemeMode } from '../types/models';

/**
 * Brewing-inspired design tokens — three premium theme families, each with
 * a distinct light AND dark variant (six configurations in total):
 *
 *  - Crisp Pilsner  · light: bright gold on clean near-white, minimalist
 *                   · dark:  golden lager glow over cool midnight slate
 *  - Amber Lager    · light: rich copper accents over warm cream surfaces
 *                   · dark:  ember copper on deep roasted-oak browns
 *  - Dark Stout     · light: "stout foam" — espresso ink on creamy ivory
 *                   · dark:  jet black, creamy white ink, emerald details
 *
 * The mode preference ('system' | 'light' | 'dark') picks the variant
 * within the chosen family.
 */

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfacePressed: string;
  border: string;
  hairline: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentStrong: string;
  onAccent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  overlay: string;
  shadow: string;
}

export interface AppTheme {
  family: ThemeFamily;
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
}

/** A family's light/dark pair. */
export type ThemeVariants = Record<ThemeMode, AppTheme>;

export const themes: Record<ThemeFamily, ThemeVariants> = {
  crispPilsner: {
    light: {
      family: 'crispPilsner',
      mode: 'light',
      isDark: false,
      colors: {
        background: '#FCFBF6',
        surface: '#FFFFFF',
        surfaceElevated: '#FFFEFA',
        surfacePressed: '#F3EFE2',
        border: '#E9E2CE',
        hairline: '#F0EBDC',
        text: '#201A0D',
        textSecondary: '#5C5440',
        textMuted: '#8E866F',
        accent: '#B8890A',
        accentStrong: '#9A7200',
        onAccent: '#FFFDF2',
        accentSoft: 'rgba(184, 137, 10, 0.10)',
        success: '#3E8E4B',
        successSoft: 'rgba(62, 142, 75, 0.12)',
        danger: '#C44536',
        dangerSoft: 'rgba(196, 69, 54, 0.10)',
        info: '#3B6E9E',
        infoSoft: 'rgba(59, 110, 158, 0.10)',
        overlay: 'rgba(32, 26, 13, 0.40)',
        shadow: '#8A7634',
      },
    },
    // Golden lager glow over cool midnight slate — crisp stays crisp at night.
    dark: {
      family: 'crispPilsner',
      mode: 'dark',
      isDark: true,
      colors: {
        background: '#0B0D12',
        surface: '#13161D',
        surfaceElevated: '#1A1E27',
        surfacePressed: '#222734',
        border: '#2E3442',
        hairline: '#1F242F',
        text: '#F1EEE2',
        textSecondary: '#BCB8A8',
        textMuted: '#838073',
        accent: '#E3B23C',
        accentStrong: '#F0C75E',
        onAccent: '#1C1504',
        accentSoft: 'rgba(227, 178, 60, 0.14)',
        success: '#6FBF85',
        successSoft: 'rgba(111, 191, 133, 0.15)',
        danger: '#E06557',
        dangerSoft: 'rgba(224, 101, 87, 0.14)',
        info: '#7FAFD9',
        infoSoft: 'rgba(127, 175, 217, 0.13)',
        overlay: 'rgba(0, 0, 0, 0.62)',
        shadow: '#000000',
      },
    },
  },
  amberLager: {
    light: {
      family: 'amberLager',
      mode: 'light',
      isDark: false,
      colors: {
        background: '#F6EBDB',
        surface: '#FFFAF1',
        surfaceElevated: '#FFFDF6',
        surfacePressed: '#EFE0CA',
        border: '#E2CDAE',
        hairline: '#EBDCC4',
        text: '#36200E',
        textSecondary: '#6B4D31',
        textMuted: '#97805F',
        accent: '#B25C25',
        accentStrong: '#964512',
        onAccent: '#FFF6EA',
        accentSoft: 'rgba(178, 92, 37, 0.13)',
        success: '#47824D',
        successSoft: 'rgba(71, 130, 77, 0.13)',
        danger: '#BD4934',
        dangerSoft: 'rgba(189, 73, 52, 0.11)',
        info: '#58719A',
        infoSoft: 'rgba(88, 113, 154, 0.11)',
        overlay: 'rgba(54, 32, 14, 0.45)',
        shadow: '#8A5A2E',
      },
    },
    // Ember copper on deep roasted-oak browns — the same warmth, after dark.
    dark: {
      family: 'amberLager',
      mode: 'dark',
      isDark: true,
      colors: {
        background: '#150F09',
        surface: '#1E1610',
        surfaceElevated: '#271D14',
        surfacePressed: '#322619',
        border: '#3F2F1E',
        hairline: '#2A2014',
        text: '#F4E9DA',
        textSecondary: '#CDB99F',
        textMuted: '#94816A',
        accent: '#D97E3A',
        accentStrong: '#E89455',
        onAccent: '#211206',
        accentSoft: 'rgba(217, 126, 58, 0.15)',
        success: '#6BAF72',
        successSoft: 'rgba(107, 175, 114, 0.15)',
        danger: '#E0654F',
        dangerSoft: 'rgba(224, 101, 79, 0.14)',
        info: '#8FA8C9',
        infoSoft: 'rgba(143, 168, 201, 0.13)',
        overlay: 'rgba(0, 0, 0, 0.64)',
        shadow: '#000000',
      },
    },
  },
  darkStout: {
    // "Stout foam" — espresso ink on creamy ivory, deep emerald details.
    light: {
      family: 'darkStout',
      mode: 'light',
      isDark: false,
      colors: {
        background: '#F7F3EA',
        surface: '#FFFDF7',
        surfaceElevated: '#FFFFFB',
        surfacePressed: '#ECE5D6',
        border: '#DCD2BD',
        hairline: '#E8E0CE',
        text: '#1F1A14',
        textSecondary: '#56503F',
        textMuted: '#8A8370',
        accent: '#1E7A5E',
        accentStrong: '#136349',
        onAccent: '#F2FBF6',
        accentSoft: 'rgba(30, 122, 94, 0.11)',
        success: '#3E8E4B',
        successSoft: 'rgba(62, 142, 75, 0.12)',
        danger: '#C44536',
        dangerSoft: 'rgba(196, 69, 54, 0.10)',
        info: '#3B6E9E',
        infoSoft: 'rgba(59, 110, 158, 0.10)',
        overlay: 'rgba(31, 26, 20, 0.42)',
        shadow: '#5E5640',
      },
    },
    dark: {
      family: 'darkStout',
      mode: 'dark',
      isDark: true,
      colors: {
        background: '#070605',
        surface: '#100E0C',
        surfaceElevated: '#181512',
        surfacePressed: '#201C18',
        border: '#2C2722',
        hairline: '#1E1A16',
        text: '#F5EFE2',
        textSecondary: '#C9C0AC',
        textMuted: '#8F8775',
        accent: '#34A27D',
        accentStrong: '#4CC096',
        onAccent: '#03120C',
        accentSoft: 'rgba(52, 162, 125, 0.16)',
        success: '#5FBE84',
        successSoft: 'rgba(95, 190, 132, 0.15)',
        danger: '#E06557',
        dangerSoft: 'rgba(224, 101, 87, 0.14)',
        info: '#8FB7D9',
        infoSoft: 'rgba(143, 183, 217, 0.13)',
        overlay: 'rgba(0, 0, 0, 0.66)',
        shadow: '#000000',
      },
    },
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.6 },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** Soft, warm elevation that adapts to the scheme. */
export function cardShadow(theme: AppTheme): ViewStyle {
  return {
    shadowColor: theme.colors.shadow,
    shadowOpacity: theme.isDark ? 0.45 : 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  };
}
