import type { TFunction } from 'i18next';

import type { OpeningHours } from '../types/models';

const CZECH_DECIMAL_LANGUAGE = 'cs';

/** "750 m" below ~1 km, then "1,2 km" (cs) / "1.2 km" (en). */
export function formatDistance(meters: number, language: string): string {
  if (meters < 950) {
    return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  }
  const km = (meters / 1000).toFixed(1);
  const localized = language.startsWith(CZECH_DECIMAL_LANGUAGE) ? km.replace('.', ',') : km;
  return `${localized} km`;
}

/** 500 → "0,5 l" (cs) / "0.5 l" (en). */
export function formatVolume(volumeMl: number, language: string): string {
  const liters = (volumeMl / 1000).toFixed(1);
  const localized = language.startsWith(CZECH_DECIMAL_LANGUAGE)
    ? liters.replace('.', ',')
    : liters;
  return `${localized} l`;
}

export function formatRelativeTime(isoTimestamp: string, t: TFunction): string {
  const elapsedMs = Date.now() - new Date(isoTimestamp).getTime();
  const minutes = Math.floor(elapsedMs / 60000);
  if (minutes < 2) return t('time.justNow');
  if (minutes < 60) return t('time.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time.hoursAgo', { count: hours });
  return t('time.daysAgo', { count: Math.floor(hours / 24) });
}

function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Handles overnight ranges (e.g. a club open 20:00–04:00). */
export function isOpenNow(hours: OpeningHours, now: Date = new Date()): boolean {
  const current = now.getHours() * 60 + now.getMinutes();
  const opens = toMinutes(hours.opensAt);
  const closes = toMinutes(hours.closesAt);
  if (opens === closes) return true; // non-stop
  if (closes < opens) {
    return current >= opens || current < closes;
  }
  return current >= opens && current < closes;
}

export function formatHoursRange(hours: OpeningHours): string {
  return `${hours.opensAt}–${hours.closesAt}`;
}

export const PRICE_LIMITS = { min: 15, max: 250 } as const;

/** Strips everything non-numeric and clamps nothing — validation is the caller's UX. */
export function parsePriceInput(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length === 0) return null;
  return Number.parseInt(digits, 10);
}
