import { useEffect, useMemo, useState } from 'react'
import type { Category } from '../data/games.ts'
import {
  TEZKOR_HISOB_QUESTION_BANK,
  type TezkorHisobDifficulty,
} from '../data/tezkorHisobQuestions.ts'

type GameCategory = Exclude<Category, 'Hammasi'>
type InputKind = 'number' | 'text'

type ChoiceTask = {
  id: string
  type: 'choice'
  prompt: string
  options: string[]
  correctIndex: number
}

type InputTask = {
  id: string
  type: 'input'
  prompt: string
  answer: string
  inputKind: InputKind
  placeholder: string
}

type Task = ChoiceTask | InputTask

type PremiumChallengeArenaProps = {
  gameId: string
  gameTitle: string
  gameTone: string
  gameCategory: GameCategory
}

const createSeed = (value: string) =>
  Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0) + 17

const createRng = (initialSeed: number) => {
  let seed = initialSeed >>> 0
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0xffffffff
  }
}

const shuffle = <T,>(items: T[], rand: () => number) => {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

const randomInt = (rand: () => number, min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min

const normalizeText = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ')

const makeMathTasks = (gameId: string) => {
  const rand = createRng(createSeed(`math-${gameId}`))
  const ops = ['+', '-', 'x', '/'] as const
  const tasks: InputTask[] = []

  for (let i = 0; i < 8; i += 1) {
    const op = ops[i % ops.length]
    if (op === '+') {
      const a = randomInt(rand, 5, 44)
      const b = randomInt(rand, 2, 30)
      tasks.push({
        id: `m-${i}`,
        type: 'input',
        prompt: `${a} + ${b} = ?`,
        answer: String(a + b),
        inputKind: 'number',
        placeholder: "Javobni kiriting",
      })
      continue
    }

    if (op === '-') {
      const a = randomInt(rand, 20, 60)
      const b = randomInt(rand, 4, a - 2)
      tasks.push({
        id: `m-${i}`,
        type: 'input',
        prompt: `${a} - ${b} = ?`,
        answer: String(a - b),
        inputKind: 'number',
        placeholder: "Javobni kiriting",
      })
      continue
    }

    if (op === 'x') {
      const a = randomInt(rand, 2, 12)
      const b = randomInt(rand, 2, 9)
      tasks.push({
        id: `m-${i}`,
        type: 'input',
        prompt: `${a} x ${b} = ?`,
        answer: String(a * b),
        inputKind: 'number',
        placeholder: "Javobni kiriting",
      })
      continue
    }

    const divisor = randomInt(rand, 2, 10)
    const answer = randomInt(rand, 2, 12)
    const dividend = divisor * answer
    tasks.push({
      id: `m-${i}`,
      type: 'input',
      prompt: `${dividend} / ${divisor} = ?`,
      answer: String(answer),
      inputKind: 'number',
      placeholder: "Javobni kiriting",
    })
  }

  return tasks
}

const makeLanguageTasks = (gameId: string): Task[] => {
  const rand = createRng(createSeed(`lang-${gameId}`))

  const pairs = shuffle(
    [
      { uz: 'kitob', en: 'book' },
      { uz: 'qalam', en: 'pen' },
      { uz: 'maktab', en: 'school' },
      { uz: 'suv', en: 'water' },
      { uz: 'do`st', en: 'friend' },
      { uz: 'oyna', en: 'window' },
      { uz: 'gul', en: 'flower' },
      { uz: 'uy', en: 'home' },
    ],
    rand,
  )

  const choiceOne: ChoiceTask = {
    id: 'l-1',
    type: 'choice',
    prompt: `"${pairs[0].en}" so'zining o'zbekcha tarjimasi qaysi?`,
    options: shuffle([pairs[0].uz, pairs[1].uz, pairs[2].uz, pairs[3].uz], rand),
    correctIndex: 0,
  }
  choiceOne.correctIndex = choiceOne.options.indexOf(pairs[0].uz)

  const choiceTwo: ChoiceTask = {
    id: 'l-2',
    type: 'choice',
    prompt: "Qaysi so'z to'g'ri yozilgan?",
    options: shuffle(['maktab', 'maktap', 'maktabb', 'matkab'], rand),
    correctIndex: 0,
  }
  choiceTwo.correctIndex = choiceTwo.options.indexOf('maktab')

  return [
    choiceOne,
    {
      id: 'l-3',
      type: 'input',
      prompt: `"${pairs[1].en}" so'zini o'zbekchaga yozing`,
      answer: pairs[1].uz,
      inputKind: 'text',
      placeholder: "Masalan: kitob",
    },
    choiceTwo,
    {
      id: 'l-4',
      type: 'input',
      prompt: `"${pairs[2].uz}" so'zining inglizchasi nima?`,
      answer: pairs[2].en,
      inputKind: 'text',
      placeholder: "Masalan: book",
    },
    {
      id: 'l-5',
      type: 'choice',
      prompt: 'Gapni davom ettiring: Men ...ga boraman.',
      options: shuffle(['maktab', 'kitob', 'qalam', 'rang'], rand),
      correctIndex: 0,
    } as ChoiceTask,
    {
      id: 'l-6',
      type: 'input',
      prompt: "Aralash so'zni to'g'ri yozing: K I T O B",
      answer: 'kitob',
      inputKind: 'text',
      placeholder: 'Sozni yozing',
    },
    {
      id: 'l-7',
      type: 'choice',
      prompt: "Qaysi juftlik qarama-qarshi ma'noda?",
      options: shuffle(['issiq-sovuq', 'katta-ulkan', 'tez-chaqqon', 'oq-sarg`ish'], rand),
      correctIndex: 0,
    } as ChoiceTask,
    {
      id: 'l-8',
      type: 'input',
      prompt: '3 ta harfdan iborat suv so`zini yozing',
      answer: 'suv',
      inputKind: 'text',
      placeholder: 'Javob',
    },
  ] satisfies Task[]
}

const makeLogicTasks = (gameId: string) => {
  const rand = createRng(createSeed(`logic-${gameId}`))
  return [
    {
      id: 'g-1',
      type: 'choice',
      prompt: '2, 4, 6, ?',
      options: shuffle(['8', '9', '10', '7'], rand),
      correctIndex: 0,
    },
    {
      id: 'g-2',
      type: 'choice',
      prompt: '5, 10, 15, ?',
      options: shuffle(['20', '25', '18', '16'], rand),
      correctIndex: 0,
    },
    {
      id: 'g-3',
      type: 'choice',
      prompt: "Qaysi shakl ortiqcha? Doira, Doira, Uchburchak, Doira",
      options: shuffle(['Uchburchak', 'Doira', 'Barchasi bir xil', 'Topib bo`lmaydi'], rand),
      correctIndex: 0,
    },
    {
      id: 'g-4',
      type: 'choice',
      prompt: "Qaysi yo'nalish eng qisqa yo'l?",
      options: shuffle(['A', 'B', 'C', 'D'], rand),
      correctIndex: 0,
    },
    {
      id: 'g-5',
      type: 'input',
      prompt: '3 x 3 katakda nechta kichik katak bor?',
      answer: '9',
      inputKind: 'number',
      placeholder: 'Raqam',
    },
    {
      id: 'g-6',
      type: 'choice',
      prompt: "Qaysi juftlik yaqin ma'noli?",
      options: shuffle(['katta-ulkan', 'katta-kichik', 'tez-sekin', 'issiq-sovuq'], rand),
      correctIndex: 0,
    },
    {
      id: 'g-7',
      type: 'input',
      prompt: '6, 12, 24, ? ketma-ketlik davomiyligi',
      answer: '48',
      inputKind: 'number',
      placeholder: 'Raqam',
    },
    {
      id: 'g-8',
      type: 'choice',
      prompt: 'Topqirlik savoli: 1 kilogramm paxta va 1 kilogramm temir, qaysi biri og`ir?',
      options: shuffle(['Ikkalasi teng', 'Paxta', 'Temir', 'Bilinmaydi'], rand),
      correctIndex: 0,
    },
  ] satisfies Task[]
}

const makeTeamTasks = (gameId: string) => {
  const rand = createRng(createSeed(`team-${gameId}`))
  return [
    {
      id: 't-1',
      type: 'choice',
      prompt: 'Jamoaviy o`yinda birinchi qadam nima?',
      options: shuffle(['Rollarni bo`lish', 'Bahslashish', 'Kutib turish', 'O`yinni yopish'], rand),
      correctIndex: 0,
    },
    {
      id: 't-2',
      type: 'choice',
      prompt: 'Kapitan vazifasi qaysi?',
      options: shuffle(['Yakuniy javobni aytish', 'Faqat tomosha qilish', 'Hech narsa qilmaslik', 'Faqat yozish'], rand),
      correctIndex: 0,
    },
    {
      id: 't-3',
      type: 'input',
      prompt: '2 jamoa va har birida 4 o`quvchi bo`lsa jami nechta o`quvchi?',
      answer: '8',
      inputKind: 'number',
      placeholder: 'Raqam',
    },
    {
      id: 't-4',
      type: 'choice',
      prompt: "Tez javob rejimida eng muhim narsa nima?",
      options: shuffle(['Aniqlik + tezlik', 'Faqat baland ovoz', 'Faqat tez gapirish', 'Javob bermaslik'], rand),
      correctIndex: 0,
    },
    {
      id: 't-5',
      type: 'choice',
      prompt: "Raund tugaganda nima qilinadi?",
      options: shuffle(['Ballar yoziladi', 'Natija o`chiriladi', 'O`yin to`xtaydi', 'Hech narsa'], rand),
      correctIndex: 0,
    },
    {
      id: 't-6',
      type: 'input',
      prompt: '1-raundda 5 ball, 2-raundda 7 ball: jami?',
      answer: '12',
      inputKind: 'number',
      placeholder: 'Raqam',
    },
    {
      id: 't-7',
      type: 'choice',
      prompt: 'Jamoa ichida bahs chiqmasligi uchun nima kerak?',
      options: shuffle(['Aniq qoida', 'Qoidasiz o`yin', 'Faqat bitta o`quvchi', 'Shovqin'], rand),
      correctIndex: 0,
    },
    {
      id: 't-8',
      type: 'choice',
      prompt: 'Guruhli ishlashning foydasi?',
      options: shuffle(['Birga yechim topish', 'Vaqtni cho`zish', 'Ishlamaslik', 'Faqat tomosha'], rand),
      correctIndex: 0,
    },
  ] satisfies Task[]
}

const makeCreativeTasks = (gameId: string) => {
  const rand = createRng(createSeed(`creative-${gameId}`))
  return [
    {
      id: 'c-1',
      type: 'choice',
      prompt: 'Ranglar olamida qaysi juftlikdan yashil hosil bo`ladi?',
      options: shuffle(["Ko'k + sariq", "Qizil + qora", "Sariq + oq", "Ko'k + qora"], rand),
      correctIndex: 0,
    },
    {
      id: 'c-2',
      type: 'input',
      prompt: "Qisqa ijodiy topshiriq: 'gul' so'zini yozing",
      answer: 'gul',
      inputKind: 'text',
      placeholder: 'Soz',
    },
    {
      id: 'c-3',
      type: 'choice',
      prompt: 'Rasmga qarab hikoya yaratishda birinchi qadam nima?',
      options: shuffle(['Qahramon va joyni tanlash', 'Darhol yakun yozish', 'Rasmni yopish', 'Faqat rang tanlash'], rand),
      correctIndex: 0,
    },
    {
      id: 'c-4',
      type: 'choice',
      prompt: "Qaysi vosita chizishga mos?",
      options: shuffle(['Qalam', 'Kalkulyator', 'Soat', 'Qoshiq'], rand),
      correctIndex: 0,
    },
    {
      id: 'c-5',
      type: 'input',
      prompt: "Ifodali nutq uchun 1 so'z yozing: 'pauza'",
      answer: 'pauza',
      inputKind: 'text',
      placeholder: 'Javob',
    },
    {
      id: 'c-6',
      type: 'choice',
      prompt: "G'oya yaratishda nima kerak?",
      options: shuffle(['Tasavvur', 'Faqat ko`chirish', 'Hech narsa', 'Faqat kutish'], rand),
      correctIndex: 0,
    },
    {
      id: 'c-7',
      type: 'choice',
      prompt: 'Qaysi rang iliq rang hisoblanadi?',
      options: shuffle(['To`q sariq', "Ko'k", 'Moviy', 'Binafsha'], rand),
      correctIndex: 0,
    },
    {
      id: 'c-8',
      type: 'input',
      prompt: "Ranglar olami: 'oq' so'zini yozing",
      answer: 'oq',
      inputKind: 'text',
      placeholder: 'Javob',
    },
  ] satisfies Task[]
}

const makeSpeedTasks = (gameId: string) => {
  const rand = createRng(createSeed(`speed-${gameId}`))
  return [
    {
      id: 's-1',
      type: 'input',
      prompt: 'Tez hisob: 11 + 9 = ?',
      answer: '20',
      inputKind: 'number',
      placeholder: 'Raqam',
    },
    {
      id: 's-2',
      type: 'choice',
      prompt: 'Signal ko`ringanda nima qilinadi?',
      options: shuffle(['Darhol javob', 'Kutib turish', 'Savolni o`tkazish', 'Yopib qo`yish'], rand),
      correctIndex: 0,
    },
    {
      id: 's-3',
      type: 'input',
      prompt: 'Raqam ovchi: 7 x 8 = ?',
      answer: '56',
      inputKind: 'number',
      placeholder: 'Raqam',
    },
    {
      id: 's-4',
      type: 'choice',
      prompt: 'Reaksiya o`yinida asosiy mahorat?',
      options: shuffle(['Tez javob', 'Uzoq o`ylash', 'Sekin bosish', 'To`xtab turish'], rand),
      correctIndex: 0,
    },
    {
      id: 's-5',
      type: 'input',
      prompt: 'Tez saralash: 30 / 5 = ?',
      answer: '6',
      inputKind: 'number',
      placeholder: 'Raqam',
    },
    {
      id: 's-6',
      type: 'choice',
      prompt: 'Vaqt rejimida nima kuzatiladi?',
      options: shuffle(['Sekundlar', 'Ranglar', 'Ismlar', 'Sana'], rand),
      correctIndex: 0,
    },
    {
      id: 's-7',
      type: 'input',
      prompt: 'Tez kim: 45 - 18 = ?',
      answer: '27',
      inputKind: 'number',
      placeholder: 'Raqam',
    },
    {
      id: 's-8',
      type: 'choice',
      prompt: "Poygada kim yutadi?",
      options: shuffle(["To'g'ri va tez javob bergan", 'Eng baland gapirgan', 'Javob bermagan', 'Eng sekin harakat qilgan'], rand),
      correctIndex: 0,
    },
  ] satisfies Task[]
}

const getTasksByCategory = (category: GameCategory, gameId: string): Task[] => {
  if (category === 'Matematika') return makeMathTasks(gameId)
  if (category === 'Tillar') return makeLanguageTasks(gameId)
  if (category === 'Mantiq') return makeLogicTasks(gameId)
  if (category === 'Jamoaviy') return makeTeamTasks(gameId)
  if (category === 'Ijodiy') return makeCreativeTasks(gameId)
  return makeSpeedTasks(gameId)
}

const getMissionLabel = (gameId: string) => {
  const map: Record<string, string> = {
    'baraban-metodi': 'Tez tanlov va jamoaviy faollik',
    'inglizcha-soz': 'Lug`atni tez mustahkamlash',
    'tezkor-hisob': 'Hisob tezligini oshirish',
    'jumla-ustasi': 'Til va jumla tuzish mahorati',
    'ranglar-olami': 'Rang va shakl dunyosini ochish',
    'xotira-zanjiri': 'Xotira ketma-ketligini ushlash',
    'car-racing-math': 'Misol bilan tezkor poyga',
    'topqirlik-kvest': 'Bosqichli topqirlik sarguzashti',
  }
  return map[gameId] ?? 'Interaktiv bellashuv arenasi'
}

function PremiumChallengeArena({
  gameId,
  gameTitle,
  gameTone,
  gameCategory,
}: PremiumChallengeArenaProps) {
  const isTezkorHisob = gameId === 'tezkor-hisob'
  const [tezkorDifficulty, setTezkorDifficulty] = useState<TezkorHisobDifficulty>("O'rta")
  const tasks = useMemo(
    () =>
      isTezkorHisob
        ? TEZKOR_HISOB_QUESTION_BANK[tezkorDifficulty]
        : getTasksByCategory(gameCategory, gameId),
    [gameCategory, gameId, isTezkorHisob, tezkorDifficulty],
  )

  const questionSeconds = isTezkorHisob ? 30 : gameCategory === 'Tezkor' ? 15 : gameCategory === 'Matematika' ? 20 : 24

  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(questionSeconds)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [locked, setLocked] = useState(false)
  const [awaitingNext, setAwaitingNext] = useState(false)
  const [feedback, setFeedback] = useState('Boshlash tugmasini bosing.')
  const [history, setHistory] = useState<string[]>([])

  const currentTask = tasks[currentIndex]
  const progressPercent = Math.round((currentIndex / tasks.length) * 100)

  const resetQuestionUi = () => {
    setSelectedOption(null)
    setInputValue('')
    setLocked(false)
    setAwaitingNext(false)
    setTimeLeft(questionSeconds)
  }

  useEffect(() => {
    if (!isTezkorHisob) return
    setStarted(false)
    setFinished(false)
    setCurrentIndex(0)
    setTimeLeft(questionSeconds)
    setScore(0)
    setCombo(0)
    setBestCombo(0)
    setSelectedOption(null)
    setInputValue('')
    setLocked(false)
    setAwaitingNext(false)
    setHistory([])
    setFeedback(`${tezkorDifficulty} daraja tanlandi. Boshlash tugmasini bosing.`)
  }, [isTezkorHisob, tezkorDifficulty, questionSeconds])

  const startGame = () => {
    setStarted(true)
    setFinished(false)
    setCurrentIndex(0)
    setScore(0)
    setCombo(0)
    setBestCombo(0)
    setHistory([])
    resetQuestionUi()
    setFeedback('Birinchi bellashuv boshlandi.')
  }

  const processResult = (correct: boolean, label: string) => {
    setLocked(true)
    setAwaitingNext(true)

    if (correct) {
      const nextCombo = combo + 1
      const points = 22 + nextCombo * 4
      setCombo(nextCombo)
      setBestCombo((prev) => (nextCombo > prev ? nextCombo : prev))
      setScore((prev) => prev + points)
      setFeedback(`To'g'ri javob. +${points} ball`)
      setHistory((prev) => [`${label}: +${points}`, ...prev].slice(0, 6))
    } else {
      setCombo(0)
      setFeedback('Xato javob.')
      setHistory((prev) => [`${label}: xato`, ...prev].slice(0, 6))
    }

    if (currentIndex >= tasks.length - 1) {
      setFinished(true)
      setAwaitingNext(false)
      setFeedback(correct ? 'Challenge yakunlandi. Zo`r natija!' : "Challenge yakunlandi.")
    }
  }

  const handleChoice = (optionIndex: number) => {
    if (!started || finished || locked || currentTask.type !== 'choice') return
    setSelectedOption(optionIndex)
    processResult(optionIndex === currentTask.correctIndex, gameTitle)
  }

  const handleInputSubmit = () => {
    if (!started || finished || locked || currentTask.type !== 'input') return
    if (!inputValue.trim()) {
      setFeedback("Avval javob kiriting.")
      return
    }

    const correct =
      currentTask.inputKind === 'number'
        ? inputValue.trim() === currentTask.answer
        : normalizeText(inputValue) === normalizeText(currentTask.answer)
    processResult(correct, gameTitle)
  }

  const handleNext = () => {
    if (!awaitingNext || finished) return
    const next = currentIndex + 1
    setCurrentIndex(next)
    resetQuestionUi()
    setFeedback(`${next + 1}-bellashuvga o'tildi.`)
  }

  const handleInputPad = (action: string) => {
    if (currentTask.type !== 'input' || currentTask.inputKind !== 'number' || locked || finished) {
      return
    }
    if (action === 'C') {
      setInputValue('')
      return
    }
    if (action === '<') {
      setInputValue((prev) => prev.slice(0, -1))
      return
    }
    setInputValue((prev) => `${prev}${action}`.slice(0, 4))
  }

  useEffect(() => {
    if (!started || finished || locked) return
    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [started, finished, locked, currentIndex, questionSeconds])

  useEffect(() => {
    if (!started || finished || locked) return
    if (timeLeft > 0) return
    processResult(false, gameTitle)
  }, [timeLeft, started, finished, locked])

  return (
    <section className="glass-card arena-3d-shell p-6 sm:p-7" data-aos="fade-up" data-aos-delay="90">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-700">
            Haqiqiy bellashuv arenasi
          </p>
          <h2 className="mt-3 font-kid text-4xl text-slate-900 sm:text-5xl">{gameTitle}</h2>
          <p className="mt-2 text-base font-bold text-slate-600">{getMissionLabel(gameId)}</p>
        </div>

        <button
          type="button"
          onClick={startGame}
          className={`arena-3d-press rounded-2xl bg-gradient-to-r px-6 py-3 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
        >
          {started ? 'Qaytadan boshlash' : 'Boshlash'}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Bellashuv</p>
          <p className="mt-1 font-kid text-4xl text-slate-900">{started ? currentIndex + 1 : 0}/{tasks.length}</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Vaqt</p>
          <p className="mt-1 font-kid text-4xl text-slate-900">{started && !finished ? `${timeLeft}s` : '--'}</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Kombinatsiya</p>
          <p className="mt-1 font-kid text-4xl text-slate-900">{combo}</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Hisob</p>
          <p className="mt-1 font-kid text-4xl text-slate-900">{score}</p>
        </div>
      </div>

      {isTezkorHisob ? (
        <div className="arena-3d-panel mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Tezkor hisob darajasi</p>
              <p className="mt-1 text-sm font-bold text-slate-600">
                Siz bergan 30 tadan savol banki: qo'shish, ayirish, ko'paytirish.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['Oson', "O'rta", 'Qiyin'] as TezkorHisobDifficulty[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setTezkorDifficulty(level)}
                  className={`arena-3d-press rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] transition ${
                    tezkorDifficulty === level
                      ? `bg-gradient-to-r text-white shadow-soft ${gameTone}`
                      : 'border border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="arena-3d-panel mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
          <span>Jarayon</span>
          <span>{finished ? 100 : progressPercent}%</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gameTone}`}
            style={{ width: `${finished ? 100 : progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <article className="arena-3d-panel rounded-3xl border border-slate-200 bg-white p-5">
          {!started ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-lg font-bold text-slate-600">Boshlash tugmasi bosilgach interaktiv topshiriqlar chiqadi.</p>
            </div>
          ) : (
            <>
              <div className={`rounded-2xl bg-gradient-to-r p-5 text-white ${gameTone}`}>
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-white/80">
                  {currentTask.type === 'input' ? 'Kiritish bellashuvi' : 'Tanlov bellashuvi'}
                </p>
                <p className="mt-2 font-kid text-4xl leading-tight">{currentTask.prompt}</p>
              </div>

              {currentTask.type === 'choice' ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {currentTask.options.map((option, index) => {
                    const isCorrect = index === currentTask.correctIndex
                    const isSelected = selectedOption === index
                    const mark = String.fromCharCode(65 + index)

                    const toneClass = !locked
                      ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300'
                      : isCorrect
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : isSelected
                          ? 'border-rose-300 bg-rose-50 text-rose-800'
                          : 'border-slate-200 bg-slate-100 text-slate-500'

                    return (
                      <button
                        key={`${currentTask.id}-${index}`}
                        type="button"
                        onClick={() => handleChoice(index)}
                        disabled={locked || finished}
                        className={`arena-3d-press flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-base font-extrabold transition ${toneClass}`}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-black text-slate-700">
                          {mark}
                        </span>
                        <span>{option}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={locked || finished}
                      inputMode={currentTask.inputKind === 'number' ? 'numeric' : 'text'}
                      className="w-full border-none bg-transparent text-2xl font-extrabold text-slate-800 outline-none"
                      placeholder={currentTask.placeholder}
                    />
                  </div>

                  {currentTask.inputKind === 'number' ? (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '<'].map((item) => (
                        <button
                          key={`pad-${item}`}
                          type="button"
                          onClick={() => handleInputPad(item)}
                          disabled={locked || finished}
                          className="arena-3d-press rounded-xl border border-slate-200 bg-white px-3 py-3 text-lg font-extrabold text-slate-700 transition hover:-translate-y-0.5"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleInputSubmit}
                    disabled={locked || finished}
                    className={`arena-3d-press mt-3 rounded-xl bg-gradient-to-r px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 ${gameTone}`}
                  >
                    Javobni tasdiqlash
                  </button>
                </div>
              )}

              {awaitingNext && !finished ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="arena-3d-press mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-slate-800"
                >
                  Keyingi bellashuv
                </button>
              ) : null}
            </>
          )}

          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-extrabold ${
            finished ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
          }`}>
            {feedback}
          </div>
        </article>

        <article className="arena-3d-panel rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Challenge ro`yxati</p>
          <div className={`mt-3 space-y-2 ${isTezkorHisob ? 'max-h-[24rem] overflow-auto pr-1' : ''}`}>
            {tasks.map((task, index) => {
              const isCurrent = started && !finished && currentIndex === index
              const isPassed = index < currentIndex
              return (
                <div
                  key={task.id}
                  className={`arena-3d-card rounded-xl border px-3 py-2 text-sm font-extrabold ${
                    isCurrent
                      ? `border-transparent bg-gradient-to-r text-white ${gameTone}`
                      : isPassed
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {index + 1}. {isTezkorHisob && task.type === 'choice' && 'topic' in task ? `${task.topic} misol` : task.type === 'input' ? 'Input task' : 'Choice task'}
                </div>
              )
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="arena-3d-card rounded-xl border border-slate-200 bg-white px-3 py-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">Best combo</p>
              <p className="mt-1 font-kid text-4xl text-slate-900">{bestCombo}</p>
            </div>
            <div className="arena-3d-card rounded-xl border border-slate-200 bg-white px-3 py-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">Natija</p>
              <p className="mt-1 font-kid text-4xl text-slate-900">{score}</p>
            </div>
          </div>

          <div className="arena-3d-panel mt-4 rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Oxirgi harakatlar</p>
            <div className="mt-2 space-y-2">
              {history.length === 0 ? (
                <p className="text-sm font-bold text-slate-500">Hali natija yo`q.</p>
              ) : (
                history.map((item, idx) => (
                  <p key={`${item}-${idx}`} className="arena-3d-card rounded-xl bg-slate-50 px-3 py-2 text-sm font-extrabold text-slate-700">
                    {item}
                  </p>
                ))
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

export default PremiumChallengeArena
