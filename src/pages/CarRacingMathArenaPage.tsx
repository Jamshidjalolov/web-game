import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import CarRacingMathArena, { type TeacherCarMathQuestion } from '../components/CarRacingMathArena.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import { fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Topic = '+' | '-' | '*' | '/'

const ALLOWED_DIFFICULTY: Difficulty[] = ['Oson', "O'rta", 'Qiyin']
const ALLOWED_TOPICS: Topic[] = ['+', '-', '*', '/']

const parseDifficulty = (raw: string | null): Difficulty => {
  if (!raw) return "O'rta"
  const value = raw.trim() as Difficulty
  return ALLOWED_DIFFICULTY.includes(value) ? value : "O'rta"
}

const parseTopics = (raw: string | null): Topic[] => {
  if (!raw) return ALLOWED_TOPICS
  const items = raw
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is Topic => ALLOWED_TOPICS.includes(item as Topic))
  const unique = Array.from(new Set(items))
  return unique.length > 0 ? unique : ALLOWED_TOPICS
}

const loadTeacherQuestions = (key: string | null): TeacherCarMathQuestion[] => {
  if (!key) return []
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is TeacherCarMathQuestion => {
        if (!item || typeof item !== 'object') return false
        const q = item as Partial<TeacherCarMathQuestion>
        return (
          (q.difficulty === 'Oson' || q.difficulty === "O'rta" || q.difficulty === 'Qiyin')
          && typeof q.prompt === 'string'
          && Array.isArray(q.options)
          && q.options.length === 4
          && q.options.every((v) => typeof v === 'string')
          && typeof q.correctIndex === 'number'
          && q.correctIndex >= 0
          && q.correctIndex <= 3
          && (q.topic === undefined || ALLOWED_TOPICS.includes(q.topic))
        )
      })
      .map((q) => ({
        difficulty: q.difficulty,
        prompt: q.prompt.trim(),
        options: q.options.map((v) => v.trim()) as [string, string, string, string],
        correctIndex: q.correctIndex,
        topic: q.topic,
      }))
      .filter((q) => q.prompt && q.options.every(Boolean))
      .slice(0, 100)
  } catch {
    return []
  }
}

const parseDifficultyValue = (value: string | null | undefined): Difficulty | null => {
  if (value === 'Oson' || value === "O'rta" || value === 'Qiyin') return value
  return null
}

const parseTopicValue = (value: string | null | undefined): Topic | null => {
  if (value === '+' || value === '-' || value === '*' || value === '/') return value
  return null
}

const parseTopicFromPrompt = (prompt: string): Topic | null => {
  if (prompt.includes('+')) return '+'
  if (prompt.includes('-')) return '-'
  if (prompt.includes('*') || prompt.toLowerCase().includes('x')) return '*'
  if (prompt.includes('/')) return '/'
  return null
}

const parseBackendTeacherQuestions = (questions: BackendQuestion[]): TeacherCarMathQuestion[] => {
  const result: TeacherCarMathQuestion[] = []

  questions.forEach((question) => {
    const difficulty = parseDifficultyValue(question.difficulty)
    if (!difficulty) return

    const options = question.options.map((item) => item.trim()) as string[]
    const correctIndex = question.correct_index ?? -1
    if (options.length !== 4 || correctIndex < 0 || correctIndex > 3) return

    const meta = question.metadata_json
    const topic = parseTopicValue(typeof meta.topic === 'string' ? meta.topic : null)
      ?? parseTopicFromPrompt(question.prompt)
      ?? '+'

    result.push({
      difficulty,
      prompt: question.prompt.trim(),
      options: [options[0], options[1], options[2], options[3]],
      correctIndex,
      topic,
    })
  })

  return result.slice(0, 200)
}

function CarRacingMathArenaPage() {
  const location = useLocation()
  const game = findGameById('car-racing-math')
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const difficulty = useMemo(() => parseDifficulty(searchParams.get('difficulty')), [searchParams])
  const enabledTopics = useMemo(() => parseTopics(searchParams.get('topics')), [searchParams])
  const leftTeamName = searchParams.get('team1')?.trim() || '1-Jamoa'
  const rightTeamName = searchParams.get('team2')?.trim() || '2-Jamoa'
  const localTeacherQuestions = useMemo(() => loadTeacherQuestions(searchParams.get('custom')), [searchParams])
  const canUseTeacherContent = useTeacherGameAccess()
  const [teacherQuestions, setTeacherQuestions] = useState<TeacherCarMathQuestion[]>(localTeacherQuestions)
  const [questionsReady, setQuestionsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setQuestionsReady(false)
      const backendQuestions = parseBackendTeacherQuestions(await fetchGameQuestions('car-racing-math'))
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

  const arenaKey = `${difficulty}-${enabledTopics.join('')}-${leftTeamName}-${rightTeamName}-${teacherQuestions.length}-${searchParams.get('custom') ?? 'none'}`

  if (!game) return null
  if (!questionsReady) return null

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(99,102,241,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />
      <main className="relative z-10 mx-auto max-w-[1520px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <CarRacingMathArena
          key={arenaKey}
          gameTitle={game.title}
          gameTone={game.tone}
          leftTeamName={leftTeamName}
          rightTeamName={rightTeamName}
          initialDifficulty={difficulty}
          teacherQuestions={teacherQuestions}
          enabledTopics={enabledTopics}
          setupPath="/games/car-racing-math"
        />
      </main>
    </div>
  )
}

export default CarRacingMathArenaPage
