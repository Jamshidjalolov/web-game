import { Link, useLocation, useNavigate } from 'react-router-dom'
import AnswersRoyaleBackdrop from '../answersRoyale/components/AnswersRoyaleBackdrop.tsx'
import AnswersRoyaleArena from '../answersRoyale/components/AnswersRoyaleArena.tsx'
import { loadAnswersRoyaleSession, loadAnswersRoyaleSetup } from '../answersRoyale/utils/storage.ts'

function OneQuestionHundredAnswersArenaPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const sessionKey = params.get('session')
  const config = loadAnswersRoyaleSession(sessionKey) ?? loadAnswersRoyaleSetup()

  if (!config) {
    return (
      <div className="answersroyale-shell relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#060b1a_0%,#101834_56%,#1a1137_100%)] text-white">
        <AnswersRoyaleBackdrop />
        <main className="answersroyale-empty-shell mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 text-center">
          <h1 className="font-kid text-6xl text-white sm:text-7xl">1 Savol - 100 Javob</h1>
          <p className="mt-4 text-lg font-bold text-slate-300">
            Arena ochish uchun avval setup sahifasidan xonani tayyorlang.
          </p>
          <Link
            to="/games/one-question-100-answers"
            className="answersroyale-empty-cta mt-7 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-7 py-4 text-sm font-black uppercase tracking-[0.12em] text-white"
          >
            Setup sahifasi
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="answersroyale-shell relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_10%,#0a2550_0%,transparent_32%),radial-gradient(circle_at_86%_16%,#34154f_0%,transparent_32%),radial-gradient(circle_at_18%_84%,#0a3b58_0%,transparent_34%),linear-gradient(170deg,#040a17_0%,#0a1021_54%,#130b2a_100%)] text-white">
      <div className="answersroyale-shell-glow pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(34,211,238,0.24),transparent_24%),radial-gradient(circle_at_88%_18%,rgba(251,191,36,0.18),transparent_26%),radial-gradient(circle_at_28%_86%,rgba(96,165,250,0.18),transparent_22%)]" />
      <AnswersRoyaleBackdrop />

      <main className="answersroyale-page-main relative z-10 mx-auto max-w-[1460px] px-3 pb-8 pt-4 sm:px-5 sm:pt-5">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/games/one-question-100-answers')}
            className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-100 backdrop-blur-sm"
          >
            Sozlamaga qaytish
          </button>
        </div>

        <AnswersRoyaleArena
          config={config}
          onBackToSetup={() => navigate('/games/one-question-100-answers')}
        />
      </main>
    </div>
  )
}

export default OneQuestionHundredAnswersArenaPage
