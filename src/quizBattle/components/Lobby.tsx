import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { DifficultyLevel, QuizBattleConfig, QuizQuestion } from '../types.ts'
import { clearCustomQuestionBank, saveCustomQuestionBank } from '../utils/storage.ts'

type LobbyProps = {
  initialConfig: QuizBattleConfig | null
  onStart: (config: QuizBattleConfig) => void
}

const difficultyLabel: Record<DifficultyLevel, string> = {
  easy: 'Oson',
  medium: "O'rta",
  hard: 'Qiyin',
}

const pointsOptions = [5, 10, 15]
const questionCountOptions: QuizBattleConfig['questionCount'][] = [12, 16, 24]
const defaultTimerSeconds = 20

const normalizeTeamNames = (teamCount: 2 | 3, names: string[]) => {
  const fallback = ['1-Jamoa', '2-Jamoa', '3-Jamoa']
  return Array.from({ length: teamCount }, (_, idx) => names[idx]?.trim() || fallback[idx])
}

const normalizeQuestionCount = (value: number | undefined): QuizBattleConfig['questionCount'] =>
  value === 16 || value === 24 ? value : 12

function Lobby({ initialConfig, onStart }: LobbyProps) {
  const [teamCount, setTeamCount] = useState<2 | 3>(initialConfig?.teamCount ?? 2)
  const [teamNames, setTeamNames] = useState<string[]>([
    initialConfig?.teamNames[0] ?? '1-Jamoa',
    initialConfig?.teamNames[1] ?? '2-Jamoa',
    initialConfig?.teamNames[2] ?? '3-Jamoa',
  ])
  const [questionCount, setQuestionCount] = useState<QuizBattleConfig['questionCount']>(
    normalizeQuestionCount(initialConfig?.questionCount),
  )
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialConfig?.difficulty ?? 'medium')
  const [timerEnabled, setTimerEnabled] = useState(initialConfig?.timerEnabled ?? true)
  const [soundEnabled, setSoundEnabled] = useState(initialConfig?.soundEnabled ?? true)
  const [customQuestions, setCustomQuestions] = useState<QuizQuestion[]>(initialConfig?.customQuestions ?? [])

  const [draftQuestion, setDraftQuestion] = useState('')
  const [draftAnswers, setDraftAnswers] = useState(['', '', '', ''])
  const [draftCorrectIndex, setDraftCorrectIndex] = useState(0)
  const [draftPoints, setDraftPoints] = useState(10)
  const [hint, setHint] = useState('')

  const selectedTeamNames = useMemo(
    () => normalizeTeamNames(teamCount, teamNames),
    [teamCount, teamNames],
  )

  useEffect(() => {
    if (customQuestions.length === 0) {
      clearCustomQuestionBank()
      return
    }

    saveCustomQuestionBank(customQuestions)
  }, [customQuestions])

  const addCustomQuestion = () => {
    const question = draftQuestion.trim()
    const answers = draftAnswers.map((item) => item.trim())

    if (!question) {
      setHint('Savol matnini kiriting.')
      return
    }

    if (answers.some((answer) => !answer)) {
      setHint('4 ta javob variantini to`liq kiriting.')
      return
    }

    if (new Set(answers.map((answer) => answer.toLowerCase())).size !== 4) {
      setHint('Variantlar bir-biridan farq qilishi kerak.')
      return
    }

    const correctAnswer = answers[draftCorrectIndex]

    const nextQuestion: QuizQuestion = {
      id: `local-${Date.now()}-${customQuestions.length + 1}`,
      points: draftPoints,
      type: 'question',
      question,
      answers,
      correctAnswer,
      difficulty,
    }

    setCustomQuestions((prev) => [...prev, nextQuestion].slice(0, 36))
    setDraftQuestion('')
    setDraftAnswers(['', '', '', ''])
    setDraftCorrectIndex(0)
    setDraftPoints(10)
    setHint('')
  }

  const handleStart = () => {
    const cleaned = normalizeTeamNames(teamCount, teamNames)

    if (cleaned.some((name) => name.trim().length === 0)) {
      setHint('Jamoa nomlarini to`liq kiriting.')
      return
    }

    const config: QuizBattleConfig = {
      teamCount,
      teamNames: cleaned,
      questionCount,
      difficulty,
      timerEnabled,
      timerSeconds: defaultTimerSeconds,
      soundEnabled,
      customQuestions: customQuestions.map((question) => ({
        ...question,
        difficulty,
      })),
    }

    onStart(config)
  }

  return (
    <div className="space-y-6">
      <section className="quizbattle-hero-panel relative overflow-hidden rounded-[2rem] border border-white/20 bg-slate-900/55 p-5 text-white shadow-[0_34px_70px_-34px_rgba(56,189,248,0.55)] backdrop-blur-xl sm:p-7">
        <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 bottom-0 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <div className="relative">
          <p className="inline-flex rounded-full border border-cyan-300/35 bg-cyan-500/20 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
            Savol Bellashuvi Sozlamalari
          </p>
          <h1 className="mt-3 font-kid text-6xl leading-none text-white sm:text-7xl">
            Savol Bellashuvi
          </h1>
          <p className="mt-3 max-w-4xl text-base font-bold text-slate-200 sm:text-lg">
            Kahoot va Bamboozle uslubidagi sinf o`yini: jamoalar kartani tanlaydi, savol yoki event ochiladi, o`qituvchi
            To`g`ri/Noto`g`ri beradi va navbat avtomatik almashadi.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-100">
              Savollar: 12/16/24
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-100">
              Tasodifiy Hodisalar
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-100">
              Tez Tugmalar 1-24
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.25fr]">
        <section className="quizbattle-settings-panel rounded-[2rem] border border-white/20 bg-slate-900/55 p-5 text-white backdrop-blur-xl sm:p-6">
          <h2 className="font-kid text-4xl text-white sm:text-5xl">O'yin Sozlamalari</h2>

          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-300">Jamoalar</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[2, 3].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setTeamCount(count as 2 | 3)}
                    className={`rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.1em] transition ${
                      teamCount === count
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_18px_28px_-20px_rgba(56,189,248,0.8)]'
                        : 'border border-white/20 bg-slate-800/70 text-slate-200 hover:scale-[1.01]'
                    }`}
                  >
                    {count} Jamoa
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {selectedTeamNames.map((name, index) => (
                <input
                  key={`team-name-${index}`}
                  value={name}
                  onChange={(event) =>
                    setTeamNames((prev) => {
                      const next = [...prev]
                      next[index] = event.target.value
                      return next
                    })
                  }
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/55 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-300/45"
                  placeholder={`${index + 1}-Jamoa`}
                />
              ))}
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-300">Daraja</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDifficulty(item)}
                    className={`rounded-2xl px-3 py-3 text-xs font-black uppercase tracking-[0.12em] transition ${
                      difficulty === item
                        ? 'bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white'
                        : 'border border-white/20 bg-slate-800/70 text-slate-200 hover:scale-[1.01]'
                    }`}
                  >
                    {difficultyLabel[item]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-300">Savollar soni</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {questionCountOptions.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`rounded-2xl px-3 py-3 text-xs font-black uppercase tracking-[0.12em] transition ${
                      questionCount === count
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                        : 'border border-white/20 bg-slate-800/70 text-slate-200 hover:scale-[1.01]'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTimerEnabled((prev) => !prev)}
                className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition ${
                  timerEnabled
                    ? 'border border-emerald-300/45 bg-emerald-500/20 text-emerald-100'
                    : 'border border-white/20 bg-slate-800/70 text-slate-200'
                }`}
              >
                Vaqt {timerEnabled ? `Yoqilgan (${defaultTimerSeconds}s)` : "O'chiq"}
              </button>

              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition ${
                  soundEnabled
                    ? 'border border-cyan-300/45 bg-cyan-500/20 text-cyan-100'
                    : 'border border-white/20 bg-slate-800/70 text-slate-200'
                }`}
              >
                Ovoz va musiqa {soundEnabled ? 'Yoqilgan' : "O'chiq"}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleStart}
            type="button"
            className="quizbattle-primary-cta mt-5 w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_24px_42px_-24px_rgba(56,189,248,0.95)]"
          >
            O'yinni Boshlash
          </motion.button>
        </section>

        <section className="quizbattle-custom-panel rounded-[2rem] border border-white/20 bg-slate-900/55 p-5 text-white backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-kid text-4xl text-white sm:text-5xl">Qo'shimcha Savollar</h2>
              <p className="mt-2 text-sm font-bold text-slate-300">
                Bu blokdan qo'shilgan savollar shu brauzerda saqlanadi va keyingi o'yinlarda ham qoladi.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-300/30 bg-cyan-500/20 px-3 py-1 text-xs font-black text-cyan-100">
                {customQuestions.length}/36
              </span>
              {customQuestions.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setCustomQuestions([])}
                  className="rounded-full border border-rose-300/35 bg-rose-500/20 px-3 py-1 text-xs font-black text-rose-100 transition hover:scale-[1.02]"
                >
                  Hammasini tozalash
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <textarea
              value={draftQuestion}
              onChange={(event) => setDraftQuestion(event.target.value)}
              rows={2}
              className="w-full rounded-2xl border border-white/15 bg-slate-950/55 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-300/45"
              placeholder="Savol matni"
            />

            <div className="grid gap-2 sm:grid-cols-2">
              {draftAnswers.map((answer, index) => (
                <div key={`draft-answer-${index}`} className="rounded-2xl border border-white/15 bg-slate-950/55 p-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDraftCorrectIndex(index)}
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-xs font-black transition ${
                        draftCorrectIndex === index
                          ? 'border-cyan-300/55 bg-cyan-500/30 text-cyan-100'
                          : 'border-white/20 bg-slate-800/70 text-slate-200'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </button>

                    <input
                      value={answer}
                      onChange={(event) =>
                        setDraftAnswers((prev) => {
                          const next = [...prev]
                          next[index] = event.target.value
                          return next
                        })
                      }
                      className="w-full rounded-xl border border-white/15 bg-slate-900/65 px-3 py-2 text-sm font-bold text-white outline-none transition focus:border-cyan-300/45"
                      placeholder={`Variant ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {pointsOptions.map((points) => (
                <button
                  key={points}
                  type="button"
                  onClick={() => setDraftPoints(points)}
                  className={`rounded-xl px-2 py-2 text-xs font-black uppercase tracking-[0.08em] transition ${
                    draftPoints === points
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950'
                      : 'border border-white/20 bg-slate-800/70 text-slate-200'
                  }`}
                >
                  {points}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={addCustomQuestion}
              className="w-full rounded-2xl border border-emerald-300/35 bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white"
            >
              Savol Qo'shish
            </button>

            {hint ? (
              <p className="rounded-xl border border-rose-300/35 bg-rose-500/20 px-3 py-2 text-sm font-black text-rose-100">
                {hint}
              </p>
            ) : null}
          </div>

          <div className="mt-4 max-h-72 space-y-2 overflow-auto pr-1">
            {customQuestions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/25 bg-slate-950/45 px-4 py-4 text-sm font-bold text-slate-300">
                Hozircha lokal savol qo`shilmagan. Tizim standart savollar bilan o`ynaydi.
              </p>
            ) : (
              customQuestions.map((question, index) => (
                <article key={question.id} className="rounded-2xl border border-white/15 bg-slate-950/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-white">
                        {index + 1}. {question.question}
                      </p>
                      <p className="mt-1 text-[11px] font-black uppercase tracking-[0.11em] text-cyan-200">
                        {question.points} ball
                      </p>
                      <p className="mt-2 text-xs font-bold text-slate-300">
                        To'g'ri javob: {question.correctAnswer}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomQuestions((prev) => prev.filter((item) => item.id !== question.id))
                      }
                      className="rounded-lg border border-rose-300/35 bg-rose-500/20 px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-rose-100"
                    >
                      O'chirish
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {question.answers.map((answer, answerIndex) => (
                      <div
                        key={`${question.id}-answer-${answerIndex}`}
                        className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                          answer === question.correctAnswer
                            ? 'border-emerald-300/35 bg-emerald-500/15 text-emerald-100'
                            : 'border-white/10 bg-slate-900/55 text-slate-300'
                        }`}
                      >
                        <span className="mr-2 text-cyan-300">{String.fromCharCode(65 + answerIndex)}.</span>
                        {answer}
                      </div>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Lobby
