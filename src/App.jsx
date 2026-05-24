import { useState, useRef } from 'react'
import { extractTextFromPDF } from './utils/pdfExtract'
import { analyzePitchDeck } from './utils/analyzePrompt'

const PITCHIN_RED = '#C8102E'

const STATUS_CONFIG = {
  found: { color: 'bg-emerald-500', icon: '✅', label: 'Found' },
  partial: { color: 'bg-amber-500', icon: '⚠️', label: 'Partial' },
  missing: { color: 'bg-red-500', icon: '❌', label: 'Missing' },
}

const SECTION_ICONS = {
  'Summary': '📋', 'Problem': '🎯', 'Solution': '💡', 'Business Model': '💰',
  'Market': '📊', 'Competition': '⚔️', 'Funding': '🏦', 'Vision': '🔭',
  'Founders': '👥', 'Investment Terms': '📜', 'Disclosure': '⚠️',
}

function ScoreRing({ score, total = 11 }) {
  const pct = score / total
  const r = 54, circ = 2 * Math.PI * r
  const color = pct >= 0.7 ? '#22c55e' : pct >= 0.4 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x="60" y="55" textAnchor="middle" className="text-2xl font-bold" fill="#1e293b"
          style={{ fontSize: '28px', fontWeight: 700 }}>{score}</text>
        <text x="60" y="75" textAnchor="middle" fill="#94a3b8"
          style={{ fontSize: '14px' }}>/ {total}</text>
      </svg>
      <p className="text-sm text-slate-500 mt-1">Readiness Score</p>
    </div>
  )
}

function SectionCard({ section, isActive, onClick }) {
  const config = STATUS_CONFIG[section.status]
  const icon = SECTION_ICONS[section.name] || '📄'

  return (
    <div
      id={`section-${section.name}`}
      onClick={onClick}
      className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isActive ? 'border-red-500 shadow-md' : 'border-slate-100'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xl">{icon}</span>
        <h3 className="font-semibold text-slate-800 text-lg flex-1">{section.name}</h3>
        <span className={`text-xs text-white px-2.5 py-1 rounded-full font-medium ${config.color}`}>
          {config.label}
        </span>
      </div>

      {section.content && (
        <p className="text-slate-600 text-sm leading-relaxed mb-3 line-clamp-4">{section.content}</p>
      )}

      {section.gaps?.length > 0 && section.gaps[0] !== '' && (
        <div className="bg-red-50 rounded-lg p-4 mt-3 border border-red-100">
          <p className="text-xs font-semibold text-red-700 mb-2 uppercase tracking-wide">Questions to Address</p>
          <ul className="text-sm text-red-900 space-y-2">
            {section.gaps.map((gap, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-red-400 mt-0.5 shrink-0">→</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f)
      setFileName(f.name)
      setError(null)
    } else if (f) {
      setError('Please upload a PDF file.')
    }
  }

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const text = await extractTextFromPDF(file)
      const analysis = await analyzePitchDeck(text)
      setResult(analysis)
      if (analysis.sections?.length) setActiveSection(analysis.sections[0].name)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setFileName('')
    setResult(null)
    setError(null)
    setActiveSection(null)
  }

  const copyGapQuestions = () => {
    if (!result) return
    const gaps = result.sections
      .filter(s => s.gaps?.length > 0 && s.gaps[0] !== '')
      .map(s => `${s.name}:\n${s.gaps.map(g => `  • ${g}`).join('\n')}`)
      .join('\n\n')
    navigator.clipboard.writeText(gaps)
    alert('Gap questions copied to clipboard!')
  }

  // Landing / Upload view
  if (!result && !loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: PITCHIN_RED }}>
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="text-xl font-bold text-slate-800">PitchLens</span>
          </div>
        </header>

        {/* Hero */}
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-10">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-4">
              See your pitch clearly<br />
              <span style={{ color: PITCHIN_RED }}>before the world does.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed">
              Upload your pitch deck and instantly see how it maps to PitchIN's
              campaign format. Know what's covered, what's missing, and what
              questions you need to answer.
            </p>
          </div>
        </div>

        {/* Upload area */}
        <div className="max-w-5xl mx-auto px-6 pb-20">
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
              dragOver
                ? 'border-red-400 bg-red-50'
                : fileName
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {fileName ? (
              <div>
                <div className="text-4xl mb-3">📄</div>
                <p className="text-lg font-medium text-slate-700">{fileName}</p>
                <p className="text-sm text-slate-400 mt-1">Ready to analyze</p>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-3">☁️</div>
                <p className="text-lg font-medium text-slate-600">
                  Drop your pitch deck here or <span style={{ color: PITCHIN_RED }} className="font-semibold">browse</span>
                </p>
                <p className="text-sm text-slate-400 mt-1">PDF files up to 20MB</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          {fileName && (
            <button
              onClick={handleAnalyze}
              className="mt-6 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-all hover:opacity-90"
              style={{ backgroundColor: PITCHIN_RED }}
            >
              Analyze Pitch Deck →
            </button>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-100 py-6">
          <p className="text-center text-xs text-slate-400">
            Built for PitchIN campaign readiness • Powered by Claude AI
          </p>
        </footer>
      </div>
    )
  }

  // Loading view
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-red-500 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Reading your pitch deck...</h2>
          <p className="text-slate-400">Mapping content to PitchIN's 11 campaign sections</p>
          <p className="text-slate-400 text-sm mt-1">This takes 10-20 seconds</p>
        </div>
      </div>
    )
  }

  // Results view
  const found = result.sections.filter(s => s.status === 'found').length
  const partial = result.sections.filter(s => s.status === 'partial').length
  const missing = result.sections.filter(s => s.status === 'missing').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: PITCHIN_RED }}>
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="text-lg font-bold text-slate-800">PitchLens</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copyGapQuestions}
              className="text-sm border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition"
            >
              📋 Copy Gap Questions
            </button>
            <button
              onClick={handleReset}
              className="text-sm text-white px-4 py-2 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: PITCHIN_RED }}
            >
              ← New Analysis
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <div className="sticky top-20 space-y-6">
            {/* Score */}
            <div className="bg-white rounded-xl border border-slate-100 p-6 flex flex-col items-center">
              <ScoreRing score={result.readiness_score} />
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">✅ Found</span><span className="font-semibold text-emerald-600">{found}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">⚠️ Partial</span><span className="font-semibold text-amber-600">{partial}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">❌ Missing</span><span className="font-semibold text-red-600">{missing}</span></div>
            </div>

            {/* Section nav */}
            <nav className="bg-white rounded-xl border border-slate-100 p-3 space-y-1">
              {result.sections.map((s) => (
                <button
                  key={s.name}
                  onClick={() => {
                    setActiveSection(s.name)
                    document.getElementById(`section-${s.name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg flex items-center gap-2 transition ${
                    activeSection === s.name
                      ? 'bg-red-50 text-red-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_CONFIG[s.status].color}`} />
                  {s.name}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Company header */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 mb-6">
            <h1 className="text-2xl font-bold text-slate-800">{result.company_name}</h1>
            <p className="text-slate-500 mt-2 leading-relaxed">{result.overall_assessment}</p>
          </div>

          {/* Mobile score (hidden on desktop) */}
          <div className="lg:hidden bg-white rounded-xl border border-slate-100 p-6 mb-6 flex justify-center">
            <ScoreRing score={result.readiness_score} />
          </div>

          {/* Section cards */}
          <div className="space-y-4">
            {result.sections.map((section) => (
              <SectionCard
                key={section.name}
                section={section}
                isActive={activeSection === section.name}
                onClick={() => setActiveSection(section.name)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}