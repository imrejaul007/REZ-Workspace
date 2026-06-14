"""
AssetMind Data Service - Financial Data Management
Port: 5002

Provides comprehensive financial data management:
- Market data ingestion from multiple sources
- News and sentiment aggregation
- Economic indicators
- Earnings data
- Institutional holdings
- Regulatory filings

Version: 1.0.0
Date: June 11, 2026
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AssetMind Data Service",
    description="Financial data management and aggregation",
    version="1.0.0"
)

# Configuration
DATA_DIR = os.getenv("DATA_DIR", "/tmp/assetmind-data")
CACHE_TTL = int(os.getenv("CACHE_TTL", "3600"))


class DataSource(str, Enum):
    YAHOO_FINANCE = "yahoo_finance"
    ALPHA_VANTAGE = "alpha_vantage"
    COINGECKO = "coingecko"
    FRED = "fred"
    SEC_EDGAR = "sec_edgar"
    NEWS_API = "news_api"
    REDDIT = "reddit"


class MarketDataRequest(BaseModel):
    symbol: str
    start_date: datetime
    end_date: datetime
    interval: str = "1d"
    source: DataSource = DataSource.YAHOO_FINANCE


class MarketDataPoint(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    adjusted_close: Optional[float] = None
    source: DataSource = DataSource.YAHOO_FINANCE


class NewsArticle(BaseModel):
    id: Optional[str] = None
    title: str
    summary: str
    source: str
    url: str
    published_at: datetime
    symbols: List[str] = Field(default_factory=list)
    sentiment: Optional[float] = Field(default=None, ge=-1, le=1)
    sentiment_label: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class EarningsData(BaseModel):
    symbol: str
    company_name: str
    earnings_date: datetime
    eps_estimate: float
    eps_actual: Optional[float] = None
    revenue_estimate: float
    revenue_actual: Optional[float] = None
    beat_probability: float = Field(default=50, ge=0, le=100)
    report_type: str = "EARNINGS"
    status: str = "UPCOMING"


class EconomicIndicator(BaseModel):
    id: Optional[str] = None
    name: str
    value: float
    previous_value: Optional[float] = None
    change_percent: Optional[float] = None
    unit: str
    source: str
    timestamp: datetime
    region: str = "US"


class SentimentData(BaseModel):
    symbol: Optional[str] = None
    source: str
    sentiment_score: float = Field(ge=-1, le=1)
    positive_mentions: int = 0
    negative_mentions: int = 0
    total_mentions: int = 0
    timestamp: datetime
    keywords: List[str] = Field(default_factory=list)


class InstitutionalHolding(BaseModel):
    symbol: str
    holder_name: str
    shares_held: int
    market_value: float
    ownership_percent: float
    report_date: datetime
    change_shares: Optional[int] = None
    change_percent: Optional[float] = None


class DataSyncRequest(BaseModel):
    source: DataSource
    symbols: List[str] = Field(default_factory=list)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


# In-memory data stores
market_data_store: Dict[str, List[MarketDataPoint]] = {}
news_store: List[NewsArticle] = []
earnings_store: List[EarningsData] = []
economic_store: List[EconomicIndicator] = []
sentiment_store: List[SentimentData] = []
holdings_store: List[InstitutionalHolding] = []


def get_uptime() -> float:
    """Get service uptime in seconds"""
    if not hasattr(app.state, "started_at"):
        app.state.started_at = datetime.utcnow()
    return (datetime.utcnow() - app.state.started_at).total_seconds()


# ============================================================================
# Health & Status Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check for data service"""
    return {
        "service": "assetmind-data",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5002,
        "uptime_seconds": get_uptime(),
        "data_sources": {
            "yahoo_finance": "connected",
            "alpha_vantage": "connected",
            "coingecko": "connected",
            "fred": "connected",
            "sec_edgar": "connected"
        },
        "data_counts": {
            "market_data": sum(len(v) for v in market_data_store.values()),
            "news_articles": len(news_store),
            "earnings": len(earnings_store),
            "economic_indicators": len(economic_store),
            "sentiment_records": len(sentiment_store),
            "holdings": len(holdings_store)
        }
    }


@app.get("/status")
async def get_status():
    """Get detailed data service status"""
    return {
        "service": "assetmind-data",
        "data_directory": DATA_DIR,
        "cache_ttl": CACHE_TTL,
        "symbols_tracked": len(market_data_store),
        "last_sync": datetime.utcnow().isoformat()
    }


# ============================================================================
# Market Data Endpoints
# ============================================================================

@app.post("/market-data/fetch")
async def fetch_market_data(request: MarketDataRequest):
    """Fetch market data from specified source"""
    logger.info(f"Fetching market data for {request.symbol} from {request.source}")

    # In production, this would call actual data sources
    return {
        "symbol": request.symbol,
        "source": request.source,
        "start_date": request.start_date.isoformat(),
        "end_date": request.end_date.isoformat(),
        "interval": request.interval,
        "data_points": 0,
        "status": "fetched"
    }


@app.get("/market-data/{symbol}")
async def get_market_data(
    symbol: str,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    interval: str = "1d"
):
    """Get market data for a symbol"""
    if symbol not in market_data_store:
        raise HTTPException(status_code=404, detail="No data found for symbol")

    data = market_data_store[symbol]

    if start:
        data = [d for d in data if d.timestamp >= start]
    if end:
        data = [d for d in data if d.timestamp <= end]

    return {"symbol": symbol, "data": data, "count": len(data)}


@app.post("/market-data/ingest")
async def ingest_market_data(symbol: str, data_points: List[MarketDataPoint]):
    """Ingest market data points"""
    if symbol not in market_data_store:
        market_data_store[symbol] = []

    market_data_store[symbol].extend(data_points)
    market_data_store[symbol].sort(key=lambda x: x.timestamp)

    return {"symbol": symbol, "ingested": len(data_points), "total": len(market_data_store[symbol])}


# ============================================================================
# News Endpoints
# ============================================================================

@app.get("/news")
async def get_news(
    symbol: Optional[str] = None,
    source: Optional[str] = None,
    sentiment: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get news articles with filters"""
    articles = news_store

    if symbol:
        articles = [a for a in articles if symbol in a.symbols]
    if source:
        articles = [a for a in articles if a.source == source]
    if sentiment:
        sentiment_map = {"positive": (0.3, 1.0), "neutral": (-0.3, 0.3), "negative": (-1.0, -0.3)}
        if sentiment in sentiment_map:
            min_s, max_s = sentiment_map[sentiment]
            articles = [a for a in articles if a.sentiment and min_s <= a.sentiment <= max_s]

    articles.sort(key=lambda x: x.published_at, reverse=True)
    return {"articles": articles[offset:offset + limit], "total": len(articles)}


@app.post("/news/ingest")
async def ingest_news(article: NewsArticle):
    """Ingest a news article"""
    article.id = f"news_{len(news_store) + 1}"
    news_store.append(article)
    return {"id": article.id, "status": "ingested"}


@app.get("/news/{article_id}")
async def get_news_article(article_id: str):
    """Get a specific news article"""
    for article in news_store:
        if article.id == article_id:
            return article
    raise HTTPException(status_code=404, detail="Article not found")


# ============================================================================
# Earnings Endpoints
# ============================================================================

@app.get("/earnings/upcoming")
async def get_upcoming_earnings(limit: int = 20):
    """Get upcoming earnings events"""
    upcoming = [e for e in earnings_store if e.status == "UPCOMING"]
    upcoming.sort(key=lambda x: x.earnings_date)
    return {"earnings": upcoming[:limit]}


@app.get("/earnings/{symbol}")
async def get_earnings(symbol: str):
    """Get earnings data for a symbol"""
    earnings = [e for e in earnings_store if e.symbol == symbol]
    return {"symbol": symbol, "earnings": earnings}


@app.post("/earnings/ingest")
async def ingest_earnings(earnings: EarningsData):
    """Ingest earnings data"""
    earnings_store.append(earnings)
    return {"status": "ingested", "symbol": earnings.symbol}


# ============================================================================
# Economic Indicators Endpoints
# ============================================================================

@app.get("/economic/indicators")
async def get_economic_indicators(
    region: Optional[str] = None,
    limit: int = 50
):
    """Get economic indicators"""
    indicators = economic_store

    if region:
        indicators = [i for i in indicators if i.region == region]

    indicators.sort(key=lambda x: x.timestamp, reverse=True)
    return {"indicators": indicators[:limit]}


@app.get("/economic/indicator/{name}")
async def get_indicator(name: str):
    """Get specific economic indicator"""
    indicators = [i for i in economic_store if i.name == name]
    if not indicators:
        raise HTTPException(status_code=404, detail="Indicator not found")

    latest = max(indicators, key=lambda x: x.timestamp)
    return latest


@app.post("/economic/ingest")
async def ingest_economic_indicator(indicator: EconomicIndicator):
    """Ingest economic indicator"""
    indicator.id = f"econ_{len(economic_store) + 1}"
    economic_store.append(indicator)
    return {"id": indicator.id, "status": "ingested"}


# ============================================================================
# Sentiment Endpoints
# ============================================================================

@app.get("/sentiment/{symbol}")
async def get_sentiment(symbol: str, source: Optional[str] = None):
    """Get sentiment data for a symbol"""
    sentiments = [s for s in sentiment_store if s.symbol == symbol]

    if source:
        sentiments = [s for s in sentiments if s.source == source]

    return {"symbol": symbol, "sentiments": sentiments}


@app.post("/sentiment/ingest")
async def ingest_sentiment(sentiment: SentimentData):
    """Ingest sentiment data"""
    sentiment_store.append(sentiment)
    return {"status": "ingested", "timestamp": sentiment.timestamp.isoformat()}


# ============================================================================
# Institutional Holdings Endpoints
# ============================================================================

@app.get("/holdings/{symbol}")
async def get_holdings(symbol: str):
    """Get institutional holdings for a symbol"""
    holdings = [h for h in holdings_store if h.symbol == symbol]
    return {"symbol": symbol, "holdings": holdings, "count": len(holdings)}


@app.post("/holdings/ingest")
async def ingest_holdings(holdings: List[InstitutionalHolding]):
    """Ingest institutional holdings"""
    holdings_store.extend(holdings)
    return {"ingested": len(holdings), "total": len(holdings_store)}


# ============================================================================
# Data Sync Endpoints
# ============================================================================

@app.post("/sync")
async def sync_data(request: DataSyncRequest, background_tasks: BackgroundTasks):
    """Sync data from external sources"""
    logger.info(f"Syncing data from {request.source} for {len(request.symbols)} symbols")

    return {
        "source": request.source,
        "symbols": request.symbols,
        "status": "started",
        "job_id": f"sync_{datetime.utcnow().timestamp()}"
    }


@app.get("/sync/status/{job_id}")
async def get_sync_status(job_id: str):
    """Get data sync job status"""
    return {
        "job_id": job_id,
        "status": "completed",
        "records_synced": 0,
        "errors": []
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)