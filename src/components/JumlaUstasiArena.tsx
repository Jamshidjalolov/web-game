import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfettiOverlay from './ConfettiOverlay'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Side = 'left' | 'right'
type TeamStatus = 'waiting' | 'correct' | 'wrong' | 'timeout'

export type TeacherJumlaWord = {
  word: string
  hint?: string
}

type Props = {
  gameTitle: string
  gameTone: string
  leftTeamName?: string
  rightTeamName?: string
  initialDifficulty?: Difficulty
  teacherWords?: TeacherJumlaWord[]
  setupPath?: string
}

type WordEntry = { word: string; hint: string }
type Task = { id: string; answer: string; scrambled: string; hint: string; length: number }
type TeamState = {
  score: number
  correct: number
  streak: number
  bestStreak: number
  locked: boolean
  status: TeamStatus
  note: string
  tiles: string[]
  selectedTile: number | null
  dragTargetTile: number | null
}

type DifficultyConfig = {
  rounds: number
  seconds: number
  basePoints: number
  speedUnit: number
  streakBonus: number
  autoNextMs: number
  minLen: number
  maxLen: number
}

const CONFIG: Record<Difficulty, DifficultyConfig> = {
  Oson: { rounds: 10, seconds: 60, basePoints: 70, speedUnit: 2, streakBonus: 8, autoNextMs: 1700, minLen: 3, maxLen: 5 },
  "O'rta": { rounds: 10, seconds: 60, basePoints: 88, speedUnit: 3, streakBonus: 10, autoNextMs: 1800, minLen: 5, maxLen: 8 },
  Qiyin: { rounds: 10, seconds: 60, basePoints: 106, speedUnit: 4, streakBonus: 12, autoNextMs: 1900, minLen: 8, maxLen: 40 },
}

const WORDS: WordEntry[] = [
  { word: 'olma', hint: 'Meva' }, { word: 'anor', hint: 'Meva' }, { word: 'uzum', hint: 'Meva' }, { word: 'banan', hint: 'Sariq meva' },
  { word: 'gilos', hint: 'Meva' }, { word: 'qush', hint: 'Hayvon' }, { word: 'mushuk', hint: 'Uy hayvoni' }, { word: 'baliq', hint: 'Suvda yashaydi' },
  { word: 'sigir', hint: 'Sut beradi' }, { word: 'kitob', hint: "O'qish uchun" }, { word: 'qalam', hint: 'Yozish uchun' }, { word: 'daftar', hint: "Dars buyumi" },
  { word: 'maktab', hint: "Ta'lim joyi" }, { word: 'sinf', hint: "O'quv xonasi" }, { word: 'daraxt', hint: 'Tabiat' }, { word: 'quyosh', hint: 'Kunduz' },
  { word: 'bulut', hint: 'Osmon' }, { word: 'samolyot', hint: 'Transport' }, { word: 'avtobus', hint: 'Transport' }, { word: 'poyezd', hint: 'Transport' },
  { word: 'telefon', hint: 'Qurilma' }, { word: 'monitor', hint: 'Qurilma' }, { word: 'kompyuter', hint: 'Qurilma' }, { word: 'matematika', hint: 'Fan' },
  { word: 'geometriya', hint: 'Fan' }, { word: 'adabiyot', hint: 'Fan' }, { word: 'hamkorlik', hint: 'Birga ishlash' }, { word: 'topqirlik', hint: 'Tez fikrlash' },
  { word: 'musobaqa', hint: 'Bellashuv' }, { word: 'galaba', hint: 'Yutuq' }, { word: 'maglubiyat', hint: 'Yutqazish' }, { word: 'vatanparvar', hint: "Vatan bilan bog'liq" },
  { word: 'mustaqillik', hint: 'Bayram sozi' }, { word: 'ijodkorlik', hint: "Yaratish qobiliyati" }, { word: 'masuliyat', hint: 'Javobgarlik' }, { word: 'jumla', hint: "Gap bo'lagi" },
]

const TONES = ['from-cyan-400 to-blue-500', 'from-fuchsia-400 to-rose-500', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500'] as const
const TEAM_WAIT_NOTE = "2 ta harfni tanlab joyini almashtiring, keyin Tekshir bosing."

const shuffle = <T,>(list: T[]) => {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const normalize = (v: string) => v.toLowerCase().trim().replace(/[ʻ’`]/g, "'").replace(/\s+/g, ' ')
const sanitize = (v: string) => v.trim().replace(/[ʻ’`]/g, "'").replace(/\s+/g, ' ')
const letterCount = (v: string) => normalize(v).replace(/[^a-zA-Z\u0400-\u04FF]/g, '').length
const isLetter = (v: string) => /[\p{L}]/u.test(v)
const tilesFromScrambled = (scrambled: string) => scrambled.split('')

const scrambleToken = (token: string) => {
  const chars = token.split('')
  const idx = chars.map((c, i) => (isLetter(c) ? i : -1)).filter((i) => i >= 0)
  if (idx.length < 2) return token
  const base = idx.map((i) => chars[i])
  let mixed = [...base]
  let tries = 0
  while (tries < 8 && mixed.join('') === base.join('')) {
    mixed = shuffle(mixed)
    tries += 1
  }
  if (mixed.join('') === base.join('')) mixed = [...base.slice(1), base[0]]
  idx.forEach((i, k) => { chars[i] = mixed[k] })
  return chars.join('')
}

const scrambleWord = (word: string) => {
  const s = word.split(' ').map(scrambleToken).join(' ')
  return normalize(s) === normalize(word) && word.length > 1 ? `${word.slice(1)}${word[0]}` : s
}

const fitDifficulty = (word: string, d: Difficulty) => {
  const len = letterCount(word)
  return len >= CONFIG[d].minLen && len <= CONFIG[d].maxLen
}

const buildDeck = (difficulty: Difficulty, teacherWords: TeacherJumlaWord[], rounds: number): Task[] => {
  const map = new Map<string, WordEntry>()
  ;[
    ...teacherWords.map((w) => ({ word: sanitize(w.word), hint: w.hint?.trim() || "O'qituvchi so'zi" })),
    ...WORDS,
  ]
    .filter((w) => w.word.length >= 3)
    .forEach((entry) => {
      const key = normalize(entry.word)
      if (key && !map.has(key)) map.set(key, entry)
    })
  const all = Array.from(map.values())
  const filtered = all.filter((e) => fitDifficulty(e.word, difficulty))
  const pool = filtered.length >= 6 ? filtered : all
  const picked = shuffle(pool)
  return Array.from({ length: rounds }, (_, i) => {
    const e = picked[i % picked.length]
    const answer = sanitize(e.word)
    return {
      id: `jumla-${i + 1}-${Math.random().toString(36).slice(2, 8)}`,
      answer,
      scrambled: scrambleWord(answer).toUpperCase(),
      hint: e.hint,
      length: letterCount(answer),
    }
  })
}

const makeTeam = (tiles: string[] = []): TeamState => ({
  score: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  locked: false,
  status: 'waiting',
  note: TEAM_WAIT_NOTE,
  tiles: [...tiles],
  selectedTile: null,
  dragTargetTile: null,
})

function JumlaUstasiArena({
  gameTitle,
  gameTone,
  leftTeamName = '1-Jamoa',
  rightTeamName = '2-Jamoa',
  initialDifficulty = "O'rta",
  teacherWords = [],
  setupPath = '/games/jumla-ustasi',
}: Props) {
  const cfg = CONFIG[initialDifficulty]
  const [tasks, setTasks] = useState<Task[]>(() => buildDeck(initialDifficulty, teacherWords, cfg.rounds))
  const [roundIndex, setRoundIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(cfg.seconds)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [roundSettled, setRoundSettled] = useState(false)
  const [left, setLeft] = useState<TeamState>(() => makeTeam([]))
  const [right, setRight] = useState<TeamState>(() => makeTeam([]))
  const [statusText, setStatusText] = useState("Boshlashni bosing. Ikkala jamoa bir xil aralash so'zni topadi.")
  const [winner, setWinner] = useState<Side | 'draw' | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [confettiKey, setConfettiKey] = useState(0)

  const nextRoundTimerRef = useRef<number | null>(null)
  const dragFromRef = useRef<{ left: number | null; right: number | null }>({ left: null, right: null })
  const musicCtxRef = useRef<AudioContext | null>(null)
  const musicTimerRef = useRef<number | null>(null)
  const musicGainRef = useRef<GainNode | null>(null)
  const musicStepRef = useRef(0)

  const leftLabel = leftTeamName.trim() || '1-Jamoa'
  const rightLabel = rightTeamName.trim() || '2-Jamoa'
  const task = tasks[roundIndex]
  const totalRounds = tasks.length
  const progress = totalRounds ? Math.round(((roundIndex + (roundSettled || finished ? 1 : 0)) / totalRounds) * 100) : 0

  const clearNextRoundTimer = () => {
    if (nextRoundTimerRef.current) {
      window.clearTimeout(nextRoundTimerRef.current)
      nextRoundTimerRef.current = null
    }
  }

  const stopMusic = () => {
    if (musicTimerRef.current) {
      window.clearInterval(musicTimerRef.current)
      musicTimerRef.current = null
    }
    const ctx = musicCtxRef.current
    const gain = musicGainRef.current
    if (ctx && gain) {
      const now = ctx.currentTime
      gain.gain.cancelScheduledValues(now)
      gain.gain.setTargetAtTime(0.0001, now, 0.08)
    }
  }

  const playSoftNote = (ctx: AudioContext, freq: number, dur = 0.42) => {
    const master = musicGainRef.current
    if (!master) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur)
    osc.connect(gain)
    gain.connect(master)
    osc.start(now)
    osc.stop(now + dur + 0.02)
  }

  const startMusic = async () => {
    try {
      const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      if (!musicCtxRef.current) musicCtxRef.current = new Ctx()
      const ctx = musicCtxRef.current
      if (!ctx) return
      if (!musicGainRef.current) {
        const g = ctx.createGain()
        g.gain.value = 0.0001
        g.connect(ctx.destination)
        musicGainRef.current = g
      }
      if (ctx.state === 'suspended') await ctx.resume()
      const master = musicGainRef.current
      const now = ctx.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setTargetAtTime(0.03, now, 0.18)

      if (musicTimerRef.current) return
      const melody = [261.63, 293.66, 329.63, 293.66, 349.23, 329.63, 293.66, 261.63]
      musicStepRef.current = 0
      playSoftNote(ctx, melody[0], 0.45)
      musicTimerRef.current = window.setInterval(() => {
        const step = musicStepRef.current % melody.length
        musicStepRef.current += 1
        playSoftNote(ctx, melody[step], step % 4 === 0 ? 0.5 : 0.38)
      }, 680)
    } catch {
      // audio optional
    }
  }

  useEffect(() => () => {
    clearNextRoundTimer()
    stopMusic()
  }, [])

  const resetMatch = (autoStart: boolean) => {
    clearNextRoundTimer()
    if (!autoStart) stopMusic()
    const deck = buildDeck(initialDifficulty, teacherWords, cfg.rounds)
    const firstTiles = tilesFromScrambled(deck[0]?.scrambled ?? '')
    setTasks(deck)
    setRoundIndex(0)
    setTimeLeft(cfg.seconds)
    setStarted(autoStart)
    setFinished(false)
    setRoundSettled(false)
    setLeft(makeTeam(firstTiles))
    setRight(makeTeam(firstTiles))
    setWinner(null)
    setShowModal(false)
    setStatusText(autoStart ? "Bellashuv boshlandi. Harflarni almashtirib so'zni toping." : "Boshlashni bosing. Ikkala jamoa bir xil aralash so'zni topadi.")
    if (autoStart) void startMusic()
  }

  const finishMatch = (message: string) => {
    clearNextRoundTimer()
    stopMusic()
    setStarted(false)
    setFinished(true)
    setRoundSettled(true)
    setStatusText(message)
    const w: Side | 'draw' =
      left.score > right.score ? 'left'
        : right.score > left.score ? 'right'
          : left.correct > right.correct ? 'left'
            : right.correct > left.correct ? 'right'
              : 'draw'
    setWinner(w)
    setShowModal(true)
    setConfettiKey((v) => v + 1)
  }

  useEffect(() => {
    if (!started || finished || roundSettled) return
    const id = window.setInterval(() => setTimeLeft((v) => Math.max(0, v - 1)), 1000)
    return () => window.clearInterval(id)
  }, [started, finished, roundSettled])

  useEffect(() => {
    if (!started || finished || roundSettled || timeLeft > 0) return
    setLeft((t) => ({ ...t, locked: true, status: 'timeout', selectedTile: null, dragTargetTile: null, note: 'Vaqt tugadi.' }))
    setRight((t) => ({ ...t, locked: true, status: 'timeout', selectedTile: null, dragTargetTile: null, note: 'Vaqt tugadi.' }))
    setRoundSettled(true)
    setStatusText(`Vaqt tugadi. To'g'ri javob: ${task?.answer ?? '-'}`)
  }, [timeLeft, started, finished, roundSettled, task])

  useEffect(() => {
    if (!roundSettled || finished) return
    clearNextRoundTimer()
    nextRoundTimerRef.current = window.setTimeout(() => {
      nextRoundTimerRef.current = null
      if (roundIndex >= totalRounds - 1) {
        finishMatch("Barcha raundlar tugadi. G'olib aniqlandi.")
        return
      }
      const nextIndex = roundIndex + 1
      const nextTask = tasks[nextIndex]
      const tiles = tilesFromScrambled(nextTask?.scrambled ?? '')
      setRoundIndex(nextIndex)
      setTimeLeft(cfg.seconds)
      setRoundSettled(false)
      setLeft((t) => ({ ...t, ...makeTeam(tiles), score: t.score, correct: t.correct, streak: t.streak, bestStreak: t.bestStreak }))
      setRight((t) => ({ ...t, ...makeTeam(tiles), score: t.score, correct: t.correct, streak: t.streak, bestStreak: t.bestStreak }))
      setStatusText("Yangi raund ochildi. Harflar joyini almashtirib toping.")
    }, cfg.autoNextMs)
    return () => clearNextRoundTimer()
  }, [roundSettled, finished, roundIndex, totalRounds, tasks, cfg.seconds, cfg.autoNextMs, left.score, right.score, left.correct, right.correct])

  const swapIndices = (team: TeamState, from: number, to: number, note = "Joyi almashdi. Tekshir bosing."): TeamState => {
    if (from === to) return { ...team, selectedTile: null, dragTargetTile: null, note: TEAM_WAIT_NOTE }
    const fromChar = team.tiles[from]
    const toChar = team.tiles[to]
    if (!fromChar || !toChar || fromChar === ' ' || toChar === ' ' || !isLetter(fromChar) || !isLetter(toChar)) {
      return { ...team, selectedTile: null, dragTargetTile: null }
    }
    const tiles = [...team.tiles]
    ;[tiles[from], tiles[to]] = [tiles[to], tiles[from]]
    return { ...team, tiles, selectedTile: null, dragTargetTile: null, note }
  }

  const swapTile = (side: Side, index: number) => {
    if (!started || finished || roundSettled) return
    const setter = side === 'left' ? setLeft : setRight
    setter((team) => {
      if (team.locked) return team
      const char = team.tiles[index]
      if (!char || char === ' ' || !isLetter(char)) return team
      if (team.selectedTile === null) return { ...team, selectedTile: index, dragTargetTile: null, note: '2-harfni tanlang, joyi almashadi.' }
      if (team.selectedTile === index) return { ...team, selectedTile: null, dragTargetTile: null, note: TEAM_WAIT_NOTE }
      return swapIndices(team, team.selectedTile, index)
    })
  }

  const submitTeam = (side: Side) => {
    if (!started || finished || roundSettled || !task) return
    const target = normalize(task.answer)
    const team = side === 'left' ? left : right
    if (team.locked) return
    const built = normalize(team.tiles.join(''))

    if (built === target) {
      const speedBonus = Math.max(0, Math.floor(timeLeft / 5)) * cfg.speedUnit
      if (side === 'left') {
        setLeft((t) => {
          const streak = t.streak + 1
          const gain = cfg.basePoints + speedBonus + (streak > 1 ? cfg.streakBonus : 0)
          return { ...t, locked: true, status: 'correct', correct: t.correct + 1, streak, bestStreak: Math.max(t.bestStreak, streak), score: t.score + gain, note: `To'g'ri! +${gain} ball`, selectedTile: null, dragTargetTile: null }
        })
        setRight((t) => ({ ...t, locked: true, selectedTile: null, dragTargetTile: null, note: `${leftLabel} birinchi topdi.` }))
        setStatusText(`${leftLabel} birinchi bo'lib to'g'ri topdi.`)
      } else {
        setRight((t) => {
          const streak = t.streak + 1
          const gain = cfg.basePoints + speedBonus + (streak > 1 ? cfg.streakBonus : 0)
          return { ...t, locked: true, status: 'correct', correct: t.correct + 1, streak, bestStreak: Math.max(t.bestStreak, streak), score: t.score + gain, note: `To'g'ri! +${gain} ball`, selectedTile: null, dragTargetTile: null }
        })
        setLeft((t) => ({ ...t, locked: true, selectedTile: null, dragTargetTile: null, note: `${rightLabel} birinchi topdi.` }))
        setStatusText(`${rightLabel} birinchi bo'lib to'g'ri topdi.`)
      }
      setRoundSettled(true)
      return
    }

    if (side === 'left') {
      setLeft((t) => ({ ...t, status: 'wrong', streak: 0, selectedTile: null, dragTargetTile: null, note: "Noto'g'ri. Yana urinib ko'ring." }))
      setStatusText(`${leftLabel} noto'g'ri joylashtirdi. ${rightLabel} hali topishi mumkin.`)
    } else {
      setRight((t) => ({ ...t, status: 'wrong', streak: 0, selectedTile: null, dragTargetTile: null, note: "Noto'g'ri. Yana urinib ko'ring." }))
      setStatusText(`${rightLabel} noto'g'ri joylashtirdi. ${leftLabel} hali topishi mumkin.`)
    }
  }

  const shuffleTeamTiles = (side: Side) => {
    if (!started || finished || roundSettled) return
    const setter = side === 'left' ? setLeft : setRight
    setter((t) => {
      if (t.locked) return t
      const letters = t.tiles.filter((c) => c !== ' ')
      const spaces = t.tiles.map((c) => c === ' ')
      const mixed = shuffle(letters)
      let ptr = 0
      const next = spaces.map((isSp) => (isSp ? ' ' : mixed[ptr++]))
      return { ...t, tiles: next, selectedTile: null, dragTargetTile: null, note: 'Harflar qayta aralashtirildi.' }
    })
  }

  const handleTileDragStart = (side: Side, index: number) => {
    if (!started || finished || roundSettled) return
    const team = side === 'left' ? left : right
    if (team.locked) return
    const char = team.tiles[index]
    if (!char || char === ' ' || !isLetter(char)) return
    dragFromRef.current[side] = index
    const setter = side === 'left' ? setLeft : setRight
    setter((t) => ({ ...t, selectedTile: index, dragTargetTile: null, note: 'Harfni sudrab boshqa harfga tashlang.' }))
  }

  const handleTileDragEnter = (side: Side, index: number) => {
    const setter = side === 'left' ? setLeft : setRight
    setter((t) => {
      if (t.locked || t.selectedTile === null || t.selectedTile === index) return t
      const char = t.tiles[index]
      if (!char || char === ' ' || !isLetter(char)) return t
      return { ...t, dragTargetTile: index }
    })
  }

  const handleTileDrop = (side: Side, index: number) => {
    if (!started || finished || roundSettled) return
    const from = dragFromRef.current[side]
    dragFromRef.current[side] = null
    if (from === null) return
    const setter = side === 'left' ? setLeft : setRight
    setter((t) => {
      if (t.locked) return t
      return swapIndices(t, from, index, "Sudrab joyi almashtirildi. Tekshir bosing.")
    })
  }

  const handleTileDragEnd = (side: Side) => {
    dragFromRef.current[side] = null
    const setter = side === 'left' ? setLeft : setRight
    setter((t) => ({ ...t, dragTargetTile: null, selectedTile: null, note: t.locked ? t.note : TEAM_WAIT_NOTE }))
  }

  const renderTiles = (side: Side, team: TeamState) => (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {team.tiles.map((ch, i) => ch === ' ' ? (
        <span key={`${side}-sp-${i}`} className="mx-1 inline-block w-4" />
      ) : (
        <button
          key={`${side}-${i}-${ch}`}
          type="button"
          onClick={() => swapTile(side, i)}
          draggable={started && !finished && !roundSettled && !team.locked}
          onDragStart={() => handleTileDragStart(side, i)}
          onDragEnter={() => handleTileDragEnter(side, i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleTileDrop(side, i)
          }}
          onDragEnd={() => handleTileDragEnd(side)}
          disabled={!started || finished || roundSettled || team.locked}
          className={`grid h-11 min-w-[2.6rem] place-items-center rounded-2xl border px-2 text-lg font-black transition ${
            team.dragTargetTile === i
              ? 'border-cyan-300 bg-cyan-100 text-cyan-800 shadow-soft ring-2 ring-cyan-200'
              : team.selectedTile === i
                ? 'border-amber-300 bg-amber-100 text-amber-800 shadow-soft -translate-y-1 ring-2 ring-amber-200'
                : 'border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-cyan-300'
          } ${!started || finished || roundSettled || team.locked ? 'cursor-not-allowed opacity-90' : ''}`}
        >
          {ch}
        </button>
      ))}
    </div>
  )

  const renderPanel = (side: Side, label: string, team: TeamState, tone: string, shell: string) => (
    <article className={`arena-3d-panel rounded-[1.7rem] border p-4 shadow-soft ${shell}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-kid text-3xl text-slate-900">{label}</h3>
        <span className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-extrabold text-white ${tone}`}>{team.score} ball</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">To'g'ri<p className="mt-1 text-lg font-black text-slate-800">{team.correct}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">Combo<p className="mt-1 text-lg font-black text-slate-800">{team.bestStreak}</p></div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-center text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Harflar paneli</p>
        {renderTiles(side, team)}
        <p className="mt-2 text-center text-[11px] font-bold text-slate-500">
          Sudrab tashlang yoki 2 ta harfni bosib joyini almashtiring
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => submitTeam(side)}
          disabled={!started || finished || roundSettled || team.locked}
          className={`arena-3d-press rounded-2xl bg-gradient-to-r px-4 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition ${tone} ${
            !started || finished || roundSettled || team.locked ? 'cursor-not-allowed opacity-75' : 'hover:-translate-y-0.5'
          }`}
        >
          Tekshir
        </button>
        <button
          type="button"
          onClick={() => shuffleTeamTiles(side)}
          disabled={!started || finished || roundSettled || team.locked}
          className={`arena-3d-press rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-700 transition ${
            !started || finished || roundSettled || team.locked ? 'cursor-not-allowed opacity-75' : 'hover:-translate-y-0.5'
          }`}
        >
          Aralashtir
        </button>
      </div>

      <p className={`mt-3 rounded-xl border px-3 py-2 text-sm font-extrabold ${
        team.status === 'correct' ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : team.status === 'wrong' ? 'border-rose-300 bg-rose-50 text-rose-700'
            : team.status === 'timeout' ? 'border-amber-300 bg-amber-50 text-amber-700'
              : 'border-slate-200 bg-white text-slate-600'
      }`}>
        {team.note}
      </p>
    </article>
  )

  const winnerLabel = winner === 'left' ? leftLabel : winner === 'right' ? rightLabel : 'Durang'

  return (
    <section className="glass-card arena-3d-shell relative p-4 sm:p-6" data-aos="fade-up" data-aos-delay="80">
      <div className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full bg-cyan-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-56 w-56 rounded-full bg-fuchsia-200/30 blur-3xl" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-700">Jumla Ustasi Race</p>
          <h2 className="mt-2 font-kid text-4xl text-slate-900 sm:text-5xl">{gameTitle}</h2>
          <p className="mt-1 text-base font-bold text-slate-600">Harflar joyini almashtirib so'zni topish. Kim birinchi topsa o'sha raundni oladi.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={setupPath} className="arena-3d-press rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5">{'< '}Orqaga</Link>
          <button type="button" onClick={() => resetMatch(true)} className={`arena-3d-press rounded-xl bg-gradient-to-r px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}>O'yinni boshlash</button>
          <button type="button" onClick={() => resetMatch(false)} className="arena-3d-press rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5">Tozalash</button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Daraja</p><p className="mt-1 text-xl font-extrabold text-slate-800">{initialDifficulty}</p></div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Raund</p><p className="mt-1 text-xl font-extrabold text-slate-800">{totalRounds ? `${Math.min(roundIndex + 1, totalRounds)}/${totalRounds}` : '0/0'}</p></div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Timer</p><p className={`mt-1 text-xl font-extrabold ${timeLeft <= 5 && started && !roundSettled ? 'text-rose-600' : 'text-slate-800'}`}>{started && !finished ? `${timeLeft}s` : `${cfg.seconds}s`}</p></div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Harf</p><p className="mt-1 text-xl font-extrabold text-slate-800">{task ? task.length : '-'}</p></div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{leftLabel}</p><p className="mt-1 text-xl font-extrabold text-slate-800">{left.score}</p></div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{rightLabel}</p><p className="mt-1 text-xl font-extrabold text-slate-800">{right.score}</p></div>
      </div>

      <div className="arena-3d-panel mt-4 rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Aralash so'z (umumiy)</p>
            <p className="mt-1 text-base font-bold text-slate-600">Har ikkala jamoa shu bir xil so'zni yechadi.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-700">{teacherWords.length} ta custom so'z</span>
            {task ? <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-600">Hint: {task.hint}</span> : null}
          </div>
        </div>
        <div className={`mt-4 rounded-[1.4rem] bg-gradient-to-r p-4 sm:p-5 ${gameTone}`}>
          <div className="relative rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur-sm">
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.35),transparent_45%)]" />
            <div className="relative">
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">{started && !finished ? 'Faol raund' : 'Tayyor'}</span>
                <span className="rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">{timeLeft}s</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {(task?.scrambled ?? '').split('').map((ch, i) => ch === ' '
                  ? <span key={`global-sp-${i}`} className="mx-1 inline-block w-4 sm:w-6" />
                  : <span key={`${ch}-${i}`} className={`grid h-10 min-w-[2.5rem] place-items-center rounded-2xl border border-white/60 bg-gradient-to-br ${TONES[i % TONES.length]} px-2 text-lg font-black text-white shadow-soft sm:h-11 sm:min-w-[2.8rem] sm:text-xl`}>{ch}</span>)}
              </div>
              <p className="mt-4 text-center text-xs font-extrabold uppercase tracking-[0.12em] text-white/90">2 ta harfni bosib joyini almashtiring</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500"><span>Progress</span><span>{progress}%</span></div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full bg-gradient-to-r ${gameTone}`} style={{ width: `${progress}%` }} /></div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {renderPanel('left', leftLabel, left, 'from-cyan-500 to-blue-500', 'border-cyan-200 bg-cyan-50/35')}
        {renderPanel('right', rightLabel, right, 'from-fuchsia-500 to-rose-500', 'border-fuchsia-200 bg-fuchsia-50/35')}
      </div>

      <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-extrabold ${finished ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-cyan-200 bg-cyan-50 text-cyan-700'}`}>{statusText}</div>

      {showModal && winner ? (
        <div className="fixed inset-0 z-[98] grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <ConfettiOverlay burstKey={confettiKey} variant={winner === 'draw' ? 'lose' : 'win'} pieces={winner === 'draw' ? 96 : 150} />
          <div className="relative z-[2] w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/75 bg-white/95 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.35)] sm:p-6">
            <div className="relative">
              <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">Jumla ustasi yakunlandi</p>
              <h3 className="mt-3 font-kid text-4xl leading-tight text-slate-900 sm:text-5xl">{winnerLabel === 'Durang' ? 'Durang natija' : `G'olib: ${winnerLabel}`}</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{leftLabel}</p><p className="mt-1 text-2xl font-black text-slate-800">{left.score}</p><p className="text-sm font-bold text-slate-500">{left.correct} ta to'g'ri | combo {left.bestStreak}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{rightLabel}</p><p className="mt-1 text-2xl font-black text-slate-800">{right.score}</p><p className="text-sm font-bold text-slate-500">{right.correct} ta to'g'ri | combo {right.bestStreak}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5">Yopish</button>
                <button type="button" onClick={() => resetMatch(true)} className={`rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}>Yana o'ynash</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default JumlaUstasiArena
