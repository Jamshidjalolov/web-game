import { motion } from 'framer-motion'
import { useFakeOrFactGame } from '../context/FakeOrFactGameContext.tsx'

function TimerBar() {
  const { currentDifficulty, timeLeft } = useFakeOrFactGame()
  const maxTime = currentDifficulty === 'hard' ? 20 : currentDifficulty === 'medium' ? 30 : 40
  const progress = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100))

  return (
    <div className="rounded-[1.4rem] border border-white/12 bg-white/8 p-3 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-200/82">Vaqt</p>
        <p className={`text-2xl font-black ${timeLeft <= 5 ? 'text-rose-300' : 'text-cyan-100'}`}>
          {timeLeft}s
        </p>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.18, ease: 'linear' }}
          className={`h-full rounded-full ${
            timeLeft <= 5
              ? 'bg-gradient-to-r from-rose-400 via-orange-400 to-amber-300'
              : 'bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500'
          }`}
        />
      </div>
    </div>
  )
}

export default TimerBar
