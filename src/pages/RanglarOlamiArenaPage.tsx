import { useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import RanglarOlamiArena from '../components/RanglarOlamiArena.tsx'
import { findGameById } from '../data/games.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'

const ALLOWED_DIFFICULTY: Difficulty[] = ['Oson', "O'rta", 'Qiyin']

const parseDifficulty = (raw: string | null): Difficulty => {
  if (!raw) return "O'rta"
  const cleaned = raw.trim() as Difficulty
  return ALLOWED_DIFFICULTY.includes(cleaned) ? cleaned : "O'rta"
}

function RanglarOlamiArenaPage() {
  const location = useLocation()
  const game = findGameById('ranglar-olami')
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const difficulty = useMemo(() => parseDifficulty(searchParams.get('difficulty')), [searchParams])
  const teamOneName = searchParams.get('team1')?.trim() || '1-Jamoa'
  const teamTwoName = searchParams.get('team2')?.trim() || '2-Jamoa'
  const arenaKey = `${difficulty}-${teamOneName}-${teamTwoName}`

  if (!game) return null
  if (!teamOneName || !teamTwoName) return <Navigate to="/games/ranglar-olami" replace />

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#fff8ec_0%,#fff7f1_35%,#eef7ff_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(251,146,60,0.18),transparent_24%),radial-gradient(circle_at_86%_18%,rgba(236,72,153,0.14),transparent_25%),radial-gradient(circle_at_24%_82%,rgba(56,189,248,0.16),transparent_24%)]" />
      <main className="relative z-10 mx-auto max-w-[1520px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <RanglarOlamiArena
          key={arenaKey}
          gameTitle={game.title}
          gameTone={game.tone}
          leftTeamName={teamOneName}
          rightTeamName={teamTwoName}
          initialDifficulty={difficulty}
          setupPath="/games/ranglar-olami"
        />
      </main>
    </div>
  )
}

export default RanglarOlamiArenaPage
