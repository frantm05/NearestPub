import type { MapViewProps } from 'react-native-maps';

type MapStyle = NonNullable<MapViewProps['customMapStyle']>;

/**
 * Warm "stout" night style for Google-rendered maps (Android). iOS Apple
 * Maps follows the system scheme via the `userInterfaceStyle` prop instead.
 */
export const darkMapStyle: MapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d140c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9a8868' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#120c07' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#3b2a19' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#7a6a52' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2014' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a1d11' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1d140c' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3b2a19' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#14202a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6275' }] },
];
