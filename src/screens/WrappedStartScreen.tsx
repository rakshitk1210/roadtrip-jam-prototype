import { Fragment, useEffect, useState } from 'react'
import { StatusBar } from '../components/StatusBar'
import { WrappedStory } from '../components/WrappedStory'
import { WRAPPED_FRAMES } from '../data/wrappedFrames'
import { useTrip } from '../state/tripContext'
import { useStoryPlayback } from './useStoryPlayback'
import {
  ADVANCE_MS,
  SLIDE_MS,
  START_FILL_MS,
  START_REVEAL,
  START_REVEAL_MS,
  frameTiming,
} from './wrappedTimeline'

const FIRST_FRAME_FILL_MS = frameTiming(WRAPPED_FRAMES[0]).fill

/**
 * Second frame of Road Trip Wrapped (Figma 1754:558). Slides up over the prompt,
 * then unveils the greeting, the lede, the question and the button in turn.
 */
export function WrappedStartScreen({ current }: { current: boolean }) {
  const { advanceWrapped, retreatWrapped } = useTrip()
  const [entered, setEntered] = useState(false)
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Bar two starts filling here and the first frame picks it up mid-fill, so the
  // loader carries across the cut instead of restarting.
  const advance = () => {
    if (advancing) return
    setAdvancing(true)
    window.setTimeout(advanceWrapped, ADVANCE_MS)
  }

  const { settled, replay, onTap } = useStoryPlayback({
    runMs: START_FILL_MS + SLIDE_MS,
    current,
    // Nothing sits behind the intro, so stepping back leaves the story.
    onBack: retreatWrapped,
    onNext: advance,
    onReplay: () => setAdvancing(false),
  })

  // The spark's hover picks up where the greeting's rise leaves off, or straight
  // away on a screen that has been run out to its end.
  const sparkDelay = settled ? 0 : START_REVEAL.greet + START_REVEAL_MS

  return (
    <div
      className={`wrapped-start${entered ? ' is-in' : ''}${settled ? ' is-settled' : ''}`}
      onClick={onTap}
    >
      <div className="wrapped-start-bg-clip" aria-hidden="true">
        <img className="wrapped-start-bg" src="/assets/wrapped-start-bg.png" alt="" />
        <div className="wrapped-start-dream" />
      </div>
      <div className="wrapped-start-scrim" aria-hidden="true" />
      <div className="wrapped-start-wash" aria-hidden="true" />

      <StatusBar className="status-bar-on-dark" />

      {/* Keyed so a rewind remounts the copy and every reveal plays again. */}
      <Fragment key={replay}>
        <WrappedStory
          active={advancing ? 1 : 0}
          fillMs={advancing ? FIRST_FRAME_FILL_MS : START_FILL_MS}
          delayMs={advancing ? 0 : SLIDE_MS}
          filled={settled && !advancing}
        />

        <div className="wrapped-start-body">
          <div
            className="wrapped-reveal wrapped-greet"
            style={{ animationDelay: `${START_REVEAL.greet}ms` }}
          >
            <img
              src="/assets/wrapped-sparkle-lg.svg"
              alt=""
              width={46}
              height={46}
              style={{ animationDelay: `${sparkDelay}ms` }}
            />
            <p className="wrapped-hi">Hi, Rakshit</p>
          </div>

          <p className="wrapped-reveal wrapped-lede" style={{ animationDelay: `${START_REVEAL.lede}ms` }}>
            Your <strong>North Cascades Road Trip Wrapped</strong>
            <br />
            starts here.
          </p>

          <p
            className="wrapped-reveal wrapped-rewind"
            style={{ animationDelay: `${START_REVEAL.rewind}ms` }}
          >
            Ready to rewind?
          </p>

          <button
            className="wrapped-reveal wrapped-glass"
            style={{ animationDelay: `${START_REVEAL.cta}ms` }}
            onClick={advance}
          >
            Get started
            <img src="/assets/wrapped-arrow.svg" alt="" />
          </button>
        </div>
      </Fragment>

      <div className="wrapped-foot">
        <img src="/assets/wrapped-sparkle.svg" alt="" width={18} height={18} />
        <p>Your Road Trip Wrapped</p>
      </div>
    </div>
  )
}
