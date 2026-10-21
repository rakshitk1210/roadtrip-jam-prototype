import { Fragment, useEffect, useRef, useState } from 'react'
import { StatusBar } from '../components/StatusBar'
import { WrappedStory } from '../components/WrappedStory'
import {
  CURATION_DATE,
  CURATION_PHOTOS,
  CURATION_PINS,
  PHOTO_LIMIT,
  type CurationPhoto,
} from '../data/curationPhotos'
import { useTrip } from '../state/tripContext'
import { useStoryPlayback } from './useStoryPlayback'
import { ADVANCE_MS } from './wrappedTimeline'

/** When the screen has finished opening: the last tile has landed and the header has risen. */
const PICKER_SEQUENCE_MS = 1500

/**
 * The story pauses here, so the bar for this screen holds where the design leaves
 * it — empty. The fill still needs a length, and this one is long enough that it
 * reads as still.
 */
export const PICKER_HOLD_MS = 600_000

interface Props {
  /** Which progress bar belongs to this screen, and its place in the stack. */
  index: number
  /** Whether this screen is the one on top of the story. */
  current: boolean
}

/**
 * Curating the trip: the map the chosen photos will live on, and the roll they
 * are chosen from. Figma 2002:1067, with the chosen treatment from 2002:1217.
 * Choosing a photo shrinks it into its tile, numbers it, and puts a point on the
 * map — so the souvenir is being built while it is being picked.
 */
export function PhotoPickerScreen({ index, current }: Props) {
  const { wrappedPhotos, toggleWrappedPhoto, advanceWrapped, retreatWrapped } = useTrip()
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const chosen = wrappedPhotos.length
  const left = PHOTO_LIMIT - chosen

  const { settled, replay, onTap } = useStoryPlayback({
    runMs: PICKER_SEQUENCE_MS,
    current,
    onBack: retreatWrapped,
    // The picker waits on the user rather than on a clock: only a photo on the
    // map opens the way to the souvenir it makes.
    onNext: () => {
      if (chosen > 0) advanceWrapped()
    },
  })

  return (
    <div
      className={`photo-picker${entered ? ' is-in' : ''}${settled ? ' is-settled' : ''}`}
      style={{ zIndex: 80 + index }}
      onClick={onTap}
    >
      <div className="picker-map" aria-hidden="true">
        <img src="/assets/picker-map.jpg" alt="" />
      </div>

      <div className="picker-status-blend" aria-hidden="true" />

      {/* The design hangs these above the blend, so they keep their colour. */}
      <div className="picker-sky" aria-hidden="true">
        <img className="picker-glow-a" src="/assets/picker-glow-a.svg" alt="" />
        <img className="picker-glow-b" src="/assets/picker-glow-b.svg" alt="" />
      </div>

      <div className="picker-marks" aria-hidden="true">
        {CURATION_PINS.map((pin, i) => (
          <span
            key={i}
            className={`picker-pin${pin.resting ? ' is-resting' : ''}${
              i < chosen ? ' is-lit' : ''
            }`}
            style={{ left: pin.left, top: pin.top, width: pin.size, height: pin.size }}
          />
        ))}
        <img
          className="picker-cluster"
          src="/assets/picker-cluster.png"
          alt=""
          width={92}
          height={92}
        />
        <img
          className="picker-cluster-tail"
          src="/assets/picker-pin-nub.svg"
          alt=""
          width={12}
          height={11}
        />
      </div>

      <StatusBar className="status-bar-on-dark" />

      <Fragment key={`copy-${replay}`}>
        <WrappedStory active={index} fillMs={PICKER_HOLD_MS} delayMs={-ADVANCE_MS} />
        <p className="picker-reveal picker-head">
          <strong>
            Choose up to {left} {left === 1 ? 'photo' : 'photos'}
          </strong>{' '}
          <span>that capture your trip.</span>
        </p>
        {/* The running tally, under the instruction it answers. Its number keeps
            the magenta the badges number the tiles in, so the chip and the grid
            read as one count. */}
        <p className="picker-reveal wrapped-glass picker-chip">
          <strong key={chosen}>{chosen}</strong> selected
        </p>
      </Fragment>

      <div className="picker-sheet">
        <span className="picker-grabber" />
        <div className="picker-sheet-head">
          <p>{CURATION_DATE}</p>
          <img src="/assets/picker-maps-icon.svg" alt="" width={15} height={15} />
        </div>
        <div className="picker-roll">
          <p className="picker-stamp">1:26 PM</p>
          <div className="picker-grid">
            {CURATION_PHOTOS.map((photo, i) => (
              <PickerTile
                key={photo.id}
                photo={photo}
                order={wrappedPhotos.indexOf(photo.id) + 1}
                step={i}
                onToggle={() => toggleWrappedPhoto(photo.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="picker-wash" aria-hidden="true" />

      {/* The warm bloom the design lays over the whole top of the frame, status
          strip included, so it comes last. */}
      <img className="picker-glow-top" src="/assets/picker-glow-top.svg" alt="" />

      {/* Nothing to carry forward until a photo is on the map, so the arrow keeps
          out of the way until there is. */}
      <button
        className={`wrapped-next picker-next${chosen > 0 ? ' is-ready' : ''}`}
        onClick={advanceWrapped}
        aria-label="Make the map"
        aria-hidden={chosen === 0}
        tabIndex={chosen > 0 ? 0 : -1}
      >
        <img src="/assets/wrapped-arrow.svg" alt="" />
      </button>

      <div className="wrapped-foot picker-foot">
        <img src="/assets/wrapped-sparkle.svg" alt="" width={18} height={18} />
        <p>Your Road Trip Wrapped</p>
      </div>
    </div>
  )
}

interface TileProps {
  photo: CurationPhoto
  /** Its place in the chosen order, or 0 while it isn't chosen. */
  order: number
  /** Its place in the grid, which is the order the tiles land in. */
  step: number
  onToggle: () => void
}

function PickerTile({ photo, order, step, onToggle }: TileProps) {
  const chosen = order > 0
  // The badge shrinks away rather than blinking out, so it keeps the last number
  // it carried for as long as it is still on screen.
  const shown = useRef(order)
  if (chosen) shown.current = order

  return (
    <button
      className={`picker-tile${chosen ? ' is-picked' : ''}`}
      style={{ ['--tile-step' as string]: `${step}` }}
      onClick={onToggle}
      aria-pressed={chosen}
      aria-label={chosen ? `Photo ${order} of your map` : 'Add this photo to your map'}
    >
      <span className="picker-tile-photo">
        <img src={photo.src} alt="" style={{ objectPosition: photo.position }} />
      </span>
      {/* Keyed on the number so renumbering plays the tick again. */}
      <span className="picker-badge" aria-hidden="true">
        <i key={shown.current}>{shown.current || ''}</i>
      </span>
    </button>
  )
}
