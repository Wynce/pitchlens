import { useState } from 'react'
import { extractTextFromPDF } from './utils/pdfExtract'
import { analyzePitchDeck } from './utils/analyzePrompt'

const STATUS_COLORS = {
  found: 'bg-green-500',
  partial: 'bg-amber-500',
  missing: 'bg-red-500',
}

const STATUS_ICONS = {
  found: '✅',
  partial: '⚠️',
  missing: '❌',
}

export default function App() {
  const [apiKey, setApiKey] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    if (!file || !apiKey) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const text = await extractTextFromPDF(file)
      const analysis = await analyzePitchDeck(text, apiKey)
      setResult(analysis)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">🔍 PitchLens</h1>
      <p className="text-gray-500 mb-8">See your pitch clearly before the world does.</p>

      <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
        <input
          type="password"
          placeholder="Paste your Anthropic API key"
          className="w-full border rounded px-3 py-2 text-sm"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="text-sm"
        />
        <button
          onClick={handleAnalyze}
          disabled={!file || !apiKey || loading}
          className="bg-red-600 text-white px-6 py-2 rounded font-medium disabled:opacity-40"
        >
          {loading ? 'Analyzing...' : 'Analyze Pitch Deck'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Reading your pitch deck...</p>
          <p className="text-sm mt-2">This takes 10-20 seconds</p>
        </div>
      )}

      {result && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold">{result.company_name}</h2>
            <div className="text-4xl font-bold mt-2">
              {result.readiness_score} / 11
            </div>
            <p className="text-gray-600 mt-3">{result.overall_assessment}</p>
          </div>

          <div className="space-y-4">
            {result.sections.map((section) => (
              <div key={section.name} className="bg-white rounded-lg shadow p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span>{STATUS_ICONS[section.status]}</span>
                  <h3 className="font-semibold text-lg">{section.name}</h3>
                  <span className={`ml-auto text-xs text-white px-2 py-0.5 rounded ${STATUS_COLORS[section.status]}`}>
                    {section.status}
                  </span>
                </div>
                {section.content && (
                  <p className="text-gray-700 text-sm mb-3">{section.content}</p>
                )}
                {section.gaps?.length > 0 && section.gaps[0] !== '' && (
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Gap Questions:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {section.gaps.map((gap, i) => (
                        <li key={i}>• {gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
