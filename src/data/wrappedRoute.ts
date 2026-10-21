import { SOUVENIR_ENDS, SOUVENIR_STOPS, type SouvenirLabel } from './souvenirMap'

/**
 * The preview screen lays the trip out exactly as the souvenir will: the same
 * route drawing (the invite frame's copy, in its sky blue) placed where the
 * souvenir places its own, and each chosen photo in the spot the souvenir
 * gives that stop — beside the line, never on it. Every position is in the
 * same 402x874 screen pixels `souvenirMap.ts` uses.
 */

export const PREVIEW_ROUTE_SRC = '/assets/wrapped-invite-route.svg'

export interface PreviewSlot {
  left: number
  top: number
  /** A circular print, this wide and tall. */
  size: number
  /** The stop's name, set where the souvenir sets it; extra spots have none. */
  label?: SouvenirLabel
}

/** The souvenir's prints are circles; its one map card takes a circle of the same size here. */
const CARD_PRINT = 41

export const PREVIEW_SLOTS: PreviewSlot[] = [
  // The souvenir's own stops, in the order the route reaches them.
  ...SOUVENIR_STOPS.map((stop) => {
    const size = stop.kind === 'card' ? CARD_PRINT : stop.width
    return {
      left: stop.left + stop.width / 2 - size / 2,
      top: stop.top + stop.height / 2 - size / 2,
      size,
      label: stop.label,
    }
  }),
  // Room for more photos than the souvenir has stops, kept clear of the line
  // along its long first stretch.
  { left: 122, top: 485, size: 40 },
  { left: 160, top: 385, size: 40 },
  { left: 242, top: 372, size: 40 },
]

export const PREVIEW_ENDS = SOUVENIR_ENDS
