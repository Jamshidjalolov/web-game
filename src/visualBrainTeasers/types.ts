export type VisualBrainTeaserDifficulty = 'easy' | 'medium' | 'hard'

export type VisualBrainTeaserCategory =
  | 'pattern logic'
  | 'visual IQ puzzles'
  | 'missing number'
  | 'math visual puzzles'
  | 'maze puzzles'
  | 'sudoku & grid'
  | 'tiling puzzles'
  | 'chess visual puzzles'
  | 'logic classics'

export type VisualBrainTeaserPuzzle = {
  id: string
  question_uz: string
  image_url: string
  fallback_image_url?: string
  options: string[]
  correct_answer: string
  difficulty: VisualBrainTeaserDifficulty
  category: VisualBrainTeaserCategory
  explanation_uz: string
  option_image_urls?: Record<string, string>
}

export type VisualBrainTeaserQuestionResult = {
  questionId: string
  difficulty: VisualBrainTeaserDifficulty
  correct: boolean
  timeSpentSeconds: number
  answeredByTeamId: string | null
  pointsEarned: number
}
