import { WRAPPED_FRAMES } from '../data/wrappedFrames'
import { useTrip } from '../state/tripContext'
import { PhotoPickerScreen, PICKER_HOLD_MS } from './PhotoPickerScreen'
import { SouvenirMapScreen } from './SouvenirMapScreen'
import { WrappedBackgroundScreen } from './WrappedBackgroundScreen'
import { WrappedFrameScreen } from './WrappedFrameScreen'
import { WrappedPreviewScreen } from './WrappedPreviewScreen'
import { WrappedStartScreen } from './WrappedStartScreen'
import { frameTiming } from './wrappedTimeline'

/** The step past the last frame: the story stops looking back and hands over. */
export const WRAPPED_PICKER = WRAPPED_FRAMES.length + 1

/** Where the chosen photos land, and the last chance to caption one. */
export const WRAPPED_PREVIEW = WRAPPED_PICKER + 1

/** The last choice before the souvenir is drawn: which photo frames it. */
export const WRAPPED_BACKGROUND = WRAPPED_PREVIEW + 1

/** And what the picking was for: the map the chosen photos end up on. */
export const WRAPPED_SOUVENIR = WRAPPED_BACKGROUND + 1

/**
 * The Road Trip Wrapped story: the intro at position 0, then one photographic
 * frame per step, the photo picker, the distribution preview it hands over to,
 * the background choice that follows, and the souvenir it makes. Only the
 * current screen and the one it covers stay mounted, so the incoming screen
 * has something to crossfade over.
 */
export function WrappedFlow() {
  const { wrapped, wrappedEpoch } = useTrip()
  if (wrapped === null) return null

  const frames = [wrapped - 1, wrapped].filter((i) => i >= 1 && i <= WRAPPED_FRAMES.length)

  return (
    <>
      {wrapped <= 1 && <WrappedStartScreen current={wrapped === 0} />}
      {frames.map((i) => {
        const next = WRAPPED_FRAMES[i]
        return (
          <WrappedFrameScreen
            key={`${WRAPPED_FRAMES[i - 1].id}${i === wrapped ? `-${wrappedEpoch}` : ''}`}
            frame={WRAPPED_FRAMES[i - 1]}
            index={i}
            // Every frame now leads somewhere: the last one into the picker,
            // whose bar waits on the user instead of filling — so it hands over
            // a sweep that never lands.
            nextFillMs={next ? frameTiming(next).fill : PICKER_HOLD_MS}
            current={i === wrapped}
          />
        )
      })}
      {/* The picker stays mounted through the preview, so stepping back finds the
          roll exactly as it was left. */}
      {wrapped >= WRAPPED_PICKER && wrapped <= WRAPPED_PREVIEW && (
        <PhotoPickerScreen index={WRAPPED_PICKER} current={wrapped === WRAPPED_PICKER} />
      )}
      {/* And the preview stays mounted through the background choice, for the same reason. */}
      {wrapped >= WRAPPED_PREVIEW && wrapped <= WRAPPED_BACKGROUND && (
        <WrappedPreviewScreen index={WRAPPED_PREVIEW} current={wrapped === WRAPPED_PREVIEW} />
      )}
      {wrapped === WRAPPED_BACKGROUND && (
        <WrappedBackgroundScreen index={WRAPPED_BACKGROUND} current />
      )}
      {wrapped === WRAPPED_SOUVENIR && <SouvenirMapScreen index={WRAPPED_SOUVENIR} current />}
    </>
  )
}
