function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

async function extractViaDirect(file) {
  const response = await fetch('/api/extract', {
    method: 'POST',
    body: file,
  })
  if (!response.ok) {
    if (response.status === 413) {
      throw { code: 'TOO_LARGE', size: (file.size / 1024 / 1024).toFixed(1) }
    }
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Could not process PDF')
  }
  const { text } = await response.json()
  return { text, pageImages: [] }
}

async function extractViaBlob(file) {
  const { upload } = await import('@vercel/blob/client')
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
  })

  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blobUrl: blob.url }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Could not process PDF')
  }

  const { text } = await response.json()
  return { text, pageImages: [] }
}

export { extractViaBlob }

// Strip structural markers (page dividers, whitespace) to estimate how much
// *real* text a PDF yielded. Image-based / scanned PDFs return almost none.
function meaningfulCharCount(text) {
  return (text || '')
    .replace(/---\s*Page\s*\d+\s*---/gi, '')
    .replace(/\s+/g, '')
    .length
}

// Below this many real characters a document is treated as image-based /
// scanned and flagged so the UI can warn the user.
const LOW_TEXT_THRESHOLD = 100

// Collapse the whitespace that PDF extraction leaves behind (column padding,
// blank lines, runs of spaces) without losing any words. Termsheets are
// whitespace-heavy, and trimming it cuts the token count we send to Claude —
// keeping multi-document analysis under the serverless function timeout.
function squeezeText(text) {
  return (text || '')
    .replace(/[ \t]+/g, ' ')        // runs of spaces/tabs -> single space
    .replace(/ *\n */g, '\n')        // strip spaces around line breaks
    .replace(/\n{3,}/g, '\n\n')      // 3+ blank lines -> one blank line
    .trim()
}

// BondLens: extract several termsheet PDFs in one pass, labelling each
// document so Claude can analyze them together. Returns concatenated,
// labelled text, the combined page images across all files, and per-document
// extraction metadata (so the UI can flag image-based PDFs that yielded no text).
export async function extractMultiplePDFs(files) {
  const labelledTexts = []
  const pageImages = []
  const docs = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const { text: rawText, pageImages: imgs } = await extractPDF(file)
    const text = squeezeText(rawText)
    labelledTexts.push(`=== Document ${i + 1}: ${file.name} ===\n${text}`)
    if (imgs?.length) pageImages.push(...imgs)
    const chars = meaningfulCharCount(text)
    docs.push({ name: file.name, chars, lowText: chars < LOW_TEXT_THRESHOLD })
  }

  return { text: labelledTexts.join('\n\n'), pageImages, docs }
}

export async function extractPDF(file) {
  if (isMobile()) {
    return extractViaDirect(file)
  }

  // Desktop: hybrid text + page images via PDF.js
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