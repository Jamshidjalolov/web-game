import { useMemo, type CSSProperties } from 'react'

type ConfettiOverlayProps = {
  burstKey: number
  pieces?: number
  variant?: 'win' | 'lose'
}

type RainPiece = {
  id: number
  left: number
  delay: number
  duration: number
  width: number
  height: number
  rotate: number
  color: string
  radius: number
  driftX: number
}

type BurstPiece = {
  id: number
  delay: number
  duration: number
  width: number
  height: number
  rotate: number
  color: string
  radius: number
  burstX: number
  burstY: number
}

const WIN_COLORS = ['#0ea5e9', '#f59e0b', '#ef4444', '#22c55e', '#a855f7', '#ec4899', '#06b6d4', '#f97316']
const LOSE_COLORS = ['#94a3b8', '#64748b', '#475569', '#9f1239', '#be123c', '#7f1d1d', '#334155']

function ConfettiOverlay({ burstKey, pieces, variant = 'win' }: ConfettiOverlayProps) {
  const totalPieces = pieces ?? (variant === 'lose' ? 72 : 92)
  const palette = variant === 'lose' ? LOSE_COLORS : WIN_COLORS
  const burstClass =
    variant === 'lose' ? 'puzzle-confetti-burst-piece-lose' : 'puzzle-confetti-burst-piece'
  const dropClass = variant === 'lose' ? 'puzzle-confetti-piece-lose' : 'puzzle-confetti-piece'

  const rainPieces = useMemo<RainPiece[]>(
    () =>
      Array.from({ length: totalPieces }, (_, index) => ({
        id: index,
        left: Math.floor(Math.random() * 96) + 2,
        delay: Number((Math.random() * (variant === 'lose' ? 2.2 : 2.8)).toFixed(2)),
        duration: Number(((variant === 'lose' ? 3.5 : 4.2) + Math.random() * 2.2).toFixed(2)),
        width: 7 + Math.floor(Math.random() * 10),
        height: 10 + Math.floor(Math.random() * 14),
        rotate: Math.floor(Math.random() * 300),
        color: palette[index % palette.length],
        radius: Math.random() > 0.72 ? 999 : 3 + Math.floor(Math.random() * 5),
        driftX:
          variant === 'lose'
            ? Math.floor(Math.random() * 180) - 90
            : Math.floor(Math.random() * 280) - 140,
      })),
    [burstKey, totalPieces, variant, palette],
  )

  const burstPieces = useMemo<BurstPiece[]>(
    () =>
      Array.from({ length: Math.max(24, Math.floor(totalPieces * (variant === 'lose' ? 0.34 : 0.48))) }, (_, index) => {
        const angle = Math.random() * Math.PI * 2
        const distance = (variant === 'lose' ? 60 : 80) + Math.random() * (variant === 'lose' ? 150 : 260)
        return {
          id: index,
          delay: Number((Math.random() * (variant === 'lose' ? 0.24 : 0.34)).toFixed(2)),
          duration: Number(((variant === 'lose' ? 0.9 : 1.1) + Math.random() * 0.9).toFixed(2)),
          width: 8 + Math.floor(Math.random() * 9),
          height: 8 + Math.floor(Math.random() * 9),
          rotate: Math.floor(Math.random() * 420),
          color: palette[(index + 2) % palette.length],
          radius: Math.random() > 0.5 ? 999 : 3 + Math.floor(Math.random() * 4),
          burstX: Math.round(Math.cos(angle) * distance),
          burstY: Math.round(Math.sin(angle) * distance),
        }
      }),
    [burstKey, totalPieces, variant, palette],
  )

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      {burstPieces.map((piece) => {
        const style: CSSProperties & { ['--burst-x']: string; ['--burst-y']: string } = {
          width: `${piece.width}px`,
          height: `${piece.height}px`,
          backgroundColor: piece.color,
          borderRadius: `${piece.radius}px`,
          transform: `rotate(${piece.rotate}deg)`,
          animationDelay: `${piece.delay}s`,
          animationDuration: `${piece.duration}s`,
          '--burst-x': `${piece.burstX}px`,
          '--burst-y': `${piece.burstY}px`,
        }

        return <span key={`burst-${burstKey}-${piece.id}`} className={burstClass} style={style} />
      })}

      {rainPieces.map((piece) => {
        const style: CSSProperties & { ['--drift-x']: string } = {
          left: `${piece.left}%`,
          width: `${piece.width}px`,
          height: `${piece.height}px`,
          backgroundColor: piece.color,
          borderRadius: `${piece.radius}px`,
          transform: `rotate(${piece.rotate}deg)`,
          animationDelay: `${piece.delay}s`,
          animationDuration: `${piece.duration}s`,
          '--drift-x': `${piece.driftX}px`,
        }

        return <span key={`${burstKey}-${piece.id}`} className={dropClass} style={style} />
      })}
    </div>
  )
}

export default ConfettiOverlay
