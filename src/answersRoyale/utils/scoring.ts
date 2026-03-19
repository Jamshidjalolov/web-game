import type {
  AnswersRoyaleQuestion,
  AnswersRoyaleSubmission,
  AnswersRoyaleTeam,
} from '../types.ts'

type TeamRoundBreakdown = {
  scoreDelta: number
  mistakesDelta: number
  uniqueAnswers: number
  duplicates: number
  clashes: number
  validAnswers: string[]
  playerScores: Record<string, number>
}

export type RoundScoreResult = {
  teamBreakdown: Record<string, TeamRoundBreakdown>
  fastestBonusTeamId: string | null
  fastestAnswer: string | null
  eliminatedTeamIds: string[]
  summary: string[]
}

const invalidPenaltyCap = 3

export const scoreAnswersRoyaleRound = (
  question: AnswersRoyaleQuestion,
  submissions: AnswersRoyaleSubmission[],
  teams: AnswersRoyaleTeam[],
  eliminationThreshold: number,
): RoundScoreResult => {
  const validSet = new Set(question.correctAnswers)
  const validByAnswer = new Map<string, AnswersRoyaleSubmission[]>()
  const invalidByTeam = new Map<string, number>()

  const breakdown: Record<string, TeamRoundBreakdown> = Object.fromEntries(
    teams.map((team) => [
      team.id,
      {
        scoreDelta: 0,
        mistakesDelta: 0,
        uniqueAnswers: 0,
        duplicates: 0,
        clashes: 0,
        validAnswers: [],
        playerScores: {},
      },
    ]),
  )

  submissions
    .slice()
    .sort((left, right) => left.submittedAt - right.submittedAt)
    .forEach((submission) => {
      if (!validSet.has(submission.normalizedAnswer)) {
        invalidByTeam.set(submission.teamId, (invalidByTeam.get(submission.teamId) ?? 0) + 1)
        return
      }

      const current = validByAnswer.get(submission.normalizedAnswer) ?? []
      current.push(submission)
      validByAnswer.set(submission.normalizedAnswer, current)
    })

  let fastestBonusTeamId: string | null = null
  let fastestAnswer: string | null = null
  let fastestSubmissionTime = Number.POSITIVE_INFINITY

  validByAnswer.forEach((entries, answer) => {
    const teamIds = Array.from(new Set(entries.map((entry) => entry.teamId)))

    if (teamIds.length === 1) {
      const [winnerTeamId] = teamIds
      const sortedEntries = entries.slice().sort((left, right) => left.submittedAt - right.submittedAt)
      const first = sortedEntries[0]
      breakdown[winnerTeamId].scoreDelta += 10
      breakdown[winnerTeamId].uniqueAnswers += 1
      breakdown[winnerTeamId].validAnswers.push(answer)
      breakdown[winnerTeamId].playerScores[first.playerId] =
        (breakdown[winnerTeamId].playerScores[first.playerId] ?? 0) + 10

      if (first.submittedAt < fastestSubmissionTime) {
        fastestSubmissionTime = first.submittedAt
        fastestBonusTeamId = winnerTeamId
        fastestAnswer = answer
      }

      if (sortedEntries.length > 1) {
        breakdown[winnerTeamId].duplicates += sortedEntries.length - 1
        breakdown[winnerTeamId].scoreDelta += (sortedEntries.length - 1) * 5
        sortedEntries.slice(1).forEach((entry) => {
          breakdown[winnerTeamId].playerScores[entry.playerId] =
            (breakdown[winnerTeamId].playerScores[entry.playerId] ?? 0) + 5
        })
      }

      return
    }

    teamIds.forEach((teamId) => {
      const teamEntries = entries.filter((entry) => entry.teamId === teamId)
      breakdown[teamId].clashes += teamEntries.length
    })
  })

  if (fastestBonusTeamId) {
    breakdown[fastestBonusTeamId].scoreDelta += 4
    const fastestEntry = validByAnswer.get(fastestAnswer ?? '')?.[0]
    if (fastestEntry) {
      breakdown[fastestBonusTeamId].playerScores[fastestEntry.playerId] =
        (breakdown[fastestBonusTeamId].playerScores[fastestEntry.playerId] ?? 0) + 4
    }
  }

  const eliminatedTeamIds: string[] = []
  const summary: string[] = []

  teams.forEach((team) => {
    const teamBreakdown = breakdown[team.id]
    const invalidCount = invalidByTeam.get(team.id) ?? 0
    const clashPenalty = teamBreakdown.clashes > 0 ? Math.ceil(teamBreakdown.clashes / 2) : 0
    const noProgressPenalty = teamBreakdown.uniqueAnswers === 0 ? 2 : 0

    teamBreakdown.mistakesDelta = Math.min(invalidPenaltyCap, invalidCount) + clashPenalty + noProgressPenalty
    if (!team.isEliminated && team.mistakes + teamBreakdown.mistakesDelta >= eliminationThreshold) {
      eliminatedTeamIds.push(team.id)
      summary.push(`${team.name} xato chegarasiga yetdi va raunddan chiqdi.`)
    }

    if (teamBreakdown.uniqueAnswers > 0) {
      summary.push(
        `${team.name}: ${teamBreakdown.uniqueAnswers} ta noyob, ${teamBreakdown.duplicates} ta takror, ${teamBreakdown.clashes} ta to'qnash javob oldi.`,
      )
    } else {
      summary.push(`${team.name}: foydali noyob javob topa olmadi.`)
    }
  })

  if (fastestBonusTeamId && fastestAnswer) {
    const winningTeam = teams.find((team) => team.id === fastestBonusTeamId)
    summary.unshift(`${winningTeam?.name ?? 'Jamoa'} eng tez noyob javobni topdi: ${fastestAnswer}.`)
  }

  return {
    teamBreakdown: breakdown,
    fastestBonusTeamId,
    fastestAnswer,
    eliminatedTeamIds,
    summary,
  }
}
