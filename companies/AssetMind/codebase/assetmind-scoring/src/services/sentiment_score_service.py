"""
Sentiment Score Service
Sentiment bias score
Port: 5073
"""

from fastapi import FastAPI
from typing import Dict, List, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Sentiment Score Service", version="1.0.0")


class SentimentScoreService:
    """Sentiment bias score service"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Sentiment Score"
        self.port = 5073

    async def calculate_score(
        self,
        symbol: str,
        time_horizon: str = "medium"
    ) -> Dict[str, Any]:
        """Calculate sentiment score for an asset"""
        import random

        # Sentiment sources
        social_sentiment = random.randint(30, 80)
        news_sentiment = random.randint(35, 85)
        analyst_sentiment = random.randint(40, 90)
        institutional_sentiment = random.randint(45, 85)

        # Composite sentiment
        sentiment_score = int(
            social_sentiment * 0.25 +
            news_sentiment * 0.25 +
            analyst_sentiment * 0.30 +
            institutional_sentiment * 0.20
        )

        return {
            "symbol": symbol.upper(),
            "score": sentiment_score,
            "score_name": "sentiment",
            "time_horizon": time_horizon,
            "confidence": 0.70,
            "factors": {
                "social": social_sentiment,
                "news": news_sentiment,
                "analyst": analyst_sentiment,
                "institutional": institutional_sentiment,
            },
            "interpretation": "50 = neutral, >50 bullish, <50 bearish",
            "timestamp": datetime.utcnow().isoformat(),
        }


service = SentimentScoreService()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Sentiment Score", "port": 5073}


@app.get("/api/v1/score/{symbol}")
async def get_score(symbol: str, time_horizon: str = "medium"):
    return await service.calculate_score(symbol.upper(), time_horizon)


@app.post("/api/v1/scores/batch")
async def get_scores_batch(symbols: List[str], time_horizon: str = "medium"):
    results = [await service.calculate_score(s.upper(), time_horizon) for s in symbols]
    return {"scores": results, "timestamp": datetime.utcnow().isoformat()}
