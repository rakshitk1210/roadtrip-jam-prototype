import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { LngLat, Sticker } from '../data/places'
import { useTrip } from '../state/tripContext'
import { createHtmlMarker, type Anchor } from './HtmlMarker'

/**
 * Mounts a React subtree into a map overlay, so marker content can read store
 * state (the gem badge) while Google owns the positioning.
 */
function Marker({
  map,
  coord,
  className,
  anchor = 'center',
  children,
}: {
  map: google.maps.Map
  coord: LngLat
  className: string
  anchor?: Anchor
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
  onClick,
}: {
  sticker: Sticker
  zoom: number
  sizeScale: number
  onClick?: () => void
}) {
  const { hasGem } = useTrip()
  // Stickers grow with zoom so they read like map furniture, not fixed chrome.
  const scale = Math.min(1.2, Math.max(0.72, 0.72 + (zoom - 8) * 0.12)) * sizeScale
  const width = sticker.width * scale
  // The library SVGs export with `preserveAspectRatio="none"`, so they stretch
  // unless both dimensions are given.
  const height = sticker.ratio ? width / sticker.ratio : undefined
  const gem = hasGem(sticker.id)
  const left = sticker.labelSide === 'left'

  return (
    <div
      className={`sticker${sticker.interactive ? ' is-interactive' : ''}${left ? ' label-left' : ''}`}
      style={{ ['--sticker-scale' as string]: scale }}
      {...pressProps(sticker.label, sticker.interactive ? onClick : undefined)}
    >
      <div className="sticker-art" style={{ width, height }}>
        {gem && <img className="sticker-gem" src="/assets/gem-diamond.png" alt="" />}
        <img className="sticker-img" src={sticker.image} alt="" style={{ width, height }} />
      </div>
      <div className="sticker-text">
        <span className="sticker-label">{sticker.label}</span>
        {sticker.sublabel && <span className="sticker-sublabel">{sticker.sublabel}</span>}
      </div>
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
      {hasGem(id) && <img className="chip-gem" src="/assets/gem-diamond.png" alt="" />}
      <span className="chip-glyph">{emoji}</span>
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
  onClick,
}: {
  colour: string
  label: string
  onClick?: () => void
}) {
  return (
    <div
      className={`stop-labelled${onClick ? ' is-interactive' : ''}`}
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
  if (!mounted) return null

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
        .map((sticker) => (
          <Marker
            key={sticker.id}
            map={map}
            coord={sticker.coord}
            className="mk mk-sticker"
            anchor={sticker.labelSide === 'left' ? 'right' : 'left'}
          >
            <StickerMarker
              sticker={sticker}
              zoom={zoom}
              sizeScale={stickerScale}
              onClick={() => onOpenPlace(sticker.id)}
            />
          </Marker>
        ))}
    </>
  )
}
