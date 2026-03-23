import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FooterCTA from '../components/FooterCTA.tsx'
import GameCommentsSection from '../components/GameCommentsSection.tsx'
import Navbar from '../components/Navbar.tsx'
import { findGameById } from '../data/games.ts'
import { DEFAULT_TEAM_NAMES, TeamCount } from '../lib/teamMode.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'

type DifficultyInfo = {
  rounds: number
  time: number
  desc: string
}

const DIFFICULTY_INFO: Record<Difficulty, DifficultyInfo> = {
  Oson: { rounds: 10, time: 20, desc: "Matn rangi va yozuv nomini ajratish" },
  "O'rta": { rounds: 12, time: 16, desc: "Panel rangi ham aralashadi, temp tezlashadi" },
  Qiyin: { rounds: 14, time: 13, desc: "Tezkor stroop race, ko'proq bonus raund" },
}

function RanglarOlamiSetupPage() {
  const navigate = useNavigate()
  const game = findGameById('ranglar-olami')
  const [difficulty, setDifficulty] = useState<Difficulty>("O'rta")
  const [teamCount, setTeamCount] = useState<TeamCount>(2)
  const [teamNames, setTeamNames] = useState<string[]>([...DEFAULT_TEAM_NAMES])
  const [formHint, setFormHint] = useState('')

  const info = useMemo(() => DIFFICULTY_INFO[difficulty], [difficulty])

  const openArena = () => {
    const activeTeamNames = teamNames
      .slice(0, teamCount)
      .map((name, index) => name.trim() || DEFAULT_TEAM_NAMES[index])
    if (activeTeamNames.some((name) => !name)) {
      setFormHint(teamCount === 1 ? 'Jamoa nomini kiriting.' : 'Ikkala jamoa nomini ham kiriting.')
      return
    }

    const params = new URLSearchParams({
      difficulty,
      teamCount: String(teamCount),
      team1: activeTeamNames[0],
    })
    if (teamCount === 2) {
      params.set('team2', activeTeamNames[1])
    }
    navigate(`/games/ranglar-olami/arena?${params.toString()}`)
  }

  if (!game) return null

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#fff8ec_0%,#fff7f1_35%,#eef7ff_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(251,146,60,0.18),transparent_24%),radial-gradient(circle_at_86%_18%,rgba(236,72,153,0.14),transparent_25%),radial-gradient(circle_at_24%_82%,rgba(56,189,248,0.16),transparent_24%)]" />
      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-6">
          <section className="mb-6 rounded-[2rem] border border-white/80 bg-white/82 p-5 shadow-soft backdrop-blur-xl sm:p-7" data-aos="fade-up">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-amber-700">
                  Setup Mode
                </p>
                <h1 className="mt-3 font-kid text-5xl leading-tight text-slate-900 sm:text-6xl">{game.title}</h1>
                <p className="mt-3 text-lg font-bold text-slate-600">
                  {teamCount === 1
                    ? "Rang kartalaridagi yozuv, matn rangi va panel rangini chalkashtirmasdan toping. Har raundda savolni o'zingiz yechasiz."
                    : "Rang kartalaridagi yozuv, matn rangi va panel rangini chalkashtirmasdan toping. Ikkala jamoaga ham bir xil savol chiqadi, kim tez topsa raundni oladi."}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className={`rounded-full bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${game.tone}`}>{game.category}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">{difficulty} daraja</span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">{info.rounds} raund</span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">{teamCount} jamoa</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/90 p-4 shadow-soft">
                <div className="grid h-64 gap-3 rounded-[1.25rem] border border-slate-200 bg-[linear-gradient(145deg,#fff7ed_0%,#ffffff_46%,#eff6ff_100%)] p-4 sm:grid-cols-2">
                  <img src={game.image} alt={game.title} className="col-span-full h-full w-full rounded-[1.25rem] object-contain object-center p-2" />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]" data-aos="fade-up" data-aos-delay="60">
            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">O'yin haqida</h2>
              <p className="mt-3 text-lg font-bold leading-relaxed text-slate-600">
                {teamCount === 1
                  ? "Bu o'yin Stroop usulida ishlaydi: karta ichida boshqa rang nomi yozilgan bo'ladi. Har savolda to'g'ri kartani topib ball yig'asiz."
                  : "Bu o'yin Stroop usulida ishlaydi: karta ichida boshqa rang nomi yozilgan bo'ladi. Bir jamoa xato qilsa, ikkinchisi javob beradi. Ikkalasi ham topolmasa keyingi savolga o'tiladi."}
              </p>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Tanlangan rejim</p>
                <p className="mt-2 font-kid text-5xl text-slate-900">{difficulty}</p>
                <p className="text-sm font-bold text-slate-500">Raund: {info.rounds} | Timer: {info.time}s</p>
                <p className="mt-1 text-sm font-bold text-amber-700">{info.desc}</p>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-lg font-extrabold text-slate-800">Jamoa rejimi</p>
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
                <div className={`mt-3 grid gap-3 ${teamCount === 2 ? 'sm:grid-cols-2' : ''}`}>
                  {teamNames.slice(0, teamCount).map((name, index) => (
                    <input
                      key={`team-${index + 1}`}
                      value={name}
                      onChange={(e) => setTeamNames((prev) => prev.map((item, itemIndex) => (
                        itemIndex === index ? e.target.value : item
                      )))}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-amber-400"
                      placeholder={DEFAULT_TEAM_NAMES[index]}
                    />
                  ))}
                </div>
              </div>

              <button type="button" onClick={openArena} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-4 text-xl font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${game.tone}`}>
                O'yinni boshlash
              </button>

              {formHint ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-700">{formHint}</p> : null}
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
                      difficulty === level ? `bg-gradient-to-r text-white shadow-soft ${game.tone}` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Raund</p>
                  <p className="mt-1 text-base font-extrabold text-slate-700">{info.rounds}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Timer</p>
                  <p className="mt-1 text-base font-extrabold text-slate-700">{info.time}s</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Ranglar</p>
                  <p className="mt-1 text-base font-extrabold text-slate-700">12 ta</p>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-extrabold text-slate-700">Faqat asosiy 12 rang ishlatiladi:</p>
                <p className="mt-2 text-sm font-bold leading-relaxed text-slate-500">
                  Qizil, Ko'k, Yashil, Sariq, To'q sariq, Binafsha, Pushti, Havorang, Jigarrang, Kulrang, Qora, Oq.
                </p>
              </div>

              <div className="mt-4">
                <Link to="/games" className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5">
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

export default RanglarOlamiSetupPage
