import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfettiOverlay from './ConfettiOverlay'
import {
  TEZKOR_HISOB_QUESTION_BANK,
  type TezkorHisobChoiceTask,
  type TezkorHisobDifficulty,
} from '../data/tezkorHisobQuestions.ts'

type Side = 'left' | 'right'
type Winner = Side | 'draw'
type RoundResult = 'correct' | 'wrong' | 'timeout' | null

export type TeacherTezkorQuestion = {
  difficulty: TezkorHisobDifficulty
  prompt: string
  options: [string, string, string, string]
  correctIndex: number
  topic?: '+' | '-' | '*' | '/'
}

type Props = {
  gameTitle: string
  gameTone: string
  leftTeamName?: string
  rightTeamName?: string
  initialDifficulty?: TezkorHisobDifficulty
  teacherQuestions?: TeacherTezkorQuestion[]
  enabledTopics?: TezkorHisobChoiceTask['topic'][]
  setupPath?: string
}

type DifficultyConfig = {
  seconds: number
  points: number
  autoNextMs: number
}

type TeamRuntime = {
  index: number
  timeLeft: number
  selected: number | null
  locked: boolean
  awaitingNext: boolean
  result: RoundResult
  score: number
  correct: number
}

const QUESTIONS_PER_TEAM = 8
const ALL_TOPICS: TezkorHisobChoiceTask['topic'][] = ['+', '-', '*', '/']

const CONFIG: Record<TezkorHisobDifficulty, DifficultyConfig> = {
  Oson: { seconds: 30, points: 12, autoNextMs: 1800 },
  "O'rta": { seconds: 30, points: 16, autoNextMs: 1900 },
  Qiyin: { seconds: 30, points: 20, autoNextMs: 2000 },
}

const makeTeamRuntime = (seconds: number): TeamRuntime => ({
  index: 0,
  timeLeft: seconds,
  selected: null,
  locked: false,
  awaitingNext: false,
  result: null,
  score: 0,
  correct: 0,
})

const normalizePrompt = (value: string) =>
  value.toLowerCase().trim().replace(/[ʻ’`]/g, "'").replace(/\s+/g, ' ')

const shuffle = <T,>(items: T[]) => {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
  return arr
}

const shuffleChoiceOptions = (task: TezkorHisobChoiceTask): TezkorHisobChoiceTask => {
  const correctValue = task.options[task.correctIndex]
  const options = shuffle(task.options)
  return {
    ...task,
    options,
    correctIndex: options.indexOf(correctValue),
  }
}

const parseMultiplyPrompt = (prompt: string) => {
  const match = prompt.match(/^\s*(\d+)\s*\*\s*(\d+)\s*=\s*\?\s*$/)
  if (!match) return null
  return { a: Number(match[1]), b: Number(match[2]) }
}

const buildNumberOptions = (answer: number): string[] => {
  const candidates = [
    answer - 1,
    answer + 1,
    answer + 2,
    answer - 2,
    answer + 3,
    answer - 3,
    answer + 4,
    answer - 4,
  ].filter((value) => value > 0 && value !== answer)

  const wrongs: number[] = []
  for (const value of candidates) {
    if (!wrongs.includes(value)) wrongs.push(value)
    if (wrongs.length >= 3) break
  }
  while (wrongs.length < 3) {
    const fallback = answer + 5 + wrongs.length
    if (!wrongs.includes(fallback)) wrongs.push(fallback)
  }

  return shuffle([String(answer), ...wrongs.map(String)])
}

const buildDivisionVariant = (task: TezkorHisobChoiceTask, seed: number): TezkorHisobChoiceTask | null => {
  const parsed = parseMultiplyPrompt(task.prompt)
  if (!parsed) return null

  const useFirstFactorAsDivisor = seed % 2 === 0
  const divisor = useFirstFactorAsDivisor ? parsed.a : parsed.b
  const quotient = useFirstFactorAsDivisor ? parsed.b : parsed.a
  const dividend = parsed.a * parsed.b
  const options = buildNumberOptions(quotient)

  return {
    id: `division-${task.id}-${useFirstFactorAsDivisor ? 'a' : 'b'}`,
    type: 'choice',
    prompt: `${dividend} / ${divisor} = ?`,
    options,
    correctIndex: options.indexOf(String(quotient)),
    topic: '/',
  }
}

const buildDeck = (
  difficulty: TezkorHisobDifficulty,
  teacherQuestions: TeacherTezkorQuestion[],
  enabledTopics: TezkorHisobChoiceTask['topic'][],
): TezkorHisobChoiceTask[] => {
  const activeTopics = enabledTopics.length ? enabledTopics : ALL_TOPICS
  const map = new Map<string, TezkorHisobChoiceTask>()

  teacherQuestions
    .filter((item) => item.difficulty === difficulty && activeTopics.includes(item.topic ?? '+'))
    .forEach((item, index) => {
      const prompt = item.prompt.trim()
      const key = normalizePrompt(prompt)
      if (!prompt || map.has(key)) return
      map.set(key, {
        id: `teacher-${difficulty}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'choice',
        prompt,
        options: [...item.options],
        correctIndex: item.correctIndex,
        topic: item.topic ?? '+',
      })
    })

  teacherQuestions
    .filter((item) => item.difficulty === difficulty && (item.topic ?? '+') === '*' && activeTopics.includes('/'))
    .forEach((item, index) => {
      const sourceTask: TezkorHisobChoiceTask = {
        id: `teacher-source-${difficulty}-${index}`,
        type: 'choice',
        prompt: item.prompt.trim(),
        options: [...item.options],
        correctIndex: item.correctIndex,
        topic: '*',
      }
      const divisionTask = buildDivisionVariant(sourceTask, index)
      if (!divisionTask) return
      const key = normalizePrompt(divisionTask.prompt)
      if (!map.has(key)) map.set(key, divisionTask)
    })

  TEZKOR_HISOB_QUESTION_BANK[difficulty].forEach((task, index) => {
    if (activeTopics.includes(task.topic)) {
      const key = normalizePrompt(task.prompt)
      if (!map.has(key)) map.set(key, task)
    }
    if (task.topic === '*' && activeTopics.includes('/')) {
      const divisionTask = buildDivisionVariant(task, index)
      if (!divisionTask) return
      const key = normalizePrompt(divisionTask.prompt)
      if (!map.has(key)) map.set(key, divisionTask)
    }
  })

  return shuffle(Array.from(map.values())).map(shuffleChoiceOptions).slice(0, QUESTIONS_PER_TEAM)
}

function TezkorHisobArena({
  gameTitle,
  gameTone,
  leftTeamName = '1-Jamoa',
  rightTeamName = '2-Jamoa',
  initialDifficulty = "O'rta",
  teacherQuestions = [],
  enabledTopics = ALL_TOPICS,
  setupPath = '/games/tezkor-hisob',
}: Props) {
  const cfg = CONFIG[initialDifficulty]
  const [questions, setQuestions] = useState<TezkorHisobChoiceTask[]>(() => buildDeck(initialDifficulty, teacherQuestions, enabledTopics))
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [left, setLeft] = useState<TeamRuntime>(() => makeTeamRuntime(cfg.seconds))
  const [right, setRight] = useState<TeamRuntime>(() => makeTeamRuntime(cfg.seconds))
  const [statusText, setStatusText] = useState(
    `Boshlash tugmasini bosing. Ikkala jamoa parallel ishlaydi (${QUESTIONS_PER_TEAM} ta savol).`,
  )
  const [winner, setWinner] = useState<Winner | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const bgmGainRef = useRef<GainNode | null>(null)
  const bgmLoopRef = useRef<number | null>(null)
  const bgmStepRef = useRef(0)

  const leftLabel = leftTeamName.trim() || '1-Jamoa'
  const rightLabel = rightTeamName.trim() || '2-Jamoa'
  const totalRounds = QUESTIONS_PER_TEAM
  const leftQuestion = left.index < totalRounds ? questions[left.index] : undefined
  const rightQuestion = right.index < totalRounds ? questions[right.index] : undefined
  const completedQuestions = Math.min(left.index, totalRounds) + Math.min(right.index, totalRounds)
  const progressPercent = totalRounds > 0 ? Math.round((completedQuestions / (totalRounds * 2)) * 100) : 0
  const customCountByDifficulty = teacherQuestions.filter(
    (q) => q.difficulty === initialDifficulty && enabledTopics.includes(q.topic ?? '+'),
  ).length
  const topicLabelSafe =
    enabledTopics.length === ALL_TOPICS.length
      ? 'Hamma amallar'
      : enabledTopics.map((topic) => (topic === '/' ? '/' : topic)).join(' | ')
  const topicLabel =
    enabledTopics.length === ALL_TOPICS.length
      ? 'Hamma amallar'
      : enabledTopics.map((topic) => (topic === '/' ? '÷' : topic)).join(' • ')

  const winnerLabel =
    winner === 'left' ? leftLabel : winner === 'right' ? rightLabel : winner === 'draw' ? 'Durang' : ''

  const resultLabel = (result: RoundResult) => {
    if (result === 'correct') return "To'g'ri"
    if (result === 'wrong') return 'Xato'
    if (result === 'timeout') return 'Vaqt tugadi'
    return 'Kutilmoqda'
  }

  const ensureAudio = () => {
    if (typeof window === 'undefined') return null
    const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return null
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtor()
    }
    if (!bgmGainRef.current && audioCtxRef.current) {
      const gain = audioCtxRef.current.createGain()
      gain.gain.value = 0
      gain.connect(audioCtxRef.current.destination)
      bgmGainRef.current = gain
    }
    return audioCtxRef.current
  }

  const playSoftNote = (ctx: AudioContext, frequency: number, durationMs: number, type: OscillatorType, gainValue: number) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.value = 0.0001
    osc.connect(gain)
    gain.connect(bgmGainRef.current ?? ctx.destination)
    const now = ctx.currentTime
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
    osc.start(now)
    osc.stop(now + durationMs / 1000 + 0.04)
  }

  const startBackgroundMusic = () => {
    if (bgmLoopRef.current) return
    const ctx = ensureAudio()
    if (!ctx) return
    ctx.resume().catch(() => undefined)
    if (!bgmGainRef.current) return

    const now = ctx.currentTime
    bgmGainRef.current.gain.cancelScheduledValues(now)
    bgmGainRef.current.gain.setValueAtTime(Math.max(bgmGainRef.current.gain.value, 0.0001), now)
    bgmGainRef.current.gain.exponentialRampToValueAtTime(0.55, now + 0.25)

    const melody = [392, 440, 523.25, 440, 349.23, 392, 440, 329.63]
    const bass = [196, 220, 174.61, 196]
    bgmStepRef.current = 0

    const playStep = () => {
      if (!audioCtxRef.current) return
      const step = bgmStepRef.current
      const melodyFreq = melody[step % melody.length]
      const bassFreq = bass[step % bass.length]
      playSoftNote(audioCtxRef.current, melodyFreq, 420, 'triangle', 0.028)
      if (step % 2 === 0) {
        playSoftNote(audioCtxRef.current, bassFreq, 620, 'sine', 0.018)
      }
      bgmStepRef.current += 1
    }

    playStep()
    bgmLoopRef.current = window.setInterval(playStep, 520)
  }

  const stopBackgroundMusic = () => {
    if (bgmLoopRef.current) {
      window.clearInterval(bgmLoopRef.current)
      bgmLoopRef.current = null
    }
    const ctx = audioCtxRef.current
    const gain = bgmGainRef.current
    if (!ctx || !gain) return
    const now = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
  }

  const resolveWinner = (preferred: Winner | null = null) => {
    if (preferred && preferred !== 'draw') return preferred
    if (left.score > right.score) return 'left' as const
    if (right.score > left.score) return 'right' as const
    if (left.correct > right.correct) return 'left' as const
    if (right.correct > left.correct) return 'right' as const
    return 'draw' as const
  }

  const finishGame = (message: string, preferredWinner: Winner | null = null) => {
    const resolved = resolveWinner(preferredWinner)
    stopBackgroundMusic()
    setFinished(true)
    setStarted(false)
    setWinner(resolved)
    setShowWinnerModal(true)
    setConfettiBurst((prev) => prev + 1)
    setStatusText(message)
  }

  const resetGame = () => {
    stopBackgroundMusic()
    const freshDeck = buildDeck(initialDifficulty, teacherQuestions, enabledTopics)
    setQuestions(freshDeck)
    setStarted(false)
    setFinished(false)
    setLeft(makeTeamRuntime(cfg.seconds))
    setRight(makeTeamRuntime(cfg.seconds))
    setWinner(null)
    setShowWinnerModal(false)
    setStatusText(`Boshlash tugmasini bosing. Ikkala jamoa parallel ishlaydi (${QUESTIONS_PER_TEAM} ta savol).`)
  }

  const startGame = () => {
    if (started || finished) return
    startBackgroundMusic()
    setStarted(true)
    setStatusText(`Bellashuv boshlandi. Har jamoa o'z vaqtida ${QUESTIONS_PER_TEAM} ta savol yechadi.`)
  }

  const advanceTeam = (side: Side) => {
    const setter = side === 'left' ? setLeft : setRight
    setter((team) => {
      const nextIndex = Math.min(team.index + 1, totalRounds)
      if (nextIndex >= totalRounds) {
        return {
          ...team,
          index: nextIndex,
          timeLeft: 0,
          selected: null,
          locked: true,
          awaitingNext: false,
          result: team.result,
        }
      }
      return {
        ...team,
        index: nextIndex,
        timeLeft: cfg.seconds,
        selected: null,
        locked: false,
        awaitingNext: false,
        result: null,
      }
    })
  }

  const evaluateAnswer = (side: Side, optionIndex: number) => {
    if (!started || finished) return
    const team = side === 'left' ? left : right
    const question = side === 'left' ? leftQuestion : rightQuestion
    if (!question || team.locked || team.awaitingNext || team.index >= totalRounds) return

    const picked = question.options[optionIndex]
    const isCorrect = picked === question.options[question.correctIndex]
    const sideLabel = side === 'left' ? leftLabel : rightLabel
    const speedBonus = Math.max(0, Math.floor(team.timeLeft / 5))
    const gain = cfg.points + speedBonus
    const setter = side === 'left' ? setLeft : setRight

    setter((prev) => ({
      ...prev,
      selected: optionIndex,
      locked: true,
      awaitingNext: true,
      result: isCorrect ? 'correct' : 'wrong',
      score: isCorrect ? prev.score + gain : prev.score,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
    }))

    if (isCorrect) {
      setStatusText(`${sideLabel} to'g'ri topdi. +${cfg.points} +${speedBonus} bonus`)
    } else {
      setStatusText(`${sideLabel} xato javob berdi. To'g'ri javob: ${question.options[question.correctIndex]}`)
    }
  }

  useEffect(() => {
    if (!started || finished) return
    if (left.locked || left.awaitingNext || left.index >= totalRounds) return
    const timerId = window.setInterval(() => {
      setLeft((prev) => (prev.index >= totalRounds || prev.locked || prev.awaitingNext
        ? prev
        : { ...prev, timeLeft: Math.max(prev.timeLeft - 1, 0) }))
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [started, finished, left.locked, left.awaitingNext, left.index, totalRounds])

  useEffect(() => {
    if (!started || finished) return
    if (right.locked || right.awaitingNext || right.index >= totalRounds) return
    const timerId = window.setInterval(() => {
      setRight((prev) => (prev.index >= totalRounds || prev.locked || prev.awaitingNext
        ? prev
        : { ...prev, timeLeft: Math.max(prev.timeLeft - 1, 0) }))
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [started, finished, right.locked, right.awaitingNext, right.index, totalRounds])

  useEffect(() => {
    if (!started || finished) return
    if (left.index >= totalRounds || left.locked || left.awaitingNext || left.timeLeft > 0) return
    const answerText = leftQuestion ? leftQuestion.options[leftQuestion.correctIndex] : '-'
    setLeft((prev) => ({ ...prev, locked: true, awaitingNext: true, result: 'timeout' }))
    setStatusText(`${leftLabel} vaqtdan chiqdi. To'g'ri javob: ${answerText}`)
  }, [started, finished, left, leftQuestion, leftLabel, totalRounds])

  useEffect(() => {
    if (!started || finished) return
    if (right.index >= totalRounds || right.locked || right.awaitingNext || right.timeLeft > 0) return
    const answerText = rightQuestion ? rightQuestion.options[rightQuestion.correctIndex] : '-'
    setRight((prev) => ({ ...prev, locked: true, awaitingNext: true, result: 'timeout' }))
    setStatusText(`${rightLabel} vaqtdan chiqdi. To'g'ri javob: ${answerText}`)
  }, [started, finished, right, rightQuestion, rightLabel, totalRounds])

  useEffect(() => {
    if (!started || finished || !left.awaitingNext) return
    const timerId = window.setTimeout(() => advanceTeam('left'), cfg.autoNextMs)
    return () => window.clearTimeout(timerId)
  }, [started, finished, left.awaitingNext, cfg.autoNextMs])

  useEffect(() => {
    if (!started || finished || !right.awaitingNext) return
    const timerId = window.setTimeout(() => advanceTeam('right'), cfg.autoNextMs)
    return () => window.clearTimeout(timerId)
  }, [started, finished, right.awaitingNext, cfg.autoNextMs])

  useEffect(() => {
    if (!started || finished) return
    if (left.index < totalRounds || right.index < totalRounds) return
    finishGame(`Ikkala jamoa ham ${QUESTIONS_PER_TEAM} ta savolni yakunladi.`)
  }, [started, finished, left.index, right.index, totalRounds])

  useEffect(() => () => stopBackgroundMusic(), [])

  const renderTeamPanel = (
    side: Side,
    label: string,
    team: TeamRuntime,
    question: TezkorHisobChoiceTask | undefined,
    tone: string,
  ) => {
    const borderClass = side === 'left'
      ? 'border-cyan-200 bg-cyan-50/35'
      : 'border-fuchsia-200 bg-fuchsia-50/35'

    const correctAnswer = question ? question.options[question.correctIndex] : ''
    const disabled = !started || finished || team.locked || team.awaitingNext || team.index >= totalRounds

    return (
      <article className={`arena-3d-panel rounded-[1.7rem] border p-4 shadow-soft ${borderClass}`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-kid text-3xl text-slate-900">{label}</h3>
          <span className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-extrabold text-white ${tone}`}>
            {team.score} ball
          </span>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-slate-200 bg-white px-2 py-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Savol</p>
            <p className="mt-1 text-sm font-extrabold text-slate-700">
              {Math.min(team.index + 1, totalRounds)}/{totalRounds}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-2 py-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Timer</p>
            <p className={`mt-1 text-sm font-extrabold ${started && !finished && team.timeLeft <= 8 && !team.locked ? 'text-rose-600' : 'text-slate-700'}`}>
              {started && team.index < totalRounds ? `${team.timeLeft}s` : '--'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-2 py-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">To'g'ri</p>
            <p className="mt-1 text-sm font-extrabold text-slate-700">{team.correct}</p>
          </div>
        </div>

        {question ? (
          <>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900 text-white shadow-soft">
              <div className="relative p-4 sm:p-5">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.16),transparent_45%),radial-gradient(circle_at_88%_22%,rgba(99,102,241,0.16),transparent_42%)]" />
                <div className="relative">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-sky-300/40 bg-sky-300/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-sky-200">
                      Tezkor hisob
                    </span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/90">
                      Amal: {question.topic}
                    </span>
                  </div>
                  <p className="mt-3 min-h-[72px] text-lg font-extrabold leading-snug sm:min-h-[88px] sm:text-xl">
                    {question.prompt}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {question.options.map((option, optionIndex) => {
                const isPicked = team.selected === optionIndex
                const isCorrect = optionIndex === question.correctIndex
                const optionTone = !team.locked
                  ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300'
                  : isCorrect
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : isPicked
                      ? 'border-rose-300 bg-rose-50 text-rose-800'
                      : 'border-slate-200 bg-slate-100 text-slate-500'
                const glowTone = team.locked
                  ? isCorrect
                    ? 'shadow-[0_0_0_2px_rgba(16,185,129,0.14),0_0_22px_rgba(16,185,129,0.22)] animate-[pulse_0.9s_ease-in-out_2]'
                    : isPicked
                      ? 'shadow-[0_0_0_2px_rgba(244,63,94,0.14),0_0_20px_rgba(244,63,94,0.2)] animate-[pulse_0.9s_ease-in-out_2]'
                      : ''
                  : ''

                return (
                  <button
                    key={`${question.id}-${optionIndex}-${option}`}
                    type="button"
                    onClick={() => evaluateAnswer(side, optionIndex)}
                    disabled={disabled}
                    className={`arena-3d-press group flex min-h-[86px] items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${optionTone} ${glowTone} ${
                      disabled ? 'cursor-not-allowed opacity-90' : ''
                    }`}
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-black shadow-sm ${
                      !team.locked
                        ? 'bg-slate-100 text-slate-700 group-hover:bg-cyan-100 group-hover:text-cyan-800'
                        : isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPicked
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-500'
                    }`}>
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Variant</span>
                      <span className="mt-1 break-words text-sm font-extrabold text-slate-800 sm:text-base">{option}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <div className="mt-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-center">
            <p className="text-sm font-extrabold text-emerald-700">Savollar tugadi</p>
            <p className="mt-1 text-xs font-bold text-emerald-600">Bu jamoa {QUESTIONS_PER_TEAM} ta savolni yakunladi.</p>
          </div>
        )}

        <p className={`mt-3 rounded-xl border px-3 py-2 text-xs font-extrabold ${
          team.result === 'correct'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-[0_0_18px_rgba(16,185,129,0.16)] animate-[pulse_0.9s_ease-in-out_2]'
            : team.result === 'wrong'
              ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-[0_0_18px_rgba(244,63,94,0.16)] animate-[pulse_0.9s_ease-in-out_2]'
              : team.result === 'timeout'
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-500'
        }`}>
          Natija: {resultLabel(team.result)}
          {team.locked && team.result !== 'correct' && correctAnswer ? ` | To'g'ri javob: ${correctAnswer}` : ''}
        </p>
      </article>
    )
  }

  return (
    <section className="glass-card arena-3d-shell relative flex flex-col p-4 sm:p-5" data-aos="fade-up" data-aos-delay="80">
      <div className="pointer-events-none absolute -left-20 top-20 h-52 w-52 rounded-full bg-sky-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-52 w-52 rounded-full bg-indigo-200/35 blur-3xl" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-sky-700 sm:text-xs">
            Tezkor Hisob Parallel
          </p>
          <h2 className="mt-1 font-kid text-3xl text-slate-900 sm:text-4xl">{gameTitle} Arena</h2>
          <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
            Ikkala jamoa bir-birini kutmaydi • {QUESTIONS_PER_TEAM} ta savol • alohida timer
          </p>
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
            onClick={startGame}
            disabled={started || finished}
            className={`arena-3d-press rounded-xl bg-gradient-to-r px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-soft transition sm:text-xs ${
              started || finished ? 'cursor-not-allowed opacity-70' : `hover:-translate-y-0.5 ${gameTone}`
            }`}
          >
            O&apos;yinni boshlash
          </button>
          <button
            type="button"
            onClick={resetGame}
            className="arena-3d-press rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5 sm:text-xs"
          >
            Qayta boshlash
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Savollar</p>
          <p className="mt-1 font-kid text-3xl text-slate-900">{completedQuestions}/{totalRounds * 2}</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Daraja</p>
          <p className="mt-1 text-base font-extrabold text-slate-700">{initialDifficulty}</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Custom</p>
          <p className="mt-1 text-base font-extrabold text-slate-700">{customCountByDifficulty} ta</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{leftLabel}</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">{left.score} ball</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{rightLabel}</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">{right.score} ball</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Progress</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">{progressPercent}%</p>
        </div>
      </div>

      <div className="arena-3d-panel mt-4 rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Parallel rejim</p>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Har jamoa o&apos;z misolini mustaqil yechadi. To&apos;g&apos;ri/xato/timeout bo&apos;lsa avtomatik keyingisiga o&apos;tadi.
            </p>
            <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
              Tanlangan amallar: {topicLabelSafe}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-700">
              {QUESTIONS_PER_TEAM} ta savol / jamoa
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-600">
              30s timer
            </span>
          </div>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full bg-gradient-to-r ${gameTone}`} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {renderTeamPanel('left', leftLabel, left, leftQuestion, 'from-cyan-500 to-blue-500')}
        {renderTeamPanel('right', rightLabel, right, rightQuestion, 'from-fuchsia-500 to-rose-500')}
      </div>

      <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-extrabold ${
        finished ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
      }`}>
        {statusText}
      </div>

      <div className="mt-4 text-right text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
        {(left.awaitingNext || right.awaitingNext) && !finished ? 'Natija ko‘rsatildi, navbatdagi misollar ochilmoqda...' : ' '}
      </div>

      {showWinnerModal ? (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <ConfettiOverlay
            burstKey={confettiBurst}
            variant={winner === 'draw' ? 'lose' : 'win'}
            pieces={winner === 'draw' ? 110 : 170}
          />
          <div className="relative z-[2] w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/75 bg-white/95 p-5 shadow-soft sm:p-6">
            <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-sky-200/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-indigo-200/35 blur-3xl" />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                  Tezkor hisob yakunlandi
                </p>
                <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-600">
                  Savollar: {totalRounds} x 2
                </p>
              </div>

              <h3 className="mt-3 font-kid text-4xl text-slate-900 sm:text-5xl">
                {winnerLabel === 'Durang' ? 'Durang natija' : `G'olib: ${winnerLabel}`}
              </h3>
              <p className="mt-1 text-base font-bold text-slate-600">
                {winnerLabel === 'Durang'
                  ? "Ikkala jamoa ham teng natija ko'rsatdi."
                  : `${winnerLabel} eng yuqori natija bilan yutdi.`}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{leftLabel}</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-800">{left.score}</p>
                  <p className="text-sm font-bold text-slate-500">{left.correct} ta to'g'ri</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{rightLabel}</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-800">{right.score}</p>
                  <p className="text-sm font-bold text-slate-500">{right.correct} ta to'g'ri</p>
                </div>
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
                  onClick={resetGame}
                  className={`rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
                >
                  Yangi raund
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default TezkorHisobArena
