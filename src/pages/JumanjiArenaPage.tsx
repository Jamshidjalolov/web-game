import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import JumanjiArena, { type TeacherJumanjiQuestion } from '../components/JumanjiArena.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import { fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'

const parseDifficulty = (raw: string | null): Difficulty => {
  if (raw === 'Oson' || raw === "O'rta" || raw === 'Qiyin') return raw
  return "O'rta"
}

const loadTeacherQuestions = (key: string | null): TeacherJumanjiQuestion[] => {
  if (!key) return []
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is TeacherJumanjiQuestion => {
        if (!item || typeof item !== 'object') return false
        const q = item as Partial<TeacherJumanjiQuestion>
        return (
          (q.difficulty === 'Oson' || q.difficulty === "O'rta" || q.difficulty === 'Qiyin')
          && typeof q.prompt === 'string'
          && Array.isArray(q.options)
          && q.options.length === 4
          && q.options.every((o) => typeof o === 'string')
          && typeof q.correctIndex === 'number'
          && q.correctIndex >= 0
          && q.correctIndex <= 3
        )
      })
      .map((q) => ({
        difficulty: q.difficulty,
        prompt: q.prompt.trim(),
        options: q.options.map((v) => v.trim()) as [string, string, string, string],
        correctIndex: q.correctIndex,
        hint: q.hint?.trim() || undefined,
      }))
      .filter((q) => q.prompt && q.options.every(Boolean))
      .slice(0, 120)
  } catch {
    return []
  }
}

const parseDifficultyValue = (value: string | null | undefined): Difficulty | null => {
  if (value === 'Oson' || value === "O'rta" || value === 'Qiyin') return value
  return null
}

const parseBackendTeacherQuestions = (questions: BackendQuestion[]): TeacherJumanjiQuestion[] => {
  const result: TeacherJumanjiQuestion[] = []

  questions.forEach((question) => {
    const meta = question.metadata_json
    const difficulty = parseDifficultyValue(
      typeof meta.difficulty === 'string' ? meta.difficulty : question.difficulty,
    )
    if (!difficulty) return

    const options = question.options.map((item) => item.trim())
    const correctIndex = question.correct_index ?? -1
    if (options.length !== 4 || correctIndex < 0 || correctIndex > 3) return

    const prompt = question.prompt.trim()
    if (!prompt) return

    const hintRaw = typeof meta.hint === 'string' ? meta.hint : (question.hint ?? '')
    const hint = hintRaw.trim()

    result.push({
      difficulty,
      prompt,
      options: [options[0], options[1], options[2], options[3]],
      correctIndex,
      ...(hint ? { hint } : {}),
    })
  })

  return result.slice(0, 180)
}

function JumanjiArenaPage() {
  const location = useLocation()
  const game = findGameById('jumanji')
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const difficulty = useMemo(() => parseDifficulty(params.get('difficulty')), [params])
  const leftTeamName = params.get('team1')?.trim() || '1-Jamoa'
  const rightTeamName = params.get('team2')?.trim() || '2-Jamoa'
  const localTeacherQuestions = useMemo(() => loadTeacherQuestions(params.get('custom')), [params])
  const canUseTeacherContent = useTeacherGameAccess()
  const [teacherQuestions, setTeacherQuestions] = useState<TeacherJumanjiQuestion[]>(localTeacherQuestions)
  const [questionsReady, setQuestionsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setQuestionsReady(false)
      const backendQuestions = parseBackendTeacherQuestions(await fetchGameQuestions('jumanji'))
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
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#ecfbf4_0%,#f7fbff_46%,#fff3dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_12%,rgba(34,197,94,0.14),transparent_24%),radial-gradient(circle_at_88%_20%,rgba(234,179,8,0.12),transparent_24%),radial-gradient(circle_at_20%_85%,rgba(59,130,246,0.12),transparent_24%)]" />
      <main className="relative z-10 mx-auto max-w-[1540px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <JumanjiArena
          gameTitle={game.title}
          gameTone={game.tone}
          leftTeamName={leftTeamName}
          rightTeamName={rightTeamName}
          initialDifficulty={difficulty}
          teacherQuestions={teacherQuestions}
          setupPath="/games/jumanji"
        />
      </main>
    </div>
  )
}

export default JumanjiArenaPage
