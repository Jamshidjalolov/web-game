import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import MillionaireTeamArena, { type TeacherMillionaireQuestion } from '../components/MillionaireTeamArena.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import { fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'

const parseDifficulty = (raw: string | null): Difficulty => {
  if (raw === 'Oson' || raw === "O'rta" || raw === 'Qiyin') {
    return raw
  }
  return "O'rta"
}

const loadTeacherQuestions = (storageKey: string | null): TeacherMillionaireQuestion[] => {
  if (!storageKey) return []
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is TeacherMillionaireQuestion => {
        if (!item || typeof item !== 'object') return false
        const candidate = item as Partial<TeacherMillionaireQuestion>
        return (
          (candidate.difficulty === 'Oson' || candidate.difficulty === "O'rta" || candidate.difficulty === 'Qiyin')
          && typeof candidate.prompt === 'string'
          && Array.isArray(candidate.options)
          && candidate.options.length === 4
          && candidate.options.every((option) => typeof option === 'string')
          && typeof candidate.correctIndex === 'number'
          && candidate.correctIndex >= 0
          && candidate.correctIndex <= 3
        )
      })
      .map((question) => ({
        difficulty: question.difficulty,
        prompt: question.prompt.trim(),
        options: question.options.map((option) => option.trim()) as [string, string, string, string],
        correctIndex: question.correctIndex,
      }))
      .filter((question) => question.prompt.length >= 4 && question.options.every(Boolean))
      .slice(0, 120)
  } catch {
    return []
  }
}

const parseDifficultyValue = (value: string | null | undefined): Difficulty | null => {
  if (value === 'Oson' || value === "O'rta" || value === 'Qiyin') return value
  return null
}

const parseBackendTeacherQuestions = (questions: BackendQuestion[]): TeacherMillionaireQuestion[] => {
  return questions
    .map((question) => {
      const meta = question.metadata_json
      const difficulty = parseDifficultyValue(
        typeof meta.difficulty === 'string' ? meta.difficulty : question.difficulty,
      )
      if (!difficulty) return null

      const options = question.options.map((item) => item.trim()) as string[]
      const correctIndex = question.correct_index ?? -1
      if (options.length !== 4 || correctIndex < 0 || correctIndex > 3) return null

      const prompt = question.prompt.trim()
      if (!prompt) return null

      return {
        difficulty,
        prompt,
        options: [options[0], options[1], options[2], options[3]],
        correctIndex,
      } satisfies TeacherMillionaireQuestion
    })
    .filter((item): item is TeacherMillionaireQuestion => item !== null)
    .slice(0, 240)
}

function MillionaireArenaPage() {
  const location = useLocation()
  const game = findGameById('millioner')
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const difficulty = parseDifficulty(searchParams.get('difficulty'))
  const teamOneName = searchParams.get('team1')?.trim() || ''
  const teamTwoName = searchParams.get('team2')?.trim() || ''
  const session = searchParams.get('session')?.trim() || ''
  const customKey = searchParams.get('custom')
  const localTeacherQuestions = useMemo(() => loadTeacherQuestions(customKey), [customKey])
  const canUseTeacherContent = useTeacherGameAccess()
  const [teacherQuestions, setTeacherQuestions] = useState<TeacherMillionaireQuestion[]>(localTeacherQuestions)
  const [questionsReady, setQuestionsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setQuestionsReady(false)
      const backendQuestions = parseBackendTeacherQuestions(await fetchGameQuestions('millioner'))
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

  if (!teamOneName || !teamTwoName || !session) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#edf7ff_0%,#f7f8ff_44%,#fff3de_100%)] text-slate-800">
        <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 text-center">
          <h1 className="font-kid text-6xl text-slate-900 sm:text-7xl">Millioner Arena</h1>
          <p className="mt-4 text-lg font-bold text-slate-600">
            Arena ochish uchun avval sozlamalar sahifasidan o'yinni boshlang.
          </p>
          <Link
            to="/games/millioner"
            className="mt-7 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-7 py-4 text-sm font-black uppercase tracking-[0.12em] text-white"
          >
            Sozlamaga qaytish
          </Link>
        </main>
      </div>
    )
  }

  if (!questionsReady) {
    return null
  }

  const arenaKey = `${difficulty}-${teamOneName}-${teamTwoName}-${session}-${customKey ?? 'none'}-${teacherQuestions.length}`

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#edf7ff_0%,#f7f8ff_44%,#fff3de_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(99,102,241,0.20),transparent_30%),radial-gradient(circle_at_84%_16%,rgba(249,115,22,0.14),transparent_32%),radial-gradient(circle_at_18%_84%,rgba(56,189,248,0.16),transparent_36%)]" />

      <main className="relative z-10 mx-auto max-w-[1520px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <MillionaireTeamArena
          key={arenaKey}
          gameTitle={game.title}
          gameTone={game.tone}
          leftTeamName={teamOneName}
          rightTeamName={teamTwoName}
          difficulty={difficulty}
          teacherQuestions={teacherQuestions}
          setupPath="/games/millioner"
        />
      </main>
    </div>
  )
}

export default MillionaireArenaPage
