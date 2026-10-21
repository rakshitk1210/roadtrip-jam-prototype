import type { Snap } from '../state/tripContext'

/**
 * Sheet height at each snap, as a fraction of the viewport — derived from the
 * Figma frames (peek 101px, half 551px, full 660px of an 872px screen).
 * Kept out of `BottomSheet.tsx` so that file exports only a component and stays
 * Fast Refresh friendly.
 */
export const SNAP_FRACTION: Record<Snap, number> = {
  peek: 0.115,
  half: 0.632,
  full: 0.82,
}

/**
 * Maps Explore landing (Figma 1668:5717). Half is the designed rest — handle,
 * University District, and the Wrapped tile running down to tuck just under
 * the tab bar, the way Maps' own sheet card does, with no gap above the bar.
 */
export const EXPLORE_SNAP_FRACTION: Record<Snap, number> = {
  peek: 0.22,
  half: 0.35,
  full: 0.72,
}

export const SNAP_ORDER: Snap[] = ['peek', 'half', 'full']
