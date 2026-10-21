import { Icon } from '../components/Icon'
import { MapsTabBar } from '../components/MapsTabBar'
import { StatusBar } from '../components/StatusBar'
import { CURATION_PHOTOS } from '../data/curationPhotos'
import { useTrip } from '../state/tripContext'
import { WrappedPhotoDetailScreen } from './WrappedPhotoDetailScreen'

const AVATARS = [
  '/assets/you-avatar-1.jpg',
  '/assets/you-avatar-2.jpg',
  '/assets/you-avatar-3.jpg',
  '/assets/you-avatar-4.jpg',
]

/**
 * The "You" tab, where a Roadtrip Jam shows up as a live card.
 * `you-recent-places.jpg` is one long screenshot from the Figma file; the two
 * crops below match the frames the design clips it into (nodes 1435:13747 and
 * 1435:13748).
 */
export function YouScreen() {
  const { openTrip, openExplore, wrappedPhotos, viewingWrappedPhotoId, openWrappedPhoto } = useTrip()
  const wrappedTiles = wrappedPhotos
    .map((id) => CURATION_PHOTOS.find((photo) => photo.id === id))
    .filter((photo): photo is (typeof CURATION_PHOTOS)[number] => Boolean(photo))

  return (
    <div className="you-screen">
      {/* The screenshot's own status bar is painted out, so the live one reads 9:41. */}
      <img className="you-bg" src="/assets/you-bg-clean.jpg" alt="" />
      <StatusBar className="status-bar-on-map" />

      <div className="you-sheet">
        <span className="you-handle" />
        <div className="you-head">
          <h1>You</h1>
          <button className="round-btn round-btn-dim" aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        <button className="jam-card" onClick={openTrip}>
          <div className="jam-card-top">
            <div className="jam-card-text">
              <p className="jam-title">Seattle to North Cascades</p>
              <p className="jam-sub">
                Roadtrip Jam
                <img src="/assets/ic-live-dot.svg" alt="" width={12} height={12} />
              </p>
            </div>
            <Icon name="chevron_right" size={24} className="jam-chevron" />
          </div>
          <div className="jam-avatars">
            {AVATARS.map((src) => (
              <img key={src} src={src} alt="" />
            ))}
          </div>
        </button>

        {wrappedTiles.length > 0 && (
          <div className="you-photos">
            <p className="you-photos-head">Your Road Trip Wrapped</p>
            <div className="you-photos-grid">
              {wrappedTiles.map((photo) => (
                <button
                  key={photo.id}
                  className="you-photo-tile"
                  onClick={() => openWrappedPhoto(photo.id)}
                  aria-label={`Open ${photo.location}`}
                >
                  <img src={photo.src} alt="" style={{ objectPosition: photo.position }} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="you-recents">
          <img src="/assets/you-recent-places.jpg" alt="Your recent places" />
        </div>
      </div>

      <MapsTabBar active="you" onExplore={openExplore} />

      {viewingWrappedPhotoId && <WrappedPhotoDetailScreen photoId={viewingWrappedPhotoId} />}
    </div>
  )
}
