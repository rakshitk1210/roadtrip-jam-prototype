import { useState } from 'react'
import { MapsTabBar } from '../components/MapsTabBar'
import { StatusBar } from '../components/StatusBar'
import { PhotoPermissionScreen } from './PhotoPermissionScreen'
import { BottomSheet } from '../sheet/BottomSheet'
import { EXPLORE_SNAP_FRACTION } from '../sheet/snaps'
import { useTrip, type Snap } from '../state/tripContext'

const PHOTOS = [
  '/assets/wrapped-photo-1.png',
  '/assets/wrapped-photo-2.png',
  '/assets/wrapped-photo-3.png',
  '/assets/wrapped-photo-4.png',
]

/**
 * Maps Explore landing (Figma 1668:5717). The Wrapped tile lives in this
 * sheet — drag it up from the tab bar the way the rest of Maps does.
 */
export function ExploreScreen() {
  const { openWrappedStart, backToYou } = useTrip()
  const [snap, setSnap] = useState<Snap>('half')
  // "Add to your Wrapped" asks for photo access before the story starts.
  const [askingPhotos, setAskingPhotos] = useState(false)

  return (
    <div className="explore-screen">
      {/* The screenshot's own status bar is painted out, so the live one reads 9:41. */}
      <img className="explore-map" src="/assets/wrapped-map-clean.png" alt="" />
      <StatusBar className="status-bar-on-map" />
      <img
        className="wrapped-prompt-pin"
        src="/assets/wrapped-photo-2.png"
        alt=""
        width={30}
        height={30}
      />

      <BottomSheet
        snap={snap}
        onSnapChange={setSnap}
        className="sheet-explore"
        snapFractions={EXPLORE_SNAP_FRACTION}
        header={
          <div className="wrapped-prompt-head">
            <h1>University District</h1>
            <img
              className="wrapped-prompt-weather"
              src="/assets/wrapped-weather.png"
              alt="83 degrees, 119 AQI"
              width={69}
              height={53}
            />
          </div>
        }
      >
        <div className="wrapped-prompt-card">
          <div className="wrapped-prompt-card-glow" aria-hidden="true" />
          <div className="wrapped-prompt-card-face">
            <div className="wrapped-prompt-copy">
              <img src="/assets/wrapped-sparkle.svg" alt="" width={18} height={18} />
              <div>
                <p className="wrapped-prompt-title">
                  Your Road Trip Wrapped is
                  <br />
                  almost here.
                </p>
                <p className="wrapped-prompt-sub">Add your photos to bring it home.</p>
              </div>
            </div>

            <div className="wrapped-prompt-row">
              <button className="wrapped-prompt-cta" onClick={() => setAskingPhotos(true)}>
                Add to your Wrapped
                <img src="/assets/wrapped-open.svg" alt="" width={15} height={15} />
              </button>
              <div className="wrapped-prompt-photos" aria-hidden="true">
                {PHOTOS.map((src) => (
                  <img key={src} src={src} alt="" width={40} height={40} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>

      <MapsTabBar active="explore" onYou={backToYou} />

      {askingPhotos && (
        <PhotoPermissionScreen
          onAllow={() => {
            // The intro slides up over this sheet; it goes once it's covered.
            openWrappedStart()
            window.setTimeout(() => setAskingPhotos(false), 520)
          }}
          onDismiss={() => setAskingPhotos(false)}
        />
      )}
    </div>
  )
}
