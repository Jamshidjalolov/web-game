import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.tsx'
import FooterCTA from '../components/FooterCTA.tsx'
import PremiumChallengeArena from '../components/PremiumChallengeArena.tsx'
import { findGameById, type Category } from '../data/games.ts'
import { AUTH_SESSION_CHANGE_EVENT, loadStoredAuthSession } from '../lib/backend.ts'

type GameCategory = Exclude<Category, 'Hammasi'>
type Difficulty = 'Oson' | "O'rta" | 'Qiyin'

type ConfigOption = {
  id: string
  label: string
  icon: string
}

type QuizQuestion = {
  prompt: string
  options: string[]
  correctIndex: number
  hint?: string
}

type BankQuestion = {
  prompt: string
  correct: string
  wrong: string[]
  hint?: string
}

const optionMap: Record<GameCategory, ConfigOption[]> = {
  Matematika: [
    { id: 'plus', label: "Qo'shish", icon: '+' },
    { id: 'minus', label: 'Ayirish', icon: '-' },
    { id: 'multiply', label: "Ko'paytirish", icon: 'x' },
    { id: 'divide', label: "Bo'lish", icon: '/' },
  ],
  Tillar: [
    { id: 'word', label: "So'z tuzish", icon: 'A' },
    { id: 'find', label: "So'z topish", icon: 'F' },
    { id: 'gap', label: 'Gap tuzish', icon: 'G' },
    { id: 'translate', label: 'Tarjima', icon: 'T' },
  ],
  Mantiq: [
    { id: 'pattern', label: 'Ketma-ketlik', icon: '#' },
    { id: 'pair', label: 'Juftlik', icon: '=' },
    { id: 'maze', label: 'Labirint', icon: 'L' },
    { id: 'solve', label: 'Topqirlik', icon: '?' },
  ],
  Jamoaviy: [
    { id: 'captain', label: 'Kapitan', icon: 'C' },
    { id: 'speed', label: 'Tez javob', icon: '!' },
    { id: 'group', label: 'Guruhli', icon: 'G' },
    { id: 'round', label: 'Raund', icon: 'R' },
  ],
  Ijodiy: [
    { id: 'story', label: 'Hikoya', icon: 'H' },
    { id: 'idea', label: "G'oya", icon: '*' },
    { id: 'draw', label: 'Tasvir', icon: 'D' },
    { id: 'voice', label: 'Ifoda', icon: 'V' },
  ],
  Tezkor: [
    { id: 'flash', label: 'Flash', icon: 'F' },
    { id: 'race', label: 'Poyga', icon: 'P' },
    { id: 'react', label: 'Reaksiya', icon: 'R' },
    { id: 'time', label: 'Vaqt', icon: 'T' },
  ],
}

const difficultyQuestionBonus: Record<Difficulty, number> = {
  Oson: 4,
  "O'rta": 6,
  Qiyin: 8,
}

const difficultyScore: Record<Difficulty, number> = {
  Oson: 10,
  "O'rta": 15,
  Qiyin: 20,
}

const secondsByDifficulty: Record<Difficulty, number> = {
  Oson: 20,
  "O'rta": 15,
  Qiyin: 10,
}

const mathRangeByDifficulty: Record<Difficulty, [number, number]> = {
  Oson: [1, 20],
  "O'rta": [10, 60],
  Qiyin: [20, 120],
}

const languagePairs = [
  { uz: 'olma', en: 'apple' },
  { uz: 'kitob', en: 'book' },
  { uz: 'maktab', en: 'school' },
  { uz: 'suv', en: 'water' },
  { uz: 'do`st', en: 'friend' },
  { uz: 'qalam', en: 'pen' },
  { uz: 'uy', en: 'home' },
]

const sentenceGapPool: BankQuestion[] = [
  {
    prompt: 'Men ...ga boraman.',
    correct: 'maktab',
    wrong: ['uy', 'kitob', 'qalam'],
  },
  {
    prompt: 'Bugun havo ...',
    correct: 'issiq',
    wrong: ['tez', 'kitob', 'qizil'],
  },
  {
    prompt: "U ... o'qiydi.",
    correct: 'kitob',
    wrong: ['maktab', 'suv', 'do`st'],
  },
]

const spellingPool = [
  { correct: 'maktab', wrong: ['maktabb', 'matkab', 'maktap'] },
  { correct: 'qalam', wrong: ['kalam', 'qalammm', 'qallam'] },
  { correct: 'do`st', wrong: ['dostt', 'do`s', 'doest'] },
  { correct: 'kitob', wrong: ['kitoob', 'kitop', 'kitobb'] },
]

const questionBanks: Record<
  Exclude<GameCategory, 'Matematika' | 'Tillar'>,
  Record<string, BankQuestion[]>
> = {
  Mantiq: {
    pattern: [
      { prompt: '2, 4, 6, ?', correct: '8', wrong: ['7', '9', '10'] },
      { prompt: '5, 10, 15, ?', correct: '20', wrong: ['18', '22', '25'] },
      { prompt: '3, 6, 12, ?', correct: '24', wrong: ['18', '21', '30'] },
    ],
    pair: [
      { prompt: "Qaysi juftlik yaqin ma'noli?", correct: 'katta-ulkan', wrong: ['katta-kichik', 'tez-sekin', 'oq-qora'] },
      { prompt: "Qaysi juftlik qarama-qarshi ma'noli?", correct: 'issiq-sovuq', wrong: ['issiq-iliq', 'katta-ulkan', 'tez-chaqqon'] },
    ],
    maze: [
      { prompt: "Labirintda eng qisqa yo'l qaysi?", correct: 'A yo`l', wrong: ['B yo`l', 'C yo`l', 'D yo`l'] },
      { prompt: "Burilishdan keyin qaysi yo'nalish to'g'ri?", correct: 'Chap', wrong: ["O'ng", 'Orqaga', "To'g'ri"] },
    ],
    solve: [
      { prompt: "Qaysi idishda eng ko'p suv bor?", correct: '3-idish', wrong: ['1-idish', '2-idish', '4-idish'] },
      { prompt: 'Qaysi shakl ortiqcha?', correct: 'Uchburchak', wrong: ['Doira', 'Doira', 'Doira'] },
    ],
  },
  Jamoaviy: {
    captain: [
      { prompt: 'Kapitan nima qiladi?', correct: 'Yakuniy javobni aytadi', wrong: ['Faqat kuzatadi', 'O`yinni to`xtatadi', "Savolni o'zgartiradi"] },
      { prompt: 'Kapitan tanlash uchun eng yaxshi usul?', correct: 'Ovoz berish', wrong: ['Tasodifiy chiqish', 'Bitta bola tanlaydi', 'Tanlamaslik'] },
    ],
    speed: [
      { prompt: 'Tez javob rejimida nima muhim?', correct: 'Aniq va tez javob', wrong: ['Faqat tezlik', 'Faqat baland ovoz', 'Javob bermaslik'] },
      { prompt: 'Signal chalganda nima qilinadi?', correct: 'Darhol javob beriladi', wrong: ["Kutib turiladi", "Savol o'tkaziladi", 'Jamoa tarqaladi'] },
    ],
    group: [
      { prompt: 'Guruhli ishlashning foydasi?', correct: 'Birga yechim topish', wrong: ['Bir bola ishlaydi', "Bahs bo'ladi", "Vaqt cho'ziladi"] },
      { prompt: "Jamoada vazifa bo'linishi qanday?", correct: 'Har kimga rol beriladi', wrong: ['Faqat kapitan ishlaydi', 'Hech kim ishlamaydi', 'Faqat bitta javobchi'] },
    ],
    round: [
      { prompt: 'Raund tugaganda nima qilinadi?', correct: 'Ballar yoziladi', wrong: ['O`yin yopiladi', 'Savollar o`chiriladi', 'Jamoa almashtirilmaydi'] },
      { prompt: 'Keyingi raund oldidan nima tekshiriladi?', correct: 'Tartib va navbat', wrong: ['Faqat ekran rangi', 'Faqat vaqt', 'Hech narsa'] },
    ],
  },
  Ijodiy: {
    story: [
      { prompt: 'Rasm asosida nima tuziladi?', correct: 'Qisqa hikoya', wrong: ['Misol yechim', 'Jadval', 'Diagramma'] },
      { prompt: 'Hikoya uchun eng yaxshi boshlanish?', correct: 'Qahramon va joy', wrong: ['Faqat yakun', 'Faqat sarlavha', 'Faqat sonlar'] },
    ],
    idea: [
      { prompt: "G'oya yaratishda nima kerak?", correct: 'Tasavvur', wrong: ['Faqat ko`chirish', 'Faqat yodlash', 'Faqat kutish'] },
      { prompt: 'Eng noodatiy yechim qanday topiladi?', correct: 'Bir nechta variant sinab', wrong: ['Bitta variantda qolib', "Savolni o'tkazib", 'Javobsiz'] },
    ],
    draw: [
      { prompt: "Tasvirlashda nimaga e'tibor beriladi?", correct: 'Rang va shakl', wrong: ['Faqat matn', 'Faqat raqam', 'Faqat ism'] },
      { prompt: 'Qaysi vosita chizishga mos?', correct: 'Qalam', wrong: ['Kalkulyator', 'Soat', 'Qoshiq'] },
    ],
    voice: [
      { prompt: 'Ifodali gapirish uchun nima kerak?', correct: 'Aniq talaffuz', wrong: ['Juda tez gapirish', 'Past ovoz', 'So`zsiz'] },
      { prompt: 'Nutqni kuchaytiradigan narsa?', correct: "To'g'ri pauza", wrong: ['Pauzasiz gapirish', 'Juda past ton', 'Faqat imo'] },
    ],
  },
  Tezkor: {
    flash: [
      { prompt: 'Flash rejimida birinchi qadam?', correct: "Savolni tez o'qish", wrong: ['Javobni taxmin qilish', 'Kutib turish', 'Ekranni yopish'] },
      { prompt: 'Flash savolda nima hal qiladi?', correct: 'Diqqat', wrong: ['Tasodif', 'Sekinlik', 'Kechikish'] },
    ],
    race: [
      { prompt: 'Poyga rejimida kim yutadi?', correct: "To'g'ri va tez javob bergan", wrong: ['Eng baland gapirgan', 'Eng oxirgi javob bergan', 'Javobsiz qolgan'] },
      { prompt: 'Poygada jamoa nima qiladi?', correct: 'Navbatni ushlaydi', wrong: ["Bir-birini to`xtatadi", 'Kutib turadi', "O`yin chiqib ketadi"] },
    ],
    react: [
      { prompt: "Reaksiya o'yinida asosiy mahorat?", correct: 'Tez javob', wrong: ['Uzoq o`ylash', 'Juda sekin bosish', "Kutib o'tirish"] },
      { prompt: 'Qachon javob beriladi?', correct: "Signal ko'ringanda", wrong: ['Signal tugagach', 'Savol yo`q paytda', 'Istalgan vaqtda'] },
    ],
    time: [
      { prompt: 'Vaqt rejimida nima nazorat qilinadi?', correct: 'Sekundlar', wrong: ['Ranglar', 'Ismlar', 'Sana'] },
      { prompt: "Vaqt tugasa nima bo'ladi?", correct: "Savol o'tadi", wrong: ['Ball ko`payadi', 'Savol qaytadi', 'Timer davom etadi'] },
    ],
  },
}

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const pickRandom = <T,>(items: T[]) => items[randomInt(0, items.length - 1)]

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

const buildQuestionFromBank = (item: BankQuestion): QuizQuestion => {
  const wrong = shuffle(item.wrong).slice(0, 3)
  const options = shuffle([item.correct, ...wrong])
  return {
    prompt: item.prompt,
    options,
    correctIndex: options.indexOf(item.correct),
    hint: item.hint,
  }
}

const buildNumberChoices = (correct: number, difficulty: Difficulty) => {
  const spread = difficulty === 'Oson' ? 6 : difficulty === "O'rta" ? 12 : 20
  const values = new Set<number>([correct])
  while (values.size < 4) {
    const candidate = Math.max(0, correct + randomInt(-spread, spread))
    values.add(candidate)
  }
  const options = shuffle(Array.from(values).map((item) => String(item)))
  return {
    options,
    correctIndex: options.indexOf(String(correct)),
  }
}

const scrambleWord = (word: string) => {
  const letters = word.split('')
  for (let i = letters.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = letters[i]
    letters[i] = letters[j]
    letters[j] = temp
  }
  const mixed = letters.join('')
  return mixed === word ? `${word.slice(1)}${word[0]}` : mixed
}

const createMathQuestion = (optionId: string, difficulty: Difficulty): QuizQuestion => {
  const [min, max] = mathRangeByDifficulty[difficulty]

  if (optionId === 'plus') {
    const a = randomInt(min, max)
    const b = randomInt(min, max)
    const correct = a + b
    const choices = buildNumberChoices(correct, difficulty)
    return { prompt: `${a} + ${b} = ?`, options: choices.options, correctIndex: choices.correctIndex }
  }

  if (optionId === 'minus') {
    const a = randomInt(min, max)
    const b = randomInt(min, max)
    const high = Math.max(a, b)
    const low = Math.min(a, b)
    const correct = high - low
    const choices = buildNumberChoices(correct, difficulty)
    return { prompt: `${high} - ${low} = ?`, options: choices.options, correctIndex: choices.correctIndex }
  }

  if (optionId === 'multiply') {
    const a = randomInt(2, difficulty === 'Qiyin' ? 18 : difficulty === "O'rta" ? 14 : 10)
    const b = randomInt(2, difficulty === 'Qiyin' ? 16 : difficulty === "O'rta" ? 12 : 9)
    const correct = a * b
    const choices = buildNumberChoices(correct, difficulty)
    return { prompt: `${a} x ${b} = ?`, options: choices.options, correctIndex: choices.correctIndex }
  }

  const divisor = randomInt(2, difficulty === 'Qiyin' ? 14 : 10)
  const answer = randomInt(2, difficulty === 'Qiyin' ? 20 : 12)
  const dividend = divisor * answer
  const choices = buildNumberChoices(answer, difficulty)
  return { prompt: `${dividend} / ${divisor} = ?`, options: choices.options, correctIndex: choices.correctIndex }
}

const createLanguageQuestion = (optionId: string): QuizQuestion => {
  if (optionId === 'translate') {
    const current = pickRandom(languagePairs)
    const wrong = shuffle(
      languagePairs.filter((item) => item.uz !== current.uz).map((item) => item.uz),
    ).slice(0, 3)
    return buildQuestionFromBank({
      prompt: `"${current.en}" so'zining o'zbekcha tarjimasi qaysi?`,
      correct: current.uz,
      wrong,
    })
  }

  if (optionId === 'word') {
    const current = pickRandom(languagePairs)
    const wrong = shuffle(
      languagePairs.filter((item) => item.uz !== current.uz).map((item) => item.uz),
    ).slice(0, 3)
    return buildQuestionFromBank({
      prompt: `Harflardan so'z tuzing: ${scrambleWord(current.uz).toUpperCase()}`,
      correct: current.uz,
      wrong,
    })
  }

  if (optionId === 'gap') {
    return buildQuestionFromBank(pickRandom(sentenceGapPool))
  }

  const spell = pickRandom(spellingPool)
  return buildQuestionFromBank({
    prompt: "Qaysi so'z to'g'ri yozilgan?",
    correct: spell.correct,
    wrong: spell.wrong,
  })
}

const createBankQuestion = (
  category: Exclude<GameCategory, 'Matematika' | 'Tillar'>,
  optionId: string,
): QuizQuestion => {
  const selectedGroup = questionBanks[category][optionId]
  if (selectedGroup && selectedGroup.length > 0) {
    return buildQuestionFromBank(pickRandom(selectedGroup))
  }
  const fallbackOption = Object.keys(questionBanks[category])[0]
  return buildQuestionFromBank(pickRandom(questionBanks[category][fallbackOption]))
}

function GamePlayPage() {
  const { gameId = '' } = useParams()
  const game = findGameById(gameId)

  const configOptions = useMemo(
    () => (game ? optionMap[game.category] : []),
    [game],
  )

  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>('Oson')
  const [teamOne, setTeamOne] = useState('1-Jamoa')
  const [teamTwo, setTeamTwo] = useState('2-Jamoa')

  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [startHint, setStartHint] = useState('')

  const [scoreOne, setScoreOne] = useState(0)
  const [scoreTwo, setScoreTwo] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [activeTeam, setActiveTeam] = useState<1 | 2>(1)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const liveBoardRef = useRef<HTMLElement | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(loadStoredAuthSession()?.accessToken))

  useEffect(() => {
    const syncAuth = () => setIsAuthenticated(Boolean(loadStoredAuthSession()?.accessToken))
    const syncAuthFromEvent: EventListener = () => syncAuth()

    window.addEventListener('storage', syncAuth)
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, syncAuthFromEvent)
    return () => {
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, syncAuthFromEvent)
    }
  }, [])

  const selectedOptions = useMemo(
    () => configOptions.filter((item) => selectedOptionIds.includes(item.id)),
    [configOptions, selectedOptionIds],
  )

  const totalQuestions = useMemo(() => {
    if (selectedOptions.length === 0) {
      return 0
    }
    return selectedOptions.length * 4 + difficultyQuestionBonus[difficulty]
  }, [selectedOptions.length, difficulty])

  const selectedLabel = useMemo(() => {
    if (selectedOptions.length === 0) return 'Tanlanmagan'
    return selectedOptions.map((item) => item.label).join(', ')
  }, [selectedOptions])

  const safeTeamOne = teamOne.trim() || '1-Jamoa'
  const safeTeamTwo = teamTwo.trim() || '2-Jamoa'
  const teamLabel = activeTeam === 1 ? safeTeamOne : safeTeamTwo
  const teamNamesReady = teamOne.trim().length > 0 && teamTwo.trim().length > 0
  const optionsReady = selectedOptions.length > 0
  const stageLabel = finished ? 'Raund tugadi' : started ? 'Jonli' : 'Tayyor'
  const progressPercent = started && totalQuestions
    ? Math.min((questionNumber / totalQuestions) * 100, 100)
    : 0

  const isConfigLocked = started && !finished

  const winnerLabel =
    scoreOne === scoreTwo ? 'Durang' : scoreOne > scoreTwo ? safeTeamOne : safeTeamTwo
  const totalScore = Math.max(scoreOne + scoreTwo, 1)
  const teamOneRate = Math.round((scoreOne / totalScore) * 100)
  const teamTwoRate = Math.round((scoreTwo / totalScore) * 100)

  const generateQuestion = () => {
    if (!game || selectedOptions.length === 0) {
      return null
    }
    const pickedOption = pickRandom(selectedOptions)

    if (game.category === 'Matematika') {
      return createMathQuestion(pickedOption.id, difficulty)
    }
    if (game.category === 'Tillar') {
      return createLanguageQuestion(pickedOption.id)
    }
    return createBankQuestion(game.category, pickedOption.id)
  }

  useEffect(() => {
    if (!started || answered || finished) {
      return
    }
    setTimeLeft(secondsByDifficulty[difficulty])
  }, [started, answered, finished, questionNumber, difficulty])

  useEffect(() => {
    if (!started || answered || finished) {
      return
    }
    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [started, answered, finished, questionNumber])

  useEffect(() => {
    if (!started || answered || finished) {
      return
    }
    if (timeLeft > 0) {
      return
    }
    setAnswered(true)
    setFeedback('Vaqt tugadi.')
    setHistory((prev) => [`${teamLabel}: vaqt tugadi`, ...prev].slice(0, 6))
    setStreak(0)
    if (questionNumber >= totalQuestions) {
      setFinished(true)
    }
  }, [timeLeft, started, answered, finished, teamLabel, questionNumber, totalQuestions])

  useEffect(() => {
    if (configOptions.length === 0) {
      return
    }

    setSelectedOptionIds((prev) => {
      const valid = prev.filter((id) => configOptions.some((option) => option.id === id))
      if (valid.length > 0) {
        return valid
      }
      return configOptions.slice(0, 2).map((option) => option.id)
    })
  }, [configOptions])

  if (!game) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#f2f8ff_0%,#eefcff_42%,#fff6dd_100%)] text-slate-800">
        <div className="relative z-10">
          <Navbar />
          <main className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
            <h1 className="font-kid text-5xl text-slate-900 sm:text-6xl">O'yin topilmadi</h1>
            <p className="mt-4 text-xl font-bold text-slate-500">
              Ushbu o'yin mavjud emas yoki o'chirilgan.
            </p>
            <Link
              to="/games"
              className="mt-8 inline-flex rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-8 py-4 text-lg font-extrabold text-white shadow-soft"
            >
              O'yinlar sahifasiga qaytish
            </Link>
          </main>
          <FooterCTA />
        </div>
      </div>
    )
  }

  if (game.id === 'millioner') {
    return <Navigate to="/games/millioner" replace />
  }

  if (game.id === 'soz-qidiruv') {
    return <Navigate to="/games/soz-qidiruv" replace />
  }

  if (game.id === 'inglizcha-soz') {
    return <Navigate to="/games/inglizcha-soz" replace />
  }

  if (game.id === 'tezkor-hisob') {
    return <Navigate to="/games/tezkor-hisob" replace />
  }

  if (game.id === 'arqon-tortish') {
    return <Navigate to="/games/arqon-tortish" replace />
  }

  if (game.id === 'xotira-zanjiri') {
    return <Navigate to="/games/xotira-zanjiri" replace />
  }

  if (game.id === 'ranglar-olami') {
    return <Navigate to="/games/ranglar-olami" replace />
  }

  if (game.id === 'box-jang') {
    return <Navigate to="/games/box-jang" replace />
  }

  if (game.id === 'car-racing-math') {
    return <Navigate to="/games/car-racing-math" replace />
  }

  if (game.id === 'jumanji') {
    return <Navigate to="/games/jumanji" replace />
  }

  if (game.id === 'one-question-100-answers') {
    return <Navigate to="/games/one-question-100-answers" replace />
  }

  if (game.id === 'topqirlik-kvest') {
    return <Navigate to="/games/topqirlik-kvest" replace />
  }

  if (game.id === 'jumla-ustasi') {
    return <Navigate to="/games/jumla-ustasi" replace />
  }

  if (false) {
    return null
  }

  if (
    ![
      'millioner',
      'soz-qidiruv',
      'arqon-tortish',
    ].includes(game.id)
  ) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.16),transparent_22%)]" />

        <div className="relative z-10">
          <Navbar />

          <main className="mx-auto max-w-[1220px] px-4 pb-16 pt-10 sm:px-6">
            <section className="premium-game-card relative overflow-hidden p-6 sm:p-8" data-aos="fade-up">
              <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-cyan-200/40 blur-3xl" />
              <div className="pointer-events-none absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-fuchsia-200/30 blur-3xl" />

              <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div>
                  <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-700">
                    Real ishlaydigan o'yin
                  </p>
                  <h1 className="mt-4 font-kid text-5xl leading-tight text-slate-900 sm:text-6xl">
                    {game.title}
                  </h1>
                  <p className="mt-3 max-w-2xl text-lg font-bold text-slate-600">
                    Premium bellashuv rejimi: jonli topshiriqlar, kombinatsiya, vaqt va real hisob.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span className={`rounded-full bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${game.tone}`}>
                      {game.category}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                      8+ bellashuv
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                      Premium maydon
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to="/games"
                      className="rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-base font-extrabold text-slate-700 transition hover:-translate-y-0.5"
                    >
                      Barcha o'yinlar
                    </Link>
                    {!isAuthenticated ? (
                      <Link
                        to="/login"
                        className={`rounded-2xl bg-gradient-to-r px-7 py-3.5 text-base font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${game.tone}`}
                      >
                        Bepul boshlash
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/85 p-4 shadow-soft">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="h-64 w-full rounded-[1.25rem] object-cover"
                  />
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Mode</p>
                      <p className="mt-1 text-base font-extrabold text-slate-700">Challenge</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Timer</p>
                      <p className="mt-1 text-base font-extrabold text-slate-700">Real-time</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Maqsad</p>
                      <p className="mt-1 text-base font-extrabold text-slate-700">Max combo</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-6">
              <PremiumChallengeArena
                gameId={game.id}
                gameTitle={game.title}
                gameTone={game.tone}
                gameCategory={game.category}
              />
            </div>
          </main>

          <FooterCTA />
        </div>
      </div>
    )
  }

  const toggleOption = (optionId: string) => {
    if (isConfigLocked) {
      return
    }
    setStartHint('')
    setSelectedOptionIds((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId)
      }
      return [...prev, optionId]
    })
  }

  const handleStart = () => {
    if (selectedOptions.length === 0) {
      setStartHint("Kamida 1 ta amal tanlang.")
      return
    }
    const firstQuestion = generateQuestion()
    if (!firstQuestion) {
      return
    }

    setStarted(true)
    setFinished(false)
    setQuestionNumber(1)
    setActiveTeam(1)
    setScoreOne(0)
    setScoreTwo(0)
    setHistory([])
    setStreak(0)
    setBestStreak(0)
    setAnswered(false)
    setSelectedAnswer(null)
    setFeedback('')
    setStartHint('')
    setCurrentQuestion(firstQuestion)
    window.setTimeout(() => {
      liveBoardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 140)
  }

  const handleAnswer = (answerIndex: number) => {
    if (!currentQuestion || answered || finished) {
      return
    }

    setSelectedAnswer(answerIndex)
    setAnswered(true)

    const isCorrect = answerIndex === currentQuestion.correctIndex
    if (isCorrect) {
      const points = difficultyScore[difficulty]
      if (activeTeam === 1) setScoreOne((prev) => prev + points)
      if (activeTeam === 2) setScoreTwo((prev) => prev + points)
      const nextStreak = streak + 1
      setStreak(nextStreak)
      setBestStreak((bestPrev) => (nextStreak > bestPrev ? nextStreak : bestPrev))
      setFeedback(`To'g'ri javob. +${points} ball`)
      setHistory((prev) => [`${teamLabel}: +${points}`, ...prev].slice(0, 6))
    } else {
      setStreak(0)
      setFeedback('Xato javob.')
      setHistory((prev) => [`${teamLabel}: xato`, ...prev].slice(0, 6))
    }

    if (questionNumber >= totalQuestions) {
      setFinished(true)
    }
  }

  const handleNext = () => {
    if (!answered || finished) {
      return
    }
    const nextQuestion = generateQuestion()
    if (!nextQuestion) {
      return
    }

    setQuestionNumber((prev) => prev + 1)
    setActiveTeam((prev) => (prev === 1 ? 2 : 1))
    setCurrentQuestion(nextQuestion)
    setSelectedAnswer(null)
    setAnswered(false)
    setFeedback('')
  }

  const handleReset = () => {
    setStarted(false)
    setFinished(false)
    setQuestionNumber(1)
    setCurrentQuestion(null)
    setSelectedAnswer(null)
    setAnswered(false)
    setFeedback('')
    setTimeLeft(0)
    setScoreOne(0)
    setScoreTwo(0)
    setHistory([])
    setStreak(0)
    setBestStreak(0)
    setActiveTeam(1)
    setStartHint('')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_45%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_14%,rgba(56,189,248,0.24),transparent_20%),radial-gradient(circle_at_90%_18%,rgba(244,114,182,0.16),transparent_23%),radial-gradient(circle_at_20%_84%,rgba(250,204,21,0.18),transparent_22%),radial-gradient(circle_at_84%_80%,rgba(74,222,128,0.18),transparent_22%)]" />

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-[1220px] px-4 pb-16 pt-10 sm:px-6">
          <section
            className="premium-game-card relative overflow-hidden p-6 sm:p-8"
            data-aos="fade-up"
            data-aos-delay="30"
          >
            <div className="pointer-events-none absolute -left-14 -top-14 h-44 w-44 rounded-full bg-cyan-200/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-fuchsia-200/40 blur-3xl" />

            <div className="relative grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div>
                <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-700">
                  Real-time o'yin maydoni
                </p>
                <h1 className="mt-4 font-kid text-5xl leading-tight text-slate-900 sm:text-6xl">
                  {game.title}
                </h1>
                <p className="mt-3 text-lg font-bold text-slate-600">{game.desc}</p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className={`rounded-full bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${game.tone}`}>
                    {game.category}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    Daraja: {difficulty}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    Timer: {secondsByDifficulty[difficulty]}s
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={selectedOptions.length === 0 || isConfigLocked}
                    className={`rounded-2xl px-8 py-4 text-lg font-extrabold text-white shadow-soft transition ${
                      selectedOptions.length === 0 || isConfigLocked
                        ? 'cursor-not-allowed bg-slate-300'
                        : `bg-gradient-to-r ${game.tone} hover:-translate-y-0.5`
                    }`}
                  >
                    {started && !finished ? "O'yin davom etmoqda" : 'Tez start'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-2xl border border-slate-200 bg-white px-7 py-4 text-lg font-extrabold text-slate-700 transition hover:-translate-y-0.5"
                  >
                    Tozalash
                  </button>
                  <p className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-cyan-700">
                    {selectedOptions.length} amal tanlangan
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/85 p-4 shadow-soft">
                <img
                  src={game.image}
                  alt={game.title}
                  className="h-64 w-full rounded-[1.25rem] object-cover"
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Savol</p>
                    <p className="mt-1 text-base font-extrabold text-slate-700">{totalQuestions || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Ball</p>
                    <p className="mt-1 text-base font-extrabold text-slate-700">{difficultyScore[difficulty]}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Navbat</p>
                    <p className="mt-1 text-base font-extrabold text-slate-700">{teamLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
            <article className="glass-card p-6 sm:p-7" data-aos="fade-right" data-aos-delay="60">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">O'yin haqida</h2>
              <p className="mt-3 text-lg font-bold text-slate-600">{game.desc}</p>

              <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-extrabold text-amber-700">
                Telefon orqali o'ynasangiz ekraningizni gorizontal holatda tuting.
              </div>

              <ol className="mt-5 space-y-2 text-lg font-bold text-slate-600">
                <li>1. Jamoa nomlarini kiriting.</li>
                <li>2. Amal va darajani tanlang.</li>
                <li>3. Boshlash tugmasini bosing.</li>
              </ol>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
                  Tanlangan savollar
                </p>
                <p className="mt-2 font-kid text-6xl text-slate-900">{totalQuestions || 0}</p>
                <p className="text-sm font-bold text-slate-500">Joriy sozlamaga ko'ra</p>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-extrabold text-slate-800">Jamoa nomlari</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    value={teamOne}
                    onChange={(e) => setTeamOne(e.target.value)}
                    disabled={isConfigLocked}
                    className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400 ${isConfigLocked ? 'opacity-70' : ''}`}
                    placeholder="1-Jamoa"
                  />
                  <input
                    value={teamTwo}
                    onChange={(e) => setTeamTwo(e.target.value)}
                    disabled={isConfigLocked}
                    className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400 ${isConfigLocked ? 'opacity-70' : ''}`}
                    placeholder="2-Jamoa"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f5fbff_48%,#f8f8ff_100%)] p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
                    Boshlash paneli
                  </p>
                  <p className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                    started && !finished
                      ? 'bg-emerald-100 text-emerald-700'
                      : finished
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {stageLabel}
                  </p>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className={`rounded-2xl border px-3 py-3 text-sm font-extrabold ${
                    optionsReady ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'
                  }`}>
                    1. Amal tanlandi
                  </div>
                  <div className={`rounded-2xl border px-3 py-3 text-sm font-extrabold ${
                    teamNamesReady ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'
                  }`}>
                    2. Jamoalar tayyor
                  </div>
                  <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-3 text-sm font-extrabold text-cyan-700">
                    3. Boshlashni bosing
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStart}
                  disabled={!optionsReady || isConfigLocked}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-xl font-extrabold text-white shadow-soft transition ${
                    !optionsReady || isConfigLocked
                      ? 'cursor-not-allowed bg-slate-300'
                      : `bg-gradient-to-r ${game.tone} hover:-translate-y-0.5 hover:saturate-125`
                  }`}
                >
                  Raundni boshlash
                </button>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-500">
                    Tanlangan amal: <span className="font-extrabold text-slate-700">{selectedOptions.length} ta</span>
                  </p>
                  <p className="text-sm font-bold text-slate-500">
                    Combo: <span className="font-extrabold text-slate-700">{streak}</span>
                  </p>
                  <p className="text-sm font-bold text-slate-500">
                    Har to'g'ri javob: <span className="font-extrabold text-slate-700">+{difficultyScore[difficulty]}</span>
                  </p>
                </div>

                {startHint ? (
                  <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-700">
                    {startHint}
                  </p>
                ) : null}
              </div>
            </article>

            <article className="glass-card p-6 sm:p-7" data-aos="fade-left" data-aos-delay="80">
              <div className="flex items-center justify-between">
                <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Amal tanlash</h2>
                <p className="text-sm font-extrabold text-slate-400">{selectedOptions.length} ta amal</p>
              </div>
              <p className="mt-2 text-sm font-bold text-slate-500">
                Sahifa ochilganda 2 ta amal avtomatik tanlanadi.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {configOptions.map((option) => {
                  const active = selectedOptionIds.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleOption(option.id)}
                      disabled={isConfigLocked}
                      className={`group flex items-center gap-4 rounded-3xl border px-5 py-5 text-left transition ${
                        active
                          ? 'border-cyan-400 bg-cyan-50 shadow-soft'
                          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300'
                      } ${isConfigLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      <span className={`grid h-14 w-14 place-items-center rounded-2xl text-4xl font-extrabold transition ${
                        active
                          ? `bg-gradient-to-r text-white ${game.tone}`
                          : 'bg-slate-100 text-slate-500 group-hover:bg-cyan-100 group-hover:text-cyan-700'
                      }`}>
                        {option.icon}
                      </span>
                      <span className="text-3xl font-kid text-slate-900">{option.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-6">
                <p className="text-2xl font-kid text-slate-900">Daraja tanlash</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(['Oson', "O'rta", 'Qiyin'] as Difficulty[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => !isConfigLocked && setDifficulty(level)}
                      disabled={isConfigLocked}
                      className={`rounded-full px-5 py-3 text-lg font-extrabold transition ${
                        difficulty === level
                          ? `bg-gradient-to-r text-white shadow-soft ${game.tone}`
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      } ${isConfigLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
                      Tanlov
                    </p>
                    <p className="mt-1 text-2xl font-kid text-slate-900">{selectedLabel}</p>
                    <p className="mt-1 text-base font-bold text-slate-500">Daraja: {difficulty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
                      Savollar
                    </p>
                    <p className="mt-1 font-kid text-6xl text-slate-900">{totalQuestions || 0}</p>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section
            ref={liveBoardRef}
            className="mt-6 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]"
          >
            <article className="glass-card p-6 sm:p-7" data-aos="fade-up" data-aos-delay="70">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-kid text-4xl text-slate-900">Jonli maydon</h3>
                <div className="flex items-center gap-2">
                  <p className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-extrabold text-cyan-700">
                    Savol {started ? questionNumber : 0}/{totalQuestions || 0}
                  </p>
                  <p className={`rounded-full px-3 py-1 text-xs font-extrabold ${timeLeft <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {started && !answered && !finished ? `${timeLeft}s` : '--'}
                  </p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${game.tone}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {!started ? (
                <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-lg font-bold text-slate-600">
                    O'yin boshlangach savol va variantlar shu yerda chiqadi.
                  </p>
                </div>
              ) : (
                <div className="mt-5">
                  <div className={`rounded-3xl bg-gradient-to-r p-6 text-white ${game.tone}`}>
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/85">
                      Navbat: {teamLabel}
                    </p>
                    <p className="mt-2 font-kid text-5xl leading-tight">
                      {currentQuestion?.prompt}
                    </p>
                    {currentQuestion?.hint ? (
                      <p className="mt-3 text-sm font-bold text-white/90">{currentQuestion.hint}</p>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {currentQuestion?.options.map((option, index) => {
                      const isCorrect = currentQuestion.correctIndex === index
                      const isPicked = selectedAnswer === index
                      const optionMark = String.fromCharCode(65 + index)
                      const toneClass = !answered
                        ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300'
                        : isCorrect
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : isPicked
                            ? 'border-rose-300 bg-rose-50 text-rose-800'
                            : 'border-slate-200 bg-slate-100 text-slate-500'

                      return (
                        <button
                          key={`${option}-${index}`}
                          type="button"
                          onClick={() => handleAnswer(index)}
                          disabled={answered || finished}
                          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-base font-extrabold transition ${toneClass}`}
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-black text-slate-700">
                            {optionMark}
                          </span>
                          <span>{option}</span>
                        </button>
                      )
                    })}
                  </div>

                  {started && answered ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <p className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-700">
                        {feedback}
                      </p>

                      {!finished ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-slate-800"
                        >
                          Keyingi savol
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleReset}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-emerald-700"
                        >
                          Yangi raund
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </article>

            <article className="glass-card p-6 sm:p-7" data-aos="fade-up" data-aos-delay="120">
              <h3 className="font-kid text-4xl text-slate-900">Hisoblar</h3>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                    {safeTeamOne}
                  </p>
                  <p className="mt-1 font-kid text-5xl text-slate-900">{scoreOne}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                    {safeTeamTwo}
                  </p>
                  <p className="mt-1 font-kid text-5xl text-slate-900">{scoreTwo}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                      Joriy combo
                    </p>
                    <p className="mt-1 font-kid text-4xl text-slate-900">{streak}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                      Eng yaxshi combo
                    </p>
                    <p className="mt-1 font-kid text-4xl text-slate-900">{bestStreak}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  <span>{safeTeamOne} {teamOneRate}%</span>
                  <span>{safeTeamTwo} {teamTwoRate}%</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="flex h-full w-full">
                    <span className="h-full bg-cyan-500" style={{ width: `${teamOneRate}%` }} />
                    <span className="h-full bg-fuchsia-500" style={{ width: `${teamTwoRate}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  Oxirgi natijalar
                </p>
                <div className="mt-2 space-y-2">
                  {history.length === 0 ? (
                    <p className="text-sm font-bold text-slate-500">Hozircha natija yo'q.</p>
                  ) : (
                    history.map((item, index) => (
                      <p key={`${item}-${index}`} className="rounded-xl bg-white px-3 py-2 text-sm font-extrabold text-slate-700">
                        {item}
                      </p>
                    ))
                  )}
                </div>
              </div>

              {finished ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                    O'yin yakuni
                  </p>
                  <p className="mt-1 font-kid text-4xl text-emerald-800">
                    G'olib: {winnerLabel}
                  </p>
                </div>
              ) : null}
            </article>
          </section>
        </main>

        <FooterCTA />
      </div>
    </div>
  )
}

export default GamePlayPage
