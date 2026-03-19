import { useCallback, useRef } from 'react'

type SoundTone = 'flip' | 'correct' | 'wrong' | 'event' | 'win'

const toneMap: Record<
  SoundTone,
  { frequency: number; durationMs: number; type: OscillatorType; volume: number }
> = {
  flip: { frequency: 410, durationMs: 90, type: 'triangle', volume: 0.03 },
  correct: { frequency: 720, durationMs: 150, type: 'sine', volume: 0.05 },
  wrong: { frequency: 180, durationMs: 220, type: 'square', volume: 0.04 },
  event: { frequency: 520, durationMs: 180, type: 'sawtooth', volume: 0.04 },
  win: { frequency: 880, durationMs: 260, type: 'triangle', volume: 0.05 },
}

export const useSoundEffects = (enabled: boolean) => {
  const contextRef = useRef<AudioContext | null>(null)

  const playSound = useCallback((tone: SoundTone) => {
    if (!enabled) return

    try {
      const context = contextRef.current ?? new AudioContext()
      contextRef.current = context

      const config = toneMap[tone]
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()

      oscillator.type = config.type
      oscillator.frequency.value = config.frequency

      gainNode.gain.value = 0
      gainNode.gain.linearRampToValueAtTime(config.volume, context.currentTime + 0.01)
      gainNode.gain.linearRampToValueAtTime(0, context.currentTime + config.durationMs / 1000)

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)

      oscillator.start()
      oscillator.stop(context.currentTime + config.durationMs / 1000)
    } catch {
      // Silent fallback when audio context is blocked by browser policy.
    }
  }, [enabled])

  return { playSound }
}
