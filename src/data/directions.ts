import type { LngLat } from './places'
import routes from './routes.json'

/**
 * Orders stops the way you would actually drive them: by how far along the
 * base route each one sits, rather than by the order they were tapped.
 */
export function orderAlongRoute(stops: LngLat[]): LngLat[] {
  const line = routes.direct.coordinates
  const progress = (p: LngLat) => {
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
  return [...stops].sort((a, b) => progress(a) - progress(b))
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
