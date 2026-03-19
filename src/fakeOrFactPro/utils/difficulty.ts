import type { FakeOrFactDifficulty, FakeOrFactTeamState } from '../types.ts'

export const difficultyLabelMap: Record<FakeOrFactDifficulty, string> = {
  easy: 'Oson',
  medium: "O'rta",
  hard: 'Qiyin',
}

const difficultyOrder: FakeOrFactDifficulty[] = ['easy', 'medium', 'hard']

export const getNextDifficulty = (difficulty: FakeOrFactDifficulty): FakeOrFactDifficulty => {
  const currentIndex = difficultyOrder.indexOf(difficulty)
  return difficultyOrder[Math.min(difficultyOrder.length - 1, currentIndex + 1)]
}

export const shouldRaiseDifficulty = (teams: FakeOrFactTeamState[]) =>
  teams.some((team) => team.streak > 0 && team.streak % 3 === 0)

export const getComboMultiplier = (streak: number) => {
  if (streak >= 6) return 2
  if (streak >= 3) return 1.5
  return 1
}
