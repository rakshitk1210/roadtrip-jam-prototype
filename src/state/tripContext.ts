import { createContext, useContext } from 'react'
import type { Place, SavedPlace } from '../data/places'
import type { PlaceOverride } from '../data/placesApi'

export type Screen = 'explore' | 'you' | 'trip'
export type Tab = 'itinerary' | 'discover'
export type Snap = 'peek' | 'half' | 'full'
/**
 * Position in the Road Trip Wrapped story, layered over the Explore sheet: 0 is
 * the intro, 1 onwards are the frames in `WRAPPED_FRAMES`, then the photo picker
 * the story hands over to, and last the souvenir map the picking makes.
 */
export type WrappedPhase = null | number

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
  /** The itinerary row whose post-trip actions are expanded beneath it. */
  postTripId: string | null
  /** Non-null while the gem-capture screen is up, naming the place it captures. */
  gemDraftId: string | null
  /** Non-null while the review form is up. */
  reviewId: string | null
  /** Non-null while the Wrapped photo-comment overlay is up, naming the photo it drafts for. */
  commentDraftId: string | null
  /** Non-null while a Wrapped photo is open full-screen from the You tab. */
  viewingWrappedPhotoId: string | null
  /** Road Trip Wrapped overlay, layered over whichever screen is underneath. */
  wrapped: WrappedPhase
  /**
   * Bumped whenever the story is jumped to a frame so that screen remounts even
   * if it was already showing, and the sequence plays from the top.
   */
  wrappedEpoch: number
  /**
   * The photos chosen for the map, in the order they were chosen — which is the
   * order their badges number them in, so dropping one renumbers the rest.
   */
  wrappedPhotos: string[]
  /** Captions on Wrapped photos, keyed by photo id. An absent key means no comment. */
  wrappedComments: Record<string, string>
  /** Which photo is picked as the souvenir's background — cosmetic only. */
  backgroundPhotoId: string | null
  gems: string[]
  /**
   * The place just marked a gem, which the map moves to show. Spent by the map
   * rather than the store, so the camera goes there once and stays where it is
   * left afterwards.
   */
  gemmedId: string | null
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
  openExplore: () => void
  backToYou: () => void
  setTab: (tab: Tab) => void
  setSnap: (snap: Snap) => void
  openPlace: (id: string) => void
  closePlace: () => void
  /**
   * Adding a place to the itinerary is what puts it on the route. `next` makes
   * it the first stop of the drive; everything else lands at the end.
   */
  addToItinerary: (id: string, at?: 'next' | 'end') => void
  toggleGem: (id: string) => void
  /** Expands the post-trip actions under a row, or folds them away again. */
  togglePostTrip: (id: string) => void
  closePostTrip: () => void
  openGemDraft: (id: string) => void
  closeGemDraft: () => void
  openReview: (id: string) => void
  closeReview: () => void
  openCommentDraft: (id: string) => void
  closeCommentDraft: () => void
  /** Sets a photo's caption, or clears it when text is empty. */
  setWrappedComment: (id: string, text: string) => void
  openWrappedPhoto: (id: string) => void
  closeWrappedPhoto: () => void
  openWrappedStart: () => void
  /** Jumps the story to the invite frame, remounting it if it is already up. */
  openWrappedInvite: () => void
  /** Moves the story on to its next frame, stopping at the last one. */
  advanceWrapped: () => void
  /** Steps the story back a frame, closing it from the intro. */
  retreatWrapped: () => void
  closeWrapped: () => void
  /** Adds a photo to the map, or takes it back off and closes the gap it leaves. */
  toggleWrappedPhoto: (id: string) => void
  setBackgroundPhoto: (id: string) => void
  clearToast: () => void
  /** Drops the highlight from the newly added stop. */
  clearAdded: () => void
  /** Drops the pending camera move, once the map has made it. */
  clearGemmed: () => void
  hasGem: (id: string) => boolean
  /**
   * Whether this gem is one you marked, rather than one the trip arrived with.
   * A place found by other people says so instead.
   */
  markedGem: (id: string) => boolean
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
