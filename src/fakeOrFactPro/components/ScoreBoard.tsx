import { motion } from 'framer-motion'
import { useFakeOrFactGame } from '../context/FakeOrFactGameContext.tsx'

const teamThemes = {
  'team-a': 'border-cyan-300/20 bg-cyan-400/10',
  'team-b': 'border-fuchsia-300/20 bg-fuchsia-400/10',
} as const

function ScoreBoard() {
  const { teams, activeTurnTeamId, keyboardTeamId, config } = useFakeOrFactGame()

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {teams.map((team) => (
        <motion.article
          key={team.id}
          layout
          className={`rounded-[1.8rem] border p-5 shadow-soft backdrop-blur-xl ${teamThemes[team.id]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-200/72">
                {team.id === 'team-a' ? '1-jamoa' : '2-jamoa'}
              </p>
              <h3 className="mt-2 text-3xl font-black text-white">{team.name}</h3>
            </div>
            <motion.p
              key={`${team.id}-${team.score}`}
              initial={{ scale: 0.86, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-black text-white"
            >
              {team.score}
            </motion.p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-100">
              Seriya: {team.streak}x
            </span>
            <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-100">
              Combo: x{team.comboMultiplier.toFixed(1)}
            </span>
            <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-100">
              Eng yaxshi: {team.bestStreak}x
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {config.mode === 'class' && activeTurnTeamId === team.id ? (
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/12 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-50">
                Navbat sizda
              </span>
            ) : null}
            {keyboardTeamId === team.id ? (
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/12 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-50">
                Klaviatura tanlovi
              </span>
            ) : null}
          </div>
        </motion.article>
      ))}
    </div>
  )
}

export default ScoreBoard
