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

  // Read raw body
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

  // Extract PDF text
  try {
    const pdfParse = (await import('pdf-parse')).default
    const result = await pdfParse(buffer)
    return res.status(200).json({ text: result.text, pages: result.numpages })
  } catch (err) {
    return res.status(500).json({ error: 'PDF parse error: ' + err.message })
  }
}