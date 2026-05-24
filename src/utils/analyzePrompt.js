export async function analyzePitchDeck(data) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Analysis failed')
  }

  return response.json()
}