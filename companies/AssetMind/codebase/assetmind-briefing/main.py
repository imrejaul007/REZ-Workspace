"""
AssetMind Briefing Service
Morning briefings and financial reports generation

This service provides:
- Morning briefings generation
- Evening market summaries
- Weekly and monthly reports
- Custom briefing templates
- Briefing scheduling and distribution
- AI-powered content generation

Port: 5200

Version: 1.0.0
Date: June 11, 2026
"""

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set
from uuid import uuid4

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    FastAPI,
    HTTPException,
    Path,
    Query,
    Request,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

# ============================================================================
# Logging Configuration
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("assetmind-briefing")

# ============================================================================
# Enums
# ============================================================================

class BriefingType(str, Enum):
    """Briefing type enumeration"""
    MORNING = "morning"
    EVENING = "evening"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    CUSTOM = "custom"


class BriefingStatus(str, Enum):
    """Briefing status enumeration"""
    DRAFT = "draft"
    GENERATING = "generating"
    READY = "ready"
    SENT = "sent"
    ARCHIVED = "archived"


class MarketSentiment(str, Enum):
    """Market sentiment"""
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"
    VOLATILE = "volatile"


class AssetClass(str, Enum):
    """Asset class filter"""
    STOCK = "STOCK"
    CRYPTO = "CRYPTO"
    FOREX = "FOREX"
    COMMODITY = "COMMODITY"
    ETF = "ETF"
    INDEX = "INDEX"


# ============================================================================
# Pydantic Models
# ============================================================================

class BriefingSection(BaseModel):
    """Briefing section model"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    content: str
    type: str = "text"  # text, table, chart, list, metrics
    data: Optional[Dict[str, Any]] = None
    order: int = 0


class BriefingMetrics(BaseModel):
    """Briefing metrics summary"""
    market_open: Optional[str] = None
    market_close: Optional[str] = None
    sp500_change: Optional[float] = None
    nasdaq_change: Optional[float] = None
    dow_change: Optional[float] = None
    fear_greed_index: Optional[int] = None
    vix_change: Optional[float] = None
    top_sector: Optional[str] = None
    worst_sector: Optional[str] = None


class TopMover(BaseModel):
    """Top market mover"""
    symbol: str
    name: str
    change_pct: float
    price: float
    volume: Optional[float] = None
    reason: Optional[str] = None


class Briefing(BaseModel):
    """Complete briefing model"""
    id: str
    type: BriefingType
    title: str
    subtitle: Optional[str] = None
    date: str  # YYYY-MM-DD
    status: BriefingStatus
    summary: str
    sentiment: MarketSentiment

    # Content sections
    metrics: BriefingMetrics
    top_gainers: List[TopMover] = Field(default_factory=list)
    top_losers: List[TopMover] = Field(default_factory=list)
    sections: List[BriefingSection] = Field(default_factory=list)

    # Metadata
    symbols_included: List[str] = Field(default_factory=list)
    generated_by: str = "AI"
    created_at: datetime
    updated_at: datetime
    sent_at: Optional[datetime] = None


class BriefingCreateRequest(BaseModel):
    """Briefing creation request"""
    type: BriefingType
    title: Optional[str] = None
    date: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    symbols: List[str] = Field(default_factory=list)
    preferences: Dict[str, Any] = Field(default_factory=dict)


class BriefingUpdateRequest(BaseModel):
    """Briefing update request"""
    title: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[BriefingStatus] = None
    sections: Optional[List[BriefingSection]] = None


class BriefingListResponse(BaseModel):
    """Paginated briefing list"""
    briefings: List[Dict[str, Any]]
    total: int
    limit: int
    offset: int


class BriefingPreferences(BaseModel):
    """User briefing preferences"""
    user_id: str
    default_type: BriefingType = BriefingType.MORNING
    symbols: List[str] = Field(default_factory=list)
    sections_order: List[str] = Field(default_factory=list)
    include_sectors: List[str] = Field(default_factory=list)
    exclude_sectors: List[str] = Field(default_factory=list)
    language: str = "en"
    timezone: str = "UTC"


class BriefingSchedule(BaseModel):
    """Briefing schedule configuration"""
    id: str
    user_id: str
    briefing_type: BriefingType
    time: str  # HH:MM
    timezone: str = "UTC"
    active: bool = True
    days_of_week: List[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5])  # 1=Mon
    created_at: datetime


class BriefingTemplate(BaseModel):
    """Briefing template"""
    id: str
    name: str
    type: BriefingType
    sections: List[Dict[str, Any]]
    is_default: bool = False
    created_at: datetime


class BriefingStatistics(BaseModel):
    """Briefing statistics"""
    total_briefings: int
    by_type: Dict[str, int]
    by_status: Dict[str, int]
    avg_generation_time_seconds: float
    most_active_users: List[Dict[str, Any]]


# ============================================================================
# Application State
# ============================================================================

class BriefingState:
    """Application state for briefing service"""

    def __init__(self):
        self.briefings: Dict[str, Briefing] = {}
        self.preferences: Dict[str, BriefingPreferences] = {}
        self.schedules: Dict[str, BriefingSchedule] = {}
        self.templates: Dict[str, BriefingTemplate] = {}
        self.generation_stats: Dict[str, float] = {}
        self.start_time = time.time()

    def create_briefing(
        self,
        brief_type: BriefingType,
        date: str,
        title: Optional[str] = None,
        symbols: Optional[List[str]] = None,
    ) -> Briefing:
        """Create a new briefing"""
        briefing_id = str(uuid4())

        # Generate title if not provided
        if not title:
            type_names = {
                BriefingType.MORNING: "Morning Market Briefing",
                BriefingType.EVENING: "Evening Market Summary",
                BriefingType.WEEKLY: "Weekly Market Report",
                BriefingType.MONTHLY: "Monthly Market Review",
                BriefingType.QUARTERLY: "Quarterly Market Outlook",
                BriefingType.CUSTOM: "Custom Market Briefing",
            }
            title = f"{type_names[brief_type]} - {date}"

        briefing = Briefing(
            id=briefing_id,
            type=brief_type,
            title=title,
            date=date,
            status=BriefingStatus.DRAFT,
            summary="",
            sentiment=MarketSentiment.NEUTRAL,
            metrics=BriefingMetrics(),
            symbols_included=symbols or [],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        self.briefings[briefing_id] = briefing
        return briefing

    def get_briefing(self, briefing_id: str) -> Optional[Briefing]:
        """Get briefing by ID"""
        return self.briefings.get(briefing_id)

    def get_briefing_by_date(self, brief_type: BriefingType, date: str) -> Optional[Briefing]:
        """Get briefing by type and date"""
        for briefing in self.briefings.values():
            if briefing.type == brief_type and briefing.date == date:
                return briefing
        return None

    def list_briefings(
        self,
        brief_type: Optional[BriefingType] = None,
        status: Optional[BriefingStatus] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Briefing]:
        """List briefings with filters"""
        results = list(self.briefings.values())

        if brief_type:
            results = [b for b in results if b.type == brief_type]
        if status:
            results = [b for b in results if b.status == status]

        # Sort by date descending
        results.sort(key=lambda b: b.date, reverse=True)

        return results[offset:offset + limit]

    def get_statistics(self) -> BriefingStatistics:
        """Get briefing statistics"""
        by_type: Dict[str, int] = {}
        by_status: Dict[str, int] = {}
        total_time = 0

        for briefing in self.briefings.values():
            by_type[briefing.type.value] = by_type.get(briefing.type.value, 0) + 1
            by_status[briefing.status.value] = by_status.get(briefing.status.value, 0) + 1

        gen_times = list(self.generation_stats.values())
        avg_time = sum(gen_times) / len(gen_times) if gen_times else 0

        return BriefingStatistics(
            total_briefings=len(self.briefings),
            by_type=by_type,
            by_status=by_status,
            avg_generation_time_seconds=avg_time,
            most_active_users=[],
        )

    def add_template(self, template: BriefingTemplate):
        """Add a briefing template"""
        self.templates[template.id] = template

    def get_template(self, brief_type: BriefingType) -> Optional[BriefingTemplate]:
        """Get template by briefing type"""
        for template in self.templates.values():
            if template.type == brief_type and template.is_default:
                return template
        return None


# Global state
state = BriefingState()


# ============================================================================
# Sample Data Generation
# ============================================================================

def generate_sample_market_data() -> Dict[str, Any]:
    """Generate sample market data for briefings"""
    import random

    return {
        "sp500": {
            "value": round(random.uniform(5200, 5400), 2),
            "change": round(random.uniform(-1.5, 2.0), 2),
        },
        "nasdaq": {
            "value": round(random.uniform(17000, 18000), 2),
            "change": round(random.uniform(-1.5, 2.5), 2),
        },
        "dow": {
            "value": round(random.uniform(38000, 40000), 2),
            "change": round(random.uniform(-1.0, 1.5), 2),
        },
        "fear_greed": random.randint(20, 80),
        "vix": round(random.uniform(12, 25), 2),
    }


def generate_sample_movers(count: int = 5) -> List[TopMover]:
    """Generate sample top movers"""
    import random

    sample_stocks = [
        ("AAPL", "Apple Inc"),
        ("MSFT", "Microsoft Corporation"),
        ("GOOGL", "Alphabet Inc"),
        ("AMZN", "Amazon.com Inc"),
        ("NVDA", "NVIDIA Corporation"),
        ("META", "Meta Platforms Inc"),
        ("TSLA", "Tesla Inc"),
        ("JPM", "JPMorgan Chase"),
        ("V", "Visa Inc"),
        ("WMT", "Walmart Inc"),
    ]

    movers = []
    for symbol, name in random.sample(sample_stocks, min(count, len(sample_stocks))):
        movers.append(TopMover(
            symbol=symbol,
            name=name,
            change_pct=round(random.uniform(-5, 8), 2),
            price=round(random.uniform(50, 500), 2),
            volume=round(random.uniform(1000000, 50000000), 0),
        ))

    return movers


def generate_briefing_content(briefing: Briefing, symbols: List[str]) -> Briefing:
    """Generate AI-powered briefing content"""
    import random

    # Generate market data
    market_data = generate_sample_market_data()

    # Update metrics
    briefing.metrics = BriefingMetrics(
        market_open="09:30 ET",
        market_close="16:00 ET",
        sp500_change=market_data["sp500"]["change"],
        nasdaq_change=market_data["nasdaq"]["change"],
        dow_change=market_data["dow"]["change"],
        fear_greed_index=market_data["fear_greed"],
        vix_change=round(random.uniform(-5, 5), 2),
        top_sector="Technology",
        worst_sector="Energy",
    )

    # Set sentiment
    if market_data["fear_greed"] > 60:
        briefing.sentiment = MarketSentiment.BULLISH
    elif market_data["fear_greed"] < 40:
        briefing.sentiment = MarketSentiment.BEARISH
    else:
        briefing.sentiment = MarketSentiment.NEUTRAL

    # Generate summary
    sp500_dir = "gained" if market_data["sp500"]["change"] > 0 else "lost"
    briefing.summary = (
        f"The market {sp500_dir} {abs(market_data['sp500']['change'])}% today. "
        f"The S&P 500 closed at {market_data['sp500']['value']}, while the NASDAQ "
        f"{'gained' if market_data['nasdaq']['change'] > 0 else 'fell'} "
        f"{abs(market_data['nasdaq']['change'])}%. "
        f"Fear & Greed Index stands at {market_data['fear_greed']}."
    )

    # Add top movers
    briefing.top_gainers = sorted(
        generate_sample_movers(5),
        key=lambda m: m.change_pct,
        reverse=True
    )
    briefing.top_losers = sorted(
        generate_sample_movers(5),
        key=lambda m: m.change_pct
    )

    # Generate sections
    sections = [
        BriefingSection(
            title="Market Overview",
            content=briefing.summary,
            type="text",
            order=1,
        ),
        BriefingSection(
            title="Key Indices",
            content="",
            type="table",
            data={
                "headers": ["Index", "Value", "Change", "Change %"],
                "rows": [
                    ["S&P 500", str(market_data["sp500"]["value"]),
                     f"{market_data['sp500']['change']:+.2f}",
                     f"{(market_data['sp500']['change'] / market_data['sp500']['value'] * 100):+.2f}%"],
                    ["NASDAQ", str(market_data["nasdaq"]["value"]),
                     f"{market_data['nasdaq']['change']:+.2f}",
                     f"{(market_data['nasdaq']['change'] / market_data['nasdaq']['value'] * 100):+.2f}%"],
                    ["Dow Jones", str(market_data["dow"]["value"]),
                     f"{market_data['dow']['change']:+.2f}",
                     f"{(market_data['dow']['change'] / market_data['dow']['value'] * 100):+.2f}%"],
                ]
            },
            order=2,
        ),
        BriefingSection(
            title="Top Gainers",
            content="",
            type="list",
            data={
                "items": [
                    f"{m.symbol}: {m.change_pct:+.2f}% (${m.price})"
                    for m in briefing.top_gainers[:3]
                ]
            },
            order=3,
        ),
        BriefingSection(
            title="Top Losers",
            content="",
            type="list",
            data={
                "items": [
                    f"{m.symbol}: {m.change_pct:+.2f}% (${m.price})"
                    for m in briefing.top_losers[:3]
                ]
            },
            order=4,
        ),
        BriefingSection(
            title="Sector Performance",
            content="",
            type="chart",
            data={
                "labels": ["Technology", "Healthcare", "Finance", "Energy", "Consumer"],
                "values": [
                    round(random.uniform(-2, 3), 2),
                    round(random.uniform(-1, 2), 2),
                    round(random.uniform(-1.5, 2), 2),
                    round(random.uniform(-2, 1.5), 2),
                    round(random.uniform(-1, 2.5), 2),
                ]
            },
            order=5,
        ),
        BriefingSection(
            title="Market Sentiment",
            content=f"Fear & Greed Index: {market_data['fear_greed']} - "
                    f"{'Extreme Fear' if market_data['fear_greed'] < 25 else 'Fear' if market_data['fear_greed'] < 45 else 'Neutral' if market_data['fear_greed'] < 55 else 'Greed' if market_data['fear_greed'] < 75 else 'Extreme Greed'}",
            type="metrics",
            data={"fear_greed": market_data["fear_greed"], "vix": market_data["vix"]},
            order=6,
        ),
    ]

    if briefing.type == BriefingType.MORNING:
        sections.insert(1, BriefingSection(
            title="Pre-Market Outlook",
            content="Futures are indicating a " +
                   ("positive" if market_data["sp500"]["change"] >= 0 else "negative") +
                   " open. Watch for key economic data releases and earnings reports today.",
            type="text",
            order=1,
        ))

    briefing.sections = sorted(sections, key=lambda s: s.order)
    briefing.status = BriefingStatus.READY

    return briefing


# ============================================================================
# Lifespan Manager
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("AssetMind Briefing Service starting up...")

    # Initialize default templates
    default_template = BriefingTemplate(
        id="default-morning",
        name="Default Morning Briefing",
        type=BriefingType.MORNING,
        sections=[
            {"title": "Pre-Market Outlook", "order": 1},
            {"title": "Market Overview", "order": 2},
            {"title": "Key Indices", "order": 3},
            {"title": "Top Gainers/Losers", "order": 4},
            {"title": "Sector Performance", "order": 5},
            {"title": "Market Sentiment", "order": 6},
        ],
        is_default=True,
        created_at=datetime.utcnow(),
    )
    state.add_template(default_template)

    # Create today's morning briefing
    today = datetime.utcnow().strftime("%Y-%m-%d")
    morning_briefing = state.create_briefing(
        BriefingType.MORNING,
        today,
        symbols=["SPY", "QQQ", "DIA"]
    )

    logger.info(f"Created today's briefing: {morning_briefing.id}")
    logger.info("AssetMind Briefing Service ready")

    yield

    logger.info("AssetMind Briefing Service shutting down...")


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="AssetMind Briefing Service",
    description="""
    ## AssetMind Briefing Service

    AI-powered financial briefings providing:
    - Morning market briefings
    - Evening market summaries
    - Weekly and monthly reports
    - Custom briefing templates
    - Scheduled distribution

    ### Briefing Types
    - Morning: Pre-market outlook and key data
    - Evening: End-of-day summary
    - Weekly: Week-in-review and outlook
    - Monthly: Monthly market review
    - Quarterly: Quarterly analysis
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Health Check Endpoints
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "service": "assetmind-briefing",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5200,
        "total_briefings": len(state.briefings),
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health/live", tags=["Health"])
async def liveness():
    """Kubernetes liveness probe"""
    return {"status": "alive"}


@app.get("/health/ready", tags=["Health"])
async def readiness():
    """Kubernetes readiness probe"""
    return {"status": "ready", "briefings_loaded": len(state.briefings)}


# ============================================================================
# Briefing CRUD Endpoints
# ============================================================================

briefing_router = APIRouter(prefix="/briefings", tags=["Briefings"])


@briefing_router.post("/", response_model=Briefing, status_code=201)
async def create_briefing(request: BriefingCreateRequest):
    """
    Create a new briefing

    Args:
        request: Briefing creation request

    Returns:
        Created briefing (draft status)
    """
    # Check if briefing already exists for this date and type
    existing = state.get_briefing_by_date(request.type, request.date)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Briefing for {request.type.value} on {request.date} already exists"
        )

    briefing = state.create_briefing(
        request.type,
        request.date,
        request.title,
        request.symbols,
    )

    logger.info(f"Created briefing: {briefing.id}")

    return briefing


@briefing_router.get("/", response_model=BriefingListResponse)
async def list_briefings(
    type: Optional[BriefingType] = Query(None, description="Filter by type"),
    status: Optional[BriefingStatus] = Query(None, description="Filter by status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List briefings

    Args:
        type: Filter by briefing type
        status: Filter by status
        limit: Maximum results
        offset: Pagination offset

    Returns:
        Paginated list of briefings
    """
    briefings = state.list_briefings(type, status, limit, offset)

    return BriefingListResponse(
        briefings=[
            {
                "id": b.id,
                "type": b.type.value,
                "title": b.title,
                "date": b.date,
                "status": b.status.value,
                "summary": b.summary[:100] + "..." if len(b.summary) > 100 else b.summary,
                "sentiment": b.sentiment.value,
                "created_at": b.created_at.isoformat(),
            }
            for b in briefings
        ],
        total=len(state.briefings),
        limit=limit,
        offset=offset,
    )


@briefing_router.get("/{briefing_id}", response_model=Briefing)
async def get_briefing(briefing_id: str):
    """
    Get briefing by ID

    Args:
        briefing_id: Briefing UUID

    Returns:
        Complete briefing
    """
    briefing = state.get_briefing(briefing_id)

    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing {briefing_id} not found"
        )

    return briefing


@briefing_router.get("/date/{date}", response_model=List[Briefing])
async def get_briefings_by_date(
    date: str,
    type: Optional[BriefingType] = None,
):
    """
    Get briefings by date

    Args:
        date: Date (YYYY-MM-DD)
        type: Optional briefing type

    Returns:
        List of briefings for the date
    """
    results = []

    for briefing in state.briefings.values():
        if briefing.date == date:
            if type is None or briefing.type == type:
                results.append(briefing)

    return results


@briefing_router.patch("/{briefing_id}", response_model=Briefing)
async def update_briefing(
    briefing_id: str,
    request: BriefingUpdateRequest,
):
    """
    Update briefing

    Args:
        briefing_id: Briefing UUID
        request: Update request

    Returns:
        Updated briefing
    """
    briefing = state.get_briefing(briefing_id)

    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing {briefing_id} not found"
        )

    if request.title:
        briefing.title = request.title
    if request.summary:
        briefing.summary = request.summary
    if request.status:
        briefing.status = request.status
    if request.sections:
        briefing.sections = request.sections

    briefing.updated_at = datetime.utcnow()

    return briefing


@briefing_router.delete("/{briefing_id}", status_code=204)
async def delete_briefing(briefing_id: str):
    """
    Delete briefing

    Args:
        briefing_id: Briefing UUID
    """
    if briefing_id not in state.briefings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing {briefing_id} not found"
        )

    del state.briefings[briefing_id]
    logger.info(f"Deleted briefing: {briefing_id}")


app.include_router(briefing_router)


# ============================================================================
# Briefing Generation Endpoints
# ============================================================================

generation_router = APIRouter(prefix="/generate", tags=["Generation"])


@generation_router.post("/{briefing_id}", response_model=Briefing)
async def generate_briefing(
    briefing_id: str,
    background_tasks: BackgroundTasks,
):
    """
    Generate briefing content (AI-powered)

    Args:
        briefing_id: Briefing UUID

    Returns:
        Generated briefing
    """
    briefing = state.get_briefing(briefing_id)

    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing {briefing_id} not found"
        )

    if briefing.status == BriefingStatus.GENERATING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Briefing is already being generated"
        )

    # Update status
    briefing.status = BriefingStatus.GENERATING
    briefing.updated_at = datetime.utcnow()

    # Generate content (simulated)
    start_time = time.time()

    # Simulate AI generation
    await asyncio.sleep(0.5)

    briefing = generate_briefing_content(briefing, briefing.symbols_included)
    briefing.status = BriefingStatus.READY

    # Track generation time
    gen_time = time.time() - start_time
    state.generation_stats[briefing_id] = gen_time

    logger.info(f"Generated briefing {briefing_id} in {gen_time:.2f}s")

    return briefing


@generation_router.post("/", response_model=Briefing)
async def create_and_generate(
    request: BriefingCreateRequest,
    background_tasks: BackgroundTasks,
):
    """
    Create and generate a briefing in one step

    Args:
        request: Briefing creation request

    Returns:
        Generated briefing
    """
    # Create briefing
    briefing = state.create_briefing(
        request.type,
        request.date,
        request.title,
        request.symbols,
    )

    # Generate content
    start_time = time.time()
    briefing = generate_briefing_content(briefing, request.symbols)

    # Track generation time
    gen_time = time.time() - start_time
    state.generation_stats[briefing.id] = gen_time

    return briefing


@generation_router.post("/quick/{briefing_type}", response_model=Briefing)
async def quick_generate(
    briefing_type: BriefingType,
    symbols: Optional[str] = Query(None, description="Comma-separated symbols"),
):
    """
    Quick generate a briefing

    Args:
        briefing_type: Type of briefing
        symbols: Optional comma-separated symbols

    Returns:
        Generated briefing
    """
    today = datetime.utcnow().strftime("%Y-%m-%d")

    briefing = state.create_briefing(
        briefing_type,
        today,
        symbols=symbols.split(",") if symbols else [],
    )

    # Generate content
    briefing = generate_briefing_content(briefing, briefing.symbols_included)

    return briefing


app.include_router(generation_router)


# ============================================================================
# Distribution Endpoints
# ============================================================================

@app.post("/briefings/{briefing_id}/send", tags=["Distribution"])
async def send_briefing(
    briefing_id: str,
    channels: List[str] = Query(default=["email"], description="Delivery channels"),
    recipients: List[str] = Query(default=[], description="Recipient addresses"),
):
    """
    Send briefing to recipients

    Args:
        briefing_id: Briefing UUID
        channels: Delivery channels (email, push, slack)
        recipients: Recipient list

    Returns:
        Delivery confirmation
    """
    briefing = state.get_briefing(briefing_id)

    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing {briefing_id} not found"
        )

    if briefing.status != BriefingStatus.READY:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Briefing must be READY to send (current: {briefing.status.value})"
        )

    # Simulate sending
    delivery_results = []
    for channel in channels:
        delivery_results.append({
            "channel": channel,
            "status": "sent",
            "recipients": len(recipients) if recipients else 1,
        })

    briefing.status = BriefingStatus.SENT
    briefing.sent_at = datetime.utcnow()

    return {
        "briefing_id": briefing_id,
        "sent_at": briefing.sent_at.isoformat(),
        "deliveries": delivery_results,
    }


@app.post("/briefings/{briefing_id}/archive", tags=["Distribution"])
async def archive_briefing(briefing_id: str):
    """
    Archive a briefing

    Args:
        briefing_id: Briefing UUID

    Returns:
        Archive confirmation
    """
    briefing = state.get_briefing(briefing_id)

    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing {briefing_id} not found"
        )

    briefing.status = BriefingStatus.ARCHIVED
    briefing.updated_at = datetime.utcnow()

    return {
        "briefing_id": briefing_id,
        "archived": True,
        "archived_at": briefing.updated_at.isoformat(),
    }


# ============================================================================
# Templates Endpoints
# ============================================================================

templates_router = APIRouter(prefix="/templates", tags=["Templates"])


@templates_router.post("/", response_model=BriefingTemplate, status_code=201)
async def create_template(template: BriefingTemplate):
    """
    Create a briefing template

    Args:
        template: Template definition

    Returns:
        Created template
    """
    state.add_template(template)
    return template


@templates_router.get("/", response_model=List[BriefingTemplate])
async def list_templates(type: Optional[BriefingType] = None):
    """
    List briefing templates

    Args:
        type: Filter by type

    Returns:
        List of templates
    """
    templates = list(state.templates.values())

    if type:
        templates = [t for t in templates if t.type == type]

    return templates


@templates_router.get("/{template_id}", response_model=BriefingTemplate)
async def get_template(template_id: str):
    """
    Get template by ID

    Args:
        template_id: Template UUID

    Returns:
        Template details
    """
    if template_id not in state.templates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template {template_id} not found"
        )

    return state.templates[template_id]


@templates_router.post("/{template_id}/apply/{briefing_id}", response_model=Briefing)
async def apply_template(template_id: str, briefing_id: str):
    """
    Apply template to existing briefing

    Args:
        template_id: Template UUID
        briefing_id: Briefing UUID

    Returns:
        Updated briefing
    """
    if template_id not in state.templates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template {template_id} not found"
        )

    briefing = state.get_briefing(briefing_id)
    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing {briefing_id} not found"
        )

    template = state.templates[template_id]

    # Apply section order from template
    for section_def in template.sections:
        existing = next((s for s in briefing.sections if s.title == section_def["title"]), None)
        if not existing:
            briefing.sections.append(BriefingSection(
                title=section_def["title"],
                content="",
                type="text",
                order=section_def["order"],
            ))

    briefing.sections.sort(key=lambda s: s.order)
    briefing.updated_at = datetime.utcnow()

    return briefing


app.include_router(templates_router)


# ============================================================================
# Schedule Endpoints
# ============================================================================

schedule_router = APIRouter(prefix="/schedules", tags=["Schedules"])


@schedule_router.post("/", response_model=BriefingSchedule, status_code=201)
async def create_schedule(schedule: BriefingSchedule):
    """
    Create briefing schedule

    Args:
        schedule: Schedule configuration

    Returns:
        Created schedule
    """
    state.schedules[schedule.id] = schedule
    return schedule


@schedule_router.get("/", response_model=List[BriefingSchedule])
async def list_schedules(user_id: Optional[str] = None):
    """
    List schedules

    Args:
        user_id: Filter by user

    Returns:
        List of schedules
    """
    schedules = list(state.schedules.values())

    if user_id:
        schedules = [s for s in schedules if s.user_id == user_id]

    return schedules


@schedule_router.delete("/{schedule_id}", status_code=204)
async def delete_schedule(schedule_id: str):
    """
    Delete schedule

    Args:
        schedule_id: Schedule UUID
    """
    if schedule_id not in state.schedules:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schedule {schedule_id} not found"
        )

    del state.schedules[schedule_id]


app.include_router(schedule_router)


# ============================================================================
# Statistics Endpoints
# ============================================================================

@app.get("/statistics", response_model=BriefingStatistics, tags=["Statistics"])
async def get_statistics():
    """
    Get briefing statistics

    Returns:
        Service statistics
    """
    return state.get_statistics()


# ============================================================================
# Export Endpoints
# ============================================================================

@app.get("/briefings/{briefing_id}/export", tags=["Export"])
async def export_briefing(
    briefing_id: str,
    format: str = Query("json", description="Export format: json, html, pdf"),
):
    """
    Export briefing

    Args:
        briefing_id: Briefing UUID
        format: Export format

    Returns:
        Exported briefing
    """
    briefing = state.get_briefing(briefing_id)

    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing {briefing_id} not found"
        )

    if format == "json":
        return briefing
    elif format == "html":
        # Generate HTML representation
        html = f"""
        <html>
        <head><title>{briefing.title}</title></head>
        <body>
        <h1>{briefing.title}</h1>
        <p><strong>Date:</strong> {briefing.date}</p>
        <p><strong>Summary:</strong> {briefing.summary}</p>
        <h2>Market Metrics</h2>
        <p>S&P 500: {briefing.metrics.sp500_change}%, NASDAQ: {briefing.metrics.nasdaq_change}%</p>
        </body>
        </html>
        """
        return {"format": "html", "content": html}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format: {format}"
        )


# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint"""
    return {
        "service": "AssetMind Briefing Service",
        "version": "1.0.0",
        "port": 5200,
        "briefings": len(state.briefings),
        "docs": "/docs"
    }


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5200,
        reload=True,
        log_level="info"
    )
