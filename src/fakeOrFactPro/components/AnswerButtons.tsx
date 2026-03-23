import { motion } from 'framer-motion'
import { useFakeOrFactGame } from '../context/FakeOrFactGameContext.tsx'

const teamAccent = {
  'team-a': {
    border: 'border-cyan-300/20',
    panel: 'bg-[linear-gradient(155deg,rgba(34,211,238,0.12),rgba(10,24,53,0.92))]',
    glow: 'shadow-[0_20px_70px_rgba(34,211,238,0.12)]',
  },
  'team-b': {
    border: 'border-fuchsia-300/20',
    panel: 'bg-[linear-gradient(155deg,rgba(217,70,239,0.1),rgba(30,16,56,0.94))]',
    glow: 'shadow-[0_20px_70px_rgba(217,70,239,0.12)]',
  },
} as const

function AnswerButtons() {
  const { phase, roundResult, submitAnswer, teams } = useFakeOrFactGame()
  const isSoloMode = teams.length === 1

  return (
    <div className={`grid gap-3 ${isSoloMode ? '' : 'lg:grid-cols-2'}`}>
      {teams.map((team) => {
        const hasAnswered = team.selectedAnswer !== null
        const isLocked = phase !== 'round' || hasAnswered
        const teamResult = roundResult?.teamResults[team.id]

        return (
          <div
            key={`answers-${team.id}`}
            className={`rounded-[1.7rem] border p-4 backdrop-blur-xl ${teamAccent[team.id].border} ${teamAccent[team.id].panel} ${teamAccent[team.id].glow}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-300">{isSoloMode ? "O'yinchi" : 'Jamoa'}</p>
                <h3 className="mt-1.5 text-2xl font-black text-white">{team.name}</h3>
                <p className="mt-1 text-xs font-bold text-slate-200/80 sm:text-sm">
                  {phase === 'round'
                    ? hasAnswered
                      ? 'Javob yuborildi'
                      : 'Javob kutilmoqda'
                    : teamResult?.isCorrect
                      ? "To'g'ri javob"
                      : "Noto'g'ri javob"}
                </p>
              </div>

              <div className="rounded-[1.1rem] border border-white/12 bg-white/10 px-3 py-2 text-right">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-300">Ball</p>
                <p className="mt-0.5 text-2xl font-black text-white">{team.score}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => submitAnswer(team.id, true)}
                disabled={isLocked}
                className={`rounded-[1.3rem] border border-emerald-300/24 bg-[linear-gradient(145deg,rgba(16,185,129,0.28),rgba(16,185,129,0.08))] px-4 py-4 text-left shadow-soft transition ${
                  isLocked ? 'cursor-not-allowed opacity-50' : 'hover:shadow-[0_0_28px_rgba(16,185,129,0.22)]'
                }`}
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-100/84">Tanlov</p>
                <p className="mt-2 text-3xl font-black text-white">FAKT</p>
              </motion.button>

              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => submitAnswer(team.id, false)}
                disabled={isLocked}
                className={`rounded-[1.3rem] border border-rose-300/24 bg-[linear-gradient(145deg,rgba(244,63,94,0.24),rgba(244,63,94,0.08))] px-4 py-4 text-left shadow-soft transition ${
                  isLocked ? 'cursor-not-allowed opacity-50' : 'hover:shadow-[0_0_28px_rgba(244,63,94,0.2)]'
                }`}
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-rose-100/84">Tanlov</p>
                <p className="mt-2 text-3xl font-black text-white">FEYK</p>
              </motion.button>
            </div>

            <div className="mt-3 rounded-[1.1rem] border border-white/12 bg-white/8 px-3 py-2.5">
              <p className="text-xs font-bold leading-5 text-slate-200/82 sm:text-sm">
                {phase === 'round'
                  ? hasAnswered
                    ? `Tanlangan javob: ${team.selectedAnswer ? 'FAKT' : 'FEYK'}`
                    : "Hali javob yuborilmadi"
                  : teamResult
                    ? `${teamResult.reactionLabel} | +${teamResult.awardedPoints} ball`
                    : 'Natija tayyorlanmoqda'}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AnswerButtons
