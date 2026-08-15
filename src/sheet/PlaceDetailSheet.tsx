import { Icon } from '../components/Icon'
import { Rating } from '../components/Rating'
import { useTrip } from '../state/tripContext'

/**
 * The place detail sheet — the three Roadtrip Jam actions (add stop, add to
 * itinerary, mark as gem) for whichever place is open: the Kangaroo Farm from
 * the map, or any saved place from the list.
 */
export function PlaceDetailSheet({ placeId }: { placeId: string }) {
  const { closePlace, addStop, addToItinerary, toggleGem, stops, morning, evening, hasGem, findPlace } =
    useTrip()

  const place = findPlace(placeId)
  if (!place) return null

  const stopAdded = stops.includes(place.id)
  const inItinerary = [...morning, ...evening].some((i) => i.id === place.id)
  const gem = hasGem(place.id)

  return (
    <div className="detail">
      <div className="detail-head">
        <div className="detail-title">
          <h1>{place.name}</h1>
          <Rating rating={place.rating} reviews={place.reviews} size="lg" gem={gem} />
          {place.hours && <p className="detail-hours">{place.hours}</p>}
        </div>
        <button className="round-btn round-btn-dim" onClick={closePlace} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      <div className="detail-actions">
        <button
          className={`pill pill-strong${stopAdded ? ' is-done' : ''}`}
          onClick={() => addStop(place.id)}
          disabled={stopAdded}
        >
          <Icon name="directions" fill />
          {stopAdded ? 'Stop added' : 'Add stop'}
        </button>
        <button
          className={`pill pill-soft${inItinerary ? ' is-done' : ''}`}
          onClick={() => addToItinerary(place.id)}
          disabled={inItinerary}
        >
          <Icon name="add" />
          {inItinerary ? 'In itinerary' : 'Add to itinerary'}
        </button>
        <button
          className={`pill pill-soft${gem ? ' is-gem' : ''}`}
          onClick={() => toggleGem(place.id)}
          aria-pressed={gem}
        >
          {gem ? <img src="/assets/gem-diamond.png" alt="" width={20} height={20} /> : <Icon name="diamond" />}
          {gem ? 'Your gem' : 'Mark as Gem'}
        </button>
      </div>

      <div className="photo-collage">
        <img className="collage-main" src={place.photos[0]} alt="" />
        <div className="collage-col">
          <img src={place.photos[1]} alt="" />
          <img src={place.photos[2]} alt="" />
        </div>
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
