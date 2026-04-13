# AR Collections AI Assistant

**AI-powered invoice prioritization and segment-adaptive collection email drafting.**

Upload a CSV of overdue invoices → get an impact-ranked list in seconds → click any row to generate a ready-to-send collection email tailored to that customer's segment.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://collections-ai-rpvg.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

1. [The Business Problem](#the-business-problem)
2. [What It Does](#what-it-does)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Running Locally](#running-locally)
6. [Deploying to Production](#deploying-to-production)
7. [AI Prompt Engineering Approach](#ai-prompt-engineering-approach)
8. [CSV Format Reference](#csv-format-reference)
9. [Roadmap](#roadmap)

---

## The Business Problem

Accounts Receivable teams carry a hidden operational cost that rarely shows up in finance reviews.

A typical AR manager starts each day with a spreadsheet of 50–200 overdue invoices and has to answer one question manually: *which of these do I work first?* Without a system, most people sort by oldest invoice or largest amount — but neither heuristic captures real financial urgency. A $5K invoice that's been overdue for four months ranks higher in a simple sort than a $150K invoice overdue for two months, even though the larger invoice represents 30× more cash at risk.

The email problem is equally costly. Generic templates erode customer relationships. An Enterprise customer with a formal procurement process needs a different message than a Startup founder navigating a cash crunch. Writing personalized emails from scratch for every overdue account takes 10–15 minutes each, multiplied across a full portfolio every week.

**Estimated overhead per AR manager:**
- Manual prioritization: ~2 hours/day
- Email drafting: ~3 hours/day
- Total: 5+ hours/day on work that should take 20 minutes

This project codifies 18 years of Customer Success domain expertise into a tool that eliminates both problems.

---

## What It Does

### 1. Priority Ranking

Upload any CSV of overdue invoices with four columns and the tool calculates an impact-weighted priority score for every row:

```
Priority Score = (Amount / 1000) × (Days Overdue / 30) ^ 1.2
```

The formula captures two dimensions of urgency simultaneously:
- **Amount** — larger invoices are inherently higher priority
- **Time overdue** — the `1.2` exponent creates a compounding effect, so an invoice overdue for 90 days ranks disproportionately higher than one overdue for 30 days, reflecting the increasing collection risk over time

Results are sorted descending so the highest-impact accounts appear at the top. No spreadsheet pivot tables, no manual judgment calls.

**Example scores:**
| Customer | Amount | Days Overdue | Priority Score |
|---|---|---|---|
| Premier Construction Group | $187,500 | 118 days | **846** — call today |
| PharmaCare Laboratories | $125,000 | 87 days | **486** — this week |
| Downtown Pharmacy | $8,200 | 58 days | **18** — low urgency |
| Coffee Plus LLC | $5,600 | 27 days | **6** — automated follow-up |

### 2. Segment-Adaptive Email Drafting

Click any row in the ranked table to generate a collection email. The AI reads the customer's segment — Enterprise, SMB, or Startup — and adapts both the tone and the communication strategy accordingly.

| Segment | Tone Strategy | Rationale |
|---|---|---|
| **Enterprise** | Formal, professional | Large companies have structured AP workflows. They respond to references to payment terms, escalation paths, and acknowledgment of approval cycles. |
| **SMB** | Direct, action-oriented | SMB owners are time-constrained. Bullets, a single clear CTA, and brevity convert better than corporate language. |
| **Startup** | Empathetic, collaborative | Startups often have genuine cash flow constraints. Acknowledging this reality while offering flexibility results in higher response rates than demands. |

Every generated email includes:
- A segment-appropriate **subject line**
- A **150–200 word email body** with the right tone
- The **tone label** used (e.g., "Formal", "Collaborative")
- A **tone rationale** explaining why that tone fits the segment — useful for training new team members

---

## Tech Stack

### Frontend
| Technology | Version | Role |
|---|---|---|
| Next.js | 14 | App framework (App Router) |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3 | Styling |
| React | 18 | UI rendering |

### Backend
| Technology | Version | Role |
|---|---|---|
| Python | 3.11+ | Runtime |
| FastAPI | 0.115.0 | REST API framework |
| OpenAI SDK | 1.56.2 | GPT-3.5-turbo email generation |
| Pandas | 2.2.3 | CSV parsing and score calculation |
| python-dotenv | 1.0.1 | Environment variable loading |
| Uvicorn | 0.32.0 | ASGI server |

### Infrastructure
| Service | Role |
|---|---|
| Vercel | Frontend hosting, auto-deploy from `main` |
| Railway | Backend hosting, Python runtime |
| GitHub Actions | CI/CD |

---

## Project Structure

```
collections-ai/
├── src/
│   └── app/
│       ├── page.tsx          # Dashboard: upload, ranked table, email modal
│       ├── layout.tsx        # App shell with header
│       └── globals.css       # Tailwind base styles
├── api/
│   ├── app/
│   │   └── main.py           # FastAPI routes, Pydantic models, business logic
│   ├── requirements.txt      # Python dependencies
│   └── sample_invoices.csv   # 18-row test fixture
├── public/                   # Static assets
├── .env.local.example        # Frontend env template
├── api/.env.example          # Backend env template
├── CLAUDE.md                 # AI assistant context for this repo
├── package.json
└── README.md
```

---

## Running Locally

### Prerequisites

- Node.js 20+
- Python 3.11+
- An OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### 1. Clone the repo

```bash
git clone <repo-url>
cd collections-ai
```

### 2. Set up environment variables

```bash
# Backend
cp api/.env.example api/.env
# Edit api/.env and paste your OpenAI API key

# Frontend
cp .env.local.example .env.local
# Default value (http://localhost:8000) is correct for local dev — no changes needed
```

### 3. Start the backend

```bash
cd api

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload
```

The API is now running at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the interactive Swagger UI.

### 4. Start the frontend

In a new terminal (from the repo root):

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### 5. Test it

Click **"Try with Sample Data"** on the dashboard to load 15 realistic invoices without needing a CSV. Then click **"Draft Email"** on any row to call the AI endpoint.

---

## Deploying to Production

### Backend — Railway

1. Create a new Railway project and connect your GitHub repo
2. Set the root directory to `api/`
3. Railway auto-detects Python and uses `requirements.txt`
4. Add the environment variable `OPENAI_API_KEY` in Railway's Variables tab
5. The start command Railway uses: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend — Vercel

1. Import the repo in Vercel
2. Vercel auto-detects Next.js — no build config needed
3. Add one environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app
   ```
4. Deploy. Every push to `main` triggers an automatic redeploy.

### CORS

The backend currently allows all origins (`allow_origins=["*"]`). For a production deployment, replace this with your Vercel domain in `api/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.vercel.app"],
    ...
)
```

---

## AI Prompt Engineering Approach

The `/ar/draft` endpoint uses OpenAI's `gpt-3.5-turbo` with `response_format: {"type": "json_object"}` to guarantee structured, parseable output every time. Here is how the prompting is designed.

### Structured Output First

By specifying `json_object` response format, the model is constrained to return valid JSON on every call. The four required fields (`subject`, `body`, `tone`, `tone_rationale`) are defined in the prompt with an explicit example:

```python
response_format={"type": "json_object"}
```

```
Return ONLY a JSON object with these exact fields:
- subject: Email subject line (adapt to segment)
- body: Full email body (150-200 words, tone adapted to {segment})
- tone: One word describing tone used
- tone_rationale: Brief explanation WHY this tone fits {segment} segment

Example format:
{"subject": "...", "body": "...", "tone": "...", "tone_rationale": "..."}
```

This eliminates the need for fragile regex parsing and makes the response directly deserializable into the `DraftResponse` Pydantic model.

### Two-Layer Prompt Architecture

The prompt uses a **system + user** message split:

**System prompt** — sets the persona and the non-negotiable constraint:
```
You are an expert AR collections analyst. Generate professional collection emails
that maintain customer relationships while securing payment.

CRITICAL: Adapt tone based on customer segment.
For {segment} customers: {segment_tone}

Always output valid JSON with these fields: subject, body, tone, tone_rationale.
```

Establishing the persona ("expert AR collections analyst") before the task produces more domain-appropriate output than a generic instruction. The `CRITICAL:` label anchors the segment tone rule so it is not overridden by the user message.

**User prompt** — provides the instance data:
```
Generate a collection email for:

Customer: {customer_name}
Segment: {segment}
Amount Due: ${amount_due:,.2f}
Days Overdue: {days_overdue}
```

Separating persona/rules (system) from data (user) means you can change customers without re-explaining the rules, and you can update the rules without touching the data format.

### Segment Tone Injection

Rather than asking the model to infer tone from segment labels alone, the prompt injects an explicit strategy description for each segment:

```python
tone_guide = {
    "Enterprise": "formal and professional - they expect corporate-level communication",
    "SMB": "direct and solution-focused - they appreciate brevity and clear next steps",
    "Startup": "empathetic and collaborative - acknowledge cash flow challenges while securing payment"
}
segment_tone = tone_guide.get(request.segment, "professional and balanced")
```

This externalizes the tone logic into Python where it can be versioned, tested, and updated without touching the prompt template. It also prevents the model from applying its own assumptions about what "Enterprise" means.

### Word Count Constraint

The body is bounded at 150–200 words in the user prompt. Without this, models tend toward either very short (unhelpful) or very long (unread) emails. This range was chosen based on email engagement research: it is enough for a professional message with context and a clear CTA, without exceeding the attention budget of a busy AP manager.

### What `tone_rationale` Adds

The `tone_rationale` field is not displayed to end users — it is returned so that:
1. Team leads can review AI decisions and catch cases where the tone selection was wrong
2. New AR staff can learn *why* different segments receive different treatment, making the tool a training aid rather than a black box

---

## CSV Format Reference

```csv
customer,amount,days_past_due,segment
Global Tech Solutions,152000,113,Enterprise
Metro Supermarkets Inc,18500,78,SMB
StartupHub LLC,45000,67,Startup
```

**Required columns:**

| Column | Type | Description |
|---|---|---|
| `customer` | string | Company name |
| `amount` | number | Invoice amount in USD (no currency symbol) |
| `days_past_due` | integer | Days since the invoice due date |
| `segment` | string | One of: `Enterprise`, `SMB`, `Startup` |

Optional columns (e.g. `invoice_id`, `due_date`, `last_promise`) are ignored but do not cause errors.

A sample file with 18 realistic invoices is available at `api/sample_invoices.csv`.

---

## Roadmap

- [ ] PostgreSQL integration — replace CSV uploads with a persistent invoice database
- [ ] Email sending — send drafts directly via SendGrid or Mailgun
- [ ] Dashboard analytics — collection rates, average resolution time, segment breakdown
- [ ] Webhook integrations — sync with Salesforce, HubSpot, NetSuite
- [ ] Multi-language support — Spanish and Portuguese email drafts
- [ ] Authentication — user accounts and team workspaces

---

## Author

**Agustina Ricaldoni**
Enterprise Customer Success Leader | AI-Powered Automation

- LinkedIn: [linkedin.com/in/aricaldoni](https://linkedin.com/in/aricaldoni)
- 18+ years in enterprise CS at Google Cloud, American Express, Cybele Software

---

## License

MIT — see [LICENSE](LICENSE) for details.
