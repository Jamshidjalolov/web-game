import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import MemoryChainArena from '../components/MemoryChainArena.tsx'
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

function MemoryChainArenaPage() {
  const location = useLocation()
  const game = findGameById('xotira-zanjiri')
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

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />
      <main className="relative z-10 mx-auto max-w-[1520px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <MemoryChainArena
          key={arenaKey}
          gameTitle={game.title}
          gameTone={game.tone}
          leftTeamName={teamOneName}
          rightTeamName={teamTwoName}
          initialDifficulty={difficulty}
          setupPath="/games/xotira-zanjiri"
        />
      </main>
    </div>
  )
}

export default MemoryChainArenaPage
