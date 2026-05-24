import pdfParse from 'pdf-parse/lib/pdf-parse.js'

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 30,
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const buffer = await getRawBody(req)

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'No file received' })
    }

    const parsed = await pdfParse(buffer)
    return res.status(200).json({ text: parsed.text })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read PDF: ' + err.message })
  }
}