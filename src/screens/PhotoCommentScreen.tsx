import { useState } from 'react'
import { Icon } from '../components/Icon'
import { StatusBar } from '../components/StatusBar'
import { CURATION_PHOTOS } from '../data/curationPhotos'
import { useTrip } from '../state/tripContext'

const COMMENT_LIMIT = 120

/**
 * The "+" on a preview pin opens this: one photo, one short optional line about
 * it — the inside joke or memory worth keeping. Nothing is saved until Save is
 * tapped; closing walks away and the photo stays uncaptioned.
 */
export function PhotoCommentScreen({ photoId }: { photoId: string }) {
  const { wrappedComments, closeCommentDraft, setWrappedComment } = useTrip()
  const photo = CURATION_PHOTOS.find((p) => p.id === photoId)
  const [text, setText] = useState(wrappedComments[photoId] ?? '')

  if (!photo) return null

  const save = () => {
    setWrappedComment(photoId, text)
    closeCommentDraft()
  }

  return (
    <div className="screen-over photo-comment">
      <StatusBar />

      <div className="gem-head">
        <div className="gem-badge">
          <img className="comment-photo" src={photo.src} alt="" style={{ objectPosition: photo.position }} />
        </div>
        <button className="round-btn round-btn-dim gem-close" onClick={closeCommentDraft} aria-label="Close">
          <Icon name="close" />
        </button>

        <div className="gem-titles">
          <h1>{photo.location}</h1>
          <p>Add a memory to this photo</p>
        </div>
      </div>

      <div className="gem-body">
        <div className="gem-note">
          <textarea
            value={text}
            maxLength={COMMENT_LIMIT}
            placeholder="What's the story behind this one? (optional)"
            autoFocus
            onChange={(e) => setText(e.target.value)}
          />
          <span className="gem-note-count">
            {text.length}/{COMMENT_LIMIT}
          </span>
        </div>
      </div>

      <div className="gem-done">
        <button className="pill gem-done-btn" onClick={save}>
          Save
        </button>
      </div>
    </div>
  )
}
