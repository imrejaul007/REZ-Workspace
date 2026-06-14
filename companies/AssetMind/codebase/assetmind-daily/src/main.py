"""
AssetMind Daily Service
Daily reports, briefings, and summaries
Port: 5170
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import random
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AssetMind Daily Service",
    description="Daily reports, briefings, and summaries for investment decisions",
    version="1.0.0",
    docs_url="/docs"
)


class BriefingType(str, Enum):
    MORNING = "morning"
    WATCHLIST = "watchlist"
    PORTFOLIO = "portfolio"
    MARKET = "market"
    THEME = "theme"
    RISK = "risk"
    OPPORTUNITY = "opportunity"
    EVENING = "evening"


class BriefingPriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class BriefingItem(BaseModel):
    id: str
    type: str
    title: str
    description: str
    priority: BriefingPriority
    action_required: bool
    action_url: Optional[str] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime


class DailyBriefing(BaseModel):
    briefing_id: str
    date: str
    briefing_type: BriefingType
    items: List[BriefingItem]
    summary: str
    total_items: int
    action_required_count: int
    generated_at: datetime
    market_open_countdown: Optional[int] = None


class WatchlistBriefing(BaseModel):
    briefing_id: str
    user_id: str
    symbols: List[str]
    alerts: List[Dict[str, Any]]
    opportunities: List[Dict[str, Any]]
    risks: List[Dict[str, Any]]
    generated_at: datetime


class PortfolioBriefing(BaseModel):
    briefing_id: str
    user_id: str
    portfolio_value: float
    day_change: float
    day_change_pct: float
    positions_review: List[Dict[str, Any]]
    rebalancing_suggestions: List[Dict[str, Any]]
    generated_at: datetime


class DailySummary(BaseModel):
    summary_id: str
    date: str
    market_overview: Dict[str, Any]
    top_gainers: List[Dict[str, Any]]
    top_losers: List[Dict[str, Any]]
    sector_performance: Dict[str, float]
    economic_events: List[Dict[str, Any]]
    earnings_scheduled: List[str]
    generated_at: datetime


class DailyService:
    """Daily briefing and report generation service"""

    def __init__(self):
        self.name = "Daily Service"
        self.port = 5170
        self.version = "1.0.0"
        self._briefings_cache: Dict[str, DailyBriefing] = {}
        self._briefing_count = 0
        self._market_open_time = datetime.strptime("09:30", "%H:%M").time()
        self._market_close_time = datetime.strptime("16:00", "%H:%M").time()

    def _generate_id(self) -> str:
        """Generate unique ID"""
        return str(uuid.uuid4())

    def _get_market_status(self) -> str:
        """Get current market status"""
        now = datetime.utcnow()
        current_time = now.time()
        if current_time < self._market_open_time:
            return "PRE_MARKET"
        elif current_time > self._market_close_time:
            return "AFTER_HOURS"
        return "REGULAR_HOURS"

    def _calculate_countdown(self) -> Optional[int]:
        """Calculate seconds until market open"""
        now = datetime.utcnow()
        today_open = datetime.combine(now.date(), self._market_open_time)
        if now.time() > self._market_close_time:
            today_open += timedelta(days=1)
        if now.time() < self._market_open_time:
            return int((today_open - now).total_seconds())
        return None

    async def generate_morning_briefing(
        self,
        user_id: Optional[str] = None,
        watchlist: Optional[List[str]] = None,
        portfolio: Optional[Dict[str, Any]] = None
    ) -> DailyBriefing:
        """Generate comprehensive morning briefing"""
        self._briefing_count += 1
        briefing_id = f"briefing_{datetime.utcnow().timestamp()}_{self._briefing_count}"

        items = []
        market_status = self._get_market_status()

        # Market Overview
        items.append(BriefingItem(
            id=self._generate_id(),
            type="market_overview",
            title=f"Market Status: {market_status}",
            description=f"Current market phase is {market_status}. Futures indicate {'positive' if random.random() > 0.5 else 'negative'} momentum.",
            priority=BriefingPriority.HIGH,
            action_required=False,
            metrics={"confidence": random.uniform(0.7, 0.95)},
            timestamp=datetime.utcnow()
        ))

        # Pre-Market Movers
        items.append(BriefingItem(
            id=self._generate_id(),
            type="pre_market_movers",
            title="Top Pre-Market Movers",
            description=f"NVDA +{random.uniform(1, 4):.1f}%, TSLA +{random.uniform(0.5, 3):.1f}%, AAPL +{random.uniform(0.1, 1.5):.1f}%",
            priority=BriefingPriority.MEDIUM,
            action_required=False,
            timestamp=datetime.utcnow()
        ))

        # Economic Events
        items.append(BriefingItem(
            id=self._generate_id(),
            type="economic_events",
            title="Economic Calendar Today",
            description="CPI data release at 8:30 AM, Fed speakers scheduled, Treasury auction at 1:00 PM",
            priority=BriefingPriority.HIGH,
            action_required=True,
            action_url="/api/v1/calendar",
            timestamp=datetime.utcnow()
        ))

        # Earnings Preview
        items.append(BriefingItem(
            id=self._generate_id(),
            type="earnings_preview",
            title="Earnings Watch",
            description=f"{random.randint(3, 8)} major companies reporting earnings today. Focus on tech sector guidance.",
            priority=BriefingPriority.MEDIUM,
            action_required=False,
            timestamp=datetime.utcnow()
        ))

        # Sector Rotation
        items.append(BriefingItem(
            id=self._generate_id(),
            type="sector_rotation",
            title="Sector Rotation Signal",
            description="Technology and Healthcare showing strongest momentum. Energy sector facing headwinds.",
            priority=BriefingPriority.MEDIUM,
            action_required=False,
            timestamp=datetime.utcnow()
        ))

        # Watchlist Alerts
        if watchlist:
            for symbol in watchlist[:3]:
                items.append(BriefingItem(
                    id=self._generate_id(),
                    type="watchlist_alert",
                    title=f"{symbol} Alert",
                    description=f"{symbol} approaching key resistance. Volume increasing {random.uniform(10, 50):.0f}%.",
                    priority=BriefingPriority.HIGH if random.random() > 0.5 else BriefingPriority.MEDIUM,
                    action_required=True,
                    action_url=f"/api/v1/symbol/{symbol}",
                    timestamp=datetime.utcnow()
                ))

        # Risk Alert
        if random.random() > 0.7:
            items.append(BriefingItem(
                id=self._generate_id(),
                type="risk_alert",
                title="Volatility Index Elevated",
                description="VIX at elevated levels, consider hedging strategies for large positions.",
                priority=BriefingPriority.CRITICAL,
                action_required=True,
                timestamp=datetime.utcnow()
            ))

        action_count = sum(1 for item in items if item.action_required)

        briefing = DailyBriefing(
            briefing_id=briefing_id,
            date=datetime.utcnow().strftime("%Y-%m-%d"),
            briefing_type=BriefingType.MORNING,
            items=items,
            summary=f"Morning Briefing - {len(items)} items, {action_count} require action.",
            total_items=len(items),
            action_required_count=action_count,
            generated_at=datetime.utcnow(),
            market_open_countdown=self._calculate_countdown()
        )

        self._briefings_cache[briefing_id] = briefing
        logger.info(f"Generated morning briefing: {briefing_id}")
        return briefing

    async def generate_watchlist_briefing(
        self,
        user_id: str,
        symbols: List[str]
    ) -> WatchlistBriefing:
        """Generate briefing for watchlist symbols"""
        alerts = []
        opportunities = []
        risks = []

        for symbol in symbols:
            price = random.uniform(50, 500)
            change = random.uniform(-5, 5)

            if change > 2:
                opportunities.append({
                    "symbol": symbol,
                    "reason": f"Breaking out with +{change:.1f}% gain",
                    "action": "Consider adding to position"
                })
            elif change < -3:
                risks.append({
                    "symbol": symbol,
                    "reason": f"Declining with {change:.1f}% loss",
                    "action": "Monitor for support levels"
                })

            alerts.append({
                "symbol": symbol,
                "price": round(price, 2),
                "change": round(change, 2),
                "volume": random.randint(1000000, 50000000),
                "signal": "BULLISH" if change > 0 else "BEARISH"
            })

        return WatchlistBriefing(
            briefing_id=self._generate_id(),
            user_id=user_id,
            symbols=symbols,
            alerts=alerts,
            opportunities=opportunities,
            risks=risks,
            generated_at=datetime.utcnow()
        )

    async def generate_portfolio_briefing(
        self,
        user_id: str,
        portfolio: Dict[str, Any]
    ) -> PortfolioBriefing:
        """Generate portfolio-specific briefing"""
        holdings = portfolio.get("holdings", [])
        total_value = sum(h.get("value", 0) for h in holdings)
        day_change = total_value * random.uniform(-0.02, 0.03)

        positions_review = []
        rebalancing = []

        for holding in holdings[:5]:
            weight = (holding.get("value", 0) / total_value) * 100 if total_value > 0 else 0
            positions_review.append({
                "symbol": holding.get("symbol"),
                "weight": round(weight, 2),
                "performance": round(random.uniform(-5, 10), 2),
                "status": "UNDERPERFORMING" if random.random() > 0.7 else "ON_TRACK"
            })

            if weight > 15:
                rebalancing.append({
                    "symbol": holding.get("symbol"),
                    "current_weight": round(weight, 2),
                    "suggested_weight": 10.0,
                    "action": "REDUCE"
                })
            elif weight < 3:
                rebalancing.append({
                    "symbol": holding.get("symbol"),
                    "current_weight": round(weight, 2),
                    "suggested_weight": 5.0,
                    "action": "ADD"
                })

        return PortfolioBriefing(
            briefing_id=self._generate_id(),
            user_id=user_id,
            portfolio_value=total_value,
            day_change=round(day_change, 2),
            day_change_pct=round((day_change / total_value) * 100, 2) if total_value > 0 else 0,
            positions_review=positions_review,
            rebalancing_suggestions=rebalancing,
            generated_at=datetime.utcnow()
        )

    async def generate_daily_summary(self) -> DailySummary:
        """Generate end-of-day summary"""
        sectors = ["Technology", "Healthcare", "Financials", "Energy", "Consumer", "Industrials"]
        sector_perf = {s: round(random.uniform(-2, 3), 2) for s in sectors}

        return DailySummary(
            summary_id=self._generate_id(),
            date=datetime.utcnow().strftime("%Y-%m-%d"),
            market_overview={
                "sp500": {"close": round(random.uniform(4800, 5300), 2), "change": round(random.uniform(-1, 2), 2)},
                "nasdaq": {"close": round(random.uniform(15000, 17000), 2), "change": round(random.uniform(-1, 3), 2)},
                "dow": {"close": round(random.uniform(37000, 39000), 2), "change": round(random.uniform(-0.5, 1.5), 2)}
            },
            top_gainers=[
                {"symbol": "NVDA", "change": round(random.uniform(3, 8), 2)},
                {"symbol": "AMD", "change": round(random.uniform(2, 6), 2)},
                {"symbol": "META", "change": round(random.uniform(2, 5), 2)}
            ],
            top_losers=[
                {"symbol": "BA", "change": round(random.uniform(-5, -2), 2)},
                {"symbol": "GS", "change": round(random.uniform(-4, -1), 2)},
                {"symbol": "NKE", "change": round(random.uniform(-3, -1), 2)}
            ],
            sector_performance=sector_perf,
            economic_events=[
                {"time": "08:30", "event": "Jobless Claims", "impact": "MEDIUM"},
                {"time": "10:00", "event": "Pending Home Sales", "impact": "LOW"}
            ],
            earnings_scheduled=["AAPL", "MSFT", "GOOGL", "AMZN"],
            generated_at=datetime.utcnow()
        )


service = DailyService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "briefings_generated": service._briefing_count,
        "market_status": service._get_market_status()
    }


@app.post("/api/v1/briefing/morning")
async def generate_morning_briefing(
    user_id: Optional[str] = None,
    watchlist: Optional[List[str]] = None,
    portfolio: Optional[Dict[str, Any]] = None
):
    """Generate comprehensive morning briefing"""
    return await service.generate_morning_briefing(user_id, watchlist, portfolio)


@app.post("/api/v1/briefing/watchlist")
async def generate_watchlist_briefing(user_id: str, symbols: List[str]):
    """Generate briefing for watchlist symbols"""
    return await service.generate_watchlist_briefing(user_id, symbols)


@app.post("/api/v1/briefing/portfolio")
async def generate_portfolio_briefing(user_id: str, portfolio: Dict[str, Any]):
    """Generate portfolio-specific briefing"""
    return await service.generate_portfolio_briefing(user_id, portfolio)


@app.get("/api/v1/summary/daily")
async def get_daily_summary():
    """Get end-of-day summary"""
    return await service.generate_daily_summary()


@app.get("/api/v1/briefing/{briefing_id}")
async def get_briefing(briefing_id: str):
    """Get briefing by ID"""
    if briefing_id not in service._briefings_cache:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return service._briefings_cache[briefing_id]


@app.get("/api/v1/briefing/today")
async def get_today_briefing():
    """Get today's briefing"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    for briefing in service._briefings_cache.values():
        if briefing.date == today:
            return briefing
    return await service.generate_morning_briefing()


@app.get("/api/v1/market/status")
async def get_market_status():
    """Get current market status"""
    return {
        "status": service._get_market_status(),
        "countdown": service._calculate_countdown(),
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5170)
