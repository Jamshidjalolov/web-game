type Feature = {
  id: string
  title: string
  desc: string
  tone: string
}

const features: Feature[] = [
  {
    id: '01',
    title: "Aql o'yinlari",
    desc: "Qiziqarli topshiriqlar darsni jonlantiradi.",
    tone: 'from-cyan-500 to-sky-500',
  },
  {
    id: '02',
    title: "O'zbekcha interfeys",
    desc: "Sodda va tushunarli boshqaruv.",
    tone: 'from-fuchsia-500 to-rose-500',
  },
  {
    id: '03',
    title: 'Level va sovrin',
    desc: "Har bosqichda rag'bat va bonuslar.",
    tone: 'from-emerald-500 to-lime-500',
  },
]

function Features() {
  return (
    <section
      id="xususiyatlar"
      className="mx-auto max-w-6xl px-4 py-14 sm:px-6"
      data-aos="fade-up"
    >
      <div className="text-center" data-aos="fade-up" data-aos-delay="60">
        <p className="font-extrabold uppercase tracking-[0.28em] text-cyan-600">
          Xususiyatlar
        </p>
        <h2 className="mt-3 font-kid text-4xl text-slate-900 sm:text-5xl">
          Qisqa va kuchli imkoniyatlar
        </h2>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {features.map((feature, index) => (
          <article
            key={feature.title}
            className={`pop-card p-6 ${index === 1 ? 'md:-translate-y-3' : ''}`}
            data-aos="zoom-in-up"
            data-aos-delay={String(120 + index * 110)}
          >
            <div
              className={`feature-neon-icon inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r font-kid text-2xl text-white ${feature.tone}`}
            >
              {feature.id}
            </div>
            <h3 className="mt-5 font-kid text-2xl text-slate-900">
              {feature.title}
            </h3>
            <p className="mt-3 font-bold leading-relaxed text-slate-600">
              {feature.desc}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Features
