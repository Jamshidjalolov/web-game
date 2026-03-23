import { useEffect, useRef, useState } from 'react'
import AnswerButtons from './AnswerButtons.tsx'
import IntroScreen from './IntroScreen.tsx'
import ParticlesBackdrop from './ParticlesBackdrop.tsx'
import StatementCard from './StatementCard.tsx'
import TimerBar from './TimerBar.tsx'
import WinnerScreen from './WinnerScreen.tsx'
import { useFakeOrFactGame } from '../context/FakeOrFactGameContext.tsx'

type GameArenaProps = {
  onBackToSetup: () => void
}

function GameArena({ onBackToSetup }: GameArenaProps) {
  const arenaRef = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { config, currentRoundIndex, showIntro, soundEnabled, teams, toggleSound, totalRounds } = useFakeOrFactGame()
  const isSoloMode = teams.length === 1

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    if (!config.fullscreenPreferred || !arenaRef.current) return
    void arenaRef.current.requestFullscreen().catch(() => undefined)
  }, [config.fullscreenPreferred])

  const toggleFullscreen = async () => {
    if (!arenaRef.current) return
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined)
      return
    }
    await arenaRef.current.requestFullscreen().catch(() => undefined)
  }

  return (
    <div
      ref={arenaRef}
      className="relative flex min-h-[72vh] flex-col gap-3 rounded-[2rem] border border-white/12 bg-[linear-gradient(145deg,rgba(5,12,28,0.96),rgba(13,13,32,0.96))] p-4 shadow-soft sm:p-5 lg:h-full lg:min-h-0 lg:overflow-hidden"
    >
      <ParticlesBackdrop />
      <IntroScreen />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-cyan-100/74">Ixcham premium arena</p>
          <h2 className="mt-1 font-kid text-4xl text-white sm:text-5xl">FAKE or FACT PRO</h2>
          <p className="mt-1 text-sm font-bold text-slate-300">{config.roomName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-100"
          >
            {soundEnabled ? 'Ovoz yoqilgan' : "Ovoz o'chiq"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-100"
          >
            {isFullscreen ? "To'liq ekranni yopish" : "To'liq ekran"}
          </button>
          <button
            type="button"
            onClick={onBackToSetup}
            className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-100"
          >
            Sozlamaga qaytish
          </button>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 lg:min-h-0">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="rounded-[1.4rem] border border-white/12 bg-white/8 px-4 py-2.5 backdrop-blur-xl">
            <p className="text-xs font-bold leading-6 text-slate-200/84 sm:text-sm">
              {isSoloMode
                ? "Savol tepada turadi, siz pastdagi paneldan javob berasiz. Javob ochilishi bilan keyingi savolga o'tiladi."
                : "Savol tepada turadi, ikki jamoa esa pastda yonma-yon javob beradi. Har ikkala javob kelishi bilan keyingi savol ochiladi."}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/12 bg-white/8 px-4 py-2.5 text-center backdrop-blur-xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-300">Holat</p>
            <p className="mt-1 text-xl font-black text-white">{showIntro ? 'Tayyor' : `${currentRoundIndex + 1}/${totalRounds}`}</p>
          </div>
        </div>

        <StatementCard />
        <TimerBar />

        <div className={`grid gap-3 ${isSoloMode ? '' : 'sm:grid-cols-2'}`}>
          {teams.map((team) => (
            <div key={`score-${team.id}`} className="rounded-[1.4rem] border border-white/12 bg-white/8 px-4 py-3 backdrop-blur-xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-300">{team.name}</p>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <p className="text-3xl font-black text-white">{team.score}</p>
                <p className="text-xs font-bold text-slate-300 sm:text-sm">Seriya {team.streak}x</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:min-h-0">
          <AnswerButtons />
        </div>
      </div>

      <WinnerScreen onBackToSetup={onBackToSetup} />
    </div>
  )
}

export default GameArena
