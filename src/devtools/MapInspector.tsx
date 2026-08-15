import { useEffect, useState, type ReactNode } from 'react'
import { useMapSettings } from './mapSettingsContext'
import { buildStyles, STYLE_COLORS, STYLE_LAYERS, type MapSettings } from './mapSettings'

/**
 * True only on a pointer-and-keyboard viewport. The inspector is a desktop
 * authoring tool — on a handset it would cover the prototype it exists to tune.
 */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(min-width: 1100px) and (pointer: fine)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1100px) and (pointer: fine)')
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="insp-section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  return (
    <label className="insp-row insp-toggle">
      <span>
        {label}
        {hint && <em>{hint}</em>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <label className="insp-row insp-slider">
      <span>
        {label}
        <b>
          {value}
          {suffix}
        </b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (v: T) => void
}) {
  return (
    <label className="insp-row insp-choice">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

function Colour({
  label,
  value,
  onChange,
  fallback,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  fallback: string
}) {
  return (
    <div className="insp-row insp-colour">
      <span>{label}</span>
      <div>
        <input type="color" value={value || fallback} onChange={(e) => onChange(e.target.value)} />
        {value && (
          <button type="button" onClick={() => onChange('')} title="Back to Google's colour">
            clear
          </button>
        )}
      </div>
    </div>
  )
}

const MAP_TYPES = ['roadmap', 'satellite', 'hybrid', 'terrain'] as const
const GESTURES = ['greedy', 'cooperative', 'none', 'auto'] as const

export function MapInspector() {
  const { settings, set, setLayer, setColor, reset, effectiveTilt } = useMapSettings()
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const isDesktop = useIsDesktop()

  if (!isDesktop) return null

  const copyStyles = async () => {
    await navigator.clipboard.writeText(JSON.stringify(buildStyles(settings), null, 2))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const num = <K extends keyof MapSettings>(key: K) => (v: number) =>
    set(key, v as MapSettings[K])

  // Google ignores tilt on a raster map, so say so rather than leave a dead control.
  const tiltIgnored = settings.tilt > 0 && effectiveTilt === 0

  return (
    <aside className={`insp${open ? '' : ' is-closed'}`}>
      <header className="insp-head">
        <h2>Map inspector</h2>
        <div>
          <button type="button" onClick={reset}>
            Reset
          </button>
          <button type="button" onClick={() => setOpen((o) => !o)}>
            {open ? 'Hide' : 'Show'}
          </button>
        </div>
      </header>

      {open && (
        <div className="insp-body">
          <Section title="Basemap">
            <Choice label="Map type" value={settings.mapTypeId} options={MAP_TYPES} onChange={(v) => set('mapTypeId', v)} />
            <Slider label="Saturation" value={settings.saturation} min={-100} max={100} onChange={num('saturation')} />
            <Slider label="Lightness" value={settings.lightness} min={-100} max={100} onChange={num('lightness')} />
            {STYLE_COLORS.map((c) => (
              <Colour
                key={c.key}
                label={c.label}
                value={settings.colors[c.key]}
                fallback="#aaccaa"
                onChange={(v) => setColor(c.key, v)}
              />
            ))}
          </Section>

          <Section title="Layers">
            {STYLE_LAYERS.map((l) => (
              <Toggle
                key={l.key}
                label={l.label}
                checked={settings.layers[l.key]}
                onChange={(v) => setLayer(l.key, v)}
              />
            ))}
          </Section>

          <Section title="Camera & gestures">
            <Choice label="Gestures" value={settings.gestureHandling} options={GESTURES} onChange={(v) => set('gestureHandling', v)} />
            <Slider label="Min zoom" value={settings.minZoom} min={1} max={20} onChange={num('minZoom')} />
            <Slider label="Max zoom" value={settings.maxZoom} min={1} max={22} onChange={num('maxZoom')} />
            <Slider label="Tilt" value={settings.tilt} min={0} max={67.5} step={2.5} onChange={num('tilt')} suffix="°" />
            {tiltIgnored && (
              <p className="insp-note">
                Tilt needs a vector map, which needs a cloud Map ID. This map has none, so Google
                reports it back as {effectiveTilt}°.
              </p>
            )}
            <Slider label="Heading" value={settings.heading} min={0} max={360} onChange={num('heading')} suffix="°" />
            <Toggle label="Fractional zoom" checked={settings.isFractionalZoomEnabled} onChange={(v) => set('isFractionalZoomEnabled', v)} />
            <Toggle label="Scroll wheel" checked={settings.scrollwheel} onChange={(v) => set('scrollwheel', v)} />
            <Toggle label="Keyboard shortcuts" checked={settings.keyboardShortcuts} onChange={(v) => set('keyboardShortcuts', v)} />
            <Toggle label="Google POIs clickable" checked={settings.clickableIcons} onChange={(v) => set('clickableIcons', v)} />
          </Section>

          <Section title="Built-in controls">
            <Toggle label="Zoom" checked={settings.zoomControl} onChange={(v) => set('zoomControl', v)} />
            <Toggle label="Map type" checked={settings.mapTypeControl} onChange={(v) => set('mapTypeControl', v)} />
            <Toggle label="Street View" checked={settings.streetViewControl} onChange={(v) => set('streetViewControl', v)} />
            <Toggle label="Fullscreen" checked={settings.fullscreenControl} onChange={(v) => set('fullscreenControl', v)} />
            <Toggle label="Scale" checked={settings.scaleControl} onChange={(v) => set('scaleControl', v)} />
            <Toggle label="Rotate" checked={settings.rotateControl} onChange={(v) => set('rotateControl', v)} />
          </Section>

          <Section title="Jam overlay">
            <Colour label="Route" value={settings.routeColor} fallback="#1A73E8" onChange={(v) => set('routeColor', v || '#1A73E8')} />
            <Colour label="Route casing" value={settings.casingColor} fallback="#FFFFFF" onChange={(v) => set('casingColor', v || '#FFFFFF')} />
            <Slider label="Line weight" value={settings.lineScale} min={0.2} max={3} step={0.1} onChange={num('lineScale')} suffix="×" />
            <Toggle label="Stickers" checked={settings.showStickers} onChange={(v) => set('showStickers', v)} />
            <Slider label="Sticker size" value={settings.stickerScale} min={0.4} max={2.5} step={0.1} onChange={num('stickerScale')} suffix="×" />
            <Toggle label="Saved pins" checked={settings.showPins} onChange={(v) => set('showPins', v)} />
            <Toggle label="Emoji POIs" checked={settings.showPois} onChange={(v) => set('showPois', v)} />
            <Slider label="POI appear zoom" value={settings.poiZoom} min={6} max={16} step={0.5} onChange={num('poiZoom')} />
            <Toggle label="Origin dot" checked={settings.showOrigin} onChange={(v) => set('showOrigin', v)} />
            <Slider label="Top inset" value={settings.topInset} min={0} max={400} step={4} onChange={num('topInset')} suffix="px" />
          </Section>

          <div className="insp-actions">
            <button type="button" onClick={copyStyles}>
              {copied ? 'Copied' : 'Copy style JSON'}
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
