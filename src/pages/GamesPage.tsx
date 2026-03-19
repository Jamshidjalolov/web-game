import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.tsx'
import FooterCTA from '../components/FooterCTA.tsx'
import { gameCategories, games, type Category, type GameItem } from '../data/games.ts'
import { AUTH_SESSION_CHANGE_EVENT, fetchGamesCatalog, loadStoredAuthSession } from '../lib/backend.ts'

function GamesPage() {
  const [catalog, setCatalog] = useState<GameItem[]>(games)
  const [activeCategory, setActiveCategory] = useState<Category>('Hammasi')
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(loadStoredAuthSession()?.accessToken))

  useEffect(() => {
    const syncAuth = () => setIsAuthenticated(Boolean(loadStoredAuthSession()?.accessToken))
    const syncAuthFromEvent: EventListener = () => syncAuth()

    window.addEventListener('storage', syncAuth)
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, syncAuthFromEvent)
    return () => {
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, syncAuthFromEvent)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadCatalog = async () => {
      try {
        const remoteCatalog = await fetchGamesCatalog()
        if (!isMounted) return
        if (remoteCatalog.length > 0) {
          setCatalog(remoteCatalog)
        }
        setCatalogError('')
      } catch (error) {
        if (!isMounted) return
        const errorMessage = error instanceof Error ? error.message : "Katalogni yuklashda xatolik yuz berdi."
        setCatalogError(errorMessage)
      } finally {
        if (isMounted) {
          setIsLoadingCatalog(false)
        }
      }
    }

    void loadCatalog()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredGames = useMemo(() => {
    if (activeCategory === 'Hammasi') {
      return catalog
    }
    return catalog.filter((game) => game.category === activeCategory)
  }, [activeCategory, catalog])

  return (
    <div className="games-page-root relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#f2f8ff_0%,#eefcff_42%,#fff6dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_14%,rgba(56,189,248,0.28),transparent_20%),radial-gradient(circle_at_90%_18%,rgba(244,114,182,0.2),transparent_23%),radial-gradient(circle_at_20%_84%,rgba(250,204,21,0.2),transparent_22%),radial-gradient(circle_at_84%_80%,rgba(74,222,128,0.2),transparent_22%)]" />
      <div className="pointer-events-none absolute -left-16 top-32 h-52 w-52 rounded-full bg-cyan-200/55 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-24 h-52 w-52 rounded-full bg-rose-200/55 blur-3xl" />

      <div className="relative z-10">
        <Navbar />

        <main id="oyinlar" className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6">
          <section
            className="games-hero-shell relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-soft backdrop-blur-xl sm:p-8"
            data-aos="fade-up"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-amber-200/35 blur-3xl" />

            <div className="relative grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div data-aos="fade-right">
                <p className="inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-700">
                  Interaktiv o'yinlar markazi
                </p>
                <h1 className="mt-4 max-w-3xl font-kid text-5xl leading-tight text-slate-900 sm:text-6xl">
                  Darsni o'yinga aylantiradigan premium o'yinlar sahifasi
                </h1>
                <p className="mt-4 max-w-3xl text-xl font-bold leading-relaxed text-slate-500">
                  Qiziqarli rasmli kartalar, kuchli hover animatsiyalar va turli yo'nalishdagi
                  topshiriqlar bilan o'rganish jarayoni yanada jonli bo'ladi.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {!isAuthenticated ? (
                    <Link
                      to="/login"
                      className="rounded-2xl bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-400 px-7 py-3.5 text-base font-extrabold text-white shadow-soft transition hover:-translate-y-1 hover:saturate-125"
                    >
                      Bepul boshlash
                    </Link>
                  ) : null}
                  <a
                    href="#all-games"
                    className="rounded-2xl border-2 border-cyan-300 bg-white px-7 py-3.5 text-base font-extrabold text-cyan-700 transition hover:-translate-y-1 hover:bg-cyan-50"
                  >
                    O'yinlarni ko'rish
                  </a>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2" data-aos="fade-left" data-aos-delay="100">
                <article className="premium-stat-card">
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">
                    O'yinlar
                  </p>
                  <p className="mt-2 font-kid text-4xl text-slate-900">{catalog.length}+</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">Doimiy yangilanadi</p>
                </article>
                <article className="premium-stat-card">
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">
                    Yo'nalish
                  </p>
                  <p className="mt-2 font-kid text-4xl text-slate-900">{gameCategories.length - 1}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">Har sinfga mos</p>
                </article>
                <article className="premium-stat-card sm:col-span-2">
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">
                    Faol foydalanish
                  </p>
                  <p className="mt-2 font-kid text-4xl text-slate-900">9.8k+</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    O'qituvchi va o'quvchilar har kuni foydalanmoqda
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section
            id="all-games"
            className="games-filter-shell mt-8 rounded-3xl border border-white/80 bg-white/75 p-5 shadow-soft backdrop-blur-xl sm:p-6"
            data-aos="fade-up"
            data-aos-delay="80"
          >
            {catalogError ? (
              <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                Backend katalog olinmadi: {catalogError}. Hozircha lokal ro'yxat ko'rsatilyapti.
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2.5">
                {gameCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full px-5 py-2.5 text-sm font-extrabold transition ${
                      activeCategory === category
                        ? 'bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 text-white shadow-soft'
                        : 'border border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <p className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-extrabold text-amber-700">
                {isLoadingCatalog ? "Yuklanmoqda..." : `${filteredGames.length} ta o'yin ko'rsatilmoqda`}
              </p>
            </div>
          </section>

          <section className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredGames.map((game, index) => (
              <article
                key={game.id}
                className="premium-game-card group"
                data-aos="fade-up"
                data-aos-delay={String(70 + (index % 6) * 70)}
              >
                <div className={`h-2 w-full bg-gradient-to-r ${game.tone}`} />

                <div className="premium-game-media">
                  <div className="premium-game-orb premium-game-orb-a" />
                  <div className="premium-game-orb premium-game-orb-b" />
                  <img
                    src={game.image}
                    alt={game.title}
                    className={`premium-game-image ${game.id === 'jumanji' ? 'premium-game-image-fill' : ''}`}
                    loading="lazy"
                  />
                </div>

                <div className="px-5 pb-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-extrabold text-white ${game.tone}`}>
                      {game.category}
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
                      {game.level}
                    </span>
                  </div>

                  <h3 className="font-kid text-4xl leading-tight text-slate-900">{game.title}</h3>
                  <p className="mt-2 text-lg font-bold leading-relaxed text-slate-600">{game.desc}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="premium-mini-stat">
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                        Foydalanish
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-slate-700">{game.players}</p>
                    </div>
                    <div className="premium-mini-stat">
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                        Davomiylik
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-slate-700">{game.duration}</p>
                    </div>
                  </div>

                  <Link
                    to={`/games/${game.id}`}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-5 py-3.5 text-lg font-extrabold text-white transition group-hover:-translate-y-0.5 ${game.tone}`}
                  >
                    O'yinni boshlash
                    <span className="transition group-hover:translate-x-1">{'>'}</span>
                  </Link>
                </div>
              </article>
            ))}
          </section>
        </main>

        <FooterCTA />
      </div>
    </div>
  )
}

export default GamesPage
