"""
AssetMind - Earnings Service
Port: 5012
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta


app = FastAPI(title="AssetMind Earnings Service", version="1.0.0")


class EarningsEvent(BaseModel):
    symbol: str
    company_name: str
    earnings_date: datetime
    eps_estimate: float
    eps_actual: Optional[float] = None
    revenue_estimate: float
    revenue_actual: Optional[float] = None
    beat_probability: float = Field(50, ge=0, le=100)
    report_type: str = "EARNINGS"  # EARNINGS, DIVIDEND, SPLIT
    status: str = "UPCOMING"  # UPCOMING, REPORTED, CONFIRMED


# Mock earnings data
MOCK_EARNINGS = [
    EarningsEvent(
        symbol="NVDA", company_name="NVIDIA Corporation",
        earnings_date=datetime.utcnow() + timedelta(days=5),
        eps_estimate=6.32, revenue_estimate=24.5e9,
        beat_probability=78, status="UPCOMING"
    ),
    EarningsEvent(
        symbol="AAPL", company_name="Apple Inc",
        earnings_date=datetime.utcnow() + timedelta(days=12),
        eps_estimate=2.18, revenue_estimate=90.5e9,
        beat_probability=72, status="UPCOMING"
    ),
    EarningsEvent(
        symbol="MSFT", company_name="Microsoft Corporation",
        earnings_date=datetime.utcnow() + timedelta(days=18),
        eps_estimate=2.93, revenue_estimate=61.8e9,
        beat_probability=75, status="UPCOMING"
    ),
    EarningsEvent(
        symbol="TSLA", company_name="Tesla Inc",
        earnings_date=datetime.utcnow() + timedelta(days=7),
        eps_estimate=0.52, revenue_estimate=24.8e9,
        beat_probability=65, status="UPCOMING"
    ),
    EarningsEvent(
        symbol="AMZN", company_name="Amazon.com Inc",
        earnings_date=datetime.utcnow() + timedelta(days=25),
        eps_estimate=1.07, revenue_estimate=143.2e9,
        beat_probability=70, status="UPCOMING"
    ),
    EarningsEvent(
        symbol="META", company_name="Meta Platforms Inc",
        earnings_date=datetime.utcnow() + timedelta(days=30),
        eps_estimate=4.72, revenue_estimate=38.5e9,
        beat_probability=68, status="UPCOMING"
    ),
    EarningsEvent(
        symbol="GOOGL", company_name="Alphabet Inc",
        earnings_date=datetime.utcnow() + timedelta(days=35),
        eps_estimate=1.89, revenue_estimate=81.2e9,
        beat_probability=73, status="UPCOMING"
    ),
]


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-earnings",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5012
    }


@app.get("/earnings/upcoming")
async def get_upcoming_earnings(limit: int = 10):
    upcoming = [e for e in MOCK_EARNINGS if e.status == "UPCOMING"]
    upcoming.sort(key=lambda x: x.earnings_date)
    return {"earnings": upcoming[:limit]}


@app.get("/earnings/today")
async def get_today_earnings():
    today = datetime.utcnow().date()
    return {"earnings": [e for e in MOCK_EARNINGS if e.earnings_date.date() == today]}


@app.get("/earnings/week")
async def get_week_earnings():
    today = datetime.utcnow().date()
    week_end = today + timedelta(days=7)
    return {"earnings": [
        e for e in MOCK_EARNINGS
        if today <= e.earnings_date.date() <= week_end
    ]}


@app.get("/earnings/{symbol}")
async def get_earnings_for_symbol(symbol: str):
    for e in MOCK_EARNINGS:
        if e.symbol == symbol.upper():
            return e
    return {"error": "No earnings data found"}


@app.get("/earnings/confidence/{symbol}")
async def get_earnings_confidence(symbol: str):
    for e in MOCK_EARNINGS:
        if e.symbol == symbol.upper():
            return {
                "symbol": symbol.upper(),
                "beat_probability": e.beat_probability,
                "interpretation": "LIKELY_BEAT" if e.beat_probability > 65 else
                                ("LIKELY_MISS" if e.beat_probability < 45 else "UNCERTAIN"),
                "key_metrics": ["EPS", "Revenue", "Forward Guidance"]
            }
    return {"error": "No earnings data found"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5012)
