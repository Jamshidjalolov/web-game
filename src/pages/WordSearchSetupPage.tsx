import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FooterCTA from '../components/FooterCTA.tsx'
import Navbar from '../components/Navbar.tsx'
import { findGameById } from '../data/games.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'

type DifficultyInfo = {
  size: string
  words: number
  seconds: number
}

const difficultyInfo: Record<Difficulty, DifficultyInfo> = {
  Oson: { size: '8x8', words: 7, seconds: 150 },
  "O'rta": { size: '10x10', words: 9, seconds: 190 },
  Qiyin: { size: '12x12', words: 11, seconds: 230 },
}

function WordSearchSetupPage() {
  const navigate = useNavigate()
  const game = findGameById('soz-qidiruv')
  const [difficulty, setDifficulty] = useState<Difficulty>("O'rta")
  const [teamOne, setTeamOne] = useState('1-Jamoa')
  const [teamTwo, setTeamTwo] = useState('2-Jamoa')
  const [formHint, setFormHint] = useState('')

  const info = useMemo(() => difficultyInfo[difficulty], [difficulty])

  const handleOpenArena = () => {
    const cleanTeamOne = teamOne.trim()
    const cleanTeamTwo = teamTwo.trim()

    if (!cleanTeamOne || !cleanTeamTwo) {
      setFormHint('Ikkala jamoa nomini ham kiriting.')
      return
    }

    const params = new URLSearchParams({
      difficulty,
      team1: cleanTeamOne,
      team2: cleanTeamTwo,
    })

    navigate(`/games/soz-qidiruv/arena?${params.toString()}`)
  }

  if (!game) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-6">
          <section className="mb-6 rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-soft backdrop-blur-xl sm:p-7" data-aos="fade-up">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-cyan-700">
                  Setup Mode
                </p>
                <h1 className="mt-3 font-kid text-5xl leading-tight text-slate-900 sm:text-6xl">
                  {game.title}
                </h1>
                <p className="mt-3 text-lg font-bold text-slate-600">
                  Avval daraja va jamoalarni tanlang. O'yin alohida arena sahifada ochiladi.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className={`rounded-full bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${game.tone}`}>
                    {game.category}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {difficulty} daraja
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    Har jamoaga {info.words} ta so'z
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/90 p-4 shadow-soft">
                <img
                  src={game.image}
                  alt="So'z qidiruv preview"
                  className="h-64 w-full rounded-[1.25rem] object-cover object-center"
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]" data-aos="fade-up" data-aos-delay="60">
            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">O'yin haqida</h2>
              <p className="mt-3 text-lg font-bold leading-relaxed text-slate-600">
                Har jamoa o'z maydonida so'zlarni qidiradi. So'z boshini va oxirini bosib topiladi.
                Vaqt tugaganda eng ko'p ball olgan jamoa g'olib bo'ladi.
              </p>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Tanlangan rejim</p>
                <p className="mt-2 font-kid text-5xl text-slate-900">{difficulty}</p>
                <p className="text-sm font-bold text-slate-500">
                  Maydon: {info.size}, vaqt: {Math.floor(info.seconds / 60)}:{String(info.seconds % 60).padStart(2, '0')}
                </p>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-extrabold text-slate-800">Jamoa nomlari</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    value={teamOne}
                    onChange={(event) => setTeamOne(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                    placeholder="1-Jamoa"
                  />
                  <input
                    value={teamTwo}
                    onChange={(event) => setTeamTwo(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                    placeholder="2-Jamoa"
                  />
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
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Maydon</p>
                  <p className="mt-1 text-base font-extrabold text-slate-700">{info.size}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">So'zlar</p>
                  <p className="mt-1 text-base font-extrabold text-slate-700">{info.words} ta</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Vaqt</p>
                  <p className="mt-1 text-base font-extrabold text-slate-700">
                    {Math.floor(info.seconds / 60)}:{String(info.seconds % 60).padStart(2, '0')}
                  </p>
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

        <FooterCTA />
      </div>
    </div>
  )
}

export default WordSearchSetupPage
