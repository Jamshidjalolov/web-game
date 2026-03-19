import { useMemo, useState } from 'react'
import ConfettiOverlay from '../../components/ConfettiOverlay.tsx'
import { createVisualIqRanking } from '../../lib/backend.ts'
import {
  VISUAL_BRAIN_TEASER_DIFFICULTY_CONFIG,
  VISUAL_BRAIN_TEASER_DIFFICULTY_LABELS,
} from '../data.ts'
import type { VisualBrainTeaserDifficulty, VisualBrainTeaserQuestionResult } from '../types.ts'

export type VisualBrainTeaserTeamResult = {
  id: string
  name: string
  score: number
  correctAnswers: number
}

type VisualBrainTeasersWinnerProps = {
  teams: VisualBrainTeaserTeamResult[]
  difficulty: VisualBrainTeaserDifficulty
  roundCount: number
  questionResults: VisualBrainTeaserQuestionResult[]
  onReplay: () => void
  onBackToSetup: () => void
}

const DIFFICULTY_WEIGHTS: Record<VisualBrainTeaserDifficulty, number> = {
  easy: 1,
  medium: 1.35,
  hard: 1.75,
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const getIqLabel = (iq: number) => {
  if (iq >= 130) return 'Juda yuqori'
  if (iq >= 120) return 'Yuqori'
  if (iq >= 110) return 'Kuchli'
  if (iq >= 95) return 'Yaxshi'
  if (iq >= 85) return "O'rtacha"
  return "Boshlang'ich"
}

const getDifficultySummaryLabel = (results: VisualBrainTeaserQuestionResult[]) => {
  const totals: Record<VisualBrainTeaserDifficulty, number> = { easy: 0, medium: 0, hard: 0 }

  results.forEach((result) => {
    totals[result.difficulty] += 1
  })

  if (totals.hard >= totals.medium && totals.hard >= totals.easy) return 'Progressiv qiyin'
  if (totals.medium >= totals.easy) return "Progressiv o'rta"
  return 'Progressiv oson'
}

const estimateSoloIq = (age: number, results: VisualBrainTeaserQuestionResult[]) => {
  if (!results.length) {
    return null
  }

  const weightedTotal = results.reduce((sum, result) => sum + DIFFICULTY_WEIGHTS[result.difficulty], 0)
  const weightedCorrect = results.reduce(
    (sum, result) => sum + (result.correct ? DIFFICULTY_WEIGHTS[result.difficulty] : 0),
    0,
  )
  const correctResults = results.filter((result) => result.correct)
  const speedScore = correctResults.length
    ? correctResults.reduce((sum, result) => {
      const timerSeconds = VISUAL_BRAIN_TEASER_DIFFICULTY_CONFIG[result.difficulty].timerSeconds
      const ratio = clamp(1 - result.timeSpentSeconds / Math.max(timerSeconds, 1), 0, 1)
      return sum + ratio
    }, 0) / correctResults.length
    : 0
  const accuracy = weightedCorrect / Math.max(weightedTotal, 1)
  const completion = correctResults.length / results.length
  const difficultyLoad = results.reduce((sum, result) => sum + DIFFICULTY_WEIGHTS[result.difficulty], 0) / results.length
  const totalTimeSeconds = Math.round(results.reduce((sum, result) => sum + result.timeSpentSeconds, 0))
  const ageAdjustment = clamp((14 - age) * 1.6, -10, 12)
  const iq = clamp(
    Math.round(78 + accuracy * 38 + completion * 16 + speedScore * 10 + difficultyLoad * 8 + ageAdjustment),
    72,
    148,
  )
  const percentile = clamp(Math.round(100 / (1 + Math.exp(-0.24 * (iq - 100)))), 1, 99)

  return {
    iq,
    percentile,
    accuracyPercent: Math.round(accuracy * 100),
    speedPercent: Math.round(speedScore * 100),
    totalTimeSeconds,
    label: getIqLabel(iq),
  }
}

const sortTeams = (teams: VisualBrainTeaserTeamResult[]) =>
  [...teams].sort(
    (left, right) =>
      right.score - left.score
      || right.correctAnswers - left.correctAnswers
      || left.name.localeCompare(right.name),
  )

function VisualBrainTeasersWinner({
  teams,
  difficulty,
  roundCount,
  questionResults,
  onReplay,
  onBackToSetup,
}: VisualBrainTeasersWinnerProps) {
  const sortedTeams = sortTeams(teams)
  const topTeam = sortedTeams[0] ?? null
  const topScore = topTeam?.score ?? 0
  const winners = sortedTeams.filter((team) => team.score === topScore)
  const isTie = winners.length > 1
  const isSolo = sortedTeams.length === 1
  const totalPoints = sortedTeams.reduce((sum, team) => sum + team.score, 0)
  const [nameInput, setNameInput] = useState(topTeam?.name ?? '')
  const [ageInput, setAgeInput] = useState('')
  const [submittedProfile, setSubmittedProfile] = useState<{ name: string; age: number } | null>(null)
  const [formError, setFormError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const soloIqReport = useMemo(
    () => (isSolo && submittedProfile ? estimateSoloIq(submittedProfile.age, questionResults) : null),
    [isSolo, questionResults, submittedProfile],
  )

  const handleIqSubmit = async () => {
    const cleanName = nameInput.trim()
    const parsedAge = Number(ageInput)

    if (cleanName.length < 2) {
      setFormError('Ismni kamida 2 harf bilan kiriting.')
      return
    }

    if (!Number.isFinite(parsedAge) || parsedAge < 6 || parsedAge > 99) {
      setFormError('Yoshni 6 dan 99 gacha kiriting.')
      return
    }

    const roundedAge = Math.round(parsedAge)
    const report = estimateSoloIq(roundedAge, questionResults)

    if (!report) {
      setFormError("IQ bahosini chiqarish uchun kamida bitta savol natijasi kerak.")
      return
    }

    setFormError('')
    setSaveError('')
    setSubmittedProfile({ name: cleanName, age: roundedAge })
    setSaveState('saving')

    try {
      await createVisualIqRanking({
        playerName: cleanName,
        age: roundedAge,
        iqScore: report.iq,
        percentile: report.percentile,
        correctAnswers: topTeam?.correctAnswers ?? 0,
        roundCount,
        accuracyPercent: report.accuracyPercent,
        speedPercent: report.speedPercent,
        totalTimeSeconds: report.totalTimeSeconds,
        difficultyLabel: getDifficultySummaryLabel(questionResults),
      })
      setSaveState('saved')
    } catch (error) {
      setSaveState('idle')
      setSaveError(error instanceof Error ? error.message : "Reytingga saqlab bo'lmadi.")
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-white/15 bg-[linear-gradient(145deg,rgba(7,16,31,0.95),rgba(18,13,40,0.92))] p-6 shadow-[0_30px_90px_rgba(2,6,23,0.4)] backdrop-blur-xl sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(34,211,238,0.16),transparent_26%),radial-gradient(circle_at_84%_16%,rgba(244,114,182,0.15),transparent_24%),radial-gradient(circle_at_28%_82%,rgba(96,165,250,0.15),transparent_28%)]" />
      <ConfettiOverlay burstKey={1} pieces={104} />

      <div className="relative z-10">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">{isSolo ? 'Natija' : "G'oliblar"}</p>
          <h1 className="mt-3 font-kid text-4xl text-white sm:text-5xl">
            {isSolo
              ? `${topTeam?.name ?? "O'yinchi"} yakuniy natijasi`
              : isTie
                ? "Bir nechta g'olib"
                : `${topTeam?.name ?? 'Jamoa'} birinchi o'rinda`}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-slate-300 sm:text-lg">
            {isSolo
              ? `${topTeam?.name} ${topScore} ball va ${topTeam?.correctAnswers} ta to'g'ri javob bilan sessiyani yakunladi.`
              : isTie
                ? `Bir nechta jamoa ${topScore} ball bilan teng natija qayd etdi.`
                : `${topTeam?.name} ${topScore} ball va ${topTeam?.correctAnswers} ta to'g'ri javob bilan g'olib bo'ldi.`}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-cyan-300/25 bg-cyan-400/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Daraja</p>
            <p className="mt-2 text-2xl font-black text-white">{VISUAL_BRAIN_TEASER_DIFFICULTY_LABELS[difficulty]}</p>
          </div>
          <div className="rounded-[1.5rem] border border-amber-300/25 bg-amber-400/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-100">Raund</p>
            <p className="mt-2 text-2xl font-black text-white">{roundCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-fuchsia-300/25 bg-fuchsia-400/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-100">Jami ball</p>
            <p className="mt-2 text-2xl font-black text-white">{totalPoints}</p>
          </div>
        </div>

        <div className={`mt-8 grid gap-4 ${isSolo ? '' : 'lg:grid-cols-[0.95fr_1.05fr]'}`}>
          <div className="rounded-[1.75rem] border border-white/12 bg-white/6 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">{isSolo ? 'Asosiy natija' : 'Podium'}</p>
            <div className="mt-5 space-y-3">
              {sortedTeams.slice(0, isSolo ? 1 : 3).map((team, index) => (
                <div
                  key={team.id}
                  className={`rounded-[1.5rem] border p-4 ${
                    index === 0 ? 'border-cyan-300/40 bg-cyan-400/12' : 'border-white/12 bg-slate-950/35'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">#{index + 1}</p>
                      <p className="mt-1 text-xl font-black text-white">{team.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white">{team.score}</p>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">{team.correctAnswers} topdi</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isSolo ? (
            <div className="rounded-[1.75rem] border border-white/12 bg-white/6 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">IQ bahosi</p>
              <p className="mt-3 text-sm font-bold leading-6 text-slate-300">
                Ism va yoshni kiriting. Natija to'g'ri javoblar, ishlangan vaqt va savol murakkabligiga qarab hisoblanadi.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(event) => {
                    setNameInput(event.target.value)
                    setSubmittedProfile(null)
                    setSaveState('idle')
                    setSaveError('')
                  }}
                  placeholder="Ismingiz"
                  className="w-full rounded-[1.25rem] border border-white/15 bg-slate-950/40 px-4 py-3 text-lg font-black text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                />
                <input
                  type="number"
                  min={6}
                  max={99}
                  inputMode="numeric"
                  value={ageInput}
                  onChange={(event) => {
                    setAgeInput(event.target.value)
                    setSubmittedProfile(null)
                    setSaveState('idle')
                    setSaveError('')
                  }}
                  placeholder="Yoshingiz"
                  className="w-full rounded-[1.25rem] border border-white/15 bg-slate-950/40 px-4 py-3 text-lg font-black text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  void handleIqSubmit()
                }}
                disabled={saveState === 'saving'}
                className="mt-3 rounded-[1.25rem] bg-[linear-gradient(90deg,#06b6d4_0%,#2563eb_54%,#7c3aed_100%)] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_18px_34px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-70"
              >
                {saveState === 'saving' ? 'Hisoblanmoqda...' : 'IQ ni hisoblash va saqlash'}
              </button>

              {formError ? (
                <p className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-100">
                  {formError}
                </p>
              ) : null}

              {saveError ? (
                <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-50">
                  {saveError}
                </p>
              ) : null}

              {soloIqReport ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-400/10 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">IQ ko'rsatkichi</p>
                    <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-5xl font-black text-white">{soloIqReport.iq}</p>
                        <p className="mt-2 text-sm font-bold text-cyan-100">{soloIqReport.label}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white">{submittedProfile?.name}</p>
                        <p className="mt-1 text-sm font-black text-white">{submittedProfile?.age} yosh</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-100">Percentil {soloIqReport.percentile}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-[1.25rem] border border-white/12 bg-slate-950/35 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Aniqlik</p>
                      <p className="mt-2 text-2xl font-black text-white">{soloIqReport.accuracyPercent}%</p>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/12 bg-slate-950/35 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Tezlik</p>
                      <p className="mt-2 text-2xl font-black text-white">{soloIqReport.speedPercent}%</p>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/12 bg-slate-950/35 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">To'g'ri javob</p>
                      <p className="mt-2 text-2xl font-black text-white">{topTeam?.correctAnswers ?? 0}</p>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/12 bg-slate-950/35 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Umumiy vaqt</p>
                      <p className="mt-2 text-2xl font-black text-white">{soloIqReport.totalTimeSeconds}s</p>
                    </div>
                  </div>

                  <p className="text-sm font-bold leading-6 text-slate-300">
                    {saveState === 'saved'
                      ? "Natija reytingga saqlandi. Top 10 jadvalida eng yuqori IQ natijalari ko'rinadi."
                      : "Natija o'yin bo'yicha hisoblangan IQ bahosi sifatida ishlaydi va vaqt ham hisobga olinadi."}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-white/12 bg-white/6 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">To'liq ranking</p>
              <div className="mt-5 space-y-3">
                {sortedTeams.map((team, index) => (
                  <div
                    key={team.id}
                    className="rounded-[1.5rem] border border-white/12 bg-slate-950/35 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">O'rin #{index + 1}</p>
                        <p className="mt-1 text-lg font-black text-white">{team.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">
                          {team.score} ball
                        </span>
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-cyan-100">
                          {team.correctAnswers} to'g'ri
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onReplay}
            className="rounded-[1.5rem] bg-[linear-gradient(90deg,#06b6d4_0%,#2563eb_54%,#7c3aed_100%)] px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_22px_44px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5"
          >
            Qayta o'yin
          </button>
          <button
            type="button"
            onClick={onBackToSetup}
            className="rounded-[1.5rem] border border-white/15 bg-white/8 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-white/12"
          >
            Sozlamaga qaytish
          </button>
        </div>
      </div>
    </section>
  )
}

export default VisualBrainTeasersWinner
