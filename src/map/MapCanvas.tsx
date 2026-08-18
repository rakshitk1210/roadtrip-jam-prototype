import { useEffect, useMemo, useRef, useState } from 'react'
import routes from '../data/routes.json'
import {
  CURATED_PLACES,
  DESTINATION,
  EMOJI_POIS,
  ORIGIN,
  STICKERS,
  emojiFor,
  stickerForPlace,
  type LngLat,
  type Place,
} from '../data/places'
import { fetchRoute, haversineMiles, labelSideFor, orderAlongRoute } from '../data/directions'
import { useTrip } from '../state/tripContext'
import { SNAP_FRACTION } from '../sheet/snaps'
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

/**
 * Close enough that two markers must be the same landmark under two ids — one
 * designed, one from Places. Loose enough to catch a car park pinned across the
 * road from its trailhead, tight enough not to swallow a neighbour.
 */
const SAME_PLACE_MILES = 0.12

const sheetBottom = (height: number, fraction: number) => height * fraction + 24

/**
 * Vertex on the drawn route closest to a stop. Planar distance is enough to rank
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
 * colour rather than in a second line laid over a blue one. Consecutive segments
 * share the vertex they meet at, or the route would show gaps at every seam.
 *
 * A day is cut at whichever of its stops sits furthest along the road, not at
 * the last one listed: the drive doubles back — the seeded trip reaches the
 * Kangaroo Farm before returning to Seattle — and cutting at the last row would
 * collapse that day's leg to a few city blocks. Cuts carry their colour through
 * the sort, so grouping days out of order still paints each stretch as the day
 * that ends it.
 */
function splitByDay(
  path: number[][],
  days: { coords: LngLat[]; colour: string }[],
  tail: string,
) {
  const cuts = days
    .map((day) => ({
      at: day.coords.reduce((furthest, c) => Math.max(furthest, nearestVertex(path, c)), 0),
      colour: day.colour,
    }))
    .sort((a, b) => a.at - b.at)

  const segments: { path: number[][]; colour: string }[] = []
  let start = 0
  for (const cut of cuts) {
    if (cut.at > start) segments.push({ path: path.slice(start, cut.at + 1), colour: cut.colour })
    start = Math.max(start, cut.at)
  }
  segments.push({ path: path.slice(start), colour: tail })

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
  /** Whatever the route currently traces. The day segments slice this. */
  const [path, setPath] = useState<number[][]>(routes.direct.coordinates)
  const {
    activePlaceId,
    openPlace,
    snap,
    discover,
    ambient,
    findPlace,
    tab,
    days,
    itinerary,
    hasGem,
  } = useTrip()
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
   * Where each day's driving ends, and the colour it draws in. The stretch past
   * the last day keeps the plain route colour whenever stops are still
   * ungrouped, so a coloured leg always means a day someone planned.
   */
  const legs = useMemo(() => {
    const grouped = days.flatMap((day) => {
      const coords = day.placeIds.flatMap((id) => {
        const place = findPlace(id)
        return place ? [place.coord] : []
      })
      return coords.length > 0 ? [{ coords, colour: day.colour }] : []
    })
    const groupedIds = new Set(days.flatMap((d) => d.placeIds))
    const hasUngrouped = itinerary.some((item) => !groupedIds.has(item.id))

    return {
      days: grouped,
      // Whatever is left after the last day: the ungrouped tail, or that same
      // day running on to the destination.
      tail:
        hasUngrouped || grouped.length === 0
          ? settings.routeColor
          : grouped[grouped.length - 1].colour,
    }
  }, [days, itinerary, findPlace, settings.routeColor])

  // The route itself, one casing + line pair per day. Redrawn rather than
  // mutated, since grouping and ungrouping changes how many segments there are.
  useEffect(() => {
    const m = map.current
    if (!m || !ready) return

    const scale = settings.lineScale
    const z = m.getZoom() ?? 8

    const created = splitByDay(path, legs.days, legs.tail).map(({ path: leg, colour }) => {
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
          strokeColor: colour,
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
  }, [ready, path, legs, settings.casingColor, settings.lineScale])

  // Stroke widths track zoom, so the route stays legible without redrawing it.
  useEffect(() => {
    const scale = settings.lineScale
    for (const { casing, line } of drawn.current) {
      casing.setOptions({ strokeWeight: widthForZoom(zoom, CASING_WIDTH) * scale })
      line.setOptions({ strokeWeight: widthForZoom(zoom, LINE_WIDTH) * scale })
    }
  }, [zoom, settings.lineScale])

  // The itinerary *is* the drive, so the line threads through its places in
  // driving order rather than tracing a generic corridor past them. Falls back
  // to the cached geometry whenever Routes can't answer.
  useEffect(() => {
    if (!ready) return

    const waypoints = orderAlongRoute(
      itinerary.flatMap((item) => {
        const place = findPlace(item.id)
        return place ? [place.coord] : []
      }),
    )

    if (waypoints.length === 0) {
      setPath(routes.direct.coordinates)
      return
    }

    let cancelled = false
    fetchRoute([ORIGIN, ...waypoints, DESTINATION]).then((coords) => {
      if (cancelled) return
      setPath(coords ?? routes.direct.coordinates)
    })
    return () => {
      cancelled = true
    }
  }, [itinerary, ready, findPlace])

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

  const isItinerary = tab === 'itinerary'
  const isDiscover = tab === 'discover'

  // Every itinerary stop that resolves to a place, tinted by its day. Ungrouped
  // stops stay neutral so the coloured ones read as deliberate. Discover names
  // them in plain text; in Itinerary their sticker already does.
  const itineraryStops = itinerary.flatMap((item) => {
    const place = findPlace(item.id)
    if (!place) return []
    const day = days.find((d) => d.placeIds.includes(item.id))
    return [
      {
        id: item.id,
        coord: place.coord,
        colour: day?.colour ?? '#5f6368',
        label: isDiscover ? (place.mapLabel ?? place.name) : undefined,
      },
    ]
  })

  // Anything on the route already has a marker of its own, so it never gets a
  // second one stacked on the same coordinate. Matching on id alone isn't
  // enough: a designed stop and the Places record of the same landmark carry
  // different ids, so Ladder Creek Falls would draw twice. Proximity catches
  // both, since nothing else worth showing sits this close.
  const onRoute = new Set(itinerary.map((item) => item.id))
  const routeCoords = itineraryStops.map((stop) => stop.coord)
  const alreadyOnRoute = (place: Place) =>
    onRoute.has(place.id) ||
    routeCoords.some((coord) => haversineMiles(place.coord, coord) < SAME_PLACE_MILES)

  // Itinerary mode draws a sticker for every place on the route, alongside the
  // landmarks that are scenery rather than stops. Adding a landmark to the
  // route drops it from that list so it isn't drawn twice.
  // The side is decided per place against the line actually drawn, so a label
  // never lies along the route it belongs to.
  const routeStickers = itinerary.flatMap((item) => {
    const place = findPlace(item.id)
    return place ? [{ ...stickerForPlace(place), labelSide: labelSideFor(place.coord, path) }] : []
  })
  const stickers = [...STICKERS.filter((s) => !onRoute.has(s.id)), ...routeStickers]

  const toChip = ({ id, emoji, name, coord }: Place & { emoji?: string }) => ({
    id,
    emoji: emoji ?? emojiFor(name),
    name,
    coord,
  })

  // Everything Discover lists, wearing the emoji for what it is.
  const discoverChips = discover.filter((p) => !alreadyOnRoute(p)).map(toChip)

  // A gem is worth a marker even when its place belongs to the curated rail
  // rather than the saved list the chips are drawn from.
  const gemChips = CURATED_PLACES.filter(
    (p) => hasGem(p.id) && !alreadyOnRoute(p) && !discover.some((d) => d.id === p.id),
  ).map(toChip)

  // The tier the sheet doesn't list. These are real places, so they open like
  // anything else; without Places to ask, the map falls back to plain scenery.
  const ambientPois = ambient.length
    ? ambient.filter((p) => !alreadyOnRoute(p)).map(toChip)
    : EMOJI_POIS

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
          // The two modes show different things: Itinerary is where you're
          // going (stickers), Discover is what's around (emoji). The stops
          // themselves show in both. The inspector's toggles gate on top.
          poisExpanded={zoom >= settings.poiZoom}
          showOrigin={settings.showOrigin}
          stickerScale={settings.stickerScale}
          origin={ORIGIN}
          destination={DESTINATION}
          stickers={isItinerary && settings.showStickers ? stickers : []}
          // Chips follow whatever Discover is showing, so real places land on
          // their real coordinates and gems key off the same ids.
          chips={isDiscover && settings.showPins ? [...discoverChips, ...gemChips] : []}
          pois={isDiscover && settings.showPois ? ambientPois : []}
          stops={itineraryStops}
          onOpenPlace={openPlace}
        />
      )}
    </div>
  )
}
