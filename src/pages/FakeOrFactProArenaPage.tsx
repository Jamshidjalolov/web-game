import { Link, useLocation, useNavigate } from 'react-router-dom'
import GameArena from '../fakeOrFactPro/components/GameArena.tsx'
import ParticlesBackdrop from '../fakeOrFactPro/components/ParticlesBackdrop.tsx'
import FakeOrFactGameProvider from '../fakeOrFactPro/context/FakeOrFactGameContext.tsx'
import GameCommentsSection from '../components/GameCommentsSection.tsx'
import { findGameById } from '../data/games.ts'
import { loadFakeOrFactSession, loadFakeOrFactSetup } from '../fakeOrFactPro/utils/storage.ts'

function FakeOrFactProArenaPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const game = findGameById('fake-or-fact-pro')
  const params = new URLSearchParams(location.search)
  const sessionKey = params.get('session')
  const config = loadFakeOrFactSession(sessionKey) ?? loadFakeOrFactSetup()

  if (!config) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#060b1a_0%,#101834_56%,#1a1137_100%)] text-white">
        <ParticlesBackdrop />
        <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 text-center">
          <h1 className="font-kid text-6xl text-white sm:text-7xl">FAKE or FACT PRO</h1>
          <p className="mt-4 text-lg font-bold text-slate-300">
            Arena ochilishi uchun avval sozlamalar sahifasidan o'yinni tayyorlang.
          </p>
          <Link
            to="/games/fake-or-fact-pro"
            className="mt-7 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 px-7 py-4 text-sm font-black uppercase tracking-[0.12em] text-white"
          >
            Sozlamaga qaytish
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_14%_10%,#0d214b_0%,transparent_30%),radial-gradient(circle_at_84%_16%,#34164f_0%,transparent_32%),radial-gradient(circle_at_18%_86%,#093851_0%,transparent_34%),linear-gradient(170deg,#040916_0%,#0b1124_54%,#150b2b_100%)] text-white lg:h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_14%,rgba(34,211,238,0.24),transparent_24%),radial-gradient(circle_at_90%_18%,rgba(244,114,182,0.16),transparent_26%),radial-gradient(circle_at_24%_88%,rgba(34,197,94,0.12),transparent_22%)]" />
      <ParticlesBackdrop />

      <main className="relative z-10 mx-auto max-w-[1440px] px-3 pb-3 pt-3 sm:px-4 sm:pt-4 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden lg:pb-4">
        <div className="mb-3 flex items-center gap-3 lg:mb-2">
          <button
            type="button"
            onClick={() => navigate('/games/fake-or-fact-pro')}
            className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-100 backdrop-blur-sm"
          >
            Sozlamaga qaytish
          </button>
        </div>

        <div className="lg:min-h-0 lg:flex-1">
          <FakeOrFactGameProvider config={config}>
            <GameArena onBackToSetup={() => navigate('/games/fake-or-fact-pro')} />
          </FakeOrFactGameProvider>
        </div>
      </main>
      {game ? (
        <div className="relative z-10 mx-auto max-w-[1320px] px-4 pb-10 sm:px-6">
          <GameCommentsSection gameId={game.id} gameTitle={game.title} />
        </div>
      ) : null}
    </div>
  )
}

export default FakeOrFactProArenaPage
