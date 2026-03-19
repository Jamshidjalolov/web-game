const teamPalette = [
  { teamId: 'team-1', name: 'Azure Pulse', color: '#22d3ee' },
  { teamId: 'team-2', name: 'Solar Rush', color: '#fb923c' },
  { teamId: 'team-3', name: 'Royal Prism', color: '#c084fc' },
]

const rooms = new Map()

const createBaseRoom = ({ roomId, settings, hostSocketId }) => ({
  roomId,
  hostSocketId,
  roundNumber: 0,
  status: 'waiting',
  currentQuestion: null,
  settings,
  players: [],
  teams: teamPalette.slice(0, settings.teamCount).map((team) => ({
    ...team,
    score: 0,
    mistakes: 0,
    members: [],
    eliminationStatus: 'alive',
  })),
  submissions: [],
})

export const roomStore = {
  get(roomId) {
    return rooms.get(roomId) || null
  },
  ensure(roomId, payload) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, createBaseRoom({ roomId, ...payload }))
    }
    return rooms.get(roomId)
  },
  addPlayer(roomId, player) {
    const room = rooms.get(roomId)
    if (!room) return null

    const team = room.teams.reduce((lowest, candidate) => (
      candidate.members.length < lowest.members.length ? candidate : lowest
    ), room.teams[0])

    const joinedPlayer = { ...player, teamId: team.teamId }
    room.players.push(joinedPlayer)
    team.members.push(joinedPlayer.id)
    return { room, player: joinedPlayer }
  },
  setQuestion(roomId, question) {
    const room = rooms.get(roomId)
    if (!room) return null
    room.currentQuestion = question
    room.roundNumber += 1
    room.status = 'question'
    room.submissions = []
    return room
  },
  addSubmission(roomId, submission) {
    const room = rooms.get(roomId)
    if (!room) return null
    room.submissions.push(submission)
    return room
  },
  applyRoundResult(roomId, result) {
    const room = rooms.get(roomId)
    if (!room) return null

    room.teams = room.teams.map((team) => {
      const stats = result.teamStats[team.teamId]
      const nextMistakes = team.mistakes + stats.mistakesDelta
      return {
        ...team,
        score: team.score + stats.scoreDelta,
        mistakes: nextMistakes,
        eliminationStatus: result.eliminatedTeamIds.includes(team.teamId) ? 'eliminated' : nextMistakes >= room.settings.eliminationThreshold - 2 ? 'warning' : 'alive',
      }
    })
    room.status = 'results'
    return room
  },
  end(roomId) {
    const room = rooms.get(roomId)
    if (!room) return null
    room.status = 'finished'
    return room
  },
}
