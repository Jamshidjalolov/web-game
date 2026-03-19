import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  buildDiverseVisualBrainTeaserSet,
  getVisualBrainTeaserOptionCards,
  getVisualBrainTeasersByDifficulty,
  VISUAL_BRAIN_TEASER_CATEGORY_LABELS,
  VISUAL_BRAIN_TEASER_DIFFICULTY_CONFIG,
  VISUAL_BRAIN_TEASER_DIFFICULTY_LABELS,
} from '../visualBrainTeasers/data.ts'
import VisualBrainTeasersWinner, {
  type VisualBrainTeaserTeamResult,
} from '../visualBrainTeasers/components/VisualBrainTeasersWinner.tsx'
import type {
  VisualBrainTeaserDifficulty,
  VisualBrainTeaserPuzzle,
  VisualBrainTeaserQuestionResult,
} from '../visualBrainTeasers/types.ts'

type Difficulty = VisualBrainTeaserDifficulty
type TeamCount = 1 | 2
type TeamStatus = 'idle' | 'wrong' | 'correct'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
const DEFAULT_TEAM_NAMES = ['Topqirlar', 'Bilimdonlar']
const SEEN_QUESTION_IDS_STORAGE_KEY = 'visual-brain-teasers:seen-question-ids:v5'
type QuestionSegmentPlan = {
  level: Difficulty
  count: number
  primaryMarkers?: string[]
  preferredMarkers?: string[]
}

const PROGRESSIVE_QUESTION_PLAN: QuestionSegmentPlan[] = []
const PRIMARY_ADVANCED_MARKERS = ['-logic-', '-combo-', '-hybrid-', '-count-', '-axis-']
const ADVANCED_PREFERRED_MARKERS = [
  '-logic-',
  '-combo-',
  '-hybrid-',
  '-count-',
  '-axis-',
  '-rotation-',
  '-shape-',
  '-size-',
  '-fill-',
  '-color-',
]
const DIFFICULTY_PRIORITY_MAP: Record<Difficulty, Difficulty[]> = {
  easy: ['easy', 'medium', 'hard'],
  medium: ['medium', 'easy', 'hard'],
  hard: ['hard', 'medium', 'easy'],
}

const parseDifficulty = (raw: string | null): Difficulty => {
  if (!raw) return 'hard'
  const candidate = raw.trim() as Difficulty
  return DIFFICULTIES.includes(candidate) ? candidate : 'hard'
}

const parseRounds = (raw: string | null, difficulty: Difficulty) => {
  const allowedRounds = VISUAL_BRAIN_TEASER_DIFFICULTY_CONFIG[difficulty].rounds
  const parsed = Number(raw)
  return allowedRounds.includes(parsed) ? parsed : allowedRounds[0]
}

const parseTeamCount = (raw: string | null): TeamCount => (Number(raw) === 2 ? 2 : 1)

const buildTeams = (teamNames: string[], teamCount: TeamCount): VisualBrainTeaserTeamResult[] =>
  Array.from({ length: teamCount }, (_, index) => ({
    id: `visual-brainteaser-team-${index + 1}`,
    name: teamNames[index] || DEFAULT_TEAM_NAMES[index] || `Jamoa ${index + 1}`,
    score: 0,
    correctAnswers: 0,
  }))

const getStatusLabel = (status: TeamStatus, teamCount: TeamCount) => {
  if (status === 'correct') return "To'g'ri topdi"
  if (status === 'wrong') return teamCount === 1 ? 'Javob xato' : 'Bu savolda xato qildi'
  return teamCount === 1 ? 'Javob kutilyapti' : 'Javob berishi mumkin'
}

const readSeenQuestionIds = () => {
  if (typeof window === 'undefined') return []

  try {
    const rawValue = window.localStorage.getItem(SEEN_QUESTION_IDS_STORAGE_KEY)
    const parsed = rawValue ? JSON.parse(rawValue) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

const writeSeenQuestionIds = (ids: Iterable<string>) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(SEEN_QUESTION_IDS_STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))))
  } catch {
    // Ignore storage write failures and continue with in-memory shuffle.
  }
}

const pickQuestionsForLevel = (
  level: Difficulty,
  count: number,
  usedIds: Set<string>,
  seenIds: Set<string>,
  primaryMarkers: string[] = PRIMARY_ADVANCED_MARKERS,
  preferredMarkers: string[] = ADVANCED_PREFERRED_MARKERS,
) => {
  const exactPool = getVisualBrainTeasersByDifficulty(level)
  const exactPoolIds = new Set<string>(exactPool.map((question) => question.id))
  const unseenCandidates = exactPool.filter((question) => !usedIds.has(question.id) && !seenIds.has(question.id))

  if (unseenCandidates.length < count) {
    exactPoolIds.forEach((id) => seenIds.delete(id))
  }

  const candidates = exactPool.filter((question) => !usedIds.has(question.id) && !seenIds.has(question.id))
  const primaryPreferredCandidates =
    level !== 'easy'
      ? candidates.filter((question) => primaryMarkers.some((marker) => question.id.includes(marker)))
      : []
  const preferredCandidates =
    level !== 'easy'
      ? candidates.filter((question) => preferredMarkers.some((marker) => question.id.includes(marker)))
      : candidates

  const selected = buildDiverseVisualBrainTeaserSet(primaryPreferredCandidates, count)
  if (selected.length < count) {
    const secondaryPreferred = buildDiverseVisualBrainTeaserSet(
      preferredCandidates.filter((question) => !selected.some((picked) => picked.id === question.id)),
      count - selected.length,
    )
    selected.push(...secondaryPreferred)
  }

  if (selected.length < count) {
    const fallback = buildDiverseVisualBrainTeaserSet(
      candidates.filter((question) => !selected.some((picked) => picked.id === question.id)),
      count - selected.length,
    )
    selected.push(...fallback)
  }

  selected.forEach((question) => usedIds.add(question.id))
  return selected
}

const buildQuestionSet = (
  difficulty: Difficulty,
  roundCount: number,
  persistSeenIds = false,
) => {
  const storedSeenIds = new Set<string>(readSeenQuestionIds())
  const usedIds = new Set<string>()
  const selected: VisualBrainTeaserPuzzle[] = []
  let recycledPool = false

  const appendQuestions = (seenIds: Set<string>) => {
    for (const segment of PROGRESSIVE_QUESTION_PLAN) {
      const remainingCount = roundCount - selected.length
      if (remainingCount <= 0) break

      selected.push(
        ...pickQuestionsForLevel(
          segment.level,
          Math.min(segment.count, remainingCount),
          usedIds,
          seenIds,
          segment.primaryMarkers,
          segment.preferredMarkers,
        ),
      )
    }

    if (selected.length < roundCount) {
      for (const level of DIFFICULTY_PRIORITY_MAP[difficulty]) {
        const remainingCount = roundCount - selected.length
        if (remainingCount <= 0) break

        selected.push(...pickQuestionsForLevel(level, remainingCount, usedIds, seenIds))
      }
    }
  }

  appendQuestions(storedSeenIds)

  if (selected.length < roundCount) {
    recycledPool = true
    appendQuestions(new Set<string>())
  }

  const nextQuestions = selected.slice(0, roundCount)

  if (persistSeenIds) {
    writeSeenQuestionIds(
      recycledPool ? nextQuestions.map((question) => question.id) : [...storedSeenIds, ...nextQuestions.map((question) => question.id)],
    )
  }

  return nextQuestions
}

function VisualBrainTeasersArenaPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const transitionRef = useRef<number | null>(null)
  const completedQuestionIdsRef = useRef<Set<string>>(new Set())
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const difficulty = useMemo(() => parseDifficulty(searchParams.get('difficulty')), [searchParams])
  const teamCount = useMemo(() => parseTeamCount(searchParams.get('teamCount')), [searchParams])
  const roundCount = useMemo(() => parseRounds(searchParams.get('rounds'), difficulty), [difficulty, searchParams])
  const initialTeamNames = useMemo(
    () =>
      Array.from({ length: teamCount }, (_, index) => {
        const value = searchParams.get(`team${index + 1}`)?.trim()
        return value || DEFAULT_TEAM_NAMES[index] || `Jamoa ${index + 1}`
      }),
    [searchParams, teamCount],
  )

  const [started, setStarted] = useState(false)
  const [questions, setQuestions] = useState<VisualBrainTeaserPuzzle[]>(() => buildQuestionSet(difficulty, roundCount))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [teams, setTeams] = useState<VisualBrainTeaserTeamResult[]>(() => buildTeams(initialTeamNames, teamCount))
  const [attemptedTeamIds, setAttemptedTeamIds] = useState<string[]>([])
  const [questionWinnerId, setQuestionWinnerId] = useState<string | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | null>>({})
  const [timeLeft, setTimeLeft] = useState(VISUAL_BRAIN_TEASER_DIFFICULTY_CONFIG[difficulty].timerSeconds)
  const [answered, setAnswered] = useState(false)
  const [feedback, setFeedback] = useState("O'yinni boshlash tugmasini bosing.")
  const [history, setHistory] = useState<string[]>([])
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})
  const [questionImageFailures, setQuestionImageFailures] = useState<Record<string, boolean>>({})
  const [questionResults, setQuestionResults] = useState<VisualBrainTeaserQuestionResult[]>([])

  const currentQuestion = questions[currentIndex] ?? null
  const optionCards = useMemo(
    () => (currentQuestion ? getVisualBrainTeaserOptionCards(currentQuestion.options, currentQuestion.option_image_urls) : []),
    [currentQuestion],
  )
  const finished = started && currentIndex >= questions.length
  const isSoloMode = teamCount === 1
  const isSoloViewportMode = isSoloMode && started
  const difficultyConfig = VISUAL_BRAIN_TEASER_DIFFICULTY_CONFIG[difficulty]
  const sortedTeams = useMemo(
    () =>
      [...teams].sort(
        (left, right) =>
          right.score - left.score
          || right.correctAnswers - left.correctAnswers
          || left.name.localeCompare(right.name),
      ),
    [teams],
  )
  const progressPercent = questions.length === 0 ? 0 : Math.min((currentIndex / questions.length) * 100, 100)
  const currentImageUrl = currentQuestion?.image_url ?? ''
  const resolvedCurrentImageUrl = currentQuestion
    ? questionImageFailures[currentQuestion.id] && currentQuestion.fallback_image_url
      ? currentQuestion.fallback_image_url
      : currentQuestion.image_url
    : ''
  const isCurrentImageLoaded = resolvedCurrentImageUrl ? Boolean(loadedImages[resolvedCurrentImageUrl]) : false
  const markImageAsLoaded = useCallback((imageUrl: string) => {
    if (!imageUrl) return
    setLoadedImages((current) => (current[imageUrl] ? current : { ...current, [imageUrl]: true }))
  }, [])

  const clearTransition = () => {
    if (transitionRef.current !== null) {
      window.clearTimeout(transitionRef.current)
      transitionRef.current = null
    }
  }

  const queueNextQuestion = (delay = 1500) => {
    clearTransition()
    transitionRef.current = window.setTimeout(() => {
      setCurrentIndex((current) => current + 1)
    }, delay)
  }

  const recordQuestionResult = useCallback((
    correct: boolean,
    answeredByTeamId: string | null,
    pointsEarned: number,
  ) => {
    if (!currentQuestion || completedQuestionIdsRef.current.has(currentQuestion.id)) return

    completedQuestionIdsRef.current.add(currentQuestion.id)
    setQuestionResults((current) => [
      ...current,
      {
        questionId: currentQuestion.id,
        difficulty: currentQuestion.difficulty,
        correct,
        timeSpentSeconds: Math.max(difficultyConfig.timerSeconds - timeLeft, 0),
        answeredByTeamId,
        pointsEarned,
      },
    ])
  }, [currentQuestion, difficultyConfig.timerSeconds, timeLeft])

  useEffect(() => clearTransition, [])

  useEffect(() => {
    setTeams(buildTeams(initialTeamNames, teamCount))
  }, [initialTeamNames, teamCount])

  useEffect(() => {
    clearTransition()
    setQuestions(buildQuestionSet(difficulty, roundCount))
    setStarted(false)
    setCurrentIndex(0)
    setTeams(buildTeams(initialTeamNames, teamCount))
    setAttemptedTeamIds([])
    setQuestionWinnerId(null)
    setSelectedAnswers({})
    setHistory([])
    setQuestionResults([])
    setQuestionImageFailures({})
    completedQuestionIdsRef.current = new Set()
    setTimeLeft(VISUAL_BRAIN_TEASER_DIFFICULTY_CONFIG[difficulty].timerSeconds)
    setAnswered(false)
    setFeedback("O'yinni boshlash tugmasini bosing.")
  }, [difficulty, initialTeamNames, roundCount, teamCount])

  useEffect(() => {
    if (!questions.length) return

    const preloadCandidates = questions

    preloadCandidates.forEach((question, index) => {
      const image = new Image()
      image.decoding = 'async'
      if (index === 0) {
        ;(image as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'high'
      }
      image.src = question.image_url

      if (image.complete) {
        markImageAsLoaded(question.image_url)
        return
      }

      image.onload = () => markImageAsLoaded(question.image_url)
      image.onerror = () => {
        if (question.fallback_image_url) {
          setQuestionImageFailures((current) => (current[question.id] ? current : { ...current, [question.id]: true }))
          markImageAsLoaded(question.fallback_image_url)
          return
        }
        markImageAsLoaded(question.image_url)
      }
    })
  }, [markImageAsLoaded, questions])

  useEffect(() => {
    if (!started || answered || finished) return undefined

    const intervalId = window.setInterval(() => {
      setTimeLeft((current) => Math.max(current - 1, 0))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [answered, finished, started])

  useEffect(() => {
    if (!started || !currentQuestion || finished) return

    clearTransition()
    setTimeLeft(difficultyConfig.timerSeconds)
    setAnswered(false)
    setAttemptedTeamIds([])
    setQuestionWinnerId(null)
    setSelectedAnswers({})
    setFeedback(
      isSoloMode
        ? "Savolga qarang va to'g'ri rasmli variantni tanlang."
        : "Savol umumiy. Qaysi jamoa to'g'ri topsa, o'sha ballni oladi.",
    )
  }, [currentIndex, currentQuestion, difficultyConfig.timerSeconds, finished, isSoloMode, started])

  useEffect(() => {
    if (!started || answered || finished || timeLeft > 0) return

    setAnswered(true)

    if (attemptedTeamIds.length === 0) {
      recordQuestionResult(false, null, 0)
      setFeedback(
        isSoloMode
          ? 'Vaqt tugadi. Savol yopildi va keyingisi ochiladi.'
          : 'Vaqt tugadi. Hech qaysi jamoa javob bermadi, keyingi savol ochiladi.',
      )
      setHistory((current) => [isSoloMode ? 'Vaqt tugadi' : 'Vaqt tugadi: javob berilmadi', ...current].slice(0, 8))
    } else {
      recordQuestionResult(false, null, 0)
      setFeedback(isSoloMode ? "Javob topilmadi. To'g'ri variant yashil bilan ko'rsatildi." : "Savol yopildi. To'g'ri variant yashil bilan ko'rsatildi.")
      setHistory((current) => [isSoloMode ? 'Savol topilmadi' : 'Savol yopildi', ...current].slice(0, 8))
    }

    queueNextQuestion()
  }, [answered, attemptedTeamIds.length, finished, isSoloMode, recordQuestionResult, started, timeLeft])

  const handleStart = () => {
    const nextQuestions = buildQuestionSet(difficulty, roundCount, true)

    setQuestions(nextQuestions)
    setStarted(true)
    setCurrentIndex(0)
    setTeams(buildTeams(initialTeamNames, teamCount))
    setAttemptedTeamIds([])
    setQuestionWinnerId(null)
    setSelectedAnswers({})
    setHistory([])
    setQuestionResults([])
    setQuestionImageFailures({})
    completedQuestionIdsRef.current = new Set()
    setTimeLeft(difficultyConfig.timerSeconds)
    setAnswered(false)
    setFeedback(
      isSoloMode
        ? "Savolga qarang va to'g'ri rasmli variantni tanlang."
        : "Savol umumiy. Qaysi jamoa to'g'ri topsa, o'sha ballni oladi.",
    )
  }

  const handleAnswer = (teamId: string, option: string) => {
    if (!started || answered || finished || !currentQuestion || attemptedTeamIds.includes(teamId)) return

    const team = teams.find((item) => item.id === teamId)
    if (!team) return

    const isCorrect = option === currentQuestion.correct_answer
    setSelectedAnswers((current) => ({ ...current, [teamId]: option }))

    if (isCorrect) {
      setAnswered(true)
      setQuestionWinnerId(teamId)
      recordQuestionResult(true, teamId, difficultyConfig.points)
      setTeams((current) =>
        current.map((item) =>
          item.id === teamId
            ? {
                ...item,
                score: item.score + difficultyConfig.points,
                correctAnswers: item.correctAnswers + 1,
              }
            : item,
        ),
      )
      setFeedback(`${team.name} to'g'ri topdi. +${difficultyConfig.points} ball.`)
      setHistory((current) => [`${team.name}: +${difficultyConfig.points} ball`, ...current].slice(0, 8))
      queueNextQuestion()
      return
    }

    const nextAttempted = attemptedTeamIds.includes(teamId) ? attemptedTeamIds : [...attemptedTeamIds, teamId]
    const remainingTeams = teams.filter((item) => !nextAttempted.includes(item.id))
    setAttemptedTeamIds(nextAttempted)

    if (remainingTeams.length > 0) {
      setFeedback(`${team.name} xato topdi. Endi ${remainingTeams[0]?.name ?? 'qolgan jamoa'} shu savolda javob berishi mumkin.`)
      setHistory((current) => [`${team.name}: xato javob`, ...current].slice(0, 8))
      return
    }

    setAnswered(true)
    recordQuestionResult(false, null, 0)
    setFeedback(isSoloMode ? "Javob xato. To'g'ri variant yashil bilan ko'rsatildi." : "Ikki jamoa ham topolmadi. To'g'ri variant yashil bilan ko'rsatildi.")
    setHistory((current) => [isSoloMode ? 'Savol topilmadi' : 'Ikki jamoa ham xato topdi', ...current].slice(0, 8))
    queueNextQuestion()
  }

  const handleRestart = () => {
    clearTransition()
    setQuestions(buildQuestionSet(difficulty, roundCount))
    setStarted(false)
    setCurrentIndex(0)
    setTeams(buildTeams(initialTeamNames, teamCount))
    setAttemptedTeamIds([])
    setQuestionWinnerId(null)
    setSelectedAnswers({})
    setHistory([])
    setQuestionResults([])
    setQuestionImageFailures({})
    completedQuestionIdsRef.current = new Set()
    setTimeLeft(difficultyConfig.timerSeconds)
    setAnswered(false)
    setFeedback("O'yinni boshlash tugmasini bosing.")
  }

  const handleBackToSetup = () => {
    navigate('/games/visual-brain-teasers')
  }

  const renderOptionButton = (team: VisualBrainTeaserTeamResult) => (option: (typeof optionCards)[number]) => {
    const selectedOption = selectedAnswers[team.id]
    const isSelected = selectedOption === option.value
    const isCorrect = option.value === currentQuestion?.correct_answer
    const isDisabled = answered || attemptedTeamIds.includes(team.id)
    const isSoloCompact = isSoloMode
    const toneClass = answered
      ? isCorrect
        ? 'border-emerald-300/50 bg-[linear-gradient(135deg,rgba(16,185,129,0.34),rgba(6,95,70,0.78))] text-emerald-50 shadow-[0_20px_38px_rgba(16,185,129,0.28)]'
        : isSelected
          ? 'border-rose-300/50 bg-[linear-gradient(135deg,rgba(244,63,94,0.34),rgba(127,29,29,0.82))] text-rose-50 shadow-[0_20px_38px_rgba(244,63,94,0.28)]'
          : 'border-slate-200/70 bg-slate-100/95 text-slate-500'
      : attemptedTeamIds.includes(team.id)
        ? isSelected
          ? 'border-rose-300/50 bg-[linear-gradient(135deg,rgba(244,63,94,0.34),rgba(127,29,29,0.82))] text-rose-50 shadow-[0_20px_38px_rgba(244,63,94,0.24)]'
          : 'border-slate-200/70 bg-slate-100/95 text-slate-400'
        : 'border-slate-200/95 bg-white text-slate-900 shadow-[0_18px_34px_rgba(15,23,42,0.14)] hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-white hover:shadow-[0_18px_34px_rgba(255,255,255,0.16)]'

    return (
      <button
        key={`${team.id}-${option.value}`}
        type="button"
        onClick={() => handleAnswer(team.id, option.value)}
        disabled={isDisabled}
        className={`w-full overflow-hidden rounded-[1.1rem] border text-left text-sm font-extrabold transition ${
          isSoloCompact ? 'p-2' : 'p-3'
        } ${toneClass} ${isDisabled ? 'cursor-default' : ''}`}
      >
        <div className={`flex items-center justify-between gap-2 ${isSoloCompact ? 'mb-0.5' : 'mb-1.5 gap-2.5'}`}>
          <span
            className={`rounded-full font-black uppercase tracking-[0.14em] ${
              isSoloCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
            } ${
              answered && isCorrect
                ? 'border border-emerald-100/30 bg-white/20 text-white'
                : (answered && isSelected) || (attemptedTeamIds.includes(team.id) && isSelected)
                  ? 'border border-rose-100/30 bg-white/20 text-white'
                  : 'border border-slate-200 bg-slate-100 text-slate-900'
            }`}
          >
            Variant {option.label}
          </span>
          {isSoloCompact ? null : (
            <span className={`${answered || attemptedTeamIds.includes(team.id) ? 'text-current/80' : 'text-slate-500'} text-[11px]`}>
              {option.label}
            </span>
          )}
        </div>
        <div className={`overflow-hidden rounded-[0.9rem] border shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_8px_16px_rgba(15,23,42,0.08)] ${isSoloCompact ? 'border-slate-200/90 bg-white p-0' : 'border-slate-200/90 bg-white p-0.5'}`}>
          <img
            src={option.imageUrl}
            alt={option.alt}
            className={`w-full bg-transparent object-contain drop-shadow-[0_8px_14px_rgba(15,23,42,0.14)] ${isSoloCompact ? 'h-[clamp(10rem,18vh,12rem)]' : 'h-48'}`}
          />
        </div>
      </button>
    )
  }

  const renderQuestionPanel = () => {
    if (!currentQuestion) return null

    if (isSoloMode) {
        return (
          <article className="min-h-0 rounded-[2rem] border border-white/15 bg-white/10 p-2 shadow-soft backdrop-blur-xl">
            <div className="flex h-full min-h-0 flex-col rounded-[1.75rem] border border-white/15 bg-slate-950/30 p-2">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-100">
                Savol {currentIndex + 1}/{questions.length}
              </span>
                <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-4 py-1.5 text-lg font-extrabold text-amber-100">
                  {timeLeft}s
                </span>
              </div>

              <div className="mb-1.5 rounded-[1.15rem] border border-white/12 bg-white/6 px-3 py-1.5">
                <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-cyan-100/80">
                  Matritsadagi qonuniyatni toping
                </p>
                <p className="mt-1 text-center text-[13px] font-extrabold leading-5 text-white sm:text-sm">
                  {currentQuestion.question_uz}
                </p>
                <p className="mt-1 text-center text-[11px] font-bold text-slate-300">
                  Pastdagi variantlardan mosini tanlang.
                </p>
              </div>

              <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.75rem] border border-white/15 bg-slate-900/40">
                {!isCurrentImageLoaded ? (
                  <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-cyan-200/20 bg-slate-950/65 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-100/90">
                    Ochilmoqda...
                  </div>
                ) : null}
              <img
                src={resolvedCurrentImageUrl}
                alt={currentQuestion.question_uz}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onLoad={() => markImageAsLoaded(resolvedCurrentImageUrl)}
                onError={() => {
                  if (currentQuestion.fallback_image_url && !questionImageFailures[currentQuestion.id]) {
                    setQuestionImageFailures((current) => ({ ...current, [currentQuestion.id]: true }))
                    return
                  }
                  markImageAsLoaded(resolvedCurrentImageUrl)
                }}
                className={`h-full w-full bg-white object-contain p-0.5 transition-opacity duration-200 ${
                  isCurrentImageLoaded ? 'opacity-100' : 'opacity-80'
                }`}
              />
            </div>
          </div>
        </article>
      )
    }

    return (
      <article className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-soft backdrop-blur-xl sm:p-6">
        <div className="rounded-[1.75rem] border border-white/15 bg-slate-950/30 p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-200">Savol {currentIndex + 1}</p>
              <h2 className="mt-2 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                {currentQuestion.question_uz}
              </h2>
            </div>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-100">
              {VISUAL_BRAIN_TEASER_CATEGORY_LABELS[currentQuestion.category]}
            </span>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Taymer</p>
              <p className="mt-1 text-3xl font-extrabold text-white">{timeLeft}</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Raund</p>
              <p className="mt-1 text-3xl font-extrabold text-white">{currentIndex + 1}/{questions.length}</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Urinish</p>
              <p className="mt-1 text-3xl font-extrabold text-white">{Math.max(teams.length - attemptedTeamIds.length, 0)}</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-slate-900/40">
            {!isCurrentImageLoaded ? (
              <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-cyan-200/20 bg-slate-950/65 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-100/90">
                Ochilmoqda...
              </div>
            ) : null}
            <img
              src={resolvedCurrentImageUrl}
              alt={currentQuestion.question_uz}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onLoad={() => markImageAsLoaded(resolvedCurrentImageUrl)}
              onError={() => {
                if (currentQuestion.fallback_image_url && !questionImageFailures[currentQuestion.id]) {
                  setQuestionImageFailures((current) => ({ ...current, [currentQuestion.id]: true }))
                  return
                }
                markImageAsLoaded(resolvedCurrentImageUrl)
              }}
              className={`h-[26rem] w-full bg-white/95 object-contain p-4 transition-opacity duration-200 sm:h-[32rem] xl:h-[36rem] ${
                isCurrentImageLoaded ? 'opacity-100' : 'opacity-80'
              }`}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-white/15 bg-white/5 p-4">
            <p className="text-sm font-extrabold text-white">{feedback}</p>
            {answered ? (
              <p className="mt-2 text-sm font-bold leading-5 text-slate-300">{currentQuestion.explanation_uz}</p>
            ) : null}
          </div>
        </div>
      </article>
    )
  }

  const renderTeamPanel = (team: VisualBrainTeaserTeamResult, index: number) => {
    const teamStatus: TeamStatus =
      questionWinnerId === team.id ? 'correct' : attemptedTeamIds.includes(team.id) ? 'wrong' : 'idle'
    const panelLabel = isSoloMode ? "Sizning panel" : index === 0 ? 'Chap jamoa' : "O'ng jamoa"

    if (isSoloMode) {
      return (
        <aside
          key={team.id}
          className={`rounded-[1.45rem] border p-1.5 shadow-soft backdrop-blur-xl ${
            teamStatus === 'correct'
              ? 'border-emerald-300/30 bg-emerald-400/10'
              : teamStatus === 'wrong'
                ? 'border-rose-300/20 bg-rose-400/10'
                : 'border-white/15 bg-white/8'
          }`}
        >
          <div className="grid grid-cols-2 gap-2">
            {optionCards.map(renderOptionButton(team))}
          </div>
        </aside>
      )
    }

    return (
      <aside
        key={team.id}
        className={`rounded-[2rem] border shadow-soft backdrop-blur-xl ${
          isSoloMode ? 'flex flex-col p-3.5' : 'p-5 sm:p-6'
        } ${
          teamStatus === 'correct'
            ? 'border-emerald-300/30 bg-emerald-400/10'
            : teamStatus === 'wrong'
              ? 'border-rose-300/20 bg-rose-400/10'
              : 'border-white/15 bg-white/10'
        }`}
      >
        <div className={`flex items-start justify-between ${isSoloMode ? 'gap-2' : 'gap-3'}`}>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">{panelLabel}</p>
            <h2 className={`font-extrabold text-white ${isSoloMode ? 'mt-1 text-xl' : 'mt-2 text-3xl'}`}>{team.name}</h2>
          </div>
          <div className={`rounded-2xl border border-white/15 bg-slate-950/30 text-right ${isSoloMode ? 'px-2.5 py-2' : 'px-4 py-3'}`}>
            <p className={`font-extrabold text-white ${isSoloMode ? 'text-xl' : 'text-3xl'}`}>{team.score}</p>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">{team.correctAnswers} topdi</p>
          </div>
        </div>

        <div className={`rounded-2xl border border-white/12 bg-slate-950/30 ${isSoloMode ? 'mt-2.5 px-3 py-2' : 'mt-4 px-4 py-3'}`}>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Holat</p>
          <p className={`font-extrabold text-white ${isSoloMode ? 'mt-0.5 text-[13px]' : 'mt-1 text-sm'}`}>{getStatusLabel(teamStatus, teamCount)}</p>
        </div>

        <div className={`${isSoloMode ? 'mt-3 grid grid-cols-3 gap-2.5' : 'mt-5 grid grid-cols-2 gap-3'}`}>
          {optionCards.map(renderOptionButton(team))}
        </div>
      </aside>
    )
  }

  if (questions.length === 0) {
    return <Navigate to="/games/visual-brain-teasers" replace />
  }

  if (finished) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#17315c_0%,transparent_30%),radial-gradient(circle_at_top_right,#4c1b53_0%,transparent_24%),linear-gradient(150deg,#06101f_0%,#0c1428_52%,#130d28_100%)] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.15),transparent_24%),radial-gradient(circle_at_28%_82%,rgba(96,165,250,0.16),transparent_28%)]" />
        <main className="relative z-10 mx-auto max-w-[1180px] px-4 pb-10 pt-8 sm:px-6">
          <VisualBrainTeasersWinner
            teams={sortedTeams}
            difficulty={difficulty}
            roundCount={roundCount}
            questionResults={questionResults}
            onReplay={handleRestart}
            onBackToSetup={handleBackToSetup}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top_left,#17315c_0%,transparent_30%),radial-gradient(circle_at_top_right,#4c1b53_0%,transparent_24%),linear-gradient(150deg,#06101f_0%,#0c1428_52%,#130d28_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.15),transparent_24%),radial-gradient(circle_at_28%_82%,rgba(96,165,250,0.16),transparent_28%)]" />

      <main className={`relative z-10 mx-auto px-4 sm:px-6 ${isSoloViewportMode ? 'flex h-screen max-w-[1180px] flex-col overflow-hidden py-3' : 'max-w-[1480px] pb-8 pt-6'}`}>
        {!isSoloViewportMode ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-200">Rasmli mantiq arenasi</p>
            <h1 className="mt-2 text-4xl font-kid text-white sm:text-5xl">
              {isSoloMode ? "Yakka o'yin" : 'Ikki jamoalik duel'}
            </h1>
            <p className="mt-2 max-w-2xl text-base font-bold text-slate-300">
              {isSoloMode
                ? "Savol tepada turadi, matrix rasm markazda ochiladi, variantlar esa bitta aniq panelda chiqadi."
                : "Savol markazda turadi. Chap va o'ng jamoa o'z panelidan rasmli variantlarni tanlaydi."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/games/visual-brain-teasers"
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-extrabold text-slate-100 transition hover:bg-white/15"
            >
              Sozlamaga qaytish
            </Link>
            {!started ? (
              <button
                type="button"
                onClick={handleStart}
                className="rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-soft transition hover:-translate-y-0.5"
              >
                O'yinni boshlash
              </button>
            ) : null}
          </div>
        </div>
        ) : null}

        {!isSoloViewportMode ? (
        <section className="mt-6 rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-soft backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">Progress</p>
              <p className="mt-1 text-2xl font-extrabold text-white">
                {started ? `Savol ${currentIndex + 1}/${questions.length}` : `Jami ${questions.length} savol`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-100">
                {isSoloMode ? 'Yakka' : 'Duel'}
              </span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-100">
                {VISUAL_BRAIN_TEASER_DIFFICULTY_LABELS[difficulty]}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-100">
                {difficultyConfig.points} ball
              </span>
              <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-amber-100">
                {started ? `${timeLeft}s` : `${difficultyConfig.timerSeconds}s`}
              </span>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee_0%,#2563eb_52%,#8b5cf6_100%)] transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </section>
        ) : null}

        {!started ? (
          isSoloMode ? (
            <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-soft backdrop-blur-xl">
                <div className="rounded-[1.75rem] border border-dashed border-white/20 bg-slate-950/30 p-10 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-200">Markaziy arena</p>
                  <h2 className="mt-3 text-3xl font-extrabold text-white">Savol tepada, rasm markazda</h2>
                  <p className="mt-3 text-base font-bold leading-7 text-slate-300">
                    Puzzle katta ko'rinishda ochiladi, javoblar esa bitta panelda aniq va oson tanlanadi.
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-soft backdrop-blur-xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">Javob paneli</p>
                <h2 className="mt-2 text-3xl font-extrabold text-white">{teams[0]?.name}</h2>
                <p className="mt-3 text-sm font-bold leading-6 text-slate-300">
                  Barcha rasmli variantlar shu blokda chiqadi. To'g'ri topsangiz darhol ball qo'shiladi.
                </p>
              </div>
            </section>
          ) : (
            <section className="mt-6 grid gap-6 xl:grid-cols-[0.88fr_1.24fr_0.88fr]">
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-soft backdrop-blur-xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">Chap panel</p>
                <h2 className="mt-2 text-3xl font-extrabold text-white">{teams[0]?.name}</h2>
                <p className="mt-3 text-sm font-bold leading-6 text-slate-300">
                  Bu tomonda birinchi jamoaning alohida variant tugmalari turadi.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-soft backdrop-blur-xl">
                <div className="rounded-[1.75rem] border border-dashed border-white/20 bg-slate-950/30 p-12 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-200">Markaziy savol</p>
                  <h2 className="mt-3 text-3xl font-extrabold text-white">Savol va rasm shu yerda ochiladi</h2>
                  <p className="mt-3 text-base font-bold leading-7 text-slate-300">
                    O'yin boshlangach puzzle rasmi markazda chiqadi, ikki jamoa esa ikki tomondan javob tanlaydi.
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-soft backdrop-blur-xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">O'ng panel</p>
                <h2 className="mt-2 text-3xl font-extrabold text-white">{teams[1]?.name}</h2>
                <p className="mt-3 text-sm font-bold leading-6 text-slate-300">
                  Ikkinchi jamoa ham shu savol uchun o'z tarafidagi variantlarni bosadi.
                </p>
              </div>
            </section>
          )
        ) : currentQuestion ? (
          <>
            {isSoloMode ? (
              <section className={`${isSoloViewportMode ? 'mt-0 grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-2' : 'mt-6 flex flex-col gap-2.5'}`}>
                {renderQuestionPanel()}
                {teams[0] ? renderTeamPanel(teams[0], 0) : null}
              </section>
            ) : (
              <section className="mt-6 grid gap-6 xl:grid-cols-[0.88fr_1.24fr_0.88fr]">
                {teams[0] ? renderTeamPanel(teams[0], 0) : null}
                {renderQuestionPanel()}
                {teams[1] ? renderTeamPanel(teams[1], 1) : null}
              </section>
            )}

            {!isSoloMode ? (
            <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-soft backdrop-blur-xl sm:p-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">
                  Skorboard
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {teams.map((team) => (
                    <div key={team.id} className="rounded-[1.5rem] border border-white/12 bg-slate-950/30 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-extrabold text-white">{team.name}</p>
                          <p className="mt-1 text-sm font-bold text-slate-300">{team.correctAnswers} ta to'g'ri javob</p>
                        </div>
                        <p className="text-4xl font-extrabold text-white">{team.score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-soft backdrop-blur-xl sm:p-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">Oxirgi holatlar</p>
                <div className="mt-4 space-y-2">
                  {history.length === 0 ? (
                    <p className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm font-bold text-slate-300">
                      Hozircha raund natijalari yo'q.
                    </p>
                  ) : (
                    history.map((item, index) => (
                      <p
                        key={`${item}-${index}`}
                        className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm font-extrabold text-slate-100"
                      >
                        {item}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </section>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  )
}

export default VisualBrainTeasersArenaPage
