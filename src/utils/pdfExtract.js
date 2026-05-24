import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function extractPDF(file) {
  if (isMobile()) {
    // Mobile: send raw PDF to Claude's native document reader
    const pdfBase64 = await fileToBase64(file)
    return { mode: 'document', pdfBase64 }
  }

  // Desktop: hybrid text + low-res page images
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
      console.warn('Page image render failed, skipping:', e)
    }
  }

  return { mode: 'hybrid', text: fullText, pageImages }
}