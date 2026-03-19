import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  hostSocketId: { type: String, default: '' },
  players: { type: [String], default: [] },
  teams: { type: [String], default: [] },
  gameState: {
    phase: { type: String, default: 'lobby' },
    status: { type: String, default: 'waiting' },
  },
  currentQuestion: {
    id: { type: String, default: null },
    text: { type: String, default: '' },
  },
  roundNumber: { type: Number, default: 0 },
  settings: {
    teamCount: { type: Number, default: 3 },
    roundSeconds: { type: Number, default: 14 },
    eliminationThreshold: { type: Number, default: 8 },
    category: { type: String, default: 'any' },
    difficulty: { type: String, default: 'medium' },
  },
}, { timestamps: true })

export const Room = mongoose.model('Room', roomSchema)
