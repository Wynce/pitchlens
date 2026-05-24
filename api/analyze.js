export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
  maxDuration: 60,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { mode, pdfBase64, text, pageImages } = req.body

  if (!mode) {
    return res.status(400).json({ error: 'No data provided' })
  }

  const SYSTEM_PROMPT = `You are an equity crowdfunding (ECF) analyst specialising in the Malaysian startup ecosystem. You help evaluate pitch decks for readiness to list on ECF platforms like PitchIN.

Given a pitch deck or business plan document, do the following:

1. Extract and organize content into these 11 sections:
   Summary, Problem, Solution, Business Model, Market, Competition, Funding, Vision, Founders, Investment Terms, Disclosure

2. For each section, provide:
   - status: "found", "partial", or "missing"
   - content: The relevant extracted text (if found/partial). READ ALL CHARTS, DIAGRAMS, TABLES, AND INFOGRAPHICS carefully — extract the data and key figures from them.
   - gaps: Specific questions the founder needs to answer (if partial/missing). Make questions specific to THIS company, not generic.

3. Provide an overall readiness_score (0-11) based on how many sections are adequately covered.

4. Provide a brief overall_assessment (3 sentences max): What's strong about this pitch, what's the biggest gap, and one specific recommendation.

IMPORTANT: Many pitch decks contain critical information in charts, diagrams, tables, competitor matrices, market sizing visuals, fund allocation pie charts, revenue model diagrams, and team photos with titles. You MUST read and extract data from these visual elements.

Only extract what is in the document. Do not infer or fabricate.

Respond ONLY in JSON format with no preamble or markdown.
Use this structure:
{
  "company_name": "",
  "readiness_score": 0,
  "overall_assessment": "",
  "sections": [
    {
      "name": "Summary",
      "status": "found|partial|missing",
      "content": "",
      "gaps": [""]
    }
  ]
}`

  let messageContent

  if (mode === 'document' && pdfBase64) {
    // Native PDF document mode
    messageContent = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
      },
      {
        type: 'text',
        text: 'Analyze this pitch deck. Pay special attention to charts, diagrams, tables, and visual elements.',
      },
    ]
  } else {
    // Text-only or hybrid mode
    messageContent = [
      {
        type: 'text',
        text: `Extracted text from the pitch deck:\n\n${text}`,
      },
    ]

    if (pageImages && pageImages.length > 0) {
      messageContent.push({
        type: 'text',
        text: 'Page images for reading charts, diagrams, and visual elements:',
      })
      for (const img of pageImages) {
        messageContent.push({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: img },
        })
      }
    }

    messageContent.push({
      type: 'text',
      text: 'Return the structured JSON assessment.',
    })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: messageContent }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' })
    }

    const raw = data.content[0].text
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const result = JSON.parse(cleaned)
    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}