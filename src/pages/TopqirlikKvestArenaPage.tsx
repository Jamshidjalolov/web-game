import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import TopqirlikKvestArena, { type TeacherKvestQuestion } from '../components/TopqirlikKvestArena.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import { fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'

const allowedDifficulty: Difficulty[] = ['Oson', "O'rta", 'Qiyin']

const parseDifficulty = (raw: string | null): Difficulty => {
  if (!raw) {
    return "O'rta"
  }

  const cleaned = raw.trim() as Difficulty
  return allowedDifficulty.includes(cleaned) ? cleaned : "O'rta"
}

const loadTeacherQuestions = (storageKey: string | null): TeacherKvestQuestion[] => {
  if (!storageKey) return []
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is TeacherKvestQuestion => {
        if (!item || typeof item !== 'object') return false
        const candidate = item as { prompt?: unknown; options?: unknown; correctIndex?: unknown }
        return (
          typeof candidate.prompt === 'string' &&
          Array.isArray(candidate.options) &&
          candidate.options.length === 4 &&
          candidate.options.every((opt) => typeof opt === 'string') &&
          typeof candidate.correctIndex === 'number'
        )
      })
      .map((item) => ({
        prompt: item.prompt,
        options: item.options.slice(0, 4),
        correctIndex: Math.max(0, Math.min(3, item.correctIndex)),
      }))
      .slice(0, 20)
  } catch {
    return []
  }
}

const parseBackendTeacherQuestions = (questions: BackendQuestion[]): TeacherKvestQuestion[] => {
  return questions
    .map((question) => {
      const options = question.options.map((item) => item.trim())
      const correctIndex = question.correct_index ?? -1
      if (options.length !== 4 || correctIndex < 0 || correctIndex > 3) return null

      const prompt = question.prompt.trim()
      if (!prompt) return null

      return {
        prompt,
        options: [options[0], options[1], options[2], options[3]],
        correctIndex,
      } satisfies TeacherKvestQuestion
    })
    .filter((item): item is TeacherKvestQuestion => item !== null)
    .slice(0, 120)
}

function TopqirlikKvestArenaPage() {
  const location = useLocation()
  const game = findGameById('topqirlik-kvest')
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const difficulty = useMemo(
    () => parseDifficulty(searchParams.get('difficulty')),
    [searchParams],
  )
  const teamOneName = searchParams.get('team1')?.trim() || '1-Jamoa'
  const teamTwoName = searchParams.get('team2')?.trim() || '2-Jamoa'
  const localTeacherQuestions = useMemo(() => loadTeacherQuestions(searchParams.get('custom')), [searchParams])
  const canUseTeacherContent = useTeacherGameAccess()
  const [teacherQuestions, setTeacherQuestions] = useState<TeacherKvestQuestion[]>(localTeacherQuestions)
  const [questionsReady, setQuestionsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setQuestionsReady(false)
      const backendQuestions = parseBackendTeacherQuestions(await fetchGameQuestions('topqirlik-kvest'))
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

  const arenaKey = `${difficulty}-${teamOneName}-${teamTwoName}-${searchParams.get('custom') ?? 'none'}-${teacherQuestions.length}`

  if (!game) {
    return null
  }
  if (!questionsReady) return null

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />
      <main className="relative z-10 mx-auto max-w-[1520px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <TopqirlikKvestArena
          key={arenaKey}
          gameTitle={game.title}
          gameTone={game.tone}
          leftTeamName={teamOneName}
          rightTeamName={teamTwoName}
          initialDifficulty={difficulty}
          teacherQuestions={teacherQuestions}
          setupPath="/games/topqirlik-kvest"
        />
      </main>
    </div>
  )
}

export default TopqirlikKvestArenaPage
