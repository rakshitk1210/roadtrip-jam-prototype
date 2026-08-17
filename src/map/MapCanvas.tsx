import { useEffect, useMemo, useRef, useState } from 'react'
import routes from '../data/routes.json'
import { DESTINATION, EMOJI_POIS, KANGAROO, ORIGIN, STICKERS, type LngLat } from '../data/places'
import { fetchRoute, orderAlongRoute } from '../data/directions'
import { useTrip } from '../state/tripContext'
import { SNAP_FRACTION } from '../sheet/snaps'
import { dayColor } from '../styles/dayColors'
import { loadMaps, offsetCenter, toLatLng, widthForZoom } from './googleMaps'
import { MapMarkers } from './MapMarkers'
import { useMapSettings } from '../devtools/mapSettingsContext'
import { toMapOptions } from '../devtools/mapSettings'

/** Full extent of the jam, used for the opening fit. */
const ROUTE_BOUNDS: google.maps.LatLngBoundsLiteral = {
  west: -122.45,
  south: 47.55,
  east: -121.09,
  north: 48.78,
}

/**
 * The basemap style, route colours and overlay toggles all live in
 * `devtools/mapSettings.ts` now, since the inspector edits them live. Its
 * defaults are what the design ships with.
 *
 * JSON styling only applies while the map has no `mapId` — the same reason
 * `HtmlMarker` uses `OverlayView` instead of `AdvancedMarkerElement`.
 */

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

/**
 * Vertex on the route closest to a stop. Planar distance is enough to rank
 * candidates over one state's worth of latitude.
 */
function nearestVertex(path: number[][], [lng, lat]: LngLat) {
  let best = 0
  let nearest = Infinity
  path.forEach(([x, y], i) => {
    const d = (x - lng) ** 2 + (y - lat) ** 2
    if (d < nearest) {
      nearest = d
      best = i
    }
  })
  return best
}

/**
 * Cuts the route where each day ends, so every day's driving draws in its own
 * colour. Segments share the vertex they meet at, or the line would show gaps.
 *
 * A day is cut at whichever of its stops sits furthest along the road, not at
 * the last one listed: days are ordered by when you visit them, and the seeded
 * trip visits the Kangaroo Farm before doubling back into Seattle. Cutting at
 * the last row would collapse that day's leg to a few city blocks.
 */
function splitByDay(path: number[][], cuts: LngLat[][], colors: string[]) {
  const at = cuts
    .map((day) => day.reduce((furthest, c) => Math.max(furthest, nearestVertex(path, c)), 0))
    .sort((a, b) => a - b)
  const segments: { path: number[][]; color: string }[] = []

  let start = 0
  at.forEach((end, i) => {
    if (end > start) segments.push({ path: path.slice(start, end + 1), color: colors[i] })
    start = Math.max(start, end)
  })
  segments.push({ path: path.slice(start), color: colors[at.length] })

  return segments.filter((s) => s.path.length > 1)
}

/** Everything on the trip screen that lives in map space. */
export function MapCanvas() {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<google.maps.Map | null>(null)
  /** One casing + line pair per day of the route. */
  const drawn = useRef<{ casing: google.maps.Polyline; line: google.maps.Polyline }[]>([])
  /** Bottom padding the camera is currently composed for, so snaps pan by the delta. */
  const bottomInset = useRef(0)
  /** Mirrors `failed` for reads inside Google callbacks, which miss state updates. */
  const failedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [zoom, setZoom] = useState(8)
  const [path, setPath] = useState<number[][]>(routes.direct.coordinates)
  const { stops, activePlaceId, openPlace, snap, discover, findPlace, itinerary } = useTrip()
  const { settings, reportTilt } = useMapSettings()
  // The init effect runs once but needs the current settings; a ref keeps it
  // out of the dependency list.
  const settingsRef = useRef(settings)
  settingsRef.current = settings

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
      .then(({ Map }) => {
        if (cancelled || !container.current) return

        try {
          const height = container.current.clientHeight
          const m = new Map(container.current, {
            center: { lat: 48.16, lng: -121.77 },
            zoom: 8,
            // `disableDefaultUI` is the baseline; the inspector's individual
            // control flags are layered on top by `toMapOptions`.
            disableDefaultUI: true,
            ...toMapOptions(settingsRef.current),
          })
          map.current = m

          bottomInset.current = sheetBottom(height, SNAP_FRACTION.peek)
          m.fitBounds(ROUTE_BOUNDS, {
            top: settingsRef.current.topInset,
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

            m.addListener('zoom_changed', () => setZoom(m.getZoom() ?? 8))
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
      map.current = null
    }
  }, [])

  // Everything the inspector changes, pushed to the live map. Tilt is read back
  // because a raster map silently ignores it, and the sidebar says so.
  useEffect(() => {
    const m = map.current
    if (!m || !ready) return

    m.setOptions({ disableDefaultUI: true, ...toMapOptions(settings) })
    reportTilt(m.getTilt() ?? null)
  }, [settings, ready, reportTilt])

  /**
   * The stops belonging to each day, and what colour that day draws in. The
   * ungrouped tail keeps the plain route colour, so only planned days are
   * distinguished.
   */
  const days = useMemo(() => {
    const filled = itinerary.filter((d) => d.items.length > 0)
    const labelled = filled.filter((d) => d.labelled)
    const hasTail = filled.some((d) => !d.labelled)

    return {
      cuts: labelled.map((d) => d.items),
      colors: [
        ...labelled.map((_, i) => dayColor(i)),
        // Whatever is left after the last day: the tail, or that same day
        // running on to the destination.
        hasTail || labelled.length === 0
          ? settings.routeColor
          : dayColor(labelled.length - 1),
      ],
    }
  }, [itinerary, settings.routeColor])

  // Route legs. Redrawn rather than mutated, since the number of days changes.
  useEffect(() => {
    const m = map.current
    if (!m || !ready) return

    const cuts = days.cuts.map((items) =>
      items.flatMap((item) => {
        const place = findPlace(item.id)
        return place ? [place.coord] : []
      }),
    )
    const scale = settings.lineScale
    const z = m.getZoom() ?? 8

    const created = splitByDay(path, cuts, days.colors).map(({ path: leg, color }) => {
      const latLngs = leg.map(toLatLng)
      return {
        casing: new google.maps.Polyline({
          path: latLngs,
          map: m,
          strokeColor: settings.casingColor,
          strokeOpacity: 0.9,
          strokeWeight: widthForZoom(z, CASING_WIDTH) * scale,
          zIndex: 1,
        }),
        line: new google.maps.Polyline({
          path: latLngs,
          map: m,
          strokeColor: color,
          strokeWeight: widthForZoom(z, LINE_WIDTH) * scale,
          zIndex: 2,
        }),
      }
    })
    drawn.current = created

    return () => {
      for (const { casing, line } of created) {
        casing.setMap(null)
        line.setMap(null)
      }
      drawn.current = []
    }
  }, [ready, path, days, findPlace, settings.casingColor, settings.lineScale])

  // A dot on every planned stop, in its day's colour. Coordinates come from the
  // resolved place, so a stop hydrated from Places sits on its real listing.
  const dayStops = useMemo(() => {
    let index = -1
    return itinerary.flatMap((day) => {
      if (day.labelled) index += 1
      const color = day.labelled ? dayColor(index) : settings.routeColor
      return day.items.flatMap((item) => {
        const place = findPlace(item.id)
        return place ? [{ id: item.id, coord: place.coord, color }] : []
      })
    })
  }, [itinerary, findPlace, settings.routeColor])

  // Stroke widths track zoom, so the route stays legible without redrawing.
  useEffect(() => {
    const scale = settings.lineScale
    for (const { casing, line } of drawn.current) {
      casing.setOptions({ strokeWeight: widthForZoom(zoom, CASING_WIDTH) * scale })
      line.setOptions({ strokeWeight: widthForZoom(zoom, LINE_WIDTH) * scale })
    }
  }, [zoom, settings.lineScale])

  // "Add stop" re-draws the route through the stops, in driving order. The two
  // cached geometries cover the common cases instantly; anything else asks
  // Routes and falls back to the direct line if that call fails.
  useEffect(() => {
    if (!ready) return

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
    m.panTo(offsetCenter(m, center, 0, (next - settings.topInset) / 2) ?? center)
  }, [activePlaceId, ready, findPlace, settings.topInset])

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
          showPois={settings.showPois && zoom >= settings.poiZoom}
          showOrigin={settings.showOrigin}
          stickerScale={settings.stickerScale}
          origin={ORIGIN}
          destination={DESTINATION}
          stickers={settings.showStickers ? STICKERS : []}
          stops={dayStops}
          // Pins follow whatever Discover is showing, so real places land on
          // their real coordinates and gems key off the same ids.
          pins={settings.showPins ? discover.map(({ id, coord }) => ({ id, coord })) : []}
          pois={EMOJI_POIS}
          onStickerClick={openPlace}
        />
      )}
    </div>
  )
}
