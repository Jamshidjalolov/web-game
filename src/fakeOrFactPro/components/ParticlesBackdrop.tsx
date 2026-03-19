import { motion } from 'framer-motion'

const particles = Array.from({ length: 18 }, (_unused, index) => ({
  id: index,
  width: 6 + (index % 4) * 4,
  left: `${6 + (index * 5) % 88}%`,
  top: `${8 + (index * 7) % 84}%`,
  duration: 8 + (index % 5) * 2,
  delay: index * 0.2,
}))

function ParticlesBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_28%),radial-gradient(circle_at_20%_20%,rgba(244,114,182,0.09),transparent_24%)]" />
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          animate={{
            y: [0, -18, 0],
            opacity: [0.15, 0.6, 0.18],
            scale: [1, 1.18, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
            delay: particle.delay,
          }}
          className="absolute rounded-full bg-cyan-200/50 blur-[1px]"
          style={{
            width: particle.width,
            height: particle.width,
            left: particle.left,
            top: particle.top,
          }}
        />
      ))}
    </div>
  )
}

export default ParticlesBackdrop
