import { useEffect, useMemo, useRef, useState } from 'react'
import ConfettiOverlay from '../../components/ConfettiOverlay.tsx'
import type { TezkorGuruhConfig, TezkorGuruhQuestion, TezkorGuruhTeam } from '../types.ts'
import { DEFAULT_TEZKOR_GURUH_QUESTIONS } from '../data/defaultQuestions.ts'

type TezkorGuruhArenaProps = {
  config: TezkorGuruhConfig
  onFinish: (teams: TezkorGuruhTeam[]) => void
  onBackToSetup: () => void
}

const difficultyPoints: Record<TezkorGuruhConfig['difficulty'], number> = {
  easy: 10,
  medium: 15,
  hard: 20,
}

const buildTeams = (config: TezkorGuruhConfig): TezkorGuruhTeam[] =>
  Array.from({ length: config.teamCount }, (_, index) => ({
    id: `team-${index + 1}`,
    name: config.teamNames[index] ?? `Jamoa ${index + 1}`,
    score: 0,
  }))

const buildQuestionDeck = (config: TezkorGuruhConfig): TezkorGuruhQuestion[] => {
  const pool = DEFAULT_TEZKOR_GURUH_QUESTIONS.filter((q) => q.difficulty === config.difficulty || config.difficulty === 'easy')
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(config.questionCount, shuffled.length))
}

function TezkorGuruhArena({ config, onFinish, onBackToSetup }: TezkorGuruhArenaProps) {
  const [teams, setTeams] = useState<TezkorGuruhTeam[]>(() => buildTeams(config))
  const [questionDeck] = useState<TezkorGuruhQuestion[]>(() => buildQuestionDeck(config))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [buzzedTeamId, setBuzzedTeamId] = useState<string | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [message, setMessage] = useState('Tayyor bo‘ling, jamoalar!')
  const [timerLeft, setTimerLeft] = useState(config.timerSeconds)
  const [showConfetti, setShowConfetti] = useState(0)
  const timerRef = useRef<number | null>(null)

  const currentQuestion = questionDeck[currentIndex]
  const isFinished = currentIndex >= questionDeck.length

  const resetTimer = () => {
    setTimerLeft(config.timerSeconds)
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    resetTimer()
    timerRef.current = window.setInterval(() => {
      setTimerLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  useEffect(() => {
    if (timerLeft !== 0) return
    if (isFinished) return

    setMessage('Vaqt tugadi! Keyingi savolga o‘tildi.')
    setBuzzedTeamId(null)
    setSelectedAnswer(null)

    const timeout = window.setTimeout(() => {
      setCurrentIndex((prev) => prev + 1)
    }, 1400)

    return () => window.clearTimeout(timeout)
  }, [timerLeft, isFinished])

  const toggleBuzz = (teamId: string) => {
    if (buzzedTeamId || isFinished) return
    setBuzzedTeamId(teamId)
    setMessage(`${teams.find((t) => t.id === teamId)?.name ?? 'Jamoa'} javob berishni boshladi`)
  }

  const finishRound = (teamId: string | null, points: number, correct: boolean) => {
    if (teamId) {
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId
            ? { ...team, score: team.score + points }
            : team,
        ),
      )
    }

    if (correct) {
      setShowConfetti((prev) => prev + 1)
    }

    setTimeout(() => {
      setBuzzedTeamId(null)
      setSelectedAnswer(null)
      setMessage(correct ? 'To‘g‘ri! Keyingi savol.' : 'Noto‘g‘ri. Keyingi savol.')
      setCurrentIndex((prev) => prev + 1)
    }, 1200)
  }

  const handleSelectAnswer = (answer: string) => {
    if (!buzzedTeamId || selectedAnswer) return
    setSelectedAnswer(answer)
    const correct = answer === currentQuestion.correctAnswer
    const points = correct ? difficultyPoints[config.difficulty] : 0
    finishRound(buzzedTeamId, points, correct)
  }

  const handleFinish = () => {
    onFinish(teams)
  }

  useEffect(() => {
    if (isFinished) {
      resetTimer()
      const finishTimer = window.setTimeout(handleFinish, 600)
      return () => window.clearTimeout(finishTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished])

  const activeTeam = teams.find((team) => team.id === buzzedTeamId)

  return (
    <div className="tezkor-guruh-arena relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_10%,#061a2c_0%,transparent_34%),radial-gradient(circle_at_85%_16%,#3b103d_0%,transparent_34%),linear-gradient(170deg,#040a17_0%,#0a1021_54%,#130b2a_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_14%,rgba(34,211,238,0.24),transparent_24%),radial-gradient(circle_at_90%_20%,rgba(232,121,249,0.18),transparent_26%),radial-gradient(circle_at_30%_86%,rgba(59,130,246,0.18),transparent_22%)]" />
      <ConfettiOverlay burstKey={showConfetti} />

      <main className="tezkor-guruh-page-main relative z-10 mx-auto max-w-[1400px] px-3 pb-8 pt-5 sm:px-5">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToSetup}
            className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-100 backdrop-blur-sm"
          >
            Sozlamaga qaytish
          </button>
        </div>

        <section className="relative rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-soft backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-kid text-3xl font-black text-white sm:text-4xl">Tezkor guruh</h1>
              <p className="mt-2 max-w-xl text-sm font-bold text-slate-200">
                Har bir savol bir xil, kim birinchi javob bersa o‘sha ball oladi.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold">Savollar:</span>
                <span>{questionDeck.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold">Qolgan:</span>
                <span>{Math.max(0, questionDeck.length - currentIndex)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold">Vaqt:</span>
                <span>{timerLeft}s</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-white">Savol {currentIndex + 1}</h2>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">
                    {currentQuestion?.difficulty ?? '–'}
                  </span>
                </div>
                <p className="mt-3 text-xl font-bold text-white sm:text-2xl">
                  {currentQuestion?.question ?? 'O‘yin tugadi.'}
                </p>

                {currentQuestion ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {currentQuestion.options.map((option) => {
                      const isSelected = selectedAnswer === option
                      const isCorrect = option === currentQuestion.correctAnswer
                      const disableButtons = !buzzedTeamId || Boolean(selectedAnswer)
                      const buttonClasses =
                        'rounded-2xl border border-white/15 px-4 py-3 text-left text-sm font-bold transition ' +
                        (isSelected
                          ? isCorrect
                            ? 'bg-emerald-500/30 text-emerald-100'
                            : 'bg-rose-500/30 text-rose-100'
                          : 'bg-white/5 text-slate-100 hover:bg-white/10')

                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={disableButtons}
                          className={buttonClasses}
                          onClick={() => handleSelectAnswer(option)}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                <p className="mt-4 text-sm font-bold text-slate-200">{message}</p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-200">Jamoalar</h3>
                <div className="mt-4 grid gap-3">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      disabled={Boolean(buzzedTeamId) || isFinished}
                      onClick={() => toggleBuzz(team.id)}
                      className={`flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-left text-sm font-bold transition ${
                        buzzedTeamId === team.id
                          ? 'bg-cyan-500/20 text-white'
                          : 'bg-white/5 text-slate-100 hover:bg-white/10'
                      }`}
                    >
                      <span>{team.name}</span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                        {team.score}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-200">Hozirgi navbat</h3>
                <p className="mt-2 text-lg font-bold text-white">
                  {buzzedTeamId
                    ? teams.find((team) => team.id === buzzedTeamId)?.name ?? '—'
                    : 'Navbat kutmoqda...'}
                </p>
                <p className="mt-1 text-xs text-slate-200">
                  {buzzedTeamId
                    ? 'Jamoa javob berishda.'
                    : 'Biror jamoa “Javob beraman” tugmasini bosing.'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-200">Jami ball</h3>
                <div className="mt-3 grid gap-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-2"
                    >
                      <span className="text-sm font-bold text-white">{team.name}</span>
                      <span className="text-sm font-bold text-white">{team.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {isFinished ? (
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center text-sm font-bold text-slate-200">
                  O'yin tugadi. Natijalar sahifaga o'tilmoqda...
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default TezkorGuruhArena
