import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MixamoFighterCanvas, { MixamoDuelCanvas } from './MixamoFighterCanvas'

export type BoxMathOperator = '+' | '-' | 'x' | '/'
type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Side = 'left' | 'right'
type Winner = Side | 'draw'

export type TeacherBoxQuestion = {
  prompt: string
  answer: string
}

type BoxQuestion = {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  source: 'teacher' | 'generated'
}

type RoundPair = {
  left: BoxQuestion
  right: BoxQuestion
}

type TeamState = {
  hp: number
  score: number
  hits: number
  correct: number
  wrong: number
  combo: number
  bestCombo: number
  note: string
  status: 'ready' | 'correct' | 'wrong' | 'hit' | 'ko'
  cooldown: boolean
  selectedChoice: number | null
}

type DifficultyConfig = {
  rounds: number
  roundSeconds: number
  baseScore: number
  speedScore: number
  comboBonus: number
  baseDamage: number
  roundGapMs: number
}

type BoxBattleArenaProps = {
  gameTitle: string
  gameTone: string
  leftTeamName?: string
  rightTeamName?: string
  initialDifficulty?: Difficulty
  initialEnabledOps?: BoxMathOperator[]
  teacherQuestions?: TeacherBoxQuestion[]
  setupPath?: string
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  Oson: { rounds: 8, roundSeconds: 16, baseScore: 80, speedScore: 3, comboBonus: 8, baseDamage: 13, roundGapMs: 1150 },
  "O'rta": { rounds: 10, roundSeconds: 13, baseScore: 96, speedScore: 4, comboBonus: 11, baseDamage: 16, roundGapMs: 1050 },
  Qiyin: { rounds: 12, roundSeconds: 10, baseScore: 112, speedScore: 5, comboBonus: 14, baseDamage: 20, roundGapMs: 900 },
}

const BOX_ATTACK_CONTACT_DELAY_MS = 300

const createTeam = (): TeamState => ({
  hp: 100,
  score: 0,
  hits: 0,
  correct: 0,
  wrong: 0,
  combo: 0,
  bestCombo: 0,
  note: "Savol variantidan tanlang.",
  status: 'ready',
  cooldown: false,
  selectedChoice: null,
})

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const shuffle = <T,>(items: T[]) => {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

const buildOptions = (answerRaw: string): { options: string[]; correctIndex: number } => {
  const answer = answerRaw.trim()
  const numeric = Number(answer)
  const isInt = Number.isFinite(numeric) && /^-?\d+$/.test(answer)

  if (isInt) {
    const set = new Set<number>([numeric])
    const spread = Math.max(5, Math.floor(Math.abs(numeric) * 0.25))
    while (set.size < 4) {
      set.add(Math.max(0, numeric + randomInt(-spread, spread)))
    }
    const options = shuffle(Array.from(set).map(String))
    return { options, correctIndex: options.indexOf(answer) }
  }

  const fallback = shuffle([
    answer,
    `${answer}lar`,
    `${answer}cha`,
    `${answer} 2`,
    `Variant-${randomInt(1, 9)}`,
    `Javob-${randomInt(10, 99)}`,
  ])
    .filter((item, idx, arr) => arr.indexOf(item) === idx)
    .slice(0, 4)

  while (fallback.length < 4) {
    fallback.push(`Variant-${randomInt(100, 999)}`)
  }

  if (!fallback.includes(answer)) fallback[0] = answer
  const options = shuffle(fallback)
  return { options, correctIndex: options.indexOf(answer) }
}

const createQuestion = (prompt: string, answer: string, source: 'teacher' | 'generated', idSeed: string): BoxQuestion => {
  const { options, correctIndex } = buildOptions(answer)
  return {
    id: `${idSeed}-${Math.random().toString(36).slice(2, 8)}`,
    prompt,
    options,
    correctIndex,
    source,
  }
}

const generateMathQuestion = (op: BoxMathOperator, difficulty: Difficulty, index: number): BoxQuestion => {
  let prompt = ''
  let answer = ''

  if (op === '+') {
    const max = difficulty === 'Qiyin' ? 180 : difficulty === "O'rta" ? 90 : 35
    const a = randomInt(5, max)
    const b = randomInt(3, max)
    prompt = `${a} + ${b} = ?`
    answer = String(a + b)
  } else if (op === '-') {
    const max = difficulty === 'Qiyin' ? 220 : difficulty === "O'rta" ? 120 : 50
    const a = randomInt(20, max)
    const b = randomInt(3, a - 1)
    prompt = `${a} - ${b} = ?`
    answer = String(a - b)
  } else if (op === 'x') {
    const a = randomInt(2, difficulty === 'Qiyin' ? 17 : difficulty === "O'rta" ? 13 : 10)
    const b = randomInt(2, difficulty === 'Qiyin' ? 16 : difficulty === "O'rta" ? 12 : 9)
    prompt = `${a} x ${b} = ?`
    answer = String(a * b)
  } else {
    const divisor = randomInt(2, difficulty === 'Qiyin' ? 15 : difficulty === "O'rta" ? 11 : 9)
    const quotient = randomInt(2, difficulty === 'Qiyin' ? 22 : difficulty === "O'rta" ? 16 : 12)
    prompt = `${divisor * quotient} / ${divisor} = ?`
    answer = String(quotient)
  }

  return createQuestion(prompt, answer, 'generated', `gen-${op}-${index}`)
}

const buildSingleDeck = (
  difficulty: Difficulty,
  enabledOps: BoxMathOperator[],
  teacherQuestions: TeacherBoxQuestion[],
  totalRounds: number,
  sideSeed: 'L' | 'R',
) => {
  const ops = enabledOps.length > 0 ? enabledOps : (['+', '-', 'x', '/'] as BoxMathOperator[])
  const teacherDeck = shuffle(
    teacherQuestions.filter((q) => q.prompt.trim() && q.answer.trim()),
  )
    .slice(0, Math.min(totalRounds, teacherQuestions.length))
    .map((q, idx) => createQuestion(q.prompt.trim(), q.answer.trim(), 'teacher', `${sideSeed}-teacher-${idx}`))

  const generatedCount = Math.max(0, totalRounds - teacherDeck.length)
  const generated = Array.from({ length: generatedCount }, (_, index) =>
    generateMathQuestion(ops[index % ops.length], difficulty, index + (sideSeed === 'R' ? 1000 : 0)),
  )

  return shuffle([...teacherDeck, ...generated]).slice(0, totalRounds)
}

const buildRoundPairs = (
  difficulty: Difficulty,
  enabledOps: BoxMathOperator[],
  teacherQuestions: TeacherBoxQuestion[],
  totalRounds: number,
) => {
  const left = buildSingleDeck(difficulty, enabledOps, teacherQuestions, totalRounds, 'L')
  const right = buildSingleDeck(difficulty, enabledOps, teacherQuestions, totalRounds, 'R')

  for (let i = 0; i < Math.min(left.length, right.length); i += 1) {
    if (left[i].prompt !== right[i].prompt) continue
    const swapIndex = right.findIndex((q, idx) => idx > i && q.prompt !== left[i].prompt)
    if (swapIndex >= 0) {
      const temp = right[i]
      right[i] = right[swapIndex]
      right[swapIndex] = temp
    }
  }

  return Array.from({ length: Math.min(left.length, right.length) }, (_, i) => ({
    left: left[i],
    right: right[i],
  }))
}

function BoxerAvatar({
  side,
  name,
  hp,
  hpPercent,
  accent,
  isAttacking,
  isHit,
  isKo,
}: {
  side: Side
  name: string
  hp: number
  hpPercent: number
  accent: string
  isAttacking: boolean
  isHit: boolean
  isKo: boolean
}) {
  const baseShift = side === 'left' ? 'translateX(18px)' : 'translateX(-18px)'
  const attackShift = isAttacking ? ` translateX(${side === 'left' ? '34px' : '-34px'}) rotate(${side === 'left' ? '-1.4deg' : '1.4deg'})` : ''
  const hitShift = isHit ? ` translateX(${side === 'left' ? '-18px' : '18px'}) rotate(${side === 'left' ? '1.5deg' : '-1.5deg'})` : ''
  const mixamoMode = isKo ? 'ko' : isAttacking ? 'attack' : isHit ? 'hit' : 'idle'

  return (
    <div
      className={`relative flex w-full max-w-[250px] flex-col items-center rounded-[1.6rem] border border-white/70 bg-white/92 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.14)] transition-all duration-300 ${
        isKo ? 'opacity-75 grayscale-[0.2]' : ''
      }`}
      style={{ transform: `${baseShift}${attackShift}${hitShift}` }}
    >
      <div className="w-full">
        <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
          <span>{name}</span>
          <span>{hp} HP</span>
        </div>
        <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full bg-gradient-to-r ${accent}`} style={{ width: `${hpPercent}%` }} />
        </div>
      </div>

      <MixamoFighterCanvas side={side} mode={mixamoMode} />
    </div>
  )
}

function BoxBattleArena({
  gameTitle,
  gameTone,
  leftTeamName = '1-Jamoa',
  rightTeamName = '2-Jamoa',
  initialDifficulty = "O'rta",
  initialEnabledOps = ['+', '-', 'x', '/'],
  teacherQuestions = [],
  setupPath = '/games/box-jang',
}: BoxBattleArenaProps) {
  const config = DIFFICULTY_CONFIG[initialDifficulty]
  const enabledOps = initialEnabledOps.length > 0 ? initialEnabledOps : (['+', '-', 'x', '/'] as BoxMathOperator[])
  const leftLabel = leftTeamName.trim() || '1-Jamoa'
  const rightLabel = rightTeamName.trim() || '2-Jamoa'

  const [roundPairs, setRoundPairs] = useState<RoundPair[]>(() =>
    buildRoundPairs(initialDifficulty, enabledOps, teacherQuestions, config.rounds),
  )
  const [phase, setPhase] = useState<'ready' | 'fight' | 'round-end' | 'finished'>('ready')
  const [started, setStarted] = useState(false)
  const [roundIndex, setRoundIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(config.roundSeconds)
  const [leftTeam, setLeftTeam] = useState<TeamState>(createTeam)
  const [rightTeam, setRightTeam] = useState<TeamState>(createTeam)
  const [roundWinner, setRoundWinner] = useState<Side | null>(null)
  const [roundMessage, setRoundMessage] = useState(
    "Boshlash tugmasini bosing. Har jamoaga alohida savol chiqadi, birinchi to'g'ri javob zarba beradi.",
  )
  const [attackFx, setAttackFx] = useState<{ attacker: Side | null; tick: number; hitStarted: boolean }>({
    attacker: null,
    tick: 0,
    hitStarted: false,
  })
  const [winner, setWinner] = useState<Winner | null>(null)

  const roundSettledRef = useRef(false)
  const roundGapTimerRef = useRef<number | null>(null)
  const startIntroTimerRef = useRef<number | null>(null)
  const attackFxResetTimerRef = useRef<number | null>(null)
  const attackFxHitStartTimerRef = useRef<number | null>(null)
  const leftPenaltyTimerRef = useRef<number | null>(null)
  const rightPenaltyTimerRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const punchSampleRef = useRef<HTMLAudioElement | null>(null)
  const bgmRef = useRef<HTMLAudioElement | null>(null)

  const currentPair = roundPairs[roundIndex]
  const totalRounds = roundPairs.length
  const sharedQuestion = currentPair?.left ?? currentPair?.right
  const leftQuestion = sharedQuestion
  const rightQuestion = sharedQuestion

  const clearTimers = useCallback(() => {
    if (startIntroTimerRef.current) window.clearTimeout(startIntroTimerRef.current)
    if (roundGapTimerRef.current) window.clearTimeout(roundGapTimerRef.current)
    if (attackFxResetTimerRef.current) window.clearTimeout(attackFxResetTimerRef.current)
    if (attackFxHitStartTimerRef.current) window.clearTimeout(attackFxHitStartTimerRef.current)
    if (leftPenaltyTimerRef.current) window.clearTimeout(leftPenaltyTimerRef.current)
    if (rightPenaltyTimerRef.current) window.clearTimeout(rightPenaltyTimerRef.current)
    startIntroTimerRef.current = null
    roundGapTimerRef.current = null
    attackFxResetTimerRef.current = null
    attackFxHitStartTimerRef.current = null
    leftPenaltyTimerRef.current = null
    rightPenaltyTimerRef.current = null
  }, [])

  const getAudioCtx = useCallback(() => {
    if (typeof window === 'undefined') return null
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    if (!audioCtxRef.current) audioCtxRef.current = new Ctx()
    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume().catch(() => {})
    }
    return audioCtxRef.current
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const audio = new Audio('/audio/mixkit-punch-with-boxing-gloves-2053.wav')
    audio.preload = 'auto'
    audio.volume = 0.92
    punchSampleRef.current = audio

    const bgm = new Audio('/audio/orqa%20fon.mp3')
    bgm.preload = 'auto'
    bgm.loop = true
    bgm.volume = 0.55
    bgmRef.current = bgm

    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause()
        bgmRef.current.currentTime = 0
        bgmRef.current = null
      }
      if (punchSampleRef.current) {
        punchSampleRef.current.pause()
        punchSampleRef.current = null
      }
    }
  }, [])

  const playBackgroundMusic = useCallback(() => {
    const bgm = bgmRef.current
    if (!bgm) return
    bgm.currentTime = 0
    const p = bgm.play()
    if (p && typeof p.catch === 'function') void p.catch(() => {})
  }, [])

  const stopBackgroundMusic = useCallback(() => {
    const bgm = bgmRef.current
    if (!bgm) return
    bgm.pause()
    bgm.currentTime = 0
  }, [])

  const playRingBellSound = useCallback(() => {
    const ctx = getAudioCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.11, now + 0.015)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.7)
    master.connect(ctx.destination)

    const partials = [
      { type: 'triangle' as OscillatorType, f1: 730, f2: 520, start: 0, stop: 0.62 },
      { type: 'sine' as OscillatorType, f1: 1180, f2: 820, start: 0.008, stop: 0.44 },
      { type: 'sine' as OscillatorType, f1: 490, f2: 340, start: 0.03, stop: 0.7 },
    ]
    partials.forEach(({ type, f1, f2, start, stop }) => {
      const osc = ctx.createOscillator()
      osc.type = type
      osc.frequency.setValueAtTime(f1, now + start)
      osc.frequency.exponentialRampToValueAtTime(f2, now + Math.max(start + 0.08, stop - 0.04))
      osc.connect(master)
      osc.start(now + start)
      osc.stop(now + stop)
    })
  }, [getAudioCtx])

  const playPunchSound = useCallback(() => {
    const sample = punchSampleRef.current
    if (sample) {
      try {
        sample.currentTime = 0
        sample.volume = 0.95
        void sample.play().catch(() => {})
        return
      } catch {
        // sample ishlamasa pastdagi synth fallback chaladi
      }
    }

    const ctx = getAudioCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(620, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)

    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(135, now)
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.18)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.18)

    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.09), ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    }
    const noise = ctx.createBufferSource()
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.setValueAtTime(320, now)
    noiseFilter.Q.value = 0.9
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.0001, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.11, now + 0.008)
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)
    noise.buffer = noiseBuffer
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    noise.start(now)
    noise.stop(now + 0.15)
  }, [getAudioCtx])

  const playHitOxxSound = useCallback(() => {
    const ctx = getAudioCtx()
    if (!ctx) return
    const now = ctx.currentTime

    const voiceGain = ctx.createGain()
    voiceGain.gain.setValueAtTime(0.0001, now)
    voiceGain.gain.exponentialRampToValueAtTime(0.085, now + 0.012)
    voiceGain.gain.exponentialRampToValueAtTime(0.02, now + 0.09)
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
    voiceGain.connect(ctx.destination)

    const source = ctx.createOscillator()
    source.type = 'sawtooth'
    source.frequency.setValueAtTime(210, now)
    source.frequency.exponentialRampToValueAtTime(135, now + 0.12)
    source.frequency.exponentialRampToValueAtTime(95, now + 0.28)

    const formant1 = ctx.createBiquadFilter()
    formant1.type = 'bandpass'
    formant1.frequency.setValueAtTime(520, now)
    formant1.Q.value = 3.6

    const formant2 = ctx.createBiquadFilter()
    formant2.type = 'bandpass'
    formant2.frequency.setValueAtTime(920, now)
    formant2.Q.value = 2.8

    const mix = ctx.createGain()
    mix.gain.value = 1

    source.connect(formant1)
    source.connect(formant2)
    formant1.connect(mix)
    formant2.connect(mix)
    mix.connect(voiceGain)
    source.start(now)
    source.stop(now + 0.3)

    // "x" / breath tail
    const hissBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.14), ctx.sampleRate)
    const data = hissBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    }
    const hiss = ctx.createBufferSource()
    hiss.buffer = hissBuffer
    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.setValueAtTime(1100, now)
    const hissGain = ctx.createGain()
    hissGain.gain.setValueAtTime(0.0001, now + 0.06)
    hissGain.gain.exponentialRampToValueAtTime(0.03, now + 0.12)
    hissGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
    hiss.connect(highpass)
    highpass.connect(hissGain)
    hissGain.connect(ctx.destination)
    hiss.start(now + 0.055)
    hiss.stop(now + 0.23)
  }, [getAudioCtx])

  const playWinnerFanfare = useCallback(() => {
    const ctx = getAudioCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [
      { freq: 523.25, start: 0, dur: 0.16, gain: 0.07, type: 'triangle' as OscillatorType },
      { freq: 659.25, start: 0.2, dur: 0.16, gain: 0.08, type: 'triangle' as OscillatorType },
      { freq: 783.99, start: 0.38, dur: 0.22, gain: 0.09, type: 'triangle' as OscillatorType },
      { freq: 1046.5, start: 0.64, dur: 0.56, gain: 0.12, type: 'sine' as OscillatorType },
    ]

    notes.forEach(({ freq, start, dur, gain, type }) => {
      const osc = ctx.createOscillator()
      const noteGain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, now + start)
      osc.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.992), now + start + dur)
      noteGain.gain.setValueAtTime(0.0001, now + start)
      noteGain.gain.exponentialRampToValueAtTime(gain, now + start + 0.02)
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
      osc.connect(noteGain)
      noteGain.connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + dur + 0.04)
    })
  }, [getAudioCtx])

  const playWinnerAnnouncement = useCallback(() => {
    playWinnerFanfare()
  }, [playWinnerFanfare])

  const updateTeam = useCallback((side: Side, updater: (prev: TeamState) => TeamState) => {
    if (side === 'left') setLeftTeam(updater)
    else setRightTeam(updater)
  }, [])

  const startRound = useCallback(
    (index: number) => {
      roundSettledRef.current = false
      setRoundIndex(index)
      setTimeLeft(config.roundSeconds)
      setRoundWinner(null)
      setAttackFx((prev) => ({ attacker: null, tick: prev.tick + 1, hitStarted: false }))
      setPhase('fight')
      setLeftTeam((prev) => ({
        ...prev,
        note: 'ABCD variantdan tanlang.',
        status: prev.hp <= 0 ? 'ko' : 'ready',
        cooldown: false,
        selectedChoice: null,
      }))
      setRightTeam((prev) => ({
        ...prev,
        note: 'ABCD variantdan tanlang.',
        status: prev.hp <= 0 ? 'ko' : 'ready',
        cooldown: false,
        selectedChoice: null,
      }))
      setRoundMessage(`${index + 1}-raund: ikkala jamoaga bir xil savol. Kim tez topadi?`)
      playRingBellSound()
    },
    [config.roundSeconds, playRingBellSound],
  )

  const resolveMatchWinner = useCallback(
    (reason: string) => {
      const result: Winner =
        leftTeam.hp === rightTeam.hp
          ? leftTeam.score === rightTeam.score
            ? leftTeam.hits === rightTeam.hits
              ? 'draw'
              : leftTeam.hits > rightTeam.hits
                ? 'left'
                : 'right'
            : leftTeam.score > rightTeam.score
              ? 'left'
              : 'right'
          : leftTeam.hp > rightTeam.hp
            ? 'left'
            : 'right'

      setWinner(result)
      setPhase('finished')
      setStarted(false)
      stopBackgroundMusic()
      setLeftTeam((prev) => ({
        ...prev,
        status: result === 'right' ? 'ko' : result === 'left' ? 'correct' : 'ready',
        note:
          result === 'left'
            ? `${leftLabel} g'olib bo'ldi.`
            : result === 'right'
              ? `${rightLabel} g'olib bo'ldi.`
              : 'Durang.',
      }))
      setRightTeam((prev) => ({
        ...prev,
        status: result === 'left' ? 'ko' : result === 'right' ? 'correct' : 'ready',
        note:
          result === 'right'
            ? `${rightLabel} g'olib bo'ldi.`
            : result === 'left'
              ? `${leftLabel} g'olib bo'ldi.`
              : 'Durang.',
      }))
      setRoundMessage(reason)
      playWinnerAnnouncement()
    },
    [
      leftLabel,
      leftTeam.hits,
      leftTeam.hp,
      leftTeam.score,
      playWinnerAnnouncement,
      rightLabel,
      rightTeam.hits,
      rightTeam.hp,
      rightTeam.score,
      stopBackgroundMusic,
    ],
  )

  const goNextRoundOrFinish = useCallback(
    (koReason: string) => {
      const next = roundIndex + 1
      if (leftTeam.hp <= 0 || rightTeam.hp <= 0) {
        resolveMatchWinner(koReason)
        return
      }
      if (next >= totalRounds) {
        resolveMatchWinner("Raundlar tugadi. Yakuniy g'olib hisoblandi.")
        return
      }
      startRound(next)
    },
    [leftTeam.hp, resolveMatchWinner, rightTeam.hp, roundIndex, startRound, totalRounds],
  )

  const setPenalty = (side: Side) => {
    updateTeam(side, (prev) => ({ ...prev, cooldown: true }))
    const clear = () => updateTeam(side, (prev) => ({ ...prev, cooldown: false }))

    if (side === 'left') {
      if (leftPenaltyTimerRef.current) window.clearTimeout(leftPenaltyTimerRef.current)
      leftPenaltyTimerRef.current = window.setTimeout(clear, 520)
    } else {
      if (rightPenaltyTimerRef.current) window.clearTimeout(rightPenaltyTimerRef.current)
      rightPenaltyTimerRef.current = window.setTimeout(clear, 520)
    }
  }

  const applyRoundHit = useCallback(
    (winnerSide: Side, cause: 'correct' | 'opponent-wrong' = 'correct') => {
      if (!leftQuestion || !rightQuestion || phase !== 'fight' || roundSettledRef.current) return
      roundSettledRef.current = true
      setPhase('round-end')
      setRoundWinner(winnerSide)
      setAttackFx((prev) => ({ attacker: winnerSide, tick: prev.tick + 1, hitStarted: false }))
      const attackResetDelayMs = Math.min(980, Math.max(860, config.roundGapMs - 40))

      const loserSide: Side = winnerSide === 'left' ? 'right' : 'left'
      const winnerName = winnerSide === 'left' ? leftLabel : rightLabel
      const loserName = loserSide === 'left' ? leftLabel : rightLabel
      const winnerSnapshot = winnerSide === 'left' ? leftTeam : rightTeam
      const nextCombo = winnerSnapshot.combo + 1
      const gain =
        cause === 'correct'
          ? config.baseScore + timeLeft * config.speedScore + nextCombo * config.comboBonus
          : Math.max(12, Math.floor(config.baseScore * 0.45) + Math.floor(timeLeft * config.speedScore * 0.35))
      const damage = Math.min(45, config.baseDamage + Math.floor(timeLeft / 2) + Math.floor(nextCombo / 2))

      updateTeam(winnerSide, (prev) => {
        return {
          ...prev,
          score: prev.score + gain,
          hits: prev.hits + 1,
          correct: cause === 'correct' ? prev.correct + 1 : prev.correct,
          combo: nextCombo,
          bestCombo: Math.max(prev.bestCombo, nextCombo),
          status: 'correct',
          note:
            cause === 'correct'
              ? `To'g'ri javob! +${gain} ball | -${damage} HP`
              : `Raqib xato qildi. Bonus zarba! +${gain} ball | -${damage} HP`,
        }
      })

      updateTeam(loserSide, (prev) => {
        const nextHp = Math.max(0, prev.hp - damage)
        return {
          ...prev,
          hp: nextHp,
          combo: 0,
          status: 'hit',
          note: nextHp <= 0 ? `${winnerName} yakuniy zarbani berdi.` : `${winnerName} zarba berdi.`,
        }
      })

      setRoundMessage(
        cause === 'correct'
          ? `${winnerName} birinchi to'g'ri javob bilan ${loserName}ga zarba berdi.`
          : `${loserName} xato javob berdi. ${winnerName} qarshi zarba berdi.`,
      )

      // Avval hujumchi ko'rinsin, kontakt nuqtasida ovoz va hit animatsiya ishga tushsin.
      if (attackFxHitStartTimerRef.current) window.clearTimeout(attackFxHitStartTimerRef.current)
      attackFxHitStartTimerRef.current = window.setTimeout(() => {
        setAttackFx((prev) => (prev.attacker === winnerSide ? { ...prev, hitStarted: true } : prev))
        playPunchSound()
        playHitOxxSound()
        attackFxHitStartTimerRef.current = null
      }, BOX_ATTACK_CONTACT_DELAY_MS)

      // Bitta aniq zarbadan keyin fighter keyingi raunddan oldin joyiga qaytsin.
      if (attackFxResetTimerRef.current) window.clearTimeout(attackFxResetTimerRef.current)
      attackFxResetTimerRef.current = window.setTimeout(() => {
        setAttackFx((prev) => ({ attacker: null, tick: prev.tick + 1, hitStarted: false }))
        attackFxResetTimerRef.current = null
      }, attackResetDelayMs)

      if (roundGapTimerRef.current) window.clearTimeout(roundGapTimerRef.current)
      roundGapTimerRef.current = window.setTimeout(() => {
        goNextRoundOrFinish(`${winnerName} nokaut bilan g'alaba qozondi.`)
      }, config.roundGapMs)
    },
    [
      config.baseDamage,
      config.baseScore,
      config.comboBonus,
      config.roundGapMs,
      config.speedScore,
      goNextRoundOrFinish,
      leftLabel,
      leftQuestion,
      leftTeam,
      phase,
      rightLabel,
      rightQuestion,
      rightTeam,
      timeLeft,
      updateTeam,
      playPunchSound,
      playHitOxxSound,
    ],
  )

  const handleChoice = (side: Side, index: number) => {
    if (!started || phase !== 'fight') return
    if (roundSettledRef.current) return

    const question = side === 'left' ? leftQuestion : rightQuestion
    const team = side === 'left' ? leftTeam : rightTeam
    if (!question || !team || team.cooldown || team.hp <= 0 || team.selectedChoice !== null) return

    const correct = index === question.correctIndex
    updateTeam(side, (prev) => ({ ...prev, selectedChoice: index }))

    if (correct) {
      applyRoundHit(side)
      return
    }

    const otherSide: Side = side === 'left' ? 'right' : 'left'
    const otherTeam = otherSide === 'left' ? leftTeam : rightTeam
    const otherQuestion = otherSide === 'left' ? leftQuestion : rightQuestion
    const otherAnsweredWrong =
      !!otherQuestion &&
      otherTeam.selectedChoice !== null &&
      otherTeam.selectedChoice !== otherQuestion.correctIndex

    updateTeam(side, (prev) => ({
      ...prev,
      wrong: prev.wrong + 1,
      combo: 0,
      status: 'wrong',
      note: "Xato javob. Endi raqib javob beradi.",
    }))

    if (otherAnsweredWrong) {
      roundSettledRef.current = true
      setPhase('round-end')
      setRoundWinner(null)

      const answerText = question.options[question.correctIndex] ?? '-'
      setLeftTeam((prev) => ({
        ...prev,
        combo: 0,
        status: prev.hp <= 0 ? 'ko' : 'wrong',
        note: `Ikkalasi ham xato. To'g'ri: ${answerText}`,
      }))
      setRightTeam((prev) => ({
        ...prev,
        combo: 0,
        status: prev.hp <= 0 ? 'ko' : 'wrong',
        note: `Ikkalasi ham xato. To'g'ri: ${answerText}`,
      }))
      setRoundMessage("Ikkala jamoa ham xato javob berdi. Keyingi raundga o'tildi.")

      if (roundGapTimerRef.current) window.clearTimeout(roundGapTimerRef.current)
      roundGapTimerRef.current = window.setTimeout(() => {
        goNextRoundOrFinish("Raundlar tugadi. Yakuniy g'olib hisoblandi.")
      }, config.roundGapMs)
      return
    }

    setRoundMessage(
      `${side === 'left' ? leftLabel : rightLabel} xato javob berdi. ${otherSide === 'left' ? leftLabel : rightLabel} javob beradi.`,
    )
  }

  const startGame = () => {
    clearTimers()
    playBackgroundMusic()
    const pairs = buildRoundPairs(initialDifficulty, enabledOps, teacherQuestions, config.rounds)
    setRoundPairs(pairs)
    setLeftTeam(createTeam())
    setRightTeam(createTeam())
    setWinner(null)
    setStarted(true)
    setPhase('ready')
    setAttackFx((prev) => ({ attacker: null, tick: prev.tick + 1, hitStarted: false }))
    setRoundMessage("Tayyorlaning... Birinchi raund boshlanishidan oldin arena ko'rinadi.")
    setLeftTeam((prev) => ({
      ...prev,
      note: 'Tayyorlaning...',
      status: prev.hp <= 0 ? 'ko' : 'ready',
      cooldown: false,
      selectedChoice: null,
    }))
    setRightTeam((prev) => ({
      ...prev,
      note: 'Tayyorlaning...',
      status: prev.hp <= 0 ? 'ko' : 'ready',
      cooldown: false,
      selectedChoice: null,
    }))
    startIntroTimerRef.current = window.setTimeout(() => {
      startRound(0)
      startIntroTimerRef.current = null
    }, 900)
  }

  const resetGame = () => {
    clearTimers()
    stopBackgroundMusic()
    setRoundPairs(buildRoundPairs(initialDifficulty, enabledOps, teacherQuestions, config.rounds))
    setStarted(false)
    setPhase('ready')
    setRoundIndex(0)
    setTimeLeft(config.roundSeconds)
    setLeftTeam(createTeam())
    setRightTeam(createTeam())
    setRoundWinner(null)
    setWinner(null)
    roundSettledRef.current = false
    setRoundMessage("Boshlash tugmasini bosing. Ikkala jamoaga bir xil savol chiqadi, birinchi to'g'ri javob zarba beradi.")
  }

  useEffect(() => {
    if (phase !== 'fight' || !started) return
    const timer = window.setInterval(() => setTimeLeft((prev) => Math.max(prev - 1, 0)), 1000)
    return () => window.clearInterval(timer)
  }, [phase, started])

  useEffect(() => {
    if (phase !== 'fight' || !started) return
    if (timeLeft > 0 || roundSettledRef.current) return

    roundSettledRef.current = true
    setPhase('round-end')
    setRoundWinner(null)
    setLeftTeam((prev) => ({ ...prev, combo: 0, status: prev.hp <= 0 ? 'ko' : 'ready', note: `Vaqt tugadi. To'g'ri: ${leftQuestion?.options[leftQuestion.correctIndex] ?? '-'}` }))
    setRightTeam((prev) => ({ ...prev, combo: 0, status: prev.hp <= 0 ? 'ko' : 'ready', note: `Vaqt tugadi. To'g'ri: ${rightQuestion?.options[rightQuestion.correctIndex] ?? '-'}` }))
    setRoundMessage('Vaqt tugadi. Bu raundda hech kim zarba bermadi.')

    if (roundGapTimerRef.current) window.clearTimeout(roundGapTimerRef.current)
    roundGapTimerRef.current = window.setTimeout(() => {
      goNextRoundOrFinish("Raundlar tugadi. Yakuniy g'olib hisoblandi.")
    }, config.roundGapMs)
  }, [config.roundGapMs, goNextRoundOrFinish, leftQuestion, phase, rightQuestion, started, timeLeft])

  useEffect(() => () => clearTimers(), [clearTimers])

  const leftHpPercent = Math.max(0, Math.min(100, leftTeam.hp))
  const rightHpPercent = Math.max(0, Math.min(100, rightTeam.hp))
  const progress = totalRounds > 0 ? Math.round((Math.min(roundIndex + (phase === 'ready' ? 0 : 1), totalRounds) / totalRounds) * 100) : 0
  const opsLabel = enabledOps.join(' ')
  const teacherCount = teacherQuestions.filter((q) => q.prompt.trim() && q.answer.trim()).length
  const leftMixamoMode =
    phase === 'finished'
      ? winner === 'left'
        ? 'winner'
        : winner === 'right'
          ? 'ko'
          : 'idle'
      : attackFx.attacker === 'left' && phase === 'round-end'
        ? 'attack'
        : attackFx.attacker === 'right' && phase === 'round-end' && attackFx.hitStarted
          ? 'hit'
          : 'idle'
  const rightMixamoMode =
    phase === 'finished'
      ? winner === 'right'
        ? 'winner'
        : winner === 'left'
          ? 'ko'
          : 'idle'
      : attackFx.attacker === 'right' && phase === 'round-end'
        ? 'attack'
        : attackFx.attacker === 'left' && phase === 'round-end' && attackFx.hitStarted
          ? 'hit'
          : 'idle'
  const winnerTeamName = winner === 'left' ? leftLabel : winner === 'right' ? rightLabel : ''
  const winnerBannerTone =
    winner === 'left'
      ? 'border-cyan-300 bg-cyan-50/95 text-cyan-950 shadow-[0_20px_50px_rgba(14,165,233,0.28)]'
      : 'border-rose-300 bg-rose-50/95 text-rose-950 shadow-[0_20px_50px_rgba(244,63,94,0.26)]'
  const winnerBannerAccent = winner === 'left' ? 'from-cyan-500 to-blue-600' : 'from-fuchsia-500 to-rose-600'
  const showArenaPreview = phase === 'ready' && !started

  const renderQuestionCard = (
    side: Side,
    team: TeamState,
    question: BoxQuestion | undefined,
    accent: string,
    borderTone: string,
    compact = false,
  ) => {
    const answeredThisRound = started && phase === 'fight' && team.selectedChoice !== null

    return (
      <div
        className={`rounded-2xl border ${compact ? 'h-[20rem] p-2.5 sm:h-[24rem] lg:h-[28rem] shadow-[0_14px_34px_rgba(15,23,42,0.14)] backdrop-blur-sm' : 'p-3'} ${borderTone} ${
          compact ? 'flex flex-col overflow-hidden' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
            {side === 'left' ? leftLabel : rightLabel}
          </p>
          <div className="flex items-center gap-1.5">
            {answeredThisRound ? (
              <span className={`rounded-full border border-amber-300 bg-amber-50 text-amber-700 ${compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'} font-extrabold uppercase tracking-[0.12em]`}>
                Javob berildi
              </span>
            ) : null}
            <span className={`rounded-full bg-gradient-to-r ${compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'} font-extrabold uppercase tracking-[0.12em] text-white ${accent}`}>
              {question?.source === 'teacher' ? 'Teacher' : 'Auto'}
            </span>
          </div>
        </div>

        <p className={`mt-2 ${compact ? 'min-h-[34px] text-sm line-clamp-2' : 'min-h-[56px] text-base sm:text-lg'} font-extrabold leading-tight text-slate-900`}>
          {question?.prompt ?? 'Savol kutilmoqda'}
        </p>

        <div className={`mt-2.5 grid grid-cols-1 ${compact ? 'gap-1.5' : 'gap-2'} ${compact ? 'flex-1 content-start' : ''}`}>
          {question?.options.map((option, idx) => {
            const isPicked = team.selectedChoice === idx
            const isCorrect = idx === question.correctIndex
            const lockedForChoices =
              phase !== 'fight' || !started || team.cooldown || team.hp <= 0 || team.selectedChoice !== null

            const toneClass = !lockedForChoices
              ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300'
              : phase === 'fight'
                ? isPicked
                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                  : 'border-slate-200 bg-slate-100 text-slate-500'
                : isCorrect
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : isPicked
                    ? 'border-rose-300 bg-rose-50 text-rose-800'
                    : 'border-slate-200 bg-slate-100 text-slate-500'

            return (
              <button
                key={`${question.id}-${idx}`}
                type="button"
                onClick={() => handleChoice(side, idx)}
                disabled={lockedForChoices}
                className={`arena-3d-press flex items-center gap-2 rounded-xl border ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} text-left font-extrabold transition ${toneClass} ${
                  lockedForChoices ? 'cursor-not-allowed' : ''
                }`}
              >
                <span className={`grid shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 font-black text-slate-700 ${compact ? 'h-6 w-6 text-[10px]' : 'h-7 w-7 text-xs'}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="line-clamp-1">{option}</span>
              </button>
            )
          })}
        </div>

        <p
          className={`mt-2.5 rounded-xl border ${compact ? 'mt-auto px-2 py-1.5 text-[11px] line-clamp-2' : 'px-3 py-2 text-xs'} font-extrabold ${
            team.status === 'correct'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : team.status === 'wrong'
                ? 'border-rose-300 bg-rose-50 text-rose-700'
                : team.status === 'hit'
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : team.status === 'ko'
                    ? 'border-slate-400 bg-slate-200 text-slate-700'
                    : 'border-slate-200 bg-white text-slate-600'
          }`}
        >
          {team.cooldown ? 'Penalty...' : team.note}
        </p>
      </div>
    )
  }

  return (
    <section className="glass-card arena-3d-shell relative p-4 sm:p-6" data-aos="fade-up" data-aos-delay="80">
      <div className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-8 h-56 w-56 rounded-full bg-fuchsia-200/35 blur-3xl" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-700">
            Math Box Arena
          </p>
          <h2 className="mt-2 font-kid text-4xl text-slate-900 sm:text-5xl">{gameTitle}</h2>
          <p className="mt-1 text-sm font-bold text-slate-600">
            Ikkita odamcha yaqin duelda. Har jamoaga alohida ABCD savol chiqadi.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={setupPath}
            className="arena-3d-press rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5"
          >
            {'< '}Orqaga
          </Link>
          <button
            type="button"
            onClick={startGame}
            className={`arena-3d-press rounded-xl bg-gradient-to-r px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
          >
            {started ? 'Qayta start' : "O'yinni boshlash"}
          </button>
          <button
            type="button"
            onClick={resetGame}
            className="arena-3d-press rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5"
          >
            Nolga tushir
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Raund</p><p className="mt-1 font-kid text-3xl text-slate-900">{Math.min(roundIndex + (phase === 'ready' ? 0 : 1), totalRounds)}/{totalRounds}</p></div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Timer</p><p className={`mt-1 font-kid text-3xl ${timeLeft <= 4 && phase === 'fight' ? 'text-rose-600' : 'text-slate-900'}`}>{started && phase !== 'finished' ? `${timeLeft}s` : '--'}</p></div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Daraja</p><p className="mt-1 text-base font-extrabold text-slate-700">{initialDifficulty}</p></div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Amallar</p><p className="mt-1 text-base font-extrabold text-slate-700">{opsLabel}</p></div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Teacher</p><p className="mt-1 text-base font-extrabold text-slate-700">{teacherCount}</p></div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Progress</p><p className="mt-1 text-base font-extrabold text-slate-700">{progress}%</p></div>
      </div>

      <div className="mt-4 rounded-[1.8rem] border border-slate-200 bg-white p-3 shadow-soft sm:p-4">
        <div className="rounded-[1.4rem] border border-slate-200 bg-[linear-gradient(160deg,#f8fbff_0%,#eef8ff_52%,#fff4dd_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">
              Duel arena (2 fighter bitta joyda)
            </p>
            <p className={`rounded-full px-3 py-1 text-xs font-extrabold ${phase === 'fight' ? 'bg-emerald-100 text-emerald-700' : phase === 'round-end' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              {phase === 'fight' ? 'Raund aktiv' : phase === 'round-end' ? 'Natija' : phase === 'finished' ? 'Yakun' : 'Tayyor'}
            </p>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-cyan-700">{leftLabel}</p>
                <p className="text-xs font-extrabold text-slate-600">{leftTeam.hp} HP</p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/70">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${leftHpPercent}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50/50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-fuchsia-700">{rightLabel}</p>
                <p className="text-xs font-extrabold text-slate-600">{rightTeam.hp} HP</p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/70">
                <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500" style={{ width: `${rightHpPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-3 grid items-stretch gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)_minmax(0,1fr)]">
            <div className="order-2 h-full xl:order-1">
              {renderQuestionCard('left', leftTeam, leftQuestion, 'from-cyan-500 to-blue-500', 'border-cyan-200 bg-cyan-50/35', true)}
            </div>

            <div className="order-1 xl:order-2">
              <div className="relative">
                {phase === 'finished' && winner !== 'draw' ? (
                  <div className="pointer-events-none absolute inset-x-0 -top-7 z-20 flex justify-center">
                    <div className={`min-w-[13rem] rounded-[1.6rem] border px-5 py-3 text-center backdrop-blur ${winnerBannerTone}`}>
                      <p className={`bg-gradient-to-r ${winnerBannerAccent} bg-clip-text text-[0.7rem] font-black uppercase tracking-[0.34em] text-transparent sm:text-xs`}>
                        WINNNNER
                      </p>
                      <p className="mt-1 text-sm font-black uppercase tracking-[0.16em] sm:text-base">
                        {winnerTeamName}
                      </p>
                    </div>
                  </div>
                ) : null}
                <MixamoDuelCanvas
                  leftMode={leftMixamoMode}
                  rightMode={rightMixamoMode}
                  showReadyHint={false}
                  preview={showArenaPreview}
                />
              </div>
            </div>

            <div className="order-3 h-full xl:order-3">
              {renderQuestionCard('right', rightTeam, rightQuestion, 'from-fuchsia-500 to-rose-500', 'border-fuchsia-200 bg-fuchsia-50/35', true)}
            </div>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/80">
            <div className={`h-full rounded-full bg-gradient-to-r ${gameTone}`} style={{ width: `${progress}%` }} />
          </div>

          <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm font-extrabold ${
            roundWinner ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : phase === 'round-end' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
          }`}>
            {roundMessage}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 lg:col-span-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{leftLabel}</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{leftTeam.score} ball • {leftTeam.hits} zarba • {leftTeam.correct} to'g'ri • HP {leftTeam.hp}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 lg:col-span-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{rightLabel}</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{rightTeam.score} ball • {rightTeam.hits} zarba • {rightTeam.correct} to'g'ri • HP {rightTeam.hp}</p>
        </div>
      </div>

    </section>
  )
}

export default BoxBattleArena
