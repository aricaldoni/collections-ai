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
    if days_overdue <= 0:
        return 0.0
    return round((amount / 1000) * ((days_overdue / 30) ** 1.2), 2)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AR Collections API"}

@app.post("/ar/priority")
async def rank_invoices(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        required = ['customer', 'amount', 'days_past_due', 'segment']
        if not all(col in df.columns for col in required):
            raise HTTPException(400, f"CSV must have columns: {required}")
        
        df = df.rename(columns={'days_past_due': 'days_overdue'})
        
        df['priority_score'] = df.apply(
            lambda row: calculate_priority(row['amount'], row['days_overdue']),
            axis=1
        )
        
        df = df.sort_values('priority_score', ascending=False)
        df['id'] = range(1, len(df) + 1)
        
        invoices = df[['id', 'customer', 'amount', 'days_overdue', 'priority_score', 'segment']].to_dict('records')
        
        return {
            "invoices": invoices,
            "total_overdue": float(df['amount'].sum()),
            "count": len(invoices)
        }
    except Exception as e:
        raise HTTPException(500, f"Error processing file: {str(e)}")

@app.post("/ar/draft", response_model=DraftResponse)
async def generate_draft(request: DraftRequest):
    print(f"DEBUG: Received request: {request}")
    
    api_key = os.getenv("OPENAI_API_KEY")
    print(f"DEBUG: API Key exists: {api_key is not None}")
    
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