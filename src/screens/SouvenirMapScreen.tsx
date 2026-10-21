import { Fragment, useEffect, useState } from 'react'
import { StatusBar } from '../components/StatusBar'
import { SOUVENIR_BACKGROUND } from '../data/curationPhotos'
import {
  SOUVENIR_ENDS,
  SOUVENIR_STATS,
  SOUVENIR_STOPS,
  type SouvenirLabel,
  type SouvenirStop,
} from '../data/souvenirMap'
import { useTrip } from '../state/tripContext'
import { useStoryPlayback } from './useStoryPlayback'

/** When the map has finished drawing itself and the share button has arrived. */
const SOUVENIR_SEQUENCE_MS = 4000

/** The route lands first; the stops follow it, one every beat. */
const STOP_STEP_MS = 170

interface Props {
  /** Its place in the stack above the story. */
  index: number
  /** Whether this screen is the one on top. */
  current: boolean
}

/**
 * The souvenir the picker was building: the trip drawn over the photograph it
 * ended on, every stop a print pinned to the route. Figma 2002:1373.
 *
 * The comp is a still, so the assembly is the prototype's own: the route arrives,
 * the stops land along it in the order they were driven, and the numbers type
 * themselves out underneath.
 */
export function SouvenirMapScreen({ index, current }: Props) {
  const { retreatWrapped } = useTrip()
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const { settled, replay, onTap } = useStoryPlayback({
    runMs: SOUVENIR_SEQUENCE_MS,
    current,
    onBack: retreatWrapped,
    // The souvenir is the end of the story: there is nowhere further forward.
    onNext: () => {},
  })

  return (
    <div
      className={`souvenir${entered ? ' is-in' : ''}${settled ? ' is-settled' : ''}`}
      style={{ zIndex: 80 + index }}
      onClick={onTap}
    >
      <img className="souvenir-bg" src={SOUVENIR_BACKGROUND.src} alt="" />
      <div className="souvenir-crown" aria-hidden="true" />
      <div className="souvenir-wash" aria-hidden="true" />
      <div className="souvenir-tint" aria-hidden="true" />

      <StatusBar className="status-bar-on-dark" />

      {/* Keyed so a rewind redraws the map from nothing. */}
      <Fragment key={`map-${replay}`}>
        <p className="souvenir-kicker">your road trip to</p>
        <img className="souvenir-title" src="/assets/souvenir-title.svg" alt="North Cascades" />

        <img className="souvenir-route" src="/assets/souvenir-route.svg" alt="" aria-hidden="true" />

        {/* The car parked at the trip's own beginning, ringed by hand. */}
        <div className="souvenir-car" style={stepStyle(0)} aria-hidden="true">
          <img className="souvenir-car-photo" src="/assets/souvenir-car.png" alt="" />
          <img className="souvenir-car-ring" src="/assets/souvenir-car-ring.svg" alt="" />
        </div>

        {SOUVENIR_ENDS.map((end) => (
          <Label key={end.lines[0]} label={end} className="souvenir-end" step={0} />
        ))}

        {SOUVENIR_STOPS.map((stop, i) => (
          <Sticker key={stop.id} stop={stop} step={i + 1} />
        ))}

        {/* A find worth marking, kept where the route bends towards the farm. */}
        <div className="souvenir-gem" style={stepStyle(1)} aria-hidden="true">
          <img className="souvenir-gem-glow" src="/assets/souvenir-gem-glow.png" alt="" />
          <span className="souvenir-gem-clip">
            <img src="/assets/souvenir-gem.png" alt="" />
          </span>
        </div>

        <dl className="souvenir-stats">
          {SOUVENIR_STATS.map((stat, i) => (
            <div
              className="souvenir-stat"
              key={stat.label}
              style={{ animationDelay: `${2200 + i * 160}ms` }}
            >
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>

        <button className="wrapped-glass souvenir-share" aria-label="Share">
          <img src="/assets/souvenir-share.svg" alt="" />
        </button>
      </Fragment>

      <div className="wrapped-foot souvenir-foot">
        <img src="/assets/wrapped-sparkle.svg" alt="" width={18} height={18} />
        <p>Your Road Trip Wrapped</p>
      </div>
    </div>
  )
}

/** Where a stop falls in the drawing order, which is what paces its arrival. */
const stepStyle = (step: number) => ({ animationDelay: `${1100 + step * STOP_STEP_MS}ms` })

function Sticker({ stop, step }: { stop: SouvenirStop; step: number }) {
  const card = stop.kind === 'card'

  return (
    <>
      <div
        className={`souvenir-stop${card ? ' is-card' : ''}`}
        style={{
          left: `${stop.left}px`,
          top: `${stop.top}px`,
          width: `${stop.width}px`,
          height: `${stop.height}px`,
          ...stepStyle(step),
        }}
        aria-hidden="true"
      >
        <img className="souvenir-stop-photo" src={stop.src} alt="" style={{ objectPosition: stop.focus }} />
        <img
          className="souvenir-stop-ring"
          src={card ? '/assets/souvenir-visitor-ring.svg' : '/assets/souvenir-ring.svg'}
          alt=""
        />
      </div>
      <Label label={stop.label} className="souvenir-label" step={step} />
    </>
  )
}

interface LabelProps {
  label: SouvenirLabel
  className: string
  step: number
}

function Label({ label, className, step }: LabelProps) {
  return (
    <p
      className={`${className}${label.shadow ? ' has-shadow' : ''}`}
      style={{
        left: `${label.left}px`,
        top: `${label.middle}px`,
        width: `${label.width}px`,
        textAlign: label.align,
        ...stepStyle(step),
      }}
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
