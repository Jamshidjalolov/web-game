import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

type BarabanArenaProps = {
  gameTitle: string
  gameTone: string
  initialNames: string[]
  initialQuestions?: string[]
}

const SPIN_DURATION_MS = 2500
const WHEEL_COLORS = [
  '#38bdf8',
  '#34d399',
  '#f59e0b',
  '#a78bfa',
  '#fb7185',
  '#22d3ee',
  '#818cf8',
  '#f472b6',
]

const DEFAULT_QUESTION_BANK = [
  'Bugungi mavzudan bitta asosiy tushunchani ayting.',
  "2 ta misolni og'zaki yechib bering.",
  'O‘tgan darsdagi 1 qoidani tushuntiring.',
  'Bitta yangi so‘z va ma’nosini ayting.',
  'Jamoa bilan ishlashning 1 foydasini ayting.',
  'Mavzuga doir 1 savol tuzing.',
  'Bugun nimani yaxshi o‘rgandingiz?',
  'Doskaga chiqib qisqa misol ko‘rsating.',
]

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const normalizeDeg = (value: number) => ((value % 360) + 360) % 360

const makeWheelGradient = (count: number) => {
  if (count <= 0) {
    return 'conic-gradient(#e2e8f0 0deg 360deg)'
  }
  const angle = 360 / count
  const stops = Array.from({ length: count }, (_, index) => {
    const start = index * angle
    const end = start + angle
    const color = WHEEL_COLORS[index % WHEEL_COLORS.length]
    return `${color} ${start}deg ${end}deg`
  })
  return `conic-gradient(${stops.join(',')})`
}

function BarabanArena({
  gameTitle,
  gameTone,
  initialNames,
  initialQuestions = [],
}: BarabanArenaProps) {
  const questionSeed = useMemo(
    () => (initialQuestions.length > 0 ? initialQuestions : DEFAULT_QUESTION_BANK),
    [initialQuestions],
  )

  const [activeNames, setActiveNames] = useState<string[]>(initialNames)
  const [askedNames, setAskedNames] = useState<string[]>([])
  const [questionPool, setQuestionPool] = useState<string[]>(questionSeed)

  const [pickedName, setPickedName] = useState<string | null>(null)
  const [pickedQuestion, setPickedQuestion] = useState('')
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [statusText, setStatusText] = useState("Boshlash tugmasini bosing, baraban ism tanlaydi.")
  const timeoutRef = useRef<number | null>(null)
  const rotationRef = useRef(0)

  const segmentAngle = activeNames.length > 0 ? 360 / activeNames.length : 360
  const wheelGradient = useMemo(() => makeWheelGradient(activeNames.length), [activeNames.length])
  const sparedName = finished && activeNames.length === 1 ? activeNames[0] : null
  const canSpin = !spinning && !finished && !pickedName && activeNames.length > 1

  const clearSpinTimeout = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const startSpin = () => {
    if (!canSpin) return

    clearSpinTimeout()
    setSpinning(true)
    setStatusText('Baraban aylanmoqda...')
    setPickedName(null)
    setPickedQuestion('')

    const namesSnapshot = [...activeNames]
    const segmentSnapshot = namesSnapshot.length > 0 ? 360 / namesSnapshot.length : 360
    const selectedIndex = randomInt(0, Math.max(namesSnapshot.length - 1, 0))
    const currentNormalized = normalizeDeg(rotationRef.current)
    const targetNormalized = normalizeDeg(-selectedIndex * segmentSnapshot)
    const alignmentDelta = normalizeDeg(targetNormalized - currentNormalized)
    const baseTurns = (3 + randomInt(0, 2)) * 360
    const nextRotation = rotationRef.current + baseTurns + alignmentDelta
    rotationRef.current = nextRotation
    setRotation(nextRotation)

    timeoutRef.current = window.setTimeout(() => {
      if (namesSnapshot.length === 0) {
        setSpinning(false)
        timeoutRef.current = null
        return
      }

      const sourcePool = questionPool.length > 0 ? questionPool : questionSeed
      const questionIndex = randomInt(0, sourcePool.length - 1)
      const question = sourcePool[questionIndex]
      const selected = namesSnapshot[selectedIndex] ?? namesSnapshot[namesSnapshot.length - 1]

      setQuestionPool((prev) => {
        const base = prev.length > 0 ? prev : questionSeed
        return base.filter((_, index) => index !== questionIndex)
      })
      setPickedName(selected)
      setPickedQuestion(question)
      setSpinning(false)
      setStatusText(`${selected} tanlandi. Savol bering.`)
      timeoutRef.current = null
    }, SPIN_DURATION_MS)
  }

  const confirmQuestionAsked = () => {
    if (!pickedName) return

    const nextActive = activeNames.filter((name) => name !== pickedName)
    setActiveNames(nextActive)
    setAskedNames((prev) => [...prev, pickedName])
    setPickedName(null)
    setPickedQuestion('')

    if (nextActive.length <= 1) {
      setFinished(true)
      setStatusText("O'yin yakunlandi. Oxirida qolgan 1 ta o'quvchiga savol berilmaydi.")
      return
    }

    setStatusText('Keyingi o‘quvchi uchun barabanni aylantiring.')
  }

  const resetRound = () => {
    clearSpinTimeout()
    setActiveNames(initialNames)
    setAskedNames([])
    setQuestionPool(questionSeed)
    setPickedName(null)
    setPickedQuestion('')
    setRotation(0)
    rotationRef.current = 0
    setSpinning(false)
    setFinished(false)
    setStatusText("Boshlash tugmasini bosing, baraban ism tanlaydi.")
  }

  useEffect(() => {
    return () => {
      clearSpinTimeout()
    }
  }, [])

  return (
    <section className="glass-card p-4 sm:p-6" data-aos="fade-up">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-cyan-700">
            Real Baraban
          </p>
          <h2 className="mt-1 font-kid text-4xl text-slate-900">{gameTitle}</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/games/baraban-metodi"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5"
          >
            {'< '}Orqaga
          </Link>
          <button
            type="button"
            onClick={resetRound}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5"
          >
            Qayta boshlash
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="mx-auto w-fit">
            <div className="relative h-80 w-80 sm:h-96 sm:w-96">
              <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
                <div className="h-0 w-0 border-l-[16px] border-r-[16px] border-t-[30px] border-l-transparent border-r-transparent border-t-slate-800" />
              </div>

              <div
                className="relative h-full w-full rounded-full border-[8px] border-white shadow-soft"
                style={{
                  background: wheelGradient,
                  transform: `rotate(${rotation - segmentAngle / 2}deg)`,
                  transition: spinning ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.2,0.85,0.25,1)` : 'none',
                }}
              >
                {activeNames.map((name, index) => {
                  const angle = index * segmentAngle + segmentAngle / 2
                  return (
                    <span
                      key={`${name}-${index}`}
                      className="absolute left-1/2 top-1/2 text-[11px] font-extrabold text-white drop-shadow"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-130px) rotate(${-angle}deg)`,
                        maxWidth: '86px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {name}
                    </span>
                  )
                })}

                <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-slate-900 shadow-soft" />
              </div>
            </div>
          </div>

          <div className={`mt-4 rounded-2xl border px-4 py-3 text-center text-sm font-extrabold ${
            finished ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
          }`}>
            {statusText}
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={startSpin}
              disabled={!canSpin}
              className={`rounded-2xl bg-gradient-to-r px-6 py-3 text-base font-extrabold text-white shadow-soft transition ${
                canSpin ? `hover:-translate-y-0.5 ${gameTone}` : 'cursor-not-allowed bg-slate-300'
              }`}
            >
              {spinning ? 'Aylanmoqda...' : 'Barabanni aylantirish'}
            </button>

            {pickedName ? (
              <button
                type="button"
                onClick={confirmQuestionAsked}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-base font-extrabold text-slate-700 transition hover:-translate-y-0.5"
              >
                Savol berildi
              </button>
            ) : null}
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">Qolgan o'quvchi</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{activeNames.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">Savol berilgan</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{askedNames.length}</p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">Qolgan savollar</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {questionPool.length > 0 ? questionPool.length : questionSeed.length}
            </p>
          </div>

          {pickedName ? (
            <div className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-cyan-700">Tanlangan o'quvchi</p>
              <p className="mt-1 font-kid text-4xl text-slate-900">{pickedName}</p>
              <p className="mt-2 text-sm font-bold text-slate-700">{pickedQuestion}</p>
            </div>
          ) : null}

          {finished && sparedName ? (
            <div className="mt-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">Savolsiz qolgan</p>
              <p className="mt-1 text-sm font-extrabold text-emerald-800">{sparedName}</p>
            </div>
          ) : null}

          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">Yakun</p>
            <p className="mt-1 text-lg font-extrabold text-slate-800">
              {finished ? "Baraban raundi tugadi" : "O'yin davom etmoqda"}
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default BarabanArena
