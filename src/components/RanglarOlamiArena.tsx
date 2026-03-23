import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfettiOverlay from './ConfettiOverlay'
import { TeamCount } from '../lib/teamMode'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Side = 'left' | 'right'
type Winner = Side | 'draw'
type Phase = 'ready' | 'input' | 'result' | 'finished'
type TeamStatus = 'waiting' | 'correct' | 'wrong' | 'timeout'
type ColorMode =
  | 'text-color'
  | 'word-name'
  | 'panel-color'
  | 'same-word-text'
  | 'same-word-panel'
  | 'all-different'

export type TeacherRanglarChallenge = {
  prompt: string
  mode: ColorMode
  targetKey?: string
}

type RanglarOlamiArenaProps = {
  gameTitle: string
  gameTone: string
  leftTeamName?: string
  rightTeamName?: string
  teamCount?: TeamCount
  initialDifficulty?: Difficulty
  setupPath?: string
  teacherChallenges?: TeacherRanglarChallenge[]
}

type DifficultyConfig = {
  rounds: number
  time: number
  modes: ColorMode[]
  basePoints: number
  speedBonusPerSecond: number
  comboBonus: number
  nextRoundMs: number
}

type ColorToken = {
  key: string
  label: string
  hex: string
  chipText: string
}

type ColorCard = {
  id: string
  wordKey: string
  textColorKey: string
  panelColorKey: string
}

type ColorRoundTask = {
  id: string
  mode: ColorMode
  targetKey: string | null
  cards: ColorCard[]
  correctIndex: number
  bonusRound: boolean
  teacherPrompt?: string
  source?: 'system' | 'teacher'
}

type TeamState = {
  score: number
  roundsWon: number
  streak: number
  bestStreak: number
  selectedIndex: number | null
  status: TeamStatus
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  Oson: {
    rounds: 10,
    time: 20,
    modes: ['text-color', 'word-name', 'panel-color'],
    basePoints: 16,
    speedBonusPerSecond: 1,
    comboBonus: 3,
    nextRoundMs: 1350,
  },
  "O'rta": {
    rounds: 12,
    time: 16,
    modes: ['text-color', 'word-name', 'panel-color', 'same-word-text', 'same-word-panel'],
    basePoints: 20,
    speedBonusPerSecond: 2,
    comboBonus: 4,
    nextRoundMs: 1250,
  },
  Qiyin: {
    rounds: 14,
    time: 13,
    modes: ['text-color', 'word-name', 'panel-color', 'same-word-text', 'same-word-panel', 'all-different'],
    basePoints: 24,
    speedBonusPerSecond: 3,
    comboBonus: 5,
    nextRoundMs: 1180,
  },
}

// Faqat 12 ta asosiy rang ishlatiladi
const COLOR_BANK: ColorToken[] = [
  { key: 'qizil', label: 'Qizil', hex: '#ef4444', chipText: '#ffffff' },
  { key: 'kok', label: "Ko'k", hex: '#2563eb', chipText: '#ffffff' },
  { key: 'yashil', label: 'Yashil', hex: '#22c55e', chipText: '#062b11' },
  { key: 'sariq', label: 'Sariq', hex: '#facc15', chipText: '#422006' },
  { key: 'toq-sariq', label: "To'q sariq", hex: '#f97316', chipText: '#ffffff' },
  { key: 'binafsha', label: 'Binafsha', hex: '#8b5cf6', chipText: '#ffffff' },
  { key: 'pushti', label: 'Pushti', hex: '#ec4899', chipText: '#ffffff' },
  { key: 'havorang', label: 'Havorang', hex: '#38bdf8', chipText: '#083344' },
  { key: 'jigarrang', label: 'Jigarrang', hex: '#92400e', chipText: '#ffffff' },
  { key: 'kulrang', label: 'Kulrang', hex: '#9ca3af', chipText: '#111827' },
  { key: 'qora', label: 'Qora', hex: '#111827', chipText: '#ffffff' },
  { key: 'oq', label: 'Oq', hex: '#ffffff', chipText: '#111827' },
]

const COLOR_BY_KEY = Object.fromEntries(COLOR_BANK.map((item) => [item.key, item] satisfies [string, ColorToken]))
const COLOR_KEYS = new Set(COLOR_BANK.map((item) => item.key))

const createTeamState = (): TeamState => ({
  score: 0,
  roundsWon: 0,
  streak: 0,
  bestStreak: 0,
  selectedIndex: null,
  status: 'waiting',
})

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

const pickRandom = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]

const pickColorKey = (exclude: string[] = []) => {
  const blocked = new Set(exclude)
  const options = COLOR_BANK.filter((item) => !blocked.has(item.key))
  return pickRandom(options).key
}

const matchesMode = (card: ColorCard, mode: ColorMode, targetKey: string | null) => {
  if (mode === 'text-color') return card.textColorKey === targetKey
  if (mode === 'word-name') return card.wordKey === targetKey
  if (mode === 'panel-color') return card.panelColorKey === targetKey
  if (mode === 'same-word-text') return card.wordKey === card.textColorKey
  if (mode === 'same-word-panel') return card.wordKey === card.panelColorKey
  return (
    card.wordKey !== card.textColorKey &&
    card.wordKey !== card.panelColorKey &&
    card.textColorKey !== card.panelColorKey
  )
}

const buildCorrectCard = (mode: ColorMode, targetKey: string | null): ColorCard => {
  if (mode === 'text-color') {
    if (!targetKey) throw new Error('targetKey is required for text-color mode')
    const wordKey = pickColorKey([targetKey])
    const panelColorKey = pickColorKey([targetKey, wordKey])
    return {
      id: `card-correct-${Math.random().toString(36).slice(2, 7)}`,
      wordKey,
      textColorKey: targetKey,
      panelColorKey,
    }
  }
  if (mode === 'word-name') {
    if (!targetKey) throw new Error('targetKey is required for word-name mode')
    const textColorKey = pickColorKey([targetKey])
    const panelColorKey = pickColorKey([targetKey, textColorKey])
    return {
      id: `card-correct-${Math.random().toString(36).slice(2, 7)}`,
      wordKey: targetKey,
      textColorKey,
      panelColorKey,
    }
  }
  if (mode === 'panel-color') {
    if (!targetKey) throw new Error('targetKey is required for panel-color mode')
    const wordKey = pickColorKey([targetKey])
    const textColorKey = pickColorKey([targetKey, wordKey])
    return {
      id: `card-correct-${Math.random().toString(36).slice(2, 7)}`,
      wordKey,
      textColorKey,
      panelColorKey: targetKey,
    }
  }
  if (mode === 'same-word-text') {
    const base = pickColorKey()
    const panel = pickColorKey([base])
    return {
      id: `card-correct-${Math.random().toString(36).slice(2, 7)}`,
      wordKey: base,
      textColorKey: base,
      panelColorKey: panel,
    }
  }
  if (mode === 'same-word-panel') {
    const base = pickColorKey()
    const text = pickColorKey([base])
    return {
      id: `card-correct-${Math.random().toString(36).slice(2, 7)}`,
      wordKey: base,
      textColorKey: text,
      panelColorKey: base,
    }
  }
  const wordKey = pickColorKey()
  const textColorKey = pickColorKey([wordKey])
  const panelColorKey = pickColorKey([wordKey, textColorKey])
  return {
    id: `card-correct-${Math.random().toString(36).slice(2, 7)}`,
    wordKey,
    textColorKey,
    panelColorKey,
  }
}

const buildDecoyCard = (mode: ColorMode, targetKey: string | null, used: Set<string>): ColorCard => {
  let guard = 0
  while (guard < 240) {
    guard += 1
    const wordKey = pickColorKey()
    const textColorKey = pickColorKey([wordKey])
    const panelColorKey = pickColorKey([textColorKey])
    const card: ColorCard = {
      id: `card-${Math.random().toString(36).slice(2, 7)}`,
      wordKey,
      textColorKey,
      panelColorKey,
    }
    const signature = `${wordKey}|${textColorKey}|${panelColorKey}`
    if (used.has(signature)) continue
    if (matchesMode(card, mode, targetKey)) continue
    used.add(signature)
    return card
  }

  // fallback (amaliyotda bu joyga deyarli tushmaydi)
  const fallback: ColorCard = {
    id: `card-fallback-${Math.random().toString(36).slice(2, 7)}`,
    wordKey: pickColorKey(targetKey ? [targetKey] : []),
    textColorKey: pickColorKey(targetKey ? [targetKey] : []),
    panelColorKey: pickColorKey(targetKey ? [targetKey] : []),
  }
  return fallback
}

const createModeSequence = (difficulty: Difficulty) => {
  const config = DIFFICULTY_CONFIG[difficulty]
  const rounds = config.rounds
  const plan: ColorMode[] = []
  let previous: ColorMode | null = null

  while (plan.length < rounds) {
    let block = shuffle(config.modes)
    if (previous && block[0] === previous) {
      const idx = block.findIndex((item) => item !== previous)
      if (idx > 0) {
        const [next] = block.splice(idx, 1)
        block = [next, ...block]
      }
    }
    for (const mode of block) {
      if (plan.length >= rounds) break
      if (previous && previous === mode) continue
      plan.push(mode)
      previous = mode
    }
  }

  return plan
}

const isTargetMode = (mode: ColorMode) =>
  mode === 'text-color' || mode === 'word-name' || mode === 'panel-color'

const buildRoundTask = (
  mode: ColorMode,
  roundNumber: number,
  opts?: { teacherPrompt?: string; teacherTargetKey?: string | null; source?: 'system' | 'teacher' },
): ColorRoundTask => {
  const targetKey =
    opts?.teacherTargetKey !== undefined
      ? opts.teacherTargetKey
      : isTargetMode(mode)
        ? pickRandom(COLOR_BANK).key
        : null
  const correctIndex = Math.floor(Math.random() * 4)
  const cards: ColorCard[] = []
  const used = new Set<string>()
  const correctCard = buildCorrectCard(mode, targetKey)
  used.add(`${correctCard.wordKey}|${correctCard.textColorKey}|${correctCard.panelColorKey}`)

  for (let index = 0; index < 4; index += 1) {
    if (index === correctIndex) {
      cards.push(correctCard)
    } else {
      cards.push(buildDecoyCard(mode, targetKey, used))
    }
  }

  return {
    id: `rang-${roundNumber}-${Math.random().toString(36).slice(2, 8)}`,
    mode,
    targetKey,
    cards,
    correctIndex,
    bonusRound: roundNumber % 4 === 0,
    teacherPrompt: opts?.teacherPrompt,
    source: opts?.source ?? 'system',
  }
}

const createDeck = (difficulty: Difficulty, teacherChallenges: TeacherRanglarChallenge[] = []) => {
  const modePlan = createModeSequence(difficulty)
  const rounds = DIFFICULTY_CONFIG[difficulty].rounds

  const teacherTasks = teacherChallenges
    .filter((item) => item && typeof item.prompt === 'string' && item.prompt.trim().length > 0)
    .filter((item) => {
      if (isTargetMode(item.mode)) {
        return typeof item.targetKey === 'string' && COLOR_KEYS.has(item.targetKey)
      }
      return true
    })
    .slice(0, rounds)
    .map((item, index) =>
      buildRoundTask(item.mode, index + 1, {
        teacherPrompt: item.prompt.trim(),
        teacherTargetKey: isTargetMode(item.mode) ? (item.targetKey ?? null) : null,
        source: 'teacher',
      }),
    )

  const generatedTasks = modePlan.map((mode, index) =>
    buildRoundTask(mode, index + 1, { source: 'system' }),
  )

  const result: ColorRoundTask[] = []
  let t = 0
  let g = 0
  while (result.length < rounds) {
    const useTeacher = t < teacherTasks.length && (result.length % 2 === 0 || g >= generatedTasks.length)
    if (useTeacher) {
      const task = teacherTasks[t]
      result.push({ ...task, id: `rang-${result.length + 1}-teacher-${t}` })
      t += 1
      continue
    }
    if (g < generatedTasks.length) {
      const task = generatedTasks[g]
      result.push({ ...task, id: `rang-${result.length + 1}-sys-${g}` })
      g += 1
      continue
    }
    break
  }

  return result
}

const modeLabel = (mode: ColorMode) => {
  if (mode === 'text-color') return 'Matn rangi'
  if (mode === 'word-name') return "Yozuv nomi"
  if (mode === 'panel-color') return 'Panel rangi'
  if (mode === 'same-word-text') return "Yozuv = Matn rangi"
  if (mode === 'same-word-panel') return "Yozuv = Panel rangi"
  return 'Uchtalasi har xil'
}

const modePrompt = (mode: ColorMode, target?: ColorToken, teacherPrompt?: string) => {
  if (teacherPrompt?.trim()) return teacherPrompt.trim()
  if (mode === 'same-word-text') return "Qaysi kartada yozilgan so'z va matn rangi bir xil?"
  if (mode === 'same-word-panel') return "Qaysi kartada yozilgan so'z va panel rangi bir xil?"
  if (mode === 'all-different') return "Qaysi kartada yozuv, matn rangi va panel rangi uchalasi ham har xil?"
  if (!target) return 'To`g`ri kartani toping'
  if (mode === 'text-color') return `Qaysi kartada yozuv rangi "${target.label}"?`
  if (mode === 'word-name') return `Qaysi kartada yozilgan so'z "${target.label}"?`
  return `Qaysi kartada rang paneli "${target.label}"?`
}

function RanglarOlamiArena({
  gameTitle,
  gameTone,
  leftTeamName = '1-Jamoa',
  rightTeamName = '2-Jamoa',
  teamCount = 2,
  initialDifficulty = "O'rta",
  setupPath = '/games/ranglar-olami',
  teacherChallenges = [],
}: RanglarOlamiArenaProps) {
  const config = DIFFICULTY_CONFIG[initialDifficulty]
  const totalRounds = config.rounds
  const leftLabel = leftTeamName.trim() || '1-Jamoa'
  const rightLabel = rightTeamName.trim() || '2-Jamoa'
  const isSoloMode = teamCount === 1

  const [deck, setDeck] = useState<ColorRoundTask[]>(() => createDeck(initialDifficulty, teacherChallenges))
  const [roundIndex, setRoundIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [timeLeft, setTimeLeft] = useState(config.time)
  const [leftTeam, setLeftTeam] = useState<TeamState>(createTeamState)
  const [rightTeam, setRightTeam] = useState<TeamState>(createTeamState)
  const [statusText, setStatusText] = useState("Boshlash tugmasini bosing. Kim birinchi to'g'ri topsa, raundni oladi.")
  const [winner, setWinner] = useState<Winner | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const musicCtxRef = useRef<AudioContext | null>(null)
  const musicTimerRef = useRef<number | null>(null)
  const musicGainRef = useRef<GainNode | null>(null)
  const musicStepRef = useRef(0)
  const countdownTimerRef = useRef<number | null>(null)

  const currentTask = phase === 'ready' ? undefined : deck[roundIndex]
  const currentRound = roundIndex + 1
  const progressRounds = phase === 'ready' ? 0 : phase === 'finished' ? totalRounds : roundIndex
  const progressPercent = Math.round((progressRounds / totalRounds) * 100)
  const roundLocked = phase !== 'input' || leftTeam.status === 'correct' || rightTeam.status === 'correct'

  const stopMusic = useCallback(() => {
    if (musicTimerRef.current) {
      window.clearInterval(musicTimerRef.current)
      musicTimerRef.current = null
    }
    const ctx = musicCtxRef.current
    const gain = musicGainRef.current
    if (ctx && gain) {
      const now = ctx.currentTime
      gain.gain.cancelScheduledValues(now)
      gain.gain.setTargetAtTime(0.0001, now, 0.1)
    }
  }, [])

  const clearCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
  }, [])

  const playSoftNote = useCallback((ctx: AudioContext, freq: number, duration = 0.42) => {
    const master = musicGainRef.current
    if (!master) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.value = freq
    lfo.type = 'sine'
    lfo.frequency.value = 4.2
    lfoGain.gain.value = 1.8

    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.035, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    osc.connect(gain)
    gain.connect(master)

    lfo.start(now)
    osc.start(now)
    osc.stop(now + duration + 0.03)
    lfo.stop(now + duration + 0.03)
  }, [])

  const startMusic = useCallback(async () => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      if (!musicCtxRef.current) {
        musicCtxRef.current = new Ctx()
      }
      const ctx = musicCtxRef.current
      if (!ctx) return

      if (!musicGainRef.current) {
        const g = ctx.createGain()
        g.gain.value = 0.0001
        g.connect(ctx.destination)
        musicGainRef.current = g
      }

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      const master = musicGainRef.current
      const now = ctx.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setTargetAtTime(0.02, now, 0.18)

      if (musicTimerRef.current) return

      const melody = [261.63, 293.66, 329.63, 349.23, 329.63, 293.66, 261.63, 220.0]
      musicStepRef.current = 0
      playSoftNote(ctx, melody[0], 0.46)

      musicTimerRef.current = window.setInterval(() => {
        const step = musicStepRef.current % melody.length
        musicStepRef.current += 1
        const freq = melody[step]
        playSoftNote(ctx, freq, step % 4 === 0 ? 0.52 : 0.4)
      }, 720)
    } catch {
      // optional audio
    }
  }, [playSoftNote])

  const resolveWinner = useCallback((): Winner => {
    if (isSoloMode) return 'left'
    if (leftTeam.score > rightTeam.score) return 'left'
    if (rightTeam.score > leftTeam.score) return 'right'
    if (leftTeam.roundsWon > rightTeam.roundsWon) return 'left'
    if (rightTeam.roundsWon > leftTeam.roundsWon) return 'right'
    return 'draw'
  }, [isSoloMode, leftTeam.score, rightTeam.score, leftTeam.roundsWon, rightTeam.roundsWon])

  const openRound = useCallback(
    (index: number) => {
      setRoundIndex(index)
      setTimeLeft(config.time)
      setLeftTeam((prev) => ({ ...prev, selectedIndex: null, status: 'waiting' }))
      setRightTeam((prev) => ({ ...prev, selectedIndex: null, status: 'waiting' }))
      const task = deck[index]
      const target = task?.targetKey ? COLOR_BY_KEY[task.targetKey] : undefined
      setPhase('input')
      setStatusText(
        task
          ? `${index + 1}-raund: ${modePrompt(task.mode, target, task.teacherPrompt)}`
          : `${index + 1}-raund boshlandi.`,
      )
    },
    [config.time, deck],
  )

  const beginMatch = useCallback(() => {
    const freshDeck = createDeck(initialDifficulty, teacherChallenges)
    setDeck(freshDeck)
    setLeftTeam(createTeamState())
    setRightTeam(createTeamState())
    setWinner(null)
    setShowWinnerModal(false)
    setConfettiBurst(0)
    setTimeLeft(config.time)
    setRoundIndex(0)

    const firstTask = freshDeck[0]
    const firstTarget = firstTask?.targetKey ? COLOR_BY_KEY[firstTask.targetKey] : undefined
    setPhase('input')
    setStatusText(
      firstTask
        ? `1-raund: ${modePrompt(firstTask.mode, firstTarget, firstTask.teacherPrompt)}`
        : "Bellashuv boshlandi.",
    )
    void startMusic()
  }, [initialDifficulty, teacherChallenges, config.time, startMusic])

  const startMatch = () => {
    if (phase === 'input' || phase === 'result' || countdown !== null) return
    clearCountdown()
    setCountdown(3)
    setStatusText('Tayyorlaning... 3')

    let value = 3
    countdownTimerRef.current = window.setInterval(() => {
      value -= 1
      if (value <= 0) {
        clearCountdown()
        setCountdown(null)
        beginMatch()
        return
      }
      setCountdown(value)
      setStatusText(`Tayyorlaning... ${value}`)
    }, 1000)
  }

  const resetMatch = () => {
    clearCountdown()
    setCountdown(null)
    stopMusic()
    setDeck(createDeck(initialDifficulty, teacherChallenges))
    setRoundIndex(0)
    setPhase('ready')
    setTimeLeft(config.time)
    setLeftTeam(createTeamState())
    setRightTeam(createTeamState())
    setWinner(null)
    setShowWinnerModal(false)
    setStatusText(
      isSoloMode
        ? "Boshlash tugmasini bosing. Har raundda to'g'ri kartani topib ball yig'ing."
        : "Boshlash tugmasini bosing. Kim birinchi to'g'ri topsa, raundni oladi.",
    )
  }

  const lockTeamWrong = (side: Side) => {
    if (side === 'left') {
      setLeftTeam((prev) => ({ ...prev, status: 'wrong', streak: 0 }))
    } else {
      setRightTeam((prev) => ({ ...prev, status: 'wrong', streak: 0 }))
    }
  }

  const handlePick = (side: Side, optionIndex: number) => {
    if (phase !== 'input' || !currentTask) return
    if (leftTeam.status === 'correct' || (!isSoloMode && rightTeam.status === 'correct')) return

    const team = side === 'left' ? leftTeam : rightTeam
    const teamName = side === 'left' ? leftLabel : rightLabel
    const otherName = side === 'left' ? rightLabel : leftLabel
    if (isSoloMode && side === 'right') return
    if (team.status !== 'waiting') return

    const isCorrect = optionIndex === currentTask.correctIndex

    if (side === 'left') {
      setLeftTeam((prev) => ({ ...prev, selectedIndex: optionIndex }))
    } else {
      setRightTeam((prev) => ({ ...prev, selectedIndex: optionIndex }))
    }

    if (!isCorrect) {
      lockTeamWrong(side)
      setStatusText(
        isSoloMode
          ? `${teamName} xato javob berdi. Raund yakunlandi.`
          : `${teamName} xato javob berdi. ${otherName} javob berishi mumkin.`,
      )
      return
    }

    const roundBonus = currentTask.bonusRound ? 8 : 0
    const gained =
      config.basePoints +
      Math.max(0, timeLeft * config.speedBonusPerSecond) +
      (team.streak + 1) * config.comboBonus +
      roundBonus

    if (side === 'left') {
      setLeftTeam((prev) => {
        const nextStreak = prev.streak + 1
        return {
          ...prev,
          status: 'correct',
          roundsWon: prev.roundsWon + 1,
          score: prev.score + gained,
          streak: nextStreak,
          bestStreak: Math.max(prev.bestStreak, nextStreak),
        }
      })
      if (!isSoloMode) {
        setRightTeam((prev) =>
          prev.status === 'waiting' ? { ...prev, streak: 0 } : prev,
        )
      }
    } else {
      setRightTeam((prev) => {
        const nextStreak = prev.streak + 1
        return {
          ...prev,
          status: 'correct',
          roundsWon: prev.roundsWon + 1,
          score: prev.score + gained,
          streak: nextStreak,
          bestStreak: Math.max(prev.bestStreak, nextStreak),
        }
      })
      if (!isSoloMode) {
        setLeftTeam((prev) =>
          prev.status === 'waiting' ? { ...prev, streak: 0 } : prev,
        )
      }
    }

    setStatusText(
      `${teamName} birinchi bo'lib topdi! +${gained} ball${currentTask.bonusRound ? ' (bonus raund)' : ''}`,
    )
  }

  useEffect(() => {
    if (phase !== 'input') return
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'input') return
    if (timeLeft > 0) return

    setLeftTeam((prev) => (prev.status === 'waiting' ? { ...prev, status: 'timeout', streak: 0 } : prev))
    if (!isSoloMode) {
      setRightTeam((prev) => (prev.status === 'waiting' ? { ...prev, status: 'timeout', streak: 0 } : prev))
    }
  }, [phase, timeLeft, isSoloMode])

  useEffect(() => {
    if (phase !== 'input') return
    const someoneCorrect = leftTeam.status === 'correct' || rightTeam.status === 'correct'
    const bothResolved = isSoloMode
      ? leftTeam.status !== 'waiting'
      : leftTeam.status !== 'waiting' && rightTeam.status !== 'waiting'
    if (!someoneCorrect && !bothResolved) return

    setPhase('result')

    if (leftTeam.status === 'correct') {
      setStatusText(`${leftLabel} raundni oldi. Keyingi rang tayyorlanmoqda...`)
      return
    }
    if (!isSoloMode && rightTeam.status === 'correct') {
      setStatusText(`${rightLabel} raundni oldi. Keyingi rang tayyorlanmoqda...`)
      return
    }
    setStatusText(
      isSoloMode
        ? `${leftLabel} bu safar topolmadi. Keyingi rang ochiladi.`
        : "Ikkala jamoa ham topolmadi. Keyingi rang ochiladi.",
    )
  }, [phase, leftTeam.status, rightTeam.status, leftLabel, rightLabel, isSoloMode])

  useEffect(() => {
    if (phase !== 'result') return

    const timer = window.setTimeout(() => {
      const nextIndex = roundIndex + 1
      if (nextIndex >= totalRounds) {
        const resolved = resolveWinner()
        setWinner(resolved)
        setShowWinnerModal(true)
        setConfettiBurst((prev) => prev + 1)
        setPhase('finished')
        stopMusic()

        if (resolved === 'left') {
          setStatusText(`${leftLabel} g'olib bo'ldi.`)
          return
        }
        if (!isSoloMode && resolved === 'right') {
          setStatusText(`${rightLabel} g'olib bo'ldi.`)
          return
        }
        setStatusText(isSoloMode ? `${leftLabel} natijasi yakunlandi.` : 'Durang natija.')
        return
      }
      openRound(nextIndex)
    }, config.nextRoundMs)

    return () => window.clearTimeout(timer)
  }, [phase, roundIndex, totalRounds, resolveWinner, leftLabel, rightLabel, openRound, config.nextRoundMs, stopMusic, isSoloMode])

  useEffect(() => () => stopMusic(), [stopMusic])
  useEffect(() => () => clearCountdown(), [clearCountdown])

  const resultLabel = (status: TeamStatus) => {
    if (status === 'correct') return "To'g'ri"
    if (status === 'wrong') return 'Xato'
    if (status === 'timeout') return 'Vaqt tugadi'
    return 'Javob kutilmoqda'
  }

  const winnerLabel = useMemo(() => {
    if (winner === 'left') return leftLabel
    if (winner === 'right') return rightLabel
    if (winner === 'draw') return 'Durang'
    return ''
  }, [winner, leftLabel, rightLabel])

  const renderColorCard = (
    side: Side,
    team: TeamState,
    card: ColorCard,
    index: number,
    tone: string,
  ) => {
    const letter = String.fromCharCode(65 + index)
    const isSelected = team.selectedIndex === index
    const isCorrectCard = currentTask ? currentTask.correctIndex === index : false
    const word = COLOR_BY_KEY[card.wordKey]
    const textColor = COLOR_BY_KEY[card.textColorKey]
    const panelColor = COLOR_BY_KEY[card.panelColorKey]

    const stateClass =
      phase !== 'input'
        ? isCorrectCard
          ? 'border-emerald-300 bg-emerald-50'
          : isSelected
            ? 'border-rose-300 bg-rose-50'
            : 'border-slate-200 bg-white'
        : isSelected
          ? `border-transparent bg-gradient-to-r ${tone}/10 ring-2 ring-cyan-300`
          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300'

    const disabled = roundLocked || team.status !== 'waiting'

    return (
      <button
        key={`${side}-${card.id}-${index}`}
        type="button"
        onClick={() => handlePick(side, index)}
        disabled={disabled}
        className={`arena-3d-press group rounded-2xl border p-2 text-left transition ${stateClass} ${disabled ? 'cursor-not-allowed opacity-90' : ''}`}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-xs font-black text-slate-700">
            {letter}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
            Karta
          </span>
        </div>

        <div
          className="grid min-h-[86px] place-items-center rounded-xl border border-white/60 p-2 shadow-inner"
          style={{
            background: `linear-gradient(145deg, ${panelColor.hex}, ${panelColor.hex}dd)`,
          }}
        >
          <span
            className="select-none text-center text-lg font-black uppercase tracking-[0.05em] sm:text-xl"
            style={{
              color: textColor.hex,
              textShadow: '0 1px 0 rgba(255,255,255,0.35), 0 0 10px rgba(15,23,42,0.16)',
              WebkitTextStroke: panelColor.key === 'oq' ? '0.6px rgba(15,23,42,0.25)' : '0px transparent',
            }}
          >
            {word.label}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-1">{modeLabel('word-name')}</span>
          <span className="truncate">{phase === 'input' ? 'Tanlang' : isCorrectCard ? "To'g'ri" : 'Variant'}</span>
        </div>
      </button>
    )
  }

  const renderTeamPanel = (
    side: Side,
    label: string,
    team: TeamState,
    borderTone: string,
    accentTone: string,
  ) => (
    <article className={`arena-3d-panel rounded-[1.7rem] border p-4 shadow-soft ${borderTone}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-kid text-3xl text-slate-900">{label}</h3>
        <span className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-extrabold text-white ${accentTone}`}>
          {team.score} ball
        </span>
      </div>
      <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
        Raund yutgan: {team.roundsWon} | Combo: {team.streak} | Best: {team.bestStreak}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {currentTask?.cards.map((card, index) => renderColorCard(side, team, card, index, accentTone))}
      </div>

      <p
        className={`mt-3 rounded-xl border px-3 py-2 text-xs font-extrabold ${
          team.status === 'correct'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : team.status === 'wrong'
              ? 'border-rose-300 bg-rose-50 text-rose-700'
              : team.status === 'timeout'
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        Holat: {resultLabel(team.status)}
      </p>
    </article>
  )

  const targetColor = currentTask?.targetKey ? COLOR_BY_KEY[currentTask.targetKey] : undefined

  return (
    <section className="glass-card arena-3d-shell relative flex flex-col p-4 sm:p-5" data-aos="fade-up" data-aos-delay="80">
      <style>{`
        @keyframes rang-countdown-pop {
          0% { transform: scale(0.58); opacity: 0; }
          45% { transform: scale(1.14); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .rang-countdown-pop {
          animation: rang-countdown-pop 0.62s cubic-bezier(0.2, 0.85, 0.2, 1) both;
        }
      `}</style>

      <div className="pointer-events-none absolute -left-20 top-20 h-52 w-52 rounded-full bg-amber-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-52 w-52 rounded-full bg-orange-200/35 blur-3xl" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-700 sm:text-xs">
            {isSoloMode ? 'Solo Stroop mode' : 'Stroop Race Mode'}
          </p>
          <h2 className="mt-1 font-kid text-3xl text-slate-900 sm:text-4xl">
            {isSoloMode ? `${gameTitle} Solo` : `${gameTitle} Arena`}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={setupPath}
            className="arena-3d-press rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5 sm:text-xs"
          >
            {'< '}Orqaga
          </Link>
          <button
            type="button"
            onClick={resetMatch}
            className="arena-3d-press rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5 sm:text-xs"
          >
            Nolga tushir
          </button>
        </div>
      </div>

      <div className={`mt-4 grid gap-3 sm:grid-cols-2 ${isSoloMode ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}`}>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Raund</p>
          <p className="mt-1 font-kid text-3xl text-slate-900">{phase === 'ready' ? `0/${totalRounds}` : `${currentRound}/${totalRounds}`}</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Timer</p>
          <p className={`mt-1 font-kid text-3xl ${timeLeft <= 5 && phase === 'input' ? 'text-rose-600' : 'text-slate-900'}`}>
            {phase === 'input' ? `${timeLeft}s` : '--'}
          </p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{leftLabel}</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">{leftTeam.score} ball</p>
        </div>
        {!isSoloMode ? (
          <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{rightLabel}</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{rightTeam.score} ball</p>
          </div>
        ) : null}
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Daraja</p>
          <p className="mt-1 text-base font-extrabold text-slate-700">{initialDifficulty}</p>
        </div>
      </div>

      <div className="arena-3d-panel mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
              {currentTask ? `${modeLabel(currentTask.mode)} bellashuv` : 'Rangli bellashuv'}
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900 sm:text-2xl">
              {currentTask ? modePrompt(currentTask.mode, targetColor, currentTask.teacherPrompt) : "Boshlashni bosib o'yinni boshlang"}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">
              {isSoloMode
                ? "Har savolda to'g'ri kartani toping. Xato yoki timeout bo'lsa keyingi raund ochiladi."
                : "Bir jamoa xato qilsa, ikkinchisiga navbat qoladi. Ikkalasi ham topolmasa keyingi raund ochiladi."}
            </p>
          </div>
          {targetColor ? (
            <div className="flex items-center gap-3">
              {currentTask?.bonusRound ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-amber-700">
                  Bonus raund
                </span>
              ) : null}
              {targetColor ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                  <div
                    className="grid h-14 w-20 place-items-center rounded-xl border border-white/60"
                    style={{ backgroundColor: targetColor.hex }}
                  >
                    <span
                      className="text-sm font-black uppercase tracking-[0.08em]"
                      style={{ color: targetColor.chipText }}
                    >
                      {targetColor.label}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-violet-700">
                  Qiziqarli mode
                </div>
              )}
            </div>
          ) : null}
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full bg-gradient-to-r ${gameTone}`} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className={`mt-4 grid gap-4 ${isSoloMode ? '' : 'lg:grid-cols-2'}`}>
        {renderTeamPanel('left', leftLabel, leftTeam, 'border-cyan-200 bg-cyan-50/35', 'from-cyan-500 to-blue-500')}
        {!isSoloMode ? renderTeamPanel('right', rightLabel, rightTeam, 'border-fuchsia-200 bg-fuchsia-50/35', 'from-fuchsia-500 to-rose-500') : null}
      </div>

      <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-extrabold ${
        phase === 'finished' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}>
        {statusText}
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={startMatch}
          disabled={phase === 'input' || phase === 'result' || countdown !== null}
          className={`arena-3d-press rounded-2xl bg-gradient-to-r px-7 py-3 text-sm font-extrabold uppercase tracking-[0.14em] text-white shadow-soft transition sm:px-9 sm:py-3.5 sm:text-base ${
            phase === 'input' || phase === 'result' || countdown !== null
              ? 'cursor-not-allowed opacity-70'
              : `hover:-translate-y-0.5 ${gameTone}`
          }`}
        >
          {countdown !== null
            ? `${countdown}...`
            : phase === 'ready' || phase === 'finished'
              ? "O'yinni boshlash"
              : "O'yin davom etmoqda"}
        </button>
      </div>

      {countdown !== null ? (
        <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center rounded-[2rem] bg-slate-900/35 backdrop-blur-[1.5px]">
          <div className="relative grid place-items-center">
            <div className="absolute h-44 w-44 rounded-full bg-gradient-to-r from-amber-300/65 via-orange-300/55 to-rose-300/65 blur-3xl animate-pulse" />
            <div key={countdown} className="rang-countdown-pop relative grid h-36 w-36 place-items-center rounded-full border-4 border-white/80 bg-white/85 text-7xl font-black text-slate-900 shadow-soft">
              {countdown}
            </div>
            <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.14em] text-white drop-shadow">Boshlanyapti...</p>
          </div>
        </div>
      ) : null}

      {showWinnerModal ? (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <ConfettiOverlay burstKey={confettiBurst} variant={winner === 'draw' ? 'lose' : 'win'} />
          <div className="relative z-[2] w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/75 bg-white/95 p-5 shadow-soft sm:p-6">
            <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-amber-200/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-orange-200/35 blur-3xl" />
            <div className="relative">
              <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                Ranglar olami yakunlandi
              </p>
              <h3 className="mt-3 font-kid text-4xl text-slate-900 sm:text-5xl">
                {!isSoloMode && winnerLabel === 'Durang' ? 'Durang natija' : `G'olib: ${winnerLabel}`}
              </h3>
              <p className="mt-1 text-base font-bold text-slate-600">
                {!isSoloMode && winnerLabel === 'Durang'
                  ? "Ikkala jamoa ham bir xil natija ko'rsatdi."
                  : isSoloMode
                    ? `${leftLabel} ranglarni ajratib yakuniy natijani ko'rsatdi.`
                    : `${winnerLabel} ranglarni tezroq ajratib g'olib bo'ldi.`}
              </p>

              <div className={`mt-4 grid gap-3 ${isSoloMode ? '' : 'sm:grid-cols-2'}`}>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{leftLabel}</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-800">{leftTeam.score}</p>
                  <p className="text-sm font-bold text-slate-500">{leftTeam.roundsWon} raund | combo {leftTeam.bestStreak}</p>
                </div>
                {!isSoloMode ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{rightLabel}</p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-800">{rightTeam.score}</p>
                    <p className="text-sm font-bold text-slate-500">{rightTeam.roundsWon} raund | combo {rightTeam.bestStreak}</p>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWinnerModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5"
                >
                  Yopish
                </button>
                <button
                  type="button"
                  onClick={startMatch}
                  className={`rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
                >
                  Yangi o'yin
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default RanglarOlamiArena

