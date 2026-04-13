from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Invoice Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Invoice(BaseModel):
    id: int
    customer: str
    amount: float
    days_overdue: int
    priority_score: float
    segment: str

class DraftRequest(BaseModel):
    customer_name: str
    amount_due: float
    days_overdue: int
    segment: str

class DraftResponse(BaseModel):
    subject: str
    body: str
    tone: str
    tone_rationale: str

def calculate_priority(amount: float, days_overdue: int) -> float:
    """Calculate an impact-weighted priority score for an overdue invoice.

    The score combines invoice size and time overdue with a mild exponential
    penalty for longer overdue periods, so a large invoice that has been
    outstanding for months ranks disproportionately higher than a small
    recently-overdue one.

    Formula:
        score = (amount / 1000) * (days_overdue / 30) ^ 1.2

    Args:
        amount: Invoice amount in USD.
        days_overdue: Number of days past the due date. Invoices with
            zero or negative values (not yet due) receive a score of 0.

    Returns:
        Priority score rounded to two decimal places. Higher is more urgent.
    """
    if days_overdue <= 0:
        return 0.0
    return round((amount / 1000) * ((days_overdue / 30) ** 1.2), 2)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AR Collections API"}

@app.post("/ar/priority")
async def rank_invoices(file: UploadFile = File(...)) -> dict:
    """Rank overdue invoices by priority score.

    Accepts a CSV upload, calculates a priority score for every row, and
    returns the invoices sorted from highest to lowest urgency.

    Required CSV columns: customer, amount, days_past_due, segment.

    Returns:
        A dict with keys:
            - invoices: list of ranked invoice records
            - total_overdue: sum of all invoice amounts
            - count: number of invoices processed
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

        required_columns = ['customer', 'amount', 'days_past_due', 'segment']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(400, f"CSV must have columns: {required_columns}")

        df = df.rename(columns={'days_past_due': 'days_overdue'})

        df['priority_score'] = df.apply(
            lambda row: calculate_priority(row['amount'], row['days_overdue']),
            axis=1,
        )

        df = df.sort_values('priority_score', ascending=False)
        df['id'] = range(1, len(df) + 1)

        output_columns = ['id', 'customer', 'amount', 'days_overdue', 'priority_score', 'segment']
        invoices = df[output_columns].to_dict('records')

        return {
            "invoices": invoices,
            "total_overdue": float(df['amount'].sum()),
            "count": len(invoices),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error processing file: {str(e)}")

@app.post("/ar/draft", response_model=DraftResponse)
async def generate_draft(request: DraftRequest) -> DraftResponse:
    """Generate a segment-adaptive collection email draft using OpenAI.

    Selects a tone strategy based on the customer's segment (Enterprise, SMB,
    or Startup) and prompts GPT-3.5-turbo to produce a ready-to-send email
    with a subject line, body, tone label, and tone rationale.

    Args:
        request: Customer details — name, amount due, days overdue, segment.

    Returns:
        A DraftResponse containing subject, body, tone, and tone_rationale.

    Raises:
        HTTPException 500: If OPENAI_API_KEY is not set or the OpenAI call fails.
    """
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise HTTPException(500, "OPENAI_API_KEY not configured")
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        tone_guide = {
            "Enterprise": "formal and professional - they expect corporate-level communication",
            "SMB": "direct and solution-focused - they appreciate brevity and clear next steps",
            "Startup": "empathetic and collaborative - acknowledge cash flow challenges while securing payment"
        }
        
        segment_tone = tone_guide.get(request.segment, "professional and balanced")
        
        system_prompt = f"""You are an expert AR collections analyst. Generate professional collection emails 
        that maintain customer relationships while securing payment. 
        
        CRITICAL: Adapt tone based on customer segment.
        For {request.segment} customers: {segment_tone}
        
        Always output valid JSON with these fields: subject, body, tone, tone_rationale."""
        
        task_prompt = f"""Generate a collection email for:

Customer: {request.customer_name}
Segment: {request.segment}
Amount Due: ${request.amount_due:,.2f}
Days Overdue: {request.days_overdue}

Return ONLY a JSON object with these exact fields:
- subject: Email subject line (adapt to segment)
- body: Full email body (150-200 words, tone adapted to {request.segment})
- tone: One word describing tone used
- tone_rationale: Brief explanation WHY this tone fits {request.segment} segment

Example format:
{{"subject": "...", "body": "...", "tone": "...", "tone_rationale": "..."}}"""
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": task_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        import json
        result = json.loads(response.choices[0].message.content)
        
        return DraftResponse(**result)
    except Exception as e:
        print(f"ERROR COMPLETO: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Error generating draft: {str(e)}")