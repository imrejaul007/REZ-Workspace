"""
AssetMind - News Service
Port: 5013
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


app = FastAPI(title="AssetMind News Service", version="1.0.0")


class NewsArticle(BaseModel):
    id: str
    title: str
    summary: str
    source: str
    url: str
    published_at: datetime
    sentiment_score: float = Field(..., ge=-100, le=100)
    sentiment_label: str  # POSITIVE, NEGATIVE, NEUTRAL
    asset_symbols: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    impact_score: float = Field(0, ge=0, le=100)
    relevance_score: float = Field(0, ge=0, le=100)


# Mock news data
MOCK_NEWS = [
    {
        "id": "news_001",
        "title": "NVIDIA Reports Record Revenue, Stock Surges 8%",
        "summary": "NVIDIA Corporation reported quarterly revenue of $22.1 billion, beating estimates by 15%, driven by unprecedented AI chip demand. Data center revenue reached $18.4 billion, up 409% year-over-year.",
        "source": "Reuters",
        "url": "https://reuters.com/nvidia-earnings",
        "published_at": datetime.utcnow(),
        "sentiment_score": 85,
        "sentiment_label": "POSITIVE",
        "asset_symbols": ["NVDA"],
        "categories": ["EARNINGS", "TECHNOLOGY", "AI"],
        "impact_score": 92,
        "relevance_score": 95
    },
    {
        "id": "news_002",
        "title": "Federal Reserve Signals Potential Rate Cut in September",
        "summary": "Fed Chair indicated that inflation is cooling and the central bank may consider rate reductions. Markets rallied on the news with the S&P 500 gaining 1.2%.",
        "source": "Bloomberg",
        "url": "https://bloomberg.com/fed-rate",
        "published_at": datetime.utcnow(),
        "sentiment_score": 70,
        "sentiment_label": "POSITIVE",
        "asset_symbols": ["SPY", "QQQ", "BTC", "GLD"],
        "categories": ["MACRO", "RATES", "CENTRAL_BANK"],
        "impact_score": 88,
        "relevance_score": 90
    },
    {
        "id": "news_003",
        "title": "Bitcoin ETF Sees Record $1.2B Inflows",
        "summary": "Spot Bitcoin ETFs recorded their largest single-day inflows as institutional interest continues to grow. BlackRock's IBIT led with $720 million in net inflows.",
        "source": "CNBC",
        "url": "https://cnbc.com/bitcoin-etf",
        "published_at": datetime.utcnow(),
        "sentiment_score": 80,
        "sentiment_label": "POSITIVE",
        "asset_symbols": ["BTC", "ETH", "IBIT", "FBTC"],
        "categories": ["CRYPTO", "ETF", "INSTITUTIONAL"],
        "impact_score": 85,
        "relevance_score": 88
    },
    {
        "id": "news_004",
        "title": "Apple Unveils AI Features, Analysts React",
        "summary": "Apple announced its Apple Intelligence platform with AI features across its device lineup. Analysts were mixed on the announcement, with some calling it late to the AI race.",
        "source": "Financial Times",
        "url": "https://ft.com/apple-ai",
        "published_at": datetime.utcnow(),
        "sentiment_score": 45,
        "sentiment_label": "NEUTRAL",
        "asset_symbols": ["AAPL"],
        "categories": ["TECHNOLOGY", "AI", "PRODUCT"],
        "impact_score": 75,
        "relevance_score": 82
    },
    {
        "id": "news_005",
        "title": "Oil Prices Rise Amid Middle East Tensions",
        "summary": "Crude oil prices jumped 3% as geopolitical concerns in the Middle East affected supply expectations. WTI crude reached $82 per barrel.",
        "source": "WSJ",
        "url": "https://wsj.com/oil-prices",
        "published_at": datetime.utcnow(),
        "sentiment_score": -20,
        "sentiment_label": "NEGATIVE",
        "asset_symbols": ["CL", "XOM", "CVX", "OIH"],
        "categories": ["COMMODITIES", "GEOPOLITICAL", "ENERGY"],
        "impact_score": 72,
        "relevance_score": 78
    },
    {
        "id": "news_006",
        "title": "Tesla Cybertruck Deliveries Begin, Musk Confident",
        "summary": "Tesla began Cybertruck deliveries with Elon Musk expressing confidence in the vehicle's potential. Production ramp remains a key focus area.",
        "source": "TechCrunch",
        "url": "https://techcrunch.com/cybertruck",
        "published_at": datetime.utcnow(),
        "sentiment_score": 55,
        "sentiment_label": "POSITIVE",
        "asset_symbols": ["TSLA"],
        "categories": ["AUTOMOTIVE", "EV", "PRODUCT"],
        "impact_score": 68,
        "relevance_score": 72
    }
]


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-news",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5013,
        "source": "gdelts_newsapi"
    }


@app.get("/news")
async def get_news(
    limit: int = 20,
    sentiment: Optional[str] = None,
    category: Optional[str] = None
):
    """Get latest financial news"""
    news = MOCK_NEWS.copy()

    if sentiment:
        news = [n for n in news if n["sentiment_label"] == sentiment.upper()]
    if category:
        news = [n for n in news if category.upper() in n["categories"]]

    return {"news": news[:limit], "total": len(news)}


@app.get("/news/{news_id}")
async def get_news_article(news_id: str):
    """Get a specific news article"""
    for news in MOCK_NEWS:
        if news["id"] == news_id:
            return news
    return {"error": "Article not found"}


@app.get("/news/symbol/{symbol}")
async def get_news_for_symbol(symbol: str, limit: int = 10):
    """Get news for a specific symbol"""
    news = [n for n in MOCK_NEWS if symbol.upper() in n["asset_symbols"]]
    return {"news": news[:limit], "total": len(news)}


@app.get("/news/category/{category}")
async def get_news_by_category(category: str, limit: int = 20):
    """Get news by category"""
    news = [n for n in MOCK_NEWS if category.upper() in n["categories"]]
    return {"news": news[:limit], "total": len(news), "category": category}


@app.get("/news/sentiment")
async def get_sentiment_summary():
    """Get overall news sentiment summary"""
    positive = len([n for n in MOCK_NEWS if n["sentiment_label"] == "POSITIVE"])
    negative = len([n for n in MOCK_NEWS if n["sentiment_label"] == "NEGATIVE"])
    neutral = len([n for n in MOCK_NEWS if n["sentiment_label"] == "NEUTRAL"])

    avg_sentiment = sum(n["sentiment_score"] for n in MOCK_NEWS) / len(MOCK_NEWS)

    return {
        "total_articles": len(MOCK_NEWS),
        "positive": positive,
        "negative": negative,
        "neutral": neutral,
        "avg_sentiment_score": avg_sentiment,
        "overall_sentiment": "POSITIVE" if avg_sentiment > 20 else ("NEGATIVE" if avg_sentiment < -20 else "NEUTRAL")
    }


@app.get("/news/breaking")
async def get_breaking_news(limit: int = 5):
    """Get breaking news (highest impact)"""
    sorted_news = sorted(MOCK_NEWS, key=lambda x: x["impact_score"], reverse=True)
    return {"news": sorted_news[:limit]}


@app.get("/news/headlines")
async def get_headlines():
    """Get quick headlines"""
    headlines = [{"id": n["id"], "title": n["title"], "source": n["source"]} for n in MOCK_NEWS]
    return {"headlines": headlines}


@app.get("/news/sentiment/{symbol}")
async def get_symbol_sentiment(symbol: str):
    """Get sentiment for a specific symbol"""
    news = [n for n in MOCK_NEWS if symbol.upper() in n["asset_symbols"]]

    if not news:
        return {"symbol": symbol, "sentiment": 0, "articles": 0}

    avg_sentiment = sum(n["sentiment_score"] for n in news) / len(news)
    avg_impact = sum(n["impact_score"] for n in news) / len(news)

    return {
        "symbol": symbol,
        "avg_sentiment_score": avg_sentiment,
        "avg_impact_score": avg_impact,
        "article_count": len(news),
        "overall_sentiment": "POSITIVE" if avg_sentiment > 20 else ("NEGATIVE" if avg_sentiment < -20 else "NEUTRAL")
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5013)
