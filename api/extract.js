import pdfParse from 'pdf-parse/lib/pdf-parse.js'

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 30,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Read raw binary from request
    const chunks = []
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'No file received' })
    }

    // Extract text server-side
    const parsed = await pdfParse(buffer)
    return res.status(200).json({ text: parsed.text })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read PDF: ' + err.message })
  }
}