import { GlobalLeaderboard } from '../models/GlobalLeaderboard.js'
import { Question } from '../models/Question.js'
import { config } from '../config.js'
import { generateAiQuestion } from '../services/aiQuestionGenerator.js'
import { roomStore } from '../services/roomStore.js'
import { scoreRound } from '../services/scoringEngine.js'

const roundTimers = new Map()

const pickQuestion = async (room) => {
  const query = {}
  if (room.settings.category && room.settings.category !== 'any') {
    query.category = room.settings.category
  }
  if (room.settings.difficulty) {
    query.difficulty = room.settings.difficulty
  }

  const bank = await Question.find(query).sort({ updatedAt: -1 }).limit(24)
  if (bank.length > 0) {
    return bank[Math.floor(Math.random() * bank.length)]
  }

  return generateAiQuestion({
    category: room.settings.category || 'any',
    difficulty: room.settings.difficulty || 'medium',
    answerTarget: 10,
  })
}

const emitLeaderboard = (io, room) => {
  io.to(room.roomId).emit('update_team_leaderboard', {
    teams: room.teams,
    roundNumber: room.roundNumber,
  })
}

const finalizeRound = async (io, roomId) => {
  const room = roomStore.get(roomId)
  if (!room || !room.currentQuestion) return

  const result = scoreRound({
    question: room.currentQuestion,
    submissions: room.submissions,
    teams: room.teams,
    eliminationThreshold: room.settings.eliminationThreshold,
  })

  const resolvedRoom = roomStore.applyRoundResult(roomId, result)
  if (!resolvedRoom) return

  io.to(roomId).emit('round_result', {
    questionId: room.currentQuestion.id || room.currentQuestion._id,
    result,
    teams: resolvedRoom.teams,
  })
  emitLeaderboard(io, resolvedRoom)

  result.eliminatedTeamIds.forEach((teamId) => {
    io.to(roomId).emit('player_eliminated', {
      teamId,
      playerIds: resolvedRoom.players.filter((player) => player.teamId === teamId).map((player) => player.id),
    })
  })

  const aliveTeams = resolvedRoom.teams.filter((team) => team.eliminationStatus !== 'eliminated')
  if (aliveTeams.length <= 1) {
    roomStore.end(roomId)
    const winner = aliveTeams[0] || resolvedRoom.teams.slice().sort((left, right) => right.score - left.score)[0]
    const rankingPoints = 100 + Math.max(0, winner.score)
    const xpEarned = 80 + Math.max(0, winner.score)
    await GlobalLeaderboard.create({
      roomId,
      winningTeamId: winner.teamId,
      winningTeamName: winner.name,
      score: winner.score,
      rankingPoints,
      xpEarned,
    })
    io.to(roomId).emit('game_end', {
      winner,
      rankingPoints,
      xpEarned,
    })
  }
}

export const registerBattleHandlers = (io) => {
  io.on('connection', (socket) => {
    socket.on('join_room', async (payload, callback) => {
      try {
        const room = roomStore.ensure(payload.roomId, {
          hostSocketId: payload.isHost ? socket.id : payload.hostSocketId || socket.id,
          settings: {
            teamCount: Math.min(3, Math.max(2, Number(payload.settings?.teamCount) || 3)),
            roundSeconds: Number(payload.settings?.roundSeconds) || config.roundSeconds,
            eliminationThreshold: Number(payload.settings?.eliminationThreshold) || config.eliminationThreshold,
            category: payload.settings?.category || 'any',
            difficulty: payload.settings?.difficulty || 'medium',
          },
        })

        socket.join(payload.roomId)
        const joined = roomStore.addPlayer(payload.roomId, {
          id: payload.playerId || socket.id,
          username: payload.username || 'Player',
          avatar: payload.avatar || '',
          socketId: socket.id,
        })

        io.to(payload.roomId).emit('assign_teams', {
          players: room.players,
          teams: room.teams,
        })
        emitLeaderboard(io, room)

        callback?.({
          ok: true,
          player: joined?.player || null,
          room,
        })
      } catch (error) {
        callback?.({ ok: false, message: error instanceof Error ? error.message : 'join_room failed' })
      }
    })

    socket.on('assign_teams', (payload) => {
      const room = roomStore.get(payload.roomId)
      if (!room) return
      if (socket.id !== room.hostSocketId) return

      if (Array.isArray(payload.assignments)) {
        room.players = room.players.map((player) => {
          const assignment = payload.assignments.find((item) => item.playerId === player.id)
          return assignment ? { ...player, teamId: assignment.teamId } : player
        })
        room.teams = room.teams.map((team) => ({
          ...team,
          members: room.players.filter((player) => player.teamId === team.teamId).map((player) => player.id),
        }))
      }

      io.to(payload.roomId).emit('assign_teams', {
        players: room.players,
        teams: room.teams,
      })
    })

    socket.on('start_game', async (payload, callback) => {
      const room = roomStore.get(payload.roomId)
      if (!room) {
        callback?.({ ok: false, message: 'Room not found.' })
        return
      }
      if (socket.id !== room.hostSocketId) {
        callback?.({ ok: false, message: 'Only host can start the game.' })
        return
      }

      const question = await pickQuestion(room)
      const liveRoom = roomStore.setQuestion(payload.roomId, question)
      if (!liveRoom) {
        callback?.({ ok: false, message: 'Round could not be started.' })
        return
      }

      io.to(payload.roomId).emit('new_question', {
        roundNumber: liveRoom.roundNumber,
        question: {
          id: question.id || question._id,
          text: question.text,
          category: question.category,
          difficulty: question.difficulty,
          answerCount: question.answerCount,
        },
        roundSeconds: liveRoom.settings.roundSeconds,
      })

      if (roundTimers.has(payload.roomId)) {
        clearTimeout(roundTimers.get(payload.roomId))
      }

      roundTimers.set(payload.roomId, setTimeout(() => {
        void finalizeRound(io, payload.roomId)
      }, liveRoom.settings.roundSeconds * 1000))

      callback?.({ ok: true, question })
    })

    socket.on('submit_answer', (payload, callback) => {
      const room = roomStore.get(payload.roomId)
      if (!room || room.status !== 'question') {
        callback?.({ ok: false, message: 'No active question.' })
        return
      }

      roomStore.addSubmission(payload.roomId, {
        playerId: payload.playerId,
        teamId: payload.teamId,
        answer: payload.answer,
        submittedAt: Date.now(),
      })

      callback?.({ ok: true })
    })

    socket.on('disconnect', () => {
      roundTimers.forEach((timer, roomId) => {
        const room = roomStore.get(roomId)
        if (!room) return
        if (room.hostSocketId === socket.id) {
          clearTimeout(timer)
          roundTimers.delete(roomId)
        }
      })
    })
  })
}
