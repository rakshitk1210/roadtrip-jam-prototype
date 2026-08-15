import type { LngLat, Place, SavedPlace } from './places'
import routes from './routes.json'

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchNearby'
const TEXT_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText'

/** Only the fields we render — the field mask is what Places bills on. */
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.rating',
  'places.userRatingCount',
  'places.location',
  'places.photos',
  'places.editorialSummary',
  'places.regularOpeningHours.openNow',
  'places.primaryTypeDisplayName',
].join(',')

/** Food and drink, outdoors, and the oddity/attraction bucket the farm belongs to. */
const INCLUDED_TYPES = [
  'restaurant',
  'cafe',
  'park',
  'national_park',
  'hiking_area',
  'tourist_attraction',
  'museum',
  'zoo',
]

/**
 * Without these the list fills with Walmart, Safeway and McDonald's — they rank
 * highly on review volume but nobody plans a road trip around them. `bakery` is
 * also left out of the included types above, since supermarket bakeries match it.
 */
const EXCLUDED_TYPES = [
  'supermarket',
  'grocery_store',
  'department_store',
  'discount_store',
  'convenience_store',
  'fast_food_restaurant',
  'gas_station',
  'warehouse_store',
  'wholesaler',
]

/** Enough anchors to cover the drive without one request per kilometre. */
const ANCHOR_COUNT = 6
const ANCHOR_RADIUS_M = 10000
const PER_ANCHOR = 8

// 4.4 is where the national chains fall away — Red Robin, Buffalo Wild Wings and
// Starbucks all sit at 4.0-4.2 on this route, the local diners above it.
const MIN_RATING = 4.4
const MIN_REVIEWS = 25
const MAX_RESULTS = 12

const CACHE_KEY = 'roadtrip-jam:discover:v1'

/** The friend avatars the design attributes saves to, assigned round-robin. */
const AVATARS = [
  '/assets/you-avatar-1.jpg',
  '/assets/you-avatar-2.jpg',
  '/assets/you-avatar-3.jpg',
  '/assets/you-avatar-4.jpg',
  '/assets/avatar-2.png',
]

interface ApiPlace {
  id: string
  displayName?: { text?: string }
  rating?: number
  userRatingCount?: number
  location?: { latitude: number; longitude: number }
  photos?: { name: string }[]
  editorialSummary?: { text?: string }
  regularOpeningHours?: { openNow?: boolean }
  primaryTypeDisplayName?: { text?: string }
}

/** Evenly spaced points along the cached route, used as search centres. */
function anchors(count: number): LngLat[] {
  const line = routes.direct.coordinates as number[][]
  const step = (line.length - 1) / (count - 1)
  return Array.from({ length: count }, (_, i) => {
    const [lng, lat] = line[Math.round(i * step)]
    return [lng, lat] as LngLat
  })
}

/**
 * Place Photos are served from Google at render time rather than downloaded.
 * Their terms allow storing place IDs indefinitely but not re-hosting photo
 * content, and a URL is simpler than a build step besides.
 */
function photoUrl(name: string, key: string, width = 800): string {
  // The endpoint 302s to the image, which is exactly what an <img> wants.
  return `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${width}&key=${key}`
}

function toSavedPlace(p: ApiPlace, key: string, index: number): SavedPlace | null {
  const name = p.displayName?.text
  const loc = p.location
  if (!name || !loc) return null

  const urls = (p.photos ?? []).slice(0, 3).map((photo) => photoUrl(photo.name, key))
  if (urls.length === 0) return null
  // The collage always wants three tiles; repeat rather than leave holes.
  const photos: [string, string, string] = [
    urls[0],
    urls[1] ?? urls[0],
    urls[2] ?? urls[0],
  ]

  const summary = p.editorialSummary?.text
  const kind = p.primaryTypeDisplayName?.text

  return {
    id: p.id,
    name,
    hours: p.regularOpeningHours?.openNow === undefined
      ? undefined
      : p.regularOpeningHours.openNow
        ? 'Open now'
        : 'Closed right now',
    rating: p.rating ?? 0,
    reviews: p.userRatingCount ?? 0,
    coord: [loc.longitude, loc.latitude],
    thumb: photos[0],
    photos,
    avatar: AVATARS[index % AVATARS.length],
    knowBeforeYouGo: [
      summary ?? `A ${(kind ?? 'stop').toLowerCase()} a short detour off your route`,
      `Rated ${(p.rating ?? 0).toFixed(1)} by ${p.userRatingCount ?? 0} travellers on Google`,
    ],
  }
}

async function searchAnchor(centre: LngLat, key: string): Promise<ApiPlace[]> {
  const [lng, lat] = centre
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: INCLUDED_TYPES,
      excludedTypes: EXCLUDED_TYPES,
      maxResultCount: PER_ANCHOR,
      rankPreference: 'POPULARITY',
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: ANCHOR_RADIUS_M },
      },
    }),
  })
  if (!res.ok) throw new Error(`Places responded ${res.status}`)
  const data = await res.json()
  return data?.places ?? []
}

/**
 * Real places along the drive, best first. Returns null on any failure so the
 * caller can keep the designed list — the same contract as `fetchRoute`, and for
 * the same reason: the prototype must never render an empty screen.
 */
export async function discoverAlongRoute(): Promise<SavedPlace[] | null> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  if (!key) return null

  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) return JSON.parse(cached) as SavedPlace[]
  } catch {
    // A malformed or unavailable cache is not worth failing over.
  }

  try {
    const batches = await Promise.all(anchors(ANCHOR_COUNT).map((a) => searchAnchor(a, key)))

    const seen = new Set<string>()
    const places: SavedPlace[] = []
    for (const p of batches.flat()) {
      if (seen.has(p.id)) continue
      if ((p.rating ?? 0) < MIN_RATING) continue
      if ((p.userRatingCount ?? 0) < MIN_REVIEWS) continue
      seen.add(p.id)
      const place = toSavedPlace(p, key, places.length)
      if (place) places.push(place)
    }

    if (places.length === 0) return null

    const top = places
      .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
      .slice(0, MAX_RESULTS)

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(top))
    } catch {
      // Storage being full or blocked shouldn't cost us the results.
    }
    return top
  } catch (err) {
    console.warn('[places] falling back to the designed list', err)
    return null
  }
}

/** Real imagery and ratings layered onto a place we authored by hand. */
export interface PlaceOverride {
  photos: [string, string, string]
  rating: number
  reviews: number
}

const OVERRIDE_CACHE_KEY = 'roadtrip-jam:overrides:v1'

/**
 * Looks a designed place up by name and pulls its real photographs. The Kangaroo
 * Farm and the seeded itinerary stops are actual businesses, so their stock
 * imagery can be replaced while their sticker art and hand-written tips stay.
 */
async function lookupByText(
  name: string,
  coord: LngLat,
  key: string,
): Promise<PlaceOverride | null> {
  const [lng, lat] = coord
  const res = await fetch(TEXT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.photos,places.rating,places.userRatingCount',
    },
    body: JSON.stringify({
      textQuery: name,
      maxResultCount: 1,
      // Biased rather than restricted: the name is specific, and a hard
      // restriction drops places that sit just outside the circle.
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 20000 } },
    }),
  })
  if (!res.ok) throw new Error(`Places responded ${res.status}`)

  const data = await res.json()
  const hit: ApiPlace | undefined = data?.places?.[0]
  const urls = (hit?.photos ?? []).slice(0, 3).map((p) => photoUrl(p.name, key))
  if (!hit || urls.length === 0) return null

  return {
    photos: [urls[0], urls[1] ?? urls[0], urls[2] ?? urls[0]],
    rating: hit.rating ?? 0,
    reviews: hit.userRatingCount ?? 0,
  }
}

/**
 * Resolves real photos for the hand-authored places, keyed by id. Missing
 * entries simply keep their designed artwork.
 */
export async function hydrateDesigned(
  targets: { id: string; query: string; coord: LngLat }[],
): Promise<Record<string, PlaceOverride>> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  if (!key) return {}

  try {
    const cached = sessionStorage.getItem(OVERRIDE_CACHE_KEY)
    if (cached) return JSON.parse(cached) as Record<string, PlaceOverride>
  } catch {
    // A malformed cache is not worth failing over.
  }

  const results = await Promise.all(
    targets.map(async (t) => {
      try {
        return [t.id, await lookupByText(t.query, t.coord, key)] as const
      } catch {
        return [t.id, null] as const
      }
    }),
  )

  const overrides: Record<string, PlaceOverride> = {}
  for (const [id, value] of results) if (value) overrides[id] = value

  try {
    if (Object.keys(overrides).length > 0) {
      sessionStorage.setItem(OVERRIDE_CACHE_KEY, JSON.stringify(overrides))
    }
  } catch {
    // Storage being blocked shouldn't cost us the results.
  }
  return overrides
}

export type { Place }
