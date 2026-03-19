import type { PersistedGameState, QuizBattleConfig, QuizQuestion } from '../types.ts'

const SETUP_KEY = 'quiz-battle:last-setup:v1'
const LIVE_STATE_KEY = 'quiz-battle:live-state:v1'
const SESSION_PREFIX = 'quiz-battle:session:'
const CUSTOM_BANK_KEY = 'quiz-battle:custom-bank:v1'

const parseJson = <T,>(value: string | null): T | null => {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export const loadLastSetup = () => parseJson<QuizBattleConfig>(localStorage.getItem(SETUP_KEY))

export const saveLastSetup = (config: QuizBattleConfig) => {
  localStorage.setItem(SETUP_KEY, JSON.stringify(config))
}

export const createSessionConfigKey = () => `${SESSION_PREFIX}${Date.now()}`

export const saveSessionConfig = (key: string, config: QuizBattleConfig) => {
  sessionStorage.setItem(key, JSON.stringify(config))
}

export const loadSessionConfig = (key: string | null) => {
  if (!key) return null
  return parseJson<QuizBattleConfig>(sessionStorage.getItem(key))
}

export const saveLiveGameState = (state: PersistedGameState) => {
  localStorage.setItem(LIVE_STATE_KEY, JSON.stringify(state))
}

export const loadLiveGameState = () => parseJson<PersistedGameState>(localStorage.getItem(LIVE_STATE_KEY))

export const clearLiveGameState = () => {
  localStorage.removeItem(LIVE_STATE_KEY)
}

const isQuizQuestion = (value: unknown): value is QuizQuestion => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<QuizQuestion>
  return (
    candidate.type === 'question'
    && typeof candidate.id === 'string'
    && typeof candidate.question === 'string'
    && Array.isArray(candidate.answers)
    && candidate.answers.length === 4
    && candidate.answers.every((answer) => typeof answer === 'string')
    && typeof candidate.correctAnswer === 'string'
  )
}

export const loadCustomQuestionBank = () => {
  const parsed = parseJson<unknown>(localStorage.getItem(CUSTOM_BANK_KEY))
  if (!Array.isArray(parsed)) return []
  return parsed.filter(isQuizQuestion)
}

export const saveCustomQuestionBank = (questions: QuizQuestion[]) => {
  localStorage.setItem(CUSTOM_BANK_KEY, JSON.stringify(questions))
}

export const clearCustomQuestionBank = () => {
  localStorage.removeItem(CUSTOM_BANK_KEY)
}
