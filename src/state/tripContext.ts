import { createContext, useContext } from 'react'
import type { Place, SavedPlace } from '../data/places'
import type { PlaceOverride } from '../data/placesApi'

export type Screen = 'you' | 'trip'
export type Tab = 'itinerary' | 'discover'
export type Snap = 'peek' | 'half' | 'full'

export interface ItineraryItem {
  id: string
  name: string
  rating: number
  reviews: number
  photo: string
  /** Detour off the route, in miles — the `1.5 mi` on an itinerary row. */
  distanceMi?: number
}

/**
 * One block of the itinerary. Labelled blocks carry a `Day n` heading; the one
 * unlabelled block is the tail that new stops land in until they're grouped.
 * The day number is derived from position rather than stored, so reordering
 * days renumbers them with nothing left to keep in sync.
 */
export interface ItineraryDay {
  id: string
  labelled: boolean
  items: ItineraryItem[]
}

/** Where a stop sits: which block, and how far down it. */
export interface ItemSpot {
  dayId: string
  index: number
}

export interface TripState {
  screen: Screen
  tab: Tab
  snap: Snap
  /** Non-null while the place detail sheet is up. */
  activePlaceId: string | null
  /** Labelled days first, the unlabelled tail always last. */
  itinerary: ItineraryDay[]
  gems: string[]
  stops: string[]
  toast: string | null
  /**
   * Saved places shown in Discover and pinned on the map. Starts as the designed
   * list and is replaced by real Google Places results when those are available.
   */
  discover: SavedPlace[]
  /** Real photography and ratings layered onto designed places, keyed by id. */
  overrides: Record<string, PlaceOverride>
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
  /** Resolves any tappable place — designed, seeded, or fetched from Places. */
  findPlace: (id: string) => Place | undefined
  /** Reorders a stop, within its block or into another one. */
  moveItem: (from: ItemSpot, to: ItemSpot) => void
  /** Reorders whole days. Indices count labelled days only. */
  moveDay: (fromIndex: number, toIndex: number) => void
  /** Pulls the given stops out of wherever they sit into a new labelled day. */
  groupIntoDay: (ids: string[]) => void
  removeItems: (ids: string[]) => void
  inItinerary: (id: string) => boolean
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
