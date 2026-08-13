import { Icon } from '../components/Icon'
import { useTrip } from '../state/tripContext'

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
  const { openTrip } = useTrip()

  return (
    <div className="you-screen">
      <img className="you-bg" src="/assets/you-bg.jpg" alt="" />

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

        <div className="you-recents">
          <img src="/assets/you-recent-places.jpg" alt="Your recent places" />
        </div>
      </div>

      <div className="you-nav">
        <img src="/assets/you-recent-places.jpg" alt="" />
      </div>
    </div>
  )
}
