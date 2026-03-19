import { AnimatePresence, motion } from 'framer-motion'
import { eventMeta } from '../EventEngine.ts'
import type { QuizCardSlot } from '../types.ts'

type QuestionModalProps = {
  open: boolean
  card: QuizCardSlot | null
  activeTeamName: string
  timerLeft: number
  timerEnabled: boolean
  resolving: boolean
  wrongPulse: boolean
  selectedAnswerIndex: number | null
  onSelectAnswer: (index: number) => void
  onSubmitSelected: () => void
  onCorrect: () => void
  onWrong: () => void
}

function QuestionModal({
  open,
  card,
  activeTeamName,
  timerLeft,
  timerEnabled,
  resolving,
  wrongPulse,
  selectedAnswerIndex,
  onSelectAnswer,
  onSubmitSelected,
  onCorrect,
  onWrong,
}: QuestionModalProps) {
  if (!card) return null

  const eventContent = card.content.type === 'event' ? card.content : null
  const isEvent = Boolean(eventContent)
  const eventDetails = eventContent ? eventMeta[eventContent.eventType] : null

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="quizbattle-modal-overlay fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={
              wrongPulse
                ? { opacity: 1, y: 0, scale: 1, x: [0, -10, 10, -6, 6, 0] }
                : { opacity: 1, y: 0, scale: 1, x: 0 }
            }
            transition={{ duration: 0.28 }}
            className="quizbattle-modal-panel relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/15 bg-slate-900/90 p-5 text-white shadow-[0_35px_60px_-28px_rgba(56,189,248,0.45)] sm:p-7"
          >
            <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-cyan-400/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                    Navbat: {activeTeamName}
                  </p>
                  <p className="mt-1 font-kid text-4xl text-white sm:text-5xl">
                    {isEvent ? 'Tasodifiy Voqea' : 'Savol Kartasi'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="quizbattle-modal-pill rounded-xl border border-sky-300/30 bg-sky-400/20 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-sky-100">
                    {card.points} ball
                  </span>
                  {!isEvent && timerEnabled ? (
                    <span className={`quizbattle-modal-timer rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.1em] ${
                      timerLeft <= 3
                        ? 'border-rose-300/40 bg-rose-500/20 text-rose-100'
                        : 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100'
                    }`}>
                      {timerLeft}s
                    </span>
                  ) : null}
                </div>
              </div>

              {isEvent && eventDetails ? (
                <article className="quizbattle-modal-body mt-5 rounded-3xl border border-white/15 bg-slate-800/75 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.15em] text-slate-300">
                    {eventDetails.icon} {eventDetails.title}
                  </p>
                  <p className="mt-3 text-2xl font-black text-white">{eventDetails.hint}</p>
                  <p className="mt-2 text-sm font-bold text-slate-300">
                    "Voqeani qo`llash" bosilsa hodisa ishlaydi, "Voqeani o`tkazish" bosilsa bekor bo`ladi.
                  </p>
                </article>
              ) : (
                <article className="quizbattle-modal-body mt-5 rounded-3xl border border-white/15 bg-slate-800/75 p-5">
                  <p className="text-2xl font-black leading-snug text-white sm:text-3xl">
                    {card.content.question}
                  </p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {card.content.answers.map((answer, index) => (
                      <button
                        key={`${answer}-${index}`}
                        type="button"
                        disabled={resolving}
                        onClick={() => onSelectAnswer(index)}
                        className={`quizbattle-modal-answer rounded-2xl border px-3 py-3 text-left text-sm font-bold transition ${
                          selectedAnswerIndex === index
                            ? 'quizbattle-modal-answer-selected border-cyan-300/55 bg-cyan-500/20 text-cyan-50'
                            : 'border-white/10 bg-slate-900/65 text-slate-100 hover:border-cyan-300/35 hover:bg-slate-800/75'
                        }`}
                      >
                        <span className="mr-2 text-cyan-300">{String.fromCharCode(65 + index)}.</span>
                        {answer}
                      </button>
                    ))}
                  </div>
                </article>
              )}

              {isEvent ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <motion.button
                    whileHover={!resolving ? { scale: 1.02 } : undefined}
                    whileTap={!resolving ? { scale: 0.98 } : undefined}
                    disabled={resolving}
                    onClick={onCorrect}
                    type="button"
                    className="quizbattle-primary-cta rounded-2xl border border-emerald-300/35 bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-lg font-black uppercase tracking-[0.08em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Voqeani Qo'llash
                  </motion.button>

                  <motion.button
                    whileHover={!resolving ? { scale: 1.02 } : undefined}
                    whileTap={!resolving ? { scale: 0.98 } : undefined}
                    disabled={resolving}
                    onClick={onWrong}
                    type="button"
                    className="quizbattle-secondary-btn rounded-2xl border border-rose-300/35 bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-4 text-lg font-black uppercase tracking-[0.08em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Voqeani O'tkazish
                  </motion.button>
                </div>
              ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <motion.button
                    whileHover={!resolving ? { scale: 1.02 } : undefined}
                    whileTap={!resolving ? { scale: 0.98 } : undefined}
                    disabled={resolving || selectedAnswerIndex === null}
                    onClick={onSubmitSelected}
                    type="button"
                    className="quizbattle-primary-cta rounded-2xl border border-emerald-300/35 bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-lg font-black uppercase tracking-[0.08em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Javobni tekshirish
                  </motion.button>

                  <motion.button
                    whileHover={!resolving ? { scale: 1.02 } : undefined}
                    whileTap={!resolving ? { scale: 0.98 } : undefined}
                    disabled={resolving}
                    onClick={onWrong}
                    type="button"
                    className="quizbattle-secondary-btn rounded-2xl border border-rose-300/35 bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-4 text-lg font-black uppercase tracking-[0.08em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    O'tkazish
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default QuestionModal
