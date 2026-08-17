import { useCallback, useRef, useState, type RefObject } from 'react'

interface Drag {
  /** Position of the lifted element in the measured list. */
  index: number
  height: number
  dy: number
  /** Where it would land if the pointer were released now. */
  to: number
  /** Vertical centres of every element, measured once when the drag began. */
  centers: number[]
}

/**
 * Pointer-driven reordering for a vertical list, hand-rolled rather than pulled
 * from a library: the repo already hand-rolls its comparable interactions (the
 * sheet's own snap drag, the map's custom overlays) and this needs to drive both
 * stop rows and whole day groups from the same code.
 *
 * Geometry is measured from the DOM on `pointerdown` rather than assumed, so it
 * copes with the day headings and dividers that break up the run of rows.
 *
 * @param containerRef  the subtree holding the reorderable elements
 * @param selector      matches those elements, in document order
 * @param commit        called with list positions once the drag lands
 */
export function useReorder(
  containerRef: RefObject<HTMLElement | null>,
  selector: string,
  commit: (from: number, to: number) => void,
) {
  const [drag, setDrag] = useState<Drag | null>(null)
  // Pointer handlers read the live drag, which state alone can't give them.
  const dragRef = useRef<Drag | null>(null)
  const startY = useRef(0)

  const apply = (next: Drag | null) => {
    dragRef.current = next
    setDrag(next)
  }

  const begin = useCallback(
    (index: number) => (e: React.PointerEvent) => {
      const container = containerRef.current
      if (!container || e.button !== 0) return

      const rects = [...container.querySelectorAll<HTMLElement>(selector)].map((el) =>
        el.getBoundingClientRect(),
      )
      const own = rects[index]
      if (!own) return

      // Captured immediately: the handle has nothing to do on a plain tap, and
      // waiting for a threshold would lose the moves that leave the handle.
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      startY.current = e.clientY
      apply({
        index,
        height: own.height,
        dy: 0,
        to: index,
        centers: rects.map((r) => r.top + r.height / 2),
      })
    },
    [containerRef, selector],
  )

  const move = useCallback((e: React.PointerEvent) => {
    const current = dragRef.current
    if (!current) return

    const dy = e.clientY - startY.current
    const center = current.centers[current.index] + dy

    // Whichever slot the lifted element now sits closest to is the target.
    let to = current.index
    let nearest = Infinity
    current.centers.forEach((c, i) => {
      const distance = Math.abs(c - center)
      if (distance < nearest) {
        nearest = distance
        to = i
      }
    })

    apply({ ...current, dy, to })
  }, [])

  const finish = useCallback(
    (commitMove: boolean) => () => {
      const current = dragRef.current
      if (!current) return
      apply(null)
      if (commitMove && current.to !== current.index) commit(current.index, current.to)
    },
    [commit],
  )

  /** Spread onto the grab affordance — a handle, or a day heading. */
  const handleProps = (index: number) => ({
    onPointerDown: begin(index),
    onPointerMove: move,
    onPointerUp: finish(true),
    onPointerCancel: finish(false),
    // The element it lives in is usually tappable; a drag is not a tap.
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  })

  /**
   * How far element `index` should be drawn from where it was laid out: the
   * lifted one follows the pointer, and everything it has passed steps aside.
   */
  const offsetFor = (index: number) => {
    if (!drag) return 0
    if (index === drag.index) return drag.dy
    if (index > drag.index && index <= drag.to) return -drag.height
    if (index < drag.index && index >= drag.to) return drag.height
    return 0
  }

  return {
    handleProps,
    offsetFor,
    liftedIndex: drag?.index ?? null,
    dragging: drag !== null,
  }
}
