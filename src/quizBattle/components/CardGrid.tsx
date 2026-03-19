import type { QuizCardSlot } from '../types.ts'
import GameCard from './GameCard.tsx'

type CardGridProps = {
  cards: QuizCardSlot[]
  locked: boolean
  shakingCardId: string | null
  onSelectCard: (cardId: string) => void
}

function CardGrid({ cards, locked, shakingCardId, onSelectCard }: CardGridProps) {
  const quickHint = cards.length > 12 ? 'Tez tugma: 1-24' : 'Tez tugma: 1-12'
  const isDense16 = cards.length === 16
  const isDense24 = cards.length === 24
  const cardDensity = isDense24 ? 'ultra' : isDense16 ? 'compact' : 'normal'
  const gridClass = isDense24
    ? 'grid-cols-4 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-6'
    : isDense16
      ? 'grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-4'
      : 'grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'

  return (
    <section
      className={`quizbattle-grid-shell rounded-[1.9rem] border border-white/10 bg-slate-900/45 backdrop-blur-md ${
        isDense24 ? 'p-3 sm:p-4' : 'p-4 sm:p-5'
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-300">
          Kartalar Panjarasi ({cards.length} ta)
        </p>
        <p className="quizbattle-grid-chip rounded-full border border-cyan-300/25 bg-cyan-400/15 px-3 py-1 text-[11px] font-black text-cyan-100">
          {quickHint}
        </p>
      </div>

      <div className={`grid ${gridClass}`}>
        {cards.map((card) => (
          <GameCard
            key={card.id}
            card={card}
            disabled={locked}
            shake={shakingCardId === card.id}
            density={cardDensity}
            onSelect={onSelectCard}
          />
        ))}
      </div>
    </section>
  )
}

export default CardGrid
