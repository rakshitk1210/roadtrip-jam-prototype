import { YouScreen } from './screens/YouScreen'
import { TripMapScreen } from './screens/TripMapScreen'
import { TripProvider } from './state/tripStore'
import { useTrip } from './state/tripContext'
import { MapSettingsProvider } from './devtools/mapSettingsContext'
import { MapInspector } from './devtools/MapInspector'

function Screens() {
  const { screen } = useTrip()
  return screen === 'you' ? <YouScreen /> : <TripMapScreen />
}

export default function App() {
  return (
    <MapSettingsProvider>
      <TripProvider>
        {/* Fills a real phone; renders as a 402x872 device on a desktop viewport. */}
        <div className="phone">
          <Screens />
        </div>
        {/* Renders itself away below 1100px, so mweb is untouched. */}
        <MapInspector />
      </TripProvider>
    </MapSettingsProvider>
  )
}
