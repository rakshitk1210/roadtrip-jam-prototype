export type LngLat = [number, number]

/** Origin and destination of the jam: Seattle -> North Cascades. */
export const ORIGIN: LngLat = [-122.3035, 47.6553] // University of Washington
export const DESTINATION: LngLat = [-121.266, 48.6739] // North Cascades / Newhalem

/**
 * Anything that can open the place detail sheet — the Kangaroo Farm and every
 * saved place on the route. Trip recommendations (friends, creators) are
 * itineraries rather than places and are typed separately below.
 */
export interface Place {
  id: string
  name: string
  /** Shown on the map sticker when it differs from the place name. */
  mapLabel?: string
  hours?: string
  rating: number
  reviews: number
  coord: LngLat
  /** Lead photo first — it doubles as the collage hero. */
  photos: [string, string, string]
  thumb: string
  knowBeforeYouGo: [string, string]
}

export const KANGAROO: Place = {
  id: 'kangaroo',
  name: 'Outback Kangaroo Zoo',
  mapLabel: 'Outback Kangaroo farm',
  hours: 'Opens 9:30am Thu',
  rating: 4.8,
  reviews: 198,
  coord: [-122.1379, 48.2264], // Arlington, WA — on the I-5 leg north
  photos: [
    '/assets/kangaroo-photo-1.jpg',
    '/assets/kangaroo-photo-2.jpg',
    '/assets/kangaroo-photo-3.jpg',
  ],
  thumb: '/assets/thumb-kangaroo.jpg',
  knowBeforeYouGo: [
    'Wear old shoes you do not care about since stepping in droppings is highly likely',
    'Arrive 15 minutes before your scheduled tour time to secure parking and avoid any waits',
  ],
}

export interface Sticker {
  id: string
  label: string
  sublabel?: string
  image: string
  coord: LngLat
  /** Sticker width in CSS px at zoom 11. */
  width: number
  minZoom?: number
  interactive?: boolean
  /** Which side the label sits on — `left` keeps it off the right edge. */
  labelSide?: 'left' | 'right'
}

export const STICKERS: Sticker[] = [
  {
    id: 'kangaroo',
    label: KANGAROO.mapLabel ?? KANGAROO.name,
    sublabel: KANGAROO.hours,
    image: '/assets/sticker-kangaroo.png',
    coord: KANGAROO.coord,
    width: 46,
    interactive: true,
  },
  {
    id: 'north-cascades',
    label: 'North Cascades',
    image: '/assets/sticker-north-cascades.png',
    coord: DESTINATION,
    width: 48,
    labelSide: 'left',
  },
  {
    id: 'mount-baker',
    label: 'Mount Baker',
    image: '/assets/sticker-north-cascades.png',
    coord: [-121.8144, 48.7767],
    width: 42,
    minZoom: 8.5,
    labelSide: 'left',
  },
  {
    id: 'oak-tree',
    label: 'The big oak tree',
    image: '/assets/sticker-oak-tree.png',
    coord: [-122.0574, 48.2492],
    width: 44,
    minZoom: 10,
  },
  {
    id: 'wildflower',
    label: 'Wildflower farm',
    image: '/assets/sticker-wildflower.png',
    coord: [-122.0891, 48.1735],
    width: 48,
    minZoom: 10,
  },
]

/** Eateries that only surface once you zoom past the threshold. */
export const EMOJI_POIS: { id: string; emoji: string; coord: LngLat }[] = [
  { id: 'pizza', emoji: '🍕', coord: [-122.1608, 48.2151] },
  { id: 'burger', emoji: '🍔', coord: [-122.1489, 48.2384] },
  { id: 'taco', emoji: '🌮', coord: [-122.1192, 48.2179] },
  { id: 'coffee', emoji: '☕', coord: [-122.1704, 48.2436] },
  { id: 'icecream', emoji: '🍦', coord: [-122.1121, 48.2412] },
  { id: 'donut', emoji: '🍩', coord: [-122.1327, 48.2038] },
]

/** Zoom at which the emoji POIs fade in. */
export const POI_ZOOM = 11.5

export interface ListItem {
  id: string
  name: string
  rating: number
  reviews: number
  photo: string
  avatar: string
  byline?: string
  handle?: string
}

/** A saved place is a full Place plus the friend who saved it. */
export interface SavedPlace extends Place {
  avatar: string
}

/**
 * The Figma file only yields three visually distinct landscape photos, so each
 * collage uses a different permutation of them — no place repeats an image
 * within its own collage. Swap in real photography here.
 */
const LAKE = '/assets/itin-silver-stream.png' // Diablo Lake vista
const PADDLER = '/assets/itin-kayak.png' // kayaker, wide
const KAYAK = '/assets/photo-kayak-lake.png' // kayak, close

/**
 * Saved places, bookmarked along the route. Each one is tappable and opens the
 * same detail sheet as the Kangaroo Farm.
 */
export const SAVED: SavedPlace[] = [
  {
    id: 'mountain-view-cafe',
    name: 'Mountain View Café',
    hours: 'Opens 7:00am Thu',
    rating: 4.8,
    reviews: 198,
    coord: [-121.4404, 48.6538], // Marblemount, last coffee before the pass
    thumb: LAKE,
    photos: [LAKE, PADDLER, KAYAK],
    avatar: '/assets/you-avatar-1.jpg',
    knowBeforeYouGo: [
      'The last espresso before Newhalem — the next café is 40 minutes further up SR-20',
      'Cash only after 4pm, and the patio fills up the moment the sun clears the ridge',
    ],
  },
  {
    id: 'diablo-lake-hike',
    name: 'Diablo lake hike',
    hours: 'Open 24 hours',
    rating: 4.8,
    reviews: 198,
    coord: [-121.1341, 48.7142],
    thumb: LAKE,
    photos: [LAKE, KAYAK, PADDLER],
    avatar: '/assets/avatar-2.png',
    knowBeforeYouGo: [
      'The overlook lot fills by 10am on weekends — the trailhead half a mile east rarely does',
      'That turquoise colour is glacial flour, and it is strongest in late summer',
    ],
  },
  {
    id: 'sunset-beach-bbq',
    name: 'Sunset Beach BBQ',
    hours: 'Opens 11:30am Thu',
    rating: 4.7,
    reviews: 152,
    coord: [-122.3312, 48.0312], // Everett waterfront
    thumb: KAYAK,
    photos: [KAYAK, LAKE, PADDLER],
    avatar: '/assets/you-avatar-4.jpg',
    knowBeforeYouGo: [
      'Brisket usually sells out by 2pm — order it the moment you sit down',
      'Ask for a table on the west deck if you are timing this around sunset',
    ],
  },
  {
    id: 'historic-downtown',
    name: 'Historic Downtown Tour',
    hours: 'Tours 10am & 2pm',
    rating: 4.9,
    reviews: 234,
    coord: [-122.3341, 48.4212], // Mount Vernon
    thumb: PADDLER,
    photos: [PADDLER, LAKE, KAYAK],
    avatar: '/assets/avatar-2.png',
    knowBeforeYouGo: [
      'Runs about 90 minutes on foot with two flights of stairs and no step-free alternative',
      'Parking behind the old cannery is free for the first two hours',
    ],
  },
  {
    id: 'riverbend-kayaking',
    name: 'Riverbend Kayaking',
    hours: 'Opens 9:00am Thu',
    rating: 4.6,
    reviews: 89,
    coord: [-121.7512, 48.5361], // Skagit River near Concrete
    thumb: PADDLER,
    photos: [PADDLER, KAYAK, LAKE],
    avatar: '/assets/you-avatar-2.jpg',
    knowBeforeYouGo: [
      'Book the morning slot — the afternoon wind on the Skagit turns the paddle back into work',
      'Everything you bring gets wet, so leave anything precious in the car',
    ],
  },
]

/** The two stops the itinerary starts with, so those rows open a sheet too. */
export const SEEDED_STOPS: Place[] = [
  {
    id: 'silver-stream',
    name: 'Silver Stream Trail',
    hours: 'Open sunrise to sunset',
    rating: 4.8,
    reviews: 198,
    coord: [-121.6294, 48.5423], // Rockport, off SR-20
    thumb: LAKE,
    photos: [LAKE, PADDLER, KAYAK],
    knowBeforeYouGo: [
      'Two creek crossings with no bridge — waterproof boots or a spare pair of socks',
      'The trailhead has no cell signal, so download the map before you turn off SR-20',
    ],
  },
  {
    id: 'kayak-rental',
    name: 'Kayak rental',
    hours: 'Opens 9:00am Thu',
    rating: 4.8,
    reviews: 198,
    coord: [-121.9412, 48.5218], // Baker Lake turn-off
    thumb: PADDLER,
    photos: [PADDLER, LAKE, KAYAK],
    knowBeforeYouGo: [
      'Last rental goes out two hours before dusk, and they hold it strictly',
      'Life jackets are included; dry bags are not, so bring your own',
    ],
  },
]

/** Every place that can open the detail sheet, keyed by id. */
export const PLACES: Record<string, Place> = Object.fromEntries(
  [KANGAROO, ...SAVED, ...SEEDED_STOPS].map((p) => [p.id, p]),
)

/** Saved places double as the bookmark pins drawn along the route. */
export const BOOKMARK_PINS = SAVED.map(({ id, coord }) => ({ id, coord }))

/** People on this jam who have already driven some of it. */
export const FROM_FRIENDS: ListItem[] = [
  { id: 'friend-1', name: '2-day North Cascades trip', rating: 4.9, reviews: 41, photo: '/assets/itin-silver-stream.png', avatar: '/assets/you-avatar-1.jpg', byline: 'Jordan Blake' },
  { id: 'friend-2', name: '1-day Cascades kayaking trip', rating: 4.7, reviews: 33, photo: '/assets/itin-kayak.png', avatar: '/assets/you-avatar-2.jpg', byline: 'Taylor Reed' },
  { id: 'friend-3', name: 'Weekend Mount Rainier hike', rating: 4.8, reviews: 58, photo: '/assets/itin-silver-stream.png', avatar: '/assets/you-avatar-3.jpg', byline: 'Morgan Lee' },
  { id: 'friend-4', name: 'Lake Washington paddle', rating: 4.6, reviews: 27, photo: '/assets/itin-kayak.png', avatar: '/assets/you-avatar-4.jpg', byline: 'Casey Quinn' },
]

/** Creators who have never been on this jam — public itineraries that overlap it. */
export const FROM_CREATORS: ListItem[] = [
  { id: 'creator-1', name: 'Cascade Loop in 48 hours', rating: 4.9, reviews: 1204, photo: '/assets/itin-silver-stream.png', avatar: '/assets/topbar-av-1.jpg', byline: 'Nina Okafor', handle: '@ninaroams' },
  { id: 'creator-2', name: 'Roadside oddities of WA-20', rating: 4.7, reviews: 863, photo: '/assets/thumb-kangaroo.jpg', avatar: '/assets/topbar-av-3.jpg', byline: 'Sam Ferreira', handle: '@detourdiary' },
  { id: 'creator-3', name: 'Every diner between Seattle & Baker', rating: 4.8, reviews: 2417, photo: '/assets/photo-kayak-lake.png', avatar: '/assets/topbar-av-4.jpg', byline: 'Priya Raman', handle: '@lastexitfood' },
]
