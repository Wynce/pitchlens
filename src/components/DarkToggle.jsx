// Shared dark-mode toggle button used by both PitchLens and BondLens.
export default function DarkToggle({ dark, setDark }) {
  return (
    <button onClick={() => setDark(!dark)}
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-lg"
      title={dark ? 'Light mode' : 'Dark mode'}>
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
