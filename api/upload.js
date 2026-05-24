import { handleUpload } from '@vercel/blob/client'

export default async function handler(req, res) {
  const body = req.body
  try {
    const response = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['application/pdf'],
        maximumSizeInBytes: 50 * 1024 * 1024,
      }),
      onUploadCompleted: async () => {},
    })
    return res.status(200).json(response)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
}