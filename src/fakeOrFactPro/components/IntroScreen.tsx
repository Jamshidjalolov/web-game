import { AnimatePresence, motion } from 'framer-motion'
import { useFakeOrFactGame } from '../context/FakeOrFactGameContext.tsx'

function IntroScreen() {
  const { showIntro } = useFakeOrFactGame()

  return (
    <AnimatePresence>
      {showIntro ? (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-[radial-gradient(circle_at_top,#081226_0%,#030712_58%,#02040b_100%)]"
        >
          <div className="text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs font-extrabold uppercase tracking-[0.4em] text-cyan-200/78"
            >
              Sinf uchun premium shou
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, scale: 0.84, letterSpacing: '0.3em' }}
              animate={{ opacity: 1, scale: 1, letterSpacing: '0.06em' }}
              transition={{ duration: 0.85, delay: 0.15 }}
              className="mt-5 font-kid text-7xl uppercase leading-none text-white sm:text-8xl"
            >
              FAKE or FACT
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mt-5 text-lg font-black tracking-[0.14em] text-emerald-200"
            >
              Haqiqatni top!
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default IntroScreen
