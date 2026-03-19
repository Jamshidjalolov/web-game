export type FakeOrFactCategory =
  | 'fan'
  | 'tarix'
  | 'texnologiya'
  | 'internet'
  | 'qiziqarli'

export type FakeOrFactDifficulty = 'easy' | 'medium' | 'hard'

export type FakeOrFactMode = 'class' | 'speed'

export type FakeOrFactQuestionSource = 'default' | 'teacher' | 'generated'

export type FakeOrFactQuestion = {
  id: string
  category: FakeOrFactCategory
  difficulty: FakeOrFactDifficulty
  text_uz: string
  answer: boolean
  explanation_uz: string
  points: number
  source: FakeOrFactQuestionSource
}

export type FakeOrFactSetupConfig = {
  roomName: string
  mode: FakeOrFactMode
  category: FakeOrFactCategory | 'mix'
  startingDifficulty: FakeOrFactDifficulty
  roundCount: number
  teamNames: [string, string]
  soundEnabled: boolean
  fullscreenPreferred: boolean
  customQuestions: FakeOrFactQuestion[]
}

export type FakeOrFactTeamState = {
  id: 'team-a' | 'team-b'
  name: string
  score: number
  streak: number
  bestStreak: number
  comboMultiplier: number
  answeredAt: number | null
  selectedAnswer: boolean | null
  isCorrect: boolean | null
  lastPoints: number
}

export type FakeOrFactRoundResult = {
  question: FakeOrFactQuestion
  winningTeamId: FakeOrFactTeamState['id'] | null
  fastestTeamId: FakeOrFactTeamState['id'] | null
  anyCorrect: boolean
  difficultyRaised: boolean
  difficultyAfterRound: FakeOrFactDifficulty
  teamResults: Record<
    FakeOrFactTeamState['id'],
    {
      selectedAnswer: boolean | null
      isCorrect: boolean
      awardedPoints: number
      streakAfterRound: number
      comboMultiplierAfterRound: number
      reactionLabel: string
    }
  >
}

export type FakeOrFactRankingEntry = {
  id: string
  roomName: string
  winnerName: string
  mode: FakeOrFactMode
  score: number
  recordedAt: string
}
