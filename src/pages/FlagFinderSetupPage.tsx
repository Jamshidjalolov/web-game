import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FooterCTA from '../components/FooterCTA.tsx'
import GameCommentsSection from '../components/GameCommentsSection.tsx'
import Navbar from '../components/Navbar.tsx'
import { findGameById } from '../data/games.ts'
import { DEFAULT_TEAM_NAMES, type TeamCount } from '../lib/teamMode.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'

type DifficultyInfo = {
  rounds: number
  time: number
  points: number
}

const difficultyInfo: Record<Difficulty, DifficultyInfo> = {
  Oson: { rounds: 8, time: 18, points: 12 },
  "O'rta": { rounds: 10, time: 14, points: 16 },
  Qiyin: { rounds: 12, time: 10, points: 22 },
}

function FlagFinderSetupPage() {
  const navigate = useNavigate()
  const game = findGameById('bayroq-topish')
  const [difficulty, setDifficulty] = useState<Difficulty>("O'rta")
  const [teamCount, setTeamCount] = useState<TeamCount>(2)
  const [teamNames, setTeamNames] = useState<string[]>([...DEFAULT_TEAM_NAMES])
  const [formHint, setFormHint] = useState('')

  const info = useMemo(() => difficultyInfo[difficulty], [difficulty])

  const handleOpenArena = () => {
    const activeTeamNames = teamNames.slice(0, teamCount).map((name) => name.trim())

    if (activeTeamNames.some((name) => !name)) {
      setFormHint(teamCount === 1 ? "Jamoa nomini kiriting." : 'Ikkala jamoa nomini ham kiriting.')
      return
    }

    const params = new URLSearchParams({
      difficulty,
      teamCount: String(teamCount),
    })
    activeTeamNames.forEach((name, index) => {
      params.set(`team${index + 1}`, name)
    })

    navigate(`/games/bayroq-topish/arena?${params.toString()}`)
  }

  if (!game) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#ecf7ff_0%,#f2fcff_44%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(20,184,166,0.18),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-6">
          <section className="mb-6 rounded-[2rem] border border-white/80 bg-white/82 p-5 shadow-soft backdrop-blur-xl sm:p-7" data-aos="fade-up">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-cyan-700">
                  Setup Mode
                </p>
                <h1 className="mt-3 font-kid text-5xl leading-tight text-slate-900 sm:text-6xl">
                  {game.title}
                </h1>
                <p className="mt-3 text-lg font-bold text-slate-600">
                  {teamCount === 1
                    ? "Bayroq rasmi chiqadi, siz ketma-ket bayroqlarni topib borasiz. Daraja oshsa vaqt qisqaradi va ball ko'payadi."
                    : "Bayroq rasmi chiqadi, ikkala jamoa bir vaqtda javob beradi. Har raundda yangi bayroqlar keladi, daraja oshsa vaqt qisqaradi va ball ko'payadi."}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className={`rounded-full bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${game.tone}`}>
                    {game.category}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {difficulty} daraja
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {info.rounds} ta raund
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/90 p-4 shadow-soft">
                <div className="grid h-64 place-items-center rounded-[1.25rem] border border-slate-200 bg-[linear-gradient(150deg,#f2f9ff_0%,#f0f9ff_48%,#fff7e2_100%)]">
                  <img src={game.image} alt={game.title} className="h-full w-full rounded-[1.25rem] object-contain object-center p-2" />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]" data-aos="fade-up" data-aos-delay="60">
            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">O'yin haqida</h2>
              <p className="mt-3 text-lg font-bold leading-relaxed text-slate-600">
                {teamCount === 1
                  ? "Har savolda yangi bayroq chiqadi. Vaqt tugaganda yoki barcha savollar yakunlanganda umumiy natijangiz ko'rsatiladi."
                  : "Har savolda har jamoaga alohida yangi bayroq chiqadi. Ikkalasi ham bir vaqtda javob beradi, raund oxirida eng ko'p ball olgan jamoa g'olib bo'ladi."}
              </p>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Tanlangan rejim</p>
                <p className="mt-2 font-kid text-5xl text-slate-900">{difficulty}</p>
                <p className="text-sm font-bold text-slate-500">
                  Raund: {info.rounds} ta, vaqt: {info.time}s, ball: +{info.points}
                </p>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-extrabold text-slate-800">Rejim va nomlar</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setTeamCount(1)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      teamCount === 1
                        ? `bg-gradient-to-r text-white shadow-soft ${game.tone}`
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <p className="text-sm font-extrabold">1 jamoa</p>
                    <p className={`mt-1 text-xs font-bold ${teamCount === 1 ? 'text-white/85' : 'text-slate-500'}`}>Yakka o'yin</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeamCount(2)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      teamCount === 2
                        ? `bg-gradient-to-r text-white shadow-soft ${game.tone}`
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <p className="text-sm font-extrabold">2 jamoa</p>
                    <p className={`mt-1 text-xs font-bold ${teamCount === 2 ? 'text-white/85' : 'text-slate-500'}`}>Bellashuv</p>
                  </button>
                </div>
                <div className={`mt-3 grid gap-3 ${teamCount === 2 ? 'sm:grid-cols-2' : ''}`}>
                  {Array.from({ length: teamCount }, (_, index) => (
                    <input
                      key={`flag-team-${index + 1}`}
                      value={teamNames[index] ?? ''}
                      onChange={(event) => {
                        const next = [...teamNames]
                        next[index] = event.target.value
                        setTeamNames(next)
                      }}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                      placeholder={teamCount === 1 ? "Jamoa yoki o'yinchi nomi" : `${index + 1}-Jamoa`}
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
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Daraja tanlash</h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
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

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Raund</p>
                  <p className="mt-1 text-base font-extrabold text-slate-700">{info.rounds} ta</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Vaqt</p>
                  <p className="mt-1 text-base font-extrabold text-slate-700">{info.time} soniya</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Ball</p>
                  <p className="mt-1 text-base font-extrabold text-slate-700">+{info.points}</p>
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

export default FlagFinderSetupPage
