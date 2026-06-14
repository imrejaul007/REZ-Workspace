"""
AssetMind - Sentiment Service
Port: 5014
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Dict, List
from datetime import datetime


app = FastAPI(title="AssetMind Sentiment Service", version="1.0.0")


class SentimentData(BaseModel):
    symbol: str
    social_sentiment: float = Field(50, ge=0, le=100)
    news_sentiment: float = Field(50, ge=0, le=100)
    institutional_sentiment: float = Field(50, ge=0, le=100)
    analyst_sentiment: float = Field(50, ge=0, le=100)
    overall_sentiment: float = Field(50, ge=0, le=100)
    trend: str = "STABLE"  # IMPROVING, STABLE, DETERIORATING
    momentum: str = "NEUTRAL"  # ACCELERATING, NEUTRAL, DECELERATING
    fear_greed_index: float = Field(50, ge=0, le=100)


# Mock sentiment data
MOCK_SENTIMENT = {
    "NVDA": SentimentData(
        symbol="NVDA", social_sentiment=82, news_sentiment=78,
        institutional_sentiment=85, analyst_sentiment=75,
        overall_sentiment=80, trend="IMPROVING", momentum="ACCELERATING",
        fear_greed_index=72
    ),
    "BTC": SentimentData(
        symbol="BTC", social_sentiment=75, news_sentiment=70,
        institutional_sentiment=80, analyst_sentiment=72,
        overall_sentiment=74, trend="IMPROVING", momentum="ACCELERATING",
        fear_greed_index=68
    ),
    "TSLA": SentimentData(
        symbol="TSLA", social_sentiment=55, news_sentiment=48,
        institutional_sentiment=52, analyst_sentiment=45,
        overall_sentiment=50, trend="DETERIORATING", momentum="NEUTRAL",
        fear_greed_index=45
    ),
    "AAPL": SentimentData(
        symbol="AAPL", social_sentiment=68, news_sentiment=72,
        institutional_sentiment=75, analyst_sentiment=78,
        overall_sentiment=73, trend="STABLE", momentum="NEUTRAL",
        fear_greed_index=60
    ),
    "ETH": SentimentData(
        symbol="ETH", social_sentiment=78, news_sentiment=75,
        institutional_sentiment=72, analyst_sentiment=70,
        overall_sentiment=74, trend="IMPROVING", momentum="ACCELERATING",
        fear_greed_index=70
    ),
}


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-sentiment",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5014,
        "sources": ["twitter", "reddit", "news", "analyst"]
    }


@app.get("/sentiment/{symbol}")
async def get_sentiment(symbol: str):
    s = MOCK_SENTIMENT.get(symbol.upper())
    if not s:
        return SentimentData(symbol=symbol.upper())
    return s


@app.get("/sentiment")
async def get_all_sentiment():
    return {"sentiments": list(MOCK_SENTIMENT.values())}


@app.get("/fear-greed")
async def get_fear_greed_index():
    """Get overall market fear and greed index"""
    all_sentiment = list(MOCK_SENTIMENT.values())
    avg_fgi = sum(s.fear_greed_index for s in all_sentiment) / len(all_sentiment)

    return {
        "value": avg_fgi,
        "label": "FEAR" if avg_fgi < 30 else ("GREED" if avg_fgi > 70 else "NEUTRAL"),
        "interpretation": _interpret_fgi(avg_fgi)
    }


def _interpret_fgi(value: float) -> str:
    if value < 20:
        return "EXTREME FEAR - Potential buying opportunity"
    elif value < 40:
        return "FEAR - Markets may be oversold"
    elif value < 60:
        return "NEUTRAL - Balanced market conditions"
    elif value < 80:
        return "GREED - Markets may be overbought"
    else:
        return "EXTREME GREED - Caution advised"


@app.get("/sentiment/bulk")
async def get_bulk_sentiment(symbols: str):
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    return {
        "sentiments": [
            MOCK_SENTIMENT.get(s, SentimentData(symbol=s))
            for s in symbol_list
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5014)
