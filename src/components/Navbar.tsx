import { signOut } from 'firebase/auth'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AUTH_SESSION_CHANGE_EVENT, clearAuthSession, loadStoredAuthSession } from '../lib/backend.ts'
import { firebaseAuth } from '../lib/firebase.ts'

type NavItem = {
  label: string
  href: string
  isRoute?: boolean
}

const THEME_STORAGE_KEY = 'game_web_ui_theme'
const THEME_CHANGE_EVENT = 'ui-theme-changed'
type UiTheme = 'day' | 'night'

const loadInitialTheme = (): UiTheme => {
  if (typeof window === 'undefined') return 'day'
  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'night' ? 'night' : 'day'
}

const navItems: NavItem[] = [
  { label: 'Bosh sahifa', href: '/', isRoute: true },
  { label: "O'yinlar", href: '/games', isRoute: true },
  { label: 'Test tizimi', href: '/questions', isRoute: true },
  { label: 'Reyting', href: '/#liderlar' },
  { label: 'Hamjamiyat', href: '/#community' },
  { label: 'Aloqa', href: '/#aloqa' },
]

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState(() => loadStoredAuthSession())
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [uiTheme, setUiTheme] = useState<UiTheme>(() => loadInitialTheme())
  const menuRef = useRef<HTMLDivElement | null>(null)
  const mobileNavRef = useRef<HTMLDivElement | null>(null)

  const user = session?.user ?? null
  const isAuthenticated = Boolean(session?.accessToken && user)
  const isAdmin = user?.role === 'admin'

  const isNavItemActive = (item: NavItem) => {
    if (item.isRoute) {
      if (item.href === '/') return location.pathname === '/'
      return location.pathname === item.href
    }
    const hashTarget = item.href.split('#')[1]
    if (!hashTarget || location.pathname !== '/') return false
    return location.hash === `#${hashTarget}`
  }

  const avatarText = useMemo(() => {
    const first = user?.email?.trim().charAt(0)
    return first ? first.toUpperCase() : 'U'
  }, [user?.email])

  const avatarImage = useMemo(() => {
    const raw = user?.photo_url?.trim()
    return raw && raw.length > 0 ? raw : null
  }, [user?.photo_url])

  useEffect(() => {
    const syncSession = () => {
      setSession(loadStoredAuthSession())
    }

    const syncSessionFromEvent: EventListener = () => {
      syncSession()
    }

    window.addEventListener('storage', syncSession)
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, syncSessionFromEvent)
    return () => {
      window.removeEventListener('storage', syncSession)
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, syncSessionFromEvent)
    }
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
    setIsMobileNavOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return

      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false)
      }

      if (mobileNavRef.current && !mobileNavRef.current.contains(target)) {
        setIsMobileNavOpen(false)
      }
    }

    if (!isMenuOpen && !isMobileNavOpen) return
    window.addEventListener('mousedown', handleOutsideClick)
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isMenuOpen, isMobileNavOpen])

  useEffect(() => {
    const syncThemeFromStorage = () => {
      setUiTheme(loadInitialTheme())
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        syncThemeFromStorage()
      }
    }
    const handleThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<UiTheme>).detail
      if (detail === 'day' || detail === 'night') {
        setUiTheme(detail)
      } else {
        syncThemeFromStorage()
      }
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener)
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme: UiTheme = uiTheme === 'night' ? 'day' : 'night'
    setUiTheme(nextTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    window.dispatchEvent(new CustomEvent<UiTheme>(THEME_CHANGE_EVENT, { detail: nextTheme }))
  }

  const handleLogout = async () => {
    clearAuthSession()
    if (firebaseAuth) {
      try {
        await signOut(firebaseAuth)
      } catch {
        // no-op: backend session already cleared
      }
    }
    setIsMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 overflow-visible border-b border-white/70 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="nav-logo-glow grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-400 via-rose-400 to-orange-300 text-base font-extrabold text-white shadow-soft sm:h-12 sm:w-12 sm:text-lg">
            GO
          </span>
          <div className="min-w-0">
            <p className="truncate font-kid text-xl leading-none text-slate-900 sm:text-2xl">
              QiziqO'yin
            </p>
            <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.18em] text-fuchsia-600 sm:text-xs sm:tracking-[0.22em]">
              interaktiv platforma
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            item.isRoute ? (
              <Link
                key={item.label}
                to={item.href}
                className={`nav-link-primary font-extrabold text-slate-600 transition hover:text-sky-600 ${isNavItemActive(item) ? 'nav-link-primary-active' : ''}`}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className={`nav-link-primary font-extrabold text-slate-600 transition hover:text-sky-600 ${isNavItemActive(item) ? 'nav-link-primary-active' : ''}`}
              >
                {item.label}
              </a>
            )
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-700 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md md:hidden"
            aria-label={isMobileNavOpen ? "Menyuni yopish" : "Menyuni ochish"}
          >
            <span className="text-lg font-black">{isMobileNavOpen ? '×' : '☰'}</span>
          </button>

          {isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-100 text-lg font-black text-slate-700 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md"
                title={user.email}
              >
                {avatarImage ? (
                  <img src={avatarImage} alt={user.email} className="h-full w-full object-cover" />
                ) : (
                  <span>{avatarText}</span>
                )}
              </button>

              {isMenuOpen ? (
                <div className="absolute right-0 top-14 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
                  <p className="truncate text-sm font-extrabold text-slate-900">{user.email}</p>
                  <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    {isAdmin ? 'Admin' : 'Teacher'}
                  </p>

                  <Link
                    to="/questions"
                    className="mt-3 block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-extrabold text-slate-700 transition hover:bg-slate-100"
                  >
                    Test tizimi
                  </Link>

                  {isAdmin ? (
                    <Link
                      to="/admin"
                      className="mt-2 block rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-extrabold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      Admin panel
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => { void handleLogout() }}
                    className="mt-2 w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-left text-sm font-extrabold text-rose-700 transition hover:bg-rose-100"
                  >
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-400 p-[2px] md:block">
              <Link
                to="/login"
                className="block rounded-2xl bg-white px-5 py-3 font-extrabold text-rose-600 transition hover:bg-rose-50"
              >
                Bepul boshlash
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className={`theme-toggle-btn ${uiTheme === 'night' ? 'theme-toggle-btn--night' : 'theme-toggle-btn--day'}`}
            aria-label={uiTheme === 'night' ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
            title={uiTheme === 'night' ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
          >
            <span className="theme-toggle-thumb" aria-hidden="true" />
            <span className="theme-toggle-icon theme-toggle-icon-sun" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4.2" />
                <path d="M12 2.5v2.4M12 19.1v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" />
              </svg>
            </span>
            <span className="theme-toggle-icon theme-toggle-icon-moon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.2 14.1a8.6 8.6 0 0 1-10.3-10.3 9.2 9.2 0 1 0 10.3 10.3Z" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {isMobileNavOpen ? (
        <div
          ref={mobileNavRef}
          className="mx-4 mb-3 rounded-[1.6rem] border border-white/80 bg-white/90 p-3 shadow-soft backdrop-blur-xl md:hidden sm:mx-6"
        >
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              item.isRoute ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                    isNavItemActive(item)
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-soft'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                    isNavItemActive(item)
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-soft'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </a>
              )
            ))}
          </nav>

          {!isAuthenticated ? (
            <Link
              to="/login"
              className="mt-3 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-400 px-5 py-3 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
            >
              Bepul boshlash
            </Link>
          ) : isAdmin ? (
            <Link
              to="/admin"
              className="mt-3 flex w-full items-center justify-center rounded-2xl bg-indigo-50 px-5 py-3 text-sm font-extrabold text-indigo-700"
            >
              Admin panel
            </Link>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}

export default Navbar
