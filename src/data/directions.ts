import type { LngLat } from './places'
import routes from './routes.json'

/**
 * Orders stops the way you would actually drive them: by how far along the
 * base route each one sits, rather than by the order they were tapped.
 */
export function orderAlongRoute(stops: LngLat[]): LngLat[] {
  return [...stops].sort((a, b) => nearestIndex(a) - nearestIndex(b))
}

/** Index of the route vertex nearest a point — the shared basis for ordering and detours. */
function nearestIndex(p: LngLat, line: number[][] = routes.direct.coordinates): number {
  let best = Infinity
  let index = 0
  for (let i = 0; i < line.length; i++) {
    const dx = line[i][0] - p[0]
    const dy = line[i][1] - p[1]
    const d = dx * dx + dy * dy
    if (d < best) {
      best = d
      index = i
    }
  }
  return index
}

const EARTH_MILES = 3958.8
const rad = (deg: number) => (deg * Math.PI) / 180

export function haversineMiles(a: LngLat, b: LngLat): number {
  const dLat = rad(b[1] - a[1])
  const dLng = rad(b[0] - a[0])
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_MILES * Math.asin(Math.sqrt(h))
}

/**
 * How far off the drive a place sits — the distance to the nearest point on the
 * route, which is what "is this worth the detour" actually asks. Pure maths over
 * the cached line, so it costs no API call.
 */
export function detourFromRoute(coord: LngLat): number {
  return haversineMiles(coord, routes.direct.coordinates[nearestIndex(coord)] as LngLat)
}

/** Formats a detour the way the rows read: `1.5 mi`. */
export function formatMiles(miles: number): string {
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`
}

const waypoint = ([lng, lat]: LngLat) => ({ location: { latLng: { latitude: lat, longitude: lng } } })

/**
 * Asks the Routes API for a route through the given waypoints. Returns null on
 * any failure so the caller can fall back to the cached geometry — the
 * prototype must never render a blank map because a request failed.
 *
 * This targets Routes rather than the older Directions API: Directions is now
 * refused as a legacy API on new projects, and Routes is the one that answers
 * cross-origin, so the browser can call it without a proxy. It still needs
 * "Routes API" enabled on the key, and quietly degrades until it is.
 */
export async function fetchRoute(waypoints: LngLat[]): Promise<number[][] | null> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  if (!key || waypoints.length < 2) return null

  const [origin, ...rest] = waypoints
  const destination = rest.pop()!

  try {
    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'routes.polyline.geoJsonLinestring',
      },
      body: JSON.stringify({
        origin: waypoint(origin),
        destination: waypoint(destination),
        intermediates: rest.map(waypoint),
        travelMode: 'DRIVE',
        // Returns `[lng, lat]` pairs, matching routes.json and this signature.
        polylineEncoding: 'GEO_JSON_LINESTRING',
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.routes?.[0]?.polyline?.geoJsonLinestring?.coordinates ?? null
  } catch {
    return null
  }
}
