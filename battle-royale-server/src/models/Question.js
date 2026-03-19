import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  difficulty: { type: String, required: true, trim: true },
  answerCount: { type: Number, required: true },
  correctAnswers: { type: [String], default: [] },
  source: {
    type: String,
    enum: ['teacher', 'ai', 'seed'],
    default: 'teacher',
  },
}, { timestamps: true })

export const Question = mongoose.model('Question', questionSchema)
