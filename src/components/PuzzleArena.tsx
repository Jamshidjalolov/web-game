import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import puzzleReferenceImage from '../assets/games/puzzle-simple.svg'
import ConfettiOverlay from './ConfettiOverlay'
import type { TeamCount } from '../lib/teamMode.ts'

export type Operator = '+' | '-' | 'x' | '/'
export type Difficulty = 'Oson' | "O'rta" | 'Qiyin'

type PuzzleArenaProps = {
  gameTitle: string
  gameTone: string
  leftTeamName?: string
  rightTeamName?: string
  teamCount?: TeamCount
  initialDifficulty?: Difficulty
  initialEnabledOps?: Operator[]
  lockSettings?: boolean
  setupPath?: string
}

type Question = {
  a: number
  b: number
  operator: Operator
  answer: number
}

const GRID = 3
const SOLVED_TILES = [1, 2, 3, 4, 5, 6, 7, 8, 0]
const ALL_OPS: Operator[] = ['+', '-', 'x', '/']
const DEFAULT_OPS: Operator[] = ['+', '-']
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0']
const PUZZLE_AUDIO_SRC = '/audio/sigmamusicart-corporate-background-music-484577.mp3'

const scoreByDifficulty: Record<Difficulty, number> = {
  Oson: 10,
  "O'rta": 14,
  Qiyin: 18,
}

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const formatTime = (seconds: number) => {
  const mm = Math.floor(seconds / 60)
  const ss = seconds % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

const isSolved = (tiles: number[]) => tiles.every((tile, index) => tile === SOLVED_TILES[index])

const inversionCount = (tiles: number[]) => {
  let inversions = 0
  for (let i = 0; i < tiles.length; i += 1) {
    for (let j = i + 1; j < tiles.length; j += 1) {
      if (tiles[i] === 0 || tiles[j] === 0) continue
      if (tiles[i] > tiles[j]) inversions += 1
    }
  }
  return inversions
}

const isSolvable = (tiles: number[]) => inversionCount(tiles) % 2 === 0

const shuffle = (items: number[]) => {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
  return arr
}

const createShuffledTiles = () => {
  let candidate = shuffle(SOLVED_TILES)
  while (!isSolvable(candidate) || isSolved(candidate)) {
    candidate = shuffle(SOLVED_TILES)
  }
  return candidate
}

const normalizeOps = (ops: Operator[]) => {
  const valid = ops.filter((item) => ALL_OPS.includes(item))
  const unique = Array.from(new Set(valid))
  return unique.length > 0 ? unique : DEFAULT_OPS
}

const createQuestion = (ops: Operator[], difficulty: Difficulty): Question => {
  const pool = ops.length > 0 ? ops : DEFAULT_OPS
  const operator = pool[randomInt(0, pool.length - 1)]

  if (operator === '+') {
    const max = difficulty === 'Qiyin' ? 20 : difficulty === "O'rta" ? 14 : 8
    const a = randomInt(1, max)
    const b = randomInt(1, max)
    return { a, b, operator, answer: a + b }
  }

  if (operator === '-') {
    const max = difficulty === 'Qiyin' ? 24 : difficulty === "O'rta" ? 16 : 10
    const a = randomInt(4, max)
    const b = randomInt(1, a)
    return { a, b, operator, answer: a - b }
  }

  if (operator === 'x') {
    const max = difficulty === 'Qiyin' ? 7 : difficulty === "O'rta" ? 5 : 4
    const a = randomInt(2, max)
    const b = randomInt(2, max)
    return { a, b, operator, answer: a * b }
  }

  const divisorMax = difficulty === 'Qiyin' ? 6 : difficulty === "O'rta" ? 5 : 4
  const divisor = randomInt(2, divisorMax)
  const answer = randomInt(1, difficulty === 'Qiyin' ? 8 : difficulty === "O'rta" ? 7 : 6)
  const dividend = divisor * answer
  return { a: dividend, b: divisor, operator, answer }
}

const questionLabel = (question: Question) => `${question.a} ${question.operator} ${question.b} = ?`

function PuzzleArena({
  gameTitle,
  gameTone,
  leftTeamName = '1-Jamoa',
  rightTeamName = '2-Jamoa',
  teamCount = 2,
  initialDifficulty = 'Oson',
  initialEnabledOps = DEFAULT_OPS,
  lockSettings = false,
  setupPath = '/games/puzzle-mozaika',
}: PuzzleArenaProps) {
  const isSoloMode = teamCount === 1
  const parsedInitialOps = useMemo(
    () => normalizeOps(initialEnabledOps),
    [initialEnabledOps],
  )

  const [enabledOps, setEnabledOps] = useState<Operator[]>(parsedInitialOps)
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty)

  const [leftTiles, setLeftTiles] = useState<number[]>(() => createShuffledTiles())
  const [rightTiles, setRightTiles] = useState<number[]>(() => createShuffledTiles())
  const [leftMoves, setLeftMoves] = useState(0)
  const [rightMoves, setRightMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [bestTime, setBestTime] = useState<number | null>(null)

  const [currentQuestion, setCurrentQuestion] = useState<Question>(() =>
    createQuestion(parsedInitialOps, initialDifficulty),
  )
  const [answerInput, setAnswerInput] = useState('')
  const [feedback, setFeedback] = useState("Avval O'yinni boshlash tugmasini bosing.")
  const [activeTeam, setActiveTeam] = useState<1 | 2>(1)
  const [scoreOne, setScoreOne] = useState(0)
  const [scoreTwo, setScoreTwo] = useState(0)
  const [solvedTeam, setSolvedTeam] = useState<1 | 2 | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [confettiBurst, setConfettiBurst] = useState(0)

  const [musicOn, setMusicOn] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const activeTiles = activeTeam === 1 ? leftTiles : rightTiles
  const leftLabel = leftTeamName.trim() || '1-Jamoa'
  const rightLabel = rightTeamName.trim() || '2-Jamoa'
  const teamLabel = isSoloMode ? leftLabel : activeTeam === 1 ? leftLabel : rightLabel
  const winnerLabel = solvedTeam
    ? solvedTeam === 1
      ? leftLabel
      : rightLabel
    : isSoloMode
      ? leftLabel
      : scoreOne === scoreTwo
      ? 'Durang'
      : scoreOne > scoreTwo
        ? leftLabel
        : rightLabel
  const isMathMode = difficulty !== 'Oson'

  const correctCountLeft = useMemo(
    () =>
      leftTiles.reduce(
        (acc, tile, index) => (tile !== 0 && tile === SOLVED_TILES[index] ? acc + 1 : acc),
        0,
      ),
    [leftTiles],
  )
  const correctCountRight = useMemo(
    () =>
      rightTiles.reduce(
        (acc, tile, index) => (tile !== 0 && tile === SOLVED_TILES[index] ? acc + 1 : acc),
        0,
      ),
    [rightTiles],
  )
  const leftProgressPercent = Math.round((correctCountLeft / (GRID * GRID - 1)) * 100)
  const rightProgressPercent = Math.round((correctCountRight / (GRID * GRID - 1)) * 100)
  const activeProgressPercent = isSoloMode ? leftProgressPercent : activeTeam === 1 ? leftProgressPercent : rightProgressPercent
  const winnerScore = winnerLabel === 'Durang' ? Math.max(scoreOne, scoreTwo) : scoreOne > scoreTwo ? scoreOne : scoreTwo

  const totalScore = useMemo(() => {
    const totalMoves = leftMoves + rightMoves
    if (!finished) {
      return Math.max(0, scoreOne + scoreTwo + (correctCountLeft + correctCountRight) * 8 - totalMoves)
    }
    return Math.max(180, scoreOne + scoreTwo + 900 - totalMoves * 8 - seconds * 6)
  }, [finished, scoreOne, scoreTwo, correctCountLeft, correctCountRight, leftMoves, rightMoves, seconds])

  useEffect(() => {
    const audio = new Audio(PUZZLE_AUDIO_SRC)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0.75
    audioRef.current = audio

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    setEnabledOps(parsedInitialOps)
    setDifficulty(initialDifficulty)
    setCurrentQuestion(createQuestion(parsedInitialOps, initialDifficulty))
  }, [parsedInitialOps, initialDifficulty])

  useEffect(() => {
    if (!running || finished) return
    const timerId = window.setInterval(() => {
      setSeconds((prev) => prev + 1)
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [running, finished])

  useEffect(() => {
    if (!running || finished) return
    const leftDone = isSolved(leftTiles)
    const rightDone = isSolved(rightTiles)
    if (isSoloMode) {
      if (!leftDone) return
      setSolvedTeam(1)
      setFinished(true)
      setRunning(false)
      setBestTime((prev) => (prev === null ? seconds : Math.min(prev, seconds)))
      setFeedback(`Puzzle tugadi. G'olib: ${leftLabel}.`)
      setShowWinnerModal(true)
      setConfettiBurst((prev) => prev + 1)
      audioRef.current?.pause()
      return
    }
    if (!leftDone && !rightDone) return

    const decidedWinner: 1 | 2 =
      leftDone && !rightDone ? 1 : rightDone && !leftDone ? 2 : activeTeam
    const decidedLabel = decidedWinner === 1 ? leftLabel : rightLabel

    setSolvedTeam(decidedWinner)
    setFinished(true)
    setRunning(false)
    setBestTime((prev) => (prev === null ? seconds : Math.min(prev, seconds)))
    setFeedback(`Puzzle tugadi. G'olib: ${decidedLabel}.`)
    setShowWinnerModal(true)
    setConfettiBurst((prev) => prev + 1)
    audioRef.current?.pause()
  }, [isSoloMode, leftTiles, rightTiles, running, finished, seconds, activeTeam, leftLabel, rightLabel])

  useEffect(() => {
    if (!running || !musicOn || finished) return
    const audio = audioRef.current
    if (!audio) return
    const playPromise = audio.play()
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {})
    }
  }, [running, musicOn, finished])

  const canMove = (board: number[], index: number) => {
    const blankIndex = board.indexOf(0)
    if (index === blankIndex) return false
    const row = Math.floor(index / GRID)
    const col = index % GRID
    const blankRow = Math.floor(blankIndex / GRID)
    const blankCol = blankIndex % GRID
    return Math.abs(row - blankRow) + Math.abs(col - blankCol) === 1
  }

  const toggleOperation = (op: Operator) => {
    if (lockSettings || running) return
    setEnabledOps((prev) => {
      if (prev.includes(op)) {
        if (prev.length === 1) return prev
        return prev.filter((item) => item !== op)
      }
      return [...prev, op]
    })
  }

  const startRound = () => {
    if (finished) {
      return
    }
    setRunning(true)
    setFeedback("O'yin boshlandi. Savolga javob bering va bo'lakni siljiting.")
  }

  const restartRound = () => {
    setLeftTiles(createShuffledTiles())
    setRightTiles(createShuffledTiles())
    setLeftMoves(0)
    setRightMoves(0)
    setSeconds(0)
    setRunning(false)
    setFinished(false)
    setCurrentQuestion(createQuestion(enabledOps, difficulty))
    setAnswerInput('')
    setFeedback("Avval O'yinni boshlash tugmasini bosing.")
    setActiveTeam(1)
    setScoreOne(0)
    setScoreTwo(0)
    setSolvedTeam(null)
    setShowWinnerModal(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  const toggleMusic = () => {
    setMusicOn((prev) => {
      const next = !prev
      const audio = audioRef.current
      if (!audio) {
        return next
      }
      if (!next) {
        audio.pause()
      } else if (running && !finished) {
        const playPromise = audio.play()
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {})
        }
      }
      return next
    })
  }

  const closeWinnerModal = () => {
    setShowWinnerModal(false)
  }

  const handleDigit = (digit: string) => {
    if (!isMathMode) {
      return
    }
    if (digit === 'C') {
      setAnswerInput('')
      return
    }
    if (!running || finished) {
      setFeedback("Avval O'yinni boshlash tugmasini bosing.")
      return
    }
    setAnswerInput((prev) => `${prev}${digit}`.slice(0, 3))
  }

  const handleTileClick = (team: 1 | 2, index: number) => {
    if (finished) return
    if (!running) {
      setFeedback("Avval O'yinni boshlash tugmasini bosing.")
      return
    }
    if (!isSoloMode && team !== activeTeam) {
      setFeedback(`Hozir navbat: ${teamLabel}.`)
      return
    }

    const sourceTiles = team === 1 ? leftTiles : rightTiles
    if (!canMove(sourceTiles, index)) {
      setFeedback("Faqat bo'sh katakka qo'shni bo'lak siljiydi.")
      return
    }

    const gain = scoreByDifficulty[difficulty]
    const moveTile = (points: number, message: string) => {
      const applyMove = (prev: number[]) => {
        const next = [...prev]
        const currentBlank = next.indexOf(0)
        const temp = next[index]
        next[index] = 0
        next[currentBlank] = temp
        return next
      }

      if (team === 1) {
        setLeftTiles(applyMove)
        setLeftMoves((prev) => prev + 1)
        setScoreOne((prev) => prev + points)
      } else {
        setRightTiles(applyMove)
        setRightMoves((prev) => prev + 1)
        setScoreTwo((prev) => prev + points)
      }

      setFeedback(message)
      setAnswerInput('')
      setCurrentQuestion(createQuestion(enabledOps, difficulty))
      if (!isSoloMode) {
        setActiveTeam((prev) => (prev === 1 ? 2 : 1))
      }
    }

    if (!isMathMode) {
      moveTile(6, `${teamLabel}: bo'lak siljidi.`)
      return
    }

    if (answerInput.trim() === '') {
      setFeedback('Avval javobni kiriting.')
      return
    }

    const typed = Number(answerInput)

    if (typed !== currentQuestion.answer) {
      setFeedback(`${teamLabel}: xato javob. Navbat almashdi.`)
      setAnswerInput('')
      if (!isSoloMode) {
        setActiveTeam((prev) => (prev === 1 ? 2 : 1))
      }
      setCurrentQuestion(createQuestion(enabledOps, difficulty))
      return
    }

    moveTile(gain, `${teamLabel}: to'g'ri javob, +${gain} ball.`)
  }

  const renderTeamBoard = (
    team: 1 | 2,
    label: string,
    boardTiles: number[],
    teamMoves: number,
    teamScore: number,
    teamProgress: number,
  ) => {
    const isActiveTurn = isSoloMode ? team === 1 : activeTeam === team
    const cardTone = isActiveTurn
      ? `border-cyan-300 bg-cyan-50/45 shadow-soft`
      : 'border-slate-200 bg-slate-50'

    return (
      <div className={`rounded-3xl border p-3 ${cardTone}`}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">{label}</p>
            <p className="text-xs font-bold text-slate-500">{isActiveTurn ? 'Navbatda' : 'Kutmoqda'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500">Ball: {teamScore}</p>
            <p className="text-xs font-bold text-slate-500">Yurish: {teamMoves}</p>
          </div>
        </div>

        <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/80">
          <div className={`h-full rounded-full bg-gradient-to-r ${gameTone}`} style={{ width: `${teamProgress}%` }} />
        </div>

        <div className="mx-auto grid max-w-[380px] grid-cols-3 gap-2 sm:gap-3">
          {boardTiles.map((tile, index) => {
            const piece = tile - 1
            const row = Math.floor(piece / GRID)
            const col = piece % GRID
            const inRightSpot = tile !== 0 && tile === SOLVED_TILES[index]
            const disabled = tile === 0 || finished || (!isSoloMode && team !== activeTeam)

            return (
              <button
                key={`${team}-${tile}-${index}`}
                type="button"
                onClick={() => handleTileClick(team, index)}
                disabled={disabled}
                className={`arena-3d-press relative aspect-square overflow-hidden rounded-xl border transition ${
                  tile === 0
                    ? 'cursor-default border-dashed border-slate-300 bg-white'
                    : inRightSpot
                      ? 'border-emerald-300'
                      : 'border-slate-200 hover:-translate-y-0.5 hover:border-cyan-300'
                } ${!isSoloMode && team !== activeTeam && tile !== 0 ? 'opacity-75' : ''}`}
                style={
                  tile === 0
                    ? undefined
                    : {
                        backgroundImage: `url(${puzzleReferenceImage})`,
                        backgroundSize: `${GRID * 100}% ${GRID * 100}%`,
                        backgroundPosition: `${(col * 100) / (GRID - 1)}% ${(row * 100) / (GRID - 1)}%`,
                      }
                }
              >
                {tile === 0 ? (
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Bo'sh</span>
                ) : (
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] font-black text-white">
                    {tile}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <section
      className="glass-card arena-3d-shell relative flex flex-col bg-[linear-gradient(145deg,rgba(255,255,255,0.95)_0%,rgba(244,252,255,0.95)_52%,rgba(255,248,234,0.95)_100%)] p-3 sm:p-4"
      data-aos="fade-up"
      data-aos-delay="80"
    >
      <div className="pointer-events-none absolute -left-16 top-16 h-48 w-48 rounded-full bg-cyan-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-16 h-56 w-56 rounded-full bg-fuchsia-200/35 blur-3xl" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-700 sm:text-xs">
            {isSoloMode ? 'Solo puzzle' : 'Real mini-game'}
          </p>
          <h2 className="mt-1 font-kid text-3xl text-slate-900 sm:text-4xl">
            {isSoloMode ? `${gameTitle} Solo` : `${gameTitle} Arena`}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={setupPath}
            className="arena-3d-press ui-secondary-btn ui-secondary-btn--sm"
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
            onClick={startRound}
            disabled={running || finished}
            className={`arena-3d-press rounded-xl bg-gradient-to-r px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-soft transition sm:text-xs ${
              running || finished ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-0.5'
            } ${gameTone}`}
          >
            O'yinni boshlash
          </button>
          <button
            type="button"
            onClick={restartRound}
            className="arena-3d-press ui-secondary-btn ui-secondary-btn--sm"
          >
            Qayta boshlash
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
        {ALL_OPS.map((op) => {
          const active = enabledOps.includes(op)
          const label = op === 'x' ? "Ko'paytirish" : op === '/' ? "Bo'lish" : op === '+' ? "Qo'shish" : 'Ayirish'
          return (
            <button
              key={op}
              type="button"
              onClick={() => toggleOperation(op)}
              disabled={lockSettings || running}
              className={`arena-3d-press rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] transition sm:text-xs ${
                active
                  ? `border-transparent bg-gradient-to-r text-white ${gameTone}`
                  : 'border-slate-300 bg-white text-slate-600'
              } ${lockSettings || running ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              {label}
            </button>
          )
        })}

        {(['Oson', "O'rta", 'Qiyin'] as Difficulty[]).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => !lockSettings && !running && setDifficulty(level)}
            disabled={lockSettings || running}
            className={`arena-3d-press rounded-full px-3 py-1 text-[10px] font-extrabold transition sm:text-xs ${
              difficulty === level
                ? `bg-gradient-to-r text-white ${gameTone}`
                : 'bg-slate-100 text-slate-600'
            } ${lockSettings || running ? 'cursor-not-allowed opacity-80' : ''}`}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="arena-3d-panel h-full rounded-[1.7rem] border border-white/80 bg-white/92 p-3 shadow-soft sm:p-4">
          <div className={`grid gap-3 ${isSoloMode ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Vaqt</p>
              <p className="text-xl font-extrabold text-slate-800">{formatTime(seconds)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Yurish</p>
              <p className="text-xl font-extrabold text-slate-800">{leftMoves + rightMoves}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">{leftLabel}</p>
              <p className="text-xl font-extrabold text-slate-800">{scoreOne}</p>
            </div>
            {!isSoloMode ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">{rightLabel}</p>
                <p className="text-xl font-extrabold text-slate-800">{scoreTwo}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
              <span>{isSoloMode ? `Faol panel: ${leftLabel}` : `Navbat: ${teamLabel}`}</span>
              <span>Progress: {activeProgressPercent}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full rounded-full bg-gradient-to-r ${gameTone}`} style={{ width: `${activeProgressPercent}%` }} />
            </div>

            {isMathMode ? (
              <>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-3xl font-kid text-slate-900">
                  {questionLabel(currentQuestion)}
                </div>
                <div className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-2xl font-extrabold text-slate-700">
                  {answerInput || ''}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {KEYPAD.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleDigit(key)}
                      className={`arena-3d-press rounded-xl px-3 py-2 text-lg font-extrabold ${
                        key === 'C'
                          ? 'bg-rose-500 text-white'
                          : 'bg-white text-slate-700 hover:-translate-y-0.5'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center text-base font-extrabold text-emerald-700">
                Oson rejim: bo'sh katakka qo'shni bo'lakni to'g'ridan-to'g'ri bosing.
              </div>
            )}
          </div>

          <div className={`mt-3 grid gap-3 ${isSoloMode ? '' : 'lg:grid-cols-2'}`}>
            {renderTeamBoard(1, leftLabel, leftTiles, leftMoves, scoreOne, leftProgressPercent)}
            {!isSoloMode ? renderTeamBoard(2, rightLabel, rightTiles, rightMoves, scoreTwo, rightProgressPercent) : null}
          </div>
        </div>

        <aside className="arena-3d-panel h-full rounded-[1.7rem] border border-white/80 bg-white/92 p-3 shadow-soft sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-indigo-700 sm:text-xs">
              Haqiqiy rasm preview
            </p>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-amber-700">
              Premium
            </span>
          </div>

          <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <img
              src={puzzleReferenceImage}
              alt="Puzzle uchun asl rasm"
              className="h-64 w-full object-cover object-center sm:h-72"
            />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Best vaqt</p>
              <p className="text-lg font-extrabold text-slate-800">{bestTime === null ? '--:--' : formatTime(bestTime)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Umumiy ball</p>
              <p className="text-lg font-extrabold text-slate-800">{totalScore}</p>
            </div>
          </div>

          <div className={`mt-3 rounded-2xl border px-3 py-2 text-center text-xs font-extrabold sm:text-sm ${
            finished
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-cyan-200 bg-cyan-50 text-cyan-700'
          }`}>
            {finished
              ? isSoloMode
                ? `${leftLabel} raundni ${totalScore} ball bilan yakunladi.`
                : `G'olib: ${winnerLabel}. Ball: ${totalScore}.`
              : feedback}
          </div>

          <ul className="mt-3 space-y-2 text-sm font-bold text-slate-600">
            <li>1. Boshlash tugmasini bosing.</li>
            {isMathMode ? (
              <>
                <li>2. Savolga to'g'ri javob kiriting.</li>
                <li>3. Qo'shni bo'lakni bosing.</li>
              </>
            ) : (
              <>
                <li>2. Qo'shni bo'lakni bosing.</li>
                <li>3. Rasmni to'liq yig'ing.</li>
              </>
            )}
          </ul>
        </aside>
      </div>

      {showWinnerModal ? (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <ConfettiOverlay burstKey={confettiBurst} />

          <div className="relative z-[2] w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/75 bg-white/95 p-5 shadow-soft sm:p-6">
            <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-cyan-200/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-fuchsia-200/35 blur-3xl" />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                  Puzzle yakunlandi
                </p>
                <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-600">
                  Yakuniy ball: {totalScore}
                </p>
              </div>

              <h3 className="mt-3 font-kid text-4xl text-slate-900 sm:text-5xl">
                {!isSoloMode && winnerLabel === 'Durang' ? 'Durang natija' : `G'olib: ${winnerLabel}`}
              </h3>
              <p className="mt-1 text-base font-bold text-slate-600">
                {!isSoloMode && winnerLabel === 'Durang'
                  ? `Ikkala jamoa ham yaxshi o'ynadi.`
                  : isSoloMode
                    ? `${leftLabel} jami ${scoreOne} ball oldi.`
                    : `${winnerLabel} jami ${winnerScore} ball oldi.`}
              </p>

              <div className={`mt-4 grid gap-3 ${isSoloMode ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{leftLabel}</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-800">{scoreOne}</p>
                </div>
                {!isSoloMode ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{rightLabel}</p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-800">{scoreTwo}</p>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">Vaqt</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-800">{formatTime(seconds)}</p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img
                  src={puzzleReferenceImage}
                  alt="Puzzle rasm"
                  className="h-40 w-full object-cover object-center"
                />
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={closeWinnerModal}
                  className="ui-secondary-btn ui-secondary-btn--sm rounded-xl text-sm normal-case tracking-[0.02em]"
                >
                  Yopish
                </button>
                <button
                  type="button"
                  onClick={restartRound}
                  className={`ui-accent-btn rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
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

export default PuzzleArena
