import { useFakeOrFactGame } from '../context/FakeOrFactGameContext.tsx'

function StreakIndicator() {
  const { teams } = useFakeOrFactGame()

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {teams.map((team) => (
        <div key={`streak-${team.id}`} className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4 backdrop-blur-xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-300">Dopamin indikator</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-black text-white">{team.name}</p>
              <p className="mt-1 text-sm font-bold text-slate-300">
                {team.streak >= 3 ? 'SERIYA 3x 🔥' : team.streak > 0 ? `Seriya ${team.streak}x` : "Seriya yo'q"}
              </p>
            </div>
            <p className="text-3xl font-black text-amber-200">x{team.comboMultiplier.toFixed(1)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StreakIndicator
