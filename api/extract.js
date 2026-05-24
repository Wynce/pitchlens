import { IncomingForm } from 'formidable'
import { readFileSync } from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 30,
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: 50 * 1024 * 1024 })
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

async function extractTextFromPDF(buffer) {
  // Try unpdf first
  try {
    const { extractText } = await import('unpdf')
    const result = await extractText(new Uint8Array(buffer))
    if (result.text) return result.text
  } catch (e) {
    console.log('unpdf failed:', e.message)
  }

  // Fallback: pdf-parse
  try {
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js')
    const result = await pdfParse(buffer)
    if (result.text) return result.text
  } catch (e) {
    console.log('pdf-parse failed:', e.message)
  }

  throw new Error('Could not extract text from this PDF')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { files } = await parseForm(req)
    const uploaded = files.file?.[0] || files.file

    if (!uploaded) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const buffer = readFileSync(uploaded.filepath)
    const text = await extractTextFromPDF(buffer)

    return res.status(200).json({ text })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}