import { useState } from 'react'
import { Icon } from '../components/Icon'
import { StatusBar } from '../components/StatusBar'
import { useTrip } from '../state/tripContext'

/** The questions Google asks about a place like this one, and their answers. */
const QUESTIONS: { id: string; prompt: string; options: string[] }[] = [
  { id: 'when', prompt: 'When did you visit?', options: ['Weekday', 'Weekend', 'Public holiday'] },
  {
    id: 'wait',
    prompt: 'How long did you wait to enter?',
    options: ['No wait', 'Up to 10 min', '10–30 min', '30–60 min', '1 hr+'],
  },
  {
    id: 'tickets',
    prompt: 'Do you recommend buying tickets in advance?',
    options: ['Yes', 'No', 'Not sure'],
  },
]

export function ReviewScreen({ placeId }: { placeId: string }) {
  const { closeReview, findPlace } = useTrip()
  const place = findPlace(placeId)

  const [stars, setStars] = useState(5)
  const [text, setText] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})

  if (!place) return null

  return (
    <div className="screen-over review">
      <StatusBar />

      <div className="review-head">
        <h1>{place.formalName ?? place.name}</h1>
        <button className="round-btn round-btn-dim" onClick={closeReview} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>

      <div className="review-body">
        <div className="review-poster">
          <img src="/assets/review-avatar.png" alt="" />
          <div className="review-poster-text">
            <p className="review-poster-name">Josephine Waliman</p>
            <p className="review-poster-scope">Posting publicly across Google</p>
          </div>
          <Icon name="info" size={20} className="review-info" />
        </div>

        <div className="review-stars" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={n === stars}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              className={`review-star${n <= stars ? ' is-on' : ''}`}
              onClick={() => setStars(n)}
            >
              <Icon name="star" size={40} fill={n <= stars} />
            </button>
          ))}
        </div>

        <textarea
          className="review-text"
          value={text}
          placeholder="Tell others about your experiences"
          onChange={(e) => setText(e.target.value)}
        />

        {/* No camera to reach in a prototype, so it is a shape only. */}
        <div className="review-photos" aria-hidden="true">
          <Icon name="add_a_photo" size={20} fill />
          Add photos &amp; videos
        </div>

        {QUESTIONS.map((question) => (
          <div className="review-q" key={question.id}>
            <p>{question.prompt}</p>
            <div className="review-chips">
              {question.options.map((option) => (
                <button
                  key={option}
                  className={`review-chip${answers[question.id] === option ? ' is-on' : ''}`}
                  aria-pressed={answers[question.id] === option}
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      // Tapping the chosen answer again clears it, so a
                      // question answered by accident can be taken back.
                      [question.id]: prev[question.id] === option ? '' : option,
                    }))
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="review-post">
        <button className="pill review-post-btn" onClick={closeReview}>
          Post
        </button>
      </div>
    </div>
  )
}
