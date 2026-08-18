import { Icon } from '../components/Icon'
import { Rating } from '../components/Rating'
import { formatMiles } from '../data/directions'
import { curatedCard } from '../data/places'
import { useTrip } from '../state/tripContext'

/**
 * The place detail sheet for whichever place is open: the Kangaroo Farm from
 * the map, or any saved place from the list. Gemming is not offered here — it
 * belongs to the post-trip actions in the itinerary, once you have been.
 */
export function PlaceDetailSheet({ placeId }: { placeId: string }) {
  const { closePlace, addToItinerary, itinerary, hasGem, findPlace } = useTrip()

  const place = findPlace(placeId)
  if (!place) return null

  // Both actions add to the same list, since the itinerary is the route — they
  // differ only in where the stop lands, so the list and the line still agree.
  const inItinerary = itinerary.some((i) => i.id === place.id)
  const gem = hasGem(place.id)
  // The cafe sheet spells the name out and trades the hours line for the
  // distance, which is what leaves room for the second action.
  const cafe = place.detail
  const card = cafe && curatedCard(place.id)

  return (
    <div className="detail">
      <div className="detail-head">
        <div className="detail-title">
          <h1>{cafe?.title ?? place.name}</h1>
          <Rating
            rating={place.rating}
            reviews={place.reviews}
            size="lg"
            gem={gem}
            suffix={card ? formatMiles(card.distanceMi) : undefined}
          />
          {!cafe && place.hours && <p className="detail-hours">{place.hours}</p>}
        </div>
        <button className="round-btn round-btn-dim" onClick={closePlace} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      <div className="detail-actions">
        <button
          className={`pill pill-strong${inItinerary ? ' is-done' : ''}`}
          onClick={() => addToItinerary(place.id, cafe ? 'next' : 'end')}
          disabled={inItinerary}
        >
          <Icon name="directions" fill />
          {inItinerary ? 'Stop added' : 'Add stop'}
        </button>
        {cafe && (
          <button
            className={`pill pill-soft${inItinerary ? ' is-done' : ''}`}
            onClick={() => addToItinerary(place.id, 'end')}
            disabled={inItinerary}
          >
            <Icon name="add" />
            {inItinerary ? 'In itinerary' : 'Add to itinerary'}
          </button>
        )}
      </div>

      <div className="photo-collage">
        <img className="collage-main" src={place.photos[0]} alt="" />
        <div className="collage-col">
          <img src={place.photos[1]} alt="" />
          <img src={place.photos[2]} alt="" />
        </div>
        {cafe && (
          <>
            {card && <span className="collage-badge">{card.badge}</span>}
            <div className="collage-note">
              <p className="collage-note-text">“{cafe.note.text}”</p>
              <p className="collage-note-by">
                <img src={cafe.note.avatar} alt="" />
                {cafe.note.author}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="kbyg">
        <div className="kbyg-title">
          <img src="/assets/ic-google-ai.svg" alt="" width={24} height={24} />
          Know before you go
        </div>
        <ul>
          {place.knowBeforeYouGo.map((tip) => (
            <li key={tip}>
              <span>{tip}</span>
              <span className="kbyg-chevron">
                <Icon name="chevron_right" size={16} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
