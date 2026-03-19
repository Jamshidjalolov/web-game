import { buildEventCard, pickWeightedEvent } from '../EventEngine.ts'
import { defaultQuizQuestions } from '../data/defaultQuestions.ts'
import type {
  DifficultyLevel,
  QuizBattleConfig,
  QuizCardContent,
  QuizCardSlot,
  QuizQuestion,
} from '../types.ts'

const pointsCycle = [5, 10, 15] as const
const defaultQuestionCount: QuizBattleConfig['questionCount'] = 12

const eventCountPer12ByDifficulty: Record<DifficultyLevel, number> = {
  easy: 2,
  medium: 3,
  hard: 4,
}

export const shuffle = <T,>(items: T[]) => {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = next[i]
    next[i] = next[j]
    next[j] = temp
  }
  return next
}

const normalizeQuestionForPoints = (question: QuizQuestion, points: number, index: number): QuizQuestion => ({
  ...question,
  id: `${question.id}-slot-${index}-${points}`,
  points,
})

const buildQuestionPool = (config: QuizBattleConfig) => {
  const fallbackByDifficulty = defaultQuizQuestions.filter((item) => item.difficulty === config.difficulty)
  const globalFallback = defaultQuizQuestions
  const custom = config.customQuestions.map((question) => ({ ...question, difficulty: config.difficulty }))
  const combined = shuffle([...custom, ...fallbackByDifficulty])

  if (combined.length > 0) return combined
  return shuffle(globalFallback)
}

const resolveQuestionCount = (count: number | undefined): QuizBattleConfig['questionCount'] => {
  if (count === 16 || count === 24) return count
  return defaultQuestionCount
}

const buildGridPoints = (questionCount: number) =>
  Array.from({ length: questionCount }, (_, idx) => pointsCycle[idx % pointsCycle.length])

const resolveEventCount = (difficulty: DifficultyLevel, questionCount: number) => {
  const ratio = eventCountPer12ByDifficulty[difficulty] / 12
  return Math.max(1, Math.round(questionCount * ratio))
}

const pickEventIndexes = (count: number, totalSlots: number) => {
  const allIndexes = shuffle(Array.from({ length: totalSlots }, (_, idx) => idx))
  return new Set(allIndexes.slice(0, Math.min(count, totalSlots)))
}

const questionOrEvent = (
  eventIndexes: Set<number>,
  index: number,
  points: number,
  questionBank: QuizQuestion[],
): QuizCardContent => {
  if (eventIndexes.has(index)) {
    const eventType = pickWeightedEvent()
    return buildEventCard(`event-${index}-${eventType}`, points, eventType)
  }

  const picked = questionBank[index % questionBank.length] ?? defaultQuizQuestions[index % defaultQuizQuestions.length]
  return normalizeQuestionForPoints(picked, points, index)
}

export const buildCards = (config: QuizBattleConfig): QuizCardSlot[] => {
  const questionCount = resolveQuestionCount(config.questionCount)
  const gridPoints = buildGridPoints(questionCount)
  const eventCount = resolveEventCount(config.difficulty, questionCount)
  const eventIndexes = pickEventIndexes(eventCount, questionCount)
  const questionBank = buildQuestionPool(config)

  return gridPoints.map((points, index) => ({
    id: `card-${index + 1}`,
    slot: index + 1,
    points,
    status: 'hidden',
    content: questionOrEvent(eventIndexes, index, points, questionBank),
  }))
}

export const buildConfigSignature = (config: QuizBattleConfig) => JSON.stringify({
  teamCount: config.teamCount,
  teamNames: config.teamNames,
  questionCount: config.questionCount ?? defaultQuestionCount,
  difficulty: config.difficulty,
  timerEnabled: config.timerEnabled,
  timerSeconds: config.timerSeconds,
  customQuestions: config.customQuestions.map((item) => ({
    id: item.id,
    question: item.question,
    answers: item.answers,
    correctAnswer: item.correctAnswer,
  })),
})
