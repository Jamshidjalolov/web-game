import type {
  FakeOrFactQuestion,
  FakeOrFactRankingEntry,
  FakeOrFactSetupConfig,
} from '../types.ts'

const SETUP_KEY = 'fake-or-fact-pro:last-setup:v1'
const SESSION_PREFIX = 'fake-or-fact-pro:session:'
const CUSTOM_BANK_KEY = 'fake-or-fact-pro:custom-bank:v1'
const RANKING_KEY = 'fake-or-fact-pro:ranking:v1'

const parseJson = <T,>(value: string | null): T | null => {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const isQuestion = (value: unknown): value is FakeOrFactQuestion => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<FakeOrFactQuestion>
  return (
    typeof candidate.id === 'string'
    && typeof candidate.text_uz === 'string'
    && typeof candidate.answer === 'boolean'
    && typeof candidate.explanation_uz === 'string'
    && typeof candidate.points === 'number'
  )
}

export const loadFakeOrFactSetup = () =>
  parseJson<FakeOrFactSetupConfig>(localStorage.getItem(SETUP_KEY))

export const saveFakeOrFactSetup = (config: FakeOrFactSetupConfig) => {
  localStorage.setItem(SETUP_KEY, JSON.stringify(config))
}

export const createFakeOrFactSessionKey = () => `${SESSION_PREFIX}${Date.now()}`

export const saveFakeOrFactSession = (key: string, config: FakeOrFactSetupConfig) => {
  sessionStorage.setItem(key, JSON.stringify(config))
}

export const loadFakeOrFactSession = (key: string | null) => {
  if (!key) return null
  return parseJson<FakeOrFactSetupConfig>(sessionStorage.getItem(key))
}

export const loadFakeOrFactCustomBank = () => {
  const parsed = parseJson<unknown>(localStorage.getItem(CUSTOM_BANK_KEY))
  if (!Array.isArray(parsed)) return []
  return parsed.filter(isQuestion)
}

export const saveFakeOrFactCustomBank = (questions: FakeOrFactQuestion[]) => {
  localStorage.setItem(CUSTOM_BANK_KEY, JSON.stringify(questions))
}

export const clearFakeOrFactCustomBank = () => {
  localStorage.removeItem(CUSTOM_BANK_KEY)
}

export const loadFakeOrFactRanking = () =>
  parseJson<FakeOrFactRankingEntry[]>(localStorage.getItem(RANKING_KEY)) ?? []

export const saveFakeOrFactRanking = (entries: FakeOrFactRankingEntry[]) => {
  localStorage.setItem(RANKING_KEY, JSON.stringify(entries))
}
