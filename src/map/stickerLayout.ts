export type Side = 'left' | 'right'

/**
 * A sticker as the layout sees it: a box wanting to sit beside its coordinate,
 * and the side the route would rather it sat on. Artwork and text are one box,
 * since they are one piece and move together.
 */
export interface Measured {
  id: string
  /** The coordinate itself, in the overlay's pixel space. */
  x: number
  y: number
  width: number
  height: number
  /**
   * Where the group's near edge sits relative to the coordinate: the stop dot's
   * gutter for a stop, and a negative share of its own width for scenery, which
   * straddles its coordinate rather than standing off it.
   */
  startOffset: number
  /** The side asked for before any of this; leaving it costs something. */
  side: Side
}

export interface Placed {
  side: Side
  /** How far the group has been moved off its coordinate, in pixels. */
  dy: number
}

interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

/** Breathing room between two stickers, so they clear rather than touch. */
const PAD = 3

/** How far the tries reach from the coordinate, as a multiple of the height. */
const REACH = 3

/**
 * What changing sides costs, in the same pixels a nudge is measured in. Under
 * one step, so a sticker crosses its coordinate before it drifts up the map.
 */
const FLIP_COST = 4

function boxFor(m: Measured, side: Side, dy: number): Box {
  const left = side === 'right' ? m.x + m.startOffset : m.x - m.startOffset - m.width
  const top = m.y - m.height / 2 + dy
  return { left, top, right: left + m.width, bottom: top + m.height }
}

/**
 * How much two boxes cover each other, counting near misses as hits: the
 * intersection is widened by the padding on every side.
 */
function overlap(a: Box, b: Box): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left) + PAD * 2
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) + PAD * 2
  return w > 0 && h > 0 ? w * h : 0
}

/**
 * Everywhere a sticker is willing to go, nearest first: its own side then the
 * other, each stepping away from the coordinate in both directions. Moving is
 * vertical only — changing sides is the sideways move, and staying on its own
 * longitude is what lets a displaced sticker still read as that place.
 */
function candidates(m: Measured): { side: Side; dy: number }[] {
  const other: Side = m.side === 'left' ? 'right' : 'left'
  const step = Math.max(6, m.height / 3)
  const steps = Math.ceil((m.height * REACH) / step)

  const tries: { side: Side; dy: number; cost: number }[] = []
  for (let i = 0; i <= steps; i++) {
    for (const dy of i === 0 ? [0] : [-i * step, i * step]) {
      for (const side of [m.side, other]) {
        tries.push({ side, dy, cost: Math.abs(dy) + (side === m.side ? 0 : FLIP_COST) })
      }
    }
  }
  return tries.sort((a, b) => a.cost - b.cost)
}

/**
 * Where each sticker goes, so that no two cover each other. Markers arrive in
 * priority order: the first keeps its coordinate exactly and every later one
 * gives way to those before it.
 *
 * Nothing is ever dropped. Where the crowd beats the reach — a handful of stops
 * within a few pixels at the opening zoom — the least-covered placement is
 * taken, so a sticker can still be crossed rather than made to disappear.
 */
export function layoutStickers(markers: Measured[]): Map<string, Placed> {
  const taken: Box[] = []
  const placed = new Map<string, Placed>()

  for (const m of markers) {
    let best: Placed = { side: m.side, dy: 0 }
    let bestBox = boxFor(m, m.side, 0)
    let least = Infinity

    for (const { side, dy } of candidates(m)) {
      const box = boxFor(m, side, dy)
      let covered = 0
      for (const t of taken) covered += overlap(box, t)

      if (covered === 0) {
        best = { side, dy }
        bestBox = box
        break
      }
      if (covered < least) {
        least = covered
        best = { side, dy }
        bestBox = box
      }
    }

    placed.set(m.id, best)
    taken.push(bestBox)
  }

  return placed
}
