import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, type MapSettings } from './mapSettings'

interface MapSettingsValue {
  settings: MapSettings
  set: <K extends keyof MapSettings>(key: K, value: MapSettings[K]) => void
  setLayer: (key: string, on: boolean) => void
  setColor: (key: string, value: string) => void
  reset: () => void
  /** Reported back by the map so the sidebar can show what actually took effect. */
  effectiveTilt: number | null
  reportTilt: (tilt: number | null) => void
}

const Ctx = createContext<MapSettingsValue | null>(null)

export function MapSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<MapSettings>(DEFAULT_SETTINGS)
  const [effectiveTilt, setEffectiveTilt] = useState<number | null>(null)

  const value = useMemo<MapSettingsValue>(
    () => ({
      settings,
      set: (key, v) => setSettings((s) => ({ ...s, [key]: v })),
      setLayer: (key, on) => setSettings((s) => ({ ...s, layers: { ...s.layers, [key]: on } })),
      setColor: (key, v) => setSettings((s) => ({ ...s, colors: { ...s.colors, [key]: v } })),
      reset: () => setSettings(DEFAULT_SETTINGS),
      effectiveTilt,
      reportTilt: setEffectiveTilt,
    }),
    [settings, effectiveTilt],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useMapSettings() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMapSettings must be used inside <MapSettingsProvider>')
  return ctx
}
