import { useState } from 'react'
import { Icon } from '../components/Icon'
import { MetaLine } from '../components/MetaLine'
import {
  CURATED_HERO,
  CURATED_RAIL,
  DISCOVER_CATEGORIES,
  SAVED_QUOTE,
  type CuratedCard,
  type SavedPlace,
} from '../data/places'
import { useTrip } from '../state/tripContext'

/** Rows collapse to this many until "View More" is tapped. */
const COLLAPSED_ROWS = 4

/** Cosmetic for now — the design has no filtered state to switch to. */
function CategoryChips() {
  return (
    <div className="cat-row">
      {DISCOVER_CATEGORIES.map((c) => (
        <button key={c.id} className="cat" type="button">
          <span className="cat-emoji">{c.emoji}</span>
          <span className="cat-label">{c.label}</span>
        </button>
      ))}
    </div>
  )
}

/** A saved place: tapping the row opens its detail sheet. */
function SavedRow({ place, quote }: { place: SavedPlace; quote?: typeof SAVED_QUOTE }) {
  const { openPlace, addToItinerary, inItinerary: isPlanned, hasGem } = useTrip()
  const inItinerary = isPlanned(place.id)

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
        <div className="saved-thumb">
          <img className="saved-photo" src={place.thumb} alt="" />
          <img className="saved-avatar" src={place.avatar} alt="" />
        </div>
        <div className="saved-text">
          <p className="saved-name">{place.name}</p>
          <MetaLine place={place} gem={hasGem(place.id)} />
        </div>
        {/* The add button acts on its own, so it swallows the row tap. */}
        <button
          className={`add-btn${inItinerary ? ' is-done' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            addToItinerary(place.id)
          }}
          disabled={inItinerary}
          aria-label={inItinerary ? `${place.name} is in your itinerary` : `Add ${place.name} to your itinerary`}
        >
          <Icon name={inItinerary ? 'check' : 'add_location_alt'} size={22} />
        </button>
      </div>

      {quote && (
        <div className="saved-quote">
          <img className="quote-avatar" src={quote.avatar} alt="" />
          <span className="meta-dot">•</span>
          <p className="quote-text">“{quote.text}”</p>
        </div>
      )}
    </div>
  )
}

/** A photo card in the curated section — the hero is the same thing, wider. */
function CuratedTile({ card, hero = false }: { card: CuratedCard; hero?: boolean }) {
  const { findPlace, openPlace, addToItinerary, inItinerary: isPlanned } = useTrip()
  const place = findPlace(card.placeId)
  if (!place) return null

  const inItinerary = isPlanned(place.id)

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
        <span className="curated-badge">{card.badge}</span>
        {card.avatar && <img className="curated-badge-avatar" src={card.avatar} alt="" />}
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
            <MetaLine place={{ ...place, distanceMi: card.distanceMi }} onDark />
          </div>
          <button
            className={`add-btn add-btn-light${inItinerary ? ' is-done' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              addToItinerary(place.id)
            }}
            disabled={inItinerary}
            aria-label={inItinerary ? `${place.name} is in your itinerary` : `Add ${place.name} to your itinerary`}
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
  const [expanded, setExpanded] = useState(false)

  const rows = expanded ? discover : discover.slice(0, COLLAPSED_ROWS)

  return (
    <div className="discover">
      <CategoryChips />

      <section className="discover-section">
        <h2 className="discover-heading">Saved list</h2>
        <div className="saved-card">
          {rows.map((place, i) => (
            <SavedRow
              key={place.id}
              place={place}
              quote={place.quote ?? (i === 0 ? SAVED_QUOTE : undefined)}
            />
          ))}
          {discover.length > COLLAPSED_ROWS && (
            <button className="view-more" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'View Less' : 'View More'}
              <Icon name={expanded ? 'expand_less' : 'expand_more'} size={20} />
            </button>
          )}
        </div>
      </section>

      <section className="discover-section">
        <h2 className="discover-heading">Curated for your group</h2>
        <CuratedTile card={CURATED_HERO} hero />
        <div className="curated-rail">
          {CURATED_RAIL.map((card) => (
            <CuratedTile key={card.placeId} card={card} />
          ))}
        </div>
      </section>
    </div>
  )
}
