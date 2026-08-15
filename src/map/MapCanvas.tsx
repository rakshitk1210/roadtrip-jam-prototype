import { useEffect, useRef, useState } from 'react'
import routes from '../data/routes.json'
import { DESTINATION, EMOJI_POIS, KANGAROO, ORIGIN, POI_ZOOM, STICKERS } from '../data/places'
import { fetchRoute, orderAlongRoute } from '../data/directions'
import { useTrip } from '../state/tripContext'
import { SNAP_FRACTION } from '../sheet/snaps'
import { loadMaps, offsetCenter, toLatLng, widthForZoom } from './googleMaps'
import { MapMarkers } from './MapMarkers'

const ROUTE_BLUE = '#1A73E8'

/** Full extent of the jam, used for the opening fit. */
const ROUTE_BOUNDS: google.maps.LatLngBoundsLiteral = {
  west: -122.45,
  south: 47.55,
  east: -121.09,
  north: 48.78,
}

/** Room for the title row, search field and category chips. */
const TOP_INSET = 208

/**
 * Strips the basemap back to what the jam is about. Park and business names
 * ("Mount Baker-Snoqualmie National Forest") competed with our own stickers and
 * none of them sit on the route; town names stay so the drive is still readable.
 *
 * JSON styling only applies while the map has no `mapId` — the same reason
 * `HtmlMarker` uses `OverlayView` instead of `AdvancedMarkerElement`.
 */
const CLEAN_STYLE: google.maps.MapTypeStyle[] = [
  // Labels only: the green park geometry is worth keeping, the names are not.
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  // `administrative.locality` is deliberately absent — that's the town names.
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'labels', stylers: [{ visibility: 'off' }] },
]

/** Zoom/width stops carried over from the Mapbox line layers. */
const CASING_WIDTH: [number, number][] = [
  [6, 4.5],
  [10, 7],
  [14, 12],
]
const LINE_WIDTH: [number, number][] = [
  [6, 2.4],
  [10, 4.5],
  [14, 8],
]

const sheetBottom = (height: number, fraction: number) => height * fraction + 24

/** Everything on the trip screen that lives in map space. */
export function MapCanvas() {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<google.maps.Map | null>(null)
  const casing = useRef<google.maps.Polyline | null>(null)
  const line = useRef<google.maps.Polyline | null>(null)
  /** Bottom padding the camera is currently composed for, so snaps pan by the delta. */
  const bottomInset = useRef(0)
  /** Mirrors `failed` for reads inside Google callbacks, which miss state updates. */
  const failedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [zoom, setZoom] = useState(8)
  const { stops, activePlaceId, openPlace, snap, discover, findPlace } = useTrip()

  useEffect(() => {
    if (!container.current || map.current) return
    let cancelled = false

    // Key and billing problems (ApiNotActivatedMapError and friends) don't
    // reject the load — Google reports them through this global instead, and
    // would otherwise just leave a blank rectangle behind.
    window.gm_authFailure = () => {
      failedRef.current = true
      setFailed(true)
    }

    loadMaps()
      .then(({ Map, Polyline }) => {
        if (cancelled || !container.current) return

        try {
          const height = container.current.clientHeight
          const m = new Map(container.current, {
            center: { lat: 48.16, lng: -121.77 },
            zoom: 8,
            styles: CLEAN_STYLE,
            disableDefaultUI: true,
            // Google's own POIs would open info windows and fight the stickers.
            clickableIcons: false,
            // The sticker scale ramp reads fractional zoom.
            isFractionalZoomEnabled: true,
            // One finger pans, which is what a phone prototype wants.
            gestureHandling: 'greedy',
          })
          map.current = m

          bottomInset.current = sheetBottom(height, SNAP_FRACTION.peek)
          m.fitBounds(ROUTE_BOUNDS, {
            top: TOP_INSET,
            bottom: bottomInset.current,
            left: 26,
            right: 26,
          })

          // Nothing is added to the map until `idle` proves it actually drew.
          // A rejected key still yields a Map object, but one whose internals
          // are missing — attaching overlays to it throws asynchronously from
          // inside Google's own render loop, where no try/catch of ours can
          // reach it. On a bad key `idle` simply never fires, so we stay inert.
          google.maps.event.addListenerOnce(m, 'idle', () => {
            if (cancelled || failedRef.current) return

            // `idle` fires even when Google rejected the key, so it alone is not
            // proof the map is real. A live map has a projection; a rejected one
            // does not, and attaching overlays to it throws from inside Google's
            // own render loop where our try/catch cannot reach.
            if (!m.getProjection()) {
              setFailed(true)
              return
            }

            const path = routes.direct.coordinates.map(toLatLng)
            casing.current = new Polyline({
              path,
              map: m,
              strokeColor: '#FFFFFF',
              strokeOpacity: 0.9,
              strokeWeight: widthForZoom(8, CASING_WIDTH),
              zIndex: 1,
            })
            line.current = new Polyline({
              path,
              map: m,
              strokeColor: ROUTE_BLUE,
              strokeWeight: widthForZoom(8, LINE_WIDTH),
              zIndex: 2,
            })

            m.addListener('zoom_changed', () => {
              const z = m.getZoom() ?? 8
              setZoom(z)
              casing.current?.setOptions({
                strokeWeight: widthForZoom(z, CASING_WIDTH),
              })
              line.current?.setOptions({
                strokeWeight: widthForZoom(z, LINE_WIDTH),
              })
            })

            setZoom(m.getZoom() ?? 8)
            setReady(true)
          })
        } catch (err) {
          console.error('[map] Google Maps failed to initialise', err)
          setFailed(true)
        }
      })
      .catch((err) => {
        console.error('[map] Google Maps failed to load', err)
        setFailed(true)
      })

    return () => {
      cancelled = true
      casing.current?.setMap(null)
      line.current?.setMap(null)
      casing.current = null
      line.current = null
      map.current = null
    }
  }, [])

  // "Add stop" re-draws the route through the stops, in driving order. The two
  // cached geometries cover the common cases instantly; anything else asks
  // Routes and falls back to the direct line if that call fails.
  useEffect(() => {
    if (!ready) return
    const setPath = (coordinates: number[][]) => {
      const path = coordinates.map(toLatLng)
      casing.current?.setPath(path)
      line.current?.setPath(path)
    }

    if (stops.length === 0) {
      setPath(routes.direct.coordinates)
      return
    }
    if (stops.length === 1 && stops[0] === KANGAROO.id) {
      setPath(routes.withStop.coordinates)
      return
    }

    let cancelled = false
    const waypoints = orderAlongRoute(
      stops.flatMap((id) => {
        const place = findPlace(id)
        return place ? [place.coord] : []
      }),
    )
    fetchRoute([ORIGIN, ...waypoints, DESTINATION]).then((coords) => {
      if (cancelled) return
      setPath(coords ?? routes.direct.coordinates)
    })
    return () => {
      cancelled = true
    }
  }, [stops, ready, findPlace])

  // Raising the sheet re-pads the camera rather than covering the route. Panning
  // by half the change in bottom inset keeps the jam centred in whatever strip is
  // still visible, without disturbing the zoom the user chose.
  useEffect(() => {
    const m = map.current
    const height = container.current?.clientHeight
    if (!m || !ready || activePlaceId || !height) return

    const next = sheetBottom(height, SNAP_FRACTION[snap])
    const delta = (next - bottomInset.current) / 2
    bottomInset.current = next
    if (Math.abs(delta) > 1) m.panBy(0, delta)
  }, [snap, ready, activePlaceId])

  // Opening any place pulls the camera in and lifts it above the detail sheet.
  useEffect(() => {
    const m = map.current
    const height = container.current?.clientHeight
    if (!m || !ready || !activePlaceId || !height) return
    const place = findPlace(activePlaceId)
    if (!place) return

    m.setZoom(12.4)
    const next = sheetBottom(height, SNAP_FRACTION.half)
    bottomInset.current = next

    const center = toLatLng(place.coord)
    m.panTo(offsetCenter(m, center, 0, (next - TOP_INSET) / 2) ?? center)
  }, [activePlaceId, ready, findPlace])

  return (
    <div className="map-canvas">
      {/* On failure Google paints its own "Oops!" panel in here. It's hidden in
          favour of the notice below, which names the setting that fixes it. */}
      <div ref={container} className={`map-gl${failed ? ' is-failed' : ''}`} />
      {failed && (
        <div className="map-error">
          <p>Google Maps didn’t load.</p>
          <p>
            Enable the <strong>Maps JavaScript API</strong> for this key’s project, then reload.
          </p>
        </div>
      )}
      {ready && map.current && (
        <MapMarkers
          map={map.current}
          zoom={zoom}
          showPois={zoom >= POI_ZOOM}
          origin={ORIGIN}
          destination={DESTINATION}
          stickers={STICKERS}
          // Pins follow whatever Discover is showing, so real places land on
          // their real coordinates and gems key off the same ids.
          pins={discover.map(({ id, coord }) => ({ id, coord }))}
          pois={EMOJI_POIS}
          onStickerClick={openPlace}
        />
      )}
    </div>
  )
}
