import { Icon } from '../components/Icon'
import { TopChrome } from '../components/TopChrome'
import { MapCanvas } from '../map/MapCanvas'
import { BottomSheet } from '../sheet/BottomSheet'
import { ItineraryTab } from '../sheet/ItineraryTab'
import { DiscoverTab } from '../sheet/DiscoverTab'
import { PlaceDetailSheet } from '../sheet/PlaceDetailSheet'
import { useTrip } from '../state/tripContext'

export function TripMapScreen() {
  const { tab, setTab, snap, setSnap, activePlaceId, toast, selectMode, itineraryChanged } =
    useTrip()
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
      >
        {detailOpen ? (
          <PlaceDetailSheet placeId={activePlaceId} />
        ) : tab === 'itinerary' ? (
          <ItineraryTab />
        ) : (
          <DiscoverTab />
        )}
      </BottomSheet>

      {/* Floats over the sheet rather than living inside it, so both tabs get
          their own header row. It stands down for the selection's own actions,
          which take the same strip of screen — and switching tabs mid-selection
          would only drop the selection anyway. */}
      {!detailOpen && !selectMode && (
        <div className="tab-pill" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'itinerary'}
            className={tab === 'itinerary' ? 'is-active' : ''}
            onClick={() => setTab('itinerary')}
          >
            <Icon name="automation" size={28} />
            Itinerary
            {/* Says the trip changed while you were somewhere else, so it only
                shows on the tab you'd have to go to in order to see it. */}
            {itineraryChanged && tab !== 'itinerary' && (
              <span className="tab-badge" aria-label="Itinerary updated" />
            )}
          </button>
          <button
            role="tab"
            aria-selected={tab === 'discover'}
            className={tab === 'discover' ? 'is-active' : ''}
            onClick={() => setTab('discover')}
          >
            <Icon name="explore" size={28} />
            Discover
          </button>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
