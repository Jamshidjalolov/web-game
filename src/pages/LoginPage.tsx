import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { Link, useNavigate } from 'react-router-dom'
import joinSideImage from '../assets/join-side.svg'
import {
  AUTH_SESSION_CHANGE_EVENT,
  loginWithEmailPassword,
  loginWithFirebaseToken,
  loadStoredAuthSession,
  registerWithEmailPassword,
} from '../lib/backend.ts'
import {
  activeFirebaseAuthDomain,
  activeFirebaseProjectId,
  firebaseAuth,
  googleProvider,
  isFirebaseConfigured,
} from '../lib/firebase.ts'

const toFirebaseUiErrorMessage = (error: unknown) => {
  const fallback = error instanceof Error ? error.message : "Google orqali kirishda xatolik yuz berdi."
  const firebaseError = error as { code?: string } | null
  if (firebaseError?.code !== 'auth/unauthorized-domain') return fallback

  const domainHint = typeof window === 'undefined' ? 'joriy-domain' : window.location.hostname
  return `Firebase bu domenni ruxsat bermagan: ${domainHint}. Firebase Console -> Authentication -> Settings -> Authorized domains ga ${domainHint} ni qo'shing. Project: ${activeFirebaseProjectId}, authDomain: ${activeFirebaseAuthDomain}.`
}

function LoginPage() {
  const navigate = useNavigate()
  const [isLoginMode, setIsLoginMode] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [formHint, setFormHint] = useState('')
  const [errorText, setErrorText] = useState('')
  const googleAuthRequestRef = useRef<Promise<void> | null>(null)
  const handledFirebaseUidRef = useRef<string | null>(null)

  const completeFirebaseAuth = async (firebaseUserOrResult: UserCredential | User) => {
    const firebaseUser = 'user' in firebaseUserOrResult ? firebaseUserOrResult.user : firebaseUserOrResult
    const storedSession = loadStoredAuthSession()
    const normalizedEmail = firebaseUser.email?.trim().toLowerCase()

    if (
      storedSession?.accessToken
      && normalizedEmail
      && storedSession.user.email.trim().toLowerCase() === normalizedEmail
    ) {
      handledFirebaseUidRef.current = firebaseUser.uid
      navigate('/', { replace: true })
      return
    }

    if (handledFirebaseUidRef.current === firebaseUser.uid) {
      navigate('/', { replace: true })
      return
    }

    if (googleAuthRequestRef.current) {
      await googleAuthRequestRef.current
      return
    }

    googleAuthRequestRef.current = (async () => {
      const idToken = await firebaseUser.getIdToken(true)
      await loginWithFirebaseToken(idToken)
      handledFirebaseUidRef.current = firebaseUser.uid
      navigate('/', { replace: true })
    })()

    try {
      await googleAuthRequestRef.current
    } finally {
      googleAuthRequestRef.current = null
    }
  }

  useEffect(() => {
    const syncSession = () => {
      if (loadStoredAuthSession()?.accessToken) {
        navigate('/', { replace: true })
      }
    }

    syncSession()

    const syncSessionFromEvent: EventListener = () => {
      syncSession()
    }

    window.addEventListener('storage', syncSession)
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, syncSessionFromEvent)
    return () => {
      window.removeEventListener('storage', syncSession)
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, syncSessionFromEvent)
    }
  }, [navigate])

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) return
    const auth = firebaseAuth
    let isCancelled = false

    const restoreSessionFromFirebaseUser = async (firebaseUser: User | null) => {
      if (isCancelled || !firebaseUser) return

      setIsGoogleLoading(true)
      setErrorText('')
      try {
        await completeFirebaseAuth(firebaseUser)
      } catch (error) {
        if (isCancelled) return
        const message = toFirebaseUiErrorMessage(error)
        setErrorText(message)
      } finally {
        if (!isCancelled) {
          setIsGoogleLoading(false)
        }
      }
    }

    const restoreSessionFromRedirect = async () => {
      try {
        const authResult = await getRedirectResult(auth)
        if (isCancelled) return
        if (authResult) {
          await restoreSessionFromFirebaseUser(authResult.user)
          return
        }

        if (auth.currentUser && !loadStoredAuthSession()?.accessToken) {
          await restoreSessionFromFirebaseUser(auth.currentUser)
        }
      } catch (error) {
        if (isCancelled) return
        const message = toFirebaseUiErrorMessage(error)
        setErrorText(message)
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser || loadStoredAuthSession()?.accessToken) return
      void restoreSessionFromFirebaseUser(firebaseUser)
    })

    void restoreSessionFromRedirect()

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [navigate])

  const handleEmailSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormHint('')
    setErrorText('')

    const cleanEmail = email.trim()
    if (!cleanEmail || !password.trim()) {
      setErrorText('Email va parolni kiriting.')
      return
    }
    if (!isLoginMode && fullName.trim().length < 2) {
      setErrorText("Ro'yxatdan o'tish uchun ism kiriting.")
      return
    }

    setIsEmailLoading(true)
    try {
      if (isLoginMode) {
        await loginWithEmailPassword({ email: cleanEmail, password })
      } else {
        await registerWithEmailPassword({
          fullName: fullName.trim(),
          email: cleanEmail,
          password,
        })
      }
      navigate('/', { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kirishda xatolik yuz berdi.'
      setErrorText(message)
    } finally {
      setIsEmailLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setErrorText("Firebase sozlanmagan. `.env` faylda VITE_FIREBASE_* qiymatlarini kiriting.")
      return
    }

    setFormHint('')
    setErrorText('')
    setIsGoogleLoading(true)

    try {
      await signInWithRedirect(firebaseAuth, googleProvider)
      return
    } catch (error) {
      const message = toFirebaseUiErrorMessage(error)
      setErrorText(message)
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="login-page-root relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_20%_0%,#cffafe_0%,#eff6ff_42%,#fef3c7_100%)] p-3 sm:p-4">
      <div className="pointer-events-none absolute -left-28 top-8 h-60 w-60 rounded-full bg-cyan-300/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-fuchsia-300/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-6 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-200/45 blur-3xl" />

      <Link
        to="/"
        className="absolute left-3 right-3 top-3 z-20 inline-flex items-center justify-center gap-2 rounded-full border border-white/75 bg-white/80 px-4 py-2 text-sm font-extrabold text-slate-700 backdrop-blur-sm transition hover:bg-white sm:left-4 sm:right-auto sm:top-4"
      >
        {'<'} Bosh sahifa
      </Link>

      <div className="login-page-shell relative mx-auto mt-12 min-h-[calc(100dvh-4.5rem)] max-w-6xl overflow-hidden rounded-[1.8rem] border border-white/80 bg-white/70 shadow-[0_42px_68px_-42px_rgba(15,23,42,0.65)] backdrop-blur-xl sm:mt-0 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[2.1rem]">
        <div className="grid min-h-full lg:grid-cols-[1.08fr_0.92fr]">
          <aside className="relative hidden lg:block">
            <img
              src={joinSideImage}
              alt="Premium ta'lim platformasi ilustratsiyasi"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-slate-900/15 to-transparent" />

            <div className="absolute left-6 right-6 top-6 rounded-2xl border border-white/35 bg-white/18 p-4 text-white backdrop-blur-sm">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-cyan-100">
                Premium platforma
              </p>
              <p className="mt-2 font-kid text-4xl leading-tight">
                O'yin bilan tez o'rganish
              </p>
            </div>

            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/35 bg-white/18 p-4 text-white backdrop-blur-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-cyan-100">
                Natija
              </p>
              <p className="mt-2 text-base font-bold text-white/90">
                320+ interaktiv o'yin va minglab faol foydalanuvchilar bilan
                dars sifati oshadi.
              </p>
            </div>
          </aside>

          <section className="login-form-shell flex h-full items-center bg-white/94 px-4 py-6 sm:px-6 sm:py-8 lg:py-4">
            <div className="mx-auto w-full max-w-md">
              <p className="inline-flex rounded-full border border-sky-100 bg-sky-50 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-sky-700">
                Bizga qo'shiling
              </p>
              <h1 className="mt-3 font-kid text-4xl leading-tight text-slate-900 sm:text-5xl">
                {isLoginMode ? 'Akkauntga kirish' : 'Bepul boshlash'}
              </h1>
              <p className="mt-2 text-sm font-bold text-slate-500 sm:text-base">
                {isLoginMode
                  ? "Email va parol orqali akkauntingizga kiring."
                  : "Profil yarating va bolalar uchun eng qiziqarli o'yinlarni darhol sinab ko'ring."}
              </p>

              <form className="mt-4 space-y-3" onSubmit={handleEmailSignup}>
                {!isLoginMode ? (
                  <label className="block">
                    <span className="mb-1 block text-sm font-extrabold text-slate-700">
                      To'liq ism
                    </span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="To'liq ismingiz"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-200"
                    />
                  </label>
                ) : null}

                <label className="block">
                  <span className="mb-1 block text-sm font-extrabold text-slate-700">
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email kiriting"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-200"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-extrabold text-slate-700">
                    Parol
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Parol kiriting"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-200"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isEmailLoading}
                  className="mt-1 h-12 w-full rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 px-5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:saturate-125"
                >
                  {isEmailLoading
                    ? 'Yuborilmoqda...'
                    : (isLoginMode ? 'Kirish' : "Ro'yxatdan o'tish")}
                </button>
              </form>

              {formHint ? (
                <p className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-800">
                  {formHint}
                </p>
              ) : null}

              {errorText ? (
                <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
                  {errorText}
                </p>
              ) : null}

              <div className="mt-4 flex items-center gap-3 text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.14em]">
                  yoki davom eting
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isGoogleLoading || isEmailLoading}
                className="mt-3 inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border-2 border-sky-500 bg-white px-5 text-sm font-extrabold text-sky-700 transition hover:bg-sky-50"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-100 text-xs">
                  G
                </span>
                {isGoogleLoading
                  ? 'Google ulanish...'
                  : (isLoginMode ? 'Google orqali kirish' : "Google orqali ro'yxatdan o'tish")}
              </button>

              <p className="mt-4 text-center text-sm font-bold text-slate-500">
                {isLoginMode ? "Akkauntingiz yo'qmi?" : 'Akkauntingiz bormi?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode((prev) => !prev)
                    setFormHint('')
                    setErrorText('')
                  }}
                  className="font-extrabold text-sky-600 hover:text-sky-700"
                >
                  {isLoginMode ? "Ro'yxatdan o'tish" : 'Kirish'}
                </button>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
