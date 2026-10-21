import { Icon } from './Icon'

/**
 * The Explore / You / Contribute bottom bar, as Google Maps draws it now: a
 * pale bar, the current tab's icon filled and sat in a cyan pill, and a red
 * dot on You while it has something new.
 */
export function MapsTabBar({
  active,
  onExplore,
  onYou,
}: {
  active: 'explore' | 'you'
  onExplore?: () => void
  onYou?: () => void
}) {
  return (
    <nav className="maps-tabbar">
      <button
        className={active === 'explore' ? 'is-active' : ''}
        aria-current={active === 'explore' ? 'page' : undefined}
        disabled={!onExplore}
        onClick={onExplore}
      >
        <span className="maps-tabbar-icon">
          <Icon name="location_on" size={24} fill={active === 'explore'} />
        </span>
        <span>Explore</span>
      </button>
      <button
        className={active === 'you' ? 'is-active' : ''}
        aria-current={active === 'you' ? 'page' : undefined}
        disabled={!onYou}
        onClick={onYou}
      >
        <span className="maps-tabbar-icon">
          <Icon name="bookmark" size={24} fill={active === 'you'} />
          {active !== 'you' && <i className="maps-tabbar-dot" aria-label="New" />}
        </span>
        <span>You</span>
      </button>
      <button disabled>
        <span className="maps-tabbar-icon">
          <Icon name="add_circle" size={24} />
        </span>
        <span>Contribute</span>
      </button>
    </nav>
  )
}
