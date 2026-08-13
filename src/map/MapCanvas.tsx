import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { avocadoStyle } from './avocadoStyle'
import routes from '../data/routes.json'
import { BOOKMARK_PINS, DESTINATION, EMOJI_POIS, KANGAROO, ORIGIN, PLACES, POI_ZOOM, STICKERS } from '../data/places'
import { fetchRoute, orderAlongRoute } from '../data/directions'
import { useTrip } from '../state/tripContext'
import { SNAP_FRACTION } from '../sheet/snaps'
import { MapMarkers } from './MapMarkers'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const ROUTE_BLUE = '#1A73E8'

/** Full extent of the jam, used for the opening fit. */
const ROUTE_BOUNDS: [[number, number], [number, number]] = [
  [-122.45, 47.55],
  [-121.09, 48.78],
]

/** Room for the status bar, title, search field and category chips. */
const TOP_INSET = 208

function lineFeature(coordinates: number[][]): GeoJSON.Feature<GeoJSON.LineString> {
  return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } }
}

/** Everything on the trip screen that lives in map space. */
export function MapCanvas() {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [ready, setReady] = useState(false)
  const [zoom, setZoom] = useState(8)
  const { stops, activePlaceId, openPlace, snap } = useTrip()

  useEffect(() => {
    if (!container.current || map.current) return

    const h = container.current.clientHeight
    const m = new mapboxgl.Map({
      container: container.current,
      style: avocadoStyle,
      bounds: ROUTE_BOUNDS,
      fitBoundsOptions: {
        padding: { top: TOP_INSET, bottom: h * SNAP_FRACTION.peek + 24, left: 26, right: 26 },
      },
      attributionControl: false,
      logoPosition: 'bottom-left',
    })
    map.current = m

    m.on('load', () => {
      m.addSource('route', { type: 'geojson', data: lineFeature(routes.direct.coordinates) })
      m.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 4.5, 10, 7, 14, 12],
          'line-opacity': 0.9,
        },
      })
      m.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ROUTE_BLUE,
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 2.4, 10, 4.5, 14, 8],
        },
      })
      setReady(true)
      setZoom(m.getZoom())
    })

    const onZoom = () => setZoom(m.getZoom())
    m.on('zoom', onZoom)

    return () => {
      m.remove()
      map.current = null
    }
  }, [])

  // "Add stop" re-draws the route through the stops, in driving order. The two
  // cached geometries cover the common cases instantly; anything else asks
  // Directions and falls back to the direct line if that call fails.
  useEffect(() => {
    const src = map.current?.getSource('route') as mapboxgl.GeoJSONSource | undefined
    if (!src) return

    if (stops.length === 0) {
      src.setData(lineFeature(routes.direct.coordinates))
      return
    }
    if (stops.length === 1 && stops[0] === KANGAROO.id) {
      src.setData(lineFeature(routes.withStop.coordinates))
      return
    }

    let cancelled = false
    const waypoints = orderAlongRoute(stops.flatMap((id) => (PLACES[id] ? [PLACES[id].coord] : [])))
    fetchRoute([ORIGIN, ...waypoints, DESTINATION]).then((coords) => {
      if (cancelled) return
      src.setData(lineFeature(coords ?? routes.direct.coordinates))
    })
    return () => {
      cancelled = true
    }
  }, [stops, ready])

  // Raising the sheet re-pads the camera rather than covering the route: the map
  // pans so the jam stays centred in whatever strip is still visible.
  useEffect(() => {
    const m = map.current
    if (!m || !ready || activePlaceId) return
    const h = m.getContainer().clientHeight
    m.easeTo({
      padding: { top: TOP_INSET, bottom: h * SNAP_FRACTION[snap] + 24, left: 26, right: 26 },
      duration: 420,
      essential: true,
    })
  }, [snap, ready, activePlaceId])

  // Opening any place pulls the camera in and lifts it above the detail sheet.
  useEffect(() => {
    const m = map.current
    if (!m || !ready || !activePlaceId) return
    const place = PLACES[activePlaceId]
    if (!place) return
    const h = m.getContainer().clientHeight
    m.flyTo({
      center: place.coord,
      zoom: 12.4,
      padding: { top: TOP_INSET, bottom: h * SNAP_FRACTION.half + 24, left: 26, right: 26 },
      duration: 1200,
      essential: true,
    })
  }, [activePlaceId, ready])

  return (
    <div className="map-canvas">
      <div ref={container} className="map-gl" />
      {ready && map.current && (
        <MapMarkers
          map={map.current}
          zoom={zoom}
          showPois={zoom >= POI_ZOOM}
          origin={ORIGIN}
          destination={DESTINATION}
          stickers={STICKERS}
          pins={BOOKMARK_PINS}
          pois={EMOJI_POIS}
          onStickerClick={openPlace}
        />
      )}
    </div>
  )
}
