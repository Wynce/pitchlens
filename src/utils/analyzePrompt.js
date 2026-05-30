export async function analyzePitchDeck(data) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: data.text,
      pageImages: data.pageImages || [],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    if (response.status === 504 || response.status === 502) {
      throw new Error('Analysis timed out — the deck may be too large. Try a smaller PDF.')
    }
    throw new Error(err.error || 'Analysis failed')
  }

  return response.json()
}