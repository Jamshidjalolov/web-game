import { useEffect, useMemo, useState } from 'react'

type StatItem = {
  label: string
  target: number
  suffix: string
  icon: string
}

const statItems: StatItem[] = [
  { label: "Kunlik faol o'yinchilar", target: 18420, suffix: '+', icon: 'XP' },
  { label: "Jonli o'yin sessiyalari", target: 912, suffix: '', icon: 'JS' },
  { label: 'Ochilgan mukofotlar', target: 46780, suffix: '+', icon: 'UP' },
  { label: "Onlayn ustozlar", target: 1260, suffix: '+', icon: 'PR' },
]

function NightStatsSection() {
  const [values, setValues] = useState<number[]>(() => statItems.map(() => 0))
  const maxTarget = useMemo(
    () => statItems.reduce((max, item) => Math.max(max, item.target), 0),
    [],
  )

  useEffect(() => {
    let frameId = 0
    let startTs = 0
    const durationMs = 1500

    // Smooth counter animation for dark-mode dashboard stats.
    const tick = (timestamp: number) => {
      if (!startTs) startTs = timestamp
      const progress = Math.min((timestamp - startTs) / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValues(statItems.map((item) => Math.floor(item.target * eased)))
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick)
      }
    }

    frameId = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [maxTarget])

  return (
    <section className="night-immersive-section mx-auto max-w-7xl px-4 py-10 sm:px-6" data-aos="fade-up">
      <div className="night-stats-shell">
        <div className="night-stats-head" data-aos="fade-up" data-aos-delay="70">
          <p className="night-stats-kicker">Jonli statistika</p>
          <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Platforma faolligi</h2>
        </div>

        <div className="night-stats-grid mt-7">
          {statItems.map((item, index) => (
            <article
              key={item.label}
              className="night-stat-card"
              data-aos="zoom-in-up"
              data-aos-delay={String(90 + index * 70)}
            >
              <span className="night-stat-icon">{item.icon}</span>
              <p className="night-stat-value">
                {values[index].toLocaleString()}
                {item.suffix}
              </p>
              <p className="night-stat-label">{item.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default NightStatsSection
