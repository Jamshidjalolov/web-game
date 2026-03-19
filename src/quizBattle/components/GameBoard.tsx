import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { resolveEvent } from '../EventEngine.ts'
import { useSoundEffects } from '../hooks/useSoundEffects.ts'
import type { QuizBattleConfig, QuizCardSlot, TeamState } from '../types.ts'
import { buildCards } from '../utils/board.ts'
import { clearLiveGameState } from '../utils/storage.ts'
import CardGrid from './CardGrid.tsx'
import QuestionModal from './QuestionModal.tsx'
import ScoreBoard from './ScoreBoard.tsx'

type GameBoardProps = {
  config: QuizBattleConfig
  onFinish: (teams: TeamState[]) => void
}

const teamPalette = ['text-cyan-200', 'text-fuchsia-200', 'text-amber-200']
const backgroundAudioUrl = '/audio/the_mountain-children-483305.mp3'

const createTeams = (config: QuizBattleConfig): TeamState[] =>
  config.teamNames.slice(0, config.teamCount).map((name, index) => ({
    id: `team-${index + 1}`,
    name,
    score: 0,
    doubleNext: false,
    color: teamPalette[index] ?? 'text-slate-100',
  }))

const shortcutKeyMap: Record<string, number> = {
  '1': 0,
  '2': 1,
  '3': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  '7': 6,
  '8': 7,
  '9': 8,
  '0': 9,
  '-': 10,
  '=': 11,
  q: 12,
  w: 13,
  e: 14,
  r: 15,
  t: 16,
  y: 17,
  u: 18,
  i: 19,
  o: 20,
  p: 21,
  '[': 22,
  ']': 23,
}

const parseShortcutIndex = (event: KeyboardEvent) => {
  if (event.code.startsWith('Numpad')) {
    const num = Number(event.code.replace('Numpad', ''))
    if (Number.isNaN(num)) return null
    if (num >= 1 && num <= 9) return num - 1
    if (num === 0) return 9
    return null
  }

  return shortcutKeyMap[event.key.toLowerCase()] ?? null
}

function GameBoard({ config, onFinish }: GameBoardProps) {
  const [teams, setTeams] = useState<TeamState[]>(() => createTeams(config))
  const [cards, setCards] = useState<QuizCardSlot[]>(() => buildCards(config))
  const [activeTeamIndex, setActiveTeamIndex] = useState<number>(0)
  const [soundEnabled, setSoundEnabled] = useState(config.soundEnabled)
  const [selectedCard, setSelectedCard] = useState<QuizCardSlot | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [locked, setLocked] = useState(false)
  const [timerLeft, setTimerLeft] = useState(config.timerSeconds)
  const [resolving, setResolving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Kartani tanlang va o`yinni boshlang.')
  const [showConfetti, setShowConfetti] = useState(false)
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null)
  const [shakingCardId, setShakingCardId] = useState<string | null>(null)
  const [modalWrongPulse, setModalWrongPulse] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))
  const [usedCardIds, setUsedCardIds] = useState<string[]>([])

  const timeoutHandlesRef = useRef<number[]>([])
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null)
  const backgroundAudioStartedRef = useRef(false)
  const backgroundAudioUnlockHandlerRef = useRef<(() => void) | null>(null)
  const { playSound } = useSoundEffects(soundEnabled)

  const activeTeam = teams[activeTeamIndex]
  const remainingCards = cards.filter((card) => card.status !== 'resolved').length
  const denseBoard = cards.length > 12

  const queueTimeout = (callback: () => void, ms: number) => {
    const id = window.setTimeout(callback, ms)
    timeoutHandlesRef.current.push(id)
  }

  useEffect(() => () => {
    timeoutHandlesRef.current.forEach((id) => window.clearTimeout(id))
    timeoutHandlesRef.current = []
  }, [])

  useEffect(() => {
    clearLiveGameState()
  }, [])

  useEffect(() => {
    const audio = new Audio(backgroundAudioUrl)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0.18
    backgroundAudioRef.current = audio

    return () => {
      const unlockHandler = backgroundAudioUnlockHandlerRef.current
      if (unlockHandler) {
        window.removeEventListener('pointerdown', unlockHandler)
        window.removeEventListener('keydown', unlockHandler)
        backgroundAudioUnlockHandlerRef.current = null
      }

      audio.pause()
      audio.currentTime = 0
      backgroundAudioRef.current = null
      backgroundAudioStartedRef.current = false
    }
  }, [])

  useEffect(() => {
    const audio = backgroundAudioRef.current
    if (!audio) return

    const detachUnlockListeners = () => {
      const unlockHandler = backgroundAudioUnlockHandlerRef.current
      if (!unlockHandler) return
      window.removeEventListener('pointerdown', unlockHandler)
      window.removeEventListener('keydown', unlockHandler)
      backgroundAudioUnlockHandlerRef.current = null
    }

    const stopAudio = () => {
      audio.pause()
      audio.currentTime = 0
    }

    if (!soundEnabled) {
      detachUnlockListeners()
      stopAudio()
      backgroundAudioStartedRef.current = false
      return
    }

    if (backgroundAudioStartedRef.current) return

    const tryPlay = () => {
      if (!soundEnabled || backgroundAudioStartedRef.current) return
      void audio.play()
        .then(() => {
          backgroundAudioStartedRef.current = true
          detachUnlockListeners()
        })
        .catch(() => {
          // Autoplay blocked. Waiting for next user interaction.
        })
    }

    tryPlay()

    if (!backgroundAudioStartedRef.current && !backgroundAudioUnlockHandlerRef.current) {
      const onFirstInteraction = () => {
        tryPlay()
      }
      backgroundAudioUnlockHandlerRef.current = onFirstInteraction
      window.addEventListener('pointerdown', onFirstInteraction)
      window.addEventListener('keydown', onFirstInteraction)
    }

    return () => {
      detachUnlockListeners()
    }
  }, [soundEnabled])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // Fullscreen can fail silently in unsupported browsers.
    }
  }

  const moveToNextTurn = useCallback(() => {
    setActiveTeamIndex((prev) => (prev + 1) % teams.length)
  }, [teams.length])

  const finishIfDone = useCallback((nextCards: QuizCardSlot[], nextTeams: TeamState[]) => {
    const rest = nextCards.filter((card) => card.status !== 'resolved').length
    if (rest > 0) return

    clearLiveGameState()
    queueTimeout(() => {
      playSound('win')
      onFinish(nextTeams)
    }, 520)
  }, [onFinish, playSound])

  const markCardResolved = useCallback((cardId: string) => {
    const nextCards: QuizCardSlot[] = cards.map((card) =>
      card.id === cardId
        ? {
            ...card,
            status: 'resolved' as const,
          }
        : card,
    )
    setCards(nextCards)
    return nextCards
  }, [cards])

  const resolveCard = useCallback((isCorrect: boolean, timedOut = false) => {
    if (!selectedCard || resolving || !activeTeam) return

    setResolving(true)
    const baseNextTeams = [...teams]
    let nextTeams = [...baseNextTeams]
    let message = ''

    if (selectedCard.content.type === 'question') {
      if (isCorrect) {
        const multiplier = activeTeam.doubleNext ? 2 : 1
        const gainedScore = selectedCard.points * multiplier

        nextTeams = baseNextTeams.map((team, index) =>
          index === activeTeamIndex
            ? { ...team, score: team.score + gainedScore, doubleNext: false }
            : team,
        )
        setShowConfetti(true)
        playSound('correct')
        message = `${activeTeam.name} +${gainedScore} ball oldi`
        queueTimeout(() => setShowConfetti(false), 950)
      } else {
        playSound('wrong')
        setModalWrongPulse(true)
        setShakingCardId(selectedCard.id)
        queueTimeout(() => setModalWrongPulse(false), 360)
        queueTimeout(() => setShakingCardId(null), 360)
        message = timedOut ? `Vaqt tugadi: ${activeTeam.name}` : `Noto'g'ri: ${activeTeam.name}`
      }
    } else if (isCorrect) {
      const resolution = resolveEvent(
        selectedCard.content.eventType,
        selectedCard.points,
        activeTeamIndex,
        baseNextTeams,
      )

      nextTeams = baseNextTeams.map((team, index) => ({
        ...team,
        score: Math.max(0, team.score + resolution.scoreDeltaByTeam[index]),
      }))

      if (resolution.grantDouble) {
        nextTeams = nextTeams.map((team, index) =>
          index === activeTeamIndex
            ? { ...team, doubleNext: true }
            : team,
        )
      }

      if (resolution.swapWithTeamIndex !== null) {
        const a = activeTeamIndex
        const b = resolution.swapWithTeamIndex
        const teamAScore = nextTeams[a].score
        nextTeams[a] = { ...nextTeams[a], score: nextTeams[b].score }
        nextTeams[b] = { ...nextTeams[b], score: teamAScore }
        message = `${nextTeams[a].name} va ${nextTeams[b].name} hisobni almashtirdi`
      } else {
        message = `${activeTeam.name}: ${resolution.message}`
      }

      playSound('event')
    } else {
      message = `${activeTeam.name} eventni o'tkazib yubordi`
    }

    const nextCards = markCardResolved(selectedCard.id)
    setTeams(nextTeams)
    setUsedCardIds((prev) => [...prev, selectedCard.id])
    setStatusMessage(message)

    queueTimeout(() => {
      setModalOpen(false)
      setSelectedCard(null)
      setSelectedAnswerIndex(null)
      setTimerLeft(config.timerSeconds)
      setLocked(false)
      setResolving(false)
      moveToNextTurn()
      finishIfDone(nextCards, nextTeams)
    }, 260)
  }, [
    selectedCard,
    resolving,
    activeTeam,
    teams,
    activeTeamIndex,
    markCardResolved,
    config.timerSeconds,
    moveToNextTurn,
    finishIfDone,
    playSound,
  ])

  const handleSelectCard = useCallback((cardId: string) => {
    if (locked || modalOpen || resolving) return

    const targetCard = cards.find((card) => card.id === cardId)
    if (!targetCard || targetCard.status !== 'hidden') return

    setLocked(true)
    playSound('flip')
    setCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, status: 'flipping' as const } : card)),
    )

    queueTimeout(() => {
      setCards((prev) =>
        prev.map((card) => (card.id === cardId ? { ...card, status: 'opened' as const } : card)),
      )
      setSelectedCard({ ...targetCard, status: 'opened' })
      setSelectedAnswerIndex(null)
      setTimerLeft(config.timerSeconds)
      setModalOpen(true)
    }, 560)
  }, [cards, locked, modalOpen, resolving, playSound, config.timerSeconds])

  const handleSubmitSelectedAnswer = useCallback(() => {
    if (!selectedCard || selectedCard.content.type !== 'question') return
    if (selectedAnswerIndex === null) return

    const selectedAnswer = selectedCard.content.answers[selectedAnswerIndex]
    const isCorrect = selectedAnswer === selectedCard.content.correctAnswer
    resolveCard(isCorrect)
  }, [selectedCard, selectedAnswerIndex, resolveCard])

  useEffect(() => {
    if (!modalOpen || resolving || !selectedCard) return
    if (!config.timerEnabled) return
    if (selectedCard.content.type === 'event') return

    if (timerLeft <= 0) {
      resolveCard(false, true)
      return
    }

    const intervalId = window.setTimeout(() => {
      setTimerLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => window.clearTimeout(intervalId)
  }, [modalOpen, resolving, selectedCard, config.timerEnabled, timerLeft, resolveCard])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (modalOpen || locked) return
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

      const shortcutIndex = parseShortcutIndex(event)
      if (shortcutIndex === null) return
      const card = cards[shortcutIndex]
      if (!card) return

      event.preventDefault()
      handleSelectCard(card.id)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [cards, handleSelectCard, modalOpen, locked])

  return (
    <div className={`quizbattle-board-stage ${denseBoard ? 'space-y-3' : 'space-y-4'}`}>
      <ScoreBoard
        teams={teams}
        activeTeamIndex={activeTeamIndex}
        remainingCards={remainingCards}
        timerEnabled={config.timerEnabled}
        timerSeconds={config.timerSeconds}
        soundEnabled={soundEnabled}
        isFullscreen={isFullscreen}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onToggleFullscreen={toggleFullscreen}
      />

      <AnimatePresence>
        {showConfetti ? (
          <motion.div
            key="correct-confetti"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
          >
            {Array.from({ length: 40 }).map((_, index) => (
              <motion.span
                key={`confetti-${index}`}
                initial={{
                  x: `${(index % 10) * 10}%`,
                  y: '-8%',
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  y: '110%',
                  rotate: 480,
                  opacity: [1, 1, 0],
                  x: `${(index % 10) * 10 + ((index % 2 === 0) ? -4 : 4)}%`,
                }}
                transition={{ duration: 1.2 + (index % 5) * 0.08 }}
                className="absolute h-3 w-2 rounded-full"
                style={{
                  background:
                    index % 4 === 0
                      ? '#22d3ee'
                      : index % 4 === 1
                        ? '#f472b6'
                        : index % 4 === 2
                          ? '#34d399'
                          : '#f59e0b',
                }}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section
        className={`quizbattle-status-shell rounded-[2rem] border border-white/10 bg-slate-900/55 text-white backdrop-blur-md ${
          denseBoard ? 'p-3 sm:p-4' : 'p-4 sm:p-5'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-black uppercase tracking-[0.12em] text-slate-200">
            Jonli Xabar
          </p>
          <span className="quizbattle-status-badge rounded-xl border border-white/20 bg-white/10 px-3 py-1 text-xs font-black text-slate-200">
            {statusMessage}
          </span>
        </div>
      </section>

      <CardGrid
        cards={cards}
        locked={locked}
        shakingCardId={shakingCardId}
        onSelectCard={handleSelectCard}
      />

      <QuestionModal
        open={modalOpen}
        card={selectedCard}
        activeTeamName={activeTeam?.name ?? 'Jamoa'}
        timerLeft={timerLeft}
        timerEnabled={config.timerEnabled}
        resolving={resolving}
        wrongPulse={modalWrongPulse}
        selectedAnswerIndex={selectedAnswerIndex}
        onSelectAnswer={setSelectedAnswerIndex}
        onSubmitSelected={handleSubmitSelectedAnswer}
        onCorrect={() => resolveCard(true)}
        onWrong={() => resolveCard(false)}
      />
    </div>
  )
}

export default GameBoard
