import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FooterCTA from '../components/FooterCTA.tsx'
import GameCommentsSection from '../components/GameCommentsSection.tsx'
import Navbar from '../components/Navbar.tsx'
import { findGameById } from '../data/games.ts'
import type { Difficulty, Operator } from '../components/PuzzleArena.tsx'
import puzzlePreviewImage from '../assets/games/puzzle-simple.svg'
import { DEFAULT_TEAM_NAMES, type TeamCount } from '../lib/teamMode.ts'

type OperationItem = {
  value: Operator
  label: string
  icon: string
}

const operations: OperationItem[] = [
  { value: '+', label: "Qo'shish", icon: '+' },
  { value: '-', label: 'Ayirish', icon: '-' },
  { value: 'x', label: "Ko'paytirish", icon: 'x' },
  { value: '/', label: "Bo'lish", icon: '/' },
]

const questionCountByDifficulty: Record<Difficulty, number> = {
  Oson: 14,
  "O'rta": 24,
  Qiyin: 34,
}

function PuzzleSetupPage() {
  const navigate = useNavigate()
  const game = findGameById('puzzle-mozaika')

  const [selectedOps, setSelectedOps] = useState<Operator[]>(['+', '-'])
  const [difficulty, setDifficulty] = useState<Difficulty>('Oson')
  const [teamCount, setTeamCount] = useState<TeamCount>(2)
  const [teamNames, setTeamNames] = useState<string[]>([...DEFAULT_TEAM_NAMES])
  const [formHint, setFormHint] = useState('')

  const selectedOperationLabels = useMemo(() => {
    return operations
      .filter((item) => selectedOps.includes(item.value))
      .map((item) => item.label)
      .join(', ')
  }, [selectedOps])

  const totalQuestions = questionCountByDifficulty[difficulty]

  const toggleOperation = (value: Operator) => {
    setFormHint('')
    setSelectedOps((prev) => {
      if (prev.includes(value)) {
        if (prev.length === 1) return prev
        return prev.filter((item) => item !== value)
      }
      return [...prev, value]
    })
  }

  const handleOpenArena = () => {
    const activeTeamNames = teamNames
      .slice(0, teamCount)
      .map((name, index) => name.trim() || DEFAULT_TEAM_NAMES[index])

    if (activeTeamNames.some((name) => !name)) {
      setFormHint(teamCount === 1 ? 'Jamoa nomini kiriting.' : 'Ikkala jamoa nomini ham kiriting.')
      return
    }

    if (selectedOps.length === 0) {
      setFormHint('Kamida 1 ta amal tanlang.')
      return
    }

    const params = new URLSearchParams({
      ops: selectedOps.join(','),
      difficulty,
      teamCount: String(teamCount),
      team1: activeTeamNames[0],
      team2: activeTeamNames[1] ?? '',
    })

    navigate(`/games/puzzle-mozaika/arena?${params.toString()}`)
  }

  if (!game) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#edf7ff_0%,#f4fcff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.2),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(79,70,229,0.15),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.16),transparent_22%)]" />

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-6">
          <section className="mb-6 rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-soft backdrop-blur-xl sm:p-7" data-aos="fade-up">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-cyan-700">
                  Setup Mode
                </p>
                <h1 className="mt-3 font-kid text-5xl leading-tight text-slate-900 sm:text-6xl">
                  {game.title}
                </h1>
                <p className="mt-3 text-lg font-bold text-slate-600">
                  Daraja va amallarni tanlang, keyin arena sahifasida alohida o'yinni ishga tushiring.
                  Oson rejim matematikasiz ishlaydi. {teamCount === 1 ? "Bitta jamoa bilan ham o'ynash mumkin." : "Ikki jamoa navbat bilan o'ynaydi."}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className={`rounded-full bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${game.tone}`}>
                    {game.category}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {selectedOps.length} ta amal
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {difficulty} daraja
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {teamCount === 1 ? '1 jamoa' : '2 jamoa'}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/90 p-4 shadow-soft">
                <img
                  src={puzzlePreviewImage}
                  alt="Puzzle reference"
                  className="h-64 w-full rounded-[1.25rem] object-cover object-center"
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]" data-aos="fade-up" data-aos-delay="60">
            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">O'yin haqida</h2>
              <p className="mt-3 text-lg font-bold leading-relaxed text-slate-600">
                {teamCount === 1
                  ? "Har to'g'ri javobdan keyin puzzle bo'lagi siljiydi. Jamoa puzzle'ni yakka o'ynaydi."
                  : "Har to'g'ri javobdan keyin puzzle bo'lagi siljiydi. Jamoalar navbat bilan javob beradi, eng ko'p ball olgan jamoa g'olib bo'ladi."}
              </p>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Tanlangan savollar</p>
                <p className="mt-2 font-kid text-6xl text-slate-900">{totalQuestions}</p>
                <p className="text-sm font-bold text-slate-500">Joriy amal va darajaga ko'ra</p>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-extrabold text-slate-800">O'yin rejimi</p>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setTeamCount(count as TeamCount)}
                        className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
                          teamCount === count
                            ? `bg-gradient-to-r text-white shadow-soft ${game.tone}`
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {count} jamoa
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`mt-4 grid gap-3 ${teamCount === 1 ? '' : 'sm:grid-cols-2'}`}>
                  {Array.from({ length: teamCount }, (_, index) => (
                    <input
                      key={`team-${index + 1}`}
                      value={teamNames[index] ?? ''}
                      onChange={(event) => setTeamNames((prev) => {
                        const next = [...prev]
                        next[index] = event.target.value
                        return next
                      })}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                      placeholder={DEFAULT_TEAM_NAMES[index] ?? `Jamoa ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenArena}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-4 text-xl font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${game.tone}`}
              >
                O'yinni boshlash
              </button>

              {formHint ? (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-700">
                  {formHint}
                </p>
              ) : null}
            </article>

            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Amal tanlash</h2>
                <p className="text-sm font-extrabold text-slate-400">{selectedOps.length} ta amal</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {operations.map((operation) => {
                  const active = selectedOps.includes(operation.value)
                  return (
                    <button
                      key={operation.value}
                      type="button"
                      onClick={() => toggleOperation(operation.value)}
                      className={`group flex items-center gap-4 rounded-3xl border px-5 py-5 text-left transition ${
                        active
                          ? 'border-cyan-400 bg-cyan-50 shadow-soft'
                          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300'
                      }`}
                    >
                      <span className={`grid h-14 w-14 place-items-center rounded-2xl text-4xl font-extrabold transition ${
                        active
                          ? `bg-gradient-to-r text-white ${game.tone}`
                          : 'bg-slate-100 text-slate-500 group-hover:bg-cyan-100 group-hover:text-cyan-700'
                      }`}>
                        {operation.icon}
                      </span>
                      <span className="text-3xl font-kid text-slate-900">{operation.label}</span>
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
                      onClick={() => setDifficulty(level)}
                      className={`rounded-full px-5 py-3 text-lg font-extrabold transition ${
                        difficulty === level
                          ? `bg-gradient-to-r text-white shadow-soft ${game.tone}`
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Tanlov</p>
                    <p className="mt-1 text-2xl font-kid text-slate-900">
                      {selectedOperationLabels || 'Tanlanmagan'}
                    </p>
                    <p className="mt-1 text-base font-bold text-slate-500">Daraja: {difficulty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Savollar</p>
                    <p className="mt-1 font-kid text-6xl text-slate-900">{totalQuestions}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Link
                  to="/games"
                  className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5"
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

export default PuzzleSetupPage
