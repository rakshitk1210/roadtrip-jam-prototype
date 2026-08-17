import { TopChrome } from '../components/TopChrome'
import { MapCanvas } from '../map/MapCanvas'
import { BottomSheet } from '../sheet/BottomSheet'
import { ItineraryTab } from '../sheet/ItineraryTab'
import { DiscoverTab } from '../sheet/DiscoverTab'
import { PlaceDetailSheet } from '../sheet/PlaceDetailSheet'
import { useTrip } from '../state/tripContext'

export function TripMapScreen() {
  const { tab, setTab, snap, setSnap, activePlaceId, toast } = useTrip()
  const detailOpen = activePlaceId !== null

  return (
    <div className="trip-screen">
      <MapCanvas />
      <TopChrome />

      <BottomSheet
        key={detailOpen ? 'detail' : 'tabs'}
        snap={snap}
        onSnapChange={setSnap}
        className={detailOpen ? 'sheet-detail' : ''}
        header={
          detailOpen ? null : (
            <div className="segmented" role="tablist">
              <button
                role="tab"
                aria-selected={tab === 'itinerary'}
                className={tab === 'itinerary' ? 'is-active' : ''}
                onClick={() => setTab('itinerary')}
              >
                Itineraries
              </button>
              <button
                role="tab"
                aria-selected={tab === 'discover'}
                className={tab === 'discover' ? 'is-active' : ''}
                onClick={() => setTab('discover')}
              >
                Discover
              </button>
            </div>
          )
        }
      >
        {detailOpen ? (
          <PlaceDetailSheet placeId={activePlaceId} />
        ) : tab === 'itinerary' ? (
          <ItineraryTab />
        ) : (
          <DiscoverTab />
        )}
      </BottomSheet>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
