import { Icon } from './Icon'
import { useTrip } from '../state/tripContext'

/** Four overlapping faces, positioned exactly as in the Figma avatar cluster. */
const TOPBAR_AVATARS = [
  { src: '/assets/topbar-av-1.jpg', size: 20.9, left: 2, top: 7 },
  { src: '/assets/topbar-av-2.jpg', size: 8.3, left: 15.2, top: 28.3 },
  { src: '/assets/topbar-av-3.jpg', size: 10.3, left: 23.4, top: 5.5 },
  { src: '/assets/topbar-av-4.jpg', size: 12.4, left: 24.1, top: 17.2 },
]

/**
 * Back, trip name and who is on it. The redesign drops the AI search field and
 * the category chip row that used to sit under this, so the map shows through.
 */
export function TopChrome() {
  const { backToYou } = useTrip()

  return (
    <div className="top-chrome">
      <div className="title-row">
        <button className="round-btn" onClick={backToYou} aria-label="Back">
          <Icon name="arrow_back" />
        </button>
        <span className="title">North Cascades</span>
        <div className="avatar-cluster" aria-label="4 people on this jam">
          {TOPBAR_AVATARS.map((a) => (
            <img
              key={a.src}
              src={a.src}
              alt=""
              style={{ width: a.size, height: a.size, left: a.left, top: a.top }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
