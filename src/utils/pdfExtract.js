function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

export async function extractPDF(file) {
  if (isMobile()) {
    // FormData file upload — works on every browser including iOS Safari
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/extract', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to process PDF')
    }

    const { text } = await response.json()
    return { mode: 'textonly', text, pageImages: [] }
  }

  const { extractDesktop } = await import('./pdfExtractDesktop.js')
  return extractDesktop(file)
}