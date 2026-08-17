/**
 * One colour per day of the itinerary. A day's heading, its leg of the route and
 * its stop dots all draw in the same colour, which is what ties the list to the
 * map. The first two are sampled from the design's map frame; the rest continue
 * Google's palette.
 *
 * These are tokens, but they live in TypeScript rather than in `tokens.css`
 * because Google's `Polyline` takes a colour string — a custom property the
 * stylesheet owned would have to be read back out of the DOM to draw the route.
 */
export const DAY_COLORS = ['#d96570', '#1a73e8', '#34a853', '#f9ab00', '#9334e6'] as const

export function dayColor(index: number) {
  return DAY_COLORS[index % DAY_COLORS.length]
}
