import { Icon } from './Icon'

/** The real Explore / You / Contribute bottom bar — icons, labels, active state. */
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
        <Icon name="explore" size={26} fill={active === 'explore'} />
        <span>Explore</span>
      </button>
      <button
        className={active === 'you' ? 'is-active' : ''}
        aria-current={active === 'you' ? 'page' : undefined}
        disabled={!onYou}
        onClick={onYou}
      >
        <Icon name="bookmark" size={26} fill={active === 'you'} />
        <span>You</span>
      </button>
      <button disabled>
        <Icon name="add_circle" size={26} />
        <span>Contribute</span>
      </button>
    </nav>
  )
}
