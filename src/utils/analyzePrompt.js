export async function analyzePitchDeck(text, pageImages) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, pageImages }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Analysis failed')
  }

  return response.json()
}