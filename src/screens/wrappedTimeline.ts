/**
 * Timing shared by the Road Trip Wrapped story frames. Every beat uses the same
 * reveal length; the stagger between beats is what paces a frame.
 */

import { frameElementCount, type WrappedFrame } from '../data/wrappedFrames'

/** Matches the CSS slide; keep in sync with `--wrapped-slide` in wrapped.css. */
export const SLIDE_MS = 520
export const STORY_TICKS = 12

/** A frame's beat rising; matches `--wrapped-reveal` on `.wrapped-frame`. */
export const REVEAL_MS = 850
/** The intro takes its reveals slower; matches `--wrapped-reveal` at the root. */
export const START_REVEAL_MS = 1200
const BEAT_STEP_MS = 1000

/** The scrim's dissolve; keep in sync with `--wrapped-darken-*` in wrapped.css. */
const DARKEN_DELAY_MS = 200
const DARKEN_MS = 500

/** Copy holds until the scrim has fully settled, so nothing rises over a photo
 *  that is still darkening. */
const FIRST_BEAT_MS = DARKEN_DELAY_MS + DARKEN_MS + 150
/** Light frames have no scrim to wait on, so their copy opens straight away. */
const FIRST_BEAT_LIGHT_MS = 300

/** When a story frame's nth beat — mark, section or Share — starts to rise. */
export const beatDelay = (index: number, first = FIRST_BEAT_MS) => first + index * BEAT_STEP_MS

/** The arrow is the last thing in: it waits for the final beat to finish rising. */
export const nextDelay = (elements: number, first = FIRST_BEAT_MS) =>
  beatDelay(elements - 1, first) + REVEAL_MS + 250

/** When a frame is done: its last beat, the arrow, has finished rising. */
export const frameSequenceMs = (elements: number, first = FIRST_BEAT_MS) =>
  nextDelay(elements, first) + REVEAL_MS

/**
 * The bar's fill. The outgoing frame runs the first ADVANCE_MS of it, so counting
 * that in leaves the sweep completing exactly as the arrow lands.
 */
export const frameFillMs = (elements: number, first = FIRST_BEAT_MS) =>
  frameSequenceMs(elements, first) + ADVANCE_MS

/** How a frame paces itself: its first beat, the arrow's cue, when the sequence has
 *  run out, and the length of its progress bar's fill. */
export function frameTiming(frame: WrappedFrame) {
  const first = frame.tone === 'light' ? FIRST_BEAT_LIGHT_MS : FIRST_BEAT_MS
  const elements = frameElementCount(frame)
  return {
    first,
    next: nextDelay(elements, first),
    sequence: frameSequenceMs(elements, first),
    fill: frameFillMs(elements, first),
  }
}

/** The intro's own reveal delays, since its lines aren't data-driven. */
export const START_REVEAL = { greet: 780, lede: 2000, rewind: 3200, cta: 4400 }
export const START_FILL_MS = 5800

/**
 * How long the bar for the next frame fills on the outgoing frame before the new
 * one takes over. The incoming frame resumes the same fill at this offset, so it
 * reads as one sweep.
 */
export const ADVANCE_MS = 440
