import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FooterCTA from '../components/FooterCTA.tsx'
import Navbar from '../components/Navbar.tsx'
import type { TezkorGuruhConfig } from '../tezkorGuruh/types.ts'
import { createSessionConfigKey, loadLastSetup, saveLastSetup, saveSessionConfig } from '../tezkorGuruh/utils/storage.ts'

const defaultConfig: TezkorGuruhConfig = {
  teamCount: 2,
  teamNames: ['Moviy jamoa', 'Oltin jamoa'],
  questionCount: 5,
  timerSeconds: 12,
  difficulty: 'medium',
}

const difficultyLabels: Record<TezkorGuruhConfig['difficulty'], string> = {
  easy: 'Oson',
  medium: "O'rta",
  hard: 'Qiyin',
}

function TezkorGuruhSetupPage() {
  const navigate = useNavigate()
  const initial = useMemo(() => loadLastSetup() ?? defaultConfig, [])
  const [config, setConfig] = useState<TezkorGuruhConfig>(initial)

  const updateTeamName = (index: number, value: string) => {
    setConfig((prev) => {
      const next = { ...prev, teamNames: [...prev.teamNames] }
      next.teamNames[index] = value
      return next
    })
  }

  const handleStart = () => {
    saveLastSetup(config)
    const sessionKey = createSessionConfigKey()
    saveSessionConfig(sessionKey, config)
    navigate(`/games/tezkor-guruh/arena?session=${encodeURIComponent(sessionKey)}`)
  }

  return (
    <div className="tezkor-guruh-setup-shell relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_14%,#0e1a3a_0%,transparent_30%),radial-gradient(circle_at_88%_18%,#3a0d4a_0%,transparent_30%),linear-gradient(160deg,#050b1a_0%,#0b0f20_55%,#140c2f_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_14%,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_90%_20%,rgba(232,121,249,0.16),transparent_26%),radial-gradient(circle_at_30%_86%,rgba(59,130,246,0.16),transparent_22%)]" />
      <div className="relative z-10">
        <Navbar />
        <main className="tezkor-guruh-page-main mx-auto max-w-[1000px] px-4 pb-16 pt-10 sm:px-6">
          <section className="relative rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-soft backdrop-blur-xl">
            <div className="grid gap-6 lg:grid-cols-[0.62fr_0.38fr]">
              <div>
                <h1 className="font-kid text-4xl font-black text-white sm:text-5xl">Tezkor guruh</h1>
                <p className="mt-3 max-w-[32rem] text-lg font-bold text-slate-200">
                  Jamoaviy savol-javob: hamma bir xil savolga javob beradi, kim birinchi to‘g‘ri javob bersa ball oladi.
                </p>

                <div className="mt-8 grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-200">Jamoalar soni</p>
                    <div className="mt-2 flex items-center gap-2">
                      {[2, 3, 4].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, teamCount: count }))}
                          className={`rounded-full px-4 py-2 text-sm font-black transition ${
                            config.teamCount === count
                              ? 'bg-cyan-500 text-white'
                              : 'bg-white/10 text-slate-100 hover:bg-white/20'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-200">Savollar soni</p>
                    <input
                      type="number"
                      min={3}
                      max={12}
                      value={config.questionCount}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        if (!Number.isNaN(value)) {
                          setConfig((prev) => ({ ...prev, questionCount: Math.min(12, Math.max(3, value)) }))
                        }
                      }}
                      className="mt-2 w-24 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-200">Vaqt (soniya)</p>
                    <input
                      type="number"
                      min={5}
                      max={25}
                      value={config.timerSeconds}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        if (!Number.isNaN(value)) {
                          setConfig((prev) => ({ ...prev, timerSeconds: Math.min(25, Math.max(5, value)) }))
                        }
                      }}
                      className="mt-2 w-24 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-200">Qiyinchilik</p>
                    <div className="mt-2 flex items-center gap-2">
                      {(['easy', 'medium', 'hard'] as TezkorGuruhConfig['difficulty'][]).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, difficulty: level }))}
                          className={`rounded-full px-4 py-2 text-sm font-black transition ${
                            config.difficulty === level
                              ? 'bg-amber-500 text-white'
                              : 'bg-white/10 text-slate-100 hover:bg-white/20'
                          }`}
                        >
                          {difficultyLabels[level]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-200">Jamoa nomlari</p>
                    <div className="mt-3 grid gap-3">
                      {Array.from({ length: config.teamCount }, (_, index) => (
                        <input
                          key={index}
                          value={config.teamNames[index] ?? ''}
                          onChange={(event) => updateTeamName(index, event.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-400"
                          placeholder={`Jamoa ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStart}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 px-6 py-4 text-lg font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:-translate-y-0.5"
                  >
                    O'yinni boshlash
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-black text-white">Premium tajriba</h2>
                <p className="mt-3 text-sm font-bold text-slate-200">
                  Bu rejimda savol bitta, lekin jamoa ichida kim birinchi to‘g‘ri javob bersa, shu jamoaga ball beriladi. O'yin oxirida 1-o'rin egasi e'lon qilinadi.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-200">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
                    Savol bir xil, hamma jamoa uchun.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
                    Javob to‘g‘ri bo‘lsa, ball to‘planadi.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
                    G'olib jamoa maxsus sahifada e'lon qilinadi.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </main>
        <FooterCTA />
      </div>
    </div>
  )
}

export default TezkorGuruhSetupPage
