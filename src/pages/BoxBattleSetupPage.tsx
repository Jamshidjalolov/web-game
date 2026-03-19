import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AiQuizImportPanel from '../components/AiQuizImportPanel.tsx'
import FooterCTA from '../components/FooterCTA.tsx'
import Navbar from '../components/Navbar.tsx'
import QuestionManagerLinkCard from '../components/QuestionManagerLinkCard.tsx'
import TeacherFeatureNotice from '../components/TeacherFeatureNotice.tsx'
import type { BoxMathOperator, TeacherBoxQuestion } from '../components/BoxBattleArena.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import {
  importAiGeneratedQuestions,
  mapAiDifficultyToUzbek,
  type AiGeneratedPayload,
} from '../lib/aiQuizGenerator.ts'
import { createGameQuestion, deleteGameQuestion, fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Letter = 'A' | 'B' | 'C' | 'D'
type LocalTeacherBoxQuestion = TeacherBoxQuestion & { backendId?: string }

type OperationItem = {
  value: BoxMathOperator
  label: string
  icon: string
}

const operations: OperationItem[] = [
  { value: '+', label: "Qo'shish", icon: '+' },
  { value: '-', label: 'Ayirish', icon: '-' },
  { value: 'x', label: "Ko'paytirish", icon: 'x' },
  { value: '/', label: "Bo'lish", icon: '/' },
]

const difficultyInfo = {
  Oson: { rounds: 8, time: 16, note: 'Yumshoq temp va qulay start' },
  "O'rta": { rounds: 10, time: 13, note: 'Balansli poyga' },
  Qiyin: { rounds: 12, time: 10, note: 'Tezlik va aniqlik sinovi' },
} as const

const normalizeText = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ')

const parseDifficultyValue = (value: unknown): Difficulty | null => {
  if (value === 'Oson' || value === "O'rta" || value === 'Qiyin') return value
  return null
}

const parseBackendTeacherQuestions = (questions: BackendQuestion[]): LocalTeacherBoxQuestion[] => {
  const dedupe = new Map<string, LocalTeacherBoxQuestion>()

  questions.forEach((question) => {
    const prompt = question.prompt.trim()
    if (!prompt) return

    const answerFromOptions = Number.isInteger(question.correct_index ?? null)
      ? question.options[question.correct_index ?? -1] ?? ''
      : ''
    const answer = (answerFromOptions || question.answer_text || '').trim()
    if (!answer) return

    const key = normalizeText(`${prompt}__${answer}`)
    if (dedupe.has(key)) return
    dedupe.set(key, { prompt, answer, backendId: question.id })
  })

  return Array.from(dedupe.values()).slice(0, 120)
}

function BoxBattleSetupPage() {
  const navigate = useNavigate()
  const game = findGameById('box-jang')
  const canUseTeacherContent = useTeacherGameAccess()

  const [selectedOps, setSelectedOps] = useState<BoxMathOperator[]>(['+', '-', 'x', '/'])
  const [difficulty, setDifficulty] = useState<Difficulty>("O'rta")
  const [teamOne, setTeamOne] = useState('1-Jamoa')
  const [teamTwo, setTeamTwo] = useState('2-Jamoa')
  const [teacherQuestions, setTeacherQuestions] = useState<LocalTeacherBoxQuestion[]>([])
  const [draftDifficulty, setDraftDifficulty] = useState<Difficulty>("O'rta")
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftA, setDraftA] = useState('')
  const [draftB, setDraftB] = useState('')
  const [draftC, setDraftC] = useState('')
  const [draftD, setDraftD] = useState('')
  const [draftCorrect, setDraftCorrect] = useState<Letter>('A')
  const [formHint, setFormHint] = useState('')

  const info = difficultyInfo[difficulty]
  const selectedLabels = useMemo(
    () => operations.filter((op) => selectedOps.includes(op.value)).map((op) => op.label).join(', '),
    [selectedOps],
  )

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!canUseTeacherContent) {
        if (isMounted) setTeacherQuestions([])
        return
      }
      const backendQuestions = parseBackendTeacherQuestions(await fetchGameQuestions('box-jang'))
      if (!isMounted) return
      setTeacherQuestions(backendQuestions)
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [canUseTeacherContent])

  const toggleOperation = (value: BoxMathOperator) => {
    setFormHint('')
    setSelectedOps((prev) => {
      if (prev.includes(value)) {
        if (prev.length === 1) return prev
        return prev.filter((item) => item !== value)
      }
      return [...prev, value]
    })
  }

  const addTeacherQuestion = async () => {
    const prompt = draftPrompt.trim()
    const options = [draftA.trim(), draftB.trim(), draftC.trim(), draftD.trim()] as [string, string, string, string]
    if (!prompt) {
      setFormHint("O'qituvchi savoli uchun matnni kiriting.")
      return
    }
    if (prompt.length < 3) {
      setFormHint("Savol matni kamida 3 ta belgidan iborat bo'lsin.")
      return
    }
    if (options.some((item) => !item)) {
      setFormHint("A, B, C, D variantlarni to'liq kiriting.")
      return
    }
    if (new Set(options.map(normalizeText)).size < 4) {
      setFormHint('Variantlar bir-biridan farq qilishi kerak.')
      return
    }

    const correctIndex = ['A', 'B', 'C', 'D'].indexOf(draftCorrect)
    const parsedDifficulty = parseDifficultyValue(draftDifficulty)
    if (parsedDifficulty === null) {
      setFormHint("Savol uchun darajani to'g'ri tanlang.")
      return
    }

    let createdId: string | undefined
    try {
      const created = await createGameQuestion({
        gameId: 'box-jang',
        questionType: 'multiple_choice',
        prompt,
        options,
        correctIndex,
        difficulty: parsedDifficulty,
        metadata: {
          source: 'box-jang',
          difficulty: parsedDifficulty,
        },
      })
      createdId = created.id
    } catch (error) {
      setFormHint(error instanceof Error ? error.message : "Savol backendga saqlanmadi.")
      return
    }

    const answer = options[correctIndex] ?? ''
    setTeacherQuestions((prev) => [{ prompt, answer, backendId: createdId }, ...prev].slice(0, 120))
    setDraftPrompt('')
    setDraftA('')
    setDraftB('')
    setDraftC('')
    setDraftD('')
    setDraftCorrect('A')
    setDraftDifficulty("O'rta")
    setFormHint('')
  }

  const handleImportAiQuestions = async (generated: AiGeneratedPayload) => {
    const importedDifficulty = mapAiDifficultyToUzbek(generated.daraja)
    const imported = await importAiGeneratedQuestions<LocalTeacherBoxQuestion>({
      existingItems: teacherQuestions,
      generated,
      makeExistingKey: (question) => normalizeText(`${question.prompt}__${question.answer}`),
      makeGeneratedKey: (test) => normalizeText(`${test.question}__${test.options[test.correctIndex] ?? ''}`),
      createPayload: (test) => ({
        gameId: 'box-jang',
        questionType: 'multiple_choice',
        prompt: test.question,
        options: test.options,
        correctIndex: test.correctIndex,
        difficulty: importedDifficulty,
        metadata: {
          source: 'box-jang',
          difficulty: importedDifficulty,
          ai_fan: generated.fan,
          ai_mavzu: generated.mavzu,
        },
      }),
      toLocalItem: (test, _payload, createdId) => ({
        prompt: test.question,
        answer: test.options[test.correctIndex] ?? '',
        backendId: createdId,
      }),
    })

    if (imported.items.length > 0) {
      setTeacherQuestions((prev) => [...imported.items, ...prev].slice(0, 120))

      const previewAnswer = imported.items[0].answer
      const correctIndex = generated.tests.find((test) => test.question === imported.items[0].prompt)?.correctIndex ?? 0
      const preview = generated.tests.find((test) => test.question === imported.items[0].prompt)
      const correctLetter = (['A', 'B', 'C', 'D'] as const)[correctIndex] ?? 'A'
      if (preview) {
        setDraftPrompt(preview.question)
        setDraftA(preview.options[0])
        setDraftB(preview.options[1])
        setDraftC(preview.options[2])
        setDraftD(preview.options[3])
      }
      setDraftCorrect(correctLetter)
      setDraftDifficulty(importedDifficulty)
      if (!preview && previewAnswer) {
        setDraftA(previewAnswer)
      }
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
    const team1 = teamOne.trim()
    const team2 = teamTwo.trim()
    if (!team1 || !team2) {
      setFormHint('Ikkala jamoa nomini ham kiriting.')
      return
    }

    const customKey = `box-battle-teacher-${Date.now()}`
    try {
      sessionStorage.setItem(customKey, JSON.stringify(teacherQuestions))
    } catch {
      setFormHint("Brauzer storage ishlamadi. Qayta urinib ko'ring.")
      return
    }

    const params = new URLSearchParams({
      difficulty,
      ops: selectedOps.join(','),
      team1,
      team2,
      custom: customKey,
    })

    navigate(`/games/box-jang/arena?${params.toString()}`)
  }

  if (!game) return null

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />

      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-[1360px] px-4 pb-16 pt-10 sm:px-6">
          <section className="mb-6 rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-soft backdrop-blur-xl sm:p-7" data-aos="fade-up">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-cyan-700">
                  Setup Mode
                </p>
                <h1 className="mt-3 font-kid text-5xl leading-tight text-slate-900 sm:text-6xl">{game.title}</h1>
                <p className="mt-3 text-lg font-bold text-slate-600">
                  Matematik boks bellashuvi: savol chiqadi, kim tez va to'g'ri topsa o'sha zarba beradi.
                  Teacher savollari endi `Test tizimi` orqali boshqariladi.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className={`rounded-full bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${game.tone}`}>{game.category}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">{difficulty} daraja</span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {canUseTeacherContent ? `${teacherQuestions.length} ta custom savol` : 'Teacher rejimi yopiq'}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/90 p-4 shadow-soft">
                <div className="relative grid h-64 place-items-center overflow-hidden rounded-[1.25rem] border border-slate-200 bg-[linear-gradient(155deg,#f4fbff_0%,#eef6ff_45%,#fff3dd_100%)]">
                  <div className="absolute left-8 top-8 h-20 w-20 rounded-full bg-cyan-300/35 blur-2xl" />
                  <div className="absolute right-8 bottom-8 h-20 w-20 rounded-full bg-fuchsia-300/30 blur-2xl" />
                  <img src={game.image} alt={game.title} className="relative z-10 h-full w-full rounded-[1.25rem] object-contain object-center p-2" />
                  <p className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-600">
                    Tez javob + zarba animatsiya
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]" data-aos="fade-up" data-aos-delay="60">
            <article className="min-w-0 rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Sozlamalar</h2>
              <p className="mt-3 text-lg font-bold leading-relaxed text-slate-600">
                Amallarni tanlang, darajani belgilang, jamoa nomlarini kiriting. Teacher testlari bo'lsa ular `Test tizimi`dan olinadi.
              </p>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-extrabold text-slate-800">Jamoa nomlari</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input value={teamOne} onChange={(e) => setTeamOne(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400" placeholder="1-Jamoa" />
                  <input value={teamTwo} onChange={(e) => setTeamTwo(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400" placeholder="2-Jamoa" />
                </div>
              </div>

              <QuestionManagerLinkCard
                className="mt-5"
                gameTitle={game.title}
                itemCount={teacherQuestions.length}
                canManage={canUseTeacherContent}
              />

              <button type="button" onClick={handleOpenArena} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-4 text-xl font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${game.tone}`}>
                O'yinni boshlash
              </button>
              {formHint ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-700">{formHint}</p> : null}
            </article>

            <article className="min-w-0 rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Amal va daraja</h2>
                <p className="text-sm font-extrabold text-slate-400">{selectedOps.length} ta amal</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {operations.map((operation) => {
                  const active = selectedOps.includes(operation.value)
                  return (
                    <button
                      key={operation.value}
                      type="button"
                      onClick={() => toggleOperation(operation.value)}
                      className={`group flex items-center gap-4 rounded-3xl border px-5 py-5 text-left transition ${
                        active ? 'border-cyan-400 bg-cyan-50 shadow-soft' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300'
                      }`}
                    >
                      <span className={`grid h-14 w-14 place-items-center rounded-2xl text-4xl font-extrabold transition ${
                        active ? `bg-gradient-to-r text-white ${game.tone}` : 'bg-slate-100 text-slate-500 group-hover:bg-cyan-100 group-hover:text-cyan-700'
                      }`}>
                        {operation.icon}
                      </span>
                      <span className="min-w-0 text-2xl font-kid leading-none text-slate-900 sm:text-3xl">{operation.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-6">
                <p className="text-2xl font-kid text-slate-900">Daraja tanlash</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(['Oson', "O'rta", 'Qiyin'] as Difficulty[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`rounded-full px-5 py-3 text-lg font-extrabold transition ${
                        difficulty === level ? `bg-gradient-to-r text-white shadow-soft ${game.tone}` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Tanlov</p>
                    <p className="mt-1 text-2xl font-kid leading-tight text-slate-900">{selectedLabels}</p>
                    <p className="mt-1 text-base font-bold text-slate-500">Daraja: {difficulty}</p>
                    <p className="text-sm font-bold text-cyan-700">{info.note}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Raund</p>
                    <p className="mt-1 font-kid text-5xl text-slate-900">{info.rounds}</p>
                    <p className="text-sm font-bold text-slate-500">{info.time}s / savol</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Link to="/games" className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5">
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

export default BoxBattleSetupPage
