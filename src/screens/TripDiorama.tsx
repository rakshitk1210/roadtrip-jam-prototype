import { Fragment } from 'react'
import { Icon } from '../components/Icon'
import type { CurationPhoto } from '../data/curationPhotos'
import type { SouvenirLabel } from '../data/souvenirMap'
import { PREVIEW_ENDS, PREVIEW_ROUTE_SRC, PREVIEW_SLOTS } from '../data/wrappedRoute'

interface Props {
  /** The chosen photos, in the order they fill the stops. */
  photos: CurationPhoto[]
  /** Offers a "+" on each photo when set, for attaching a memory. */
  onAdd?: (id: string) => void
  /** Which photos already carry a memory, so their "+" reads as done. */
  comments?: Record<string, string>
  className?: string
}

/**
 * The souvenir's map, laid out as the souvenir lays it out: the route, the car
 * at its start, the gem at the farm, and each chosen photo in its stop's spot
 * beside the line. Stops still waiting for a photo show an empty ring. The
 * layer is placed by its host — the preview nudges it down to clear a heading,
 * the background picker lifts it to clear its tray.
 */
export function TripDiorama({ photos, onAdd, comments = {}, className = '' }: Props) {
  return (
    <div className={`preview-diorama${className ? ` ${className}` : ''}`}>
      <img className="preview-route-line" src={PREVIEW_ROUTE_SRC} alt="" />

      {/* The car at the start, and the gem found at the farm — the souvenir's
          own stickers, reused as they are. */}
      <div className="souvenir-car" aria-hidden="true">
        <img className="souvenir-car-photo" src="/assets/souvenir-car.png" alt="" />
        <img className="souvenir-car-ring" src="/assets/souvenir-car-ring.svg" alt="" />
      </div>
      <div className="souvenir-gem" aria-hidden="true">
        <img className="souvenir-gem-glow" src="/assets/souvenir-gem-glow.png" alt="" />
        <span className="souvenir-gem-clip">
          <img src="/assets/souvenir-gem.png" alt="" />
        </span>
      </div>

      {PREVIEW_ENDS.map((end) => (
        <DioramaLabel key={end.lines[0]} label={end} />
      ))}

      {PREVIEW_SLOTS.map((slot, i) => {
        const photo = photos[i]
        // Extra spots only appear once there's a photo to fill them.
        if (!photo && !slot.label) return null
        const hasComment = Boolean(photo && comments[photo.id])
        return (
          <Fragment key={i}>
            <span
              className={`preview-slot${photo ? ' is-filled' : ''}`}
              style={{ left: slot.left, top: slot.top, width: slot.size, height: slot.size }}
            >
              {photo && (
                <img
                  className="preview-slot-photo"
                  src={photo.src}
                  alt=""
                  style={{ objectPosition: photo.position }}
                />
              )}
              <img className="preview-slot-ring" src="/assets/souvenir-ring.svg" alt="" />
            </span>
            {photo && onAdd && (
              <button
                type="button"
                className={`preview-pin-add${hasComment ? ' is-commented' : ''}`}
                style={{ left: slot.left + slot.size - 3, top: slot.top + 3 }}
                onClick={() => onAdd(photo.id)}
                aria-label={hasComment ? `Edit memory for ${photo.location}` : `Add a memory for ${photo.location}`}
              >
                <Icon name={hasComment ? 'check' : 'add'} size={13} />
              </button>
            )}
            {slot.label && <DioramaLabel label={slot.label} />}
          </Fragment>
        )
      })}
    </div>
  )
}

/** A stop's name, set where and how the souvenir sets it. */
function DioramaLabel({ label }: { label: SouvenirLabel }) {
  return (
    <p
      className="preview-label"
      style={{ left: label.left, top: label.middle, width: label.width, textAlign: label.align }}
    >
      {label.lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </p>
  )
}
