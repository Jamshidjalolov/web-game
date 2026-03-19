import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import ConfettiOverlay from '../../components/ConfettiOverlay.tsx'
import { defaultAnswersRoyaleQuestions } from '../data/defaultQuestions.ts'
import type {
  AnswersRoyalePlayer,
  AnswersRoyaleQuestion,
  AnswersRoyaleRankingEntry,
  AnswersRoyaleSetupConfig,
  AnswersRoyaleSubmission,
  AnswersRoyaleTeam,
} from '../types.ts'
import { normalizeBattleAnswer } from '../utils/normalize.ts'
import { loadAnswersRoyaleRanking, saveAnswersRoyaleRanking } from '../utils/storage.ts'

type AnswersRoyaleArenaProps = {
  config: AnswersRoyaleSetupConfig
  onBackToSetup: () => void
}

type ArenaPhase = 'idle' | 'question' | 'transition' | 'review' | 'finished'
type RoundReviewState = Record<string, boolean>
type TournamentReviewState = Record<number, RoundReviewState>
type ReviewedSubmissionStatus = 'approved' | 'duplicate' | 'clash' | 'rejected'

type PendingRound = {
  roundNumber: number
  question: AnswersRoyaleQuestion
  submissions: AnswersRoyaleSubmission[]
}

type ReviewedRoundEntry = AnswersRoyaleSubmission & {
  isApproved: boolean
  status: ReviewedSubmissionStatus
}

type TeamRoundView = {
  id: string
  name: string
  submissions: ReviewedRoundEntry[]
  approvedCount: number
  uniqueCount: number
  clashCount: number
  duplicateCount: number
  rejectedCount: number
  points: number
}

type ReviewedRound = {
  roundNumber: number
  question: AnswersRoyaleQuestion
  teams: TeamRoundView[]
  approvedAnswers: string[]
}

const fixedTeamCount = 2 as const
const fixedQuestionCount = 5
const fixedRoundTime = 30
const uniquePointValue = 10
const clashPointValue = 6
const duplicatePenalty = 2
const defaultTeamNames = ['Moviy jamoa', 'Oltin jamoa'] as const

const playerNamePool = [
  'Aziz', 'Malika', 'Sardor', 'Shahzoda', 'Asal', 'Behruz', 'Diyor', 'Madina', 'Ibrohim', 'Mohira',
  'Nilufar', 'Jasur', 'Muslima', 'Abror', 'Mehribon', 'Samandar', 'Sevara', 'Shoxrux', 'Maftuna', 'Shohruh',
  'Hadicha', 'Otabek', 'Sarvinoz', 'Temur', 'Shahina', 'Humoyun', 'Durdona', 'Imron', 'Lola', 'Murod',
  'Mubina', 'Anvar', 'Ruxshona', 'Rustam', 'Soliha', 'Kamron', 'Shirin', 'Javohir', 'Feruza', 'Ulugbek',
  'Madinabonu', 'Akbar', 'Munisa', 'Sanjar', 'Farzona', 'Bekzod', 'Gulnoza', 'Islom', 'Zarina', 'Jamshid',
  'Rayhona', 'Bobur', 'Shahnoza', 'Ziyoda', 'Alisher', 'Muhammadali', 'Asliddin', 'Komila', 'Gulshan', 'Shukrona',
]

const teamThemePool = [
  {
    name: 'Moviy jamoa',
    gradient: 'from-cyan-400 via-sky-500 to-indigo-500',
    panel: 'border-cyan-300/24 bg-cyan-400/10',
    badge: 'border-cyan-300/28 bg-cyan-300/12 text-cyan-50',
  },
  {
    name: 'Oltin jamoa',
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    panel: 'border-amber-300/24 bg-amber-300/10',
    badge: 'border-amber-300/28 bg-amber-300/12 text-amber-50',
  },
] as const

const statusClassMap = {
  approved: 'border-emerald-300/24 bg-emerald-400/12 text-emerald-50',
  duplicate: 'border-cyan-300/24 bg-cyan-400/12 text-cyan-50',
  clash: 'border-amber-300/24 bg-amber-400/12 text-amber-50',
  rejected: 'border-rose-300/24 bg-rose-400/12 text-rose-50',
} as const

const statusLabelMap = {
  approved: 'Noyob',
  duplicate: 'Dublikat',
  clash: 'Bir xil',
  rejected: 'Xato',
} as const

const createTeamInputState = () => ({
  'team-1': '',
  'team-2': '',
})

const shuffle = <T,>(items: T[]) => {
  const next = [...items]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }
  return next
}

const difficultyRank = {
  easy: 1,
  medium: 2,
  hard: 3,
} as const

const normalizeTeamNames = (value: string[] | undefined): [string, string] => ([
  value?.[0]?.trim() || defaultTeamNames[0],
  value?.[1]?.trim() || defaultTeamNames[1],
])

const getTeamTheme = (teamId: string) => teamThemePool[Math.max(0, Number(teamId.split('-')[1] ?? 1) - 1)] ?? teamThemePool[0]

const normalizeQuestionSignature = (question: AnswersRoyaleQuestion) => {
  const normalizedAnswers = Array.from(new Set(
    question.correctAnswers.map((answer) => normalizeBattleAnswer(answer)),
  )).sort()

  return `${normalizeBattleAnswer(question.question)}__${normalizedAnswers.join('|')}`
}

const buildQuestionDeck = (config: AnswersRoyaleSetupConfig) => {
  const bank = config.customQuestions.length > 0 ? config.customQuestions : defaultAnswersRoyaleQuestions
  const uniqueBank = bank.filter((question, index, array) => (
    array.findIndex((item) => normalizeQuestionSignature(item) === normalizeQuestionSignature(question)) === index
  ))
  const filtered = uniqueBank.filter((question) => (
    (config.category === 'any' || question.category === config.category)
    && difficultyRank[question.difficulty] <= difficultyRank[config.difficulty]
  ))
  const fallback = shuffle(filtered.length > 0 ? filtered : uniqueBank)

  if (fallback.length === 0) return []
  return fallback.slice(0, Math.min(fixedQuestionCount, fallback.length))
}

const buildTeams = (config: AnswersRoyaleSetupConfig): AnswersRoyaleTeam[] => {
  const basePlayers = Math.floor(config.totalPlayers / fixedTeamCount)
  const remainder = config.totalPlayers % fixedTeamCount
  const teamNames = normalizeTeamNames(config.teamNames)
  let cursor = 0

  return Array.from({ length: fixedTeamCount }, (_, index) => {
    const playerCount = basePlayers + (index < remainder ? 1 : 0)
    const players: AnswersRoyalePlayer[] = Array.from({ length: playerCount }, (_unused, playerIndex) => {
      const rawName = playerNamePool[cursor % playerNamePool.length]
      cursor += 1
      return {
        id: `team-${index + 1}-player-${playerIndex + 1}`,
        name: `${rawName} ${playerIndex + 1}`,
        teamId: `team-${index + 1}`,
        contribution: 0,
        accuracy: 0,
        isEliminated: false,
      }
    })

    return {
      id: `team-${index + 1}`,
      name: teamNames[index] || teamThemePool[index].name,
      color: teamThemePool[index].gradient,
      score: 0,
      roundDelta: 0,
      approvedAnswers: 0,
      mistakes: 0,
      uniqueAnswers: 0,
      duplicates: 0,
      clashes: 0,
      players,
      isEliminated: false,
    }
  })
}

const rankTeams = (teams: AnswersRoyaleTeam[]) =>
  teams
    .slice()
    .sort((left, right) => (
      right.score - left.score
      || right.approvedAnswers - left.approvedAnswers
      || left.duplicates - right.duplicates
      || left.clashes - right.clashes
      || left.mistakes - right.mistakes
    ))

const createInitialReviewState = (question: AnswersRoyaleQuestion, submissions: AnswersRoyaleSubmission[]) => {
  const referenceAnswers = new Set(question.correctAnswers.map((answer) => normalizeBattleAnswer(answer)))
  return Object.fromEntries(submissions.map((submission) => [submission.id, referenceAnswers.has(submission.normalizedAnswer)]))
}

const resolveReviewedRound = (
  round: PendingRound,
  teams: AnswersRoyaleTeam[],
  reviewState: RoundReviewState,
): ReviewedRound => {
  const approvedByAnswer = new Map<string, AnswersRoyaleSubmission[]>()
  const sortedSubmissions = round.submissions.slice().sort((left, right) => left.submittedAt - right.submittedAt)

  sortedSubmissions.forEach((submission) => {
    if (!reviewState[submission.id]) return
    const current = approvedByAnswer.get(submission.normalizedAnswer) ?? []
    current.push(submission)
    approvedByAnswer.set(submission.normalizedAnswer, current)
  })

  const teamViews = teams.map((team) => {
    const seenByTeam = new Set<string>()
    const submissions = sortedSubmissions
      .filter((submission) => submission.teamId === team.id)
      .map((submission): ReviewedRoundEntry => {
        const isApproved = Boolean(reviewState[submission.id])
        if (!isApproved) return { ...submission, isApproved: false, status: 'rejected' }

        if (seenByTeam.has(submission.normalizedAnswer)) {
          return { ...submission, isApproved: true, status: 'duplicate' }
        }

        seenByTeam.add(submission.normalizedAnswer)
        const sameAnswerEntries = approvedByAnswer.get(submission.normalizedAnswer) ?? []
        const teamIds = new Set(sameAnswerEntries.map((entry) => entry.teamId))
        return {
          ...submission,
          isApproved: true,
          status: teamIds.size > 1 ? 'clash' : 'approved',
        }
      })

    const approvedCount = submissions.filter((item) => item.status === 'approved' || item.status === 'clash').length
    const uniqueCount = submissions.filter((item) => item.status === 'approved').length
    const clashCount = submissions.filter((item) => item.status === 'clash').length
    const duplicateCount = submissions.filter((item) => item.status === 'duplicate').length
    const rejectedCount = submissions.filter((item) => item.status === 'rejected').length

    return {
      id: team.id,
      name: team.name,
      submissions,
      approvedCount,
      uniqueCount,
      clashCount,
      duplicateCount,
      rejectedCount,
      points: uniqueCount * uniquePointValue + clashCount * clashPointValue - duplicateCount * duplicatePenalty,
    }
  })

  const approvedAnswers = Array.from(new Set(
    sortedSubmissions
      .filter((submission) => reviewState[submission.id])
      .map((submission) => submission.normalizedAnswer),
  ))

  return {
    roundNumber: round.roundNumber,
    question: round.question,
    teams: teamViews,
    approvedAnswers,
  }
}

function AnswersRoyaleArena({ config, onBackToSetup }: AnswersRoyaleArenaProps) {
  const [questionDeck, setQuestionDeck] = useState<AnswersRoyaleQuestion[]>(() => buildQuestionDeck(config))
  const [teams, setTeams] = useState<AnswersRoyaleTeam[]>(() => buildTeams(config))
  const [phase, setPhase] = useState<ArenaPhase>('idle')
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<AnswersRoyaleQuestion | null>(null)
  const [timeLeft, setTimeLeft] = useState(fixedRoundTime)
  const [teamInputs, setTeamInputs] = useState<Record<string, string>>(() => createTeamInputState())
  const [teamNotices, setTeamNotices] = useState<Record<string, string>>(() => createTeamInputState())
  const [currentSubmissions, setCurrentSubmissions] = useState<AnswersRoyaleSubmission[]>([])
  const [pendingRounds, setPendingRounds] = useState<PendingRound[]>([])
  const [reviewStateByRound, setReviewStateByRound] = useState<TournamentReviewState>({})
  const [reviewedRounds, setReviewedRounds] = useState<ReviewedRound[]>([])
  const [reviewRoundIndex, setReviewRoundIndex] = useState(0)
  const [winnerTeamId, setWinnerTeamId] = useState<string | null>(null)
  const [burstKey, setBurstKey] = useState(0)
  const [transitionCountdown, setTransitionCountdown] = useState(2)

  const phaseRef = useRef(phase)
  const questionRef = useRef<AnswersRoyaleQuestion | null>(currentQuestion)
  const currentSubmissionsRef = useRef(currentSubmissions)
  const pendingRoundsRef = useRef(pendingRounds)
  const reviewStateRef = useRef(reviewStateByRound)
  const roundStartMsRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasSavedResultRef = useRef(false)
  const transitionTimeoutRef = useRef<number | null>(null)
  const transitionIntervalRef = useRef<number | null>(null)

  const duelTeams = teams.slice(0, fixedTeamCount)
  const totalRounds = questionDeck.length || fixedQuestionCount
  const timerRatio = Math.max(0, Math.min(100, (timeLeft / fixedRoundTime) * 100))
  const currentSubmissionsByTeam = useMemo(() => (
    currentSubmissions.reduce<Record<string, AnswersRoyaleSubmission[]>>((accumulator, submission) => {
      const current = accumulator[submission.teamId] ?? []
      current.push(submission)
      accumulator[submission.teamId] = current
      return accumulator
    }, {})
  ), [currentSubmissions])

  const activePendingRound = phase === 'review' ? pendingRounds[reviewRoundIndex] ?? null : null
  const activeReviewRound = activePendingRound
  const activeReviewState = activeReviewRound
    ? reviewStateByRound[activeReviewRound.roundNumber] ?? {}
    : {}

  const activeReviewSummary = useMemo(() => {
    if (!activeReviewRound || phase === 'finished') return null
    return resolveReviewedRound(activeReviewRound, teams, activeReviewState)
  }, [activeReviewRound, activeReviewState, phase, teams])

  const rankedTeams = useMemo(() => rankTeams(teams), [teams])
  const winnerTeam = rankedTeams.find((team) => team.id === winnerTeamId) ?? rankedTeams[0] ?? null
  const totalApprovedAnswers = teams.reduce((sum, team) => sum + team.approvedAnswers, 0)
  const totalDuplicates = teams.reduce((sum, team) => sum + team.duplicates, 0)
  const totalClashes = teams.reduce((sum, team) => sum + team.clashes, 0)
  const totalMistakes = teams.reduce((sum, team) => sum + team.mistakes, 0)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    questionRef.current = currentQuestion
  }, [currentQuestion])

  useEffect(() => {
    currentSubmissionsRef.current = currentSubmissions
  }, [currentSubmissions])

  useEffect(() => {
    pendingRoundsRef.current = pendingRounds
  }, [pendingRounds])

  useEffect(() => {
    reviewStateRef.current = reviewStateByRound
  }, [reviewStateByRound])

  useEffect(() => {
    const nextDeck = buildQuestionDeck(config)
    if (transitionTimeoutRef.current) window.clearTimeout(transitionTimeoutRef.current)
    if (transitionIntervalRef.current) window.clearInterval(transitionIntervalRef.current)
    setQuestionDeck(nextDeck)
    setTeams(buildTeams(config))
    setPhase('idle')
    phaseRef.current = 'idle'
    setCurrentRoundIndex(0)
    setCurrentQuestion(null)
    setTimeLeft(fixedRoundTime)
    setTeamInputs(createTeamInputState())
    setTeamNotices(createTeamInputState())
    setCurrentSubmissions([])
    setPendingRounds([])
    setReviewStateByRound({})
    setReviewedRounds([])
    setReviewRoundIndex(0)
    setWinnerTeamId(null)
    setTransitionCountdown(2)
    questionRef.current = null
    currentSubmissionsRef.current = []
    pendingRoundsRef.current = []
    reviewStateRef.current = {}
    transitionTimeoutRef.current = null
    transitionIntervalRef.current = null
    hasSavedResultRef.current = false
  }, [config])

  useEffect(() => {
    const audio = new Audio('/audio/bellashuv-loop.wav')
    audio.loop = true
    audio.volume = 0.16
    audioRef.current = audio
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => () => {
    if (transitionTimeoutRef.current) window.clearTimeout(transitionTimeoutRef.current)
    if (transitionIntervalRef.current) window.clearInterval(transitionIntervalRef.current)
  }, [])

  useEffect(() => {
    if (!audioRef.current) return
    if (!config.soundEnabled) {
      audioRef.current.pause()
      return
    }

    if (phase === 'question' || phase === 'finished') {
      void audioRef.current.play().catch(() => undefined)
      return
    }

    audioRef.current.pause()
  }, [config.soundEnabled, phase])

  useEffect(() => {
    if (phase !== 'question') return undefined

    const tick = window.setInterval(() => {
      const elapsed = Date.now() - roundStartMsRef.current
      const remaining = Math.max(0, fixedRoundTime - Math.ceil(elapsed / 1000))
      setTimeLeft(remaining)

      if (elapsed >= fixedRoundTime * 1000) {
        finishCurrentQuestion()
      }
    }, 250)

    return () => window.clearInterval(tick)
  }, [phase])

  const launchRound = (index: number, deckSource: AnswersRoyaleQuestion[]) => {
    const nextQuestion = deckSource[index]
    if (!nextQuestion) return

    setCurrentRoundIndex(index)
    setCurrentQuestion(nextQuestion)
    questionRef.current = nextQuestion
    setPhase('question')
    phaseRef.current = 'question'
    setTimeLeft(fixedRoundTime)
    setTeamInputs(createTeamInputState())
    setTeamNotices(createTeamInputState())
    setCurrentSubmissions([])
    currentSubmissionsRef.current = []
    roundStartMsRef.current = Date.now()
  }

  const startGame = () => {
    const nextDeck = buildQuestionDeck(config)
    if (nextDeck.length === 0) return

    if (transitionTimeoutRef.current) window.clearTimeout(transitionTimeoutRef.current)
    if (transitionIntervalRef.current) window.clearInterval(transitionIntervalRef.current)

    setQuestionDeck(nextDeck)
    setTeams(buildTeams(config))
    setPendingRounds([])
    setReviewStateByRound({})
    setReviewedRounds([])
    setReviewRoundIndex(0)
    setWinnerTeamId(null)
    pendingRoundsRef.current = []
    reviewStateRef.current = {}
    hasSavedResultRef.current = false
    launchRound(0, nextDeck)
  }

  const finishCurrentQuestion = () => {
    if (phaseRef.current !== 'question' || !questionRef.current) return

    const roundNumber = currentRoundIndex + 1
    const nextRound: PendingRound = {
      roundNumber,
      question: questionRef.current,
      submissions: currentSubmissionsRef.current,
    }
    const nextPendingRounds = [...pendingRoundsRef.current, nextRound]
    const nextReviewState = {
      ...reviewStateRef.current,
      [roundNumber]: createInitialReviewState(nextRound.question, nextRound.submissions),
    }

    setPendingRounds(nextPendingRounds)
    pendingRoundsRef.current = nextPendingRounds
    setReviewStateByRound(nextReviewState)
    reviewStateRef.current = nextReviewState
    setTeamInputs(createTeamInputState())
    setTeamNotices(createTeamInputState())
    setCurrentSubmissions([])
    currentSubmissionsRef.current = []

    if (currentRoundIndex >= questionDeck.length - 1) {
      setCurrentQuestion(null)
      setReviewRoundIndex(0)
      setPhase('review')
      phaseRef.current = 'review'
      return
    }

    setPhase('transition')
    phaseRef.current = 'transition'
    setTransitionCountdown(2)

    if (transitionTimeoutRef.current) window.clearTimeout(transitionTimeoutRef.current)
    if (transitionIntervalRef.current) window.clearInterval(transitionIntervalRef.current)

    transitionIntervalRef.current = window.setInterval(() => {
      setTransitionCountdown((prev) => Math.max(1, prev - 1))
    }, 1000)

    transitionTimeoutRef.current = window.setTimeout(() => {
      if (transitionIntervalRef.current) window.clearInterval(transitionIntervalRef.current)
      transitionIntervalRef.current = null
      transitionTimeoutRef.current = null
      launchRound(currentRoundIndex + 1, questionDeck)
    }, 2000)
  }

  const handleSubmitAnswer = (teamId: string) => {
    if (phase !== 'question') return

    const targetTeam = teams.find((team) => team.id === teamId)
    const value = (teamInputs[teamId] ?? '').trim()
    if (!targetTeam) return

    if (!value) {
      setTeamNotices((prev) => ({ ...prev, [teamId]: 'Avval javob yozing.' }))
      return
    }

    const livePlayer = targetTeam.players[0]
    if (!livePlayer) return

    const nextSubmission: AnswersRoyaleSubmission = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      teamId,
      playerId: livePlayer.id,
      answer: value,
      normalizedAnswer: normalizeBattleAnswer(value),
      submittedAt: Date.now(),
      source: 'host',
    }

    setCurrentSubmissions((prev) => {
      const next = [...prev, nextSubmission]
      currentSubmissionsRef.current = next
      return next
    })
    setTeamInputs((prev) => ({ ...prev, [teamId]: '' }))
    setTeamNotices((prev) => ({ ...prev, [teamId]: `${targetTeam.name} javobi saqlandi.` }))
  }

  const setRoundReviewValue = (roundNumber: number, submissionId: string, isApproved: boolean) => {
    setReviewStateByRound((prev) => ({
      ...prev,
      [roundNumber]: {
        ...(prev[roundNumber] ?? {}),
        [submissionId]: isApproved,
      },
    }))
  }

  const restoreReferenceChecks = (round: PendingRound) => {
    setReviewStateByRound((prev) => ({
      ...prev,
      [round.roundNumber]: createInitialReviewState(round.question, round.submissions),
    }))
  }

  const clearRoundReview = (round: PendingRound) => {
    setReviewStateByRound((prev) => ({
      ...prev,
      [round.roundNumber]: Object.fromEntries(round.submissions.map((submission) => [submission.id, false])),
    }))
  }

  const saveWinnerRanking = (finalTeams: AnswersRoyaleTeam[], finalWinnerTeamId: string | null) => {
    if (!finalWinnerTeamId || hasSavedResultRef.current) return
    const winner = finalTeams.find((team) => team.id === finalWinnerTeamId)
    if (!winner) return

    hasSavedResultRef.current = true
    const xpEarned = winner.score * 2 + winner.approvedAnswers * 3 + Math.max(0, 16 - winner.duplicates * 2 - winner.clashes)
    const nextEntry: AnswersRoyaleRankingEntry = {
      id: `rank-${Date.now()}`,
      roomName: config.roomName,
      teamName: winner.name,
      score: winner.score,
      xpEarned,
      recordedAt: new Date().toISOString(),
      approvedAnswers: winner.approvedAnswers,
    }

    const nextRanking = [nextEntry, ...loadAnswersRoyaleRanking()]
      .sort((left, right) => right.score - left.score || right.xpEarned - left.xpEarned)
      .slice(0, 10)

    saveAnswersRoyaleRanking(nextRanking)
  }

  const finalizeReview = () => {
    const baseTeams = buildTeams(config)
    const nextReviewedRounds = pendingRoundsRef.current.map((round) => (
      resolveReviewedRound(round, baseTeams, reviewStateRef.current[round.roundNumber] ?? {})
    ))

    const finalTeams = baseTeams.map((team) => {
      const teamRounds = nextReviewedRounds
        .map((round) => round.teams.find((item) => item.id === team.id))
        .filter((item): item is TeamRoundView => Boolean(item))

      return {
        ...team,
        score: teamRounds.reduce((sum, item) => sum + item.points, 0),
        roundDelta: teamRounds.at(-1)?.points ?? 0,
        approvedAnswers: teamRounds.reduce((sum, item) => sum + item.approvedCount, 0),
        uniqueAnswers: teamRounds.reduce((sum, item) => sum + item.uniqueCount, 0),
        duplicates: teamRounds.reduce((sum, item) => sum + item.duplicateCount, 0),
        clashes: teamRounds.reduce((sum, item) => sum + item.clashCount, 0),
        mistakes: teamRounds.reduce((sum, item) => sum + item.rejectedCount, 0),
      }
    })

    const finalWinnerId = rankTeams(finalTeams)[0]?.id ?? null
    setReviewedRounds(nextReviewedRounds)
    setTeams(finalTeams)
    setWinnerTeamId(finalWinnerId)
    setPhase('finished')
    phaseRef.current = 'finished'
    setBurstKey((prev) => prev + 1)
    saveWinnerRanking(finalTeams, finalWinnerId)
  }

  const resetGame = () => {
    startGame()
  }

  const renderTeamPanel = (team: AnswersRoyaleTeam, side: 'left' | 'right') => {
    const theme = getTeamTheme(team.id)
    const submissions = [...(currentSubmissionsByTeam[team.id] ?? [])].sort((left, right) => right.submittedAt - left.submittedAt)

    return (
      <div
        key={team.id}
        className={`rounded-[1.8rem] border ${theme.panel} bg-[linear-gradient(145deg,rgba(9,26,61,0.92),rgba(18,18,54,0.94))] p-5 shadow-soft backdrop-blur-xl`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${theme.badge}`}>
              {side === 'left' ? 'Chap jamoa' : "O'ng jamoa"}
            </span>
            <h3 className="mt-3 text-3xl font-black text-white">{team.name}</h3>
            <p className="mt-2 text-sm font-bold text-slate-300">{submissions.length} ta javob yozildi</p>
          </div>
          <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-right">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">Jamoa</p>
            <p className="mt-1 text-xl font-black text-white">{team.name.split(' ')[0]}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={teamInputs[team.id] ?? ''}
            onChange={(event) => setTeamInputs((prev) => ({ ...prev, [team.id]: event.target.value }))}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              handleSubmitAnswer(team.id)
            }}
            disabled={phase !== 'question'}
            className="answersroyale-input flex-1"
            placeholder={phase === 'question' ? 'Javobni yozing' : "O'yin tugagach tekshiruv oynasi ochiladi"}
          />
          <button
            type="button"
            onClick={() => handleSubmitAnswer(team.id)}
            disabled={phase !== 'question'}
            className={`rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-white ${
              phase === 'question'
                ? `bg-gradient-to-r ${theme.gradient}`
                : 'cursor-not-allowed border border-white/12 bg-white/8 text-slate-400'
            }`}
          >
            Qabul qilish
          </button>
        </div>

        {teamNotices[team.id] ? (
          <p className="mt-3 rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm font-bold text-slate-100">
            {teamNotices[team.id]}
          </p>
        ) : null}

        <div className="mt-5 rounded-[1.4rem] border border-white/12 bg-white/8 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white">Javoblar ro'yxati</p>
            <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-100">
              {submissions.length} ta
            </span>
          </div>
          <div className="mt-3 max-h-[240px] space-y-2 overflow-auto pr-1">
            {submissions.length > 0 ? (
              submissions.map((submission, index) => (
                <div key={submission.id} className="rounded-xl border border-white/12 bg-slate-950/22 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-white">{submission.answer}</p>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${theme.badge}`}>
                      #{submissions.length - index}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-white/14 bg-white/6 px-4 py-4 text-sm font-bold text-slate-300">
                Javoblar shu yerda yig'iladi.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <section className="answersroyale-panel relative overflow-hidden rounded-[2rem] border border-white/14 bg-[linear-gradient(145deg,rgba(7,20,53,0.95),rgba(11,38,64,0.92),rgba(31,15,59,0.92))] p-5 shadow-soft backdrop-blur-xl sm:p-6">
        <div className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full bg-cyan-300/18 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-44 w-44 rounded-full bg-amber-300/16 blur-3xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full border border-cyan-300/24 bg-cyan-300/12 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
              Minimal arena
            </p>
            <h2 className="mt-3 font-kid text-5xl text-white sm:text-6xl">{config.roomName}</h2>
            <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-200/82">
              5 ta savol davomida faqat javoblar yig'iladi. O'qituvchi barcha savollar tugagach bitta umumiy tekshiruv oynasida hammasini ko'rib chiqadi.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-bold text-slate-100">
            <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2">{pendingRounds.length}/{totalRounds} savol yozib bo'lindi</span>
            <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2">Har savol {fixedRoundTime} soniya</span>
            <button
              type="button"
              onClick={onBackToSetup}
              className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-slate-100 transition hover:-translate-y-0.5"
            >
              Sozlamaga qaytish
            </button>
          </div>
        </div>
      </section>

      <section className="answersroyale-panel rounded-[2rem] border border-white/14 bg-[linear-gradient(145deg,rgba(7,19,49,0.92),rgba(24,12,46,0.92))] p-5 shadow-soft backdrop-blur-xl sm:p-6">
        {phase === 'idle' ? (
          <div className="grid gap-5">
            <div className="rounded-[1.8rem] border border-white/12 bg-white/8 p-6 text-center">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/80">Yangi format</p>
              <h3 className="mt-3 font-kid text-5xl text-white sm:text-6xl">Savol, javob, oxirida tekshiruv</h3>
              <p className="mx-auto mt-4 max-w-3xl text-base font-bold leading-7 text-slate-200/84">
                O'yin paytida ortiqcha panel yo'q. Jamoalar faqat javob yozadi. 5-savoldan keyin barcha javoblar ustoz tomonidan tekshiriladi.
              </p>
            </div>
            <button
              type="button"
              onClick={startGame}
              disabled={questionDeck.length === 0}
              className="answersroyale-primary-cta flex w-full items-center justify-center rounded-2xl px-6 py-4 text-lg font-black uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              O'yinni boshlash
            </button>
          </div>
        ) : null}

        {phase === 'question' && currentQuestion ? (
          <div className="grid gap-5">
            <motion.div
              key={`${currentQuestion.id}-${currentRoundIndex}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34 }}
              className="rounded-[1.9rem] border border-white/14 bg-[linear-gradient(145deg,rgba(11,34,76,0.96),rgba(16,25,61,0.92),rgba(39,17,66,0.96))] p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="rounded-full border border-cyan-300/24 bg-cyan-300/12 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100/80">
                    Savol {currentRoundIndex + 1} / {totalRounds}
                  </p>
                  <p className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-100">
                    {timeLeft} soniya
                  </p>
                </div>
                <span className="rounded-full border border-amber-300/24 bg-amber-300/12 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-100">
                  {currentSubmissions.length} ta umumiy javob
                </span>
              </div>

              <h3 className="mt-5 text-center font-kid text-5xl leading-tight text-white sm:text-6xl">
                {currentQuestion.question}
              </h3>
              <p className="mx-auto mt-4 max-w-3xl text-center text-sm font-bold leading-7 text-slate-200/84">
                {currentQuestion.hint ? `${currentQuestion.hint}. ` : ''}
                30 soniya ichida imkon qadar ko'p javob yozing. Tekshiruv 5 ta savol tugagach bir martada qilinadi.
              </p>
              <div className="mx-auto mt-4 max-w-3xl rounded-2xl border border-cyan-300/24 bg-cyan-300/10 px-5 py-4 text-center">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/78">Misol javoblar</p>
                <p className="mt-2 text-sm font-black text-white">
                  {currentQuestion.correctAnswers.slice(0, 2).join(' | ')}
                </p>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all ${
                    timeLeft <= 5
                      ? 'bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400'
                      : 'bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500'
                  }`}
                  style={{ width: `${timerRatio}%` }}
                />
              </div>
            </motion.div>

            <div className="grid gap-4 lg:grid-cols-2">
              {duelTeams[0] ? renderTeamPanel(duelTeams[0], 'left') : null}
              {duelTeams[1] ? renderTeamPanel(duelTeams[1], 'right') : null}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={finishCurrentQuestion}
                className="rounded-2xl border border-white/14 bg-white/8 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5"
              >
                Savolni yakunlash
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'transition' && currentQuestion ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.9rem] border border-amber-300/24 bg-[linear-gradient(145deg,rgba(58,31,8,0.92),rgba(67,32,10,0.92),rgba(41,18,8,0.92))] p-6 text-center shadow-soft"
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-100/78">
              30 soniya tugadi
            </p>
            <h3 className="mt-3 font-kid text-5xl text-white sm:text-6xl">
              Keyingi savolga o'tyapmiz
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-7 text-amber-50/84">
              {currentRoundIndex + 1}-savol javoblari saqlandi. {transitionCountdown} soniyadan keyin navbatdagi savol ochiladi.
            </p>
            <div className="mx-auto mt-5 grid max-w-3xl gap-3 md:grid-cols-3">
              <div className="answersroyale-stage-stat">
                <p className="answersroyale-stage-stat-label">Tugagan savol</p>
                <p className="answersroyale-stage-stat-value">{currentRoundIndex + 1}</p>
              </div>
              <div className="answersroyale-stage-stat">
                <p className="answersroyale-stage-stat-label">Yozilgan javob</p>
                <p className="answersroyale-stage-stat-value">{pendingRounds.at(-1)?.submissions.length ?? 0}</p>
              </div>
              <div className="answersroyale-stage-stat">
                <p className="answersroyale-stage-stat-label">Keyingi savol</p>
                <p className="answersroyale-stage-stat-value">{currentRoundIndex + 2}</p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </section>

      <AnimatePresence>
        {phase === 'review' && activeReviewRound && activeReviewSummary ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/86 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.32 }}
              className="relative flex max-h-[92vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-[2.2rem] border border-cyan-300/24 bg-[linear-gradient(145deg,rgba(7,22,51,0.98),rgba(12,39,68,0.96),rgba(29,12,53,0.98))] shadow-soft"
            >
              <div className="pointer-events-none absolute -left-24 top-8 h-48 w-48 rounded-full bg-cyan-300/18 blur-3xl" />
              <div className="pointer-events-none absolute -right-24 bottom-8 h-48 w-48 rounded-full bg-amber-300/16 blur-3xl" />

              <div className="relative z-10 grid flex-1 gap-6 overflow-auto p-5 xl:grid-cols-[280px_1fr] sm:p-6">
                <aside className="rounded-[1.8rem] border border-white/12 bg-white/8 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/80">Umumiy tekshiruv</p>
                  <h3 className="mt-2 font-kid text-4xl text-white">5 savol tekshiruvi</h3>
                  <p className="mt-3 text-sm font-bold leading-7 text-slate-200/82">
                    Har savolni navbat bilan ko'rib chiqing. O'qituvchi faqat to'g'ri yoki xato deb belgilaydi, dublikat va bir xil javoblarni tizim o'zi ajratadi.
                  </p>

                  <div className="mt-5 space-y-3">
                    {pendingRounds.map((round, index) => {
                      const isActive = index === reviewRoundIndex
                      const roundState = reviewStateByRound[round.roundNumber] ?? {}
                      const checkedCount = Object.values(roundState).filter(Boolean).length

                      return (
                        <button
                          key={`review-tab-${round.roundNumber}`}
                          type="button"
                          onClick={() => setReviewRoundIndex(index)}
                          className={`w-full rounded-[1.2rem] border px-4 py-4 text-left transition ${
                            isActive
                              ? 'border-cyan-300/24 bg-cyan-300/12'
                              : 'border-white/12 bg-white/8 hover:-translate-y-0.5'
                          }`}
                        >
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-100/76">{round.roundNumber}-savol</p>
                          <p className="mt-2 text-sm font-black leading-6 text-white">{round.question.question}</p>
                          <p className="mt-2 text-xs font-bold text-slate-300">
                            {round.submissions.length} javob, {checkedCount} ta to'g'ri
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </aside>

                <div className="grid gap-5">
                  <div className="rounded-[1.8rem] border border-white/12 bg-white/8 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/80">
                          {activeReviewRound.roundNumber}-savol tekshiruvi
                        </p>
                        <h4 className="mt-3 font-kid text-5xl text-white">{activeReviewRound.question.question}</h4>
                        <p className="mt-3 text-sm font-bold leading-7 text-slate-200/84">
                          O'qituvchi faqat to'g'ri yoki xato deb belgilaydi. To'g'ri qilingan javoblar ichida noyob, bir xil va dublikat holatlarini tizim avtomatik hisoblaydi.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => restoreReferenceChecks(activeReviewRound)}
                          className="rounded-2xl border border-cyan-300/24 bg-cyan-300/12 px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-cyan-50 transition hover:-translate-y-0.5"
                        >
                          Bank bo'yicha check
                        </button>
                        <button
                          type="button"
                          onClick={() => clearRoundReview(activeReviewRound)}
                          className="rounded-2xl border border-rose-300/24 bg-rose-400/10 px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-rose-100 transition hover:-translate-y-0.5"
                        >
                          Hammasini uncheck
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-slate-100">
                      <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2">
                        To'g'ri: {Object.values(activeReviewState).filter(Boolean).length}
                      </span>
                      <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2">
                        Auto noyob: {activeReviewSummary.teams.reduce((sum, team) => sum + team.uniqueCount, 0)}
                      </span>
                      <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2">
                        Auto bir xil: {activeReviewSummary.teams.reduce((sum, team) => sum + team.clashCount, 0)}
                      </span>
                      <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2">
                        Auto dublikat: {activeReviewSummary.teams.reduce((sum, team) => sum + team.duplicateCount, 0)}
                      </span>
                      <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2">
                        Misollar: {activeReviewRound.question.correctAnswers.slice(0, 2).join(' | ')}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {activeReviewSummary.teams.map((teamRound) => {
                      const teamTheme = getTeamTheme(teamRound.id)
                      const teacherApprovedCount = teamRound.submissions.filter((submission) => submission.isApproved).length
                      return (
                        <div key={`review-team-${teamRound.id}`} className={`rounded-[1.8rem] border ${teamTheme.panel} bg-white/8 p-4`}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${teamTheme.badge}`}>
                                {teamRound.name}
                              </span>
                              <p className="mt-3 text-2xl font-black text-white">{teamRound.points} ball</p>
                            </div>
                            <div className="text-right text-xs font-black uppercase tracking-[0.14em] text-slate-300">
                              <p>{teacherApprovedCount} to'g'ri</p>
                              <p>{teamRound.clashCount} bir xil, {teamRound.duplicateCount} dublikat</p>
                            </div>
                          </div>

                          <div className="mt-4 max-h-[480px] space-y-3 overflow-auto pr-1">
                            {teamRound.submissions.length > 0 ? (
                              teamRound.submissions.map((submission) => (
                                <div
                                  key={submission.id}
                                  className={`rounded-[1.2rem] border px-4 py-4 ${
                                    activeReviewState[submission.id]
                                      ? 'border-emerald-300/24 bg-emerald-400/10'
                                      : 'border-white/12 bg-slate-950/24'
                                  }`}
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-black text-white">{submission.answer}</p>
                                        <span
                                          className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                                            activeReviewState[submission.id]
                                              ? 'border-emerald-300/24 bg-emerald-400/12 text-emerald-50'
                                              : 'border-rose-300/24 bg-rose-400/12 text-rose-50'
                                          }`}
                                        >
                                          {activeReviewState[submission.id] ? "To'g'ri" : 'Xato'}
                                        </span>
                                        {activeReviewState[submission.id] ? (
                                          <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${statusClassMap[submission.status]}`}>
                                            Auto: {statusLabelMap[submission.status]}
                                          </span>
                                        ) : null}
                                      </div>
                                      <p className="mt-2 text-xs font-bold text-slate-300">
                                        {activeReviewState[submission.id]
                                          ? `Tizim bu javobni ${statusLabelMap[submission.status].toLowerCase()} sifatida hisoblaydi.`
                                          : 'Xato deb qoldirilgan, hisobga kirmaydi.'}
                                      </p>
                                    </div>
                                    <div className="inline-flex rounded-[1.1rem] border border-white/12 bg-slate-950/32 p-1">
                                      <button
                                        type="button"
                                        onClick={() => setRoundReviewValue(activeReviewRound.roundNumber, submission.id, true)}
                                        aria-pressed={activeReviewState[submission.id]}
                                        className={`rounded-[0.9rem] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                                          activeReviewState[submission.id]
                                            ? 'bg-emerald-400/16 text-emerald-50'
                                            : 'text-slate-300 hover:bg-white/8'
                                        }`}
                                      >
                                        Check
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setRoundReviewValue(activeReviewRound.roundNumber, submission.id, false)}
                                        aria-pressed={!activeReviewState[submission.id]}
                                        className={`rounded-[0.9rem] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                                          activeReviewState[submission.id]
                                            ? 'text-slate-300 hover:bg-white/8'
                                            : 'bg-rose-400/14 text-rose-50'
                                        }`}
                                      >
                                        Uncheck
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="rounded-xl border border-dashed border-white/14 bg-white/6 px-4 py-4 text-sm font-bold text-slate-300">
                                Bu savolda bu jamoa javob yubormagan.
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-white/12 bg-white/8 p-4">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setReviewRoundIndex((prev) => Math.max(0, prev - 1))}
                        disabled={reviewRoundIndex === 0}
                        className="rounded-2xl border border-white/14 bg-white/8 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Oldingi savol
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewRoundIndex((prev) => Math.min(pendingRounds.length - 1, prev + 1))}
                        disabled={reviewRoundIndex >= pendingRounds.length - 1}
                        className="rounded-2xl border border-white/14 bg-white/8 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Keyingi savol
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={finalizeReview}
                        className="answersroyale-primary-cta rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
                      >
                        Yakuniy hisob
                      </button>
                      <button
                        type="button"
                        onClick={onBackToSetup}
                        className="rounded-2xl border border-white/14 bg-white/8 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
                      >
                        Sozlama
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'finished' && winnerTeam ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_22%),rgba(2,6,23,0.88)] p-4 backdrop-blur-md"
          >
            <ConfettiOverlay burstKey={burstKey} />
            <motion.div
              initial={{ opacity: 0, y: 26, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.36 }}
              className="relative flex max-h-[92vh] w-full max-w-[1280px] flex-col overflow-hidden rounded-[2.2rem] border border-emerald-300/26 bg-[linear-gradient(145deg,rgba(6,31,36,0.98),rgba(17,72,59,0.96),rgba(16,23,43,0.98))] p-5 shadow-soft sm:p-6"
            >
              <div className="pointer-events-none absolute -left-16 top-10 h-44 w-44 rounded-full bg-emerald-300/18 blur-3xl" />
              <div className="pointer-events-none absolute -right-16 bottom-8 h-44 w-44 rounded-full bg-cyan-300/16 blur-3xl" />

              <div className="relative z-10 overflow-auto">
                <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100/78">Yakuniy premium modal</p>
                    <h4 className="mt-3 font-kid text-6xl leading-none text-white">{winnerTeam.name}</h4>
                    <p className="mt-4 max-w-3xl text-lg font-bold leading-8 text-emerald-50/86">
                      Barcha 5 savol oxirida ustoz tomonidan tekshirildi. Endi umumiy ball, dublikat va bir xil javoblar bo'yicha yakuniy natija tayyor.
                    </p>

                    <div className="mt-6 grid gap-3 md:grid-cols-4">
                      <div className="answersroyale-stage-stat">
                        <p className="answersroyale-stage-stat-label">G'olib balli</p>
                        <p className="answersroyale-stage-stat-value">{winnerTeam.score}</p>
                      </div>
                      <div className="answersroyale-stage-stat">
                        <p className="answersroyale-stage-stat-label">Jami hisoblangan</p>
                        <p className="answersroyale-stage-stat-value">{totalApprovedAnswers}</p>
                      </div>
                      <div className="answersroyale-stage-stat">
                        <p className="answersroyale-stage-stat-label">Bir xil</p>
                        <p className="answersroyale-stage-stat-value">{totalClashes}</p>
                      </div>
                      <div className="answersroyale-stage-stat">
                        <p className="answersroyale-stage-stat-label">Dublikat</p>
                        <p className="answersroyale-stage-stat-value">{totalDuplicates}</p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-[1.8rem] border border-white/14 bg-white/8 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100/80">5 savol bo'yicha recap</p>
                      <div className="mt-4 max-h-[420px] space-y-3 overflow-auto pr-1">
                        {reviewedRounds.map((round) => (
                          <div key={`round-final-${round.roundNumber}`} className="rounded-[1.4rem] border border-white/12 bg-slate-950/24 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-100/76">{round.roundNumber}-savol</p>
                                <p className="mt-1 text-sm font-black text-white">{round.question.question}</p>
                              </div>
                              <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-100">
                                {round.approvedAnswers.length} ta noyob javob
                              </span>
                            </div>
                            <div className="mt-3 space-y-2">
                              {round.teams.map((teamRound) => (
                                <p key={`${round.roundNumber}-${teamRound.id}`} className="rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-xs font-bold text-slate-100">
                                  {teamRound.name}: {teamRound.points} ball | hisoblangan {teamRound.approvedCount} | dublikat {teamRound.duplicateCount} | bir xil {teamRound.clashCount}
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <div className="rounded-[1.8rem] border border-white/14 bg-white/8 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100/80">Yakuniy jadval</p>
                      <div className="mt-4 space-y-3">
                        {rankedTeams.map((team, index) => (
                          <div
                            key={`team-final-${team.id}`}
                            className={`rounded-2xl border px-4 py-4 ${
                              team.id === winnerTeam.id
                                ? 'border-emerald-300/24 bg-emerald-400/12'
                                : 'border-white/12 bg-white/8'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-300">#{index + 1}</p>
                                <p className="mt-1 text-xl font-black text-white">{team.name}</p>
                              </div>
                              <p className="text-3xl font-black text-white">{team.score}</p>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <p className="rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-sm font-bold text-slate-100">Hisoblangan: {team.approvedAnswers}</p>
                              <p className="rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-sm font-bold text-slate-100">Noyob: {team.uniqueAnswers}</p>
                              <p className="rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-sm font-bold text-slate-100">Bir xil: {team.clashes}</p>
                              <p className="rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-sm font-bold text-slate-100">Dublikat: {team.duplicates}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.8rem] border border-white/14 bg-white/8 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/80">Umumiy statistika</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="answersroyale-stage-stat">
                          <p className="answersroyale-stage-stat-label">Xato javob</p>
                          <p className="answersroyale-stage-stat-value">{totalMistakes}</p>
                        </div>
                        <div className="answersroyale-stage-stat">
                          <p className="answersroyale-stage-stat-label">Jamoalar</p>
                          <p className="answersroyale-stage-stat-value">{rankedTeams.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={resetGame}
                    className="answersroyale-primary-cta rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white"
                  >
                    Qayta o'ynash
                  </button>
                  <button
                    type="button"
                    onClick={onBackToSetup}
                    className="rounded-2xl border border-white/14 bg-white/8 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white"
                  >
                    Sozlama sahifasi
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default AnswersRoyaleArena
