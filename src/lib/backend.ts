import { games, setGamesFromBackend, type BackendGameItem, type GameItem } from '../data/games.ts'

const DEFAULT_LOCAL_API_BASE_URL = 'http://localhost:8000'
const DEFAULT_PRODUCTION_API_BASE_URL = 'https://game-web-api.onrender.com'

const resolveApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '')

  if (typeof window === 'undefined') {
    return DEFAULT_LOCAL_API_BASE_URL
  }

  const hostname = window.location.hostname.toLowerCase()
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1'

  return (isLocalHost ? DEFAULT_LOCAL_API_BASE_URL : DEFAULT_PRODUCTION_API_BASE_URL).replace(/\/+$/, '')
}

const API_BASE_URL = resolveApiBaseUrl()
const AUTH_STORAGE_KEY = 'game_web_auth_session'
const VISUAL_IQ_RANKING_STORAGE_KEY = 'visual-iq-ranking-cache'
export const AUTH_SESSION_CHANGE_EVENT = 'auth-session-changed'

export type ApiUser = {
  id: string
  firebase_uid: string
  email: string
  full_name: string | null
  photo_url: string | null
  role: 'admin' | 'teacher'
  is_active: boolean
  created_at: string
  updated_at: string
}

export type GameCommentStatus = 'pending' | 'approved' | 'rejected'

export type GameComment = {
  id: string
  game_id: string
  game_title: string
  user_id: string
  author_name: string
  author_email: string | null
  content: string
  status: GameCommentStatus
  admin_reply: string | null
  moderator_name: string | null
  created_at: string
  updated_at: string
  moderated_at: string | null
}

type AuthApiResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: ApiUser
}

type RegisterPayload = {
  fullName?: string
  email: string
  password: string
}

type LoginPayload = {
  email: string
  password: string
}

export type BackendQuestion = {
  id: string
  teacher_id: string
  game_id: string
  question_type: 'multiple_choice' | 'open_text'
  prompt: string
  options: string[]
  correct_index: number | null
  answer_text: string | null
  hint: string | null
  difficulty: string | null
  metadata_json: Record<string, unknown>
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type VisualIqRankingEntry = {
  id: string
  game_id: string
  player_name: string
  age: number
  iq_score: number
  percentile: number
  correct_answers: number
  round_count: number
  accuracy_percent: number
  speed_percent: number
  total_time_seconds: number
  difficulty_label: string
  created_at: string
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: ApiUser
}

export type CreateBackendQuestionPayload = {
  gameId: string
  questionType: 'multiple_choice' | 'open_text'
  prompt: string
  options?: string[]
  correctIndex?: number | null
  answerText?: string | null
  hint?: string | null
  difficulty?: string | null
  metadata?: Record<string, unknown>
}

export type CreateVisualIqRankingPayload = {
  gameId?: string
  playerName: string
  age: number
  iqScore: number
  percentile: number
  correctAnswers: number
  roundCount: number
  accuracyPercent: number
  speedPercent: number
  totalTimeSeconds: number
  difficultyLabel: string
}

export type CreateGameCommentPayload = {
  gameId: string
  content: string
}

export type ModerateGameCommentPayload = {
  status?: GameCommentStatus
  adminReply?: string
}

type FetchQuestionsParams = {
  gameId?: string
  teacherId?: string
  includeArchived?: boolean
}

const notifyAuthSessionChanged = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT))
}

const getBackendOfflineMessage = () =>
  API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')
    ? "Backendga ulanib bo'lmadi. `backend` serverini ishga tushiring."
    : "Backendga ulanib bo'lmadi. Deploy qilingan API manzilini tekshiring."

const toErrorMessage = (fallback: string, payload: unknown) => {
  if (!payload || typeof payload !== 'object') return fallback
  if (!('detail' in payload)) return fallback

  const detail = payload.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    if (first && typeof first === 'object' && 'msg' in first && typeof first.msg === 'string') {
      const loc = Array.isArray((first as { loc?: unknown }).loc)
        ? (first as { loc: unknown[] }).loc.map((item) => String(item)).join('.')
        : null
      return loc ? `${loc}: ${first.msg}` : first.msg
    }
  }

  return fallback
}

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new Error(getBackendOfflineMessage())
  }

  if (!response.ok) {
    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
    throw new Error(toErrorMessage(`So'rov bajarilmadi (${response.status}).`, payload))
  }

  return response.json() as Promise<T>
}

const compareVisualIqRanking = (left: VisualIqRankingEntry, right: VisualIqRankingEntry) =>
  right.iq_score - left.iq_score
  || right.accuracy_percent - left.accuracy_percent
  || right.speed_percent - left.speed_percent
  || left.total_time_seconds - right.total_time_seconds
  || left.created_at.localeCompare(right.created_at)

const loadVisualIqRankingCache = (): VisualIqRankingEntry[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(VISUAL_IQ_RANKING_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as VisualIqRankingEntry[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveVisualIqRankingCache = (items: VisualIqRankingEntry[]) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(VISUAL_IQ_RANKING_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Ignore storage write failures and continue.
  }
}

export const loadStoredAuthSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.user) return null
    return parsed
  } catch {
    return null
  }
}

const saveAuthSession = (session: AuthSession) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  notifyAuthSessionChanged()
}

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  notifyAuthSessionChanged()
}

export const hasActiveAuthSession = (): boolean => Boolean(loadStoredAuthSession()?.accessToken)

export const hasTeacherGameAccess = (session: AuthSession | null = loadStoredAuthSession()): boolean =>
  Boolean(session?.accessToken && session.user?.role === 'teacher')

const saveSessionFromAuthResponse = (data: AuthApiResponse): AuthSession => {
  const session: AuthSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    user: data.user,
  }
  saveAuthSession(session)
  return session
}

export const loginWithFirebaseToken = async (idToken: string): Promise<AuthSession> => {
  const data = await requestJson<AuthApiResponse>('/api/v1/auth/firebase-login', {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  })
  return saveSessionFromAuthResponse(data)
}

export const registerWithEmailPassword = async (payload: RegisterPayload): Promise<AuthSession> => {
  const data = await requestJson<AuthApiResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      full_name: payload.fullName?.trim() || null,
    }),
  })
  return saveSessionFromAuthResponse(data)
}

export const loginWithEmailPassword = async (payload: LoginPayload): Promise<AuthSession> => {
  const data = await requestJson<AuthApiResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  })
  return saveSessionFromAuthResponse(data)
}

export const fetchGamesCatalog = async (): Promise<GameItem[]> => {
  const remote = await requestJson<BackendGameItem[]>('/api/v1/games')
  const merged = setGamesFromBackend(remote)
  return merged.length > 0 ? merged : games
}

const getAuthorizationHeader = () => {
  const session = loadStoredAuthSession()
  if (!session?.accessToken) return null
  return {
    Authorization: `Bearer ${session.accessToken}`,
  }
}

export const fetchQuestions = async (params?: FetchQuestionsParams): Promise<BackendQuestion[]> => {
  const authHeader = getAuthorizationHeader()
  if (!authHeader) return []

  const search = new URLSearchParams()
  if (params?.gameId) search.set('game_id', params.gameId)
  if (params?.teacherId) search.set('teacher_id', params.teacherId)
  if (params?.includeArchived) search.set('include_archived', 'true')
  const query = search.toString()

  return requestJson<BackendQuestion[]>(`/api/v1/questions${query ? `?${query}` : ''}`, {
    headers: authHeader,
  })
}

export const fetchGameQuestions = async (gameId: string): Promise<BackendQuestion[]> => {
  if (!hasTeacherGameAccess()) {
    return []
  }
  try {
    return await fetchQuestions({ gameId })
  } catch {
    return []
  }
}

export const createGameQuestion = async (payload: CreateBackendQuestionPayload): Promise<BackendQuestion> => {
  const authHeader = getAuthorizationHeader()
  if (!authHeader) {
    throw new Error("Savol saqlash uchun avval login qiling.")
  }

  return requestJson<BackendQuestion>('/api/v1/questions', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      game_id: payload.gameId,
      question_type: payload.questionType,
      prompt: payload.prompt,
      options: payload.options ?? [],
      correct_index: payload.correctIndex ?? null,
      answer_text: payload.answerText ?? null,
      hint: payload.hint ?? null,
      difficulty: payload.difficulty ?? null,
      metadata_json: payload.metadata ?? {},
    }),
  })
}

export const deleteGameQuestion = async (questionId: string): Promise<void> => {
  const authHeader = getAuthorizationHeader()
  if (!authHeader) {
    throw new Error("Savol o'chirish uchun avval login qiling.")
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/questions/${encodeURIComponent(questionId)}`, {
      method: 'DELETE',
      headers: authHeader,
    })
  } catch {
    throw new Error(getBackendOfflineMessage())
  }

  if (!response.ok) {
    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
    throw new Error(toErrorMessage(`Savol o'chirilmadi (${response.status}).`, payload))
  }
}

export const fetchUsersForAdmin = async (): Promise<ApiUser[]> => {
  const authHeader = getAuthorizationHeader()
  if (!authHeader) return []
  return requestJson<ApiUser[]>('/api/v1/users', {
    headers: authHeader,
  })
}

export const fetchApprovedGameComments = async (gameId: string): Promise<GameComment[]> =>
  requestJson<GameComment[]>(`/api/v1/game-comments?game_id=${encodeURIComponent(gameId)}`)

export const createGameComment = async (payload: CreateGameCommentPayload): Promise<GameComment> => {
  const authHeader = getAuthorizationHeader()
  if (!authHeader) {
    throw new Error("Izoh yozish uchun avval login qiling.")
  }

  return requestJson<GameComment>('/api/v1/game-comments', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      game_id: payload.gameId,
      content: payload.content,
    }),
  })
}

export const fetchAdminGameComments = async (status?: GameCommentStatus): Promise<GameComment[]> => {
  const authHeader = getAuthorizationHeader()
  if (!authHeader) return []
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return requestJson<GameComment[]>(`/api/v1/game-comments/admin${query}`, {
    headers: authHeader,
  })
}

export const moderateGameComment = async (
  commentId: string,
  payload: ModerateGameCommentPayload,
): Promise<GameComment> => {
  const authHeader = getAuthorizationHeader()
  if (!authHeader) {
    throw new Error("Izohni boshqarish uchun admin login kerak.")
  }

  return requestJson<GameComment>(`/api/v1/game-comments/${encodeURIComponent(commentId)}`, {
    method: 'PATCH',
    headers: authHeader,
    body: JSON.stringify({
      status: payload.status,
      admin_reply: payload.adminReply,
    }),
  })
}

export const fetchVisualIqRanking = async (limit = 10): Promise<VisualIqRankingEntry[]> =>
  {
    try {
      const remote = await requestJson<VisualIqRankingEntry[]>(
        `/api/v1/visual-iq-rankings?limit=${encodeURIComponent(String(limit))}&game_id=visual-brain-teasers`,
      )
      saveVisualIqRankingCache(remote)
      return remote
    } catch {
      return loadVisualIqRankingCache()
        .sort(compareVisualIqRanking)
        .slice(0, limit)
    }
  }

export const createVisualIqRanking = async (
  payload: CreateVisualIqRankingPayload,
): Promise<VisualIqRankingEntry> => {
  const requestPayload = {
    game_id: payload.gameId ?? 'visual-brain-teasers',
    player_name: payload.playerName,
    age: payload.age,
    iq_score: payload.iqScore,
    percentile: payload.percentile,
    correct_answers: payload.correctAnswers,
    round_count: payload.roundCount,
    accuracy_percent: payload.accuracyPercent,
    speed_percent: payload.speedPercent,
    total_time_seconds: payload.totalTimeSeconds,
    difficulty_label: payload.difficultyLabel,
  }

  try {
    const remote = await requestJson<VisualIqRankingEntry>('/api/v1/visual-iq-rankings', {
      method: 'POST',
      body: JSON.stringify(requestPayload),
    })
    const nextCache = [remote, ...loadVisualIqRankingCache().filter((item) => item.id !== remote.id)]
      .sort(compareVisualIqRanking)
      .slice(0, 50)
    saveVisualIqRankingCache(nextCache)
    return remote
  } catch {
    const fallback: VisualIqRankingEntry = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      ...requestPayload,
    }
    const nextCache = [fallback, ...loadVisualIqRankingCache()]
      .sort(compareVisualIqRanking)
      .slice(0, 50)
    saveVisualIqRankingCache(nextCache)
    return fallback
  }
}
