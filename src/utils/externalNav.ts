import { Linking, Platform } from 'react-native';

import type { LatLng } from '../types/models';

/**
 * Hands the destination off to the platform's native maps app with walking
 * directions, falling back to Google Maps on the web if the scheme fails.
 */
export async function openExternalWalkingDirections(
  destination: LatLng,
  label: string,
): Promise<void> {
  const { latitude, longitude } = destination;
  const encodedLabel = encodeURIComponent(label);

  const nativeUrl = Platform.select({
    ios: `maps://?daddr=${latitude},${longitude}&dirflg=w&q=${encodedLabel}`,
    android: `google.navigation:q=${latitude},${longitude}&mode=w`,
    default: '',
  });
  const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;

  try {
    if (nativeUrl && (await Linking.canOpenURL(nativeUrl))) {
      await Linking.openURL(nativeUrl);
      return;
    }
    await Linking.openURL(webFallback);
  } catch (error) {
    console.warn('[externalNav] failed to open maps app', error);
  }
}
