function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

export async function extractPDF(file) {
  if (isMobile()) {
    // Send file directly to server — no encoding, no PDF.js
    const response = await fetch('/api/extract', {
      method: 'POST',
      body: file,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || 'Could not process PDF')
    }

    const { text } = await response.json()
    return { text, pageImages: [] }
  }

  // Desktop only: load PDF.js
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''
  const pageImages = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)

    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ')
    fullText += `\n--- Page ${i} ---\n${pageText}`

    try {
      const scale = 0.75
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      await page.render({ canvasContext: ctx, viewport }).promise
      const jpeg = canvas.toDataURL('image/jpeg', 0.4).split(',')[1]
      pageImages.push(jpeg)
      canvas.width = 0
      canvas.height = 0
    } catch (e) {
      console.warn('Page image render failed:', e)
    }
  }

  return { text: fullText, pageImages }
}