import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  avatar: { type: String, default: '' },
  teamId: { type: String, default: null },
  totalScore: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
}, { timestamps: true })

export const User = mongoose.model('User', userSchema)
