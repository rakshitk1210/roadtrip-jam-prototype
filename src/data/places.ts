export type LngLat = [number, number]

/** Origin and destination of the jam: Seattle -> North Cascades. */
export const ORIGIN: LngLat = [-122.3035, 47.6553] // University of Washington
export const DESTINATION: LngLat = [-121.266, 48.6739] // North Cascades / Newhalem

/**
 * Anything that can open the place detail sheet — the Kangaroo Farm and every
 * saved place on the route.
 */
export interface Place {
  id: string
  name: string
  /** Shown on the map sticker when it differs from the place name. */
  mapLabel?: string
  /**
   * The name the place goes by on its own screens, where there is room to
   * spell it out. List rows stay on the short `name`.
   */
  formalName?: string
  hours?: string
  /**
   * The single line under the name on the map, once the zoom is close enough to
   * read it. Authored rather than derived: what is worth saying about a stop is
   * a judgement, not a rating threshold.
   */
  mapDetail?: string
  rating: number
  reviews: number
  coord: LngLat
  /** Lead photo first — it doubles as the collage hero. */
  photos: [string, string, string]
  /** Your own shots of the place, offered up when marking it a gem. */
  gemPhotos?: [string, string, string]
  thumb: string
  knowBeforeYouGo: [string, string]
  /**
   * The richer cafe sheet: the name spelled out, the distance on the rating
   * line, and a friend's note over the photos. Places without it keep the
   * plain sheet, hours line and all.
   */
  detail?: {
    title: string
    note: { text: string; author: string; avatar: string }
  }
}

export const KANGAROO: Place = {
  id: 'kangaroo',
  name: 'Outback Kangaroo Zoo',
  mapLabel: 'Outback Kangaroo farm',
  formalName: 'The Outback Kangaroo Farm',
  hours: 'Opens 9:30am Thu',
  // It arrives as the curated card you just read, and loses this line to the
  // gem the moment you mark it as one.
  mapDetail: '🕘 Recently viewed',
  rating: 4.8,
  reviews: 198,
  coord: [-122.1379, 48.2264], // Arlington, WA — on the I-5 leg north
  photos: [
    '/assets/kangaroo-photo-1.jpg',
    '/assets/kangaroo-photo-2.jpg',
    '/assets/kangaroo-photo-3.jpg',
  ],
  gemPhotos: [
    '/assets/kangaroo-gem-photo-1.jpg',
    '/assets/kangaroo-gem-photo-2.jpg',
    '/assets/kangaroo-gem-photo-3.jpg',
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
  /** The one-line note under the name, shown from the detail zoom in. */
  detail?: string
  /** Opening hours, the last line to arrive and only at the closest zoom. */
  hours?: string
  image: string
  coord: LngLat
  /** Sticker width in CSS px at zoom 11. */
  width: number
  /** Width over height of the artwork, when it must be sized explicitly. */
  ratio?: number
  minZoom?: number
  interactive?: boolean
  /** Which side the label sits on — `left` keeps it off the right edge. */
  labelSide?: 'left' | 'right'
}

/**
 * Landmarks the map knows about on its own. The Kangaroo Farm is deliberately
 * not among them: it arrives as the curated card's place, and only earns a
 * sticker once it has been added to the itinerary.
 */
export const STICKERS: Sticker[] = [
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
    image: '/assets/sticker-mount-baker.png',
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

/**
 * The sticker library, exported from the design file. There is one drawing per
 * kind of stop rather than per stop, so the art repeats across places — which
 * is what the design asks for until the full set is drawn.
 *
 * Ratios come from each SVG's own viewBox: the exports carry
 * `preserveAspectRatio="none"`, so anything rendering them has to supply both
 * dimensions or the drawing stretches.
 */
export interface StickerArt {
  src: string
  /** Width over height of the exported artwork. */
  ratio: number
}

export const STICKER_ART = {
  kangaroo: { src: '/assets/sticker-art-kangaroo.svg', ratio: 73 / 45.7467 },
  lake: { src: '/assets/sticker-art-diablo-lake.svg', ratio: 73 / 45.0882 },
  falls: { src: '/assets/sticker-art-falls.svg', ratio: 38.0513 / 23.3382 },
  kayak: { src: '/assets/sticker-art-kayak.svg', ratio: 87.1009 / 54.4381 },
  visitorCenter: { src: '/assets/sticker-art-visitor-center.svg', ratio: 72.5081 / 45.0726 },
  food: { src: '/assets/sticker-art-burger.svg', ratio: 73 / 52.1429 },
  mocoloco: { src: '/assets/mocoloco.svg', ratio: 358 / 221 },
  alpaca: { src: '/assets/alpaca.svg', ratio: 85 / 54 },
  blueBird: { src: '/assets/sticker-art-blue-bird.png', ratio: 219 / 138 },
} satisfies Record<string, StickerArt>

export type StickerArtId = keyof typeof STICKER_ART

/** The art each designed place wears on the map. */
const STICKER_ART_BY_PLACE: Record<string, StickerArtId> = {
  kangaroo: 'kangaroo',
  'kayak-rental': 'kayak',
  'riverbend-kayaking': 'kayak',
  'silver-stream': 'lake',
  'rockport-state-park': 'lake',
  'nc-visitor-center': 'visitorCenter',
  'ladder-creek-falls': 'falls',
  'diablo-lake-vista': 'lake',
  'diablo-lake-hike': 'lake',
  'mountain-view-cafe': 'food',
  'sunset-beach-bbq': 'food',
  'historic-downtown': 'visitorCenter',
  'kona-kitchen': 'mocoloco',
  'strawberry-fields-alpaca': 'alpaca',
  'blue-bird-cafe': 'blueBird',
}

/** Name keywords, in priority order, for places that arrive from Places. */
const ART_KEYWORDS: [RegExp, StickerArtId][] = [
  [/kayak|paddle|canoe|raft/i, 'kayak'],
  [/falls|waterfall|cascade/i, 'falls'],
  [/caf|coffee|espresso|bbq|barbecue|grill|kitchen|diner|restaurant|bakery|brewer|pizz/i, 'food'],
  [/visitor|museum|center|centre|gallery|historic|tour/i, 'visitorCenter'],
  [/zoo|farm|wildlife|animal/i, 'kangaroo'],
]

/** Sticker art for any place — designed by hand where we have it, guessed otherwise. */
export function stickerArtFor(place: { id: string; name: string }): StickerArt {
  const mapped = STICKER_ART_BY_PLACE[place.id]
  if (mapped) return STICKER_ART[mapped]
  const hit = ART_KEYWORDS.find(([pattern]) => pattern.test(place.name))
  // Lake and mountain scenery is the safe default on a drive into the Cascades.
  return STICKER_ART[hit ? hit[1] : 'lake']
}

/** Width of an itinerary sticker in CSS px at zoom 11. */
export const ITINERARY_STICKER_WIDTH = 57

/**
 * What a sticker says, by zoom. Far out it is artwork alone; each step in adds
 * one line, so zooming reads as asking the map for more rather than as the
 * labels simply being there the whole time.
 */
export const STICKER_DETAIL_ZOOM = {
  name: 9.5,
  detail: 11.5,
  hours: 13,
} as const

/**
 * How much a sticker grows at this zoom, so text drawn off the sticker — the
 * stop labels Discover uses instead — can be sized to match it.
 */
export function stickerScaleFor(zoom: number, sizeScale = 1): number {
  return Math.min(1.2, Math.max(0.72, 0.72 + (zoom - 8) * 0.12)) * sizeScale
}

/** Turns a place into the sticker the itinerary map draws for it. */
export function stickerForPlace(place: Place): Sticker {
  const art = stickerArtFor(place)
  return {
    id: place.id,
    label: place.mapLabel ?? place.name,
    detail: place.mapDetail,
    hours: place.hours,
    image: art.src,
    ratio: art.ratio,
    coord: place.coord,
    width: ITINERARY_STICKER_WIDTH,
    interactive: true,
  }
}

/** The emoji vocabulary the design uses, matched on place name or Places type. */
const EMOJI_KEYWORDS: [RegExp, string][] = [
  [/caf|coffee|espresso|tea house/i, '☕'],
  [/bbq|barbecue|grill|smokehouse/i, '🍔'],
  [/pizz/i, '🍕'],
  [/taco|taqueria|mexican/i, '🌮'],
  [/donut|doughnut|bakery|pastr/i, '🍩'],
  [/ice cream|creamer|gelato/i, '🍦'],
  [/kayak|paddle|canoe|raft/i, '🦜'],
  [/brew|taproom|winery|cider|distiller|\bbar\b|\bpub\b/i, '🍔'],
  [/hike|trail|park|forest|falls|lake|river|mountain|garden|scenic|viewpoint|overlook|campground|beach/i, '🍁'],
  [/tour|historic|museum|gallery|\bart\b|\bglass\b|attraction|zoo|farm|wildlife|downtown|theat/i, '🐴'],
  [/restaurant|kitchen|diner|eatery|burger|\bfood\b/i, '🍔'],
]

/** Fallback emoji for anything Places hands us that the vocabulary misses. */
export const DEFAULT_EMOJI = '📍'

export function emojiFor(text: string): string {
  return EMOJI_KEYWORDS.find(([pattern]) => pattern.test(text))?.[1] ?? DEFAULT_EMOJI
}

/**
 * Ambient places the map knows about but the Discover sheet doesn't list. They
 * ride along as pinprick dots and resolve into emoji as you zoom in, which is
 * what makes zooming feel like it reveals something.
 */
export const EMOJI_POIS: { id: string; emoji: string; coord: LngLat }[] = [
  { id: 'pizza', emoji: '🍕', coord: [-122.1608, 48.2151] },
  { id: 'burger', emoji: '🍔', coord: [-122.1489, 48.2384] },
  { id: 'taco', emoji: '🌮', coord: [-122.1192, 48.2179] },
  { id: 'coffee', emoji: '☕', coord: [-122.1704, 48.2436] },
  { id: 'icecream', emoji: '🍦', coord: [-122.1121, 48.2412] },
  { id: 'donut', emoji: '🍩', coord: [-122.1327, 48.2038] },
  { id: 'pony-rides', emoji: '🐴', coord: [-122.0968, 48.2611] },
  { id: 'maple-grove', emoji: '🍁', coord: [-121.9723, 48.4536] },
  { id: 'birdwatching', emoji: '🦜', coord: [-121.5842, 48.5197] },
  { id: 'skagit-diner', emoji: '🍔', coord: [-122.3348, 48.4194] },
  { id: 'everett-donuts', emoji: '🍩', coord: [-122.2029, 47.9789] },
  { id: 'concrete-coffee', emoji: '☕', coord: [-121.7476, 48.5389] },
  { id: 'marblemount-pizza', emoji: '🍕', coord: [-121.4331, 48.5271] },
  { id: 'newhalem-maples', emoji: '🍁', coord: [-121.2571, 48.6712] },
]

/** A saved place is a full Place plus the friend who saved it. */
export interface SavedPlace extends Place {
  avatar: string
  /** What it wears on the Discover map. Derived from the name when absent. */
  emoji?: string
  /** Google's own label for the place: `Lake`, `State Park`, `Hiking Area`. */
  category?: string
  /** A friend's note, shown under the row in the saved list. */
  quote?: { text: string; avatar: string }
}

/**
 * The design puts a friend's note under the first saved row. The live list is
 * whatever Places returns, so the quote attaches by position rather than by id.
 */
export const SAVED_QUOTE = {
  text: 'You can see beautiful stars here at night',
  avatar: '/assets/you-avatar-1.jpg',
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
    mapDetail: '🕘 Recently viewed',
    rating: 4.8,
    reviews: 198,
    coord: [-121.4404, 48.6538], // Marblemount, last coffee before the pass
    thumb: LAKE,
    photos: [LAKE, PADDLER, KAYAK],
    avatar: '/assets/you-avatar-1.jpg',
    emoji: '☕',
    knowBeforeYouGo: [
      'The last espresso before Newhalem — the next café is 40 minutes further up SR-20',
      'Cash only after 4pm, and the patio fills up the moment the sun clears the ridge',
    ],
  },
  {
    id: 'diablo-lake-hike',
    name: 'Diablo lake hike',
    hours: 'Open 24 hours',
    mapDetail: '⭐ Top rated nearby',
    rating: 4.8,
    reviews: 198,
    coord: [-121.1341, 48.7142],
    thumb: LAKE,
    photos: [LAKE, KAYAK, PADDLER],
    avatar: '/assets/avatar-2.png',
    emoji: '🍁',
    knowBeforeYouGo: [
      'The overlook lot fills by 10am on weekends — the trailhead half a mile east rarely does',
      'That turquoise colour is glacial flour, and it is strongest in late summer',
    ],
  },
  {
    id: 'sunset-beach-bbq',
    name: 'Sunset Beach BBQ',
    hours: 'Opens 11:30am Thu',
    mapDetail: '⭐ Top rated nearby',
    rating: 4.7,
    reviews: 152,
    coord: [-122.3312, 48.0312], // Everett waterfront
    thumb: KAYAK,
    photos: [KAYAK, LAKE, PADDLER],
    avatar: '/assets/you-avatar-4.jpg',
    emoji: '🍔',
    knowBeforeYouGo: [
      'Brisket usually sells out by 2pm — order it the moment you sit down',
      'Ask for a table on the west deck if you are timing this around sunset',
    ],
  },
  {
    id: 'historic-downtown',
    name: 'Historic Downtown Tour',
    hours: 'Tours 10am & 2pm',
    mapDetail: '⭐ Top rated nearby',
    rating: 4.9,
    reviews: 234,
    coord: [-122.3341, 48.4212], // Mount Vernon
    thumb: PADDLER,
    photos: [PADDLER, LAKE, KAYAK],
    avatar: '/assets/avatar-2.png',
    emoji: '🐴',
    knowBeforeYouGo: [
      'Runs about 90 minutes on foot with two flights of stairs and no step-free alternative',
      'Parking behind the old cannery is free for the first two hours',
    ],
  },
  {
    id: 'riverbend-kayaking',
    name: 'Riverbend Kayaking',
    hours: 'Opens 9:00am Thu',
    mapDetail: '🕘 Recently viewed',
    rating: 4.6,
    reviews: 89,
    coord: [-121.7512, 48.5361], // Skagit River near Concrete
    thumb: PADDLER,
    photos: [PADDLER, KAYAK, LAKE],
    avatar: '/assets/you-avatar-2.jpg',
    emoji: '🦜',
    knowBeforeYouGo: [
      'Book the morning slot — the afternoon wind on the Skagit turns the paddle back into work',
      'Everything you bring gets wet, so leave anything precious in the car',
    ],
  },
]

/** The stops the itinerary starts with, so those rows open a sheet too. */
export const SEEDED_STOPS: Place[] = [
  {
    id: 'strawberry-fields-alpaca',
    name: 'Strawberry Fields Alpaca Ranch',
    mapLabel: 'Alpaca Ranch',
    hours: 'Tours by appointment',
    mapDetail: '⭐ Top rated nearby',
    rating: 4.8,
    reviews: 42,
    coord: [-122.0916, 48.1229], // 13924 McElroy Rd NE, Arlington
    thumb: PADDLER,
    photos: [PADDLER, LAKE, KAYAK],
    knowBeforeYouGo: [
      'Tours are by appointment — confirm before you drive up McElroy Rd',
      'Closed-toe shoes; the animals will investigate anything that looks like food',
    ],
  },
  {
    id: 'blue-bird-cafe',
    name: 'Blue Bird Cafe',
    hours: 'Opens 5:00am Thu',
    mapDetail: '⭐ Top rated nearby',
    rating: 4.5,
    reviews: 184,
    coord: [-122.1264, 48.1965], // 308 N Olympic Ave, Arlington
    thumb: '/assets/kona-kitchen-tile.jpg',
    photos: ['/assets/kona-kitchen-tile.jpg', PADDLER, LAKE],
    knowBeforeYouGo: [
      'Family-owned since 1958 — the blueberry pancakes are the order, and they sell out on weekend mornings',
      'Free street parking on N Olympic Ave; breakfast starts at 5am if you want an early start into the mountains',
    ],
  },
  {
    id: 'kayak-rental',
    name: 'Kayak rental',
    hours: 'Opens 9:00am Thu',
    mapDetail: '⭐ Top rated nearby',
    rating: 4.8,
    reviews: 198,
    coord: [-121.9412, 48.5218], // Baker Lake turn-off
    thumb: PADDLER,
    photos: [PADDLER, LAKE, KAYAK],
    knowBeforeYouGo: [
      'Book the morning slot — the afternoon wind on the Skagit turns the paddle back into work',
      'Everything you bring gets wet, so leave anything precious in the car',
    ],
  },
  {
    id: 'silver-stream',
    name: 'Silver Stream Trail',
    hours: 'Open sunrise to sunset',
    mapDetail: '🕘 Recently viewed',
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
    id: 'rockport-state-park',
    name: 'Rockport State Park',
    hours: 'Open 8:00am to dusk',
    mapDetail: '⭐ Top rated nearby',
    rating: 4.7,
    reviews: 375,
    coord: [-121.6156, 48.4877],
    thumb: LAKE,
    photos: [LAKE, KAYAK, PADDLER],
    knowBeforeYouGo: [
      'Washington State Parks need a Discover Pass on the dashboard — day passes are sold at the kiosk',
      'The old-growth loop stays muddy long after the rest of the valley has dried out',
    ],
  },
  {
    id: 'nc-visitor-center',
    name: 'North Cascades Visitor Center',
    hours: 'Opens 9:00am Thu',
    mapDetail: '🕘 Recently viewed',
    rating: 4.7,
    reviews: 1098,
    coord: [-121.2667, 48.6663], // Newhalem
    thumb: LAKE,
    photos: [LAKE, PADDLER, KAYAK],
    knowBeforeYouGo: [
      'Last reliable restrooms and ranger information before the pass',
      'There is no petrol in Newhalem — fill up in Marblemount, 14 miles back',
    ],
  },
  {
    id: 'ladder-creek-falls',
    name: 'Ladder Creek Falls',
    hours: 'Open 24 hours',
    mapDetail: '⭐ Top rated nearby',
    rating: 4.7,
    reviews: 496,
    coord: [-121.2394, 48.6754],
    thumb: KAYAK,
    photos: [KAYAK, LAKE, PADDLER],
    knowBeforeYouGo: [
      'The loop climbs behind the powerhouse on stairs and a suspension bridge — not step-free',
      'The 1920s coloured light show still runs on the falls after dark in summer',
    ],
  },
  {
    id: 'diablo-lake-vista',
    name: 'Diablo Lake Vista Point',
    hours: 'Open 24 hours',
    mapDetail: '⭐ Top rated nearby',
    rating: 4.9,
    reviews: 3858,
    coord: [-121.0974, 48.7099], // The turquoise overlook on SR-20
    thumb: LAKE,
    photos: [LAKE, KAYAK, PADDLER],
    knowBeforeYouGo: [
      'The overlook lot fills by mid-morning in summer and there is nowhere to turn round',
      'That turquoise is glacial flour suspended in the water, and it is strongest in late summer',
    ],
  },
]

/**
 * Designed places that exist for real, with the search text that finds them.
 * Their photographs get replaced by Google's; the sticker art, hand-written
 * tips and the names on the map all stay as designed.
 *
 * The invented ones — Mountain View Café, Sunset Beach BBQ — are deliberately
 * absent: a text search would match some unrelated business.
 */
export const REAL_WORLD_MATCHES: { id: string; query: string; coord: LngLat }[] = [
  { id: KANGAROO.id, query: 'Outback Kangaroo Farm, Arlington, WA', coord: KANGAROO.coord },
  { id: 'diablo-lake-hike', query: 'Diablo Lake Trail, North Cascades', coord: [-121.13, 48.714] },
  { id: 'kona-kitchen', query: 'Kona Kitchen - Seattle', coord: [-122.3233564, 47.6906269] },
  { id: 'rockport-state-park', query: 'Rockport State Park, WA', coord: [-121.6156, 48.4877] },
  {
    id: 'nc-visitor-center',
    query: 'North Cascades National Park Visitor Center, Newhalem WA',
    coord: [-121.2667, 48.6663],
  },
  { id: 'ladder-creek-falls', query: 'Ladder Creek Falls, Newhalem, WA', coord: [-121.2394, 48.6754] },
  { id: 'diablo-lake-vista', query: 'Diablo Lake Vista Point, WA', coord: [-121.0974, 48.7099] },
  {
    id: 'strawberry-fields-alpaca',
    query: 'Strawberry Fields Alpaca Ranch, Arlington, WA',
    coord: [-122.0916, 48.1229],
  },
  {
    id: 'blue-bird-cafe',
    query: 'Blue Bird Cafe, Arlington, WA',
    coord: [-122.1264, 48.1965],
  },
]

/**
 * The two eateries the curated rail recommends. Kona Kitchen is a real Hawaiian
 * diner in Maple Leaf; Kone Bar and Grill is invented, so it keeps its authored
 * rating and artwork rather than being looked up.
 */
export const CURATED_PLACES: Place[] = [
  {
    id: 'kona-kitchen',
    name: 'Kona Kitchen',
    hours: 'Opens 11:00am Thu',
    // Only read if its gem is ever taken back, which the gem line covers today.
    mapDetail: '⭐ Top rated nearby',
    rating: 4.6,
    reviews: 1288,
    coord: [-122.3233564, 47.6906269], // 8501 5th Ave NE, Seattle
    thumb: PADDLER,
    photos: [PADDLER, LAKE, KAYAK],
    knowBeforeYouGo: [
      'Reviewers highlight the massive portions, so you may want to share or take some home',
      'Fans of the loco moco love customizing their plate with flavorful additions like kimchi',
    ],
    detail: {
      title: 'Kona Kitchen - Seattle',
      note: {
        text: 'The great grandson of Chozen from Cobra Kai was our waiter!',
        author: 'Discovered by Cindy and 37 others',
        avatar: '/assets/cindy.png',
      },
    },
  },
  {
    id: 'kone-bar-grill',
    name: 'Kone Bar and Grill',
    hours: 'Opens 12:00pm Thu',
    mapDetail: '🕘 Recently viewed',
    rating: 4.5,
    reviews: 478,
    coord: [-122.2015, 47.9781], // Everett, first stop out of the city
    thumb: '/assets/kone-bar-grill-tile.jpg',
    photos: ['/assets/kone-bar-grill-tile.jpg', PADDLER, LAKE],
    knowBeforeYouGo: [
      'Half the menu is vegetarian, and the kitchen will veganise most of the rest',
      'The patio is heated, so it stays usable well past sunset',
    ],
  },
]

/** Every place that can open the detail sheet, keyed by id. */
export const PLACES: Record<string, Place> = Object.fromEntries(
  [KANGAROO, ...SAVED, ...SEEDED_STOPS, ...CURATED_PLACES].map((p) => [p.id, p]),
)

/**
 * What the group is being pointed at. Each card names a place the detail sheet
 * already knows, so tapping one opens the same sheet the Discover rows do; the
 * badge is the card's own editorial line.
 */
export interface CuratedCard {
  placeId: string
  badge: string
  distanceMi: number
  /** Set where the badge is attributed to someone — the 26px face before it. */
  avatar?: string
  /**
   * Overrides the place's own photo. The card art is art-directed in Figma,
   * whereas `thumb` is whatever Places hands back for the same listing.
   */
  image?: string
}

/**
 * The full-width card at the top of the rail. It leads with the farm, which is
 * the one place that starts outside the trip — adding it from here is what puts
 * it on the map.
 */
export const CURATED_HERO: CuratedCard = {
  placeId: KANGAROO.id,
  badge: '🔥 Group Match',
  distanceMi: 1.5,
  image: '/assets/kangaroo.png',
}

/** The cards that scroll horizontally beneath the hero. */
export const CURATED_RAIL: CuratedCard[] = [
  {
    placeId: 'kona-kitchen',
    badge: 'Cindy marked as Hidden Gem 💎',
    distanceMi: 0.8,
    avatar: '/assets/cindy.png',
    image: '/assets/kona-kitchen-tile.jpg',
  },
  {
    placeId: 'kone-bar-grill',
    badge: '🌱 Vegetarian-Friendly',
    distanceMi: 1.5,
    image: '/assets/kone-bar-grill-tile.jpg',
  },
  { placeId: 'diablo-lake-hike', badge: '✅ Must Do', distanceMi: 1.5 },
]

/**
 * The curated card for a place, if it has one. A cafe sheet reads its badge and
 * distance from here rather than keeping its own copy, so the sheet and the
 * card can never quote different numbers for the same place.
 */
export function curatedCard(id: string): CuratedCard | undefined {
  return CURATED_HERO.placeId === id ? CURATED_HERO : CURATED_RAIL.find((c) => c.placeId === id)
}


