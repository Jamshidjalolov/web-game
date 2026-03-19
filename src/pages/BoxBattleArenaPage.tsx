import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import BoxBattleArena, {
  type BoxMathOperator,
  type TeacherBoxQuestion,
} from '../components/BoxBattleArena.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import { fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'

const allowedOps: BoxMathOperator[] = ['+', '-', 'x', '/']
const allowedDifficulty: Difficulty[] = ['Oson', "O'rta", 'Qiyin']

const parseOps = (raw: string | null): BoxMathOperator[] => {
  if (!raw) return ['+', '-', 'x', '/']
  const parsed = raw
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is BoxMathOperator => allowedOps.includes(item as BoxMathOperator))
  return Array.from(new Set(parsed)).length > 0 ? Array.from(new Set(parsed)) : ['+', '-', 'x', '/']
}

const parseDifficulty = (raw: string | null): Difficulty => {
  if (!raw) return "O'rta"
  const value = raw.trim() as Difficulty
  return allowedDifficulty.includes(value) ? value : "O'rta"
}

const loadTeacherQuestions = (storageKey: string | null): TeacherBoxQuestion[] => {
  if (!storageKey) return []
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is TeacherBoxQuestion => {
        if (!item || typeof item !== 'object') return false
        const candidate = item as { prompt?: unknown; answer?: unknown }
        return typeof candidate.prompt === 'string' && typeof candidate.answer === 'string'
      })
      .map((item) => ({ prompt: item.prompt, answer: item.answer }))
      .slice(0, 20)
  } catch {
    return []
  }
}

const normalizeText = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ')

const parseBackendTeacherQuestions = (questions: BackendQuestion[]): TeacherBoxQuestion[] => {
  const dedupe = new Map<string, TeacherBoxQuestion>()

  questions.forEach((question) => {
    const prompt = question.prompt.trim()
    if (!prompt) return

    const answerFromOptions = Number.isInteger(question.correct_index ?? null)
      ? question.options[question.correct_index ?? -1] ?? ''
      : ''
    const answer = (question.answer_text ?? answerFromOptions).trim()
    if (!answer) return

    const key = normalizeText(`${prompt}__${answer}`)
    if (dedupe.has(key)) return
    dedupe.set(key, { prompt, answer })
  })

  return Array.from(dedupe.values()).slice(0, 120)
}

function BoxBattleArenaPage() {
  const location = useLocation()
  const game = findGameById('box-jang')
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const difficulty = useMemo(() => parseDifficulty(searchParams.get('difficulty')), [searchParams])
  const ops = useMemo(() => parseOps(searchParams.get('ops')), [searchParams])
  const teamOneName = searchParams.get('team1')?.trim() || '1-Jamoa'
  const teamTwoName = searchParams.get('team2')?.trim() || '2-Jamoa'
  const localTeacherQuestions = useMemo(() => loadTeacherQuestions(searchParams.get('custom')), [searchParams])
  const canUseTeacherContent = useTeacherGameAccess()
  const [teacherQuestions, setTeacherQuestions] = useState<TeacherBoxQuestion[]>(localTeacherQuestions)
  const [questionsReady, setQuestionsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setQuestionsReady(false)
      const backendQuestions = parseBackendTeacherQuestions(await fetchGameQuestions('box-jang'))
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

  if (!game) return null
  if (!questionsReady) return null

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />
      <main className="relative z-10 mx-auto max-w-[1540px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <BoxBattleArena
          gameTitle={game.title}
          gameTone={game.tone}
          leftTeamName={teamOneName}
          rightTeamName={teamTwoName}
          initialDifficulty={difficulty}
          initialEnabledOps={ops}
          teacherQuestions={teacherQuestions}
          setupPath="/games/box-jang"
        />
      </main>
    </div>
  )
}

export default BoxBattleArenaPage
