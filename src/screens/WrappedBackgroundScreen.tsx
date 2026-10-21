import { useEffect, useState, type CSSProperties, type PointerEvent } from 'react'
import { Icon } from '../components/Icon'
import { StatusBar } from '../components/StatusBar'
import { WrappedStory } from '../components/WrappedStory'
import {
  BACKGROUND_CHOICES,
  CURATION_PHOTOS,
  SOUVENIR_BACKGROUND,
  type CurationPhoto,
} from '../data/curationPhotos'
import { phoneY } from '../phoneScale'
import { useTrip } from '../state/tripContext'
import { TripDiorama } from './TripDiorama'
import { useStoryPlayback } from './useStoryPlayback'
import { ADVANCE_MS } from './wrappedTimeline'

/** Waits on the user, the same way the picker and preview screens do. */
const BACKGROUND_HOLD_MS = 600_000

/**
 * The tray's top edge when pulled all the way up, and how far it travels down
 * from there to rest just clear of the map (at 600px, below its last label).
 */
const TRAY_TOP = 250
const TRAY_TRAVEL = 350

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/**
 * Crops a photo into its square tile. A photo stored squashed is stretched
 * back to its true shape first — full tile width, as tall as that makes it —
 * then slid up to its focus, so it's cropped rather than squashed.
 */
function tileImageStyle(photo: CurationPhoto): CSSProperties {
  if (!photo.displayAspect) return { objectPosition: photo.position }
  const height = 100 / photo.displayAspect
  const focusY = parseFloat(photo.position.split(' ')[1] ?? '50') / 100
  return {
    position: 'absolute',
    left: 0,
    top: `${-(height - 100) * focusY}%`,
    width: '100%',
    height: `${height}%`,
    objectFit: 'fill',
  }
}

interface Props {
  index: number
  current: boolean
}

/**
 * The last choice before the souvenir is drawn: which photo it's framed
 * against. The map the preview built stays up top — lifted into the space the
 * heading held — and the roll comes back up as a shorter tray, so nothing on
 * the map is covered. A tap picks one; a photo is picked by default, so the
 * story can move on either way.
 */
export function WrappedBackgroundScreen({ index, current }: Props) {
  const { wrappedPhotos, backgroundPhotoId, setBackgroundPhoto, advanceWrapped, retreatWrapped } = useTrip()
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const photos = wrappedPhotos
    .map((id) => CURATION_PHOTOS.find((photo) => photo.id === id))
    .filter((photo): photo is (typeof CURATION_PHOTOS)[number] => Boolean(photo))

  // The souvenir's own photo is picked unless another one has been.
  useEffect(() => {
    if (!backgroundPhotoId) setBackgroundPhoto(SOUVENIR_BACKGROUND.id)
  }, [backgroundPhotoId, setBackgroundPhoto])

  // The tray rests low so the map shows, and pulls up to show the whole roll.
  const [trayOpen, setTrayOpen] = useState(false)
  const [drag, setDrag] = useState<{ start: number; from: number; y: number } | null>(null)
  const trayOffset = drag
    ? clamp(drag.from + drag.y - drag.start, 0, TRAY_TRAVEL)
    : trayOpen
      ? 0
      : TRAY_TRAVEL

  const onHandleDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ start: phoneY(e), from: trayOffset, y: phoneY(e) })
  }
  const onHandleMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag) setDrag({ ...drag, y: phoneY(e) })
  }
  const onHandleUp = () => {
    if (!drag) return
    // A tap toggles the tray; a drag settles it on whichever end is nearer.
    if (Math.abs(drag.y - drag.start) < 4) setTrayOpen((open) => !open)
    else setTrayOpen(trayOffset < TRAY_TRAVEL / 2)
    setDrag(null)
  }

  const { settled, onTap } = useStoryPlayback({
    runMs: BACKGROUND_HOLD_MS,
    current,
    onBack: retreatWrapped,
    onNext: advanceWrapped,
  })

  return (
    <div
      className={`wrapped-background${entered ? ' is-in' : ''}${settled ? ' is-settled' : ''}`}
      style={{ zIndex: 80 + index }}
      onClick={onTap}
    >
      <StatusBar className="status-bar-on-dark" />

      <WrappedStory active={index} fillMs={BACKGROUND_HOLD_MS} delayMs={-ADVANCE_MS} />

      <TripDiorama photos={photos} className="is-raised" />

      {/* The picker's own roll, as a tray that rests low and pulls up. Taps
          inside it never reach the story's tap-to-advance. */}
      <div
        className="picker-sheet bg-sheet"
        style={{
          top: TRAY_TOP,
          transform: entered ? `translateY(${trayOffset}px)` : undefined,
          transition: drag ? 'none' : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="bg-sheet-handle"
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
        >
          <span className="picker-grabber" />
          <div className="picker-sheet-head">
            <p>Choose a background</p>
          </div>
        </div>
        <div className="picker-roll">
          <div className="picker-grid">
            {BACKGROUND_CHOICES.map((photo, i) => {
              const on = photo.id === backgroundPhotoId
              return (
                <button
                  key={photo.id}
                  className={`picker-tile${on ? ' is-picked' : ''}`}
                  style={{ ['--tile-step' as string]: `${i}` }}
                  onClick={() => setBackgroundPhoto(photo.id)}
                  aria-pressed={on}
                  aria-label={`Use ${photo.location} as the background`}
                >
                  <span className="picker-tile-photo">
                    <img src={photo.src} alt="" style={tileImageStyle(photo)} />
                  </span>
                  <span className="picker-badge" aria-hidden="true">
                    <Icon name="check" size={13} />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="picker-wash" aria-hidden="true" />

      <button className="wrapped-next picker-next is-ready" onClick={advanceWrapped} aria-label="Make the souvenir">
        <img src="/assets/wrapped-arrow.svg" alt="" />
      </button>

      <div className="wrapped-foot picker-foot">
        <img src="/assets/wrapped-sparkle.svg" alt="" width={18} height={18} />
        <p>Your Road Trip Wrapped</p>
      </div>
    </div>
  )
}
