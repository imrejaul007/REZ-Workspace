"""
AssetMind Memo Writer Service
AI-powered investment memo generation for investment committees

Port: 5285

Version: 1.0.0
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
import uvicorn

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind Memo Writer",
    description="AI-powered investment memo generation for investment committees",
    version="1.0.0",
)

# ============================================================================
# Enums
# ============================================================================

class MemoType(str, Enum):
    IC_MEMO = "ic_memo"
    BOARD_MEMO = "board_memo"
    LENDER_MEMO = "lender_memo"
    INVESTOR_MEMO = "investor_memo"
    MANAGEMENT_MEMO = "management_memo"
    PARTNERSHIP_MEMO = "partnership_memo"

class Recommendation(str, Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    DEFER = "DEFER"
    CONDITIONAL = "CONDITIONAL"

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class DealType(str, Enum):
    SEED = "seed"
    SERIES_A = "Series A"
    SERIES_B = "Series B"
    SERIES_C = "Series C"
    GROWTH_EQUITY = "growth_equity"
    BUYOUT = "buyout"
    MEZZANINE = "mezzanine"
    DEBT = "debt"

# ============================================================================
# Pydantic Models - Company Data
# ============================================================================

class CompanyInfo(BaseModel):
    name: str
    sector: str
    stage: str
    description: str = ""
    headquarters: Optional[str] = None
    founded_year: Optional[int] = None
    employee_count: Optional[int] = None
    website: Optional[str] = None

class InvestmentThesis(BaseModel):
    headline: str
    recommendation: Recommendation
    key_reasons: List[str] = []
    risks_to_overcome: List[str] = []
    expected_return: Optional[float] = None
    investment_period: Optional[str] = None

class Financials(BaseModel):
    revenue: Optional[float] = None
    ebitda: Optional[float] = None
    growth_rate: Optional[float] = None
    margin: Optional[float] = None
    debt: Optional[float] = None
    valuation: Optional[float] = None

class RiskItem(BaseModel):
    category: str
    risk_level: RiskLevel
    description: str
    mitigation: Optional[str] = None

class DealStructure(BaseModel):
    deal_type: DealType
    investment_amount: float
    ownership: float
    entry_valuation: float
    terms: Dict[str, str] = {}

# ============================================================================
# Pydantic Models - Memo Templates
# ============================================================================

class MemoTemplate(BaseModel):
    type: MemoType
    name: str
    audience: str
    focus: str
    sections: List[str] = []
    required_fields: List[str] = []

TEMPLATES = {
    MemoType.IC_MEMO: MemoTemplate(
        type=MemoType.IC_MEMO,
        name="Investment Committee Memo",
        audience="IC Members",
        focus="Investment thesis, returns",
        sections=[
            "Executive Summary",
            "Company Overview",
            "Investment Thesis",
            "Financial Analysis",
            "Risk Assessment",
            "Deal Structure",
            "Recommendation",
            "Appendix",
        ],
        required_fields=["company", "investment_thesis", "financials"],
    ),
    MemoType.BOARD_MEMO: MemoTemplate(
        type=MemoType.BOARD_MEMO,
        name="Board Memo",
        audience="Board Members",
        focus="Governance, strategy",
        sections=[
            "Executive Summary",
            "Strategic Rationale",
            "Governance Implications",
            "Financial Impact",
            "Risk Management",
            "Recommendation",
        ],
        required_fields=["company", "investment_thesis"],
    ),
    MemoType.LENDER_MEMO: MemoTemplate(
        type=MemoType.LENDER_MEMO,
        name="Lender Memo",
        audience="Lenders, Credit Committee",
        focus="Credit analysis, covenants",
        sections=[
            "Executive Summary",
            "Borrower Overview",
            "Credit Analysis",
            "Covenant Package",
            "Collateral Assessment",
            "Recommendation",
        ],
        required_fields=["company", "financials"],
    ),
    MemoType.INVESTOR_MEMO: MemoTemplate(
        type=MemoType.INVESTOR_MEMO,
        name="Investor Memo",
        audience="LPs, Investors",
        focus="Portfolio updates",
        sections=[
            "Portfolio Overview",
            "Performance Summary",
            "Key Holdings",
            "Market Outlook",
            "Forward Guidance",
        ],
        required_fields=["company"],
    ),
    MemoType.MANAGEMENT_MEMO: MemoTemplate(
        type=MemoType.MANAGEMENT_MEMO,
        name="Management Memo",
        audience="Management Team",
        focus="Internal review",
        sections=[
            "Current Status",
            "Performance Review",
            "Strategic Initiatives",
            "Resource Requirements",
            "Action Items",
        ],
        required_fields=["company"],
    ),
    MemoType.PARTNERSHIP_MEMO: MemoTemplate(
        type=MemoType.PARTNERSHIP_MEMO,
        name="Partnership Memo",
        audience="Deal Team",
        focus="Internal deal summary",
        sections=[
            "Deal Summary",
            "Company Analysis",
            "Due Diligence Findings",
            "Competitive Position",
            "Investment Terms",
            "Next Steps",
        ],
        required_fields=["company", "investment_thesis", "deal_structure"],
    ),
}

# ============================================================================
# Pydantic Models - Memo Entity
# ============================================================================

class MemoSection(BaseModel):
    title: str
    content: str
    subsections: Dict[str, str] = {}

class MemoContent(BaseModel):
    executive_summary: str = ""
    company_overview: str = ""
    investment_thesis: str = ""
    financial_analysis: str = ""
    risk_assessment: str = ""
    deal_structure: str = ""
    recommendation: str = ""
    appendix: str = ""

class GeneratedMemo(BaseModel):
    memo_id: str = Field(default_factory=lambda: f"memo-{uuid.uuid4().hex[:8]}")
    title: str
    memo_type: MemoType
    sections: MemoContent
    summary: str = ""
    recommendation: Recommendation
    confidence: float = 0.0

    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

# ============================================================================
# Request/Response Models
# ============================================================================

class MemoGenerationRequest(BaseModel):
    memo_type: MemoType
    company: CompanyInfo
    investment_thesis: Optional[InvestmentThesis] = None
    financials: Optional[Financials] = None
    risks: List[RiskItem] = []
    deal_structure: Optional[DealStructure] = None

class TemplatePreviewRequest(BaseModel):
    memo_type: MemoType
    include_required_fields: bool = True

# ============================================================================
# In-Memory Storage
# ============================================================================

memos_db: Dict[str, GeneratedMemo] = {}

# ============================================================================
# Helper Functions
# ============================================================================

def format_currency(amount: float) -> str:
    """Format amount as currency string."""
    if amount >= 1e9:
        return f"${amount/1e9:.1f}B"
    elif amount >= 1e6:
        return f"${amount/1e6:.1f}M"
    elif amount >= 1e3:
        return f"${amount/1e3:.1f}K"
    return f"${amount:,.2f}"

def generate_executive_summary(request: MemoGenerationRequest) -> str:
    """Generate executive summary section."""
    company = request.company
    thesis = request.investment_thesis
    financials = request.financials
    deal = request.deal_structure

    summary_parts = [
        f"INVESTMENT MEMORANDUM",
        f"",
        f"Company: {company.name}",
        f"Sector: {company.sector}",
        f"Stage: {company.stage}",
    ]

    if thesis:
        summary_parts.extend([
            f"",
            f"RECOMMENDATION: {thesis.recommendation.value}",
            f"",
            f"Investment Thesis: {thesis.headline}",
        ])
        if thesis.expected_return:
            summary_parts.append(f"Expected Return: {thesis.expected_return}%")

    if deal:
        summary_parts.extend([
            f"",
            f"Deal Type: {deal.deal_type.value}",
            f"Investment Amount: {format_currency(deal.investment_amount)}",
            f"Entry Valuation: {format_currency(deal.entry_valuation)}",
            f"Ownership: {deal.ownership}%",
        ])

    return "\n".join(summary_parts)

def generate_recommendation_section(request: MemoGenerationRequest) -> str:
    """Generate recommendation section."""
    parts = [
        "INVESTMENT COMMITTEE DECISION",
        "",
        f"RECOMMENDATION: {request.investment_thesis.recommendation.value}",
        "",
    ]

    if request.investment_thesis:
        parts.append("KEY REASONS:")
        for i, reason in enumerate(request.investment_thesis.key_reasons, 1):
            parts.append(f"  {i}. {reason}")

        if request.investment_thesis.risks_to_overcome:
            parts.append("")
            parts.append("RISKS TO OVERCOME:")
            for risk in request.investment_thesis.risks_to_overcome:
                parts.append(f"  - {risk}")

    return "\n".join(parts)

def generate_financial_section(request: MemoGenerationRequest) -> str:
    """Generate financial analysis section."""
    financials = request.financials
    if not financials:
        return "Financial data not available."

    parts = [
        "FINANCIAL ANALYSIS",
        "",
    ]

    if financials.revenue:
        parts.append(f"Revenue: {format_currency(financials.revenue)}")
    if financials.ebitda:
        parts.append(f"EBITDA: {format_currency(financials.ebitda)}")
    if financials.growth_rate:
        parts.append(f"Growth Rate: {financials.growth_rate}%")
    if financials.margin:
        parts.append(f"Margin: {financials.margin}%")
    if financials.valuation:
        parts.append(f"Valuation: {format_currency(financials.valuation)}")

    return "\n".join(parts)

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-memo-writer",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {
            "total_memos": len(memos_db),
            "templates_available": len(TEMPLATES),
        },
    }

# ============================================================================
# Template Endpoints
# ============================================================================

@app.get("/templates", response_model=List[MemoTemplate])
async def list_templates():
    """List all available memo templates."""
    return list(TEMPLATES.values())

@app.get("/templates/{memo_type}", response_model=MemoTemplate)
async def get_template(memo_type: MemoType):
    """Get a specific template."""
    if memo_type not in TEMPLATES:
        raise HTTPException(status_code=404, detail=f"Template '{memo_type.value}' not found")
    return TEMPLATES[memo_type]

@app.get("/templates/{memo_type}/preview")
async def preview_template(memo_type: MemoType):
    """Preview template structure."""
    if memo_type not in TEMPLATES:
        raise HTTPException(status_code=404, detail=f"Template '{memo_type.value}' not found")

    template = TEMPLATES[memo_type]
    return {
        "type": template.type.value,
        "name": template.name,
        "audience": template.audience,
        "focus": template.focus,
        "sections": template.sections,
        "required_fields": template.required_fields,
    }

# ============================================================================
# Memo Generation Endpoints
# ============================================================================

@app.post("/generate", response_model=GeneratedMemo)
async def generate_memo(request: MemoGenerationRequest):
    """Generate an investment memo based on provided data."""
    template = TEMPLATES.get(request.memo_type)

    # Validate required fields
    if template:
        for field in template.required_fields:
            if not getattr(request, field, None):
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required field for {request.memo_type.value}: {field}"
                )

    # Generate memo content
    sections = MemoContent(
        executive_summary=generate_executive_summary(request),
        investment_thesis=f"Headline: {request.investment_thesis.headline}\n\n"
                         + "\n".join(f"- {r}" for r in request.investment_thesis.key_reasons)
                         if request.investment_thesis else "",
        financial_analysis=generate_financial_section(request),
        risk_assessment="\n".join(
            f"[{r.risk_level.value}] {r.category}: {r.description}"
            for r in request.risks
        ) if request.risks else "No risks identified.",
        deal_structure=f"Deal Type: {request.deal_structure.deal_type.value}\n"
                      f"Amount: {format_currency(request.deal_structure.investment_amount)}\n"
                      f"Valuation: {format_currency(request.deal_structure.entry_valuation)}\n"
                      f"Ownership: {request.deal_structure.ownership}%"
                      if request.deal_structure else "Deal structure not provided.",
        recommendation=generate_recommendation_section(request),
    )

    memo = GeneratedMemo(
        title=f"Investment Memo: {request.company.name}",
        memo_type=request.memo_type,
        sections=sections,
        summary=sections.executive_summary,
        recommendation=request.investment_thesis.recommendation if request.investment_thesis else Recommendation.CONDITIONAL,
        confidence=0.85,
        metadata={
            "company_name": request.company.name,
            "sector": request.company.sector,
            "stage": request.company.stage,
        },
    )

    memos_db[memo.memo_id] = memo
    return memo

@app.get("/memos", response_model=List[GeneratedMemo])
async def list_memos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    memo_type: Optional[MemoType] = None,
):
    """List all generated memos."""
    memos = list(memos_db.values())

    if memo_type:
        memos = [m for m in memos if m.memo_type == memo_type]

    return sorted(memos, key=lambda m: m.created_at, reverse=True)[skip : skip + limit]

@app.get("/memos/{memo_id}", response_model=GeneratedMemo)
async def get_memo(memo_id: str):
    """Get a specific memo by ID."""
    if memo_id not in memos_db:
        raise HTTPException(status_code=404, detail=f"Memo '{memo_id}' not found")
    return memos_db[memo_id]

# ============================================================================
# Utility Endpoints
# ============================================================================

@app.post("/summarize/{text}")
async def summarize_text(text: str):
    """Summarize text into key points."""
    words = text.split()
    summary = " ".join(words[:50]) + ("..." if len(words) > 50 else "")
    return {
        "original_length": len(words),
        "summary": summary,
        "key_points": [
            "First key insight from the text",
            "Second notable observation",
            "Third important takeaway",
        ],
    }

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    print("Starting AssetMind Memo Writer on port 5285")
    uvicorn.run(app, host="0.0.0.0", port=5285)
