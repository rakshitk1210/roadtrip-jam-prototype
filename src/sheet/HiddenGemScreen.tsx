import { useState } from 'react'
import { Icon } from '../components/Icon'
import { StatusBar } from '../components/StatusBar'
import { useTrip } from '../state/tripContext'

const AUDIENCES = ['Friends', 'Only Me', 'Public'] as const
const NOTE_LIMIT = 250

/**
 * What marking a gem actually asks for: which of your own photos say why, and a
 * line about it. Nothing here is committed until Done — closing walks away and
 * the place stays unmarked.
 */
export function HiddenGemScreen({ placeId }: { placeId: string }) {
  const { closeGemDraft, toggleGem, hasGem, findPlace } = useTrip()
  const place = findPlace(placeId)

  // The comp opens with the first two already chosen, so the screen reads as
  // something to confirm rather than a blank form.
  const [chosen, setChosen] = useState<number[]>([0, 1])
  const [note, setNote] = useState('')
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>('Friends')
  const [audienceOpen, setAudienceOpen] = useState(false)

  if (!place) return null
  const photos = place.gemPhotos ?? place.photos

  const done = () => {
    // `toggleGem` flips, so a place that is already a gem would come back off.
    if (!hasGem(placeId)) toggleGem(placeId)
    closeGemDraft()
  }

  return (
    <div className="screen-over gem">
      <StatusBar />

      <div className="gem-head">
        <div className="gem-badge">
          <img src="/assets/sticker-art-kangaroo.svg" alt="" />
        </div>
        <button className="round-btn round-btn-dim gem-close" onClick={closeGemDraft} aria-label="Close">
          <Icon name="close" />
        </button>

        <div className="gem-titles">
          <h1>{place.formalName ?? place.name}</h1>
          <p>Mark as Hidden Gem 💎</p>
        </div>

        <div className="gem-audience">
          <button
            className="gem-audience-btn"
            onClick={() => setAudienceOpen((open) => !open)}
            aria-expanded={audienceOpen}
          >
            <Icon name="people" size={16} fill />
            {audience}
            <Icon name="arrow_drop_down" size={28} />
          </button>
          {audienceOpen && (
            <ul className="gem-audience-menu" role="listbox">
              {AUDIENCES.map((option) => (
                <li key={option}>
                  <button
                    role="option"
                    aria-selected={option === audience}
                    className={option === audience ? 'is-on' : ''}
                    onClick={() => {
                      setAudience(option)
                      setAudienceOpen(false)
                    }}
                  >
                    {option}
                    {option === audience && <Icon name="check" size={18} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="gem-body">
        <div className="gem-blurb">
          <h2>What made it a gem?</h2>
          <p>Add a photo, memory, rating to help other travelers discover.</p>
        </div>

        <div className="gem-photos">
          {photos.map((photo, i) => {
            const on = chosen.includes(i)
            return (
              <button
                key={photo}
                className={`gem-photo${on ? ' is-on' : ''}`}
                aria-pressed={on}
                aria-label={`Photo ${i + 1}`}
                onClick={() =>
                  setChosen((list) =>
                    list.includes(i) ? list.filter((n) => n !== i) : [...list, i],
                  )
                }
              >
                <img src={photo} alt="" />
                <span className="gem-photo-check">
                  {on && <Icon name="check_circle" size={20} fill />}
                </span>
              </button>
            )
          })}

          {/* Nothing to pick from beyond the three, so it stays a shape. */}
          <div className="gem-add" aria-hidden="true">
            <Icon name="add" size={23} />
            Add Photo
          </div>
        </div>

        <div className="gem-note">
          <img className="gem-note-avatar" src="/assets/review-avatar.png" alt="" />
          <textarea
            value={note}
            maxLength={NOTE_LIMIT}
            placeholder="What made this place special? (optional)"
            onChange={(e) => setNote(e.target.value)}
          />
          <span className="gem-note-count">
            {note.length}/{NOTE_LIMIT}
          </span>
        </div>
      </div>

      <div className="gem-done">
        <button className="pill gem-done-btn" onClick={done}>
          Done
        </button>
      </div>
    </div>
  )
}
