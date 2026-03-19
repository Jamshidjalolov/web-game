const normalizeAnswer = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

export const scoreRound = ({ question, submissions, teams, eliminationThreshold }) => {
  const validSet = new Set((question.correctAnswers || []).map(normalizeAnswer))
  const byAnswer = new Map()
  const invalidByTeam = new Map()
  const teamStats = Object.fromEntries(teams.map((team) => [team.teamId, {
    scoreDelta: 0,
    mistakesDelta: 0,
    uniqueAnswers: 0,
    duplicates: 0,
    clashes: 0,
    contributors: {},
  }]))

  submissions
    .slice()
    .sort((left, right) => left.submittedAt - right.submittedAt)
    .forEach((submission) => {
      const answer = normalizeAnswer(submission.answer)
      if (!validSet.has(answer)) {
        invalidByTeam.set(submission.teamId, (invalidByTeam.get(submission.teamId) || 0) + 1)
        return
      }

      const current = byAnswer.get(answer) || []
      current.push({ ...submission, answer })
      byAnswer.set(answer, current)
    })

  let fastestTeamId = null
  let fastestTime = Number.POSITIVE_INFINITY

  byAnswer.forEach((entries) => {
    const teamIds = [...new Set(entries.map((item) => item.teamId))]

    if (teamIds.length === 1) {
      const winnerTeamId = teamIds[0]
      const first = entries[0]
      teamStats[winnerTeamId].scoreDelta += 10
      teamStats[winnerTeamId].uniqueAnswers += 1
      teamStats[winnerTeamId].contributors[first.playerId] = (teamStats[winnerTeamId].contributors[first.playerId] || 0) + 10

      if (entries.length > 1) {
        teamStats[winnerTeamId].duplicates += entries.length - 1
        entries.slice(1).forEach((entry) => {
          teamStats[winnerTeamId].scoreDelta += 5
          teamStats[winnerTeamId].contributors[entry.playerId] = (teamStats[winnerTeamId].contributors[entry.playerId] || 0) + 5
        })
      }

      if (first.submittedAt < fastestTime) {
        fastestTime = first.submittedAt
        fastestTeamId = winnerTeamId
      }
      return
    }

    teamIds.forEach((teamId) => {
      teamStats[teamId].clashes += entries.filter((item) => item.teamId === teamId).length
    })
  })

  if (fastestTeamId) {
    teamStats[fastestTeamId].scoreDelta += 4
  }

  const eliminatedTeamIds = []

  teams.forEach((team) => {
    const stats = teamStats[team.teamId]
    const invalidPenalty = Math.min(3, invalidByTeam.get(team.teamId) || 0)
    const clashPenalty = stats.clashes > 0 ? Math.ceil(stats.clashes / 2) : 0
    const zeroPenalty = stats.uniqueAnswers === 0 ? 2 : 0
    stats.mistakesDelta = invalidPenalty + clashPenalty + zeroPenalty

    if (team.mistakes + stats.mistakesDelta >= eliminationThreshold) {
      eliminatedTeamIds.push(team.teamId)
    }
  })

  return {
    teamStats,
    eliminatedTeamIds,
    fastestTeamId,
  }
}
