export type AnswersRoyaleDifficulty = 'easy' | 'medium' | 'hard'

export type AnswersRoyaleCategory =
  | 'any'
  | 'school'
  | 'nature'
  | 'geography'
  | 'science'
  | 'culture'
  | 'sports'

export type AnswersRoyaleQuestionSource = 'default' | 'teacher' | 'local'

export type AnswersRoyaleQuestion = {
  id: string
  question: string
  category: AnswersRoyaleCategory
  difficulty: AnswersRoyaleDifficulty
  correctAnswers: string[]
  answerGoal: number
  hint?: string
  source: AnswersRoyaleQuestionSource
}

export type AnswersRoyaleSetupConfig = {
  roomName: string
  hostLabel: string
  teamCount: 2 | 3
  teamNames: [string, string]
  totalPlayers: number
  category: AnswersRoyaleCategory
  difficulty: AnswersRoyaleDifficulty
  roundTime: number
  eliminationThreshold: number
  soundEnabled: boolean
  customQuestions: AnswersRoyaleQuestion[]
}

export type AnswersRoyalePlayer = {
  id: string
  name: string
  teamId: string
  contribution: number
  accuracy: number
  isEliminated: boolean
}

export type AnswersRoyaleTeam = {
  id: string
  name: string
  color: string
  score: number
  roundDelta: number
  approvedAnswers: number
  mistakes: number
  uniqueAnswers: number
  duplicates: number
  clashes: number
  players: AnswersRoyalePlayer[]
  isEliminated: boolean
}

export type AnswersRoyaleSubmission = {
  id: string
  teamId: string
  playerId: string
  answer: string
  normalizedAnswer: string
  submittedAt: number
  source: 'host'
}

export type AnswersRoyaleChatMessage = {
  id: string
  teamId?: string
  playerName: string
  message: string
  tone: 'neutral' | 'hype' | 'warning'
}

export type AnswersRoyaleRankingEntry = {
  id: string
  roomName: string
  teamName: string
  score: number
  xpEarned: number
  recordedAt: string
  approvedAnswers?: number
}
