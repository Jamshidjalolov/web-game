import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfettiOverlay from './ConfettiOverlay'
import type { TeamCount } from '../lib/teamMode.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Side = 'left' | 'right'
type Winner = Side | 'draw'
type RoundResult = 'correct' | 'wrong' | null

export type TeacherEnglishWord = {
  en: string
  uz: string
  hint?: string
}

type EnglishWordArenaProps = {
  gameTitle: string
  gameTone: string
  leftTeamName?: string
  rightTeamName?: string
  teamCount?: TeamCount
  initialDifficulty?: Difficulty
  teacherWords?: TeacherEnglishWord[]
  setupPath?: string
}

type WordPair = {
  en: string
  uz: string
  hint?: string
}

type WordQuestion = {
  id: string
  prompt: string
  options: string[]
  answer: string
  hint: string
}

type DifficultyConfig = {
  rounds: number
  seconds: number
  points: number
  autoNextMs: number
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  Oson: { rounds: 8, seconds: 150, points: 12, autoNextMs: 820 },
  "O'rta": { rounds: 10, seconds: 130, points: 16, autoNextMs: 760 },
  Qiyin: { rounds: 12, seconds: 110, points: 20, autoNextMs: 680 },
}

const WORD_PAIRS: WordPair[] = [
  { en: 'apple', uz: 'olma' },
  { en: 'book', uz: 'kitob' },
  { en: 'school', uz: 'maktab' },
  { en: 'water', uz: 'suv' },
  { en: 'friend', uz: "do'st" },
  { en: 'teacher', uz: "o'qituvchi" },
  { en: 'student', uz: "o'quvchi" },
  { en: 'pen', uz: 'qalam' },
  { en: 'notebook', uz: 'daftar' },
  { en: 'window', uz: 'deraza' },
  { en: 'door', uz: 'eshik' },
  { en: 'table', uz: 'stol' },
  { en: 'chair', uz: 'stul' },
  { en: 'sun', uz: 'quyosh' },
  { en: 'moon', uz: 'oy' },
  { en: 'star', uz: 'yulduz' },
  { en: 'garden', uz: "bog'" },
  { en: 'city', uz: 'shahar' },
  { en: 'village', uz: 'qishloq' },
  { en: 'family', uz: 'oila' },
  { en: 'mother', uz: 'ona' },
  { en: 'father', uz: 'ota' },
  { en: 'brother', uz: 'aka' },
  { en: 'sister', uz: 'opa' },
  { en: 'bread', uz: 'non' },
  { en: 'milk', uz: 'sut' },
  { en: 'rice', uz: 'guruch' },
  { en: 'orange', uz: 'apelsin' },
  { en: 'banana', uz: 'banan' },
  { en: 'grape', uz: 'uzum' },
  { en: 'bird', uz: 'qush' },
  { en: 'cat', uz: 'mushuk' },
  { en: 'dog', uz: 'it' },
  { en: 'horse', uz: 'ot' },
  { en: 'car', uz: 'mashina' },
  { en: 'bus', uz: 'avtobus' },
  { en: 'train', uz: 'poyezd' },
  { en: 'plane', uz: 'samolyot' },
  { en: 'happy', uz: 'xursand' },
  { en: 'quick', uz: 'tez' },
]

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

const normalizeWord = (value: string) =>
  value.toLowerCase().trim().replace(/[ʻ’`]/g, "'").replace(/\s+/g, ' ')

const sanitizeWord = (value: string) =>
  value.trim().replace(/[ʻ’`]/g, "'").replace(/\s+/g, ' ')

const buildWordPool = (teacherWords: TeacherEnglishWord[]) => {
  const map = new Map<string, WordPair>()
  ;[
    ...teacherWords.map((item) => ({
      en: sanitizeWord(item.en).toLowerCase(),
      uz: sanitizeWord(item.uz).toLowerCase(),
      hint: item.hint?.trim() || '',
    })),
    ...WORD_PAIRS,
  ]
    .filter((item) => item.en.length >= 2 && item.uz.length >= 2)
    .forEach((item) => {
      const key = `${normalizeWord(item.en)}::${normalizeWord(item.uz)}`
      if (!key || map.has(key)) return
      map.set(key, { en: item.en, uz: item.uz })
    })
  return Array.from(map.values())
}

const pickWrongUz = (pool: WordPair[], answer: string, count = 3) =>
  shuffle(pool.map((item) => item.uz).filter((word) => word !== answer)).slice(0, count)

const pickWrongEn = (pool: WordPair[], answer: string, count = 3) =>
  shuffle(pool.map((item) => item.en).filter((word) => word !== answer)).slice(0, count)

const createSpellingVariants = (word: string) => {
  const variants = new Set<string>()

  if (word.length > 3) {
    const swapIndex = Math.floor(word.length / 2) - 1
    const chars = word.split('')
    const i = Math.max(0, swapIndex)
    const j = Math.min(chars.length - 1, i + 1)
    const temp = chars[i]
    chars[i] = chars[j]
    chars[j] = temp
    variants.add(chars.join(''))
  }

  variants.add(`${word}${word[word.length - 1]}`)
  variants.add(word.slice(0, Math.max(2, word.length - 1)))

  if (word.includes('a')) variants.add(word.replace('a', 'e'))
  else if (word.includes('e')) variants.add(word.replace('e', 'a'))
  else variants.add(`${word[0]}${word.slice(2)}${word[1]}`)

  return Array.from(variants).filter((item) => item !== word && item.length >= 3)
}

const buildEnToUzQuestion = (pool: WordPair[], pair: WordPair, idSeed: string): WordQuestion => {
  const options = shuffle([pair.uz, ...pickWrongUz(pool, pair.uz)])
  return {
    id: `${idSeed}-etu-${Math.random().toString(36).slice(2, 7)}`,
    prompt: `"${pair.en}" so'zining o'zbekcha tarjimasi qaysi?`,
    options,
    answer: pair.uz,
    hint: pair.hint || 'Inglizcha so`zni o`zbekchaga moslang',
  }
}

const buildUzToEnQuestion = (pool: WordPair[], pair: WordPair, idSeed: string): WordQuestion => {
  const options = shuffle([pair.en, ...pickWrongEn(pool, pair.en)])
  return {
    id: `${idSeed}-ute-${Math.random().toString(36).slice(2, 7)}`,
    prompt: `"${pair.uz}" so'zining inglizcha tarjimasi qaysi?`,
    options,
    answer: pair.en,
    hint: pair.hint || "O'zbekcha so`zga mos inglizcha variantni toping",
  }
}

const buildSpellingQuestion = (pool: WordPair[], pair: WordPair, idSeed: string): WordQuestion => {
  const rawWrong = createSpellingVariants(pair.en)
  const fallback = pickWrongEn(pool, pair.en, 4)
  const wrong = Array.from(new Set([...rawWrong, ...fallback]))
    .filter((item) => item !== pair.en)
    .slice(0, 3)
  const options = shuffle([pair.en, ...wrong])

  return {
    id: `${idSeed}-spell-${Math.random().toString(36).slice(2, 7)}`,
    prompt: `"${pair.uz}" so'zining to'g'ri inglizcha yozilishi qaysi?`,
    options,
    answer: pair.en,
    hint: pair.hint || 'Imloga e`tibor bering',
  }
}

const buildQuestion = (pool: WordPair[], pair: WordPair, difficulty: Difficulty, idSeed: string): WordQuestion => {
  const random = Math.random()

  if (difficulty === 'Qiyin' && random < 0.45) {
    return buildSpellingQuestion(pool, pair, idSeed)
  }

  if (difficulty === "O'rta" && random < 0.25) {
    return buildSpellingQuestion(pool, pair, idSeed)
  }

  if (random < 0.5) {
    return buildEnToUzQuestion(pool, pair, idSeed)
  }

  return buildUzToEnQuestion(pool, pair, idSeed)
}

const createQuestionDeck = (difficulty: Difficulty, teacherWords: TeacherEnglishWord[] = []): WordQuestion[] => {
  const rounds = DIFFICULTY_CONFIG[difficulty].rounds
  const basePool = buildWordPool(teacherWords)
  const pool = shuffle(basePool)

  const source: WordPair[] = []
  for (let i = 0; i < rounds; i += 1) {
    source.push(pool[i % pool.length])
  }

  return Array.from({ length: rounds }, (_, index) =>
    buildQuestion(basePool, source[index], difficulty, `S-${index + 1}`))
}

function EnglishWordArena({
  gameTitle,
  gameTone,
  leftTeamName = '1-Jamoa',
  rightTeamName = '2-Jamoa',
  teamCount = 2,
  initialDifficulty = "O'rta",
  teacherWords = [],
  setupPath = '/games/inglizcha-soz',
}: EnglishWordArenaProps) {
  const isSoloMode = teamCount === 1
  const config = DIFFICULTY_CONFIG[initialDifficulty]
  const [questions, setQuestions] = useState<WordQuestion[]>(() =>
    createQuestionDeck(initialDifficulty, teacherWords),
  )
  const [roundIndex, setRoundIndex] = useState(0)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [roundSettled, setRoundSettled] = useState(false)
  const [timeLeft, setTimeLeft] = useState(config.seconds)

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
  const [statusText, setStatusText] = useState("Boshlash tugmasini bosing. Ikkala jamoa bir vaqtda o'ynaydi.")
  const [winner, setWinner] = useState<Winner | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [confettiBurst, setConfettiBurst] = useState(0)

  const leftLabel = leftTeamName.trim() || '1-Jamoa'
  const rightLabel = rightTeamName.trim() || '2-Jamoa'
  const totalRounds = questions.length
  const currentQuestion = roundIndex < totalRounds ? questions[roundIndex] : undefined
  const completedRounds = Math.min(roundIndex, totalRounds) + (roundSettled && !finished ? 1 : 0)
  const progressPercent =
    totalRounds > 0 ? Math.round((completedRounds / totalRounds) * 100) : 0
  const winnerLabel =
    isSoloMode ? leftLabel : winner === 'left' ? leftLabel : winner === 'right' ? rightLabel : winner === 'draw' ? 'Durang' : ''

  const resultLabel = (result: RoundResult) => {
    if (result === 'correct') return "To'g'ri"
    if (result === 'wrong') return 'Xato'
    return 'Kutilmoqda'
  }

  const resolveWinner = (preferred: Winner | null = null) => {
    if (isSoloMode) return 'left' as const
    if (preferred && preferred !== 'draw') return preferred
    if (leftScore > rightScore) return 'left' as const
    if (rightScore > leftScore) return 'right' as const
    if (leftCorrect > rightCorrect) return 'left' as const
    if (rightCorrect > leftCorrect) return 'right' as const
    return 'draw' as const
  }

  const finishGame = (message: string, preferredWinner: Winner | null = null) => {
    const resolved = resolveWinner(preferredWinner)
    setFinished(true)
    setStarted(false)
    setWinner(resolved)
    setShowWinnerModal(true)
    setConfettiBurst((prev) => prev + 1)
    setStatusText(message)
  }

  const evaluateAnswer = (side: Side, optionIndex: number) => {
    if (!started || finished || roundSettled || !currentQuestion) return
    if (side === 'left' && leftLocked) return
    if (side === 'right' && rightLocked) return

    const question = currentQuestion
    if (!question) return

    const picked = question.options[optionIndex]
    const isCorrect = picked === question.answer
    const sideLabel = side === 'left' ? leftLabel : rightLabel
    const otherLabel = side === 'left' ? rightLabel : leftLabel
    const speedBonus = Math.max(0, Math.floor(timeLeft / 9))
    const totalGain = config.points + speedBonus

    if (side === 'left') {
      setLeftSelected(optionIndex)
      setLeftLocked(true)
      if (isCorrect) {
        setLeftResult('correct')
        setLeftScore((prev) => prev + totalGain)
        setLeftCorrect((prev) => prev + 1)
      } else {
        setLeftResult('wrong')
      }
    } else {
      setRightSelected(optionIndex)
      setRightLocked(true)
      if (isCorrect) {
        setRightResult('correct')
        setRightScore((prev) => prev + totalGain)
        setRightCorrect((prev) => prev + 1)
      } else {
        setRightResult('wrong')
      }
    }

    if (isCorrect) {
      if (!isSoloMode && side === 'left') {
        setRightLocked(true)
      } else if (!isSoloMode) {
        setLeftLocked(true)
      }
      setRoundSettled(true)
      setStatusText(`${sideLabel} birinchi bo'lib to'g'ri topdi: ${question.answer}. +${config.points} +${speedBonus} bonus`)
      return
    }

    if (isSoloMode) {
      setRoundSettled(true)
      setStatusText(`${sideLabel} xato javob berdi. To'g'ri javob: ${question.answer}`)
      return
    }

    const otherLocked = side === 'left' ? rightLocked : leftLocked
    const otherResult = side === 'left' ? rightResult : leftResult

    if (otherLocked && otherResult === 'wrong') {
      setRoundSettled(true)
      setStatusText(`Ikkala jamoa ham xato javob berdi. To'g'ri javob: ${question.answer}`)
      return
    }

    setStatusText(`${sideLabel} xato javob berdi. ${otherLabel} javob berishi mumkin.`)
  }

  const startGame = () => {
    if (finished || started) return
    setStarted(true)
    setStatusText(isSoloMode ? "O'yin boshlandi. Savollar ketma-ket ochiladi." : "Bellashuv boshlandi. Ikkala jamoa bir xil savolga javob beradi.")
  }

  const resetGame = () => {
    const freshDeck = createQuestionDeck(initialDifficulty, teacherWords)
    setQuestions(freshDeck)
    setRoundIndex(0)
    setStarted(false)
    setFinished(false)
    setRoundSettled(false)
    setTimeLeft(config.seconds)
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
    setStatusText(isSoloMode ? "Boshlash tugmasini bosing. Savollar ketma-ket ochiladi." : "Boshlash tugmasini bosing. Ikkala jamoa bir xil savolga javob beradi.")
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
    finishGame('Vaqt tugadi. Natija hisoblandi.')
  }, [timeLeft, started, finished, finishGame])

  useEffect(() => {
    if (!started || finished || !roundSettled) return
    const timerId = window.setTimeout(() => {
      if (roundIndex >= totalRounds - 1) {
        finishGame('Barcha savollar yakunlandi.')
        return
      }
      setRoundIndex((prev) => Math.min(prev + 1, totalRounds))
      setRoundSettled(false)
      setLeftSelected(null)
      setRightSelected(null)
      setLeftLocked(false)
      setRightLocked(false)
      setLeftResult(null)
      setRightResult(null)
      setStatusText("Yangi savol ochildi. Kim birinchi to'g'ri topsa, o'sha raundni oladi.")
    }, config.autoNextMs)
    return () => window.clearTimeout(timerId)
  }, [roundSettled, started, finished, roundIndex, totalRounds, config.autoNextMs, finishGame])

  const renderTeamPanel = (
    side: Side,
    label: string,
    question: WordQuestion | undefined,
    selected: number | null,
    locked: boolean,
    score: number,
    correct: number,
    result: RoundResult,
    tone: string,
    index: number,
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
          Savol: {Math.min(index + 1, totalRounds)}/{totalRounds} | To'g'ri: {correct}
        </p>

        {question ? (
          <>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900 text-white shadow-soft">
              <div className="relative p-4 sm:p-5">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.18),transparent_45%),radial-gradient(circle_at_88%_22%,rgba(59,130,246,0.16),transparent_42%)]" />
                <div className="relative">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-200">
                      English Challenge
                    </span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/90">
                      Race Savol
                    </span>
                  </div>
                  <p className="mt-3 min-h-[72px] text-lg font-extrabold leading-snug sm:min-h-[88px] sm:text-xl">
                    {question.prompt}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-amber-700">
                Hint
              </span>
              <p className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600">
                {question.hint}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {question.options.map((option, optionIndex) => {
                const isPicked = selected === optionIndex
                const isCorrect = option === question.answer
                const optionTone = !locked
                  ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300'
                  : isCorrect
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : isPicked
                      ? 'border-rose-300 bg-rose-50 text-rose-800'
                      : 'border-slate-200 bg-slate-100 text-slate-500'
                const glowFx = locked
                  ? isCorrect
                    ? 'ring-2 ring-emerald-200 shadow-[0_0_0_4px_rgba(16,185,129,0.12),0_10px_24px_rgba(16,185,129,0.18)] animate-pulse'
                    : isPicked
                      ? 'ring-2 ring-rose-200 shadow-[0_0_0_4px_rgba(244,63,94,0.10),0_10px_22px_rgba(244,63,94,0.16)] animate-pulse'
                      : ''
                  : ''

                return (
                  <button
                    key={`${question.id}-${option}`}
                    type="button"
                    onClick={() => evaluateAnswer(side, optionIndex)}
                    disabled={!started || locked || finished}
                    className={`arena-3d-press group flex min-h-[88px] items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${optionTone} ${glowFx} ${
                      !started || locked || finished ? 'cursor-not-allowed opacity-90' : ''
                    }`}
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-black shadow-sm ${
                      !locked
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
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                        Variant
                      </span>
                      <span className="mt-1 break-words text-sm font-extrabold text-slate-800 sm:text-base">
                        {option}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <div className="mt-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-center">
            <p className="text-sm font-extrabold text-emerald-700">Savollar tugadi</p>
            <p className="mt-1 text-xs font-bold text-emerald-600">Bu jamoa barcha savolni yakunladi.</p>
          </div>
        )}

        <p className={`mt-3 rounded-xl border px-3 py-2 text-xs font-extrabold ${
          result === 'correct'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200 shadow-[0_0_0_4px_rgba(16,185,129,0.10),0_10px_20px_rgba(16,185,129,0.12)] animate-pulse'
            : result === 'wrong'
              ? 'border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-200 shadow-[0_0_0_4px_rgba(244,63,94,0.08),0_10px_20px_rgba(244,63,94,0.12)] animate-pulse'
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
            {isSoloMode ? 'Solo English Battle' : 'Real English Battle'}
          </p>
          <h2 className="mt-1 font-kid text-3xl text-slate-900 sm:text-4xl">{gameTitle} Arena</h2>
          {teacherWords.length > 0 ? (
            <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-cyan-700">
              {teacherWords.length} ta o&apos;qituvchi so&apos;zi qo&apos;shilgan
            </p>
          ) : null}
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

      <div className={`mt-4 grid gap-3 sm:grid-cols-2 ${isSoloMode ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}`}>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Savollar</p>
          <p className="mt-1 font-kid text-3xl text-slate-900">{Math.min(completedRounds, totalRounds)}/{totalRounds}</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Timer</p>
          <p className={`mt-1 font-kid text-3xl ${timeLeft <= 8 ? 'text-rose-600' : 'text-slate-900'}`}>
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
          <span>{isSoloMode ? 'Savollarni ketma-ket yeching' : "Gruh bo'lib tez javob bering"}</span>
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
          currentQuestion,
          leftSelected,
          leftLocked,
          leftScore,
          leftCorrect,
          leftResult,
          'from-cyan-500 to-blue-500',
          roundIndex,
        )}
        {!isSoloMode ? renderTeamPanel(
          'right',
          rightLabel,
          currentQuestion,
          rightSelected,
          rightLocked,
          rightScore,
          rightCorrect,
          rightResult,
          'from-fuchsia-500 to-rose-500',
          roundIndex,
        ) : null}
      </div>

      <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-extrabold ${
        finished ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
      }`}>
        {statusText}
      </div>

      <div className="mt-4 text-right text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
        {roundSettled && !finished ? "Natija ko'rsatilib, keyingi savol ochilmoqda..." : ' '}
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
                  Inglizcha raund yakunlandi
                </p>
                <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-600">
                  Savollar: {totalRounds}{isSoloMode ? '' : ' x 2'}
                </p>
              </div>

              <h3 className="mt-3 font-kid text-4xl text-slate-900 sm:text-5xl">
                {!isSoloMode && winnerLabel === 'Durang' ? 'Durang natija' : `G'olib: ${winnerLabel}`}
              </h3>
              <p className="mt-1 text-base font-bold text-slate-600">
                {!isSoloMode && winnerLabel === 'Durang'
                  ? "Ikkala jamoa ham teng natija ko'rsatdi."
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

export default EnglishWordArena
