import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from './AppText';
import { radius } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import type { VenueType } from '../types/models';

/**
 * Zoom-aware marker detail tiers, decided by the map screen:
 *  - 'full'    — type-icon pill with the cheapest pint price (close zoom)
 *  - 'compact' — round type-icon pin (district zoom)
 *  - 'dot'     — small amber dot (city overview)
 *
 * Icons are async font glyphs; the map screen holds tracksViewChanges=true
 * via useRasterWarmup long enough for the glyph to load before the native
 * snapshot freezes the marker.
 */
export type MarkerTier = 'full' | 'compact' | 'dot';

const TYPE_ICONS: Record<VenueType, keyof typeof Ionicons.glyphMap> = {
  pub: 'beer',
  restaurant: 'restaurant',
  cafe: 'cafe',
  club: 'musical-notes',
  beerGarden: 'leaf',
};

interface VenueMarkerProps {
  label: string;
  selected: boolean;
  tier: MarkerTier;
  type?: VenueType;
}

const OUTLINE_WIDTH = 2;

/**
 * The pin's pointed tip: the lower half of an outlined, rotated square,
 * revealed through an overflow-hidden window. Unlike the classic transparent-
 * border triangle hack it carries a real fill plus outline, so it reads as
 * part of the pin instead of a floating artifact.
 */
function PinTip({ width, fill, ring }: { width: number; fill: string; ring: string }) {
  const square = Math.round(width * 0.8);
  return (
    <View style={[styles.tipWindow, { width, height: Math.ceil(square * 0.71) }]}>
      <View
        style={{
          width: square,
          height: square,
          marginTop: -square / 2,
          backgroundColor: fill,
          borderWidth: OUTLINE_WIDTH,
          borderColor: ring,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

export function VenueMarker({ label, selected, tier, type }: VenueMarkerProps) {
  const { theme } = useAppTheme();
  const fill = selected ? theme.colors.accentStrong : theme.colors.accent;
  const ring = theme.colors.surface;
  const ink = theme.colors.onAccent;
  const iconName = type ? TYPE_ICONS[type] : 'beer';

  if (tier === 'dot') {
    const size = selected ? 18 : 13;
    return (
      <View
        collapsable={false}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fill,
          borderWidth: 2.5,
          borderColor: ring,
        }}
      />
    );
  }

  if (tier === 'compact') {
    const head = selected ? 40 : 32;
    const iconSize = Math.round(head * 0.46);
    return (
      <View collapsable={false} style={styles.pin}>
        <View
          style={[
            styles.head,
            {
              width: head,
              height: head,
              borderRadius: head / 2,
              backgroundColor: fill,
              borderColor: ring,
              // Android borderRadius doesn't clip children — without this the
              // glyph can bleed past the circle and render as a D-shape.
              overflow: 'hidden',
            },
          ]}
        >
          <Ionicons name={iconName} size={iconSize} color={ink} />
        </View>
        <PinTip width={selected ? 17 : 13} fill={fill} ring={ring} />
      </View>
    );
  }

  // tier === 'full'
  const iconSize = selected ? 16 : 14;
  return (
    <View collapsable={false} style={styles.pin}>
      <View style={[styles.pricePill, { backgroundColor: fill, borderColor: ring }]}>
        <Ionicons name={iconName} size={iconSize} color={ink} />
        <AppText
          variant="label"
          color={ink}
          style={selected ? styles.priceLabelSelected : styles.priceLabel}
        >
          {label}
        </AppText>
      </View>
      <PinTip width={selected ? 16 : 14} fill={fill} ring={ring} />
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    alignItems: 'center',
  },
  head: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: OUTLINE_WIDTH,
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: OUTLINE_WIDTH,
  },
  priceLabel: {
    fontSize: 13,
    lineHeight: 17,
  },
  priceLabelSelected: {
    fontSize: 14,
    lineHeight: 18,
  },
  tipWindow: {
    overflow: 'hidden',
    alignItems: 'center',
    marginTop: -OUTLINE_WIDTH,
  },
});
