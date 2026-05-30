import { useState, useEffect } from 'react'

// Shared dark-mode state across PitchLens and BondLens.
// One key for the whole app so the preference follows the user between modes.
export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('lens-dark') === 'true' } catch { return false }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('lens-dark', dark) } catch { /* storage unavailable */ }
  }, [dark])

  return [dark, setDark]
}
