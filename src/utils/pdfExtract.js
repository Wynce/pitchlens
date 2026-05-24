function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist')
  if (isMobile()) {
    // CDN worker avoids new URL() pattern that breaks on iOS Safari
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs'
  } else {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()
  }
  return pdfjsLib
}

export async function extractPDF(file) {
  const pdfjsLib = await loadPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''
  const pageImages = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)

    // Text extraction — works everywhere
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ')
    fullText += `\n--- Page ${i} ---\n${pageText}`

    // Page image rendering — desktop only
    if (!isMobile()) {
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
  }

  return {
    mode: pageImages.length > 0 ? 'hybrid' : 'textonly',
    text: fullText,
    pageImages,
  }
}