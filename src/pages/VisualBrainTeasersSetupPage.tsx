import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FooterCTA from '../components/FooterCTA.tsx'
import GameCommentsSection from '../components/GameCommentsSection.tsx'
import Navbar from '../components/Navbar.tsx'
import { findGameById } from '../data/games.ts'
import { fetchVisualIqRanking, type VisualIqRankingEntry } from '../lib/backend.ts'
import {
  getVisualBrainTeasersByDifficulty,
  playableVisualBrainTeaserPuzzles,
  VISUAL_BRAIN_TEASER_CATEGORY_LABELS,
  VISUAL_BRAIN_TEASER_DIFFICULTY_CONFIG,
  VISUAL_BRAIN_TEASER_DIFFICULTY_LABELS,
} from '../visualBrainTeasers/data.ts'
import type { VisualBrainTeaserDifficulty } from '../visualBrainTeasers/types.ts'

const DIFFICULTIES: VisualBrainTeaserDifficulty[] = ['easy', 'medium', 'hard']
const DEFAULT_TEAM_NAMES = ['Topqirlar', 'Bilimdonlar']
type TeamCount = 1 | 2

function VisualBrainTeasersSetupPage() {
  const navigate = useNavigate()
  const game = findGameById('visual-brain-teasers')
  const [difficulty, setDifficulty] = useState<VisualBrainTeaserDifficulty>('hard')
  const [roundCount, setRoundCount] = useState(VISUAL_BRAIN_TEASER_DIFFICULTY_CONFIG.hard.rounds[0])
  const [teamCount, setTeamCount] = useState<TeamCount>(1)
  const [teamNames, setTeamNames] = useState(DEFAULT_TEAM_NAMES)
  const [formHint, setFormHint] = useState('')
  const [leaderboard, setLeaderboard] = useState<VisualIqRankingEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [leaderboardError, setLeaderboardError] = useState('')

  const difficultyConfig = useMemo(
    () => VISUAL_BRAIN_TEASER_DIFFICULTY_CONFIG[difficulty],
    [difficulty],
  )
  const difficultyCount = useMemo(
    () => getVisualBrainTeasersByDifficulty(difficulty).length,
    [difficulty],
  )
  const categoryStats = useMemo(() => {
    const counts = new Map<string, number>()
    for (const puzzle of playableVisualBrainTeaserPuzzles) {
      counts.set(puzzle.category, (counts.get(puzzle.category) ?? 0) + 1)
    }
    return Array.from(counts.entries())
  }, [])

  const activeTeamNames = useMemo(() => teamNames.slice(0, teamCount), [teamCount, teamNames])

  const estimatedMinutes = Math.max(1, Math.ceil((roundCount * (difficultyConfig.timerSeconds + 6)) / 60))

  useEffect(() => {
    let cancelled = false

    const loadLeaderboard = async () => {
      setLeaderboardLoading(true)
      setLeaderboardError('')

      try {
        const records = await fetchVisualIqRanking(10)
        if (!cancelled) {
          setLeaderboard(records)
        }
      } catch (error) {
        if (!cancelled) {
          setLeaderboard([])
          setLeaderboardError(error instanceof Error ? error.message : "Reytingni yuklab bo'lmadi.")
        }
      } finally {
        if (!cancelled) {
          setLeaderboardLoading(false)
        }
      }
    }

    void loadLeaderboard()

    return () => {
      cancelled = true
    }
  }, [])

  const handleDifficultyChange = (nextDifficulty: VisualBrainTeaserDifficulty) => {
    setDifficulty(nextDifficulty)
    const fallbackRoundCount = VISUAL_BRAIN_TEASER_DIFFICULTY_CONFIG[nextDifficulty].rounds[0]
    setRoundCount(fallbackRoundCount)
  }

  const handleStart = () => {
    const cleanTeamNames = activeTeamNames.map((name, index) => {
      const cleaned = name.trim()
      return cleaned || (index === 0 ? 'Topqirlar' : DEFAULT_TEAM_NAMES[index] || `Jamoa ${index + 1}`)
    })

    if (cleanTeamNames.some((name) => !name)) {
      setFormHint('Barcha jamoa nomlarini kiriting.')
      return
    }

    setFormHint('')

    const params = new URLSearchParams({
      difficulty,
      rounds: String(roundCount),
      teamCount: String(teamCount),
    })

    cleanTeamNames.forEach((name, index) => {
      params.set(`team${index + 1}`, name)
    })

    navigate(`/games/visual-brain-teasers/arena?${params.toString()}`)
  }

  if (!game) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#17315c_0%,transparent_30%),radial-gradient(circle_at_top_right,#4c1b53_0%,transparent_24%),linear-gradient(150deg,#06101f_0%,#0c1428_52%,#130d28_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.15),transparent_24%),radial-gradient(circle_at_28%_82%,rgba(96,165,250,0.16),transparent_28%)]" />

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-6">
          <section className="mb-6 rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-soft backdrop-blur-xl sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-cyan-100">
                  Rasmli mantiq
                </p>
                <h1 className="mt-3 font-kid text-5xl leading-tight text-white sm:text-6xl">
                  {game.title}
                </h1>
                <p className="mt-3 text-lg font-bold text-slate-200">
                  Rasmga qarab yechiladigan mantiqiy savollar to'plami. Hozir oldingi qiyin generator savollari qaytdi,
                  hard blokda 30 tadan ko'p puzzle bor va savollar har safar aralashib ochiladi.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className={`rounded-full bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${game.tone}`}>
                    {game.category}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-extrabold text-slate-100">
                    {playableVisualBrainTeaserPuzzles.length} ta rasmli savol
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-extrabold text-slate-100">
                    {estimatedMinutes} daqiqalik sessiya
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.8rem] border border-white/15 bg-white/10 p-4 shadow-soft">
                <img
                  src={game.image}
                  alt={game.title}
                  className="h-64 w-full rounded-[1.25rem] bg-slate-950/30 object-contain object-center p-4"
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
            <article className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-soft backdrop-blur-xl sm:p-6">
              <h2 className="font-kid text-4xl text-white sm:text-5xl">O'yin sozlamasi</h2>
              <p className="mt-3 text-lg font-bold leading-relaxed text-slate-200">
                Rejimni, nomlarni va darajani tanlang. Yakka o'yinda bitta panel ochiladi, duelda esa ikki jamoa bir xil savollarga javob beradi.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {([
                  {
                    count: 1 as TeamCount,
                    title: "Yakka o'yin",
                    text: "Bitta panel, aniq savol va bitta javob bloki bilan o'ynaladigan format.",
                  },
                  {
                    count: 2 as TeamCount,
                    title: "Duel o'yin",
                    text: "Chap va o'ng jamoa bir xil rasmli savolga navbat bilan javob beradigan format.",
                  },
                ]).map((mode) => (
                  <button
                    key={mode.count}
                    type="button"
                    onClick={() => setTeamCount(mode.count)}
                    className={`rounded-[1.6rem] border p-4 text-left transition ${
                      teamCount === mode.count
                        ? 'border-cyan-300/40 bg-cyan-400/12 shadow-soft'
                        : 'border-white/15 bg-white/5 hover:border-cyan-300/30 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-2xl font-kid text-white">{mode.title}</p>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-300">{mode.text}</p>
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-3xl border border-white/15 bg-slate-950/30 p-5">
                <p className="text-lg font-extrabold text-white">
                  {teamCount === 1 ? "O'yinchi nomi" : 'Jamoa nomlari'}
                </p>
                <div className={`mt-3 grid gap-3 ${teamCount === 2 ? 'sm:grid-cols-2' : ''}`}>
                  {Array.from({ length: teamCount }, (_, index) => (
                    <input
                      key={index}
                      value={teamNames[index] ?? ''}
                      onChange={(event) =>
                        setTeamNames((current) => {
                          const next = [...current]
                          next[index] = event.target.value
                          return next
                        })
                      }
                      className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-bold text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300"
                      placeholder={teamCount === 1 ? "Jamoa yoki o'yinchi nomi" : `Jamoa ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-slate-950/30 px-3 py-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Format</p>
                  <p className="mt-1 text-base font-extrabold text-white">{teamCount === 1 ? 'Yakka' : 'Duel'}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-slate-950/30 px-3 py-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Daraja</p>
                  <p className="mt-1 text-base font-extrabold text-white">{VISUAL_BRAIN_TEASER_DIFFICULTY_LABELS[difficulty]}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-slate-950/30 px-3 py-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Raund</p>
                  <p className="mt-1 text-base font-extrabold text-white">{roundCount} ta</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStart}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-4 text-xl font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${game.tone}`}
              >
                O'yinni boshlash
              </button>

              {formHint ? (
                <p className="mt-3 rounded-xl bg-rose-500/20 px-3 py-2 text-sm font-extrabold text-rose-100">
                  {formHint}
                </p>
              ) : null}
            </article>

            <article className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-soft backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-kid text-4xl text-white sm:text-5xl">O'yin preview</h2>
                <p className="text-sm font-extrabold text-slate-300">{difficultyCount} ta puzzle</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {DIFFICULTIES.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleDifficultyChange(level)}
                    className={`rounded-3xl border px-5 py-5 text-left transition ${
                      difficulty === level
                        ? 'border-cyan-300/40 bg-cyan-400/12 shadow-soft'
                        : 'border-white/15 bg-white/5 hover:border-cyan-300/30 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-2xl font-kid text-white">{VISUAL_BRAIN_TEASER_DIFFICULTY_LABELS[level]}</p>
                    <p className="mt-2 text-sm font-bold text-slate-300">
                      {VISUAL_BRAIN_TEASER_DIFFICULTY_CONFIG[level].timerSeconds}s, +{VISUAL_BRAIN_TEASER_DIFFICULTY_CONFIG[level].points} ball
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <p className="text-2xl font-kid text-white">Raund soni</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {difficultyConfig.rounds.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setRoundCount(count)}
                      className={`rounded-full px-5 py-3 text-lg font-extrabold transition ${
                        roundCount === count
                          ? `bg-gradient-to-r text-white shadow-soft ${game.tone}`
                          : 'bg-white/10 text-slate-200 hover:bg-white/15'
                      }`}
                    >
                      {count} ta
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/15 bg-slate-950/30 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">O'yin qanday ishlaydi</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-extrabold text-white">1. {roundCount} ta savol ochiladi</p>
                    <p className="mt-1 text-sm font-bold text-slate-300">O'yin hozir siz yuborgan yangi rasmli savollar bilan ishlaydi va savollar aralashib ochiladi.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-extrabold text-white">2. Rasm va variantlar birga chiqadi</p>
                    <p className="mt-1 text-sm font-bold text-slate-300">
                      Har savolda asosiy rasm ochiladi, javob uchun mos variantlar chiqadi va to'g'ri javob darhol tekshiriladi.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-extrabold text-white">3. Takror savollar chiqmaydi</p>
                    <p className="mt-1 text-sm font-bold text-slate-300">Pool tugamaguncha bir xil savol qaytmaydi. Duelda esa ikki jamoa bir xil savol uchun javob beradi.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/15 bg-slate-950/30 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">Kategoriyalar</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {categoryStats.map(([category, count]) => (
                    <div key={category} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-sm font-extrabold text-white">
                        {VISUAL_BRAIN_TEASER_CATEGORY_LABELS[category as keyof typeof VISUAL_BRAIN_TEASER_CATEGORY_LABELS]}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-300">{count} ta savol</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/15 bg-slate-950/30 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">Reyting Top 10</p>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-cyan-100">
                    IQ bo'yicha
                  </span>
                </div>

                {leaderboardLoading ? (
                  <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-bold text-slate-300">
                    Reyting yuklanmoqda...
                  </p>
                ) : leaderboardError ? (
                  <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-4 text-sm font-bold text-amber-50">
                    {leaderboardError}
                  </p>
                ) : leaderboard.length === 0 ? (
                  <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-bold text-slate-300">
                    Hozircha reyting bo'sh. Birinchi natijani yozing.
                  </p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border px-4 py-3 ${
                          index === 0
                            ? 'border-amber-300/30 bg-amber-400/12'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/40 text-sm font-black text-white">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-white">{entry.player_name}</p>
                          <p className="mt-1 text-xs font-bold text-slate-300">
                            {entry.age} yosh, {entry.correct_answers}/{entry.round_count} to'g'ri, tezlik {entry.speed_percent}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-white">{entry.iq_score}</p>
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-100">IQ</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <Link
                  to="/games"
                  className="inline-flex rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-extrabold text-slate-100 transition hover:-translate-y-0.5"
                >
                  Barcha o'yinlarga qaytish
                </Link>
              </div>
            </article>
          </section>
        </main>

        <div className="mx-auto max-w-[1320px] px-4 pb-10 sm:px-6">
          <GameCommentsSection gameId={game.id} gameTitle={game.title} />
        </div>
        <FooterCTA />
      </div>
    </div>
  )
}

export default VisualBrainTeasersSetupPage
