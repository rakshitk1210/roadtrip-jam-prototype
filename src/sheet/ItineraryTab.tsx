import { Icon } from '../components/Icon'
import { Rating } from '../components/Rating'
import { PLACES } from '../data/places'
import { useTrip, type ItineraryItem } from '../state/tripContext'

function Row({ item }: { item: ItineraryItem }) {
  const { hasGem, openPlace } = useTrip()
  // Only rows backed by a real place can open a detail sheet.
  const openable = Boolean(PLACES[item.id])

  return (
    <div
      className={`itin-row${openable ? ' is-tappable' : ''}`}
      role={openable ? 'button' : undefined}
      tabIndex={openable ? 0 : undefined}
      onClick={openable ? () => openPlace(item.id) : undefined}
      onKeyDown={
        openable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openPlace(item.id)
              }
            }
          : undefined
      }
    >
      <Icon name="drag_indicator" size={24} className="drag-dots" />
      <div className="itin-thumb">
        <img className="itin-photo" src={item.photo} alt="" />
        <img className="itin-avatar" src="/assets/avatar-friend.png" alt="" />
      </div>
      <div className="itin-meta">
        <div className="itin-text">
          <p className="itin-name">{item.name}</p>
          <Rating rating={item.rating} reviews={item.reviews} gem={hasGem(item.id)} />
        </div>
        <button className="pill pill-soft pill-sm" onClick={(e) => e.stopPropagation()}>
          <Icon name="directions" size={16} fill />
          Directions
        </button>
      </div>
    </div>
  )
}

export function ItineraryTab() {
  const { morning, evening } = useTrip()
  return (
    <div className="sheet-card">
      <section className="itin-section">
        <h2 className="section-label">Morning</h2>
        {morning.map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </section>
      <section className="itin-section">
        <h2 className="section-label">Evening</h2>
        {evening.map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </section>
    </div>
  )
}
