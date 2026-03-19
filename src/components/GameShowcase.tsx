import { Link } from 'react-router-dom'
import barabanImage from '../assets/games/baraban.svg'
import arqonImage from '../rasm/tortish.png'
import sozQidiruvImage from '../assets/games/soz-qidiruv.svg'
import millionerImage from '../assets/games/millioner.svg'
import inglizchaImage from '../assets/games/inglizcha.svg'
import tezkorHisobImage from '../assets/games/tezkor-hisob-cover.svg'

type ShowcaseCard = {
  id: string
  title: string
  desc: string
  players: string
  level: string
  xpReward: string
  image: string
  imageAlt: string
  topTone: string
  ctaTone: string
}

const showcaseCards: ShowcaseCard[] = [
  {
    id: 'baraban-metodi',
    title: 'Baraban metodi',
    desc: "Barabanni aylantiring va tasodifiy o'quvchini tanlang.",
    players: '300+ foydalanish',
    level: 'Oddiy daraja',
    xpReward: '+180 XP',
    image: barabanImage,
    imageAlt: 'Rangli baraban metodi rasmi',
    topTone: 'from-blue-500 to-cyan-500',
    ctaTone: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'arqon-tortish',
    title: "Arqon tortish o'yini",
    desc: "Jamoaviy arqon tortish mashg'ulotida g'alabaga boring.",
    players: '600+ foydalanish',
    level: "O'rta daraja",
    xpReward: '+260 XP',
    image: arqonImage,
    imageAlt: "Arqon tortish o'yini rasmi",
    topTone: 'from-orange-500 to-amber-500',
    ctaTone: 'from-orange-500 to-amber-500',
  },
  {
    id: 'soz-qidiruv',
    title: "So'z qidiruv o'yini",
    desc: "Aralash harflar maydonidan so'zlarni topish o'yini.",
    players: '650+ foydalanish',
    level: 'Murakkab daraja',
    xpReward: '+300 XP',
    image: sozQidiruvImage,
    imageAlt: "So'z qidiruv o'yini rasmi",
    topTone: 'from-emerald-500 to-green-500',
    ctaTone: 'from-emerald-500 to-green-500',
  },
  {
    id: 'millioner',
    title: 'Millioner o`yini',
    desc: 'Ikkala jamoa bir xil savolda bellashadi, birinchi topgan bonus oladi.',
    players: '540+ foydalanish',
    level: "O'rta daraja",
    xpReward: '+420 XP',
    image: millionerImage,
    imageAlt: 'Millioner viktorina o`yini rasmi',
    topTone: 'from-indigo-500 to-violet-500',
    ctaTone: 'from-indigo-500 to-violet-500',
  },
  {
    id: 'inglizcha-soz',
    title: "Inglizcha so'z o'yini",
    desc: 'A, B, C topshiriqlari orqali yangi so`zlarni tez yodlang.',
    players: '720+ foydalanish',
    level: 'Murakkab daraja',
    xpReward: '+280 XP',
    image: inglizchaImage,
    imageAlt: "Inglizcha so'z o'yini rasmi",
    topTone: 'from-rose-500 to-pink-500',
    ctaTone: 'from-rose-500 to-pink-500',
  },
  {
    id: 'tezkor-hisob',
    title: 'Tezkor hisob',
    desc: 'Qisqa vaqt ichida misollarni yechib jamoa tezligini oshiring.',
    players: '700+ foydalanish',
    level: "O'rta daraja",
    xpReward: '+240 XP',
    image: tezkorHisobImage,
    imageAlt: 'Tezkor hisob o`yini rasmi',
    topTone: 'from-sky-500 to-indigo-500',
    ctaTone: 'from-sky-500 to-indigo-500',
  },
]

function GameShowcase() {
  return (
    <section
      id="oyinlar"
      className="mx-auto max-w-7xl px-4 py-14 sm:px-6"
      data-aos="fade-up"
    >
      <div className="text-center" data-aos="fade-up" data-aos-delay="60">
        <p className="mx-auto inline-flex rounded-full border border-amber-200 bg-amber-100/80 px-5 py-2 text-sm font-extrabold text-amber-800">
          O'qituvchilarning tanlovi
        </p>
        <h2 className="mt-4 font-kid text-5xl text-slate-900 sm:text-6xl">
          Sevimli O'yinlar
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-xl font-bold text-slate-500">
          Rasmli, chiroyli va bolalarni o'rganishga ilhomlantiradigan interaktiv o'yinlar
        </p>
      </div>

      <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
        {showcaseCards.map((card, index) => (
          <article
            key={card.title}
            className="game-grid-card group"
            data-aos="fade-up"
            data-aos-delay={String(100 + index * 85)}
          >
            <div className={`h-2 w-full bg-gradient-to-r ${card.topTone}`} />

            <div className="game-media">
              <div className="game-media-pattern" />
              <img
                src={card.image}
                alt={card.imageAlt}
                className="game-media-image"
                loading="lazy"
              />
            </div>

            <div className="px-6 pb-6">
              <h3 className="font-kid text-4xl leading-tight text-slate-900">
                {card.title}
              </h3>
              <p className="game-xp-reward mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em]">
                {card.xpReward} mukofot
              </p>
              <p className="mt-3 text-lg font-bold leading-relaxed text-slate-600">
                {card.desc}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="game-stat-pill">
                  <p className="text-sm font-extrabold text-slate-700">
                    {card.players}
                  </p>
                </div>
                <div className="game-stat-pill">
                  <p className="text-sm font-extrabold text-slate-700">
                    {card.level}
                  </p>
                </div>
              </div>
            </div>

            <Link
              to={`/games/${card.id}`}
              className={`game-cta bg-gradient-to-r ${card.ctaTone}`}
            >
              Foydalanish
              <span className="transition group-hover:translate-x-1">{'>'}</span>
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-10 flex justify-center" data-aos="zoom-in" data-aos-delay="150">
        <Link
          to="/games"
          className="rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 px-9 py-4 text-lg font-extrabold text-white shadow-soft transition hover:-translate-y-1 hover:saturate-125"
        >
          Barchasini ko'rish
        </Link>
      </div>
    </section>
  )
}

export default GameShowcase
