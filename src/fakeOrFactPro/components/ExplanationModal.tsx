import { AnimatePresence, motion } from 'framer-motion'
import ConfettiOverlay from '../../components/ConfettiOverlay.tsx'
import { useFakeOrFactGame } from '../context/FakeOrFactGameContext.tsx'

function ExplanationModal() {
  const { currentRoundIndex, goToNextRound, phase, roundResult, teams, totalRounds, burstKey } = useFakeOrFactGame()
  const isSoloMode = teams.length === 1

  return (
    <AnimatePresence>
      {phase === 'reveal' && roundResult ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 p-4 backdrop-blur-md"
        >
          {roundResult.anyCorrect ? <ConfettiOverlay burstKey={burstKey} /> : null}
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            className="w-full max-w-3xl rounded-[2rem] border border-white/14 bg-[linear-gradient(145deg,rgba(9,22,49,0.96),rgba(24,14,44,0.96))] p-6 shadow-soft"
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-100/78">
              {currentRoundIndex + 1}-raund natijasi
            </p>
            <h3 className="mt-3 font-kid text-5xl text-white">
              {roundResult.question.answer ? 'FAKT' : 'FEYK'}
            </h3>
            <p className="mt-4 rounded-2xl border border-white/12 bg-white/8 px-5 py-4 text-base font-bold leading-7 text-slate-100">
              {roundResult.question.explanation_uz}
            </p>

            <div className={`mt-5 grid gap-3 ${isSoloMode ? '' : 'md:grid-cols-2'}`}>
              {teams.map((team) => {
                const result = roundResult.teamResults[team.id]
                return (
                  <div key={team.id} className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-300">
                      {team.name}
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">{result.reactionLabel}</p>
                    <p className="mt-2 text-sm font-bold text-slate-300">
                      {result.selectedAnswer === null
                        ? 'Javob kelmadi'
                        : result.selectedAnswer
                          ? 'FAKT tanlandi'
                          : 'FEYK tanlandi'}
                    </p>
                    <p className="mt-2 text-sm font-black text-cyan-100">
                      +{result.awardedPoints} ball
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={goToNextRound}
                className="rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-soft"
              >
                {currentRoundIndex + 1 >= totalRounds ? "G'olibni ko'rish" : 'Keyingi raund'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default ExplanationModal
