"""
Health Score Service
Overall asset health composite score
Port: 5070
"""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Health Score Service", version="1.0.0")


class HealthScoreService:
    """Overall asset health composite score service"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Health Score"
        self.port = 5070

    async def calculate_score(
        self,
        symbol: str,
        time_horizon: str = "medium"
    ) -> Dict[str, Any]:
        """
        Calculate health score for an asset

        Args:
            symbol: Asset symbol
            time_horizon: short, medium, long

        Returns:
            Score data with value, factors, and confidence
        """
        import random

        # In production, this would fetch from multiple services
        financial_score = random.randint(50, 95)
        technical_score = random.randint(40, 90)
        sentiment_score = random.randint(45, 85)
        risk_score = random.randint(20, 80)

        # Weighted composite
        health_score = int(
            financial_score * 0.30 +
            technical_score * 0.25 +
            sentiment_score * 0.20 +
            (100 - risk_score) * 0.25
        )

        return {
            "symbol": symbol.upper(),
            "score": health_score,
            "score_name": "health",
            "time_horizon": time_horizon,
            "confidence": 0.78,
            "factors": {
                "financial": financial_score,
                "technical": technical_score,
                "sentiment": sentiment_score,
                "risk_adjusted": 100 - risk_score,
            },
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def get_historical(
        self,
        symbol: str,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get historical health scores"""
        import random

        history = []
        current_date = datetime.utcnow()

        for i in range(days):
            date = current_date - timedelta(days=i)
            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "score": random.randint(50, 85),
            })

        return history


# Service instance
service = HealthScoreService()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Health Score", "port": 5070}


@app.get("/api/v1/score/{symbol}")
async def get_score(symbol: str, time_horizon: str = "medium"):
    return await service.calculate_score(symbol.upper(), time_horizon)


@app.get("/api/v1/history/{symbol}")
async def get_history(symbol: str, days: int = 30):
    return await service.get_historical(symbol.upper(), days)


@app.post("/api/v1/scores/batch")
async def get_scores_batch(symbols: List[str], time_horizon: str = "medium"):
    results = []
    for symbol in symbols:
        score = await service.calculate_score(symbol.upper(), time_horizon)
        results.append(score)
    return {"scores": results, "timestamp": datetime.utcnow().isoformat()}
