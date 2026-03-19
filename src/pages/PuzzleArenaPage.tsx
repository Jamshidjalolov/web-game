import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import PuzzleArena, { type Difficulty, type Operator } from '../components/PuzzleArena.tsx'
import { findGameById } from '../data/games.ts'

const allowedOps: Operator[] = ['+', '-', 'x', '/']
const fallbackOps: Operator[] = ['+', '-', 'x', '/']
const allowedDifficulty: Difficulty[] = ['Oson', "O'rta", 'Qiyin']

const parseOperators = (raw: string | null): Operator[] => {
  if (!raw) {
    return fallbackOps
  }

  const parsed = raw
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is Operator => allowedOps.includes(item as Operator))

  const unique = Array.from(new Set(parsed))
  return unique.length > 0 ? unique : fallbackOps
}

const parseDifficulty = (raw: string | null): Difficulty => {
  if (!raw) {
    return 'Oson'
  }

  const cleaned = raw.trim() as Difficulty
  return allowedDifficulty.includes(cleaned) ? cleaned : 'Oson'
}

function PuzzleArenaPage() {
  const location = useLocation()
  const game = findGameById('puzzle-mozaika')

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const selectedOps = useMemo(() => parseOperators(searchParams.get('ops')), [searchParams])
  const difficulty = useMemo(() => parseDifficulty(searchParams.get('difficulty')), [searchParams])
  const teamOneName = searchParams.get('team1')?.trim() || '1-Jamoa'
  const teamTwoName = searchParams.get('team2')?.trim() || '2-Jamoa'
  const arenaKey = `${difficulty}-${selectedOps.join(',')}-${teamOneName}-${teamTwoName}`

  if (!game) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#edf7ff_0%,#f4fcff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.2),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(79,70,229,0.15),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.16),transparent_22%)]" />
      <main className="relative z-10 mx-auto max-w-[1480px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <PuzzleArena
          key={arenaKey}
          gameTitle={game.title}
          gameTone={game.tone}
          leftTeamName={teamOneName}
          rightTeamName={teamTwoName}
          initialDifficulty={difficulty}
          initialEnabledOps={selectedOps}
          lockSettings
          setupPath="/games/puzzle-mozaika"
        />
      </main>
    </div>
  )
}

export default PuzzleArenaPage
