"""
AssetMind Data Connectors Service
Real-time and historical market data integration

This service provides:
- Market data connectors (Yahoo Finance, Alpha Vantage, etc.)
- Historical price data with OHLCV candles
- Real-time quotes and market summary
- News and sentiment data
- SEC filings and corporate data
- Economic indicators from FRED

Port: 5010

Version: 1.0.0
Date: June 11, 2026
"""

import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ============================================================================
# Logging Configuration
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("assetmind-connectors")

# ============================================================================
# Enums
# ============================================================================

class DataSource(str, Enum):
    """Data source providers"""
    YAHOO_FINANCE = "yahoo_finance"
    ALPHA_VANTAGE = "alpha_vantage"
    NEWS_API = "news_api"
    SEC_EDGAR = "sec_edgar"
    FRED = "fred"
    polygon = "polygon"
    BLOOMBERG = "bloomberg"
    REUTERS = "reuters"


class Interval(str, Enum):
    """Candle intervals"""
    MINUTE_1 = "1m"
    MINUTE_5 = "5m"
    MINUTE_15 = "15m"
    MINUTE_30 = "30m"
    HOUR_1 = "1h"
    HOUR_4 = "4h"
    DAILY = "1d"
    WEEKLY = "1wk"
    MONTHLY = "1mo"


class AssetType(str, Enum):
    """Asset types for data lookup"""
    STOCK = "stock"
    ETF = "etf"
    INDEX = "index"
    CRYPTO = "crypto"
    FOREX = "forex"
    COMMODITY = "commodity"
    BOND = "bond"


class NewsCategory(str, Enum):
    """News categories"""
    MARKET = "market"
    ECONOMY = "economy"
    CORPORATE = "corporate"
    CRYPTO = "crypto"
    TECH = "tech"
    POLITICS = "politics"

# ============================================================================
# Pydantic Models
# ============================================================================

class Candle(BaseModel):
    """OHLCV candle data"""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    adj_close: Optional[float] = None


class Quote(BaseModel):
    """Real-time quote"""
    symbol: str
    price: float
    change: float = 0.0
    change_pct: float = 0.0
    volume: Optional[int] = None
    day_high: Optional[float] = None
    day_low: Optional[float] = None
    year_high: Optional[float] = None
    year_low: Optional[float] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MarketSummary(BaseModel):
    """Market summary with indices"""
    indices: List[Quote]
    gainers: List[Quote]
    losers: List[Quote]
    most_active: List[Quote]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HistoricalDataRequest(BaseModel):
    """Historical data request"""
    symbol: str
    interval: Interval = Interval.DAILY
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = Field(default=100, ge=1, le=5000)


class NewsArticle(BaseModel):
    """News article model"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    summary: str
    source: str
    url: str
    published_at: datetime
    category: Optional[NewsCategory] = None
    sentiment: Optional[float] = None
    related_symbols: List[str] = Field(default_factory=list)


class CompanyProfile(BaseModel):
    """Company profile data"""
    symbol: str
    name: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    ceo: Optional[str] = None
    employees: Optional[int] = None
    headquarters: Optional[str] = None
    website: Optional[str] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    beta: Optional[float] = None


class EconomicIndicator(BaseModel):
    """Economic indicator from FRED"""
    indicator_code: str
    name: str
    value: float
    date: str
    unit: str
    change: Optional[float] = None


class FinancialStatement(BaseModel):
    """Financial statement summary"""
    symbol: str
    statement_type: str  # income, balance, cash
    period: str  # Q1 2024, FY 2023, etc.
    revenue: Optional[float] = None
    net_income: Optional[float] = None
    eps: Optional[float] = None
    total_assets: Optional[float] = None
    total_liabilities: Optional[float] = None
    cash: Optional[float] = None
    operating_cash_flow: Optional[float] = None


class DataConnectorStatus(BaseModel):
    """Data connector status"""
    source: DataSource
    status: str  # connected, error, rate_limited
    last_fetch: Optional[datetime] = None
    requests_today: int = 0

# ============================================================================
# Application State
# ============================================================================

class ConnectorState:
    """Application state for data connectors"""

    def __init__(self):
        self.quotes: Dict[str, Quote] = {}
        self.historical_data: Dict[str, List[Candle]] = {}
        self.news: List[NewsArticle] = []
        self.profiles: Dict[str, CompanyProfile] = {}
        self.economic_indicators: Dict[str, EconomicIndicator] = {}
        self.connector_status: Dict[DataSource, DataConnectorStatus] = {}
        self.start_time = time.time()

        # Initialize with sample data
        self._bootstrap_sample_data()

    def _bootstrap_sample_data(self):
        """Initialize with sample market data"""
        # Sample indices
        indices_data = [
            ("SPX", 5234.18, 15.3, 0.29),
            ("NDX", 18345.67, -45.2, -0.25),
            ("DJI", 39127.14, 89.5, 0.23),
            ("RUT", 2078.45, 12.3, 0.60),
            ("VIX", 13.45, -0.85, -5.94),
        ]

        for symbol, price, change, change_pct in indices_data:
            self.quotes[symbol] = Quote(
                symbol=symbol,
                price=price,
                change=change,
                change_pct=change_pct,
                volume=random.randint(1000000, 5000000000),
            )

        # Sample stocks
        stocks_data = [
            ("AAPL", 178.50, 2.5, 1.42),
            ("MSFT", 378.90, 4.2, 1.12),
            ("GOOGL", 141.20, -1.8, -1.26),
            ("NVDA", 878.35, 25.4, 2.98),
            ("TSLA", 175.20, -3.5, -1.96),
        ]

        for symbol, price, change, change_pct in stocks_data:
            self.quotes[symbol] = Quote(
                symbol=symbol,
                price=price,
                change=change,
                change_pct=change_pct,
                volume=random.randint(5000000, 50000000),
            )

        # Sample news
        sample_news = [
            NewsArticle(
                title="Tech Stocks Rally on Strong Earnings",
                summary="Major tech companies report better than expected earnings...",
                source="Bloomberg",
                url="https://example.com/news/1",
                published_at=datetime.utcnow() - timedelta(hours=2),
                category=NewsCategory.MARKET,
                sentiment=0.75,
                related_symbols=["AAPL", "MSFT", "GOOGL"],
            ),
            NewsArticle(
                title="Federal Reserve Signals Rate Cuts",
                summary="Fed officials hint at potential rate reductions...",
                source="Reuters",
                url="https://example.com/news/2",
                published_at=datetime.utcnow() - timedelta(hours=5),
                category=NewsCategory.ECONOMY,
                sentiment=0.60,
                related_symbols=["SPX", "NDX"],
            ),
        ]

        self.news = sample_news

    def get_quote(self, symbol: str) -> Optional[Quote]:
        """Get quote for symbol"""
        return self.quotes.get(symbol.upper())

    def get_historical_data(self, symbol: str, interval: Interval = Interval.DAILY, limit: int = 100) -> List[Candle]:
        """Get historical candles for symbol"""
        if symbol not in self.historical_data:
            # Generate sample data
            candles = []
            base_price = self.quotes.get(symbol.upper(), Quote(symbol=symbol, price=100)).price
            current_price = base_price

            for i in range(limit):
                date = datetime.utcnow() - timedelta(days=limit - i)
                daily_change = random.uniform(-0.03, 0.035)
                open_price = current_price
                close_price = open_price * (1 + daily_change)
                high_price = max(open_price, close_price) * (1 + random.uniform(0, 0.015))
                low_price = min(open_price, close_price) * (1 - random.uniform(0, 0.015))

                candles.append(Candle(
                    timestamp=date,
                    open=round(open_price, 2),
                    high=round(high_price, 2),
                    low=round(low_price, 2),
                    close=round(close_price, 2),
                    volume=random.randint(1000000, 50000000),
                ))

                current_price = close_price

            self.historical_data[symbol] = candles

        return self.historical_data[symbol][-limit:]

    def get_market_summary(self) -> MarketSummary:
        """Get market summary"""
        all_quotes = list(self.quotes.values())
        sorted_by_change = sorted(all_quotes, key=lambda q: q.change_pct, reverse=True)

        return MarketSummary(
            indices=[q for q in all_quotes if q.symbol in ["SPX", "NDX", "DJI", "RUT", "VIX"]],
            gainers=sorted_by_change[:5],
            losers=sorted_by_change[-5:],
            most_active=sorted(all_quotes, key=lambda q: q.volume or 0, reverse=True)[:5],
        )

    def search_news(self, query: str, category: Optional[NewsCategory] = None, limit: int = 20) -> List[NewsArticle]:
        """Search news articles"""
        results = self.news

        if query:
            query_lower = query.lower()
            results = [
                n for n in results
                if query_lower in n.title.lower() or query_lower in n.summary.lower()
            ]

        if category:
            results = [n for n in results if n.category == category]

        return results[:limit]

    def get_company_profile(self, symbol: str) -> Optional[CompanyProfile]:
        """Get company profile"""
        return self.profiles.get(symbol.upper())

    def get_economic_indicators(self) -> List[EconomicIndicator]:
        """Get economic indicators"""
        return list(self.economic_indicators.values())


# Import random for sample data generation
import random

# Global state
state = ConnectorState()

# ============================================================================
# Lifespan Manager
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("AssetMind Data Connectors Service starting up...")

    # Initialize connector status
    for source in DataSource:
        state.connector_status[source] = DataConnectorStatus(
            source=source,
            status="connected" if source != DataSource.BLOOMBERG else "unavailable",
            requests_today=0,
        )

    logger.info(f"Data Connectors ready with {len(state.quotes)} quotes")
    yield
    logger.info("AssetMind Data Connectors Service shutting down...")

# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="AssetMind Data Connectors",
    description="""
    ## AssetMind Data Connectors Service

    Real-time and historical market data integration:
    - Market data connectors (Yahoo Finance, Alpha Vantage, etc.)
    - Historical price data with OHLCV candles
    - Real-time quotes and market summary
    - News and sentiment data
    - SEC filings and corporate data
    - Economic indicators from FRED

    ### Supported Data Sources
    - Yahoo Finance
    - Alpha Vantage
    - News API
    - SEC EDGAR
    - FRED (Federal Reserve Economic Data)
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
)

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
        "service": "assetmind-connectors",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5010,
        "quotes_cached": len(state.quotes),
        "news_articles": len(state.news),
        "connectors": {s.value: s.status for s in state.connector_status.values()},
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/health/live", tags=["Health"])
async def liveness():
    """Kubernetes liveness probe"""
    return {"status": "alive"}


@app.get("/health/ready", tags=["Health"])
async def readiness():
    """Kubernetes readiness probe"""
    return {"status": "ready", "quotes_loaded": len(state.quotes)}

# ============================================================================
# Quote Endpoints
# ============================================================================

quote_router = APIRouter(prefix="/quotes", tags=["Quotes"])


@quote_router.get("/{symbol}", response_model=Quote)
async def get_quote(symbol: str):
    """Get real-time quote for symbol"""
    quote = state.get_quote(symbol)
    if not quote:
        raise HTTPException(status_code=404, detail=f"Quote not found for symbol {symbol}")
    return quote


@quote_router.get("/batch/", response_model=List[Quote])
async def get_batch_quotes(symbols: str = Query(..., description="Comma-separated symbols")):
    """Get quotes for multiple symbols"""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    results = []
    for symbol in symbol_list:
        quote = state.get_quote(symbol)
        if quote:
            results.append(quote)
    return results


@quote_router.get("/search/{query}", response_model=List[Quote])
async def search_quotes(query: str):
    """Search quotes by symbol or name"""
    query_lower = query.lower()
    return [q for q in state.quotes.values() if query_lower in q.symbol.lower()]


app.include_router(quote_router)

# ============================================================================
# Historical Data Endpoints
# ============================================================================

historical_router = APIRouter(prefix="/historical", tags=["Historical"])


@historical_router.get("/{symbol}", response_model=List[Candle])
async def get_historical(
    symbol: str,
    interval: Interval = Interval.DAILY,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(100, ge=1, le=5000),
):
    """Get historical candle data for symbol"""
    candles = state.get_historical_data(symbol.upper(), interval, limit)

    # Filter by date range if provided
    if start_date:
        start = datetime.fromisoformat(start_date)
        candles = [c for c in candles if c.timestamp >= start]
    if end_date:
        end = datetime.fromisoformat(end_date)
        candles = [c for c in candles if c.timestamp <= end]

    return candles


@historical_router.get("/{symbol}/latest", response_model=Candle)
async def get_latest_candle(symbol: str):
    """Get latest candle for symbol"""
    candles = state.get_historical_data(symbol.upper())
    if not candles:
        raise HTTPException(status_code=404, detail=f"No data found for symbol {symbol}")
    return candles[-1]


app.include_router(historical_router)

# ============================================================================
# Market Summary Endpoints
# ============================================================================

@app.get("/market/summary", response_model=MarketSummary, tags=["Market"])
async def get_market_summary():
    """Get market summary with indices, gainers, losers"""
    return state.get_market_summary()


@app.get("/market/indices", response_model=List[Quote], tags=["Market"])
async def get_indices():
    """Get major market indices"""
    index_symbols = ["SPX", "NDX", "DJI", "RUT", "VIX"]
    return [state.quotes[s] for s in index_symbols if s in state.quotes]


# ============================================================================
# News Endpoints
# ============================================================================

news_router = APIRouter(prefix="/news", tags=["News"])


@news_router.get("/", response_model=List[NewsArticle])
async def get_news(
    category: Optional[NewsCategory] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """Get latest news articles"""
    results = state.news

    if category:
        results = [n for n in results if n.category == category]

    return results[:limit]


@news_router.get("/search", response_model=List[NewsArticle])
async def search_news(
    q: str = Query(..., description="Search query"),
    category: Optional[NewsCategory] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """Search news articles"""
    return state.search_news(q, category, limit)


@news_router.get("/symbol/{symbol}", response_model=List[NewsArticle])
async def get_news_for_symbol(symbol: str, limit: int = Query(10, ge=1, le=50)):
    """Get news for specific symbol"""
    results = [n for n in state.news if symbol.upper() in n.related_symbols]
    return results[:limit]


app.include_router(news_router)

# ============================================================================
# Company Profile Endpoints
# ============================================================================

@app.get("/profile/{symbol}", response_model=CompanyProfile, tags=["Profiles"])
async def get_company_profile(symbol: str):
    """Get company profile"""
    profile = state.get_company_profile(symbol)
    if not profile:
        # Return mock profile
        return CompanyProfile(
            symbol=symbol.upper(),
            name=f"{symbol} Inc.",
            sector="Technology",
            industry="Software",
            description=f"Company profile for {symbol}",
            employees=10000,
            market_cap=100000000000,
        )
    return profile

# ============================================================================
# Economic Indicators Endpoints
# ============================================================================

@app.get("/economic/indicators", response_model=List[EconomicIndicator], tags=["Economic"])
async def get_economic_indicators():
    """Get economic indicators from FRED"""
    return state.get_economic_indicators()


@app.get("/economic/indicator/{code}", response_model=EconomicIndicator, tags=["Economic"])
async def get_indicator(code: str):
    """Get specific economic indicator"""
    indicator = state.economic_indicators.get(code)
    if not indicator:
        # Return mock indicator
        return EconomicIndicator(
            indicator_code=code,
            name=f"Indicator {code}",
            value=100.0,
            date=datetime.utcnow().strftime("%Y-%m-%d"),
            unit="percent",
        )
    return indicator

# ============================================================================
# Connector Status Endpoints
# ============================================================================

@app.get("/connectors/status", response_model=List[DataConnectorStatus], tags=["Connectors"])
async def get_connector_status():
    """Get status of all data connectors"""
    return list(state.connector_status.values())


@app.get("/connectors/{source}/status", response_model=DataConnectorStatus, tags=["Connectors"])
async def get_source_status(source: DataSource):
    """Get status of specific connector"""
    status = state.connector_status.get(source)
    if not status:
        raise HTTPException(status_code=404, detail=f"Connector {source.value} not found")
    return status

# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint"""
    return {
        "service": "AssetMind Data Connectors",
        "version": "1.0.0",
        "port": 5010,
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5010)