import { Link } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'
import DarkToggle from '../components/DarkToggle'

const BOND_NAVY = '#1E3A5F'

// Placeholder — the bond termsheet analyzer is built out in later steps.
export default function BondLens() {
  const [dark, setDark] = useDarkMode()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors flex flex-col">
      <header className="border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: BOND_NAVY }}>
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">BondLens</span>
          </Link>
          <DarkToggle dark={dark} setDark={setDark} />
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-20 pb-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
            Read termsheets like a senior banker.
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
            Upload bond or sukuk termsheet PDFs and instantly see a structured deal
            analysis. Built for capital markets professionals.
          </p>
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-12 text-center">
            <div className="text-4xl mb-3">🏗️</div>
            <p className="text-slate-500 dark:text-slate-400">The BondLens analyzer is coming together — check back soon.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 dark:border-slate-800 py-6">
        <p className="text-center text-xs text-slate-400">Built for capital markets professionals • Powered by Claude AI</p>
      </footer>
    </div>
  )
}
