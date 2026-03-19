import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import TugOfWarArena, {
  type Operator,
  type TeacherTugQuestion,
} from '../components/TugOfWarArena.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import { fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
const allowedOps: Operator[] = ['+', '-', 'x', '/']
const fallbackOps: Operator[] = ['+', '-', 'x', '/']
const allowedDifficulty: Difficulty[] = ['Oson', "O'rta", 'Qiyin']
const isAllowedOperator = (value: string): value is Operator =>
  allowedOps.includes(value as Operator)

const parseOperators = (raw: string | null): Operator[] => {
  if (!raw) {
    return fallbackOps
  }

  const parsed = raw
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is Operator => allowedOps.includes(item as Operator))

  const unique = Array.from(new Set(parsed))
  return unique.length > 0 ? unique : fallbackOps
}

const parseDifficulty = (raw: string | null): Difficulty => {
  if (!raw) return "O'rta"
  const value = raw.trim() as Difficulty
  return allowedDifficulty.includes(value) ? value : "O'rta"
}

const parseIntegerAnswer = (value: unknown): number | null => {
  if (typeof value !== 'string') return null
  const cleaned = value.trim().replace(',', '.')
  if (!/^\d{1,3}$/.test(cleaned)) return null
  const parsed = Number(cleaned)
  if (!Number.isInteger(parsed) || parsed < 0) return null
  return parsed
}

const normalizeText = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ')

const parseOperatorFromPrompt = (prompt: string): Operator | undefined => {
  if (prompt.includes('+')) return '+'
  if (prompt.includes('-')) return '-'
  if (prompt.includes('x') || prompt.includes('*')) return 'x'
  if (prompt.includes('/')) return '/'
  return undefined
}

const loadTeacherQuestions = (storageKey: string | null): TeacherTugQuestion[] => {
  if (!storageKey) return []
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is TeacherTugQuestion => {
        if (!item || typeof item !== 'object') return false
        const candidate = item as {
          prompt?: unknown
          answer?: unknown
          difficulty?: unknown
          operator?: unknown
        }
        return (
          typeof candidate.prompt === 'string'
          && typeof candidate.answer === 'number'
          && Number.isInteger(candidate.answer)
          && candidate.answer >= 0
          && (candidate.difficulty === undefined
            || candidate.difficulty === 'Oson'
            || candidate.difficulty === "O'rta"
            || candidate.difficulty === 'Qiyin')
          && (candidate.operator === undefined
            || candidate.operator === '+'
            || candidate.operator === '-'
            || candidate.operator === 'x'
            || candidate.operator === '/')
        )
      })
      .map((item) => ({
        prompt: item.prompt.trim(),
        answer: item.answer,
        difficulty: item.difficulty,
        operator: item.operator,
      }))
      .filter((item) => item.prompt.length > 0)
      .slice(0, 200)
  } catch {
    return []
  }
}

const parseBackendTeacherQuestions = (questions: BackendQuestion[]): TeacherTugQuestion[] => {
  const dedupe = new Map<string, TeacherTugQuestion>()

  questions.forEach((question) => {
    const prompt = question.prompt.trim()
    if (!prompt) return

    const correctIndex = question.correct_index ?? -1
    const options = question.options.map((item) => item.trim())
    const answerFromOptions = options[correctIndex] ?? null
    const answer = parseIntegerAnswer(answerFromOptions) ?? parseIntegerAnswer(question.answer_text)
    if (answer === null) return

    const meta = question.metadata_json
    const rawDifficulty = typeof meta.difficulty === 'string' ? meta.difficulty : question.difficulty
    const difficulty = parseDifficulty(rawDifficulty ?? null)
    const rawOperator = typeof meta.topic === 'string' ? meta.topic.trim() : ''
    const operator = isAllowedOperator(rawOperator)
      ? rawOperator
      : parseOperatorFromPrompt(prompt)

    const key = normalizeText(`${prompt}__${answer}__${difficulty}__${operator ?? 'all'}`)
    if (dedupe.has(key)) return

    dedupe.set(key, {
      prompt,
      answer,
      difficulty,
      operator,
    })
  })

  return Array.from(dedupe.values()).slice(0, 200)
}

function TugOfWarArenaPage() {
  const location = useLocation()
  const game = findGameById('arqon-tortish')

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const selectedOps = useMemo(() => parseOperators(searchParams.get('ops')), [searchParams])
  const difficulty = useMemo(() => parseDifficulty(searchParams.get('difficulty')), [searchParams])
  const teamOneName = searchParams.get('team1')?.trim() || '1-Jamoa'
  const teamTwoName = searchParams.get('team2')?.trim() || '2-Jamoa'
  const localTeacherQuestions = useMemo(
    () => loadTeacherQuestions(searchParams.get('custom')),
    [searchParams],
  )
  const canUseTeacherContent = useTeacherGameAccess()
  const [teacherQuestions, setTeacherQuestions] = useState<TeacherTugQuestion[]>(localTeacherQuestions)
  const [questionsReady, setQuestionsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setQuestionsReady(false)
      const backendQuestions = parseBackendTeacherQuestions(await fetchGameQuestions('arqon-tortish'))
      if (!isMounted) return
      setTeacherQuestions(
        canUseTeacherContent
          ? backendQuestions
          : (backendQuestions.length > 0 ? backendQuestions : localTeacherQuestions),
      )
      setQuestionsReady(true)
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [canUseTeacherContent, localTeacherQuestions])

  if (!game) {
    return null
  }
  if (!questionsReady) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />
      <main className="relative z-10 mx-auto max-w-[1480px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <TugOfWarArena
          gameTitle={game.title}
          gameTone={game.tone}
          leftTeamName={teamOneName}
          rightTeamName={teamTwoName}
          initialEnabledOps={selectedOps}
          initialDifficulty={difficulty}
          teacherQuestions={teacherQuestions}
          lockOptions
        />
      </main>
    </div>
  )
}

export default TugOfWarArenaPage
