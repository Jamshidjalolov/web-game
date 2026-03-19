import { useState } from 'react'
import type { QuizBattleConfig, TeamState } from '../types.ts'
import { clearLiveGameState } from '../utils/storage.ts'
import GameBoard from './GameBoard.tsx'
import WinnerScreen from './WinnerScreen.tsx'

type QuizBattleAppProps = {
  config: QuizBattleConfig
  onBackToSetup: () => void
}

function QuizBattleApp({ config, onBackToSetup }: QuizBattleAppProps) {
  const [roundKey, setRoundKey] = useState(0)
  const [finishedTeams, setFinishedTeams] = useState<TeamState[] | null>(null)

  const restartRound = () => {
    clearLiveGameState()
    setFinishedTeams(null)
    setRoundKey((prev) => prev + 1)
  }

  return finishedTeams ? (
    <WinnerScreen
      teams={finishedTeams}
      onReplay={restartRound}
      onBackToSetup={onBackToSetup}
    />
  ) : (
    <GameBoard
      key={roundKey}
      config={config}
      onFinish={(teams) => setFinishedTeams(teams)}
    />
  )
}

export default QuizBattleApp
