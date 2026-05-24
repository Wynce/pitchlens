export const config = {
  api: { bodyParser: false },
  maxDuration: 30,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const chunks = []
  await new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', resolve)
    req.on('error', reject)
  })
  const buffer = Buffer.concat(chunks)

  if (buffer.length === 0) {
    return res.status(400).json({ error: 'No data received' })
  }

  try {
    // Use pdfjs-dist directly — already installed, no extra deps
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

    const doc = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    }).promise

    let fullText = ''
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items.map(item => item.str).join(' ')
      fullText += pageText + '\n'
    }

    return res.status(200).json({ text: fullText, pages: doc.numPages })
  } catch (err) {
    return res.status(500).json({ error: 'PDF parse error: ' + err.message })
  }
}