import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FooterCTA from '../components/FooterCTA.tsx'
import Navbar from '../components/Navbar.tsx'
import FakeOrFactLobby from '../fakeOrFactPro/components/FakeOrFactLobby.tsx'
import ParticlesBackdrop from '../fakeOrFactPro/components/ParticlesBackdrop.tsx'
import type { FakeOrFactSetupConfig } from '../fakeOrFactPro/types.ts'
import {
  createFakeOrFactSessionKey,
  loadFakeOrFactCustomBank,
  loadFakeOrFactRanking,
  loadFakeOrFactSetup,
  saveFakeOrFactSession,
  saveFakeOrFactSetup,
} from '../fakeOrFactPro/utils/storage.ts'

const defaultSetupConfig: FakeOrFactSetupConfig = {
  roomName: 'FAKE or FACT PRO',
  mode: 'class',
  category: 'mix',
  startingDifficulty: 'easy',
  roundCount: 10,
  teamNames: ['Faktchilar', 'Tekshiruvchilar'],
  soundEnabled: true,
  fullscreenPreferred: false,
  customQuestions: [],
}

function FakeOrFactProSetupPage() {
  const navigate = useNavigate()
  const ranking = useMemo(() => loadFakeOrFactRanking(), [])
  const initialConfig = useMemo<FakeOrFactSetupConfig>(() => {
    const saved = loadFakeOrFactSetup()
    const customQuestions = loadFakeOrFactCustomBank()

    return {
      ...defaultSetupConfig,
      ...saved,
      teamNames: [
        saved?.teamNames?.[0]?.trim() || defaultSetupConfig.teamNames[0],
        saved?.teamNames?.[1]?.trim() || defaultSetupConfig.teamNames[1],
      ],
      customQuestions: customQuestions.length > 0
        ? customQuestions
        : (saved?.customQuestions ?? defaultSetupConfig.customQuestions),
    }
  }, [])

  const handleStart = async (config: FakeOrFactSetupConfig) => {
    saveFakeOrFactSetup(config)
    const sessionKey = createFakeOrFactSessionKey()
    saveFakeOrFactSession(sessionKey, config)
    navigate(`/games/fake-or-fact-pro/arena?session=${encodeURIComponent(sessionKey)}`)
  }

  return (
    <div className="fakefact-shell relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_10%,#0d214b_0%,transparent_30%),radial-gradient(circle_at_84%_16%,#3a1654_0%,transparent_30%),radial-gradient(circle_at_18%_86%,#0a3d56_0%,transparent_34%),linear-gradient(165deg,#040914_0%,#0a1023_52%,#150b31_100%)] text-white">
      <div className="fakefact-shell-glow pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_14%,rgba(34,211,238,0.22),transparent_24%),radial-gradient(circle_at_90%_18%,rgba(244,114,182,0.18),transparent_26%),radial-gradient(circle_at_26%_86%,rgba(34,197,94,0.14),transparent_20%)]" />
      <ParticlesBackdrop />

      <div className="relative z-10">
        <Navbar />
        <main className="fakefact-page-main mx-auto max-w-[1440px] px-4 pb-16 pt-10 sm:px-6">
          <FakeOrFactLobby
            initialConfig={initialConfig}
            ranking={ranking}
            onStart={handleStart}
          />
        </main>
        <FooterCTA />
      </div>
    </div>
  )
}

export default FakeOrFactProSetupPage
