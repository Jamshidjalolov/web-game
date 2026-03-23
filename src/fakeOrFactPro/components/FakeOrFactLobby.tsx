import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { categoryLabelMap, modeLabelMap } from '../QuestionEngine.ts'
import type {
  FakeOrFactCategory,
  FakeOrFactDifficulty,
  FakeOrFactMode,
  FakeOrFactQuestion,
  FakeOrFactRankingEntry,
  FakeOrFactSetupConfig,
} from '../types.ts'
import {
  clearFakeOrFactCustomBank,
  saveFakeOrFactCustomBank,
  saveFakeOrFactSetup,
} from '../utils/storage.ts'

type FakeOrFactLobbyProps = {
  initialConfig: FakeOrFactSetupConfig | null
  ranking: FakeOrFactRankingEntry[]
  onStart: (config: FakeOrFactSetupConfig) => void | Promise<void>
}

const defaultConfig: FakeOrFactSetupConfig = {
  roomName: 'FAKE or FACT PRO',
  mode: 'class',
  category: 'mix',
  startingDifficulty: 'easy',
  roundCount: 10,
  teamCount: 2,
  teamNames: ['Faktchilar', 'Tekshiruvchilar'],
  soundEnabled: true,
  fullscreenPreferred: false,
  customQuestions: [],
}

const difficultyOptions: Array<{ value: FakeOrFactDifficulty; label: string }> = [
  { value: 'easy', label: 'Oson' },
  { value: 'medium', label: "O'rta" },
  { value: 'hard', label: 'Qiyin' },
]

const categoryOptions: Array<{ value: FakeOrFactCategory | 'mix'; label: string }> = [
  { value: 'mix', label: categoryLabelMap.mix },
  { value: 'fan', label: categoryLabelMap.fan },
  { value: 'tarix', label: categoryLabelMap.tarix },
  { value: 'texnologiya', label: categoryLabelMap.texnologiya },
  { value: 'internet', label: categoryLabelMap.internet },
  { value: 'qiziqarli', label: categoryLabelMap.qiziqarli },
]

const normalizeText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

function FakeOrFactLobby({ initialConfig, ranking, onStart }: FakeOrFactLobbyProps) {
  const [roomName, setRoomName] = useState(initialConfig?.roomName ?? defaultConfig.roomName)
  const [mode, setMode] = useState<FakeOrFactMode>(initialConfig?.mode ?? defaultConfig.mode)
  const [category, setCategory] = useState<FakeOrFactCategory | 'mix'>(initialConfig?.category ?? defaultConfig.category)
  const [startingDifficulty, setStartingDifficulty] = useState<FakeOrFactDifficulty>(initialConfig?.startingDifficulty ?? defaultConfig.startingDifficulty)
  const [roundCount, setRoundCount] = useState(initialConfig?.roundCount ?? defaultConfig.roundCount)
  const [teamCount, setTeamCount] = useState<1 | 2>(initialConfig?.teamCount ?? defaultConfig.teamCount)
  const [teamNames, setTeamNames] = useState<[string, string]>(initialConfig?.teamNames ?? defaultConfig.teamNames)
  const [soundEnabled, setSoundEnabled] = useState(initialConfig?.soundEnabled ?? defaultConfig.soundEnabled)
  const [fullscreenPreferred, setFullscreenPreferred] = useState(initialConfig?.fullscreenPreferred ?? defaultConfig.fullscreenPreferred)
  const [customQuestions, setCustomQuestions] = useState<FakeOrFactQuestion[]>(initialConfig?.customQuestions ?? [])
  const [draftText, setDraftText] = useState('')
  const [draftAnswer, setDraftAnswer] = useState(true)
  const [draftExplanation, setDraftExplanation] = useState('')
  const [draftCategory, setDraftCategory] = useState<FakeOrFactCategory>('fan')
  const [draftDifficulty, setDraftDifficulty] = useState<FakeOrFactDifficulty>('medium')
  const [draftPoints, setDraftPoints] = useState(180)
  const [statusText, setStatusText] = useState('')

  const config = useMemo<FakeOrFactSetupConfig>(() => ({
    roomName: roomName.trim() || defaultConfig.roomName,
    mode,
    category,
    startingDifficulty,
    roundCount,
    teamCount,
    teamNames: [
      teamNames[0].trim() || defaultConfig.teamNames[0],
      teamNames[1].trim() || defaultConfig.teamNames[1],
    ],
    soundEnabled,
    fullscreenPreferred,
    customQuestions,
  }), [category, customQuestions, fullscreenPreferred, mode, roomName, roundCount, soundEnabled, startingDifficulty, teamNames, teamCount])

  useEffect(() => {
    saveFakeOrFactCustomBank(customQuestions)
    saveFakeOrFactSetup(config)
  }, [config, customQuestions])

  const handleAddQuestion = () => {
    if (draftText.trim().length < 10) {
      setStatusText("Bayonot matni kamida 10 ta belgidan iborat bo'lsin.")
      return
    }
    if (draftExplanation.trim().length < 10) {
      setStatusText("Izoh ham kamida 10 ta belgidan iborat bo'lsin.")
      return
    }

    const signature = `${normalizeText(draftText)}__${draftAnswer}`
    const exists = customQuestions.some((question) => `${normalizeText(question.text_uz)}__${question.answer}` === signature)
    if (exists) {
      setStatusText("Bu bayonot allaqachon qo'shilgan.")
      return
    }

    setCustomQuestions((prev) => [
      {
        id: `fake-fact-teacher-${Date.now()}`,
        category: draftCategory,
        difficulty: draftDifficulty,
        text_uz: draftText.trim(),
        answer: draftAnswer,
        explanation_uz: draftExplanation.trim(),
        points: draftPoints,
        source: 'teacher' as const,
      },
      ...prev,
    ].slice(0, 80))
    setDraftText('')
    setDraftExplanation('')
    setDraftAnswer(true)
    setDraftCategory('fan')
    setDraftDifficulty('medium')
    setDraftPoints(180)
    setStatusText("Ustoz savoli qo'shildi.")
  }

  const topRanking = ranking.slice(0, 4)

  return (
    <section className="fakefact-lobby grid gap-6">
      <motion.article
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="overflow-hidden rounded-[2.2rem] border border-white/12 bg-[linear-gradient(145deg,rgba(5,15,36,0.95),rgba(14,11,33,0.96))] p-6 shadow-soft backdrop-blur-xl sm:p-8"
      >
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-cyan-300/24 bg-cyan-300/12 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-100">
              Premium sinf bellashuvi
            </p>
            <h1 className="mt-4 font-kid text-6xl leading-none text-white sm:text-7xl">
              FAKE or FACT PRO
            </h1>
            <p className="mt-4 max-w-3xl text-lg font-bold leading-8 text-slate-200/84">
              Mediasavod, fan va mantiqni bitta dramatik o'yinga jamlaydigan zamonaviy sinf shousi.
              2 jamoa FAKT yoki FEYKni topadi, izohni ko'radi va yakunda g'olib aniqlanadi.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.5rem] border border-white/12 bg-white/8 p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">Rejim</p>
                <p className="mt-2 text-2xl font-black text-white">{modeLabelMap[mode]}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/12 bg-white/8 p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">AI savollar</p>
                <p className="mt-2 text-2xl font-black text-white">Sun'iy generator</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/12 bg-white/8 p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">Ustoz banki</p>
                <p className="mt-2 text-2xl font-black text-white">{customQuestions.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/12 bg-white/8 p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">Raundlar</p>
                <p className="mt-2 text-2xl font-black text-white">{roundCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.9rem] border border-white/12 bg-white/8 p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-100/78">Motivatsiya effektlari</p>
            <div className="mt-4 grid gap-3">
              {[
                'Score counter animatsiyasi',
                'SUPER JAVOB! va SERIYA 3x 🔥 effektlari',
                'Tezkor duel uchun bonus',
                "G'olib uchun cinematic modal",
              ].map((line) => (
                <div key={line} className="rounded-[1.3rem] border border-white/12 bg-white/8 px-4 py-3 text-sm font-black text-slate-100">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.article>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <motion.article
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="rounded-[2rem] border border-white/12 bg-[linear-gradient(145deg,rgba(6,20,48,0.94),rgba(15,12,34,0.96))] p-6 shadow-soft backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-100/74">Sozlamalar</p>
              <h2 className="mt-2 font-kid text-5xl text-white">Boshlash paneli</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              className="answersroyale-input"
              placeholder="Xona nomi"
            />
            <select
              value={roundCount}
              onChange={(event) => setRoundCount(Number(event.target.value))}
              className="answersroyale-input"
            >
              {[8, 10, 12, 15].map((value) => (
                <option key={value} value={value}>{value} ta raund</option>
              ))}
            </select>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              {[1, 2].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setTeamCount(count as 1 | 2)}
                  className={`rounded-[1.1rem] border px-4 py-2 text-sm font-extrabold transition ${
                    teamCount === count
                      ? 'border-cyan-300/24 bg-cyan-300/12 text-cyan-50'
                      : 'border-white/12 bg-white/8 text-slate-100'
                  }`}
                >
                  {count} jamoa
                </button>
              ))}
            </div>
            <input
              value={teamNames[0]}
              onChange={(event) => setTeamNames((prev) => [event.target.value, prev[1]])}
              className="answersroyale-input"
              placeholder="1-jamoa nomi"
            />
            {teamCount === 2 ? (
              <input
                value={teamNames[1]}
                onChange={(event) => setTeamNames((prev) => [prev[0], event.target.value])}
                className="answersroyale-input"
                placeholder="2-jamoa nomi"
              />
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(['class', 'speed'] as FakeOrFactMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-[1.7rem] border p-5 text-left ${
                  mode === item
                    ? 'border-cyan-300/24 bg-cyan-300/12'
                    : 'border-white/12 bg-white/8'
                }`}
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-300">{modeLabelMap[item]}</p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-100">
                  {item === 'class'
                    ? (teamCount === 1 ? "Yakka rejimda har savolga o'zingiz javob berasiz." : "Jamoalar navbat bilan javob beradi.")
                    : (teamCount === 1 ? "Yakka rejimda hamma savol sizga ochiladi." : "Ikkala jamoa ham bir vaqtda javob beradi.")}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as FakeOrFactCategory | 'mix')}
              className="answersroyale-input"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={startingDifficulty}
              onChange={(event) => setStartingDifficulty(event.target.value as FakeOrFactDifficulty)}
              className="answersroyale-input"
            >
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`rounded-[1.6rem] border p-5 text-left ${soundEnabled ? 'border-cyan-300/24 bg-cyan-300/12' : 'border-white/12 bg-white/8'}`}
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-300">Ovoz</p>
              <p className="mt-2 text-xl font-black text-white">{soundEnabled ? 'Yoqilgan' : "O'chiq"}</p>
            </button>
            <button
              type="button"
              onClick={() => setFullscreenPreferred((prev) => !prev)}
              className={`rounded-[1.6rem] border p-5 text-left ${fullscreenPreferred ? 'border-emerald-300/24 bg-emerald-400/12' : 'border-white/12 bg-white/8'}`}
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-300">To'liq ekran</p>
              <p className="mt-2 text-xl font-black text-white">{fullscreenPreferred ? 'Tavsiya etiladi' : 'Oddiy rejim'}</p>
            </button>
          </div>

          <button
            type="button"
            onClick={() => { void onStart(config) }}
            className="mt-6 w-full rounded-[1.7rem] bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 px-6 py-4 text-lg font-black uppercase tracking-[0.14em] text-white shadow-soft"
          >
            O'yinni boshlash
          </button>

          {statusText ? (
            <p className="mt-4 rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm font-extrabold text-slate-100">
              {statusText}
            </p>
          ) : null}
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="rounded-[2rem] border border-white/12 bg-[linear-gradient(145deg,rgba(8,24,57,0.92),rgba(20,11,39,0.96))] p-6 shadow-soft backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-100/74">Ustoz rejimi</p>
              <h2 className="mt-2 font-kid text-5xl text-white">Savol qo'shish</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                clearFakeOrFactCustomBank()
                setCustomQuestions([])
              }}
              className="rounded-2xl border border-rose-300/24 bg-rose-400/10 px-4 py-2 text-sm font-black text-rose-100"
            >
              Tozalash
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            <textarea
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              rows={4}
              className="answersroyale-input"
              placeholder="Bayonotni yozing. Masalan: Oy o'zidan nur chiqaradi."
            />
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setDraftAnswer(true)}
                className={`rounded-2xl border px-4 py-4 text-left ${draftAnswer ? 'border-emerald-300/24 bg-emerald-400/12' : 'border-white/12 bg-white/8'}`}
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-300">To'g'ri javob</p>
                <p className="mt-2 text-2xl font-black text-white">FAKT</p>
              </button>
              <button
                type="button"
                onClick={() => setDraftAnswer(false)}
                className={`rounded-2xl border px-4 py-4 text-left ${!draftAnswer ? 'border-rose-300/24 bg-rose-400/12' : 'border-white/12 bg-white/8'}`}
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-300">To'g'ri javob</p>
                <p className="mt-2 text-2xl font-black text-white">FEYK</p>
              </button>
            </div>
            <textarea
              value={draftExplanation}
              onChange={(event) => setDraftExplanation(event.target.value)}
              rows={4}
              className="answersroyale-input"
              placeholder="Nega fakt yoki nega feyk ekanini tushuntiring."
            />
            <div className="grid gap-3 md:grid-cols-3">
              <select
                value={draftCategory}
                onChange={(event) => setDraftCategory(event.target.value as FakeOrFactCategory)}
                className="answersroyale-input"
              >
                {categoryOptions.filter((option) => option.value !== 'mix').map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={draftDifficulty}
                onChange={(event) => setDraftDifficulty(event.target.value as FakeOrFactDifficulty)}
                className="answersroyale-input"
              >
                {difficultyOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <input
                type="number"
                min={80}
                max={300}
                step={20}
                value={draftPoints}
                onChange={(event) => setDraftPoints(Math.max(80, Math.min(300, Number(event.target.value) || 100)))}
                className="answersroyale-input"
                placeholder="Ball"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="mt-5 w-full rounded-[1.6rem] border border-white/12 bg-white/8 px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Ustoz savolini qo'shish
          </button>

          <div className="mt-5 max-h-[360px] space-y-3 overflow-auto pr-1">
            {customQuestions.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-white/16 bg-white/6 px-4 py-6 text-center text-sm font-bold text-slate-300">
                Hozircha teacher savollari yo'q. Sun'iy generator avtomatik savollar yaratadi, lekin siz ham qo'shishingiz mumkin.
              </div>
            ) : (
              customQuestions.map((question) => (
                <div key={question.id} className="rounded-[1.5rem] border border-white/12 bg-white/8 px-4 py-4">
                  <p className="text-sm font-black text-white">{question.text_uz}</p>
                  <p className="mt-2 text-xs font-bold text-slate-300">
                    {question.answer ? 'FAKT' : 'FEYK'} | {categoryLabelMap[question.category]} | {question.points} ball
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-cyan-100/86">{question.explanation_uz}</p>
                </div>
              ))
            )}
          </div>
        </motion.article>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12 }}
        className="rounded-[2rem] border border-white/12 bg-[linear-gradient(145deg,rgba(7,19,49,0.92),rgba(18,14,41,0.96))] p-6 shadow-soft backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-100/74">G'oliblar devori</p>
            <h2 className="mt-2 font-kid text-5xl text-white">Oxirgi g'oliblar</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          {topRanking.length === 0 ? (
            <div className="lg:col-span-4 rounded-[1.6rem] border border-dashed border-white/16 bg-white/6 px-4 py-6 text-center text-sm font-bold text-slate-300">
              G'oliblar shu yerda yig'iladi.
            </div>
          ) : (
            topRanking.map((entry, index) => (
              <div key={entry.id} className="rounded-[1.6rem] border border-white/12 bg-white/8 px-4 py-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-100/72">#{index + 1}</p>
                <p className="mt-2 text-xl font-black text-white">{entry.winnerName}</p>
                <p className="mt-1 text-sm font-bold text-slate-300">{entry.roomName}</p>
                <p className="mt-3 text-sm font-bold text-slate-100">{modeLabelMap[entry.mode]}</p>
                <p className="mt-2 text-3xl font-black text-white">{entry.score}</p>
              </div>
            ))
          )}
        </div>
      </motion.article>
    </section>
  )
}

export default FakeOrFactLobby
