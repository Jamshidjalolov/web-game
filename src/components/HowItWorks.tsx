type Step = {
  id: string
  title: string
  description: string
  crossed?: boolean
  icon: 'user' | 'plane' | 'trophy'
}

const steps: Step[] = [
  {
    id: '01',
    title: "Ro'yxatdan o'tish",
    description:
      "Platforma hozir test rejimida, xohlasangiz ro'yxatdan o'tmasdan ham ko'rishingiz mumkin.",
    crossed: true,
    icon: 'user',
  },
  {
    id: '02',
    title: "O'yinlardan birini tanlang",
    description:
      "Muvaffaqiyatli kirgandan so'ng bolaga mos o'yin va metodlardan birini tanlang.",
    icon: 'plane',
  },
  {
    id: '03',
    title: "Birga o'ynang va o'rgating",
    description:
      "Qiziqarli, interaktiv topshiriqlar bilan dars sifatini oshiring va natijani kuzating.",
    icon: 'trophy',
  },
]

function StepIcon({ icon }: { icon: Step['icon'] }) {
  if (icon === 'user') {
    return (
      <svg viewBox="0 0 24 24" className="h-10 w-10 text-sky-600" fill="none">
        <path
          d="M20 21V19C20 17.6739 19.4732 16.4021 18.5355 15.4645C17.5979 14.5268 16.3261 14 15 14H9C7.67392 14 6.40215 14.5268 5.46447 15.4645C4.52678 16.4021 4 17.6739 4 19V21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="7"
          r="4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (icon === 'plane') {
    return (
      <svg viewBox="0 0 24 24" className="h-10 w-10 text-sky-600" fill="none">
        <path
          d="M22 2L11 13"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 2L15 22L11 13L2 9L22 2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10 text-sky-600" fill="none">
      <path
        d="M6 9H4.5C4.10218 9 3.72064 8.84196 3.43934 8.56066C3.15804 8.27936 3 7.89782 3 7.5V6C3 5.60218 3.15804 5.22064 3.43934 4.93934C3.72064 4.65804 4.10218 4.5 4.5 4.5H6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 9H19.5C19.8978 9 20.2794 8.84196 20.5607 8.56066C20.842 8.27936 21 7.89782 21 7.5V6C21 5.60218 20.842 5.22064 20.5607 4.93934C20.2794 4.65804 19.8978 4.5 19.5 4.5H18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 9V12C6 13.5913 6.63214 15.1174 7.75736 16.2426C8.88258 17.3679 10.4087 18 12 18C13.5913 18 15.1174 17.3679 16.2426 16.2426C17.3679 15.1174 18 13.5913 18 12V9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 21H16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 18V21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HowItWorks() {
  return (
    <section
      id="qanday-ishlaydi"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6"
      data-aos="fade-up"
    >
      <div className="glass-card px-6 py-12 sm:px-10">
        <div className="text-center" data-aos="fade-up" data-aos-delay="60">
          <h2 className="font-kid text-5xl text-slate-900 sm:text-6xl">
            Platforma qanday ishlaydi
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-xl font-bold text-slate-500">
            Uchta oddiy qadamda boshlang
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex w-full items-start gap-6 lg:w-auto lg:flex-1">
              <article
                className="group relative w-full rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft transition duration-300 hover:-translate-y-2 hover:shadow-[0_32px_44px_-34px_rgba(2,132,199,0.65)]"
                data-aos="fade-up"
                data-aos-delay={String(120 + index * 140)}
              >
                {step.crossed ? (
                  <>
                    <span className="pointer-events-none absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 rotate-45 rounded-full bg-rose-300/60" />
                    <span className="pointer-events-none absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 -rotate-45 rounded-full bg-rose-300/60" />
                  </>
                ) : null}

                <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-sky-100">
                  <StepIcon icon={step.icon} />
                  <span className="absolute -right-2 -top-1 grid h-12 w-12 place-items-center rounded-full bg-orange-500 font-kid text-3xl text-white shadow-soft">
                    {step.id}
                  </span>
                </div>

                <h3 className="mt-6 text-center font-kid text-4xl leading-tight text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-center text-lg font-bold leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </article>

              {index < steps.length - 1 ? (
                <div
                  className="hidden self-center pt-2 text-6xl font-bold text-sky-300 lg:block"
                  data-aos="fade-right"
                  data-aos-delay={String(170 + index * 140)}
                >
                  →
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
