# BondLens — Product Requirements Document

## For Claude Code: Build this app from start to finish

---

## 1. What Is BondLens

BondLens is a web app that takes bond/sukuk termsheet PDFs (from Malaysia's FAST system or similar) and transforms them into an engaging, structured visual analysis — the way a senior investment banker would present a deal to an investor, not how a lawyer would draft it.

**Built by:** Alyssa Low — BSc Banking & Finance (FinTech) graduate, currently in payment operations, targeting investment banking / capital markets roles.

**Sister product:** PitchLens (pitchlens-summary.vercel.app) — same concept for ECF pitch decks. BondLens follows the same architecture.

**Live resume for context:** alyssa-low-resume.vercel.app

---

## 2. Architecture — Fork PitchLens

BondLens is a fork of PitchLens with a new prompt, new UI sections, and multi-file upload. The core pipeline is identical: PDF upload → Claude API extracts + analyzes → render structured results.

### Stack (identical to PitchLens)
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Vercel Serverless Functions (Node.js)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **PDF Parsing:** PDF.js (client-side on desktop), server-side extraction (mobile)
- **Deployment:** Vercel
- **Domain:** bondlens.vercel.app

### PitchLens File Structure (reference — replicate this)
```
bondlens/
├── api/
│   ├── analyze.js          # Vercel serverless — Claude API call (NEW PROMPT)
│   ├── extract.js          # Server-side PDF text extraction (REUSE)
│   └── upload.js           # Blob upload for large files (REUSE)
├── public/
│   └── favicon.svg         # New BondLens icon
├── src/
│   ├── App.jsx             # Main app — landing, loading, results (NEW UI)
│   ├── index.css           # Tailwind base (REUSE)
│   ├── main.jsx            # Entry point (REUSE)
│   └── utils/
│       ├── analyzePrompt.js  # Client-side API caller (MINOR CHANGE)
│       ├── pdfExtract.js     # PDF.js extraction (CHANGE — multi-file)
│       └── exportPdf.js      # PDF export (ADAPT for bond layout)
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── .env.local              # ANTHROPIC_API_KEY (local dev only)
```

### Environment Variables (Vercel)
```
ANTHROPIC_API_KEY=sk-ant-...
BLOB_READ_WRITE_TOKEN=vercel_blob_...  (only if using blob upload for large files)
```

---

## 3. Key Difference from PitchLens: Multi-File Upload

A real FAST listing has multiple attachments (Principal Terms, Other Terms, Facility Information). BondLens must accept multiple PDFs in one upload.

### Implementation
1. `<input type="file" multiple accept=".pdf" />` — allow selecting multiple files
2. Show list of uploaded filenames with remove buttons
3. Extract text from each file, concatenate with document labels:
   ```
   === Document 1: KBSB - Other Terms and Conditions.pdf ===
   [extracted text]

   === Document 2: KBSB - Principal Terms and Conditions.pdf ===
   [extracted text]

   === Document 3: Facility Information.pdf ===
   [extracted text]
   ```
4. Send all concatenated text to Claude in a single API call
5. Claude analyzes across all documents together

---

## 4. Claude API System Prompt

This is the core of the app — replaces PitchLens's ECF prompt.

```
You are a senior investment banking analyst specialising in Malaysian debt capital markets (DCM). You analyze bond and sukuk termsheets from BNM's FAST system and similar sources.

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
}
```

---

## 5. UI Design — Visual Sections

### Branding
- **Primary colour:** `#1E3A5F` (deep navy blue — capital markets / institutional feel)
- **Accent colour:** `#2ECC71` (green — for sustainability/SRI tag) and `#E74C3C` (red — for risk flags)
- **Logo:** "B" in a rounded square, navy background, white text
- **Tagline landing page:** "Understand any bond in seconds." / "Read termsheets like a senior banker."
- **Dark mode:** Yes (same toggle pattern as PitchLens)
- **Mobile responsive:** Yes (same Tailwind responsive classes)

### Landing Page (before upload)
Similar layout to PitchLens:
- Header: BondLens logo + dark mode toggle
- Hero: "Read termsheets like a senior banker." + subtitle "Upload bond or sukuk termsheet PDFs and instantly see a structured deal analysis. Built for capital markets professionals."
- Upload zone: drag-and-drop area, accepts MULTIPLE PDFs
- Show list of uploaded files with individual remove buttons
- "Analyze Termsheet →" button
- Footer: "Built for capital markets professionals • Powered by Claude AI"

### Loading State
- Same spinner pattern as PitchLens
- Text: "Reading your termsheet..." / "Extracting deal terms across [N] documents"

### Results Page — Section by Section

#### 5a. Header Bar (sticky)
- BondLens logo
- "Export PDF" button
- "New Analysis" button
- Dark mode toggle

#### 5b. Deal Snapshot Hero Card
Full-width card at top with key deal metrics. Similar feel to PitchLens's score card but without the score ring.

Layout:
```
┌─────────────────────────────────────────────────────┐
│  ISSUER NAME                                        │
│  Programme Name                                     │
│                                                     │
│  [RM300M]  [Islamic]  [SRI Sukuk]  [Not Rated]     │  ← badges/pills
│                                                     │
│  "2-3 sentence executive summary..."                │
│                                                     │
│  Available: RM210M | Outstanding: RM0 | Maturity: 2056 │  ← stats row
└─────────────────────────────────────────────────────┘
```

Badges should be colour-coded:
- Programme size: navy
- Islamic/Conventional: teal
- SRI/Sustainability: green
- Rating: green (AAA-A), amber (BBB-B), red (below B), grey (Not Rated)

#### 5c. Key Terms Grid (2x3 or 3x2 on desktop, stacked on mobile)
Similar to the resume's "Core Competencies" 4-box grid. Each card:

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 🏢 ISSUER        │  │ 💰 PROFIT RATE   │  │ 📅 TENURE        │
│ Kami Builders     │  │ Fixed / Floating │  │ Programme: 30Y   │
│ Sdn Bhd          │  │ Semi-annual      │  │ Tranche 1: ≤5Y   │
│                   │  │ Actual/365       │  │ Maturity: 2056   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 🔒 SECURITY      │  │ 📜 DENOMINATION  │  │ ⚖️ STRUCTURE     │
│ Secured &        │  │ RM1,000 or       │  │ Murabahah via    │
│ Unsecured        │  │ multiples        │  │ Tawarruq         │
│ tranches         │  │                  │  │ Bearer form      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

#### 5d. Key Parties
Clean two-column table or card layout:
- Lead Arranger, Facility Agent, Trustee, Paying Agent, Shariah Adviser

#### 5e. Use of Proceeds
List with colour-coded tags (Green 🟢 / Social 🔵 / Combined 🟣):
- Each use-of-proceeds item as a row with category tag + description

#### 5f. Eligible Projects
Card showing green and social project criteria from the sustainability framework.

#### 5g. Security Package
Brief explanation of secured vs unsecured tranches, ranking, trustee reimbursement account.

#### 5h. Risk Highlights
Red-tinted cards (similar to PitchLens's "gaps" styling):
- Each risk as a factual observation with a ⚠️ icon
- NOT judgmental — factual only (e.g. "Currently unrated" not "Risky because unrated")

#### 5i. Data Gaps — "What's Not in These Documents"
Amber-tinted section:
- Lists what an investor would typically need but isn't in the uploaded documents
- e.g. "Credit rating report", "Issuer financial statements", "Specific project details"

#### 5j. Glossary
Collapsible section at bottom with Islamic finance and bond market terms explained in plain English. Each term as a row: Term → Definition.

---

## 6. Section Tabs (like PitchLens)

Horizontal scrollable tabs below the header, same pattern as PitchLens's `SectionTabs` component:

`All | Snapshot | Key Terms | Parties | Proceeds | Security | Risks | Gaps | Glossary`

Clicking a tab scrolls to / filters to that section.

---

## 7. PDF Export

Adapt PitchLens's `exportPdf.js` utility. Export a clean PDF of the analysis with all sections. Use the same client-side PDF generation approach.

---

## 8. Demo Mode

On first visit (no files uploaded), show a "Try Demo" button that loads a pre-analyzed KBSB deal. Store the demo JSON response as a static file (`/public/demo-kbsb.json`) so it loads instantly without an API call.

This means:
1. Pre-run the analysis on the KBSB termsheet
2. Save the JSON response
3. Landing page has two CTAs: "Upload Termsheet →" and "Try Demo →"
4. Demo loads the saved JSON and renders the same results view

---

## 9. Mobile Considerations

- Same responsive approach as PitchLens (Tailwind `md:` breakpoints)
- Key Terms grid: 2x3 on desktop → stacked single column on mobile
- Stats row in Deal Snapshot: horizontal scroll or wrap on mobile
- Tab bar: horizontal scroll with hidden scrollbar (same as PitchLens)
- Upload: tap to select files (drag-drop less relevant on mobile)
- Touch-friendly card sizes and tap targets

---

## 10. Files to Create

### New files:
1. `api/analyze.js` — new system prompt (Section 4 above)
2. `src/App.jsx` — new UI with all sections above
3. `src/utils/analyzePrompt.js` — minor update for multi-file
4. `src/utils/pdfExtract.js` — update for multi-file extraction
5. `public/demo-kbsb.json` — pre-computed demo data
6. `public/favicon.svg` — BondLens "B" icon

### Reuse from PitchLens (copy and adapt):
1. `api/extract.js` — server-side PDF extraction (no changes needed)
2. `api/upload.js` — blob upload handler (no changes needed)
3. `src/index.css` — Tailwind base (no changes)
4. `src/main.jsx` — entry point (no changes)
5. `src/utils/exportPdf.js` — adapt for bond sections
6. `vite.config.js` — no changes
7. `vercel.json` — no changes
8. `package.json` — same dependencies
9. `index.html` — update title to "BondLens"

---

## 11. Development Steps (for Claude Code)

1. Clone/copy the PitchLens repo into a new `bondlens` folder
2. Update `index.html` title and meta
3. Create new `api/analyze.js` with the bond termsheet system prompt
4. Update `src/utils/pdfExtract.js` to handle multiple files — export a function that takes an array of File objects, extracts text from each with document labels, and returns concatenated text + pageImages
5. Update `src/utils/analyzePrompt.js` to pass multi-file data
6. Rebuild `src/App.jsx` with the new sections (Deal Snapshot, Key Terms Grid, Parties, Proceeds, Security, Risks, Gaps, Glossary)
7. Update branding (colours, logo, copy)
8. Create demo JSON by running the prompt against the KBSB termsheet
9. Add PDF export adapted for bond layout
10. Test on mobile
11. Deploy to Vercel

---

## 12. Sample Data for Testing

Use the KBSB (Kami Builders Sdn Bhd) termsheet — it's publicly available from BNM's FAST system:
- **Issuer:** Kami Builders Sdn Bhd
- **Programme:** RM300M ASEAN Sustainability SRI Sukuk (Murabahah via Tawarruq)
- **Facility Code:** 202600025
- **SC Approved:** 13 March 2026
- **Documents:** "Other Terms and Conditions" + "Facility Information" PDFs (attached to this chat)
- **FAST URL:** https://fast.bnm.gov.my — BNM's Fully Automated System for Issuing/Tendering. Go to "Facility Information" to browse publicly lodged termsheets for additional test data.

---

## 13. What This App Demonstrates to Hiring Managers

- **Deal comprehension** — correctly extracts and structures bond/sukuk terms
- **Investor lens** — presents information the way a sales desk would brief a fund manager
- **Risk awareness** — flags key observations without being told what to look for
- **AI + capital markets** — the exact intersection banks are hiring for
- **Sustainability / Islamic finance** — differentiator for Malaysian IB desks
- **Can ship** — working product, not just theory

---

## 14. Out of Scope for V1

- Comparable deal analysis (pulling from external databases)
- PPTX export (V2 feature)
- User accounts or saved analyses
- Multiple analysis history
- Real-time FAST data integration
- Sukuk structure flow diagrams (too technical to validate)
