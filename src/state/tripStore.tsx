import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import {
  PLACES,
  REAL_WORLD_MATCHES,
  SAVED,
  SEEDED_STOPS,
  type Place,
} from '../data/places'
import {
  discoverAlongRoute,
  hydrateDesigned,
  type DiscoverResult,
  type PlaceOverride,
} from '../data/placesApi'
import { dayColour } from '../data/days'
import {
  TripCtx,
  type Day,
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
  | { type: 'addToItinerary'; item: ItineraryItem; at: 'next' | 'end' }
  | { type: 'toggleGem'; id: string }
  | { type: 'togglePostTrip'; id: string }
  | { type: 'closePostTrip' }
  | { type: 'openGemDraft'; id: string }
  | { type: 'closeGemDraft' }
  | { type: 'openReview'; id: string }
  | { type: 'closeReview' }
  | { type: 'clearToast' }
  | { type: 'clearAdded' }
  | { type: 'setDiscover'; result: DiscoverResult }
  | { type: 'setOverrides'; overrides: Record<string, PlaceOverride> }
  | { type: 'enterSelect' }
  | { type: 'exitSelect' }
  | { type: 'toggleSelection'; id: string }
  | { type: 'groupSelection' }
  | { type: 'moveItem'; from: number; to: number }
  | { type: 'moveDay'; from: number; to: number }
  | { type: 'removeItems'; ids: string[] }

function toItineraryItem(place: Place): ItineraryItem {
  return {
    id: place.id,
    name: place.name,
    rating: place.rating,
    reviews: place.reviews,
    photo: place.thumb,
  }
}

/**
 * Day numbers and colours come from position rather than being stored, so every
 * change to the list hands them out again — reordering renumbers, and Day 1 is
 * always the first block. Days left empty are dropped instead of lingering as
 * headers with nothing under them.
 */
function resequence(days: { id: string; placeIds: string[] }[]): Day[] {
  return days
    .filter((day) => day.placeIds.length > 0)
    .map(({ id, placeIds }, i) => ({ id, index: i + 1, colour: dayColour(i + 1), placeIds }))
}

/**
 * Ids are minted past the highest one in use rather than from the day count:
 * numbers are reused as days are dropped and renumbered, and two days sharing an
 * id would collide as React keys.
 */
function nextDayId(days: Day[]): string {
  const used = days.map((day) => Number(day.id.slice('day-'.length)) || 0)
  return `day-${Math.max(0, ...used) + 1}`
}

/** Every stop in the order the sheet draws it: grouped days first, the rest last. */
function rows(state: TripState): { id: string; dayId: string | null }[] {
  const grouped = state.days.flatMap((day) =>
    day.placeIds
      .filter((id) => state.itinerary.some((item) => item.id === id))
      .map((id) => ({ id, dayId: day.id })),
  )
  const placed = new Set(grouped.map((row) => row.id))
  return [
    ...grouped,
    ...state.itinerary.filter((i) => !placed.has(i.id)).map((i) => ({ id: i.id, dayId: null })),
  ]
}

const move = <T,>(list: T[], from: number, to: number): T[] => {
  const next = [...list]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

const initialState: TripState = {
  screen: 'you',
  tab: 'itinerary',
  snap: 'half',
  activePlaceId: null,
  postTripId: null,
  gemDraftId: null,
  reviewId: null,
  // The kangaroo zoo is deliberately absent — "Add to itinerary" is what puts
  // it here, which is the point of the flow.
  itinerary: SEEDED_STOPS.map(toItineraryItem),
  days: [],
  selectMode: false,
  selection: [],
  addedId: null,
  itineraryChanged: false,
  // Kona Kitchen arrives already gemmed, which is what its curated card has
  // been claiming all along — the map just never agreed with it.
  gems: ['kona-kitchen'],
  toast: null,
  // The designed list renders immediately and stands in whenever Places is
  // unavailable, so Discover is never empty. There is no designed stand-in for
  // the ambient tier — without Places the map falls back to scenery instead.
  discover: SAVED,
  ambient: [],
  overrides: {},
}

function reducer(state: TripState, action: Action): TripState {
  switch (action.type) {
    case 'openTrip':
      return { ...state, screen: 'trip', snap: 'half' }
    case 'backToYou':
      return { ...state, screen: 'you', activePlaceId: null }
    case 'setTab':
      // Opening the itinerary is how the change gets seen, so the badge on the
      // tab goes with it.
      return {
        ...state,
        tab: action.tab,
        itineraryChanged: action.tab === 'itinerary' ? false : state.itineraryChanged,
      }
    case 'setSnap':
      return { ...state, snap: action.snap }
    case 'openPlace':
      return { ...state, activePlaceId: action.id, snap: 'half' }
    case 'closePlace':
      return { ...state, activePlaceId: null }
    case 'addToItinerary': {
      if (state.itinerary.some((i) => i.id === action.item.id)) return state
      return {
        ...state,
        // "Next" is the front of the list, since the list reads in drive order.
        itinerary:
          action.at === 'next'
            ? [action.item, ...state.itinerary]
            : [...state.itinerary, action.item],
        addedId: action.item.id,
        itineraryChanged: true,
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
    case 'togglePostTrip':
      return { ...state, postTripId: state.postTripId === action.id ? null : action.id }
    case 'closePostTrip':
      return { ...state, postTripId: null }
    // Both overlays cover the sheet, so the panel folds away behind them rather
    // than being waiting underneath on the way back.
    case 'openGemDraft':
      return { ...state, gemDraftId: action.id, postTripId: null }
    case 'closeGemDraft':
      return { ...state, gemDraftId: null }
    case 'openReview':
      return { ...state, reviewId: action.id, postTripId: null }
    case 'closeReview':
      return { ...state, reviewId: null }
    case 'clearToast':
      return { ...state, toast: null }
    case 'clearAdded':
      return { ...state, addedId: null }
    case 'setDiscover':
      return { ...state, discover: action.result.listed, ambient: action.result.ambient }
    case 'setOverrides':
      return { ...state, overrides: action.overrides }
    case 'enterSelect':
      return { ...state, selectMode: true, selection: [], snap: 'full' }
    case 'exitSelect':
      return { ...state, selectMode: false, selection: [] }
    case 'toggleSelection': {
      const on = state.selection.includes(action.id)
      return {
        ...state,
        selection: on
          ? state.selection.filter((s) => s !== action.id)
          : [...state.selection, action.id],
      }
    }
    case 'groupSelection': {
      if (state.selection.length === 0) return state
      const id = nextDayId(state.days)
      // Selection is in tap order, which says nothing about the drive. The day
      // reads down the list instead, the same order the rows were shown in.
      const placeIds = state.itinerary
        .filter((item) => state.selection.includes(item.id))
        .map((item) => item.id)
      // A place belongs to one day, so grouping it again moves it out of the
      // day it was in.
      const days = resequence([
        ...state.days.map((d) => ({
          ...d,
          placeIds: d.placeIds.filter((pid) => !state.selection.includes(pid)),
        })),
        { id, placeIds },
      ])

      return {
        ...state,
        days,
        selectMode: false,
        selection: [],
        toast: `Day ${days.find((d) => d.id === id)?.index ?? days.length} grouped`,
      }
    }
    case 'moveItem': {
      const list = rows(state)
      const from = list[action.from]
      const target = list[action.to]
      if (!from || !target || action.from === action.to) return state

      // The row takes the group of the slot it was dropped on, so dragging into
      // a day joins it and dragging down past the last one leaves it ungrouped.
      const next = move(list, action.from, action.to).map((row) =>
        row.id === from.id ? { ...row, dayId: target.dayId } : row,
      )

      return {
        ...state,
        days: resequence(
          state.days.map((day) => ({
            ...day,
            placeIds: next.filter((row) => row.dayId === day.id).map((row) => row.id),
          })),
        ),
        // The rows are the drive, so the itinerary follows the order they now read in.
        itinerary: next.flatMap((row) => {
          const item = state.itinerary.find((i) => i.id === row.id)
          return item ? [item] : []
        }),
      }
    }
    case 'moveDay': {
      if (!state.days[action.from] || !state.days[action.to] || action.from === action.to) {
        return state
      }
      return { ...state, days: resequence(move(state.days, action.from, action.to)) }
    }
    case 'removeItems': {
      const dropped = new Set(action.ids)
      if (dropped.size === 0) return state
      return {
        ...state,
        itinerary: state.itinerary.filter((item) => !dropped.has(item.id)),
        days: resequence(
          state.days.map((day) => ({
            ...day,
            placeIds: day.placeIds.filter((id) => !dropped.has(id)),
          })),
        ),
        selectMode: false,
        selection: [],
        toast: `${dropped.size} ${dropped.size === 1 ? 'place' : 'places'} removed`,
      }
    }
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

    discoverAlongRoute().then((result) => {
      if (!cancelled && result) dispatch({ type: 'setDiscover', result })
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
      const place =
        state.discover.find((p) => p.id === id) ??
        state.ambient.find((p) => p.id === id) ??
        PLACES[id]
      if (!place) return undefined
      const override = state.overrides[id]
      return override ? { ...place, ...override, thumb: override.photos[0] } : place
    },
    [state.discover, state.ambient, state.overrides],
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
      addToItinerary: (id, at = 'end') => {
        const place = findPlace(id)
        if (place) dispatch({ type: 'addToItinerary', item: toItineraryItem(place), at })
      },
      toggleGem: (id) => withToast({ type: 'toggleGem', id }),
      togglePostTrip: (id) => dispatch({ type: 'togglePostTrip', id }),
      closePostTrip: () => dispatch({ type: 'closePostTrip' }),
      openGemDraft: (id) => dispatch({ type: 'openGemDraft', id }),
      closeGemDraft: () => dispatch({ type: 'closeGemDraft' }),
      openReview: (id) => dispatch({ type: 'openReview', id }),
      closeReview: () => dispatch({ type: 'closeReview' }),
      clearToast: () => dispatch({ type: 'clearToast' }),
      clearAdded: () => dispatch({ type: 'clearAdded' }),
      hasGem: (id) => state.gems.includes(id),
      findPlace,
      enterSelect: () => dispatch({ type: 'enterSelect' }),
      exitSelect: () => dispatch({ type: 'exitSelect' }),
      toggleSelection: (id) => dispatch({ type: 'toggleSelection', id }),
      groupSelectionIntoDay: () => withToast({ type: 'groupSelection' }),
      moveItem: (from, to) => dispatch({ type: 'moveItem', from, to }),
      moveDay: (from, to) => dispatch({ type: 'moveDay', from, to }),
      removeItems: (ids) => withToast({ type: 'removeItems', ids }),
      dayForPlace: (id) => state.days.find((d) => d.placeIds.includes(id)),
    }),
    [state, discover, withToast, findPlace],
  )

  return <TripCtx.Provider value={value}>{children}</TripCtx.Provider>
}
