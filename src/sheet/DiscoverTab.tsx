import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Rating } from '../components/Rating'
import { detourFromRoute, formatMiles } from '../data/directions'
import {
  CURATED_HERO,
  CURATED_RAIL,
  SAVED_QUOTE,
  type CuratedCard,
  type SavedPlace,
} from '../data/places'
import { useTrip } from '../state/tripContext'

/** The category rail that replaced the chips over the map. */
const CATEGORIES = [
  { key: 'search', emoji: '🔎', label: 'Search' },
  { key: 'restaurants', emoji: '🍔', label: 'Restaurants' },
  { key: 'coffee', emoji: '☕', label: 'Coffee' },
  { key: 'shopping', emoji: '🛍️', label: 'Shopping' },
  { key: 'nature', emoji: '🍀', label: 'Nature' },
]

/** How many saved rows show before "View More". */
const COLLAPSED = 4

function SavedRow({ place, quote }: { place: SavedPlace; quote?: typeof SAVED_QUOTE }) {
  const { openPlace, addToItinerary, itinerary, hasGem } = useTrip()
  const inItinerary = itinerary.some((i) => i.id === place.id)

  return (
    <div
      className="saved-row is-tappable"
      role="button"
      tabIndex={0}
      onClick={() => openPlace(place.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openPlace(place.id)
        }
      }}
    >
      <div className="saved-main">
        {/* The avatar attributes the save to whoever bookmarked it. */}
        <span className="list-thumb">
          <img className="list-photo" src={place.thumb} alt="" />
          {place.avatar && <img className="list-avatar" src={place.avatar} alt="" />}
        </span>
        <div className="list-text">
          <p className="list-name">{place.name}</p>
          <Rating
            rating={place.rating}
            reviews={place.reviews}
            gem={hasGem(place.id)}
            stars="single"
            suffix={[formatMiles(detourFromRoute(place.coord)), place.category]
              .filter(Boolean)
              .join(' • ')}
          />
        </div>
        {/* Acts on its own, so it swallows the row tap. */}
        <button
          className={`round-btn round-btn-dim${inItinerary ? ' is-done' : ''}`}
          aria-label={inItinerary ? `${place.name} is in your itinerary` : `Add ${place.name}`}
          disabled={inItinerary}
          onClick={(e) => {
            e.stopPropagation()
            addToItinerary(place.id)
          }}
        >
          <Icon name={inItinerary ? 'check' : 'add_location_alt'} size={22} />
        </button>
      </div>

      {quote && (
        <div className="saved-quote">
          <img className="quote-avatar" src={quote.avatar} alt="" />
          <span className="quote-dot">•</span>
          <p className="quote-text">“{quote.text}”</p>
        </div>
      )}
    </div>
  )
}

/**
 * A photo card in the curated section — the hero is the same thing, wider. The
 * badge is the card's own editorial line rather than anything the place knows
 * about itself, and the button adds the place to the trip.
 */
function CuratedTile({ card, hero = false }: { card: CuratedCard; hero?: boolean }) {
  const { findPlace, openPlace, addToItinerary, itinerary, hasGem } = useTrip()
  const place = findPlace(card.placeId)
  if (!place) return null

  const inItinerary = itinerary.some((i) => i.id === place.id)

  return (
    <div
      className={`curated-card${hero ? ' is-hero' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => openPlace(place.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openPlace(place.id)
        }
      }}
    >
      <img className="curated-photo" src={card.image ?? place.thumb} alt="" />

      <div className="curated-badges">
        {card.avatar && <img className="curated-badge-avatar" src={card.avatar} alt="" />}
        <span className="curated-badge">{card.badge}</span>
      </div>

      <div className="curated-overlay">
        {hero && (
          <div className="curated-progress">
            <span className="curated-progress-fill" />
          </div>
        )}
        <div className="curated-info">
          <div className="curated-text">
            <p className="curated-name">{place.name}</p>
            <Rating
              rating={place.rating}
              reviews={place.reviews}
              gem={!card.avatar && hasGem(place.id)}
              stars="single"
              suffix={`${card.distanceMi} mi`}
            />
          </div>
          {/* Acts on its own, so it swallows the card tap. */}
          <button
            className={`curated-add${inItinerary ? ' is-done' : ''}`}
            disabled={inItinerary}
            aria-label={
              inItinerary ? `${place.name} is in your itinerary` : `Add ${place.name}`
            }
            onClick={(e) => {
              e.stopPropagation()
              addToItinerary(place.id)
            }}
          >
            <Icon name={inItinerary ? 'check' : 'add_location_alt'} size={24} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function DiscoverTab() {
  const { discover } = useTrip()
  const [category, setCategory] = useState('search')
  const [expanded, setExpanded] = useState(false)

  const saved = expanded ? discover : discover.slice(0, COLLAPSED)

  return (
    <div className="discover-pane">
      <div className="cat-rail">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`cat${category === c.key ? ' is-active' : ''}`}
            aria-pressed={category === c.key}
            onClick={() => setCategory(c.key)}
          >
            <span className="cat-emoji">{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      <h2 className="sheet-heading">Saved list</h2>
      <div className="sheet-card">
        {saved.map((place, i) => (
          <SavedRow
            key={place.id}
            place={place}
            quote={place.quote ?? (i === 0 ? SAVED_QUOTE : undefined)}
          />
        ))}
        {discover.length > COLLAPSED && (
          <button className="view-more" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'View Less' : 'View More'}
            <Icon name={expanded ? 'expand_less' : 'expand_more'} size={20} />
          </button>
        )}
      </div>

      <h2 className="sheet-heading">Curated for your group</h2>
      <CuratedTile card={CURATED_HERO} hero />
      <div className="curated-rail">
        {CURATED_RAIL.map((card) => (
          <CuratedTile key={card.placeId} card={card} />
        ))}
      </div>
    </div>
  )
}
