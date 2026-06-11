import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useLocationContext } from './LocationProvider';
import { useToast } from './ToastProvider';
import { boundsCenter, haversineMeters } from '../services/geo';
import {
  DEFAULT_SEARCH_RADIUS_M,
  fetchNearbyVenues,
  fetchVenuesInBounds,
  hasBeerOnTap,
  submitBeerListUpdate,
  submitPriceVote,
  subscribeToLiveUpdates,
} from '../services/pubApi';
import { getCatalogBeer } from '../services/czechData';
import { loadJson, removeKey, saveJson, STORAGE_KEYS } from '../services/storage';
import type {
  CommunityEdits,
  LatLng,
  LatLngBounds,
  LiveUpdateEvent,
  TapBeer,
  Venue,
} from '../types/models';

/**
 * Single source of truth for venue data. Local-first by design:
 *  - community edits are applied optimistically and persisted on-device;
 *  - persisted edits are layered over fresh fetches, then re-guarded;
 *  - simulated live updates merge into the same store SILENTLY — community
 *    activity changes what you see in place, it never interrupts you.
 *
 * Two search modes:
 *  - "around me" (default): loads around the user and auto-reloads after
 *    moving ~400 m;
 *  - "area" (map exploration): pinned to a map region until cleared, so
 *    walking doesn't clobber an explicit search.
 */

type PubsStatus = 'idle' | 'loading' | 'ready' | 'error';

interface AreaSearch {
  /** The map viewport the user explicitly searched. */
  bounds: LatLngBounds;
  /** The user's physical position at pin time — relocating far away unpins. */
  origin: LatLng;
}

interface PubsState {
  status: PubsStatus;
  venues: Venue[];
  error: string | null;
}

type PubsAction =
  | { type: 'load/start' }
  | { type: 'load/success'; venues: Venue[] }
  | { type: 'load/background-success'; venues: Venue[] }
  | { type: 'load/error'; message: string }
  | { type: 'venue/setTapBeers'; venueId: string; tapBeers: TapBeer[] };

function reducer(state: PubsState, action: PubsAction): PubsState {
  switch (action.type) {
    case 'load/start':
      return { ...state, status: 'loading', error: null };
    case 'load/success':
    case 'load/background-success':
      return { status: 'ready', venues: action.venues, error: null };
    case 'load/error':
      return {
        ...state,
        status: state.venues.length > 0 ? 'ready' : 'error',
        error: action.message,
      };
    case 'venue/setTapBeers': {
      const venues = state.venues
        .map((venue) =>
          venue.id === action.venueId ? { ...venue, tapBeers: action.tapBeers } : venue,
        )
        .filter(hasBeerOnTap); // the guard also applies to local edits
      return { ...state, venues };
    }
    default:
      return state;
  }
}

interface PubsContextValue {
  status: PubsStatus;
  venues: Venue[];
  error: string | null;
  refreshing: boolean;
  /** Center of the most recent successful load (user position or searched area). */
  loadedCenter: LatLng | null;
  /** Non-null while results are pinned to an explicitly searched map area. */
  searchedArea: AreaSearch | null;
  refresh: () => Promise<void>;
  searchArea: (bounds: LatLngBounds) => Promise<void>;
  clearAreaSearch: () => void;
  voteCorrect: (venueId: string, beerId: string) => Promise<void>;
  reportPriceChanged: (venueId: string, beerId: string, newPriceCzk: number) => Promise<void>;
  addBeerToTap: (venueId: string, catalogBeerId: string, priceCzk: number) => Promise<void>;
  removeBeerFromTap: (venueId: string, beerId: string) => Promise<void>;
  resetCommunityEdits: () => Promise<void>;
}

const PubsContext = createContext<PubsContextValue | undefined>(undefined);

const RELOAD_DISTANCE_M = 400;
/** Moves beyond this are relocations (travel, simulated GPS), not walks. */
const RELOCATION_DISTANCE_M = DEFAULT_SEARCH_RADIUS_M * 2; // 5 km

export function PubsProvider({ children }: { children: React.ReactNode }) {
  const { status: locationStatus, effectiveCoords } = useLocationContext();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [state, dispatch] = useReducer(reducer, {
    status: 'idle',
    venues: [],
    error: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loadedCenter, setLoadedCenter] = useState<LatLng | null>(null);
  const [searchedArea, setSearchedArea] = useState<AreaSearch | null>(null);

  const venuesRef = useRef<Venue[]>(state.venues);
  venuesRef.current = state.venues;

  const editsRef = useRef<CommunityEdits>({});
  const editsHydratedRef = useRef(false);
  const loadSeqRef = useRef(0);

  const applyEdits = useCallback((venues: Venue[]): Venue[] => {
    return venues
      .map((venue) => {
        const edit = editsRef.current[venue.id];
        return edit ? { ...venue, tapBeers: edit.tapBeers } : venue;
      })
      .filter(hasBeerOnTap);
  }, []);

  /**
   * Shared load pipeline for both query shapes ("around me" circle, searched
   * map bounds): sequencing against superseding loads, edit layering, errors.
   */
  const runLoad = useCallback(
    async (request: () => Promise<Venue[]>, center: LatLng, background: boolean) => {
      const seq = (loadSeqRef.current += 1);
      if (!background) dispatch({ type: 'load/start' });
      try {
        const fetched = await request();
        if (seq !== loadSeqRef.current) return; // a newer load superseded us
        setLoadedCenter(center);
        dispatch({
          type: background ? 'load/background-success' : 'load/success',
          venues: applyEdits(fetched),
        });
      } catch (error) {
        console.warn('[pubs] load failed', error);
        if (seq === loadSeqRef.current) {
          dispatch({ type: 'load/error', message: t('common.errorGeneric') });
        }
      }
    },
    [applyEdits, t],
  );

  const loadAround = useCallback(
    (center: LatLng, radiusMeters: number, background: boolean) =>
      runLoad(() => fetchNearbyVenues(center, radiusMeters), center, background),
    [runLoad],
  );

  // A pinned area search means "I'm browsing that area from here". Once the user
  // physically relocates beyond a walk, the pin is stale context — drop it so the
  // around-me pipeline reloads reality instead of decorating a faraway viewport's
  // pubs with absurd distances.
  useEffect(() => {
    if (!searchedArea) return;
    if (haversineMeters(searchedArea.origin, effectiveCoords) > RELOCATION_DISTANCE_M) {
      setSearchedArea(null);
    }
  }, [searchedArea, effectiveCoords]);

  // Hydrate persisted community edits once, then load around the user —
  // unless results are pinned to an explicitly searched area.
  useEffect(() => {
    if (locationStatus === 'loading') return;
    if (searchedArea !== null) return;
    let cancelled = false;
    void (async () => {
      if (!editsHydratedRef.current) {
        const stored = await loadJson<CommunityEdits>(STORAGE_KEYS.communityEdits);
        if (cancelled) return;
        if (stored) editsRef.current = stored;
        editsHydratedRef.current = true;
      }
      const distanceMoved =
        loadedCenter === null ? Infinity : haversineMeters(loadedCenter, effectiveCoords);
      if (distanceMoved > RELOAD_DISTANCE_M) {
        // Walks refresh silently; relocations load in the foreground so stale venues
        // never render with cross-country distances while the new area is in flight.
        const background = loadedCenter !== null && distanceMoved <= RELOCATION_DISTANCE_M;
        await loadAround(effectiveCoords, DEFAULT_SEARCH_RADIUS_M, background);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locationStatus, effectiveCoords, searchedArea, loadedCenter, loadAround]);

  // Simulated live community feed — merges in place, deliberately silent.
  // (Interval-driven toasts were removed: unsolicited pop-ups are noise.)
  useEffect(() => {
    if (state.status !== 'ready') return;
    const unsubscribe = subscribeToLiveUpdates(
      () => venuesRef.current,
      (event: LiveUpdateEvent) => {
        const venue = venuesRef.current.find((candidate) => candidate.id === event.venueId);
        if (!venue) return;
        const tapBeers = venue.tapBeers.map((beer) => {
          if (beer.id !== event.beerId) return beer;
          if (event.kind === 'price') {
            return {
              ...beer,
              priceCzk: event.newPriceCzk,
              lastVerifiedAt: new Date().toISOString(),
              confirmations: 1,
              disputes: 0,
            };
          }
          return {
            ...beer,
            confirmations: beer.confirmations + 1,
            lastVerifiedAt: new Date().toISOString(),
          };
        });
        dispatch({ type: 'venue/setTapBeers', venueId: event.venueId, tapBeers });
      },
    );
    return unsubscribe;
  }, [state.status]);

  const persistEdit = useCallback((venueId: string, tapBeers: TapBeer[]) => {
    editsRef.current = {
      ...editsRef.current,
      [venueId]: { tapBeers, editedAt: new Date().toISOString() },
    };
    void saveJson(STORAGE_KEYS.communityEdits, editsRef.current);
  }, []);

  /**
   * Shared optimistic-mutation pipeline: compute next tap list, apply to
   * state immediately, persist locally, then sync to the (mock) backend —
   * rolling back if the backend rejects it.
   */
  const mutateBeers = useCallback(
    async (
      venueId: string,
      transform: (beers: TapBeer[]) => TapBeer[],
      sync: (tapBeers: TapBeer[]) => Promise<void>,
    ) => {
      const venue = venuesRef.current.find((candidate) => candidate.id === venueId);
      if (!venue) return;
      const previous = venue.tapBeers;
      const next = transform(previous);
      dispatch({ type: 'venue/setTapBeers', venueId, tapBeers: next });
      persistEdit(venueId, next);
      try {
        await sync(next);
      } catch (error) {
        console.warn('[pubs] sync failed, rolling back', error);
        dispatch({ type: 'venue/setTapBeers', venueId, tapBeers: previous });
        persistEdit(venueId, previous);
        showToast({ message: t('toasts.errorGeneric'), tone: 'danger' });
      }
    },
    [persistEdit, showToast, t],
  );

  const voteCorrect = useCallback(
    (venueId: string, beerId: string) =>
      mutateBeers(
        venueId,
        (beers) =>
          beers.map((beer) =>
            beer.id === beerId
              ? {
                  ...beer,
                  confirmations: beer.confirmations + 1,
                  lastVerifiedAt: new Date().toISOString(),
                }
              : beer,
          ),
        () => submitPriceVote(venueId, beerId, 'correct'),
      ),
    [mutateBeers],
  );

  const reportPriceChanged = useCallback(
    (venueId: string, beerId: string, newPriceCzk: number) =>
      mutateBeers(
        venueId,
        (beers) =>
          beers.map((beer) =>
            beer.id === beerId
              ? {
                  ...beer,
                  priceCzk: newPriceCzk,
                  lastVerifiedAt: new Date().toISOString(),
                  confirmations: 1,
                  disputes: 0,
                }
              : beer,
          ),
        async (tapBeers) => {
          await submitPriceVote(venueId, beerId, 'changed');
          await submitBeerListUpdate(venueId, tapBeers);
        },
      ),
    [mutateBeers],
  );

  const addBeerToTap = useCallback(
    (venueId: string, catalogBeerId: string, priceCzk: number) => {
      const catalog = getCatalogBeer(catalogBeerId);
      if (!catalog) return Promise.resolve();
      return mutateBeers(
        venueId,
        (beers) => {
          if (beers.some((beer) => beer.catalogId === catalogBeerId)) return beers;
          const added: TapBeer = {
            id: `${venueId}_${catalog.id}`,
            catalogId: catalog.id,
            name: catalog.name,
            brewery: catalog.brewery,
            style: catalog.style,
            degreesPlato: catalog.degreesPlato,
            abv: catalog.abv,
            volumeMl: 500,
            priceCzk,
            lastVerifiedAt: new Date().toISOString(),
            confirmations: 1,
            disputes: 0,
          };
          return [...beers, added];
        },
        (tapBeers) => submitBeerListUpdate(venueId, tapBeers),
      );
    },
    [mutateBeers],
  );

  const removeBeerFromTap = useCallback(
    (venueId: string, beerId: string) =>
      mutateBeers(
        venueId,
        (beers) => beers.filter((beer) => beer.id !== beerId),
        (tapBeers) => submitBeerListUpdate(venueId, tapBeers),
      ),
    [mutateBeers],
  );

  /** Map exploration: pin results to the searched viewport until cleared. */
  const searchArea = useCallback(
    async (bounds: LatLngBounds) => {
      setSearchedArea({ bounds, origin: effectiveCoords });
      await runLoad(() => fetchVenuesInBounds(bounds), boundsCenter(bounds), false);
    },
    [runLoad, effectiveCoords],
  );

  const clearAreaSearch = useCallback(() => {
    setSearchedArea(null); // the around-me effect takes over from here
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setSearchedArea(null);
    try {
      await loadAround(effectiveCoords, DEFAULT_SEARCH_RADIUS_M, true);
    } finally {
      setRefreshing(false);
    }
  }, [loadAround, effectiveCoords]);

  const resetCommunityEdits = useCallback(async () => {
    editsRef.current = {};
    await removeKey(STORAGE_KEYS.communityEdits);
    setSearchedArea(null);
    await loadAround(effectiveCoords, DEFAULT_SEARCH_RADIUS_M, false);
  }, [loadAround, effectiveCoords]);

  const value = useMemo<PubsContextValue>(
    () => ({
      status: state.status,
      venues: state.venues,
      error: state.error,
      refreshing,
      loadedCenter,
      searchedArea,
      refresh,
      searchArea,
      clearAreaSearch,
      voteCorrect,
      reportPriceChanged,
      addBeerToTap,
      removeBeerFromTap,
      resetCommunityEdits,
    }),
    [
      state.status,
      state.venues,
      state.error,
      refreshing,
      loadedCenter,
      searchedArea,
      refresh,
      searchArea,
      clearAreaSearch,
      voteCorrect,
      reportPriceChanged,
      addBeerToTap,
      removeBeerFromTap,
      resetCommunityEdits,
    ],
  );

  return <PubsContext.Provider value={value}>{children}</PubsContext.Provider>;
}

export function usePubs(): PubsContextValue {
  const context = useContext(PubsContext);
  if (!context) {
    throw new Error('usePubs must be used within PubsProvider');
  }
  return context;
}
