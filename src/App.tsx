import { useEffect } from 'react'
import { YouScreen } from './screens/YouScreen'
import { TripMapScreen } from './screens/TripMapScreen'
import { ExploreScreen } from './screens/ExploreScreen'
import { WrappedFlow } from './screens/WrappedFlow'
import { TripProvider } from './state/tripStore'
import { useTrip } from './state/tripContext'
import { MapSettingsProvider } from './devtools/mapSettingsContext'
import { MapInspector } from './devtools/MapInspector'

/** iPhone 17's CSS viewport, which the prototype is always laid out at. */
const PHONE_W = 402
const PHONE_H = 874
/** Breathing room around the device when it is shown on a larger window. */
const PHONE_MARGIN = 24

/** Scales the fixed-size phone down to fit a smaller window, never up. */
function usePhoneScale() {
  useEffect(() => {
    const fit = () => {
      const scale = Math.min(
        1,
        (window.innerWidth - PHONE_MARGIN) / PHONE_W,
        (window.innerHeight - PHONE_MARGIN) / PHONE_H,
      )
      document.documentElement.style.setProperty('--phone-scale', String(scale))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
}

function Screens() {
  const { screen } = useTrip()
  return (
    <>
      {screen === 'trip' ? (
        <TripMapScreen />
      ) : screen === 'you' ? (
        <YouScreen />
      ) : (
        <ExploreScreen />
      )}
      <WrappedFlow />
    </>
  )
}

export default function App() {
  usePhoneScale()
  return (
    <MapSettingsProvider>
      <TripProvider>
        {/* Always a 402x874 (iPhone 17) device, scaled to fit the window. */}
        <div className="phone">
          <Screens />
        </div>
        {/* Renders itself away below 1100px, so mweb is untouched. */}
        <MapInspector />
      </TripProvider>
    </MapSettingsProvider>
  )
}
