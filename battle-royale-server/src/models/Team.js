import mongoose from 'mongoose'

const teamSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  teamId: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  score: { type: Number, default: 0 },
  members: { type: [String], default: [] },
  eliminationStatus: {
    type: String,
    enum: ['alive', 'warning', 'eliminated'],
    default: 'alive',
  },
  mistakes: { type: Number, default: 0 },
}, { timestamps: true })

teamSchema.index({ roomId: 1, teamId: 1 }, { unique: true })

export const Team = mongoose.model('Team', teamSchema)
