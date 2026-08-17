/**
 * One colour per day of the itinerary, so each day's leg of the route and its
 * stop dots read as a set. The first two are sampled from the design's map
 * frame; the rest continue the same palette.
 *
 * These live in TypeScript rather than as CSS custom properties because Google's
 * `Polyline` takes a colour string — a token the stylesheet owned would have to
 * be read back out of the DOM to draw the route.
 */
export const DAY_COLORS = ['#d96570', '#1a73e8', '#f9ab00', '#34a853'] as const

export function dayColor(index: number) {
  return DAY_COLORS[index % DAY_COLORS.length]
}
