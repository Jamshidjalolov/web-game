import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import tortishImage from '../rasm/tortish.png'
import { Link } from 'react-router-dom'
import leftPullSprite from '../assets/games/tug-left-premium.svg'
import rightPullSprite from '../assets/games/tug-right-premium.svg'
import Sprite from './Sprite.tsx'
import ConfettiOverlay from './ConfettiOverlay'

type TugOfWarArenaProps = {
  gameTitle: string
  gameTone: string
  leftTeamName?: string
  rightTeamName?: string
  initialEnabledOps?: Operator[]
  initialDifficulty?: Difficulty
  teacherQuestions?: TeacherTugQuestion[]
  lockOptions?: boolean
}

type Side = 'left' | 'right'
type Winner = Side | 'draw'
type KeypadAction = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'C' | 'GO'
export type Operator = '+' | '-' | 'x' | '/'
type Difficulty = 'Oson' | "O'rta" | 'Qiyin'

export type TeacherTugQuestion = {
  prompt: string
  answer: number
  difficulty?: Difficulty
  operator?: Operator
}

type TeamQuestion = {
  prompt: string
  answer: number
  operator?: Operator
  source: 'generated' | 'teacher'
}

type TeamState = {
  input: string
  score: number
  streak: number
  solved: number
  question: TeamQuestion
}

type QuestionFactory = () => TeamQuestion

const ROUND_SECONDS = 273
const WIN_LIMIT = 42
const MAX_SCENE_SHIFT_PX = 55
const MAX_IMAGE_SHIFT_PX = 23
const IMAGE_CENTER_OFFSET_PX = 6
const MUSIC_VOLUME_BOOST = 1.6
const PRIMARY_TRACK_SRC = '/audio/the_mountain-children-483305.mp3'
const FALLBACK_TRACK_SRC = '/audio/sigmamusicart-corporate-background-music-484577.mp3'
const KEYPAD: KeypadAction[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'GO']
const OPERATORS: Operator[] = ['+', '-', 'x', '/']
const ALLOWED_DIFFICULTIES: Difficulty[] = ['Oson', "O'rta", 'Qiyin']

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

const formatClock = (seconds: number) => {
  const mm = Math.floor(seconds / 60)
  const ss = seconds % 60
  return `${String(mm)}:${String(ss).padStart(2, '0')}`
}

const createGeneratedQuestion = (ops: Operator[], difficulty: Difficulty): TeamQuestion => {
  const pool: Operator[] = ops.length > 0 ? ops : ['+']
  const operator = pool[randomInt(0, pool.length - 1)]

  if (operator === '+') {
    if (difficulty === 'Oson') {
      const a = randomInt(0, 14)
      const b = randomInt(0, 14)
      return { prompt: `${a} + ${b} = ?`, operator, answer: a + b, source: 'generated' }
    }
    if (difficulty === "O'rta") {
      const a = randomInt(0, 18)
      const b = randomInt(0, 18)
      return { prompt: `${a} + ${b} = ?`, operator, answer: a + b, source: 'generated' }
    }
    const a = randomInt(12, 55)
    const b = randomInt(12, 55)
    return { prompt: `${a} + ${b} = ?`, operator, answer: a + b, source: 'generated' }
  }

  if (operator === '-') {
    if (difficulty === 'Oson') {
      const a = randomInt(8, 22)
      const b = randomInt(0, Math.min(a, 12))
      return { prompt: `${a} - ${b} = ?`, operator, answer: a - b, source: 'generated' }
    }
    if (difficulty === "O'rta") {
      const a = randomInt(12, 32)
      const b = randomInt(0, a)
      return { prompt: `${a} - ${b} = ?`, operator, answer: a - b, source: 'generated' }
    }
    const a = randomInt(35, 99)
    const b = randomInt(11, a - 5)
    return { prompt: `${a} - ${b} = ?`, operator, answer: a - b, source: 'generated' }
  }

  if (operator === 'x') {
    if (difficulty === 'Oson') {
      const a = randomInt(2, 9)
      const b = randomInt(2, 8)
      return { prompt: `${a} x ${b} = ?`, operator, answer: a * b, source: 'generated' }
    }
    if (difficulty === "O'rta") {
      const a = randomInt(3, 11)
      const b = randomInt(3, 11)
      return { prompt: `${a} x ${b} = ?`, operator, answer: a * b, source: 'generated' }
    }
    const a = randomInt(6, 15)
    const b = randomInt(5, 13)
    return { prompt: `${a} x ${b} = ?`, operator, answer: a * b, source: 'generated' }
  }

  if (difficulty === 'Oson') {
    const b = randomInt(2, 8)
    const answer = randomInt(2, 12)
    const a = b * answer
    return { prompt: `${a} / ${b} = ?`, operator, answer, source: 'generated' }
  }
  if (difficulty === "O'rta") {
    const b = randomInt(3, 11)
    const answer = randomInt(3, 15)
    const a = b * answer
    return { prompt: `${a} / ${b} = ?`, operator, answer, source: 'generated' }
  }
  const b = randomInt(4, 14)
  const answer = randomInt(6, 18)
  const a = b * answer
  return { prompt: `${a} / ${b} = ?`, operator, answer, source: 'generated' }
}

const createQuestion = (
  ops: Operator[],
  difficulty: Difficulty,
  teacherQuestions: TeacherTugQuestion[],
): TeamQuestion => {
  const filteredTeacherQuestions = teacherQuestions.filter((item) => {
    const prompt = item.prompt.trim()
    if (!prompt) return false
    if (!Number.isFinite(item.answer)) return false
    if (!Number.isInteger(item.answer) || item.answer < 0) return false
    if (item.difficulty && item.difficulty !== difficulty) return false
    if (item.operator && !ops.includes(item.operator)) return false
    return true
  })

  if (filteredTeacherQuestions.length > 0) {
    const picked = filteredTeacherQuestions[randomInt(0, filteredTeacherQuestions.length - 1)]
    return {
      prompt: picked.prompt.trim(),
      answer: picked.answer,
      operator: picked.operator,
      source: 'teacher',
    }
  }

  return createGeneratedQuestion(ops, difficulty)
}

const createTeamState = (questionFactory: QuestionFactory): TeamState => ({
  input: '',
  score: 0,
  streak: 0,
  solved: 0,
  question: questionFactory(),
})

const getQuestionLabel = (question: TeamQuestion) => question.prompt

function TugOfWarArena({
  gameTitle,
  gameTone,
  leftTeamName = '1-Jamoa',
  rightTeamName = '2-Jamoa',
  initialEnabledOps = OPERATORS,
  initialDifficulty = "O'rta",
  teacherQuestions = [],
  lockOptions = false,
}: TugOfWarArenaProps) {
  const parsedInitialOps = useMemo(
    () => (initialEnabledOps.length ? initialEnabledOps : OPERATORS),
    [initialEnabledOps],
  )
  const safeInitialDifficulty = useMemo<Difficulty>(
    () => (ALLOWED_DIFFICULTIES.includes(initialDifficulty) ? initialDifficulty : "O'rta"),
    [initialDifficulty],
  )
  const normalizedTeacherQuestions = useMemo<TeacherTugQuestion[]>(
    () => teacherQuestions
      .filter((item) => item && typeof item.prompt === 'string')
      .map((item) => ({
        prompt: item.prompt.trim(),
        answer: Math.round(item.answer),
        difficulty: item.difficulty,
        operator: item.operator,
      }))
      .filter((item) => item.prompt.length > 0 && Number.isFinite(item.answer) && item.answer >= 0)
      .slice(0, 200),
    [teacherQuestions],
  )
  const [enabledOps, setEnabledOps] = useState<Operator[]>(parsedInitialOps)
  const createInitialQuestion = useCallback(
    () => createQuestion(parsedInitialOps, safeInitialDifficulty, normalizedTeacherQuestions),
    [parsedInitialOps, safeInitialDifficulty, normalizedTeacherQuestions],
  )
  const [leftTeam, setLeftTeam] = useState<TeamState>(() => createTeamState(createInitialQuestion))
  const [rightTeam, setRightTeam] = useState<TeamState>(() => createTeamState(createInitialQuestion))
  const leftTeamRef = useRef<TeamState>(leftTeam)
  const rightTeamRef = useRef<TeamState>(rightTeam)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [ropeOffset, setRopeOffset] = useState(0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [winner, setWinner] = useState<Winner | null>(null)
  const [statusText, setStatusText] = useState("Boshlash tugmasini bosing va arqonni tortishni boshlang.")
  const [musicOn, setMusicOn] = useState(true)
  const [scoreBank, setScoreBank] = useState(0)
  const [activePullSide, setActivePullSide] = useState<Side | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [idleBeat, setIdleBeat] = useState(0)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const musicTrackRef = useRef<HTMLAudioElement | null>(null)
  const trackSourceRef = useRef(PRIMARY_TRACK_SRC)
  const useSynthFallbackRef = useRef(false)
  const musicLoopRef = useRef<number | null>(null)
  const melodyStepRef = useRef(0)
  const finishedRef = useRef(false)
  const pulseTimeoutRef = useRef<number | null>(null)
  const ropeOffsetRef = useRef(0)
  const timeLeftRef = useRef(ROUND_SECONDS)

  const sceneShiftPx = (ropeOffset / WIN_LIMIT) * MAX_SCENE_SHIFT_PX
  const imageShiftPx = (ropeOffset / WIN_LIMIT) * MAX_IMAGE_SHIFT_PX
  const nearBarrierStop = Math.abs(sceneShiftPx) >= MAX_SCENE_SHIFT_PX - 2 || finished
  const idleY = running ? (idleBeat === 0 ? -2 : idleBeat === 1 ? -7 : -12) : 0
  const leftIdleX = running ? (idleBeat === 0 ? -2 : idleBeat === 1 ? -5 : -8) : 0
  const rightIdleX = running ? (idleBeat === 0 ? 2 : idleBeat === 1 ? 5 : 8) : 0
  const timePercent = Math.round((timeLeft / ROUND_SECONDS) * 100)
  const ropeBalancePercent = clamp(((ropeOffset + WIN_LIMIT) / (WIN_LIMIT * 2)) * 100, 0, 100)
  const leftPowerPercent = Math.round(100 - ropeBalancePercent)
  const rightPowerPercent = Math.round(ropeBalancePercent)
  const leftLabel = leftTeamName.trim() || '1-Jamoa'
  const rightLabel = rightTeamName.trim() || '2-Jamoa'
  const winnerLabel =
    winner === 'left' ? leftLabel : winner === 'right' ? rightLabel : 'Durang'
  const winnerScore =
    winner === 'left'
      ? leftTeam.score
      : winner === 'right'
        ? rightTeam.score
        : Math.max(leftTeam.score, rightTeam.score)

  const leaderLabel = useMemo(() => {
    if (ropeOffset <= -8) return `${leftLabel} oldinda`
    if (ropeOffset >= 8) return `${rightLabel} oldinda`
    return 'Teng holat'
  }, [ropeOffset, leftLabel, rightLabel])
  const teacherQuestionCount = normalizedTeacherQuestions.length
  const createNextQuestion = useCallback(
    () => createQuestion(enabledOps, safeInitialDifficulty, normalizedTeacherQuestions),
    [enabledOps, safeInitialDifficulty, normalizedTeacherQuestions],
  )

  const ensureAudioContext = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtor =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AudioCtor) {
          return null
        }
        audioCtxRef.current = new AudioCtor()
      }
      return audioCtxRef.current
    } catch {
      return null
    }
  }, [])

  const playTone = useCallback(
    (frequency: number, duration = 0.2, volume = 0.03, wave: OscillatorType = 'sine') => {
      const ctx = audioCtxRef.current
      if (!ctx) return
      const boostedVolume = clamp(volume * MUSIC_VOLUME_BOOST, 0.001, 0.12)

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = wave
      osc.frequency.setValueAtTime(frequency, ctx.currentTime)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(boostedVolume, ctx.currentTime + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration + 0.04)
    },
    [],
  )

  const stopMusicLoop = useCallback(() => {
    if (musicLoopRef.current !== null) {
      window.clearTimeout(musicLoopRef.current)
      musicLoopRef.current = null
    }

    if (musicTrackRef.current && !musicTrackRef.current.paused) {
      musicTrackRef.current.pause()
    }
  }, [])

  const startMusicLoop = useCallback(
    async (force = false) => {
      if (!musicOn && !force) {
        return
      }

      const tension = Math.abs(ropeOffsetRef.current) / WIN_LIMIT
      const urgency = 1 - timeLeftRef.current / ROUND_SECONDS
      const htmlTrack = musicTrackRef.current
      if (htmlTrack && !useSynthFallbackRef.current) {
        try {
          htmlTrack.playbackRate = clamp(1 + tension * 0.08 + urgency * 0.06, 0.95, 1.2)
          htmlTrack.volume = clamp(0.78 + tension * 0.12 + urgency * 0.1, 0.7, 1)
          if (htmlTrack.paused) {
            await htmlTrack.play()
          }
          return
        } catch (error) {
          const errorName = error instanceof DOMException ? error.name : ''
          // NotAllowed/Abort holatida qayta user action bo'lsa yana urinib ko'ramiz.
          if (errorName === 'NotAllowedError' || errorName === 'AbortError') {
            return
          }

          if (trackSourceRef.current === PRIMARY_TRACK_SRC) {
            trackSourceRef.current = FALLBACK_TRACK_SRC
            htmlTrack.src = FALLBACK_TRACK_SRC
            htmlTrack.load()
            try {
              await htmlTrack.play()
              return
            } catch {
              // fallback ham ishlamasa synth rejimga o'tamiz
            }
          }

          useSynthFallbackRef.current = true
        }
      }

      if (musicLoopRef.current !== null) {
        return
      }

      const ctx = ensureAudioContext()
      if (!ctx) {
        return
      }
      try {
        await ctx.resume()
      } catch {
        return
      }

      const chordRoots = [261.63, 293.66, 349.23, 329.63]
      const bassRoots = [130.81, 146.83, 174.61, 164.81]
      const clapPattern = [0, 760.0, 0, 880.0, 0, 760.0, 0, 698.46]

      const runStep = () => {
        if ((!musicOn && !force) || finishedRef.current) {
          musicLoopRef.current = null
          return
        }

        const dynamicTension = Math.abs(ropeOffsetRef.current) / WIN_LIMIT
        const dynamicUrgency = 1 - timeLeftRef.current / ROUND_SECONDS
        const step = melodyStepRef.current

        const beat = step % 8
        const bar = Math.floor(step / 8) % chordRoots.length
        const root = chordRoots[bar]
        const bass = bassRoots[bar]
        const clap = clapPattern[beat]
        const arpeggio =
          beat % 4 === 0 ? root : beat % 4 === 1 ? root * 1.25 : beat % 4 === 2 ? root * 1.5 : root * 2
        const energy = 1 + dynamicTension * 0.52 + dynamicUrgency * 0.32

        playTone(bass, 0.22, 0.008 * energy, 'sawtooth')
        playTone(arpeggio, 0.12, 0.01 * energy, beat % 2 === 0 ? 'triangle' : 'sine')

        if (beat % 2 === 0) {
          window.setTimeout(
            () => playTone(92 + dynamicTension * 26, 0.07, 0.011 + dynamicTension * 0.003, 'square'),
            24,
          )
        }

        if (clap > 0) {
          window.setTimeout(() => playTone(clap, 0.08, 0.007 + dynamicUrgency * 0.004, 'triangle'), 78)
        }

        if (dynamicUrgency > 0.72 && beat % 4 === 3) {
          window.setTimeout(() => playTone(1046.5, 0.06, 0.005 + dynamicUrgency * 0.003, 'sine'), 126)
        }

        melodyStepRef.current += 1
        const tempo = Math.max(200, 338 - dynamicTension * 70 - dynamicUrgency * 80)
        musicLoopRef.current = window.setTimeout(runStep, tempo)
      }

      runStep()
    },
    [musicOn, ensureAudioContext, playTone],
  )

  const playVictoryTheme = useCallback(() => {
    const notes = [659.25, 783.99, 880.0, 1046.5]
    notes.forEach((note, index) => {
      window.setTimeout(() => {
        playTone(note, 0.18, 0.024, 'triangle')
      }, index * 130)
    })
  }, [playTone])

  const pulseSide = (side: Side) => {
    if (pulseTimeoutRef.current !== null) {
      window.clearTimeout(pulseTimeoutRef.current)
      pulseTimeoutRef.current = null
    }
    setActivePullSide(side)
    pulseTimeoutRef.current = window.setTimeout(() => {
      setActivePullSide(null)
      pulseTimeoutRef.current = null
    }, 350)
  }

  const finalizeRound = useCallback(
    (result: Winner, reason: string) => {
      if (finishedRef.current) return
      finishedRef.current = true
      setFinished(true)
      setRunning(false)
      setWinner(result)
      setShowWinnerModal(true)
      setConfettiBurst((prev) => prev + 1)
      stopMusicLoop()

      if (result === 'left') {
        setScoreBank((prev) => prev + 140 + timeLeft)
        setStatusText(`${reason} ${leftLabel} g'olib bo'ldi.`)
      } else if (result === 'right') {
        setScoreBank((prev) => prev + 140 + timeLeft)
        setStatusText(`${reason} ${rightLabel} g'olib bo'ldi.`)
      } else {
        setScoreBank((prev) => prev + 60)
        setStatusText(`${reason} Raund durang bilan tugadi.`)
      }

      playVictoryTheme()
    },
    [timeLeft, playVictoryTheme, stopMusicLoop, leftLabel, rightLabel],
  )

  const shiftRope = useCallback(
    (side: Side, step: number) => {
      setRopeOffset((prev) => {
        const delta = side === 'left' ? -step : step
        const next = clamp(prev + delta, -WIN_LIMIT, WIN_LIMIT)

        if (next <= -WIN_LIMIT) {
          finalizeRound('left', "Qo'l to'siqqa tegdi. Chap jamoa g'olib.")
        }
        if (next >= WIN_LIMIT) {
          finalizeRound('right', "Qo'l to'siqqa tegdi. O'ng jamoa g'olib.")
        }

        return next
      })
    },
    [finalizeRound],
  )

  const handleDigit = useCallback(
    (side: Side, value: string) => {
      if (finished) return
      if (!running) {
        setStatusText("Avval O'yinni boshlash tugmasini bosing.")
        return
      }

      if (side === 'left') {
        setLeftTeam((prev) => {
          const next = { ...prev, input: `${prev.input}${value}`.slice(0, 3) }
          leftTeamRef.current = next
          return next
        })
      } else {
        setRightTeam((prev) => {
          const next = { ...prev, input: `${prev.input}${value}`.slice(0, 3) }
          rightTeamRef.current = next
          return next
        })
      }
      if (musicOn) void startMusicLoop()
    },
    [finished, running, musicOn, startMusicLoop],
  )

  const handleClear = useCallback((side: Side) => {
    if (side === 'left') {
      setLeftTeam((prev) => {
        const next = { ...prev, input: '' }
        leftTeamRef.current = next
        return next
      })
    } else {
      setRightTeam((prev) => {
        const next = { ...prev, input: '' }
        rightTeamRef.current = next
        return next
      })
    }
  }, [])

  const handleSubmit = useCallback(
    (side: Side) => {
      if (finished) return
      if (!running) {
        setStatusText("Avval O'yinni boshlash tugmasini bosing.")
        return
      }

      const team = side === 'left' ? leftTeamRef.current : rightTeamRef.current
      if (!team.input) {
        setStatusText("Avval raqam kiriting, keyin 'Go' bosing.")
        return
      }
      if (musicOn) void startMusicLoop()

      const typed = Number(team.input)
      const isCorrect = typed === team.question.answer

      if (isCorrect) {
        const nextStreak = team.streak + 1
        const step = 8 + Math.min(nextStreak, 3)
        shiftRope(side, step)
        pulseSide(side)
        setScoreBank((prev) => prev + 20 + nextStreak * 3)
        playTone(side === 'left' ? 540 : 620, 0.18, 0.028, 'triangle')

        if (side === 'left') {
          setLeftTeam((prev) => ({
            ...prev,
            input: '',
            score: prev.score + 1,
            solved: prev.solved + 1,
            streak: nextStreak,
            question: createNextQuestion(),
          }))
        } else {
          setRightTeam((prev) => ({
            ...prev,
            input: '',
            score: prev.score + 1,
            solved: prev.solved + 1,
            streak: nextStreak,
            question: createNextQuestion(),
          }))
        }

        setStatusText(`${side === 'left' ? leftLabel : rightLabel} to'g'ri javob berdi.`)
        return
      }

      shiftRope(side === 'left' ? 'right' : 'left', 5)
      pulseSide(side)
      playTone(170, 0.2, 0.024, 'sawtooth')

      if (side === 'left') {
        setLeftTeam((prev) => ({
          ...prev,
          input: '',
          streak: 0,
          question: createNextQuestion(),
        }))
      } else {
        setRightTeam((prev) => ({
          ...prev,
          input: '',
          streak: 0,
          question: createNextQuestion(),
        }))
      }

      setStatusText(`${side === 'left' ? leftLabel : rightLabel} xato javob berdi.`)
    },
    [finished, running, musicOn, startMusicLoop, shiftRope, playTone, createNextQuestion, leftLabel, rightLabel],
  )

  const handleKeypadAction = (side: Side, action: KeypadAction) => {
    if (action === 'C') {
      handleClear(side)
      return
    }
    if (action === 'GO') {
      handleSubmit(side)
      return
    }
    handleDigit(side, action)
  }

  const startNewRound = useCallback(() => {
    const leftInitial = createTeamState(createNextQuestion)
    const rightInitial = createTeamState(createNextQuestion)
    setLeftTeam(leftInitial)
    setRightTeam(rightInitial)
    leftTeamRef.current = leftInitial
    rightTeamRef.current = rightInitial
    setTimeLeft(ROUND_SECONDS)
    setRopeOffset(0)
    setRunning(true)
    setFinished(false)
    setWinner(null)
    setShowWinnerModal(false)
    setActivePullSide(null)
    setStatusText("Arqonni tortish uchun savollarga to'g'ri javob bering.")
    finishedRef.current = false
    melodyStepRef.current = 0

    if (musicTrackRef.current) {
      musicTrackRef.current.currentTime = 0
    }
    if (musicOn) {
      void startMusicLoop(true)
    }
  }, [createNextQuestion, musicOn, startMusicLoop])

  const resetAll = () => {
    startNewRound()
    setScoreBank(0)
    setShowWinnerModal(false)
  }

  const toggleMusic = () => {
    if (musicOn) {
      setMusicOn(false)
      stopMusicLoop()
      setStatusText("Musiqa o'chirildi.")
      return
    }

    setMusicOn(true)
    void startMusicLoop(true)
    setStatusText('Musiqa yoqildi.')
  }

  const toggleOperation = (op: Operator) => {
    if (lockOptions || running) {
      return
    }
    setEnabledOps((prev) => {
      if (prev.includes(op)) {
        if (prev.length === 1) return prev
        return prev.filter((item) => item !== op)
      }
      return [...prev, op]
    })
  }

  useEffect(() => {
    const track = new Audio(PRIMARY_TRACK_SRC)
    trackSourceRef.current = PRIMARY_TRACK_SRC
    track.loop = true
    track.preload = 'auto'
    track.volume = 0.9
    track.load()

    const handleTrackError = () => {
      if (trackSourceRef.current === PRIMARY_TRACK_SRC) {
        trackSourceRef.current = FALLBACK_TRACK_SRC
        track.src = FALLBACK_TRACK_SRC
        track.load()
        return
      }
      useSynthFallbackRef.current = true
    }

    track.addEventListener('error', handleTrackError)
    musicTrackRef.current = track

    return () => {
      track.pause()
      track.removeEventListener('error', handleTrackError)
      track.src = ''
      if (musicTrackRef.current === track) {
        musicTrackRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const getInitialQuestion = () =>
      createQuestion(parsedInitialOps, safeInitialDifficulty, normalizedTeacherQuestions)
    setEnabledOps(parsedInitialOps)
    setLeftTeam((prev) => ({ ...prev, input: '', question: getInitialQuestion() }))
    setRightTeam((prev) => ({ ...prev, input: '', question: getInitialQuestion() }))
  }, [parsedInitialOps, safeInitialDifficulty, normalizedTeacherQuestions])

  useEffect(() => {
    setLeftTeam((prev) => {
      if (!prev.question.operator || enabledOps.includes(prev.question.operator)) return prev
      return { ...prev, input: '', question: createNextQuestion() }
    })
    setRightTeam((prev) => {
      if (!prev.question.operator || enabledOps.includes(prev.question.operator)) return prev
      return { ...prev, input: '', question: createNextQuestion() }
    })
  }, [enabledOps, createNextQuestion])

  useEffect(() => {
    finishedRef.current = finished
  }, [finished])

  useEffect(() => {
    ropeOffsetRef.current = ropeOffset
  }, [ropeOffset])

  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  useEffect(() => {
    leftTeamRef.current = leftTeam
  }, [leftTeam])

  useEffect(() => {
    rightTeamRef.current = rightTeam
  }, [rightTeam])

  useEffect(() => {
    if (!running || finished) return
    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [running, finished])

  useEffect(() => {
    if (!running || finished) {
      setIdleBeat(0)
      return
    }
    const motionId = window.setInterval(() => {
      setIdleBeat((prev) => (prev + 1) % 3)
    }, 170)
    return () => window.clearInterval(motionId)
  }, [running, finished])

  useEffect(() => {
    if (!running || finished || timeLeft > 0) return

    if (ropeOffset <= -8) {
      finalizeRound('left', 'Vaqt tugadi.')
      return
    }
    if (ropeOffset >= 8) {
      finalizeRound('right', 'Vaqt tugadi.')
      return
    }
    if (leftTeam.score > rightTeam.score) {
      finalizeRound('left', 'Vaqt tugadi.')
      return
    }
    if (rightTeam.score > leftTeam.score) {
      finalizeRound('right', 'Vaqt tugadi.')
      return
    }
    finalizeRound('draw', 'Vaqt tugadi.')
  }, [timeLeft, running, finished, ropeOffset, leftTeam.score, rightTeam.score, finalizeRound])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key
      const lower = key.toLowerCase()

      if (lower >= '0' && lower <= '9' && !event.shiftKey) {
        handleDigit('left', lower)
        return
      }
      if (lower === 'backspace') {
        handleClear('left')
        return
      }
      if (lower === 'enter') {
        handleSubmit('left')
        return
      }

      if (event.code.startsWith('Numpad') && key >= '0' && key <= '9') {
        handleDigit('right', key)
        return
      }
      if (event.code === 'NumpadEnter') {
        handleSubmit('right')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleDigit, handleClear, handleSubmit])

  useEffect(() => {
    return () => {
      stopMusicLoop()
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current)
      }
      if (audioCtxRef.current) {
        void audioCtxRef.current.close()
        audioCtxRef.current = null
      }
    }
  }, [stopMusicLoop])

  useEffect(() => {
    if (!running || finished || !musicOn) {
      stopMusicLoop()
      return
    }
    void startMusicLoop()
  }, [running, finished, musicOn, startMusicLoop, stopMusicLoop])

  const renderKeypad = (side: Side, tone: string, goTone: string, team: TeamState) => (
    <article className="arena-3d-panel h-full rounded-[1.7rem] border border-white/80 bg-white/92 p-3 shadow-soft sm:p-4">
      <div className={`rounded-2xl bg-gradient-to-b px-3 py-3 text-center text-3xl font-kid text-white ${tone}`}>
        {getQuestionLabel(team.question)}
      </div>

      <div className="mt-3 h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-center text-2xl font-extrabold text-slate-700">
        {team.input || ''}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {KEYPAD.map((item) => {
          const isClear = item === 'C'
          const isGo = item === 'GO'
          return (
            <button
              key={`${side}-${item}`}
              type="button"
              onClick={() => handleKeypadAction(side, item)}
              disabled={finished || !running}
              className={`arena-3d-press rounded-2xl px-1 py-2.5 text-2xl font-extrabold transition ${
                isClear
                  ? 'bg-rose-500 text-white hover:-translate-y-0.5'
                  : isGo
                    ? `bg-gradient-to-r text-white hover:-translate-y-0.5 ${goTone}`
                    : 'bg-slate-100 text-slate-700 hover:-translate-y-0.5 hover:bg-slate-200'
              } ${finished || !running ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              {item === 'GO' ? 'Yuborish' : item}
            </button>
          )
        })}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-extrabold text-slate-600">
          Ball: {team.score}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-extrabold text-slate-600">
          Combo: {team.streak}
        </div>
      </div>
    </article>
  )

  return (
    <section className="glass-card arena-3d-shell flex flex-col p-3 sm:p-4" data-aos="fade-up" data-aos-delay="80">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-700 sm:text-xs">
            Real mini-game
          </p>
          <h2 className="mt-1 font-kid text-3xl text-slate-900 sm:text-4xl">
            {gameTitle} Arena
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/games/arqon-tortish"
            className="arena-3d-press rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5 sm:text-xs"
          >
            {'< '}Orqaga
          </Link>
          <button
            type="button"
            onClick={toggleMusic}
            className={`arena-3d-press rounded-xl border px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] transition sm:text-xs ${
              musicOn
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-slate-300 bg-white text-slate-600'
            }`}
          >
            Musiqa: {musicOn ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={startNewRound}
            className={`arena-3d-press ui-accent-btn rounded-xl bg-gradient-to-r px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-soft transition hover:-translate-y-0.5 sm:text-xs ${gameTone}`}
          >
            {!running && !finished ? "O'yinni boshlash" : 'Yangi raund'}
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="arena-3d-press rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5 sm:text-xs"
          >
            Nolga tushir
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
        {OPERATORS.map((op) => {
          const active = enabledOps.includes(op)
          const label = op === 'x' ? "Ko'paytirish" : op === '/' ? "Bo'lish" : op === '+' ? "Qo'shish" : 'Ayirish'

          if (lockOptions) {
            return (
              <span
                key={op}
                className={`rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] sm:text-xs ${
                  active
                    ? `border-transparent bg-gradient-to-r text-white ${gameTone}`
                    : 'border-slate-300 bg-white text-slate-500'
                }`}
              >
                {label}
              </span>
            )
          }

          return (
            <button
              key={op}
              type="button"
              onClick={() => toggleOperation(op)}
              disabled={running}
              className={`arena-3d-press rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] transition sm:text-xs ${
                active
                  ? `border-transparent bg-gradient-to-r text-white ${gameTone}`
                  : 'border-slate-300 bg-white text-slate-600'
              } ${running ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-600 sm:text-xs">
          Daraja: {safeInitialDifficulty}
        </span>
        <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-600 sm:text-xs">
          Teacher savol: {teacherQuestionCount}
        </span>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[0.96fr_1.2fr_0.96fr]">
        {renderKeypad('left', 'from-indigo-700 to-blue-900', 'from-sky-500 to-blue-600', leftTeam)}

        <div className="arena-3d-panel h-full rounded-[1.7rem] border border-white/80 bg-white/92 p-3 shadow-soft sm:p-4">
          <div className="tug-time-chip mx-auto flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-extrabold text-slate-700">
            <span>TIME</span>
            <span>{formatClock(timeLeft)}</span>
          </div>

          <h3 className="mt-3 text-center font-kid text-4xl text-slate-800 sm:text-5xl">Jamoaviy musobaqa</h3>

          <div className="mt-3 flex items-center justify-center gap-2 text-sm font-extrabold">
            <span className="rounded-full bg-indigo-700 px-3 py-1 text-white">{leftLabel}: {leftTeam.score} ball</span>
            <span className="text-slate-400">|</span>
            <span className="rounded-full bg-rose-600 px-3 py-1 text-white">{rightLabel}: {rightTeam.score} ball</span>
          </div>

          <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-3">
            <div
              className="tug-stage-reference relative h-[13.5rem] overflow-hidden rounded-2xl border border-slate-200 sm:h-[15.5rem]"
            >
              <img
                src={tortishImage}
                alt="Bellashuv sahnasi"
                className="tug-reference-image pointer-events-none absolute inset-x-[6%] top-[8%] z-[1] h-[84%] w-[88%] object-contain object-center opacity-100 transition-transform duration-200 ease-out"
                style={{ transform: `translateX(${imageShiftPx + IMAGE_CENTER_OFFSET_PX}px)` }}
              />
              <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_18%_20%,rgba(125,211,252,0.08),transparent_34%),radial-gradient(circle_at_82%_76%,rgba(251,113,133,0.08),transparent_34%)]" />
              <div className="pointer-events-none absolute left-1/2 top-[12%] z-[3] h-[76%] w-[2px] -translate-x-1/2 rounded-full bg-slate-300/80" />

              <div
                className="absolute inset-0 z-[4] transition-transform duration-200 ease-out"
                style={{ transform: `translateX(${sceneShiftPx}px)` }}
              >
                <div
                  className="absolute bottom-[6%] left-[2.8%] z-[2] transition-transform duration-200 ease-out"
                  style={{
                    transform: `translateX(${leftIdleX}px) translateY(${idleY}px)`,
                  }}
                >
                  <Sprite
                    src={leftPullSprite}
                    frameWidth={150}
                    frameHeight={150}
                    frames={1}
                    fps={12}
                    className={`drop-shadow-2xl ${activePullSide === 'left' && !nearBarrierStop ? 'tug-kid-pull-left' : 'tug-kid-idle-left'}`}
                  />
                </div>

                <div
                  className="absolute bottom-[6%] right-[2.8%] z-[2] transition-transform duration-200 ease-out"
                  style={{
                    transform: `translateX(${rightIdleX}px) translateY(${idleY}px)`,
                  }}
                >
                  <Sprite
                    src={rightPullSprite}
                    frameWidth={150}
                    frameHeight={150}
                    frames={1}
                    fps={12}
                    className={`drop-shadow-2xl ${activePullSide === 'right' && !nearBarrierStop ? 'tug-kid-pull-right' : 'tug-kid-idle-right'}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="arena-3d-panel mt-3 rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
              <span>{leaderLabel}</span>
              <span>Vaqt progress: {timePercent}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gameTone}`}
                style={{ width: `${timePercent}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500">
              <span>{leftLabel}: {leftPowerPercent}%</span>
              <span>{rightLabel}: {rightPowerPercent}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              <div className="flex h-full w-full">
                <span className="h-full bg-gradient-to-r from-indigo-600 to-blue-500" style={{ width: `${leftPowerPercent}%` }} />
                <span className="h-full bg-gradient-to-r from-rose-500 to-red-600" style={{ width: `${rightPowerPercent}%` }} />
              </div>
            </div>
          </div>

          <div className={`mt-3 rounded-2xl border px-4 py-2 text-center text-xs font-extrabold sm:text-sm ${
            finished ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
          }`}>
            {statusText}
          </div>

          <p className="mt-2 text-center text-sm font-bold text-slate-600 sm:text-base">
            Arqonni tortish uchun savollarga to'g'ri javob bering!
          </p>
        </div>

        {renderKeypad('right', 'from-red-600 to-rose-800', 'from-sky-500 to-blue-600', rightTeam)}
      </div>

      {showWinnerModal ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <ConfettiOverlay burstKey={confettiBurst} />
          <div className="w-full max-w-2xl rounded-[1.8rem] border border-white/75 bg-white/95 p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] ${
                winner === 'draw'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}>
                Raund yakuni
              </p>
              <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-600">
                Arena balli: {scoreBank}
              </p>
            </div>

            <h4 className="mt-3 font-kid text-4xl text-slate-900 sm:text-5xl">
              {winnerLabel === 'Durang' ? 'Durang natija' : `G'olib: ${winnerLabel}`}
            </h4>
            <p className="mt-2 text-base font-bold text-slate-600">
              {winnerLabel === 'Durang'
                ? `Har ikki jamoa: ${winnerScore} ball`
                : `${winnerLabel} olgan ball: ${winnerScore}`}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{leftLabel}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-800">{leftTeam.score}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{rightLabel}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-800">{rightTeam.score}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">Vaqt qoldi</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-800">{formatClock(timeLeft)}</p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <img
                src={tortishImage}
                alt="Bellashuv natija rasmi"
                className="h-44 w-full object-contain object-center"
              />
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
                onClick={startNewRound}
                className={`ui-accent-btn rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
              >
                Yangi raund
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default TugOfWarArena

