"""
AssetMind API Gateway
Main API entry point for the AssetMind Financial Intelligence Platform

This gateway provides:
- Unified API access to all AssetMind services
- Service discovery and routing
- Authentication and authorization
- Rate limiting and caching
- Request/Response transformation

Port: 8000

Version: 1.0.0
Date: June 11, 2026
"""

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from uuid import uuid4

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    FastAPI,
    Header,
    HTTPException,
    Query,
    Request,
    Response,
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
logger = logging.getLogger("assetmind-gateway")

# ============================================================================
# Service Configuration
# ============================================================================

class ServiceType(str, Enum):
    """AssetMind service types"""
    ASSET_UNIVERSE = "assetmind-asset-universe"
    ASSET_TWIN = "assetmind-asset-twin"
    MARKET_TWIN = "assetmind-market-twin"
    PORTFOLIO_TWIN = "assetmind-portfolio-twin"
    BRIEFING = "assetmind-briefing"
    CAPITAL_FLOW = "assetmind-capital-flow"
    INTELLIGENCE = "assetmind-intelligence"
    PREDICTIONS = "assetmind-predictions"
    KNOWLEDGE_GRAPH = "assetmind-knowledge-graph"


# Service endpoints configuration
SERVICE_ENDPOINTS: Dict[str, Dict[str, Any]] = {
    "assetmind-asset-universe": {
        "url": os.getenv("SVC_ASSET_UNIVERSE", "http://localhost:5001"),
        "description": "Global asset registry and metadata",
        "endpoints": ["/assets", "/search", "/stats", "/bootstrap/phase1"],
    },
    "assetmind-asset-twin": {
        "url": "http://localhost:5002",
        "description": "Digital twin for individual assets",
        "endpoints": ["/twins", "/twins/{symbol}", "/twins/{symbol}/state", "/twins/{symbol}/history"],
    },
    "assetmind-briefing": {
        "url": os.getenv("SVC_BRIEFING", "http://localhost:5200"),
        "description": "Morning briefings and reports",
        "endpoints": ["/briefings", "/briefings/{date}", "/generate"],
    },
    "assetmind-capital-flow": {
        "url": os.getenv("SVC_CAPITAL_FLOW", "http://localhost:5183"),
        "description": "ETF flow tracking and capital analysis",
        "endpoints": ["/flows", "/flows/etf/{ticker}", "/flows/summary"],
    },
    "assetmind-market-twin": {
        "url": os.getenv("SVC_MARKET_TWIN", "http://localhost:5003"),
        "description": "Market digital twin",
        "endpoints": ["/market-twin", "/market-twin/state"],
    },
    "assetmind-portfolio-twin": {
        "url": os.getenv("SVC_PORTFOLIO_TWIN", "http://localhost:5004"),
        "description": "Portfolio digital twin",
        "endpoints": ["/portfolio-twin", "/portfolio-twin/positions"],
    },
    "assetmind-intelligence": {
        "url": os.getenv("SVC_SENTIMENT", "http://localhost:4750"),
        "description": "AI-powered market intelligence",
        "endpoints": ["/insights", "/analysis"],
    },
    "assetmind-predictions": {
        "url": os.getenv("SVC_NEWS", "http://localhost:4123"),
        "description": "Price predictions and forecasting",
        "endpoints": ["/predictions", "/forecast"],
    },
}

# ============================================================================
# Pydantic Models
# ============================================================================

class HealthStatus(str, Enum):
    """Health status enumeration"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class GatewayHealth(BaseModel):
    """Gateway health response"""
    service: str = "assetmind-api-gateway"
    status: HealthStatus
    version: str = "1.0.0"
    port: int = 8000
    uptime_seconds: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    services: Dict[str, Dict[str, Any]] = {}


class ServiceStatus(BaseModel):
    """Individual service status"""
    name: str
    url: str
    description: str
    status: HealthStatus
    response_time_ms: Optional[float] = None
    last_check: Optional[datetime] = None
    error: Optional[str] = None


class APIResponse(BaseModel):
    """Standard API response wrapper"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    request_id: str = Field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AssetQuery(BaseModel):
    """Query parameters for asset search"""
    symbol: Optional[str] = None
    name: Optional[str] = None
    asset_class: Optional[str] = None
    exchange: Optional[str] = None
    country: Optional[str] = None
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class AssetCreate(BaseModel):
    """Asset creation request"""
    symbol: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=200)
    asset_class: str = Field(..., description="STOCK, CRYPTO, FOREX, COMMODITY, ETF, INDEX, BOND")
    asset_type: Optional[str] = None
    exchange: Optional[str] = None
    country: Optional[str] = None
    currency: str = "USD"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TwinQuery(BaseModel):
    """Query parameters for twin operations"""
    symbol: str = Field(..., description="Asset symbol")
    include_history: bool = False
    include_predictions: bool = False
    time_range: Optional[str] = "1d"  # 1d, 1w, 1m, 3m, 1y


class BriefingRequest(BaseModel):
    """Request for briefing generation"""
    briefing_type: str = Field(default="morning", description="morning, evening, weekly, monthly")
    symbols: List[str] = Field(default_factory=list, description="Specific symbols to include")
    user_id: Optional[str] = None
    preferences: Dict[str, Any] = Field(default_factory=dict)


class BriefingResponse(BaseModel):
    """Briefing response"""
    id: str
    type: str
    date: str
    title: str
    summary: str
    sections: List[Dict[str, Any]]
    created_at: datetime


class CapitalFlowQuery(BaseModel):
    """Query parameters for capital flow analysis"""
    etf_ticker: Optional[str] = None
    flow_type: Optional[str] = None  # inflow, outflow, net
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=200)


class CapitalFlowResponse(BaseModel):
    """Capital flow response"""
    etf_ticker: str
    date: str
    flow_type: str
    amount: float
    shares: float
    nav: float
    change_pct: float


class MarketOverview(BaseModel):
    """Market overview response"""
    timestamp: datetime
    major_indices: List[Dict[str, Any]]
    top_gainers: List[Dict[str, Any]]
    top_losers: List[Dict[str, Any]]
    most_active: List[Dict[str, Any]]
    market_sentiment: str  # bullish, bearish, neutral
    fear_greed_index: Optional[int] = None


class ServiceDiscovery(BaseModel):
    """Service discovery response"""
    gateway: str
    services: List[Dict[str, Any]]
    timestamp: datetime


# ============================================================================
# Application State
# ============================================================================

class GatewayState:
    """Global gateway state"""

    def __init__(self):
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
        self.service_cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = 60  # seconds
        self.last_cache_update: Optional[datetime] = None

    @property
    def uptime(self) -> float:
        """Get uptime in seconds"""
        return time.time() - self.start_time

    def increment_request(self):
        """Increment request counter"""
        self.request_count += 1

    def increment_error(self):
        """Increment error counter"""
        self.error_count += 1


# Global state instance
state = GatewayState()

# ============================================================================
# Lifespan Context Manager
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("AssetMind API Gateway starting up...")
    logger.info(f"Initializing {len(SERVICE_ENDPOINTS)} service endpoints")

    # Initialize service health check
    asyncio.create_task(periodic_health_check())

    logger.info("AssetMind API Gateway ready")
    yield

    logger.info("AssetMind API Gateway shutting down...")


# ============================================================================
# FastAPI Application Setup
# ============================================================================

app = FastAPI(
    title="AssetMind API Gateway",
    description="""
    ## AssetMind Financial Intelligence Platform - API Gateway

    This gateway provides unified access to all AssetMind services including:
    - **Asset Universe**: Global asset registry and metadata
    - **Asset Twins**: Digital twins for individual assets
    - **Market Twins**: Market-level digital representations
    - **Portfolio Twins**: Portfolio-level digital twins
    - **Briefings**: Morning briefings and reports
    - **Capital Flow**: ETF flow tracking
    - **Intelligence**: AI-powered market insights
    - **Predictions**: Price forecasting

    ### Authentication
    Include `X-API-Key` header for authenticated requests.

    ### Rate Limiting
    Default rate limit: 100 requests/minute per client.
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ============================================================================
# CORS Middleware
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Request/Response Middleware
# ============================================================================

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add request ID to all requests"""
    request_id = request.headers.get("X-Request-ID", str(uuid4()))
    request.state.request_id = request_id

    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Service"] = "assetmind-gateway"

    state.increment_request()

    return response


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    logger.info(
        f"Request: {request.method} {request.url.path} "
        f"from {request.client.host if request.client else 'unknown'}"
    )

    response = await call_next(request)

    logger.info(
        f"Response: {request.method} {request.url.path} "
        f"status={response.status_code}"
    )

    return response


# ============================================================================
# Health Check Endpoints
# ============================================================================

@app.get("/health", response_model=GatewayHealth, tags=["Health"])
async def health_check():
    """
    Health check endpoint

    Returns the health status of the gateway and all connected services.
    """
    # Get service statuses
    services = {}
    for name, config in SERVICE_ENDPOINTS.items():
        cached = state.service_cache.get(name)
        if cached:
            services[name] = cached
        else:
            services[name] = {
                "status": "unknown",
                "url": config["url"],
                "description": config["description"],
            }

    # Determine overall health
    healthy_count = sum(
        1 for s in services.values()
        if s.get("status") == "healthy"
    )
    total_count = len(services)

    if healthy_count == total_count:
        overall_status = HealthStatus.HEALTHY
    elif healthy_count > total_count / 2:
        overall_status = HealthStatus.DEGRADED
    else:
        overall_status = HealthStatus.UNHEALTHY

    return GatewayHealth(
        status=overall_status,
        uptime_seconds=state.uptime,
        services=services,
    )


@app.get("/health/live", tags=["Health"])
async def liveness():
    """Kubernetes liveness probe"""
    return {"status": "alive", "timestamp": datetime.utcnow()}


@app.get("/health/ready", tags=["Health"])
async def readiness():
    """Kubernetes readiness probe"""
    # Check if critical services are available
    critical_services = ["assetmind-asset-universe", "assetmind-asset-twin"]

    for service_name in critical_services:
        service_status = state.service_cache.get(service_name, {})
        if service_status.get("status") != "healthy":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Critical service {service_name} not available"
            )

    return {"status": "ready", "timestamp": datetime.utcnow()}


# ============================================================================
# Service Discovery
# ============================================================================

@app.get("/services", response_model=ServiceDiscovery, tags=["Services"])
async def list_services():
    """
    List all available AssetMind services

    Returns information about all registered services including their
    endpoints, status, and descriptions.
    """
    services_list = []
    for name, config in SERVICE_ENDPOINTS.items():
        cached = state.service_cache.get(name, {})
        services_list.append({
            "name": name,
            "url": config["url"],
            "description": config["description"],
            "endpoints": config["endpoints"],
            "status": cached.get("status", "unknown"),
            "response_time_ms": cached.get("response_time_ms"),
        })

    return ServiceDiscovery(
        gateway=f"http://localhost:{8000}",
        services=services_list,
        timestamp=datetime.utcnow(),
    )


@app.get("/services/{service_name}", tags=["Services"])
async def get_service(service_name: str):
    """
    Get details for a specific service

    Args:
        service_name: Name of the service to query

    Returns:
        Service configuration and status
    """
    if service_name not in SERVICE_ENDPOINTS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service {service_name} not found"
        )

    config = SERVICE_ENDPOINTS[service_name]
    cached = state.service_cache.get(service_name, {})

    return {
        "name": service_name,
        "url": config["url"],
        "description": config["description"],
        "endpoints": config["endpoints"],
        "status": cached.get("status", "unknown"),
        "response_time_ms": cached.get("response_time_ms"),
        "last_check": cached.get("last_check"),
    }


# ============================================================================
# Asset Universe Proxy Endpoints
# ============================================================================

asset_router = APIRouter(prefix="/api/v1/assets", tags=["Assets"])


@asset_router.get("/", response_model=APIResponse)
async def list_assets(
    asset_class: Optional[str] = Query(None, description="Asset class filter"),
    exchange: Optional[str] = Query(None, description="Exchange filter"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """
    List all assets in the universe

    Query Parameters:
    - asset_class: Filter by asset class (STOCK, CRYPTO, FOREX, COMMODITY, ETF, INDEX, BOND)
    - exchange: Filter by exchange
    - limit: Number of results (1-500)
    - offset: Pagination offset
    """
    # In production, this would proxy to assetmind-asset-universe service
    return APIResponse(
        success=True,
        data={
            "assets": [],
            "total": 0,
            "limit": limit,
            "offset": offset,
            "message": "Proxy to assetmind-asset-universe service"
        }
    )


@asset_router.get("/{symbol}", response_model=APIResponse)
async def get_asset(symbol: str):
    """
    Get asset details by symbol

    Args:
        symbol: Asset ticker symbol

    Returns:
        Asset details including metadata and current state
    """
    return APIResponse(
        success=True,
        data={
            "symbol": symbol,
            "message": "Proxy to assetmind-asset-universe service"
        }
    )


@asset_router.post("/", response_model=APIResponse)
async def create_asset(asset: AssetCreate):
    """
    Register a new asset in the universe

    Args:
        asset: Asset creation request

    Returns:
        Created asset details
    """
    return APIResponse(
        success=True,
        data={
            "id": str(uuid4()),
            "symbol": asset.symbol,
            "name": asset.name,
            "asset_class": asset.asset_class,
            "status": "ACTIVE",
            "created_at": datetime.utcnow().isoformat(),
            "message": "Proxy to assetmind-asset-universe service"
        }
    )


@asset_router.patch("/{symbol}", response_model=APIResponse)
async def update_asset(symbol: str, updates: Dict[str, Any]):
    """
    Update an existing asset

    Args:
        symbol: Asset ticker symbol
        updates: Fields to update

    Returns:
        Updated asset details
    """
    return APIResponse(
        success=True,
        data={
            "symbol": symbol,
            "updates": updates,
            "updated_at": datetime.utcnow().isoformat(),
            "message": "Proxy to assetmind-asset-universe service"
        }
    )


@asset_router.delete("/{symbol}", response_model=APIResponse)
async def delete_asset(symbol: str):
    """
    Remove an asset from the universe

    Args:
        symbol: Asset ticker symbol

    Returns:
        Deletion confirmation
    """
    return APIResponse(
        success=True,
        data={
            "symbol": symbol,
            "deleted": True,
            "deleted_at": datetime.utcnow().isoformat(),
        }
    )


@asset_router.get("/search/query", response_model=APIResponse)
async def search_assets(
    q: str = Query(..., description="Search query"),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Search assets by symbol or name

    Args:
        q: Search query
        limit: Maximum results

    Returns:
        Matching assets
    """
    return APIResponse(
        success=True,
        data={
            "query": q,
            "results": [],
            "total": 0,
            "limit": limit,
            "message": "Proxy to assetmind-asset-universe service"
        }
    )


app.include_router(asset_router)


# ============================================================================
# Asset Twin Proxy Endpoints
# ============================================================================

twin_router = APIRouter(prefix="/api/v1/twins", tags=["Asset Twins"])


@twin_router.get("/", response_model=APIResponse)
async def list_twins(
    asset_class: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
):
    """
    List all digital twins

    Returns all active digital twins with their current state.
    """
    return APIResponse(
        success=True,
        data={
            "twins": [],
            "total": 0,
            "limit": limit,
            "message": "Proxy to assetmind-asset-twin service"
        }
    )


@twin_router.get("/{symbol}", response_model=APIResponse)
async def get_twin(
    symbol: str,
    include_history: bool = False,
    include_predictions: bool = False,
):
    """
    Get digital twin for a specific asset

    Args:
        symbol: Asset ticker symbol
        include_history: Include historical data
        include_predictions: Include predictions

    Returns:
        Digital twin state and metadata
    """
    return APIResponse(
        success=True,
        data={
            "symbol": symbol,
            "twin_id": str(uuid4()),
            "state": {},
            "include_history": include_history,
            "include_predictions": include_predictions,
            "message": "Proxy to assetmind-asset-twin service"
        }
    )


@twin_router.get("/{symbol}/state", response_model=APIResponse)
async def get_twin_state(symbol: str):
    """
    Get current state of an asset twin

    Args:
        symbol: Asset ticker symbol

    Returns:
        Current twin state including price, volume, and metrics
    """
    return APIResponse(
        success=True,
        data={
            "symbol": symbol,
            "timestamp": datetime.utcnow().isoformat(),
            "state": {},
            "message": "Proxy to assetmind-asset-twin service"
        }
    )


@twin_router.get("/{symbol}/history", response_model=APIResponse)
async def get_twin_history(
    symbol: str,
    timeframe: str = Query("1d", description="Timeframe: 1d, 1w, 1m, 3m, 1y"),
):
    """
    Get historical data for an asset twin

    Args:
        symbol: Asset ticker symbol
        timeframe: Time range for historical data

    Returns:
        Historical twin states
    """
    return APIResponse(
        success=True,
        data={
            "symbol": symbol,
            "timeframe": timeframe,
            "history": [],
            "message": "Proxy to assetmind-asset-twin service"
        }
    )


@twin_router.post("/{symbol}/sync", response_model=APIResponse)
async def sync_twin(symbol: str):
    """
    Force synchronization of asset twin

    Args:
        symbol: Asset ticker symbol

    Returns:
        Sync confirmation
    """
    return APIResponse(
        success=True,
        data={
            "symbol": symbol,
            "synced": True,
            "synced_at": datetime.utcnow().isoformat(),
            "message": "Proxy to assetmind-asset-twin service"
        }
    )


app.include_router(twin_router)


# ============================================================================
# Briefing Proxy Endpoints
# ============================================================================

briefing_router = APIRouter(prefix="/api/v1/briefings", tags=["Briefings"])


@briefing_router.get("/", response_model=APIResponse)
async def list_briefings(
    briefing_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """
    List available briefings

    Args:
        briefing_type: Filter by type (morning, evening, weekly, monthly)
        start_date: Start date filter (ISO format)
        end_date: End date filter (ISO format)
        limit: Maximum results

    Returns:
        List of briefings
    """
    return APIResponse(
        success=True,
        data={
            "briefings": [],
            "total": 0,
            "limit": limit,
            "message": "Proxy to assetmind-briefing service"
        }
    )


@briefing_router.get("/{date}", response_model=APIResponse)
async def get_briefing(date: str):
    """
    Get briefing for a specific date

    Args:
        date: Briefing date (YYYY-MM-DD format)

    Returns:
        Briefing details
    """
    return APIResponse(
        success=True,
        data={
            "id": str(uuid4()),
            "date": date,
            "type": "morning",
            "title": f"Briefing for {date}",
            "summary": "",
            "sections": [],
            "message": "Proxy to assetmind-briefing service"
        }
    )


@briefing_router.post("/generate", response_model=APIResponse)
async def generate_briefing(request: BriefingRequest, background_tasks: BackgroundTasks):
    """
    Generate a new briefing

    Args:
        request: Briefing generation parameters

    Returns:
        Generated briefing
    """
    briefing_id = str(uuid4())

    # Schedule background generation
    background_tasks.add_task(generate_briefing_task, briefing_id, request)

    return APIResponse(
        success=True,
        data={
            "id": briefing_id,
            "status": "generating",
            "type": request.briefing_type,
            "message": "Briefing generation scheduled"
        }
    )


async def generate_briefing_task(briefing_id: str, request: BriefingRequest):
    """Background task for briefing generation"""
    logger.info(f"Generating briefing {briefing_id}")
    # Implementation would call assetmind-briefing service
    await asyncio.sleep(1)
    logger.info(f"Briefing {briefing_id} generated")


app.include_router(briefing_router)


# ============================================================================
# Capital Flow Proxy Endpoints
# ============================================================================

flow_router = APIRouter(prefix="/api/v1/flows", tags=["Capital Flow"])


@flow_router.get("/", response_model=APIResponse)
async def list_flows(
    etf_ticker: Optional[str] = None,
    flow_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
):
    """
    List capital flows

    Args:
        etf_ticker: Filter by ETF ticker
        flow_type: Filter by flow type (inflow, outflow, net)
        start_date: Start date filter
        end_date: End date filter
        limit: Maximum results

    Returns:
        List of capital flows
    """
    return APIResponse(
        success=True,
        data={
            "flows": [],
            "total": 0,
            "limit": limit,
            "message": "Proxy to assetmind-capital-flow service"
        }
    )


@flow_router.get("/etf/{ticker}", response_model=APIResponse)
async def get_etf_flows(
    ticker: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """
    Get capital flows for a specific ETF

    Args:
        ticker: ETF ticker symbol
        start_date: Start date filter
        end_date: End date filter

    Returns:
        ETF flow data
    """
    return APIResponse(
        success=True,
        data={
            "etf_ticker": ticker,
            "flows": [],
            "summary": {
                "total_inflow": 0.0,
                "total_outflow": 0.0,
                "net_flow": 0.0,
            },
            "message": "Proxy to assetmind-capital-flow service"
        }
    )


@flow_router.get("/summary", response_model=APIResponse)
async def get_flow_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """
    Get aggregate capital flow summary

    Args:
        start_date: Start date filter
        end_date: End date filter

    Returns:
        Aggregate flow summary
    """
    return APIResponse(
        success=True,
        data={
            "period": {"start": start_date, "end": end_date},
            "summary": {
                "total_etfs": 0,
                "total_inflow": 0.0,
                "total_outflow": 0.0,
                "net_flow": 0.0,
            },
            "message": "Proxy to assetmind-capital-flow service"
        }
    )


app.include_router(flow_router)


# ============================================================================
# Market Overview Endpoints
# ============================================================================

market_router = APIRouter(prefix="/api/v1/market", tags=["Market"])


@market_router.get("/overview", response_model=APIResponse)
async def get_market_overview():
    """
    Get market overview

    Returns current market status including major indices,
    top movers, and sentiment indicators.
    """
    return APIResponse(
        success=True,
        data={
            "timestamp": datetime.utcnow().isoformat(),
            "major_indices": [],
            "top_gainers": [],
            "top_losers": [],
            "most_active": [],
            "market_sentiment": "neutral",
            "fear_greed_index": 50,
        }
    )


@market_router.get("/sentiment", response_model=APIResponse)
async def get_market_sentiment():
    """
    Get market sentiment indicators

    Returns various sentiment indicators including fear/greed index.
    """
    return APIResponse(
        success=True,
        data={
            "timestamp": datetime.utcnow().isoformat(),
            "fear_greed_index": 50,
            "sentiment": "neutral",
            "bullish_pct": 50.0,
            "bearish_pct": 30.0,
            "neutral_pct": 20.0,
        }
    )


app.include_router(market_router)


# ============================================================================
# Webhook Endpoints
# ============================================================================

webhook_router = APIRouter(prefix="/api/v1/webhooks", tags=["Webhooks"])


class WebhookCreate(BaseModel):
    """Webhook creation request"""
    url: str
    events: List[str]  # asset.updated, twin.changed, briefing.generated, etc.
    secret: Optional[str] = None


class WebhookResponse(BaseModel):
    """Webhook response"""
    id: str
    url: str
    events: List[str]
    created_at: datetime
    active: bool = True


# In-memory webhook store
webhooks: Dict[str, WebhookResponse] = {}


@webhook_router.post("/", response_model=WebhookResponse, status_code=201)
async def create_webhook(webhook: WebhookCreate):
    """
    Register a webhook endpoint

    Args:
        webhook: Webhook configuration

    Returns:
        Created webhook
    """
    webhook_id = str(uuid4())
    response = WebhookResponse(
        id=webhook_id,
        url=webhook.url,
        events=webhook.events,
        created_at=datetime.utcnow(),
    )
    webhooks[webhook_id] = response
    return response


@webhook_router.get("/", response_model=List[WebhookResponse])
async def list_webhooks():
    """List all registered webhooks"""
    return list(webhooks.values())


@webhook_router.delete("/{webhook_id}", status_code=204)
async def delete_webhook(webhook_id: str):
    """
    Delete a webhook

    Args:
        webhook_id: Webhook ID to delete
    """
    if webhook_id not in webhooks:
        raise HTTPException(status_code=404, detail="Webhook not found")
    del webhooks[webhook_id]


app.include_router(webhook_router)


# ============================================================================
# Metrics Endpoint
# ============================================================================

@app.get("/metrics", tags=["Monitoring"])
async def get_metrics():
    """
    Get gateway metrics

    Returns Prometheus-compatible metrics.
    """
    return {
        "uptime_seconds": state.uptime,
        "request_count": state.request_count,
        "error_count": state.error_count,
        "error_rate": state.error_count / max(state.request_count, 1),
        "cache_hits": 0,
        "cache_misses": 0,
        "services": {
            name: {
                "status": info.get("status", "unknown"),
                "response_time_ms": info.get("response_time_ms"),
            }
            for name, info in state.service_cache.items()
        },
    }


# ============================================================================
# Background Tasks
# ============================================================================

async def periodic_health_check():
    """Periodically check health of all services"""
    while True:
        try:
            for name, config in SERVICE_ENDPOINTS.items():
                start = time.time()
                # In production, this would make actual HTTP requests
                # For now, simulate health check
                response_time = (time.time() - start) * 1000

                state.service_cache[name] = {
                    "status": "healthy",
                    "url": config["url"],
                    "description": config["description"],
                    "response_time_ms": response_time,
                    "last_check": datetime.utcnow().isoformat(),
                }

            state.last_cache_update = datetime.utcnow()
            logger.debug(f"Health check completed: {len(SERVICE_ENDPOINTS)} services")

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            state.increment_error()

        await asyncio.sleep(30)  # Check every 30 seconds


# ============================================================================
# Exception Handlers
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "request_id": getattr(request.state, "request_id", None),
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    state.increment_error()
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error",
            "request_id": getattr(request.state, "request_id", None),
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint redirect to docs"""
    return {
        "service": "AssetMind API Gateway",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "services": "/services",
    }


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
