import { useEffect, useRef } from 'react'
import { phoneScale } from '../phoneScale'
import { useTrip } from '../state/tripContext'

/**
 * What the itinerary offers once the trip is behind you: the two things worth
 * saying about a place you have actually been to. It expands in the list rather
 * than floating over it, so the row it belongs to stays visible above it.
 */
export function PostTripPanel({ id, name }: { id: string; name: string }) {
  const { openGemDraft, openReview } = useTrip()
  const ref = useRef<HTMLDivElement>(null)

  // Opened by shortcut rather than by a tap, so the row it belongs to may be
  // nowhere near the visible part of the list. Nothing would appear to happen.
  //
  // The sheet is scrolled by hand rather than through `scrollIntoView`, which
  // also scrolls the clipped containers outside it and drags the whole phone
  // out of position.
  useEffect(() => {
    const el = ref.current
    const body = el?.closest('.sheet-body')
    if (!el || !body) return
    // The tab pill floats over the foot of the sheet, so stopping at the edge
    // would leave the actions under it.
    // Rects are in window pixels; scrolling is in the phone's layout pixels.
    const scale = phoneScale()
    const hidden =
      (el.getBoundingClientRect().bottom - body.getBoundingClientRect().bottom) / scale + 120
    if (hidden > 0) body.scrollBy({ top: hidden, behavior: 'smooth' })
  }, [])

  return (
    <div className="post-trip" ref={ref}>
      <p className="post-trip-title">How was {name}?</p>
      <div className="post-trip-actions">
        <button className="pill pill-soft pill-sm" onClick={() => openGemDraft(id)}>
          Mark as Hidden Gem <span className="post-trip-gem">💎</span>
        </button>
        <button className="pill pill-soft pill-sm" onClick={() => openReview(id)}>
          Rate &amp; Review
        </button>
      </div>
    </div>
  )
}
