import { motion } from 'framer-motion'
import type { TeamState } from '../types.ts'
import winnersImageUrl from '../../rasm/winners.jpg'
import lostImageUrl from '../../rasm/lost.jpg'

type WinnerScreenProps = {
  teams: TeamState[]
  onReplay: () => void
  onBackToSetup: () => void
}

const confettiPalette = ['#22d3ee', '#60a5fa', '#f472b6', '#f59e0b', '#34d399', '#fde047']

type ResultImageCardProps = {
  src: string
  alt: string
  className?: string
}

function ResultImageCard({ src, alt, className = '' }: ResultImageCardProps) {
  return (
    <div
      className={`quizbattle-result-image relative mx-auto overflow-hidden rounded-[1rem] border border-white/20 bg-slate-950/55 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(34,211,238,0.2),transparent_42%),radial-gradient(circle_at_82%_18%,rgba(244,114,182,0.18),transparent_40%)]" />
      <img
        src={src}
        alt={alt}
        className="relative z-10 h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  )
}

function WinnerScreen({ teams, onReplay, onBackToSetup }: WinnerScreenProps) {
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score)
  const topTeam = sortedTeams[0]
  const loserTeams = sortedTeams.slice(1)
  const isDraw = sortedTeams.length > 1 && sortedTeams[0].score === sortedTeams[1].score

  return (
    <section className="quizbattle-winner-shell relative h-[calc(100vh-9.5rem)] overflow-hidden rounded-[1.35rem] border border-white/20 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_85%_14%,rgba(236,72,153,0.22),transparent_34%),linear-gradient(165deg,rgba(3,7,18,0.92),rgba(15,23,42,0.95))] p-3 text-white backdrop-blur-xl sm:p-4">
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 54 }).map((_, index) => (
          <motion.span
            key={`winner-confetti-${index}`}
            initial={{
              opacity: 0,
              y: '-12%',
              x: `${(index * 13) % 100}%`,
              rotate: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: ['-12%', '120%'],
              x: `${((index * 13) % 100) + (index % 2 === 0 ? -6 : 6)}%`,
              rotate: [0, 540],
              scale: [0.9, 1, 0.8],
            }}
            transition={{
              duration: 2.8 + (index % 5) * 0.35,
              repeat: Infinity,
              delay: (index % 12) * 0.09,
              ease: 'easeOut',
            }}
            className="absolute top-0 h-2.5 w-1.5 rounded-full"
            style={{ backgroundColor: confettiPalette[index % confettiPalette.length] }}
          />
        ))}

        {[0, 1, 2].map((ring) => (
          <motion.span
            key={`winner-ring-${ring}`}
            initial={{ opacity: 0.45, scale: 0.4 }}
            animate={{ opacity: [0.45, 0.1, 0], scale: [0.4, 1.15, 1.45] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: ring * 0.4, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/40"
          />
        ))}
      </div>

      <div className="relative z-10 flex h-full flex-col text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">G'olib Tantanasi</p>

        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
          transition={{ duration: 0.65, y: { duration: 1.8, repeat: Infinity } }}
          className="quizbattle-winner-trophy mx-auto mt-1.5 grid h-14 w-14 place-items-center rounded-full border border-amber-300/45 bg-amber-400/20 text-2xl shadow-[0_0_30px_-8px_rgba(251,191,36,0.95)]"
        >
          #1
        </motion.div>

        <h2 className="mt-1.5 font-kid text-3xl leading-none sm:text-4xl">{topTeam.name} G'olib</h2>
        <p className="mx-auto mt-1 max-w-3xl text-xs font-bold text-slate-200 sm:text-sm">
          {isDraw
            ? "Durang bo'ldi, lekin yuqoridagi jamoa bo'yicha tantana ko'rsatildi. Yangi raund bilan aniq g'olibni toping."
            : `Tabriklaymiz! ${topTeam.name} ${topTeam.score} ball bilan birinchi bo'ldi.`}
        </p>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="quizbattle-winner-highlight mx-auto mt-1.5 w-full max-w-[30rem] rounded-2xl border border-amber-300/45 bg-amber-500/15 p-2.5 shadow-[0_0_46px_-18px_rgba(251,191,36,0.75)] sm:p-3"
        >
          <div className="grid gap-2 md:grid-cols-[0.95fr_1.05fr] md:items-center">
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">Birinchi o'rin</p>
              <p className="mt-1 font-kid text-2xl text-white sm:text-3xl">{topTeam.name}</p>
              <p className={`mt-1 font-kid text-3xl sm:text-4xl ${topTeam.color}`}>{topTeam.score}</p>
            </div>
            <ResultImageCard
              src={winnersImageUrl}
              alt="G'olib jamoa rasmi"
              className="h-[6.2rem] w-full max-w-[12.2rem] sm:h-[7.2rem] sm:max-w-[13.8rem]"
            />
          </div>
        </motion.article>

        {loserTeams.length > 0 ? (
          <div
            className={`mx-auto mt-2 grid w-full gap-5 sm:gap-6 ${
              loserTeams.length === 1 ? 'max-w-xs' : 'max-w-[46rem] grid-cols-2'
            }`}
          >
            {loserTeams.map((team, index) => (
              <motion.article
                key={team.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + index * 0.14 }}
                className="quizbattle-winner-sidecard rounded-2xl border border-white/15 bg-slate-800/65 p-2.5"
              >
                <div className="mb-1.5 flex items-end justify-between gap-2">
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-300">Qolgan jamoa</p>
                    <p className="mt-0.5 text-base font-black text-white">{team.name}</p>
                  </div>
                  <p className={`font-kid text-3xl ${team.color}`}>{team.score}</p>
                </div>
                <ResultImageCard
                  src={lostImageUrl}
                  alt={`${team.name} uchun lost rasmi`}
                  className="h-[4.9rem] w-full max-w-[10.6rem] sm:h-[5.5rem] sm:max-w-[11.8rem]"
                />
              </motion.article>
            ))}
          </div>
        ) : null}

        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onReplay}
            type="button"
            className="quizbattle-primary-cta rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 px-5 py-3 text-xs font-black uppercase tracking-[0.11em] text-white shadow-[0_22px_40px_-24px_rgba(56,189,248,0.95)] sm:text-sm"
          >
            Yana O'ynash
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onBackToSetup}
            type="button"
            className="quizbattle-secondary-btn rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.11em] text-white sm:text-sm"
          >
            Sozlamaga Qaytish
          </motion.button>
        </div>
      </div>
    </section>
  )
}

export default WinnerScreen
