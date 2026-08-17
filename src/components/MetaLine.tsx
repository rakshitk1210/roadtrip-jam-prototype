import { Rating } from './Rating'
import type { Place, SavedPlace } from '../data/places'
import type { ItineraryItem } from '../state/tripContext'

/**
 * The `4.8 ★ (198) • 1.5 mi • Lake` line that sits under a place name in both
 * Discover rows and itinerary rows. Distance and category are dropped when the
 * source has nothing to say about them.
 */
export function MetaLine({
  place,
  gem = false,
  onDark = false,
}: {
  place: SavedPlace | Place | ItineraryItem
  gem?: boolean
  onDark?: boolean
}) {
  const distance = 'distanceMi' in place ? place.distanceMi : undefined
  const category = 'category' in place ? place.category : undefined

  return (
    <div className={`meta-line${onDark ? ' is-on-dark' : ''}`}>
      <Rating rating={place.rating} reviews={place.reviews} gem={gem} compact />
      {distance !== undefined && (
        <>
          <span className="meta-dot">•</span>
          <span>{distance} mi</span>
        </>
      )}
      {category && (
        <>
          <span className="meta-dot">•</span>
          <span className="meta-category">{category}</span>
        </>
      )}
    </div>
  )
}
