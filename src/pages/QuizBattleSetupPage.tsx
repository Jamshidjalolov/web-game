import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FooterCTA from '../components/FooterCTA.tsx'
import GameCommentsSection from '../components/GameCommentsSection.tsx'
import Navbar from '../components/Navbar.tsx'
import QuestionManagerLinkCard from '../components/QuestionManagerLinkCard.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import { fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'
import Lobby from '../quizBattle/components/Lobby.tsx'
import QuizBattleBackdrop from '../quizBattle/components/QuizBattleBackdrop.tsx'
import type { DifficultyLevel, QuizBattleConfig, QuizQuestion } from '../quizBattle/types.ts'
import {
  createSessionConfigKey,
  loadCustomQuestionBank,
  loadLastSetup,
  saveLastSetup,
  saveSessionConfig,
} from '../quizBattle/utils/storage.ts'

const mapDifficulty = (value: string | null | undefined): DifficultyLevel => {
  if (value === 'Oson' || value === 'easy') return 'easy'
  if (value === "O'rta" || value === 'medium') return 'medium'
  if (value === 'Qiyin' || value === 'hard') return 'hard'
  return 'medium'
}

const parseBackendQuizQuestions = (questions: BackendQuestion[]): QuizQuestion[] => {
  return questions
    .map((question, index) => {
      const options = question.options.map((item) => item.trim())
      const correctIndex = question.correct_index ?? -1
      if (options.length < 2 || correctIndex < 0 || correctIndex >= options.length) return null

      const meta = question.metadata_json
      const points = typeof meta.points === 'number' && Number.isFinite(meta.points)
        ? Math.max(100, Math.min(500, Math.round(meta.points)))
        : 200

      return {
        id: `backend-${question.id}-${index}`,
        points,
        type: 'question',
        question: question.prompt.trim(),
        answers: options.slice(0, 4),
        correctAnswer: options[correctIndex],
        difficulty: mapDifficulty(typeof meta.difficulty === 'string' ? meta.difficulty : question.difficulty),
      } satisfies QuizQuestion
    })
    .filter((item): item is QuizQuestion => item !== null)
    .slice(0, 120)
}

const normalizeQuestionText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

const stripBackendQuestions = (questions: QuizQuestion[]) =>
  questions.filter((question) => !question.id.startsWith('backend-'))

const mergeQuestionSources = (...banks: QuizQuestion[][]) => {
  const seen = new Set<string>()

  return banks
    .flat()
    .filter((question) => {
      const signature = [
        normalizeQuestionText(question.question),
        ...question.answers.map(normalizeQuestionText),
        normalizeQuestionText(question.correctAnswer),
      ].join('|')

      if (seen.has(signature)) return false
      seen.add(signature)
      return true
    })
    .slice(0, 120)
}

function QuizBattleSetupPage() {
  const navigate = useNavigate()
  const game = findGameById('quiz-battle')
  const canUseTeacherContent = useTeacherGameAccess()
  const initialConfig = useMemo<QuizBattleConfig | null>(() => {
    const savedSetup = loadLastSetup()
    const localQuestionBank = stripBackendQuestions(loadCustomQuestionBank())

    if (!savedSetup) {
      return localQuestionBank.length > 0
        ? {
            teamCount: 2,
            teamNames: ['1-Jamoa', '2-Jamoa'],
            questionCount: 12,
            difficulty: 'medium',
            timerEnabled: true,
            timerSeconds: 20,
            soundEnabled: true,
            customQuestions: localQuestionBank,
          } satisfies QuizBattleConfig
        : null
    }

    return {
      ...savedSetup,
      customQuestions: localQuestionBank.length > 0
        ? localQuestionBank
        : stripBackendQuestions(savedSetup.customQuestions ?? []),
    } satisfies QuizBattleConfig
  }, [])
  const [teacherQuestionCount, setTeacherQuestionCount] = useState(0)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!canUseTeacherContent) {
        if (isMounted) setTeacherQuestionCount(0)
        return
      }
      const backendQuestions = parseBackendQuizQuestions(await fetchGameQuestions('quiz-battle'))
      if (!isMounted) return
      setTeacherQuestionCount(backendQuestions.length)
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [canUseTeacherContent])

  const handleStart = async (config: QuizBattleConfig) => {
    const backendQuestions = parseBackendQuizQuestions(await fetchGameQuestions('quiz-battle'))
    const mergedQuestions = mergeQuestionSources(config.customQuestions, backendQuestions)
    const arenaConfig: QuizBattleConfig = {
      ...config,
      customQuestions: mergedQuestions,
    }

    saveLastSetup(config)
    const sessionKey = createSessionConfigKey()
    saveSessionConfig(sessionKey, arenaConfig)
    navigate(`/games/quiz-battle/arena?session=${encodeURIComponent(sessionKey)}`)
  }

  return (
    <div className="quizbattle-shell relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_10%,#12203b_0%,transparent_28%),radial-gradient(circle_at_85%_14%,#30134d_0%,transparent_30%),radial-gradient(circle_at_20%_85%,#0f3f53_0%,transparent_34%),linear-gradient(165deg,#050b1a_0%,#0b1022_55%,#140c2e_100%)] text-white">
      <div className="quizbattle-shell-glow pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_16%,rgba(34,211,238,0.28),transparent_22%),radial-gradient(circle_at_90%_22%,rgba(232,121,249,0.23),transparent_26%),radial-gradient(circle_at_18%_84%,rgba(56,189,248,0.18),transparent_24%)]" />
      <QuizBattleBackdrop />
      <div className="relative z-10">
        <Navbar />
        <main className="quizbattle-page-main mx-auto max-w-[1400px] px-4 pb-16 pt-10 sm:px-6">
          <Lobby initialConfig={initialConfig} onStart={handleStart} />
          <section className="quizbattle-link-panel mx-auto mt-6 max-w-5xl rounded-[2rem] border border-white/12 bg-white/8 p-4 backdrop-blur-xl">
            <div className="quizbattle-link-panel-inner rounded-[1.75rem] bg-white/95 p-1 shadow-soft">
              <QuestionManagerLinkCard
                className="border-white/0 bg-white"
                gameTitle={game?.title ?? 'Quiz Battle'}
                itemCount={teacherQuestionCount}
                canManage={canUseTeacherContent}
                setupMode="local-and-central"
              />
            </div>
          </section>
        </main>
        <div className="mx-auto max-w-[1320px] px-4 pb-10 sm:px-6">
          <GameCommentsSection gameId={game.id} gameTitle={game.title} />
        </div>
        <FooterCTA />
      </div>
    </div>
  )
}

export default QuizBattleSetupPage
