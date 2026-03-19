import mongoose from 'mongoose'

const globalLeaderboardSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  winningTeamId: { type: String, required: true },
  winningTeamName: { type: String, required: true },
  score: { type: Number, required: true },
  rankingPoints: { type: Number, required: true },
  xpEarned: { type: Number, required: true },
}, { timestamps: true })

export const GlobalLeaderboard = mongoose.model('GlobalLeaderboard', globalLeaderboardSchema)
