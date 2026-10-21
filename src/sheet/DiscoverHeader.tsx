import { useState } from 'react'
import { Icon } from '../components/Icon'

/**
 * Figma 1666:6720. Ask Maps leads with its own gradient glyph; the rest are
 * Material Symbols, named by their component descriptions in the file.
 */
const CHIPS: { key: string; label: string; icon?: string; image?: string }[] = [
  { key: 'ask', label: 'Ask Maps', image: '/assets/ic-ask-maps.svg' },
  { key: 'restaurants', label: 'Restaurants', icon: 'restaurant' },
  { key: 'coffee', label: 'Coffee', icon: 'local_cafe' },
  { key: 'shopping', label: 'Shopping', icon: 'shopping_bag' },
  { key: 'desserts', label: 'Desserts', icon: 'icecream' },
]

/**
 * Discover's header row. It rides in the sheet's drag zone rather than in the
 * body, so the chips stay put while the saved list scrolls under them.
 */
export function DiscoverHeader() {
  const [active, setActive] = useState<string | null>(null)

  return (
    <div
      className="chip-rail"
      // The rail runs wider than the sheet, so a drag that starts here is its
      // own sideways scroll rather than a pull on the sheet.
      onPointerDown={(e) => e.stopPropagation()}
    >
      {CHIPS.map((c) => (
        <button
          key={c.key}
          className={`chip${active === c.key ? ' is-active' : ''}`}
          aria-pressed={active === c.key}
          onClick={() => setActive((current) => (current === c.key ? null : c.key))}
        >
          {c.image ? (
            <img className="chip-icon" src={c.image} alt="" width={16} height={16} />
          ) : (
            <Icon name={c.icon!} size={16} />
          )}
          {c.label}
        </button>
      ))}
    </div>
  )
}
