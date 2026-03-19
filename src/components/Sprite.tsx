type SpriteProps = {
  src: string
  frameWidth?: number
  frameHeight?: number
  frames?: number
  fps?: number
  className?: string
  flip?: boolean
}

function Sprite({
  src,
  frameWidth = 128,
  frameHeight = 128,
  frames = 6,
  fps = 12,
  className = '',
  flip = false,
}: SpriteProps) {
  const safeFrames = Math.max(1, frames)
  const safeFps = Math.max(1, fps)
  const duration = safeFrames / safeFps
  const shouldAnimate = safeFrames > 1

  return (
    <div
      className={`relative overflow-hidden ${className} ${flip ? 'scale-x-[-1]' : ''}`}
      style={{ width: frameWidth, height: frameHeight }}
    >
      <div
        className="h-full"
        style={{
          width: frameWidth * safeFrames,
          height: frameHeight,
          backgroundImage: `url(${src})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${frameWidth * safeFrames}px ${frameHeight}px`,
          animation: shouldAnimate
            ? `spriteWalk ${duration}s steps(${safeFrames}) infinite`
            : undefined,
        }}
      />
    </div>
  )
}

export default Sprite
