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

/**
 * Asks Mapbox Directions for a route through the given waypoints. Returns null
 * on any failure so the caller can fall back to the cached geometry — the
 * prototype must never render a blank map because a request failed.
 */
export async function fetchRoute(waypoints: LngLat[]): Promise<number[][] | null> {
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  if (!token || waypoints.length < 2) return null

  const path = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';')
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${path}?geometries=geojson&overview=full&access_token=${token}`

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data?.routes?.[0]?.geometry?.coordinates ?? null
  } catch {
    return null
  }
}
