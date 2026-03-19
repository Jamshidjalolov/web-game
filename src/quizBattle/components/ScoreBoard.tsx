import { AnimatePresence, motion } from 'framer-motion'
import type { TeamState } from '../types.ts'

type ScoreBoardProps = {
  teams: TeamState[]
  activeTeamIndex: number
  remainingCards: number
  timerEnabled: boolean
  timerSeconds: number
  soundEnabled: boolean
  isFullscreen: boolean
  onToggleSound: () => void
  onToggleFullscreen: () => void
}

function ScoreBoard({
  teams,
  activeTeamIndex,
  remainingCards,
  timerEnabled,
  timerSeconds,
  soundEnabled,
  isFullscreen,
  onToggleSound,
  onToggleFullscreen,
}: ScoreBoardProps) {
  return (
    <section className="quizbattle-scoreboard-shell sticky top-3 z-40 rounded-[1.8rem] border border-white/15 bg-slate-900/55 p-4 shadow-[0_24px_50px_-28px_rgba(59,130,246,0.75)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200/90">
            Quiz Battle Paneli
          </p>
          <p className="mt-1 text-sm font-bold text-slate-300">
            Qolgan kartalar: <span className="text-white">{remainingCards}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            className={`quizbattle-scoreboard-control rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.1em] transition hover:scale-[1.03] ${
              soundEnabled
                ? 'border-emerald-300/40 bg-emerald-400/20 text-emerald-100'
                : 'border-slate-400/35 bg-slate-700/40 text-slate-200'
            }`}
          >
            {soundEnabled ? 'Ovoz va Musiqa Yoqilgan' : "Ovoz va Musiqa O'chiq"}
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            className={`quizbattle-scoreboard-control rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.1em] transition hover:scale-[1.03] ${
              isFullscreen
                ? 'border-fuchsia-300/50 bg-fuchsia-500/20 text-fuchsia-100'
                : 'border-slate-400/35 bg-slate-700/40 text-slate-200'
            }`}
          >
            {isFullscreen ? "To'liq Ekrandan Chiqish" : "To'liq Ekran"}
          </button>

          <span className="quizbattle-scoreboard-chip rounded-xl border border-cyan-400/35 bg-cyan-500/15 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-cyan-100">
            Vaqt: {timerEnabled ? `${timerSeconds}s` : "O'chiq"}
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team, index) => {
          const isActive = index === activeTeamIndex
          return (
            <motion.article
              key={team.id}
              layout
              animate={{
                scale: isActive ? 1.01 : 1,
                boxShadow: isActive
                  ? '0 0 0 1px rgba(255,255,255,0.2), 0 0 28px rgba(56,189,248,0.35)'
                  : '0 0 0 1px rgba(255,255,255,0.08)',
              }}
              className={`quizbattle-scoreboard-team rounded-2xl border p-3 ${
                isActive
                  ? 'quizbattle-scoreboard-team-active border-cyan-300/50 bg-slate-800/70'
                  : 'border-white/10 bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black uppercase tracking-[0.12em] text-slate-200">
                    {team.name}
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    {isActive ? 'Hozirgi navbat' : 'Navbat kutmoqda'}
                  </p>
                </div>
                {team.doubleNext ? (
                  <span className="rounded-full bg-amber-300 px-2 py-1 text-[11px] font-black text-amber-900">
                    x2 Tayyor
                  </span>
                ) : null}
              </div>

              <div className="mt-2 flex items-end gap-2">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`${team.id}-${team.score}`}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`font-kid text-5xl leading-none ${team.color}`}
                  >
                    {team.score}
                  </motion.span>
                </AnimatePresence>
                <span className="pb-1 text-sm font-bold text-slate-400">ball</span>
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}

export default ScoreBoard
