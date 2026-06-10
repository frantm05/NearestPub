# NearestPub 🍺

Finds the nearest place in Czechia pouring **pivo na čepu** — pub, restaurant, café, club or beer garden — and walks you straight to it.

Built with Expo SDK 53, React Native 0.79, TypeScript (strict), React Navigation 7, `react-native-maps` and i18next.

## Features

- **Nearest-first list** of venues with draught beer, live distances, walking ETAs, open/closed state and the cheapest pint per venue.
- **The beer-on-tap guard** — venues without at least one draught beer are filtered out at the API layer *and* re-checked after every local edit. Empty a venue's tap list and it disappears from the app.
- **Map tab** with Airbnb-style price-bubble markers and a venue preview card.
- **Walking route** — real road-network routing (OSRM) drawn as a gold polyline that automatically recalculates once you drift more than ~40 m off the route origin, plus hand-off to the native maps app. Offline or rate-limited, a deterministic street-grid simulation takes over (flagged "approximate route").
- **Live compass** — a rotating compass card with a needle locked onto the pub, smoothed along the shortest rotation path, with low-accuracy and no-sensor fallbacks, arrival celebration and keep-awake.
- **Crowdsourced price verification** — one tap to confirm a price, one tap to report a change (with a quick ±1/±5 price editor), add/remove beers from the tap list. Edits apply optimistically, persist locally and roll back if the (mock) backend rejects them.
- **Simulated live community feed** — every ~18 s another "user" confirms or nudges a price; changes merge into state and surface as toasts.
- **Czech + English** with full Czech plural rules (`1 pivo / 2 piva / 5 piv`), system-language auto-detect and a manual override in Settings.
- **Premium theming, 3 families × light/dark** — Crisp Pilsner, Amber Lager and Dark Stout each ship a distinct light *and* dark variant (six configurations). Pick a family, then pin light/dark or follow the system; themed map styles included.

## Running it

```bash
npm install
npm start          # then press a / i, or scan the QR with Expo Go
```

Everything runs in **Expo Go** (Android & iOS) — no native build needed. `npm run typecheck` runs the strict TypeScript pass; `npm test` runs the Jest suite (location fallback, routing fallback, theme variants); `npm run assets` regenerates the icon set (pure Node, no dependencies).

> Standalone **Android release builds** of `react-native-maps` need a Google Maps API key in `app.json` (`android.config.googleMaps.apiKey`). Expo Go ships its own.

## Architecture

```
App.tsx                 provider stack: SafeArea → Settings → Theme → Toast → Location → Pubs → Navigation
src/
  components/           design-system primitives + domain widgets (PubCard, BeerRow, CompassDial…)
  screens/              Nearby, Map, PubDetail, WalkRoute, Compass, Settings
  hooks/                useHeading, useNearbyVenues/useVenue, useWalkingRoute
  state/                Settings, Location, Pubs (reducer + optimistic mutations), Toast
  services/             mock API, deterministic venue generator, directions, geo math, storage
  theme/                palette tokens, ThemeProvider, dark map style
  i18n/ + locales/      i18next setup, cs.json / en.json
  navigation/           typed React Navigation stack + tabs
```

### Design decisions worth knowing

- **Deterministic mock world.** The map is a fixed global grid (~500 m cells); each cell seeds its own PRNG and spawns 0–2 venues with authentic Czech names, beers and 2026-realistic CZK prices. The same street corner always produces the same pubs across restarts — and the world exists *around wherever you actually are*, so the app demos correctly outside Czechia too. With location denied or unavailable, it falls back to České Budějovice's main square — never Prague — with a banner; the Jest suite pins this down.
- **Local-first edits.** Community edits live in AsyncStorage as a per-venue overlay, re-applied over every fresh fetch, so your corrections survive restarts. Settings (theme/language) persist the same way; storage failures degrade silently.
- **Compass heading** uses `expo-location`'s `watchHeadingAsync` — the OS-level, tilt-compensated magnetometer fusion — rather than integrating raw `expo-sensors` magnetometer vectors by hand. Same hardware, strictly better signal. The needle and compass card animate along the shortest angular path with an accumulating angle, so 359°→1° never spins the long way round.
- **Directions** come from the public OSRM router (genuine road geometry; the walking ETA is computed from distance at a steady 75 m/min). When the router is unreachable, a seeded street-grid simulation generates a plausible right-angle city walk that stays stable between renders and "recalculates" naturally as you move.

All venue data is simulated; no real backend is involved.
