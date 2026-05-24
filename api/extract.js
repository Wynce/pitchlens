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

  let buffer
  try {
    buffer = await getRawBody(req)
  } catch (err) {
    return res.status(500).json({ error: 'Body read failed: ' + err.message })
  }

  if (!buffer || buffer.length === 0) {
    return res.status(400).json({ error: 'Empty body received' })
  }

  let pdfParse
  try {
    const mod = await import('pdf-parse/lib/pdf-parse.js')
    pdfParse = mod.default
  } catch (err) {
    return res.status(500).json({ error: 'pdf-parse load failed: ' + err.message })
  }

  try {
    const parsed = await pdfParse(buffer)
    return res.status(200).json({ text: parsed.text })
  } catch (err) {
    return res.status(500).json({ error: 'PDF parse failed: ' + err.message })
  }
}