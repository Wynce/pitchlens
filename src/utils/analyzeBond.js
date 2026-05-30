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
    throw new Error(err.error || 'Analysis failed')
  }

  return response.json()
}
