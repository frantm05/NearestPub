import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { radius } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';

/**
 * Zoom-aware marker detail tiers, decided by the map screen:
 *  - 'full'    — beer-mug pill with the cheapest pint price (close zoom)
 *  - 'compact' — round beer-mug pin (district zoom)
 *  - 'dot'     — small amber dot (city overview)
 *
 * Built exclusively from fixed-size Views (no icon fonts, no border-triangle
 * hacks): markers render under `tracksViewChanges={false}`, which rasterizes
 * them once on mount — anything that loads asynchronously (like a glyph font)
 * can miss that snapshot and leave a broken artifact behind. Plain Views are
 * painted synchronously, so the pin always rasterizes whole.
 */
export type MarkerTier = 'full' | 'compact' | 'dot';

interface VenueMarkerProps {
  label: string;
  selected: boolean;
  tier: MarkerTier;
}

const OUTLINE_WIDTH = 2;

/** A beer mug drawn from views: foam cap, straight-walled body, C-handle. */
function MugGlyph({ size, color }: { size: number; color: string }) {
  const bodyWidth = Math.round(size * 0.52);
  const foamHeight = Math.max(2, Math.round(size * 0.2));
  const bodyHeight = Math.round(size * 0.78) - foamHeight;
  const handleSize = Math.round(size * 0.34);
  const handleStroke = Math.max(1.5, Math.round(size * 0.11));

  return (
    <View style={[styles.glyphBox, { width: size, height: size }]}>
      <View style={styles.glyphMug}>
        <View
          style={{
            width: bodyWidth + 3,
            height: foamHeight,
            borderRadius: foamHeight / 2,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            width: bodyWidth,
            height: bodyHeight,
            marginTop: 1,
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2,
            backgroundColor: color,
          }}
        />
      </View>
      <View
        style={{
          width: handleSize,
          height: handleSize,
          marginLeft: -1,
          marginTop: foamHeight - 1, // hang the handle off the body, not the foam
          borderWidth: handleStroke,
          borderLeftWidth: 0,
          borderColor: color,
          borderTopRightRadius: handleSize,
          borderBottomRightRadius: handleSize,
        }}
      />
    </View>
  );
}

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

export function VenueMarker({ label, selected, tier }: VenueMarkerProps) {
  const { theme } = useAppTheme();
  const fill = selected ? theme.colors.accentStrong : theme.colors.accent;
  const ring = theme.colors.surface;
  const ink = theme.colors.onAccent;

  if (tier === 'dot') {
    const size = selected ? 18 : 13;
    return (
      <View
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
    return (
      <View style={styles.pin}>
        <View
          style={[
            styles.head,
            {
              width: head,
              height: head,
              borderRadius: head / 2,
              backgroundColor: fill,
              borderColor: ring,
            },
          ]}
        >
          <MugGlyph size={Math.round(head * 0.58)} color={ink} />
        </View>
        <PinTip width={selected ? 17 : 13} fill={fill} ring={ring} />
      </View>
    );
  }

  return (
    <View style={styles.pin}>
      <View style={[styles.pricePill, { backgroundColor: fill, borderColor: ring }]}>
        <MugGlyph size={selected ? 20 : 17} color={ink} />
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
    gap: 4,
    paddingVertical: 4,
    paddingLeft: 7,
    paddingRight: 10,
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
  glyphBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 1,
  },
  glyphMug: {
    alignItems: 'center',
  },
  tipWindow: {
    overflow: 'hidden',
    alignItems: 'center',
    marginTop: -OUTLINE_WIDTH,
  },
});
