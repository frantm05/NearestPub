/** Geographic coordinate pair, compatible with react-native-maps. */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Axis-aligned geographic bounding box — e.g. a map viewport. */
export interface LatLngBounds {
  southWest: LatLng;
  northEast: LatLng;
}

export type VenueType = 'pub' | 'restaurant' | 'cafe' | 'club' | 'beerGarden';

export type BeerStyle =
  | 'paleLager'
  | 'darkLager'
  | 'amberLager'
  | 'wheat'
  | 'ipa'
  | 'apa'
  | 'stout'
  | 'sour'
  | 'unfiltered';

/** A beer currently on tap at a venue, with community-verified pricing. */
export interface TapBeer {
  id: string;
  /** Catalog identity — used to prevent duplicates when editing the tap list. */
  catalogId: string;
  name: string;
  brewery: string;
  style: BeerStyle;
  degreesPlato: number;
  abv: number;
  volumeMl: number;
  priceCzk: number;
  /** ISO timestamp of the most recent community price verification. */
  lastVerifiedAt: string;
  /** "Yes, price is correct" votes. */
  confirmations: number;
  /** "No, price changed" votes. */
  disputes: number;
}

/** Opening hours; `closesAt` earlier than `opensAt` means closing after midnight. */
export interface OpeningHours {
  opensAt: string;
  closesAt: string;
}

export type VenueFeature =
  | 'tankBeer'
  | 'garden'
  | 'food'
  | 'dogFriendly'
  | 'liveMusic'
  | 'cardPayment';

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  coordinate: LatLng;
  address: string;
  openingHours: OpeningHours;
  rating: number;
  ratingCount: number;
  priceLevel: 1 | 2 | 3;
  features: VenueFeature[];
  /**
   * Beers currently on tap. The "beer-on-tap guard" guarantees that any venue
   * surfaced to the UI has a non-empty tap list.
   */
  tapBeers: TapBeer[];
}

export type PriceVote = 'correct' | 'changed';

/** Simulated community activity pushed by the mock backend. */
export type LiveUpdateEvent =
  | {
      kind: 'price';
      venueId: string;
      venueName: string;
      beerId: string;
      beerName: string;
      newPriceCzk: number;
    }
  | {
      kind: 'confirmation';
      venueId: string;
      venueName: string;
      beerId: string;
      beerName: string;
    };

/** Where a walking route came from: real road network vs. offline simulation. */
export type RouteSource = 'network' | 'simulated';

export interface WalkingRoute {
  points: LatLng[];
  distanceMeters: number;
  durationMinutes: number;
  source: RouteSource;
}

/**
 * The three premium theme families. Each ships a distinct light AND dark
 * variant — six configurations in total, selected by family × mode.
 */
export type ThemeFamily = 'crispPilsner' | 'amberLager' | 'darkStout';
/** A resolved variant bucket within a family. */
export type ThemeMode = 'light' | 'dark';
/** User-facing mode preference; 'system' follows the OS appearance. */
export type ThemeModePreference = 'system' | ThemeMode;
export type LanguagePreference = 'system' | 'cs' | 'en';

export interface AppSettings {
  themeFamily: ThemeFamily;
  themeMode: ThemeModePreference;
  language: LanguagePreference;
}

/** Locally persisted community edits, applied over freshly fetched venues. */
export type CommunityEdits = Record<string, { tapBeers: TapBeer[]; editedAt: string }>;

/** Price filtering buckets, keyed off a venue's cheapest pint. */
export type PriceBucket = 'any' | 'budget' | 'moderate' | 'premium';

export interface VenueFilters {
  price: PriceBucket;
  styles: BeerStyle[];
  breweries: string[];
}

/** A favorited venue, snapshotted so it stays openable far from home. */
export interface FavoriteVenue {
  venue: Venue;
  favoritedAt: string;
}

export type FavoritesMap = Record<string, FavoriteVenue>;
