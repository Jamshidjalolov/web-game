import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import TezkorGuruhArena from '../tezkorGuruh/components/TezkorGuruhArena.tsx'
import TezkorGuruhWinner from '../tezkorGuruh/components/TezkorGuruhWinner.tsx'
import type { TezkorGuruhTeam } from '../tezkorGuruh/types.ts'
import { loadLastSetup, loadSessionConfig } from '../tezkorGuruh/utils/storage.ts'

function TezkorGuruhArenaPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const sessionKey = params.get('session')
  const config = loadSessionConfig(sessionKey) ?? loadLastSetup()
  const [finishedTeams, setFinishedTeams] = useState<TezkorGuruhTeam[] | null>(null)
  const [roundKey, setRoundKey] = useState(0)

  const resetGame = () => {
    setFinishedTeams(null)
    setRoundKey((prev) => prev + 1)
  }

  const onBackToSetup = () => {
    navigate('/games/tezkor-guruh')
  }

  const onFinish = (teams: TezkorGuruhTeam[]) => {
    setFinishedTeams(teams)
  }

  if (!config) {
    return (
      <div className="tezkor-guruh-shell relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#060b1a_0%,#101834_56%,#1a1137_100%)] text-white">
        <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 text-center">
          <h1 className="font-kid text-6xl text-white sm:text-7xl">Tezkor guruh</h1>
          <p className="mt-4 text-lg font-bold text-slate-300">
            Arena ochish uchun avval sozlamalar sahifasiga o‘ting.
          </p>
          <Link
            to="/games/tezkor-guruh"
            className="mt-7 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-7 py-4 text-sm font-black uppercase tracking-[0.12em] text-white"
          >
            Sozlamaga qaytish
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="tezkor-guruh-shell relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_10%,#112749_0%,transparent_30%),radial-gradient(circle_at_84%_16%,#2b1546_0%,transparent_32%),radial-gradient(circle_at_18%_84%,#0f3c53_0%,transparent_34%),linear-gradient(170deg,#040a17_0%,#0a1021_54%,#130b2a_100%)] text-white">
      <main className="tezkor-guruh-page-main relative z-10 mx-auto max-w-[1400px] px-3 pb-8 pt-5 sm:px-5">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToSetup}
            className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-100 backdrop-blur-sm"
          >
            Sozlamaga qaytish
          </button>
        </div>

        {finishedTeams ? (
          <TezkorGuruhWinner
            teams={finishedTeams}
            onReplay={resetGame}
            onBackToSetup={onBackToSetup}
          />
        ) : (
          <TezkorGuruhArena
            key={roundKey}
            config={config}
            onFinish={onFinish}
            onBackToSetup={onBackToSetup}
          />
        )}
      </main>
    </div>
  )
}

export default TezkorGuruhArenaPage
