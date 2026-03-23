import type { TezkorGuruhTeam } from '../types.ts'

type TezkorGuruhWinnerProps = {
  teams: TezkorGuruhTeam[]
  onReplay: () => void
  onBackToSetup: () => void
}

function TezkorGuruhWinner({ teams, onReplay, onBackToSetup }: TezkorGuruhWinnerProps) {
  const sorted = [...teams].sort((a, b) => b.score - a.score)
  const topScore = sorted[0]?.score ?? 0
  const winners = sorted.filter((team) => team.score === topScore)
  const isTie = winners.length > 1

  return (
    <div className="tezkor-guruh-winner-shell relative min-h-[50vh] overflow-hidden rounded-[1.5rem] border border-white/20 bg-[radial-gradient(circle_at_10%_15%,rgba(56,189,248,0.2),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(236,72,153,0.18),transparent_40%),linear-gradient(165deg,rgba(3,7,18,0.92),rgba(15,23,42,0.95))] p-6 text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-8 top-8 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute right-10 top-16 h-44 w-44 rounded-full bg-fuchsia-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">G'oliblar</p>
        <h2 className="mt-2 font-kid text-3xl leading-tight sm:text-4xl">{isTie ? 'Durang!' : `${winners[0]?.name} g'olib!`}</h2>
        <p className="mt-2 text-sm font-bold text-slate-200">
          {isTie
            ? 'Ballar teng, ammo har bir jamoa zo‘r ishladi.'
            : `${winners[0]?.name} ${winners[0]?.score} ball bilan birinchi o‘rinni oldi.`}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {sorted.map((team) => (
            <div
              key={team.id}
              className="rounded-2xl border border-white/15 bg-white/10 p-4 text-left"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-white">{team.name}</p>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
                  {team.score}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-200">Hammasi yaxshi natija. Yana urunib ko‘ring!</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onReplay}
            className="rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:-translate-y-0.5"
          >
            Qayta o'yin
          </button>
          <button
            type="button"
            onClick={onBackToSetup}
            className="ui-secondary-btn ui-secondary-btn--md"
          >
            Sozlamaga qaytish
          </button>
        </div>
      </div>
    </div>
  )
}

export default TezkorGuruhWinner
