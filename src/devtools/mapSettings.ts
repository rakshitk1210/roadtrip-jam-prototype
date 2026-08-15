/**
 * Every Google Maps knob this prototype exposes, plus the jam's own overlay
 * controls. Defaults mirror what the design ships with, so opening the
 * inspector shows the current map rather than a reset one.
 */

export type MapTypeId = 'roadmap' | 'satellite' | 'hybrid' | 'terrain'
export type GestureHandling = 'greedy' | 'cooperative' | 'none' | 'auto'

/** A basemap layer the sidebar can show or hide. */
export interface StyleLayer {
  key: string
  label: string
  featureType: string
  elementType: string
  /** Visible by default? */
  on: boolean
}

/**
 * Order matters — later rules win in the Maps style spec, so the broad feature
 * types come first and the specific ones after.
 */
export const STYLE_LAYERS: StyleLayer[] = [
  { key: 'poiLabels', label: 'POI labels', featureType: 'poi', elementType: 'labels', on: false },
  { key: 'poiGeometry', label: 'POI & park fill', featureType: 'poi', elementType: 'geometry', on: true },
  { key: 'transit', label: 'Transit', featureType: 'transit', elementType: 'all', on: false },
  { key: 'roadLabels', label: 'Road labels', featureType: 'road', elementType: 'labels', on: false },
  { key: 'roadIcons', label: 'Road shields', featureType: 'road', elementType: 'labels.icon', on: false },
  { key: 'highway', label: 'Highways', featureType: 'road.highway', elementType: 'geometry', on: true },
  { key: 'arterial', label: 'Arterial roads', featureType: 'road.arterial', elementType: 'geometry', on: true },
  { key: 'local', label: 'Local roads', featureType: 'road.local', elementType: 'geometry', on: true },
  { key: 'waterLabels', label: 'Water labels', featureType: 'water', elementType: 'labels', on: false },
  { key: 'landscapeLabels', label: 'Landscape labels', featureType: 'landscape', elementType: 'labels', on: true },
  { key: 'localityLabels', label: 'Town names', featureType: 'administrative.locality', elementType: 'labels', on: true },
  { key: 'countryLabels', label: 'Country & state names', featureType: 'administrative.country', elementType: 'labels', on: true },
  { key: 'neighborhood', label: 'Neighbourhoods', featureType: 'administrative.neighborhood', elementType: 'all', on: false },
  { key: 'landParcel', label: 'Land parcels', featureType: 'administrative.land_parcel', elementType: 'all', on: false },
]

/** Geometry fills the sidebar can recolour. An empty string means "leave alone". */
export interface StyleColor {
  key: string
  label: string
  featureType: string
  elementType: string
  value: string
}

export const STYLE_COLORS: StyleColor[] = [
  { key: 'landscapeFill', label: 'Land', featureType: 'landscape', elementType: 'geometry.fill', value: '' },
  { key: 'waterFill', label: 'Water', featureType: 'water', elementType: 'geometry.fill', value: '' },
  { key: 'highwayFill', label: 'Highway', featureType: 'road.highway', elementType: 'geometry.fill', value: '' },
  { key: 'parkFill', label: 'Parks', featureType: 'poi.park', elementType: 'geometry.fill', value: '' },
]

export interface MapSettings {
  // --- google.maps.MapOptions ---
  mapTypeId: MapTypeId
  gestureHandling: GestureHandling
  minZoom: number
  maxZoom: number
  tilt: number
  heading: number
  clickableIcons: boolean
  isFractionalZoomEnabled: boolean
  scrollwheel: boolean
  keyboardShortcuts: boolean
  // --- built-in controls ---
  zoomControl: boolean
  mapTypeControl: boolean
  streetViewControl: boolean
  fullscreenControl: boolean
  scaleControl: boolean
  rotateControl: boolean
  // --- basemap styling ---
  layers: Record<string, boolean>
  colors: Record<string, string>
  saturation: number
  lightness: number
  // --- the jam's own overlay ---
  routeColor: string
  casingColor: string
  lineScale: number
  showStickers: boolean
  showPins: boolean
  showPois: boolean
  showOrigin: boolean
  stickerScale: number
  poiZoom: number
  topInset: number
}

export const DEFAULT_SETTINGS: MapSettings = {
  mapTypeId: 'roadmap',
  gestureHandling: 'greedy',
  minZoom: 3,
  maxZoom: 20,
  tilt: 0,
  heading: 0,
  clickableIcons: false,
  isFractionalZoomEnabled: true,
  scrollwheel: true,
  keyboardShortcuts: false,
  zoomControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  scaleControl: false,
  rotateControl: false,
  layers: Object.fromEntries(STYLE_LAYERS.map((l) => [l.key, l.on])),
  colors: Object.fromEntries(STYLE_COLORS.map((c) => [c.key, c.value])),
  saturation: 0,
  lightness: 0,
  routeColor: '#1A73E8',
  casingColor: '#FFFFFF',
  lineScale: 1,
  showStickers: true,
  showPins: true,
  showPois: true,
  showOrigin: true,
  stickerScale: 1,
  poiZoom: 11.5,
  topInset: 208,
}

/**
 * Turns the sidebar state into a Maps style array. Only non-default rules are
 * emitted, which keeps the exported JSON readable.
 */
export function buildStyles(settings: MapSettings): google.maps.MapTypeStyle[] {
  const styles: google.maps.MapTypeStyle[] = []

  if (settings.saturation !== 0 || settings.lightness !== 0) {
    const stylers: Record<string, number>[] = []
    if (settings.saturation !== 0) stylers.push({ saturation: settings.saturation })
    if (settings.lightness !== 0) stylers.push({ lightness: settings.lightness })
    styles.push({ featureType: 'all', elementType: 'all', stylers })
  }

  for (const layer of STYLE_LAYERS) {
    if (settings.layers[layer.key]) continue
    styles.push({
      featureType: layer.featureType,
      elementType: layer.elementType,
      stylers: [{ visibility: 'off' }],
    })
  }

  for (const colour of STYLE_COLORS) {
    const value = settings.colors[colour.key]
    if (!value) continue
    styles.push({
      featureType: colour.featureType,
      elementType: colour.elementType,
      stylers: [{ color: value }],
    })
  }

  return styles
}

/** The subset of settings that map straight onto `map.setOptions`. */
export function toMapOptions(settings: MapSettings): google.maps.MapOptions {
  return {
    mapTypeId: settings.mapTypeId,
    gestureHandling: settings.gestureHandling,
    minZoom: settings.minZoom,
    maxZoom: settings.maxZoom,
    tilt: settings.tilt,
    heading: settings.heading,
    clickableIcons: settings.clickableIcons,
    isFractionalZoomEnabled: settings.isFractionalZoomEnabled,
    scrollwheel: settings.scrollwheel,
    keyboardShortcuts: settings.keyboardShortcuts,
    zoomControl: settings.zoomControl,
    mapTypeControl: settings.mapTypeControl,
    streetViewControl: settings.streetViewControl,
    fullscreenControl: settings.fullscreenControl,
    scaleControl: settings.scaleControl,
    rotateControl: settings.rotateControl,
    styles: buildStyles(settings),
  }
}
