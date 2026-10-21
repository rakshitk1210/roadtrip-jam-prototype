/**
 * The Road Trip Wrapped story, frame by frame, in the order they play after the
 * intro. Every frame is a full-bleed photograph with a scrim that dissolves in
 * and sections of copy that unveil one after another.
 */

/** Picks the type scale in wrapped.css. */
export type WrappedLineKind =
  | 'title'
  | 'lede'
  | 'close'
  | 'headline'
  | 'headlineSm'
  | 'caption'
  | 'inviteTitle'
  | 'inviteBody'

/** `strong` runs carry the design's heavier, larger weight; `br` breaks the line. */
export type WrappedRun = { text: string; strong?: boolean } | { br: true }

/** A bloom parked at a designed spot in the invite frame. */
export interface WrappedBloom {
  src: string
  left: number
  top: number
  width: number
  height: number
}

export interface WrappedLine {
  kind: WrappedLineKind
  runs: WrappedRun[]
}

/**
 * One reveal: the lines the design sets as a single block, which rise together.
 * A frame's sections then arrive in order — the statement, then the caption under
 * it, rather than a line at a time.
 */
export type WrappedSection = WrappedLine[]

export interface WrappedFrame {
  id: string
  /** Figma node this frame came from. */
  node: string
  image: string
  /** The photo's designed crop: it is oversized and offset to fill the frame. */
  crop: { left: number; top: number; width: number; height: number }
  /** Any turn the design gives the photo, kept out of the drift's own transform. */
  turn?: string
  /**
   * Light frames are a pale wash rather than a photograph: no scrim, blue copy,
   * and the story bar and footer take that blue so they stay legible.
   */
  tone?: 'light'
  /** A mark that rises above the copy, on its own beat. */
  mark?: { src: string; width: number; height: number }
  /**
   * Invite-style blooms, placed in the frame rather than stacked with the copy.
   * They share the mark's beat and the same drop/turn motion.
   */
  blooms?: WrappedBloom[]
  /** A route or wash drawn over the photograph, under the copy. */
  overlay?: {
    src: string
    left: number
    top: number
    width: number
    height: number
    turn?: string
  }
  sections: WrappedSection[]
  /** Frames that offer the glass Share button below their copy, on a last beat. */
  share?: boolean
}

export const WRAPPED_FRAMES: WrappedFrame[] = [
  {
    id: 'distance',
    node: '1703:6851',
    image: '/assets/wrapped-stats-bg.jpg',
    crop: { left: -111, top: -5, width: 694, height: 925 },
    // The design sets the title alone, then the two-line sentence beneath it.
    sections: [
      [{ kind: 'title', runs: [{ text: 'You really went the distance.' }] }],
      [
        { kind: 'lede', runs: [{ text: 'Here’s a look at your trip' }] },
        { kind: 'close', runs: [{ text: 'by the numbers.' }] },
      ],
    ],
  },
  {
    id: 'hours',
    node: '1703:6542',
    image: '/assets/wrapped-hours-bg.jpg',
    crop: { left: -346, top: -18, width: 1197, height: 898 },
    // The count reads as one sentence with the hours, so both lines rise together.
    sections: [
      [
        { kind: 'headline', runs: [{ text: 'You were on the road for' }] },
        { kind: 'headline', runs: [{ text: '6 hours and 12 minutes', strong: true }] },
      ],
      [
        {
          kind: 'caption',
          runs: [
            { text: 'Long enough to play “Life is a Highway”' },
            { text: ' 89 times.', strong: true },
          ],
        },
      ],
    ],
    share: true,
  },
  {
    id: 'miles',
    node: '1117:4757',
    image: '/assets/wrapped-miles-bg.png',
    crop: { left: -127, top: 0, width: 655, height: 874 },
    sections: [
      [
        {
          kind: 'headline',
          runs: [
            { text: 'From start to finish, you covered ' },
            { text: '251 miles.', strong: true },
          ],
        },
      ],
      [
        {
          kind: 'caption',
          runs: [
            { text: 'That’s about ' },
            { text: '3,500 Space Needles', strong: true },
            { text: ' laid end to end.' },
          ],
        },
      ],
    ],
    share: true,
  },
  {
    id: 'longest-leg',
    node: '1122:5032',
    image: '/assets/wrapped-leg-bg.jpg',
    crop: { left: -132, top: -6, width: 664, height: 885 },
    sections: [
      [
        {
          kind: 'headline',
          runs: [
            { text: 'Your longest leg without stopping was ' },
            { text: '90.2 miles.', strong: true },
          ],
        },
      ],
      [{ kind: 'caption', runs: [{ text: 'That next break was well deserved.' }] }],
    ],
    share: true,
  },
  {
    id: 'unplanned-stops',
    node: '1123:5117',
    image: '/assets/wrapped-stops-bg.jpg',
    crop: { left: -173, top: -17, width: 776, height: 1034 },
    sections: [
      [
        {
          kind: 'headlineSm',
          runs: [
            { text: 'For every 2 stops you planned, ' },
            { text: 'you found one more along the way.', strong: true },
          ],
        },
      ],
      [{ kind: 'caption', runs: [{ text: 'Sometimes the best stops are the unexpected ones.' }] }],
    ],
    share: true,
  },
  {
    id: 'invite',
    node: '1703:6950',
    image: '/assets/wrapped-invite-bg.png',
    // Oversized and swung so the wash's colour hugs the right edge, the way the
    // design frames it (Figma 1703:6951).
    crop: { left: -27, top: -171, width: 547, height: 1111 },
    turn: 'rotate(13.91deg) scaleY(-1)',
    tone: 'light',
    overlay: {
      src: '/assets/wrapped-invite-route.svg',
      left: -42,
      top: 288,
      width: 452,
      height: 487,
      turn: 'rotate(4.59deg)',
    },
    // Three cuts of the same sprite, parked where the design places them. They
    // share the mark beat and the existing drop/turn motion.
    blooms: [
      {
        src: '/assets/wrapped-bloom-pink.png',
        left: 305,
        top: 200,
        width: 81,
        height: 78,
      },
      {
        src: '/assets/wrapped-bloom-orange.png',
        left: 215,
        top: 281,
        width: 81,
        height: 78,
      },
      {
        src: '/assets/wrapped-bloom-green.png',
        left: 19,
        top: 383,
        width: 80,
        height: 77,
      },
    ],
    // The heading hangs from the top and the instruction from the bottom, so
    // they keep their own beats after the blooms.
    sections: [
      [
        {
          kind: 'inviteTitle',
          runs: [{ text: 'Put your trip on ' }, { br: true }, { text: 'the map' }],
        },
      ],
      [
        {
          kind: 'inviteBody',
          runs: [
            { text: 'Choose the photos that tell the story', strong: true },
            { br: true },
            { text: 'you’ll want to keep and share.' },
          ],
        },
      ],
    ],
  },
]

/** 1-based wrapped index of the invite frame (0 is the intro). */
export const WRAPPED_INVITE = WRAPPED_FRAMES.findIndex((frame) => frame.id === 'invite') + 1

/** Everything a frame unveils in turn: its mark, its sections, then Share if it has one. */
export function frameElementCount(frame: WrappedFrame) {
  const hasMark = Boolean(frame.mark || frame.blooms?.length)
  return (hasMark ? 1 : 0) + frame.sections.length + (frame.share ? 1 : 0)
}
