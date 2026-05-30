export async function analyzeBond(data) {
  const response = await fetch('/api/analyze-bond', {
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
      throw new Error('Analysis timed out — try fewer or smaller documents.')
    }
    throw new Error(err.error || 'Analysis failed')
  }

  return response.json()
}
