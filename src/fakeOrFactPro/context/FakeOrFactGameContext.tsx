import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createFakeOrFactAudioManager } from '../audioManager.ts'
import { buildFakeOrFactDeck, categoryLabelMap, modeLabelMap } from '../QuestionEngine.ts'
import type {
  FakeOrFactDifficulty,
  FakeOrFactQuestion,
  FakeOrFactRankingEntry,
  FakeOrFactRoundResult,
  FakeOrFactSetupConfig,
  FakeOrFactTeamState,
} from '../types.ts'
import { getComboMultiplier, getNextDifficulty, shouldRaiseDifficulty } from '../utils/difficulty.ts'
import { loadFakeOrFactRanking, saveFakeOrFactRanking } from '../utils/storage.ts'

type GamePhase = 'intro' | 'round' | 'reveal' | 'finished'

type FakeOrFactContextValue = {
  config: FakeOrFactSetupConfig
  deck: FakeOrFactQuestion[]
  phase: GamePhase
  currentQuestion: FakeOrFactQuestion | null
  currentRoundIndex: number
  totalRounds: number
  currentDifficulty: FakeOrFactDifficulty
  keyboardTeamId: FakeOrFactTeamState['id']
  teams: FakeOrFactTeamState[]
  activeTurnTeamId: FakeOrFactTeamState['id']
  timeLeft: number
  roundResult: FakeOrFactRoundResult | null
  showIntro: boolean
  burstKey: number
  winnerTeam: FakeOrFactTeamState | null
  soundEnabled: boolean
  categoryLabel: string
  modeLabel: string
  submitAnswer: (teamId: FakeOrFactTeamState['id'], answer: boolean) => void
  setKeyboardTeamId: (teamId: FakeOrFactTeamState['id']) => void
  toggleSound: () => void
  goToNextRound: () => void
  restartGame: () => void
}

const FakeOrFactGameContext = createContext<FakeOrFactContextValue | null>(null)

const createTeams = (teamNames: [string, string]): FakeOrFactTeamState[] => ([
  {
    id: 'team-a',
    name: teamNames[0],
    score: 0,
    streak: 0,
    bestStreak: 0,
    comboMultiplier: 1,
    answeredAt: null,
    selectedAnswer: null,
    isCorrect: null,
    lastPoints: 0,
  },
  {
    id: 'team-b',
    name: teamNames[1],
    score: 0,
    streak: 0,
    bestStreak: 0,
    comboMultiplier: 1,
    answeredAt: null,
    selectedAnswer: null,
    isCorrect: null,
    lastPoints: 0,
  },
])

type FakeOrFactGameProviderProps = {
  config: FakeOrFactSetupConfig
  children: ReactNode
}

function FakeOrFactGameProvider({ config, children }: FakeOrFactGameProviderProps) {
  const [deck, setDeck] = useState<FakeOrFactQuestion[]>(() => buildFakeOrFactDeck(config))
  const [teams, setTeams] = useState<FakeOrFactTeamState[]>(() => createTeams(config.teamNames))
  const [phase, setPhase] = useState<GamePhase>('intro')
  const [showIntro, setShowIntro] = useState(true)
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [currentDifficulty, setCurrentDifficulty] = useState<FakeOrFactDifficulty>(config.startingDifficulty)
  const [timeLeft, setTimeLeft] = useState(config.startingDifficulty === 'hard' ? 20 : config.startingDifficulty === 'medium' ? 30 : 40)
  const [roundResult, setRoundResult] = useState<FakeOrFactRoundResult | null>(null)
  const [keyboardTeamId, setKeyboardTeamId] = useState<FakeOrFactTeamState['id']>('team-a')
  const [burstKey, setBurstKey] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(config.soundEnabled)

  const teamsRef = useRef(teams)
  const phaseRef = useRef<GamePhase>(phase)
  const tickSecondRef = useRef<number | null>(null)
  const audioManagerRef = useRef(createFakeOrFactAudioManager())
  const rankingSavedRef = useRef(false)

  const currentQuestion = deck[currentRoundIndex] ?? null
  const totalRounds = deck.length
  const activeTurnTeamId = currentRoundIndex % 2 === 0 ? 'team-a' : 'team-b'
  const winnerTeam = useMemo(
    () => teams.slice().sort((left, right) => right.score - left.score || right.bestStreak - left.bestStreak)[0] ?? null,
    [teams],
  )

  useEffect(() => {
    teamsRef.current = teams
  }, [teams])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    audioManagerRef.current.setEnabled(soundEnabled)
  }, [soundEnabled])

  const getRoundDuration = (difficulty: FakeOrFactDifficulty) => {
    if (difficulty === 'hard') return 20
    if (difficulty === 'medium') return 30
    return 40
  }

  const resetTeamsForNextRound = (sourceTeams: FakeOrFactTeamState[]) => (
    sourceTeams.map((team) => ({
      ...team,
      answeredAt: null,
      selectedAnswer: null,
      isCorrect: null,
      lastPoints: 0,
    }))
  )

  const saveRanking = (finalWinner: FakeOrFactTeamState | null) => {
    if (!finalWinner || rankingSavedRef.current) return

    rankingSavedRef.current = true
    const entry: FakeOrFactRankingEntry = {
      id: `fake-fact-rank-${Date.now()}`,
      roomName: config.roomName,
      winnerName: finalWinner.name,
      mode: config.mode,
      score: finalWinner.score,
      recordedAt: new Date().toISOString(),
    }

    const nextRanking = [entry, ...loadFakeOrFactRanking()]
      .sort((left, right) => right.score - left.score)
      .slice(0, 12)

    saveFakeOrFactRanking(nextRanking)
  }

  const openNextRound = (nextRoundIndex: number, nextDifficulty: FakeOrFactDifficulty, nextTeams: FakeOrFactTeamState[]) => {
    setCurrentRoundIndex(nextRoundIndex)
    setCurrentDifficulty(nextDifficulty)
    setTimeLeft(getRoundDuration(nextDifficulty))
    setTeams(resetTeamsForNextRound(nextTeams))
    setRoundResult(null)
    setKeyboardTeamId(config.mode === 'class' ? (nextRoundIndex % 2 === 0 ? 'team-a' : 'team-b') : 'team-a')
    setPhase('round')
  }

  const resolveRound = () => {
    if (phaseRef.current !== 'round' || !currentQuestion) return

    const activeTeams = teamsRef.current
    const correctTeams = activeTeams.filter((team) => team.selectedAnswer === currentQuestion.answer)

    let fastestTeamId: FakeOrFactTeamState['id'] | null = null
    if (config.mode === 'speed' && correctTeams.length > 0) {
      fastestTeamId = correctTeams
        .slice()
        .sort((left, right) => (left.answeredAt ?? Number.POSITIVE_INFINITY) - (right.answeredAt ?? Number.POSITIVE_INFINITY))[0]?.id ?? null
    }

    const updatedTeams = activeTeams.map((team) => {
      const wasCorrect = team.selectedAnswer === currentQuestion.answer
      const nextStreak = wasCorrect ? team.streak + 1 : 0
      const nextMultiplier = getComboMultiplier(nextStreak)
      let awardedPoints = 0

      if (wasCorrect) {
        awardedPoints = Math.round(currentQuestion.points * nextMultiplier)
        if (fastestTeamId === team.id) {
          awardedPoints += 40
        }
        if (nextStreak > 0 && nextStreak % 3 === 0) {
          awardedPoints += 30
        }
      }

      return {
        ...team,
        score: team.score + awardedPoints,
        streak: nextStreak,
        bestStreak: Math.max(team.bestStreak, nextStreak),
        comboMultiplier: nextMultiplier,
        isCorrect: wasCorrect,
        lastPoints: awardedPoints,
      }
    })

    const difficultyRaised = shouldRaiseDifficulty(updatedTeams) && currentDifficulty !== 'hard'
    const nextDifficulty = difficultyRaised ? getNextDifficulty(currentDifficulty) : currentDifficulty
    const winningTeamId = correctTeams.length === 1 ? correctTeams[0].id : fastestTeamId
    const anyCorrect = correctTeams.length > 0

    setTeams(updatedTeams)
    teamsRef.current = updatedTeams
    setRoundResult({
      question: currentQuestion,
      winningTeamId,
      fastestTeamId,
      anyCorrect,
      difficultyRaised,
      difficultyAfterRound: nextDifficulty,
      teamResults: {
        'team-a': {
          selectedAnswer: updatedTeams[0].selectedAnswer,
          isCorrect: updatedTeams[0].isCorrect === true,
          awardedPoints: updatedTeams[0].lastPoints,
          streakAfterRound: updatedTeams[0].streak,
          comboMultiplierAfterRound: updatedTeams[0].comboMultiplier,
          reactionLabel: updatedTeams[0].isCorrect
            ? updatedTeams[0].streak >= 3
              ? 'SERIYA 3x 🔥'
              : 'SUPER JAVOB!'
            : "Bu safar o'tmadi",
        },
        'team-b': {
          selectedAnswer: updatedTeams[1].selectedAnswer,
          isCorrect: updatedTeams[1].isCorrect === true,
          awardedPoints: updatedTeams[1].lastPoints,
          streakAfterRound: updatedTeams[1].streak,
          comboMultiplierAfterRound: updatedTeams[1].comboMultiplier,
          reactionLabel: updatedTeams[1].isCorrect
            ? updatedTeams[1].streak >= 3
              ? 'SERIYA 3x 🔥'
              : 'SUPER JAVOB!'
            : "Bu safar o'tmadi",
        },
      },
    })
    setCurrentDifficulty(nextDifficulty)
    setPhase('reveal')

    if (anyCorrect) {
      setBurstKey((prev) => prev + 1)
      audioManagerRef.current.play('correct')
    } else {
      audioManagerRef.current.play('wrong')
    }

    if (difficultyRaised) {
      audioManagerRef.current.play('level')
    }
  }

  useEffect(() => {
    const nextDeck = buildFakeOrFactDeck(config)
    const nextTeams = createTeams(config.teamNames)
    setDeck(nextDeck)
    setTeams(nextTeams)
    teamsRef.current = nextTeams
    setPhase('intro')
    setShowIntro(true)
    setCurrentRoundIndex(0)
    setCurrentDifficulty(config.startingDifficulty)
    setTimeLeft(getRoundDuration(config.startingDifficulty))
    setRoundResult(null)
    setKeyboardTeamId('team-a')
    setSoundEnabled(config.soundEnabled)
    rankingSavedRef.current = false
  }, [config])

  useEffect(() => {
    if (!showIntro) return undefined

    const timeout = window.setTimeout(() => {
      setShowIntro(false)
      setPhase('round')
    }, 3200)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [showIntro])

  useEffect(() => {
    if (phase !== 'round' || showIntro) return undefined

    const startedAt = Date.now()
    tickSecondRef.current = timeLeft
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, getRoundDuration(currentDifficulty) - Math.floor((Date.now() - startedAt) / 1000))
      setTimeLeft(remaining)

      if (remaining <= 5 && remaining > 0 && tickSecondRef.current !== remaining) {
        tickSecondRef.current = remaining
        audioManagerRef.current.play('tick')
      }

      const latestTeams = teamsRef.current
      const bothAnswered = latestTeams.every((team) => team.selectedAnswer !== null)

      if (remaining === 0 || bothAnswered) {
        window.clearInterval(interval)
        resolveRound()
      }
    }, 150)

    return () => {
      window.clearInterval(interval)
    }
  }, [currentDifficulty, phase, showIntro, timeLeft])

  const submitAnswer = (teamId: FakeOrFactTeamState['id'], answer: boolean) => {
    if (showIntro || phaseRef.current !== 'round') return

    const currentTeams = teamsRef.current
    const targetTeam = currentTeams.find((team) => team.id === teamId)
    if (!targetTeam) return
    if (targetTeam.selectedAnswer !== null) return

    audioManagerRef.current.play('click')
    const nextTeams = currentTeams.map((team) => (
      team.id === teamId
        ? {
            ...team,
            selectedAnswer: answer,
            answeredAt: Date.now(),
          }
        : team
    ))

    setTeams(nextTeams)
    teamsRef.current = nextTeams
  }

  const goToNextRound = () => {
    if (phase !== 'reveal') return

    if (currentRoundIndex >= totalRounds - 1) {
      setPhase('finished')
      audioManagerRef.current.play('victory')
      saveRanking(winnerTeam)
      return
    }

    openNextRound(currentRoundIndex + 1, currentDifficulty, teamsRef.current)
  }

  useEffect(() => {
    if (phase !== 'reveal') return undefined

    const timeout = window.setTimeout(() => {
      if (currentRoundIndex >= totalRounds - 1) {
        setPhase('finished')
        audioManagerRef.current.play('victory')
        saveRanking(winnerTeam)
        return
      }

      openNextRound(currentRoundIndex + 1, currentDifficulty, teamsRef.current)
    }, currentRoundIndex >= totalRounds - 1 ? 2200 : 1800)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [currentDifficulty, currentRoundIndex, phase, totalRounds, winnerTeam])

  const restartGame = () => {
    const nextDeck = buildFakeOrFactDeck(config)
    const nextTeams = createTeams(config.teamNames)
    setDeck(nextDeck)
    setTeams(nextTeams)
    teamsRef.current = nextTeams
    setPhase('intro')
    setShowIntro(true)
    setCurrentRoundIndex(0)
    setCurrentDifficulty(config.startingDifficulty)
    setTimeLeft(getRoundDuration(config.startingDifficulty))
    setRoundResult(null)
    setKeyboardTeamId('team-a')
    setSoundEnabled(config.soundEnabled)
    rankingSavedRef.current = false
  }

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showIntro || phaseRef.current !== 'round') return
      const key = event.key.toLowerCase()
      if (key === '1') {
        setKeyboardTeamId('team-a')
        return
      }
      if (key === '2') {
        setKeyboardTeamId('team-b')
        return
      }
      if (key === 'f') {
        event.preventDefault()
        submitAnswer(keyboardTeamId, true)
      }
      if (key === 'j') {
        event.preventDefault()
        submitAnswer(keyboardTeamId, false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [keyboardTeamId, showIntro])

  const value = useMemo<FakeOrFactContextValue>(() => ({
    config,
    deck,
    phase,
    currentQuestion,
    currentRoundIndex,
    totalRounds,
    currentDifficulty,
    keyboardTeamId,
    teams,
    activeTurnTeamId,
    timeLeft,
    roundResult,
    showIntro,
    burstKey,
    winnerTeam,
    soundEnabled,
    categoryLabel: categoryLabelMap[config.category],
    modeLabel: modeLabelMap[config.mode],
    submitAnswer,
    setKeyboardTeamId,
    toggleSound,
    goToNextRound,
    restartGame,
  }), [
    activeTurnTeamId,
    burstKey,
    config,
    currentDifficulty,
    currentQuestion,
    currentRoundIndex,
    deck,
    keyboardTeamId,
    phase,
    roundResult,
    showIntro,
    soundEnabled,
    teams,
    timeLeft,
    totalRounds,
    winnerTeam,
  ])

  return (
    <FakeOrFactGameContext.Provider value={value}>
      {children}
    </FakeOrFactGameContext.Provider>
  )
}

export const useFakeOrFactGame = () => {
  const context = useContext(FakeOrFactGameContext)
  if (!context) {
    throw new Error('useFakeOrFactGame must be used inside FakeOrFactGameProvider')
  }
  return context
}

export default FakeOrFactGameProvider
