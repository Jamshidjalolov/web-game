import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfettiOverlay from './ConfettiOverlay'

type WordSearchArenaProps = {
  gameTitle: string
  gameTone: string
  leftTeamName?: string
  rightTeamName?: string
  initialDifficulty?: 'Oson' | "O'rta" | 'Qiyin'
  lockSettings?: boolean
  setupPath?: string
}

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Side = 'left' | 'right'
type Winner = Side | 'draw'

type Position = {
  row: number
  col: number
}

type Direction = {
  dr: number
  dc: number
}

type PlacedWord = {
  word: string
  start: Position
  end: Position
  found: boolean
}

type TeamBoard = {
  name: string
  grid: string[][]
  words: PlacedWord[]
  selected: Position | null
  foundCount: number
  attempts: number
  score: number
  lastResult: 'correct' | 'wrong' | null
}

type RoundBoards = {
  left: TeamBoard
  right: TeamBoard
}

type SelectionOutcome = 'start' | 'cancel' | 'correct' | 'wrong'

type DifficultyConfig = {
  size: number
  words: number
  seconds: number
  baseScore: number
  minLength: number
  maxLength: number
}

const DIFFICULTIES: Difficulty[] = ['Oson', "O'rta", 'Qiyin']
const INITIAL_DIFFICULTY: Difficulty = "O'rta"
const PRIMARY_TRACK_SRC = '/audio/sigmamusicart-corporate-background-music-484577.mp3'
const FALLBACK_TRACK_SRC = '/audio/the_mountain-children-483305.mp3'

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  Oson: {
    size: 8,
    words: 7,
    seconds: 150,
    baseScore: 12,
    minLength: 4,
    maxLength: 6,
  },
  "O'rta": {
    size: 10,
    words: 9,
    seconds: 190,
    baseScore: 18,
    minLength: 5,
    maxLength: 8,
  },
  Qiyin: {
    size: 12,
    words: 11,
    seconds: 230,
    baseScore: 24,
    minLength: 6,
    maxLength: 10,
  },
}

const WORD_BANK = [
  'ALIFBO',
  'KITOB',
  'QALAM',
  'DAFTAR',
  'RASM',
  'HISOB',
  'DARS',
  'USTOZ',
  'SINF',
  'LUGAT',
  'SAVOL',
  'JAVOB',
  'BILIM',
  'MANTIQ',
  'LABIRINT',
  'MUSOBAQA',
  'JAMOA',
  'YULDUZ',
  'QUVNOQ',
  'OYIN',
  'HIKOYA',
  'SOZLAR',
  'RAQAM',
  'SHAKL',
  'CHIZMA',
  'RANG',
  'MASHQ',
  'TAJRIBA',
  'HARF',
  'LIDER',
  'TEZKOR',
  'ZEHN',
  'XOTIRA',
  'TAFAKKUR',
  'IJOD',
  'QIDIRUV',
  'BELGILAR',
  'MULOHAZA',
  'INTIZOM',
  'NATIJA',
  'MEHNAT',
  'ORZU',
  'KASHF',
  'FIKR',
  'TOPSHIRIQ',
  'SINOV',
  'SABOQ',
  'QOIDA',
  'KOMANDA',
  'USTALIK',
  'ZAFAR',
  'MAQSAD',
  'DOIRA',
  'KVADRAT',
  'MISOL',
  'JUMBOQ',
  'KROSSVORD',
  'ILHOM',
  'SEZGIR',
  'FANLAR',
  'MATN',
  'ODOB',
  'SHIJOAT',
  'JASORAT',
  'MASHHUR',
  'MUNOZARA',
  'TOPQIRLIK',
  'GALABA',
]

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const DIRECTIONS: Direction[] = [
  { dr: -1, dc: -1 },
  { dr: -1, dc: 0 },
  { dr: -1, dc: 1 },
  { dr: 0, dc: -1 },
  { dr: 0, dc: 1 },
  { dr: 1, dc: -1 },
  { dr: 1, dc: 0 },
  { dr: 1, dc: 1 },
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

const formatClock = (seconds: number) => {
  const mm = Math.floor(seconds / 60)
  const ss = seconds % 60
  return `${String(mm)}:${String(ss).padStart(2, '0')}`
}

const isSamePoint = (a: Position, b: Position) =>
  a.row === b.row && a.col === b.col

const isInside = (size: number, row: number, col: number) =>
  row >= 0 && row < size && col >= 0 && col < size

const getLineCells = (from: Position, to: Position): Position[] | null => {
  const dRow = to.row - from.row
  const dCol = to.col - from.col

  if (dRow === 0 && dCol === 0) {
    return [{ row: from.row, col: from.col }]
  }

  const straight = dRow === 0 || dCol === 0 || Math.abs(dRow) === Math.abs(dCol)
  if (!straight) {
    return null
  }

  const stepRow = Math.sign(dRow)
  const stepCol = Math.sign(dCol)
  const steps = Math.max(Math.abs(dRow), Math.abs(dCol))
  const cells: Position[] = []

  for (let i = 0; i <= steps; i += 1) {
    cells.push({
      row: from.row + stepRow * i,
      col: from.col + stepCol * i,
    })
  }

  return cells
}

const createEmptyGrid = (size: number) =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => ''))

const fillGridRandomLetters = (grid: string[][]) => {
  const size = grid.length
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!grid[row][col]) {
        grid[row][col] = LETTERS[randomInt(0, LETTERS.length - 1)]
      }
    }
  }
}

const canPlaceWord = (
  grid: string[][],
  word: string,
  start: Position,
  direction: Direction,
) => {
  for (let i = 0; i < word.length; i += 1) {
    const row = start.row + direction.dr * i
    const col = start.col + direction.dc * i
    if (!isInside(grid.length, row, col)) {
      return false
    }
    const existing = grid[row][col]
    if (existing !== '' && existing !== word[i]) {
      return false
    }
  }
  return true
}

const placeWord = (
  grid: string[][],
  word: string,
  start: Position,
  direction: Direction,
) => {
  for (let i = 0; i < word.length; i += 1) {
    const row = start.row + direction.dr * i
    const col = start.col + direction.dc * i
    grid[row][col] = word[i]
  }
  return {
    row: start.row + direction.dr * (word.length - 1),
    col: start.col + direction.dc * (word.length - 1),
  }
}

const buildFallbackPuzzle = (words: string[], size: number) => {
  const grid = createEmptyGrid(size)
  const placedWords: PlacedWord[] = []
  const ordered = shuffle(words)

  ordered.forEach((word, index) => {
    const row = index % size
    const maxStart = Math.max(0, size - word.length)
    const col = randomInt(0, maxStart)
    const start = { row, col }
    const end = placeWord(grid, word, start, { dr: 0, dc: 1 })
    placedWords.push({
      word,
      start,
      end,
      found: false,
    })
  })

  fillGridRandomLetters(grid)
  return {
    grid,
    words: placedWords,
  }
}

const buildPuzzle = (words: string[], size: number) => {
  const sortedWords = [...words].sort((a, b) => b.length - a.length)

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const grid = createEmptyGrid(size)
    const placedWords: PlacedWord[] = []
    let failed = false

    for (const word of shuffle(sortedWords)) {
      let placed = false
      for (let i = 0; i < 260; i += 1) {
        const direction = DIRECTIONS[randomInt(0, DIRECTIONS.length - 1)]
        const start = {
          row: randomInt(0, size - 1),
          col: randomInt(0, size - 1),
        }
        if (!canPlaceWord(grid, word, start, direction)) {
          continue
        }
        const end = placeWord(grid, word, start, direction)
        placedWords.push({
          word,
          start,
          end,
          found: false,
        })
        placed = true
        break
      }

      if (!placed) {
        failed = true
        break
      }
    }

    if (!failed) {
      fillGridRandomLetters(grid)
      return {
        grid,
        words: placedWords,
      }
    }
  }

  return buildFallbackPuzzle(words, size)
}

const pickTeamWords = (config: DifficultyConfig) => {
  const candidates = shuffle(
    Array.from(new Set(WORD_BANK)).filter((word) => (
      word.length >= config.minLength
      && word.length <= config.maxLength
      && word.length <= config.size
    )),
  )

  const needed = config.words * 2
  const selected = candidates.slice(0, needed)

  if (selected.length < needed) {
    const backup = shuffle(
      WORD_BANK.filter((word) => (
        word.length <= config.size && word.length >= 4
      )),
    )
    while (selected.length < needed && backup.length > 0) {
      const candidate = backup.pop()
      if (!candidate) break
      selected.push(candidate)
    }
  }

  return {
    left: selected.slice(0, config.words),
    right: selected.slice(config.words, config.words * 2),
  }
}

const createTeamBoard = (name: string, words: string[], size: number): TeamBoard => {
  const puzzle = buildPuzzle(words, size)
  return {
    name,
    grid: puzzle.grid,
    words: puzzle.words,
    selected: null,
    foundCount: 0,
    attempts: 0,
    score: 0,
    lastResult: null,
  }
}

const createRoundBoards = (
  difficulty: Difficulty,
  leftName = '1-Jamoa',
  rightName = '2-Jamoa',
): RoundBoards => {
  const config = DIFFICULTY_CONFIG[difficulty]
  const picked = pickTeamWords(config)
  return {
    left: createTeamBoard(leftName, picked.left, config.size),
    right: createTeamBoard(rightName, picked.right, config.size),
  }
}

const createFoundCellSet = (words: PlacedWord[]) => {
  const set = new Set<string>()
  words.forEach((item) => {
    if (!item.found) return
    const cells = getLineCells(item.start, item.end)
    if (!cells) return
    cells.forEach((cell) => {
      set.add(`${cell.row}-${cell.col}`)
    })
  })
  return set
}

const evaluateSelection = (
  team: TeamBoard,
  nextCell: Position,
  config: DifficultyConfig,
) => {
  if (!team.selected) {
    return {
      board: { ...team, selected: nextCell, lastResult: null },
      outcome: 'start' as SelectionOutcome,
    }
  }

  if (isSamePoint(team.selected, nextCell)) {
    return {
      board: { ...team, selected: null, lastResult: null },
      outcome: 'cancel' as SelectionOutcome,
    }
  }

  const line = getLineCells(team.selected, nextCell)
  if (!line) {
    return {
      board: {
        ...team,
        selected: null,
        attempts: team.attempts + 1,
        score: Math.max(0, team.score - 2),
        lastResult: 'wrong' as const,
      },
      outcome: 'wrong' as SelectionOutcome,
    }
  }

  const matchedIndex = team.words.findIndex((item) => (
    !item.found
    && (
      (isSamePoint(item.start, team.selected as Position) && isSamePoint(item.end, nextCell))
      || (isSamePoint(item.start, nextCell) && isSamePoint(item.end, team.selected as Position))
    )
  ))

  if (matchedIndex === -1) {
    return {
      board: {
        ...team,
        selected: null,
        attempts: team.attempts + 1,
        score: Math.max(0, team.score - 2),
        lastResult: 'wrong' as const,
      },
      outcome: 'wrong' as SelectionOutcome,
    }
  }

  const nextWords = team.words.map((item, index) =>
    index === matchedIndex ? { ...item, found: true } : item,
  )
  const bonus = config.baseScore + Math.max(0, (config.words - team.foundCount) * 2)

  return {
    board: {
      ...team,
      words: nextWords,
      selected: null,
      attempts: team.attempts + 1,
      foundCount: team.foundCount + 1,
      score: team.score + bonus,
      lastResult: 'correct' as const,
    },
    outcome: 'correct' as SelectionOutcome,
  }
}

const resolveWinner = (left: TeamBoard, right: TeamBoard): Winner => {
  if (left.score > right.score) return 'left'
  if (right.score > left.score) return 'right'
  if (left.foundCount > right.foundCount) return 'left'
  if (right.foundCount > left.foundCount) return 'right'
  if (left.attempts < right.attempts) return 'left'
  if (right.attempts < left.attempts) return 'right'
  return 'draw'
}

function WordSearchArena({
  gameTitle,
  gameTone,
  leftTeamName = '1-Jamoa',
  rightTeamName = '2-Jamoa',
  initialDifficulty = INITIAL_DIFFICULTY,
  lockSettings = false,
  setupPath = '/games/soz-qidiruv',
}: WordSearchArenaProps) {
  const safeTeamOne = leftTeamName.trim() || '1-Jamoa'
  const safeTeamTwo = rightTeamName.trim() || '2-Jamoa'
  const normalizedInitialDifficulty: Difficulty = DIFFICULTIES.includes(initialDifficulty)
    ? initialDifficulty
    : INITIAL_DIFFICULTY

  const initialBoards = useMemo(
    () => createRoundBoards(normalizedInitialDifficulty, safeTeamOne, safeTeamTwo),
    [normalizedInitialDifficulty, safeTeamOne, safeTeamTwo],
  )
  const [difficulty, setDifficulty] = useState<Difficulty>(normalizedInitialDifficulty)
  const [leftBoard, setLeftBoard] = useState<TeamBoard>(initialBoards.left)
  const [rightBoard, setRightBoard] = useState<TeamBoard>(initialBoards.right)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [musicOn, setMusicOn] = useState(true)
  const [winner, setWinner] = useState<Winner | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [statusText, setStatusText] = useState(
    "Boshlash tugmasini bosing, keyin har bir jamoa so'zni boshidan oxirigacha belgilaydi.",
  )
  const [timeLeft, setTimeLeft] = useState(DIFFICULTY_CONFIG[normalizedInitialDifficulty].seconds)
  const musicTrackRef = useRef<HTMLAudioElement | null>(null)
  const trackSourceRef = useRef(PRIMARY_TRACK_SRC)

  const config = DIFFICULTY_CONFIG[difficulty]
  const totalWords = config.words * 2
  const totalFound = leftBoard.foundCount + rightBoard.foundCount
  const progressPercent = Math.round((totalFound / totalWords) * 100)

  const leftFoundCells = useMemo(() => createFoundCellSet(leftBoard.words), [leftBoard.words])
  const rightFoundCells = useMemo(() => createFoundCellSet(rightBoard.words), [rightBoard.words])

  const winnerLabel =
    winner === 'left' ? leftBoard.name : winner === 'right' ? rightBoard.name : 'Durang'
  const winnerScore =
    winner === 'left'
      ? leftBoard.score
      : winner === 'right'
        ? rightBoard.score
        : Math.max(leftBoard.score, rightBoard.score)
  const winnerFound =
    winner === 'left'
      ? leftBoard.foundCount
      : winner === 'right'
        ? rightBoard.foundCount
        : Math.max(leftBoard.foundCount, rightBoard.foundCount)

  const leaderLabel = useMemo(() => {
    if (leftBoard.score > rightBoard.score) return `${leftBoard.name} oldinda`
    if (rightBoard.score > leftBoard.score) return `${rightBoard.name} oldinda`
    return 'Teng holat'
  }, [leftBoard.score, rightBoard.score, leftBoard.name, rightBoard.name])

  const stopMusic = useCallback(() => {
    const track = musicTrackRef.current
    if (!track) return
    track.pause()
  }, [])

  const startMusic = useCallback(
    async (force = false) => {
      if (!musicOn && !force) return
      const track = musicTrackRef.current
      if (!track) return

      try {
        track.playbackRate = 1
        track.volume = 0.92
        if (track.paused) {
          await track.play()
        }
        return
      } catch {
        if (trackSourceRef.current === PRIMARY_TRACK_SRC) {
          trackSourceRef.current = FALLBACK_TRACK_SRC
          track.src = FALLBACK_TRACK_SRC
          track.load()
          try {
            await track.play()
            return
          } catch {
            // ignore and keep silent if browser blocks or both tracks fail
          }
        }
      }
    },
    [musicOn],
  )

  const applyNewRound = useCallback(
    (level: Difficulty) => {
      const nextBoards = createRoundBoards(level, safeTeamOne, safeTeamTwo)
      setLeftBoard(nextBoards.left)
      setRightBoard(nextBoards.right)
      setTimeLeft(DIFFICULTY_CONFIG[level].seconds)
      setRunning(false)
      setFinished(false)
      setWinner(null)
      setShowWinnerModal(false)
      setStatusText("Yangi maydon tayyor. Boshlash tugmasini bossangiz bellashuv boshlanadi.")
      stopMusic()
      if (musicTrackRef.current) {
        musicTrackRef.current.currentTime = 0
      }
    },
    [safeTeamOne, safeTeamTwo, stopMusic],
  )

  const finishRound = useCallback(
    (reason: string) => {
      if (finished) return
      const resolved = resolveWinner(leftBoard, rightBoard)
      setWinner(resolved)
      setRunning(false)
      setFinished(true)
      setShowWinnerModal(true)
      setConfettiBurst((prev) => prev + 1)
      stopMusic()
      if (resolved === 'draw') {
        setStatusText(`${reason} Yakun: durang.`)
        return
      }
      const label = resolved === 'left' ? leftBoard.name : rightBoard.name
      setStatusText(`${reason} G'olib: ${label}.`)
    },
    [finished, leftBoard, rightBoard, stopMusic],
  )

  const handleDifficultyChange = (nextLevel: Difficulty) => {
    if (running || lockSettings) return
    setDifficulty(nextLevel)
    applyNewRound(nextLevel)
  }

  const handleStart = () => {
    if (running || finished) return
    setRunning(true)
    setStatusText("Bellashuv boshlandi! So'zni boshidan oxirigacha ikki nuqta bilan belgilang.")
    void startMusic(true)
  }

  const toggleMusic = () => {
    if (musicOn) {
      setMusicOn(false)
      stopMusic()
      setStatusText("Musiqa o'chirildi.")
      return
    }

    setMusicOn(true)
    void startMusic(true)
    setStatusText('Musiqa yoqildi.')
  }

  const handleCellClick = (side: Side, row: number, col: number) => {
    if (!running || finished) return
    const cell = { row, col }

    if (side === 'left') {
      const result = evaluateSelection(leftBoard, cell, config)
      setLeftBoard(result.board)
      if (result.outcome === 'correct') {
        setStatusText(`${leftBoard.name} to'g'ri so'zni topdi.`)
      } else if (result.outcome === 'wrong') {
        setStatusText(`${leftBoard.name} noto'g'ri belgiladi.`)
      }
      return
    }

    const result = evaluateSelection(rightBoard, cell, config)
    setRightBoard(result.board)
    if (result.outcome === 'correct') {
      setStatusText(`${rightBoard.name} to'g'ri so'zni topdi.`)
    } else if (result.outcome === 'wrong') {
      setStatusText(`${rightBoard.name} noto'g'ri belgiladi.`)
    }
  }

  useEffect(() => {
    if (!running || finished) return
    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [running, finished])

  useEffect(() => {
    const track = new Audio(PRIMARY_TRACK_SRC)
    trackSourceRef.current = PRIMARY_TRACK_SRC
    track.loop = true
    track.preload = 'auto'
    track.volume = 0.92
    track.load()

    const handleTrackError = () => {
      if (trackSourceRef.current === PRIMARY_TRACK_SRC) {
        trackSourceRef.current = FALLBACK_TRACK_SRC
        track.src = FALLBACK_TRACK_SRC
        track.load()
      }
    }

    track.addEventListener('error', handleTrackError)
    musicTrackRef.current = track

    return () => {
      track.pause()
      track.removeEventListener('error', handleTrackError)
      track.src = ''
      if (musicTrackRef.current === track) {
        musicTrackRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const nextBoards = createRoundBoards(
      normalizedInitialDifficulty,
      safeTeamOne,
      safeTeamTwo,
    )
    setDifficulty(normalizedInitialDifficulty)
    setLeftBoard(nextBoards.left)
    setRightBoard(nextBoards.right)
    setTimeLeft(DIFFICULTY_CONFIG[normalizedInitialDifficulty].seconds)
    setRunning(false)
    setFinished(false)
    setWinner(null)
    setShowWinnerModal(false)
    setStatusText("Yangi maydon tayyor. Boshlash tugmasini bossangiz bellashuv boshlanadi.")
    stopMusic()
    if (musicTrackRef.current) {
      musicTrackRef.current.currentTime = 0
    }
  }, [normalizedInitialDifficulty, safeTeamOne, safeTeamTwo, stopMusic])

  useEffect(() => {
    if (!running || finished || !musicOn) {
      stopMusic()
      return
    }
    void startMusic()
  }, [running, finished, musicOn, startMusic, stopMusic])

  useEffect(() => {
    if (!running || finished || timeLeft > 0) return
    finishRound('Vaqt tugadi.')
  }, [timeLeft, running, finished, finishRound])

  useEffect(() => {
    if (!running || finished) return
    if (leftBoard.foundCount >= config.words) {
      finishRound(`${leftBoard.name} barcha so'zlarni topdi.`)
      return
    }
    if (rightBoard.foundCount >= config.words) {
      finishRound(`${rightBoard.name} barcha so'zlarni topdi.`)
    }
  }, [
    leftBoard.foundCount,
    rightBoard.foundCount,
    leftBoard.name,
    rightBoard.name,
    config.words,
    running,
    finished,
    finishRound,
  ])

  const renderTeamBoard = (
    side: Side,
    board: TeamBoard,
    foundCells: Set<string>,
    toneClass: string,
    pointClass: string,
  ) => (
    <article className="arena-3d-panel flex flex-col rounded-[1.7rem] border border-white/80 bg-white/92 p-3 shadow-soft sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-kid text-4xl text-slate-900">{board.name}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] ${toneClass}`}>
          Score {board.score}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-extrabold text-slate-600">
          Topildi: {board.foundCount}/{config.words}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-extrabold text-slate-600">
          Urinish: {board.attempts}
        </div>
        <div className={`rounded-xl border px-3 py-2 text-center text-xs font-extrabold ${
          board.lastResult === 'correct'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : board.lastResult === 'wrong'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}>
          {board.lastResult === 'correct'
            ? "To'g'ri"
            : board.lastResult === 'wrong'
              ? 'Xato'
              : 'Holat'}
        </div>
      </div>

      <div className="mt-3 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
        <div className="mx-auto w-fit">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${config.size}, minmax(0, 1fr))` }}
          >
            {board.grid.map((row, rowIndex) =>
              row.map((letter, colIndex) => {
                const key = `${rowIndex}-${colIndex}`
                const isFound = foundCells.has(key)
                const isSelected = Boolean(
                  board.selected
                  && board.selected.row === rowIndex
                  && board.selected.col === colIndex,
                )
                return (
                  <button
                    key={`${side}-${key}`}
                    type="button"
                    onClick={() => handleCellClick(side, rowIndex, colIndex)}
                    disabled={!running || finished}
                    className={`arena-3d-press grid h-7 w-7 place-items-center rounded-lg border text-[11px] font-black uppercase transition sm:h-8 sm:w-8 sm:text-xs xl:h-9 xl:w-9 xl:text-sm ${
                      isFound
                        ? pointClass
                        : isSelected
                          ? 'border-amber-300 bg-amber-100 text-amber-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300'
                    } ${!running || finished ? 'cursor-not-allowed opacity-80' : ''}`}
                  >
                    {letter}
                  </button>
                )
              }),
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
          Topiladigan so'zlar
        </p>
        <div className="mt-2 grid max-h-32 grid-cols-2 gap-1.5 overflow-auto">
          {board.words.map((item) => (
            <p
              key={`${side}-${item.word}`}
              className={`rounded-lg border px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] sm:text-xs ${
                item.found
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 line-through'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              {item.word}
            </p>
          ))}
        </div>
      </div>
    </article>
  )

  return (
    <section className="glass-card arena-3d-shell flex w-full flex-col p-3 sm:p-4" data-aos="fade-up" data-aos-delay="80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-700 sm:px-4 sm:py-2 sm:text-xs">
            Jamoaviy word-search
          </p>
          <h2 className="mt-1 font-kid text-4xl text-slate-900 sm:mt-2 sm:text-5xl">
            {gameTitle} Arena
          </h2>
          <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
            Har jamoaga alohida maydon beriladi. Murakkablik bir xil, so'zlar har xil.
          </p>
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
            onClick={toggleMusic}
            className={`arena-3d-press rounded-xl border px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] transition sm:text-xs ${
              musicOn
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-slate-300 bg-white text-slate-600'
            }`}
          >
            Musiqa: {musicOn ? 'YOQIQ' : "O'CHIQ"}
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={running || finished}
            className={`arena-3d-press rounded-xl bg-gradient-to-r px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-soft transition hover:-translate-y-0.5 sm:text-xs ${
              running || finished ? 'cursor-not-allowed opacity-70' : gameTone
            }`}
          >
            Boshlash
          </button>
          <button
            type="button"
            onClick={() => applyNewRound(difficulty)}
            className="arena-3d-press rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5 sm:text-xs"
          >
            Yangi raund
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Daraja</p>
          <p className="mt-1 font-kid text-3xl text-slate-900">{difficulty}</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Timer</p>
          <p className="mt-1 font-kid text-3xl text-slate-900">{formatClock(timeLeft)}</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Jami topildi</p>
          <p className="mt-1 font-kid text-3xl text-slate-900">{totalFound}/{totalWords}</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Lider</p>
          <p className="mt-1 text-sm font-extrabold text-slate-700">{leaderLabel}</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Status</p>
          <p className="mt-1 text-sm font-extrabold text-slate-700">{running ? 'Live' : finished ? 'Tugadi' : 'Tayyor'}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {DIFFICULTIES.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => handleDifficultyChange(level)}
            disabled={running || lockSettings}
            className={`arena-3d-press rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] transition ${
              difficulty === level
                ? `bg-gradient-to-r text-white ${gameTone}`
                : 'border border-slate-300 bg-white text-slate-600'
            } ${running || lockSettings ? 'cursor-not-allowed opacity-80' : ''}`}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="arena-3d-panel mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
          <span>Progress: {progressPercent}%</span>
          <span>Har jamoa: {config.words} ta so'z</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gameTone}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {renderTeamBoard(
            'left',
            leftBoard,
            leftFoundCells,
            'border-indigo-200 bg-indigo-50 text-indigo-700',
            'border-indigo-300 bg-indigo-100 text-indigo-800',
          )}
          {renderTeamBoard(
            'right',
            rightBoard,
            rightFoundCells,
            'border-rose-200 bg-rose-50 text-rose-700',
            'border-rose-300 bg-rose-100 text-rose-800',
          )}
      </div>

      <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm font-extrabold ${
        finished
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : 'border-cyan-200 bg-cyan-50 text-cyan-700'
      }`}>
        {finished
          ? winnerLabel === 'Durang'
            ? "Raund tugadi: durang natija."
            : `Raund tugadi. G'olib: ${winnerLabel}.`
          : statusText}
      </div>

      {showWinnerModal ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <ConfettiOverlay burstKey={confettiBurst} />
          <div className="w-full max-w-2xl rounded-[1.8rem] border border-white/75 bg-white/95 p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] ${
                winner === 'draw'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}>
                Raund yakuni
              </p>
              <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-600">
                Qolgan vaqt: {formatClock(timeLeft)}
              </p>
            </div>

            <h4 className="mt-3 font-kid text-4xl text-slate-900 sm:text-5xl">
              {winnerLabel === 'Durang' ? 'Durang natija' : `G'olib: ${winnerLabel}`}
            </h4>
            <p className="mt-2 text-base font-bold text-slate-600">
              {winnerLabel === 'Durang'
                ? `Eng yuqori ball: ${winnerScore}`
                : `${winnerLabel} natijasi: ${winnerScore} ball, ${winnerFound} ta so'z`}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{leftBoard.name}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-800">{leftBoard.score}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{rightBoard.name}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-800">{rightBoard.score}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">Topildi</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-800">{totalFound}/{totalWords}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">Daraja</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-800">{difficulty}</p>
              </div>
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
                onClick={() => applyNewRound(difficulty)}
                className={`rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
              >
                Yangi raund
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default WordSearchArena
