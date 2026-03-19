import { motion } from 'framer-motion'
import { useFakeOrFactGame } from '../context/FakeOrFactGameContext.tsx'

function StatementCard() {
  const { currentQuestion, currentRoundIndex, totalRounds, categoryLabel, phase, roundResult } = useFakeOrFactGame()

  if (!currentQuestion) return null

  return (
    <motion.section
      key={currentQuestion.id}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[1.8rem] border border-white/12 bg-[linear-gradient(155deg,rgba(10,24,53,0.94),rgba(23,16,51,0.96))] p-4 shadow-soft backdrop-blur-xl sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/12 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-100">
          {currentRoundIndex + 1} / {totalRounds}-savol
        </span>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-100">
          {categoryLabel}
        </span>
      </div>

      <h2 className="mx-auto mt-4 max-w-5xl text-center font-kid text-3xl leading-tight text-white sm:text-4xl lg:text-[2.8rem]">
        {currentQuestion.text_uz}
      </h2>

      <p className="mx-auto mt-3 max-w-3xl text-center text-xs font-bold leading-6 text-slate-200/82 sm:text-sm">
        {phase === 'round'
          ? "Ikkala jamoa bir vaqtda javob beradi. Ikkala javob kelishi bilan keyingi savol ochiladi."
          : "Natija chiqdi. Qisqa ko'rib oling, keyingi savol avtomatik ochiladi."}
      </p>

      {phase === 'reveal' && roundResult ? (
        <div className="mx-auto mt-4 max-w-4xl rounded-[1.4rem] border border-emerald-300/18 bg-emerald-400/10 px-4 py-3 text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-100/80">To'g'ri javob</p>
          <p className="mt-1.5 text-2xl font-black text-white">{roundResult.question.answer ? 'FAKT' : 'FEYK'}</p>
          <p className="mt-2 text-xs font-bold leading-6 text-emerald-50/84 sm:text-sm">
            {roundResult.question.explanation_uz}
          </p>
        </div>
      ) : null}
    </motion.section>
  )
}

export default StatementCard
