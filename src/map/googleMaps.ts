import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import type { LngLat } from '../data/places'

setOptions({ key: import.meta.env.VITE_GOOGLE_MAPS_KEY, v: 'weekly' })

/** Loads the two libraries the map needs. Safe to call more than once. */
export async function loadMaps() {
  const [maps, core] = await Promise.all([importLibrary('maps'), importLibrary('core')])
  return { ...maps, ...core }
}

/**
 * The data files store `[lng, lat]`; Google wants `{lat, lng}`. Typed loosely
 * enough to also take the plain `number[][]` coming out of `routes.json`.
 */
export const toLatLng = ([lng, lat]: LngLat | number[]): google.maps.LatLngLiteral => ({ lat, lng })

/**
 * Linear interpolation between zoom/width stops, standing in for the
 * `['interpolate', ['linear'], ['zoom'], …]` expressions Mapbox did natively.
 * Stops must be sorted by zoom.
 */
export function widthForZoom(zoom: number, stops: [number, number][]): number {
  const first = stops[0]
  const last = stops[stops.length - 1]
  if (zoom <= first[0]) return first[1]
  if (zoom >= last[0]) return last[1]

  for (let i = 0; i < stops.length - 1; i++) {
    const [z0, w0] = stops[i]
    const [z1, w1] = stops[i + 1]
    if (zoom >= z0 && zoom <= z1) return w0 + ((w1 - w0) * (zoom - z0)) / (z1 - z0)
  }
  return last[1]
}

/**
 * Shifts a coordinate by a pixel offset at the current zoom. Google has no
 * `easeTo({padding})`, so lifting a place clear of the bottom sheet means doing
 * the projection maths by hand: world coordinates are 0-256, and one world unit
 * is `2 ** zoom` pixels.
 */
export function offsetCenter(
  map: google.maps.Map,
  center: google.maps.LatLngLiteral,
  xPx: number,
  yPx: number,
): google.maps.LatLngLiteral | null {
  const projection = map.getProjection()
  const zoom = map.getZoom()
  if (!projection || zoom == null) return null

  const point = projection.fromLatLngToPoint(new google.maps.LatLng(center))
  if (!point) return null

  const scale = 2 ** zoom
  const shifted = new google.maps.Point(point.x + xPx / scale, point.y + yPx / scale)
  const latLng = projection.fromPointToLatLng(shifted)
  return latLng ? { lat: latLng.lat(), lng: latLng.lng() } : null
}

/**
 * Where a coordinate falls relative to the middle of the map, in pixels. The
 * inverse of `offsetCenter`, and the same world-coordinate maths: it answers
 * whether something is on screen at all, which `getBounds` can't, since the
 * sheet covers the bottom of the viewport it reports.
 */
export function pixelFromCenter(
  map: google.maps.Map,
  target: google.maps.LatLngLiteral,
): { x: number; y: number } | null {
  const projection = map.getProjection()
  const centre = map.getCenter()
  const zoom = map.getZoom()
  if (!projection || !centre || zoom == null) return null

  const a = projection.fromLatLngToPoint(new google.maps.LatLng(target))
  const b = projection.fromLatLngToPoint(centre)
  if (!a || !b) return null

  const scale = 2 ** zoom
  return { x: (a.x - b.x) * scale, y: (a.y - b.y) * scale }
}
