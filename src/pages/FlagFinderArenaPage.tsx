import { useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import FlagFinderArena from '../components/FlagFinderArena.tsx'
import { findGameById } from '../data/games.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'

const allowedDifficulty: Difficulty[] = ['Oson', "O'rta", 'Qiyin']

const parseDifficulty = (raw: string | null): Difficulty => {
  if (!raw) {
    return "O'rta"
  }
  const cleaned = raw.trim() as Difficulty
  return allowedDifficulty.includes(cleaned) ? cleaned : "O'rta"
}

function FlagFinderArenaPage() {
  const location = useLocation()
  const game = findGameById('bayroq-topish')
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const difficulty = useMemo(
    () => parseDifficulty(searchParams.get('difficulty')),
    [searchParams],
  )
  const teamOneName = searchParams.get('team1')?.trim() || '1-Jamoa'
  const teamTwoName = searchParams.get('team2')?.trim() || '2-Jamoa'
  const arenaKey = `${difficulty}-${teamOneName}-${teamTwoName}`

  if (!game) {
    return null
  }

  if (!teamOneName || !teamTwoName) {
    return <Navigate to="/games/bayroq-topish" replace />
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#ecf7ff_0%,#f2fcff_44%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(20,184,166,0.18),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />
      <main className="relative z-10 mx-auto max-w-[1480px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <FlagFinderArena
          key={arenaKey}
          gameTitle={game.title}
          gameTone={game.tone}
          leftTeamName={teamOneName}
          rightTeamName={teamTwoName}
          initialDifficulty={difficulty}
          setupPath="/games/bayroq-topish"
        />
      </main>
    </div>
  )
}

export default FlagFinderArenaPage
