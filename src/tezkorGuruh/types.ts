export type TezkorGuruhTeam = {
  id: string
  name: string
  score: number
}

export type TezkorGuruhConfig = {
  teamCount: number
  teamNames: string[]
  questionCount: number
  timerSeconds: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export type TezkorGuruhQuestion = {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  difficulty: 'easy' | 'medium' | 'hard'
}
