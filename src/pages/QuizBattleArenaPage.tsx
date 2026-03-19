import { Link, useLocation, useNavigate } from 'react-router-dom'
import QuizBattleApp from '../quizBattle/components/QuizBattleApp.tsx'
import QuizBattleBackdrop from '../quizBattle/components/QuizBattleBackdrop.tsx'
import { loadLastSetup, loadSessionConfig } from '../quizBattle/utils/storage.ts'

function QuizBattleArenaPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const sessionKey = params.get('session')
  const config = loadSessionConfig(sessionKey) ?? loadLastSetup()

  if (!config) {
    return (
      <div className="quizbattle-shell relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#060b1a_0%,#101834_56%,#1a1137_100%)] text-white">
        <QuizBattleBackdrop />
        <main className="quizbattle-empty-shell mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 text-center">
          <h1 className="quizbattle-empty-title font-kid text-6xl text-white sm:text-7xl">Savol Bellashuvi</h1>
          <p className="quizbattle-empty-copy mt-4 text-lg font-bold text-slate-300">
            Arena ochish uchun avval sozlamalar sahifasidan o`yinni boshlang.
          </p>
          <Link
            to="/games/quiz-battle"
            className="quizbattle-empty-cta mt-7 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-7 py-4 text-sm font-black uppercase tracking-[0.12em] text-white"
          >
            Sozlamaga qaytish
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="quizbattle-shell relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_10%,#112749_0%,transparent_30%),radial-gradient(circle_at_84%_16%,#2b1546_0%,transparent_32%),radial-gradient(circle_at_18%_84%,#0f3c53_0%,transparent_36%),linear-gradient(170deg,#040a17_0%,#0a1021_54%,#130b2a_100%)] text-white">
      <div className="quizbattle-shell-glow pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_14%,rgba(34,211,238,0.24),transparent_24%),radial-gradient(circle_at_90%_20%,rgba(232,121,249,0.18),transparent_26%),radial-gradient(circle_at_30%_86%,rgba(59,130,246,0.18),transparent_22%)]" />
      <QuizBattleBackdrop />

      <main className="quizbattle-page-main relative z-10 mx-auto max-w-[1400px] px-3 pb-8 pt-4 sm:px-5 sm:pt-5">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/games/quiz-battle')}
            className="quizbattle-back-btn rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-100 backdrop-blur-sm"
          >
            Sozlamaga qaytish
          </button>
        </div>

        <QuizBattleApp
          config={config}
          onBackToSetup={() => navigate('/games/quiz-battle')}
        />
      </main>
    </div>
  )
}

export default QuizBattleArenaPage
