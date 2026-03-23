import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import GameCommentsSection from '../components/GameCommentsSection.tsx'
import WordSearchArena from '../components/WordSearchArena.tsx'
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

function WordSearchArenaPage() {
  const location = useLocation()
  const game = findGameById('soz-qidiruv')
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

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />
      <main className="relative z-10 mx-auto max-w-[1520px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <WordSearchArena
          key={arenaKey}
          gameTitle={game.title}
          gameTone={game.tone}
          leftTeamName={teamOneName}
          rightTeamName={teamTwoName}
          teamCount={teamCount}
          initialDifficulty={difficulty}
          lockSettings
          setupPath="/games/soz-qidiruv"
        />
      </main>
      <div className="relative z-10 mx-auto max-w-[1320px] px-4 pb-10 sm:px-6">
        <GameCommentsSection gameId={game.id} gameTitle={game.title} />
      </div>
    </div>
  )
}

export default WordSearchArenaPage
