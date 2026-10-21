import { type MouseEvent } from 'react'
import { Icon } from '../components/Icon'
import { StatusBar } from '../components/StatusBar'
import { CURATION_DATE, CURATION_PHOTOS } from '../data/curationPhotos'
import { useTrip } from '../state/tripContext'

/**
 * The scrapbook page a Wrapped photo opens into from the You tab: date, where
 * it was taken, the photo itself circled by hand, and — if one was left — the
 * memory attached to it. Left/right taps step to the next photo `wrappedPhotos`
 * chose, the same tap-zone convention every other Wrapped screen uses, clamped
 * at either end rather than wrapping around.
 */
export function WrappedPhotoDetailScreen({ photoId }: { photoId: string }) {
  const { wrappedPhotos, wrappedComments, closeWrappedPhoto, openWrappedPhoto } = useTrip()
  const photo = CURATION_PHOTOS.find((p) => p.id === photoId)
  if (!photo) return null

  const at = wrappedPhotos.indexOf(photoId)
  const prevId = at > 0 ? wrappedPhotos[at - 1] : null
  const nextId = at >= 0 && at < wrappedPhotos.length - 1 ? wrappedPhotos[at + 1] : null
  const comment = wrappedComments[photoId]

  const onTap = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (event.clientX - bounds.left < bounds.width / 2) {
      if (prevId) openWrappedPhoto(prevId)
    } else if (nextId) {
      openWrappedPhoto(nextId)
    }
  }

  return (
    <div className="screen-over scrap-detail" onClick={onTap}>
      <img className="scrap-bg" src={photo.src} alt="" style={{ objectPosition: photo.position }} />
      <div className="scrap-wash" aria-hidden="true" />

      <StatusBar className="status-bar-on-dark" />

      <button className="round-btn round-btn-dim scrap-close" onClick={closeWrappedPhoto} aria-label="Close">
        <Icon name="close" />
      </button>

      <p className="scrap-date">{CURATION_DATE}</p>

      <h1 className="scrap-title">
        <span className="scrap-pin" aria-hidden="true">
          📍
        </span>
        {photo.location}
      </h1>

      <div className="scrap-frame">
        <img src={photo.src} alt="" style={{ objectPosition: photo.position }} />
        <img className="scrap-frame-border" src="/assets/scrap-frame-border.svg" alt="" aria-hidden="true" />
      </div>

      {comment && (
        <div className="scrap-note">
          <q>{comment}</q>
        </div>
      )}

      <div className="wrapped-foot scrap-foot">
        <img src="/assets/wrapped-sparkle.svg" alt="" width={18} height={18} />
        <p>Your Road Trip Wrapped</p>
      </div>

      <button className="wrapped-glass scrap-share" aria-label="Share">
        <img src="/assets/souvenir-share.svg" alt="" />
      </button>
    </div>
  )
}
