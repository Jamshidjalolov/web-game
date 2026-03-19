import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import ConfettiOverlay from './ConfettiOverlay'

type MillionaireArenaProps = {
  gameTitle: string
  gameTone: string
}

type QuestionSeed = {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  tier?: DifficultyTier
}

type MillionQuestion = QuestionSeed & {
  value: number
}

type DraftQuestion = {
  prompt: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctLetter: 'A' | 'B' | 'C' | 'D'
}

type DifficultyTier = 'easy' | 'medium' | 'hard'

const QUESTION_SECONDS = 30
const BONUS_TIME_SECONDS = 15
const MAX_TIME_SECONDS = 45
const PRIZE_LADDER = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500]
const SAFE_LEVELS = [2, 5, 8]

const INITIAL_DRAFT: DraftQuestion = {
  prompt: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctLetter: 'A',
}

const easyQuestionSeeds: QuestionSeed[] = [
  {
    id: 'e1',
    prompt: "O'zbekiston poytaxti qaysi shahar?",
    options: ['Samarqand', 'Buxoro', 'Toshkent', 'Andijon'],
    correctIndex: 2,
    tier: 'easy',
  },
  {
    id: 'e2',
    prompt: '7 x 6 nechiga teng?',
    options: ['36', '42', '49', '54'],
    correctIndex: 1,
    tier: 'easy',
  },
  {
    id: 'e3',
    prompt: "Dunyoning eng katta okeani qaysi?",
    options: ['Atlantika', 'Hind', 'Tinch', 'Shimoliy Muz'],
    correctIndex: 2,
    tier: 'easy',
  },
  {
    id: 'e4',
    prompt: "Qaysi so'z to'g'ri yozilgan?",
    options: ['Maktab', 'Maktap', 'Maktaab', 'Maktabb'],
    correctIndex: 0,
    tier: 'easy',
  },
  {
    id: 'e5',
    prompt: "Ingliz tilida 'book' so'zi nimani anglatadi?",
    options: ['Ruchka', 'Parta', 'Kitob', 'Daftar'],
    correctIndex: 2,
    tier: 'easy',
  },
  {
    id: 'e6',
    prompt: "Qaysi sayyora 'Qizil sayyora' deb ataladi?",
    options: ['Venera', 'Mars', 'Yupiter', 'Saturn'],
    correctIndex: 1,
    tier: 'easy',
  },
  {
    id: 'e7',
    prompt: '12 + 15 nechiga teng?',
    options: ['25', '27', '29', '31'],
    correctIndex: 1,
    tier: 'easy',
  },
  {
    id: 'e8',
    prompt: "Qaysi hayvon suvda ham quruqlikda ham yashaydi?",
    options: ['Qush', 'Baqa', 'Ot', 'Mushuk'],
    correctIndex: 1,
    tier: 'easy',
  },
  {
    id: 'e9',
    prompt: "Yer Quyosh atrofini taxminan necha kunda aylanadi?",
    options: ['180 kun', '365 kun', '500 kun', '730 kun'],
    correctIndex: 1,
    tier: 'easy',
  },
  {
    id: 'e10',
    prompt: '16 / 4 nechiga teng?',
    options: ['2', '3', '4', '5'],
    correctIndex: 2,
    tier: 'easy',
  },
]

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

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

const mediumQuestionSeeds: QuestionSeed[] = [
  {
    id: 'm1',
    prompt: "Qaysi biri tub son?",
    options: ['21', '27', '29', '35'],
    correctIndex: 2,
    tier: 'medium',
  },
  {
    id: 'm2',
    prompt: "Ona tilimizdagi 'olma' so'zining inglizchasi qaysi?",
    options: ['orange', 'apple', 'grape', 'banana'],
    correctIndex: 1,
    tier: 'medium',
  },
  {
    id: 'm3',
    prompt: "Qaysi gaz havoda eng ko'p uchraydi?",
    options: ['Kislorod', 'Azot', 'Vodorod', 'Karbonat angidrid'],
    correctIndex: 1,
    tier: 'medium',
  },
  {
    id: 'm4',
    prompt: '3, 6, 12, 24, ? ketma-ketligini davom ettiring.',
    options: ['30', '36', '48', '42'],
    correctIndex: 2,
    tier: 'medium',
  },
  {
    id: 'm5',
    prompt: "Qaysi adib 'O'tkan kunlar' asari muallifi?",
    options: ['Cho‘lpon', 'Abdulla Qodiriy', 'Hamid Olimjon', 'Oybek'],
    correctIndex: 1,
    tier: 'medium',
  },
  {
    id: 'm6',
    prompt: '24 ning 25 foizi nechiga teng?',
    options: ['4', '5', '6', '8'],
    correctIndex: 2,
    tier: 'medium',
  },
  {
    id: 'm7',
    prompt: "Qaysi birlik elektr tok kuchini o'lchaydi?",
    options: ['Volt', 'Om', 'Amper', 'Vatt'],
    correctIndex: 2,
    tier: 'medium',
  },
  {
    id: 'm8',
    prompt: "Qaysi davrda Amir Temur yashagan?",
    options: ['XII asr', 'XIII asr', 'XIV asr', 'XVI asr'],
    correctIndex: 2,
    tier: 'medium',
  },
  {
    id: 'm9',
    prompt: '9! (faktorial) qiymatini toping.',
    options: ['362880', '40320', '181440', '399168'],
    correctIndex: 0,
    tier: 'medium',
  },
  {
    id: 'm10',
    prompt: "Qaysi biri O'rta Osiyo daryosi emas?",
    options: ['Amudaryo', 'Sirdaryo', 'Zarafshon', 'Nil'],
    correctIndex: 3,
    tier: 'medium',
  },
]

const hardQuestionSeeds: QuestionSeed[] = [
  {
    id: 'h1',
    prompt: 'log2(64) qiymatini toping.',
    options: ['5', '6', '7', '8'],
    correctIndex: 1,
    tier: 'hard',
  },
  {
    id: 'h2',
    prompt: "Qaysi elementning kimyoviy belgisi 'K'?",
    options: ['Kalsiy', 'Kaliy', 'Kobalt', 'Krypton'],
    correctIndex: 1,
    tier: 'hard',
  },
  {
    id: 'h3',
    prompt: 'Agar matritsa 2x3 bo‘lsa, unda elementlar soni nechta?',
    options: ['5', '6', '7', '8'],
    correctIndex: 1,
    tier: 'hard',
  },
  {
    id: 'h4',
    prompt: "Qaysi olim nisbiylik nazariyasini ishlab chiqqan?",
    options: ['Nyuton', 'Galiley', 'Eynshteyn', 'Faradey'],
    correctIndex: 2,
    tier: 'hard',
  },
  {
    id: 'h5',
    prompt: 'sin(90°) qiymati nechiga teng?',
    options: ['0', '0.5', '1', '-1'],
    correctIndex: 2,
    tier: 'hard',
  },
  {
    id: 'h6',
    prompt: 'Qaysi son 3 ga ham, 4 ga ham, 5 ga ham bo‘linadi?',
    options: ['50', '55', '60', '75'],
    correctIndex: 2,
    tier: 'hard',
  },
  {
    id: 'h7',
    prompt: "Qaysi davlatning poytaxti Ottava?",
    options: ['Avstraliya', 'Kanada', 'AQSH', 'Norvegiya'],
    correctIndex: 1,
    tier: 'hard',
  },
  {
    id: 'h8',
    prompt: '2^(5) + 3^(4) nechiga teng?',
    options: ['103', '113', '123', '133'],
    correctIndex: 1,
    tier: 'hard',
  },
  {
    id: 'h9',
    prompt: "Qaysi birlik bosimni o'lchaydi?",
    options: ['Nyuton', 'Paskal', 'Joul', 'Vatt'],
    correctIndex: 1,
    tier: 'hard',
  },
  {
    id: 'h10',
    prompt: 'Agar x + y = 12 va x - y = 4 bo‘lsa, x nechiga teng?',
    options: ['6', '7', '8', '9'],
    correctIndex: 2,
    tier: 'hard',
  },
]

const tierPools: Record<DifficultyTier, QuestionSeed[]> = {
  easy: easyQuestionSeeds,
  medium: mediumQuestionSeeds,
  hard: hardQuestionSeeds,
}
const baseSeedCount = easyQuestionSeeds.length + mediumQuestionSeeds.length + hardQuestionSeeds.length

const getTierByIndex = (index: number): DifficultyTier => {
  if (index <= 2) return 'easy'
  if (index <= 6) return 'medium'
  return 'hard'
}

const createGeneratedMathSeed = (index: number, tier: DifficultyTier): QuestionSeed => {
  const opPool = tier === 'easy' ? ['+', '-'] : tier === 'medium' ? ['+', '-', 'x'] : ['+', '-', 'x', '/']
  const operator = opPool[randomInt(0, opPool.length - 1)]
  const max = tier === 'easy' ? 20 : tier === 'medium' ? 80 : 180
  const min = tier === 'easy' ? 2 : tier === 'medium' ? 8 : 12

  let prompt = ''
  let answer = 0

  if (operator === '+') {
    const a = randomInt(min, max)
    const b = randomInt(min, max)
    answer = a + b
    prompt = `${a} + ${b} nechiga teng?`
  } else if (operator === '-') {
    const a = randomInt(min + 10, max + 10)
    const b = randomInt(min, a - 1)
    answer = a - b
    prompt = `${a} - ${b} nechiga teng?`
  } else if (operator === 'x') {
    const a = randomInt(3, tier === 'hard' ? 18 : 12)
    const b = randomInt(3, tier === 'hard' ? 16 : 12)
    answer = a * b
    prompt = `${a} x ${b} nechiga teng?`
  } else {
    const divisor = randomInt(2, tier === 'hard' ? 12 : 9)
    const result = randomInt(3, tier === 'hard' ? 25 : 14)
    const dividend = divisor * result
    answer = result
    prompt = `${dividend} / ${divisor} nechiga teng?`
  }

  const wrongSet = new Set<number>()
  while (wrongSet.size < 3) {
    const spread = tier === 'easy' ? 6 : tier === 'medium' ? 16 : 34
    const candidate = Math.max(0, answer + randomInt(-spread, spread))
    if (candidate !== answer) {
      wrongSet.add(candidate)
    }
  }

  return {
    id: `gen-${tier}-${index}-${Date.now().toString(36)}`,
    prompt,
    options: [String(answer), ...Array.from(wrongSet).map((item) => String(item))],
    correctIndex: 0,
    tier,
  }
}

const shuffleQuestionOptions = (seed: QuestionSeed): QuestionSeed => {
  const entries = seed.options.map((option, index) => ({
    option,
    isCorrect: index === seed.correctIndex,
  }))
  const mixed = shuffle(entries)
  return {
    ...seed,
    options: mixed.map((item) => item.option),
    correctIndex: mixed.findIndex((item) => item.isCorrect),
  }
}

const pickSeedFromTier = (
  tier: DifficultyTier,
  usedPrompts: Set<string>,
  customQuestions: QuestionSeed[],
) => {
  const preferredCustom = customQuestions.filter((seed) => !usedPrompts.has(seed.prompt))
  if (preferredCustom.length > 0 && Math.random() < 0.25) {
    return shuffle(preferredCustom)[0]
  }

  const tierCandidates = tierPools[tier].filter((seed) => !usedPrompts.has(seed.prompt))
  if (tierCandidates.length > 0) {
    return shuffle(tierCandidates)[0]
  }

  const fallback = [...easyQuestionSeeds, ...mediumQuestionSeeds, ...hardQuestionSeeds].filter(
    (seed) => !usedPrompts.has(seed.prompt),
  )
  if (fallback.length > 0) {
    return shuffle(fallback)[0]
  }

  return createGeneratedMathSeed(Date.now(), tier)
}

const buildStageQuestion = (
  stageIndex: number,
  usedPrompts: Set<string>,
  customPool: QuestionSeed[],
): MillionQuestion => {
  const tier = getTierByIndex(stageIndex)
  const preferGenerated = tier === 'hard' ? 0.5 : tier === 'medium' ? 0.35 : 0.2
  let source: QuestionSeed

  if (stageIndex < customPool.length && !usedPrompts.has(customPool[stageIndex].prompt)) {
    source = customPool[stageIndex]
  } else if (Math.random() < preferGenerated) {
    source = createGeneratedMathSeed(stageIndex, tier)
  } else {
    source = pickSeedFromTier(tier, usedPrompts, customPool)
  }

  if (usedPrompts.has(source.prompt)) {
    source = createGeneratedMathSeed(stageIndex + randomInt(1, 99), tier)
  }

  const shuffledSeed = shuffleQuestionOptions(source)
  usedPrompts.add(shuffledSeed.prompt)
  return {
    ...shuffledSeed,
    id: `${shuffledSeed.id}-${stageIndex + 1}-${Math.random().toString(36).slice(2, 7)}`,
    tier,
    value: PRIZE_LADDER[stageIndex],
  }
}

const formatMoney = (value: number) => `${value.toLocaleString('uz-UZ')} so'm`

const buildAudienceVotes = (correctIndex: number) => {
  const result = [0, 0, 0, 0]
  const correctVote = randomInt(48, 78)
  result[correctIndex] = correctVote
  const wrongIndices = [0, 1, 2, 3].filter((index) => index !== correctIndex)
  let remaining = 100 - correctVote

  wrongIndices.forEach((index, arrayIndex) => {
    const slots = wrongIndices.length - arrayIndex
    if (slots === 1) {
      result[index] = remaining
      return
    }
    const minKeep = slots - 1
    const vote = randomInt(1, remaining - minKeep)
    result[index] = vote
    remaining -= vote
  })

  return result
}

const buildGameQuestions = (customQuestions: QuestionSeed[]): MillionQuestion[] => {
  const usedPrompts = new Set<string>()
  const customPool = shuffle(customQuestions)
  return PRIZE_LADDER.map((_, index) => buildStageQuestion(index, usedPrompts, customPool))
}

const applyTiltByPointer = (
  element: HTMLElement,
  clientX: number,
  clientY: number,
  maxRotate = 8,
) => {
  const rect = element.getBoundingClientRect()
  const posX = (clientX - rect.left) / rect.width
  const posY = (clientY - rect.top) / rect.height
  const rotateY = (posX - 0.5) * maxRotate * 2
  const rotateX = (0.5 - posY) * maxRotate * 2

  element.style.setProperty('--rx', `${rotateX.toFixed(2)}deg`)
  element.style.setProperty('--ry', `${rotateY.toFixed(2)}deg`)
  element.style.setProperty('--mx', `${(posX * 100).toFixed(1)}%`)
  element.style.setProperty('--my', `${(posY * 100).toFixed(1)}%`)
}

const resetTilt = (element: HTMLElement) => {
  element.style.setProperty('--rx', '0deg')
  element.style.setProperty('--ry', '0deg')
  element.style.setProperty('--mx', '50%')
  element.style.setProperty('--my', '50%')
}

function MillionaireArena({ gameTitle, gameTone }: MillionaireArenaProps) {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const [playerInput, setPlayerInput] = useState('')
  const [playerName, setPlayerName] = useState("O'quvchi")
  const [customQuestions, setCustomQuestions] = useState<QuestionSeed[]>([])
  const [draft, setDraft] = useState<DraftQuestion>(INITIAL_DRAFT)
  const [teacherMessage, setTeacherMessage] = useState('')
  const [teacherMessageKind, setTeacherMessageKind] = useState<'error' | 'success'>('success')

  const [sessionQuestions, setSessionQuestions] = useState<MillionQuestion[]>(() => buildGameQuestions([]))
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [awaitingNext, setAwaitingNext] = useState(false)
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS)
  const [bank, setBank] = useState(0)
  const [guaranteed, setGuaranteed] = useState(0)
  const [finalPrize, setFinalPrize] = useState(0)
  const [statusText, setStatusText] = useState("Boshlash uchun o'quvchi ismini kiriting.")
  const [gameResult, setGameResult] = useState<'win' | 'lose' | 'quit' | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultFxKey, setResultFxKey] = useState(0)

  const [usedFifty, setUsedFifty] = useState(false)
  const [usedAudience, setUsedAudience] = useState(false)
  const [usedFriendCall, setUsedFriendCall] = useState(false)
  const [usedSwapQuestion, setUsedSwapQuestion] = useState(false)
  const [usedTimeBoost, setUsedTimeBoost] = useState(false)
  const [eliminated, setEliminated] = useState<number[]>([])
  const [audienceVotes, setAudienceVotes] = useState<number[] | null>(null)
  const [friendTip, setFriendTip] = useState<string | null>(null)
  const [ripple, setRipple] = useState<{
    key: string
    x: number
    y: number
    id: number
  } | null>(null)

  const previewQuestions = useMemo(() => buildGameQuestions(customQuestions), [customQuestions])
  const totalQuestions = sessionQuestions.length
  const currentQuestion = sessionQuestions[currentIndex]
  const isLastQuestion = currentIndex === totalQuestions - 1
  const canUseHint = started && !finished && !locked && !awaitingNext
  const showPrize = finished ? finalPrize : bank
  const currentTier = getTierByIndex(currentIndex)
  const tierLabelMap: Record<DifficultyTier, string> = {
    easy: 'Oson',
    medium: "O'rta",
    hard: 'Qiyin',
  }

  const progressPercent = useMemo(() => {
    if (!started || totalQuestions === 0) return 0
    if (finished && finalPrize === PRIZE_LADDER[PRIZE_LADDER.length - 1]) return 100
    return Math.round((currentIndex / totalQuestions) * 100)
  }, [started, totalQuestions, finished, finalPrize, currentIndex])

  const ensureAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new window.AudioContext()
    }
    return audioCtxRef.current
  }

  const playTone = (
    frequency: number,
    duration = 0.12,
    type: OscillatorType = 'sine',
    volume = 0.02,
  ) => {
    try {
      const ctx = ensureAudioContext()
      if (ctx.state === 'suspended') {
        void ctx.resume()
      }

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(frequency, ctx.currentTime)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration + 0.02)
    } catch {
      // ignore audio init issues
    }
  }

  const playUiTone = (kind: 'tap' | 'correct' | 'wrong' | 'win') => {
    if (kind === 'tap') {
      playTone(460, 0.08, 'triangle', 0.016)
      return
    }
    if (kind === 'correct') {
      playTone(580, 0.1, 'triangle', 0.024)
      window.setTimeout(() => playTone(720, 0.11, 'sine', 0.022), 85)
      return
    }
    if (kind === 'wrong') {
      playTone(180, 0.16, 'sawtooth', 0.02)
      window.setTimeout(() => playTone(130, 0.14, 'sine', 0.016), 90)
      return
    }

    ;[520, 640, 760, 920].forEach((note, index) => {
      window.setTimeout(() => playTone(note, 0.12, 'triangle', 0.024), index * 90)
    })
  }

  const resetQuestionUi = () => {
    setSelectedIndex(null)
    setLocked(false)
    setAwaitingNext(false)
    setEliminated([])
    setAudienceVotes(null)
    setFriendTip(null)
    setTimeLeft(QUESTION_SECONDS)
  }

  const finishByLose = (reason: string) => {
    playUiTone('wrong')
    setFinished(true)
    setLocked(true)
    setAwaitingNext(false)
    setFinalPrize(guaranteed)
    setGameResult('lose')
    setResultFxKey((prev) => prev + 1)
    setStatusText(`Siz mag'lubiyatga uchradingiz. ${reason} Yakuniy yutuq: ${formatMoney(guaranteed)}.`)
  }

  const startGame = () => {
    const cleanName = playerInput.trim() || playerName.trim()
    if (!cleanName) {
      setStatusText("Avval o'quvchi ismini kiriting.")
      return
    }

    setSessionQuestions(buildGameQuestions(customQuestions))
    setPlayerName(cleanName)
    setPlayerInput(cleanName)
    setStarted(true)
    setFinished(false)
    setCurrentIndex(0)
    setBank(0)
    setGuaranteed(0)
    setFinalPrize(0)
    setGameResult(null)
    setShowResultModal(false)
    setUsedFifty(false)
    setUsedAudience(false)
    setUsedFriendCall(false)
    setUsedSwapQuestion(false)
    setUsedTimeBoost(false)
    resetQuestionUi()
    setStatusText(`1-savol boshlandi. Omad, ${cleanName}!`)
  }

  const goToSetup = () => {
    setStarted(false)
    setFinished(false)
    setCurrentIndex(0)
    setBank(0)
    setGuaranteed(0)
    setFinalPrize(0)
    setGameResult(null)
    setShowResultModal(false)
    setUsedFifty(false)
    setUsedAudience(false)
    setUsedFriendCall(false)
    setUsedSwapQuestion(false)
    setUsedTimeBoost(false)
    resetQuestionUi()
    setStatusText("Yangi o'yin uchun sozlamalarni tanlang.")
  }

  const handleAnswer = (optionIndex: number) => {
    if (!started || finished || locked || awaitingNext || !currentQuestion) return
    if (eliminated.includes(optionIndex)) return

    setSelectedIndex(optionIndex)
    setLocked(true)

    if (optionIndex !== currentQuestion.correctIndex) {
      finishByLose("Noto'g'ri javob.")
      return
    }

    setBank(currentQuestion.value)
    if (SAFE_LEVELS.includes(currentIndex)) setGuaranteed(currentQuestion.value)

    if (isLastQuestion) {
      playUiTone('win')
      setFinished(true)
      setFinalPrize(currentQuestion.value)
      setGameResult('win')
      setResultFxKey((prev) => prev + 1)
      setStatusText(`Yuttingiz! ${playerName}, bosh sovrin: ${formatMoney(currentQuestion.value)}.`)
      return
    }

    playUiTone('correct')
    setAwaitingNext(true)
    setStatusText(`To'g'ri! Siz ${formatMoney(currentQuestion.value)} bosqichiga ko'tarildingiz.`)
  }

  const handleOptionPress = (
    event: MouseEvent<HTMLButtonElement>,
    optionIndex: number,
  ) => {
    if (!currentQuestion || locked || finished) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const rippleId = Date.now() + optionIndex
    const key = `${currentQuestion.id}-${optionIndex}`

    setRipple({
      key,
      id: rippleId,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
    playUiTone('tap')
    handleAnswer(optionIndex)

    window.setTimeout(() => {
      setRipple((prev) => (prev && prev.id === rippleId ? null : prev))
    }, 520)
  }

  const handleNextQuestion = () => {
    if (!awaitingNext || finished) return
    const nextIndex = currentIndex + 1
    if (nextIndex >= totalQuestions) return
    setCurrentIndex(nextIndex)
    resetQuestionUi()
    setStatusText(`${nextIndex + 1}-savol ochildi.`)
  }

  const handleTakePrize = () => {
    if (!started || finished) return
    setFinished(true)
    setLocked(true)
    setAwaitingNext(false)
    setFinalPrize(bank)
    setGameResult('quit')
    setResultFxKey((prev) => prev + 1)
    setStatusText(`Siz o'yindan ${formatMoney(bank)} bilan chiqdingiz.`)
  }

  const handleReplayFromModal = () => {
    setShowResultModal(false)
    startGame()
  }

  const handleBackFromModal = () => {
    setShowResultModal(false)
    goToSetup()
  }

  const useFiftyFifty = () => {
    if (!canUseHint || usedFifty || !currentQuestion) return
    const wrongIndices = [0, 1, 2, 3].filter((index) => index !== currentQuestion.correctIndex)
    setEliminated(shuffle(wrongIndices).slice(0, 2))
    setUsedFifty(true)
    setStatusText('50:50 yordami ishlatildi.')
  }

  const useAudienceHelp = () => {
    if (!canUseHint || usedAudience || !currentQuestion) return
    setAudienceVotes(buildAudienceVotes(currentQuestion.correctIndex))
    setUsedAudience(true)
    setStatusText("Zal yordami ko'rsatildi.")
  }

  const useFriendCallHelp = () => {
    if (!canUseHint || usedFriendCall || !currentQuestion) return
    const confident = Math.random() < 0.72
    const suggestedIndex = confident
      ? currentQuestion.correctIndex
      : [0, 1, 2, 3].filter((idx) => idx !== currentQuestion.correctIndex)[randomInt(0, 2)]
    const letter = String.fromCharCode(65 + suggestedIndex)
    setFriendTip(`Do'stingizning fikri: ${letter} varianti bo'lishi mumkin.`)
    setUsedFriendCall(true)
    setStatusText("Do'stga qo'ng'iroq ishlatildi.")
  }

  const useSwapQuestion = () => {
    if (!canUseHint || usedSwapQuestion || !currentQuestion) return

    setSessionQuestions((prev) => {
      const usedPrompts = new Set(prev.map((question) => question.prompt))
      usedPrompts.delete(prev[currentIndex]?.prompt)
      const customPool = shuffle(customQuestions)
      const replacement = buildStageQuestion(currentIndex, usedPrompts, customPool)
      const next = [...prev]
      next[currentIndex] = replacement
      return next
    })

    setSelectedIndex(null)
    setEliminated([])
    setAudienceVotes(null)
    setFriendTip(null)
    setUsedSwapQuestion(true)
    setTimeLeft((prev) => Math.min(MAX_TIME_SECONDS, Math.max(prev, QUESTION_SECONDS - 4) + 8))
    setStatusText('Savol almashtirildi. Yangi savol ochildi.')
  }

  const useExtraTime = () => {
    if (!canUseHint || usedTimeBoost) return
    setUsedTimeBoost(true)
    setTimeLeft((prev) => Math.min(MAX_TIME_SECONDS, prev + BONUS_TIME_SECONDS))
    setStatusText(`+${BONUS_TIME_SECONDS} soniya qo'shildi.`)
  }

  const addTeacherQuestion = () => {
    const prompt = draft.prompt.trim()
    const options = [draft.optionA.trim(), draft.optionB.trim(), draft.optionC.trim(), draft.optionD.trim()]
    if (prompt.length < 8) {
      setTeacherMessageKind('error')
      setTeacherMessage("Savol matnini to'liqroq yozing.")
      return
    }
    if (options.some((item) => item.length === 0)) {
      setTeacherMessageKind('error')
      setTeacherMessage("Variantlarning barchasini to'ldiring.")
      return
    }
    const normalized = options.map((item) => item.toLowerCase())
    if (new Set(normalized).size !== normalized.length) {
      setTeacherMessageKind('error')
      setTeacherMessage('Variantlar bir-biridan farqli bo`lishi kerak.')
      return
    }

    const correctMap: Record<DraftQuestion['correctLetter'], number> = { A: 0, B: 1, C: 2, D: 3 }
    setCustomQuestions((prev) => [
      ...prev,
      { id: `custom-${Date.now()}-${prev.length}`, prompt, options, correctIndex: correctMap[draft.correctLetter] },
    ])
    setDraft(INITIAL_DRAFT)
    setTeacherMessageKind('success')
    setTeacherMessage("Savol qo'shildi va bankka kirdi.")
  }

  const removeCustomQuestion = (id: string) => {
    setCustomQuestions((prev) => prev.filter((question) => question.id !== id))
  }

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        void audioCtxRef.current.close()
        audioCtxRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!started || finished || locked) return
    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [started, finished, locked, currentIndex])

  useEffect(() => {
    if (!started || finished || locked) return
    if (timeLeft > 0) return
    finishByLose('Vaqt tugadi.')
  }, [timeLeft, started, finished, locked, guaranteed])

  useEffect(() => {
    if (finished && gameResult) {
      setShowResultModal(true)
    }
  }, [finished, gameResult])

  if (!started) {
    return (
      <section className="glass-card arena-3d-shell p-6 sm:p-7" data-aos="fade-up" data-aos-delay="80">
        <div className="text-center">
          <h2 className="font-kid text-5xl text-slate-900 sm:text-6xl">{gameTitle} - Yutuqli o'yin</h2>
          <p className="mx-auto mt-3 max-w-3xl text-lg font-bold text-slate-500">
            Ustoz savollarni tayyorlaydi, o'quvchi esa har bir savolga 30 soniyada javob berib zinapoyada yuqoriga ko'tariladi.
          </p>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-2">
          <article className="rounded-[1.8rem] border border-white/80 bg-white/88 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.1)] backdrop-blur-xl">
            <h3 className="text-3xl font-kid text-slate-900">"Millioner" qoidalari</h3>
            <ul className="mt-4 space-y-2.5 text-base font-bold text-slate-600">
              <li>Har bir savol uchun 30 soniya beriladi.</li>
              <li>To'g'ri javob bersangiz keyingi bosqichga ko'tarilasiz.</li>
              <li>Noto'g'ri javob yoki vaqt tugashi o'yinni yakunlaydi.</li>
              <li>50:50, Zal yordami, Do'stga qo'ng'iroq, Savolni almashtirish va +15 soniya bir martadan ishlatiladi.</li>
            </ul>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Timer</p>
                <p className="mt-1 text-lg font-black text-slate-700">30s</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Tayyor</p>
                <p className="mt-1 text-lg font-black text-slate-700">{baseSeedCount} ta</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Qo'shilgan</p>
                <p className="mt-1 text-lg font-black text-slate-700">{customQuestions.length} ta</p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.8rem] border border-white/80 bg-white/88 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.1)] backdrop-blur-xl">
            <h3 className="text-3xl font-kid text-slate-900">O'qituvchi uchun test</h3>
            <p className="mt-2 text-sm font-bold text-slate-500">Qo'shilgan savollar o'yinda birinchi ishlatiladi.</p>
            <textarea
              value={draft.prompt}
              onChange={(e) => setDraft((prev) => ({ ...prev, prompt: e.target.value }))}
              className="mt-4 h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-slate-700 outline-none transition focus:border-cyan-400"
              placeholder="Savol matni"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['A', draft.optionA, 'optionA'],
                ['B', draft.optionB, 'optionB'],
                ['C', draft.optionC, 'optionC'],
                ['D', draft.optionD, 'optionD'],
              ].map(([label, value, key]) => (
                <input
                  key={label}
                  value={value}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                  placeholder={`Variant ${label}`}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-600">To'g'ri javob:</span>
              <select
                value={draft.correctLetter}
                onChange={(e) => setDraft((prev) => ({ ...prev, correctLetter: e.target.value as DraftQuestion['correctLetter'] }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-extrabold text-slate-700 outline-none transition focus:border-cyan-400"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <button
              type="button"
              onClick={addTeacherQuestion}
              className="arena-3d-press mt-4 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 text-base font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
            >
              + Savolni qo'shish
            </button>
            {teacherMessage ? (
              <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-extrabold ${teacherMessageKind === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {teacherMessage}
              </p>
            ) : null}
            <div className="mt-3 space-y-2">
              {customQuestions.slice(-3).map((question) => (
                <div key={question.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="line-clamp-1 text-sm font-bold text-slate-600">{question.prompt}</p>
                  <button
                    type="button"
                    onClick={() => removeCustomQuestion(question.id)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-700 transition hover:bg-rose-100"
                  >
                    O'chirish
                  </button>
                </div>
              ))}
            </div>
          </article>
        </div>

        <article className="mt-6 rounded-[1.8rem] border border-white/80 bg-white/88 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.1)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-3xl font-kid text-slate-900">Qatnashuvchi o'quvchini tanlang</h4>
              <p className="mt-1 text-sm font-bold text-slate-500">
                Jami savollar: {previewQuestions.length} ta. Boshlang'ich mukofot: {formatMoney(PRIZE_LADDER[0])}.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <input
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                placeholder="O'quvchi ismi"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400 sm:w-72"
              />
              <button
                type="button"
                onClick={startGame}
                className={`arena-3d-press rounded-2xl bg-gradient-to-r px-6 py-3 font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
              >
                O'yinni boshlash
              </button>
            </div>
          </div>
          <p className="mt-3 rounded-xl bg-cyan-50 px-3 py-2 text-sm font-extrabold text-cyan-700">{statusText}</p>
        </article>
      </section>
    )
  }

  return (
    <section className="glass-card arena-3d-shell p-6 sm:p-7" data-aos="fade-up" data-aos-delay="80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-700">
            Millioner Live
          </p>
          <h2 className="mt-2 font-kid text-5xl text-slate-900">{gameTitle}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            3D arena rejimi: real vaqt, yordamlar va mukofot zinapoyasi
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={goToSetup}
            className="arena-3d-press rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5"
          >
            Sozlamaga qaytish
          </button>
          <button
            type="button"
            onClick={startGame}
            className={`arena-3d-press rounded-2xl bg-gradient-to-r px-4 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
          >
            Qaytadan boshlash
          </button>
        </div>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gameTone}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <article className="rounded-[1.6rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_45px_rgba(30,41,59,0.12)]">
            <p className="text-sm font-extrabold text-slate-700">Yordamlar</p>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={useFiftyFifty}
                disabled={!canUseHint || usedFifty}
                className={`arena-3d-press rounded-2xl border px-3 py-3 text-sm font-extrabold transition ${
                  !canUseHint || usedFifty
                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                    : 'border-cyan-400 bg-cyan-50 text-cyan-700 hover:-translate-y-0.5'
                }`}
              >
                50:50
              </button>
              <button
                type="button"
                onClick={useAudienceHelp}
                disabled={!canUseHint || usedAudience}
                className={`arena-3d-press rounded-2xl border px-3 py-3 text-sm font-extrabold transition ${
                  !canUseHint || usedAudience
                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                    : 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:-translate-y-0.5'
                }`}
              >
                Zal yordami
              </button>
              <button
                type="button"
                onClick={useFriendCallHelp}
                disabled={!canUseHint || usedFriendCall}
                className={`arena-3d-press rounded-2xl border px-3 py-3 text-sm font-extrabold transition ${
                  !canUseHint || usedFriendCall
                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                    : 'border-amber-400 bg-amber-50 text-amber-700 hover:-translate-y-0.5'
                }`}
              >
                Do'stga qo'ng'iroq
              </button>
              <button
                type="button"
                onClick={useSwapQuestion}
                disabled={!canUseHint || usedSwapQuestion}
                className={`arena-3d-press rounded-2xl border px-3 py-3 text-sm font-extrabold transition ${
                  !canUseHint || usedSwapQuestion
                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                    : 'border-indigo-400 bg-indigo-50 text-indigo-700 hover:-translate-y-0.5'
                }`}
              >
                Savolni almashtirish
              </button>
              <button
                type="button"
                onClick={useExtraTime}
                disabled={!canUseHint || usedTimeBoost}
                className={`arena-3d-press rounded-2xl border px-3 py-3 text-sm font-extrabold transition ${
                  !canUseHint || usedTimeBoost
                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                    : 'border-violet-400 bg-violet-50 text-violet-700 hover:-translate-y-0.5'
                }`}
              >
                +15 soniya
              </button>
            </div>

            {friendTip ? (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-700">
                {friendTip}
              </p>
            ) : null}
          </article>

          <article className="rounded-[1.6rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_45px_rgba(30,41,59,0.12)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-slate-700">Mukofot zinapoyasi</p>
              <p className="text-sm font-extrabold text-slate-500">
                {currentIndex + 1} / {totalQuestions}
              </p>
            </div>
            <div className="mt-3 space-y-1.5">
              {[...sessionQuestions].reverse().map((question, reverseIndex) => {
                const originalIndex = sessionQuestions.length - 1 - reverseIndex
                const isCurrent = !finished && currentIndex === originalIndex
                const isPassed = originalIndex < currentIndex
                const isSafe = SAFE_LEVELS.includes(originalIndex)
                return (
                  <div
                    key={question.id}
                    className={`million-step-3d flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-extrabold transition ${
                      isCurrent
                        ? `border-transparent bg-gradient-to-r text-white shadow-soft ${gameTone}`
                        : isPassed
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : isSafe
                            ? 'border-amber-300 bg-amber-50 text-amber-700'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{originalIndex + 1}</span>
                    <span>{formatMoney(question.value)}</span>
                  </div>
                )
              })}
            </div>
          </article>
        </aside>

        <article
          className="million-live-card rounded-[1.8rem] border border-white/80 bg-white/92 p-5 shadow-[0_24px_55px_rgba(30,41,59,0.14)]"
          onMouseMove={(e) => applyTiltByPointer(e.currentTarget, e.clientX, e.clientY, 4.8)}
          onMouseLeave={(e) => resetTilt(e.currentTarget)}
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="flex items-start gap-3">
              <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-r text-2xl text-white ${gameTone}`}>
                ⚡
              </div>
              <div>
                <h3 className="text-3xl font-kid text-slate-900">
                  Savol {currentIndex + 1}/{totalQuestions}
                </h3>
                <p className="text-sm font-bold text-slate-500">Mukofot: {formatMoney(currentQuestion?.value ?? 0)}</p>
                <p className="text-sm font-bold text-slate-500">O'yinchi: {playerName}</p>
                <p className="text-sm font-bold text-slate-500">Qiyinlik: {tierLabelMap[currentTier]}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-right">
              <p className={`text-sm font-extrabold ${timeLeft <= 8 ? 'text-rose-600' : 'text-slate-600'}`}>
                ⏱ {timeLeft}s
              </p>
              <p className="text-xs font-bold text-slate-500">
                Jami: {formatMoney(PRIZE_LADDER[PRIZE_LADDER.length - 1])}
              </p>
              <p className="text-xs font-bold text-slate-500">Yutuq: {formatMoney(showPrize)}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-[linear-gradient(160deg,#f8fafc_0%,#f1f5f9_100%)] px-4 py-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Savol matni</p>
            <p className="mt-2 font-kid text-4xl leading-tight text-slate-900">
              {currentQuestion?.prompt}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {currentQuestion?.options.map((option, index) => {
              const letter = String.fromCharCode(65 + index)
              const isEliminated = eliminated.includes(index)
              const isSelected = selectedIndex === index
              const isCorrect = index === currentQuestion.correctIndex
              const optionTone = !locked
                ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300'
                : isCorrect
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : isSelected
                    ? 'border-rose-300 bg-rose-50 text-rose-800'
                    : 'border-slate-200 bg-slate-100 text-slate-500'

              return (
                <button
                  key={`${currentQuestion.id}-${index}`}
                  type="button"
                  onClick={(event) => handleOptionPress(event, index)}
                  onMouseMove={(e) => applyTiltByPointer(e.currentTarget, e.clientX, e.clientY, 7)}
                  onMouseLeave={(e) => resetTilt(e.currentTarget)}
                  disabled={locked || finished || isEliminated}
                  className={`million-option-3d flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left font-extrabold shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition ${optionTone} ${isEliminated ? 'cursor-not-allowed opacity-30' : ''}`}
                >
                  {ripple && ripple.key === `${currentQuestion.id}-${index}` ? (
                    <span
                      key={ripple.id}
                      className="million-ripple"
                      style={{ left: ripple.x, top: ripple.y }}
                    />
                  ) : null}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-300 bg-slate-50 text-sm font-black text-slate-700">
                    {letter}
                  </span>
                  <span className="text-lg">{option}</span>
                </button>
              )
            })}
          </div>

          {audienceVotes ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Zal ovozi</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {audienceVotes.map((vote, index) => (
                  <div key={`vote-${index}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-700">
                    {String.fromCharCode(65 + index)}: {vote}%
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            {!finished ? (
              <button
                type="button"
                onClick={handleTakePrize}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5"
              >
                Tark etish
              </button>
            ) : null}

            {awaitingNext && !finished ? (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-800"
              >
                Keyingi savol
              </button>
            ) : null}

            {finished ? (
              <button
                type="button"
                onClick={goToSetup}
                className={`rounded-2xl bg-gradient-to-r px-5 py-2.5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
              >
                Yangi o'yin
              </button>
            ) : null}
          </div>

          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-extrabold ${
              finished ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
            }`}
          >
            {statusText}
          </div>
        </article>
      </div>

      {showResultModal && gameResult ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          {gameResult === 'win' || gameResult === 'lose' ? (
            <ConfettiOverlay burstKey={resultFxKey} variant={gameResult === 'lose' ? 'lose' : 'win'} />
          ) : null}
          <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.35)] sm:p-7">
            <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-cyan-200/45 blur-3xl" />
            <div className="pointer-events-none absolute -right-14 -bottom-14 h-44 w-44 rounded-full bg-fuchsia-200/30 blur-3xl" />
            {gameResult === 'lose' ? (
              <div className="million-lose-shade pointer-events-none absolute inset-0" />
            ) : null}
            {gameResult === 'lose' ? (
              <div className="million-lose-core pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full" />
            ) : null}

            <div className="relative">
              <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] ${
                gameResult === 'win'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : gameResult === 'lose'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}>
                O'yin natijasi
              </p>

              <h3 className={`mt-3 font-kid text-5xl leading-tight ${
                gameResult === 'win'
                  ? 'text-emerald-700'
                  : gameResult === 'lose'
                    ? 'text-rose-700'
                    : 'text-amber-700'
              }`}>
                {gameResult === 'win'
                  ? 'YUTTINGIZ'
                  : gameResult === 'lose'
                    ? "SIZ MAG'LUBIYATGA UCHRADINGIZ"
                    : "O'YIN TO'XTATILDI"}
              </h3>

              <p className="mt-2 text-base font-bold text-slate-600">
                {gameResult === 'win'
                  ? `Tabriklaymiz, ${playerName}.`
                  : gameResult === 'lose'
                    ? "Bu safar yutqazdingiz, keyingi urinishda albatta yutasiz."
                    : "Siz o'yinni vaqtida to'xtatdingiz."}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">Yutuq</p>
                  <p className="mt-1 text-lg font-black text-slate-800">{formatMoney(finalPrize)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">Bosqich</p>
                  <p className="mt-1 text-lg font-black text-slate-800">{Math.min(currentIndex + 1, totalQuestions)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">Qiyinlik</p>
                  <p className="mt-1 text-lg font-black text-slate-800">{tierLabelMap[currentTier]}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={handleBackFromModal}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5"
                >
                  Sozlamaga qaytish
                </button>
                <button
                  type="button"
                  onClick={handleReplayFromModal}
                  className={`rounded-2xl bg-gradient-to-r px-5 py-2.5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
                >
                  Yana o'ynash
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default MillionaireArena
