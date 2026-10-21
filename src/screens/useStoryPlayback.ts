import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'

type Phase = 'playing' | 'rewound' | 'finished'

interface Options {
  /** How long this screen's reveal sequence runs for. */
  runMs: number
  /** Whether this screen is the one on top of the story. */
  current: boolean
  /** Steps back a screen, on a second tap of the left half. */
  onBack: () => void
  /** Steps on a screen, on a second tap of the right half. */
  onNext: () => void
  /** Runs whenever the sequence starts over, so hosts can drop hand-off state. */
  onReplay?: () => void
}

/**
 * Story tap handling shared by every Wrapped screen. The left half rewinds to the
 * top of the screen and a further tap steps back; the right half runs the
 * sequence out and a further tap steps on.
 */
export function useStoryPlayback({ runMs, current, onBack, onNext, onReplay }: Options) {
  const [phase, setPhase] = useState<Phase>('playing')
  const [replay, setReplay] = useState(0)

  const handlers = useRef({ onBack, onNext, onReplay })
  handlers.current = { onBack, onNext, onReplay }

  const restart = useCallback(() => {
    setPhase('rewound')
    setReplay((n) => n + 1)
    handlers.current.onReplay?.()
  }, [])

  // The sequence counts itself out, so a tap once it has landed steps on instead
  // of running out an animation that already finished.
  useEffect(() => {
    const id = window.setTimeout(() => setPhase('finished'), runMs)
    return () => window.clearTimeout(id)
  }, [replay, runMs])

  // Stepping back uncovers a screen that has already played, so run it again.
  const covered = useRef(!current)
  useEffect(() => {
    if (current && covered.current) restart()
    covered.current = !current
  }, [current, restart])

  const onTap = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    const bounds = event.currentTarget.getBoundingClientRect()

    if (event.clientX - bounds.left < bounds.width / 2) {
      if (phase === 'rewound') handlers.current.onBack()
      else restart()
      return
    }

    if (phase === 'finished') handlers.current.onNext()
    else setPhase('finished')
  }

  return { settled: phase === 'finished', replay, onTap }
}
