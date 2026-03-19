type Leader = {
  rank: number
  name: string
  game: string
  points: number
  streak: number
}

// Demo leaderboard data used for Home spotlight.
const leaders: Leader[] = [
  { rank: 1, name: 'Aziza Team', game: "So'z Qidiruv", points: 12640, streak: 14 },
  { rank: 2, name: 'Hisob Ustalari', game: 'Tezkor Hisob', points: 11820, streak: 11 },
  { rank: 3, name: 'Aql Raketalari', game: 'Millioner', points: 10990, streak: 9 },
  { rank: 4, name: 'Turbo Bolajonlar', game: 'Arqon Tortish', points: 10240, streak: 8 },
  { rank: 5, name: 'Galaktika Sinfi', game: "Inglizcha So'z", points: 9780, streak: 7 },
]

function LeaderboardSection() {
  return (
    <section id="liderlar" className="mx-auto max-w-7xl px-4 py-14 sm:px-6" data-aos="fade-up">
      <div className="leaderboard-shell">
        <div className="leaderboard-head" data-aos="fade-up" data-aos-delay="60">
          <p className="leaderboard-pill">Reyting</p>
          <h2 className="mt-3 font-kid text-4xl text-slate-900 sm:text-5xl">Yulduzli Jamoalar</h2>
          <p className="mt-3 max-w-2xl text-base font-bold text-slate-600 sm:text-lg">
            Eng faol o&apos;quvchilar va ustozlar reytingi real vaqtda yangilanadi.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="grid gap-3">
            {leaders.map((leader, index) => (
              <article
                key={leader.name}
                className="leaderboard-card group"
                data-aos="fade-up"
                data-aos-delay={String(120 + index * 75)}
              >
                <div className="leaderboard-rank">{leader.rank}</div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-kid text-slate-900 sm:text-2xl">{leader.name}</p>
                  <p className="truncate text-sm font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    {leader.game}
                  </p>
                </div>
                <div className="leaderboard-meta">
                  <p className="text-lg font-black text-slate-900 sm:text-xl">{leader.points.toLocaleString()} XP</p>
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-600">
                    {leader.streak} kun ketma-ket
                  </p>
                </div>
              </article>
            ))}
          </div>

          <aside className="leaderboard-side-card" data-aos="zoom-in" data-aos-delay="160">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-700">Haftalik rekord</p>
            <p className="mt-3 font-kid text-3xl text-slate-900">+38,400 XP</p>
            <p className="mt-2 text-sm font-bold text-slate-600">
              Top guruhlar har o&apos;yinda bonus ochib, yakunda premium badge oladi.
            </p>
            <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/80 p-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-cyan-700">Top nishon</p>
              <p className="mt-1 text-xl font-kid text-slate-900">Neon Ustasi</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default LeaderboardSection
