type FakeOrFactSoundName =
  | 'click'
  | 'tick'
  | 'correct'
  | 'wrong'
  | 'victory'
  | 'level'

type ToneStep = {
  frequency: number
  duration: number
  type?: OscillatorType
  gain?: number
}

const soundMap: Record<FakeOrFactSoundName, ToneStep[]> = {
  click: [{ frequency: 420, duration: 0.05, type: 'square', gain: 0.03 }],
  tick: [{ frequency: 780, duration: 0.04, type: 'triangle', gain: 0.018 }],
  correct: [
    { frequency: 520, duration: 0.07, type: 'triangle', gain: 0.05 },
    { frequency: 740, duration: 0.12, type: 'triangle', gain: 0.045 },
  ],
  wrong: [
    { frequency: 240, duration: 0.08, type: 'sawtooth', gain: 0.05 },
    { frequency: 180, duration: 0.12, type: 'sawtooth', gain: 0.04 },
  ],
  victory: [
    { frequency: 392, duration: 0.12, type: 'triangle', gain: 0.05 },
    { frequency: 523, duration: 0.12, type: 'triangle', gain: 0.05 },
    { frequency: 659, duration: 0.18, type: 'triangle', gain: 0.055 },
  ],
  level: [
    { frequency: 440, duration: 0.08, type: 'triangle', gain: 0.04 },
    { frequency: 660, duration: 0.08, type: 'triangle', gain: 0.04 },
    { frequency: 880, duration: 0.12, type: 'triangle', gain: 0.045 },
  ],
}

export const createFakeOrFactAudioManager = () => {
  let enabled = true
  let context: AudioContext | null = null

  const ensureContext = () => {
    if (typeof window === 'undefined') return null
    if (!context) {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      context = AudioContextCtor ? new AudioContextCtor() : null
    }
    if (context?.state === 'suspended') {
      void context.resume().catch(() => undefined)
    }
    return context
  }

  const play = (name: FakeOrFactSoundName) => {
    if (!enabled) return
    const audioContext = ensureContext()
    if (!audioContext) return

    let offset = audioContext.currentTime
    soundMap[name].forEach((step) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.type = step.type ?? 'triangle'
      oscillator.frequency.value = step.frequency
      gainNode.gain.setValueAtTime(step.gain ?? 0.03, offset)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, offset + step.duration)
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start(offset)
      oscillator.stop(offset + step.duration)
      offset += step.duration * 0.92
    })
  }

  return {
    setEnabled(value: boolean) {
      enabled = value
    },
    play,
  }
}
