import { useEffect, useState } from 'react';

/**
 * Warm-up for react-native-maps custom markers. With `tracksViewChanges={false}`
 * the marker is snapshotted once, immediately — on Android that can fire before
 * Text inside the pin has measured (text layout is async), so only synchronously
 * painted Views survive: for our pin, the rotated-square tip, which reads as a
 * lone triangle. Track changes for a few frames after mount, then freeze.
 */
export function useRasterWarmup(warmupMs = 350): boolean {
  const [tracking, setTracking] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setTracking(false), warmupMs);
    return () => clearTimeout(timer);
  }, [warmupMs]);
  return tracking;
}
