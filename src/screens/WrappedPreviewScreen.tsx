import { Fragment, useEffect, useState } from 'react'
import { StatusBar } from '../components/StatusBar'
import { WrappedStory } from '../components/WrappedStory'
import { CURATION_PHOTOS } from '../data/curationPhotos'
import { useTrip } from '../state/tripContext'
import { PhotoCommentScreen } from './PhotoCommentScreen'
import { TripDiorama } from './TripDiorama'
import { useStoryPlayback } from './useStoryPlayback'
import { ADVANCE_MS } from './wrappedTimeline'

/**
 * The story pauses here too, the same way the picker does — the bar waits on
 * the user rather than filling on a clock.
 */
const PREVIEW_HOLD_MS = 600_000

interface Props {
  index: number
  current: boolean
}

/**
 * What the picking made, laid out the way the souvenir will lay it out: the
 * route, and each chosen photo in its stop's spot beside it, so the spread can
 * be checked before the souvenir sets it in stone. Stops still waiting for a
 * photo show an empty ring. Each photo takes an optional caption — the "+"
 * opens `PhotoCommentScreen`.
 */
export function WrappedPreviewScreen({ index, current }: Props) {
  const { wrappedPhotos, wrappedComments, commentDraftId, openCommentDraft, advanceWrapped, retreatWrapped } =
    useTrip()
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const { settled, replay, onTap } = useStoryPlayback({
    runMs: PREVIEW_HOLD_MS,
    current,
    onBack: retreatWrapped,
    onNext: advanceWrapped,
  })

  const photos = wrappedPhotos
    .map((id) => CURATION_PHOTOS.find((photo) => photo.id === id))
    .filter((photo): photo is (typeof CURATION_PHOTOS)[number] => Boolean(photo))

  return (
    <div
      className={`wrapped-preview${entered ? ' is-in' : ''}${settled ? ' is-settled' : ''}`}
      style={{ zIndex: 80 + index }}
      onClick={onTap}
    >
      <StatusBar className="status-bar-on-dark" />

      <WrappedStory active={index} fillMs={PREVIEW_HOLD_MS} delayMs={-ADVANCE_MS} />

      <Fragment key={`copy-${replay}`}>
        <p className="preview-head">
          <strong>Here&rsquo;s where your photos landed.</strong>{' '}
          <span>Tap + to add a memory to any of them.</span>
        </p>

        {/* The souvenir's map, nudged down to clear the heading. */}
        <TripDiorama photos={photos} onAdd={openCommentDraft} comments={wrappedComments} />
      </Fragment>

      <button className="wrapped-next" onClick={advanceWrapped} aria-label="Make the souvenir">
        <img src="/assets/wrapped-arrow.svg" alt="" />
      </button>

      <div className="wrapped-foot">
        <img src="/assets/wrapped-sparkle.svg" alt="" width={18} height={18} />
        <p>Your Road Trip Wrapped</p>
      </div>

      {commentDraftId && <PhotoCommentScreen photoId={commentDraftId} />}
    </div>
  )
}

