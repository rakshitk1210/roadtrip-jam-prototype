import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl from 'mapbox-gl'
import type { LngLat, Sticker } from '../data/places'
import { useTrip } from '../state/tripContext'

/**
 * Mounts a React subtree into a `mapboxgl.Marker`, so marker content can read
 * store state (the gem badge) while Mapbox owns the positioning.
 */
function Marker({
  map,
  coord,
  className,
  anchor = 'center',
  children,
}: {
  map: mapboxgl.Map
  coord: LngLat
  className: string
  anchor?: mapboxgl.Anchor
  children: ReactNode
}) {
  const el = useMemo(() => {
    const node = document.createElement('div')
    node.className = className
    return node
  }, [className])

  useEffect(() => {
    const marker = new mapboxgl.Marker({ element: el, anchor }).setLngLat(coord).addTo(map)
    return () => {
      marker.remove()
    }
  }, [map, el, anchor, coord])

  return createPortal(children, el)
}

function StickerMarker({ sticker, zoom, onClick }: { sticker: Sticker; zoom: number; onClick?: () => void }) {
  const { hasGem } = useTrip()
  // Stickers grow with zoom so they read like map furniture, not fixed chrome.
  const scale = Math.min(1.2, Math.max(0.72, 0.72 + (zoom - 8) * 0.12))
  const width = sticker.width * scale
  const gem = hasGem(sticker.id)
  const left = sticker.labelSide === 'left'

  return (
    <div
      className={`sticker${sticker.interactive ? ' is-interactive' : ''}${left ? ' label-left' : ''}`}
      style={{ ['--sticker-scale' as string]: scale }}
      onClick={sticker.interactive ? onClick : undefined}
      role={sticker.interactive ? 'button' : undefined}
      tabIndex={sticker.interactive ? 0 : undefined}
      aria-label={sticker.interactive ? sticker.label : undefined}
    >
      <div className="sticker-art" style={{ width }}>
        {gem && <img className="sticker-gem" src="/assets/gem-diamond.png" alt="" />}
        <img className="sticker-img" src={sticker.image} alt="" style={{ width }} />
      </div>
      <div className="sticker-text">
        <span className="sticker-label">{sticker.label}</span>
        {sticker.sublabel && <span className="sticker-sublabel">{sticker.sublabel}</span>}
      </div>
    </div>
  )
}

/** Saved-place pin. Not tappable — its gem mirrors what you set from the list. */
function BookmarkPin({ id }: { id: string }) {
  const { hasGem } = useTrip()
  return (
    <div className="bookmark-pin">
      {hasGem(id) && <img className="pin-gem" src="/assets/gem-diamond.png" alt="" />}
      <img className="pin-glyph" src="/assets/ic-bookmark.svg" alt="" />
    </div>
  )
}

interface Props {
  map: mapboxgl.Map
  zoom: number
  showPois: boolean
  origin: LngLat
  destination: LngLat
  stickers: Sticker[]
  pins: { id: string; coord: LngLat }[]
  pois: { id: string; emoji: string; coord: LngLat }[]
  onStickerClick: (id: string) => void
}

export function MapMarkers({ map, zoom, showPois, origin, stickers, pins, pois, onStickerClick }: Props) {
  // Mapbox creates marker elements imperatively; a state flip after mount lets
  // the portals render into them on the first paint.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <>
      <Marker map={map} coord={origin} className="mk mk-origin">
        <div className="origin-dot">
          <span className="origin-pulse" />
        </div>
      </Marker>

      {pins.map((pin) => (
        <Marker key={pin.id} map={map} coord={pin.coord} className="mk mk-pin">
          <BookmarkPin id={pin.id} />
        </Marker>
      ))}

      {pois.map((poi) => (
        <Marker key={poi.id} map={map} coord={poi.coord} className="mk mk-poi">
          <div className={`emoji-poi${showPois ? ' is-visible' : ''}`}>
            <span>{poi.emoji}</span>
          </div>
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
            <StickerMarker sticker={sticker} zoom={zoom} onClick={() => onStickerClick(sticker.id)} />
          </Marker>
        ))}
    </>
  )
}
