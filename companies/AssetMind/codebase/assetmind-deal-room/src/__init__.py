"""
AssetMind Deal Room Intelligence
Port: 5280

AI-powered data room analysis for private market investments.
Upload documents, ask questions, extract risks, and generate summaries.
"""

import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import hashlib
import re
from collections import defaultdict

app = FastAPI(title="AssetMind Deal Room", version="1.0.0")

# In-memory storage (replace with actual DB in production)
documents_store: Dict[str, Dict] = defaultdict(dict)
deal_rooms: Dict[str, Dict] = defaultdict(dict)
qa_history: List[Dict] = []


class QuestionRequest(BaseModel):
    deal_room_id: str
    question: str
    include_sources: bool = True


class RiskSummaryRequest(BaseModel):
    deal_room_id: str
    risk_categories: Optional[List[str]] = None


class DocumentSummary(BaseModel):
    doc_id: str
    title: str
    doc_type: str
    page_count: int
    key_findings: List[str]
    risk_flags: List[str]
    summary: str


class QAResponse(BaseModel):
    answer: str
    confidence: float
    sources: List[Dict[str, Any]]
    follow_up_questions: List[str]


# Document type detection patterns
DOC_TYPE_PATTERNS = {
    "financial_statement": ["balance sheet", "income statement", "cash flow", "p&l", "profit and loss"],
    "management_report": ["management discussion", "md&a", "ceo letter", "executive summary"],
    "legal_document": ["agreement", "contract", "terms", "conditions", "warranty", "indemnity"],
    "cap_table": ["cap table", "capitalization", "ownership", "shareholders", "equity"],
    "term_sheet": ["term sheet", "investment terms", "valuation", "pre-money", "post-money"],
    "audit_report": ["auditor", "audit", "independent", "certified public"],
    "compliance_doc": ["compliance", "regulatory", "sec filing", "10-k", "10-q", "8-k"],
}


def classify_document(text: str) -> str:
    """Classify document type based on content."""
    text_lower = text.lower()
    scores = {}

    for doc_type, patterns in DOC_TYPE_PATTERNS.items():
        score = sum(1 for p in patterns if p in text_lower)
        scores[doc_type] = score

    if max(scores.values()) > 0:
        return max(scores, key=scores.get)
    return "general"


def extract_key_metrics(text: str) -> Dict[str, Any]:
    """Extract financial metrics from text."""
    metrics = {}

    patterns = {
        "revenue": r"(?:total\s+)?(?:net\s+)?revenue[:\s]*\$?([\d,]+(?:\.\d+)?)\s*(?:million|billion|M|B)?",
        "ebitda": r"ebitda[:\s]*\$?([\d,]+(?:\.\d+)?)\s*(?:million|billion|M|B)?",
        "net_income": r"net\s+income[:\s]*\$?([\d,]+(?:\.\d+)?)\s*(?:million|billion|M|B)?",
        "total_debt": r"total\s+debt[:\s]*\$?([\d,]+(?:\.\d+)?)\s*(?:million|billion|M|B)?",
        "cash": r"cash(?:\s+and\s+cash\s+equivalents)?[:\s]*\$?([\d,]+(?:\.\d+)?)\s*(?:million|billion|M|B)?",
    }

    for metric, pattern in patterns.items():
        match = re.search(pattern, text.lower())
        if match:
            value = match.group(1).replace(",", "")
            try:
                metrics[metric] = float(value)
            except ValueError:
                pass

    return metrics


def extract_risk_flags(text: str) -> List[str]:
    """Extract potential risk flags from document."""
    risks = []

    risk_patterns = [
        (r"material\s+adverse\s+change", "Material Adverse Change clause"),
        (r"change\s+of\s+control", "Change of Control provisions"),
        (r"non-compete", "Non-Compete restrictions"),
        (r"earnout", "Earnout arrangements"),
        (r"indemnification", "Indemnification obligations"),
        (r"guarantor", "Guarantor dependencies"),
        (r"subsidiary\s+guarantee", "Subsidiary guarantee requirements"),
        (r"covenant.*leverage", "Leverage covenant risk"),
        (r"default.*risk", "Default risk"),
        (r"concentration.*risk", "Customer/supplier concentration"),
        (r"key\s+person", "Key person dependency"),
    ]

    text_lower = text.lower()
    for pattern, risk in risk_patterns:
        if re.search(pattern, text_lower):
            risks.append(risk)

    return risks


def generate_summary(text: str, doc_type: str) -> str:
    """Generate document summary."""
    # Simple extractive summarization
    sentences = re.split(r'[.!?]+', text)
    important_sentences = []

    keywords = ["revenue", "growth", "profit", "debt", "risk", "investment", "deal", "valuation"]

    for sent in sentences:
        if len(sent.strip()) > 50:
            if any(kw in sent.lower() for kw in keywords):
                important_sentences.append(sent.strip())

    summary = " ".join(important_sentences[:5])
    return summary if summary else f"{doc_type.replace('_', ' ').title()} document - key details require detailed review"


def answer_question(question: str, deal_room_id: str) -> QAResponse:
    """Answer a question about the deal room documents."""
    if deal_room_id not in deal_rooms:
        raise HTTPException(status_code=404, detail="Deal room not found")

    docs = deal_rooms[deal_room_id].get("documents", [])
    question_lower = question.lower()

    # Find relevant documents
    relevant_content = []
    for doc in docs:
        doc_text = doc.get("content", "").lower()
        if any(word in doc_text for word in question_lower.split()):
            relevant_content.append(doc.get("content", ""))

    if not relevant_content:
        return QAResponse(
            answer="I couldn't find specific information to answer this question. Please rephrase or ask about a specific topic mentioned in the data room.",
            confidence=0.1,
            sources=[],
            follow_up_questions=[
                "What are the key financial metrics?",
                "What are the main risks?",
                "What is the deal structure?"
            ]
        )

    # Generate answer based on relevant content
    combined = " ".join(relevant_content[:3])

    answer_templates = {
        "risk": "Based on the documents, the key risks include: ",
        "financial": "The financial information shows: ",
        "valuation": "Regarding valuation: ",
        "team": "The management team information indicates: ",
        "market": "Market analysis shows: ",
    }

    answer_type = "general"
    for key in answer_templates:
        if key in question_lower:
            answer_type = key
            break

    # Extract relevant snippets
    snippets = []
    for content in relevant_content[:2]:
        sentences = re.split(r'[.!?]+', content)
        for sent in sentences:
            if len(sent.strip()) > 40 and any(word in sent.lower() for word in question_lower.split()[:3]):
                snippets.append(sent.strip())

    answer = answer_templates.get(answer_type, "Based on the data room: ") + " ".join(snippets[:3])

    # Generate follow-up questions
    follow_ups = []
    if "risk" not in question_lower:
        follow_ups.append("What are the specific risk factors?")
    if "financial" not in question_lower and "ebitda" not in question_lower:
        follow_ups.append("What are the key financial metrics?")
    if "valuation" not in question_lower:
        follow_ups.append("What is the proposed valuation?")

    return QAResponse(
        answer=answer,
        confidence=0.75,
        sources=[{"doc_id": d.get("doc_id"), "snippet": d.get("summary", "")[:200]} for d in docs[:3]],
        follow_up_questions=follow_ups[:3]
    )


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "deal-room", "version": "1.0.0"}


@app.post("/deal-rooms")
async def create_deal_room(name: str, description: str = ""):
    """Create a new deal room."""
    room_id = hashlib.md5(f"{name}{datetime.now().isoformat()}".encode()).hexdigest()[:12]

    deal_rooms[room_id] = {
        "room_id": room_id,
        "name": name,
        "description": description,
        "created_at": datetime.now().isoformat(),
        "documents": [],
        "status": "active"
    }

    return {"room_id": room_id, "status": "created"}


@app.get("/deal-rooms/{room_id}")
async def get_deal_room(room_id: str):
    """Get deal room details."""
    if room_id not in deal_rooms:
        raise HTTPException(status_code=404, detail="Deal room not found")
    return deal_rooms[room_id]


@app.post("/deal-rooms/{room_id}/documents")
async def upload_document(room_id: str, background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Upload a document to the deal room."""
    if room_id not in deal_rooms:
        raise HTTPException(status_code=404, detail="Deal room not found")

    content = await file.read()
    text = content.decode("utf-8", errors="ignore")

    doc_id = hashlib.md5(content).hexdigest()[:12]

    doc_type = classify_document(text)
    metrics = extract_key_metrics(text)
    risks = extract_risk_flags(text)
    summary = generate_summary(text, doc_type)

    doc = {
        "doc_id": doc_id,
        "filename": file.filename,
        "doc_type": doc_type,
        "content": text,
        "summary": summary,
        "metrics": metrics,
        "risk_flags": risks,
        "uploaded_at": datetime.now().isoformat(),
        "page_count": len(text) // 2000  # Estimate
    }

    deal_rooms[room_id]["documents"].append(doc)

    return {
        "doc_id": doc_id,
        "doc_type": doc_type,
        "summary": summary,
        "metrics_found": list(metrics.keys()),
        "risk_flags": risks
    }


@app.post("/deal-rooms/{room_id}/analyze")
async def analyze_deal_room(room_id: str):
    """Get comprehensive analysis of all documents in a deal room."""
    if room_id not in deal_rooms:
        raise HTTPException(status_code=404, detail="Deal room not found")

    docs = deal_rooms[room_id].get("documents", [])

    if not docs:
        return {"error": "No documents in deal room"}

    # Aggregate metrics
    all_metrics = {}
    all_risks = []
    doc_types = defaultdict(list)

    for doc in docs:
        doc_types[doc["doc_type"]].append(doc["doc_id"])
        all_metrics.update(doc.get("metrics", {}))
        all_risks.extend(doc.get("risk_flags", []))

    # Remove duplicate risks
    all_risks = list(set(all_risks))

    # Calculate coverage score
    coverage = {
        "financial_statements": len(doc_types.get("financial_statement", [])),
        "management_reports": len(doc_types.get("management_report", [])),
        "legal_documents": len(doc_types.get("legal_document", [])),
        "cap_table": len(doc_types.get("cap_table", [])),
        "term_sheet": len(doc_types.get("term_sheet", [])),
    }

    return {
        "room_id": room_id,
        "total_documents": len(docs),
        "document_types": dict(doc_types),
        "key_metrics": all_metrics,
        "risk_flags": all_risks,
        "coverage": coverage,
        "recommendations": [
            "Review all legal documents for material terms",
            "Verify financial metrics against audited statements",
            "Assess risk flags in consultation with legal team"
        ]
    }


@app.post("/deal-rooms/{room_id}/ask")
async def ask_question(request: QuestionRequest):
    """Ask a question about the deal room."""
    response = answer_question(request.question, request.deal_room_id)

    qa_history.append({
        "room_id": request.deal_room_id,
        "question": request.question,
        "answer": response.answer,
        "timestamp": datetime.now().isoformat()
    })

    return response


@app.get("/deal-rooms/{room_id}/risks")
async def get_risk_summary(room_id: str):
    """Get comprehensive risk summary."""
    if room_id not in deal_rooms:
        raise HTTPException(status_code=404, detail="Deal room not found")

    docs = deal_rooms[room_id].get("documents", [])
    all_risks = []

    for doc in docs:
        all_risks.extend(doc.get("risk_flags", []))

    # Categorize risks
    risk_categories = {
        "financial": [r for r in all_risks if any(w in r.lower() for w in ["debt", "covenant", "default", "leverage"])],
        "legal": [r for r in all_risks if any(w in r.lower() for w in ["agreement", "contract", "indemnify", "non-compete"])],
        "operational": [r for r in all_risks if any(w in r.lower() for w in ["key person", "concentration", "subsidiary"])],
        "regulatory": [r for r in all_risks if any(w in r.lower() for w in ["compliance", "regulatory", "change of control"])],
    }

    return {
        "room_id": room_id,
        "total_risks": len(all_risks),
        "risk_categories": risk_categories,
        "overall_risk_level": "HIGH" if len(all_risks) > 5 else "MEDIUM" if len(all_risks) > 2 else "LOW"
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5280)
