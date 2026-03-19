import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import BarabanArena from '../components/BarabanArena.tsx'
import { DEFAULT_BARABAN_QUESTIONS } from '../data/barabanDefaults.ts'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import { fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'

const normalizeText = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ')

const parseBackendQuestions = (questions: BackendQuestion[]): string[] => {
  const dedupe = new Map<string, string>()
  questions.forEach((question) => {
    const prompt = question.prompt.trim()
    if (!prompt) return
    const key = normalizeText(prompt)
    if (dedupe.has(key)) return
    dedupe.set(key, prompt)
  })
  return Array.from(dedupe.values()).slice(0, 200)
}

function BarabanArenaPage() {
  const location = useLocation()
  const game = findGameById('baraban-metodi')
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const names = useMemo(() => {
    const directNames = Array.from(
      new Set(
        searchParams
          .getAll('name')
          .map((name) => name.trim())
          .filter(Boolean),
      ),
    )

    if (directNames.length > 0) {
      return directNames
    }

    const legacyGrouped = [
      ...searchParams.getAll('a'),
      ...searchParams.getAll('b'),
    ]
      .map((name) => name.trim())
      .filter(Boolean)

    return Array.from(new Set(legacyGrouped))
  }, [searchParams])

  const localQuestions = useMemo(
    () =>
      Array.from(
        new Set(
          searchParams
            .getAll('q')
            .map((question) => question.trim())
            .filter(Boolean),
        ),
      ),
    [searchParams],
  )

  const canUseTeacherContent = useTeacherGameAccess()
  const fallbackQuestions = useMemo(
    () => (localQuestions.length > 0 ? localQuestions : DEFAULT_BARABAN_QUESTIONS),
    [localQuestions],
  )
  const [questions, setQuestions] = useState<string[]>(localQuestions)
  const [questionsReady, setQuestionsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setQuestionsReady(false)
      const backendQuestions = parseBackendQuestions(await fetchGameQuestions('baraban-metodi'))
      if (!isMounted) return
      setQuestions(
        canUseTeacherContent
          ? (backendQuestions.length > 0 ? backendQuestions : fallbackQuestions)
          : fallbackQuestions,
      )
      setQuestionsReady(true)
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [canUseTeacherContent, fallbackQuestions])

  if (!game) {
    return null
  }

  if (names.length < 2) {
    return <Navigate to="/games/baraban-metodi" replace />
  }
  if (!questionsReady) return null

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />
      <main className="relative z-10 mx-auto max-w-[1480px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <BarabanArena
          gameTitle={game.title}
          gameTone={game.tone}
          initialNames={names}
          initialQuestions={questions}
        />
      </main>
    </div>
  )
}

export default BarabanArenaPage
