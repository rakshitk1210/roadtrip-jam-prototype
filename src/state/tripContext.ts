import { createContext, useContext } from 'react'

export type Screen = 'you' | 'trip'
export type Tab = 'itinerary' | 'discover'
export type Snap = 'peek' | 'half' | 'full'

export interface ItineraryItem {
  id: string
  name: string
  rating: number
  reviews: number
  photo: string
}

export interface TripState {
  screen: Screen
  tab: Tab
  snap: Snap
  /** Non-null while the place detail sheet is up. */
  activePlaceId: string | null
  morning: ItineraryItem[]
  evening: ItineraryItem[]
  gems: string[]
  stops: string[]
  toast: string | null
}

export interface TripValue extends TripState {
  openTrip: () => void
  backToYou: () => void
  setTab: (tab: Tab) => void
  setSnap: (snap: Snap) => void
  openPlace: (id: string) => void
  closePlace: () => void
  addStop: (id: string) => void
  addToItinerary: (id: string) => void
  toggleGem: (id: string) => void
  clearToast: () => void
  hasGem: (id: string) => boolean
}

/**
 * Lives apart from the provider component so React Fast Refresh doesn't mint a
 * fresh context object every time the provider file is edited — which would
 * leave already-mounted consumers reading from the old one.
 */
export const TripCtx = createContext<TripValue | null>(null)

export function useTrip() {
  const ctx = useContext(TripCtx)
  if (!ctx) throw new Error('useTrip must be used inside <TripProvider>')
  return ctx
}
