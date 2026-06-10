import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  FALLBACK_CENTER,
  LocationProvider,
  useLocationContext,
} from '../LocationProvider';

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
  hasServicesEnabledAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Location = require('expo-location') as {
  hasServicesEnabledAsync: jest.Mock;
  requestForegroundPermissionsAsync: jest.Mock;
  getLastKnownPositionAsync: jest.Mock;
  getCurrentPositionAsync: jest.Mock;
  watchPositionAsync: jest.Mock;
};

/** Náměstí Přemysla Otakara II, České Budějovice (Budweis). */
const BUDWEIS = { latitude: 48.9745, longitude: 14.4743 };
/** Old Town Square, Prague — the coordinates the app must NEVER fall back to. */
const PRAGUE = { latitude: 50.0875, longitude: 14.4213 };
/** A "real" device fix far from both fallback candidates. */
const REAL_FIX = { latitude: 49.1951, longitude: 16.6068 }; // Brno

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LocationProvider>{children}</LocationProvider>
);

function mockGrantedWithFix(fix: { latitude: number; longitude: number }) {
  Location.hasServicesEnabledAsync.mockResolvedValue(true);
  Location.requestForegroundPermissionsAsync.mockResolvedValue({
    status: 'granted',
    canAskAgain: true,
  });
  Location.getLastKnownPositionAsync.mockResolvedValue(null);
  Location.getCurrentPositionAsync.mockResolvedValue({ coords: fix });
  Location.watchPositionAsync.mockResolvedValue({ remove: jest.fn() });
}

beforeEach(() => {
  jest.clearAllMocks();
  Location.watchPositionAsync.mockResolvedValue({ remove: jest.fn() });
});

describe('LocationProvider — location resolution', () => {
  it('resolves to the real device coordinates when geolocation succeeds', async () => {
    mockGrantedWithFix(REAL_FIX);

    const { result } = renderHook(() => useLocationContext(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('granted'));
    expect(result.current.coords).toEqual(REAL_FIX);
    expect(result.current.effectiveCoords).toEqual(REAL_FIX);
    expect(result.current.isFallback).toBe(false);
  });

  it('prefers a fresh accurate OS-cached fix over the fallback', async () => {
    mockGrantedWithFix(REAL_FIX);
    Location.getLastKnownPositionAsync.mockResolvedValue({ coords: REAL_FIX });
    Location.getCurrentPositionAsync.mockRejectedValue(new Error('should not be called'));

    const { result } = renderHook(() => useLocationContext(), { wrapper });

    await waitFor(() => expect(result.current.effectiveCoords).toEqual(REAL_FIX));
    expect(result.current.isFallback).toBe(false);
  });

  it('falls back to České Budějovice when permission is denied', async () => {
    Location.hasServicesEnabledAsync.mockResolvedValue(true);
    Location.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'denied',
      canAskAgain: false,
    });

    const { result } = renderHook(() => useLocationContext(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('denied'));
    expect(result.current.coords).toBeNull();
    expect(result.current.isFallback).toBe(true);
    expect(result.current.effectiveCoords).toEqual(BUDWEIS);
  });

  it('falls back to České Budějovice when location services are off', async () => {
    Location.hasServicesEnabledAsync.mockResolvedValue(false);

    const { result } = renderHook(() => useLocationContext(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('unavailable'));
    expect(result.current.effectiveCoords).toEqual(BUDWEIS);
    expect(result.current.isFallback).toBe(true);
  });

  it('falls back to České Budějovice while the first fix fails, never blocking', async () => {
    mockGrantedWithFix(REAL_FIX);
    Location.getCurrentPositionAsync.mockRejectedValue(new Error('gps-unavailable'));

    const { result } = renderHook(() => useLocationContext(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('granted'));
    // No fix yet → fallback coordinates, but the watcher must still be armed.
    expect(result.current.effectiveCoords).toEqual(BUDWEIS);
    expect(result.current.isFallback).toBe(true);
    expect(Location.watchPositionAsync).toHaveBeenCalled();
  });

  it('switches from the fallback to reality when the watcher delivers a fix', async () => {
    let emitFix: ((position: { coords: typeof REAL_FIX }) => void) | undefined;
    mockGrantedWithFix(REAL_FIX);
    Location.getCurrentPositionAsync.mockRejectedValue(new Error('gps-unavailable'));
    Location.watchPositionAsync.mockImplementation(async (_options, callback) => {
      emitFix = callback;
      return { remove: jest.fn() };
    });

    const { result } = renderHook(() => useLocationContext(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('granted'));
    expect(result.current.effectiveCoords).toEqual(BUDWEIS);

    act(() => emitFix?.({ coords: REAL_FIX }));

    await waitFor(() => expect(result.current.effectiveCoords).toEqual(REAL_FIX));
    expect(result.current.isFallback).toBe(false);
  });

  it('NEVER uses Prague as the fallback', async () => {
    Location.hasServicesEnabledAsync.mockResolvedValue(true);
    Location.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'denied',
      canAskAgain: false,
    });

    const { result } = renderHook(() => useLocationContext(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('denied'));
    expect(result.current.effectiveCoords).not.toEqual(PRAGUE);
    // Guard the exported constant too, so a regression cannot sneak in
    // through any consumer of FALLBACK_CENTER.
    expect(FALLBACK_CENTER).toEqual(BUDWEIS);
    expect(FALLBACK_CENTER).not.toEqual(PRAGUE);
    // Belt and braces: the fallback must be nowhere near Prague (>100 km).
    const latDiff = Math.abs(FALLBACK_CENTER.latitude - PRAGUE.latitude);
    expect(latDiff).toBeGreaterThan(0.9);
  });
});
