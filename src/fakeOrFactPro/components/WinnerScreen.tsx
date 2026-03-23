import { AnimatePresence, motion } from 'framer-motion'
import ConfettiOverlay from '../../components/ConfettiOverlay.tsx'
import { useFakeOrFactGame } from '../context/FakeOrFactGameContext.tsx'

type WinnerScreenProps = {
  onBackToSetup: () => void
}

function WinnerScreen({ onBackToSetup }: WinnerScreenProps) {
  const { burstKey, phase, restartGame, teams, winnerTeam } = useFakeOrFactGame()
  const orderedTeams = teams.slice().sort((left, right) => right.score - left.score)
  const runnerUp = orderedTeams.find((team) => team.id !== winnerTeam?.id) ?? null
  const isSoloMode = teams.length === 1

  return (
    <AnimatePresence>
      {phase === 'finished' && winnerTeam ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_24%),rgba(2,6,23,0.88)] p-3 backdrop-blur-md"
        >
          <ConfettiOverlay burstKey={burstKey} />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="w-full max-w-3xl overflow-hidden rounded-[2.1rem] border border-white/16 bg-[linear-gradient(145deg,rgba(7,18,38,0.98),rgba(13,55,71,0.96),rgba(33,18,55,0.98))] p-5 shadow-soft"
          >
            <div className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4 text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-100/78">G'olib modal</p>
              <h2 className="mt-3 font-kid text-5xl text-white sm:text-6xl">{winnerTeam.name}</h2>
              <p className="mt-3 text-sm font-bold leading-6 text-slate-100/86 sm:text-base">
                Eng ko'p to'g'ri qaror va eng yuqori ball bilan shu jamoa g'olib bo'ldi.
              </p>
            </div>

            <div className={`mt-4 grid gap-3 ${isSoloMode ? '' : 'md:grid-cols-2'}`}>
              <div className="rounded-[1.4rem] border border-emerald-300/18 bg-emerald-400/10 p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-100/82">Chempion natija</p>
                <p className="mt-2 text-5xl font-black text-white">{winnerTeam.score}</p>
                <p className="mt-2 text-xs font-bold text-emerald-50/82 sm:text-sm">
                  Eng yaxshi seriya: {winnerTeam.bestStreak}x
                </p>
                <p className="mt-1 text-xs font-bold text-emerald-50/82 sm:text-sm">
                  Yakuniy combo: x{winnerTeam.comboMultiplier.toFixed(1)}
                </p>
              </div>

              {!isSoloMode ? (
                <div className="rounded-[1.4rem] border border-white/12 bg-white/8 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-300">Ikkinchi jamoa</p>
                  <p className="mt-2 text-2xl font-black text-white">{runnerUp?.name ?? 'Raqib jamoa'}</p>
                  <p className="mt-3 text-4xl font-black text-white">{runnerUp?.score ?? 0}</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-slate-300 sm:text-sm">
                    Yaxshi urinish. Keyingi o'yinda revansh olish mumkin.
                  </p>
                </div>
              ) : null}
            </div>

            <div className={`mt-4 grid gap-2 ${orderedTeams.length > 1 ? 'md:grid-cols-2' : ''}`}>
              {orderedTeams.map((team, index) => (
                <div key={`winner-${team.id}`} className="rounded-[1.2rem] border border-white/12 bg-white/8 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">#{index + 1}</p>
                      <p className="mt-1 text-xl font-black text-white">{team.name}</p>
                    </div>
                    <p className="text-3xl font-black text-white">{team.score}</p>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-300 sm:text-sm">Seriya: {team.bestStreak}x</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={restartGame}
                className="rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white shadow-soft"
              >
                Yana o'ynash
              </button>
              <button
                type="button"
                onClick={onBackToSetup}
                className="rounded-2xl border border-white/14 bg-white/8 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
              >
                Sozlamaga qaytish
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default WinnerScreen
