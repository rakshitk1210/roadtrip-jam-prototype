import { Icon } from '../components/Icon'
import { Rating } from '../components/Rating'
import { FROM_CREATORS, FROM_FRIENDS, SAVED, type ListItem, type SavedPlace } from '../data/places'
import { useTrip } from '../state/tripContext'

/** A saved place: tapping the row opens its detail sheet. */
function PlaceRow({ place }: { place: SavedPlace }) {
  const { openPlace, addToItinerary, morning, evening, hasGem } = useTrip()
  const inItinerary = [...morning, ...evening].some((i) => i.id === place.id)

  return (
    <div
      className="list-row is-tappable"
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
      <div className="list-thumb">
        <img className="list-photo" src={place.thumb} alt="" />
        <img className="list-avatar" src={place.avatar} alt="" />
      </div>
      <div className="list-meta">
        <div className="list-text">
          <p className="list-name">{place.name}</p>
          <Rating rating={place.rating} reviews={place.reviews} gem={hasGem(place.id)} />
        </div>
        {/* The row-level buttons act on their own, so they swallow the row tap. */}
        <div className="list-actions" onClick={(e) => e.stopPropagation()}>
          <button className="pill pill-soft pill-icon" aria-label={`Saved: ${place.name}`}>
            <Icon name="bookmark_added" size={18} fill />
          </button>
          <button
            className={`pill pill-soft pill-sm${inItinerary ? ' is-done' : ''}`}
            onClick={() => addToItinerary(place.id)}
            disabled={inItinerary}
          >
            <Icon name={inItinerary ? 'check' : 'add'} size={18} />
            Itinerary
          </button>
        </div>
      </div>
    </div>
  )
}

/** A trip recommendation — an itinerary someone else drove, not a place. */
function TripRow({ item }: { item: ListItem }) {
  return (
    <div className="list-row">
      <div className="list-thumb">
        <img className="list-photo" src={item.photo} alt="" />
        <img className="list-avatar" src={item.avatar} alt="" />
      </div>
      <div className="list-meta">
        <div className="list-text">
          <p className="list-name">{item.name}</p>
          {item.byline && (
            <p className="list-byline">
              {item.byline}
              {item.handle && <span className="list-handle"> · {item.handle}</span>}
            </p>
          )}
          <Rating rating={item.rating} reviews={item.reviews} />
        </div>
        <div className="list-actions">
          <button className="pill pill-soft pill-icon" aria-label="Save">
            <Icon name="bookmark_added" size={18} fill />
          </button>
          <button className="pill pill-soft pill-sm">
            <Icon name="add" size={18} />
            Itinerary
          </button>
        </div>
      </div>
    </div>
  )
}

export function DiscoverTab() {
  return (
    <div className="sheet-card">
      <section className="list-section">
        <h2 className="section-label">Saved</h2>
        {SAVED.map((place) => (
          <PlaceRow key={place.id} place={place} />
        ))}
      </section>

      <section className="list-section">
        <h2 className="section-label">From your friends</h2>
        <p className="section-note">People on this jam who have driven parts of it</p>
        {FROM_FRIENDS.map((item) => (
          <TripRow key={item.id} item={item} />
        ))}
      </section>

      <section className="list-section">
        <h2 className="section-label">From travel creators</h2>
        <p className="section-note">Public itineraries that overlap your route — no one here has been on this jam</p>
        {FROM_CREATORS.map((item) => (
          <TripRow key={item.id} item={item} />
        ))}
      </section>
    </div>
  )
}
