"""
AssetMind Twin v2 Service
Enhanced asset digital twin with company analysis, peer comparison, SWOT, and valuation

Port: 5002

Version: 1.0.0
"""

import uuid
import random
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
    title="AssetMind Twin v2",
    description="Enhanced asset digital twin with company analysis",
    version="1.0.0",
)

# ============================================================================
# Enums
# ============================================================================

class CompanyStage(str, Enum):
    STARTUP = "startup"
    GROWTH = "growth"
    MATURE = "mature"
    TURNAROUND = "turnaround"
    DECLINE = "decline"

class Sector(str, Enum):
    TECHNOLOGY = "technology"
    HEALTHCARE = "healthcare"
    FINANCE = "finance"
    CONSUMER = "consumer"
    INDUSTRIAL = "industrial"
    ENERGY = "energy"
    MATERIALS = "materials"
    UTILITIES = "utilities"
    REAL_ESTATE = "real_estate"

class ValuationMethod(str, Enum):
    DCF = "dcf"
    COMPARABLE = "comparable"
    PRECEDENT = "precedent"
    ASSET_BASED = "asset_based"
    BREAKUP = "breakup"

class Recommendation(str, Enum):
    STRONG_BUY = "strong_buy"
    BUY = "buy"
    HOLD = "hold"
    SELL = "sell"
    STRONG_SELL = "strong_sell"

# ============================================================================
# Pydantic Models - Company Data
# ============================================================================

class FinancialMetrics(BaseModel):
    revenue: float
    revenue_growth: float
    ebitda: Optional[float] = None
    ebitda_margin: Optional[float] = None
    net_income: Optional[float] = None
    net_margin: Optional[float] = None
    eps: Optional[float] = None
    pe_ratio: Optional[float] = None
    market_cap: Optional[float] = None
    enterprise_value: Optional[float] = None
    debt_to_equity: Optional[float] = None
    current_ratio: Optional[float] = None
    quick_ratio: Optional[float] = None
    return_on_equity: Optional[float] = None
    return_on_assets: Optional[float] = None

class BusinessMetrics(BaseModel):
    customer_count: Optional[int] = None
    customer_growth: Optional[float] = None
    net_retention: Optional[float] = None
    gross_margin: Optional[float] = None
    burn_rate: Optional[float] = None
    runway_months: Optional[int] = None
    market_share: Optional[float] = None

class SWOTAnalysis(BaseModel):
    strengths: List[str] = []
    weaknesses: List[str] = []
    opportunities: List[str] = []
    threats: List[str] = []

class PeerComparison(BaseModel):
    peer_symbol: str
    peer_name: str
    metric: str
    company_value: float
    peer_value: float
    difference_pct: float
    advantage: str  # "company" or "peer"

class ValuationResult(BaseModel):
    method: ValuationMethod
    low_estimate: float
    median_estimate: float
    high_estimate: float
    implied_multiple: Optional[float] = None
    key_assumptions: List[str] = []

class PeerValuation(BaseModel):
    sector: Sector
    peer_count: int
    median_ev_ebitda: float
    median_pe: float
    median_ps: float

# ============================================================================
# Pydantic Models - Twin Entity
# ============================================================================

class CompanyTwin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str
    name: str
    sector: Sector
    stage: CompanyStage

    # Description
    description: str = ""
    founded_year: Optional[int] = None
    headquarters: Optional[str] = None
    employee_count: Optional[int] = None

    # Financials
    financial_metrics: Optional[FinancialMetrics] = None
    business_metrics: Optional[BusinessMetrics] = None

    # Analysis
    swot: Optional[SWOTAnalysis] = None
    valuation: Optional[Dict[str, ValuationResult]] = None
    peer_valuation: Optional[PeerValuation] = None

    # Recommendation
    recommendation: Recommendation = Recommendation.HOLD
    target_price: Optional[float] = None
    upside_potential: Optional[float] = None
    confidence: float = 0.5

    # Metadata
    last_analysis: Optional[datetime] = None
    analysts_count: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

# ============================================================================
# Request/Response Models
# ============================================================================

class TwinCreateRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=200)
    sector: Sector
    stage: CompanyStage = CompanyStage.MATURE
    description: Optional[str] = None

class FinancialDataRequest(BaseModel):
    revenue: float = Field(..., gt=0)
    ebitda: Optional[float] = None
    net_income: Optional[float] = None
    eps: Optional[float] = None
    market_cap: Optional[float] = None
    debt_to_equity: Optional[float] = None

class ComparisonRequest(BaseModel):
    symbols: List[str] = Field(..., min_items=2, max_items=10)
    metrics: List[str] = ["revenue", "ebitda_margin", "pe_ratio", "growth"]

# ============================================================================
# In-Memory Storage
# ============================================================================

twins_db: Dict[str, CompanyTwin] = {}

def create_sample_twin(symbol: str, name: str, sector: Sector, stage: CompanyStage) -> CompanyTwin:
    """Create a sample company twin with analysis data."""
    twin = CompanyTwin(
        symbol=symbol,
        name=name,
        sector=sector,
        stage=stage,
        description=f"{name} is a leading company in the {sector.value} sector.",
        founded_year=random.randint(1970, 2015),
        headquarters="San Francisco, CA",
        employee_count=random.randint(100, 100000),
        financial_metrics=FinancialMetrics(
            revenue=random.uniform(1e8, 1e12),
            revenue_growth=random.uniform(-10, 50),
            ebitda_margin=random.uniform(10, 40),
            net_margin=random.uniform(5, 25),
            pe_ratio=random.uniform(10, 50),
            market_cap=random.uniform(1e9, 3e12),
            return_on_equity=random.uniform(5, 30),
        ),
        business_metrics=BusinessMetrics(
            customer_count=random.randint(1000, 10000000),
            customer_growth=random.uniform(5, 50),
            net_retention=random.uniform(90, 130),
            gross_margin=random.uniform(40, 80),
        ),
        swot=SWOTAnalysis(
            strengths=[
                "Strong brand recognition",
                "Proprietary technology",
                "Experienced management team",
                "Diversified revenue streams",
            ],
            weaknesses=[
                "High operating costs",
                "Dependence on key customers",
                "Limited international presence",
            ],
            opportunities=[
                "Expanding into emerging markets",
                "Strategic acquisitions",
                "New product launches",
            ],
            threats=[
                "Intense competition",
                "Regulatory challenges",
                "Economic downturns",
            ],
        ),
        recommendation=random.choice(list(Recommendation)),
        target_price=random.uniform(100, 500),
        upside_potential=random.uniform(-20, 50),
        confidence=random.uniform(0.6, 0.9),
        last_analysis=datetime.utcnow(),
    )
    twins_db[twin.id] = twin
    return twin

# Initialize sample twins
init_twins = [
    ("AAPL", "Apple Inc.", Sector.TECHNOLOGY, CompanyStage.MATURE),
    ("GOOGL", "Alphabet Inc.", Sector.TECHNOLOGY, CompanyStage.MATURE),
    ("MSFT", "Microsoft Corp.", Sector.TECHNOLOGY, CompanyStage.MATURE),
    ("AMZN", "Amazon.com Inc.", Sector.CONSUMER, CompanyStage.MATURE),
    ("TSLA", "Tesla Inc.", Sector.CONSUMER, CompanyStage.GROWTH),
    ("NVDA", "NVIDIA Corp.", Sector.TECHNOLOGY, CompanyStage.GROWTH),
    ("META", "Meta Platforms", Sector.TECHNOLOGY, CompanyStage.MATURE),
    ("NFLX", "Netflix Inc.", Sector.TECHNOLOGY, CompanyStage.MATURE),
]

for symbol, name, sector, stage in init_twins:
    create_sample_twin(symbol, name, sector, stage)

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-twin-v2",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {
            "total_twins": len(twins_db),
            "by_sector": {s.value: sum(1 for t in twins_db.values() if t.sector == s) for s in Sector},
            "by_stage": {st.value: sum(1 for t in twins_db.values() if t.stage == st) for st in CompanyStage},
        },
    }

# ============================================================================
# Twin Management Endpoints
# ============================================================================

@app.get("/api/twin/{symbol}", response_model=CompanyTwin)
async def get_twin(symbol: str):
    """Get company twin by symbol."""
    for twin in twins_db.values():
        if twin.symbol == symbol.upper():
            return twin
    raise HTTPException(status_code=404, detail=f"Twin for {symbol} not found")

@app.get("/api/twins", response_model=List[CompanyTwin])
async def list_twins(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    sector: Optional[Sector] = None,
    stage: Optional[CompanyStage] = None,
):
    """List all twins with optional filtering."""
    twins = list(twins_db.values())

    if sector:
        twins = [t for t in twins if t.sector == sector]
    if stage:
        twins = [t for t in twins if t.stage == stage]

    return twins[skip : skip + limit]

@app.post("/api/twin", response_model=CompanyTwin, status_code=201)
async def create_twin(request: TwinCreateRequest):
    """Create a new company twin."""
    for existing in twins_db.values():
        if existing.symbol == request.symbol.upper():
            raise HTTPException(status_code=400, detail=f"Twin for {request.symbol} already exists")

    twin = create_sample_twin(
        symbol=request.symbol.upper(),
        name=request.name,
        sector=request.sector,
        stage=request.stage,
    )
    if request.description:
        twin.description = request.description

    return twin

@app.get("/api/twin/{symbol}/swot", response_model=SWOTAnalysis)
async def get_swot_analysis(symbol: str):
    """Get SWOT analysis for a company."""
    twin = await get_twin(symbol)
    if not twin.swot:
        raise HTTPException(status_code=404, detail="SWOT analysis not available")
    return twin.swot

@app.get("/api/twin/{symbol}/valuation")
async def get_valuation(symbol: str):
    """Get valuation analysis for a company."""
    twin = await get_twin(symbol)

    # Generate sample valuation
    current_price = twin.target_price or 100
    return {
        "symbol": symbol,
        "current_price": current_price,
        "valuations": {
            "dcf": {
                "method": ValuationMethod.DCF,
                "low_estimate": current_price * 0.8,
                "median_estimate": current_price,
                "high_estimate": current_price * 1.3,
                "key_assumptions": [
                    "5-year DCF projection",
                    "10% discount rate",
                    "Terminal growth of 3%",
                ],
            },
            "comparable": {
                "method": ValuationMethod.COMPARABLE,
                "low_estimate": current_price * 0.85,
                "median_estimate": current_price * 1.05,
                "high_estimate": current_price * 1.4,
                "implied_multiple": random.uniform(15, 30),
                "key_assumptions": [
                    "Sector median multiples",
                    "Size premium applied",
                    "Quality premium considered",
                ],
            },
        },
        "recommendation": twin.recommendation.value,
        "target_price": twin.target_price,
        "upside_potential": twin.upside_potential,
        "confidence": twin.confidence,
    }

# ============================================================================
# Comparison Endpoints
# ============================================================================

@app.post("/api/compare", response_model=List[Dict[str, Any]])
async def compare_companies(request: ComparisonRequest):
    """Compare multiple companies on specified metrics."""
    companies = []
    for symbol in request.symbols:
        try:
            twin = await get_twin(symbol)
            companies.append(twin)
        except HTTPException:
            continue

    if len(companies) < 2:
        raise HTTPException(status_code=400, detail="At least 2 valid companies required")

    comparisons = []
    for metric in request.metrics:
        metric_data = []
        for company in companies:
            fm = company.financial_metrics
            if not fm:
                continue

            value = getattr(fm, metric, None)
            if value is not None:
                metric_data.append({
                    "symbol": company.symbol,
                    "name": company.name,
                    "value": value,
                })

        if len(metric_data) >= 2:
            sorted_data = sorted(metric_data, key=lambda x: x["value"], reverse=True)
            comparisons.append({
                "metric": metric,
                "comparison": sorted_data,
            })

    return {
        "symbols": request.symbols,
        "comparison": comparisons,
    }

@app.get("/api/compare/{symbols}", response_model=Dict[str, Any])
async def compare_symbols(symbols: str):
    """Compare multiple companies by comma-separated symbols."""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    return await compare_companies(ComparisonRequest(symbols=symbol_list))

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    logger.info("Starting AssetMind Twin v2 on port 5002")
    uvicorn.run(app, host="0.0.0.0", port=5002)
