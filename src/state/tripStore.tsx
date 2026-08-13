import { useCallback, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { PLACES, SEEDED_STOPS, type Place } from '../data/places'
import { TripCtx, type ItineraryItem, type Tab, type TripState, type TripValue } from './tripContext'

type Action =
  | { type: 'openTrip' }
  | { type: 'backToYou' }
  | { type: 'setTab'; tab: Tab }
  | { type: 'setSnap'; snap: TripState['snap'] }
  | { type: 'openPlace'; id: string }
  | { type: 'closePlace' }
  | { type: 'addStop'; id: string }
  | { type: 'addToItinerary'; item: ItineraryItem }
  | { type: 'toggleGem'; id: string }
  | { type: 'clearToast' }

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
      const name = PLACES[action.id]?.name ?? 'Stop'
      return { ...state, stops: [...state.stops, action.id], toast: `${name} added to your route` }
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

  const value = useMemo<TripValue>(
    () => ({
      ...state,
      openTrip: () => dispatch({ type: 'openTrip' }),
      backToYou: () => dispatch({ type: 'backToYou' }),
      setTab: (tab) => dispatch({ type: 'setTab', tab }),
      setSnap: (snap) => dispatch({ type: 'setSnap', snap }),
      openPlace: (id) => dispatch({ type: 'openPlace', id }),
      closePlace: () => dispatch({ type: 'closePlace' }),
      addStop: (id) => withToast({ type: 'addStop', id }),
      addToItinerary: (id) => {
        const place = PLACES[id]
        if (place) withToast({ type: 'addToItinerary', item: toItineraryItem(place) })
      },
      toggleGem: (id) => withToast({ type: 'toggleGem', id }),
      clearToast: () => dispatch({ type: 'clearToast' }),
      hasGem: (id) => state.gems.includes(id),
    }),
    [state, withToast],
  )

  return <TripCtx.Provider value={value}>{children}</TripCtx.Provider>
}
