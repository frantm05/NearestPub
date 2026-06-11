import { useEffect, useState } from 'react';

/**
 * react-native-maps custom markers: with tracksViewChanges={false} the native
 * layer takes a one-shot snapshot of the marker view immediately. On Android,
 * Text layout is asynchronous — the snapshot fires before AppText has measured,
 * so the anchor pixel offset is computed from the wrong (collapsed) dimensions
 * and the pin drifts from its actual coordinate.
 *
 * Keep tracksViewChanges=true for `warmupMs` after mount, giving layout a full
 * render cycle to complete, then freeze to stop unnecessary re-rasterization.
 */
export function useRasterWarmup(warmupMs = 400): boolean {
  const [tracking, setTracking] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setTracking(false), warmupMs);
    return () => clearTimeout(timer);
  }, [warmupMs]);
  return tracking;
}
