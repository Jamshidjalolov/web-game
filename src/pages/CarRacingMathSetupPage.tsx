import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AiQuizImportPanel from '../components/AiQuizImportPanel.tsx'
import FooterCTA from '../components/FooterCTA.tsx'
import Navbar from '../components/Navbar.tsx'
import QuestionManagerLinkCard from '../components/QuestionManagerLinkCard.tsx'
import type { TeacherCarMathQuestion } from '../components/CarRacingMathArena.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import {
  importAiGeneratedQuestions,
  mapAiDifficultyToUzbek,
  type AiGeneratedPayload,
} from '../lib/aiQuizGenerator.ts'
import { createGameQuestion, deleteGameQuestion, fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Topic = '+' | '-' | '*' | '/'
type Letter = 'A' | 'B' | 'C' | 'D'
type LocalTeacherCarMathQuestion = TeacherCarMathQuestion & { backendId?: string }

const INFO: Record<Difficulty, { rounds: number; seconds: number; points: number }> = {
  Oson: { rounds: 10, seconds: 25, points: 12 },
  "O'rta": { rounds: 10, seconds: 20, points: 16 },
  Qiyin: { rounds: 10, seconds: 16, points: 20 },
}

const normalizeText = (v: string) =>
  v.toLowerCase().trim().replace(/[К»вЂ™`]/g, "'").replace(/\s+/g, ' ')

const parseDifficultyValue = (value: unknown): Difficulty | null => {
  if (value === 'Oson' || value === "O'rta" || value === 'Qiyin') return value
  return null
}

const parseTopicValue = (value: unknown): Topic | null => {
  if (value === '+' || value === '-' || value === '*' || value === '/') return value
  return null
}

const parseBackendTeacherQuestions = (questions: BackendQuestion[]): LocalTeacherCarMathQuestion[] => {
  const dedupe = new Map<string, LocalTeacherCarMathQuestion>()

  questions.forEach((question) => {
    const prompt = question.prompt.trim()
    const options = question.options.map((item) => item.trim()).filter(Boolean)
    const correctIndex = question.correct_index ?? -1
    if (!prompt || options.length !== 4 || correctIndex < 0 || correctIndex > 3) return

    const meta = question.metadata_json
    const difficulty = parseDifficultyValue(typeof meta.difficulty === 'string' ? meta.difficulty : question.difficulty)
    const topic = parseTopicValue(meta.topic) ?? '+'
    if (!difficulty) return

    const key = `${difficulty}__${topic}__${normalizeText(prompt)}`
    if (dedupe.has(key)) return
    dedupe.set(key, {
      difficulty,
      topic,
      prompt,
      options: options as [string, string, string, string],
      correctIndex,
      backendId: question.id,
    })
  })

  return Array.from(dedupe.values()).slice(0, 120)
}

function CarRacingMathSetupPage() {
  const navigate = useNavigate()
  const game = findGameById('car-racing-math')
  const canUseTeacherContent = useTeacherGameAccess()
  const [difficulty, setDifficulty] = useState<Difficulty>("O'rta")
  const [topics, setTopics] = useState<Topic[]>(['+', '-', '*', '/'])
  const [teamOne, setTeamOne] = useState('1-Jamoa')
  const [teamTwo, setTeamTwo] = useState('2-Jamoa')
  const [teacherQuestions, setTeacherQuestions] = useState<LocalTeacherCarMathQuestion[]>([])

  const [draftDifficulty, setDraftDifficulty] = useState<Difficulty>("O'rta")
  const [draftTopic, setDraftTopic] = useState<Topic>('+')
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftA, setDraftA] = useState('')
  const [draftB, setDraftB] = useState('')
  const [draftC, setDraftC] = useState('')
  const [draftD, setDraftD] = useState('')
  const [draftCorrect, setDraftCorrect] = useState<Letter>('A')
  const [hintText, setHintText] = useState('')

  const info = useMemo(() => INFO[difficulty], [difficulty])
  const topicLabel = topics.length === 4 ? 'Hamma amallar' : topics.join(' • ')

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!canUseTeacherContent) {
        if (isMounted) setTeacherQuestions([])
        return
      }
      const backendQuestions = parseBackendTeacherQuestions(await fetchGameQuestions('car-racing-math'))
      if (!isMounted) return
      setTeacherQuestions(backendQuestions)
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [canUseTeacherContent])

  const toggleTopic = (topic: Topic) => {
    setTopics((prev) => {
      if (prev.includes(topic)) return prev.length === 1 ? prev : prev.filter((t) => t !== topic)
      return [...prev, topic]
    })
  }

  const addTeacherQuestion = async () => {
    if (!canUseTeacherContent) {
      setHintText("Custom teacher misollari faqat teacher akkauntida ishlaydi.")
      return
    }
    const prompt = draftPrompt.trim()
    const options = [draftA.trim(), draftB.trim(), draftC.trim(), draftD.trim()] as [string, string, string, string]
    if (!prompt) return setHintText('Misol matnini kiriting.')
    if (prompt.length < 3) return setHintText("Misol matni kamida 3 ta belgidan iborat bo'lsin.")
    if (options.some((o) => !o)) return setHintText("A, B, C, D variantlarni to'liq kiriting.")
    if (new Set(options.map(normalizeText)).size < 4) return setHintText('Variantlar bir xil bo‘lib qolmasin.')
    if (teacherQuestions.some((q) => normalizeText(q.prompt) === normalizeText(prompt))) {
      return setHintText("Bu misol allaqachon qo'shilgan.")
    }
    const correctIndex = ['A', 'B', 'C', 'D'].indexOf(draftCorrect)

    let createdId: string | undefined
    try {
      const created = await createGameQuestion({
        gameId: 'car-racing-math',
        questionType: 'multiple_choice',
        prompt,
        options,
        correctIndex,
        difficulty: draftDifficulty,
        metadata: {
          difficulty: draftDifficulty,
          topic: draftTopic,
          source: 'car-racing-math',
        },
      })
      createdId = created.id
    } catch (error) {
      return setHintText(error instanceof Error ? error.message : "Savol backendga saqlanmadi.")
    }

    setTeacherQuestions((prev) => [
      {
        difficulty: draftDifficulty,
        topic: draftTopic,
        prompt,
        options,
        correctIndex,
        backendId: createdId,
      },
      ...prev,
    ].slice(0, 120))
    setDraftPrompt('')
    setDraftA('')
    setDraftB('')
    setDraftC('')
    setDraftD('')
    setDraftCorrect('A')
    setDraftDifficulty("O'rta")
    setHintText('')
  }

  const handleImportAiQuestions = async (generated: AiGeneratedPayload) => {
    if (!canUseTeacherContent) {
      const message = "AI orqali custom misol qo'shish faqat teacher akkauntida ishlaydi."
      setHintText(message)
      return message
    }
    const importedDifficulty = mapAiDifficultyToUzbek(generated.daraja)
    const imported = await importAiGeneratedQuestions<LocalTeacherCarMathQuestion>({
      existingItems: teacherQuestions,
      generated,
      makeExistingKey: (question) => `${question.difficulty}__${question.topic ?? '+'}__${normalizeText(question.prompt)}`,
      makeGeneratedKey: (test) => `${importedDifficulty}__${draftTopic}__${normalizeText(test.question)}`,
      createPayload: (test) => ({
        gameId: 'car-racing-math',
        questionType: 'multiple_choice',
        prompt: test.question,
        options: test.options,
        correctIndex: test.correctIndex,
        difficulty: importedDifficulty,
        metadata: {
          difficulty: importedDifficulty,
          topic: draftTopic,
          source: 'car-racing-math',
          ai_fan: generated.fan,
          ai_mavzu: generated.mavzu,
        },
      }),
      toLocalItem: (test, _payload, createdId) => ({
        difficulty: importedDifficulty,
        topic: draftTopic,
        prompt: test.question,
        options: test.options,
        correctIndex: test.correctIndex,
        backendId: createdId,
      }),
    })

    if (imported.items.length > 0) {
      setTeacherQuestions((prev) => [...imported.items, ...prev].slice(0, 120))

      const preview = imported.items[0]
      const correctLetter = (['A', 'B', 'C', 'D'] as const)[preview.correctIndex] ?? 'A'
      setDraftDifficulty(preview.difficulty)
      setDraftPrompt(preview.prompt)
      setDraftA(preview.options[0])
      setDraftB(preview.options[1])
      setDraftC(preview.options[2])
      setDraftD(preview.options[3])
      setDraftCorrect(correctLetter)
    }

    const messageParts: string[] = []
    if (imported.items.length > 0) messageParts.push(`${imported.items.length} ta AI misol qo'shildi.`)
    if (imported.skippedCount > 0) messageParts.push(`${imported.skippedCount} tasi takror bo'lgani uchun o'tkazildi.`)
    if (imported.failedCount > 0) messageParts.push(`${imported.failedCount} tasi backendga saqlanmadi.`)
    const message = messageParts.join(' ') || "Yangi AI misol qo'shilmadi."
    setHintText(message)
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
        setHintText(error instanceof Error ? error.message : "Savolni backenddan o'chirib bo'lmadi.")
        return
      }
    }
    setTeacherQuestions((prev) => prev.filter((_, i) => i !== index))
    setHintText("Savol o'chirildi.")
  }

  const openArena = () => {
    const t1 = teamOne.trim()
    const t2 = teamTwo.trim()
    if (!t1 || !t2) return setHintText('Ikkala jamoa nomini kiriting.')
    if (topics.length === 0) return setHintText('Kamida bitta amal tanlang.')

    const customKey = `car-racing-math-teacher-${Date.now()}`
    try {
      sessionStorage.setItem(customKey, JSON.stringify(teacherQuestions))
    } catch {
      return setHintText("Brauzer storage ishlamadi. Qayta urinib ko'ring.")
    }

    const params = new URLSearchParams({
      difficulty,
      team1: t1,
      team2: t2,
      topics: topics.join(','),
      custom: customKey,
    })
    navigate(`/games/car-racing-math/arena?${params.toString()}`)
  }

  if (!game) return null

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(99,102,241,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.18),transparent_22%)]" />
      <div className="relative z-10">
        <Navbar />
        <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-6">
          <section className="mb-6 rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-soft backdrop-blur-xl sm:p-7" data-aos="fade-up">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-sky-700">Setup Mode</p>
                <h1 className="mt-3 font-kid text-5xl leading-tight text-slate-900 sm:text-6xl">{game.title}</h1>
                <p className="mt-3 text-lg font-bold text-slate-600">
                  Bir xil misol ikkala jamoaga chiqadi. Kim birinchi to&apos;g&apos;ri topsa mashinasi yuradi. Teacher misollari endi `Test tizimi`dan boshqariladi.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className={`rounded-full bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${game.tone}`}>{game.category}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">{difficulty} daraja</span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">{teacherQuestions.length} ta custom misol</span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">{topicLabel}</span>
                </div>
              </div>
              <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/90 p-4 shadow-soft">
                <img src={game.image} alt={game.title} className="h-64 w-full rounded-[1.25rem] object-contain object-center" />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]" data-aos="fade-up" data-aos-delay="60">
            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Poyga sozlamalari</h2>
              <p className="mt-3 text-lg font-bold leading-relaxed text-slate-600">
                Har raundda bitta misol. Xato qilgan jamoa kutadi, ikkinchi jamoa topishi mumkin. Ikkalasi ham topolmasa keyingi misolga o&apos;tiladi.
              </p>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Joriy rejim</p>
                <p className="mt-2 font-kid text-5xl text-slate-900">{difficulty}</p>
                <p className="text-sm font-bold text-slate-500">Raund: {info.rounds} ta • Timer: {info.seconds}s • Ball: +{info.points}</p>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-extrabold text-slate-800">Jamoa nomlari</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input value={teamOne} onChange={(e) => setTeamOne(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-sky-400" placeholder="1-Jamoa" />
                  <input value={teamTwo} onChange={(e) => setTeamTwo(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-sky-400" placeholder="2-Jamoa" />
                </div>
              </div>

              <button type="button" onClick={openArena} className={`mt-5 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r px-6 py-4 text-xl font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${game.tone}`}>
                Poygani boshlash
              </button>
              {hintText ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-700">{hintText}</p> : null}
            </article>

            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Daraja va test tizimi</h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
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

              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Amal tanlash</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {([['+', "Qo'shish"], ['-', 'Ayirish'], ['*', "Ko'paytirish"], ['/', "Bo'lish"]] as [Topic, string][]).map(([topic, label]) => {
                    const active = topics.includes(topic)
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`rounded-2xl border px-3 py-3 text-sm font-extrabold transition ${
                          active ? `bg-gradient-to-r text-white shadow-soft ${game.tone}` : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block text-base">{topic}</span>
                        <span className="mt-0.5 block text-[11px]">{label}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs font-bold text-slate-500">Tanlangan: {topicLabel}</p>
              </div>

              <QuestionManagerLinkCard
                className="mt-5"
                gameTitle={game.title}
                itemCount={teacherQuestions.length}
                canManage={canUseTeacherContent}
              />

              <div className="mt-4">
                <Link to="/games" className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5">
                  Barcha o&apos;yinlarga qaytish
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

export default CarRacingMathSetupPage
