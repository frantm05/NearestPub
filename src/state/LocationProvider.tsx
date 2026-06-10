import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Location from 'expo-location';

import type { LatLng } from '../types/models';

/**
 * Náměstí Přemysla Otakara II, České Budějovice — the simulation fallback
 * used ONLY while no real coordinates exist. Never silently substituted once
 * a genuine fix is available; the watcher below keeps correcting drift.
 */
export const FALLBACK_CENTER: LatLng = { latitude: 48.9745, longitude: 14.4743 };

export type LocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';

interface LocationContextValue {
  status: LocationStatus;
  /** Real device coordinates, or null when unknown. */
  coords: LatLng | null;
  /** Always usable — real coordinates, or the České Budějovice fallback. */
  effectiveCoords: LatLng;
  isFallback: boolean;
  canAskAgain: boolean;
  requestPermission: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

const FIX_TIMEOUT_MS = 10000;
/** Cached fixes older than this are stale — a tram ride away is a lie here. */
const LAST_KNOWN_MAX_AGE_MS = 60000;
const LAST_KNOWN_MAX_ERROR_M = 500;

async function getInitialFix(): Promise<LatLng> {
  // Only trust the OS cache when it is fresh and reasonably accurate;
  // otherwise insist on a live fix. A stale cache is exactly how an app ends
  // up showing the wrong city after travel.
  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: LAST_KNOWN_MAX_AGE_MS,
    requiredAccuracy: LAST_KNOWN_MAX_ERROR_M,
  });
  if (lastKnown) {
    return {
      latitude: lastKnown.coords.latitude,
      longitude: lastKnown.coords.longitude,
    };
  }
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    const current = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('location-timeout')), FIX_TIMEOUT_MS);
      }),
    ]);
    return { latitude: current.coords.latitude, longitude: current.coords.longitude };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<LocationStatus>('loading');
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const mountedRef = useRef(true);

  const startWatching = useCallback(async () => {
    watcherRef.current?.remove();
    watcherRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 4000,
        distanceInterval: 8,
      },
      (position) => {
        if (!mountedRef.current) return;
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
    );
  }, []);

  const bootstrap = useCallback(async () => {
    setStatus('loading');
    try {
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        setStatus('unavailable');
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!mountedRef.current) return;
      setCanAskAgain(permission.canAskAgain);

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setStatus('denied');
        return;
      }

      // Permission is granted: the watcher ALWAYS starts, even if the first
      // fix times out (e.g. indoors). The moment hardware delivers a fix,
      // coords flip from the fallback to reality and everything downstream
      // (venue reload, map recenter) reacts on its own.
      try {
        const fix = await getInitialFix();
        if (mountedRef.current) setCoords(fix);
      } catch (error) {
        console.warn('[location] initial fix unavailable, relying on watcher', error);
      }
      if (!mountedRef.current) return;
      setStatus('granted');
      await startWatching();
    } catch (error) {
      console.warn('[location] bootstrap failed', error);
      if (mountedRef.current) setStatus('unavailable');
    }
  }, [startWatching]);

  useEffect(() => {
    mountedRef.current = true;
    void bootstrap();
    return () => {
      mountedRef.current = false;
      watcherRef.current?.remove();
      watcherRef.current = null;
    };
  }, [bootstrap]);

  const value = useMemo<LocationContextValue>(
    () => ({
      status,
      coords,
      effectiveCoords: coords ?? FALLBACK_CENTER,
      isFallback: coords === null,
      canAskAgain,
      requestPermission: bootstrap,
    }),
    [status, coords, canAskAgain, bootstrap],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within LocationProvider');
  }
  return context;
}
