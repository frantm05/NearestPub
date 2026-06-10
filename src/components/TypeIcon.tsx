import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import type { VenueType } from '../types/models';

const TYPE_ICONS: Record<VenueType, keyof typeof Ionicons.glyphMap> = {
  pub: 'beer',
  restaurant: 'restaurant',
  cafe: 'cafe',
  club: 'musical-notes',
  beerGarden: 'leaf',
};

interface TypeIconProps {
  type: VenueType;
  size?: number;
}

/** Amber-tinted bubble with the venue-type glyph. */
export function TypeIcon({ type, size = 44 }: TypeIconProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        backgroundColor: theme.colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={TYPE_ICONS[type]} size={size * 0.48} color={theme.colors.accent} />
    </View>
  );
}
