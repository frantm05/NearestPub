import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

interface HeadingState {
  /** Smoothed device heading in degrees from true north, or null while unknown. */
  heading: number | null;
  lowAccuracy: boolean;
  /** True when the device produced no heading events (emulator, no magnetometer). */
  unavailable: boolean;
}

const UPDATE_THROTTLE_MS = 80;
const MIN_DELTA_DEG = 0.8;
const AVAILABILITY_TIMEOUT_MS = 2500;

/**
 * Live hardware compass heading via the platform's tilt-compensated heading
 * API (expo-location's `watchHeadingAsync`, which reads the magnetometer +
 * accelerometer fusion the OS already does better than raw `expo-sensors`).
 * Subscribe only while the consuming screen is focused.
 */
export function useHeading(enabled: boolean): HeadingState {
  const [heading, setHeading] = useState<number | null>(null);
  const [lowAccuracy, setLowAccuracy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const lastUpdateRef = useRef(0);
  const lastValueRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;
    let gotEvent = false;

    const availabilityTimer = setTimeout(() => {
      if (!gotEvent && !cancelled) setUnavailable(true);
    }, AVAILABILITY_TIMEOUT_MS);

    void (async () => {
      try {
        subscription = await Location.watchHeadingAsync((event) => {
          if (cancelled) return;
          gotEvent = true;
          setUnavailable(false);

          const raw = event.trueHeading >= 0 ? event.trueHeading : event.magHeading;
          const now = Date.now();
          const last = lastValueRef.current;
          const delta = last === null ? Infinity : Math.abs(raw - last);
          if (now - lastUpdateRef.current < UPDATE_THROTTLE_MS && delta < MIN_DELTA_DEG) {
            return;
          }
          lastUpdateRef.current = now;
          lastValueRef.current = raw;
          setHeading(raw);
          setLowAccuracy(event.accuracy >= 0 && event.accuracy <= 1);
        });
      } catch (error) {
        console.warn('[heading] watch failed', error);
        if (!cancelled) setUnavailable(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(availabilityTimer);
      subscription?.remove();
    };
  }, [enabled]);

  return { heading, lowAccuracy, unavailable };
}
