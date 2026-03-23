import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfettiOverlay from './ConfettiOverlay'
import type { TeamCount } from '../lib/teamMode.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Winner = 'left' | 'right' | 'draw'
type RoundResult = 'correct' | 'wrong' | 'timeout' | null
type Side = 'left' | 'right'

type FlagFinderArenaProps = {
  gameTitle: string
  gameTone: string
  leftTeamName?: string
  rightTeamName?: string
  teamCount?: TeamCount
  initialDifficulty?: Difficulty
  setupPath?: string
}

type FlagItem = {
  code: string
  emoji: string
  country: string
  hint: string
}

type FlagQuestion = {
  id: string
  code: string
  emoji: string
  answer: string
  options: string[]
  hint: string
}

type RoundPair = {
  left: FlagQuestion
  right: FlagQuestion
}

type DifficultyConfig = {
  rounds: number
  time: number
  points: number
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  Oson: { rounds: 8, time: 18, points: 12 },
  "O'rta": { rounds: 10, time: 14, points: 16 },
  Qiyin: { rounds: 12, time: 10, points: 22 },
}

const FLAG_BANK: FlagItem[] = [
  { code: 'uz', emoji: '🇺🇿', country: "O'zbekiston", hint: 'Markaziy Osiyo davlati' },
  { code: 'tr', emoji: '🇹🇷', country: 'Turkiya', hint: 'Istanbul shahri bilan mashhur' },
  { code: 'kz', emoji: '🇰🇿', country: "Qozog'iston", hint: "O'zbekiston qo'shnisi" },
  { code: 'kg', emoji: '🇰🇬', country: "Qirg'iziston", hint: 'Tog‘li hududlari ko‘p' },
  { code: 'tj', emoji: '🇹🇯', country: 'Tojikiston', hint: 'Poytaxti Dushanbe' },
  { code: 'ae', emoji: '🇦🇪', country: 'BAA', hint: 'Dubay joylashgan mamlakat' },
  { code: 'sa', emoji: '🇸🇦', country: 'Saudiya Arabistoni', hint: 'Makka shahri joylashgan' },
  { code: 'qa', emoji: '🇶🇦', country: 'Qatar', hint: 'Poytaxti Doha' },
  { code: 'jp', emoji: '🇯🇵', country: 'Yaponiya', hint: 'Quyosh chiqish mamlakati' },
  { code: 'kr', emoji: '🇰🇷', country: 'Janubiy Koreya', hint: 'Poytaxti Seul' },
  { code: 'cn', emoji: '🇨🇳', country: 'Xitoy', hint: 'Eng ko‘p aholili davlat' },
  { code: 'in', emoji: '🇮🇳', country: 'Hindiston', hint: 'Taj Mahal mamlakati' },
  { code: 'gb', emoji: '🇬🇧', country: 'Buyuk Britaniya', hint: 'Poytaxti London' },
  { code: 'fr', emoji: '🇫🇷', country: 'Fransiya', hint: 'Eyfel minorasi joylashgan' },
  { code: 'de', emoji: '🇩🇪', country: 'Germaniya', hint: 'Poytaxti Berlin' },
  { code: 'it', emoji: '🇮🇹', country: 'Italiya', hint: 'Poytaxti Rim' },
  { code: 'es', emoji: '🇪🇸', country: 'Ispaniya', hint: 'Poytaxti Madrid' },
  { code: 'pt', emoji: '🇵🇹', country: 'Portugaliya', hint: 'Poytaxti Lissabon' },
  { code: 'nl', emoji: '🇳🇱', country: 'Niderlandiya', hint: 'Poytaxti Amsterdam' },
  { code: 'br', emoji: '🇧🇷', country: 'Braziliya', hint: 'Janubiy Amerikadagi katta davlat' },
  { code: 'ar', emoji: '🇦🇷', country: 'Argentina', hint: 'Poytaxti Buenos-Ayres' },
  { code: 'us', emoji: '🇺🇸', country: 'AQSH', hint: 'Poytaxti Vashington' },
  { code: 'ca', emoji: '🇨🇦', country: 'Kanada', hint: 'Poytaxti Ottava' },
  { code: 'au', emoji: '🇦🇺', country: 'Avstraliya', hint: 'Qitʼa-davlat' },
  { code: 'eg', emoji: '🇪🇬', country: 'Misr', hint: 'Piramidalar joylashgan' },
  { code: 'za', emoji: '🇿🇦', country: 'JAR', hint: 'Afrikaning janubiy qismi' },
  { code: 'ru', emoji: '🇷🇺', country: 'Rossiya', hint: 'Maydoni eng katta davlat' },
  { code: 'ua', emoji: '🇺🇦', country: 'Ukraina', hint: 'Poytaxti Kiyev' },
  { code: 'mx', emoji: '🇲🇽', country: 'Meksika', hint: 'Shimoliy Amerikadagi davlat' },
  { code: 'id', emoji: '🇮🇩', country: 'Indoneziya', hint: 'Orollardan iborat mamlakat' },
  { code: 'my', emoji: '🇲🇾', country: 'Malayziya', hint: 'Poytaxti Kuala-Lumpur' },
  { code: 'th', emoji: '🇹🇭', country: 'Tailand', hint: 'Poytaxti Bangkok' },
]

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

const pickWrongOptions = (answer: string) =>
  shuffle(
    FLAG_BANK.filter((item) => item.country !== answer).map((item) => item.country),
  ).slice(0, 3)

const buildQuestion = (flag: FlagItem, idSeed: string): FlagQuestion => {
  const options = shuffle([flag.country, ...pickWrongOptions(flag.country)])
  return {
    id: `${idSeed}-${flag.code}-${Math.random().toString(36).slice(2, 7)}`,
    code: flag.code,
    emoji: flag.emoji,
    answer: flag.country,
    options,
    hint: flag.hint,
  }
}

const createRoundPairs = (difficulty: Difficulty): RoundPair[] => {
  const rounds = DIFFICULTY_CONFIG[difficulty].rounds
  const needed = rounds * 2
  const pool = shuffle(FLAG_BANK).slice(0, needed)

  return Array.from({ length: rounds }, (_, index) => {
    const leftFlag = pool[index * 2]
    const rightFlag = pool[index * 2 + 1]

    return {
      left: buildQuestion(leftFlag, `L-${index + 1}`),
      right: buildQuestion(rightFlag, `R-${index + 1}`),
    }
  })
}

const flagImageUrl = (code: string) => `https://flagcdn.com/${code}.svg`

function FlagVisual({ question }: { question: FlagQuestion | undefined }) {
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [question?.id])

  if (!question) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-3xl border border-slate-200 bg-slate-50">
        <span className="text-6xl">🏳️</span>
      </div>
    )
  }

  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white p-2">
      <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-[linear-gradient(145deg,#f2f8ff_0%,#eefcff_46%,#fff4dd_100%)]">
        {imageFailed ? (
          <span className="text-7xl">{question.emoji}</span>
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 sm:p-5">
            <img
              src={flagImageUrl(question.code)}
              alt={`${question.answer} bayrog'i`}
              className="h-auto w-auto max-h-[74%] max-w-[74%] object-contain object-center"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          </div>
        )}
      </div>
      <p className="mt-2 rounded-xl bg-slate-50 px-3 py-1.5 text-center text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">
        Bayroqni toping
      </p>
    </div>
  )
}

function FlagFinderArena({
  gameTitle,
  gameTone,
  leftTeamName = '1-Jamoa',
  rightTeamName = '2-Jamoa',
  teamCount = 2,
  initialDifficulty = "O'rta",
  setupPath = '/games/bayroq-topish',
}: FlagFinderArenaProps) {
  const isSoloMode = teamCount === 1
  const config = DIFFICULTY_CONFIG[initialDifficulty]
  const totalTime = config.rounds * config.time
  const [roundPairs, setRoundPairs] = useState<RoundPair[]>(() => createRoundPairs(initialDifficulty))
  const [leftRound, setLeftRound] = useState(0)
  const [rightRound, setRightRound] = useState(0)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(totalTime)

  const [leftSelected, setLeftSelected] = useState<number | null>(null)
  const [rightSelected, setRightSelected] = useState<number | null>(null)
  const [leftLocked, setLeftLocked] = useState(false)
  const [rightLocked, setRightLocked] = useState(false)
  const [leftResult, setLeftResult] = useState<RoundResult>(null)
  const [rightResult, setRightResult] = useState<RoundResult>(null)

  const [leftScore, setLeftScore] = useState(0)
  const [rightScore, setRightScore] = useState(0)
  const [leftCorrect, setLeftCorrect] = useState(0)
  const [rightCorrect, setRightCorrect] = useState(0)
  const [statusText, setStatusText] = useState("Boshlash tugmasini bosing, ikkala jamoa bir vaqtda o'ynaydi.")
  const [winner, setWinner] = useState<Winner | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [confettiBurst, setConfettiBurst] = useState(0)

  const leftLabel = leftTeamName.trim() || '1-Jamoa'
  const rightLabel = rightTeamName.trim() || '2-Jamoa'
  const totalQuestions = roundPairs.length
  const leftQuestion = leftRound < totalQuestions ? roundPairs[leftRound]?.left : undefined
  const rightQuestion = rightRound < totalQuestions ? roundPairs[rightRound]?.right : undefined
  const completedQuestions = Math.min(leftRound, totalQuestions) + (isSoloMode ? 0 : Math.min(rightRound, totalQuestions))
  const progressPercent = totalQuestions > 0
    ? Math.round((completedQuestions / (totalQuestions * (isSoloMode ? 1 : 2))) * 100)
    : 0
  const winnerLabel =
    isSoloMode ? leftLabel : winner === 'left' ? leftLabel : winner === 'right' ? rightLabel : winner === 'draw' ? 'Durang' : ''

  const resultLabel = (result: RoundResult) => {
    if (result === 'correct') return "To'g'ri"
    if (result === 'wrong') return 'Xato'
    if (result === 'timeout') return 'Vaqt tugadi'
    return 'Kutilmoqda'
  }

  const resolveWinner = () => {
    if (isSoloMode) return 'left' as const
    if (leftScore > rightScore) return 'left' as const
    if (rightScore > leftScore) return 'right' as const
    if (leftCorrect > rightCorrect) return 'left' as const
    if (rightCorrect > leftCorrect) return 'right' as const
    return 'draw' as const
  }

  const finishGame = (message: string) => {
    const result = resolveWinner()
    setFinished(true)
    setStarted(false)
    setWinner(result)
    setShowWinnerModal(true)
    setConfettiBurst((prev) => prev + 1)
    setStatusText(message)
  }

  const evaluateAnswer = (side: Side, optionIndex: number) => {
    if (!started || finished) return
    if (side === 'left' && (leftLocked || !leftQuestion)) return
    if (side === 'right' && (rightLocked || !rightQuestion)) return

    const question = side === 'left' ? leftQuestion : rightQuestion
    if (!question) return

    const picked = question.options[optionIndex]
    const isCorrect = picked === question.answer
    const sideLabel = side === 'left' ? leftLabel : rightLabel
    const speedBonus = Math.max(0, Math.floor(timeLeft / 8))
    const totalPointGain = config.points + speedBonus

    if (side === 'left') {
      setLeftSelected(optionIndex)
      setLeftLocked(true)
      if (isCorrect) {
        setLeftResult('correct')
        setLeftScore((prev) => prev + totalPointGain)
        setLeftCorrect((prev) => prev + 1)
      } else {
        setLeftResult('wrong')
      }
    } else {
      setRightSelected(optionIndex)
      setRightLocked(true)
      if (isCorrect) {
        setRightResult('correct')
        setRightScore((prev) => prev + totalPointGain)
        setRightCorrect((prev) => prev + 1)
      } else {
        setRightResult('wrong')
      }
    }

    if (isCorrect) {
      setStatusText(`${sideLabel} tez topdi: ${question.answer}. +${config.points} +${speedBonus} bonus`)
      return
    }
    setStatusText(`${sideLabel} xato javob berdi. To'g'ri javob: ${question.answer}`)
  }

  const startGame = () => {
    if (finished || started) return
    setStarted(true)
    setStatusText(isSoloMode ? "O'yin boshlandi. Savollar ketma-ket ochiladi." : "Bellashuv boshlandi. Har jamoa o'zi mustaqil tezlikda davom etadi.")
  }

  const resetGame = () => {
    const freshPairs = createRoundPairs(initialDifficulty)
    setRoundPairs(freshPairs)
    setLeftRound(0)
    setRightRound(0)
    setStarted(false)
    setFinished(false)
    setTimeLeft(totalTime)
    setLeftSelected(null)
    setRightSelected(null)
    setLeftLocked(false)
    setRightLocked(false)
    setLeftResult(null)
    setRightResult(null)
    setLeftScore(0)
    setRightScore(0)
    setLeftCorrect(0)
    setRightCorrect(0)
    setWinner(null)
    setShowWinnerModal(false)
    setStatusText(isSoloMode ? "Boshlash tugmasini bosing, savollar ketma-ket ochiladi." : "Boshlash tugmasini bosing, ikkala jamoa bir vaqtda o'ynaydi.")
  }

  useEffect(() => {
    if (!started || finished) return
    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [started, finished])

  useEffect(() => {
    if (!started || finished) return
    if (timeLeft > 0) return
    finishGame(isSoloMode ? "Vaqt tugadi. Yakka o'yin yakunlandi." : "Vaqt tugadi. Bellashuv yakunlandi.")
  }, [timeLeft, started, finished, finishGame, isSoloMode])

  useEffect(() => {
    if (!started || finished) return
    const leftDone = leftRound >= totalQuestions
    const rightDone = rightRound >= totalQuestions

    if (isSoloMode) {
      if (leftDone) {
        finishGame(`${leftLabel} barcha savollarni tugatdi.`)
      }
      return
    }

    if (!leftDone && !rightDone) return

    if (leftDone && rightDone) {
      finishGame('Barcha savollar yakunlandi.')
      return
    }

    if (leftDone) {
      finishGame(`${leftLabel} barcha savollarni birinchi tugatdi.`)
      return
    }

    finishGame(`${rightLabel} barcha savollarni birinchi tugatdi.`)
  }, [leftRound, rightRound, totalQuestions, started, finished, finishGame, leftLabel, rightLabel, isSoloMode])

  useEffect(() => {
    if (!started || finished || !leftLocked) return
    const timerId = window.setTimeout(() => {
      setLeftRound((prev) => Math.min(prev + 1, totalQuestions))
      setLeftSelected(null)
      setLeftLocked(false)
      setLeftResult(null)
    }, 820)
    return () => window.clearTimeout(timerId)
  }, [leftLocked, started, finished, totalQuestions])

  useEffect(() => {
    if (!started || finished || !rightLocked) return
    const timerId = window.setTimeout(() => {
      setRightRound((prev) => Math.min(prev + 1, totalQuestions))
      setRightSelected(null)
      setRightLocked(false)
      setRightResult(null)
    }, 820)
    return () => window.clearTimeout(timerId)
  }, [rightLocked, started, finished, totalQuestions])

  const renderTeamPanel = (
    side: Side,
    label: string,
    question: FlagQuestion | undefined,
    selected: number | null,
    locked: boolean,
    score: number,
    correct: number,
    result: RoundResult,
    tone: string,
  ) => {
    const borderClass = side === 'left'
      ? 'border-cyan-200 bg-cyan-50/35'
      : 'border-fuchsia-200 bg-fuchsia-50/35'

    return (
      <article className={`arena-3d-panel rounded-[1.7rem] border p-4 shadow-soft ${borderClass}`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-kid text-3xl text-slate-900">{label}</h3>
          <span className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-extrabold text-white ${tone}`}>
            {score} ball
          </span>
        </div>
        <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
          To'g'ri javoblar: {correct}
        </p>

        <div className="mt-3">
          <FlagVisual question={question} />
        </div>

        <p className="mt-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-extrabold text-slate-600">
          Hint: {question?.hint ?? '-'}
        </p>

        <div className="mt-3 grid gap-2">
          {question?.options.map((option, index) => {
            const isPicked = selected === index
            const isCorrect = option === question.answer
            const optionTone = !locked
              ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300'
              : isCorrect
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : isPicked
                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                  : 'border-slate-200 bg-slate-100 text-slate-500'

            return (
              <button
                key={`${question.id}-${option}`}
                type="button"
                onClick={() => evaluateAnswer(side, index)}
                disabled={!started || locked || finished}
                className={`arena-3d-press flex items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-extrabold transition ${optionTone} ${
                  !started || locked || finished ? 'cursor-not-allowed opacity-90' : ''
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-700">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
              </button>
            )
          })}
        </div>

        <p className={`mt-3 rounded-xl border px-3 py-2 text-xs font-extrabold ${
          result === 'correct'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : result === 'wrong'
              ? 'border-rose-300 bg-rose-50 text-rose-700'
              : result === 'timeout'
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-500'
        }`}>
          Natija: {resultLabel(result)}
        </p>
      </article>
    )
  }

  return (
    <section className="glass-card arena-3d-shell relative flex flex-col p-4 sm:p-5" data-aos="fade-up" data-aos-delay="80">
      <div className="pointer-events-none absolute -left-20 top-20 h-52 w-52 rounded-full bg-cyan-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-52 w-52 rounded-full bg-fuchsia-200/35 blur-3xl" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-700 sm:text-xs">
            {isSoloMode ? 'Yakka Flag Battle' : 'Real Flag Battle'}
          </p>
          <h2 className="mt-1 font-kid text-3xl text-slate-900 sm:text-4xl">{gameTitle} Arena</h2>
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
            O'yinni boshlash
          </button>
          <button
            type="button"
            onClick={resetGame}
            className="arena-3d-press ui-secondary-btn ui-secondary-btn--sm"
          >
            Qayta boshlash
          </button>
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${isSoloMode ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-5'}`}>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Savollar</p>
          <p className="mt-1 font-kid text-3xl text-slate-900">
            {completedQuestions}/{totalQuestions * (isSoloMode ? 1 : 2)}
          </p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Timer</p>
          <p className={`mt-1 font-kid text-3xl ${timeLeft <= 5 ? 'text-rose-600' : 'text-slate-900'}`}>
            {started && !finished ? `${timeLeft}s` : '--'}
          </p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{leftLabel}</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">{leftScore} ball</p>
        </div>
        {!isSoloMode ? (
          <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{rightLabel}</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{rightScore} ball</p>
          </div>
        ) : null}
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Daraja</p>
          <p className="mt-1 text-base font-extrabold text-slate-700">{initialDifficulty}</p>
        </div>
      </div>

      <div className="arena-3d-panel mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
          <span>{isSoloMode ? "Savollar ketma-ket siz uchun ochiladi" : "Ikkala jamoa ham bir vaqtda javob beradi"}</span>
          <span>Progress: {progressPercent}%</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full bg-gradient-to-r ${gameTone}`} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className={`mt-4 grid gap-4 ${isSoloMode ? '' : 'lg:grid-cols-2'}`}>
        {renderTeamPanel(
          'left',
          leftLabel,
          leftQuestion,
          leftSelected,
          leftLocked,
          leftScore,
          leftCorrect,
          leftResult,
          'from-cyan-500 to-blue-500',
        )}
        {!isSoloMode ? renderTeamPanel(
          'right',
          rightLabel,
          rightQuestion,
          rightSelected,
          rightLocked,
          rightScore,
          rightCorrect,
          rightResult,
          'from-fuchsia-500 to-rose-500',
        ) : null}
      </div>

      <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-extrabold ${
        finished ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
      }`}>
        {statusText}
      </div>

      <div className="mt-4 text-right text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
        {(leftLocked || (!isSoloMode && rightLocked)) && !finished ? "Natija ko'rsatilib, keyingi savol ochilmoqda..." : ' '}
      </div>

      {showWinnerModal ? (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <ConfettiOverlay
            burstKey={confettiBurst}
            variant={winner === 'draw' ? 'lose' : 'win'}
            pieces={winner === 'draw' ? 110 : 170}
          />
          <div className="relative z-[2] w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/75 bg-white/95 p-5 shadow-soft sm:p-6">
            <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-cyan-200/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-fuchsia-200/35 blur-3xl" />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                  Bayroq raundi yakunlandi
                </p>
                <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-600">
                  Raundlar: {roundPairs.length} x 2
                </p>
              </div>

              <h3 className="mt-3 font-kid text-4xl text-slate-900 sm:text-5xl">
                {!isSoloMode && winnerLabel === 'Durang' ? 'Durang natija' : `G'olib: ${winnerLabel}`}
              </h3>
              <p className="mt-1 text-base font-bold text-slate-600">
                {!isSoloMode && winnerLabel === 'Durang'
                  ? "Ikkala jamoa ham bir xil natija ko'rsatdi."
                  : `${winnerLabel} eng yuqori natija bilan yutdi.`}
              </p>

              <div className={`mt-4 grid gap-3 ${isSoloMode ? '' : 'sm:grid-cols-2'}`}>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{leftLabel}</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-800">{leftScore}</p>
                  <p className="text-sm font-bold text-slate-500">{leftCorrect} ta to'g'ri</p>
                </div>
                {!isSoloMode ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{rightLabel}</p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-800">{rightScore}</p>
                    <p className="text-sm font-bold text-slate-500">{rightCorrect} ta to'g'ri</p>
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
                  onClick={resetGame}
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

export default FlagFinderArena
