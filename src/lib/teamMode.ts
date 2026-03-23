export type TeamCount = 1 | 2

export const DEFAULT_TEAM_NAMES = ['1-Jamoa', '2-Jamoa'] as const

export const parseTeamCount = (raw: string | null | undefined, fallback: TeamCount = 2): TeamCount => {
  if (Number(raw) === 1) return 1
  if (Number(raw) === 2) return 2
  return fallback
}

export const getTeamName = (value: string | null | undefined, index: number) =>
  value?.trim() || DEFAULT_TEAM_NAMES[index] || `Jamoa ${index + 1}`
