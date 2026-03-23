import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfettiOverlay from './ConfettiOverlay'
import { TeamCount } from '../lib/teamMode'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Side = 'left' | 'right'
type TeamStatus = 'waiting' | 'correct' | 'wrong' | 'timeout'
type Phase = 'ready' | 'preview' | 'input' | 'result' | 'finished'
type Winner = Side | 'draw'

type MemoryChainArenaProps = {
  gameTitle: string
  gameTone: string
  leftTeamName?: string
  rightTeamName?: string
  teamCount?: TeamCount
  initialDifficulty?: Difficulty
  setupPath?: string
}

type TeamState = {
  score: number
  roundsWon: number
  streak: number
  bestStreak: number
  input: number[]
  status: TeamStatus
  timeLeft: number
}

type DifficultyConfig = {
  rounds: number
  startLength: number
  showStepMs: number
  gapMs: number
  inputSeconds: number
  basePoints: number
  speedBonusPerSecond: number
  comboBonus: number
  nextRoundMs: number
}

type PadItem = {
  id: number
  emoji: string
  label: string
  tone: string
}

const PAD_ITEMS: PadItem[] = [
  { id: 0, emoji: '🍎', label: 'Olma', tone: 'from-rose-500 to-orange-400' },
  { id: 1, emoji: '⭐', label: 'Yulduz', tone: 'from-amber-500 to-yellow-400' },
  { id: 2, emoji: '🧩', label: 'Puzzle', tone: 'from-violet-500 to-fuchsia-500' },
  { id: 3, emoji: '🎵', label: 'Musiqa', tone: 'from-cyan-500 to-blue-500' },
  { id: 4, emoji: '🎯', label: 'Nishon', tone: 'from-emerald-500 to-lime-500' },
  { id: 5, emoji: '🚀', label: 'Raketa', tone: 'from-indigo-500 to-sky-500' },
]

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  Oson: {
    rounds: 6,
    startLength: 3,
    showStepMs: 820,
    gapMs: 180,
    inputSeconds: 30,
    basePoints: 52,
    speedBonusPerSecond: 3,
    comboBonus: 7,
    nextRoundMs: 1250,
  },
  "O'rta": {
    rounds: 8,
    startLength: 4,
    showStepMs: 700,
    gapMs: 160,
    inputSeconds: 30,
    basePoints: 64,
    speedBonusPerSecond: 4,
    comboBonus: 9,
    nextRoundMs: 1150,
  },
  Qiyin: {
    rounds: 10,
    startLength: 5,
    showStepMs: 580,
    gapMs: 140,
    inputSeconds: 30,
    basePoints: 78,
    speedBonusPerSecond: 5,
    comboBonus: 11,
    nextRoundMs: 1050,
  },
}

const createTeamState = (seconds: number): TeamState => ({
  score: 0,
  roundsWon: 0,
  streak: 0,
  bestStreak: 0,
  input: [],
  status: 'waiting',
  timeLeft: seconds,
})

const generateSequence = (length: number): number[] => {
  const next: number[] = []
  let previous = -1

  for (let i = 0; i < length; i += 1) {
    let value = Math.floor(Math.random() * PAD_ITEMS.length)
    if (value === previous) {
      value = (value + 1 + Math.floor(Math.random() * (PAD_ITEMS.length - 1))) % PAD_ITEMS.length
    }
    next.push(value)
    previous = value
  }

  return next
}

function MemoryChainArena({
  gameTitle,
  gameTone,
  leftTeamName = '1-Jamoa',
  rightTeamName = '2-Jamoa',
  teamCount = 2,
  initialDifficulty = "O'rta",
  setupPath = '/games/xotira-zanjiri',
}: MemoryChainArenaProps) {
  const config = DIFFICULTY_CONFIG[initialDifficulty]
  const totalRounds = config.rounds
  const leftLabel = leftTeamName.trim() || '1-Jamoa'
  const rightLabel = rightTeamName.trim() || '2-Jamoa'
  const isSoloMode = teamCount === 1

  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState<Phase>('ready')
  const [leftTeam, setLeftTeam] = useState<TeamState>(() => createTeamState(config.inputSeconds))
  const [rightTeam, setRightTeam] = useState<TeamState>(() => createTeamState(config.inputSeconds))
  const [leftSequence, setLeftSequence] = useState<number[]>([])
  const [rightSequence, setRightSequence] = useState<number[]>([])
  const [leftFlash, setLeftFlash] = useState<number | null>(null)
  const [rightFlash, setRightFlash] = useState<number | null>(null)
  const [statusText, setStatusText] = useState("Boshlash tugmasini bosing, zanjirni eslab qoling va tez toping.")
  const [winner, setWinner] = useState<Winner | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [confettiBurst, setConfettiBurst] = useState(0)

  const currentLength = config.startLength + round - 1
  const progressRounds =
    phase === 'ready' ? 0 : phase === 'finished' ? totalRounds : Math.max(0, round - 1)
  const progressPercent = Math.round((progressRounds / totalRounds) * 100)
  const roundLabel = `${round}/${totalRounds}`

  const resolveWinner = useCallback((): Winner => {
    if (isSoloMode) return 'left'
    if (leftTeam.score > rightTeam.score) return 'left'
    if (rightTeam.score > leftTeam.score) return 'right'
    if (leftTeam.roundsWon > rightTeam.roundsWon) return 'left'
    if (rightTeam.roundsWon > leftTeam.roundsWon) return 'right'
    return 'draw'
  }, [isSoloMode, leftTeam.score, rightTeam.score, leftTeam.roundsWon, rightTeam.roundsWon])

  const openRound = useCallback(
    (nextRound: number) => {
      const length = config.startLength + nextRound - 1
      const sharedSequence = generateSequence(length)
      setRound(nextRound)
      setLeftSequence(sharedSequence)
      setRightSequence(sharedSequence)
      setLeftFlash(null)
      setRightFlash(null)
      setLeftTeam((prev) => ({
        ...prev,
        input: [],
        status: 'waiting',
        timeLeft: config.inputSeconds,
      }))
      setRightTeam((prev) => ({
        ...prev,
        input: [],
        status: 'waiting',
        timeLeft: config.inputSeconds,
      }))
      setPhase('preview')
      setStatusText(
        isSoloMode
          ? `${nextRound}-raund: zanjirni eslab qoling va qaytaring.`
          : `${nextRound}-raund: zanjirni eslab qoling.`,
      )
    },
    [config.startLength, config.inputSeconds, isSoloMode],
  )

  const startMatch = () => {
    setLeftTeam(createTeamState(config.inputSeconds))
    setRightTeam(createTeamState(config.inputSeconds))
    setWinner(null)
    setShowWinnerModal(false)
    setConfettiBurst(0)
    openRound(1)
  }

  const resetMatch = () => {
    setRound(1)
    setPhase('ready')
    setLeftTeam(createTeamState(config.inputSeconds))
    setRightTeam(createTeamState(config.inputSeconds))
    setLeftSequence([])
    setRightSequence([])
    setLeftFlash(null)
    setRightFlash(null)
    setWinner(null)
    setShowWinnerModal(false)
    setStatusText(
      isSoloMode
        ? "Boshlash tugmasini bosing, zanjirni eslab qoling va imkon qadar tez toping."
        : "Boshlash tugmasini bosing, zanjirni eslab qoling va tez toping.",
    )
  }

  const evaluatePress = (side: Side, padId: number) => {
    if (phase !== 'input') return
    if (leftTeam.status === 'correct' || (!isSoloMode && rightTeam.status === 'correct')) return

    if (side === 'left') {
      if (leftTeam.status !== 'waiting') return
      const expected = leftSequence[leftTeam.input.length]

      if (padId !== expected) {
        setLeftTeam((prev) => ({ ...prev, status: 'wrong', streak: 0 }))
        setStatusText(
          isSoloMode
            ? `${leftLabel} xato bosdi. Raund yakunlandi.`
            : `${leftLabel} xato bosdi. Raund yakunini kuting.`,
        )
        return
      }

      const nextInput = [...leftTeam.input, padId]
      const isComplete = nextInput.length === leftSequence.length

      if (!isComplete) {
        setLeftTeam((prev) => ({ ...prev, input: nextInput }))
        return
      }

      const nextStreak = leftTeam.streak + 1
      const speedBonus = Math.max(0, leftTeam.timeLeft * config.speedBonusPerSecond)
      const gained = config.basePoints + speedBonus + nextStreak * config.comboBonus

      setLeftTeam((prev) => ({
        ...prev,
        input: nextInput,
        status: 'correct',
        roundsWon: prev.roundsWon + 1,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
        score: prev.score + gained,
      }))
      setStatusText(`${leftLabel} to'g'ri tugatdi. +${gained} ball`)
      return
    }

    if (isSoloMode || rightTeam.status !== 'waiting') return
    const expected = rightSequence[rightTeam.input.length]

    if (padId !== expected) {
      setRightTeam((prev) => ({ ...prev, status: 'wrong', streak: 0 }))
      setStatusText(`${rightLabel} xato bosdi. Raund yakunini kuting.`)
      return
    }

    const nextInput = [...rightTeam.input, padId]
    const isComplete = nextInput.length === rightSequence.length

    if (!isComplete) {
      setRightTeam((prev) => ({ ...prev, input: nextInput }))
      return
    }

    const nextStreak = rightTeam.streak + 1
    const speedBonus = Math.max(0, rightTeam.timeLeft * config.speedBonusPerSecond)
    const gained = config.basePoints + speedBonus + nextStreak * config.comboBonus

    setRightTeam((prev) => ({
      ...prev,
      input: nextInput,
      status: 'correct',
      roundsWon: prev.roundsWon + 1,
      streak: nextStreak,
      bestStreak: Math.max(prev.bestStreak, nextStreak),
      score: prev.score + gained,
    }))
    setStatusText(`${rightLabel} to'g'ri tugatdi. +${gained} ball`)
  }

  useEffect(() => {
    if (phase !== 'preview') return
    if (leftSequence.length === 0 || rightSequence.length === 0) return

    let cancelled = false
    const timerIds: number[] = []
    let step = 0
    const totalSteps = Math.min(leftSequence.length, rightSequence.length)

    const playStep = () => {
      if (cancelled) return

      if (step >= totalSteps) {
        setLeftFlash(null)
        setRightFlash(null)
        setPhase('input')
        setStatusText(
          isSoloMode
            ? `Raund ${roundLabel}: ${leftLabel}, ketma-ketlikni qaytaring.`
            : `Raund ${roundLabel}: ${leftLabel} va ${rightLabel}, ketma-ketlikni qaytaring.`,
        )
        return
      }

      setLeftFlash(leftSequence[step] ?? null)
      setRightFlash(rightSequence[step] ?? null)

      const hideTimer = window.setTimeout(() => {
        if (cancelled) return

        setLeftFlash(null)
        setRightFlash(null)
        step += 1
        const nextTimer = window.setTimeout(playStep, config.gapMs)
        timerIds.push(nextTimer)
      }, config.showStepMs)

      timerIds.push(hideTimer)
    }

    const starter = window.setTimeout(playStep, 250)
    timerIds.push(starter)

    return () => {
      cancelled = true
      timerIds.forEach((id) => window.clearTimeout(id))
    }
  }, [
    phase,
    leftSequence,
    rightSequence,
    config.showStepMs,
    config.gapMs,
    roundLabel,
    leftLabel,
    rightLabel,
    isSoloMode,
  ])

  useEffect(() => {
    if (phase !== 'input') return

    const timer = window.setInterval(() => {
      setLeftTeam((prev) => {
        if (prev.status !== 'waiting') return prev
        if (prev.timeLeft <= 1) {
          return { ...prev, timeLeft: 0, status: 'timeout', streak: 0 }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })

      if (!isSoloMode) {
        setRightTeam((prev) => {
          if (prev.status !== 'waiting') return prev
          if (prev.timeLeft <= 1) {
            return { ...prev, timeLeft: 0, status: 'timeout', streak: 0 }
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 }
        })
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [phase, isSoloMode])

  useEffect(() => {
    if (phase !== 'input') return
    const someoneCorrect = leftTeam.status === 'correct' || rightTeam.status === 'correct'
    const bothResolved = isSoloMode
      ? leftTeam.status !== 'waiting'
      : leftTeam.status !== 'waiting' && rightTeam.status !== 'waiting'
    if (!someoneCorrect && !bothResolved) return

    setPhase('result')

    if (leftTeam.status === 'correct') {
      setStatusText(`${leftLabel} birinchi bo'lib to'g'ri topdi va raundni yutdi.`)
      return
    }
    if (!isSoloMode && rightTeam.status === 'correct') {
      setStatusText(`${rightLabel} birinchi bo'lib to'g'ri topdi va raundni yutdi.`)
      return
    }
    setStatusText(
      isSoloMode
        ? `Bu safar ${leftLabel} topa olmadi. Keyingi zanjirga o'tiladi.`
        : "Ikkala jamoa ham topa olmadi. Keyingi zanjirga o'tiladi.",
    )
  }, [phase, leftTeam.status, rightTeam.status, leftTeam.timeLeft, rightTeam.timeLeft, leftLabel, rightLabel, isSoloMode])

  useEffect(() => {
    if (phase !== 'result') return

    const timer = window.setTimeout(() => {
      if (round >= totalRounds) {
        const resolved = resolveWinner()
        setWinner(resolved)
        setShowWinnerModal(true)
        setConfettiBurst((prev) => prev + 1)
        setPhase('finished')

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

      openRound(round + 1)
    }, config.nextRoundMs)

    return () => window.clearTimeout(timer)
  }, [phase, round, totalRounds, resolveWinner, leftLabel, rightLabel, openRound, config.nextRoundMs, isSoloMode])

  const winnerLabel = useMemo(() => {
    if (winner === 'left') return leftLabel
    if (winner === 'right') return rightLabel
    if (winner === 'draw') return 'Durang'
    return ''
  }, [winner, leftLabel, rightLabel])

  const renderDots = (teamInputLength: number) => (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {Array.from({ length: currentLength }, (_, index) => {
        const filled = index < teamInputLength
        return (
          <span
            key={`dot-${index}`}
            className={`h-2.5 w-6 rounded-full transition ${
              filled ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          />
        )
      })}
    </div>
  )

  const roundLocked = phase !== 'input' || leftTeam.status === 'correct' || rightTeam.status === 'correct'

  const renderTeamPanel = (
    side: Side,
    title: string,
    team: TeamState,
    flash: number | null,
    borderTone: string,
    accentTone: string,
  ) => (
    <article className={`arena-3d-panel rounded-[1.7rem] border p-4 shadow-soft ${borderTone}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-kid text-3xl text-slate-900">{title}</h3>
        <span className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-extrabold text-white ${accentTone}`}>
          {team.score} ball
        </span>
      </div>
      <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
        Raund yutgan: {team.roundsWon} | Combo: {team.streak} | Best: {team.bestStreak}
      </p>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
          <span>Zanjir uzunligi: {currentLength}</span>
          <span>{phase === 'input' ? `${team.timeLeft}s` : 'Tayyor'}</span>
        </div>
        {renderDots(team.input.length)}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {PAD_ITEMS.map((pad) => {
          const isFlashing = flash === pad.id
          const isSelected =
            phase === 'input'
            && team.status === 'waiting'
            && team.input.length > 0
            && team.input[team.input.length - 1] === pad.id
          const selectedTone = side === 'left' ? 'memory-pad-selected-left' : 'memory-pad-selected-right'
          return (
            <button
              key={`${side}-${pad.id}`}
              type="button"
              onClick={() => evaluatePress(side, pad.id)}
              disabled={roundLocked || team.status !== 'waiting'}
              className={`arena-3d-press relative overflow-hidden rounded-2xl border px-2 py-3 text-center transition ${
                isFlashing
                  ? 'memory-pad-preview-yellow scale-[1.07] border-transparent text-slate-950'
                  : isSelected
                    ? `${selectedTone} scale-[1.02] border-transparent text-white`
                    : 'border-slate-200 bg-white text-slate-700'
              } ${
                roundLocked || team.status !== 'waiting'
                  ? (isFlashing ? 'cursor-not-allowed' : 'cursor-not-allowed opacity-85')
                  : 'hover:-translate-y-0.5 hover:border-cyan-300'
              }`}
            >
              <p className="text-2xl">{pad.emoji}</p>
              <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.1em]">{pad.label}</p>
            </button>
          )
        })}
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
        Holat:{' '}
        {team.status === 'waiting'
          ? 'Javob kiritilmoqda'
          : team.status === 'correct'
            ? "To'g'ri"
            : team.status === 'wrong'
              ? 'Xato'
              : 'Vaqt tugadi'}
      </p>
    </article>
  )

  return (
    <section className="glass-card arena-3d-shell relative flex flex-col p-4 sm:p-5" data-aos="fade-up" data-aos-delay="80">
      <div className="pointer-events-none absolute -left-20 top-20 h-52 w-52 rounded-full bg-cyan-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-52 w-52 rounded-full bg-fuchsia-200/35 blur-3xl" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-700 sm:text-xs">
            {isSoloMode ? 'Solo xotira zanjiri' : 'Real xotira zanjiri'}
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
            onClick={startMatch}
            className={`arena-3d-press rounded-xl bg-gradient-to-r px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-soft transition hover:-translate-y-0.5 sm:text-xs ${gameTone}`}
          >
            {phase === 'ready' || phase === 'finished' ? "O'yinni boshlash" : 'Qayta start'}
          </button>
          <button
            type="button"
            onClick={resetMatch}
            className="arena-3d-press ui-secondary-btn ui-secondary-btn--sm"
          >
            Nolga tushir
          </button>
        </div>
      </div>

      <div className={`mt-4 grid gap-3 sm:grid-cols-2 ${isSoloMode ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}`}>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Raund</p>
          <p className="mt-1 font-kid text-3xl text-slate-900">{roundLabel}</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Daraja</p>
          <p className="mt-1 text-base font-extrabold text-slate-700">{initialDifficulty}</p>
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
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Uzunlik</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">{currentLength} belgi</p>
        </div>
      </div>

      <div className="arena-3d-panel mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
          <span>Progress: {progressPercent}%</span>
          <span>
            Holat:{' '}
            {phase === 'ready'
              ? 'Tayyor'
              : phase === 'preview'
                ? 'Ko`rsatish'
                : phase === 'input'
                  ? 'Javob'
                  : phase === 'result'
                    ? 'Natija'
                    : 'Tugadi'}
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full bg-gradient-to-r ${gameTone}`} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className={`mt-4 grid gap-4 ${isSoloMode ? '' : 'lg:grid-cols-2'}`}>
        {renderTeamPanel('left', leftLabel, leftTeam, leftFlash, 'border-cyan-200 bg-cyan-50/35', 'from-cyan-500 to-blue-500')}
        {!isSoloMode
          ? renderTeamPanel('right', rightLabel, rightTeam, rightFlash, 'border-fuchsia-200 bg-fuchsia-50/35', 'from-fuchsia-500 to-rose-500')
          : null}
      </div>

      <div
        className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-extrabold ${
          phase === 'finished' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
        }`}
      >
        {statusText}
      </div>

      {showWinnerModal ? (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <ConfettiOverlay burstKey={confettiBurst} />
          <div className="relative z-[2] w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/75 bg-white/95 p-5 shadow-soft sm:p-6">
            <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-cyan-200/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-fuchsia-200/35 blur-3xl" />

            <div className="relative">
              <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                Xotira zanjiri yakunlandi
              </p>
              <h3 className="mt-3 font-kid text-4xl text-slate-900 sm:text-5xl">
                {!isSoloMode && winnerLabel === 'Durang' ? 'Durang natija' : `G'olib: ${winnerLabel}`}
              </h3>
              <p className="mt-1 text-base font-bold text-slate-600">
                {!isSoloMode && winnerLabel === 'Durang'
                  ? "Ikkala jamoa ham teng natija ko'rsatdi."
                  : isSoloMode
                    ? `${leftLabel} eng kuchli xotira natijasini ko'rsatdi.`
                    : `${winnerLabel} eng kuchli xotira natijasini ko'rsatdi.`}
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

export default MemoryChainArena
