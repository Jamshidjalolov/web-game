import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AiQuizImportPanel from '../components/AiQuizImportPanel.tsx'
import FooterCTA from '../components/FooterCTA.tsx'
import Navbar from '../components/Navbar.tsx'
import QuestionManagerLinkCard from '../components/QuestionManagerLinkCard.tsx'
import type { TeacherKvestQuestion } from '../components/TopqirlikKvestArena.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import {
  importAiGeneratedQuestions,
  mapAiDifficultyToUzbek,
  type AiGeneratedPayload,
} from '../lib/aiQuizGenerator.ts'
import { createGameQuestion, deleteGameQuestion, fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type LocalTeacherKvestQuestion = TeacherKvestQuestion & { difficulty: Difficulty; backendId?: string }

type DifficultyInfo = {
  rounds: number
  seconds: number
  description: string
}

const difficultyInfo: Record<Difficulty, DifficultyInfo> = {
  Oson: {
    rounds: 10,
    seconds: 30,
    description: 'Yengil savollar, ko`proq vaqt va qulay start.',
  },
  "O'rta": {
    rounds: 10,
    seconds: 30,
    description: 'Balansli temp, topqirlik va tezlik birga sinovdan o`tadi.',
  },
  Qiyin: {
    rounds: 10,
    seconds: 30,
    description: 'Qiyinroq savollar va tez qaror qabul qilish rejimi.',
  },
}

const parseDifficultyValue = (value: unknown): Difficulty | null => {
  if (value === 'Oson' || value === "O'rta" || value === 'Qiyin') return value
  return null
}

const parseBackendTeacherQuestions = (questions: BackendQuestion[]): LocalTeacherKvestQuestion[] => {
  const dedupe = new Map<string, LocalTeacherKvestQuestion>()

  questions.forEach((question) => {
    const prompt = question.prompt.trim()
    const options = question.options.map((item) => item.trim()).filter(Boolean)
    const correctIndex = question.correct_index ?? -1
    if (!prompt || options.length !== 4 || correctIndex < 0 || correctIndex > 3) return

    const meta = question.metadata_json
    const difficulty = parseDifficultyValue(typeof meta.difficulty === 'string' ? meta.difficulty : question.difficulty) ?? "O'rta"
    const key = `${prompt.toLowerCase().trim()}__${options.join('|').toLowerCase()}__${correctIndex}`
    if (dedupe.has(key)) return

    dedupe.set(key, {
      difficulty,
      prompt,
      options,
      correctIndex,
      backendId: question.id,
    })
  })

  return Array.from(dedupe.values()).slice(0, 120)
}

function TopqirlikKvestSetupPage() {
  const navigate = useNavigate()
  const game = findGameById('topqirlik-kvest')
  const canUseTeacherContent = useTeacherGameAccess()

  const [difficulty, setDifficulty] = useState<Difficulty>("O'rta")
  const [teamOne, setTeamOne] = useState('1-Jamoa')
  const [teamTwo, setTeamTwo] = useState('2-Jamoa')
  const [teacherQuestions, setTeacherQuestions] = useState<LocalTeacherKvestQuestion[]>([])
  const [draftDifficulty, setDraftDifficulty] = useState<Difficulty>("O'rta")
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftOptions, setDraftOptions] = useState(['', '', '', ''])
  const [draftCorrectIndex, setDraftCorrectIndex] = useState(0)
  const [formHint, setFormHint] = useState('')

  const info = useMemo(() => difficultyInfo[difficulty], [difficulty])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!canUseTeacherContent) {
        if (isMounted) setTeacherQuestions([])
        return
      }
      const backendQuestions = parseBackendTeacherQuestions(await fetchGameQuestions('topqirlik-kvest'))
      if (!isMounted) return
      setTeacherQuestions(backendQuestions)
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [canUseTeacherContent])

  const addTeacherQuestion = async () => {
    if (!canUseTeacherContent) {
      setFormHint("Custom mantiqiy savollar faqat teacher akkauntida ishlaydi.")
      return
    }
    const prompt = draftPrompt.trim()
    const options = draftOptions.map((item) => item.trim())
    if (!prompt) {
      setFormHint('Savol matnini kiriting.')
      return
    }
    if (prompt.length < 3) {
      setFormHint("Savol matni kamida 3 ta belgidan iborat bo'lsin.")
      return
    }
    if (options.some((item) => !item)) {
      setFormHint('4 ta variantning hammasini to‘ldiring.')
      return
    }
    if (new Set(options.map((item) => item.toLowerCase())).size < 4) {
      setFormHint('Variantlar bir-biridan farq qilishi kerak.')
      return
    }

    let createdId: string | undefined
    try {
      const created = await createGameQuestion({
        gameId: 'topqirlik-kvest',
        questionType: 'multiple_choice',
        prompt,
        options,
        correctIndex: draftCorrectIndex,
        difficulty: draftDifficulty,
        metadata: {
          difficulty: draftDifficulty,
          source: 'topqirlik-kvest',
        },
      })
      createdId = created.id
    } catch (error) {
      setFormHint(error instanceof Error ? error.message : "Savol backendga saqlanmadi.")
      return
    }

    setTeacherQuestions((prev) =>
      [{ difficulty: draftDifficulty, prompt, options, correctIndex: draftCorrectIndex, backendId: createdId }, ...prev].slice(0, 120),
    )
    setDraftPrompt('')
    setDraftOptions(['', '', '', ''])
    setDraftCorrectIndex(0)
    setDraftDifficulty("O'rta")
    setFormHint('')
  }

  const handleImportAiQuestions = async (generated: AiGeneratedPayload) => {
    if (!canUseTeacherContent) {
      const message = "AI orqali custom savol qo'shish faqat teacher akkauntida ishlaydi."
      setFormHint(message)
      return message
    }
    const importedDifficulty = mapAiDifficultyToUzbek(generated.daraja)
    const imported = await importAiGeneratedQuestions<LocalTeacherKvestQuestion>({
      existingItems: teacherQuestions,
      generated,
      makeExistingKey: (question) => `${question.prompt.toLowerCase().trim()}__${question.options.join('|').toLowerCase()}__${question.correctIndex}`,
      makeGeneratedKey: (test) => `${test.question.toLowerCase().trim()}__${test.options.join('|').toLowerCase()}__${test.correctIndex}`,
      createPayload: (test) => ({
        gameId: 'topqirlik-kvest',
        questionType: 'multiple_choice',
        prompt: test.question,
        options: test.options,
        correctIndex: test.correctIndex,
        difficulty: importedDifficulty,
        metadata: {
          difficulty: importedDifficulty,
          source: 'topqirlik-kvest',
          ai_fan: generated.fan,
          ai_mavzu: generated.mavzu,
        },
      }),
      toLocalItem: (test, _payload, createdId) => ({
        difficulty: importedDifficulty,
        prompt: test.question,
        options: test.options,
        correctIndex: test.correctIndex,
        backendId: createdId,
      }),
    })

    if (imported.items.length > 0) {
      setTeacherQuestions((prev) => [...imported.items, ...prev].slice(0, 120))

      const preview = imported.items[0]
      setDraftDifficulty(preview.difficulty)
      setDraftPrompt(preview.prompt)
      setDraftOptions([...preview.options])
      setDraftCorrectIndex(preview.correctIndex)
    }

    const messageParts: string[] = []
    if (imported.items.length > 0) messageParts.push(`${imported.items.length} ta AI savol qo'shildi.`)
    if (imported.skippedCount > 0) messageParts.push(`${imported.skippedCount} tasi takror bo'lgani uchun o'tkazildi.`)
    if (imported.failedCount > 0) messageParts.push(`${imported.failedCount} tasi backendga saqlanmadi.`)
    const message = messageParts.join(' ') || "Yangi AI savol qo'shilmadi."
    setFormHint(message)
    return message
  }

  const removeTeacherQuestion = async (index: number) => {
    const target = teacherQuestions[index]
    if (!target) return
    const approved = window.confirm("Haqiqatan ham savolni o'chirmoqchimisiz?")
    if (!approved) return

    if (target.backendId) {
      try {
        await deleteGameQuestion(target.backendId)
      } catch (error) {
        setFormHint(error instanceof Error ? error.message : "Savolni backenddan o'chirib bo'lmadi.")
        return
      }
    }
    setTeacherQuestions((prev) => prev.filter((_, idx) => idx !== index))
    setFormHint("Savol o'chirildi.")
  }

  const handleOpenArena = () => {
    const cleanTeamOne = teamOne.trim()
    const cleanTeamTwo = teamTwo.trim()

    if (!cleanTeamOne || !cleanTeamTwo) {
      setFormHint('Ikkala jamoa nomini ham kiriting.')
      return
    }

    const customKey = `topqirlik-kvest-teacher-${Date.now()}`
    try {
      sessionStorage.setItem(customKey, JSON.stringify(teacherQuestions))
    } catch {
      setFormHint("Brauzer storage ishlamadi. Qayta urinib ko'ring.")
      return
    }

    const params = new URLSearchParams({
      difficulty,
      team1: cleanTeamOne,
      team2: cleanTeamTwo,
      custom: customKey,
    })
    navigate(`/games/topqirlik-kvest/arena?${params.toString()}`)
  }

  if (!game) return null

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-6">
          <section className="mb-6 rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-soft backdrop-blur-xl sm:p-7" data-aos="fade-up">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-cyan-700">
                  Setup Mode
                </p>
                <h1 className="mt-3 font-kid text-5xl leading-tight text-slate-900 sm:text-6xl">
                  {game.title}
                </h1>
                <p className="mt-3 text-lg font-bold text-slate-600">
                  Mantiqiy savollarda tez fikrlab, to`g`ri javob bilan bosqichma-bosqich oldinga chiqing.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className={`rounded-full bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${game.tone}`}>
                    {game.category}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {difficulty} daraja
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {info.rounds} bosqich
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {teacherQuestions.length} ta custom savol
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/90 p-4 shadow-soft">
                <img
                  src={game.image}
                  alt="Topqirlik kvesti preview"
                  className="h-64 w-full rounded-[1.25rem] object-contain object-center"
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]" data-aos="fade-up" data-aos-delay="60">
            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">O'yin haqida</h2>
              <p className="mt-3 text-lg font-bold leading-relaxed text-slate-600">
                Ikkala jamoa bir xil mantiqiy savolni bir vaqtda yechadi. Tezlik, aniqlik va combo bo'yicha
                ball beriladi. Har bosqichdan keyin tizim avtomatik keyingisiga o'tadi.
              </p>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Tanlangan rejim</p>
                <p className="mt-2 font-kid text-5xl text-slate-900">{difficulty}</p>
                <p className="text-sm font-bold text-slate-500">
                  Bosqich: {info.rounds}, har savolga vaqt: {info.seconds}s
                </p>
                <p className="mt-1 text-sm font-bold text-cyan-700">{info.description}</p>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-extrabold text-slate-800">Jamoa nomlari</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    value={teamOne}
                    onChange={(event) => setTeamOne(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                    placeholder="1-Jamoa"
                  />
                  <input
                    value={teamTwo}
                    onChange={(event) => setTeamTwo(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                    placeholder="2-Jamoa"
                  />
                </div>
              </div>

              <QuestionManagerLinkCard
                className="mt-5"
                gameTitle={game.title}
                itemCount={teacherQuestions.length}
                canManage={canUseTeacherContent}
              />

              <button
                type="button"
                onClick={handleOpenArena}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-4 text-xl font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${game.tone}`}
              >
                O'yinni boshlash
              </button>

              {formHint ? (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-700">
                  {formHint}
                </p>
              ) : null}
            </article>

            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Daraja tanlash</h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {(['Oson', "O'rta", 'Qiyin'] as Difficulty[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`rounded-full px-5 py-3 text-lg font-extrabold transition ${
                      difficulty === level
                        ? `bg-gradient-to-r text-white shadow-soft ${game.tone}`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Bosqich</p>
                  <p className="mt-1 text-base font-extrabold text-slate-700">{info.rounds} ta</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Vaqt</p>
                  <p className="mt-1 text-base font-extrabold text-slate-700">{info.seconds}s</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Format</p>
                  <p className="mt-1 text-base font-extrabold text-slate-700">2 jamoa</p>
                </div>
              </div>

              <div className="mt-4">
                <Link
                  to="/games"
                  className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5"
                >
                  Barcha o'yinlarga qaytish
                </Link>
              </div>
            </article>
          </section>
        </main>

        <FooterCTA />
      </div>
    </div>
  )
}

export default TopqirlikKvestSetupPage
