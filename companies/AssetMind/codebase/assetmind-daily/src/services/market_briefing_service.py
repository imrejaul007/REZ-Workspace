"""
Market Briefing Service
Market overview and analysis briefing
Port: 5173
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum
import logging
import random

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Market Briefing Service", version="1.0.0", docs_url="/docs")


class MarketIndex(BaseModel):
    symbol: str
    name: str
    value: float
    change: float
    change_percent: float
    volume: int
    high: float
    low: float


class SectorPerformance(BaseModel):
    sector: str
    change_percent: float
    top_gainer: Dict[str, Any]
    top_loser: Dict[str, Any]
    volume: int


class MarketBreadth(BaseModel):
    advancing: int
    declining: int
    unchanged: int
    new_highs: int
    new_lows: int
    breadth_ratio: float


class MarketBriefing(BaseModel):
    briefing_id: str
    date: str
    indices: List[MarketIndex]
    sectors: List[SectorPerformance]
    breadth: MarketBreadth
    movers: Dict[str, List[Dict[str, Any]]]
    summary: Dict[str, Any]
    generated_at: datetime


class MarketBriefingService:
    """Generate market overview briefings"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Market Briefing Service"
        self.port = 5173
        self.version = "1.0.0"
        self._briefings: Dict[str, MarketBriefing] = {}
        self._briefing_count = 0

    def _generate_briefing_id(self) -> str:
        """Generate unique briefing ID"""
        self._briefing_count += 1
        return f"market_briefing_{datetime.utcnow().timestamp()}_{self._briefing_count}"

    def _generate_index(
        self,
        symbol: str,
        name: str,
        base_value: float
    ) -> MarketIndex:
        """Generate market index data"""
        change = random.uniform(-1.5, 2.5)
        change_pct = (change / base_value) * 100
        volume = random.randint(500e6, 5e9)

        return MarketIndex(
            symbol=symbol,
            name=name,
            value=round(base_value + change, 2),
            change=round(change, 2),
            change_percent=round(change_pct, 2),
            volume=volume,
            high=round(base_value + change + random.uniform(0, 20), 2),
            low=round(base_value + change - random.uniform(0, 20), 2)
        )

    def _generate_sector(self, sector: str) -> SectorPerformance:
        """Generate sector performance data"""
        change_pct = random.uniform(-2, 3)

        return SectorPerformance(
            sector=sector,
            change_percent=round(change_pct, 2),
            top_gainer={
                "symbol": f"{sector[:3]}X",
                "change_percent": round(abs(change_pct) + random.uniform(1, 5), 2)
            },
            top_loser={
                "symbol": f"{sector[:3]}Y",
                "change_percent": round(-abs(change_pct) - random.uniform(1, 3), 2)
            },
            volume=random.randint(100e6, 1e9)
        )

    def _generate_breadth(self) -> MarketBreadth:
        """Generate market breadth data"""
        advancing = random.randint(1500, 2500)
        declining = random.randint(1000, 2000)
        unchanged = random.randint(500, 1000)
        new_highs = random.randint(50, 200)
        new_lows = random.randint(20, 100)

        return MarketBreadth(
            advancing=advancing,
            declining=declining,
            unchanged=unchanged,
            new_highs=new_highs,
            new_lows=new_lows,
            breadth_ratio=round(advancing / declining, 2) if declining > 0 else 0
        )

    async def generate_briefing(self) -> MarketBriefing:
        """Generate market briefing"""
        briefing_id = self._generate_briefing_id()

        # Generate indices
        indices = [
            self._generate_index("SPX", "S&P 500", 5000),
            self._generate_index("DJI", "Dow Jones", 38000),
            self._generate_index("IXIC", "NASDAQ", 16000),
            self._generate_index("RUT", "Russell 2000", 2000),
            self._generate_index("VIX", "VIX", 18)
        ]

        # Generate sectors
        sectors = [
            "Technology", "Healthcare", "Financials", "Consumer Discretionary",
            "Industrials", "Communication Services", "Consumer Staples",
            "Energy", "Utilities", "Real Estate", "Materials"
        ]
        sector_performances = [self._generate_sector(s) for s in sectors]

        # Generate breadth
        breadth = self._generate_breadth()

        # Generate movers
        movers = {
            "gainers": [
                {"symbol": "NVDA", "change": random.uniform(3, 8)},
                {"symbol": "TSLA", "change": random.uniform(2, 6)},
                {"symbol": "AMD", "change": random.uniform(2, 5)},
                {"symbol": "META", "change": random.uniform(1, 4)},
                {"symbol": "AVGO", "change": random.uniform(1, 3)}
            ],
            "losers": [
                {"symbol": "BA", "change": random.uniform(-4, -1)},
                {"symbol": "GS", "change": random.uniform(-3, -1)},
                {"symbol": "NKE", "change": random.uniform(-2, -0.5)},
                {"symbol": "DIS", "change": random.uniform(-2, -0.5)},
                {"symbol": "PYPL", "change": random.uniform(-3, -1)}
            ]
        }

        # Generate summary
        total_market_change = sum(i.change_percent for i in indices if i.symbol != "VIX") / 4
        avg_sector_change = sum(s.change_percent for s in sector_performances) / len(sector_performances)

        summary = {
            "market_status": "BULLISH" if total_market_change > 0.5 else ("BEARISH" if total_market_change < -0.5 else "NEUTRAL"),
            "market_sentiment": "POSITIVE" if breadth.breadth_ratio > 1.2 else ("NEGATIVE" if breadth.breadth_ratio < 0.8 else "NEUTRAL"),
            "avg_change": round(total_market_change, 2),
            "avg_sector_change": round(avg_sector_change, 2),
            "new_highs_vs_lows": f"{breadth.new_highs}/{breadth.new_lows}",
            "breadth_indicator": "HEALTHY" if breadth.breadth_ratio > 1.5 else ("WEAK" if breadth.breadth_ratio < 0.8 else "NEUTRAL")
        }

        briefing = MarketBriefing(
            briefing_id=briefing_id,
            date=datetime.utcnow().strftime("%Y-%m-%d"),
            indices=indices,
            sectors=sector_performances,
            breadth=breadth,
            movers=movers,
            summary=summary,
            generated_at=datetime.utcnow()
        )

        self._briefings[briefing_id] = briefing
        logger.info(f"Generated market briefing: {briefing_id}")

        return briefing

    async def get_briefing(self, briefing_id: str) -> Optional[MarketBriefing]:
        """Get briefing by ID"""
        return self._briefings.get(briefing_id)


service = MarketBriefingService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "briefings_generated": service._briefing_count
    }


@app.post("/api/v1/briefing")
async def generate_briefing():
    """Generate market briefing"""
    return await service.generate_briefing()


@app.get("/api/v1/briefing/{briefing_id}")
async def get_briefing(briefing_id: str):
    """Get briefing by ID"""
    briefing = await service.get_briefing(briefing_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return briefing


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5173)