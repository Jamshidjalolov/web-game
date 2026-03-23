import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type {
  AnswersRoyaleQuestion,
  AnswersRoyaleRankingEntry,
  AnswersRoyaleSetupConfig,
} from '../types.ts'
import {
  clearAnswersRoyaleCustomBank,
  saveAnswersRoyaleCustomBank,
  saveAnswersRoyaleSetup,
} from '../utils/storage.ts'
import { normalizeBattleAnswer, uniqueAnswers } from '../utils/normalize.ts'

type AnswersRoyaleLobbyProps = {
  initialConfig: AnswersRoyaleSetupConfig | null
  teacherQuestionCount: number
  ranking: AnswersRoyaleRankingEntry[]
  onStart: (config: AnswersRoyaleSetupConfig) => void | Promise<void>
}

const defaultTeamNames = ['Moviy jamoa', 'Oltin jamoa'] as const
const fixedRoundTime = 30
const fixedQuestionCount = 5

const defaultConfig: AnswersRoyaleSetupConfig = {
  roomName: 'Bilim Arenasi',
  hostLabel: 'Ustoz',
  teamCount: 2,
  teamNames: [...defaultTeamNames],
  totalPlayers: 54,
  category: 'any',
  difficulty: 'hard',
  roundTime: fixedRoundTime,
  eliminationThreshold: 99,
  soundEnabled: true,
  customQuestions: [],
}

const normalizeTeamNames = (value: string[] | undefined): [string, string] => ([
  value?.[0]?.trim() || defaultTeamNames[0],
  value?.[1]?.trim() || defaultTeamNames[1],
])

const parseAnswersText = (value: string) =>
  uniqueAnswers(
    value
      .split(/\n|,|;/)
      .map((item) => item.trim())
      .filter(Boolean),
  )

function AnswersRoyaleLobby({
  initialConfig,
  teacherQuestionCount,
  ranking,
  onStart,
}: AnswersRoyaleLobbyProps) {
  const [roomName, setRoomName] = useState(initialConfig?.roomName ?? defaultConfig.roomName)
  const [teamCount, setTeamCount] = useState<1 | 2>(initialConfig?.teamCount ?? defaultConfig.teamCount)
  const [totalPlayers, setTotalPlayers] = useState(initialConfig?.totalPlayers ?? defaultConfig.totalPlayers)
  const [soundEnabled, setSoundEnabled] = useState(initialConfig?.soundEnabled ?? defaultConfig.soundEnabled)
  const [teamNames, setTeamNames] = useState<[string, string]>(normalizeTeamNames(initialConfig?.teamNames))
  const [customQuestions, setCustomQuestions] = useState<AnswersRoyaleQuestion[]>(initialConfig?.customQuestions ?? [])
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftHint, setDraftHint] = useState('')
  const [draftAnswersText, setDraftAnswersText] = useState('')
  const [statusText, setStatusText] = useState('')

  const config = useMemo<AnswersRoyaleSetupConfig>(() => ({
    roomName: roomName.trim() || defaultConfig.roomName,
    hostLabel: defaultConfig.hostLabel,
    teamCount,
    teamNames: normalizeTeamNames(teamNames),
    totalPlayers,
    category: 'any',
    difficulty: 'hard',
    roundTime: fixedRoundTime,
    eliminationThreshold: 99,
    soundEnabled,
    customQuestions,
  }), [customQuestions, roomName, soundEnabled, teamNames, totalPlayers, teamCount])

  const parsedDraftAnswers = useMemo(
    () => parseAnswersText(draftAnswersText),
    [draftAnswersText],
  )

  useEffect(() => {
    saveAnswersRoyaleCustomBank(customQuestions)
    saveAnswersRoyaleSetup(config)
  }, [config, customQuestions])

  const handleTeamNameChange = (index: 0 | 1, value: string) => {
    setTeamNames((prev) => {
      const next: [string, string] = [...prev]
      next[index] = value
      return next
    })
  }

  const handleAddQuestion = () => {
    const prompt = draftPrompt.trim()
    const hint = draftHint.trim()
    if (prompt.length < 8) {
      setStatusText("Savol matni kamida 8 ta belgidan iborat bo'lsin.")
      return
    }
    if (parsedDraftAnswers.length < 8) {
      setStatusText("Kamida 8 ta to'g'ri javob kiriting.")
      return
    }

    const normalizedAnswers = parsedDraftAnswers.map((answer) => normalizeBattleAnswer(answer))
    const key = `${normalizeBattleAnswer(prompt)}__${normalizedAnswers.join('|')}`
    const exists = customQuestions.some((question) => (
      `${normalizeBattleAnswer(question.question)}__${question.correctAnswers.map(normalizeBattleAnswer).join('|')}` === key
    ))

    if (exists) {
      setStatusText('Bu savol allaqachon qo‘shilgan.')
      return
    }

    const nextQuestion: AnswersRoyaleQuestion = {
      id: `local-${Date.now()}`,
      question: prompt,
      category: 'any',
      difficulty: 'medium',
      correctAnswers: normalizedAnswers,
      answerGoal: normalizedAnswers.length,
      hint: hint || undefined,
      source: 'local',
    }

    setCustomQuestions((prev) => [nextQuestion, ...prev].slice(0, 50))
    setDraftPrompt('')
    setDraftHint('')
    setDraftAnswersText('')
    setStatusText("Savol qo'shildi.")
  }

  const handleClearQuestions = () => {
    clearAnswersRoyaleCustomBank()
    setCustomQuestions([])
    setStatusText('Lokal savollar tozalandi.')
  }

  const topRanking = ranking.slice(0, 4)

  return (
    <section className="grid gap-6">
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="answersroyale-panel overflow-hidden rounded-[2rem] border border-white/14 bg-[linear-gradient(145deg,rgba(7,18,48,0.88),rgba(18,14,55,0.92))] p-6 shadow-soft backdrop-blur-xl sm:p-8"
      >
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/12 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-100">
              Teacher review rejimi
            </p>
            <h1 className="mt-4 max-w-4xl font-kid text-5xl leading-tight text-white sm:text-6xl">
              1 Savol - 100 Javob
            </h1>
            <p className="mt-4 max-w-3xl text-lg font-bold leading-8 text-slate-200/84">
              Endi o'yin teacher review formatida ishlaydi: {teamCount} ta jamoa, 5 ta savol, har bir savolga 30 soniya.
              Vaqt tugagach ustoz modal ichida javoblarni check qiladi, oxirida esa umumiy premium natija chiqadi.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="answersroyale-stat-card">
                <p className="answersroyale-stat-label">Jamoa</p>
                <p className="answersroyale-stat-value">{teamCount} ta</p>
              </div>
              <div className="answersroyale-stat-card">
                <p className="answersroyale-stat-label">Savollar</p>
                <p className="answersroyale-stat-value">{fixedQuestionCount} ta</p>
              </div>
              <div className="answersroyale-stat-card">
                <p className="answersroyale-stat-label">Har savol</p>
                <p className="answersroyale-stat-value">{fixedRoundTime} soniya</p>
              </div>
              <div className="answersroyale-stat-card">
                <p className="answersroyale-stat-label">Tayyor bank</p>
                <p className="answersroyale-stat-value">{teacherQuestionCount + customQuestions.length}</p>
              </div>
            </div>
          </div>

          <div className="answersroyale-score-shell rounded-[1.8rem] border border-white/12 bg-white/8 p-4">
            <div className="answersroyale-score-card rounded-[1.5rem] border border-white/12 bg-[linear-gradient(155deg,rgba(10,33,68,0.94),rgba(27,12,58,0.94))] p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-100/78">Qanday aniqlanadi</p>
              <h2 className="mt-2 text-3xl font-black text-white">Yakuniy g‘olib</h2>
              <div className="mt-5 grid gap-3">
                <div className="answersroyale-rule-card">
                  <p className="answersroyale-rule-value">1</p>
                  <p className="answersroyale-rule-copy">5 ta savol davomida faol jamoalar barcha javoblarini 30 soniya ichida topshiradi.</p>
                </div>
                <div className="answersroyale-rule-card">
                  <p className="answersroyale-rule-value">2</p>
                  <p className="answersroyale-rule-copy">Har savol tugagach ustoz review modalda to'g'ri javoblarni check va uncheck qiladi.</p>
                </div>
                <div className="answersroyale-rule-card">
                  <p className="answersroyale-rule-value">3</p>
                  <p className="answersroyale-rule-copy">Yakuniy ball: noyob javob +10, bir xil javob +6, dublikat -2 ball beradi.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.article>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <motion.article
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="answersroyale-panel rounded-[2rem] border border-white/14 bg-[linear-gradient(145deg,rgba(10,20,52,0.84),rgba(19,13,43,0.9))] p-5 shadow-soft backdrop-blur-xl sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-100/76">Asosiy sozlama</p>
              <h2 className="mt-2 font-kid text-4xl text-white sm:text-5xl">Boshlash oynasi</h2>
            </div>
            <span className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-extrabold text-slate-100">
              {teamCount} jamoalik rejim
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[1, 2].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setTeamCount(count as 1 | 2)}
                className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
                  teamCount === count
                    ? 'border border-cyan-300/30 bg-cyan-300/12 text-cyan-50'
                    : 'border border-white/12 bg-white/8 text-slate-100'
                }`}
              >
                {count} jamoa
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              className="answersroyale-input"
              placeholder="Xona nomi"
            />
            <input
              type="number"
              min={24}
              max={99}
              value={totalPlayers}
              onChange={(event) => setTotalPlayers(Math.max(24, Math.min(99, Number(event.target.value) || 24)))}
              className="answersroyale-input"
              placeholder="O'yinchi soni"
            />
            <input
              value={teamNames[0]}
              onChange={(event) => handleTeamNameChange(0, event.target.value)}
              className="answersroyale-input"
              placeholder="Chap jamoa nomi"
            />
            {teamCount === 2 ? (
              <input
                value={teamNames[1]}
                onChange={(event) => handleTeamNameChange(1, event.target.value)}
                className="answersroyale-input"
                placeholder="O'ng jamoa nomi"
              />
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="answersroyale-info-card">
              <p className="answersroyale-info-label">Savollar soni</p>
              <p className="answersroyale-info-value">{fixedQuestionCount} ta</p>
              <p className="answersroyale-info-copy">Hammasi ketma-ket o‘ynaladi.</p>
            </div>
            <div className="answersroyale-info-card">
              <p className="answersroyale-info-label">Vaqt</p>
              <p className="answersroyale-info-value">{fixedRoundTime} soniya</p>
              <p className="answersroyale-info-copy">Har bir savol uchun bir xil.</p>
            </div>
            <div className="answersroyale-info-card">
              <p className="answersroyale-info-label">Ustoz banki</p>
              <p className="answersroyale-info-value">{teacherQuestionCount}</p>
              <p className="answersroyale-info-copy">Markaziy bazadan olinadi.</p>
            </div>
            <div className="answersroyale-info-card">
              <p className="answersroyale-info-label">Lokal savol</p>
              <p className="answersroyale-info-value">{customQuestions.length}</p>
              <p className="answersroyale-info-copy">Shu sahifada qo‘shilgan savollar.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`answersroyale-toggle-card mt-4 w-full text-left ${soundEnabled ? 'answersroyale-toggle-card-active' : ''}`}
          >
            <p className="answersroyale-info-label">Ovoz va musiqa</p>
            <p className="answersroyale-info-value">{soundEnabled ? 'Yoqilgan' : "O‘chiq"}</p>
            <p className="answersroyale-info-copy">Arena musiqasi va final effektlari shu tugma bilan boshqariladi.</p>
          </button>

          <div className="mt-5 rounded-[1.6rem] border border-white/12 bg-white/8 p-4">
            <p className="text-sm font-black text-white">Qisqa eslatma</p>
            <p className="mt-2 text-sm font-bold leading-7 text-slate-200/80">
              Savollar avtomatik aralashtiriladi. Xona nomi va jamoa nomlarini kiriting, qolgan teacher review oqimi arena ichida yuradi.
            </p>
          </div>

          <button
            type="button"
            onClick={() => { void onStart(config) }}
            className="answersroyale-primary-cta mt-6 flex w-full items-center justify-center rounded-2xl px-6 py-4 text-lg font-black uppercase tracking-[0.14em] text-white"
          >
            O‘yinni boshlash
          </button>

          {statusText ? (
            <p className="mt-4 rounded-2xl border border-white/14 bg-white/8 px-4 py-3 text-sm font-extrabold text-slate-100">
              {statusText}
            </p>
          ) : null}
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="answersroyale-panel rounded-[2rem] border border-white/14 bg-[linear-gradient(145deg,rgba(8,24,57,0.88),rgba(19,10,40,0.92))] p-5 shadow-soft backdrop-blur-xl sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-100/80">Ustoz uchun</p>
              <h2 className="mt-2 font-kid text-4xl text-white sm:text-5xl">Savol qo‘shish</h2>
            </div>
            <button
              type="button"
              onClick={handleClearQuestions}
              className="rounded-2xl border border-rose-300/24 bg-rose-400/10 px-4 py-2 text-sm font-extrabold text-rose-100 transition hover:-translate-y-0.5"
            >
              Tozalash
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            <textarea
              value={draftPrompt}
              onChange={(event) => setDraftPrompt(event.target.value)}
              rows={3}
              className="answersroyale-input"
              placeholder="Savolni yozing"
            />
            <input
              value={draftHint}
              onChange={(event) => setDraftHint(event.target.value)}
              className="answersroyale-input"
              placeholder="Qisqa izoh yoki yo‘naltirish"
            />
            <textarea
              value={draftAnswersText}
              onChange={(event) => setDraftAnswersText(event.target.value)}
              rows={8}
              className="answersroyale-input"
              placeholder={'Har bir javobni yangi qatordan yozing\nSamarqand\nBuxoro\nXiva'}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">Kiritilgan javoblar</p>
              <p className="mt-2 text-2xl font-black text-white">{parsedDraftAnswers.length} ta</p>
              <p className="mt-2 text-sm font-bold text-slate-300">
                Takrorlar avtomatik o‘chadi. Kamida 8 ta javob yozing.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="answersroyale-secondary-cta whitespace-nowrap rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-white"
            >
              Savol qo‘shish
            </button>
          </div>

          <div className="mt-5 max-h-[360px] space-y-3 overflow-auto pr-1">
            {customQuestions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/18 bg-white/6 px-4 py-6 text-center text-sm font-bold text-slate-300">
                Hozircha lokal savol yo‘q.
              </div>
            ) : (
              customQuestions.map((question, index) => (
                <div key={question.id} className="rounded-2xl border border-white/12 bg-white/8 px-4 py-4">
                  <p className="text-sm font-black text-white">{index + 1}. {question.question}</p>
                  <p className="mt-2 text-xs font-bold text-slate-300">
                    {question.correctAnswers.length} ta javob {question.hint ? `| ${question.hint}` : ''}
                  </p>
                  <p className="mt-2 text-xs font-bold text-cyan-100/90">
                    {question.correctAnswers.slice(0, 8).join(', ')}
                    {question.correctAnswers.length > 8 ? '...' : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </motion.article>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.16 }}
        className="answersroyale-panel rounded-[2rem] border border-white/14 bg-[linear-gradient(145deg,rgba(9,24,54,0.84),rgba(22,15,50,0.9))] p-5 shadow-soft backdrop-blur-xl sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-100/76">Oxirgi natijalar</p>
            <h2 className="mt-2 font-kid text-4xl text-white sm:text-5xl">G‘olib jamoalar</h2>
          </div>
          <p className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-extrabold text-slate-100">
            Eng yaxshi {Math.max(1, topRanking.length)} ta
          </p>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          {topRanking.length === 0 ? (
            <div className="lg:col-span-4 rounded-2xl border border-dashed border-white/18 bg-white/6 px-4 py-6 text-center text-sm font-bold text-slate-300">
              G‘olib jamoalar shu yerda ko‘rinadi.
            </div>
          ) : (
            topRanking.map((entry, index) => (
              <div key={entry.id} className="rounded-2xl border border-white/12 bg-white/8 px-4 py-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-100/72">#{index + 1}</p>
                <p className="mt-2 text-lg font-black text-white">{entry.teamName}</p>
                <p className="mt-1 text-sm font-bold text-slate-300">{entry.roomName}</p>
                <div className="mt-4 flex items-center justify-between text-sm font-extrabold text-slate-100">
                  <span>{entry.score} ball</span>
                  <span>+{entry.xpEarned} XP</span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.article>
    </section>
  )
}

export default AnswersRoyaleLobby
