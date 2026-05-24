export async function analyzePitchDeck(pdfBase64) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfBase64 }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Analysis failed')
  }

  return response.json()
}