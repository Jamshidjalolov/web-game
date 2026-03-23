import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FooterCTA from '../components/FooterCTA.tsx'
import GameCommentsSection from '../components/GameCommentsSection.tsx'
import Navbar from '../components/Navbar.tsx'
import QuestionManagerLinkCard from '../components/QuestionManagerLinkCard.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import { fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'
import AnswersRoyaleBackdrop from '../answersRoyale/components/AnswersRoyaleBackdrop.tsx'
import AnswersRoyaleLobby from '../answersRoyale/components/AnswersRoyaleLobby.tsx'
import { defaultAnswersRoyaleQuestions } from '../answersRoyale/data/defaultQuestions.ts'
import type {
  AnswersRoyaleCategory,
  AnswersRoyaleDifficulty,
  AnswersRoyaleQuestion,
  AnswersRoyaleSetupConfig,
} from '../answersRoyale/types.ts'
import {
  createAnswersRoyaleSessionKey,
  loadAnswersRoyaleCustomBank,
  loadAnswersRoyaleRanking,
  loadAnswersRoyaleSetup,
  saveAnswersRoyaleSession,
  saveAnswersRoyaleSetup,
} from '../answersRoyale/utils/storage.ts'

const defaultTeamNames = ['Moviy jamoa', 'Oltin jamoa'] as const
const normalizeTeamNames = (value: string[] | undefined): [string, string] => ([
  value?.[0]?.trim() || defaultTeamNames[0],
  value?.[1]?.trim() || defaultTeamNames[1],
])

const defaultSetupConfig: AnswersRoyaleSetupConfig = {
  roomName: 'Bilim Arenasi',
  hostLabel: 'Ustoz',
  teamCount: 2,
  teamNames: [...defaultTeamNames],
  totalPlayers: 54,
  category: 'any',
  difficulty: 'hard',
  roundTime: 30,
  eliminationThreshold: 99,
  soundEnabled: true,
  customQuestions: [],
}

const mapDifficulty = (value: string | null | undefined): AnswersRoyaleDifficulty => {
  if (value === 'Oson' || value === 'easy') return 'easy'
  if (value === 'Qiyin' || value === 'hard') return 'hard'
  return 'medium'
}

const validCategories = new Set<AnswersRoyaleCategory>([
  'any',
  'school',
  'nature',
  'geography',
  'science',
  'culture',
  'sports',
])

const parseCategory = (value: unknown): AnswersRoyaleCategory => {
  return typeof value === 'string' && validCategories.has(value as AnswersRoyaleCategory)
    ? value as AnswersRoyaleCategory
    : 'any'
}

const normalizeSignature = (question: AnswersRoyaleQuestion) =>
  `${question.question.trim().toLowerCase()}__${question.correctAnswers.join('|')}`

const mergeBanks = (...banks: AnswersRoyaleQuestion[][]) => {
  const seen = new Set<string>()
  return banks
    .flat()
    .filter((question) => {
      const signature = normalizeSignature(question)
      if (seen.has(signature)) return false
      seen.add(signature)
      return true
    })
    .slice(0, 120)
}

const getMetaArray = (question: BackendQuestion, key: string) => {
  const value = question.metadata_json[key]
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

const parseBackendQuestions = (questions: BackendQuestion[]): AnswersRoyaleQuestion[] => {
  const parsedQuestions: AnswersRoyaleQuestion[] = []

  questions.forEach((question, index) => {
    const answers = getMetaArray(question, 'correctAnswers')
    const normalizedAnswers = Array.from(new Set(
      answers
        .map((answer) => answer.trim().toLowerCase().replace(/\s+/g, ' '))
        .filter(Boolean),
    ))

    if (normalizedAnswers.length < 6) return

    const answerGoalRaw = question.metadata_json.answerGoal
    const answerGoal = typeof answerGoalRaw === 'number'
      ? Math.max(6, Math.min(normalizedAnswers.length, Math.round(answerGoalRaw)))
      : Math.max(6, Math.min(normalizedAnswers.length, normalizedAnswers.length - 1))

    parsedQuestions.push({
      id: `teacher-${question.id}-${index}`,
      question: question.prompt.trim(),
      category: parseCategory(question.metadata_json.category),
      difficulty: mapDifficulty(typeof question.metadata_json.difficulty === 'string' ? question.metadata_json.difficulty : question.difficulty),
      correctAnswers: normalizedAnswers,
      answerGoal,
      hint: question.hint?.trim() || undefined,
      source: 'teacher',
    })
  })

  return parsedQuestions
}

function OneQuestionHundredAnswersSetupPage() {
  const navigate = useNavigate()
  const game = findGameById('one-question-100-answers')
  const canUseTeacherContent = useTeacherGameAccess()
  const ranking = useMemo(() => loadAnswersRoyaleRanking(), [])
  const initialConfig = useMemo<AnswersRoyaleSetupConfig | null>(() => {
    const saved = loadAnswersRoyaleSetup()
    const localCustomQuestions = loadAnswersRoyaleCustomBank()
    return {
      ...defaultSetupConfig,
      ...saved,
      teamCount: saved?.teamCount === 1 ? 1 : 2,
      teamNames: normalizeTeamNames(saved?.teamNames),
      category: 'any',
      difficulty: 'hard',
      roundTime: 30,
      eliminationThreshold: 99,
      customQuestions: localCustomQuestions.length > 0
        ? localCustomQuestions
        : (saved?.customQuestions ?? defaultSetupConfig.customQuestions),
    } satisfies AnswersRoyaleSetupConfig
  }, [])
  const [teacherQuestionCount, setTeacherQuestionCount] = useState(0)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!canUseTeacherContent) {
        if (isMounted) setTeacherQuestionCount(0)
        return
      }

      const teacherQuestions = parseBackendQuestions(await fetchGameQuestions('one-question-100-answers'))
      if (!isMounted) return
      setTeacherQuestionCount(teacherQuestions.length)
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [canUseTeacherContent])

  const handleStart = async (config: AnswersRoyaleSetupConfig) => {
    const teacherQuestions = parseBackendQuestions(await fetchGameQuestions('one-question-100-answers'))
    const mergedQuestions = mergeBanks(defaultAnswersRoyaleQuestions, config.customQuestions, teacherQuestions)
    const nextConfig = {
      ...config,
      customQuestions: mergedQuestions,
    }

    saveAnswersRoyaleSetup(config)
    const sessionKey = createAnswersRoyaleSessionKey()
    saveAnswersRoyaleSession(sessionKey, nextConfig)
    navigate(`/games/one-question-100-answers/arena?session=${encodeURIComponent(sessionKey)}`)
  }

  return (
    <div className="answersroyale-shell relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_10%,#0b2354_0%,transparent_32%),radial-gradient(circle_at_86%_16%,#33184f_0%,transparent_30%),radial-gradient(circle_at_18%_84%,#083b55_0%,transparent_32%),linear-gradient(165deg,#050c1f_0%,#0c1735_56%,#170f35_100%)] text-white">
      <div className="answersroyale-shell-glow pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(34,211,238,0.26),transparent_24%),radial-gradient(circle_at_90%_18%,rgba(251,191,36,0.18),transparent_26%),radial-gradient(circle_at_22%_84%,rgba(96,165,250,0.18),transparent_22%)]" />
      <AnswersRoyaleBackdrop />
      <div className="relative z-10">
        <Navbar />
        <main className="answersroyale-page-main mx-auto max-w-[1460px] px-4 pb-16 pt-10 sm:px-6">
          <AnswersRoyaleLobby
            initialConfig={initialConfig}
            teacherQuestionCount={teacherQuestionCount}
            ranking={ranking}
            onStart={handleStart}
          />

          <section className="answersroyale-link-panel mx-auto mt-6 max-w-5xl rounded-[2rem] border border-white/14 bg-white/8 p-4 backdrop-blur-xl">
            <div className="answersroyale-link-panel-inner rounded-[1.75rem] bg-white/96 p-1 shadow-soft">
              <QuestionManagerLinkCard
                className="border-white/0 bg-white"
                gameTitle={game?.title ?? '1 Savol - 100 Javob'}
                itemCount={teacherQuestionCount}
                canManage={canUseTeacherContent}
                setupMode="local-and-central"
              />
            </div>
          </section>

        </main>
        {game ? (
          <div className="mx-auto max-w-[1320px] px-4 pb-10 sm:px-6">
            <GameCommentsSection gameId={game.id} gameTitle={game.title} />
          </div>
        ) : null}
        <FooterCTA />
      </div>
    </div>
  )
}

export default OneQuestionHundredAnswersSetupPage
