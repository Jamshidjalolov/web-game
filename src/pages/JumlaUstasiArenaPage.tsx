import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import GameCommentsSection from '../components/GameCommentsSection.tsx'
import JumlaUstasiArena, { type TeacherJumlaWord } from '../components/JumlaUstasiArena.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import { fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'
import { getTeamName, parseTeamCount } from '../lib/teamMode.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'

const ALLOWED_DIFFICULTY: Difficulty[] = ['Oson', "O'rta", 'Qiyin']

const parseDifficulty = (raw: string | null): Difficulty => {
  if (!raw) return "O'rta"
  const cleaned = raw.trim() as Difficulty
  return ALLOWED_DIFFICULTY.includes(cleaned) ? cleaned : "O'rta"
}

const loadTeacherWords = (storageKey: string | null): TeacherJumlaWord[] => {
  if (!storageKey) return []
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is TeacherJumlaWord => {
        if (!item || typeof item !== 'object') return false
        const candidate = item as { word?: unknown; hint?: unknown }
        return typeof candidate.word === 'string' && (candidate.hint === undefined || typeof candidate.hint === 'string')
      })
      .map((item) => ({
        word: item.word.trim(),
        hint: item.hint?.trim() || '',
      }))
      .filter((item) => item.word.length >= 3)
      .slice(0, 40)
  } catch {
    return []
  }
}

const normalizeText = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ')

const parseBackendTeacherWords = (questions: BackendQuestion[]): TeacherJumlaWord[] => {
  const dedupe = new Map<string, TeacherJumlaWord>()

  questions.forEach((question) => {
    const meta = question.metadata_json
    const answerFromOptions = question.options[question.correct_index ?? -1] ?? ''
    const wordRaw = typeof meta.word === 'string' ? meta.word : (answerFromOptions || question.answer_text || question.prompt)
    const hintRaw = typeof meta.hint === 'string' ? meta.hint : (question.hint ?? question.prompt)

    const word = wordRaw.trim()
    if (word.length < 3) return
    const key = normalizeText(word)
    if (dedupe.has(key)) return

    dedupe.set(key, {
      word,
      hint: hintRaw.trim(),
    })
  })

  return Array.from(dedupe.values()).slice(0, 120)
}

function JumlaUstasiArenaPage() {
  const location = useLocation()
  const game = findGameById('jumla-ustasi')
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const difficulty = useMemo(() => parseDifficulty(searchParams.get('difficulty')), [searchParams])
  const teamCount = useMemo(() => parseTeamCount(searchParams.get('teamCount')), [searchParams])
  const teamOneName = getTeamName(searchParams.get('team1'), 0)
  const teamTwoName = getTeamName(searchParams.get('team2'), 1)
  const localTeacherWords = useMemo(() => loadTeacherWords(searchParams.get('custom')), [searchParams])
  const canUseTeacherContent = useTeacherGameAccess()
  const [teacherWords, setTeacherWords] = useState<TeacherJumlaWord[]>(localTeacherWords)
  const [questionsReady, setQuestionsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setQuestionsReady(false)
      const backendWords = parseBackendTeacherWords(await fetchGameQuestions('jumla-ustasi'))
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

  const arenaKey = `${difficulty}-${teamCount}-${teamOneName}-${teamTwoName}-${searchParams.get('custom') ?? 'none'}-${teacherWords.length}`

  if (!game) return null
  if (!questionsReady) return null
  if (!teamOneName || (teamCount === 2 && !teamTwoName)) return <Navigate to="/games/jumla-ustasi" replace />

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />
      <main className="relative z-10 mx-auto max-w-[1520px] px-2 pb-5 pt-2 sm:px-3 sm:pb-8 sm:pt-3">
        <JumlaUstasiArena
          key={arenaKey}
          gameTitle={game.title}
          gameTone={game.tone}
          leftTeamName={teamOneName}
          rightTeamName={teamTwoName}
          teamCount={teamCount}
          initialDifficulty={difficulty}
          teacherWords={teacherWords}
          setupPath="/games/jumla-ustasi"
        />
      </main>
      <div className="relative z-10 mx-auto max-w-[1320px] px-4 pb-10 sm:px-6">
        <GameCommentsSection gameId={game.id} gameTitle={game.title} />
      </div>
    </div>
  )
}

export default JumlaUstasiArenaPage
