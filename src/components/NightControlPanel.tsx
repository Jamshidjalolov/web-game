import { Link } from 'react-router-dom'

type OrbitCard = {
  id: string
  title: string
  xp: string
  progress: number
  tone: string
  posClass: string
}

const orbitCards: OrbitCard[] = [
  { id: 'A1', title: 'Alifbo Arena', xp: '+120 XP', progress: 72, tone: 'from-cyan-500 to-blue-500', posClass: 'night-mini-card-a' },
  { id: 'B2', title: 'Hisob Sprint', xp: '+150 XP', progress: 58, tone: 'from-purple-500 to-fuchsia-500', posClass: 'night-mini-card-b' },
  { id: 'C3', title: 'Mantiq Lab', xp: '+180 XP', progress: 84, tone: 'from-emerald-500 to-lime-500', posClass: 'night-mini-card-c' },
  { id: 'D4', title: "So'z Ovchisi", xp: '+140 XP', progress: 66, tone: 'from-amber-500 to-orange-500', posClass: 'night-mini-card-d' },
]

function NightControlPanel() {
  return (
    <section className="night-immersive-section mx-auto max-w-7xl px-4 py-10 sm:px-6" data-aos="fade-up">
      <div className="night-control-shell">
        <div className="night-control-head">
          <p className="night-stats-kicker">Boshqaruv paneli</p>
          <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Futuristik o'yin paneli</h2>
        </div>

        <div className="night-control-orbit-wrap mt-8" data-aos="zoom-in" data-aos-delay="90">
          <div className="night-control-orbit-grid">
            {/* Central action button with neon pulse effect in dark mode */}
            <Link to="/games" className="night-start-button">
              BOSHLASH
            </Link>

            {orbitCards.map((card, index) => (
              <article
                key={card.id}
                className={`night-mini-card ${card.posClass}`}
                data-aos="fade-up"
                data-aos-delay={String(120 + index * 80)}
              >
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{card.id}</p>
                <p className="mt-1 font-kid text-xl text-slate-900">{card.title}</p>
                <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-cyan-700">{card.xp}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${card.tone}`}
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="night-mission-grid mt-8">
          <article className="night-mission-card" data-aos="fade-right" data-aos-delay="110">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-fuchsia-600">Kunlik vazifa</p>
            <p className="mt-2 font-kid text-3xl text-slate-900">4 ta topshiriq o'yinini yakunlang</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <span className="night-mission-progress" style={{ width: '68%' }} />
            </div>
          </article>

          <article className="night-reward-card" data-aos="fade-left" data-aos-delay="140">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-700">Bonus mukofot</p>
            <p className="mt-2 font-kid text-3xl text-slate-900">+900 XP yorqin sandiq</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <span className="night-reward-progress" style={{ width: '83%' }} />
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

export default NightControlPanel
