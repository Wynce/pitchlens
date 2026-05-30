import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { extractMultiplePDFs } from '../utils/pdfExtract'
import { analyzeBond } from '../utils/analyzeBond'
import { useDarkMode } from '../hooks/useDarkMode'
import DarkToggle from '../components/DarkToggle'

const NAVY = '#1E3A5F'
const GREEN = '#2ECC71'
const RED = '#E74C3C'
const TEAL = '#14b8a6'
const AMBER = '#f59e0b'
const GREY = '#94a3b8'
const PURPLE = '#8b5cf6'
const BLUE = '#3b82f6'

const TABS = [
  { id: 'snapshot', label: 'Snapshot' },
  { id: 'issuer', label: 'Issuer' },
  { id: 'terms', label: 'Key Terms' },
  { id: 'parties', label: 'Parties' },
  { id: 'rating', label: 'Rating' },
  { id: 'proceeds', label: 'Proceeds' },
  { id: 'security', label: 'Security' },
  { id: 'covenants', label: 'Covenants' },
  { id: 'options', label: 'Options' },
  { id: 'risks', label: 'Risks' },
  { id: 'gaps', label: 'Gaps' },
  { id: 'glossary', label: 'Glossary' },
]

const PARTY_LABELS = {
  issuer: 'Issuer',
  principal_advisers: 'Principal Adviser(s)',
  lead_arranger: 'Lead Arranger',
  lead_arrangers: 'Lead Arranger(s)',
  lead_managers: 'Lead Manager(s)',
  facility_agent: 'Facility Agent',
  trustee_security_agent: 'Trustee / Security Agent',
  paying_agent: 'Paying Agent',
  authorised_depository: 'Authorised Depository',
  solicitors_arranger: "Solicitors (Arranger)",
  solicitors_issuer: "Solicitors (Issuer)",
  shariah_adviser: 'Shariah Adviser',
  shariah_advisers: 'Shariah Adviser(s)',
  credit_rating_agency: 'Credit Rating Agency',
  sustainability_framework_adviser: 'Sustainability Framework Adviser',
  independent_external_reviewer: 'Independent External Reviewer',
}

const val = (x) => (x && String(x).trim() ? x : '—')
const has = (x) => x && String(x).trim() && x !== '—'

function ratingColor(rating) {
  if (!has(rating) || /not\s*rated|unrated|n\/?a|to be/i.test(rating)) return GREY
  if (/^\s*(aaa|aa|a)\b/i.test(rating)) return GREEN
  if (/^\s*(bbb|bb|b)\b/i.test(rating)) return AMBER
  return RED
}

function proceedsTag(label) {
  switch ((label || '').toLowerCase()) {
    case 'green': return { color: GREEN, icon: '🟢', text: 'Green' }
    case 'social': return { color: BLUE, icon: '🔵', text: 'Social' }
    case 'combined': return { color: PURPLE, icon: '🟣', text: 'Combined' }
    default: return null
  }
}

function Badge({ text, color }) {
  return (
    <span className="text-xs font-semibold px-3 py-1.5 rounded-full text-white max-w-full break-words text-center leading-tight" style={{ backgroundColor: color }}>
      {text}
    </span>
  )
}

function Field({ label, value }) {
  if (!has(value)) return null
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  )
}

function SectionShell({ id, title, show, children }) {
  if (!show) return null
  return (
    <section id={`sec-${id}`} className="scroll-mt-32">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">{title}</h2>
      {children}
    </section>
  )
}

function KeyTermCard({ icon, title, fields }) {
  const shown = fields.filter((f) => has(f.value))
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h3>
      </div>
      {shown.length ? (
        <div className="space-y-2">
          {shown.map((f) => (
            <div key={f.label} className="flex justify-between gap-3 text-sm">
              <span className="text-slate-400 dark:text-slate-500 shrink-0">{f.label}</span>
              <span className="text-slate-700 dark:text-slate-200 text-right">{f.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">Not specified</p>
      )}
    </div>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function SectionTabs({ active, onSelect }) {
  const tabsRef = useRef(null)
  useEffect(() => {
    const el = tabsRef.current?.querySelector(`[data-tab="${active}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [active])
  const cls = (on) =>
    `shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
      on ? 'text-[#1E3A5F] dark:text-blue-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
    }`
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 sticky top-[57px] z-10">
      <div className="max-w-5xl mx-auto">
        <div ref={tabsRef} className="flex overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button data-tab="all" onClick={() => onSelect('all')} className={cls(active === 'all')}
            style={active === 'all' ? { borderBottomColor: NAVY } : undefined}>All</button>
          {TABS.map((t) => (
            <button key={t.id} data-tab={t.id} onClick={() => onSelect(t.id)} className={cls(active === t.id)}
              style={active === t.id ? { borderBottomColor: NAVY } : undefined}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: NAVY }}>
        <span className="text-white text-sm font-bold">B</span>
      </div>
      <span className="text-lg font-bold text-slate-800 dark:text-slate-100">BondLens</span>
    </Link>
  )
}

export default function BondLens() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [extractDocs, setExtractDocs] = useState([])
  const [error, setError] = useState(null)
  const [active, setActive] = useState('all')
  const [dragOver, setDragOver] = useState(false)
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const [dark, setDark] = useDarkMode()
  const fileRef = useRef()

  const addFiles = (list) => {
    const incoming = Array.from(list || []).filter((f) => f.type === 'application/pdf')
    if (!incoming.length) {
      setError('Please upload PDF files.')
      return
    }
    setError(null)
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => f.name + f.size))
      const merged = [...prev]
      for (const f of incoming) {
        if (!seen.has(f.name + f.size)) merged.push(f)
      }
      return merged
    })
  }

  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))

  const handleAnalyze = async () => {
    if (!files.length) return
    setLoading(true); setError(null); setResult(null)
    try {
      const data = await extractMultiplePDFs(files)
      setExtractDocs(data.docs || [])
      const analysis = await analyzeBond(data)
      setResult(analysis); setActive('all')
    } catch (err) {
      if (err.code === 'TOO_LARGE') {
        setError(`A file (${err.size}MB) exceeds the upload limit. Try splitting or compressing the PDFs.`)
      } else {
        setError(err.message || 'Analysis failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadDemo = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/demo-tnb.json')
      if (!res.ok) throw new Error('Demo data unavailable')
      const analysis = await res.json()
      setExtractDocs([])
      setResult(analysis); setActive('all')
    } catch (err) {
      setError(err.message || 'Could not load demo')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFiles([]); setResult(null); setExtractDocs([]); setError(null); setActive('all'); setGlossaryOpen(false)
  }

  // ---------- Landing ----------
  if (!result && !loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors flex flex-col">
        <header className="border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Logo />
            <DarkToggle dark={dark} setDark={setDark} />
          </div>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-16 pb-10">
          <div className="max-w-2xl mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
              Termsheets, <span style={{ color: NAVY }} className="dark:text-blue-300">decoded.</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload bond or sukuk termsheet PDFs and get a structured deal analysis in seconds.
            </p>
          </div>

          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
              dragOver ? 'bg-blue-50 dark:bg-slate-900' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            style={dragOver ? { borderColor: NAVY } : undefined}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".pdf" multiple className="hidden"
              onChange={(e) => addFiles(e.target.files)} />
            <div className="text-4xl mb-3">☁️</div>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
              Drop termsheet PDFs here or <span style={{ color: NAVY }} className="font-semibold dark:text-blue-300">browse</span>
            </p>
            <p className="text-sm text-slate-400 mt-1">Select multiple files — Principal Terms, Other Terms, Facility Information…</p>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((f, i) => (
                <div key={f.name + i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg px-4 py-3">
                  <span className="text-lg">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{f.name}</p>
                    <p className="text-xs text-slate-400">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                    className="text-slate-400 hover:text-red-500 transition w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-950"
                    title="Remove">✕</button>
                </div>
              ))}
            </div>
          )}

          {error && <div className="mt-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm">{error}</div>}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {files.length > 0 && (
              <button onClick={handleAnalyze}
                className="text-white px-8 py-3 rounded-xl font-semibold text-lg transition-all hover:opacity-90"
                style={{ backgroundColor: NAVY }}>
                Analyze Termsheet{files.length > 1 ? 's' : ''} →
              </button>
            )}
            <button onClick={loadDemo}
              className="px-6 py-3 rounded-xl font-semibold text-lg border-2 text-[#1E3A5F] dark:text-blue-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-900"
              style={{ borderColor: NAVY }}>
              Try Demo →
            </button>
          </div>
          {files.length === 0 && (
            <p className="mt-3 text-sm text-slate-400">No file handy? Load a pre-analyzed TNB RM10bn Sukuk Wakalah deal.</p>
          )}
        </main>

        <footer className="border-t border-slate-100 dark:border-slate-800 py-6">
          <p className="text-center text-xs text-slate-400">Built for capital markets professionals • Powered by Claude AI</p>
        </footer>
      </div>
    )
  }

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin mx-auto mb-6"
            style={{ borderTopColor: NAVY }} />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Reading your termsheet...</h2>
          <p className="text-slate-400">Extracting deal terms across {files.length} document{files.length > 1 ? 's' : ''}</p>
          <p className="text-slate-400 text-sm mt-1">This takes 10-20 seconds</p>
        </div>
      </div>
    )
  }

  // ---------- Results ----------
  const r = result
  const snap = r.deal_snapshot || {}
  const parties = r.key_parties || {}
  const profit = r.profit_structure || {}
  const proceeds = r.use_of_proceeds || []
  const eligible = r.eligible_projects || {}
  const security = r.security_package || {}
  const restrictions = r.selling_restrictions || []
  const approvals = r.regulatory_approvals || {}
  const risks = r.risk_highlights || []
  const gaps = r.data_gaps || []
  const glossary = r.glossary || []
  const issuerProfile = r.issuer_profile || {}
  const ratingDetails = r.rating_details || {}
  const covenants = r.covenants_summary || {}
  const dissolution = r.dissolution_events_summary || []
  const options = r.options || {}
  const lowTextDocs = extractDocs.filter((d) => d.lowText)

  // New sections only clutter the "All" view when they hold data; their own
  // tab always renders (with a fallback) so the tab is never a dead end.
  const anyOf = (obj) => Object.values(obj).some(has)
  const secVisible = (id, hasContent) => active === id || (active === 'all' && hasContent)

  const isSRI = /sri|sustainab|green|social/i.test(r.programme_name || '') ||
    proceeds.some((p) => p.green_social_label && p.green_social_label.toLowerCase() !== 'none')

  const badges = []
  if (has(snap.programme_size)) badges.push({ text: snap.programme_size, color: NAVY })
  if (has(snap.islamic_concept)) badges.push({ text: snap.islamic_concept, color: TEAL })
  else if (has(snap.instrument_type)) badges.push({ text: snap.instrument_type, color: TEAL })
  if (isSRI) badges.push({ text: 'SRI / Sustainability', color: GREEN })
  badges.push({ text: has(snap.rating) ? snap.rating : 'Not Rated', color: ratingColor(snap.rating) })

  const show = (id) => active === 'all' || active === id

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <DarkToggle dark={dark} setDark={setDark} />
            <button onClick={handleReset}
              className="text-sm text-white px-3 min-h-11 inline-flex items-center justify-center rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: NAVY }}>
              ← New Analysis
            </button>
          </div>
        </div>
      </header>

      <SectionTabs active={active} onSelect={setActive} />

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        {/* Extraction warning — image-based / scanned PDFs */}
        {lowTextDocs.length > 0 && (
          <div className="flex gap-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-xl p-4">
            <span className="text-lg shrink-0">📷</span>
            <div className="text-sm text-amber-900 dark:text-amber-300 leading-relaxed">
              <p className="font-semibold mb-1">Limited text extracted from {lowTextDocs.length} document{lowTextDocs.length > 1 ? 's' : ''}</p>
              <p>
                {lowTextDocs.map((d) => d.name).join(', ')} appear{lowTextDocs.length > 1 ? '' : 's'} to be
                image-based or scanned — little selectable text was found. The analysis relies on page images for
                {lowTextDocs.length > 1 ? ' these' : ' this'} file{lowTextDocs.length > 1 ? 's' : ''} and may be less complete.
              </p>
            </div>
          </div>
        )}

        {/* Deal Snapshot hero */}
        <SectionShell id="snapshot" title="Deal Snapshot" show={show('snapshot')}>
          <Card className="!p-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{val(r.issuer_name)}</h1>
            {has(r.programme_name) && <p className="text-slate-500 dark:text-slate-400 mt-0.5">{r.programme_name}</p>}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {badges.map((b, i) => <Badge key={i} text={b.text} color={b.color} />)}
              </div>
            )}
            {has(r.overall_summary) && (
              <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">{r.overall_summary}</p>
            )}
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
              <Field label="Available Limit" value={snap.available_limit} />
              <Field label="Outstanding" value={snap.outstanding} />
              <Field label="Currency" value={snap.currency} />
              <Field label="Maturity" value={snap.maturity_date} />
              <Field label="Issue Price" value={snap.issue_price} />
              <Field label="Mode of Offer" value={snap.mode_of_offer} />
            </div>
          </Card>

          {(Object.values(approvals).some(has) || restrictions.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {Object.values(approvals).some(has) && (
                <Card>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Regulatory Approvals</h3>
                  <div className="space-y-2">
                    <Field label="SC Approval" value={approvals.sc_approval_date} />
                    <Field label="BNM Approval" value={approvals.bnm_approval_date} />
                    <Field label="Approval Expiry" value={approvals.approval_expiry} />
                    <Field label="Sector" value={approvals.sector_classification} />
                  </div>
                </Card>
              )}
              {restrictions.length > 0 && (
                <Card>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Selling Restrictions</h3>
                  <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                    {restrictions.map((s, i) => (
                      <li key={i} className="flex gap-2"><span className="text-slate-400 shrink-0">•</span><span>{s}</span></li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}
        </SectionShell>

        {/* Issuer Profile */}
        <SectionShell id="issuer" title="Issuer Profile" show={secVisible('issuer', anyOf(issuerProfile))}>
          <Card>
            {anyOf(issuerProfile) ? (
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                <Field label="Listed Status" value={issuerProfile.listed_status} />
                <Field label="Stock Exchange" value={issuerProfile.stock_exchange} />
                <Field label="Listing Date" value={issuerProfile.listing_date} />
                <Field label="Incorporation Date" value={issuerProfile.incorporation_date} />
                <Field label="Registration No." value={issuerProfile.registration_number} />
                <Field label="Principal Activities" value={issuerProfile.principal_activities} />
                <div className="sm:col-span-2">
                  <Field label="Substantial Shareholders" value={issuerProfile.substantial_shareholders} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No issuer profile details found.</p>
            )}
          </Card>
        </SectionShell>

        {/* Key Terms grid */}
        <SectionShell id="terms" title="Key Terms" show={show('terms')}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KeyTermCard icon="🏢" title="Issuer" fields={[
              { label: 'Name', value: r.issuer_name || parties.issuer },
              { label: 'Instrument', value: snap.instrument_type },
            ]} />
            <KeyTermCard icon="💰" title="Profit Rate" fields={[
              { label: 'Type', value: profit.profit_type },
              { label: 'Frequency', value: profit.payment_frequency },
              { label: 'Day Count', value: profit.day_count_basis },
            ]} />
            <KeyTermCard icon="📅" title="Tenure" fields={[
              { label: 'Programme', value: snap.tenor_programme },
              { label: 'Tranche 1', value: snap.tenor_tranche1 },
              { label: 'Maturity', value: snap.maturity_date },
            ]} />
            <KeyTermCard icon="🔒" title="Security" fields={[
              { label: 'Status', value: snap.security_status },
              { label: 'Ranking', value: security.ranking },
            ]} />
            <KeyTermCard icon="📜" title="Denomination" fields={[
              { label: 'Denomination', value: snap.denomination },
              { label: 'Issue Price', value: snap.issue_price },
              { label: 'Form', value: snap.form },
            ]} />
            <KeyTermCard icon="⚖️" title="Structure" fields={[
              { label: 'Islamic Concept', value: snap.islamic_concept },
              { label: 'Principle', value: snap.principle },
              { label: 'Mode of Offer', value: snap.mode_of_offer },
            ]} />
          </div>

          {Object.values(profit).some(has) && (
            <Card className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Profit Structure</h3>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                <Field label="Rate Description" value={profit.profit_rate_description} />
                <Field label="Benchmark" value={profit.floating_rate_benchmark} />
                <Field label="Spread" value={profit.spread} />
                <Field label="Maximum Rate" value={profit.maximum_rate} />
                <Field label="Ibra' Provision" value={profit.ibra_provision} />
              </div>
            </Card>
          )}
        </SectionShell>

        {/* Key Parties */}
        <SectionShell id="parties" title="Key Parties" show={show('parties')}>
          <Card>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {Object.entries(PARTY_LABELS).map(([key, label]) =>
                has(parties[key]) ? <Field key={key} label={label} value={parties[key]} /> : null
              )}
            </div>
            {!Object.values(parties).some(has) && <p className="text-sm text-slate-400">No party information found.</p>}
          </Card>
        </SectionShell>

        {/* Rating Details */}
        <SectionShell id="rating" title="Rating" show={secVisible('rating', anyOf(ratingDetails))}>
          <Card>
            {anyOf(ratingDetails) ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                {has(ratingDetails.rating) && (
                  <div className="shrink-0 flex flex-col items-center justify-center w-28 h-28 rounded-xl text-white"
                    style={{ backgroundColor: ratingColor(ratingDetails.rating) }}>
                    <span className="text-2xl font-bold">{ratingDetails.rating}</span>
                    {has(ratingDetails.rating_type) && (
                      <span className="text-[10px] uppercase tracking-wide opacity-90 mt-1">{ratingDetails.rating_type.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 flex-1">
                  <Field label="Agency" value={ratingDetails.agency} />
                  <Field label="Final / Indicative" value={ratingDetails.final_or_indicative} />
                  <Field label="Amount Rated" value={ratingDetails.amount_rated} />
                  <Field label="Rating Type" value={ratingDetails.rating_type && ratingDetails.rating_type.replace(/_/g, ' ')} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No explicit credit rating stated in the documents.</p>
            )}
          </Card>
        </SectionShell>

        {/* Use of Proceeds */}
        <SectionShell id="proceeds" title="Use of Proceeds" show={show('proceeds')}>
          {proceeds.length > 0 ? (
            <div className="space-y-3">
              {proceeds.map((p, i) => {
                const tag = proceedsTag(p.green_social_label)
                return (
                  <Card key={i} className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{val(p.category)}</h3>
                        {tag && <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: tag.color }}>{tag.icon} {tag.text}</span>}
                      </div>
                      {has(p.description) && <p className="text-sm text-slate-600 dark:text-slate-300">{p.description}</p>}
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card><p className="text-sm text-slate-400">No use-of-proceeds breakdown found.</p></Card>
          )}

          {Object.values(eligible).some(has) && (
            <Card className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Eligible Projects</h3>
              <div className="space-y-3">
                <Field label="🟢 Green Projects" value={eligible.green_projects} />
                <Field label="🔵 Social Projects" value={eligible.social_projects} />
                <Field label="Certification Requirements" value={eligible.certification_requirements} />
              </div>
            </Card>
          )}
        </SectionShell>

        {/* Security Package */}
        <SectionShell id="security" title="Security Package" show={show('security')}>
          <Card>
            {Object.values(security).some(has) ? (
              <div className="space-y-3">
                <Field label="Secured" value={security.secured_description} />
                <Field label="Unsecured" value={security.unsecured_description} />
                <Field label="Ranking" value={security.ranking} />
                <Field label="Sukuk Trustee Reimbursement Account" value={security.sukuk_trustee_reimbursement_account} />
              </div>
            ) : (
              <p className="text-sm text-slate-400">No security package details found.</p>
            )}
          </Card>
        </SectionShell>

        {/* Covenants & Dissolution Events */}
        <SectionShell id="covenants" title="Covenants & Events" show={secVisible('covenants', anyOf(covenants) || dissolution.length > 0)}>
          {anyOf(covenants) && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">✅ Positive Covenants</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{val(covenants.positive_covenants)}</p>
              </Card>
              <Card>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">🚫 Negative Covenants</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{val(covenants.negative_covenants)}</p>
              </Card>
              <Card>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">📊 Financial Covenants</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{val(covenants.financial_covenants)}</p>
              </Card>
              <Card>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">📄 Information Covenants</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{val(covenants.information_covenants)}</p>
              </Card>
            </div>
          )}

          {dissolution.length > 0 && (
            <Card className={anyOf(covenants) ? 'mt-4' : ''}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Dissolution / Trigger Events</h3>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {dissolution.map((d, i) => (
                  <li key={i} className="flex gap-2"><span className="shrink-0" style={{ color: RED }}>▸</span><span>{d}</span></li>
                ))}
              </ul>
            </Card>
          )}

          {!anyOf(covenants) && dissolution.length === 0 && (
            <Card><p className="text-sm text-slate-400">No covenant or dissolution-event details found.</p></Card>
          )}
        </SectionShell>

        {/* Options */}
        <SectionShell id="options" title="Options" show={secVisible('options', anyOf(options))}>
          <Card>
            {anyOf(options) ? (
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                <Field label="Call Option" value={options.call_option} />
                <Field label="Put Option" value={options.put_option} />
                <Field label="Convertible" value={options.convertible} />
                <Field label="Exchangeable" value={options.exchangeable} />
              </div>
            ) : (
              <p className="text-sm text-slate-400">No option features found.</p>
            )}
          </Card>
        </SectionShell>

        {/* Risk Highlights */}
        <SectionShell id="risks" title="Risk Highlights" show={show('risks')}>
          {risks.length > 0 ? (
            <div className="space-y-3">
              {risks.map((risk, i) => (
                <div key={i} className="flex gap-3 bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 rounded-xl p-4">
                  <span className="text-lg shrink-0">⚠️</span>
                  <p className="text-sm text-red-900 dark:text-red-300 leading-relaxed">{risk}</p>
                </div>
              ))}
            </div>
          ) : (
            <Card><p className="text-sm text-slate-400">No risk highlights identified.</p></Card>
          )}
        </SectionShell>

        {/* Data Gaps */}
        <SectionShell id="gaps" title="What's Not in These Documents" show={show('gaps')}>
          {gaps.length > 0 ? (
            <div className="space-y-3">
              {gaps.map((gap, i) => (
                <div key={i} className="flex gap-3 bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900 rounded-xl p-4">
                  <span className="text-lg shrink-0">📭</span>
                  <p className="text-sm text-amber-900 dark:text-amber-300 leading-relaxed">{gap}</p>
                </div>
              ))}
            </div>
          ) : (
            <Card><p className="text-sm text-slate-400">No notable data gaps identified.</p></Card>
          )}
        </SectionShell>

        {/* Glossary */}
        {glossary.length > 0 && (
          <SectionShell id="glossary" title="Glossary" show={show('glossary')}>
            <Card>
              <button onClick={() => setGlossaryOpen((o) => !o)}
                className="w-full flex items-center justify-between text-left">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {glossary.length} term{glossary.length > 1 ? 's' : ''} explained in plain English
                </span>
                <span className="text-slate-400">{glossaryOpen ? '▲' : '▼'}</span>
              </button>
              {glossaryOpen && (
                <div className="mt-4 space-y-3 divide-y divide-slate-100 dark:divide-slate-700">
                  {glossary.map((g, i) => (
                    <div key={i} className="pt-3 first:pt-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{g.term}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{g.definition}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </SectionShell>
        )}
      </div>

      <footer className="border-t border-slate-100 dark:border-slate-800 py-6">
        <p className="text-center text-xs text-slate-400">Built for capital markets professionals • Powered by Claude AI</p>
      </footer>
    </div>
  )
}
