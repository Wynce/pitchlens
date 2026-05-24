function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

export async function extractPDF(file) {
  if (isMobile()) {
    // Send raw PDF binary to server — no base64, no overhead
    const buffer = await file.arrayBuffer()

    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf' },
      body: buffer,
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Server error')
    }

    return { mode: 'textonly', text: result.text, pageImages: [] }
  }

  // Desktop: hybrid text + page images via PDF.js
  const { extractDesktop } = await import('./pdfExtractDesktop.js')
  return extractDesktop(file)
}