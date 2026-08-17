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
import {
  TripCtx,
  type ItemSpot,
  type ItineraryDay,
  type ItineraryItem,
  type Tab,
  type TripState,
  type TripValue,
} from './tripContext'

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
  | { type: 'moveItem'; from: ItemSpot; to: ItemSpot }
  | { type: 'moveDay'; fromIndex: number; toIndex: number }
  // The id is minted by the caller so the reducer stays pure.
  | { type: 'groupIntoDay'; ids: string[]; dayId: string }
  | { type: 'removeItems'; ids: string[] }

/** The one unlabelled block. New stops land here until they're grouped. */
const TAIL_ID = 'unplanned'

function toItineraryItem(place: Place): ItineraryItem {
  return {
    id: place.id,
    name: place.name,
    rating: place.rating,
    reviews: place.reviews,
    photo: place.thumb,
    distanceMi: 'distanceMi' in place ? (place as SavedPlace).distanceMi : undefined,
  }
}

/** Every stop, in the order it reads on screen. */
function allItems(days: ItineraryDay[]): ItineraryItem[] {
  return days.flatMap((d) => d.items)
}

/** Drops days emptied by a move or a delete. The tail always survives. */
function prune(days: ItineraryDay[]): ItineraryDay[] {
  return days.filter((d) => !d.labelled || d.items.length > 0)
}

/** Labelled days stay above the tail, whatever order they were handed in. */
function ordered(days: ItineraryDay[]): ItineraryDay[] {
  return [...days.filter((d) => d.labelled), ...days.filter((d) => !d.labelled)]
}

const initialState: TripState = {
  screen: 'you',
  tab: 'itinerary',
  snap: 'half',
  activePlaceId: null,
  // Ungrouped to begin with, the way the design opens: grouping into days is
  // something the Select flow does, not a starting state.
  itinerary: [{ id: TAIL_ID, labelled: false, items: SEEDED_STOPS.map(toItineraryItem) }],
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
      if (allItems(state.itinerary).some((i) => i.id === action.item.id)) return state
      return {
        ...state,
        itinerary: state.itinerary.map((d) =>
          d.id === TAIL_ID ? { ...d, items: [...d.items, action.item] } : d,
        ),
        toast: `${action.item.name} added to your itinerary`,
      }
    }
    case 'moveItem': {
      const { from, to } = action
      const days = state.itinerary.map((d) => ({ ...d, items: [...d.items] }))
      const src = days.find((d) => d.id === from.dayId)
      const dst = days.find((d) => d.id === to.dayId)
      if (!src || !dst) return state

      const [moved] = src.items.splice(from.index, 1)
      if (!moved) return state
      dst.items.splice(Math.max(0, Math.min(to.index, dst.items.length)), 0, moved)
      return { ...state, itinerary: prune(days) }
    }
    case 'moveDay': {
      const labelled = state.itinerary.filter((d) => d.labelled)
      const { fromIndex, toIndex } = action
      if (fromIndex === toIndex || !labelled[fromIndex]) return state

      const next = [...labelled]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, moved)
      return { ...state, itinerary: [...next, ...state.itinerary.filter((d) => !d.labelled)] }
    }
    case 'groupIntoDay': {
      const picked = new Set(action.ids)
      // Reading order, not the order they were tapped in.
      const grouped = allItems(state.itinerary).filter((i) => picked.has(i.id))
      if (grouped.length === 0) return state

      const stripped = state.itinerary.map((d) => ({
        ...d,
        items: d.items.filter((i) => !picked.has(i.id)),
      }))
      const day: ItineraryDay = { id: action.dayId, labelled: true, items: grouped }
      return {
        ...state,
        itinerary: prune(ordered([...stripped, day])),
        toast: `${grouped.length} ${grouped.length === 1 ? 'stop' : 'stops'} grouped into a day`,
      }
    }
    case 'removeItems': {
      const drop = new Set(action.ids)
      const days = state.itinerary.map((d) => ({
        ...d,
        items: d.items.filter((i) => !drop.has(i.id)),
      }))
      const gone = allItems(state.itinerary).length - allItems(days).length
      if (gone === 0) return state
      return {
        ...state,
        itinerary: prune(days),
        toast: `${gone} ${gone === 1 ? 'stop' : 'stops'} removed`,
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
  const nextDayId = useRef(1)

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

  // Itinerary rows are snapshots taken when the stop was added, so live
  // photography and ratings have to be layered back on the same way Discover's
  // rows get theirs — otherwise the two tabs disagree about the same place.
  const itinerary = useMemo(
    () =>
      state.itinerary.map((day) => ({
        ...day,
        items: day.items.map((item) => {
          const override = state.overrides[item.id]
          if (!override) return item
          return {
            ...item,
            rating: override.rating ?? item.rating,
            reviews: override.reviews ?? item.reviews,
            photo: override.photos[0],
          }
        }),
      })),
    [state.itinerary, state.overrides],
  )

  const value = useMemo<TripValue>(
    () => ({
      ...state,
      discover,
      itinerary,
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
      moveItem: (from, to) => dispatch({ type: 'moveItem', from, to }),
      moveDay: (fromIndex, toIndex) => dispatch({ type: 'moveDay', fromIndex, toIndex }),
      groupIntoDay: (ids) =>
        withToast({ type: 'groupIntoDay', ids, dayId: `day-${nextDayId.current++}` }),
      removeItems: (ids) => withToast({ type: 'removeItems', ids }),
      inItinerary: (id) => allItems(state.itinerary).some((i) => i.id === id),
    }),
    [state, discover, itinerary, withToast, findPlace],
  )

  return <TripCtx.Provider value={value}>{children}</TripCtx.Provider>
}
