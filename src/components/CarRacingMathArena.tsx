import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfettiOverlay from './ConfettiOverlay'
import CarRaceTrack3D from './CarRaceTrack3D'
import {
  TEZKOR_HISOB_QUESTION_BANK,
  type TezkorHisobChoiceTask,
  type TezkorHisobDifficulty,
} from '../data/tezkorHisobQuestions.ts'

type Side = 'left' | 'right'
type Winner = Side | 'draw'
type Topic = TezkorHisobChoiceTask['topic']
type RoundResult = 'idle' | 'correct' | 'wrong' | 'timeout' | 'lost'
type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext }

export type TeacherCarMathQuestion = {
  difficulty: TezkorHisobDifficulty
  prompt: string
  options: [string, string, string, string]
  correctIndex: number
  topic?: Topic
}

type Props = {
  gameTitle: string
  gameTone: string
  leftTeamName?: string
  rightTeamName?: string
  initialDifficulty?: TezkorHisobDifficulty
  teacherQuestions?: TeacherCarMathQuestion[]
  enabledTopics?: Topic[]
  setupPath?: string
}

type TeamState = {
  score: number
  wins: number
  correct: number
  selected: number | null
  locked: boolean
  result: RoundResult
}

type DifficultyCfg = { seconds: number; points: number; autoNextMs: number }

const QUESTIONS_PER_RACE = 10
const ALL_TOPICS: Topic[] = ['+', '-', '*', '/']

const CFG: Record<TezkorHisobDifficulty, DifficultyCfg> = {
  Oson: { seconds: 25, points: 12, autoNextMs: 1800 },
  "O'rta": { seconds: 20, points: 16, autoNextMs: 1900 },
  Qiyin: { seconds: 16, points: 20, autoNextMs: 2100 },
}

const makeTeam = (): TeamState => ({
  score: 0,
  wins: 0,
  correct: 0,
  selected: null,
  locked: false,
  result: 'idle',
})

const resetRound = (team: TeamState): TeamState => ({ ...team, selected: null, locked: false, result: 'idle' })

const normalizePrompt = (v: string) =>
  v.toLowerCase().trim().replace(/[К»вЂ™`]/g, "'").replace(/\s+/g, ' ')

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
  return a
}

const shuffleTaskOptions = (task: TezkorHisobChoiceTask): TezkorHisobChoiceTask => {
  const correct = task.options[task.correctIndex]
  const options = shuffle(task.options)
  return { ...task, options, correctIndex: options.indexOf(correct) }
}

const parseMultiplyPrompt = (prompt: string) => {
  const m = prompt.match(/^\s*(\d+)\s*\*\s*(\d+)\s*=\s*\?\s*$/)
  if (!m) return null
  return { a: Number(m[1]), b: Number(m[2]) }
}

const buildNumberOptions = (answer: number): string[] => {
  const base = [answer - 1, answer + 1, answer + 2, answer - 2, answer + 3, answer - 3].filter((n) => n > 0)
  const wrongs: number[] = []
  for (const n of base) {
    if (n !== answer && !wrongs.includes(n)) wrongs.push(n)
    if (wrongs.length === 3) break
  }
  while (wrongs.length < 3) wrongs.push(answer + 5 + wrongs.length)
  return shuffle([String(answer), ...wrongs.map(String)])
}

const buildDivisionVariant = (task: TezkorHisobChoiceTask, seed: number): TezkorHisobChoiceTask | null => {
  const p = parseMultiplyPrompt(task.prompt)
  if (!p) return null
  const useA = seed % 2 === 0
  const divisor = useA ? p.a : p.b
  const quotient = useA ? p.b : p.a
  const options = buildNumberOptions(quotient)
  return {
    id: `crm-div-${task.id}-${useA ? 'a' : 'b'}`,
    type: 'choice',
    prompt: `${p.a * p.b} / ${divisor} = ?`,
    options,
    correctIndex: options.indexOf(String(quotient)),
    topic: '/',
  }
}

const buildDeck = (
  difficulty: TezkorHisobDifficulty,
  teacherQuestions: TeacherCarMathQuestion[],
  enabledTopics: Topic[],
) => {
  const active = enabledTopics.length ? enabledTopics : ALL_TOPICS
  const map = new Map<string, TezkorHisobChoiceTask>()

  teacherQuestions
    .filter((q) => q.difficulty === difficulty && active.includes(q.topic ?? '+'))
    .forEach((q, i) => {
      const prompt = q.prompt.trim()
      const key = normalizePrompt(prompt)
      if (!prompt || map.has(key)) return
      map.set(key, {
        id: `crm-teacher-${i}`,
        type: 'choice',
        prompt,
        options: [...q.options],
        correctIndex: q.correctIndex,
        topic: q.topic ?? '+',
      })
    })

  teacherQuestions
    .filter((q) => q.difficulty === difficulty && (q.topic ?? '+') === '*' && active.includes('/'))
    .forEach((q, i) => {
      const div = buildDivisionVariant(
        { id: `crm-src-${i}`, type: 'choice', prompt: q.prompt.trim(), options: [...q.options], correctIndex: q.correctIndex, topic: '*' },
        i,
      )
      if (!div) return
      const key = normalizePrompt(div.prompt)
      if (!map.has(key)) map.set(key, div)
    })

  TEZKOR_HISOB_QUESTION_BANK[difficulty].forEach((task, i) => {
    if (active.includes(task.topic)) {
      const key = normalizePrompt(task.prompt)
      if (!map.has(key)) map.set(key, task)
    }
    if (task.topic === '*' && active.includes('/')) {
      const div = buildDivisionVariant(task, i)
      if (!div) return
      const key = normalizePrompt(div.prompt)
      if (!map.has(key)) map.set(key, div)
    }
  })

  return shuffle(Array.from(map.values())).map(shuffleTaskOptions).slice(0, QUESTIONS_PER_RACE)
}

const roundResultLabel = (r: RoundResult) => {
  if (r === 'correct') return "To'g'ri"
  if (r === 'wrong') return 'Xato'
  if (r === 'timeout') return 'Vaqt tugadi'
  if (r === 'lost') return 'Raqib oldin topdi'
  return 'Kutilmoqda'
}

function RaceCar({
  side,
  label,
  progress,
  moving,
}: {
  side: Side
  label: string
  progress: number
  moving: boolean
}) {
  const bodyGradient = side === 'left'
    ? 'linear-gradient(145deg,#22d3ee 0%,#0ea5e9 55%,#2563eb 100%)'
    : 'linear-gradient(145deg,#fb7185 0%,#ef4444 55%,#b91c1c 100%)'
  const glowClass = side === 'left' ? 'bg-cyan-300/35' : 'bg-rose-300/35'
  return (
    <div
      className="absolute left-4 top-1/2 z-20 h-14 w-20 -translate-y-1/2 transition-transform duration-700 ease-out"
      style={{ transform: `translateX(${progress}%) translateY(-50%)` }}
    >
      <div className={`absolute inset-0 rounded-[18px] blur-xl ${glowClass} ${moving ? 'animate-pulse' : ''}`} />
      <div
        className="absolute inset-0"
        style={{ animation: moving ? 'crm-car-boost .7s ease-out' : 'crm-car-idle 1.5s ease-in-out infinite' }}
      >
        <div className="absolute bottom-2 left-1 right-1 h-7 rounded-[12px] border border-white/15 shadow-lg" style={{ background: bodyGradient }} />
        <div className="absolute bottom-8 left-5 right-4 h-5 rounded-t-[11px] border border-white/20 bg-white/15" />
        <div className="absolute bottom-[6px] left-2 h-5 w-5 rounded-full border-2 border-slate-100/60 bg-slate-900" style={{ animation: `crm-wheel-spin ${moving ? '.18s' : '1.2s'} linear infinite` }}>
          <div className="absolute inset-[4px] rounded-full bg-slate-300" />
        </div>
        <div className="absolute bottom-[6px] right-2 h-5 w-5 rounded-full border-2 border-slate-100/60 bg-slate-900" style={{ animation: `crm-wheel-spin ${moving ? '.18s' : '1.2s'} linear infinite` }}>
          <div className="absolute inset-[4px] rounded-full bg-slate-300" />
        </div>
        {moving ? (
          <>
            <div className="absolute -left-3 bottom-7 h-3 w-4 rounded-full bg-amber-300/80 blur-[1px]" style={{ animation: 'crm-flame .14s ease-in-out infinite' }} />
            <div className="absolute -left-5 bottom-8 h-2 w-3 rounded-full bg-orange-200/80 blur-[1px]" style={{ animation: 'crm-flame .12s ease-in-out infinite' }} />
          </>
        ) : null}
      </div>
      <div className={`absolute -top-6 left-0 rounded-full px-2 py-1 text-[10px] font-extrabold text-white ${side === 'left' ? 'bg-cyan-500/90' : 'bg-rose-500/90'}`}>
        {label}
      </div>
    </div>
  )
}

function CarRacingMathArena({
  gameTitle,
  gameTone,
  leftTeamName = '1-Jamoa',
  rightTeamName = '2-Jamoa',
  initialDifficulty = "O'rta",
  teacherQuestions = [],
  enabledTopics = ALL_TOPICS,
  setupPath = '/games/car-racing-math',
}: Props) {
  const cfg = CFG[initialDifficulty]
  const [questions, setQuestions] = useState(() => buildDeck(initialDifficulty, teacherQuestions, enabledTopics))
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [roundIndex, setRoundIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(cfg.seconds)
  const [left, setLeft] = useState<TeamState>(makeTeam)
  const [right, setRight] = useState<TeamState>(makeTeam)
  const [roundWinner, setRoundWinner] = useState<Side | null>(null)
  const [awaitingNext, setAwaitingNext] = useState(false)
  const [statusText, setStatusText] = useState(`Boshlashni bosing. Bir xil misol chiqadi, kim tez topsa mashinasi finishga yuradi (${QUESTIONS_PER_RACE} qadam).`)
  const [winner, setWinner] = useState<Winner | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [leftMoving, setLeftMoving] = useState(false)
  const [rightMoving, setRightMoving] = useState(false)
  const [startCountdown, setStartCountdown] = useState<number | 'GO' | null>(null)

  const nextTimerRef = useRef<number | null>(null)
  const moveTimerLeftRef = useRef<number | null>(null)
  const moveTimerRightRef = useRef<number | null>(null)
  const startCountdownTimerRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const engineNodesRef = useRef<{
    oscA: OscillatorNode
    oscB: OscillatorNode
    lfo: OscillatorNode
    lfoGain: GainNode
    filter: BiquadFilterNode
    gain: GainNode
  } | null>(null)

  const leftLabel = leftTeamName.trim() || '1-Jamoa'
  const rightLabel = rightTeamName.trim() || '2-Jamoa'
  const question = questions.length ? questions[roundIndex % questions.length] : null
  const roundNo = roundIndex + 1
  const customCount = teacherQuestions.filter((q) => q.difficulty === initialDifficulty && enabledTopics.includes(q.topic ?? '+')).length
  const topicsLabel = enabledTopics.length === ALL_TOPICS.length ? 'Hamma amallar' : enabledTopics.join(' • ')
  const leftProgress = Math.min(88, (left.wins / QUESTIONS_PER_RACE) * 88)
  const rightProgress = Math.min(88, (right.wins / QUESTIONS_PER_RACE) * 88)

  const clearNextTimer = () => {
    if (nextTimerRef.current) {
      window.clearTimeout(nextTimerRef.current)
      nextTimerRef.current = null
    }
  }

  const clearStartCountdownTimer = () => {
    if (startCountdownTimerRef.current) {
      window.clearTimeout(startCountdownTimerRef.current)
      startCountdownTimerRef.current = null
    }
  }

  const getAudioContext = () => {
    if (typeof window === 'undefined') return null
    if (audioCtxRef.current) return audioCtxRef.current
    const Ctx = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext
    if (!Ctx) return null
    audioCtxRef.current = new Ctx()
    return audioCtxRef.current
  }

  const ensureEngineNodes = () => {
    const ctx = getAudioContext()
    if (!ctx) return null
    if (engineNodesRef.current) return { ctx, nodes: engineNodesRef.current }

    const oscA = ctx.createOscillator()
    const oscB = ctx.createOscillator()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()

    oscA.type = 'sawtooth'
    oscB.type = 'triangle'
    lfo.type = 'sine'

    filter.type = 'lowpass'
    filter.frequency.value = 420
    filter.Q.value = 0.7

    gain.gain.value = 0
    lfoGain.gain.value = 4
    lfo.frequency.value = 7.5
    oscA.frequency.value = 72
    oscB.frequency.value = 37

    oscA.connect(gain)
    oscB.connect(gain)
    gain.connect(filter)
    filter.connect(ctx.destination)

    lfo.connect(lfoGain)
    lfoGain.connect(oscA.frequency)
    lfoGain.connect(oscB.frequency)

    oscA.start()
    oscB.start()
    lfo.start()

    engineNodesRef.current = { oscA, oscB, lfo, lfoGain, filter, gain }
    return { ctx, nodes: engineNodesRef.current }
  }

  const startEngineAudio = () => {
    const payload = ensureEngineNodes()
    if (!payload) return
    const { ctx, nodes } = payload
    void ctx.resume().catch(() => undefined)
    const now = ctx.currentTime
    nodes.gain.gain.cancelScheduledValues(now)
    nodes.gain.gain.setTargetAtTime(0.2, now, 0.12)
  }

  const stopEngineAudio = () => {
    const ctx = audioCtxRef.current
    const nodes = engineNodesRef.current
    if (!ctx || !nodes) return
    const now = ctx.currentTime
    nodes.gain.gain.cancelScheduledValues(now)
    nodes.gain.gain.setTargetAtTime(0.0001, now, 0.08)
  }

  const playWinAudio = () => {
    const ctx = getAudioContext()
    if (!ctx) return
    void ctx.resume().catch(() => undefined)
    const now = ctx.currentTime
    const notes = [392, 523.25, 659.25, 783.99]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = idx % 2 === 0 ? 'triangle' : 'square'
      osc.frequency.setValueAtTime(freq, now + idx * 0.12)
      gain.gain.setValueAtTime(0.0001, now + idx * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.32, now + idx * 0.12 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.22)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.12)
      osc.stop(now + idx * 0.12 + 0.24)
    })
  }

  const pulseMove = (side: Side) => {
    if (side === 'left') {
      setLeftMoving(true)
      if (moveTimerLeftRef.current) window.clearTimeout(moveTimerLeftRef.current)
      moveTimerLeftRef.current = window.setTimeout(() => setLeftMoving(false), 900)
      return
    }
    setRightMoving(true)
    if (moveTimerRightRef.current) window.clearTimeout(moveTimerRightRef.current)
    moveTimerRightRef.current = window.setTimeout(() => setRightMoving(false), 900)
  }

  const finishRace = (preferred?: Winner) => {
    const resolved: Winner = preferred
      ?? (left.score > right.score
        ? 'left'
        : right.score > left.score
          ? 'right'
          : left.wins > right.wins
            ? 'left'
            : right.wins > left.wins
              ? 'right'
              : 'draw')
    setStarted(false)
    setFinished(true)
    setWinner(resolved)
    setShowWinnerModal(true)
    setConfettiBurst((v) => v + 1)
    setStatusText(
      resolved === 'draw'
        ? "Poyga durang yakunlandi."
        : `${resolved === 'left' ? leftLabel : rightLabel} poygada g'olib bo'ldi!`,
    )
    stopEngineAudio()
    playWinAudio()
  }

  const goNextRound = () => {
    setRoundIndex((v) => v + 1)
    setTimeLeft(cfg.seconds)
    setRoundWinner(null)
    setAwaitingNext(false)
    setLeft((prev) => resetRound(prev))
    setRight((prev) => resetRound(prev))
  }

  const scheduleNextRound = (message: string) => {
    if (awaitingNext || finished) return
    setAwaitingNext(true)
    setStatusText(message)
    clearNextTimer()
    nextTimerRef.current = window.setTimeout(goNextRound, cfg.autoNextMs)
  }

  const maybeNoWinnerAdvance = (nextLeft: TeamState, nextRight: TeamState) => {
    if (roundWinner) return
    if (nextLeft.locked && nextRight.locked) {
      scheduleNextRound("Ikkala jamoa ham topolmadi. Keyingi misolga o'tamiz.")
    }
  }

  const handleAnswer = (side: Side, optionIndex: number) => {
    if (!started || finished || awaitingNext || !question) return
    const team = side === 'left' ? left : right
    if (team.locked) return

    const isCorrect = optionIndex === question.correctIndex
    if (isCorrect && !roundWinner) {
      const bonus = Math.max(0, Math.floor(timeLeft / 4))
      const gain = cfg.points + bonus
      setRoundWinner(side)
      if (side === 'left') {
        const nextLeft = { ...left, selected: optionIndex, locked: true, result: 'correct' as const, score: left.score + gain, wins: left.wins + 1, correct: left.correct + 1 }
        const nextRight = right.locked ? right : { ...right, locked: true, result: 'lost' as const }
        setLeft(nextLeft)
        setRight(nextRight)
        pulseMove('left')
        scheduleNextRound(`${leftLabel} birinchi topdi! Mashina oldinga yurdi (+${gain}).`)
      } else {
        const nextRight = { ...right, selected: optionIndex, locked: true, result: 'correct' as const, score: right.score + gain, wins: right.wins + 1, correct: right.correct + 1 }
        const nextLeft = left.locked ? left : { ...left, locked: true, result: 'lost' as const }
        setLeft(nextLeft)
        setRight(nextRight)
        pulseMove('right')
        scheduleNextRound(`${rightLabel} birinchi topdi! Mashina oldinga yurdi (+${gain}).`)
      }
      return
    }

    if (side === 'left') {
      const nextLeft = { ...left, selected: optionIndex, locked: true, result: 'wrong' as const }
      setLeft(nextLeft)
      setStatusText(`${leftLabel} xato. ${rightLabel} javob berishi mumkin.`)
      maybeNoWinnerAdvance(nextLeft, right)
    } else {
      const nextRight = { ...right, selected: optionIndex, locked: true, result: 'wrong' as const }
      setRight(nextRight)
      setStatusText(`${rightLabel} xato. ${leftLabel} javob berishi mumkin.`)
      maybeNoWinnerAdvance(left, nextRight)
    }
  }

  const launchGame = () => {
    startEngineAudio()
    setStarted(true)
    setStatusText(`Poyga boshlandi. ${roundNo}-misol: kim tez topsa, o'sha yuradi!`)
  }

  const startGame = () => {
    if (started || finished || startCountdown !== null) return
    clearStartCountdownTimer()
    const steps: Array<number | 'GO'> = [3, 2, 1, 'GO']
    let index = 0
    setStartCountdown(steps[index])

    const advance = () => {
      index += 1
      if (index >= steps.length) {
        setStartCountdown(null)
        launchGame()
        return
      }
      setStartCountdown(steps[index])
      const delay = steps[index] === 'GO' ? 600 : 720
      startCountdownTimerRef.current = window.setTimeout(advance, delay)
    }

    startCountdownTimerRef.current = window.setTimeout(advance, 720)
  }

  const resetGame = () => {
    clearNextTimer()
    clearStartCountdownTimer()
    if (moveTimerLeftRef.current) window.clearTimeout(moveTimerLeftRef.current)
    if (moveTimerRightRef.current) window.clearTimeout(moveTimerRightRef.current)
    stopEngineAudio()
    setQuestions(buildDeck(initialDifficulty, teacherQuestions, enabledTopics))
    setStarted(false)
    setFinished(false)
    setRoundIndex(0)
    setTimeLeft(cfg.seconds)
    setLeft(makeTeam())
    setRight(makeTeam())
    setRoundWinner(null)
    setAwaitingNext(false)
    setWinner(null)
    setShowWinnerModal(false)
    setLeftMoving(false)
    setRightMoving(false)
    setStartCountdown(null)
    setStatusText(`Boshlashni bosing. Bir xil misol chiqadi, kim tez topsa mashinasi finishga yuradi (${QUESTIONS_PER_RACE} qadam).`)
  }

  useEffect(() => {
    const payload = engineNodesRef.current
    const ctx = audioCtxRef.current
    if (!payload || !ctx) return
    const now = ctx.currentTime
    const active = started && !finished
    const burst = leftMoving || rightMoving
    const avgProgress = (leftProgress + rightProgress) * 0.5
    const baseHz = active ? 74 + avgProgress * 0.65 + (burst ? 28 : 0) : 58
    payload.oscA.frequency.cancelScheduledValues(now)
    payload.oscB.frequency.cancelScheduledValues(now)
    payload.filter.frequency.cancelScheduledValues(now)
    payload.lfo.frequency.cancelScheduledValues(now)
    payload.gain.gain.cancelScheduledValues(now)
    payload.oscA.frequency.setTargetAtTime(baseHz, now, 0.08)
    payload.oscB.frequency.setTargetAtTime(baseHz * 0.52, now, 0.08)
    payload.filter.frequency.setTargetAtTime(active ? (burst ? 980 : 560) : 320, now, 0.1)
    payload.lfo.frequency.setTargetAtTime(active ? (burst ? 13 : 8) : 5, now, 0.12)
    payload.gain.gain.setTargetAtTime(active ? (burst ? 0.52 : 0.24) : 0.0001, now, 0.08)
  }, [started, finished, leftMoving, rightMoving, leftProgress, rightProgress])

  useEffect(() => {
    if (!started || finished || awaitingNext) return
    const id = window.setInterval(() => setTimeLeft((v) => Math.max(v - 1, 0)), 1000)
    return () => window.clearInterval(id)
  }, [started, finished, awaitingNext])

  useEffect(() => {
    if (!started || finished || awaitingNext || timeLeft > 0) return
    const nextLeft = left.locked ? left : { ...left, locked: true, result: 'timeout' as const }
    const nextRight = right.locked ? right : { ...right, locked: true, result: 'timeout' as const }
    if (!left.locked) setLeft(nextLeft)
    if (!right.locked) setRight(nextRight)
    if (!roundWinner) {
      scheduleNextRound("Vaqt tugadi. Bu raundda hech kim yurmadi.")
    }
  }, [timeLeft, started, finished, awaitingNext, left, right, roundWinner])

  useEffect(() => {
    if (finished) return
    if (left.wins >= QUESTIONS_PER_RACE) finishRace('left')
    if (right.wins >= QUESTIONS_PER_RACE) finishRace('right')
  }, [left.wins, right.wins, finished])

  useEffect(() => {
    return () => {
      clearNextTimer()
      clearStartCountdownTimer()
      if (moveTimerLeftRef.current) window.clearTimeout(moveTimerLeftRef.current)
      if (moveTimerRightRef.current) window.clearTimeout(moveTimerRightRef.current)
      stopEngineAudio()
    }
  }, [])

  const renderOptionPanel = (side: Side, team: TeamState, label: string, tone: string) => {
    const disabled = !started || finished || awaitingNext || team.locked || !question
    const frameTone = side === 'left' ? 'border-cyan-200 bg-cyan-50/45' : 'border-rose-200 bg-rose-50/45'
    return (
      <article className={`h-full w-[300px] max-w-full justify-self-center rounded-[1.4rem] border p-2.5 shadow-soft ${frameTone}`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-kid text-xl text-slate-900 xl:text-2xl">{label}</h3>
          <span className={`rounded-full bg-gradient-to-r px-2.5 py-1 text-[11px] font-extrabold text-white ${tone}`}>{team.score} ball</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/70 ring-1 ring-white/60">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${tone} transition-all duration-700`}
            style={{ width: `${Math.min(100, (team.wins / QUESTIONS_PER_RACE) * 100)}%` }}
          />
        </div>
        <div className="mt-2.5 h-11 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-center text-xs font-extrabold text-slate-500 xl:h-12 xl:text-sm">
          {team.locked
            ? team.result === 'correct'
              ? "To'g'ri javob!"
              : team.result === 'lost'
                ? "Raqib oldin topdi"
                : team.result === 'wrong'
                  ? "Xato javob"
                  : team.result === 'timeout'
                    ? 'Vaqt tugadi'
                    : "Javob berildi"
            : "Variantni tanlang"}
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-xl border border-slate-200 bg-white px-1.5 py-2"><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Qadam</p><p className="mt-1 text-xs font-extrabold text-slate-700 xl:text-sm">{team.wins}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white px-1.5 py-2"><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">To'g'ri</p><p className="mt-1 text-xs font-extrabold text-slate-700 xl:text-sm">{team.correct}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white px-1.5 py-2"><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Holat</p><p className="mt-1 text-[10px] font-extrabold text-slate-700 xl:text-[11px]">{roundResultLabel(team.result)}</p></div>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2 [grid-auto-rows:1fr]">
          {question?.options.map((opt, i) => {
            const picked = team.selected === i
            const correct = question.correctIndex === i
            const base = !team.locked
              ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky-300'
              : correct
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : picked
                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                  : 'border-slate-200 bg-slate-100 text-slate-500'
            return (
              <button
                key={`${side}-${question?.id}-${i}`}
                type="button"
                onClick={() => handleAnswer(side, i)}
                disabled={disabled}
                className={`rounded-2xl border px-2.5 py-2 text-left transition ${base} ${disabled ? 'cursor-not-allowed opacity-95' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-black text-slate-700 xl:h-8 xl:w-8 xl:text-sm">{String.fromCharCode(65 + i)}</span>
                  <span className="text-xs font-extrabold leading-snug xl:text-sm">{opt}</span>
                </div>
              </button>
            )
          })}
        </div>
      </article>
    )
  }

  const renderLaneOptionsOverlay = (side: Side, team: TeamState, tone: string) => {
    const disabled = !started || finished || awaitingNext || team.locked || !question
    const shellTone = side === 'left'
      ? 'border-cyan-200/60 bg-slate-950/72 shadow-cyan-500/10'
      : 'border-rose-200/60 bg-slate-950/72 shadow-rose-500/10'

    return (
      <div className={`w-[228px] rounded-[1rem] border p-2.5 backdrop-blur-md shadow-xl sm:w-[276px] ${shellTone}`}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className={`rounded-full bg-gradient-to-r px-2.5 py-1 text-[10px] font-extrabold text-white sm:px-3 sm:text-[11px] ${tone}`}>
            {team.score} ball
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/70 sm:text-[10px]">{roundResultLabel(team.result)}</span>
        </div>

        <div className="mb-2 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/55 sm:text-[10px]">Savol</p>
          <p className="mt-1 text-[11px] font-extrabold leading-tight text-white sm:text-xs">
            {question?.prompt ?? 'Savol tayyorlanmoqda...'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {question?.options.map((opt, i) => {
            const picked = team.selected === i
            const correct = question.correctIndex === i
            const base = !team.locked
              ? 'border-white/15 bg-white/10 text-white hover:-translate-y-0.5 hover:border-sky-300/80 hover:bg-white/15'
              : correct
                ? 'border-emerald-300/70 bg-emerald-500/20 text-emerald-100'
                : picked
                  ? 'border-rose-300/70 bg-rose-500/20 text-rose-100'
                  : 'border-white/10 bg-white/5 text-white/55'
            return (
              <button
                key={`lane-${side}-${question?.id}-${i}`}
                type="button"
                onClick={() => handleAnswer(side, i)}
                disabled={disabled}
                className={`relative min-h-[70px] rounded-2xl border px-2 py-2 text-center transition sm:min-h-[80px] sm:px-2.5 sm:py-2.5 ${base} ${disabled ? 'cursor-not-allowed' : ''}`}
              >
                <div className="pointer-events-none absolute inset-x-2 bottom-1 h-3 rounded-full bg-white/5 blur-sm" />
                <div className="relative flex h-full flex-col items-center justify-center gap-1.5 sm:gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/15 text-xs font-black shadow-inner sm:h-10 sm:w-10 sm:text-sm">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="px-1 text-center text-[12px] font-extrabold leading-tight sm:text-sm">
                    {opt}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <section className="glass-card relative flex flex-col overflow-hidden p-3 sm:p-4" data-aos="fade-up" data-aos-delay="80">
      <style>{`
        @keyframes crm-wheel-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes crm-road-move { from { background-position-x: 0; } to { background-position-x: -220px; } }
        @keyframes crm-car-idle { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes crm-car-boost { 0% { transform: translateY(0) scale(1); } 25% { transform: translateY(-3px) scale(1.02); } 50% { transform: translateY(1px) scale(.995); } 100% { transform: translateY(0) scale(1); } }
        @keyframes crm-flame { 0%,100% { transform: scale(1) translateX(0); opacity: .65; } 50% { transform: scale(1.25) translateX(-3px); opacity: .95; } }
        @keyframes crm-countdown-pop { 0% { transform: scale(0.62); opacity: 0; } 55% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      <div className="pointer-events-none absolute -left-16 top-10 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-6 h-44 w-44 rounded-full bg-blue-200/35 blur-3xl" />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-sky-700 sm:text-xs">Car Racing Math</p>
          <h2 className="mt-1 font-kid text-3xl text-slate-900 sm:text-4xl">{gameTitle} Arena</h2>
          <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Bir xil misol • kim tez topsa mashina yuradi • finishgacha {QUESTIONS_PER_RACE} qadam</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={setupPath} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5 sm:text-xs">{'< '}Orqaga</Link>
          <button type="button" onClick={resetGame} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5 sm:text-xs">Qayta</button>
        </div>
      </div>

      <div className="relative z-10 mt-2 min-h-0 flex-1 rounded-[1.8rem] border border-slate-200 bg-white p-2.5 shadow-soft">
        <div className="grid h-full min-h-0 items-start gap-3">
          <div className="h-full overflow-hidden rounded-2xl border border-slate-300 bg-slate-950 shadow-lg">
            <div className="flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-slate-900/85 p-2.5">
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-sm font-extrabold text-slate-700">
                <span className="text-sky-500">TIME</span>
                <span>{started && !finished ? `${timeLeft}s` : '--'}</span>
              </div>

              <h3 className="mt-2 text-center font-kid text-2xl text-white sm:text-3xl">Jamoaviy poyga</h3>

              <div className="mt-2 flex justify-center">
                <button
                  type="button"
                  onClick={startGame}
                  disabled={started || finished || startCountdown !== null}
                  className={`rounded-xl bg-gradient-to-r px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-soft transition sm:px-5 sm:text-xs ${
                    started || finished || startCountdown !== null ? 'cursor-not-allowed opacity-70' : `hover:-translate-y-0.5 ${gameTone}`
                  }`}
                >
                  {startCountdown !== null ? 'Tayyorlaning...' : started ? "O'yin davom etmoqda" : "O'yinni boshlash"}
                </button>
              </div>

              {startCountdown !== null ? (
                <div className="mt-2 flex justify-center">
                  <div
                    key={String(startCountdown)}
                    className="grid h-20 w-20 place-items-center rounded-full border-2 border-white/80 bg-white/90 text-4xl font-black text-slate-900 shadow-soft sm:h-24 sm:w-24 sm:text-5xl"
                    style={{ animation: 'crm-countdown-pop .62s cubic-bezier(.24,.86,.24,1) both' }}
                  >
                    {startCountdown}
                  </div>
                </div>
              ) : null}

              <div className="mt-2 flex items-center justify-center gap-2 text-xs font-extrabold sm:text-sm">
                <span className="rounded-full bg-cyan-500 px-3 py-1 text-white">{leftLabel}: {left.score} ball</span>
                <span className="text-white/60">|</span>
                <span className="rounded-full bg-rose-500 px-3 py-1 text-white">{rightLabel}: {right.score} ball</span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 text-center text-[11px] font-extrabold text-slate-200 sm:text-xs">
                <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-1.5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Savol</p>
                  <p className="mt-0.5 text-sm font-black text-white">{roundNo}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-1.5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Amal • Daraja</p>
                  <p className="mt-0.5 text-sm font-black text-white">{question?.topic ?? '-'} • {initialDifficulty}</p>
                </div>
              </div>

              <div className="mt-1 h-[21rem] shrink-0 rounded-3xl border border-white/10 bg-white/5 p-1.5 sm:h-[26rem] sm:p-2 lg:h-[38rem]">
                <div className="relative h-full overflow-hidden rounded-2xl border border-white/10">
                  <CarRaceTrack3D
                    leftLabel={leftLabel}
                    rightLabel={rightLabel}
                    leftProgress={leftProgress}
                    rightProgress={rightProgress}
                    leftMoving={leftMoving}
                    rightMoving={rightMoving}
                    started={started}
                    finished={finished}
                    className="h-full"
                  />

                  <div className="absolute left-2 top-3 z-10 sm:left-3 sm:top-3">
                    {renderLaneOptionsOverlay('left', left, 'from-cyan-500 to-blue-500')}
                  </div>
                  <div className="absolute right-2 top-3 z-10 sm:right-3 sm:top-3">
                    {renderLaneOptionsOverlay('right', right, 'from-rose-500 to-red-500')}
                  </div>
                </div>
              </div>

              <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-2.5">
                <div className="flex items-center justify-between gap-3 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-300">
                  <span>{roundWinner ? `${roundWinner === 'left' ? leftLabel : rightLabel} yutdi` : 'Teng holat'}</span>
                  <span>Vaqt progress: {Math.round((timeLeft / cfg.seconds) * 100)}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${gameTone}`}
                    style={{ width: `${Math.max(0, Math.min(100, Math.round((timeLeft / cfg.seconds) * 100)))}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-300">
                  <span>{leftLabel}: {Math.round((left.wins / QUESTIONS_PER_RACE) * 100)}%</span>
                  <span>{rightLabel}: {Math.round((right.wins / QUESTIONS_PER_RACE) * 100)}%</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full border border-white/10 bg-white/10">
                  <div className="flex h-full w-full">
                    <span className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${Math.round((left.wins / QUESTIONS_PER_RACE) * 100)}%` }} />
                    <span className="h-full bg-gradient-to-r from-rose-500 to-red-600" style={{ width: `${Math.round((right.wins / QUESTIONS_PER_RACE) * 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className={`mt-2 rounded-2xl border px-3 py-2 text-center text-[11px] font-extrabold sm:text-xs ${
                finished ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
              }`}>
                {statusText}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showWinnerModal ? (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <ConfettiOverlay burstKey={confettiBurst} variant={winner === 'draw' ? 'lose' : 'win'} pieces={winner === 'draw' ? 96 : 160} />
          <div className="relative z-[2] w-full max-w-2xl rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-soft">
            <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-blue-700">Car Racing Math yakunlandi</p>
            <h3 className="mt-3 font-kid text-4xl text-slate-900 sm:text-5xl">{winner === 'draw' ? 'Durang poyga' : `G'olib: ${winner === 'left' ? leftLabel : rightLabel}`}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-center"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-cyan-700">{leftLabel}</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{left.score}</p><p className="text-sm font-bold text-slate-600">{left.wins} qadam • {left.correct} to'g'ri</p></div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-rose-700">{rightLabel}</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{right.score}</p><p className="text-sm font-bold text-slate-600">{right.wins} qadam • {right.correct} to'g'ri</p></div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowWinnerModal(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700">Yopish</button>
              <button type="button" onClick={resetGame} className={`rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${gameTone}`}>Yangi poyga</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default CarRacingMathArena
