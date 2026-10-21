/**
 * The finished souvenir: the trip drawn over the photo it ended on, with a
 * sticker at every stop. Figma 2002:1373, whose geometry is hand-placed against
 * the route line, so every position here is lifted from the comp rather than
 * derived.
 */

export interface SouvenirLabel {
  /** Broken by hand, the way the design breaks them. */
  lines: string[]
  left: number
  /** The design pins labels by their middle, not their top. */
  middle: number
  width: number
  align: 'left' | 'right' | 'center'
  /** Labels that fall on open photograph rather than on the route's own ink. */
  shadow?: boolean
}

export interface SouvenirStop {
  id: string
  /** A circular print, or the flat map card the visitor center gets. */
  kind: 'photo' | 'card'
  src: string
  left: number
  top: number
  width: number
  height: number
  /** Which part of the wide photo the circle keeps. */
  focus?: string
  label: SouvenirLabel
}

/**
 * In the order the route reaches them, which is the order they land in — so the
 * map assembles the way the trip was driven.
 */
export const SOUVENIR_STOPS: SouvenirStop[] = [
  {
    id: 'kangaroo',
    kind: 'photo',
    src: '/assets/souvenir-stop-1.jpg',
    left: 93,
    top: 319,
    width: 41,
    height: 41,
    focus: '60% 50%',
    label: {
      lines: ['The Outback', 'Kangaroo Farm'],
      left: 0,
      middle: 340.5,
      width: 83,
      align: 'right',
    },
  },
  {
    id: 'kayaks',
    kind: 'photo',
    src: '/assets/souvenir-stop-2.jpg',
    left: 197,
    top: 239,
    width: 41,
    height: 41,
    focus: '60% 50%',
    label: {
      lines: ['North Cascades', 'Kayaks'],
      left: 96,
      middle: 259.5,
      width: 92,
      align: 'right',
    },
  },
  {
    id: 'upriver',
    kind: 'photo',
    src: '/assets/souvenir-stop-3.jpg',
    left: 228.21,
    top: 216.05,
    width: 42,
    height: 42,
    focus: '50% 50%',
    label: {
      lines: ['Upriver Grill &', 'Taproom'],
      left: 131,
      middle: 224.5,
      width: 92,
      align: 'right',
    },
  },
  {
    id: 'visitor-center',
    kind: 'card',
    src: '/assets/souvenir-visitor-map.png',
    left: 261,
    top: 178.08,
    width: 46,
    height: 35.647,
    label: {
      lines: ['North Cascades', 'Visitor Center'],
      left: 167,
      middle: 199.5,
      width: 92,
      align: 'right',
    },
  },
  {
    id: 'colonial-creek',
    kind: 'photo',
    src: '/assets/souvenir-stop-4.jpg',
    left: 341,
    top: 141,
    width: 40,
    height: 40,
    focus: '50% 50%',
    label: {
      lines: ['Colonial Creek', 'Campground'],
      left: 240,
      middle: 160.5,
      width: 92,
      align: 'right',
    },
  },
  {
    id: 'ladder-creek',
    kind: 'photo',
    src: '/assets/souvenir-stop-5.jpg',
    left: 292,
    top: 238,
    width: 42,
    height: 42,
    focus: '60% 50%',
    label: {
      lines: ['Ladder ', 'Creek Falls'],
      left: 341,
      middle: 259.5,
      width: 62,
      align: 'left',
      shadow: true,
    },
  },
]

/** The two ends of the loop, which are marks on the route rather than stops. */
export const SOUVENIR_ENDS: SouvenirLabel[] = [
  { lines: ['Start'], left: -9, middle: 619, width: 92, align: 'center', shadow: true },
  { lines: ['End'], left: 55, middle: 546, width: 92, align: 'center', shadow: true },
]

export interface SouvenirStat {
  label: string
  value: string
}

/** What the trip came to, set in the typewriter face the design uses for it. */
export const SOUVENIR_STATS: SouvenirStat[] = [
  { label: 'Overview', value: '4 Stops » 2 Detours' },
  { label: 'Distance', value: '251 mi' },
  { label: 'Time on the road', value: '6 hr 12 min' },
]
