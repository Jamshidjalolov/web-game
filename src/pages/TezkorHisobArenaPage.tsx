import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import TezkorHisobArena, { type TeacherTezkorQuestion } from '../components/TezkorHisobArena.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import { fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Topic = '+' | '-' | '*' | '/'

const allowedDifficulty: Difficulty[] = ['Oson', "O'rta", 'Qiyin']
const allowedTopics: Topic[] = ['+', '-', '*', '/']

const parseDifficulty = (raw: string | null): Difficulty => {
  if (!raw) return "O'rta"
  const cleaned = raw.trim() as Difficulty
  return allowedDifficulty.includes(cleaned) ? cleaned : "O'rta"
}

const parseTopics = (raw: string | null): Topic[] => {
  if (!raw) return allowedTopics
  const parsed = raw
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is Topic => allowedTopics.includes(item as Topic))
  const unique = Array.from(new Set(parsed))
  return unique.length > 0 ? unique : allowedTopics
}

const loadTeacherQuestions = (storageKey: string | null): TeacherTezkorQuestion[] => {
  if (!storageKey) return []
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is TeacherTezkorQuestion => {
        if (!item || typeof item !== 'object') return false
        const candidate = item as {
          difficulty?: unknown
          prompt?: unknown
          options?: unknown
          correctIndex?: unknown
          topic?: unknown
        }
        return (
          (candidate.difficulty === 'Oson' || candidate.difficulty === "O'rta" || candidate.difficulty === 'Qiyin')
          && typeof candidate.prompt === 'string'
          && Array.isArray(candidate.options)
          && candidate.options.length === 4
          && candidate.options.every((option) => typeof option === 'string')
          && typeof candidate.correctIndex === 'number'
          && candidate.correctIndex >= 0
          && candidate.correctIndex <= 3
          && (candidate.topic === undefined || candidate.topic === '+' || candidate.topic === '-' || candidate.topic === '*' || candidate.topic === '/')
        )
      })
      .map((item) => ({
        difficulty: item.difficulty,
        prompt: item.prompt.trim(),
        options: item.options.map((option) => option.trim()) as [string, string, string, string],
        correctIndex: item.correctIndex,
        topic: item.topic,
      }))
      .filter((item) => item.prompt.length > 0 && item.options.every((option) => option.length > 0))
      .slice(0, 90)
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

const parseBackendTeacherQuestions = (questions: BackendQuestion[]): TeacherTezkorQuestion[] => {
  const result: TeacherTezkorQuestion[] = []

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

function TezkorHisobArenaPage() {
  const location = useLocation()
  const game = findGameById('tezkor-hisob')
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const difficulty = useMemo(() => parseDifficulty(searchParams.get('difficulty')), [searchParams])
  const enabledTopics = useMemo(() => parseTopics(searchParams.get('topics')), [searchParams])
  const teamOneName = searchParams.get('team1')?.trim() || '1-Jamoa'
  const teamTwoName = searchParams.get('team2')?.trim() || '2-Jamoa'
  const localTeacherQuestions = useMemo(() => loadTeacherQuestions(searchParams.get('custom')), [searchParams])
  const canUseTeacherContent = useTeacherGameAccess()
  const [teacherQuestions, setTeacherQuestions] = useState<TeacherTezkorQuestion[]>(localTeacherQuestions)
  const [questionsReady, setQuestionsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setQuestionsReady(false)
      const backendQuestions = parseBackendTeacherQuestions(await fetchGameQuestions('tezkor-hisob'))
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

  const arenaKey = `${difficulty}-${enabledTopics.join('')}-${teamOneName}-${teamTwoName}-${searchParams.get('custom') ?? 'none'}-${teacherQuestions.length}`

  if (!game) return null
  if (!questionsReady) return null

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(99,102,241,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />
      <main className="relative z-10 mx-auto max-w-[1520px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <TezkorHisobArena
          key={arenaKey}
          gameTitle={game.title}
          gameTone={game.tone}
          leftTeamName={teamOneName}
          rightTeamName={teamTwoName}
          initialDifficulty={difficulty}
          teacherQuestions={teacherQuestions}
          enabledTopics={enabledTopics}
          setupPath="/games/tezkor-hisob"
        />
      </main>
    </div>
  )
}

export default TezkorHisobArenaPage
