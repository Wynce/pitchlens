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

  const { text, pageImages } = req.body

  if (!text) {
    return res.status(400).json({ error: 'No text provided' })
  }

  const SYSTEM_PROMPT = `You are a senior investment banking analyst specialising in Malaysian debt capital markets (DCM). You analyze bond and sukuk termsheets from BNM's FAST system and similar sources.

Given one or more termsheet documents, extract and structure the information into the following sections. Only extract what is in the documents. Do not infer or fabricate. If information is not found, mark it clearly.

Respond ONLY in JSON format with no preamble or markdown. Use this structure:

{
  "issuer_name": "",
  "programme_name": "",
  "overall_summary": "2-3 sentence executive summary of this deal — what it is, why it matters, key highlights. Write as if briefing a fund manager at 7am.",

  "deal_snapshot": {
    "programme_size": "",
    "available_limit": "",
    "outstanding": "",
    "currency": "",
    "tenor_programme": "",
    "tenor_tranche1": "",
    "maturity_date": "",
    "instrument_type": "",
    "islamic_concept": "",
    "principle": "",
    "security_status": "",
    "rating": "",
    "issue_price": "",
    "denomination": "",
    "form": "",
    "mode_of_offer": ""
  },

  "key_parties": {
    "issuer": "",
    "lead_arranger": "",
    "facility_agent": "",
    "trustee_security_agent": "",
    "paying_agent": "",
    "authorised_depository": "",
    "shariah_adviser": ""
  },

  "profit_structure": {
    "profit_type": "fixed / floating / both",
    "profit_rate_description": "",
    "payment_frequency": "",
    "day_count_basis": "",
    "floating_rate_benchmark": "",
    "spread": "",
    "maximum_rate": "",
    "ibra_provision": ""
  },

  "use_of_proceeds": [
    {
      "category": "e.g. Project Financing, Working Capital, Profit Payment, etc.",
      "description": "",
      "green_social_label": "green / social / combined / none"
    }
  ],

  "eligible_projects": {
    "green_projects": "",
    "social_projects": "",
    "certification_requirements": ""
  },

  "security_package": {
    "secured_description": "",
    "unsecured_description": "",
    "ranking": "",
    "sukuk_trustee_reimbursement_account": ""
  },

  "selling_restrictions": [
    "e.g. Schedule 6 or Section 229(1)(b) of the CMSA — Sophisticated investors"
  ],

  "regulatory_approvals": {
    "sc_approval_date": "",
    "bnm_approval_date": "",
    "approval_expiry": "",
    "sector_classification": ""
  },

  "risk_highlights": [
    "Each risk as a factual observation from the documents, e.g. 'Programme is currently unrated — individual tranche ratings to be determined per issuance', 'Single-sector exposure to real estate', 'Construction-phase financing risk'"
  ],

  "data_gaps": [
    "Information NOT found in the uploaded documents that an investor would typically need, e.g. 'Credit rating report not included', 'Specific project details not disclosed', 'Financial statements of issuer not provided'"
  ],

  "glossary": [
    {
      "term": "e.g. Murabahah",
      "definition": "Plain English explanation in 1-2 sentences"
    }
  ]
}`

  const contentBlocks = [
    { type: 'text', text: 'Extracted text from the termsheet document(s):\n\n' + text },
  ]

  if (pageImages && pageImages.length > 0) {
    contentBlocks.push({
      type: 'text',
      text: 'Page images for reading tables, schedules, and visual elements:',
    })
    for (const img of pageImages) {
      contentBlocks.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: img },
      })
    }
  }

  contentBlocks.push({
    type: 'text',
    text: 'Analyze these termsheet document(s) together and return the structured JSON deal analysis.',
  })

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
        messages: [{ role: 'user', content: contentBlocks }],
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
