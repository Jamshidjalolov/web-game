import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AiQuizImportPanel from '../components/AiQuizImportPanel.tsx'
import FooterCTA from '../components/FooterCTA.tsx'
import GameCommentsSection from '../components/GameCommentsSection.tsx'
import Navbar from '../components/Navbar.tsx'
import QuestionManagerLinkCard from '../components/QuestionManagerLinkCard.tsx'
import TeacherFeatureNotice from '../components/TeacherFeatureNotice.tsx'
import type { TeacherJumlaWord } from '../components/JumlaUstasiArena.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import { mapAiDifficultyToUzbek, type AiGeneratedPayload } from '../lib/aiQuizGenerator.ts'
import { createGameQuestion, deleteGameQuestion, fetchGameQuestions, type BackendQuestion } from '../lib/backend.ts'
import { DEFAULT_TEAM_NAMES, TeamCount } from '../lib/teamMode.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Letter = 'A' | 'B' | 'C' | 'D'
type LocalTeacherJumlaWord = TeacherJumlaWord & { backendId?: string }

type DifficultyInfo = {
  rounds: number
  seconds: number
  wordRange: string
  desc: string
}

const DIFFICULTY_INFO: Record<Difficulty, DifficultyInfo> = {
  Oson: { rounds: 10, seconds: 60, wordRange: '3-5 harf', desc: "Qisqa so'zlar, oson start" },
  "O'rta": { rounds: 10, seconds: 60, wordRange: '5-8 harf', desc: "Balansli so'zlar va temp" },
  Qiyin: { rounds: 10, seconds: 60, wordRange: '8+ harf', desc: "Uzunroq va murakkab so'zlar" },
}

const normalize = (value: string) => value.toLowerCase().trim().replace(/[К»вЂ™`]/g, "'").replace(/\s+/g, ' ')

const parseBackendTeacherWords = (questions: BackendQuestion[]): LocalTeacherJumlaWord[] => {
  const dedupe = new Map<string, LocalTeacherJumlaWord>()

  questions.forEach((question) => {
    const meta = question.metadata_json
    const answerFromOptions = question.options[question.correct_index ?? -1] ?? ''
    const wordRaw = typeof meta.word === 'string' ? meta.word : (answerFromOptions || question.answer_text || question.prompt)
    const hintRaw = typeof meta.hint === 'string' ? meta.hint : (question.hint ?? question.prompt)

    const word = wordRaw.trim()
    const hint = hintRaw.trim()
    if (word.length < 3) return

    const key = normalize(word)
    if (dedupe.has(key)) return
    dedupe.set(key, { word, hint, backendId: question.id })
  })

  return Array.from(dedupe.values()).slice(0, 120)
}

function JumlaUstasiSetupPage() {
  const navigate = useNavigate()
  const game = findGameById('jumla-ustasi')
  const canUseTeacherContent = useTeacherGameAccess()

  const [difficulty, setDifficulty] = useState<Difficulty>("O'rta")
  const [teamCount, setTeamCount] = useState<TeamCount>(2)
  const [teamNames, setTeamNames] = useState<string[]>([...DEFAULT_TEAM_NAMES])
  const [teacherWords, setTeacherWords] = useState<LocalTeacherJumlaWord[]>([])

  const [draftDifficulty, setDraftDifficulty] = useState<Difficulty>("O'rta")
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftA, setDraftA] = useState('')
  const [draftB, setDraftB] = useState('')
  const [draftC, setDraftC] = useState('')
  const [draftD, setDraftD] = useState('')
  const [draftCorrect, setDraftCorrect] = useState<Letter>('A')
  const [formHint, setFormHint] = useState('')

  const info = useMemo(() => DIFFICULTY_INFO[difficulty], [difficulty])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!canUseTeacherContent) {
        if (isMounted) setTeacherWords([])
        return
      }
      const backendWords = parseBackendTeacherWords(await fetchGameQuestions('jumla-ustasi'))
      if (!isMounted) return
      setTeacherWords(backendWords)
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [canUseTeacherContent])

  const addTeacherQuestion = async () => {
    const prompt = draftPrompt.trim().replace(/[К»вЂ™`]/g, "'").replace(/\s+/g, ' ')
    const options = [draftA.trim(), draftB.trim(), draftC.trim(), draftD.trim()].map((item) =>
      item.replace(/[К»вЂ™`]/g, "'").replace(/\s+/g, ' '),
    ) as [string, string, string, string]
    const correctIndex = ['A', 'B', 'C', 'D'].indexOf(draftCorrect)

    if (!prompt) {
      setFormHint('Savol matnini kiriting.')
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
    if (new Set(options.map(normalize)).size < 4) {
      setFormHint('Variantlar bir-biridan farq qilishi kerak.')
      return
    }

    const word = options[correctIndex] ?? ''
    if (word.length < 3) {
      setFormHint("To'g'ri javob bo'ladigan so'z kamida 3 harf bo'lsin.")
      return
    }
    if (teacherWords.some((item) => normalize(item.word) === normalize(word))) {
      setFormHint("Bu so'z allaqachon qo'shilgan.")
      return
    }

    let createdId: string | undefined
    try {
      const created = await createGameQuestion({
        gameId: 'jumla-ustasi',
        questionType: 'multiple_choice',
        prompt,
        options,
        correctIndex,
        difficulty: draftDifficulty,
        metadata: {
          word,
          hint: prompt,
          difficulty: draftDifficulty,
          source: 'jumla-ustasi',
        },
      })
      createdId = created.id
    } catch (error) {
      setFormHint(error instanceof Error ? error.message : "Savol backendga saqlanmadi.")
      return
    }

    setTeacherWords((prev) => [{ word, hint: prompt, backendId: createdId }, ...prev].slice(0, 120))
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
    const nextItems: LocalTeacherJumlaWord[] = []
    const existingKeys = new Set(teacherWords.map((item) => normalize(item.word)))
    const batchKeys = new Set<string>()
    let skippedCount = 0
    let failedCount = 0

    for (const test of generated.tests) {
      const word = test.options[test.correctIndex] ?? ''
      if (word.trim().length < 3) {
        skippedCount += 1
        continue
      }

      const key = normalize(word)
      if (existingKeys.has(key) || batchKeys.has(key)) {
        skippedCount += 1
        continue
      }

      batchKeys.add(key)

      try {
        const created = await createGameQuestion({
          gameId: 'jumla-ustasi',
          questionType: 'multiple_choice',
          prompt: test.question,
          options: test.options,
          correctIndex: test.correctIndex,
          difficulty: importedDifficulty,
          metadata: {
            word,
            hint: test.question,
            difficulty: importedDifficulty,
            source: 'jumla-ustasi',
            ai_fan: generated.fan,
            ai_mavzu: generated.mavzu,
          },
        })

        nextItems.push({
          word,
          hint: test.question,
          backendId: created.id,
        })
      } catch {
        failedCount += 1
      }
    }

    if (nextItems.length > 0) {
      setTeacherWords((prev) => [...nextItems, ...prev].slice(0, 120))

      const preview = generated.tests[0]
      const correctLetter = (['A', 'B', 'C', 'D'] as const)[preview.correctIndex] ?? 'A'
      setDraftDifficulty(importedDifficulty)
      setDraftPrompt(preview.question)
      setDraftA(preview.options[0])
      setDraftB(preview.options[1])
      setDraftC(preview.options[2])
      setDraftD(preview.options[3])
      setDraftCorrect(correctLetter)
    }

    const messageParts: string[] = []
    if (nextItems.length > 0) messageParts.push(`${nextItems.length} ta AI savol qo'shildi.`)
    if (skippedCount > 0) messageParts.push(`${skippedCount} tasi word-formatga mos kelmagani yoki takror bo'lgani uchun o'tkazildi.`)
    if (failedCount > 0) messageParts.push(`${failedCount} tasi backendga saqlanmadi.`)
    const message = messageParts.join(' ') || "Yangi AI savol qo'shilmadi."
    setFormHint(message)
    return message
  }

  const removeTeacherWord = async (index: number) => {
    const target = teacherWords[index]
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
    setTeacherWords((prev) => prev.filter((_, i) => i !== index))
    setFormHint("Savol o'chirildi.")
  }

  const openArena = () => {
    const activeTeamNames = teamNames
      .slice(0, teamCount)
      .map((name, index) => name.trim() || DEFAULT_TEAM_NAMES[index])
    if (activeTeamNames.some((name) => !name)) {
      setFormHint(teamCount === 1 ? 'Jamoa nomini kiriting.' : 'Ikkala jamoa nomini ham kiriting.')
      return
    }

    const customKey = `jumla-ustasi-teacher-${Date.now()}`
    try {
      sessionStorage.setItem(customKey, JSON.stringify(teacherWords))
    } catch {
      setFormHint("Brauzer storage ishlamadi. Qayta urinib ko'ring.")
      return
    }

    const params = new URLSearchParams({
      difficulty,
      teamCount: String(teamCount),
      team1: activeTeamNames[0],
      custom: customKey,
    })
    if (teamCount === 2) {
      params.set('team2', activeTeamNames[1])
    }
    navigate(`/games/jumla-ustasi/arena?${params.toString()}`)
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
                <h1 className="mt-3 font-kid text-5xl leading-tight text-slate-900 sm:text-6xl">{game.title}</h1>
                <p className="mt-3 text-lg font-bold text-slate-600">
                  {teamCount === 1
                    ? "Aralash harflardan to'g'ri so'zni topish bo'yicha solo bellashuv."
                    : "Aralash harflardan to'g'ri so'zni topish bellashuvi."}
                  Savollar backendga saqlanadi va qayta kirganda ham ko'rinadi.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className={`rounded-full bg-gradient-to-r px-4 py-2 text-sm font-extrabold text-white ${game.tone}`}>{game.category}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">{difficulty} daraja</span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {canUseTeacherContent ? `${teacherWords.length} ta custom savol` : 'Teacher rejimi yopiq'}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                    {teamCount} jamoa
                  </span>
                </div>
              </div>
              <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/90 p-4 shadow-soft">
                <img src={game.image} alt="Jumla ustasi preview" className="h-64 w-full rounded-[1.25rem] object-contain object-center" />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]" data-aos="fade-up" data-aos-delay="60">
            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">O'yin haqida</h2>
              <p className="mt-3 text-lg font-bold leading-relaxed text-slate-600">
                {teamCount === 1
                  ? "Har raundda aralash so'z chiqadi. Uni tez va to'g'ri yechib ball yig'asiz."
                  : "Ikkala jamoaga bir xil aralash so'z chiqadi. Kim tez va to'g'ri topsa raund ballini oladi."}
              </p>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Tanlangan rejim</p>
                <p className="mt-2 font-kid text-5xl text-slate-900">{difficulty}</p>
                <p className="text-sm font-bold text-slate-500">Raund: {info.rounds} | Timer: {info.seconds}s | So'z: {info.wordRange}</p>
                <p className="mt-1 text-sm font-bold text-cyan-700">{info.desc}</p>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-lg font-extrabold text-slate-800">Jamoa rejimi</p>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setTeamCount(count as TeamCount)}
                        className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
                          teamCount === count
                            ? `bg-gradient-to-r text-white shadow-soft ${game.tone}`
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {count} jamoa
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`mt-3 grid gap-3 ${teamCount === 2 ? 'sm:grid-cols-2' : ''}`}>
                  {teamNames.slice(0, teamCount).map((name, index) => (
                    <input
                      key={`team-${index + 1}`}
                      value={name}
                      onChange={(e) => setTeamNames((prev) => prev.map((item, itemIndex) => (
                        itemIndex === index ? e.target.value : item
                      )))}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                      placeholder={DEFAULT_TEAM_NAMES[index]}
                    />
                  ))}
                </div>
              </div>

              <button type="button" onClick={openArena} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-4 text-xl font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${game.tone}`}>
                O'yinni boshlash
              </button>

              {formHint ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-extrabold text-rose-700">{formHint}</p> : null}
            </article>

            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Custom savol qo'shish</h2>
              <QuestionManagerLinkCard
                className="mt-5"
                gameTitle={game.title}
                itemCount={teacherWords.length}
                canManage={canUseTeacherContent}
              />

              <div className="mt-4">
                <Link to="/games" className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5">
                  Barcha o'yinlarga qaytish
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

export default JumlaUstasiSetupPage
