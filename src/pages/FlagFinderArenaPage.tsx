import { useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import GameCommentsSection from '../components/GameCommentsSection.tsx'
import FlagFinderArena from '../components/FlagFinderArena.tsx'
import { findGameById } from '../data/games.ts'
import { getTeamName, parseTeamCount } from '../lib/teamMode.ts'

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
  const teamCount = useMemo(() => parseTeamCount(searchParams.get('teamCount')), [searchParams])
  const teamOneName = getTeamName(searchParams.get('team1'), 0)
  const teamTwoName = getTeamName(searchParams.get('team2'), 1)
  const arenaKey = `${difficulty}-${teamCount}-${teamOneName}-${teamTwoName}`

  if (!game) {
    return null
  }

  if (!teamOneName || (teamCount === 2 && !teamTwoName)) {
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
          teamCount={teamCount}
          initialDifficulty={difficulty}
          setupPath="/games/bayroq-topish"
        />
      </main>
      <div className="relative z-10 mx-auto max-w-[1320px] px-4 pb-10 sm:px-6">
        <GameCommentsSection gameId={game.id} gameTitle={game.title} />
      </div>
    </div>
  )
}

export default FlagFinderArenaPage
