import { useEffect, useMemo, useRef, useState } from 'react'
import ConfettiOverlay from './ConfettiOverlay'
import jumanjiBoardBg from '../rasm/jumanji2.png'

type Side = 'left' | 'right'
type Winner = Side | 'draw'
type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type TeamResult = 'idle' | 'correct' | 'wrong' | 'timeout' | 'lost'

export type TeacherJumanjiQuestion = {
  difficulty: Difficulty
  prompt: string
  options: [string, string, string, string]
  correctIndex: number
  hint?: string
}

type JumanjiQuestion = TeacherJumanjiQuestion & { id: string }

type TeamState = {
  position: number
  score: number
  correct: number
  rolls: number
  lastRoll: number | null
  selected: number | null
  locked: boolean
  result: TeamResult
}

type Props = {
  gameTitle: string
  gameTone: string
  leftTeamName?: string
  rightTeamName?: string
  initialDifficulty?: Difficulty
  teacherQuestions?: TeacherJumanjiQuestion[]
  setupPath?: string
}

type SpecialTile = { delta: number; title: string; tone: 'emerald' | 'rose' | 'amber' }
type DiceSpin = { rx: number; ry: number; rz: number; durationMs: number }

const makeDiceSpin = (): DiceSpin => ({
  rx: 840 + Math.floor(Math.random() * 1080),
  ry: 980 + Math.floor(Math.random() * 1320),
  rz: 240 + Math.floor(Math.random() * 720),
  durationMs: 1700 + Math.floor(Math.random() * 850),
})

const TOTAL_STEPS = 30
const START_COORDS: Record<Side, { x: number; y: number }> = {
  left: { x: 28.6, y: 85.4 },
  right: { x: 28.6, y: 85.4 },
}
const SHARED_PATH_START = { x: 24.8, y: 80.8 }
const ROAD_SAFE_PAD = 11.2

const BOARD_PLAYFIELD = { left: 5.5, top: 8, width: 89, height: 82 } as const
const BOARD_TRACK_Y_MIN = 8
const BOARD_TRACK_Y_MAX = 92
const clamp01Pct = (v: number) => Math.max(0, Math.min(100, v))
const toPlayfieldCoord = (p: { x: number; y: number }) => ({
  x: clamp01Pct(((p.x - BOARD_PLAYFIELD.left) / BOARD_PLAYFIELD.width) * 100),
  y:
    BOARD_TRACK_Y_MIN +
    (clamp01Pct(((p.y - BOARD_PLAYFIELD.top) / BOARD_PLAYFIELD.height) * 100) / 100) * (BOARD_TRACK_Y_MAX - BOARD_TRACK_Y_MIN),
})
const keepInsideBoard = (p: { x: number; y: number }, pad = 4.6) => ({
  x: Math.max(pad, Math.min(100 - pad, p.x)),
  y: Math.max(pad, Math.min(100 - pad, p.y)),
})

const CFG: Record<Difficulty, { seconds: number; points: number; autoNextMs: number }> = {
  Oson: { seconds: 22, points: 14, autoNextMs: 1800 },
  "O'rta": { seconds: 18, points: 18, autoNextMs: 1950 },
  Qiyin: { seconds: 14, points: 24, autoNextMs: 2100 },
}

const SPECIALS: Record<number, SpecialTile> = {
  5: { delta: 2, title: 'Liana +2', tone: 'emerald' },
  11: { delta: -1, title: 'Tuman -1', tone: 'amber' },
  18: { delta: 2, title: 'Sirli yo‘lak +2', tone: 'emerald' },
  24: { delta: -2, title: 'Botqoq -2', tone: 'rose' },
}

const WHISPERS = [
  'Jumanji uyg‘ondi. Savolni diqqat bilan o‘qing.',
  'Zar taqdiri sizni oldinga yoki ortga olib boradi.',
  'Jungle yo‘li xavfli, lekin topqir jamoa o‘tadi.',
]

const RIDDLE_BANK: Record<Difficulty, Omit<JumanjiQuestion, 'id'>[]> = {
  Oson: [
    { difficulty: 'Oson', prompt: '2 + 3 = ?', options: ['4', '5', '6', '7'], correctIndex: 1 },
    { difficulty: 'Oson', prompt: 'Qaysi hayvon suvda yashaydi?', options: ['Baliq', 'Mushuk', 'It', 'Qo‘y'], correctIndex: 0 },
    { difficulty: 'Oson', prompt: 'Bir haftada nechta kun bor?', options: ['5', '6', '7', '8'], correctIndex: 2 },
    { difficulty: 'Oson', prompt: '3 x 2 = ?', options: ['5', '6', '7', '8'], correctIndex: 1 },
    { difficulty: 'Oson', prompt: 'Qaysi faslda qor yog‘adi?', options: ['Bahor', 'Yoz', 'Kuz', 'Qish'], correctIndex: 3 },
    { difficulty: 'Oson', prompt: '10 dan keyin qaysi son keladi?', options: ['9', '11', '12', '13'], correctIndex: 1 },
  ],
  "O'rta": [
    { difficulty: "O'rta", prompt: 'Qaysi oy 28 kundan iborat?', options: ['Fevral', 'Mart', 'Yanvar', 'Barchasi'], correctIndex: 3 },
    { difficulty: "O'rta", prompt: '1 kg temir va 1 kg paxta — qaysi og‘ir?', options: ['Temir', 'Paxta', 'Teng', 'Bilmayman'], correctIndex: 2 },
    { difficulty: "O'rta", prompt: '23 + 19 = ?', options: ['41', '42', '43', '44'], correctIndex: 1 },
    { difficulty: "O'rta", prompt: '72 - 35 = ?', options: ['36', '37', '38', '39'], correctIndex: 1 },
    { difficulty: "O'rta", prompt: '25 / 5 = ?', options: ['4', '5', '6', '7'], correctIndex: 1 },
    { difficulty: "O'rta", prompt: 'Ketma-ketlik: 1,4,9,16, ?', options: ['20', '24', '25', '36'], correctIndex: 2 },
  ],
  Qiyin: [
    { difficulty: 'Qiyin', prompt: 'Bir stolning 4 burchagi bor. 1 burchagi kesilsa nechta qoladi?', options: ['3', '4', '5', '6'], correctIndex: 2 },
    { difficulty: 'Qiyin', prompt: '234 + 567 = ?', options: ['800', '801', '802', '803'], correctIndex: 1 },
    { difficulty: 'Qiyin', prompt: '845 - 367 = ?', options: ['477', '478', '479', '480'], correctIndex: 1 },
    { difficulty: 'Qiyin', prompt: '23 x 17 = ?', options: ['390', '391', '392', '393'], correctIndex: 1 },
    { difficulty: 'Qiyin', prompt: '2, 6, 12, 20, 30, ?', options: ['36', '40', '42', '48'], correctIndex: 2 },
    { difficulty: 'Qiyin', prompt: '10 metr quduq: har kuni 3m chiqib, 2m tushsa necha kunda chiqadi?', options: ['7', '8', '9', '10'], correctIndex: 1 },
  ],
}

const makeTeam = (): TeamState => ({
  position: 0,
  score: 0,
  correct: 0,
  rolls: 0,
  lastRoll: null,
  selected: null,
  locked: false,
  result: 'idle',
})

const resetRound = (team: TeamState): TeamState => ({ ...team, selected: null, locked: false, result: 'idle' })

const shuffle = <T,>(arr: T[]) => {
  const next = [...arr]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

const normalize = (v: string) => v.toLowerCase().trim().replace(/[К»вЂ™`]/g, "'").replace(/\s+/g, ' ')

const shuffleQuestionOptions = (q: JumanjiQuestion): JumanjiQuestion => {
  const correct = q.options[q.correctIndex]
  const options = shuffle([...q.options]) as [string, string, string, string]
  return { ...q, options, correctIndex: options.indexOf(correct) }
}

const buildMathQuestion = (difficulty: Difficulty, index: number): JumanjiQuestion => {
  const max = difficulty === 'Oson' ? 20 : difficulty === "O'rta" ? 70 : 250
  const ops = difficulty === 'Oson' ? ['+', '-', '*'] : ['+', '-', '*', '/']
  const op = ops[index % ops.length]
  let a = 0
  let b = 0
  let correct = 0
  if (op === '+') {
    a = 3 + Math.floor(Math.random() * max)
    b = 2 + Math.floor(Math.random() * max)
    correct = a + b
  } else if (op === '-') {
    a = 8 + Math.floor(Math.random() * max)
    b = 2 + Math.floor(Math.random() * Math.max(4, Math.floor(max * 0.7)))
    if (b > a) [a, b] = [b, a]
    correct = a - b
  } else if (op === '*') {
    a = 2 + Math.floor(Math.random() * (difficulty === 'Qiyin' ? 20 : difficulty === "O'rta" ? 13 : 8))
    b = 2 + Math.floor(Math.random() * (difficulty === 'Qiyin' ? 15 : difficulty === "O'rta" ? 10 : 6))
    correct = a * b
  } else {
    b = 2 + Math.floor(Math.random() * (difficulty === 'Qiyin' ? 12 : 8))
    correct = 2 + Math.floor(Math.random() * (difficulty === 'Qiyin' ? 20 : 12))
    a = b * correct
  }
  const wrongs = new Set<number>()
  while (wrongs.size < 3) {
    const drift = (Math.floor(Math.random() * 9) + 1) * (Math.random() > 0.5 ? 1 : -1)
    const candidate = Math.max(0, correct + drift)
    if (candidate !== correct) wrongs.add(candidate)
  }
  const options = shuffle([String(correct), ...Array.from(wrongs).map(String)]) as [string, string, string, string]
  return {
    id: `auto-${difficulty}-${index}`,
    difficulty,
    prompt: `${a} ${op === '*' ? 'x' : op} ${b} = ?`,
    options,
    correctIndex: options.indexOf(String(correct)),
  }
}

const buildDeck = (difficulty: Difficulty, teacherQuestions: TeacherJumanjiQuestion[]) => {
  const map = new Map<string, JumanjiQuestion>()
  teacherQuestions
    .filter((q) => q.difficulty === difficulty)
    .forEach((q, index) => {
      const id = `teacher-${difficulty}-${index}`
      const item: JumanjiQuestion = {
        id,
        difficulty: q.difficulty,
        prompt: q.prompt.trim(),
        options: [...q.options] as [string, string, string, string],
        correctIndex: q.correctIndex,
        hint: q.hint?.trim() || undefined,
      }
      if (item.prompt && item.options.every(Boolean)) map.set(normalize(item.prompt), item)
    })
  RIDDLE_BANK[difficulty].forEach((q, index) => {
    map.set(normalize(q.prompt), { ...q, id: `bank-${difficulty}-${index}` })
  })
  const base = shuffle(Array.from(map.values()).map(shuffleQuestionOptions))
  const deck: JumanjiQuestion[] = [...base]
  for (let i = 0; i < 90; i += 1) deck.push(buildMathQuestion(difficulty, i))
  return shuffle(deck).map((q, i) => ({ ...q, id: `${q.id}-${i}` }))
}

const stepLayout = Array.from({ length: TOTAL_STEPS }, (_, i) => ({ step: i + 1 }))
const BRANCH_MERGE_STEP = 1

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const samplePolyline = (anchors: Array<{ x: number; y: number }>, count: number): Array<{ x: number; y: number }> => {
  if (count <= 0 || anchors.length === 0) return []
  if (count === 1) return [keepInsideBoard(anchors[0], ROAD_SAFE_PAD)]

  const segments: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; start: number; len: number }> = []
  let totalLength = 0
  for (let i = 0; i < anchors.length - 1; i += 1) {
    const from = anchors[i]
    const to = anchors[i + 1]
    const len = Math.hypot(to.x - from.x, to.y - from.y)
    segments.push({ from, to, start: totalLength, len })
    totalLength += len
  }

  if (totalLength <= 0.001) return Array.from({ length: count }, () => keepInsideBoard(anchors[0], ROAD_SAFE_PAD))

  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0 : index / (count - 1)
    const target = totalLength * t
    const segment = segments.find((seg) => target <= seg.start + seg.len) ?? segments[segments.length - 1]
    const local = segment.len <= 0.0001 ? 0 : (target - segment.start) / segment.len
    return keepInsideBoard(
      {
        x: lerp(segment.from.x, segment.to.x, local),
        y: lerp(segment.from.y, segment.to.y, local),
      },
      ROAD_SAFE_PAD,
    )
  })
}

const JUMANJI_LEFT_BRANCH_ANCHORS: Array<{ x: number; y: number }> = [
  START_COORDS.left,
  { x: 49.4, y: 93.4 },
  { x: 48.9, y: 91.0 },
  { x: 48.7, y: 88.4 },
  { x: 49.0, y: 85.8 },
  { x: 49.5, y: 83.2 },
  { x: 50.0, y: 81.2 },
  SHARED_PATH_START,
]
const JUMANJI_RIGHT_BRANCH_ANCHORS: Array<{ x: number; y: number }> = [...JUMANJI_LEFT_BRANCH_ANCHORS]
const JUMANJI_SHARED_ANCHORS: Array<{ x: number; y: number }> = [
  SHARED_PATH_START,
  { x: 35.0, y: 80.8 },
  { x: 67.0, y: 80.8 },
  { x: 73.8, y: 80.3 },
  { x: 76.0, y: 78.6 },
  { x: 76.8, y: 76.6 },
  { x: 76.0, y: 74.6 },
  { x: 73.8, y: 72.9 },
  { x: 67.0, y: 72.4 },
  { x: 33.0, y: 72.4 },
  { x: 26.2, y: 71.9 },
  { x: 24.0, y: 70.2 },
  { x: 23.2, y: 68.2 },
  { x: 24.0, y: 66.2 },
  { x: 26.2, y: 64.5 },
  { x: 33.0, y: 64.0 },
  { x: 67.0, y: 64.0 },
  { x: 73.4, y: 63.5 },
  { x: 75.8, y: 61.8 },
  { x: 76.6, y: 59.8 },
  { x: 75.8, y: 57.8 },
  { x: 73.4, y: 56.1 },
  { x: 67.0, y: 55.6 },
  { x: 33.0, y: 55.6 },
  { x: 26.6, y: 55.1 },
  { x: 24.2, y: 53.4 },
  { x: 23.4, y: 51.4 },
  { x: 24.2, y: 49.4 },
  { x: 26.6, y: 47.7 },
  { x: 33.2, y: 47.2 },
  { x: 66.8, y: 47.2 },
  { x: 73.2, y: 46.7 },
  { x: 75.4, y: 45.0 },
  { x: 76.2, y: 43.0 },
  { x: 75.4, y: 41.0 },
  { x: 73.2, y: 39.3 },
  { x: 66.8, y: 38.8 },
  { x: 33.2, y: 38.8 },
  { x: 26.8, y: 38.3 },
  { x: 24.6, y: 36.6 },
  { x: 23.8, y: 34.6 },
  { x: 24.6, y: 32.6 },
  { x: 26.8, y: 30.9 },
  { x: 33.4, y: 30.4 },
  { x: 66.4, y: 30.4 },
  { x: 72.8, y: 29.9 },
  { x: 75.0, y: 28.2 },
  { x: 75.8, y: 26.2 },
  { x: 75.0, y: 24.2 },
  { x: 72.8, y: 22.5 },
  { x: 66.4, y: 22.0 },
  { x: 36.0, y: 22.0 },
  { x: 30.2, y: 21.5 },
  { x: 27.8, y: 20.0 },
  { x: 26.8, y: 18.2 },
  { x: 27.8, y: 16.8 },
  { x: 30.2, y: 15.8 },
  { x: 34.8, y: 15.2 },
  { x: 70.0, y: 15.2 },
  { x: 74.6, y: 14.8 },
  { x: 76.4, y: 14.0 },
  { x: 74.9, y: 12.5 },
].map((p) =>
  keepInsideBoard(
    {
      x: 50 + (p.x - 50) * 0.75,
      y: 47 + (p.y - 47) * 0.79 + 10.8,
    },
    ROAD_SAFE_PAD + 0.6,
  ),
)

const JUMANJI_LEFT_BRANCH_POINTS = samplePolyline(JUMANJI_LEFT_BRANCH_ANCHORS, BRANCH_MERGE_STEP - 1)
const JUMANJI_RIGHT_BRANCH_POINTS = JUMANJI_LEFT_BRANCH_POINTS
const JUMANJI_SHARED_PATH_POINTS = samplePolyline(JUMANJI_SHARED_ANCHORS, TOTAL_STEPS - BRANCH_MERGE_STEP + 1)

const leftBranchCoords = new Map(JUMANJI_LEFT_BRANCH_POINTS.map((p, i) => [i + 1, p]))
const rightBranchCoords = new Map(JUMANJI_RIGHT_BRANCH_POINTS.map((p, i) => [i + 1, p]))
const sharedStepCoords = new Map(JUMANJI_SHARED_PATH_POINTS.map((p, i) => [i + BRANCH_MERGE_STEP, p]))

const stepCoords = new Map(
  stepLayout.map((c) => [
    c.step,
    sharedStepCoords.get(c.step) ??
      leftBranchCoords.get(c.step) ??
      JUMANJI_SHARED_PATH_POINTS[JUMANJI_SHARED_PATH_POINTS.length - 1],
  ]),
)

const boardCoord = (p: { x: number; y: number }) => keepInsideBoard(toPlayfieldCoord(p), 9.9)

const buildSmoothPathD = (points: Array<{ x: number; y: number }>) => {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`
  }
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

const leftTrackPath = buildSmoothPathD(JUMANJI_LEFT_BRANCH_POINTS.map(boardCoord))
const sharedTrackPath = buildSmoothPathD(JUMANJI_SHARED_PATH_POINTS.map(boardCoord))

type BoardStepMarker = {
  key: string
  step: number
  lane: 'left' | 'right' | 'shared'
  coord: { x: number; y: number }
}

const branchStepMarkers: BoardStepMarker[] = Array.from({ length: BRANCH_MERGE_STEP - 1 }, (_, idx) => {
  const step = idx + 1
  const raw = keepInsideBoard(toPlayfieldCoord(leftBranchCoords.get(step) ?? START_COORDS.left), 11.4)
  return [{ key: `branch-${step}`, step, lane: 'shared' as const, coord: raw }]
}).flat()

const sharedStepMarkers: BoardStepMarker[] = stepLayout
  .filter(({ step }) => step >= BRANCH_MERGE_STEP)
  .map(({ step }) => ({
    key: `shared-${step}`,
    step,
    lane: 'shared' as const,
    coord: keepInsideBoard(toPlayfieldCoord(sharedStepCoords.get(step) ?? coordFor('left', step)), 12.4),
  }))

const boardStepMarkers: BoardStepMarker[] = [...branchStepMarkers, ...sharedStepMarkers]

const TILE_GLYPHS: Record<number, string> = {
  5: '✨',
  11: '🌀',
  18: '🍀',
  24: '⚡',
}

const coordFor = (side: Side, step: number) => {
  if (!step || step <= 0) return START_COORDS[side]
  const clamped = Math.max(1, Math.min(TOTAL_STEPS, step))
  if (clamped < BRANCH_MERGE_STEP) {
    return (side === 'left' ? leftBranchCoords : rightBranchCoords).get(clamped) ?? START_COORDS[side]
  }
  return sharedStepCoords.get(clamped) ?? stepCoords.get(clamped) ?? START_COORDS[side]
}
const coordForProgress = (side: Side, progress: number) => {
  const clamped = Math.max(0, Math.min(TOTAL_STEPS, progress))
  if (clamped <= 0) return START_COORDS[side]

  const whole = Math.floor(clamped)
  const next = Math.ceil(clamped)
  const t = clamped - whole

  const a = coordFor(side, whole)
  const b = coordFor(side, next)
  if (whole === next) return a

  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  }
}

const resultLabel = (r: TeamResult) =>
  r === 'correct' ? "To'g'ri" : r === 'wrong' ? 'Xato' : r === 'timeout' ? 'Vaqt tugadi' : r === 'lost' ? 'Raqib topdi' : 'Kutilmoqda'

function JumanjiArena({
  gameTitle,
  gameTone,
  leftTeamName = '1-Jamoa',
  rightTeamName = '2-Jamoa',
  initialDifficulty = "O'rta",
  teacherQuestions = [],
  setupPath = '/games/jumanji',
}: Props) {
  const cfg = CFG[initialDifficulty]
  const [questions, setQuestions] = useState(() => buildDeck(initialDifficulty, teacherQuestions))
  const [questionIndex, setQuestionIndex] = useState(0)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(cfg.seconds)
  const [left, setLeft] = useState<TeamState>(makeTeam)
  const [right, setRight] = useState<TeamState>(makeTeam)
  const [roundWinner, setRoundWinner] = useState<Side | null>(null)
  const [phaseLocked, setPhaseLocked] = useState(false)
  const [diceRolling, setDiceRolling] = useState(false)
  const [diceValue, setDiceValue] = useState(1)
  const [diceSide, setDiceSide] = useState<Side | null>(null)
  const [awaitingDiceSide, setAwaitingDiceSide] = useState<Side | null>(null)
  const [statusText, setStatusText] = useState("Boshlashni bosing. Savolga javob bering, keyin zar tashlanadi.")
  const [whisperText, setWhisperText] = useState(WHISPERS[0])
  const [winner, setWinner] = useState<Winner | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [confettiKey, setConfettiKey] = useState(0)
  const [movingSide, setMovingSide] = useState<Side | null>(null)
  const [leftDisplayPos, setLeftDisplayPos] = useState(0)
  const [rightDisplayPos, setRightDisplayPos] = useState(0)
  const [leftDiceSpin, setLeftDiceSpin] = useState<DiceSpin>(() => makeDiceSpin())
  const [rightDiceSpin, setRightDiceSpin] = useState<DiceSpin>(() => makeDiceSpin())

  const nextRoundTimer = useRef<number | null>(null)
  const diceInterval = useRef<number | null>(null)
  const resolveTimer = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const leftMoveRafRef = useRef<number | null>(null)
  const rightMoveRafRef = useRef<number | null>(null)
  const leftDisplayRef = useRef(0)
  const rightDisplayRef = useRef(0)

  const question = questions[questionIndex] ?? null
  const roundNo = questionIndex + 1
  const leftLabel = leftTeamName.trim() || '1-Jamoa'
  const rightLabel = rightTeamName.trim() || '2-Jamoa'

  const clearTimeoutRef = (ref: React.MutableRefObject<number | null>) => {
    if (ref.current) {
      window.clearTimeout(ref.current)
      ref.current = null
    }
  }

  const clearIntervalRef = (ref: React.MutableRefObject<number | null>) => {
    if (ref.current) {
      window.clearInterval(ref.current)
      ref.current = null
    }
  }

  const clearAsync = () => {
    clearTimeoutRef(nextRoundTimer)
    clearTimeoutRef(resolveTimer)
    clearIntervalRef(diceInterval)
    clearIntervalRef(timerRef)
    if (leftMoveRafRef.current) {
      window.cancelAnimationFrame(leftMoveRafRef.current)
      leftMoveRafRef.current = null
    }
    if (rightMoveRafRef.current) {
      window.cancelAnimationFrame(rightMoveRafRef.current)
      rightMoveRafRef.current = null
    }
  }

  useEffect(() => () => clearAsync(), [])
  useEffect(() => {
    leftDisplayRef.current = leftDisplayPos
  }, [leftDisplayPos])
  useEffect(() => {
    rightDisplayRef.current = rightDisplayPos
  }, [rightDisplayPos])

  const animateDisplayPosition = (side: Side, targetPos: number) => {
    const rafRef = side === 'left' ? leftMoveRafRef : rightMoveRafRef
    const currentRef = side === 'left' ? leftDisplayRef : rightDisplayRef
    const setDisplay = side === 'left' ? setLeftDisplayPos : setRightDisplayPos

    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    const from = currentRef.current
    const to = Math.max(0, Math.min(TOTAL_STEPS, targetPos))
    if (Math.abs(to - from) < 0.001) {
      currentRef.current = to
      setDisplay(to)
      return
    }

    const travel = Math.abs(to - from)
    const duration = Math.min(1320, Math.max(260, 280 * travel))
    const startedAt = performance.now()

    const tick = (now: number) => {
      const p = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      const nextValue = from + (to - from) * eased
      currentRef.current = nextValue
      setDisplay(nextValue)
      if (p < 1) {
        rafRef.current = window.requestAnimationFrame(tick)
      } else {
        rafRef.current = null
      }
    }

    rafRef.current = window.requestAnimationFrame(tick)
  }

  useEffect(() => {
    if (!started || finished || phaseLocked || diceRolling) return
    clearIntervalRef(timerRef)
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearIntervalRef(timerRef)
  }, [started, finished, phaseLocked, diceRolling, questionIndex])

  const goNextQuestion = () => {
    setQuestionIndex((prev) => {
      const next = prev + 1
      if (next >= questions.length - 2) {
        setQuestions(buildDeck(initialDifficulty, teacherQuestions))
        return 0
      }
      return next
    })
    setTimeLeft(cfg.seconds)
    setRoundWinner(null)
    setPhaseLocked(false)
    setDiceRolling(false)
    setDiceSide(null)
    setAwaitingDiceSide(null)
    setLeft((prev) => resetRound(prev))
    setRight((prev) => resetRound(prev))
    setWhisperText(WHISPERS[Math.floor(Math.random() * WHISPERS.length)])
  }

  const scheduleNext = (msg: string) => {
    if (finished) return
    setPhaseLocked(true)
    setStatusText(msg)
    clearTimeoutRef(nextRoundTimer)
    nextRoundTimer.current = window.setTimeout(() => {
      goNextQuestion()
    }, cfg.autoNextMs)
  }

  const finishGame = (who: Winner) => {
    clearAsync()
    setStarted(false)
    setFinished(true)
    setPhaseLocked(true)
    setDiceRolling(false)
    setDiceSide(null)
    setAwaitingDiceSide(null)
    setWinner(who)
    setShowWinnerModal(true)
    setConfettiKey((v) => v + 1)
    setStatusText(
      who === 'draw'
        ? "Jumanji yo'li durang tugadi."
        : `${who === 'left' ? leftLabel : rightLabel} ${TOTAL_STEPS}-qadamga yetib keldi!`,
    )
  }

  const finalizeAfterMove = (side: Side, roll: number, basePos: number, gain: number) => {
    const teamLabel = side === 'left' ? leftLabel : rightLabel
    const special = SPECIALS[basePos]
    if (basePos >= TOTAL_STEPS) {
      finishGame(side)
      return
    }
    if (!special) {
      scheduleNext(`${teamLabel} zar: ${roll}. ${roll} qadam yurdi (+${gain} ball).`)
      return
    }

    setWhisperText(`${special.title}: ${special.delta > 0 ? '+' : ''}${special.delta} qadam`)
    setStatusText(`${teamLabel} ${special.title} katagiga tushdi.`)
    setMovingSide(side)
    clearTimeoutRef(resolveTimer)
    resolveTimer.current = window.setTimeout(() => {
      let finalPos = basePos
      if (side === 'left') {
        setLeft((prev) => {
          finalPos = Math.max(0, Math.min(TOTAL_STEPS, prev.position + special.delta))
          return { ...prev, position: finalPos, score: Math.max(0, prev.score + special.delta * 4) }
        })
      } else {
        setRight((prev) => {
          finalPos = Math.max(0, Math.min(TOTAL_STEPS, prev.position + special.delta))
          return { ...prev, position: finalPos, score: Math.max(0, prev.score + special.delta * 4) }
        })
      }
      if (finalPos >= TOTAL_STEPS) {
        finishGame(side)
        return
      }
      scheduleNext(`${teamLabel} maxsus katak effekti bilan ${special.delta > 0 ? 'oldinga' : 'orqaga'} siljidi.`)
    }, 850)
  }

  const triggerDice = (side: Side) => {
    if (awaitingDiceSide && awaitingDiceSide !== side) return
    if (!awaitingDiceSide && !diceRolling && roundWinner !== side) return
    const spin = makeDiceSpin()
    if (side === 'left') setLeftDiceSpin(spin)
    else setRightDiceSpin(spin)
    const roll = 1 + Math.floor(Math.random() * 6)
    setDiceValue(roll)
    setDiceSide(side)
    setAwaitingDiceSide(null)
    setDiceRolling(true)
    setPhaseLocked(true)
    setStatusText(`${side === 'left' ? leftLabel : rightLabel} birinchi topdi. Zar sekin aylanmoqda...`)
    clearIntervalRef(diceInterval)

    clearTimeoutRef(resolveTimer)
    resolveTimer.current = window.setTimeout(() => {
      const gain = cfg.points + Math.max(0, timeLeft * 2)
      const teamLabel = side === 'left' ? leftLabel : rightLabel
      const startPos = side === 'left' ? left.position : right.position
      const targetPos = Math.min(TOTAL_STEPS, startPos + roll)
      const travelSteps = Math.max(0, targetPos - startPos)
      const setTeam = side === 'left' ? setLeft : setRight
      setDiceRolling(false)
      setMovingSide(side)

      setTeam((prev) => ({
        ...prev,
        score: prev.score + gain,
        correct: prev.correct + 1,
        rolls: prev.rolls + 1,
        lastRoll: roll,
      }))

      if (travelSteps <= 0) {
        setStatusText(`${teamLabel} zar: ${roll}. Yurish yo'q, joyida qoldi.`)
        clearTimeoutRef(resolveTimer)
        resolveTimer.current = window.setTimeout(() => finalizeAfterMove(side, roll, targetPos, gain), 420)
        return
      }

      let moved = 0
      let stepPos = startPos
      const stepDelay = 430

      const stepForward = () => {
        moved += 1
        stepPos = Math.min(TOTAL_STEPS, startPos + moved)
        setTeam((prev) => ({ ...prev, position: stepPos }))
        setStatusText(`${teamLabel} yurmoqda: ${stepPos}-qadam (${moved}/${travelSteps})`)

        if (moved < travelSteps) {
          resolveTimer.current = window.setTimeout(stepForward, stepDelay)
        } else {
          clearTimeoutRef(resolveTimer)
          resolveTimer.current = window.setTimeout(() => finalizeAfterMove(side, roll, stepPos, gain), 540)
        }
      }

      clearTimeoutRef(resolveTimer)
      resolveTimer.current = window.setTimeout(stepForward, 240)
    }, spin.durationMs + 80)
  }

  const lockMissedIfBoth = (leftLocked: boolean, rightLocked: boolean) => {
    if (roundWinner) return
    if (leftLocked && rightLocked) {
      setWhisperText('Jumanji bu raundda jim qoldi...')
      scheduleNext("Ikkala jamoa ham topolmadi. Keyingi savol ochiladi.")
    }
  }

  const handleAnswer = (side: Side, index: number) => {
    if (!started || finished || phaseLocked || diceRolling || !question) return
    const team = side === 'left' ? left : right
    if (team.locked) return
    const correct = index === question.correctIndex
    if (correct && !roundWinner) {
      setRoundWinner(side)
      if (side === 'left') {
        setLeft((prev) => ({ ...prev, selected: index, locked: true, result: 'correct' }))
        setRight((prev) => (prev.locked ? prev : { ...prev, locked: true, result: 'lost' }))
      } else {
        setRight((prev) => ({ ...prev, selected: index, locked: true, result: 'correct' }))
        setLeft((prev) => (prev.locked ? prev : { ...prev, locked: true, result: 'lost' }))
      }
      setPhaseLocked(true)
      setDiceSide(side)
      setAwaitingDiceSide(side)
      setStatusText(`${side === 'left' ? leftLabel : rightLabel} to'g'ri topdi. Zarni bosing.`)
      setWhisperText("Zar taqdirni belgilaydi. G'olib jamoa zarni aylantirsin.")
      return
    }

    if (side === 'left') {
      const next = { ...left, selected: index, locked: true, result: 'wrong' as const }
      setLeft(next)
      setStatusText(`${leftLabel} xato. ${rightLabel} javob berishi mumkin.`)
      lockMissedIfBoth(true, right.locked)
    } else {
      const next = { ...right, selected: index, locked: true, result: 'wrong' as const }
      setRight(next)
      setStatusText(`${rightLabel} xato. ${leftLabel} javob berishi mumkin.`)
      lockMissedIfBoth(left.locked, true)
    }
  }

  useEffect(() => {
    if (!started || finished || phaseLocked || diceRolling || roundWinner) return
    if (timeLeft > 0) return
    setLeft((prev) => (prev.locked ? prev : { ...prev, locked: true, result: 'timeout' }))
    setRight((prev) => (prev.locked ? prev : { ...prev, locked: true, result: 'timeout' }))
    setWhisperText('Jungle kutdi, vaqt tugadi.')
    scheduleNext('Vaqt tugadi. Bu raundda hech kim zar tashlay olmadi.')
  }, [timeLeft, started, finished, phaseLocked, diceRolling, roundWinner])

  useEffect(() => {
    if (!movingSide) return
    const id = window.setTimeout(() => setMovingSide(null), 900)
    return () => window.clearTimeout(id)
  }, [movingSide, left.position, right.position])

  useEffect(() => {
    if (!started) {
      if (leftMoveRafRef.current) {
        window.cancelAnimationFrame(leftMoveRafRef.current)
        leftMoveRafRef.current = null
      }
      leftDisplayRef.current = left.position
      setLeftDisplayPos(left.position)
      return
    }
    animateDisplayPosition('left', left.position)
  }, [left.position, started])

  useEffect(() => {
    if (!started) {
      if (rightMoveRafRef.current) {
        window.cancelAnimationFrame(rightMoveRafRef.current)
        rightMoveRafRef.current = null
      }
      rightDisplayRef.current = right.position
      setRightDisplayPos(right.position)
      return
    }
    animateDisplayPosition('right', right.position)
  }, [right.position, started])

  const startGame = () => {
    if (started || finished || !question) return
    setStarted(true)
    setTimeLeft(cfg.seconds)
    setStatusText("Jumanji boshlandi! Kim birinchi to'g'ri topsa zar tashlaydi.")
  }

  const resetGame = () => {
    clearAsync()
    setQuestions(buildDeck(initialDifficulty, teacherQuestions))
    setQuestionIndex(0)
    setStarted(false)
    setFinished(false)
    setTimeLeft(cfg.seconds)
    setLeft(makeTeam())
    setRight(makeTeam())
    setRoundWinner(null)
    setPhaseLocked(false)
    setDiceRolling(false)
    setDiceSide(null)
    setAwaitingDiceSide(null)
    setDiceValue(1)
    setStatusText("Boshlashni bosing. Savolga javob bering, keyin zar tashlanadi.")
    setWhisperText(WHISPERS[0])
    setWinner(null)
    setShowWinnerModal(false)
    setMovingSide(null)
  }

  const renderPanel = (side: Side, team: TeamState) => {
    const isLeft = side === 'left'
    const tone = isLeft ? 'from-cyan-500 to-blue-600' : 'from-rose-500 to-red-600'
    const label = isLeft ? leftLabel : rightLabel
    const disabled = !started || finished || phaseLocked || diceRolling || team.locked || !question
    const isDiceActive = started && !finished && awaitingDiceSide === side && !diceRolling
    const showRolling = diceRolling && diceSide === side
    const spin = isLeft ? leftDiceSpin : rightDiceSpin
    const diceRollStyle = showRolling
      ? ({
          animation: `j-dice-roll ${spin.durationMs}ms cubic-bezier(.16,.82,.2,1) infinite`,
          ['--j-dice-rx-mid' as any]: `${Math.round(spin.rx * 0.52)}deg`,
          ['--j-dice-ry-mid' as any]: `${Math.round(spin.ry * 0.5)}deg`,
          ['--j-dice-rz-mid' as any]: `${Math.round(spin.rz * 0.45)}deg`,
          ['--j-dice-rx' as any]: `${spin.rx}deg`,
          ['--j-dice-ry' as any]: `${spin.ry}deg`,
          ['--j-dice-rz' as any]: `${spin.rz}deg`,
        } as React.CSSProperties)
      : undefined
    return (
      <div
        className={`j-team-panel h-full rounded-[0.95rem] border border-white/70 bg-white/68 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_10px_18px_rgba(20,12,8,0.18)] backdrop-blur-[2.5px] ${
          isLeft ? 'ring-1 ring-cyan-200/40' : 'ring-1 ring-rose-200/40'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-kid text-lg leading-none text-slate-900">{label}</h3>
            <p className="mt-0.5 text-[8px] font-extrabold uppercase tracking-[0.12em] text-slate-500">{resultLabel(team.result)}</p>
          </div>
          <span className={`rounded-full bg-gradient-to-r px-2 py-0.5 text-[9px] font-extrabold text-white ${tone}`}>{team.score} ball</span>
        </div>
        <div className="mt-1.5 grid grid-cols-3 gap-1 text-center">
          <div className="rounded-lg border border-slate-200 bg-white px-1.5 py-1"><p className="text-[7px] font-extrabold uppercase tracking-[0.08em] text-slate-400">Qadam</p><p className="mt-0.5 text-[11px] font-black">{team.position}</p></div>
          <div className="rounded-lg border border-slate-200 bg-white px-1.5 py-1"><p className="text-[7px] font-extrabold uppercase tracking-[0.08em] text-slate-400">Ball</p><p className="mt-0.5 text-[11px] font-black">{team.score}</p></div>
          <div className="rounded-lg border border-slate-200 bg-white px-1.5 py-1"><p className="text-[7px] font-extrabold uppercase tracking-[0.08em] text-slate-400">Oxirgi</p><p className="mt-0.5 text-[11px] font-black">{team.lastRoll ?? '-'}</p></div>
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-1">
          {question?.options.map((opt, i) => {
            const picked = team.selected === i
            const correct = question.correctIndex === i
            const toneClass = !team.locked
              ? 'j-option-card j-option-card-idle border-white/85 bg-[linear-gradient(155deg,#ffffff_0%,#f6fbff_45%,#ecf4ff_100%)] shadow-[0_8px_16px_rgba(15,23,42,0.08)] hover:-translate-y-[1px] hover:border-sky-300 hover:shadow-[0_13px_20px_rgba(14,165,233,0.2)]'
              : correct
                ? 'j-option-card j-option-card-correct border-emerald-300 bg-[linear-gradient(180deg,#ecfdf5_0%,#d1fae5_100%)] text-emerald-800 shadow-[0_10px_16px_rgba(16,185,129,0.22)]'
                : picked
                  ? 'j-option-card j-option-card-wrong border-rose-300 bg-[linear-gradient(180deg,#fff1f2_0%,#ffe4e6_100%)] text-rose-800 shadow-[0_10px_16px_rgba(244,63,94,0.2)]'
                  : 'j-option-card j-option-card-muted border-slate-200 bg-slate-100/95 text-slate-500 opacity-80'
            return (
              <button key={`${side}-${question.id}-${i}`} type="button" onClick={() => handleAnswer(side, i)} disabled={disabled} className={`rounded-xl border px-2 py-1.5 transition ${toneClass} ${disabled ? 'cursor-not-allowed' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="j-option-badge grid h-6 w-6 place-items-center rounded-lg border border-white/80 bg-[linear-gradient(145deg,#f8fafc,#e2e8f0)] text-[10px] font-black text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_3px_8px_rgba(15,23,42,0.12)]">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="j-option-text text-left text-[10px] font-extrabold leading-tight text-slate-800">{opt}</span>
                </div>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => triggerDice(side)}
          disabled={!isDiceActive}
          className={`j-dice-trigger mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 transition ${
            isDiceActive
              ? 'j-dice-trigger-active border-amber-300 bg-[linear-gradient(145deg,#fff9e3,#efd89d)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_14px_rgba(120,90,20,0.22)] cursor-pointer hover:scale-[1.01]'
              : 'j-dice-trigger-idle border-slate-200 bg-slate-100/90 cursor-not-allowed opacity-80'
          }`}
          title={isDiceActive ? 'Zarni tashlash' : 'Navbat emas'}
        >
          <div
            className="j-dice-cube relative h-9 w-9 rounded-[11px] border border-amber-300/85 bg-[linear-gradient(150deg,#fffef9_0%,#f9eec8_48%,#e8cf8f_100%)] shadow-[inset_0_2px_0_rgba(255,255,255,0.9),0_8px_16px_rgba(120,90,20,0.36)] [transform-style:preserve-3d] will-change-transform"
            style={diceRollStyle}
          >
            <span className="j-dice-glow pointer-events-none absolute inset-x-[5px] top-[4px] h-[4px] rounded-full bg-white/65 blur-[1px]" />
            <div className="j-dice-face absolute inset-[3px] grid grid-cols-3 grid-rows-3 rounded-[8px] border border-white/70 bg-[linear-gradient(180deg,#fff,#f8f2dc)]">
              {dicePips.map(([pr, pc], idx) => (
                <div key={`${side}-pip-${idx}`} className="grid place-items-center" style={{ gridRow: pr + 1, gridColumn: pc + 1 }}>
                  <span className="j-dice-pip h-1.5 w-1.5 rounded-full bg-slate-900 shadow-[0_0_4px_rgba(0,0,0,0.5)]" />
                </div>
              ))}
            </div>
          </div>
          <div className="j-dice-meta text-left">
            <p className="j-dice-label text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-500">{isDiceActive ? 'Navbat sizda' : 'Zar'}</p>
            <p className="j-dice-value text-[11px] font-black text-slate-800">{showRolling ? 'Aylanmoqda...' : isDiceActive ? 'Zarni bosing' : `${diceValue}`}</p>
          </div>
        </button>
      </div>
    )
  }

  const dicePips = useMemo(() => {
    const map: Record<number, Array<[number, number]>> = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
    }
    return map[diceValue] ?? map[1]
  }, [diceValue])

  const leftCoord = keepInsideBoard(toPlayfieldCoord(coordForProgress('left', leftDisplayPos)), 8.1)
  const rightCoord = keepInsideBoard(toPlayfieldCoord(coordForProgress('right', rightDisplayPos)), 8.1)
  const activeLane: Side = leftDisplayPos >= rightDisplayPos ? 'left' : 'right'
  const activeStep = Math.max(1, Math.min(TOTAL_STEPS, Math.round(Math.max(leftDisplayPos, rightDisplayPos, 1))))

  return (
    <section className="glass-card jumanji-jungle-shell relative overflow-visible p-1 sm:p-2" data-aos="fade-up" data-aos-delay="80">
      <style>{`
        .jumanji-jungle-shell {
          background:
            radial-gradient(circle at 12% 8%, rgba(251, 146, 60, 0.16), transparent 40%),
            radial-gradient(circle at 86% 18%, rgba(16, 185, 129, 0.14), transparent 44%),
            radial-gradient(circle at 30% 92%, rgba(217, 119, 6, 0.12), transparent 36%),
            linear-gradient(150deg, #181612 0%, #232018 38%, #2f2a1f 72%, #1b1712 100%);
        }
        .j-board-container {
          border: 13px solid #3b2b1d;
          box-shadow:
            0 18px 38px rgba(0, 0, 0, 0.45),
            0 0 42px rgba(16, 185, 129, 0.26),
            0 0 30px rgba(245, 158, 11, 0.2),
            inset 0 0 36px rgba(0, 0, 0, 0.58);
          border-radius: 24px;
          overflow: hidden;
        }
        .j-question-panel {
          background: rgba(15, 23, 21, 0.74);
          border: 1px solid rgba(250, 204, 21, 0.65);
          box-shadow: 0 0 18px rgba(251, 191, 36, 0.24), inset 0 0 14px rgba(16, 185, 129, 0.16);
          color: #f8fafc;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
        }
        .premium-dark .j-option-card {
          border-color: rgba(96, 165, 250, 0.34) !important;
          background-image: linear-gradient(150deg, rgba(15, 23, 42, 0.9) 0%, rgba(12, 20, 35, 0.88) 52%, rgba(8, 47, 73, 0.75) 100%) !important;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 10px 20px rgba(2, 6, 23, 0.46) !important;
          opacity: 1 !important;
        }
        .premium-dark .j-option-card.j-option-card-idle:hover:not(:disabled) {
          border-color: rgba(34, 211, 238, 0.55) !important;
          box-shadow:
            0 14px 22px rgba(8, 47, 73, 0.55),
            0 0 14px rgba(34, 211, 238, 0.28) !important;
        }
        .premium-dark .j-option-card.j-option-card-correct {
          border-color: rgba(74, 222, 128, 0.62) !important;
          background-image: linear-gradient(150deg, rgba(5, 46, 22, 0.95) 0%, rgba(6, 78, 59, 0.92) 58%, rgba(5, 150, 105, 0.82) 100%) !important;
          box-shadow: 0 12px 20px rgba(6, 95, 70, 0.5) !important;
        }
        .premium-dark .j-option-card.j-option-card-wrong {
          border-color: rgba(251, 113, 133, 0.62) !important;
          background-image: linear-gradient(150deg, rgba(76, 5, 25, 0.95) 0%, rgba(127, 29, 29, 0.92) 58%, rgba(190, 24, 93, 0.76) 100%) !important;
          box-shadow: 0 12px 20px rgba(127, 29, 29, 0.52) !important;
        }
        .premium-dark .j-option-card.j-option-card-muted {
          border-color: rgba(148, 163, 184, 0.34) !important;
          background-image: linear-gradient(155deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.88) 100%) !important;
          color: #cbd5e1 !important;
          opacity: 0.96 !important;
        }
        .premium-dark .j-option-badge {
          border-color: rgba(125, 211, 252, 0.48) !important;
          background-image: linear-gradient(150deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.92) 100%) !important;
          color: #e0f2fe !important;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 6px 12px rgba(2, 6, 23, 0.45) !important;
        }
        .premium-dark .j-option-text {
          color: #f8fbff !important;
          text-shadow: 0 1px 2px rgba(2, 6, 23, 0.7);
        }
        .premium-dark .j-team-panel {
          border-color: rgba(251, 191, 36, 0.34) !important;
          background: linear-gradient(165deg, rgba(34, 28, 20, 0.9), rgba(22, 19, 15, 0.88)) !important;
          box-shadow:
            inset 0 1px 0 rgba(255, 248, 220, 0.12),
            0 12px 24px rgba(0, 0, 0, 0.3) !important;
        }
        .premium-dark .j-dice-trigger {
          border-color: rgba(251, 191, 36, 0.34) !important;
          box-shadow:
            inset 0 1px 0 rgba(255, 248, 220, 0.1),
            0 12px 22px rgba(0, 0, 0, 0.28) !important;
        }
        .premium-dark .j-dice-trigger.j-dice-trigger-active {
          border-color: rgba(251, 191, 36, 0.72) !important;
          background-image: linear-gradient(145deg, rgba(103, 61, 10, 0.95) 0%, rgba(146, 96, 18, 0.94) 46%, rgba(234, 179, 8, 0.84) 100%) !important;
          box-shadow:
            inset 0 1px 0 rgba(255, 250, 221, 0.3),
            0 0 0 1px rgba(251, 191, 36, 0.14),
            0 14px 24px rgba(120, 53, 15, 0.48),
            0 0 18px rgba(251, 191, 36, 0.24) !important;
        }
        .premium-dark .j-dice-trigger.j-dice-trigger-idle {
          border-color: rgba(125, 211, 252, 0.22) !important;
          background-image: linear-gradient(150deg, rgba(37, 33, 25, 0.92) 0%, rgba(28, 25, 19, 0.9) 100%) !important;
        }
        .premium-dark .j-dice-cube {
          border-color: rgba(251, 191, 36, 0.82) !important;
          background-image: linear-gradient(155deg, #fff6d8 0%, #f6d87b 48%, #b7791f 100%) !important;
          box-shadow:
            inset 0 2px 0 rgba(255, 255, 255, 0.62),
            0 10px 18px rgba(120, 53, 15, 0.5),
            0 0 12px rgba(251, 191, 36, 0.26) !important;
        }
        .premium-dark .j-dice-face {
          border-color: rgba(120, 53, 15, 0.5) !important;
          background-image: linear-gradient(180deg, #fffdf5 0%, #fdf0bb 100%) !important;
          box-shadow: inset 0 -2px 6px rgba(180, 83, 9, 0.16);
        }
        .premium-dark .j-dice-glow {
          background: rgba(255, 255, 255, 0.72) !important;
        }
        .premium-dark .j-dice-pip {
          background: #3b2408 !important;
          box-shadow:
            0 0 0 1px rgba(255, 248, 220, 0.16),
            0 0 6px rgba(59, 36, 8, 0.24) !important;
        }
        .premium-dark .j-dice-label {
          color: #f5d67b !important;
        }
        .premium-dark .j-dice-value {
          color: #fff7de !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
        }
        @keyframes j-dice-roll {
          0% { transform: perspective(620px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1); }
          35% { transform: perspective(620px) rotateX(var(--j-dice-rx-mid, 220deg)) rotateY(var(--j-dice-ry-mid, 260deg)) rotateZ(var(--j-dice-rz-mid, 120deg)) scale(1.08); }
          75% { transform: perspective(620px) rotateX(var(--j-dice-rx, 980deg)) rotateY(var(--j-dice-ry, 1260deg)) rotateZ(var(--j-dice-rz, 420deg)) scale(.96); }
          100% { transform: perspective(620px) rotateX(var(--j-dice-rx, 980deg)) rotateY(var(--j-dice-ry, 1260deg)) rotateZ(var(--j-dice-rz, 420deg)) scale(1); }
        }
        @keyframes j-idol-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes j-idol-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(-12px); } }
        @keyframes j-board-breathe { 0%,100% { transform: scale(1) translateY(0px); } 50% { transform: scale(1.012) translateY(-2px); } }
        @keyframes j-light-sweep { 0% { transform: translateX(-120%) rotate(12deg); opacity: 0; } 20% { opacity: .18; } 55% { opacity: .12; } 100% { transform: translateX(160%) rotate(12deg); opacity: 0; } }
        @keyframes j-bonus-pulse {
          0% { transform: scale(1); box-shadow: 0 0 10px rgba(16, 185, 129, 0.55); }
          50% { transform: scale(1.08); box-shadow: 0 0 24px rgba(16, 185, 129, 0.85); }
          100% { transform: scale(1); box-shadow: 0 0 10px rgba(16, 185, 129, 0.55); }
        }
        @keyframes j-step-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-1.5px); }
        }
        .j-bonus-pulse {
          animation: j-bonus-pulse 2s infinite;
        }
        .j-step-dot {
          animation: j-step-float 2.4s ease-in-out infinite;
        }
      `}</style>

      <div className="relative z-10 mt-0 -translate-y-20 sm:-translate-y-24">
        <div className="j-board-container mx-auto w-full max-w-[1420px] rounded-[1.45rem] border border-amber-200/35 bg-[#2f281c]/88 p-1">
          <div className="rounded-[1.2rem] border-[2px] border-amber-300/65 bg-[linear-gradient(180deg,#3b2f22_0%,#2e261c_100%)] p-1 shadow-[inset_0_1px_0_rgba(251,191,36,0.25),0_14px_32px_rgba(0,0,0,0.35)]">
            <div className="rounded-[1rem] border border-amber-100/35 bg-[#1f1b15]/85 p-1">
              <div className="relative aspect-square overflow-hidden rounded-[0.95rem] border border-amber-100/25 bg-[#11140f]">
                <img
                  src={jumanjiBoardBg}
                  alt="Jumanji arena background"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.9]"
                  style={{ animation: 'j-board-breathe 6.2s ease-in-out infinite', filter: 'blur(0.25px) saturate(0.98) contrast(1.02) brightness(0.84)' }}
                />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(10,25,12,0.06),rgba(6,12,7,0.2)_58%,rgba(2,6,4,0.3))]" />

                <div className="j-question-panel absolute left-[8.2%] top-[30.6%] z-[10] w-[16.2%] rounded-xl px-2.5 py-2 text-center backdrop-blur-sm">
                  <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-cyan-200">{leftLabel} savoli</p>
                  <p className="mt-1 text-[10px] font-extrabold leading-tight text-white">{question?.prompt ?? 'Savol tayyorlanmoqda...'}</p>
                </div>
                <div className="j-question-panel absolute right-[8.2%] top-[30.6%] z-[10] w-[16.2%] rounded-xl px-2.5 py-2 text-center backdrop-blur-sm">
                  <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-rose-200">{rightLabel} savoli</p>
                  <p className="mt-1 text-[10px] font-extrabold leading-tight text-white">{question?.prompt ?? 'Savol tayyorlanmoqda...'}</p>
                </div>

                <div className="absolute left-1/2 top-[19.6%] z-[11] flex -translate-x-1/2 flex-wrap items-center justify-center gap-2">
                  <span className="rounded-full bg-[linear-gradient(135deg,#065f46,#10b981)] px-3 py-1 text-[10px] font-extrabold text-white shadow-sm">{leftLabel}: {left.position}/{TOTAL_STEPS}</span>
                  <span className="rounded-full bg-[linear-gradient(135deg,#3f6212,#84cc16)] px-3 py-1 text-[10px] font-extrabold text-white shadow-sm">{rightLabel}: {right.position}/{TOTAL_STEPS}</span>
                  <span className="rounded-full border border-amber-200/70 bg-[#fff7dd]/90 px-3 py-1 text-[10px] font-extrabold text-amber-900 shadow-sm">
                    {diceRolling ? 'Zar aylanmoqda...' : awaitingDiceSide ? `${awaitingDiceSide === 'left' ? leftLabel : rightLabel} zar bosadi` : `Zar: ${diceValue}`}
                  </span>
                  <button
                    type="button"
                    onClick={startGame}
                    disabled={started || finished || !question}
                    className={`rounded-full border border-white/45 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-lg backdrop-blur-sm ${started || finished || !question ? 'cursor-not-allowed bg-slate-500/70 opacity-80' : `bg-gradient-to-r ${gameTone}`}`}
                  >
                    {started ? 'Boshlangan' : "O'yinni boshlash"}
                  </button>
                </div>

                <div
                  className="pointer-events-none absolute z-[4] overflow-hidden rounded-[1.15rem]"
                  style={{
                    left: `${BOARD_PLAYFIELD.left}%`,
                    top: `${BOARD_PLAYFIELD.top}%`,
                    width: `${BOARD_PLAYFIELD.width}%`,
                    height: `${BOARD_PLAYFIELD.height}%`,
                  }}
                >
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                    <defs>
                      <linearGradient id="j-road-body" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4f3d2d" />
                        <stop offset="50%" stopColor="#6a523d" />
                        <stop offset="100%" stopColor="#5a4635" />
                      </linearGradient>
                      <linearGradient id="j-road-glint" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(245,222,179,0.24)" />
                        <stop offset="100%" stopColor="rgba(245,222,179,0.08)" />
                      </linearGradient>
                      <linearGradient id="j-track-shadow" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="rgba(10,7,4,0.38)" />
                        <stop offset="100%" stopColor="rgba(16,11,6,0.66)" />
                      </linearGradient>
                    </defs>

                    <path d={leftTrackPath} fill="none" stroke="url(#j-track-shadow)" strokeWidth="5.1" strokeLinecap="round" />
                    <path d={sharedTrackPath} fill="none" stroke="url(#j-track-shadow)" strokeWidth="5.7" strokeLinecap="round" />

                    <path d={leftTrackPath} fill="none" stroke="rgba(37,29,21,0.78)" strokeWidth="3.3" strokeLinecap="round" />
                    <path d={sharedTrackPath} fill="none" stroke="rgba(37,29,21,0.82)" strokeWidth="3.7" strokeLinecap="round" />

                    <path d={leftTrackPath} fill="none" stroke="url(#j-road-body)" strokeWidth="2.45" strokeLinecap="round" />
                    <path d={sharedTrackPath} fill="none" stroke="url(#j-road-body)" strokeWidth="2.75" strokeLinecap="round" />

                    <path d={leftTrackPath} fill="none" stroke="url(#j-road-glint)" strokeWidth="0.74" strokeLinecap="round" />
                    <path d={sharedTrackPath} fill="none" stroke="url(#j-road-glint)" strokeWidth="0.82" strokeLinecap="round" />

                    <path d={leftTrackPath} fill="none" stroke="rgba(236,223,196,0.72)" strokeWidth="0.52" strokeDasharray="1.1 1.6" strokeLinecap="round" />
                    <path d={sharedTrackPath} fill="none" stroke="rgba(236,223,196,0.74)" strokeWidth="0.6" strokeDasharray="1.15 1.7" strokeLinecap="round" />
                  </svg>

                  <div className="absolute inset-0 z-[6]">
                    {boardStepMarkers.map(({ key, step, coord, lane }) => {
                      const special = SPECIALS[step]
                      const isActive =
                        step === activeStep &&
                        (lane === 'shared' || lane === activeLane)
                      const nodeSizeClass = 'h-7 w-7 text-[9px] sm:h-[32px] sm:w-[32px] sm:text-[10px]'
                      const toneClass = isActive
                        ? 'border-amber-200 bg-[linear-gradient(180deg,#fff7d6_0%,#fde68a_100%)] text-amber-900 shadow-[0_0_18px_rgba(251,191,36,0.85)]'
                        : special
                          ? special.tone === 'emerald'
                            ? 'border-emerald-200 bg-[linear-gradient(180deg,#f0fdf4_0%,#bbf7d0_100%)] text-emerald-900 shadow-[0_0_10px_rgba(16,185,129,0.45)]'
                            : special.tone === 'rose'
                              ? 'border-amber-200 bg-[linear-gradient(180deg,#fef3c7_0%,#fde68a_100%)] text-amber-900 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                              : 'border-yellow-200 bg-[linear-gradient(180deg,#fef9c3_0%,#fde68a_100%)] text-amber-900 shadow-[0_0_10px_rgba(250,204,21,0.52)]'
                          : 'border-emerald-100/80 bg-[linear-gradient(160deg,rgba(236,253,245,0.95)_0%,rgba(167,243,208,0.85)_100%)] text-emerald-950 shadow-[0_3px_9px_rgba(5,46,22,0.22)]'

                      return (
                        <div
                          key={key}
                          className="pointer-events-none absolute"
                          style={{
                            left: `${coord.x}%`,
                            top: `${coord.y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <div className={`j-step-dot relative grid place-items-center rounded-full border font-black ${nodeSizeClass} ${toneClass}`}>
                            {step}
                            {lane === 'shared' && special ? (
                              <span className="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full border border-white/90 bg-white text-[6px] shadow-sm sm:h-3.5 sm:w-3.5 sm:text-[7px]">
                                {TILE_GLYPHS[step] ?? '✨'}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/40 bg-[radial-gradient(circle_at_50%_40%,rgba(167,243,208,0.82),rgba(22,163,74,0.44)_45%,rgba(2,6,23,0.78))] shadow-[0_0_34px_rgba(34,197,94,0.52)]" />

                <div
                  className="pointer-events-none absolute z-20 transition-all duration-700 ease-out"
                  style={{
                    left: `${leftCoord.x}%`,
                    top: `${leftCoord.y}%`,
                    transform: 'translate(-50%,-50%) translate(-9px,0px)',
                  }}
                >
                  <div
                    className={`relative h-11 w-9 sm:h-12 sm:w-10 ${movingSide === 'left' ? 'drop-shadow-[0_0_14px_rgba(34,211,238,0.55)]' : ''}`}
                    style={{ animation: movingSide === 'left' ? 'j-idol-hop .42s ease-in-out 2' : 'j-idol-float 1.9s ease-in-out infinite' }}
                  >
                    {movingSide === 'left' ? <span className="absolute -inset-2 rounded-[14px] border border-cyan-200/70 bg-cyan-300/10 shadow-[0_0_18px_rgba(34,211,238,0.45)] animate-pulse" /> : null}
                    {movingSide === 'left' ? <span className="absolute -inset-3 rounded-[18px] border border-cyan-200/35 animate-pulse" /> : null}
                    <span className="absolute bottom-0 left-1/2 h-2 w-8 -translate-x-1/2 rounded-full bg-black/25 blur-[1.4px]" />
                    <span className="absolute bottom-[1px] left-1/2 h-2 w-7 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-900/65 to-blue-900/65" />
                    <span className="absolute bottom-[5px] left-1/2 h-7 w-6 -translate-x-1/2 rounded-[9px] border border-cyan-100/70 bg-gradient-to-b from-cyan-300 via-cyan-500 to-blue-700 shadow-[0_8px_14px_rgba(8,47,73,0.4)]" />
                    <span className="absolute bottom-[27px] left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border border-white/80 bg-gradient-to-b from-cyan-100 to-cyan-400 shadow-[0_5px_8px_rgba(6,95,135,0.35)]" />
                    <span className="absolute bottom-[17px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-50" />
                  </div>
                </div>
                <div
                  className="pointer-events-none absolute z-20 transition-all duration-700 ease-out"
                  style={{
                    left: `${rightCoord.x}%`,
                    top: `${rightCoord.y}%`,
                    transform: 'translate(-50%,-50%) translate(9px,0px)',
                  }}
                >
                  <div
                    className={`relative h-11 w-9 sm:h-12 sm:w-10 ${movingSide === 'right' ? 'drop-shadow-[0_0_14px_rgba(251,113,133,0.55)]' : ''}`}
                    style={{ animation: movingSide === 'right' ? 'j-idol-hop .42s ease-in-out 2' : 'j-idol-float 2.05s ease-in-out infinite' }}
                  >
                    {movingSide === 'right' ? <span className="absolute -inset-2 rounded-[14px] border border-rose-200/70 bg-rose-300/10 shadow-[0_0_18px_rgba(251,113,133,0.45)] animate-pulse" /> : null}
                    {movingSide === 'right' ? <span className="absolute -inset-3 rounded-[18px] border border-rose-200/35 animate-pulse" /> : null}
                    <span className="absolute bottom-0 left-1/2 h-2 w-8 -translate-x-1/2 rounded-full bg-black/25 blur-[1.4px]" />
                    <span className="absolute bottom-[1px] left-1/2 h-2 w-7 -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-900/65 to-red-900/65" />
                    <span className="absolute bottom-[5px] left-1/2 h-7 w-6 -translate-x-1/2 rounded-[9px] border border-rose-100/70 bg-gradient-to-b from-rose-300 via-rose-500 to-red-700 shadow-[0_8px_14px_rgba(113,19,45,0.36)]" />
                    <span className="absolute bottom-[27px] left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border border-white/80 bg-gradient-to-b from-rose-100 to-rose-400 shadow-[0_5px_8px_rgba(159,18,57,0.3)]" />
                    <span className="absolute bottom-[17px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-rose-50" />
                  </div>
                </div>
                </div>

                <div className="absolute left-[7.8%] top-[34.4%] bottom-[17.5%] z-[9] w-[16.2%] rounded-2xl border border-transparent bg-transparent p-0 shadow-none backdrop-blur-0">
                  {renderPanel('left', left)}
                </div>
                <div className="absolute right-[7.8%] top-[34.4%] bottom-[17.5%] z-[9] w-[16.2%] rounded-2xl border border-transparent bg-transparent p-0 shadow-none backdrop-blur-0">
                  {renderPanel('right', right)}
                </div>

                <div className="absolute inset-x-[28%] bottom-[3.8%] z-[10]">
                  <div className="rounded-xl border border-white/45 bg-white/84 px-3 py-2 text-center shadow-lg backdrop-blur-sm">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Status</p>
                    <p className="mt-0.5 text-xs font-extrabold leading-tight text-slate-700">{statusText}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showWinnerModal ? (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <ConfettiOverlay burstKey={confettiKey} variant={winner === 'draw' ? 'lose' : 'win'} pieces={winner === 'draw' ? 70 : 130} />
          <div className="relative z-[2] w-full max-w-xl rounded-[1.6rem] border border-white/80 bg-white/95 p-5 shadow-soft">
            <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">Jumanji yakunlandi</p>
            <h3 className="mt-3 font-kid text-4xl text-slate-900">{winner === 'draw' ? 'Durang' : `G'olib: ${winner === 'left' ? leftLabel : rightLabel}`}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-center"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-cyan-700">{leftLabel}</p><p className="mt-1 text-2xl font-extrabold">{left.score}</p><p className="text-sm font-bold text-slate-600">{left.position}/{TOTAL_STEPS} qadam</p></div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-rose-700">{rightLabel}</p><p className="mt-1 text-2xl font-extrabold">{right.score}</p><p className="text-sm font-bold text-slate-600">{right.position}/{TOTAL_STEPS} qadam</p></div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowWinnerModal(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700">Yopish</button>
              <button type="button" onClick={resetGame} className={`rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${gameTone}`}>Yangi o'yin</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default JumanjiArena
