import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import {
  PLACES,
  REAL_WORLD_MATCHES,
  SAVED,
  SEEDED_STOPS,
  type Place,
  type SavedPlace,
} from '../data/places'
import { discoverAlongRoute, hydrateDesigned, type PlaceOverride } from '../data/placesApi'
import { TripCtx, type ItineraryItem, type Tab, type TripState, type TripValue } from './tripContext'

type Action =
  | { type: 'openTrip' }
  | { type: 'backToYou' }
  | { type: 'setTab'; tab: Tab }
  | { type: 'setSnap'; snap: TripState['snap'] }
  | { type: 'openPlace'; id: string }
  | { type: 'closePlace' }
  | { type: 'addStop'; id: string; name: string }
  | { type: 'addToItinerary'; item: ItineraryItem }
  | { type: 'toggleGem'; id: string }
  | { type: 'clearToast' }
  | { type: 'setDiscover'; places: SavedPlace[] }
  | { type: 'setOverrides'; overrides: Record<string, PlaceOverride> }

function toItineraryItem(place: Place): ItineraryItem {
  return {
    id: place.id,
    name: place.name,
    rating: place.rating,
    reviews: place.reviews,
    photo: place.thumb,
  }
}

const initialState: TripState = {
  screen: 'you',
  tab: 'itinerary',
  snap: 'half',
  activePlaceId: null,
  // The kangaroo zoo is deliberately absent — "Add to itinerary" is what puts
  // it here, which is the point of the flow.
  morning: [toItineraryItem(SEEDED_STOPS[0])],
  evening: [toItineraryItem(SEEDED_STOPS[1])],
  gems: [],
  stops: [],
  toast: null,
  // The designed list renders immediately and stands in whenever Places is
  // unavailable, so Discover is never empty.
  discover: SAVED,
  overrides: {},
}

function reducer(state: TripState, action: Action): TripState {
  switch (action.type) {
    case 'openTrip':
      return { ...state, screen: 'trip', snap: 'half' }
    case 'backToYou':
      return { ...state, screen: 'you', activePlaceId: null }
    case 'setTab':
      return { ...state, tab: action.tab }
    case 'setSnap':
      return { ...state, snap: action.snap }
    case 'openPlace':
      return { ...state, activePlaceId: action.id, snap: 'half' }
    case 'closePlace':
      return { ...state, activePlaceId: null }
    case 'addStop': {
      if (state.stops.includes(action.id)) return state
      return {
        ...state,
        stops: [...state.stops, action.id],
        toast: `${action.name} added to your route`,
      }
    }
    case 'addToItinerary': {
      const already = [...state.morning, ...state.evening].some((i) => i.id === action.item.id)
      if (already) return state
      return {
        ...state,
        morning: [action.item, ...state.morning],
        toast: `${action.item.name} added to Morning`,
      }
    }
    case 'toggleGem': {
      const on = state.gems.includes(action.id)
      return {
        ...state,
        gems: on ? state.gems.filter((g) => g !== action.id) : [...state.gems, action.id],
        toast: on ? 'Removed from your gems' : 'Marked as a gem 💎',
      }
    }
    case 'clearToast':
      return { ...state, toast: null }
    case 'setDiscover':
      return { ...state, discover: action.places }
    case 'setOverrides':
      return { ...state, overrides: action.overrides }
  }
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const toastTimer = useRef<number | undefined>(undefined)

  // Every toast-producing action shares one auto-dismiss timer.
  const withToast = useCallback((action: Action) => {
    dispatch(action)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => dispatch({ type: 'clearToast' }), 2400)
  }, [])

  // Real places along the route, and real photography for the designed ones.
  // Both failures are silent by design: the reducer already holds the authored
  // content, so the screen keeps whatever it has.
  useEffect(() => {
    let cancelled = false

    discoverAlongRoute().then((places) => {
      if (!cancelled && places) dispatch({ type: 'setDiscover', places })
    })

    hydrateDesigned(REAL_WORLD_MATCHES).then((overrides) => {
      if (!cancelled && Object.keys(overrides).length > 0) {
        dispatch({ type: 'setOverrides', overrides })
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  // Fetched places aren't in the static registry, so every id lookup goes
  // through here — the detail sheet and the map both resolve real places, and
  // designed places pick up their real photographs on the way past.
  const findPlace = useCallback(
    (id: string): Place | undefined => {
      const place = state.discover.find((p) => p.id === id) ?? PLACES[id]
      if (!place) return undefined
      const override = state.overrides[id]
      return override ? { ...place, ...override, thumb: override.photos[0] } : place
    },
    [state.discover, state.overrides],
  )

  // Applied here rather than only in `findPlace`, so the Discover rows and the
  // detail sheet show the same photography.
  const discover = useMemo(
    () =>
      state.discover.map((p) => {
        const override = state.overrides[p.id]
        return override ? { ...p, ...override, thumb: override.photos[0] } : p
      }),
    [state.discover, state.overrides],
  )

  const value = useMemo<TripValue>(
    () => ({
      ...state,
      discover,
      openTrip: () => dispatch({ type: 'openTrip' }),
      backToYou: () => dispatch({ type: 'backToYou' }),
      setTab: (tab) => dispatch({ type: 'setTab', tab }),
      setSnap: (snap) => dispatch({ type: 'setSnap', snap }),
      openPlace: (id) => dispatch({ type: 'openPlace', id }),
      closePlace: () => dispatch({ type: 'closePlace' }),
      addStop: (id) => withToast({ type: 'addStop', id, name: findPlace(id)?.name ?? 'Stop' }),
      addToItinerary: (id) => {
        const place = findPlace(id)
        if (place) withToast({ type: 'addToItinerary', item: toItineraryItem(place) })
      },
      toggleGem: (id) => withToast({ type: 'toggleGem', id }),
      clearToast: () => dispatch({ type: 'clearToast' }),
      hasGem: (id) => state.gems.includes(id),
      findPlace,
    }),
    [state, discover, withToast, findPlace],
  )

  return <TripCtx.Provider value={value}>{children}</TripCtx.Provider>
}
