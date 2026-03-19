export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export type QuestionType = 'question' | 'event'

export type EventType = 'bomb' | 'double' | 'swap' | 'bonus'

export type QuizQuestion = {
  id: string
  points: number
  type: 'question'
  question: string
  answers: string[]
  correctAnswer: string
  difficulty: DifficultyLevel
}

export type EventCard = {
  id: string
  points: number
  type: 'event'
  question: string
  answers: string[]
  correctAnswer: string
  eventType: EventType
}

export type QuizCardContent = QuizQuestion | EventCard

export type CardStatus = 'hidden' | 'flipping' | 'opened' | 'resolved'

export type QuizCardSlot = {
  id: string
  slot: number
  points: number
  status: CardStatus
  content: QuizCardContent
}

export type TeamState = {
  id: string
  name: string
  score: number
  doubleNext: boolean
  color: string
}

export type QuizBattleConfig = {
  teamCount: 2 | 3
  teamNames: string[]
  questionCount: 12 | 16 | 24
  difficulty: DifficultyLevel
  timerEnabled: boolean
  timerSeconds: number
  soundEnabled: boolean
  customQuestions: QuizQuestion[]
}

export type PersistedGameState = {
  configSignature: string
  teams: TeamState[]
  cards: QuizCardSlot[]
  activeTeamIndex: number
  usedCardIds: string[]
}
