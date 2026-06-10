import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchWalkingRoute } from '../services/directions';
import { haversineMeters } from '../services/geo';
import type { LatLng, WalkingRoute } from '../types/models';

const REROUTE_THRESHOLD_M = 40;

interface WalkingRouteState {
  route: WalkingRoute | null;
  status: 'loading' | 'ready' | 'error';
  /** True while a re-route is being computed but the old route is still shown. */
  refetching: boolean;
  retry: () => void;
}

/**
 * Fetches a walking route and automatically recalculates once the walker
 * drifts more than ~40 m from the origin of the current route.
 */
export function useWalkingRoute(origin: LatLng, destination: LatLng): WalkingRouteState {
  const [route, setRoute] = useState<WalkingRoute | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refetching, setRefetching] = useState(false);

  const routeOriginRef = useRef<LatLng | null>(null);
  const seqRef = useRef(0);

  const compute = useCallback(
    async (from: LatLng, to: LatLng, background: boolean) => {
      const seq = (seqRef.current += 1);
      if (background) {
        setRefetching(true);
      } else {
        setStatus('loading');
      }
      try {
        const result = await fetchWalkingRoute(from, to);
        if (seq !== seqRef.current) return;
        routeOriginRef.current = from;
        setRoute(result);
        setStatus('ready');
      } catch (error) {
        console.warn('[route] failed', error);
        if (seq === seqRef.current && !background) setStatus('error');
      } finally {
        if (seq === seqRef.current) setRefetching(false);
      }
    },
    [],
  );

  // Initial fetch + re-route while walking.
  useEffect(() => {
    const previousOrigin = routeOriginRef.current;
    if (previousOrigin === null) {
      void compute(origin, destination, false);
      return;
    }
    if (haversineMeters(previousOrigin, origin) > REROUTE_THRESHOLD_M) {
      void compute(origin, destination, true);
    }
  }, [origin, destination, compute]);

  const retry = useCallback(() => {
    routeOriginRef.current = null;
    void compute(origin, destination, false);
  }, [origin, destination, compute]);

  return { route, status, refetching, retry };
}
