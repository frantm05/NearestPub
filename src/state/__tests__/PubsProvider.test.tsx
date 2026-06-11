import React from 'react';
import { act, renderHook } from '@testing-library/react-native';

import { PubsProvider, usePubs } from '../PubsProvider';
import { useLocationContext } from '../LocationProvider';
import type { LatLng, LatLngBounds } from '../../types/models';

jest.mock('../LocationProvider', () => ({ useLocationContext: jest.fn() }));
jest.mock('../ToastProvider', () => {
  const showToast = jest.fn();
  return { useToast: () => ({ showToast }) };
});
jest.mock('react-i18next', () => {
  // Stable `t`, like the real library's memoized one. A fresh function per
  // render would invalidate the provider's load-pipeline callback deps every
  // render, turning each dispatched state update into another load — an
  // unbounded effect loop that exists only in the test environment.
  const t = (key: string) => key;
  return { useTranslation: () => ({ t }) };
});

const mockedUseLocationContext = useLocationContext as jest.Mock;

/** Náměstí Přemysla Otakara II, České Budějovice (Budweis). */
const BUDWEIS: LatLng = { latitude: 48.9745, longitude: 14.4743 };
/** Piazza del Duomo, Milan — far outside the covered country. */
const MILAN: LatLng = { latitude: 45.4642, longitude: 9.19 };

function setLocation(coords: LatLng) {
  mockedUseLocationContext.mockReturnValue({
    status: 'granted',
    coords,
    effectiveCoords: coords,
    isFallback: false,
    canAskAgain: true,
    requestPermission: jest.fn(),
  });
}

function viewportAround(center: LatLng, delta: number): LatLngBounds {
  return {
    southWest: {
      latitude: center.latitude - delta / 2,
      longitude: center.longitude - delta / 2,
    },
    northEast: {
      latitude: center.latitude + delta / 2,
      longitude: center.longitude + delta / 2,
    },
  };
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PubsProvider>{children}</PubsProvider>
);

/**
 * Fast-forwards through the mock API latency (450–900 ms). Sliced into small
 * advances so promise chains can schedule their timers between steps.
 */
async function settle() {
  await act(async () => {
    for (let i = 0; i < 5; i += 1) {
      await jest.advanceTimersByTimeAsync(400);
    }
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('PubsProvider — relocation-aware loading', () => {
  it('relocation reloads around the new position (geofence: nothing leaks to Milan)', async () => {
    setLocation(BUDWEIS);
    const { result, rerender } = renderHook(() => usePubs(), { wrapper });
    await settle();

    expect(result.current.status).toBe('ready');
    expect(result.current.venues.length).toBeGreaterThan(0);

    setLocation(MILAN);
    rerender(undefined);
    await settle();

    expect(result.current.status).toBe('ready');
    expect(result.current.venues).toEqual([]);
  });

  it('relocation drops a pinned area search', async () => {
    setLocation(BUDWEIS);
    const { result, rerender } = renderHook(() => usePubs(), { wrapper });
    await settle();
    expect(result.current.status).toBe('ready');

    act(() => {
      void result.current.searchArea(viewportAround(BUDWEIS, 0.018));
    });
    await settle();

    expect(result.current.searchedArea).not.toBeNull();
    expect(result.current.venues.length).toBeGreaterThan(0);

    setLocation(MILAN);
    rerender(undefined);
    await settle();

    expect(result.current.searchedArea).toBeNull();
    expect(result.current.status).toBe('ready');
    expect(result.current.venues).toEqual([]);
  });

  it('relocation loads in the foreground — stale venues never linger as ready', async () => {
    setLocation(BUDWEIS);
    const { result, rerender } = renderHook(() => usePubs(), { wrapper });
    await settle();
    expect(result.current.status).toBe('ready');
    expect(result.current.venues.length).toBeGreaterThan(0);

    setLocation(MILAN);
    rerender(undefined);
    // Flush effects/microtasks only — the API delay timer must not fire yet.
    await act(async () => {});

    expect(result.current.status).toBe('loading');

    await settle();
    expect(result.current.status).toBe('ready');
    expect(result.current.venues).toEqual([]);
  });
});
