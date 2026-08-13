import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Snap } from '../state/tripContext'
import { SNAP_FRACTION, SNAP_ORDER as ORDER } from './snaps'

interface Props {
  snap: Snap
  onSnapChange: (snap: Snap) => void
  /** Rendered inside the drag zone — handle, tabs. */
  header: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Draggable three-snap sheet. The sheet is always laid out at its tallest snap
 * and translated down to reveal less, so its content never reflows mid-drag.
 */
export function BottomSheet({ snap, onSnapChange, header, children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ startY: number; startTranslate: number; y: number; t: number } | null>(null)
  const [viewport, setViewport] = useState(() => window.innerHeight)

  useEffect(() => {
    const onResize = () => setViewport(ref.current?.parentElement?.clientHeight ?? window.innerHeight)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const fullPx = viewport * SNAP_FRACTION.full
  const translateFor = useCallback(
    (s: Snap) => fullPx - viewport * SNAP_FRACTION[s],
    [fullPx, viewport],
  )

  const translate = drag
    ? clampRubber(drag.startTranslate + (drag.y - drag.startY), 0, translateFor('peek'))
    : translateFor(snap)

  const onPointerDown = (e: React.PointerEvent) => {
    // Buttons living in the drag zone (the tabs) keep their taps: capturing the
    // pointer here would swallow the click that follows.
    if ((e.target as HTMLElement).closest('button')) return
    setDrag({ startY: e.clientY, startTranslate: translateFor(snap), y: e.clientY, t: performance.now() })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return
    // Capture only once the gesture is clearly a drag, so a stray press still
    // resolves as a tap.
    if (Math.abs(e.clientY - drag.startY) > 4 && !e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    setDrag({ ...drag, y: e.clientY })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag) return
    const dt = Math.max(1, performance.now() - drag.t)
    const velocity = (e.clientY - drag.startY) / dt // px per ms, positive = downward
    const current = drag.startTranslate + (e.clientY - drag.startY)
    setDrag(null)

    // A decisive flick moves one snap in that direction; otherwise settle on the
    // nearest snap to where the finger let go.
    const index = ORDER.indexOf(snap)
    if (Math.abs(velocity) > 0.5) {
      const next = velocity > 0 ? index - 1 : index + 1
      onSnapChange(ORDER[Math.min(ORDER.length - 1, Math.max(0, next))])
      return
    }
    let best: Snap = snap
    let bestDist = Infinity
    for (const s of ORDER) {
      const d = Math.abs(translateFor(s) - current)
      if (d < bestDist) {
        bestDist = d
        best = s
      }
    }
    onSnapChange(best)
  }

  return (
    <div
      ref={ref}
      className={`sheet ${className}`}
      style={{
        height: fullPx,
        transform: `translateY(${translate}px)`,
        transition: drag ? 'none' : 'transform 340ms cubic-bezier(0.2, 0, 0, 1)',
      }}
    >
      <div
        className="sheet-drag-zone"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="sheet-handle" />
        {header}
      </div>
      <div className="sheet-body">{children}</div>
    </div>
  )
}

/** Allows a little overscroll past the end snaps, damped 3:1. */
function clampRubber(value: number, min: number, max: number) {
  if (value < min) return min + (value - min) / 3
  if (value > max) return max + (value - max) / 3
  return value
}
