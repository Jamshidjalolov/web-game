import barabanImage from '../assets/games/baraban.svg'
import arqonImage from '../rasm/tortish.png'
import sozQidiruvImage from '../assets/games/soz-qidiruv.svg'
import millionerImage from '../assets/games/millioner.svg'
import inglizchaImage from '../assets/games/inglizcha.svg'
import puzzleMozaikaImage from '../assets/games/puzzle-mozaika-cover.svg'
import bayroqTopishImage from '../assets/games/bayroq-topish-cover.svg'
import tezkorHisobImage from '../assets/games/tezkor-hisob-cover.svg'
import jumlaUstasiImage from '../assets/games/jumla-ustasi-cover.svg'
import ranglarOlamiImage from '../assets/games/ranglar-olami-cover.svg'
import xotiraZanjiriImage from '../assets/games/xotira-zanjiri-cover.svg'
import carRacingMathImage from '../assets/games/car-racing-math-cover.svg'
import quizBattleImage from '../assets/games/quiz-battle-cover.svg'
import topqirlikKvestImage from '../assets/games/topqirlik-kvest-cover.svg'
import oneQuestionHundredAnswersImage from '../assets/games/one-question-100-answers-cover.svg'
import fakeOrFactProImage from '../assets/games/fake-or-fact-pro-cover.svg'
import rasmliMantiqImage from '../assets/games/rasmli-mantiq-cover.svg'
import jumanjiImage from '../rasm/jumanji.jpg'
import mathBoxImage from '../rasm/math box.png'

export type Category =
  | 'Hammasi'
  | 'Matematika'
  | 'Tillar'
  | 'Mantiq'
  | 'Jamoaviy'
  | 'Ijodiy'
  | 'Tezkor'

export type GameItem = {
  id: string
  title: string
  desc: string
  players: string
  level: string
  duration: string
  category: Exclude<Category, 'Hammasi'>
  image: string
  tone: string
}

export type BackendGameItem = {
  id: string
  title: string
  desc: string
  players: string
  level: string
  duration: string
  category: string
  tone: string
}

export const gameCategories: Category[] = [
  'Hammasi',
  'Matematika',
  'Tillar',
  'Mantiq',
  'Jamoaviy',
  'Ijodiy',
  'Tezkor',
]

const staticGames: GameItem[] = [
  {
    id: 'baraban-metodi',
    title: 'Baraban metodi',
    desc: "Tasodifiy tanlov orqali sinfda faollikni oshiradigan o'yin.",
    players: '1.2k+',
    level: 'Oddiy',
    duration: '5 daqiqa',
    category: 'Jamoaviy',
    image: barabanImage,
    tone: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'arqon-tortish',
    title: "Arqon tortish o'yini",
    desc: "Jamoaviy hamkorlik va tez qaror qilishni kuchaytiradi.",
    players: '1.4k+',
    level: "O'rta",
    duration: '8 daqiqa',
    category: 'Jamoaviy',
    image: arqonImage,
    tone: 'from-orange-500 to-amber-500',
  },
  {
    id: 'soz-qidiruv',
    title: "So'z qidiruv o'yini",
    desc: "Harflar ichidan yashirilgan so'zlarni topish topshirig'i.",
    players: '1.7k+',
    level: 'Murakkab',
    duration: '10 daqiqa',
    category: 'Tillar',
    image: sozQidiruvImage,
    tone: 'from-emerald-500 to-lime-500',
  },
  {
    id: 'millioner',
    title: 'Millioner viktorina',
    desc: "2 jamoa bir xil savolda bellashadi: birinchi to'g'ri topgan ko'proq ball oladi.",
    players: '1.1k+',
    level: "O'rta",
    duration: '12 daqiqa',
    category: 'Jamoaviy',
    image: millionerImage,
    tone: 'from-indigo-500 to-violet-500',
  },
  {
    id: 'puzzle-mozaika',
    title: 'Puzzle mozaika',
    desc: "Rasm bo'laklarini to'g'ri joylab mantiq va diqqatni rivojlantiring.",
    players: '1.0k+',
    level: "O'rta",
    duration: '7 daqiqa',
    category: 'Mantiq',
    image: puzzleMozaikaImage,
    tone: 'from-sky-500 to-indigo-500',
  },
  {
    id: 'visual-brain-teasers',
    title: 'Rasmli mantiq',
    desc: "Rasmga qarab yechiladigan mantiq savollari: yakka yoki duel formatda o'ynaladi.",
    players: '1-2 jamoa',
    level: "O'rta",
    duration: '8 daqiqa',
    category: 'Mantiq',
    image: rasmliMantiqImage,
    tone: 'from-cyan-500 via-sky-500 to-indigo-500',
  },
  {
    id: 'inglizcha-soz',
    title: "Inglizcha so'z o'yini",
    desc: "Yangi so'zlarni rasm bilan bog'lab tez yod olish usuli.",
    players: '1.9k+',
    level: "O'rta",
    duration: '9 daqiqa',
    category: 'Tillar',
    image: inglizchaImage,
    tone: 'from-rose-500 to-pink-500',
  },
  {
    id: 'bayroq-topish',
    title: "Bayroq topish o'yini",
    desc: "Bayroqni ko'rib to'g'ri davlat nomini topadigan jamoaviy viktorina.",
    players: '1.2k+',
    level: "O'rta",
    duration: '8 daqiqa',
    category: 'Jamoaviy',
    image: bayroqTopishImage,
    tone: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'tezkor-hisob',
    title: 'Tezkor hisob',
    desc: 'Qisqa vaqtda misollarni yechib hisoblash tezligini oshiring.',
    players: '1.3k+',
    level: "O'rta",
    duration: '6 daqiqa',
    category: 'Matematika',
    image: tezkorHisobImage,
    tone: 'from-sky-500 to-indigo-500',
  },
  {
    id: 'jumla-ustasi',
    title: 'Jumla ustasi',
    desc: "Aralash so'zlarni to'g'ri tartiblab jumla hosil qiling.",
    players: '1.1k+',
    level: "O'rta",
    duration: '8 daqiqa',
    category: 'Tillar',
    image: jumlaUstasiImage,
    tone: 'from-purple-500 to-fuchsia-500',
  },
  {
    id: 'ranglar-olami',
    title: 'Ranglar olami',
    desc: "Rang va shakllarni tanish bo'yicha qiziqarli mini-topshiriq.",
    players: '940+',
    level: 'Oddiy',
    duration: '6 daqiqa',
    category: 'Ijodiy',
    image: ranglarOlamiImage,
    tone: 'from-amber-500 to-orange-500',
  },
  {
    id: 'xotira-zanjiri',
    title: 'Xotira zanjiri',
    desc: "Ketma-ketlikni eslab qolish orqali e'tiborni kuchaytiring.",
    players: '1.0k+',
    level: "O'rta",
    duration: '7 daqiqa',
    category: 'Mantiq',
    image: xotiraZanjiriImage,
    tone: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'box-jang',
    title: 'Math Box jang',
    desc: "Kim tez va to'g'ri topsa, o'sha birinchi zarba beradigan matematik duel.",
    players: '1.0k+',
    level: "O'rta",
    duration: '8 daqiqa',
    category: 'Matematika',
    image: mathBoxImage,
    tone: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'car-racing-math',
    title: 'Car Racing Math',
    desc: "Misolni kim tez va to'g'ri topsa, o'sha mashinasi oldinga yuradigan poyga.",
    players: '920+',
    level: "O'rta",
    duration: '9 daqiqa',
    category: 'Matematika',
    image: carRacingMathImage,
    tone: 'from-sky-500 to-blue-600',
  },
  {
    id: 'jumanji',
    title: 'Jumanji board quest',
    desc: "Savolga javob berib zar tashlang va 30 qadamli taxtada finishga birinchi yeting.",
    players: '860+',
    level: "O'rta",
    duration: '10 daqiqa',
    category: 'Jamoaviy',
    image: jumanjiImage,
    tone: 'from-emerald-600 to-amber-600',
  },
  {
    id: 'quiz-battle',
    title: 'Quiz Battle',
    desc: 'Bamboozle uslubida 2-3 jamoali viktorina: kartalar, random eventlar va jonli scoreboard.',
    players: '1.5k+',
    level: "O'rta",
    duration: '10 daqiqa',
    category: 'Jamoaviy',
    image: quizBattleImage,
    tone: 'from-cyan-500 to-indigo-500',
  },
  {
    id: 'tezkor-guruh',
    title: 'Tezkor guruh',
    desc: "Jamoaviy tezkor savol-javob: kim birinchi to‘g‘ri javob bersa ball oladi.",
    players: '1.2k+',
    level: "O'rta",
    duration: '8 daqiqa',
    category: 'Jamoaviy',
    image: quizBattleImage,
    tone: 'from-pink-500 to-fuchsia-500',
  },
  {
    id: 'one-question-100-answers',
    title: '1 Savol - 100 Javob',
    desc: 'Battle Royale Team Edition: 50+ o`yinchi, ko`p javobli savollar, unique scoring va elimination.',
    players: '2.2k+',
    level: 'Murakkab',
    duration: '15 daqiqa',
    category: 'Jamoaviy',
    image: oneQuestionHundredAnswersImage,
    tone: 'from-cyan-500 via-sky-500 to-fuchsia-500',
  },
  {
    id: 'fake-or-fact-pro',
    title: 'FAKE or FACT PRO',
    desc: "FAKT yoki FEYKni topishga asoslangan premium mediasavod va mantiq bellashuvi.",
    players: '2 jamoa',
    level: "O'rta",
    duration: '10 daqiqa',
    category: 'Mantiq',
    image: fakeOrFactProImage,
    tone: 'from-cyan-500 via-sky-500 to-fuchsia-500',
  },
  {
    id: 'topqirlik-kvest',
    title: 'Topqirlik kvesti',
    desc: 'Ketma-ket jumboqlar bilan kichik sarguzasht rejimi.',
    players: '870+',
    level: 'Murakkab',
    duration: '12 daqiqa',
    category: 'Ijodiy',
    image: topqirlikKvestImage,
    tone: 'from-fuchsia-500 to-indigo-500',
  },
]

const defaultTone = 'from-cyan-500 to-blue-500'
const defaultCategory: Exclude<Category, 'Hammasi'> = 'Jamoaviy'
const backendGamesCacheKey = 'game_web_games_catalog_v1'
const validCategory = new Set<Exclude<Category, 'Hammasi'>>([
  'Matematika',
  'Tillar',
  'Mantiq',
  'Jamoaviy',
  'Ijodiy',
  'Tezkor',
])

const normalizeCategory = (value: string): Exclude<Category, 'Hammasi'> => {
  return validCategory.has(value as Exclude<Category, 'Hammasi'>)
    ? (value as Exclude<Category, 'Hammasi'>)
    : defaultCategory
}

export const mergeGamesWithBackend = (backendGames: BackendGameItem[]): GameItem[] => {
  const staticById = new Map(staticGames.map((game) => [game.id, game]))
  const remoteById = new Map(backendGames.map((game) => [game.id, game]))

  const mergedStatic = staticGames.map((game) => {
    const remote = remoteById.get(game.id)
    if (!remote) return game

    return {
      id: game.id,
      title: remote.title || game.title,
      desc: remote.desc || game.desc,
      players: remote.players || game.players,
      level: remote.level || game.level,
      duration: remote.duration || game.duration,
      category: normalizeCategory(remote.category || game.category),
      image: game.image,
      tone: remote.tone || game.tone,
    } satisfies GameItem
  })

  const backendOnly = backendGames
    .filter((item) => !staticById.has(item.id))
    .map((item) => ({
      id: item.id,
      title: item.title || item.id,
      desc: item.desc || '',
      players: item.players || '-',
      level: item.level || "O'rta",
      duration: item.duration || '-',
      category: normalizeCategory(item.category || defaultCategory),
      image: staticGames[0].image,
      tone: item.tone || defaultTone,
    } satisfies GameItem))

  return [...mergedStatic, ...backendOnly].filter((game) => Boolean(game.id))
}

const loadCachedBackendGames = (): BackendGameItem[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(backendGamesCacheKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BackendGameItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const initialCatalog = (() => {
  const merged = mergeGamesWithBackend(loadCachedBackendGames())
  return merged.length > 0 ? merged : staticGames
})()

export let games: GameItem[] = initialCatalog

export const setGamesFromBackend = (backendGames: BackendGameItem[]): GameItem[] => {
  const merged = mergeGamesWithBackend(backendGames)
  if (merged.length === 0) return games

  games = merged
  if (typeof window !== 'undefined') {
    localStorage.setItem(backendGamesCacheKey, JSON.stringify(backendGames))
  }
  return games
}

export const findGameById = (gameId: string) => games.find((game) => game.id === gameId)
