import Hero from '../components/Hero.tsx'
import HowItWorks from '../components/HowItWorks.tsx'
import Features from '../components/Features.tsx'
import GameShowcase from '../components/GameShowcase.tsx'
import LeaderboardSection from '../components/LeaderboardSection.tsx'
import NightStatsSection from '../components/NightStatsSection.tsx'
import NightControlPanel from '../components/NightControlPanel.tsx'
import Navbar from '../components/Navbar.tsx'
import Testimonials from '../components/Testimonials.tsx'
import FooterCTA from '../components/FooterCTA.tsx'

function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(140deg,#f0f9ff_0%,#ecfeff_35%,#fef3c7_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_9%_11%,rgba(56,189,248,0.28),transparent_20%),radial-gradient(circle_at_88%_18%,rgba(244,114,182,0.24),transparent_23%),radial-gradient(circle_at_20%_82%,rgba(250,204,21,0.22),transparent_20%),radial-gradient(circle_at_84%_78%,rgba(74,222,128,0.22),transparent_22%)]" />
      <div className="pointer-events-none absolute -left-20 top-44 h-56 w-56 rounded-full bg-cyan-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-32 h-56 w-56 rounded-full bg-pink-200/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="home-light-cosmos" aria-hidden="true">
        <div className="home-light-grid" />
        <div className="home-light-shape home-light-shape-a" />
        <div className="home-light-shape home-light-shape-b" />
        <div className="home-light-shape home-light-shape-c" />
        <span className="home-light-dot home-light-dot-1" />
        <span className="home-light-dot home-light-dot-2" />
        <span className="home-light-dot home-light-dot-3" />
        <span className="home-light-dot home-light-dot-4" />
        <span className="home-light-dot home-light-dot-5" />
      </div>
      {/* Night-only decorative layer; visible under .premium-dark */}
      <div className="home-night-cosmos" aria-hidden="true">
        <div className="home-night-grid" />
        <div className="home-night-gradient-orb home-night-gradient-orb-a" />
        <div className="home-night-gradient-orb home-night-gradient-orb-b" />
        <div className="home-night-gradient-orb home-night-gradient-orb-c" />
        <span className="home-night-star home-night-star-1" />
        <span className="home-night-star home-night-star-2" />
        <span className="home-night-star home-night-star-3" />
        <span className="home-night-star home-night-star-4" />
        <span className="home-night-star home-night-star-5" />
        <span className="home-night-star home-night-star-6" />
        <span className="home-night-star home-night-star-7" />
        <span className="home-night-star home-night-star-8" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <NightStatsSection />
          <NightControlPanel />
          <Features />
          <GameShowcase />
          <LeaderboardSection />
          <Testimonials />
          <HowItWorks />
        </main>
        <FooterCTA />
      </div>
    </div>
  )
}

export default HomePage
