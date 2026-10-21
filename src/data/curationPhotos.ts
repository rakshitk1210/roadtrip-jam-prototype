/**
 * The camera roll the Wrapped photo picker offers, and where the photos it keeps
 * land on the map above it. Figma 2002:1067 (resting) and 2002:1217 (chosen).
 */

export interface CurationPhoto {
  id: string
  src: string
  /** Which part of the photo the square tile keeps. */
  position: string
  /** Where it was taken, shown on its scrapbook detail page. */
  location: string
  /**
   * The photo's true width ÷ height, for a file stored squashed to another
   * shape — anything showing it has to stretch it back rather than crop it.
   */
  displayAspect?: number
}

/** What the header offers, and the number it counts down from. */
export const PHOTO_LIMIT = 10

/** The one date every photo in the roll shares. */
export const CURATION_DATE = 'Aug 2, 2026'

/** One roll, one afternoon, in the order the grid lays them out. */
export const CURATION_PHOTOS: CurationPhoto[] = [
  {
    id: 'roll-1',
    src: '/assets/picker-photo-1.jpg',
    position: '50% 40%',
    location: 'Diablo Lake Vista Point',
  },
  {
    id: 'roll-2',
    src: '/assets/picker-photo-2.jpg',
    position: '50% 40%',
    location: 'Ladder Creek Falls',
  },
  {
    id: 'roll-3',
    src: '/assets/picker-photo-3.jpg',
    position: '50% 50%',
    location: 'North Cascades Visitor Center',
  },
  {
    id: 'roll-4',
    src: '/assets/picker-photo-4.jpg',
    position: '50% 50%',
    location: 'Rockport State Park',
  },
  {
    id: 'roll-5',
    src: '/assets/picker-photo-5.jpg',
    position: '50% 15%',
    location: 'Silver Stream Trail',
  },
  {
    id: 'roll-6',
    src: '/assets/picker-photo-6.jpg',
    position: '50% 50%',
    location: 'Diablo Lake Hike',
  },
  {
    id: 'roll-7',
    src: '/assets/picker-photo-7.jpg',
    position: '50% 23%',
    location: 'Sunset Beach BBQ',
  },
  {
    id: 'roll-8',
    src: '/assets/picker-photo-8.jpg',
    position: '50% 23%',
    location: 'Riverbend Kayaking',
  },
  {
    id: 'roll-9',
    src: '/assets/picker-photo-9.jpg',
    position: '50% 23%',
    location: 'Historic Downtown Tour',
  },
]

export interface CurationPin {
  left: number
  top: number
  size?: number
  /** Drawn before anything is chosen, since the map already knows this stop. */
  resting?: boolean
}

/**
 * Points on the map above the sheet, in the order choosing photos lights them
 * up — nearest the afternoon's own cluster first. The map already knows the
 * first three stops; the rest are places only the chosen photos put on it.
 */
export const CURATION_PINS: CurationPin[] = [
  { left: 186, top: 312, size: 16.3, resting: true },
  { left: 159, top: 308, resting: true },
  { left: 285, top: 151, resting: true },
  { left: 311, top: 135 },
  { left: 301, top: 110 },
]

/**
 * The photo the souvenir is framed against — the group at the Diablo Lake
 * overlook. It leads the background choices and is picked by default. Its file
 * is stored squashed to 768x1024; the souvenir stretches it back to 402x880
 * (see `.souvenir-bg`), so that's its true shape.
 */
export const SOUVENIR_BACKGROUND: CurationPhoto = {
  id: 'souvenir-bg',
  src: '/assets/souvenir-bg.jpg',
  position: '50% 62%',
  location: 'Diablo Lake Vista Point',
  displayAspect: 402 / 880,
}

/** What the background tray offers: the souvenir's own photo, then the roll. */
export const BACKGROUND_CHOICES: CurationPhoto[] = [SOUVENIR_BACKGROUND, ...CURATION_PHOTOS]
