import { useFakeOrFactGame } from './context/FakeOrFactGameContext.tsx'
import { difficultyLabelMap } from './utils/difficulty.ts'

function DifficultyEngine() {
  const { currentDifficulty } = useFakeOrFactGame()

  return (
    <div className="rounded-[1.8rem] border border-white/12 bg-white/8 p-5 backdrop-blur-xl">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-300">Moslashuvchan qiyinlik</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black text-white">{difficultyLabelMap[currentDifficulty]}</h3>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-300">
            Biror jamoa ketma-ket 3 marta to'g'ri topsa, keyingi savollar qiyinlashadi.
          </p>
        </div>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-100">
          Dinamik
        </span>
      </div>
    </div>
  )
}

export default DifficultyEngine
