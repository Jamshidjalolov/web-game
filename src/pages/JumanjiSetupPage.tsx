import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AiQuizImportPanel from '../components/AiQuizImportPanel.tsx'
import FooterCTA from '../components/FooterCTA.tsx'
import GameCommentsSection from '../components/GameCommentsSection.tsx'
import Navbar from '../components/Navbar.tsx'
import QuestionManagerLinkCard from '../components/QuestionManagerLinkCard.tsx'
import type { TeacherJumanjiQuestion } from '../components/JumanjiArena.tsx'
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
type LocalTeacherJumanjiQuestion = TeacherJumanjiQuestion & { backendId?: string }

const INFO: Record<Difficulty, { seconds: number; note: string }> = {
  Oson: { seconds: 22, note: 'Savollar yengilroq, zar orqali tez yurish mumkin.' },
  "O'rta": { seconds: 18, note: 'Balansli rejim: savol ham, zar taqdiri ham hal qiladi.' },
  Qiyin: { seconds: 14, note: 'Tez fikrlash kerak, xato bo‘lsa raund ketib qoladi.' },
}

const normalize = (v: string) => v.toLowerCase().trim().replace(/[К»вЂ™`]/g, "'").replace(/\s+/g, ' ')

const parseDifficultyValue = (value: unknown): Difficulty | null => {
  if (value === 'Oson' || value === "O'rta" || value === 'Qiyin') return value
  return null
}

const parseBackendTeacherQuestions = (questions: BackendQuestion[]): LocalTeacherJumanjiQuestion[] => {
  const dedupe = new Map<string, LocalTeacherJumanjiQuestion>()

  questions.forEach((question) => {
    const prompt = question.prompt.trim()
    const options = question.options.map((item) => item.trim()).filter(Boolean)
    const correctIndex = question.correct_index ?? -1
    if (!prompt || options.length !== 4 || correctIndex < 0 || correctIndex > 3) return

    const meta = question.metadata_json
    const difficulty = parseDifficultyValue(typeof meta.difficulty === 'string' ? meta.difficulty : question.difficulty)
    if (!difficulty) return

    const key = `${difficulty}__${normalize(prompt)}`
    if (dedupe.has(key)) return
    dedupe.set(key, {
      difficulty,
      prompt,
      options: options as [string, string, string, string],
      correctIndex,
      hint: (typeof meta.hint === 'string' ? meta.hint : question.hint) ?? undefined,
      backendId: question.id,
    })
  })

  return Array.from(dedupe.values()).slice(0, 140)
}

function JumanjiSetupPage() {
  const navigate = useNavigate()
  const game = findGameById('jumanji')
  const canUseTeacherContent = useTeacherGameAccess()

  const [difficulty, setDifficulty] = useState<Difficulty>("O'rta")
  const [teamOne, setTeamOne] = useState('1-Jamoa')
  const [teamTwo, setTeamTwo] = useState('2-Jamoa')
  const [teacherQuestions, setTeacherQuestions] = useState<LocalTeacherJumanjiQuestion[]>([])
  const [hintText, setHintText] = useState('')

  const [draftDifficulty, setDraftDifficulty] = useState<Difficulty>("O'rta")
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftHint, setDraftHint] = useState('')
  const [draftA, setDraftA] = useState('')
  const [draftB, setDraftB] = useState('')
  const [draftC, setDraftC] = useState('')
  const [draftD, setDraftD] = useState('')
  const [draftCorrect, setDraftCorrect] = useState<Letter>('A')

  const info = useMemo(() => INFO[difficulty], [difficulty])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!canUseTeacherContent) {
        if (isMounted) setTeacherQuestions([])
        return
      }
      const backendQuestions = parseBackendTeacherQuestions(await fetchGameQuestions('jumanji'))
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
      setHintText("Custom teacher savollari faqat teacher akkauntida ishlaydi.")
      return
    }
    const prompt = draftPrompt.trim()
    const options = [draftA.trim(), draftB.trim(), draftC.trim(), draftD.trim()] as [string, string, string, string]
    if (!prompt) return setHintText('Savol matnini kiriting.')
    if (prompt.length < 3) return setHintText("Savol matni kamida 3 ta belgidan iborat bo'lsin.")
    if (options.some((v) => !v)) return setHintText("A, B, C, D variantlarni to'liq kiriting.")
    if (new Set(options.map(normalize)).size < 4) return setHintText('Variantlar bir xil bo‘lib qolmasin.')
    if (teacherQuestions.some((q) => normalize(q.prompt) === normalize(prompt))) {
      return setHintText("Bu savol allaqachon qo'shilgan.")
    }
    const correctIndex = ['A', 'B', 'C', 'D'].indexOf(draftCorrect)
    const hint = draftHint.trim()
    if (hint.length > 1000) return setHintText('Hint 1000 ta belgidan oshmasin.')

    let createdId: string | undefined
    try {
      const created = await createGameQuestion({
        gameId: 'jumanji',
        questionType: 'multiple_choice',
        prompt,
        options,
        correctIndex,
        hint: hint || null,
        difficulty: draftDifficulty,
        metadata: {
          difficulty: draftDifficulty,
          hint,
          source: 'jumanji',
        },
      })
      createdId = created.id
    } catch (error) {
      return setHintText(error instanceof Error ? error.message : "Savol backendga saqlanmadi.")
    }

    setTeacherQuestions((prev) => [
      {
        difficulty: draftDifficulty,
        prompt,
        options,
        correctIndex,
        hint: hint || undefined,
        backendId: createdId,
      },
      ...prev,
    ].slice(0, 140))
    setDraftPrompt('')
    setDraftHint('')
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
      const message = "AI orqali custom savol qo'shish faqat teacher akkauntida ishlaydi."
      setHintText(message)
      return message
    }
    const importedDifficulty = mapAiDifficultyToUzbek(generated.daraja)
    const imported = await importAiGeneratedQuestions<LocalTeacherJumanjiQuestion>({
      existingItems: teacherQuestions,
      generated,
      makeExistingKey: (question) => `${question.difficulty}__${normalize(question.prompt)}`,
      makeGeneratedKey: (test) => `${importedDifficulty}__${normalize(test.question)}`,
      createPayload: (test) => ({
        gameId: 'jumanji',
        questionType: 'multiple_choice',
        prompt: test.question,
        options: test.options,
        correctIndex: test.correctIndex,
        hint: null,
        difficulty: importedDifficulty,
        metadata: {
          difficulty: importedDifficulty,
          hint: '',
          source: 'jumanji',
          ai_fan: generated.fan,
          ai_mavzu: generated.mavzu,
        },
      }),
      toLocalItem: (test, _payload, createdId) => ({
        difficulty: importedDifficulty,
        prompt: test.question,
        options: test.options,
        correctIndex: test.correctIndex,
        hint: undefined,
        backendId: createdId,
      }),
    })

    if (imported.items.length > 0) {
      setTeacherQuestions((prev) => [...imported.items, ...prev].slice(0, 140))

      const preview = imported.items[0]
      const correctLetter = (['A', 'B', 'C', 'D'] as const)[preview.correctIndex] ?? 'A'
      setDraftDifficulty(preview.difficulty)
      setDraftPrompt(preview.prompt)
      setDraftHint(preview.hint ?? '')
      setDraftA(preview.options[0])
      setDraftB(preview.options[1])
      setDraftC(preview.options[2])
      setDraftD(preview.options[3])
      setDraftCorrect(correctLetter)
    }

    const messageParts: string[] = []
    if (imported.items.length > 0) messageParts.push(`${imported.items.length} ta AI savol qo'shildi.`)
    if (imported.skippedCount > 0) messageParts.push(`${imported.skippedCount} tasi takror bo'lgani uchun o'tkazildi.`)
    if (imported.failedCount > 0) messageParts.push(`${imported.failedCount} tasi backendga saqlanmadi.`)
    const message = messageParts.join(' ') || "Yangi AI savol qo'shilmadi."
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

    const customKey = `jumanji-teacher-${Date.now()}`
    try {
      sessionStorage.setItem(customKey, JSON.stringify(teacherQuestions))
    } catch {
      return setHintText("Brauzer storage ishlamadi. Qayta urinib ko'ring.")
    }

    const params = new URLSearchParams({
      difficulty,
      team1: t1,
      team2: t2,
      custom: customKey,
    })
    navigate(`/games/jumanji/arena?${params.toString()}`)
  }

  if (!game) return null

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#eefbf5_0%,#f7fbff_45%,#fff3de_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(34,197,94,0.14),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(234,179,8,0.12),transparent_24%),radial-gradient(circle_at_20%_82%,rgba(59,130,246,0.12),transparent_22%)]" />
      <div className="relative z-10">
        <Navbar />
        <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-6">
          <section className="mb-6 rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur-xl sm:p-7" data-aos="fade-up">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">Setup Mode</p>
                <h1 className="mt-3 font-kid text-5xl leading-tight text-slate-900 sm:text-6xl">{game.title}</h1>
                <p className="mt-3 text-lg font-bold text-slate-600">
                  Bir xil savol ikkala jamoaga chiqadi. Kim birinchi to&apos;g&apos;ri topsa zar tashlaydi va 1–6 qadam yuradi. 30-qadam finish.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className={`rounded-full bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${game.tone}`}>{game.category}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">{difficulty} daraja</span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">30 qadam</span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">{teacherQuestions.length} ta custom savol</span>
                </div>
              </div>
              <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/90 p-4 shadow-soft">
                <img src={game.image} alt={game.title} className="h-72 w-full rounded-[1.25rem] object-cover object-center sm:h-80" />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1.15fr]" data-aos="fade-up" data-aos-delay="60">
            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Jumanji sozlamalari</h2>
              <p className="mt-3 text-lg font-bold leading-relaxed text-slate-600">{info.note}</p>

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

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-extrabold text-slate-800">Jamoa nomlari</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input value={teamOne} onChange={(e) => setTeamOne(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-emerald-400" placeholder="1-Jamoa" />
                  <input value={teamTwo} onChange={(e) => setTeamTwo(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-emerald-400" placeholder="2-Jamoa" />
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Timer</p><p className="mt-2 text-xl font-black text-slate-900">{info.seconds}s</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Zar</p><p className="mt-2 text-xl font-black text-slate-900">1–6</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Finish</p><p className="mt-2 text-xl font-black text-slate-900">30</p></div>
                </div>
              </div>

              <button type="button" onClick={openArena} className={`mt-5 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r px-6 py-4 text-xl font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${game.tone}`}>
                Jumanji o'yinini boshlash
              </button>
              {hintText ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-700">{hintText}</p> : null}
            </article>

            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">O‘qituvchi savoli qo‘shish</h2>
              <QuestionManagerLinkCard
                className="mt-5"
                gameTitle={game.title}
                itemCount={teacherQuestions.length}
                canManage={canUseTeacherContent}
              />

              <div className="mt-4">
                <Link to="/games" className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5">
                  Barcha o‘yinlarga qaytish
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

export default JumanjiSetupPage
