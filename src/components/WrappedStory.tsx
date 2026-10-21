import { STORY_TICKS } from '../screens/wrappedTimeline'

interface Props {
  /** The bar filling right now. Bars before it read as complete. */
  active: number
  fillMs: number
  /** A negative delay starts the fill part-way through, to carry it across frames. */
  delayMs?: number
  /** Shows the active bar already full, for a screen that was skipped to its end. */
  filled?: boolean
}

/** Story progress bars: grey until a bar fills left to right as its frame plays. */
export function WrappedStory({ active, fillMs, delayMs = 0, filled = false }: Props) {
  return (
    <div className="wrapped-story" aria-hidden="true">
      {Array.from({ length: STORY_TICKS }, (_, i) => (
        <span key={i} className={i < active || (i === active && filled) ? 'is-done' : undefined}>
          {i === active && !filled && (
            <i
              className="wrapped-story-fill"
              style={{ animationDuration: `${fillMs}ms`, animationDelay: `${delayMs}ms` }}
            />
          )}
        </span>
      ))}
    </div>
  )
}
