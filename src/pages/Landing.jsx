import { Link } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'
import DarkToggle from '../components/DarkToggle'

const PITCHIN_RED = '#C8102E'
const BOND_NAVY = '#1E3A5F'

function ModeCard({ to, accent, badge, badgeText, title, tagline, blurb, cta }) {
  return (
    <Link to={to}
      className="group relative flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{ '--accent': accent }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: accent }}>
          <span className="text-white text-lg font-bold">{badge}</span>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: accent }}>
          {badgeText}
        </span>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{title}</h2>
      <p className="text-sm font-medium mb-4" style={{ color: accent }}>{tagline}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex-1">{blurb}</p>
      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2.5 rounded-xl self-start transition-opacity group-hover:opacity-90"
        style={{ backgroundColor: accent }}>
        {cta} →
      </span>
    </Link>
  )
}

export default function Landing() {
  const [dark, setDark] = useDarkMode()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors flex flex-col">
      <header className="border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 dark:bg-white">
              <span className="text-white dark:text-slate-900 text-sm font-bold">◎</span>
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">Lens</span>
          </div>
          <DarkToggle dark={dark} setDark={setDark} />
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-16 pb-10">
        <div className="max-w-2xl mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
            Turn dense documents into clear deal analysis.
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
            Two AI analysts in one place. Choose the lens that fits your document.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <ModeCard
            to="/pitchlens"
            accent={PITCHIN_RED}
            badge="P"
            badgeText="ECF Pitch Decks"
            title="PitchLens"
            tagline="See your pitch clearly before the world does."
            blurb="Upload a pitch deck and instantly see how it maps to PitchIN's campaign format — what's covered, what's missing, and the questions you need to answer."
            cta="Open PitchLens"
          />
          <ModeCard
            to="/bondlens"
            accent={BOND_NAVY}
            badge="B"
            badgeText="Bond & Sukuk Termsheets"
            title="BondLens"
            tagline="Read termsheets like a senior banker."
            blurb="Upload bond or sukuk termsheet PDFs and instantly see a structured deal analysis — built for capital markets professionals."
            cta="Open BondLens"
          />
        </div>
      </main>

      <footer className="border-t border-slate-100 dark:border-slate-800 py-6">
        <p className="text-center text-xs text-slate-400">Powered by Claude AI</p>
      </footer>
    </div>
  )
}
