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

IMPORTANT EXTRACTION RULES:

RATING: Populate "rating" (and "rating_details") ONLY from an explicit credit rating field or statement — for example a "Rating Indicator", "Current Rating", "Credit Rating", or an explicit rating assigned by a rating agency such as RAM Ratings or MARC (e.g. "AAA", "AA1", "AA-IS", "A+/A1"). NEVER derive a rating from the instrument name, programme name, Shariah concept, structure description, or any other descriptive text. If no explicit credit rating is stated anywhere in the documents, set "rating" to exactly "Not Rated" and leave the "rating_details" fields blank.

COVENANTS & DISSOLUTION: Summarise covenants and dissolution/event-of-default triggers in concise plain English that a fund manager could skim — do not copy long legal clauses verbatim. If a covenant category is not present, leave it blank.

SELLING RESTRICTIONS: Search across ALL uploaded documents for every reference to the CMSA schedules/sections that govern who may invest — for example Schedule 6 (or Section 229(1)(b)), Schedule 7 (or Section 230), Part 1 of Schedule 6 and 7, and any "sophisticated investor" / "qualified investor" language. A restriction may appear in only one of several documents; aggregate every distinct restriction found across all of them.

REGULATORY APPROVALS: Search across ALL uploaded documents for SC (Securities Commission Malaysia) approval or authorisation dates, BNM (Bank Negara Malaysia) references or approval dates, the approval expiry/validity period, and the sector classification. This information is often spread across different documents — scan every document, not just the first.

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
    "shariah_adviser": "",
    "principal_advisers": "",
    "lead_arrangers": "",
    "lead_managers": "",
    "solicitors_arranger": "",
    "solicitors_issuer": "",
    "shariah_advisers": "",
    "credit_rating_agency": "",
    "sustainability_framework_adviser": "",
    "independent_external_reviewer": ""
  },

  "issuer_profile": {
    "listed_status": "e.g. Listed / Unlisted / Public company",
    "stock_exchange": "",
    "listing_date": "",
    "principal_activities": "",
    "substantial_shareholders": "",
    "incorporation_date": "",
    "registration_number": ""
  },

  "rating_details": {
    "agency": "e.g. RAM Ratings, MARC",
    "rating": "the explicit rating symbol only, e.g. AAA, AA1, AA-IS",
    "final_or_indicative": "final / indicative",
    "amount_rated": "",
    "rating_type": "long_term / short_term"
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

  "options": {
    "call_option": "description of any issuer call / early redemption option, or 'None'",
    "put_option": "description of any investor put option, or 'None'",
    "convertible": "whether the notes are convertible (into equity etc.), or 'None'",
    "exchangeable": "whether the notes are exchangeable, or 'None'"
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

  "covenants_summary": {
    "positive_covenants": "short plain-English summary of what the issuer must do",
    "negative_covenants": "short plain-English summary of what the issuer is restricted from doing",
    "financial_covenants": "short plain-English summary of financial ratios/limits (e.g. gearing, finance-to-equity)",
    "information_covenants": "short plain-English summary of reporting/disclosure obligations"
  },

  "dissolution_events_summary": [
    "Each key dissolution / event-of-default trigger in plain English, e.g. 'Non-payment of any amount due', 'Breach of financial covenant', 'Cross-default on other indebtedness', 'Insolvency or winding-up of the issuer'"
  ],

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
