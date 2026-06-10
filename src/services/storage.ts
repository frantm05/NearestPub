import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Thin, typed, failure-tolerant wrapper around AsyncStorage. Storage problems
 * must never crash the app — every operation degrades to an in-memory no-op.
 */

export const STORAGE_KEYS = {
  settings: '@nearestpub/settings.v1',
  communityEdits: '@nearestpub/community-edits.v1',
  favorites: '@nearestpub/favorites.v1',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export async function loadJson<T>(key: StorageKey): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[storage] failed to load ${key}`, error);
    return null;
  }
}

export async function saveJson(key: StorageKey, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[storage] failed to save ${key}`, error);
  }
}

export async function removeKey(key: StorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`[storage] failed to remove ${key}`, error);
  }
}
