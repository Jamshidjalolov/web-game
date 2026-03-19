import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import EnglishWordArena, { type TeacherEnglishWord } from '../components/EnglishWordArena.tsx'
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

const loadTeacherWords = (storageKey: string | null): TeacherEnglishWord[] => {
  if (!storageKey) return []
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is TeacherEnglishWord => {
        if (!item || typeof item !== 'object') return false
        const candidate = item as { en?: unknown; uz?: unknown; hint?: unknown }
        return (
          typeof candidate.en === 'string'
          && typeof candidate.uz === 'string'
          && (candidate.hint === undefined || typeof candidate.hint === 'string')
        )
      })
      .map((item) => ({
        en: item.en.trim(),
        uz: item.uz.trim(),
        hint: item.hint?.trim() || '',
      }))
      .filter((item) => item.en.length >= 2 && item.uz.length >= 2)
      .slice(0, 50)
  } catch {
    return []
  }
}

const normalizeText = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ')

const parseBackendTeacherWords = (questions: BackendQuestion[]): TeacherEnglishWord[] => {
  const unique = new Map<string, TeacherEnglishWord>()

  questions.forEach((question) => {
    const meta = question.metadata_json

    const enRaw = typeof meta.en === 'string' ? meta.en : question.prompt
    const uzRaw = typeof meta.uz === 'string'
      ? meta.uz
      : (question.answer_text ?? question.options[question.correct_index ?? -1] ?? '')
    const hintRaw = typeof meta.hint === 'string' ? meta.hint : (question.hint ?? '')

    const en = enRaw.trim().toLowerCase()
    const uz = uzRaw.trim().toLowerCase()
    const hint = hintRaw.trim()

    if (en.length < 2 || uz.length < 2) return
    const key = normalizeText(`${en}__${uz}`)
    if (unique.has(key)) return
    unique.set(key, { en, uz, hint })
  })

  return Array.from(unique.values()).slice(0, 120)
}

function EnglishWordArenaPage() {
  const location = useLocation()
  const game = findGameById('inglizcha-soz')
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const difficulty = useMemo(
    () => parseDifficulty(searchParams.get('difficulty')),
    [searchParams],
  )
  const teamOneName = searchParams.get('team1')?.trim() || '1-Jamoa'
  const teamTwoName = searchParams.get('team2')?.trim() || '2-Jamoa'
  const localTeacherWords = useMemo(() => loadTeacherWords(searchParams.get('custom')), [searchParams])
  const canUseTeacherContent = useTeacherGameAccess()
  const [teacherWords, setTeacherWords] = useState<TeacherEnglishWord[]>(localTeacherWords)
  const [questionsReady, setQuestionsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setQuestionsReady(false)
      const backendWords = parseBackendTeacherWords(await fetchGameQuestions('inglizcha-soz'))
      if (!isMounted) return
      setTeacherWords(
        canUseTeacherContent
          ? backendWords
          : (backendWords.length > 0 ? backendWords : localTeacherWords),
      )
      setQuestionsReady(true)
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [canUseTeacherContent, localTeacherWords])

  const arenaKey = `${difficulty}-${teamOneName}-${teamTwoName}-${searchParams.get('custom') ?? 'none'}-${teacherWords.length}`

  if (!game) {
    return null
  }
  if (!questionsReady) return null

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />
      <main className="relative z-10 mx-auto max-w-[1520px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <EnglishWordArena
          key={arenaKey}
          gameTitle={game.title}
          gameTone={game.tone}
          leftTeamName={teamOneName}
          rightTeamName={teamTwoName}
          initialDifficulty={difficulty}
          teacherWords={teacherWords}
          setupPath="/games/inglizcha-soz"
        />
      </main>
    </div>
  )
}

export default EnglishWordArenaPage
