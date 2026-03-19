import { motion } from 'framer-motion'
import type { QuizCardSlot } from '../types.ts'

type CardDensity = 'normal' | 'compact' | 'ultra'

type GameCardProps = {
  card: QuizCardSlot
  disabled: boolean
  shake: boolean
  density?: CardDensity
  onSelect: (cardId: string) => void
}

const faceBase =
  'absolute inset-0 grid place-items-center rounded-[1.3rem] border [backface-visibility:hidden]'

function GameCard({ card, disabled, shake, density = 'normal', onSelect }: GameCardProps) {
  const isFlipped = card.status !== 'hidden'
  const isResolved = card.status === 'resolved'
  const isCompact = density === 'compact'
  const isUltra = density === 'ultra'
  const cardHeightClass = isUltra ? 'h-[4.5rem] sm:h-[5.1rem] lg:h-[5.35rem]' : isCompact ? 'h-24 sm:h-28' : 'h-28 sm:h-32'
  const slotTextClass = isUltra ? 'text-3xl sm:text-4xl' : isCompact ? 'text-4xl sm:text-5xl' : 'text-5xl sm:text-6xl'
  const pointsPillClass = isUltra
    ? 'left-1 top-1 px-2 py-0.5 text-[9px]'
    : isCompact
      ? 'left-1.5 top-1.5 px-2 py-0.5 text-[9px]'
      : 'left-2 top-2 px-2.5 py-1 text-[10px]'
  const backTitleClass = isUltra ? 'text-[10px]' : 'text-xs'
  const backValueClass = isUltra ? 'text-sm' : isCompact ? 'text-base' : 'text-lg'
  const closedPillClass = isUltra ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(card.id)}
      disabled={disabled || isResolved || card.status === 'opened'}
      whileHover={!disabled && !isResolved ? { scale: 1.03 } : undefined}
      whileTap={!disabled && !isResolved ? { scale: 0.97 } : undefined}
      animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.3 }}
      className={`quizbattle-gamecard relative rounded-[1.3rem] [perspective:1000px] ${cardHeightClass} ${
        isResolved ? 'opacity-85' : ''
      }`}
      aria-label={`${card.slot}-karta, ${card.points} ball`}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative h-full w-full"
      >
        <div
          className={`quizbattle-gamecard-front ${faceBase} border-cyan-300/45 bg-[linear-gradient(140deg,rgba(14,165,233,0.4),rgba(59,130,246,0.2),rgba(236,72,153,0.3))] text-white shadow-[0_0_35px_-10px_rgba(56,189,248,0.9)]`}
        >
          <div
            className={`quizbattle-gamecard-points absolute rounded-full border border-white/35 bg-white/20 font-black uppercase tracking-[0.08em] ${pointsPillClass}`}
          >
            {card.points} ball
          </div>
          <span className={`font-kid leading-none ${slotTextClass}`}>{card.slot}</span>
        </div>

        <div
          style={{ transform: 'rotateY(180deg)' }}
          className={`quizbattle-gamecard-back ${faceBase} border-fuchsia-200/30 bg-slate-900/80 text-slate-100`}
        >
          <div className="text-center">
            <p className={`font-black uppercase tracking-[0.14em] text-slate-400 ${backTitleClass}`}>
              {card.content.type === 'event' ? 'Tasodifiy Voqea' : 'Savol'}
            </p>
            <p className={`mt-1 font-black ${backValueClass}`}>
              {card.content.type === 'event' ? 'VOQEA' : `${card.points} ball`}
            </p>
            {isResolved ? (
              <span className={`quizbattle-gamecard-closed mt-2 inline-flex rounded-full bg-emerald-400/20 font-black text-emerald-200 ${closedPillClass}`}>
                Yopilgan
              </span>
            ) : null}
          </div>
        </div>
      </motion.div>
    </motion.button>
  )
}

export default GameCard
