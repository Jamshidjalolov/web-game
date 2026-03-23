import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FooterCTA from '../components/FooterCTA.tsx'
import GameCommentsSection from '../components/GameCommentsSection.tsx'
import Navbar from '../components/Navbar.tsx'
import QuestionManagerLinkCard from '../components/QuestionManagerLinkCard.tsx'
import { DEFAULT_BARABAN_NAMES, DEFAULT_BARABAN_QUESTIONS } from '../data/barabanDefaults.ts'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import { fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'

const parseNames = (raw: string) =>
  Array.from(
    new Set(
      raw
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, 16)

const normalizeText = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ')

const parseBackendQuestions = (questions: BackendQuestion[]): string[] => {
  const dedupe = new Map<string, string>()
  questions.forEach((question) => {
    const prompt = question.prompt.trim()
    if (!prompt) return
    const key = normalizeText(prompt)
    if (dedupe.has(key)) return
    dedupe.set(key, prompt)
  })
  return Array.from(dedupe.values()).slice(0, 200)
}

function BarabanSetupPage() {
  const navigate = useNavigate()
  const game = findGameById('baraban-metodi')
  const canUseTeacherContent = useTeacherGameAccess()
  const [rawNames, setRawNames] = useState(DEFAULT_BARABAN_NAMES.join('\n'))
  const [teacherQuestions, setTeacherQuestions] = useState<string[]>([])
  const [hint, setHint] = useState('')

  const parsedNames = useMemo(() => parseNames(rawNames), [rawNames])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!canUseTeacherContent) {
        if (isMounted) setTeacherQuestions([])
        return
      }
      const backendQuestions = parseBackendQuestions(await fetchGameQuestions('baraban-metodi'))
      if (!isMounted) return
      setTeacherQuestions(backendQuestions)
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [canUseTeacherContent])

  const handleStart = () => {
    if (parsedNames.length < 2) {
      setHint("Kamida 2 ta o'quvchi ismini kiriting.")
      return
    }
    if (parsedNames.length > 16) {
      setHint("16 tadan ko'p ism kiritmang.")
      return
    }

    const params = new URLSearchParams()
    parsedNames.forEach((name) => params.append('name', name))
    navigate(`/games/baraban-metodi/arena?${params.toString()}`)
  }

  if (!game) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
          <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-soft backdrop-blur-xl">
            <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-cyan-700">
              Baraban Setup
            </p>
            <h1 className="mt-3 font-kid text-5xl text-slate-900 sm:text-6xl">{game.title}</h1>
            <p className="mt-3 text-lg font-bold text-slate-600">
              O'qituvchi guruhdagi o'quvchilar ismini kiritadi. Baraban kimga tushsa, o'sha
              o'quvchiga savol beriladi. Savollar endi `Test tizimi`dan olinadi, teacher savoli bo'lmasa
              standart savollar ishlaydi. Oxirida qolgan 1 ta o'quvchiga savol berilmaydi.
            </p>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <label className="text-sm font-extrabold text-slate-700">Ismlar (har qatorga bitta)</label>
                <textarea
                  value={rawNames}
                  onChange={(e) => {
                    setRawNames(e.target.value)
                    setHint('')
                  }}
                  className="mt-2 h-72 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                  placeholder={"Ali\nVali\nAziza"}
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-500">
                    Hozir: <span className="font-extrabold text-slate-800">{parsedNames.length}</span> ta ism
                  </p>
                  <button
                    type="button"
                    onClick={() => setRawNames(DEFAULT_BARABAN_NAMES.join('\n'))}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5"
                  >
                    Namuna
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-extrabold text-slate-700">Savollar manbai</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Teacher bank</p>
                      <p className="mt-1 text-2xl font-extrabold text-slate-900">{teacherQuestions.length}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">Teacher login bo'lsa shu savollar ishlatiladi.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Standart savol</p>
                      <p className="mt-1 text-2xl font-extrabold text-slate-900">{DEFAULT_BARABAN_QUESTIONS.length}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">Teacher savol bo'lmasa yoki login bo'lmasa ishlaydi.</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStart}
                  className={`mt-4 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r px-6 py-4 text-lg font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${game.tone}`}
                >
                  Barabanni ochish
                </button>

                {hint ? (
                  <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-700">
                    {hint}
                  </p>
                ) : null}
              </div>

              <aside className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Ko'rinish</p>
                <div className="mt-2 grid gap-2">
                  {parsedNames.slice(0, 12).map((name, index) => (
                    <div
                      key={`${name}-${index}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-extrabold text-slate-700"
                    >
                      {index + 1}. {name}
                    </div>
                  ))}
                </div>

                <QuestionManagerLinkCard
                  className="mt-4"
                  gameTitle={game.title}
                  itemCount={teacherQuestions.length}
                  canManage={canUseTeacherContent}
                />
              </aside>
            </div>
          </section>
        </main>

        <div className="mx-auto max-w-[1320px] px-4 pb-10 sm:px-6">
          <GameCommentsSection gameId={game.id} gameTitle={game.title} />
        </div>
        <FooterCTA />
      </div>
    </div>
  )
}

export default BarabanSetupPage
