import { useEffect } from 'react'
import { Icon } from '../components/Icon'
import { TopChrome } from '../components/TopChrome'
import { MapCanvas } from '../map/MapCanvas'
import { BottomSheet } from '../sheet/BottomSheet'
import {
  ItineraryHeader,
  ItineraryTab,
  SelectActionBar,
  useItinerarySelection,
} from '../sheet/ItineraryTab'
import { DiscoverTab } from '../sheet/DiscoverTab'
import { PlaceDetailSheet } from '../sheet/PlaceDetailSheet'
import { useTrip, type Tab } from '../state/tripContext'

/** The tab switch, floating over the sheet rather than sitting inside it. */
function TabPill({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  return (
    <div className="tab-pill-wrap">
      <div className="tab-pill" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'itinerary'}
          onClick={() => setTab('itinerary')}
        >
          <Icon name="automation" size={28} />
          Itinerary
        </button>
        <button role="tab" aria-selected={tab === 'discover'} onClick={() => setTab('discover')}>
          <Icon name="explore" size={28} />
          Discover
        </button>
      </div>
    </div>
  )
}

export function TripMapScreen() {
  const { tab, setTab, snap, setSnap, activePlaceId, toast } = useTrip()
  const detailOpen = activePlaceId !== null
  const selection = useItinerarySelection()

  // Selecting only makes sense over the itinerary list, so leaving it — by
  // switching tabs or opening a place — drops the selection.
  const stale = selection.selecting && (detailOpen || tab !== 'itinerary')
  useEffect(() => {
    if (stale) selection.cancel()
  }, [stale, selection])

  const onItinerary = tab === 'itinerary' && !detailOpen

  return (
    <div className="trip-screen">
      <MapCanvas />
      <TopChrome />

      <BottomSheet
        key={detailOpen ? 'detail' : 'tabs'}
        snap={snap}
        onSnapChange={setSnap}
        className={detailOpen ? 'sheet-detail' : ''}
        header={onItinerary ? <ItineraryHeader selection={selection} /> : null}
      >
        {detailOpen ? (
          <PlaceDetailSheet placeId={activePlaceId} />
        ) : tab === 'itinerary' ? (
          <ItineraryTab selection={selection} />
        ) : (
          <DiscoverTab />
        )}
      </BottomSheet>

      {selection.selecting && onItinerary && <SelectActionBar selection={selection} />}
      {!detailOpen && !selection.selecting && <TabPill tab={tab} setTab={setTab} />}

      {/* One of the two bottom overlays is always up unless a place is open. */}
      {toast && <div className={`toast${detailOpen ? '' : ' is-raised'}`}>{toast}</div>}
    </div>
  )
}
