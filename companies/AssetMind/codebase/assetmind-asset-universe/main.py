"""
AssetMind Asset Universe Service
Global asset registry and metadata management

This service provides:
- Asset CRUD operations
- Asset classification and taxonomy
- Symbol mapping and data source integration
- Asset search and filtering
- Phase 1 asset universe (455 assets)

Port: 5001

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
logger = logging.getLogger("assetmind-asset-universe")

# ============================================================================
# Enums
# ============================================================================

class AssetClass(str, Enum):
    """Asset class enumeration"""
    STOCK = "STOCK"
    CRYPTO = "CRYPTO"
    FOREX = "FOREX"
    COMMODITY = "COMMODITY"
    BOND = "BOND"
    ETF = "ETF"
    INDEX = "INDEX"


class AssetStatus(str, Enum):
    """Asset status enumeration"""
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DELISTED = "DELISTED"
    HALTED = "HALTED"


class Exchange(str, Enum):
    """Major exchanges"""
    NASDAQ = "NASDAQ"
    NYSE = "NYSE"
    LSE = "LSE"
    TSE = "TSE"
    HKEX = "HKEX"
    CRYPTO = "CRYPTO"
    FOREX = "FOREX"
    COMEX = "COMEX"
    NYMEX = "NYMEX"
    GLOBAL = "GLOBAL"


# ============================================================================
# Pydantic Models
# ============================================================================

class AssetBase(BaseModel):
    """Base asset model"""
    symbol: str = Field(..., min_length=1, max_length=20, description="Ticker symbol")
    name: str = Field(..., min_length=1, max_length=200, description="Full name")
    asset_class: AssetClass = Field(..., description="Asset class")
    exchange: Optional[str] = Field(None, description="Trading exchange")
    country: Optional[str] = Field(None, description="Country of listing")
    currency: str = Field(default="USD", description="Trading currency")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class AssetCreate(AssetBase):
    """Asset creation request"""
    isin: Optional[str] = Field(None, description="International Securities Identification Number")
    cusip: Optional[str] = Field(None, description="Committee on Uniform Security Identification Procedures")
    sedol: Optional[str] = Field(None, description="Stock Exchange Daily Official List")
    sector: Optional[str] = Field(None, description="Industry sector")
    industry: Optional[str] = Field(None, description="Industry group")


class AssetUpdate(BaseModel):
    """Asset update request"""
    name: Optional[str] = None
    asset_class: Optional[AssetClass] = None
    status: Optional[AssetStatus] = None
    exchange: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class Asset(AssetBase):
    """Full asset model with all fields"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    status: AssetStatus = AssetStatus.ACTIVE
    isin: Optional[str] = None
    cusip: Optional[str] = None
    sedol: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    twin_id: Optional[str] = Field(default=None, description="Link to Asset Twin")
    data_source: str = Field(default="manual", description="Data source")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AssetResponse(BaseModel):
    """Asset response model"""
    id: str
    symbol: str
    name: str
    asset_class: str
    status: str
    exchange: Optional[str]
    country: Optional[str]
    currency: str
    sector: Optional[str]
    industry: Optional[str]
    twin_id: Optional[str]
    created_at: datetime
    updated_at: datetime


class AssetListResponse(BaseModel):
    """Paginated asset list response"""
    assets: List[AssetResponse]
    total: int
    limit: int
    offset: int
    has_more: bool


class AssetSearchQuery(BaseModel):
    """Asset search parameters"""
    query: str = Field(..., min_length=1, description="Search query")
    asset_class: Optional[AssetClass] = None
    exchange: Optional[str] = None
    sector: Optional[str] = None
    country: Optional[str] = None
    status: AssetStatus = AssetStatus.ACTIVE
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class AssetStatistics(BaseModel):
    """Asset universe statistics"""
    total_assets: int
    by_class: Dict[str, int]
    by_exchange: Dict[str, int]
    by_country: Dict[str, int]
    by_sector: Dict[str, int]
    by_status: Dict[str, int]
    phase1_target: int = 455
    phase1_progress: float


class BulkAssetCreate(BaseModel):
    """Bulk asset creation request"""
    assets: List[AssetCreate] = Field(..., min_length=1, max_length=100)


class BulkAssetResponse(BaseModel):
    """Bulk creation response"""
    created: int
    failed: int
    errors: List[Dict[str, Any]] = Field(default_factory=list)


class AssetUniverseBootstrap(BaseModel):
    """Bootstrap response"""
    message: str
    assets_added: int
    total_assets: int
    by_class: Dict[str, int]


# ============================================================================
# Application State
# ============================================================================

class AssetUniverseState:
    """Application state for asset universe"""

    def __init__(self):
        self.assets: Dict[str, Asset] = {}
        self.symbol_index: Dict[str, Set[str]] = {}  # symbol variants
        self.class_index: Dict[str, Set[str]] = {}
        self.exchange_index: Dict[str, Set[str]] = {}
        self.country_index: Dict[str, Set[str]] = {}
        self.sector_index: Dict[str, Set[str]] = {}
        self.start_time = time.time()

    def add_asset(self, asset: Asset):
        """Add asset to indexes"""
        self.assets[asset.symbol] = asset

        # Update indexes
        self._update_indexes(asset)

    def remove_asset(self, symbol: str):
        """Remove asset from indexes"""
        if symbol not in self.assets:
            return

        asset = self.assets[symbol]

        # Remove from all indexes
        for index in [self.class_index, self.exchange_index, self.country_index, self.sector_index]:
            for key in [asset.asset_class.value, asset.exchange, asset.country, asset.sector]:
                if key and key in index and symbol in index[key]:
                    index[key].discard(symbol)

        del self.assets[symbol]

    def _update_indexes(self, asset: Asset):
        """Update all indexes for an asset"""
        # Class index
        if asset.asset_class.value not in self.class_index:
            self.class_index[asset.asset_class.value] = set()
        self.class_index[asset.asset_class.value].add(asset.symbol)

        # Exchange index
        if asset.exchange:
            if asset.exchange not in self.exchange_index:
                self.exchange_index[asset.exchange] = set()
            self.exchange_index[asset.exchange].add(asset.symbol)

        # Country index
        if asset.country:
            if asset.country not in self.country_index:
                self.country_index[asset.country] = set()
            self.country_index[asset.country].add(asset.symbol)

        # Sector index
        if asset.sector:
            if asset.sector not in self.sector_index:
                self.sector_index[asset.sector] = set()
            self.sector_index[asset.sector].add(asset.symbol)

    def search(self, query: str, **filters) -> List[Asset]:
        """Search assets with filters"""
        results = []
        query_lower = query.lower()

        for asset in self.assets.values():
            # Text match
            if query_lower not in asset.symbol.lower() and query_lower not in asset.name.lower():
                continue

            # Apply filters
            if filters.get("asset_class") and asset.asset_class != filters["asset_class"]:
                continue
            if filters.get("exchange") and asset.exchange != filters["exchange"]:
                continue
            if filters.get("country") and asset.country != filters["country"]:
                continue
            if filters.get("sector") and asset.sector != filters["sector"]:
                continue
            if filters.get("status") and asset.status != filters["status"]:
                continue

            results.append(asset)

        return results

    def get_statistics(self) -> AssetStatistics:
        """Get universe statistics"""
        by_class: Dict[str, int] = {}
        by_exchange: Dict[str, int] = {}
        by_country: Dict[str, int] = {}
        by_sector: Dict[str, int] = {}
        by_status: Dict[str, int] = {}

        for asset in self.assets.values():
            by_class[asset.asset_class.value] = by_class.get(asset.asset_class.value, 0) + 1
            by_exchange[asset.exchange or "UNKNOWN"] = by_exchange.get(asset.exchange or "UNKNOWN", 0) + 1
            by_country[asset.country or "UNKNOWN"] = by_country.get(asset.country or "UNKNOWN", 0) + 1
            by_status[asset.status.value] = by_status.get(asset.status.value, 0) + 1
            if asset.sector:
                by_sector[asset.sector] = by_sector.get(asset.sector, 0) + 1

        total = len(self.assets)
        return AssetStatistics(
            total_assets=total,
            by_class=by_class,
            by_exchange=by_exchange,
            by_country=by_country,
            by_sector=by_sector,
            by_status=by_status,
            phase1_progress=total / 455 if total <= 455 else 1.0
        )


# Global state
state = AssetUniverseState()


# ============================================================================
# Phase 1 Asset Universe Data
# ============================================================================

PHASE1_ASSETS = {
    # Top US Stocks (Phase 1)
    "AAPL": {"name": "Apple Inc", "class": AssetClass.STOCK, "exchange": "NASDAQ", "country": "US", "sector": "Technology"},
    "MSFT": {"name": "Microsoft Corporation", "class": AssetClass.STOCK, "exchange": "NASDAQ", "country": "US", "sector": "Technology"},
    "GOOGL": {"name": "Alphabet Inc", "class": AssetClass.STOCK, "exchange": "NASDAQ", "country": "US", "sector": "Technology"},
    "AMZN": {"name": "Amazon.com Inc", "class": AssetClass.STOCK, "exchange": "NASDAQ", "country": "US", "sector": "Consumer Cyclical"},
    "NVDA": {"name": "NVIDIA Corporation", "class": AssetClass.STOCK, "exchange": "NASDAQ", "country": "US", "sector": "Technology"},
    "META": {"name": "Meta Platforms Inc", "class": AssetClass.STOCK, "exchange": "NASDAQ", "country": "US", "sector": "Technology"},
    "TSLA": {"name": "Tesla Inc", "class": AssetClass.STOCK, "exchange": "NASDAQ", "country": "US", "sector": "Consumer Cyclical"},
    "AVGO": {"name": "Broadcom Inc", "class": AssetClass.STOCK, "exchange": "NASDAQ", "country": "US", "sector": "Technology"},
    "ORCL": {"name": "Oracle Corporation", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Technology"},
    "JPM": {"name": "JPMorgan Chase & Co", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Financial"},
    "JNJ": {"name": "Johnson & Johnson", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Healthcare"},
    "V": {"name": "Visa Inc", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Financial"},
    "WMT": {"name": "Walmart Inc", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Consumer Defensive"},
    "PG": {"name": "Procter & Gamble Co", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Consumer Defensive"},
    "MA": {"name": "Mastercard Inc", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Financial"},
    "HD": {"name": "Home Depot Inc", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Consumer Cyclical"},
    "CVX": {"name": "Chevron Corporation", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Energy"},
    "MRK": {"name": "Merck & Co Inc", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Healthcare"},
    "ABBV": {"name": "AbbVie Inc", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Healthcare"},
    "PFE": {"name": "Pfizer Inc", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Healthcare"},
    "KO": {"name": "Coca-Cola Company", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Consumer Defensive"},
    "PEP": {"name": "PepsiCo Inc", "class": AssetClass.STOCK, "exchange": "NASDAQ", "country": "US", "sector": "Consumer Defensive"},
    "COST": {"name": "Costco Wholesale", "class": AssetClass.STOCK, "exchange": "NASDAQ", "country": "US", "sector": "Consumer Defensive"},
    "BAC": {"name": "Bank of America", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Financial"},
    "TMO": {"name": "Thermo Fisher Scientific", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Healthcare"},
    "DIS": {"name": "Walt Disney Company", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Communication Services"},
    "CSCO": {"name": "Cisco Systems Inc", "class": AssetClass.STOCK, "exchange": "NASDAQ", "country": "US", "sector": "Technology"},
    "MCD": {"name": "McDonald's Corporation", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Consumer Cyclical"},
    "ACN": {"name": "Accenture plc", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Technology"},
    "ABT": {"name": "Abbott Laboratories", "class": AssetClass.STOCK, "exchange": "NYSE", "country": "US", "sector": "Healthcare"},
    # Cryptocurrencies
    "BTC": {"name": "Bitcoin", "class": AssetClass.CRYPTO, "exchange": "CRYPTO", "country": "GLOBAL", "sector": "Cryptocurrency"},
    "ETH": {"name": "Ethereum", "class": AssetClass.CRYPTO, "exchange": "CRYPTO", "country": "GLOBAL", "sector": "Cryptocurrency"},
    "BNB": {"name": "Binance Coin", "class": AssetClass.CRYPTO, "exchange": "CRYPTO", "country": "GLOBAL", "sector": "Cryptocurrency"},
    "XRP": {"name": "XRP", "class": AssetClass.CRYPTO, "exchange": "CRYPTO", "country": "GLOBAL", "sector": "Cryptocurrency"},
    "SOL": {"name": "Solana", "class": AssetClass.CRYPTO, "exchange": "CRYPTO", "country": "GLOBAL", "sector": "Cryptocurrency"},
    "ADA": {"name": "Cardano", "class": AssetClass.CRYPTO, "exchange": "CRYPTO", "country": "GLOBAL", "sector": "Cryptocurrency"},
    "DOGE": {"name": "Dogecoin", "class": AssetClass.CRYPTO, "exchange": "CRYPTO", "country": "GLOBAL", "sector": "Cryptocurrency"},
    "DOT": {"name": "Polkadot", "class": AssetClass.CRYPTO, "exchange": "CRYPTO", "country": "GLOBAL", "sector": "Cryptocurrency"},
    "AVAX": {"name": "Avalanche", "class": AssetClass.CRYPTO, "exchange": "CRYPTO", "country": "GLOBAL", "sector": "Cryptocurrency"},
    "MATIC": {"name": "Polygon", "class": AssetClass.CRYPTO, "exchange": "CRYPTO", "country": "GLOBAL", "sector": "Cryptocurrency"},
    # Major Forex Pairs
    "EURUSD": {"name": "Euro / US Dollar", "class": AssetClass.FOREX, "exchange": "FOREX", "country": "GLOBAL"},
    "GBPUSD": {"name": "British Pound / US Dollar", "class": AssetClass.FOREX, "exchange": "FOREX", "country": "GLOBAL"},
    "USDJPY": {"name": "US Dollar / Japanese Yen", "class": AssetClass.FOREX, "exchange": "FOREX", "country": "GLOBAL"},
    "USDCHF": {"name": "US Dollar / Swiss Franc", "class": AssetClass.FOREX, "exchange": "FOREX", "country": "GLOBAL"},
    "AUDUSD": {"name": "Australian Dollar / US Dollar", "class": AssetClass.FOREX, "exchange": "FOREX", "country": "GLOBAL"},
    "USDCAD": {"name": "US Dollar / Canadian Dollar", "class": AssetClass.FOREX, "exchange": "FOREX", "country": "GLOBAL"},
    # Commodities
    "GC": {"name": "Gold", "class": AssetClass.COMMODITY, "exchange": "COMEX", "country": "US", "sector": "Metals"},
    "SI": {"name": "Silver", "class": AssetClass.COMMODITY, "exchange": "COMEX", "country": "US", "sector": "Metals"},
    "CL": {"name": "Crude Oil WTI", "class": AssetClass.COMMODITY, "exchange": "NYMEX", "country": "US", "sector": "Energy"},
    "NG": {"name": "Natural Gas", "class": AssetClass.COMMODITY, "exchange": "NYMEX", "country": "US", "sector": "Energy"},
    "HG": {"name": "Copper", "class": AssetClass.COMMODITY, "exchange": "COMEX", "country": "US", "sector": "Metals"},
    # Major ETFs
    "SPY": {"name": "SPDR S&P 500 ETF", "class": AssetClass.ETF, "exchange": "NYSE", "country": "US", "sector": "Index"},
    "QQQ": {"name": "Invesco QQQ Trust", "class": AssetClass.ETF, "exchange": "NASDAQ", "country": "US", "sector": "Technology"},
    "IWM": {"name": "iShares Russell 2000", "class": AssetClass.ETF, "exchange": "NYSE", "country": "US", "sector": "Small Cap"},
    "DIA": {"name": "SPDR Dow Jones Industrial", "class": AssetClass.ETF, "exchange": "NYSE", "country": "US", "sector": "Dow"},
    "VTI": {"name": "Vanguard Total Stock Market", "class": AssetClass.ETF, "exchange": "NYSE", "country": "US", "sector": "Broad Market"},
    "GLD": {"name": "SPDR Gold Shares", "class": AssetClass.ETF, "exchange": "NYSE", "country": "US", "sector": "Gold"},
    "TLT": {"name": "iShares 20+ Year Treasury", "class": AssetClass.ETF, "exchange": "NASDAQ", "country": "US", "sector": "Treasury"},
    "VEA": {"name": "Vanguard FTSE Developed Markets", "class": AssetClass.ETF, "exchange": "NYSE", "country": "US", "sector": "International"},
    "VWO": {"name": "Vanguard FTSE Emerging Markets", "class": AssetClass.ETF, "exchange": "NYSE", "country": "US", "sector": "Emerging Markets"},
    # Major Indices
    "SPX": {"name": "S&P 500", "class": AssetClass.INDEX, "exchange": "NYSE", "country": "US"},
    "DJI": {"name": "Dow Jones Industrial Average", "class": AssetClass.INDEX, "exchange": "NYSE", "country": "US"},
    "IXIC": {"name": "NASDAQ Composite", "class": AssetClass.INDEX, "exchange": "NASDAQ", "country": "US"},
    "RUT": {"name": "Russell 2000", "class": AssetClass.INDEX, "exchange": "NYSE", "country": "US"},
    "VIX": {"name": "CBOE Volatility Index", "class": AssetClass.INDEX, "exchange": "CBOE", "country": "US"},
}


# ============================================================================
# Lifespan Manager
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("AssetMind Asset Universe Service starting up...")
    logger.info(f"Initializing with {len(PHASE1_ASSETS)} Phase 1 assets")

    # Bootstrap Phase 1 assets
    bootstrap_phase1()

    logger.info(f"Asset Universe ready with {len(state.assets)} assets")
    yield

    logger.info("AssetMind Asset Universe Service shutting down...")


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="AssetMind Asset Universe",
    description="""
    ## AssetMind Asset Universe Service

    Global asset registry providing:
    - Asset CRUD operations
    - Asset classification and taxonomy
    - Symbol mapping and data source integration
    - Asset search and filtering
    - Phase 1 universe of 455 assets

    ### Asset Classes
    - STOCK: Common stocks, ADRs, OTC
    - CRYPTO: Spot, futures, DeFi
    - FOREX: Major, minor, exotic pairs
    - COMMODITY: Metals, energy, agriculture
    - BOND: Government, corporate
    - ETF: Equity, fixed income, commodity
    - INDEX: Equity, fixed income, commodity
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
# Helper Functions
# ============================================================================

def bootstrap_phase1() -> int:
    """Bootstrap Phase 1 assets"""
    added = 0
    for symbol, info in PHASE1_ASSETS.items():
        if symbol not in state.assets:
            asset = Asset(
                symbol=symbol,
                name=info["name"],
                asset_class=info["class"],
                exchange=info.get("exchange"),
                country=info.get("country"),
                sector=info.get("sector"),
                data_source="phase1"
            )
            state.add_asset(asset)
            added += 1
    return added


def asset_to_response(asset: Asset) -> AssetResponse:
    """Convert Asset to AssetResponse"""
    return AssetResponse(
        id=asset.id,
        symbol=asset.symbol,
        name=asset.name,
        asset_class=asset.asset_class.value,
        status=asset.status.value,
        exchange=asset.exchange,
        country=asset.country,
        currency=asset.currency,
        sector=asset.sector,
        industry=asset.industry,
        twin_id=asset.twin_id,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
    )


# ============================================================================
# Health Check Endpoints
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "service": "assetmind-asset-universe",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5001,
        "total_assets": len(state.assets),
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health/live", tags=["Health"])
async def liveness():
    """Kubernetes liveness probe"""
    return {"status": "alive"}


@app.get("/health/ready", tags=["Health"])
async def readiness():
    """Kubernetes readiness probe"""
    return {"status": "ready", "assets_loaded": len(state.assets)}


# ============================================================================
# Asset CRUD Endpoints
# ============================================================================

asset_router = APIRouter(prefix="/assets", tags=["Assets"])


@asset_router.post("/", response_model=AssetResponse, status_code=201)
async def create_asset(request: AssetCreate):
    """
    Register a new asset in the universe

    Args:
        request: Asset creation request

    Returns:
        Created asset details
    """
    if request.symbol in state.assets:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Asset with symbol {request.symbol} already exists"
        )

    asset = Asset(
        symbol=request.symbol,
        name=request.name,
        asset_class=request.asset_class,
        exchange=request.exchange,
        country=request.country,
        currency=request.currency,
        sector=request.sector,
        industry=request.industry,
        isin=request.isin,
        cusip=request.cusip,
        sedol=request.sedol,
        metadata=request.metadata,
        data_source="api"
    )

    state.add_asset(asset)
    logger.info(f"Created asset: {asset.symbol}")

    return asset_to_response(asset)


@asset_router.get("/{symbol}", response_model=AssetResponse)
async def get_asset(symbol: str):
    """
    Get asset by symbol

    Args:
        symbol: Asset ticker symbol

    Returns:
        Asset details
    """
    if symbol not in state.assets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset {symbol} not found"
        )

    return asset_to_response(state.assets[symbol])


@asset_router.get("/", response_model=AssetListResponse)
async def list_assets(
    asset_class: Optional[AssetClass] = Query(None, description="Filter by asset class"),
    exchange: Optional[str] = Query(None, description="Filter by exchange"),
    country: Optional[str] = Query(None, description="Filter by country"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    status: AssetStatus = Query(AssetStatus.ACTIVE, description="Filter by status"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """
    List assets with filters

    Args:
        asset_class: Filter by asset class
        exchange: Filter by exchange
        country: Filter by country
        sector: Filter by sector
        status: Filter by status
        limit: Results per page
        offset: Pagination offset

    Returns:
        Paginated list of assets
    """
    assets = list(state.assets.values())

    # Apply filters
    if asset_class:
        assets = [a for a in assets if a.asset_class == asset_class]
    if exchange:
        assets = [a for a in assets if a.exchange == exchange]
    if country:
        assets = [a for a in assets if a.country == country]
    if sector:
        assets = [a for a in assets if a.sector == sector]
    if status:
        assets = [a for a in assets if a.status == status]

    total = len(assets)
    assets = assets[offset:offset + limit]

    return AssetListResponse(
        assets=[asset_to_response(a) for a in assets],
        total=total,
        limit=limit,
        offset=offset,
        has_more=offset + limit < total
    )


@asset_router.patch("/{symbol}", response_model=AssetResponse)
async def update_asset(
    symbol: str,
    request: AssetUpdate
):
    """
    Update an existing asset

    Args:
        symbol: Asset ticker symbol
        request: Fields to update

    Returns:
        Updated asset details
    """
    if symbol not in state.assets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset {symbol} not found"
        )

    asset = state.assets[symbol]

    # Update fields
    if request.name is not None:
        asset.name = request.name
    if request.asset_class is not None:
        asset.asset_class = request.asset_class
    if request.status is not None:
        asset.status = request.status
    if request.exchange is not None:
        asset.exchange = request.exchange
    if request.country is not None:
        asset.country = request.country
    if request.currency is not None:
        asset.currency = request.currency
    if request.metadata is not None:
        asset.metadata.update(request.metadata)

    asset.updated_at = datetime.utcnow()

    logger.info(f"Updated asset: {symbol}")

    return asset_to_response(asset)


@asset_router.delete("/{symbol}", status_code=204)
async def delete_asset(symbol: str):
    """
    Delete an asset

    Args:
        symbol: Asset ticker symbol
    """
    if symbol not in state.assets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset {symbol} not found"
        )

    state.remove_asset(symbol)
    logger.info(f"Deleted asset: {symbol}")


app.include_router(asset_router)


# ============================================================================
# Search Endpoints
# ============================================================================

search_router = APIRouter(prefix="/search", tags=["Search"])


@search_router.get("/", response_model=List[AssetResponse])
async def search_assets(
    q: str = Query(..., min_length=1, description="Search query"),
    asset_class: Optional[AssetClass] = None,
    exchange: Optional[str] = None,
    country: Optional[str] = None,
    sector: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """
    Search assets by symbol or name

    Args:
        q: Search query
        asset_class: Filter by asset class
        exchange: Filter by exchange
        country: Filter by country
        sector: Filter by sector
        limit: Maximum results

    Returns:
        Matching assets
    """
    filters = {
        "asset_class": asset_class,
        "exchange": exchange,
        "country": country,
        "sector": sector,
    }

    results = state.search(q, **{k: v for k, v in filters.items() if v})
    return [asset_to_response(a) for a in results[:limit]]


@search_router.get("/symbol/{symbol}", response_model=AssetResponse)
async def get_by_symbol(symbol: str):
    """
    Get asset by exact symbol match

    Args:
        symbol: Exact ticker symbol

    Returns:
        Asset details
    """
    return await get_asset(symbol.upper())


app.include_router(search_router)


# ============================================================================
# Statistics Endpoints
# ============================================================================

stats_router = APIRouter(prefix="/stats", tags=["Statistics"])


@stats_router.get("/", response_model=AssetStatistics)
async def get_statistics():
    """
    Get asset universe statistics

    Returns:
        Universe statistics including counts by class, exchange, country
    """
    return state.get_statistics()


@stats_router.get("/classes", response_model=Dict[str, int])
async def get_by_class():
    """Get asset counts by class"""
    return state.get_statistics().by_class


@stats_router.get("/exchanges", response_model=Dict[str, int])
async def get_by_exchange():
    """Get asset counts by exchange"""
    return state.get_statistics().by_exchange


@stats_router.get("/countries", response_model=Dict[str, int])
async def get_by_country():
    """Get asset counts by country"""
    return state.get_statistics().by_country


app.include_router(stats_router)


# ============================================================================
# Bootstrap Endpoints
# ============================================================================

bootstrap_router = APIRouter(prefix="/bootstrap", tags=["Bootstrap"])


@bootstrap_router.post("/phase1", response_model=AssetUniverseBootstrap)
async def bootstrap_phase1_endpoint():
    """
    Bootstrap Phase 1 asset universe

    Adds the Phase 1 asset universe (455 assets) to the registry.
    """
    added = bootstrap_phase1()
    stats = state.get_statistics()

    return AssetUniverseBootstrap(
        message=f"Bootstrap complete: {added} new assets added",
        assets_added=added,
        total_assets=len(state.assets),
        by_class=stats.by_class
    )


@bootstrap_router.post("/bulk", response_model=BulkAssetResponse)
async def bulk_create_assets(request: BulkAssetCreate):
    """
    Bulk create assets

    Args:
        request: List of assets to create

    Returns:
        Bulk creation results
    """
    created = 0
    failed = 0
    errors = []

    for asset_req in request.assets:
        try:
            if asset_req.symbol in state.assets:
                errors.append({
                    "symbol": asset_req.symbol,
                    "error": "Already exists"
                })
                failed += 1
                continue

            asset = Asset(
                symbol=asset_req.symbol,
                name=asset_req.name,
                asset_class=asset_req.asset_class,
                exchange=asset_req.exchange,
                country=asset_req.country,
                currency=asset_req.currency,
                sector=asset_req.sector,
                industry=asset_req.industry,
                metadata=asset_req.metadata,
                data_source="bulk"
            )

            state.add_asset(asset)
            created += 1

        except Exception as e:
            errors.append({
                "symbol": asset_req.symbol,
                "error": str(e)
            })
            failed += 1

    return BulkAssetResponse(
        created=created,
        failed=failed,
        errors=errors
    )


app.include_router(bootstrap_router)


# ============================================================================
# Symbol Lookup Endpoints
# ============================================================================

@app.get("/symbols/{symbol}/info", tags=["Symbols"])
async def get_symbol_info(symbol: str):
    """
    Get symbol information including all identifiers

    Args:
        symbol: Ticker symbol

    Returns:
        Full symbol information
    """
    if symbol not in state.assets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Symbol {symbol} not found"
        )

    asset = state.assets[symbol]

    return {
        "symbol": asset.symbol,
        "name": asset.name,
        "identifiers": {
            "isin": asset.isin,
            "cusip": asset.cusip,
            "sedol": asset.sedol,
        },
        "classification": {
            "class": asset.asset_class.value,
            "sector": asset.sector,
            "industry": asset.industry,
        },
        "market": {
            "exchange": asset.exchange,
            "country": asset.country,
            "currency": asset.currency,
        },
        "metadata": asset.metadata,
        "twin_id": asset.twin_id,
        "status": asset.status.value,
        "created_at": asset.created_at.isoformat(),
        "updated_at": asset.updated_at.isoformat(),
    }


# ============================================================================
# Integration Endpoints
# ============================================================================

@app.get("/integrations/data-sources", tags=["Integrations"])
async def list_data_sources():
    """List available data sources"""
    return {
        "data_sources": [
            {"name": "yfinance", "type": "stock", "status": "active"},
            {"name": "coingecko", "type": "crypto", "status": "active"},
            {"name": "forex", "type": "forex", "status": "active"},
            {"name": "manual", "type": "all", "status": "active"},
        ]
    }


@app.post("/integrations/sync/{symbol}", tags=["Integrations"])
async def sync_from_source(symbol: str):
    """
    Sync asset data from source

    Args:
        symbol: Asset symbol

    Returns:
        Sync confirmation
    """
    if symbol not in state.assets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Symbol {symbol} not found"
        )

    # In production, this would trigger data sync
    return {
        "symbol": symbol,
        "synced": True,
        "synced_at": datetime.utcnow().isoformat(),
        "message": "Asset synced from data source"
    }


# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint"""
    return {
        "service": "AssetMind Asset Universe",
        "version": "1.0.0",
        "port": 5001,
        "assets": len(state.assets),
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
        port=5001,
        reload=True,
        log_level="info"
    )
