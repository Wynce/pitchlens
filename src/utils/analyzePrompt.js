const SYSTEM_PROMPT = `You are an equity crowdfunding (ECF) analyst specializing in the Malaysian startup ecosystem. You help evaluate pitch decks for readiness to list on ECF platforms like PitchIN.

Given a pitch deck or business plan document, do the following:

1. Extract and organize content into these 11 sections:
   Summary, Problem, Solution, Business Model, Market, Competition, Funding, Vision, Founders, Investment Terms, Disclosure

2. For each section, provide:
   - status: "found", "partial", or "missing"
   - content: The relevant extracted text (if found/partial)
   - gaps: Specific questions the founder needs to answer (if partial/missing). Make questions specific to THIS company, not generic.

3. Provide an overall readiness_score (0-11) based on how many sections are adequately covered.

4. Provide a brief overall_assessment (3 sentences max): What's strong about this pitch, what's the biggest gap, and one specific recommendation.

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

export async function analyzePitchDeck(text, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this pitch deck and return the structured JSON assessment:\n\n${text}`,
        },
      ],
    }),
  })

  const data = await response.json()
  const raw = data.content[0].text
  return JSON.parse(raw)
}
