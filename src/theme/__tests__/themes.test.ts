import { themes } from '../palette';
import { resolveTheme, resolveThemeMode } from '../ThemeProvider';
import type { ThemeFamily, ThemeMode } from '../../types/models';

const FAMILIES: ThemeFamily[] = ['crispPilsner', 'amberLager', 'darkStout'];
const MODES: ThemeMode[] = ['light', 'dark'];

describe('premium theme families — 3 × light/dark', () => {
  it('ships exactly six distinct theme configurations', () => {
    const backgrounds = new Set<string>();
    const accents = new Set<string>();
    for (const family of FAMILIES) {
      for (const mode of MODES) {
        const variant = themes[family][mode];
        expect(variant.family).toBe(family);
        expect(variant.mode).toBe(mode);
        expect(variant.isDark).toBe(mode === 'dark');
        backgrounds.add(variant.colors.background);
        accents.add(variant.colors.accent);
      }
    }
    // Every variant must be visually its own thing, not a copy.
    expect(backgrounds.size).toBe(6);
    expect(accents.size).toBe(6);
  });

  it('keeps light variants light and dark variants dark', () => {
    const luminance = (hex: string) => {
      const value = parseInt(hex.slice(1), 16);
      return ((value >> 16) & 0xff) + ((value >> 8) & 0xff) + (value & 0xff);
    };
    for (const family of FAMILIES) {
      expect(luminance(themes[family].light.colors.background)).toBeGreaterThan(380);
      expect(luminance(themes[family].dark.colors.background)).toBeLessThan(160);
    }
  });
});

describe('theme resolution', () => {
  it('follows the OS appearance when the mode preference is "system"', () => {
    expect(resolveThemeMode('system', 'dark')).toBe('dark');
    expect(resolveThemeMode('system', 'light')).toBe('light');
    expect(resolveThemeMode('system', null)).toBe('light');
  });

  it('pins the mode when explicitly chosen, regardless of the OS', () => {
    expect(resolveThemeMode('light', 'dark')).toBe('light');
    expect(resolveThemeMode('dark', 'light')).toBe('dark');
  });

  it('resolves family × mode to the matching variant', () => {
    expect(resolveTheme('amberLager', 'system', 'dark')).toBe(themes.amberLager.dark);
    expect(resolveTheme('darkStout', 'light', 'dark')).toBe(themes.darkStout.light);
    expect(resolveTheme('crispPilsner', 'dark', 'light')).toBe(themes.crispPilsner.dark);
  });
});
