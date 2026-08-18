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
}

/** A grouped leg of the trip. A place belongs to at most one day. */
export interface Day {
  id: string
  /** 1-based, and what the "Day N" header shows. */
  index: number
  colour: string
  placeIds: string[]
}

export interface TripState {
  screen: Screen
  tab: Tab
  snap: Snap
  /** Non-null while the place detail sheet is up. */
  activePlaceId: string | null
  gems: string[]
  toast: string | null
  /**
   * Saved places shown in Discover and pinned on the map. Starts as the designed
   * list and is replaced by real Google Places results when those are available.
   */
  discover: SavedPlace[]
  /**
   * Real places the map knows about but the sheet doesn't list — what zooming in
   * uncovers. Full places, so they open the detail sheet like anything else.
   */
  ambient: SavedPlace[]
  /** Real photography and ratings layered onto designed places, keyed by id. */
  overrides: Record<string, PlaceOverride>
  /** Itinerary stops in drive order — flat, since Morning/Evening is gone. */
  itinerary: ItineraryItem[]
  days: Day[]
  /** True while the list is in "Select places" mode. */
  selectMode: boolean
  selection: string[]
  /**
   * The stop just added, which the itinerary highlights until it has been seen.
   * Cleared by the list itself, so the highlight is timed from the moment it is
   * on screen rather than from the tap that added it.
   */
  addedId: string | null
  /** Set by an add the itinerary hasn't been opened to see yet. */
  itineraryChanged: boolean
}

export interface TripValue extends TripState {
  openTrip: () => void
  backToYou: () => void
  setTab: (tab: Tab) => void
  setSnap: (snap: Snap) => void
  openPlace: (id: string) => void
  closePlace: () => void
  /** Adding a place to the itinerary is what puts it on the route. */
  addToItinerary: (id: string) => void
  toggleGem: (id: string) => void
  clearToast: () => void
  /** Drops the highlight from the newly added stop. */
  clearAdded: () => void
  hasGem: (id: string) => boolean
  /** Resolves any tappable place — designed, seeded, or fetched from Places. */
  findPlace: (id: string) => Place | undefined
  enterSelect: () => void
  exitSelect: () => void
  toggleSelection: (id: string) => void
  /** Moves everything selected into a fresh day and leaves select mode. */
  groupSelectionIntoDay: () => void
  /**
   * Reorders one stop. Both positions count rows across the whole list, in the
   * order the sheet draws them — a row can be dragged from one day into another.
   */
  moveItem: (from: number, to: number) => void
  /** Reorders whole days, which renumbers and recolours them. */
  moveDay: (from: number, to: number) => void
  /** Drops stops from the trip, along with any day left empty. */
  removeItems: (ids: string[]) => void
  dayForPlace: (id: string) => Day | undefined
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
