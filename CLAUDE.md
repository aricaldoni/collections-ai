# CLAUDE.md — AR Collections AI Assistant

## Project Purpose

This tool automates two of the most time-consuming tasks in AR collections:

1. **Invoice prioritization** — ranks overdue invoices by an impact-weighted score so managers work the highest-value accounts first, eliminating recency bias and manual spreadsheet sorting.
2. **Email drafting** — generates segment-specific collection emails (Enterprise / SMB / Startup) via OpenAI, adapting tone and strategy per customer type.

Built as a 7-day showcase project by Agustina Ricaldoni to demonstrate how CS domain expertise can be codified into AI-powered automation.

---

## Tech Stack

### Frontend (`src/`)
- **Next.js 14** — App Router, React Server Components
- **TypeScript** — strict typing throughout
- **Tailwind CSS** — utility-first styling, no component library

### Backend (`api/`)
- **Python 3.11+** with **FastAPI** — async REST API
- **OpenAI GPT-3.5-turbo** — email draft generation with `json_object` response format
- **Pandas** — CSV ingestion and priority score calculation
- **python-dotenv** — environment variable loading

### Infrastructure
- **Vercel** — frontend hosting (auto-deploy from `main`)
- **Railway** — backend hosting
- **GitHub Actions** — CI/CD

---

## Project Structure

```
collections-ai/
├── src/app/
│   ├── page.tsx        # Single-page dashboard: upload, table, email modal
│   └── layout.tsx      # App shell with header
├── api/
│   ├── app/
│   │   └── main.py     # All FastAPI routes and business logic
│   ├── requirements.txt
│   └── sample_invoices.csv   # 18-row test fixture
├── .env.local.example  # Frontend env template
├── api/.env.example    # Backend env template
└── CLAUDE.md
```

---

## Environment Variables

### Backend (`api/.env`)
| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI key for `/ar/draft`. Get it at platform.openai.com/api-keys |

### Frontend (`.env.local`)
| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:8000` | Backend base URL |

Copy the example files to get started:
```bash
cp api/.env.example api/.env
cp .env.local.example .env.local
```

---

## Running Locally

**Backend** (port 8000):
```bash
cd api
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend** (port 3000):
```bash
npm install
npm run dev
```

---

## Key Business Logic

### Priority Score (`api/app/main.py:41-44`)
```python
priority_score = (amount / 1000) * (days_overdue / 30) ** 1.2
```
- Weights both invoice size and time overdue
- The `1.2` exponent applies a mild exponential penalty for longer overdue periods
- Score of 0 for invoices with `days_overdue <= 0`

### Segment-Adaptive Email Tone (`api/app/main.py:95-99`)
| Segment | Tone |
|---|---|
| Enterprise | Formal, professional — references approval workflows |
| SMB | Direct, action-oriented — bullets and a single CTA |
| Startup | Empathetic, collaborative — acknowledges cash flow challenges |

### CSV Input Format
Required columns: `customer`, `amount`, `days_past_due`, `segment`
The backend renames `days_past_due` → `days_overdue` internally.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/ar/priority` | Upload CSV → returns ranked invoice list |
| `POST` | `/ar/draft` | JSON body → returns AI-generated email draft |

Both endpoints return structured JSON. `/ar/draft` uses `response_format: json_object` to guarantee parseable output from OpenAI.

---

## Coding Conventions

### Python (backend)
- All route logic lives in `api/app/main.py` — no separate router files currently
- Pydantic models for all request/response schemas
- Raise `HTTPException` with explicit status codes; never swallow errors silently
- Import `openai` lazily inside the route handler (avoids import-time errors if the key is missing)

### TypeScript (frontend)
- `'use client'` directive on `page.tsx` — all state is client-side
- Interfaces defined inline at the top of the file (`Invoice`, `DraftEmail`)
- API URL resolved once: `const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'`
- User-visible errors are surfaced via `alert()` (acceptable for MVP; replace with toast if expanding)

### General
- No ORM — data comes from CSV uploads, not a database (PostgreSQL integration is on the roadmap)
- No authentication layer — this is an internal/demo tool
- Keep the frontend as a single `page.tsx` unless it grows beyond ~300 lines
