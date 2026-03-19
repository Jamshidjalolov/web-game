import cors from 'cors'
import express from 'express'
import { GlobalLeaderboard } from './models/GlobalLeaderboard.js'
import { Question } from './models/Question.js'
import { config } from './config.js'
import { generateAiQuestion } from './services/aiQuestionGenerator.js'

export const app = express()

app.use(cors({
  origin: config.clientOrigin,
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/questions', async (req, res) => {
  const query = {}
  if (req.query.category) query.category = String(req.query.category)
  if (req.query.difficulty) query.difficulty = String(req.query.difficulty)

  const questions = await Question.find(query).sort({ updatedAt: -1 }).limit(100)
  res.json(questions)
})

app.post('/api/questions', async (req, res) => {
  const payload = req.body || {}
  const question = await Question.create({
    text: payload.text,
    category: payload.category || 'any',
    difficulty: payload.difficulty || 'medium',
    answerCount: Array.isArray(payload.correctAnswers) ? payload.correctAnswers.length : Number(payload.answerCount || 0),
    correctAnswers: Array.isArray(payload.correctAnswers) ? payload.correctAnswers : [],
    source: payload.source || 'teacher',
  })
  res.status(201).json(question)
})

app.delete('/api/questions/:id', async (req, res) => {
  await Question.findByIdAndDelete(req.params.id)
  res.status(204).end()
})

app.get('/api/leaderboard', async (_req, res) => {
  const entries = await GlobalLeaderboard.find({}).sort({ score: -1, createdAt: -1 }).limit(50)
  res.json(entries)
})

app.post('/api/ai/generate', async (req, res) => {
  const question = await generateAiQuestion({
    category: req.body?.category || 'any',
    difficulty: req.body?.difficulty || 'medium',
    answerTarget: Number(req.body?.answerTarget || 10),
  })
  res.json(question)
})
