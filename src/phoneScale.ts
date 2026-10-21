/**
 * How far the fixed 402x874 phone is scaled to fit the window (1 when it fits).
 * Pointer coordinates are in window pixels, so drag distances divide by this to
 * land back in the phone's own layout pixels.
 */
export function phoneScale() {
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--phone-scale'))
  return value > 0 ? value : 1
}

/** A pointer's vertical position in the phone's own layout pixels. */
export const phoneY = (e: { clientY: number }) => e.clientY / phoneScale()
