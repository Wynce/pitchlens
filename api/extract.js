export const config = {
  api: { bodyParser: false },
  maxDuration: 30,
}

export default async function handler(req, res) {
  // Read body
  const chunks = []
  await new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', resolve)
    req.on('error', reject)
  })
  const buffer = Buffer.concat(chunks)

  if (buffer.length === 0) {
    return res.status(400).json({ error: 'No data', size: 0 })
  }

  // Debug: check what pdf-parse exports
  try {
    const mod = await import('pdf-parse/lib/pdf-parse.js')
    return res.status(200).json({
      size: buffer.length,
      modKeys: Object.keys(mod),
      typeDefault: typeof mod.default,
      typeModule: typeof mod,
    })
  } catch (e) {
    return res.status(500).json({ importError: e.message })
  }
}