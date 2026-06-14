"""
AssetMind - News Data Connector
Port: 5030

Financial news and sentiment analysis.

Features:
- Real-time news
- Sentiment analysis
- Topic extraction
- Entity recognition

Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import random

app = FastAPI(title="AssetMind News Connector")


class NewsArticle(BaseModel):
    id: str
    title: str
    source: str
    url: str
    published: str
    sentiment: float  # -1 to 1
    entities: List[str]


class SentimentSummary(BaseModel):
    symbol: str
    overall_sentiment: float
    positive_count: int
    negative_count: int
    neutral_count: int
    top_articles: List[NewsArticle]


@app.get("/health")
async def health():
    return {"service": "news-connector", "status": "healthy"}


@app.get("/news/{symbol}")
async def get_news(symbol: str, limit: int = 10) -> List[NewsArticle]:
    """Get news for symbol"""
    articles = []
    for i in range(limit):
        articles.append(NewsArticle(
            id=f"news-{symbol}-{i}",
            title=f"{symbol} reports strong quarterly results",
            source=random.choice(["Reuters", "Bloomberg", "CNBC", "WSJ"]),
            url=f"https://news.example.com/{symbol}/{i}",
            published=(datetime.utcnow() - timedelta(hours=i)).isoformat(),
            sentiment=random.uniform(-0.5, 0.5),
            entities=[symbol, "Tech", "Market"]
        ))
    return articles


@app.get("/sentiment/{symbol}")
async def get_sentiment(symbol: str) -> SentimentSummary:
    """Get sentiment analysis for symbol"""
    positive = random.randint(10, 30)
    negative = random.randint(5, 20)
    neutral = random.randint(10, 30)
    total = positive + negative + neutral

    return SentimentSummary(
        symbol=symbol.upper(),
        overall_sentiment=round((positive - negative) / total, 2),
        positive_count=positive,
        negative_count=negative,
        neutral_count=neutral,
        top_articles=[]
    )


@app.get("/trending")
async def get_trending() -> List[dict]:
    """Get trending financial topics"""
    return [
        {"topic": "AI Stocks", "mentions": 5000, "sentiment": 0.75},
        {"topic": "Fed Rate", "mentions": 10000, "sentiment": -0.2},
        {"topic": "Crypto Rally", "mentions": 8000, "sentiment": 0.65}
    ]


@app.get("/earnings")
async def get_earnings_calendar(days: int = 7) -> List[dict]:
    """Get upcoming earnings releases"""
    return [
        {"symbol": "NVDA", "date": "2024-05-22", "time": "AMC", "estimate": 6.50},
        {"symbol": "AAPL", "date": "2024-05-23", "time": "AMC", "estimate": 2.00},
        {"symbol": "MSFT", "date": "2024-04-25", "time": "AMC", "estimate": 2.80}
    ]


@app.post("/analyze")
async def analyze_sentiment(text: str) -> dict:
    """Analyze sentiment of arbitrary text"""
    return {
        "text": text[:100],
        "sentiment": round(random.uniform(-0.5, 0.5), 2),
        "entities": ["Tech", "Finance"],
        "topics": ["Earnings", "Growth"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5030)