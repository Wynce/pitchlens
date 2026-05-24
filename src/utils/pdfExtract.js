function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

export async function extractPDF(file) {
  if (isMobile()) {
    // Send raw PDF binary to server for text extraction — no base64, no overhead
    const buffer = await file.arrayBuffer()
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf' },
      body: buffer,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(err.error || 'Failed to process PDF')
    }

    const { text } = await response.json()
    return { mode: 'textonly', text, pageImages: [] }
  }

  // Desktop: hybrid text + page images via PDF.js
  const { extractDesktop } = await import('./pdfExtractDesktop.js')
  return extractDesktop(file)
}