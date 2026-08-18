/**
 * Day colours, handed out in order. Picked to stay legible over the basemap's
 * greens, greys and water — a truly random hue lands on something invisible
 * often enough to be a problem in a demo.
 *
 * The route's own blue (`#1A73E8`) is deliberately not among them: a day paints
 * its stretch of the line itself, so a blue day would be indistinguishable from
 * the stops nobody has grouped yet.
 */
export const DAY_COLOURS = [
  '#EA4335', // red
  '#9334E6', // violet
  '#F9AB00', // amber
  '#00897B', // teal
  '#E8710A', // orange
  '#D01884', // magenta
]

export const dayColour = (index: number) => DAY_COLOURS[(index - 1) % DAY_COLOURS.length]
