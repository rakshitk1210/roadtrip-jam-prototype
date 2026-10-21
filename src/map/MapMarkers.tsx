import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import {
  STICKER_DETAIL_ZOOM,
  stickerScaleFor,
  type LngLat,
  type Sticker,
} from '../data/places'
import { useTrip } from '../state/tripContext'
import { createHtmlMarker, type Anchor } from './HtmlMarker'
import { layoutStickers, type Measured, type Placed, type Side } from './stickerLayout'

/**
 * Sticker geometry as the stylesheet lays it out, so the boxes the layout
 * reasons about are the boxes the map draws: the gutter a stop dot sits in, the
 * gap between artwork and text, and the share of its own width a scenery
 * sticker straddles its coordinate by.
 */
const DOT_GUTTER = 12
const TEXT_GAP = 4
const SCENERY_SHARE = 0.3

/** Sorts anything with no place in the drive behind everything that has one. */
const LAST = Number.MAX_SAFE_INTEGER

/** How long to keep waiting on a marker the map has not drawn yet, in frames. */
const RETRY_FRAMES = 20

function samePlacements(a: Map<string, Placed>, b: Map<string, Placed>) {
  if (a.size !== b.size) return false
  for (const [id, placed] of a) {
    const other = b.get(id)
    if (!other || other.side !== placed.side || other.dy !== placed.dy) return false
  }
  return true
}

/**
 * Mounts a React subtree into a map overlay, so marker content can read store
 * state (the gem badge) while Google owns the positioning.
 */
function Marker({
  map,
  coord,
  className,
  anchor = 'center',
  registry,
  id,
  children,
}: {
  map: google.maps.Map
  coord: LngLat
  className: string
  anchor?: Anchor
  /** Where to leave the element, for callers that measure their markers. */
  registry?: Map<string, HTMLElement>
  id?: string
  children: ReactNode
}) {
  const el = useMemo(() => {
    const node = document.createElement('div')
    node.className = className
    return node
  }, [className])

  // Depending on the coordinates rather than the array keeps the overlay alive
  // across renders: callers rebuild their marker lists every time, so an
  // identity check would tear down and re-add every marker on the map.
  const [lng, lat] = coord
  useEffect(() => {
    const marker = createHtmlMarker({ lat, lng }, el, anchor)
    marker.setMap(map)
    return () => {
      marker.setMap(null)
    }
  }, [map, el, anchor, lat, lng])

  // A layout effect, so a marker is in the registry before the parent's own
  // layout effect goes looking for it on the very render it appeared.
  useLayoutEffect(() => {
    if (!registry || !id) return
    registry.set(id, el)
    return () => {
      registry.delete(id)
    }
  }, [registry, id, el])

  return createPortal(children, el)
}

/**
 * Anything on the map that opens a place. Markers are plain elements rather than
 * buttons — a button's own box would fight the artwork — so the keyboard half of
 * being pressable has to be wired by hand. Returns nothing when there is no
 * place behind the marker, which leaves it scenery.
 */
function pressProps(label: string, onPress?: () => void) {
  if (!onPress) return {}
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onClick: onPress,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      onPress()
    },
  } as const
}

function StickerMarker({
  sticker,
  zoom,
  sizeScale,
  hasStop,
  side,
  dy,
  onClick,
}: {
  sticker: Sticker
  zoom: number
  sizeScale: number
  /** Whether a stop dot is drawn on this coordinate, which the layout clears. */
  hasStop: boolean
  /** Which side of the coordinate the whole group sits on, after decluttering. */
  side: Side
  /** How far the group has been moved off its coordinate to clear its neighbours. */
  dy: number
  onClick?: () => void
}) {
  const { hasGem, markedGem } = useTrip()
  // Stickers grow with zoom so they read like map furniture, not fixed chrome.
  const scale = stickerScaleFor(zoom, sizeScale)
  const width = sticker.width * scale
  // The library SVGs export with `preserveAspectRatio="none"`, so they stretch
  // unless both dimensions are given.
  const height = sticker.ratio ? width / sticker.ratio : undefined
  const gem = hasGem(sticker.id)
  const left = side === 'left'

  // Each line waits for the map to be detailed enough to be worth reading:
  // further out they are so many words over the landscape. A gem outranks
  // whatever the place was authored to say, being the newest thing known
  // about it, and there is only room for the one line. Your own gem says who
  // marked it; one the trip arrived with says who found it.
  const detail = markedGem(sticker.id)
    ? 'Marked as Hidden Gem 💎'
    : gem
      ? '💎 Discovered by 37 people'
      : sticker.detail
  const showName = zoom >= STICKER_DETAIL_ZOOM.name
  const showDetail = detail && zoom >= STICKER_DETAIL_ZOOM.detail
  const showHours = sticker.hours && zoom >= STICKER_DETAIL_ZOOM.hours

  return (
    <div
      className={`sticker${sticker.interactive ? ' is-interactive' : ''}${left ? ' label-left' : ''}${hasStop ? ' has-stop' : ''}`}
      style={{ ['--sticker-scale' as string]: scale, ['--sticker-dy' as string]: `${dy}px` }}
      {...pressProps(sticker.label, sticker.interactive ? onClick : undefined)}
    >
      <div className="sticker-art" style={{ width, height }}>
        <img className="sticker-img" src={sticker.image} alt="" style={{ width, height }} />
      </div>
      {/* Dropped entirely rather than left empty, so the artwork doesn't carry
          a blank box and its gap around at the zooms that show no text. */}
      {showName && (
        <div className="sticker-text">
          <span className="sticker-label">{sticker.label}</span>
          {showDetail && (
            <span className={`sticker-sublabel sticker-detail${gem ? ' sticker-gem' : ''}`}>
              {detail}
            </span>
          )}
          {showHours && <span className="sticker-sublabel">{sticker.hours}</span>}
        </div>
      )}
    </div>
  )
}

/**
 * A saved place in Discover, wearing the emoji for what it is. Opens the same
 * detail sheet its row in the list does, and its gem mirrors what you set there.
 */
function EmojiChip({
  id,
  emoji,
  name,
  onClick,
}: {
  id: string
  emoji: string
  name: string
  onClick?: () => void
}) {
  const { hasGem } = useTrip()
  return (
    <div
      className={`emoji-chip${onClick ? ' is-interactive' : ''}`}
      {...pressProps(name, onClick)}
    >
      {/* A gem outranks whatever the place happens to be — the chip is small
          enough that showing both would read as neither. */}
      <span className="chip-glyph">{hasGem(id) ? '💎' : emoji}</span>
    </div>
  )
}

/**
 * Somewhere the map knows about but doesn't list. It rides along as a pinprick
 * and opens into its emoji once you have zoomed in far enough to care, which is
 * what makes zooming feel like it uncovers something.
 *
 * Only pressable once it has opened: a 6px dot is too small to aim at, and the
 * collapsed ones would otherwise litter the tab order with places you cannot see.
 */
function AmbientPoi({
  emoji,
  name,
  expanded,
  onClick,
}: {
  emoji: string
  name?: string
  expanded: boolean
  onClick?: () => void
}) {
  const press = expanded ? onClick : undefined
  return (
    <div
      className={`emoji-poi${expanded ? ' is-expanded' : ''}${press ? ' is-interactive' : ''}`}
      {...pressProps(name ?? '', press)}
    >
      <span className="chip-glyph">{emoji}</span>
    </div>
  )
}

/** A stop on the drive, in its day's colour — grey until it's been grouped. */
function StopDot({ colour }: { colour: string }) {
  return <span className="stop-dot" style={{ background: colour }} />
}

/**
 * How Discover draws an itinerary stop: the same dot, named in plain text
 * rather than dressed in its sticker. Opens its place, as the sticker would.
 */
function LabeledStop({
  colour,
  label,
  scale,
  onClick,
}: {
  colour: string
  label: string
  /** The sticker ramp, so a stop reads the same size in either tab. */
  scale: number
  onClick?: () => void
}) {
  return (
    <div
      className={`stop-labelled${onClick ? ' is-interactive' : ''}`}
      style={{ ['--sticker-scale' as string]: scale }}
      {...pressProps(label, onClick)}
    >
      <StopDot colour={colour} />
      <span className="stop-label">{label}</span>
    </div>
  )
}

interface Props {
  map: google.maps.Map
  zoom: number
  /** Whether the ambient POIs have opened from dots into emoji. */
  poisExpanded: boolean
  showOrigin?: boolean
  /** Inspector multiplier on top of the zoom-driven sticker ramp. */
  stickerScale?: number
  origin: LngLat
  destination: LngLat
  stickers: Sticker[]
  /** Saved places, as emoji chips. */
  chips: { id: string; emoji: string; name: string; coord: LngLat }[]
  /** `name` marks a real place; without one the marker is scenery. */
  pois: { id: string; emoji: string; coord: LngLat; name?: string }[]
  /**
   * Itinerary stops, already coloured by their day. A `label` draws the name
   * beside the dot, which is what Discover does instead of showing stickers.
   */
  stops?: { id: string; coord: LngLat; colour: string; label?: string }[]
  /** Opens the detail sheet. Every marker that stands for a real place uses it. */
  onOpenPlace: (id: string) => void
}

export function MapMarkers({
  map,
  zoom,
  poisExpanded,
  showOrigin = true,
  stickerScale = 1,
  origin,
  stickers,
  chips,
  pois,
  stops = [],
  onOpenPlace,
}: Props) {
  // Overlays create their elements imperatively; a state flip after mount lets
  // the portals render into them on the first paint.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const stickerEls = useRef(new Map<string, HTMLElement>()).current
  const retries = useRef(0)
  const [placements, setPlacements] = useState<Map<string, Placed>>(() => new Map())

  // Google positions overlays on its own schedule, so the first measurement can
  // land before anything has been drawn. Settling gives the pass below a render
  // to run in once the map has actually put the markers somewhere.
  const [, setSettled] = useState(0)
  useEffect(() => {
    const listener = map.addListener('idle', () => setSettled((n) => n + 1))
    return () => listener.remove()
  }, [map])

  // Deliberately without a dependency list: it must run after any render that
  // could have changed a sticker's size or its lines. What it reads — the boxes,
  // and the side the route asked for — is untouched by what it writes, so the
  // pass it triggers measures the same thing and settles.
  useLayoutEffect(() => {
    const order = new Map(stops.map((stop, i) => [stop.id, i]))
    const wanted = new Map(stickers.map((s) => [s.id, s.labelSide ?? 'right']))
    const measured: Measured[] = []

    // Stops first, in the order they are driven, so the drive's own sequence
    // decides who holds their coordinate and who gives way. Scenery goes last.
    const ranked = [...stickerEls].sort(
      ([a], [b]) => (order.get(a) ?? LAST) - (order.get(b) ?? LAST),
    )

    for (const [id, el] of ranked) {
      const x = parseFloat(el.style.left)
      const y = parseFloat(el.style.top)
      const sticker = el.firstElementChild
      const art = sticker?.querySelector<HTMLElement>('.sticker-art')
      // The scenery artwork is sized by the image itself, so it measures nothing
      // until that has loaded. Left out rather than placed at no height, which
      // would reserve a box nothing could collide with.
      if (!Number.isFinite(x) || !Number.isFinite(y) || !art?.offsetHeight) continue

      // Measured line by line rather than off the block: the detail line does
      // not wrap and can run past the block's own width, and which way it spills
      // depends on the side, which is the very thing being decided here.
      const text = sticker?.querySelector<HTMLElement>('.sticker-text')
      let textW = 0
      for (const line of text?.children ?? []) {
        textW = Math.max(textW, (line as HTMLElement).offsetWidth)
      }
      const width = art.offsetWidth + (textW ? TEXT_GAP + textW : 0)

      measured.push({
        id,
        x,
        y,
        width,
        height: Math.max(art.offsetHeight, text?.offsetHeight ?? 0),
        startOffset: order.has(id) ? DOT_GUTTER : -SCENERY_SHARE * width,
        side: wanted.get(id) ?? 'right',
      })
    }

    const next = layoutStickers(measured)
    setPlacements((prev) => (samePlacements(prev, next) ? prev : next))

    // Google attaches and positions its overlays a frame or two after React has
    // rendered into them, so the first pass after a marker appears can have
    // nothing to measure. A few frames of retry covers that; the cap stops it
    // becoming a permanent poll if one never becomes measurable.
    if (measured.length === stickerEls.size || retries.current > RETRY_FRAMES) {
      retries.current = 0
      return
    }
    retries.current += 1
    const frame = requestAnimationFrame(() => setSettled((n) => n + 1))
    return () => cancelAnimationFrame(frame)
  })

  if (!mounted) return null

  // Discover names its stops in plain text where Itinerary has a sticker do it.
  // Reading the same ramp keeps a stop the same size across the switch.
  const labelScale = stickerScaleFor(zoom, stickerScale)

  return (
    <>
      {showOrigin && (
        <Marker map={map} coord={origin} className="mk mk-origin">
          <div className="origin-dot">
            <span className="origin-pulse" />
          </div>
        </Marker>
      )}

      {chips.map((chip) => (
        <Marker key={chip.id} map={map} coord={chip.coord} className="mk mk-chip">
          <EmojiChip
            id={chip.id}
            emoji={chip.emoji}
            name={chip.name}
            onClick={() => onOpenPlace(chip.id)}
          />
        </Marker>
      ))}

      {stops.map((stop) =>
        stop.label ? (
          <Marker key={stop.id} map={map} coord={stop.coord} className="mk mk-stop" anchor="left">
            <LabeledStop
              colour={stop.colour}
              label={stop.label}
              scale={labelScale}
              onClick={() => onOpenPlace(stop.id)}
            />
          </Marker>
        ) : (
          <Marker key={stop.id} map={map} coord={stop.coord} className="mk mk-stop">
            <StopDot colour={stop.colour} />
          </Marker>
        ),
      )}

      {pois.map((poi) => (
        <Marker key={poi.id} map={map} coord={poi.coord} className="mk mk-poi">
          <AmbientPoi
            emoji={poi.emoji}
            name={poi.name}
            expanded={poisExpanded}
            onClick={poi.name ? () => onOpenPlace(poi.id) : undefined}
          />
        </Marker>
      ))}

      {stickers
        .filter((s) => zoom >= (s.minZoom ?? 0))
        .map((sticker) => {
          // Until the pass below has measured them, stickers sit where the route
          // asked, which is where they used to sit for good.
          const placed = placements.get(sticker.id)
          const side = placed?.side ?? sticker.labelSide ?? 'right'
          return (
          <Marker
            key={sticker.id}
            map={map}
            coord={sticker.coord}
            className="mk mk-sticker"
            anchor="left"
            registry={stickerEls}
            id={sticker.id}
          >
            <StickerMarker
              sticker={sticker}
              zoom={zoom}
              sizeScale={stickerScale}
              hasStop={stops.some((stop) => stop.id === sticker.id)}
              side={side}
              dy={placed?.dy ?? 0}
              onClick={() => onOpenPlace(sticker.id)}
            />
          </Marker>
          )
        })}
    </>
  )
}
