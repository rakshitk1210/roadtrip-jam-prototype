import { Fragment, useEffect, useState } from 'react'
import { StatusBar } from '../components/StatusBar'
import { WrappedStory } from '../components/WrappedStory'
import { type WrappedFrame } from '../data/wrappedFrames'
import { useTrip } from '../state/tripContext'
import { useStoryPlayback } from './useStoryPlayback'
import { ADVANCE_MS, frameTiming, beatDelay } from './wrappedTimeline'

interface Props {
  frame: WrappedFrame
  /** Which progress bar belongs to this frame, and its place in the story. */
  index: number
  /** The fill length of the frame this one leads to, or null at the end of the story. */
  nextFillMs: number | null
  /** Whether this frame is the one on top of the story. */
  current: boolean
}

/**
 * One story frame. The image opens clean, the scrim dissolves over it, and the
 * copy unveils a section at a time while the progress bar fills. Light frames
 * carry a pale wash and blue copy instead of the scrim.
 */
export function WrappedFrameScreen({ frame, index, nextFillMs, current }: Props) {
  const { advanceWrapped, retreatWrapped } = useTrip()
  const [entered, setEntered] = useState(false)
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const light = frame.tone === 'light'
  const { first, next: arrowDelay, sequence: sequenceMs, fill: fillMs } = frameTiming(frame)
  /** The mark takes the first beat, so the sections start on the one after it. */
  const hasMark = Boolean(frame.mark || frame.blooms?.length)
  const firstSection = hasMark ? 1 : 0
  // The next bar starts filling here and the incoming frame picks it up mid-fill,
  // so the loader carries across the cut instead of restarting.
  const advance = () => {
    if (advancing || nextFillMs === null) return
    setAdvancing(true)
    window.setTimeout(advanceWrapped, ADVANCE_MS)
  }

  const { settled, replay, onTap } = useStoryPlayback({
    runMs: sequenceMs,
    current,
    onBack: retreatWrapped,
    onNext: advance,
    onReplay: () => setAdvancing(false),
  })

  return (
    <div
      className={`wrapped-frame${light ? ' is-light' : ''}${entered ? ' is-in' : ''}${
        settled ? ' is-settled' : ''
      }`}
      style={{ zIndex: 80 + index }}
      onClick={onTap}
    >
      <div className="wrapped-frame-bg-clip" aria-hidden="true">
        <img
          className="wrapped-frame-bg"
          src={frame.image}
          alt=""
          style={{ ...frame.crop, ['--frame-turn' as string]: frame.turn }}
        />
      </div>
      {/* Keyed so a rewind remounts the layers and every animation plays again. */}
      <Fragment key={`scrim-${replay}`}>
        {light ? (
          <div className="wrapped-frame-grain" aria-hidden="true" />
        ) : (
          <>
            <div className="wrapped-frame-darken" aria-hidden="true" />
            <div className="wrapped-frame-wash" aria-hidden="true" />
          </>
        )}
        {frame.overlay && (
          <img
            className="wrapped-invite-route"
            src={frame.overlay.src}
            alt=""
            style={{
              left: frame.overlay.left,
              top: frame.overlay.top,
              width: frame.overlay.width,
              height: frame.overlay.height,
              transform: frame.overlay.turn,
            }}
          />
        )}
      </Fragment>

      {/* Every frame in the design keeps the same darkened strip, wash or photo. */}
      <StatusBar className="status-bar-on-dark" />

      <Fragment key={`copy-${replay}`}>
        <WrappedStory
          active={advancing ? index + 1 : index}
          fillMs={advancing && nextFillMs !== null ? nextFillMs : fillMs}
          delayMs={advancing ? 0 : -ADVANCE_MS}
          filled={settled && !advancing}
        />

        <div className={`wrapped-frame-body${frame.share ? ' has-share' : ''}`}>
          {frame.blooms?.map((bloom, i) => (
            <span
              key={i}
              className="wrapped-reveal wrapped-frame-mark wrapped-invite-bloom"
              style={{
                left: bloom.left,
                top: bloom.top,
                width: bloom.width,
                height: bloom.height,
                animationDelay: `${beatDelay(0, first)}ms`,
              }}
            >
              <img
                src={bloom.src}
                alt=""
                width={bloom.width}
                height={bloom.height}
                style={{ animationDelay: `${beatDelay(0, first)}ms` }}
              />
            </span>
          ))}

          {frame.mark && !frame.blooms && (
            <span
              className="wrapped-reveal wrapped-frame-mark"
              style={{ animationDelay: `${beatDelay(0, first)}ms` }}
            >
              <img
                src={frame.mark.src}
                alt=""
                width={frame.mark.width}
                height={frame.mark.height}
                style={{ animationDelay: `${beatDelay(0, first)}ms` }}
              />
            </span>
          )}

          {frame.sections.map((lines, i) => (
            <div
              key={i}
              className="wrapped-reveal wrapped-frame-section"
              style={{ animationDelay: `${beatDelay(i + firstSection, first)}ms` }}
            >
              {lines.map((line, j) => (
                <p key={j} className={`wrapped-line-${line.kind}`}>
                  {line.runs.map((run, k) =>
                    'br' in run ? (
                      <br key={k} />
                    ) : run.strong ? (
                      <strong key={k}>{run.text}</strong>
                    ) : (
                      <span key={k}>{run.text}</span>
                    ),
                  )}
                </p>
              ))}
            </div>
          ))}

          {frame.share && (
            <button
              className="wrapped-reveal wrapped-glass wrapped-frame-share"
              style={{
                animationDelay: `${beatDelay(firstSection + frame.sections.length, first)}ms`,
              }}
            >
              <img src="/assets/wrapped-share.svg" alt="" />
              Share
            </button>
          )}
        </div>

        {nextFillMs !== null && (
          <button
            className="wrapped-reveal wrapped-next"
            style={{ animationDelay: `${arrowDelay}ms` }}
            onClick={advance}
            aria-label="Next"
          >
            <img src="/assets/wrapped-arrow.svg" alt="" />
          </button>
        )}
      </Fragment>

      <div className="wrapped-foot">
        <img
          src="/assets/wrapped-sparkle.svg"
          alt=""
          width={18}
          height={18}
        />
        <p>Your Road Trip Wrapped</p>
      </div>
    </div>
  )
}
