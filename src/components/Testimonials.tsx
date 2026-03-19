type Review = {
  name: string
  role: string
  text: string
}

const reviews: Review[] = [
  {
    name: 'Dilafruz opa',
    role: "Boshlang'ich ta'lim mentori",
    text: "Bolalar darsga oson kirishyapti va topshiriqlarni zavq bilan bajarishyapti.",
  },
  {
    name: 'Jahongir aka',
    role: 'Fan o`qituvchisi',
    text: "Matematika va o'qish mashqlarida natijalar ko'zga ko'rinarli darajada oshdi.",
  },
  {
    name: 'Malika ona',
    role: 'Ota-ona',
    text: "Uyda telefon vaqtini foydali mashg'ulotga aylantirib berdi.",
  },
]

function Testimonials() {
  return (
    <section
      id="community"
      className="mx-auto max-w-6xl px-4 py-14 sm:px-6"
      data-aos="fade-up"
    >
      <span id="izohlar" className="sr-only">Izohlar</span>
      <div className="text-center" data-aos="fade-up" data-aos-delay="60">
        <p className="font-extrabold uppercase tracking-[0.22em] text-cyan-600">
          Izohlar
        </p>
        <h2 className="mt-3 font-kid text-4xl text-slate-900 sm:text-5xl">
          Ota-ona va ustozlar nima deydi?
        </h2>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {reviews.map((review, index) => (
          <article
            key={review.name}
            className={`pop-card p-6 ${index === 1 ? 'md:-translate-y-2' : ''}`}
            data-aos="fade-up"
            data-aos-delay={String(120 + index * 110)}
          >
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-amber-500">
              5.0 reyting
            </p>
            <p className="mt-3 font-bold leading-relaxed text-slate-600">
              "{review.text}"
            </p>
            <p className="mt-6 font-kid text-2xl text-slate-900">{review.name}</p>
            <p className="text-sm font-extrabold text-fuchsia-600">{review.role}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Testimonials
