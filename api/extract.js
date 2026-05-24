import { extractText } from 'unpdf'
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
    const { text } = await extractText(new Uint8Array(buffer))

    return res.status(200).json({ text })
  } catch (err) {
    return res.status(500).json({ error: 'PDF processing failed: ' + err.message })
  }
}