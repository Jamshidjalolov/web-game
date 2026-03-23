import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AUTH_SESSION_CHANGE_EVENT, loadStoredAuthSession } from '../lib/backend.ts'

type FooterLink = {
  label: string
  href: string
  isRoute?: boolean
}

const usefulLinks: FooterLink[] = [
  { label: 'Xususiyatlar', href: '/#xususiyatlar' },
  { label: 'Qanday ishlaydi', href: '/#qanday-ishlaydi' },
  { label: 'Izohlar', href: '/#izohlar' },
  { label: "O'yinlar", href: '/games', isRoute: true },
]

const topGames: FooterLink[] = [
  { label: 'Baraban metodi', href: '/games/baraban-metodi', isRoute: true },
  { label: "So'z qidiruv o'yini", href: '/games/soz-qidiruv', isRoute: true },
  { label: 'Millioner o`yini', href: '/games/millioner', isRoute: true },
]

const newGames: FooterLink[] = [
  { label: "Inglizcha so'z o'yini", href: '/games/inglizcha-soz', isRoute: true },
  { label: "Arqon tortish o'yini", href: '/games/arqon-tortish', isRoute: true },
]

const TELEGRAM_URL = import.meta.env.VITE_TELEGRAM_URL || 'https://t.me/'
const INSTAGRAM_URL = import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/'

function FooterCTA() {
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

  return (
    <footer id="aloqa" className="mt-10">
      <section
        className="footer-neon-cta relative overflow-hidden bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 px-4 py-16 sm:px-6"
        data-aos="fade-up"
      >
        <div className="pointer-events-none absolute -left-16 top-6 h-36 w-36 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -right-10 bottom-4 h-44 w-44 rounded-full bg-amber-200/30 blur-2xl" />

        <div className="relative mx-auto max-w-5xl text-center text-white">
          <h3 className="font-kid text-[clamp(2.25rem,8vw,4.5rem)] leading-[1.02]">
            Ta'limingizni yangi bosqichga olib chiqmoqchimisiz?
          </h3>
          <p className="mx-auto mt-4 max-w-3xl text-base font-bold text-white/90 sm:text-lg lg:text-xl">
            Minglab o'quvchilar va ustozlar qiziqarli metodlar bilan natijaga
            erishmoqda.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="flex w-full items-center justify-center rounded-2xl bg-white px-8 py-4 text-base font-extrabold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-100 sm:w-auto sm:text-lg"
              >
                Bepul sinab ko'rish
              </Link>
            ) : (
              <Link
                to="/games"
                className="flex w-full items-center justify-center rounded-2xl bg-white px-8 py-4 text-base font-extrabold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-100 sm:w-auto sm:text-lg"
              >
                O'yinlarga o'tish
              </Link>
            )}
            <button className="footer-contact-button flex w-full items-center justify-center rounded-2xl border-2 border-white/80 bg-white/15 px-8 py-4 text-base font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/25 sm:w-auto sm:text-lg">
              Maslahat olish
            </button>
          </div>
        </div>
      </section>

      <section
        className="footer-glass-links bg-slate-100/90 px-4 py-12 sm:px-6"
        data-aos="fade-up"
        data-aos-delay="80"
      >
        <div className="mx-auto grid max-w-6xl gap-8 sm:gap-10 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <article>
            <Link to="/" className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-lg font-extrabold text-white shadow-soft">
                GO
              </span>
              <h4 className="font-kid text-[clamp(2rem,6vw,2.5rem)] text-slate-900">QiziqO'yin</h4>
            </Link>
            <p className="mt-4 max-w-xs text-base font-bold leading-relaxed text-slate-500 sm:text-lg xl:text-xl">
              Ta'limni barcha uchun qiziqarli va qulay qilamiz.
            </p>
          </article>

          <article>
            <h5 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Foydali linklar</h5>
            <ul className="mt-4 space-y-2">
              {usefulLinks.map((item) => (
                <li key={item.label}>
                  {item.isRoute ? (
                      <Link
                        to={item.href}
                        className="footer-link-item text-base font-bold text-slate-500 transition hover:text-sky-600 sm:text-lg xl:text-xl"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="footer-link-item text-base font-bold text-slate-500 transition hover:text-sky-600 sm:text-lg xl:text-xl"
                      >
                        {item.label}
                      </a>
                  )}
                </li>
              ))}
            </ul>
          </article>

          <article>
            <h5 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Top o'yinlar</h5>
            <ul className="mt-4 space-y-2">
              {topGames.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="footer-link-item text-base font-bold text-slate-500 transition hover:text-sky-600 sm:text-lg xl:text-xl"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </article>

          <article>
            <h5 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Yangi o'yinlar</h5>
            <ul className="mt-4 space-y-2">
              {newGames.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="footer-link-item text-base font-bold text-slate-500 transition hover:text-sky-600 sm:text-lg xl:text-xl"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-5 border-t border-slate-300 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-base font-bold text-slate-500 sm:text-lg">
            {new Date().getFullYear()} QiziqO'yin. Barcha huquqlar himoyalangan.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-5 py-3 text-base font-extrabold text-sky-700 transition hover:bg-sky-100 sm:w-auto sm:text-lg"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M21.944 4.495a1 1 0 0 0-1.042-.152L3.73 11.24a1 1 0 0 0 .09 1.87l3.87 1.23 1.23 3.87a1 1 0 0 0 1.87.09l6.897-17.172a1 1 0 0 0-.152-1.042ZM9.8 13.3l-2.58-.82 9.186-3.69L9.8 13.3Zm.9 2.9-.82-2.58 4.51-6.606-3.69 9.186Z" />
              </svg>
              Telegram kanalimiz
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link inline-flex w-full items-center justify-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-5 py-3 text-base font-extrabold text-pink-700 transition hover:bg-pink-100 sm:w-auto sm:text-lg"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5A3.95 3.95 0 0 0 7.75 20.2h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm8.95 2.15a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 7.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 1.8A2.7 2.7 0 1 0 14.7 12 2.7 2.7 0 0 0 12 9.3Z" />
              </svg>
              Instagram sahifamiz
            </a>
          </div>
        </div>
      </section>
    </footer>
  )
}

export default FooterCTA
