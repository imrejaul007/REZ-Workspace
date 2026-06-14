"""
Watchlist Briefing Service
Generate personalized briefing for user's watchlist
Port: 5171
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import random

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Watchlist Briefing Service", version="1.0.0", docs_url="/docs")


class AlertType(str, Enum):
    PRICE_TARGET = "price_target"
    BREAKOUT = "breakout"
    BREAKDOWN = "breakdown"
    VOLUME_SPIKE = "volume_spike"
    NEWS = "news"
    EARNINGS = "earnings"
    TECHNICAL = "technical"


class AlertSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class WatchlistAlert(BaseModel):
    alert_id: str
    symbol: str
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    description: str
    current_price: float
    target_price: Optional[float] = None
    change_percent: float
    change_absolute: float
    volume: int
    avg_volume: int
    volume_ratio: float
    timestamp: datetime
    action_url: Optional[str] = None


class WatchlistBriefingItem(BaseModel):
    item_id: str
    symbol: str
    category: str
    title: str
    description: str
    metrics: Dict[str, Any]
    alerts: List[WatchlistAlert]
    score: float  # Overall score 0-100
    sentiment: str  # BULLISH, BEARISH, NEUTRAL


class WatchlistBriefing(BaseModel):
    briefing_id: str
    user_id: Optional[str]
    watchlist: List[str]
    date: str
    items: List[WatchlistBriefingItem]
    summary: Dict[str, Any]
    generated_at: datetime


class WatchlistBriefingService:
    """Generate personalized watchlist briefings"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Watchlist Briefing Service"
        self.port = 5171
        self.version = "1.0.0"
        self._briefings: Dict[str, WatchlistBriefing] = {}
        self._briefing_count = 0

    def _generate_briefing_id(self) -> str:
        """Generate unique briefing ID"""
        self._briefing_count += 1
        return f"watchlist_briefing_{datetime.utcnow().timestamp()}_{self._briefing_count}"

    def _generate_alert(
        self,
        symbol: str,
        alert_type: AlertType,
        current_price: float
    ) -> WatchlistAlert:
        """Generate alert for a watchlist item"""
        change_percent = random.uniform(-5, 8)
        change_absolute = current_price * (change_percent / 100)
        volume = random.randint(1000000, 50000000)
        avg_volume = random.randint(2000000, 30000000)

        alert_id = f"alert_{self._briefing_count}_{random.randint(1000, 9999)}"

        # Generate alert based on type
        if alert_type == AlertType.PRICE_TARGET:
            target_price = current_price * (1 + random.uniform(0.02, 0.10) * (1 if change_percent > 0 else -1))
            severity = AlertSeverity.HIGH if abs(change_percent) > 3 else AlertSeverity.MEDIUM
            title = f"{symbol} Near Price Target"
            description = f"Approaching target of ${target_price:.2f}"
        elif alert_type == AlertType.BREAKOUT:
            target_price = current_price * 1.05
            severity = AlertSeverity.HIGH
            title = f"{symbol} Breaking Out"
            description = "Breaking above key resistance level with strong volume"
        elif alert_type == AlertType.BREAKDOWN:
            target_price = current_price * 0.95
            severity = AlertSeverity.HIGH
            title = f"{symbol} Breaking Down"
            description = "Falling below support level, watch for further weakness"
        elif alert_type == AlertType.VOLUME_SPIKE:
            target_price = None
            severity = AlertSeverity.MEDIUM
            title = f"{symbol} Volume Spike"
            description = f"Volume {random.uniform(2, 5):.1f}x above average"
        elif alert_type == AlertType.NEWS:
            target_price = None
            severity = AlertSeverity.MEDIUM
            title = f"{symbol} News Alert"
            description = "Breaking news may impact price action"
        elif alert_type == AlertType.EARNINGS:
            target_price = None
            severity = AlertSeverity.CRITICAL
            title = f"{symbol} Earnings This Week"
            description = "Earnings announcement scheduled"
        else:
            target_price = None
            severity = AlertSeverity.LOW
            title = f"{symbol} Technical Signal"
            description = "Technical indicator generating signal"

        return WatchlistAlert(
            alert_id=alert_id,
            symbol=symbol,
            alert_type=alert_type,
            severity=severity,
            title=title,
            description=description,
            current_price=round(current_price, 2),
            target_price=round(target_price, 2) if target_price else None,
            change_percent=round(change_percent, 2),
            change_absolute=round(change_absolute, 2),
            volume=volume,
            avg_volume=avg_volume,
            volume_ratio=round(volume / avg_volume, 2),
            timestamp=datetime.utcnow()
        )

    def _generate_watchlist_item(
        self,
        symbol: str
    ) -> WatchlistBriefingItem:
        """Generate briefing item for a watchlist symbol"""
        current_price = random.uniform(50, 500)
        change_percent = random.uniform(-5, 8)
        change_absolute = current_price * (change_percent / 100)

        # Determine category and generate relevant alerts
        categories = ["tech", "finance", "healthcare", "energy", "consumer", "industrial"]
        category = random.choice(categories)

        # Generate alerts
        alert_types = [AlertType.PRICE_TARGET, AlertType.BREAKOUT, AlertType.VOLUME_SPIKE]
        num_alerts = random.randint(0, 3)
        alerts = []

        for i in range(num_alerts):
            alert_type = random.choice(alert_types)
            alerts.append(self._generate_alert(symbol, alert_type, current_price))

        # Calculate overall score
        score = random.uniform(50, 95)
        if any(a.severity == AlertSeverity.CRITICAL for a in alerts):
            score = min(score + 10, 100)
        elif any(a.severity == AlertSeverity.HIGH for a in alerts):
            score = min(score + 5, 100)

        # Determine sentiment
        if change_percent > 2:
            sentiment = "BULLISH"
        elif change_percent < -2:
            sentiment = "BEARISH"
        else:
            sentiment = "NEUTRAL"

        return WatchlistBriefingItem(
            item_id=f"item_{self._briefing_count}_{symbol}",
            symbol=symbol,
            category=category,
            title=f"{symbol} - {sentiment} Outlook",
            description=f"{symbol} showing {sentiment.lower()} signals with {abs(change_percent):.1f}% movement",
            metrics={
                "current_price": round(current_price, 2),
                "change_percent": round(change_percent, 2),
                "change_absolute": round(change_absolute, 2),
                "volume": random.randint(1000000, 50000000),
                "avg_volume": random.randint(2000000, 30000000),
                "market_cap": random.randint(100e9, 3000e9),
                "pe_ratio": random.uniform(10, 50),
                "rsi": random.uniform(30, 70),
                "macd_signal": random.choice(["bullish", "bearish", "neutral"])
            },
            alerts=alerts,
            score=round(score, 1),
            sentiment=sentiment
        )

    async def generate_briefing(
        self,
        watchlist: List[str],
        user_id: Optional[str] = None
    ) -> WatchlistBriefing:
        """Generate watchlist briefing"""
        briefing_id = self._generate_briefing_id()

        items = []
        for symbol in watchlist:
            items.append(self._generate_watchlist_item(symbol))

        # Sort by score (highest first)
        items = sorted(items, key=lambda x: x.score, reverse=True)

        # Generate summary
        bullish_count = sum(1 for i in items if i.sentiment == "BULLISH")
        bearish_count = sum(1 for i in items if i.sentiment == "BEARISH")
        neutral_count = sum(1 for i in items if i.sentiment == "NEUTRAL")
        total_alerts = sum(len(i.alerts) for i in items)
        critical_alerts = sum(
            1 for i in items
            for a in i.alerts
            if a.severity == AlertSeverity.CRITICAL
        )

        briefing = WatchlistBriefing(
            briefing_id=briefing_id,
            user_id=user_id,
            watchlist=watchlist,
            date=datetime.utcnow().strftime("%Y-%m-%d"),
            items=items,
            summary={
                "total_symbols": len(watchlist),
                "bullish": bullish_count,
                "bearish": bearish_count,
                "neutral": neutral_count,
                "total_alerts": total_alerts,
                "critical_alerts": critical_alerts,
                "avg_score": round(sum(i.score for i in items) / len(items), 1) if items else 0,
                "overall_sentiment": "BULLISH" if bullish_count > bearish_count else ("BEARISH" if bearish_count > bullish_count else "NEUTRAL")
            },
            generated_at=datetime.utcnow()
        )

        self._briefings[briefing_id] = briefing
        logger.info(f"Generated watchlist briefing: {briefing_id}")

        return briefing

    async def get_briefing(self, briefing_id: str) -> Optional[WatchlistBriefing]:
        """Get briefing by ID"""
        return self._briefings.get(briefing_id)

    async def get_symbol_analysis(
        self,
        symbol: str,
        historical_days: int = 30
    ) -> Dict[str, Any]:
        """Get detailed analysis for a symbol"""
        current_price = random.uniform(50, 500)
        change = random.uniform(-5, 8)

        return {
            "symbol": symbol,
            "current_price": round(current_price, 2),
            "change_percent": round(change, 2),
            "change_absolute": round(current_price * change / 100, 2),
            "volume": random.randint(1000000, 50000000),
            "avg_volume": random.randint(2000000, 30000000),
            "technicals": {
                "rsi": random.uniform(30, 70),
                "macd": random.uniform(-2, 2),
                "moving_averages": {
                    "sma_20": round(current_price * random.uniform(0.95, 1.05), 2),
                    "sma_50": round(current_price * random.uniform(0.90, 1.10), 2),
                    "sma_200": round(current_price * random.uniform(0.85, 1.15), 2)
                },
                "support": round(current_price * 0.95, 2),
                "resistance": round(current_price * 1.05, 2)
            },
            "fundamentals": {
                "market_cap": random.randint(100e9, 3000e9),
                "pe_ratio": random.uniform(10, 50),
                "eps": random.uniform(-5, 20),
                "dividend_yield": random.uniform(0, 5),
                "debt_to_equity": random.uniform(0.1, 2.0)
            },
            "sentiment": {
                "analyst_rating": random.choice(["BUY", "HOLD", "SELL"]),
                "price_target": round(current_price * random.uniform(1.05, 1.30), 2),
                "news_sentiment": random.uniform(-1, 1),
                "social_sentiment": random.uniform(-1, 1)
            },
            "alerts": [
                {
                    "type": a.alert_type.value,
                    "severity": a.severity.value,
                    "description": a.description
                }
                for a in [self._generate_alert(symbol, AlertType.VOLUME_SPIKE, current_price)]
            ]
        }


service = WatchlistBriefingService()


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
async def generate_briefing(request: Dict[str, Any]):
    """Generate watchlist briefing"""
    return await service.generate_briefing(
        watchlist=request["watchlist"],
        user_id=request.get("user_id")
    )


@app.get("/api/v1/briefing/{briefing_id}")
async def get_briefing(briefing_id: str):
    """Get briefing by ID"""
    briefing = await service.get_briefing(briefing_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return briefing


@app.get("/api/v1/symbol/{symbol}/analysis")
async def get_symbol_analysis(
    symbol: str,
    historical_days: int = Query(30, le=365)
):
    """Get detailed analysis for a symbol"""
    return await service.get_symbol_analysis(symbol, historical_days)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5171)