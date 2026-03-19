import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AOS from 'aos'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import GamesPage from './pages/GamesPage.tsx'
import QuestionManagerPage from './pages/QuestionManagerPage.tsx'
import GamePlayPage from './pages/GamePlayPage.tsx'
import TugOfWarSetupPage from './pages/TugOfWarSetupPage.tsx'
import TugOfWarArenaPage from './pages/TugOfWarArenaPage.tsx'
import WordSearchSetupPage from './pages/WordSearchSetupPage.tsx'
import WordSearchArenaPage from './pages/WordSearchArenaPage.tsx'
import PuzzleSetupPage from './pages/PuzzleSetupPage.tsx'
import PuzzleArenaPage from './pages/PuzzleArenaPage.tsx'
import VisualBrainTeasersSetupPage from './pages/VisualBrainTeasersSetupPage.tsx'
import VisualBrainTeasersArenaPage from './pages/VisualBrainTeasersArenaPage.tsx'
import BarabanSetupPage from './pages/BarabanSetupPage.tsx'
import BarabanArenaPage from './pages/BarabanArenaPage.tsx'
import FlagFinderSetupPage from './pages/FlagFinderSetupPage.tsx'
import FlagFinderArenaPage from './pages/FlagFinderArenaPage.tsx'
import EnglishWordSetupPage from './pages/EnglishWordSetupPage.tsx'
import EnglishWordArenaPage from './pages/EnglishWordArenaPage.tsx'
import MemoryChainSetupPage from './pages/MemoryChainSetupPage.tsx'
import MemoryChainArenaPage from './pages/MemoryChainArenaPage.tsx'
import RanglarOlamiSetupPage from './pages/RanglarOlamiSetupPage.tsx'
import RanglarOlamiArenaPage from './pages/RanglarOlamiArenaPage.tsx'
import TopqirlikKvestSetupPage from './pages/TopqirlikKvestSetupPage.tsx'
import TopqirlikKvestArenaPage from './pages/TopqirlikKvestArenaPage.tsx'
import BoxBattleSetupPage from './pages/BoxBattleSetupPage.tsx'
import BoxBattleArenaPage from './pages/BoxBattleArenaPage.tsx'
import JumlaUstasiSetupPage from './pages/JumlaUstasiSetupPage.tsx'
import JumlaUstasiArenaPage from './pages/JumlaUstasiArenaPage.tsx'
import TezkorHisobSetupPage from './pages/TezkorHisobSetupPage.tsx'
import TezkorHisobArenaPage from './pages/TezkorHisobArenaPage.tsx'
import TezkorGuruhSetupPage from './pages/TezkorGuruhSetupPage.tsx'
import TezkorGuruhArenaPage from './pages/TezkorGuruhArenaPage.tsx'
import CarRacingMathSetupPage from './pages/CarRacingMathSetupPage.tsx'
import CarRacingMathArenaPage from './pages/CarRacingMathArenaPage.tsx'
import JumanjiSetupPage from './pages/JumanjiSetupPage.tsx'
import JumanjiArenaPage from './pages/JumanjiArenaPage.tsx'
import QuizBattleSetupPage from './pages/QuizBattleSetupPage.tsx'
import QuizBattleArenaPage from './pages/QuizBattleArenaPage.tsx'
import MillionaireSetupPage from './pages/MillionaireSetupPage.tsx'
import MillionaireArenaPage from './pages/MillionaireArenaPage.tsx'
import OneQuestionHundredAnswersSetupPage from './pages/OneQuestionHundredAnswersSetupPage.tsx'
import OneQuestionHundredAnswersArenaPage from './pages/OneQuestionHundredAnswersArenaPage.tsx'
import FakeOrFactProSetupPage from './pages/FakeOrFactProSetupPage.tsx'
import FakeOrFactProArenaPage from './pages/FakeOrFactProArenaPage.tsx'

const LOADER_TOTAL_MS = 1500
const ROUTE_SWITCH_MS = 1420
const START_COUNTDOWN_STEPS: Array<number | 'BOSHLA'> = [3, 2, 1, 'BOSHLA']
const THEME_STORAGE_KEY = 'game_web_ui_theme'
const THEME_CHANGE_EVENT = 'ui-theme-changed'
const NIGHT_ACCENT_STORAGE_KEY = 'game_web_ui_night_accent'
const NIGHT_ACCENT_CHANGE_EVENT = 'ui-night-accent-changed'
type UiTheme = 'day' | 'night'
type NightAccent = 'cyan' | 'gold'

const SETUP_ROUTE_PATHS = new Set([
  '/games/millioner',
  '/games/arqon-tortish',
  '/games/baraban-metodi',
  '/games/soz-qidiruv',
  '/games/inglizcha-soz',
  '/games/xotira-zanjiri',
  '/games/ranglar-olami',
  '/games/tezkor-hisob',
  '/games/tezkor-guruh',
  '/games/car-racing-math',
  '/games/jumanji',
  '/games/quiz-battle',
  '/games/one-question-100-answers',
  '/games/fake-or-fact-pro',
  '/games/box-jang',
  '/games/topqirlik-kvest',
  '/games/jumla-ustasi',
  '/games/puzzle-mozaika',
  '/games/visual-brain-teasers',
  '/games/bayroq-topish',
])

const START_GATE_DISABLED_PATHS = new Set([
  '/games/car-racing-math/arena',
])

const normalizeButtonText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\u2019\u0060]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

const isPlayableStartRoute = (pathname: string) => {
  if (START_GATE_DISABLED_PATHS.has(pathname)) return false
  if (pathname.endsWith('/arena')) return true
  if (!pathname.startsWith('/games/')) return false
  if (pathname === '/games') return false
  if (SETUP_ROUTE_PATHS.has(pathname)) return false
  const segments = pathname.split('/').filter(Boolean)
  return segments.length === 2
}

const isStartActionText = (text: string) => {
  if (!text) return false
  const blockedTokens = ['qayta', 'yana', 'orqaga', 'yopish', 'bepul', 'yangi raund', 'yangi poyga']
  if (blockedTokens.some((token) => text.includes(token))) return false

  return (
    text === 'boshlash'
    || text.includes('boshlash')
    || text.includes('boshlashni')
    || text.includes('boshlang')
    || text.includes('boshlab')
    || text === 'start'
    || text === "o'yinni boshlash"
    || text === 'raundni boshlash'
    || text === 'tez start'
    || text.includes("o'yinni boshlash")
    || text.includes('raundni boshlash')
    || text.includes('tez start')
    || text.includes('poygani boshlash')
  )
}

const isButtonVisible = (button: HTMLButtonElement) => {
  const rect = button.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return false
  const style = window.getComputedStyle(button)
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
}

const rankStartButton = (text: string) => {
  if (text === 'boshlash' || text.includes('boshlash')) return 0
  if (text === "o'yinni boshlash" || text.includes("o'yinni boshlash")) return 0
  if (text === 'raundni boshlash' || text.includes('raundni boshlash')) return 1
  if (text === 'tez start' || text.includes('tez start')) return 2
  if (text.includes('poygani boshlash')) return 3
  if (text === 'start') return 4
  return 9
}

const findStartActionButton = () => {
  const ranked = Array.from(document.querySelectorAll('button'))
    .map((button) => button as HTMLButtonElement)
    .filter((button) => !button.disabled && isButtonVisible(button))
    .map((button) => {
      const text = normalizeButtonText(button.textContent ?? '')
      return {
        button,
        text,
        rank: rankStartButton(text),
        bottom: button.getBoundingClientRect().bottom,
      }
    })
    .filter((entry) => isStartActionText(entry.text))
    .sort((a, b) => a.rank - b.rank || b.bottom - a.bottom)

  return ranked[0]?.button ?? null
}

const loadInitialTheme = (): UiTheme => {
  if (typeof window === 'undefined') return 'day'
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
  return saved === 'night' ? 'night' : 'day'
}

const loadInitialNightAccent = (): NightAccent => {
  if (typeof window === 'undefined') return 'cyan'
  return window.localStorage.getItem(NIGHT_ACCENT_STORAGE_KEY) === 'gold' ? 'gold' : 'cyan'
}

function App() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [startGateVisible, setStartGateVisible] = useState(false)
  const [startCountdown, setStartCountdown] = useState<number | 'BOSHLA' | null>(null)
  const [uiTheme, setUiTheme] = useState<UiTheme>(() => loadInitialTheme())
  const [nightAccent, setNightAccent] = useState<NightAccent>(() => loadInitialNightAccent())
  const hasMountedRef = useRef(false)
  const bypassStartInterceptRef = useRef(false)
  const startGateBusyRef = useRef(false)
  const startCountdownTimerRef = useRef<number | null>(null)
  const startLaunchTimerRef = useRef<number | null>(null)

  const clearStartGateTimers = () => {
    if (startCountdownTimerRef.current) {
      window.clearTimeout(startCountdownTimerRef.current)
      startCountdownTimerRef.current = null
    }
    if (startLaunchTimerRef.current) {
      window.clearTimeout(startLaunchTimerRef.current)
      startLaunchTimerRef.current = null
    }
  }

  const loaderMessage = useMemo(() => {
    const messages = [
      "Qiziqarli o'yinlar tayyorlanmoqda",
      "Rangli topshiriqlar yuklanmoqda",
      "Yangi mini-sarguzasht ochilmoqda",
    ]
    const hash = Array.from(location.pathname).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0,
    )
    return messages[hash % messages.length]
  }, [location.pathname])

  useEffect(() => {
    AOS.init({
      duration: 750,
      easing: 'ease-out-cubic',
      once: true,
      offset: 80,
      mirror: false,
    })
  }, [])

  useEffect(() => {
    AOS.refresh()
  }, [location.pathname])

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      return
    }

    setIsTransitioning(true)

    const nextLocation = location
    const switchRouteTimer = window.setTimeout(() => {
      setDisplayLocation(nextLocation)
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }, ROUTE_SWITCH_MS)

    const finishTransitionTimer = window.setTimeout(() => {
      setIsTransitioning(false)
    }, LOADER_TOTAL_MS)

    return () => {
      window.clearTimeout(switchRouteTimer)
      window.clearTimeout(finishTransitionTimer)
    }
  }, [location.pathname])

  useEffect(() => {
    clearStartGateTimers()
    startGateBusyRef.current = false
    bypassStartInterceptRef.current = false
    setStartCountdown(null)
    setStartGateVisible(isPlayableStartRoute(displayLocation.pathname))
  }, [displayLocation.pathname])

  useEffect(() => () => {
    clearStartGateTimers()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(THEME_STORAGE_KEY, uiTheme)
    document.documentElement.setAttribute('data-theme', uiTheme)
  }, [uiTheme])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(NIGHT_ACCENT_STORAGE_KEY, nightAccent)
    document.documentElement.setAttribute('data-night-accent', nightAccent)
  }, [nightAccent])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        setUiTheme(event.newValue === 'night' ? 'night' : 'day')
      }
      if (event.key === NIGHT_ACCENT_STORAGE_KEY) {
        setNightAccent(event.newValue === 'gold' ? 'gold' : 'cyan')
      }
    }
    const handleThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<UiTheme>).detail
      if (detail === 'day' || detail === 'night') {
        setUiTheme(detail)
      } else {
        setUiTheme(loadInitialTheme())
      }
    }
    const handleNightAccentChange = (event: Event) => {
      const detail = (event as CustomEvent<NightAccent>).detail
      if (detail === 'cyan' || detail === 'gold') {
        setNightAccent(detail)
      } else {
        setNightAccent(loadInitialNightAccent())
      }
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener)
    window.addEventListener(NIGHT_ACCENT_CHANGE_EVENT, handleNightAccentChange as EventListener)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener)
      window.removeEventListener(NIGHT_ACCENT_CHANGE_EVENT, handleNightAccentChange as EventListener)
    }
  }, [])

  const triggerStartAction = (button?: HTMLButtonElement | null) => {
    const target = button ?? findStartActionButton()
    if (!target) return
    bypassStartInterceptRef.current = true
    target.click()
    window.setTimeout(() => {
      bypassStartInterceptRef.current = false
    }, 0)
  }

  const runStartCountdown = (onDone: () => void) => {
    if (startGateBusyRef.current) return
    startGateBusyRef.current = true
    clearStartGateTimers()

    let index = 0
    setStartCountdown(START_COUNTDOWN_STEPS[index])

    const advance = () => {
      index += 1
      if (index >= START_COUNTDOWN_STEPS.length) {
        setStartCountdown(null)
        startGateBusyRef.current = false
        onDone()
        return
      }
      setStartCountdown(START_COUNTDOWN_STEPS[index])
      const stepDelay = START_COUNTDOWN_STEPS[index] === 'BOSHLA' ? 620 : 760
      startCountdownTimerRef.current = window.setTimeout(advance, stepDelay)
    }

    startCountdownTimerRef.current = window.setTimeout(advance, 760)
  }

  const handleGateStartClick = () => {
    runStartCountdown(() => {
      setStartGateVisible(false)
      startLaunchTimerRef.current = window.setTimeout(() => {
        triggerStartAction()
      }, 110)
    })
  }

  const handleRouteStageClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!isPlayableStartRoute(displayLocation.pathname)) return
    if (bypassStartInterceptRef.current || startGateBusyRef.current) return

    const rawTarget = event.target
    if (!(rawTarget instanceof HTMLElement)) return
    const button = rawTarget.closest('button') as HTMLButtonElement | null
    if (!button) return
    if (button.dataset.startGateButton === 'true') return
    if (button.disabled || !isButtonVisible(button)) return

    const text = normalizeButtonText(button.textContent ?? '')
    if (!isStartActionText(text)) return

    event.preventDefault()
    event.stopPropagation()
    runStartCountdown(() => {
      setStartGateVisible(false)
      startLaunchTimerRef.current = window.setTimeout(() => {
        triggerStartAction(button)
      }, 110)
    })
  }

  return (
    <div className={`route-shell ${uiTheme === 'night' ? `premium-dark premium-dark--${nightAccent}` : 'premium-light'}`}>
      <div
        className={`route-stage ${isTransitioning ? 'route-stage--out' : 'route-stage--in'}`}
        onClickCapture={handleRouteStageClickCapture}
      >
        <Routes location={displayLocation}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/questions" element={<QuestionManagerPage />} />
          <Route path="/games/millioner" element={<MillionaireSetupPage />} />
          <Route path="/games/millioner/arena" element={<MillionaireArenaPage />} />
          <Route path="/games/arqon-tortish" element={<TugOfWarSetupPage />} />
          <Route path="/games/arqon-tortish/arena" element={<TugOfWarArenaPage />} />
          <Route path="/games/baraban-metodi" element={<BarabanSetupPage />} />
          <Route path="/games/baraban-metodi/arena" element={<BarabanArenaPage />} />
          <Route path="/games/soz-qidiruv" element={<WordSearchSetupPage />} />
          <Route path="/games/soz-qidiruv/arena" element={<WordSearchArenaPage />} />
          <Route path="/games/inglizcha-soz" element={<EnglishWordSetupPage />} />
          <Route path="/games/inglizcha-soz/arena" element={<EnglishWordArenaPage />} />
          <Route path="/games/xotira-zanjiri" element={<MemoryChainSetupPage />} />
          <Route path="/games/xotira-zanjiri/arena" element={<MemoryChainArenaPage />} />
          <Route path="/games/ranglar-olami" element={<RanglarOlamiSetupPage />} />
          <Route path="/games/ranglar-olami/arena" element={<RanglarOlamiArenaPage />} />
          <Route path="/games/tezkor-hisob" element={<TezkorHisobSetupPage />} />
          <Route path="/games/tezkor-hisob/arena" element={<TezkorHisobArenaPage />} />
          <Route path="/games/tezkor-guruh" element={<TezkorGuruhSetupPage />} />
          <Route path="/games/tezkor-guruh/arena" element={<TezkorGuruhArenaPage />} />
          <Route path="/games/car-racing-math" element={<CarRacingMathSetupPage />} />
          <Route path="/games/car-racing-math/arena" element={<CarRacingMathArenaPage />} />
          <Route path="/games/jumanji" element={<JumanjiSetupPage />} />
          <Route path="/games/jumanji/arena" element={<JumanjiArenaPage />} />
          <Route path="/games/quiz-battle" element={<QuizBattleSetupPage />} />
          <Route path="/games/quiz-battle/arena" element={<QuizBattleArenaPage />} />
          <Route path="/games/one-question-100-answers" element={<OneQuestionHundredAnswersSetupPage />} />
          <Route path="/games/one-question-100-answers/arena" element={<OneQuestionHundredAnswersArenaPage />} />
          <Route path="/games/fake-or-fact-pro" element={<FakeOrFactProSetupPage />} />
          <Route path="/games/fake-or-fact-pro/arena" element={<FakeOrFactProArenaPage />} />
          <Route path="/games/box-jang" element={<BoxBattleSetupPage />} />
          <Route path="/games/box-jang/arena" element={<BoxBattleArenaPage />} />
          <Route path="/games/topqirlik-kvest" element={<TopqirlikKvestSetupPage />} />
          <Route path="/games/topqirlik-kvest/arena" element={<TopqirlikKvestArenaPage />} />
          <Route path="/games/jumla-ustasi" element={<JumlaUstasiSetupPage />} />
          <Route path="/games/jumla-ustasi/arena" element={<JumlaUstasiArenaPage />} />
          <Route path="/games/puzzle-mozaika" element={<PuzzleSetupPage />} />
          <Route path="/games/puzzle-mozaika/arena" element={<PuzzleArenaPage />} />
          <Route path="/games/visual-brain-teasers" element={<VisualBrainTeasersSetupPage />} />
          <Route path="/games/visual-brain-teasers/arena" element={<VisualBrainTeasersArenaPage />} />
          <Route path="/games/bayroq-topish" element={<FlagFinderSetupPage />} />
          <Route path="/games/bayroq-topish/arena" element={<FlagFinderArenaPage />} />
          <Route path="/games/:gameId" element={<GamePlayPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <div className={`route-loader ${isTransitioning ? 'show' : ''}`} aria-hidden={!isTransitioning}>
        <div className="route-loader-card">
          <div className="route-loader-ring" />
          <div className="route-loader-ring route-loader-ring-delay" />
          <div className="route-loader-core">GO</div>
          <p className="mt-5 text-center text-sm font-extrabold tracking-[0.14em] text-slate-600">
            {loaderMessage}
          </p>
          <div className="route-loader-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="route-loader-progress" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>

      {startGateVisible || startCountdown !== null ? (
        <div className="arena-start-gate" aria-live="polite">
          <div className="arena-start-gate-glow arena-start-gate-glow-left" />
          <div className="arena-start-gate-glow arena-start-gate-glow-right" />

          {startCountdown !== null ? (
            <div className="arena-start-gate-count-shell">
              <div key={String(startCountdown)} className="arena-start-gate-count">
                {startCountdown}
              </div>
            </div>
          ) : (
            <div className="arena-start-gate-card">
              <p className="arena-start-gate-chip">Arena boshlanishi</p>
              <h3>Jamoalar tayyormi?</h3>
              <p>Boshlash tugmasi pastda. Bosilganda o&apos;yin chiroyli 3-2-1 bilan boshlanadi.</p>
            </div>
          )}

          <div className="arena-start-gate-dock">
            <button
              type="button"
              data-start-gate-button="true"
              onClick={handleGateStartClick}
              disabled={startCountdown !== null}
              className="arena-start-gate-button"
            >
              {startCountdown !== null ? 'Tayyorlaning...' : "O'yinni boshlash"}
            </button>
          </div>
        </div>
      ) : null}

    </div>
  )
}

export default App
