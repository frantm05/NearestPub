import type { BeerStyle, OpeningHours, VenueFeature, VenueType } from '../types/models';

/**
 * Authentic Czech source data for the mock world: real beer brands with
 * realistic 2026 tap prices (CZK per 0.5 l), venue name pools and street names.
 */

export interface CatalogBeer {
  id: string;
  name: string;
  brewery: string;
  style: BeerStyle;
  degreesPlato: number;
  abv: number;
  basePriceCzk: number;
}

export const BEER_CATALOG: readonly CatalogBeer[] = [
  { id: 'pilsner-urquell', name: 'Pilsner Urquell', brewery: 'Plzeňský Prazdroj', style: 'paleLager', degreesPlato: 12, abv: 4.4, basePriceCzk: 64 },
  { id: 'pilsner-nefiltr', name: 'Pilsner Urquell nefiltrovaný', brewery: 'Plzeňský Prazdroj', style: 'unfiltered', degreesPlato: 12, abv: 4.4, basePriceCzk: 69 },
  { id: 'gambrinus-10', name: 'Gambrinus 10°', brewery: 'Plzeňský Prazdroj', style: 'paleLager', degreesPlato: 10, abv: 4.3, basePriceCzk: 45 },
  { id: 'kozel-11', name: 'Velkopopovický Kozel 11°', brewery: 'Pivovar Velké Popovice', style: 'paleLager', degreesPlato: 11, abv: 4.6, basePriceCzk: 48 },
  { id: 'kozel-cerny', name: 'Kozel Černý', brewery: 'Pivovar Velké Popovice', style: 'darkLager', degreesPlato: 10, abv: 3.8, basePriceCzk: 46 },
  { id: 'staropramen-11', name: 'Staropramen 11°', brewery: 'Pivovar Staropramen', style: 'paleLager', degreesPlato: 11, abv: 4.7, basePriceCzk: 49 },
  { id: 'staropramen-granat', name: 'Staropramen Granát', brewery: 'Pivovar Staropramen', style: 'amberLager', degreesPlato: 11, abv: 4.8, basePriceCzk: 48 },
  { id: 'budvar-12', name: 'Budvar 12°', brewery: 'Budějovický Budvar', style: 'paleLager', degreesPlato: 12, abv: 5.0, basePriceCzk: 59 },
  { id: 'budvar-tmavy', name: 'Budvar tmavý ležák', brewery: 'Budějovický Budvar', style: 'darkLager', degreesPlato: 12, abv: 4.7, basePriceCzk: 55 },
  { id: 'bernard-11', name: 'Bernard 11°', brewery: 'Rodinný pivovar Bernard', style: 'paleLager', degreesPlato: 11, abv: 4.5, basePriceCzk: 52 },
  { id: 'bernard-kvasnicovy', name: 'Bernard kvasnicový', brewery: 'Rodinný pivovar Bernard', style: 'unfiltered', degreesPlato: 12, abv: 5.0, basePriceCzk: 56 },
  { id: 'svijany-maz', name: 'Svijanský Máz 11°', brewery: 'Pivovar Svijany', style: 'paleLager', degreesPlato: 11, abv: 4.8, basePriceCzk: 49 },
  { id: 'radegast-12', name: 'Radegast Ryze hořká 12', brewery: 'Pivovar Radegast', style: 'paleLager', degreesPlato: 12, abv: 5.1, basePriceCzk: 53 },
  { id: 'krusovice-12', name: 'Krušovice 12°', brewery: 'Královský pivovar Krušovice', style: 'paleLager', degreesPlato: 12, abv: 5.0, basePriceCzk: 51 },
  { id: 'breznak-11', name: 'Březňák 11°', brewery: 'Pivovar Velké Březno', style: 'paleLager', degreesPlato: 11, abv: 4.9, basePriceCzk: 44 },
  { id: 'unetice-10', name: 'Únětické pivo 10°', brewery: 'Únětický pivovar', style: 'paleLager', degreesPlato: 10, abv: 3.9, basePriceCzk: 47 },
  { id: 'primator-weizen', name: 'Primátor Weizenbier', brewery: 'Pivovar Primátor', style: 'wheat', degreesPlato: 12, abv: 4.8, basePriceCzk: 55 },
  { id: 'master-polotmavy', name: 'Master polotmavý 13°', brewery: 'Plzeňský Prazdroj', style: 'amberLager', degreesPlato: 13, abv: 5.2, basePriceCzk: 57 },
  { id: 'samson-11', name: 'Samson 11°', brewery: 'Pivovar Samson', style: 'paleLager', degreesPlato: 11, abv: 4.6, basePriceCzk: 43 },
  { id: 'samson-tmavy', name: 'Samson tmavý ležák', brewery: 'Pivovar Samson', style: 'darkLager', degreesPlato: 11, abv: 4.3, basePriceCzk: 44 },
  { id: 'budvar-33', name: 'Budvar 33', brewery: 'Budějovický Budvar', style: 'paleLager', degreesPlato: 12, abv: 4.6, basePriceCzk: 62 },
  { id: 'regent-bohemia', name: 'Bohemia Regent 12°', brewery: 'Pivovar Regent Třeboň', style: 'paleLager', degreesPlato: 12, abv: 5.0, basePriceCzk: 46 },
  { id: 'platan-11', name: 'Platan 11°', brewery: 'Pivovar Platan Protivín', style: 'paleLager', degreesPlato: 11, abv: 4.6, basePriceCzk: 42 },
  { id: 'dudak-premium', name: 'Dudák Premium 12°', brewery: 'Měšťanský pivovar Strakonice', style: 'paleLager', degreesPlato: 12, abv: 5.0, basePriceCzk: 45 },
  { id: 'solnice-lezak', name: 'Solnice nefiltrovaný ležák', brewery: 'Pivovar Solnice', style: 'unfiltered', degreesPlato: 12, abv: 5.1, basePriceCzk: 58 },
  { id: 'matuska-raptor', name: 'Matuška Raptor IPA', brewery: 'Pivovar Matuška', style: 'ipa', degreesPlato: 15, abv: 6.3, basePriceCzk: 85 },
  { id: 'matuska-apa', name: 'Matuška California', brewery: 'Pivovar Matuška', style: 'apa', degreesPlato: 12, abv: 5.4, basePriceCzk: 79 },
  { id: 'clock-hektor', name: 'Clock Hektor', brewery: 'Pivovar Clock', style: 'apa', degreesPlato: 12, abv: 5.1, basePriceCzk: 76 },
  { id: 'zichovec-magic', name: 'Zichovec Magic Trick IPA', brewery: 'Pivovar Zichovec', style: 'ipa', degreesPlato: 15, abv: 6.5, basePriceCzk: 88 },
  { id: 'sibeeria-stout', name: 'Sibeeria Tmel Stout', brewery: 'Pivovar Sibeeria', style: 'stout', degreesPlato: 14, abv: 5.8, basePriceCzk: 92 },
  { id: 'wild-sour', name: 'Wild Creatures Kyselka', brewery: 'Wild Creatures', style: 'sour', degreesPlato: 11, abv: 4.2, basePriceCzk: 95 },
] as const;

export function getCatalogBeer(catalogId: string): CatalogBeer | undefined {
  return BEER_CATALOG.find((beer) => beer.id === catalogId);
}

export const VENUE_NAMES: Readonly<Record<VenueType, readonly string[]>> = {
  pub: [
    'U Zlatého tygra',
    'U Černého vola',
    'Pivnice U Hrocha',
    'U Kalicha',
    'U Medvídků',
    'U Pinkasů',
    'U Tří růží',
    'U Vystřelenýho oka',
    'Lokál U Bílé kuželky',
    'U Slovanské lípy',
    'Pivnice Štupartská',
    'Na Slamníku',
    'Hospoda U Buldoka',
    'U Veverky',
    'U Bansethů',
    'Hostinec U Kocoura',
    'U Rotundy',
    'Pivnice Dačický',
    'U Šumavy',
    'Pivní zastávka',
    'Masné krámy',
    'Budvarka',
    'Singer Pub',
    'U Tří sedláků',
    'U Zeleného stromu',
    'Pivnice U Vodňanské ryby',
    'Hospůdka Na Dvorku',
    'U Černé věže',
  ],
  restaurant: [
    'Restaurace Mincovna',
    'Kolkovna',
    'Na Pekárně',
    'U Modré kachničky',
    'Plzeňská restaurace',
    'Restaurace Tiskárna',
    'U Matěje',
    'Česká hospůdka',
    'Na Růžku',
    'U Dvou koček',
    'Vinohradský parlament',
    'Restaurace Na Kopci',
    'Solnice',
    'Krajinská 27',
    'U Královské pečeti',
    'Restaurace Gerbera',
    'U Zlaté lodi',
  ],
  cafe: [
    'Kavárna Slavia',
    'Café Letka',
    'Kavárna Pražírna',
    'Café Jedna',
    'Kavárna co hledá jméno',
    'Café Kampus',
    'Dos Mundos',
    'Kavárna Liberál',
    'Café Sladkovský',
    'Bistro Osm',
    'Kavárna Lanna',
    'Café Datel',
    'Mlsná kavka',
    'Café Hostel',
  ],
  club: [
    'Cross Club',
    'Palác Akropolis',
    'Klub Vlkova 26',
    'Futurum Music Bar',
    'Storm Club',
    'Vagon',
    'Lucerna Music Bar',
    'Klub Újezd',
    'Chapeau Rouge',
    'Velbloud',
    'MC Fabrika',
    'Horká vana',
  ],
  beerGarden: [
    'Letenský zámeček',
    'Zahrádka Riegrovy sady',
    'Parukářka',
    'Zahrádka Na Výtoni',
    'Žluté lázně',
    'Beer Garden Stromovka',
    'Zahrádka Sokolský ostrov',
    'Letní scéna Háječek',
  ],
};

export const STREET_NAMES: readonly string[] = [
  'Dlouhá',
  'Křemencova',
  'Vodičkova',
  'Spálená',
  'Národní',
  'Letenská',
  'Belgická',
  'Vinohradská',
  'Korunní',
  'Francouzská',
  'Slezská',
  'Myslíkova',
  'Husitská',
  'Seifertova',
  'Bořivojova',
  'Štupartská',
  'Michalská',
  'Karmelitská',
  'Újezd',
  'Nádražní',
  'Dejvická',
  'Veleslavínská',
  'Krajinská',
  'Lannova třída',
  'Česká',
  'Piaristická',
  'Hroznová',
  'Karla IV.',
  'Široká',
  'Kněžská',
  'Plachého',
  'Otakarova',
  'Rudolfovská',
  'Husova třída',
];

/** Venue-type surcharge added to catalog base prices (clubs pour pricier pints). */
export const TYPE_PRICE_PREMIUM: Readonly<Record<VenueType, number>> = {
  pub: 0,
  restaurant: 4,
  cafe: 6,
  club: 12,
  beerGarden: 0,
};

export const TYPE_OPENING_HOURS: Readonly<Record<VenueType, readonly OpeningHours[]>> = {
  pub: [
    { opensAt: '11:00', closesAt: '23:00' },
    { opensAt: '11:30', closesAt: '00:00' },
    { opensAt: '15:00', closesAt: '23:30' },
  ],
  restaurant: [
    { opensAt: '11:00', closesAt: '22:00' },
    { opensAt: '11:30', closesAt: '23:00' },
  ],
  cafe: [
    { opensAt: '08:00', closesAt: '20:00' },
    { opensAt: '09:00', closesAt: '22:00' },
  ],
  club: [
    { opensAt: '19:00', closesAt: '04:00' },
    { opensAt: '20:00', closesAt: '05:00' },
  ],
  beerGarden: [
    { opensAt: '12:00', closesAt: '22:00' },
    { opensAt: '11:00', closesAt: '23:00' },
  ],
};

/**
 * Probability that a generated venue has NO beer on tap (only bottles or
 * coffee). These venues exist in the raw data precisely so the beer-on-tap
 * guard has something real to filter out.
 */
export const NO_TAP_CHANCE: Readonly<Record<VenueType, number>> = {
  pub: 0.04,
  restaurant: 0.12,
  cafe: 0.45,
  club: 0.25,
  beerGarden: 0.05,
};

export const TYPE_WEIGHTS: readonly { type: VenueType; weight: number }[] = [
  { type: 'pub', weight: 0.42 },
  { type: 'restaurant', weight: 0.2 },
  { type: 'cafe', weight: 0.14 },
  { type: 'club', weight: 0.09 },
  { type: 'beerGarden', weight: 0.15 },
];

export const TAP_COUNT_RANGE: Readonly<Record<VenueType, readonly [number, number]>> = {
  pub: [2, 6],
  restaurant: [2, 4],
  cafe: [1, 2],
  club: [1, 3],
  beerGarden: [2, 4],
};

export const FEATURE_CHANCES: Readonly<
  Record<VenueType, Partial<Record<VenueFeature, number>>>
> = {
  pub: { tankBeer: 0.35, garden: 0.35, food: 0.7, dogFriendly: 0.5, liveMusic: 0.1, cardPayment: 0.85 },
  restaurant: { tankBeer: 0.25, garden: 0.3, food: 1, dogFriendly: 0.3, cardPayment: 0.97 },
  cafe: { garden: 0.25, food: 0.6, dogFriendly: 0.7, cardPayment: 0.97 },
  club: { liveMusic: 0.85, cardPayment: 0.9 },
  beerGarden: { tankBeer: 0.3, garden: 1, food: 0.6, dogFriendly: 0.85, cardPayment: 0.7 },
};
