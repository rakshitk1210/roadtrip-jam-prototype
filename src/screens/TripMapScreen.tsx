import { useEffect } from 'react'
import { Icon } from '../components/Icon'
import { TopChrome } from '../components/TopChrome'
import { KANGAROO } from '../data/places'
import { MapCanvas } from '../map/MapCanvas'
import { BottomSheet } from '../sheet/BottomSheet'
import { ItineraryTab } from '../sheet/ItineraryTab'
import { DiscoverTab } from '../sheet/DiscoverTab'
import { PlaceDetailSheet } from '../sheet/PlaceDetailSheet'
import { HiddenGemScreen } from '../sheet/HiddenGemScreen'
import { ReviewScreen } from '../sheet/ReviewScreen'
import { useTrip } from '../state/tripContext'

export function TripMapScreen() {
  const {
    tab,
    setTab,
    snap,
    setSnap,
    activePlaceId,
    toast,
    selectMode,
    itineraryChanged,
    itinerary,
    togglePostTrip,
    gemDraftId,
    reviewId,
  } = useTrip()
  const detailOpen = activePlaceId !== null

  // The post-trip actions are reached by shortcut rather than by a control on
  // the row, so they stay out of the way until asked for. Nothing happens until
  // the farm is actually on the trip — adding it is what earns the prompt.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // `code` names the physical key whatever the layout says it types.
      if (e.code !== 'Space' || !e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return
      // Space autorepeats when held, which would flicker the panel.
      if (e.repeat) return
      // In a field this is a space before it is a shortcut, and the check has
      // to beat preventDefault or the field never gets it.
      const el = e.target as HTMLElement | null
      if (el?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName ?? '')) return
      // Otherwise the sheet scrolls up and whatever button has focus fires too.
      e.preventDefault()
      // Both overlays cover the sheet, so a panel toggled under one would only
      // be found on the way back out.
      if (gemDraftId || reviewId) return
      if (!itinerary.some((i) => i.id === KANGAROO.id)) return
      setTab('itinerary')
      togglePostTrip(KANGAROO.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [itinerary, setTab, togglePostTrip, gemDraftId, reviewId])

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

      {gemDraftId && <HiddenGemScreen placeId={gemDraftId} />}
      {reviewId && <ReviewScreen placeId={reviewId} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
