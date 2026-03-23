import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AiQuizImportPanel from '../components/AiQuizImportPanel.tsx'
import FooterCTA from '../components/FooterCTA.tsx'
import GameCommentsSection from '../components/GameCommentsSection.tsx'
import Navbar from '../components/Navbar.tsx'
import QuestionManagerLinkCard from '../components/QuestionManagerLinkCard.tsx'
import type { Operator, TeacherTugQuestion } from '../components/TugOfWarArena.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import {
  importAiGeneratedQuestions,
  mapAiDifficultyToUzbek,
  type AiGeneratedPayload,
} from '../lib/aiQuizGenerator.ts'
import { createGameQuestion, deleteGameQuestion, fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'
import tugReferenceImage from '../rasm/tortish.png'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Letter = 'A' | 'B' | 'C' | 'D'
type LocalTeacherTugQuestion = TeacherTugQuestion & { backendId?: string }

type OperationItem = {
  value: Operator
  label: string
  icon: string
}

const operations: OperationItem[] = [
  { value: '+', label: "Qo'shish", icon: '+' },
  { value: '-', label: 'Ayirish', icon: '-' },
  { value: 'x', label: "Ko'paytirish", icon: 'x' },
  { value: '/', label: "Bo'lish", icon: '/' },
]

const questionCountByDifficulty: Record<Difficulty, number> = {
  Oson: 80,
  "O'rta": 110,
  Qiyin: 140,
}

const normalizeText = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ')

const parseDifficultyValue = (value: unknown): Difficulty | null => {
  if (value === 'Oson' || value === "O'rta" || value === 'Qiyin') return value
  return null
}

const parseOperatorValue = (value: unknown): Operator | null => {
  if (value === '+' || value === '-' || value === 'x' || value === '/') return value
  return null
}

const parseOperatorFromPrompt = (prompt: string): Operator | null => {
  if (prompt.includes('+')) return '+'
  if (prompt.includes('-')) return '-'
  if (prompt.includes('x') || prompt.includes('*')) return 'x'
  if (prompt.includes('/')) return '/'
  return null
}

const parseIntegerAnswer = (value: unknown): number | null => {
  if (typeof value !== 'string') return null
  const cleaned = value.trim().replace(',', '.')
  if (!/^\d{1,3}$/.test(cleaned)) return null
  const parsed = Number(cleaned)
  if (!Number.isInteger(parsed) || parsed < 0) return null
  return parsed
}

const parseBackendTeacherQuestions = (questions: BackendQuestion[]): LocalTeacherTugQuestion[] => {
  const dedupe = new Map<string, LocalTeacherTugQuestion>()

  questions.forEach((question) => {
    const prompt = question.prompt.trim()
    if (!prompt) return

    const options = question.options.map((item) => item.trim())
    const correctIndex = question.correct_index ?? -1
    const answerFromOptions = options[correctIndex] ?? ''
    const answer = parseIntegerAnswer(answerFromOptions) ?? parseIntegerAnswer(question.answer_text)
    if (answer === null) return

    const meta = question.metadata_json
    const difficulty = parseDifficultyValue(typeof meta.difficulty === 'string' ? meta.difficulty : question.difficulty)
      ?? "O'rta"
    const operator = parseOperatorValue(meta.topic) ?? parseOperatorFromPrompt(prompt) ?? '+'

    const key = normalizeText(`${prompt}__${answer}__${difficulty}__${operator}`)
    if (dedupe.has(key)) return
    dedupe.set(key, { prompt, answer, difficulty, operator, backendId: question.id })
  })

  return Array.from(dedupe.values()).slice(0, 200)
}

function TugOfWarSetupPage() {
  const navigate = useNavigate()
  const game = findGameById('arqon-tortish')
  const canUseTeacherContent = useTeacherGameAccess()

  const [selectedOps, setSelectedOps] = useState<Operator[]>(['+', '-', 'x', '/'])
  const [difficulty, setDifficulty] = useState<Difficulty>('Oson')
  const [teamOne, setTeamOne] = useState('1-Jamoa')
  const [teamTwo, setTeamTwo] = useState('2-Jamoa')

  const [teacherQuestions, setTeacherQuestions] = useState<LocalTeacherTugQuestion[]>([])
  const [draftDifficulty, setDraftDifficulty] = useState<Difficulty>("O'rta")
  const [draftOperation, setDraftOperation] = useState<Operator>('+')
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftA, setDraftA] = useState('')
  const [draftB, setDraftB] = useState('')
  const [draftC, setDraftC] = useState('')
  const [draftD, setDraftD] = useState('')
  const [draftCorrect, setDraftCorrect] = useState<Letter>('A')
  const [formHint, setFormHint] = useState('')

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!canUseTeacherContent) {
        if (isMounted) setTeacherQuestions([])
        return
      }
      const backendQuestions = parseBackendTeacherQuestions(await fetchGameQuestions('arqon-tortish'))
      if (!isMounted) return
      setTeacherQuestions(backendQuestions)
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [canUseTeacherContent])

  const selectedOperationLabels = useMemo(() => {
    return operations
      .filter((item) => selectedOps.includes(item.value))
      .map((item) => item.label)
      .join(', ')
  }, [selectedOps])

  const totalQuestions = questionCountByDifficulty[difficulty]

  const toggleOperation = (value: Operator) => {
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
    if (!canUseTeacherContent) {
      setFormHint("Custom teacher savollari faqat teacher akkauntida ishlaydi.")
      return
    }
    const prompt = draftPrompt.trim()
    const options = [
      draftA.trim(),
      draftB.trim(),
      draftC.trim(),
      draftD.trim(),
    ] as [string, string, string, string]
    const correctIndex = ['A', 'B', 'C', 'D'].indexOf(draftCorrect)
    const answer = parseIntegerAnswer(options[correctIndex])

    if (!prompt) {
      setFormHint("Savol matnini kiriting.")
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
    if (answer === null) {
      setFormHint("To'g'ri variant javobi son bo'lishi kerak (0 dan 999 gacha).")
      return
    }
    if (teacherQuestions.some(
      (item) => normalizeText(item.prompt) === normalizeText(prompt)
        && item.answer === answer
        && (item.difficulty ?? "O'rta") === draftDifficulty
        && (item.operator ?? '+') === draftOperation,
    )) {
      setFormHint("Bu savol allaqachon qo'shilgan.")
      return
    }

    let createdId: string | undefined
    try {
      const created = await createGameQuestion({
        gameId: 'arqon-tortish',
        questionType: 'multiple_choice',
        prompt,
        options,
        correctIndex,
        difficulty: draftDifficulty,
        metadata: {
          source: 'arqon-tortish',
          difficulty: draftDifficulty,
          topic: draftOperation,
        },
      })
      createdId = created.id
    } catch (error) {
      setFormHint(error instanceof Error ? error.message : "Savol backendga saqlanmadi.")
      return
    }

    setTeacherQuestions((prev) => [
      {
        prompt,
        answer,
        difficulty: draftDifficulty,
        operator: draftOperation,
        backendId: createdId,
      },
      ...prev,
    ].slice(0, 200))
    setDraftPrompt('')
    setDraftA('')
    setDraftB('')
    setDraftC('')
    setDraftD('')
    setDraftCorrect('A')
    setDraftDifficulty("O'rta")
    setDraftOperation('+')
    setFormHint('')
  }

  const handleImportAiQuestions = async (generated: AiGeneratedPayload) => {
    if (!canUseTeacherContent) {
      const message = "AI orqali custom savol qo'shish faqat teacher akkauntida ishlaydi."
      setFormHint(message)
      return message
    }
    const importedDifficulty = mapAiDifficultyToUzbek(generated.daraja)
    const validTests = generated.tests.filter((test) => parseIntegerAnswer(test.options[test.correctIndex]) !== null)
    const invalidCount = generated.tests.length - validTests.length

    const imported = await importAiGeneratedQuestions<LocalTeacherTugQuestion>({
      existingItems: teacherQuestions,
      generated: { ...generated, tests: validTests },
      makeExistingKey: (item) =>
        normalizeText(`${item.prompt}__${item.answer}__${item.difficulty ?? "O'rta"}__${item.operator ?? '+'}`),
      makeGeneratedKey: (test) =>
        normalizeText(`${test.question}__${parseIntegerAnswer(test.options[test.correctIndex]) ?? -1}__${importedDifficulty}__${draftOperation}`),
      createPayload: (test) => ({
        gameId: 'arqon-tortish',
        questionType: 'multiple_choice',
        prompt: test.question,
        options: test.options,
        correctIndex: test.correctIndex,
        difficulty: importedDifficulty,
        metadata: {
          source: 'arqon-tortish',
          difficulty: importedDifficulty,
          topic: draftOperation,
          ai_fan: generated.fan,
          ai_mavzu: generated.mavzu,
        },
      }),
      toLocalItem: (test, _payload, createdId) => ({
        prompt: test.question,
        answer: parseIntegerAnswer(test.options[test.correctIndex]) ?? 0,
        difficulty: importedDifficulty,
        operator: draftOperation,
        backendId: createdId,
      }),
    })

    if (imported.items.length > 0) {
      setTeacherQuestions((prev) => [...imported.items, ...prev].slice(0, 200))

      const preview = validTests.find((test) => test.question === imported.items[0]?.prompt)
      if (preview) {
        const correctLetter = (['A', 'B', 'C', 'D'] as const)[preview.correctIndex] ?? 'A'
        setDraftDifficulty(importedDifficulty)
        setDraftPrompt(preview.question)
        setDraftA(preview.options[0])
        setDraftB(preview.options[1])
        setDraftC(preview.options[2])
        setDraftD(preview.options[3])
        setDraftCorrect(correctLetter)
      }
    }

    const messageParts: string[] = []
    if (imported.items.length > 0) messageParts.push(`${imported.items.length} ta AI savol qo'shildi.`)
    if (imported.skippedCount > 0) messageParts.push(`${imported.skippedCount} tasi takror bo'lgani uchun o'tkazildi.`)
    if (invalidCount > 0) messageParts.push(`${invalidCount} tasi sonli javob bo'lmagani uchun o'tkazildi.`)
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

    if (selectedOps.length === 0) {
      setFormHint('Kamida 1 ta amal tanlang.')
      return
    }

    const customKey = `tug-of-war-teacher-${Date.now()}`
    try {
      sessionStorage.setItem(customKey, JSON.stringify(teacherQuestions))
    } catch {
      setFormHint("Brauzer storage ishlamadi. Qayta urinib ko'ring.")
      return
    }

    const params = new URLSearchParams({
      ops: selectedOps.join(','),
      difficulty,
      team1: cleanTeamOne,
      team2: cleanTeamTwo,
      custom: customKey,
    })

    navigate(`/games/arqon-tortish/arena?${params.toString()}`)
  }

  if (!game) {
    return null
  }

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
                  Avval amallarni va jamoalarni sozlang, keyin arena sahifasida o&apos;yinni bir tugma bilan boshlang.
                  O&apos;qituvchi savollari backendga saqlanadi va keyingi kirishda ham ishlaydi.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className={`rounded-full bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${game.tone}`}>
                    {game.category}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {selectedOps.length} ta amal tanlandi
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {difficulty} daraja
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {teacherQuestions.length} ta teacher savol
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/90 p-4 shadow-soft">
                <img
                  src={tugReferenceImage}
                  alt="Arqon tortish preview"
                  className="h-64 w-full rounded-[1.25rem] object-contain object-center"
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]" data-aos="fade-up" data-aos-delay="60">
            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">O&apos;yin haqida</h2>
              <p className="mt-3 text-lg font-bold leading-relaxed text-slate-600">
                O&apos;qituvchi amallar va darajani tanlaydi, o&apos;yin vaqtida har bir jamoaga savollar tasodifiy chiqadi.
                Har bir to&apos;g&apos;ri javob arqonni sizning tomonga siljitadi.
              </p>

              <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-extrabold text-amber-700">
                Telefon orqali o&apos;ynash uchun ekraningizni gorizontal holatga o&apos;tkazing.
              </div>

              <ol className="mt-5 space-y-2 text-lg font-bold text-slate-600">
                <li>1. Jamoa nomlarini kiriting.</li>
                <li>2. Amallar va darajani tanlang.</li>
                <li>3. O&apos;qituvchi savollari bo&apos;lsa qo&apos;shing.</li>
                <li>4. O&apos;yinni boshlash tugmasini bosing.</li>
              </ol>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Tanlangan savollar</p>
                <p className="mt-2 font-kid text-6xl text-slate-900">{totalQuestions}</p>
                <p className="text-sm font-bold text-slate-500">Tanlangan amal va darajaga ko&apos;ra</p>
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
                O&apos;yinni boshlash
              </button>

              {formHint ? (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-700">
                  {formHint}
                </p>
              ) : null}
            </article>

            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Amal tanlash</h2>
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
                        active
                          ? 'border-cyan-400 bg-cyan-50 shadow-soft'
                          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300'
                      }`}
                    >
                      <span className={`grid h-14 w-14 place-items-center rounded-2xl text-4xl font-extrabold transition ${
                        active
                          ? `bg-gradient-to-r text-white ${game.tone}`
                          : 'bg-slate-100 text-slate-500 group-hover:bg-cyan-100 group-hover:text-cyan-700'
                      }`}>
                        {operation.icon}
                      </span>
                      <span className="text-3xl font-kid text-slate-900">{operation.label}</span>
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
                        difficulty === level
                          ? `bg-gradient-to-r text-white shadow-soft ${game.tone}`
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    <p className="mt-1 text-2xl font-kid text-slate-900">
                      {selectedOperationLabels || 'Tanlanmagan'}
                    </p>
                    <p className="mt-1 text-base font-bold text-slate-500">Daraja: {difficulty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Savollar</p>
                    <p className="mt-1 font-kid text-6xl text-slate-900">{totalQuestions}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Link
                  to="/games"
                  className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5"
                >
                  Barcha o&apos;yinlarga qaytish
                </Link>
              </div>
            </article>
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

export default TugOfWarSetupPage
