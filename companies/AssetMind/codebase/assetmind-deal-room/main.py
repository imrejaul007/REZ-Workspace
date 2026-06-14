"""
AssetMind Deal Room - AI-Powered Data Room Intelligence
Port: 5280
"""

import uuid
from datetime import datetime
from typing import Optional, List
from enum import Enum

from fastapi import FastAPI, HTTPException, Query, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from loguru import logger

app = FastAPI(title="AssetMind Deal Room", description="AI-Powered Data Room Intelligence", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class DocumentType(str, Enum):
    FINANCIAL_STATEMENT = "financial_statement"
    MANAGEMENT_REPORT = "management_report"
    LEGAL_DOCUMENT = "legal_document"
    CAP_TABLE = "cap_table"
    TERM_SHEET = "term_sheet"
    AUDIT_REPORT = "audit_report"
    COMPLIANCE_DOC = "compliance_doc"
    UNKNOWN = "unknown"

class DealStage(str, Enum):
    SOURCING = "sourcing"
    SCREENING = "screening"
    DUE_DILIGENCE = "due_diligence"
    NEGOTIATION = "negotiation"
    CLOSING = "closing"
    CLOSED = "closed"

class RiskSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

# Models
class DealRoom(BaseModel):
    id: str = Field(default_factory=lambda: f"room_{uuid.uuid4().hex[:8]}")
    name: str
    description: Optional[str] = None
    deal_type: str = "equity"
    target_amount: Optional[float] = None
    stage: DealStage = DealStage.DUE_DILIGENCE
    tags: List[str] = []
    document_count: int = 0
    analysis_status: AnalysisStatus = AnalysisStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DealRoomCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    deal_type: str = "equity"
    target_amount: Optional[float] = None
    stage: DealStage = DealStage.DUE_DILIGENCE
    tags: List[str] = []

class DealRoomUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[float] = None
    stage: Optional[DealStage] = None
    tags: Optional[List[str]] = None

class Document(BaseModel):
    id: str = Field(default_factory=lambda: f"doc_{uuid.uuid4().hex[:8]}")
    deal_room_id: str
    filename: str
    file_type: str
    file_size: int
    document_type: DocumentType = DocumentType.UNKNOWN
    page_count: Optional[int] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class KeyMetrics(BaseModel):
    revenue: Optional[float] = None
    ebitda: Optional[float] = None
    net_income: Optional[float] = None
    total_assets: Optional[float] = None
    cash: Optional[float] = None
    debt: Optional[float] = None
    employees: Optional[int] = None
    growth_rate: Optional[float] = None

class RiskFlag(BaseModel):
    title: str
    description: str
    severity: RiskSeverity
    category: str
    source_document: Optional[str] = None

class AnalysisResult(BaseModel):
    document_count: int
    document_types: dict
    key_metrics: KeyMetrics
    risk_flags: List[RiskFlag]
    recommendations: List[str]
    summary: str
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)

class Answer(BaseModel):
    question_id: str
    answer: str
    confidence: float = 0.0
    sources: List[dict] = []

class Question(BaseModel):
    id: str = Field(default_factory=lambda: f"q_{uuid.uuid4().hex[:8]}")
    question: str
    include_sources: bool = True

class RiskSummary(BaseModel):
    deal_room_id: str
    total_risks: int
    critical_risks: int = 0
    high_risks: int = 0
    medium_risks: int = 0
    low_risks: int = 0
    risk_categories: dict
    top_risks: List[RiskFlag]
    recommendations: List[str]

class QuestionHistory(BaseModel):
    deal_room_id: str
    questions: List[Question]
    answers: List[Answer]

class DealRoomStats(BaseModel):
    total_deal_rooms: int
    total_documents: int
    active_deals: int
    completed_deals: int

# Storage
deal_rooms_db: dict[str, DealRoom] = {}
documents_db: dict[str, Document] = {}
analysis_results_db: dict[str, AnalysisResult] = {}
questions_db: dict[str, Answer] = {}

def classify_document(filename: str) -> DocumentType:
    fn = filename.lower()
    if any(t in fn for t in ["financial", "p&l", "balance", "income", "cash flow"]):
        return DocumentType.FINANCIAL_STATEMENT
    elif any(t in fn for t in ["management", "mda", "ceo"]):
        return DocumentType.MANAGEMENT_REPORT
    elif any(t in fn for t in ["agreement", "contract", "terms"]):
        return DocumentType.LEGAL_DOCUMENT
    elif any(t in fn for t in ["cap", "shareholder", "equity", "ownership"]):
        return DocumentType.CAP_TABLE
    elif any(t in fn for t in ["term", "investment"]):
        return DocumentType.TERM_SHEET
    elif any(t in fn for t in ["audit", "auditor"]):
        return DocumentType.AUDIT_REPORT
    return DocumentType.UNKNOWN

# Sample data
sample_room = DealRoom(id="room-001", name="TechCorp Series B", description="SaaS investment opportunity", target_amount=50000000.0, stage=DealStage.DUE_DILIGENCE, tags=["saas", "b2b"], document_count=3)
deal_rooms_db[sample_room.id] = sample_room

for fname, dtype in [("Q4_2025_Financials.pdf", DocumentType.FINANCIAL_STATEMENT), ("CEO_Letter.pdf", DocumentType.MANAGEMENT_REPORT), ("Agreement.pdf", DocumentType.LEGAL_DOCUMENT)]:
    doc = Document(id=f"doc_{uuid.uuid4().hex[:6]}", deal_room_id="room-001", filename=fname, file_type="pdf", file_size=1024000, document_type=dtype)
    documents_db[doc.id] = doc

analysis_results_db["room-001"] = AnalysisResult(
    document_count=3, document_types={"financial_statement": 1, "management_report": 1, "legal_document": 1},
    key_metrics=KeyMetrics(revenue=15000000.0, ebitda=3500000.0, employees=150, growth_rate=0.45),
    risk_flags=[RiskFlag(title="Change of Control", description="Agreement contains control provisions", severity=RiskSeverity.MEDIUM, category="Legal")],
    recommendations=["Review all legal documents for material terms"], summary="TechCorp presents a compelling opportunity with strong growth metrics."
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "assetmind-deal-room", "version": "1.0.0", "timestamp": datetime.utcnow().isoformat(), "stats": {"deal_rooms": len(deal_rooms_db), "documents": len(documents_db)}}

@app.post("/deal-rooms", response_model=DealRoom, status_code=201)
async def create_deal_room(room_data: DealRoomCreate):
    room = DealRoom(**room_data.model_dump())
    deal_rooms_db[room.id] = room
    return room

@app.get("/deal-rooms", response_model=List[DealRoom])
async def list_deal_rooms(skip: int = 0, limit: int = 50, stage: Optional[DealStage] = None):
    rooms = list(deal_rooms_db.values())
    if stage:
        rooms = [r for r in rooms if r.stage == stage]
    rooms.sort(key=lambda x: x.updated_at, reverse=True)
    return rooms[skip:skip + limit]

@app.get("/deal-rooms/{room_id}", response_model=DealRoom)
async def get_deal_room(room_id: str):
    if room_id not in deal_rooms_db:
        raise HTTPException(status_code=404, detail="Deal room not found")
    return deal_rooms_db[room_id]

@app.put("/deal-rooms/{room_id}", response_model=DealRoom)
async def update_deal_room(room_id: str, update: DealRoomUpdate):
    if room_id not in deal_rooms_db:
        raise HTTPException(status_code=404, detail="Deal room not found")
    room = deal_rooms_db[room_id]
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(room, field, value)
    room.updated_at = datetime.utcnow()
    return room

@app.delete("/deal-rooms/{room_id}", status_code=204)
async def delete_deal_room(room_id: str):
    if room_id not in deal_rooms_db:
        raise HTTPException(status_code=404, detail="Deal room not found")
    # Delete associated documents
    docs_to_delete = [doc_id for doc_id, d in documents_db.items() if d.deal_room_id == room_id]
    for doc_id in docs_to_delete:
        del documents_db[doc_id]
    del deal_rooms_db[room_id]

@app.post("/deal-rooms/{room_id}/documents")
async def upload_document(room_id: str, file: UploadFile = File(...)):
    if room_id not in deal_rooms_db:
        raise HTTPException(status_code=404, detail="Deal room not found")
    content = await file.read()
    doc_type = classify_document(file.filename)
    doc = Document(id=f"doc_{uuid.uuid4().hex[:8]}", deal_room_id=room_id, filename=file.filename, file_type=file.filename.split(".")[-1] if "." in file.filename else "unknown", file_size=len(content), document_type=doc_type)
    documents_db[doc.id] = doc
    deal_rooms_db[room_id].document_count += 1
    return {"document_id": doc.id, "filename": doc.filename, "document_type": doc.document_type.value, "status": "uploaded"}

@app.get("/deal-rooms/{room_id}/documents", response_model=List[Document])
async def list_documents(room_id: str):
    if room_id not in deal_rooms_db:
        raise HTTPException(status_code=404, detail="Deal room not found")
    return [d for d in documents_db.values() if d.deal_room_id == room_id]

@app.post("/deal-rooms/{room_id}/analyze", response_model=AnalysisResult)
async def analyze_deal_room(room_id: str):
    if room_id not in deal_rooms_db:
        raise HTTPException(status_code=404, detail="Deal room not found")
    room = deal_rooms_db[room_id]
    room.analysis_status = AnalysisStatus.PROCESSING
    docs = [d for d in documents_db.values() if d.deal_room_id == room_id]
    doc_types = {}
    for doc in docs:
        doc_types[doc.document_type.value] = doc_types.get(doc.document_type.value, 0) + 1
    result = AnalysisResult(document_count=len(docs), document_types=doc_types, key_metrics=KeyMetrics(), risk_flags=[], recommendations=[], summary=f"Deal room contains {len(docs)} documents.")
    analysis_results_db[room_id] = result
    room.analysis_status = AnalysisStatus.COMPLETED
    room.updated_at = datetime.utcnow()
    return result

@app.get("/deal-rooms/{room_id}/analysis", response_model=AnalysisResult)
async def get_analysis(room_id: str):
    if room_id not in analysis_results_db:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis_results_db[room_id]

@app.post("/deal-rooms/{room_id}/ask", response_model=Answer)
async def ask_question(room_id: str, question: Question):
    if room_id not in deal_rooms_db:
        raise HTTPException(status_code=404, detail="Deal room not found")
    docs = [d for d in documents_db.values() if d.deal_room_id == room_id]
    answer = Answer(question_id=question.id, answer=f"Based on {len(docs)} documents, I can provide insights on {question.question}.", confidence=0.85, sources=[{"document": d.filename, "type": d.document_type.value} for d in docs[:3]])
    questions_db[question.id] = answer
    return answer

@app.get("/deal-rooms/{room_id}/risks", response_model=RiskSummary)
async def get_risk_summary(room_id: str):
    if room_id not in deal_rooms_db:
        raise HTTPException(status_code=404, detail="Deal room not found")
    result = analysis_results_db.get(room_id)
    risks = result.risk_flags if result else []
    categories = {}
    critical = high = medium = low = 0
    for risk in risks:
        categories[risk.category] = categories.get(risk.category, 0) + 1
        if risk.severity == RiskSeverity.CRITICAL:
            critical += 1
        elif risk.severity == RiskSeverity.HIGH:
            high += 1
        elif risk.severity == RiskSeverity.MEDIUM:
            medium += 1
        else:
            low += 1
    return RiskSummary(deal_room_id=room_id, total_risks=len(risks), critical_risks=critical, high_risks=high, medium_risks=medium, low_risks=low, risk_categories=categories, top_risks=sorted(risks, key=lambda x: {RiskSeverity.CRITICAL: 0, RiskSeverity.HIGH: 1, RiskSeverity.MEDIUM: 2, RiskSeverity.LOW: 3}.get(x.severity, 3))[:5], recommendations=["Prioritize review of high and critical risks"])

@app.get("/deal-rooms/{room_id}/questions", response_model=QuestionHistory)
async def get_question_history(room_id: str):
    if room_id not in deal_rooms_db:
        raise HTTPException(status_code=404, detail="Deal room not found")
    room_questions = [q for q in questions_db.values() if q.question_id.startswith("q_")]
    return QuestionHistory(deal_room_id=room_id, questions=[], answers=list(questions_db.values()))

@app.delete("/deal-rooms/{room_id}/documents/{document_id}", status_code=204)
async def delete_document(room_id: str, document_id: str):
    if room_id not in deal_rooms_db:
        raise HTTPException(status_code=404, detail="Deal room not found")
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    if documents_db[document_id].deal_room_id != room_id:
        raise HTTPException(status_code=400, detail="Document does not belong to this deal room")
    del documents_db[document_id]
    deal_rooms_db[room_id].document_count -= 1

@app.get("/statistics", response_model=DealRoomStats)
async def get_statistics():
    total_rooms = len(deal_rooms_db)
    total_docs = len(documents_db)
    active = sum(1 for r in deal_rooms_db.values() if r.stage not in [DealStage.CLOSED])
    completed = sum(1 for r in deal_rooms_db.values() if r.stage == DealStage.CLOSED)
    return DealRoomStats(total_deal_rooms=total_rooms, total_documents=total_docs, active_deals=active, completed_deals=completed)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5280)