"""
AssetMind Competitor Twin Service
Competitor analysis and competitive intelligence
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind Competitor Twin",
    description="Competitor analysis and competitive intelligence service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Enums
# ============================================================================

class CompanySize(str, Enum):
    STARTUP = "startup"           # < $1M revenue
    SMALL = "small"               # $1M - $10M
    MEDIUM = "medium"             # $10M - $100M
    LARGE = "large"               # $100M - $1B
    ENTERPRISE = "enterprise"     # > $1B

class CompetitorType(str, Enum):
    DIRECT = "direct"             # Same products/services
    INDIRECT = "indirect"         # Different products, same needs
    POTENTIAL = "potential"       # Could enter your market
    SUBSTITUTE = "substitute"     # Alternative solutions

class ThreatLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class MarketPosition(str, Enum):
    LEADER = "leader"
    CHALLENGER = "challenger"
    FOLLOWER = "follower"
    NICHE = "niche"

# ============================================================================
# Pydantic Models
# ============================================================================

class FinancialMetrics(BaseModel):
    revenue: Optional[float] = None
    revenue_growth: Optional[float] = None
    profit_margin: Optional[float] = None
    market_cap: Optional[float] = None
    valuation: Optional[float] = None
    burn_rate: Optional[float] = None
    runway_months: Optional[int] = None

class ProductOffering(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    price_range: Optional[str] = None
    target_segment: Optional[str] = None
    features: List[str] = []
    launch_date: Optional[datetime] = None

class MarketPresence(BaseModel):
    regions: List[str] = []
    countries: List[str] = []
    market_share: Optional[float] = None
    customer_count: Optional[int] = None
    nps_score: Optional[float] = None

class TechnologyStack(BaseModel):
    platforms: List[str] = []
    frameworks: List[str] = []
    infrastructure: List[str] = []
    ai_ml_capabilities: List[str] = []
    proprietary_tech: List[str] = []

class LeadershipTeam(BaseModel):
    ceo: Optional[str] = None
    cto: Optional[str] = None
    cfo: Optional[str] = None
    key_executives: List[Dict[str, str]] = []

class CompetitorTwin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    legal_name: Optional[str] = None

    # Classification
    type: CompetitorType
    size: CompanySize
    position: MarketPosition = MarketPosition.FOLLOWER

    # Business Info
    industry: str
    sector: Optional[str] = None
    founded_year: Optional[int] = None
    headquarters: Optional[str] = None
    website: Optional[str] = None

    # Financial
    financials: FinancialMetrics = Field(default_factory=FinancialMetrics)

    # Presence
    presence: MarketPresence = Field(default_factory=MarketPresence)

    # Products
    products: List[ProductOffering] = []

    # Technology
    tech_stack: TechnologyStack = Field(default_factory=TechnologyStack)

    # Team
    leadership: LeadershipTeam = Field(default_factory=LeadershipTeam)

    # Threat Assessment
    threat_level: ThreatLevel = ThreatLevel.MEDIUM
    threat_factors: List[str] = []

    # Metadata
    data_sources: List[str] = []
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CompetitorCreateRequest(BaseModel):
    name: str
    type: CompetitorType
    industry: str
    size: Optional[CompanySize] = None
    headquarters: Optional[str] = None
    website: Optional[str] = None
    data_sources: Optional[List[str]] = None

class ThreatAnalysis(BaseModel):
    competitor_id: str
    competitor_name: str
    threat_level: ThreatLevel
    threat_score: float = Field(ge=0, le=1)
    swot: Dict[str, List[str]]
    key_threats: List[str]
    opportunities: List[str]
    recommendations: List[str]

class CompetitiveLandscape(BaseModel):
    total_competitors: int
    by_type: Dict[str, int]
    by_size: Dict[str, int]
    by_position: Dict[str, int]
    market_concentration: float
    average_threat_score: float

class ComparisonRequest(BaseModel):
    company_id: str
    competitor_ids: List[str]
    metrics: List[str] = ["revenue", "growth", "market_share", "tech_stack"]

class ComparisonResult(BaseModel):
    company_id: str
    competitor_id: str
    metrics_compared: Dict[str, Any]
    advantages: List[str]
    disadvantages: List[str]
    similarity_score: float

# ============================================================================
# In-Memory Storage
# ============================================================================

competitors_db: Dict[str, CompetitorTwin] = {}
threat_analysis_db: Dict[str, ThreatAnalysis] = {}

# Initialize sample data
_initialize_sample_data()

def _initialize_sample_data():
    sample_competitors = [
        CompetitorTwin(
            name="TechCorp Global",
            legal_name="TechCorp Global Inc.",
            type=CompetitorType.DIRECT,
            size=CompanySize.ENTERPRISE,
            position=MarketPosition.LEADER,
            industry="Technology",
            sector="Enterprise Software",
            founded_year=2010,
            headquarters="San Francisco, CA",
            website="https://techcorp.example.com",
            financials=FinancialMetrics(
                revenue=5000000000,
                revenue_growth=0.15,
                profit_margin=0.25,
                market_cap=100000000000
            ),
            presence=MarketPresence(
                regions=["North America", "Europe", "Asia"],
                countries=["USA", "UK", "Germany", "Japan", "Singapore"],
                market_share=0.35,
                customer_count=50000
            ),
            tech_stack=TechnologyStack(
                platforms=["Cloud", "Mobile", "Web"],
                frameworks=["React", "Node.js", "Python"],
                ai_ml_capabilities=["NLP", "Computer Vision", "Predictive Analytics"]
            ),
            threat_level=ThreatLevel.CRITICAL,
            data_sources=["public_filings", "press_releases", "crunchbase"]
        ),
        CompetitorTwin(
            name="InnovateAI",
            legal_name="InnovateAI Labs",
            type=CompetitorType.DIRECT,
            size=CompanySize.MEDIUM,
            position=MarketPosition.CHALLENGER,
            industry="Technology",
            sector="AI Solutions",
            founded_year=2018,
            headquarters="Austin, TX",
            financials=FinancialMetrics(
                revenue=50000000,
                revenue_growth=0.80,
                profit_margin=0.10,
                burn_rate=2000000
            ),
            presence=MarketPresence(
                regions=["North America"],
                countries=["USA", "Canada"],
                market_share=0.08
            ),
            tech_stack=TechnologyStack(
                ai_ml_capabilities=["LLM", "Agent Systems", "RAG"]
            ),
            threat_level=ThreatLevel.HIGH,
            data_sources=["crunchbase", "linkedin", "news"]
        ),
    ]
    for comp in sample_competitors:
        competitors_db[comp.id] = comp

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "assetmind-competitor-twin",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "competitors_count": len(competitors_db)
    }

@app.get("/ready")
async def readiness_check():
    """Readiness check"""
    return {"ready": True}

# ============================================================================
# Competitor CRUD Endpoints
# ============================================================================

@app.post("/api/v1/competitors", response_model=CompetitorTwin, status_code=201)
async def create_competitor(request: CompetitorCreateRequest):
    """Add a new competitor to track"""
    competitor = CompetitorTwin(
        name=request.name,
        type=request.type,
        industry=request.industry,
        size=request.size or CompanySize.MEDIUM,
        headquarters=request.headquarters,
        website=request.website,
        data_sources=request.data_sources or []
    )
    competitors_db[competitor.id] = competitor
    return competitor

@app.get("/api/v1/competitors", response_model=List[CompetitorTwin])
async def list_competitors(
    type: Optional[CompetitorType] = None,
    size: Optional[CompanySize] = None,
    industry: Optional[str] = None,
    threat_level: Optional[ThreatLevel] = None,
    limit: int = Query(default=50, le=200)
):
    """List competitors with filters"""
    results = list(competitors_db.values())

    if type:
        results = [c for c in results if c.type == type]
    if size:
        results = [c for c in results if c.size == size]
    if industry:
        results = [c for c in results if c.industry == industry]
    if threat_level:
        results = [c for c in results if c.threat_level == threat_level]

    return results[:limit]

@app.get("/api/v1/competitors/{competitor_id}", response_model=CompetitorTwin)
async def get_competitor(competitor_id: str):
    """Get competitor details"""
    if competitor_id not in competitors_db:
        raise HTTPException(status_code=404, detail="Competitor not found")
    return competitors_db[competitor_id]

@app.put("/api/v1/competitors/{competitor_id}", response_model=CompetitorTwin)
async def update_competitor(competitor_id: str, competitor: CompetitorTwin):
    """Update competitor information"""
    if competitor_id not in competitors_db:
        raise HTTPException(status_code=404, detail="Competitor not found")
    competitor.last_updated = datetime.utcnow()
    competitors_db[competitor_id] = competitor
    return competitor

@app.delete("/api/v1/competitors/{competitor_id}", status_code=204)
async def delete_competitor(competitor_id: str):
    """Remove a competitor"""
    if competitor_id not in competitors_db:
        raise HTTPException(status_code=404, detail="Competitor not found")
    del competitors_db[competitor_id]

# ============================================================================
# Threat Analysis Endpoints
# ============================================================================

@app.post("/api/v1/threat-analysis/{competitor_id}", response_model=ThreatAnalysis)
async def analyze_threat(competitor_id: str):
    """Perform threat analysis for a competitor"""
    if competitor_id not in competitors_db:
        raise HTTPException(status_code=404, detail="Competitor not found")

    competitor = competitors_db[competitor_id]

    # Calculate threat score based on factors
    threat_score = 0.5
    if competitor.threat_level == ThreatLevel.CRITICAL:
        threat_score = 0.95
    elif competitor.threat_level == ThreatLevel.HIGH:
        threat_score = 0.75
    elif competitor.threat_level == ThreatLevel.LOW:
        threat_score = 0.25

    analysis = ThreatAnalysis(
        competitor_id=competitor_id,
        competitor_name=competitor.name,
        threat_level=competitor.threat_level,
        threat_score=threat_score,
        swot={
            "strengths": ["Brand recognition", "Large team", "Funding"],
            "weaknesses": ["Slow to innovate", "Legacy systems"],
            "opportunities": ["Market expansion", "New verticals"],
            "threats": ["Disruption", "Regulatory changes"]
        },
        key_threats=[
            "Rapid technology advancement",
            "Aggressive pricing strategy",
            "Strong partner ecosystem"
        ],
        opportunities=[
            "Partner with complementary providers",
            "Focus on underserved segments"
        ],
        recommendations=[
            "Accelerate innovation cycle",
            "Enhance value proposition",
            "Build strategic partnerships"
        ]
    )

    threat_analysis_db[competitor_id] = analysis
    return analysis

@app.get("/api/v1/threat-analysis/{competitor_id}", response_model=ThreatAnalysis)
async def get_threat_analysis(competitor_id: str):
    """Get threat analysis for a competitor"""
    if competitor_id in threat_analysis_db:
        return threat_analysis_db[competitor_id]
    return await analyze_threat(competitor_id)

# ============================================================================
# Competitive Landscape
# ============================================================================

@app.get("/api/v1/landscape", response_model=CompetitiveLandscape)
async def get_competitive_landscape():
    """Get overall competitive landscape summary"""
    competitors = list(competitors_db.values())

    by_type: Dict[str, int] = {}
    by_size: Dict[str, int] = {}
    by_position: Dict[str, int] = {}
    total_threat = 0.0

    for comp in competitors:
        by_type[comp.type.value] = by_type.get(comp.type.value, 0) + 1
        by_size[comp.size.value] = by_size.get(comp.size.value, 0) + 1
        by_position[comp.position.value] = by_position.get(comp.position.value, 0) + 1

        if comp.id in threat_analysis_db:
            total_threat += threat_analysis_db[comp.id].threat_score
        else:
            total_threat += 0.5

    return CompetitiveLandscape(
        total_competitors=len(competitors),
        by_type=by_type,
        by_size=by_size,
        by_position=by_position,
        market_concentration=0.65,  # HHI-like measure
        average_threat_score=total_threat / len(competitors) if competitors else 0
    )

# ============================================================================
# Comparison Endpoints
# ============================================================================

@app.post("/api/v1/compare", response_model=List[ComparisonResult])
async def compare_competitors(request: ComparisonRequest):
    """Compare company with competitors"""
    results = []

    for comp_id in request.competitor_ids:
        if comp_id not in competitors_db:
            continue

        comp = competitors_db[comp_id]
        result = ComparisonResult(
            company_id=request.company_id,
            competitor_id=comp_id,
            metrics_compared={
                "revenue": comp.financials.revenue,
                "growth": comp.financials.revenue_growth,
                "market_share": comp.presence.market_share,
                "tech_stack_size": len(comp.tech_stack.ai_ml_capabilities)
            },
            advantages=[
                "Better market presence in key regions",
                "Stronger AI capabilities"
            ],
            disadvantages=[
                "Lower revenue growth rate",
                "Smaller team size"
            ],
            similarity_score=0.72
        )
        results.append(result)

    return results

# ============================================================================
# Run with uvicorn
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5003)