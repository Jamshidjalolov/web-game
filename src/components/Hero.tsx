import { Link } from 'react-router-dom'

type StatCard = {
  value: string
  label: string
}

type QuestCard = {
  title: string
  xp: string
  time: string
  tone: string
  posClass: string
  visibility: string
}

const quickStats: StatCard[] = [
  { value: '480+', label: "O'yinlar" },
  { value: '18k+', label: 'Foydalanuvchi' },
  { value: '97%', label: 'Faollik' },
]

const accentChips = [
  'Gamifikatsiya',
  'Jonli XP',
  "O'zbekcha UI",
]

const quests: QuestCard[] = [
  {
    title: 'Alifbo Arena',
    xp: '+120 XP',
    time: '3 daqiqa',
    tone: 'from-cyan-500 to-blue-500',
    posClass: 'kid-quest-a',
    visibility: '',
  },
  {
    title: 'Hisob Sprint',
    xp: '+150 XP',
    time: '4 daqiqa',
    tone: 'from-fuchsia-500 to-rose-500',
    posClass: 'kid-quest-b',
    visibility: '',
  },
  {
    title: 'Mantiq Lab',
    xp: '+180 XP',
    time: '5 daqiqa',
    tone: 'from-emerald-500 to-lime-500',
    posClass: 'kid-quest-c',
    visibility: 'hidden sm:block',
  },
  {
    title: "So'z Ovchisi",
    xp: '+140 XP',
    time: '4 daqiqa',
    tone: 'from-amber-500 to-orange-500',
    posClass: 'kid-quest-d',
    visibility: 'hidden sm:block',
  },
]

function Hero() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:pt-14"
      data-aos="fade-up"
    >
      <div className="kid-hero relative overflow-hidden rounded-[2.6rem] border border-white/80 px-6 py-10 shadow-soft sm:px-10 sm:py-12">
        <div className="kid-blob kid-blob-a" />
        <div className="kid-blob kid-blob-b" />
        <div className="kid-blob kid-blob-c" />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div data-aos="fade-right" data-aos-delay="90">
            <p className="kid-pill">
              Interaktiv ta'lim o'yinlari 
            </p>

            <h1 className="hero-title-neon mt-5 font-kid text-4xl leading-tight text-slate-900 sm:text-6xl">
              Darsni
              <span className="hero-gradient-text mx-2 bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-500 bg-clip-text text-transparent">
                mini-sarguzashtga
              </span>
              aylantiring  
            </h1>

            <p className="hero-subglow mt-5 max-w-2xl text-lg font-bold text-slate-600">
              Qisqa topshiriqlar, jonli animatsiya va tez natija.
            </p>

            <div className="mt-5 flex flex-wrap gap-2" data-aos="fade-up" data-aos-delay="130">
              {accentChips.map((chip, index) => (
                <span
                  key={chip}
                  className="kid-accent-chip"
                  data-aos="zoom-in"
                  data-aos-delay={String(140 + index * 55)}
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/games" className="hero-neon-btn kid-cta-primary text-center">
                O'yinlarni boshlash
              </Link>
              <Link to="/login" className="hero-neon-btn kid-cta-secondary text-center">
                O'yinlarni ko'rish
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {quickStats.map((stat, index) => (
                <article
                  key={stat.label}
                  className="kid-stat-card"
                  data-aos="zoom-in-up"
                  data-aos-delay={String(120 + index * 80)}
                >
                  <p className="font-kid text-3xl text-sky-600">{stat.value}</p>
                  <p className="mt-1 font-extrabold text-slate-600">{stat.label}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative" data-aos="fade-left" data-aos-delay="150">
            <div className="kid-console">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-sky-600">
                    Bosh panel
                  </p>
                  <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                    Rejim faol
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
                  Onlayn
                </span>
              </div>

              <div className="kid-stage mt-4">
                <div className="kid-stage-ring" />
                <div className="kid-stage-core">START</div>

                {quests.map((quest, index) => (
                  <article
                    key={quest.title}
                    className={`kid-quest-card ${quest.posClass} ${quest.visibility}`}
                    data-aos="zoom-in"
                    data-aos-delay={String(170 + index * 70)}
                  >
                    <div
                      className={`h-1.5 w-full rounded-full bg-gradient-to-r ${quest.tone}`}
                    />
                    <p className="mt-2 font-extrabold text-slate-800">
                      {quest.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                      <span>{quest.time}</span>
                      <span>{quest.xp}</span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <article className="kid-mode-card" data-aos="fade-up" data-aos-delay="220">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-fuchsia-600">
                    Vazifa
                  </p>
                  <p className="mt-2 font-kid text-2xl text-slate-900">
                    Kunlik topshiriq
                  </p>
                </article>
                <article className="kid-mode-card" data-aos="fade-up" data-aos-delay="280">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-600">
                    Mukofot
                  </p>
                  <p className="mt-2 font-kid text-2xl text-slate-900">
                    +300 Bonus XP
                  </p>
                </article>
              </div>
            </div>

            <div className="kid-float-badge -right-3 top-24 hidden lg:block" data-aos="fade-left" data-aos-delay="190">
              +25 XP
            </div>
            <div className="kid-float-badge -bottom-3 right-4" data-aos="fade-up" data-aos-delay="220">
              Jonli o'yin
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
