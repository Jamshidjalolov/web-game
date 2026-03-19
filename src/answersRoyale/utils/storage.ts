import type {
  AnswersRoyaleQuestion,
  AnswersRoyaleRankingEntry,
  AnswersRoyaleSetupConfig,
} from '../types.ts'

const SETUP_KEY = 'answers-royale:last-setup:v1'
const SESSION_PREFIX = 'answers-royale:session:'
const CUSTOM_BANK_KEY = 'answers-royale:custom-bank:v1'
const RANKING_KEY = 'answers-royale:global-ranking:v1'

const parseJson = <T,>(value: string | null): T | null => {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const isQuestion = (value: unknown): value is AnswersRoyaleQuestion => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AnswersRoyaleQuestion>
  return (
    typeof candidate.id === 'string'
    && typeof candidate.question === 'string'
    && Array.isArray(candidate.correctAnswers)
    && candidate.correctAnswers.every((answer) => typeof answer === 'string')
    && typeof candidate.answerGoal === 'number'
  )
}

export const loadAnswersRoyaleSetup = () =>
  parseJson<AnswersRoyaleSetupConfig>(localStorage.getItem(SETUP_KEY))

export const saveAnswersRoyaleSetup = (config: AnswersRoyaleSetupConfig) => {
  localStorage.setItem(SETUP_KEY, JSON.stringify(config))
}

export const createAnswersRoyaleSessionKey = () => `${SESSION_PREFIX}${Date.now()}`

export const saveAnswersRoyaleSession = (key: string, config: AnswersRoyaleSetupConfig) => {
  sessionStorage.setItem(key, JSON.stringify(config))
}

export const loadAnswersRoyaleSession = (key: string | null) => {
  if (!key) return null
  return parseJson<AnswersRoyaleSetupConfig>(sessionStorage.getItem(key))
}

export const loadAnswersRoyaleCustomBank = () => {
  const parsed = parseJson<unknown>(localStorage.getItem(CUSTOM_BANK_KEY))
  if (!Array.isArray(parsed)) return []
  return parsed.filter(isQuestion)
}

export const saveAnswersRoyaleCustomBank = (questions: AnswersRoyaleQuestion[]) => {
  localStorage.setItem(CUSTOM_BANK_KEY, JSON.stringify(questions))
}

export const clearAnswersRoyaleCustomBank = () => {
  localStorage.removeItem(CUSTOM_BANK_KEY)
}

export const loadAnswersRoyaleRanking = () =>
  parseJson<AnswersRoyaleRankingEntry[]>(localStorage.getItem(RANKING_KEY)) ?? []

export const saveAnswersRoyaleRanking = (entries: AnswersRoyaleRankingEntry[]) => {
  localStorage.setItem(RANKING_KEY, JSON.stringify(entries))
}
