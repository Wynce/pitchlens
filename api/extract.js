export const config = {
  api: { bodyParser: false },
}

export default async function handler(req, res) {
  const chunks = []
  await new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', resolve)
    req.on('error', reject)
  })
  const buffer = Buffer.concat(chunks)
  return res.status(200).json({ received: buffer.length })
}