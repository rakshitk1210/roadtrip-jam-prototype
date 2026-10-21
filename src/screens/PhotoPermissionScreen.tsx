import { useEffect, useState } from 'react'
import { StatusBar } from '../components/StatusBar'

const ASSETS = '/assets/permissions'

/** Matches --wrapped-slide, the sheet's slide in and out. */
const SLIDE_MS = 520

interface Props {
  /** Access granted — the story can start; its intro slides up over this. */
  onAllow: () => void
  /** Turned down, here or at the system prompt, once the sheet has slid away. */
  onDismiss: () => void
}

/**
 * What "Add to your Wrapped" asks first: whether the story may use this trip's
 * photos (Figma 1703:6397). Continue dims it under the phone's own photo-access
 * prompt (Figma 1703:6802 is that dim); allowing access hands over to the
 * story's intro.
 */
export function PhotoPermissionScreen({ onAllow, onDismiss }: Props) {
  const [entered, setEntered] = useState(false)
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // The system prompt closes as soon as access is given, as iOS's does.
  const allow = () => {
    setAsking(false)
    onAllow()
  }

  // Turning it down slides the sheet back down before it goes.
  const dismiss = () => {
    setAsking(false)
    setEntered(false)
    window.setTimeout(onDismiss, SLIDE_MS)
  }

  return (
    <div className={`permission${entered ? ' is-in' : ''}`}>
      <div className="permission-bg" aria-hidden="true">
        <img src={`${ASSETS}/bg.png`} alt="" />
      </div>

      {/* Three prints, fanned. The right one shows the mountain, laid over
          the beach shot the design keeps underneath it. */}
      <div className="permission-print-turn permission-print-left" aria-hidden="true">
        <div className="permission-print">
          <img className="permission-crop-beach" src={`${ASSETS}/photo-beach.png`} alt="" />
        </div>
      </div>
      <div className="permission-print-turn permission-print-right" aria-hidden="true">
        <div className="permission-print">
          <img className="permission-crop-beach" src={`${ASSETS}/photo-beach.png`} alt="" />
          <img className="permission-crop-mountain" src={`${ASSETS}/photo-mountain.png`} alt="" />
        </div>
      </div>
      <div className="permission-print-turn permission-print-middle" aria-hidden="true">
        <div className="permission-print">
          <img className="permission-crop-road" src={`${ASSETS}/photo-road.png`} alt="" />
        </div>
      </div>

      <div className="permission-foot">
        <img src={`${ASSETS}/google-ai.svg`} alt="" width={18} height={18} />
        <p>Your Road Trip Wrapped</p>
      </div>

      <div className="permission-body">
        <h1>
          Personalize with
          <br />
          Google Photos
        </h1>
        <p className="permission-copy">
          Allow Road Trip Wrapped to use photos from this trip to pair with your stats and highlights.
        </p>
        <p className="permission-note">
          <img src={`${ASSETS}/shield.svg`} alt="" width={24.5} height={24.5} />
          What you share is always up to you.
        </p>
        <button className="permission-continue" onClick={() => setAsking(true)}>
          Continue
        </button>
        <button className="permission-later" onClick={dismiss}>
          Not now
        </button>
      </div>

      {/* Soft colour pooled at the edges, and the scattered sparkles. */}
      <div className="permission-glow permission-glow-bottom" aria-hidden="true">
        <img src={`${ASSETS}/glow-bottom.svg`} alt="" />
      </div>
      <div className="permission-glow permission-glow-top" aria-hidden="true">
        <img src={`${ASSETS}/glow-top.svg`} alt="" />
      </div>
      <img className="permission-spark permission-spark-large" src={`${ASSETS}/spark-large.svg`} alt="" />
      <img className="permission-spark permission-spark-small" src={`${ASSETS}/spark-small.svg`} alt="" />
      <img className="permission-spark permission-spark-pink" src={`${ASSETS}/spark-pink.svg`} alt="" />
      <div className="permission-glow permission-glow-top-right" aria-hidden="true">
        <img src={`${ASSETS}/glow-top-right.svg`} alt="" />
      </div>
      <div className="permission-glow permission-glow-corner" aria-hidden="true">
        <img src={`${ASSETS}/glow-corner.svg`} alt="" />
      </div>
      <div className="permission-glow permission-glow-edge" aria-hidden="true">
        <img src={`${ASSETS}/glow-edge.svg`} alt="" />
      </div>

      <StatusBar />

      <img className="permission-dot permission-dot-a" src={`${ASSETS}/dot-a.svg`} alt="" />
      <img className="permission-dot permission-dot-c" src={`${ASSETS}/dot-c.svg`} alt="" />
      <img className="permission-dot permission-dot-b" src={`${ASSETS}/dot-b.svg`} alt="" />

      {/* Two stickers cut from one sheet. */}
      <div className="permission-sticker-turn permission-sticker-a" aria-hidden="true">
        <div className="permission-sticker">
          <img src={`${ASSETS}/stickers.png`} alt="" />
        </div>
      </div>
      <div className="permission-sticker-turn permission-sticker-b" aria-hidden="true">
        <div className="permission-sticker">
          <img src={`${ASSETS}/stickers.png`} alt="" />
        </div>
      </div>

      {/* The phone's own prompt, over the screen dimmed by half. */}
      {asking && (
        <div className="permission-dim">
          <div className="ios-alert" role="alertdialog" aria-labelledby="ios-alert-title">
            <div className="ios-alert-text">
              <p id="ios-alert-title" className="ios-alert-title">
                &ldquo;Google Maps&rdquo; Would Like to Access Your Photos
              </p>
              <p className="ios-alert-message">
                Photos from your trip are used to build your Road Trip Wrapped.
              </p>
            </div>
            <button className="ios-alert-action" onClick={allow}>
              Limit Access&hellip;
            </button>
            <button className="ios-alert-action" onClick={allow}>
              Allow Full Access
            </button>
            <button className="ios-alert-action" onClick={dismiss}>
              Don&rsquo;t Allow
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
