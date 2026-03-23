import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfettiOverlay from './ConfettiOverlay'
import millionerBg from '../assets/games/millioner.svg'
import millionerMusic from '../rasm/millioner.mp3'
import { TeamCount } from '../lib/teamMode'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Side = 'left' | 'right'
type Winner = Side | 'draw'
type TeamResult = 'idle' | 'correct' | 'wrong' | 'timeout'
type Tier = 'easy' | 'medium' | 'hard'
type PendingPick = { side: Side; optionIndex: number }

export type TeacherMillionaireQuestion = {
  difficulty: Difficulty
  prompt: string
  options: [string, string, string, string]
  correctIndex: number
}

type MillionaireTeamArenaProps = {
  gameTitle: string
  gameTone: string
  leftTeamName?: string
  rightTeamName?: string
  teamCount?: TeamCount
  difficulty?: Difficulty
  teacherQuestions?: TeacherMillionaireQuestion[]
  setupPath?: string
}

type Question = {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  tier: Tier
}

type TeamState = {
  selected: number | null
  locked: boolean
  result: TeamResult
  alive: boolean
  points: number
  correct: number
  firstHits: number
  bank: number
  guaranteed: number
  finalPrize: number
  outAt: number | null
}

type TeamsState = {
  left: TeamState
  right: TeamState
}

type Config = {
  rounds: number
  seconds: number
  nextDelay: number
}

const CONFIG: Record<Difficulty, Config> = {
  Oson: { rounds: 8, seconds: 24, nextDelay: 1400 },
  "O'rta": { rounds: 10, seconds: 20, nextDelay: 1300 },
  Qiyin: { rounds: 12, seconds: 18, nextDelay: 1200 },
}

const SAFE_LEVELS_BASE = [2, 5, 8]
const BASE_POINT_GAIN = 10
const FIRST_CORRECT_BONUS = 3
const LATE_CORRECT_BONUS = 1

const LADDER_BASE = [1000, 1500, 2000, 2500, 3200, 4000, 5000, 6500, 8000, 10000, 12000, 15000, 18000]

const EASY: Question[] = [
  { id: 'e1', prompt: "O'zbekiston poytaxti qaysi shahar?", options: ['Samarqand', 'Buxoro', 'Toshkent', 'Andijon'], correctIndex: 2, tier: 'easy' },
  { id: 'e2', prompt: '7 x 6 nechiga teng?', options: ['36', '42', '49', '54'], correctIndex: 1, tier: 'easy' },
  { id: 'e3', prompt: "Qaysi hayvon suvda ham quruqlikda ham yashaydi?", options: ['Qush', 'Baqa', 'Ot', 'Mushuk'], correctIndex: 1, tier: 'easy' },
  { id: 'e4', prompt: "Ingliz tilida 'book' nima?", options: ['Ruchka', 'Parta', 'Kitob', 'Daftar'], correctIndex: 2, tier: 'easy' },
  { id: 'e5', prompt: '16 / 4 nechiga teng?', options: ['2', '3', '4', '5'], correctIndex: 2, tier: 'easy' },
  { id: 'e6', prompt: '12 + 15 nechiga teng?', options: ['25', '27', '29', '31'], correctIndex: 1, tier: 'easy' },
]

const MEDIUM: Question[] = [
  { id: 'm1', prompt: 'Qaysi biri tub son?', options: ['21', '27', '29', '35'], correctIndex: 2, tier: 'medium' },
  { id: 'm2', prompt: "Qaysi gaz havoda eng ko'p uchraydi?", options: ['Kislorod', 'Azot', 'Vodorod', 'Karbonat'], correctIndex: 1, tier: 'medium' },
  { id: 'm3', prompt: "Qaysi adib 'O'tkan kunlar' asari muallifi?", options: ["Cho'lpon", 'Abdulla Qodiriy', 'Oybek', 'Furqat'], correctIndex: 1, tier: 'medium' },
  { id: 'm4', prompt: '24 ning 25 foizi nechiga teng?', options: ['4', '5', '6', '8'], correctIndex: 2, tier: 'medium' },
  { id: 'm5', prompt: "Qaysi birlik elektr tok kuchini o'lchaydi?", options: ['Volt', 'Om', 'Amper', 'Vatt'], correctIndex: 2, tier: 'medium' },
  { id: 'm6', prompt: "Qaysi davlatning poytaxti Tokio?", options: ['Xitoy', 'Yaponiya', 'Koreya', 'Hindiston'], correctIndex: 1, tier: 'medium' },
]

const HARD: Question[] = [
  { id: 'h1', prompt: 'log2(64) qiymatini toping.', options: ['5', '6', '7', '8'], correctIndex: 1, tier: 'hard' },
  { id: 'h2', prompt: "Qaysi olim nisbiylik nazariyasini ishlab chiqqan?", options: ['Nyuton', 'Galiley', 'Eynshteyn', 'Faradey'], correctIndex: 2, tier: 'hard' },
  { id: 'h3', prompt: 'sin(90°) qiymati nechiga teng?', options: ['0', '0.5', '1', '-1'], correctIndex: 2, tier: 'hard' },
  { id: 'h4', prompt: "Qaysi birlik bosimni o'lchaydi?", options: ['Nyuton', 'Paskal', 'Joul', 'Vatt'], correctIndex: 1, tier: 'hard' },
  { id: 'h5', prompt: '2^5 + 3^4 nechiga teng?', options: ['103', '113', '123', '133'], correctIndex: 1, tier: 'hard' },
  { id: 'h6', prompt: 'Agar x+y=12, x-y=4 bo`lsa x nechiga teng?', options: ['6', '7', '8', '9'], correctIndex: 2, tier: 'hard' },
]

const shuffle = <T,>(list: T[]) => {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

const formatMoney = (value: number) => `${value.toLocaleString('uz-UZ')} so'm`

const normalizePrompt = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ')

const mapDifficultyToTier = (difficulty: Difficulty): Tier => (
  difficulty === 'Oson' ? 'easy' : difficulty === "O'rta" ? 'medium' : 'hard'
)

const buildTeacherPool = (
  difficulty: Difficulty,
  teacherQuestions: TeacherMillionaireQuestion[],
): Question[] => {
  const seen = new Set<string>()
  return teacherQuestions
    .filter((question) => question.difficulty === difficulty)
    .map((question, index) => ({
      id: `teacher-${difficulty}-${index + 1}`,
      prompt: question.prompt.trim(),
      options: question.options.map((option) => option.trim()),
      correctIndex: question.correctIndex,
      tier: mapDifficultyToTier(difficulty),
    }))
    .filter((question) => question.prompt.length >= 4 && question.options.every(Boolean))
    .filter((question) => question.correctIndex >= 0 && question.correctIndex <= 3)
    .filter((question) => {
      const key = normalizePrompt(question.prompt)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

const buildDeck = (difficulty: Difficulty, teacherQuestions: TeacherMillionaireQuestion[]): Question[] => {
  const rounds = CONFIG[difficulty].rounds
  const tiers = rounds <= 8 ? [EASY, EASY, MEDIUM] : rounds <= 10 ? [EASY, MEDIUM, HARD] : [EASY, MEDIUM, HARD, HARD]
  const pool = [...buildTeacherPool(difficulty, teacherQuestions), ...shuffle(tiers.flat())]
  return Array.from({ length: rounds }, (_, index) => ({ ...pool[index % pool.length], id: `${pool[index % pool.length].id}-${index + 1}` }))
}

const buildLadder = (difficulty: Difficulty): number[] => {
  const rounds = CONFIG[difficulty].rounds
  const multiplier = difficulty === 'Oson' ? 1 : difficulty === "O'rta" ? 1.25 : 1.55
  return Array.from({ length: rounds }, (_, index) => {
    const base = LADDER_BASE[index] ?? LADDER_BASE[LADDER_BASE.length - 1] + (index - LADDER_BASE.length + 1) * 2800
    return Math.round((base * multiplier) / 50) * 50
  })
}

const buildAudienceVotes = (correctIndex: number) => {
  const votes = [0, 0, 0, 0]
  const correctVote = Math.floor(Math.random() * 28) + 52
  votes[correctIndex] = correctVote

  const wrongIndices = [0, 1, 2, 3].filter((item) => item !== correctIndex)
  let remaining = 100 - correctVote
  wrongIndices.forEach((item, index) => {
    if (index === wrongIndices.length - 1) {
      votes[item] = remaining
      return
    }
    const minKeep = wrongIndices.length - index - 1
    const picked = Math.floor(Math.random() * (remaining - minKeep)) + 1
    votes[item] = picked
    remaining -= picked
  })
  return votes
}

const createTeam = (): TeamState => ({
  selected: null,
  locked: false,
  result: 'idle',
  alive: true,
  points: 0,
  correct: 0,
  firstHits: 0,
  bank: 0,
  guaranteed: 0,
  finalPrize: 0,
  outAt: null,
})

const makeFreshTeams = (): TeamsState => ({
  left: createTeam(),
  right: createTeam(),
})

function MillionaireTeamArena({
  gameTitle,
  gameTone,
  leftTeamName = '1-Jamoa',
  rightTeamName = '2-Jamoa',
  teamCount = 2,
  difficulty = "O'rta",
  teacherQuestions = [],
  setupPath = '/games/millioner',
}: MillionaireTeamArenaProps) {
  const cfg = CONFIG[difficulty]
  const leftLabel = leftTeamName.trim() || '1-Jamoa'
  const rightLabel = rightTeamName.trim() || '2-Jamoa'
  const isSoloMode = teamCount === 1
  const customCount = useMemo(
    () => teacherQuestions.filter((question) => question.difficulty === difficulty).length,
    [teacherQuestions, difficulty],
  )

  const [deck, setDeck] = useState<Question[]>(() => buildDeck(difficulty, teacherQuestions))
  const [ladder, setLadder] = useState<number[]>(() => buildLadder(difficulty))
  const [round, setRound] = useState(0)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [settled, setSettled] = useState(false)
  const [timeLeft, setTimeLeft] = useState(cfg.seconds)

  const [teams, setTeams] = useState<TeamsState>(() => {
    const fresh = makeFreshTeams()
    if (isSoloMode) {
      fresh.right.alive = false
      fresh.right.locked = true
    }
    return fresh
  })
  const [status, setStatus] = useState(
    isSoloMode
      ? "Boshlashni bosing. 1 ta xato javob bilan yakka yurish tugaydi."
      : "Boshlashni bosing. 1 ta xato javob bilan o'sha jamoa o'yindan chiqadi.",
  )
  const [winner, setWinner] = useState<Winner | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [burst, setBurst] = useState(0)

  const [usedFifty, setUsedFifty] = useState(false)
  const [usedAudience, setUsedAudience] = useState(false)
  const [usedTime, setUsedTime] = useState(false)
  const [eliminated, setEliminated] = useState<number[]>([])
  const [audience, setAudience] = useState<number[] | null>(null)
  const [pendingPick, setPendingPick] = useState<PendingPick | null>(null)
  const [musicOn, setMusicOn] = useState(true)

  const firstCorrectRef = useRef<Side | null>(null)
  const settledRef = useRef(false)
  const musicRef = useRef<HTMLAudioElement | null>(null)

  const question = deck[round]
  const stageValue = ladder[round] ?? 0
  const totalRounds = deck.length
  const safeLevels = useMemo(() => SAFE_LEVELS_BASE.filter((index) => index < totalRounds), [totalRounds])
  const progress = totalRounds > 0 ? Math.round(((round + (settled ? 1 : 0)) / totalRounds) * 100) : 0
  const canHelp = started && !finished && !settled && !!question && !pendingPick

  const winnerLabel = useMemo(() => (
    isSoloMode
      ? leftLabel
      : winner === 'left' ? leftLabel : winner === 'right' ? rightLabel : winner === 'draw' ? 'Durang' : ''
  ), [isSoloMode, winner, leftLabel, rightLabel])

  const clearRound = () => {
    setTeams((prev) => ({
      left: prev.left.alive
        ? { ...prev.left, selected: null, locked: false, result: 'idle' }
        : { ...prev.left, selected: null, locked: true },
      right: isSoloMode
        ? { ...prev.right, selected: null, locked: true, alive: false }
        : prev.right.alive
          ? { ...prev.right, selected: null, locked: false, result: 'idle' }
          : { ...prev.right, selected: null, locked: true },
    }))
    setSettled(false)
    setTimeLeft(cfg.seconds)
    setEliminated([])
    setAudience(null)
    setPendingPick(null)
    settledRef.current = false
    firstCorrectRef.current = null
  }

  const resolveWinner = (state: TeamsState): Winner => {
    if (isSoloMode) return 'left'
    const leftFinal = state.left.alive ? state.left.bank : state.left.finalPrize
    const rightFinal = state.right.alive ? state.right.bank : state.right.finalPrize

    if (leftFinal > rightFinal) return 'left'
    if (rightFinal > leftFinal) return 'right'
    if (state.left.points > state.right.points) return 'left'
    if (state.right.points > state.left.points) return 'right'
    if (state.left.firstHits > state.right.firstHits) return 'left'
    if (state.right.firstHits > state.left.firstHits) return 'right'
    if (state.left.correct > state.right.correct) return 'left'
    if (state.right.correct > state.left.correct) return 'right'
    return 'draw'
  }

  const settleRound = (message: string) => {
    if (settledRef.current) return
    settledRef.current = true
    setPendingPick(null)
    setSettled(true)
    setStatus(message)
  }

  const askAnswerConfirm = (side: Side, optionIndex: number) => {
    if (!question || !started || finished || settledRef.current || eliminated.includes(optionIndex) || pendingPick) return
    if (isSoloMode && side === 'right') return

    const current = side === 'left' ? teams.left : teams.right
    if (!current.alive || current.locked) return

    setPendingPick({ side, optionIndex })
  }

  const onAnswer = (side: Side, optionIndex: number) => {
    if (!question || !started || finished || settledRef.current || eliminated.includes(optionIndex)) return
    if (isSoloMode && side === 'right') return

    const current = side === 'left' ? teams.left : teams.right
    if (!current.alive || current.locked) return

    const next: TeamsState = {
      left: { ...teams.left },
      right: { ...teams.right },
    }

    const target = side === 'left' ? next.left : next.right
    const label = side === 'left' ? leftLabel : rightLabel
    const isCorrect = optionIndex === question.correctIndex

    target.selected = optionIndex
    target.locked = true

    if (isCorrect) {
      const isFirst = firstCorrectRef.current === null
      if (isFirst) {
        firstCorrectRef.current = side
      }

      const pointsGain = BASE_POINT_GAIN + (isFirst ? FIRST_CORRECT_BONUS : LATE_CORRECT_BONUS)
      target.result = 'correct'
      target.points += pointsGain
      target.correct += 1
      target.bank = stageValue
      if (isFirst) {
        target.firstHits += 1
      }
      if (safeLevels.includes(round)) {
        target.guaranteed = stageValue
      }

      setStatus(
        isFirst
          ? `${label} birinchi to'g'ri topdi: +${pointsGain} ball.`
          : `${label} ham to'g'ri topdi: +${pointsGain} ball.`,
      )
    } else {
      target.result = 'wrong'
      target.alive = false
      target.finalPrize = target.guaranteed
      target.outAt = round + 1
      setStatus(
        `${label}: afsuski, noto'g'ri javob berildi. Bu jamoa uchun o'yin yakunlandi. Yo'qolmaydigan summa: ${formatMoney(target.guaranteed)}.`,
      )
    }

    setTeams(next)

    const leftDone = !next.left.alive || next.left.locked
    const rightDone = isSoloMode || !next.right.alive || next.right.locked

    if (leftDone && rightDone) {
      const answer = question.options[question.correctIndex]
      const first = firstCorrectRef.current === 'left' ? leftLabel : rightLabel

      if (!isSoloMode && next.left.result === 'correct' && next.right.result === 'correct') {
        settleRound(`Ikkala jamoa ham to'g'ri javob berdi. Birinchi bo'lib ${first} topdi. Javob: ${answer}.`)
      } else if (next.left.result === 'correct') {
        settleRound(isSoloMode ? `${leftLabel} to'g'ri topdi. Javob: ${answer}.` : `${leftLabel} savolni oldi. Javob: ${answer}.`)
      } else if (!isSoloMode && next.right.result === 'correct') {
        settleRound(`${rightLabel} savolni oldi. Javob: ${answer}.`)
      } else {
        settleRound(`Raund yopildi. To'g'ri javob: ${answer}.`)
      }
    }
  }

  const confirmPendingPick = () => {
    if (!pendingPick) return
    const { side, optionIndex } = pendingPick
    setPendingPick(null)
    onAnswer(side, optionIndex)
  }

  const cancelPendingPick = () => {
    if (!pendingPick) return
    const teamLabel = pendingPick.side === 'left' ? leftLabel : rightLabel
    setPendingPick(null)
    setStatus(`${teamLabel}: variantni o'zgartirishingiz mumkin.`)
  }

  const startGame = () => {
    if (started || finished) return
    setStarted(true)

    const track = musicRef.current
    if (!track || !musicOn) return
    const playPromise = track.play()
    if (playPromise) {
      void playPromise.catch(() => {})
    }
  }

  const toggleMusic = () => {
    setMusicOn((prev) => {
      const next = !prev
      const track = musicRef.current
      if (!track) return next

      if (!next) {
        track.pause()
        return next
      }

      if (started && !finished) {
        const playPromise = track.play()
        if (playPromise) {
          void playPromise.catch(() => {})
        }
      }
      return next
    })
  }

  const resetGame = () => {
    const track = musicRef.current
    if (track) {
      track.pause()
      track.currentTime = 0
    }

    setDeck(buildDeck(difficulty, teacherQuestions))
    setLadder(buildLadder(difficulty))
    setRound(0)
    setStarted(false)
    setFinished(false)
    setTeams(() => {
      const fresh = makeFreshTeams()
      if (isSoloMode) {
        fresh.right.alive = false
        fresh.right.locked = true
      }
      return fresh
    })
    setWinner(null)
    setShowModal(false)
    setUsedFifty(false)
    setUsedAudience(false)
    setUsedTime(false)
    setEliminated([])
    setAudience(null)
    setPendingPick(null)
    setSettled(false)
    setTimeLeft(cfg.seconds)
    firstCorrectRef.current = null
    settledRef.current = false
    setStatus("Yangi o'yin tayyor. Boshlashni bosing.")
  }

  useEffect(() => {
    const track = new Audio(millionerMusic)
    track.loop = true
    track.volume = 0.32
    musicRef.current = track

    return () => {
      track.pause()
      track.currentTime = 0
      if (musicRef.current === track) {
        musicRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const track = musicRef.current
    if (!track) return

    if (started && !finished && musicOn) {
      const playPromise = track.play()
      if (playPromise) {
        void playPromise.catch(() => {})
      }
      return
    }

    track.pause()
  }, [started, finished, musicOn])

  useEffect(() => {
    if (!started || finished || settled || pendingPick) return
    const id = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [started, finished, settled, round, pendingPick])

  useEffect(() => {
    if (!question || !started || finished || settled || timeLeft > 0) return

    const next: TeamsState = {
      left: { ...teams.left },
      right: { ...teams.right },
    }

    ;(['left', 'right'] as Side[]).forEach((side) => {
      if (isSoloMode && side === 'right') return
      const target = side === 'left' ? next.left : next.right
      if (!target.alive || target.locked) return
      target.locked = true
      target.result = 'timeout'
      target.alive = false
      target.finalPrize = target.guaranteed
      target.outAt = round + 1
    })

    setTeams(next)
    settleRound(`Vaqt tugadi. To'g'ri javob: ${question.options[question.correctIndex]}.`)
  }, [timeLeft, question, started, finished, settled, teams, round, isSoloMode])

  useEffect(() => {
    if (!started || finished || !settled) return
    const id = window.setTimeout(() => {
      const noOneAlive = !teams.left.alive && !teams.right.alive
      const onLast = round >= totalRounds - 1

      if (noOneAlive || onLast) {
        const finalized: TeamsState = {
          left: teams.left.alive ? { ...teams.left, finalPrize: teams.left.bank } : { ...teams.left },
          right: isSoloMode
            ? { ...teams.right, finalPrize: teams.right.finalPrize }
            : teams.right.alive ? { ...teams.right, finalPrize: teams.right.bank } : { ...teams.right },
        }
        setTeams(finalized)
        setFinished(true)
        setStarted(false)
        setWinner(resolveWinner(finalized))
        setShowModal(true)
        setBurst((prev) => prev + 1)
        setStatus(
          isSoloMode
            ? "Yakka Millioner raundi yakunlandi."
            : noOneAlive
            ? "Ikkala jamoa ham o'yindan chiqdi. Yakuniy natijalar chiqarildi."
            : 'Barcha savollar yakunlandi. Yakuniy natijalar chiqarildi.',
        )
        return
      }

      setRound((prev) => prev + 1)
      clearRound()
      setStatus(isSoloMode ? "Yangi savol ochildi. To'g'ri topsangiz bosqich davom etadi." : "Yangi savol ochildi. Birinchi topgan +3 ball, keyingi +1 ball oladi.")
    }, cfg.nextDelay)
    return () => window.clearTimeout(id)
  }, [started, finished, settled, teams, round, totalRounds, cfg.nextDelay, leftLabel, rightLabel, isSoloMode])

  return (
    <section className="millionaire-shell relative overflow-hidden rounded-[2rem] border border-indigo-200/50 bg-[radial-gradient(circle_at_12%_14%,rgba(79,70,229,0.22),transparent_35%),radial-gradient(circle_at_86%_22%,rgba(251,191,36,0.15),transparent_38%),linear-gradient(165deg,#040815_0%,#0d1532_45%,#130d27_100%)] p-4 text-slate-100 shadow-[0_30px_70px_rgba(2,6,23,0.58)] sm:p-5">
      <img
        src={millionerBg}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.22] mix-blend-screen"
      />
      <div className="millionaire-shell-overlay pointer-events-none absolute inset-0 bg-slate-950/40" />
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex rounded-full border border-amber-300/50 bg-amber-300/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-200 sm:text-xs">
            {isSoloMode ? 'Solo Millioner' : 'Team Millioner'}
          </p>
          <h2 className="mt-1 font-kid text-3xl text-white sm:text-4xl">{isSoloMode ? `${gameTitle} Solo` : `${gameTitle} Arena`}</h2>
          <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-indigo-100/80">
            {isSoloMode
              ? "1 xato = yurish tugaydi, to'g'ri javoblar bilan bosqichni ko'tarasiz"
              : "1 xato = o'sha jamoa stop, qolgan jamoa yakka davom etadi"}
          </p>
          {customCount > 0 ? (
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-cyan-200 sm:text-xs">
              {customCount} ta o'qituvchi savoli qo'shilgan
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={setupPath}
            className="millionaire-secondary-btn ui-secondary-btn ui-secondary-btn--sm rounded-xl px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] transition hover:-translate-y-0.5 sm:text-xs"
          >
            {'< '}Sozlama
          </Link>
          <button
            type="button"
            onClick={startGame}
            disabled={started || finished}
            className={`millionaire-primary-btn ui-accent-btn rounded-xl bg-gradient-to-r px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-soft transition sm:text-xs ${
              started || finished ? 'cursor-not-allowed opacity-65' : `hover:-translate-y-0.5 ${gameTone}`
            }`}
          >
            O'yinni boshlash
          </button>
          <button
            type="button"
            onClick={toggleMusic}
            className={`millionaire-secondary-btn rounded-xl border px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] transition hover:-translate-y-0.5 sm:text-xs ${
              musicOn
                ? 'border-emerald-300/80 bg-emerald-500/20 text-emerald-100'
                : 'border-slate-500/80 bg-slate-900/80 text-slate-200'
            }`}
          >
            Musiqa: {musicOn ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={resetGame}
            className="millionaire-secondary-btn ui-secondary-btn ui-secondary-btn--sm rounded-xl px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] transition hover:-translate-y-0.5 sm:text-xs"
          >
            Qayta
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-4 grid gap-4 xl:grid-cols-[1fr_290px]">
        <div className="space-y-4">
          <article className="millionaire-panel rounded-[1.2rem] border border-slate-500/80 bg-slate-900/82 p-4">
            <p className="text-sm font-extrabold text-white">Yordamlar</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  if (!canHelp || usedFifty || !question) return
                  setEliminated(shuffle([0, 1, 2, 3].filter((item) => item !== question.correctIndex)).slice(0, 2))
                  setUsedFifty(true)
                  setStatus('50:50 ishga tushdi.')
                }}
                disabled={!canHelp || usedFifty}
                className={`rounded-xl border px-3 py-2 text-xs font-extrabold uppercase ${
                  !canHelp || usedFifty
                    ? 'cursor-not-allowed border-slate-600/80 bg-slate-900/55 text-slate-400'
                    : 'border-cyan-300/80 bg-cyan-500/25 text-cyan-50'
                }`}
              >
                50:50
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!canHelp || usedAudience || !question) return
                  setAudience(buildAudienceVotes(question.correctIndex))
                  setUsedAudience(true)
                  setStatus("Zal yordami ko'rsatildi.")
                }}
                disabled={!canHelp || usedAudience}
                className={`rounded-xl border px-3 py-2 text-xs font-extrabold uppercase ${
                  !canHelp || usedAudience
                    ? 'cursor-not-allowed border-slate-600/80 bg-slate-900/55 text-slate-400'
                    : 'border-emerald-300/80 bg-emerald-500/25 text-emerald-50'
                }`}
              >
                Zal yordami
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!canHelp || usedTime) return
                  setTimeLeft((prev) => Math.min(cfg.seconds + 12, prev + 10))
                  setUsedTime(true)
                  setStatus("+10 soniya qo'shildi.")
                }}
                disabled={!canHelp || usedTime}
                className={`rounded-xl border px-3 py-2 text-xs font-extrabold uppercase ${
                  !canHelp || usedTime
                    ? 'cursor-not-allowed border-slate-600/80 bg-slate-900/55 text-slate-400'
                    : 'border-amber-300/80 bg-amber-500/25 text-amber-50'
                }`}
              >
                +10 soniya
              </button>
            </div>
          </article>

          <article className="millionaire-panel rounded-[1.2rem] border border-slate-500/80 bg-slate-900/82 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold uppercase">
              <span className="rounded-full border border-indigo-200/50 bg-indigo-300/15 px-2.5 py-1">
                Savol {Math.min(round + (settled ? 1 : 0), totalRounds)}/{totalRounds}
              </span>
              <span className="rounded-full border border-slate-400/80 bg-slate-900/80 px-3 py-1">
                Timer: {started && !finished ? `${timeLeft}s` : '--'}
              </span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800">
              <div className={`h-full rounded-full bg-gradient-to-r ${gameTone}`} style={{ width: `${progress}%` }} />
            </div>
            <div className="millionaire-question-card mt-4 rounded-[1rem] border border-indigo-200/35 bg-[linear-gradient(150deg,#0b122e_0%,#0f1a46_55%,#101938_100%)] px-4 py-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-indigo-200">
                Bosqich mukofoti: {formatMoney(stageValue)}
              </p>
              <p className="mt-2 font-kid text-3xl leading-tight text-white sm:text-4xl">
                {question?.prompt ?? "Savollar tugadi. Qayta tugmasini bosing."}
              </p>
            </div>
            {audience ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {audience.map((vote, index) => (
                  <div key={`aud-${index}`} className="millionaire-subcard rounded-xl border border-slate-500/80 bg-slate-900/72 px-3 py-2 text-sm font-extrabold text-slate-100">
                    {String.fromCharCode(65 + index)}: {vote}%
                  </div>
                ))}
              </div>
            ) : null}
          </article>

          <div className={`grid gap-4 ${isSoloMode ? '' : 'lg:grid-cols-2'}`}>
            {([
              { side: 'left' as Side, label: leftLabel, team: teams.left, tone: 'from-cyan-500 to-blue-600' },
              { side: 'right' as Side, label: rightLabel, team: teams.right, tone: 'from-fuchsia-500 to-rose-500' },
            ].filter((item) => !isSoloMode || item.side === 'left')).map((item) => (
              <article key={item.side} className="millionaire-panel rounded-[1.1rem] border border-slate-500/80 bg-slate-900/82 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-kid text-3xl text-white">{item.label}</h3>
                  <span className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-extrabold text-white ${item.tone}`}>
                    {item.team.points} ball
                  </span>
                </div>
                <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-200">
                  Yutuq: {formatMoney(item.team.alive ? item.team.bank : item.team.finalPrize)}
                </p>
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-300">
                  To'g'ri: {item.team.correct} | Birinchi: {item.team.firstHits}
                </p>
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-amber-200">
                  Yo'qolmaydigan summa: {formatMoney(item.team.guaranteed)}
                </p>
                {!item.team.alive ? (
                  <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-rose-200">
                    To'xtagan savol: {item.team.outAt ?? '-'}
                  </p>
                ) : null}
                {!item.team.alive ? (
                  <div className="mt-4 rounded-xl border border-rose-300/80 bg-rose-500/18 px-4 py-4 text-center">
                    <p className="text-lg font-black italic tracking-[0.02em] text-rose-100">
                      🔒 Afsuski, siz noto'g'ri javob berdingiz
                    </p>
                    <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-rose-100/90">
                      Bu jamoa uchun keyingi savollar yopiq
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {question?.options.map((option, index) => {
                        const picked = item.team.selected === index
                        const correct = question.correctIndex === index
                        const disabled = !started || finished || item.team.locked || settled || !!pendingPick || eliminated.includes(index)

                        const optionTone = !item.team.locked && !settled
                          ? 'border-slate-500/80 bg-slate-800/90 text-slate-100'
                          : correct
                            ? 'border-emerald-300/80 bg-emerald-500/25 text-emerald-50'
                            : picked && item.team.result !== 'timeout'
                              ? 'border-rose-300/80 bg-rose-500/25 text-rose-50'
                              : 'border-slate-600/80 bg-slate-900/65 text-slate-300'

                        return (
                          <button
                            key={`${item.side}-${index}`}
                            type="button"
                            onClick={() => askAnswerConfirm(item.side, index)}
                            disabled={disabled}
                            className={`millionaire-answer-btn flex min-h-[82px] items-start gap-2 rounded-xl border px-3 py-3 text-left text-sm font-extrabold transition ${optionTone} ${disabled ? 'cursor-not-allowed opacity-90' : ''}`}
                          >
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-slate-500/70 bg-slate-900/80 text-xs font-black text-white">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className={eliminated.includes(index) ? 'line-through opacity-70' : ''}>{option}</span>
                          </button>
                        )
                      })}
                    </div>

                    <p className={`mt-3 rounded-lg border px-3 py-2 text-xs font-extrabold ${
                      item.team.result === 'correct'
                        ? 'border-emerald-300/80 bg-emerald-500/20 text-emerald-50'
                        : item.team.result === 'wrong'
                          ? 'border-rose-300/80 bg-rose-500/20 text-rose-50'
                          : item.team.result === 'timeout'
                            ? 'border-amber-300/80 bg-amber-500/20 text-amber-50'
                            : 'border-slate-500/80 bg-slate-900/72 text-slate-100'
                    }`}>
                      Natija: {item.team.result === 'idle' ? 'Kutilmoqda' : item.team.result === 'correct' ? "To'g'ri" : item.team.result === 'wrong' ? 'Xato' : 'Vaqt'}
                    </p>
                  </>
                )}
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <article className="millionaire-panel rounded-[1.2rem] border border-slate-500/80 bg-slate-900/82 p-4">
            <p className="text-sm font-extrabold text-white">Mukofot zinapoyasi</p>
            <div className="mt-3 space-y-1.5">
              {[...ladder].reverse().map((value, index) => {
                const original = ladder.length - 1 - index
                const current = !finished && original === round
                const passed = original < round
                return (
                  <div
                    key={`${value}-${original}`}
                    className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11px] font-extrabold ${
                      current
                        ? `border-transparent bg-gradient-to-r text-white ${gameTone}`
                        : passed
                          ? 'border-emerald-300/70 bg-emerald-500/20 text-emerald-100'
                          : 'border-slate-600/80 bg-slate-900/65 text-slate-100'
                    }`}
                  >
                    <span>{original + 1}</span>
                    <span>{formatMoney(value)}</span>
                  </div>
                )
              })}
            </div>
          </article>
        </aside>
      </div>

      <div className={`millionaire-status relative z-10 mt-4 rounded-xl border px-4 py-3 text-sm font-extrabold ${
        finished
          ? 'border-emerald-300/80 bg-emerald-500/20 text-emerald-50'
          : 'border-indigo-300/70 bg-indigo-500/20 text-indigo-50'
      }`}>
        {status}
      </div>

      {pendingPick && question ? (
        <div className="millionaire-modal-overlay fixed inset-0 z-[94] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="millionaire-modal-panel w-full max-w-xl rounded-[1.6rem] border border-indigo-300/70 bg-[linear-gradient(165deg,#070d22_0%,#101b46_52%,#171131_100%)] p-5 shadow-[0_22px_50px_rgba(15,23,42,0.55)]">
            <p className="inline-flex rounded-full border border-indigo-300/70 bg-indigo-400/20 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-indigo-100">
              Javobni tasdiqlash
            </p>
            <h3 className="mt-3 font-kid text-4xl text-white sm:text-5xl">
              Shu javobda qolishingizga ishonchingiz komilmi?
            </h3>
            <div className="millionaire-subcard mt-4 rounded-xl border border-slate-400/70 bg-slate-900/75 p-3 text-slate-100">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-300">
                Jamoa: {pendingPick.side === 'left' ? leftLabel : rightLabel}
              </p>
              <p className="mt-2 text-sm font-extrabold">
                {String.fromCharCode(65 + pendingPick.optionIndex)}: {question.options[pendingPick.optionIndex]}
              </p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={confirmPendingPick}
                className={`millionaire-primary-btn ui-accent-btn rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
              >
                Ha, qabul qilaman
              </button>
              <button
                type="button"
                onClick={cancelPendingPick}
                className="millionaire-secondary-btn ui-secondary-btn ui-secondary-btn--md rounded-xl px-4 py-2 text-sm font-extrabold transition hover:-translate-y-0.5"
              >
                Yo'q, qayta tanlayman
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showModal ? (
        <div className="millionaire-modal-overlay fixed inset-0 z-[95] grid place-items-center bg-slate-900/65 p-4 backdrop-blur-sm">
          <ConfettiOverlay burstKey={burst} variant={winner === 'draw' ? 'lose' : 'win'} pieces={winner === 'draw' ? 120 : 180} />
          <div className="millionaire-modal-panel w-full max-w-2xl rounded-[1.6rem] border border-slate-400/80 bg-[linear-gradient(160deg,#070d22_0%,#0f193d_55%,#17112f_100%)] p-5">
            <p className="inline-flex rounded-full border border-emerald-300/70 bg-emerald-300/15 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-100">
              Millioner yakuni
            </p>
            <h3 className="mt-3 font-kid text-4xl text-white sm:text-5xl">
                {!isSoloMode && winnerLabel === 'Durang' ? 'Durang natija' : `G'olib: ${winnerLabel}`}
              </h3>
            <div className={`mt-4 grid gap-3 ${isSoloMode ? '' : 'sm:grid-cols-2'}`}>
              {([
                { label: leftLabel, team: teams.left },
                { label: rightLabel, team: teams.right },
              ].filter((item) => !isSoloMode || item.label === leftLabel)).map((item) => (
                <div key={item.label} className="millionaire-subcard rounded-xl border border-slate-500/80 bg-slate-900/75 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase text-slate-200">{item.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">{formatMoney(item.team.alive ? item.team.bank : item.team.finalPrize)}</p>
                  <p className="text-xs font-extrabold text-slate-300">To'g'ri: {item.team.correct}</p>
                  <p className="text-xs font-extrabold text-slate-300">Birinchi topgan: {item.team.firstHits}</p>
                  <p className="text-xs font-extrabold text-amber-200">Yo'qolmaydigan: {formatMoney(item.team.guaranteed)}</p>
                  <p className="text-xs font-extrabold text-slate-300">
                    To'xtagan savol: {item.team.outAt ?? (item.team.alive ? 'Final' : '-')}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="millionaire-secondary-btn ui-secondary-btn ui-secondary-btn--md rounded-xl px-4 py-2 text-sm font-extrabold transition hover:-translate-y-0.5"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={resetGame}
                className={`millionaire-primary-btn ui-accent-btn rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
              >
                Yangi o'yin
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default MillionaireTeamArena
