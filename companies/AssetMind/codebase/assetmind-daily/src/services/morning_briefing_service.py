"""
Morning Briefing Service
Main briefing service that aggregates all daily briefings
Port: 5170
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import random

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Morning Briefing Service", version="1.0.0", docs_url="/docs")


class BriefingType(str, Enum):
    MORNING = "morning"
    WATCHLIST = "watchlist"
    PORTFOLIO = "portfolio"
    MARKET = "market"
    THEME = "theme"
    RISK = "risk"
    OPPORTUNITY = "opportunity"


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
    market_open_countdown: Optional[int] = None  # seconds until market open


class MorningBriefingService:
    """Main morning briefing service that aggregates all daily briefings"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Morning Briefing Service"
        self.port = 5170
        self.version = "1.0.0"
        self._briefings_cache: Dict[str, DailyBriefing] = {}
        self._briefing_count = 0
        self._market_open_time = datetime.strptime("09:30", "%H:%M").time()
        self._market_close_time = datetime.strptime("16:00", "%H:%M").time()

    def _generate_briefing_id(self) -> str:
        """Generate unique briefing ID"""
        self._briefing_count += 1
        return f"briefing_{datetime.utcnow().timestamp()}_{self._briefing_count}"

    def _calculate_market_open_countdown(self) -> Optional[int]:
        """Calculate seconds until market open"""
        now = datetime.utcnow()
        today_market_open = datetime.combine(now.date(), self._market_open_time)

        # If it's after market hours, calculate for tomorrow
        if now.time() > self._market_close_time:
            today_market_open += timedelta(days=1)

        # If it's before market hours, use today's time
        if now.time() < self._market_open_time:
            countdown = int((today_market_open - now).total_seconds())
            return countdown if countdown > 0 else None

        return None

    def _get_market_status(self) -> str:
        """Get current market status"""
        now = datetime.utcnow()
        current_time = now.time()

        if current_time < self._market_open_time:
            return "PRE_MARKET"
        elif current_time > self._market_close_time:
            return "AFTER_HOURS"
        else:
            return "REGULAR_HOURS"

    def _generate_briefing_item(
        self,
        item_type: str,
        title: str,
        description: str,
        priority: BriefingPriority = BriefingPriority.MEDIUM,
        action_required: bool = False
    ) -> BriefingItem:
        """Generate a briefing item"""
        return BriefingItem(
            id=f"item_{self._briefing_count}_{random.randint(1000, 9999)}",
            type=item_type,
            title=title,
            description=description,
            priority=priority,
            action_required=action_required,
            metrics={
                "impact_score": random.randint(50, 100),
                "confidence": random.uniform(0.6, 0.95)
            },
            timestamp=datetime.utcnow()
        )

    async def generate_morning_briefing(
        self,
        user_id: Optional[str] = None,
        watchlist: Optional[List[str]] = None,
        portfolio: Optional[Dict[str, Any]] = None
    ) -> DailyBriefing:
        """Generate comprehensive morning briefing"""
        briefing_id = self._generate_briefing_id()

        items = []

        # Market Overview
        market_status = self._get_market_status()
        items.append(self._generate_briefing_item(
            "market_overview",
            f"Market Status: {market_status}",
            f"Current market phase is {market_status}. S&P 500 futures up {random.uniform(0.2, 1.5):.2f}% with tech stocks leading gains.",
            BriefingPriority.HIGH
        ))

        # Pre-Market Movers
        items.append(self._generate_briefing_item(
            "pre_market_movers",
            "Top Pre-Market Movers",
            f"NVDA +{random.uniform(1, 4):.1f}%, TSLA +{random.uniform(0.5, 3):.1f}%, AAPL +{random.uniform(0.1, 1.5):.1f}%",
            BriefingPriority.MEDIUM
        ))

        # Key Economic Events
        items.append(self._generate_briefing_item(
            "economic_events",
            "Economic Calendar Today",
            "CPI data release at 8:30 AM, Fed speakers scheduled, Treasury auction at 1:00 PM",
            BriefingPriority.HIGH
        ))

        # Earnings Preview
        items.append(self._generate_briefing_item(
            "earnings_preview",
            "Earnings Watch",
            f"{random.randint(3, 8)} major companies reporting earnings today. Focus on tech sector guidance.",
            BriefingPriority.MEDIUM
        ))

        # Sector Rotation
        items.append(self._generate_briefing_item(
            "sector_rotation",
            "Sector Rotation Signal",
            "Technology and Healthcare showing strongest momentum. Energy sector facing headwinds from oil prices.",
            BriefingPriority.MEDIUM
        ))

        # Watchlist Alerts (if watchlist provided)
        if watchlist:
            for symbol in watchlist[:3]:
                items.append(self._generate_briefing_item(
                    "watchlist_alert",
                    f"{symbol} Alert",
                    f"{symbol} approaching key resistance level at ${random.uniform(150, 300):.2f}. Volume increasing {random.uniform(10, 50):.0f}%.",
                    BriefingPriority.HIGH if random.random() > 0.5 else BriefingPriority.MEDIUM,
                    action_required=True
                ))

        # Portfolio Summary (if portfolio provided)
        if portfolio:
            items.append(self._generate_briefing_item(
                "portfolio_summary",
                "Portfolio Morning Check",
                f"Your portfolio gained {random.uniform(0.5, 2.5):.2f}% yesterday. 3 positions showing positive momentum.",
                BriefingPriority.MEDIUM
            ))

        # Risk Alert
        if random.random() > 0.7:
            items.append(self._generate_briefing_item(
                "risk_alert",
                "Volatility Index Elevated",
                "VIX at elevated levels, consider hedging strategies for large positions.",
                BriefingPriority.CRITICAL,
                action_required=True
            ))

        # Action Required Items
        action_items = [item for item in items if item.action_required]

        # Generate summary
        summary = f"Morning Briefing for {datetime.utcnow().strftime('%B %d, %Y')}. "
        summary += f"Market status: {market_status}. "
        summary += f"{len(items)} items covered. "
        summary += f"{len(action_items)} items require your attention."

        briefing = DailyBriefing(
            briefing_id=briefing_id,
            date=datetime.utcnow().strftime("%Y-%m-%d"),
            briefing_type=BriefingType.MORNING,
            items=items,
            summary=summary,
            total_items=len(items),
            action_required_count=len(action_items),
            generated_at=datetime.utcnow(),
            market_open_countdown=self._calculate_market_open_countdown()
        )

        self._briefings_cache[briefing_id] = briefing
        logger.info(f"Generated morning briefing: {briefing_id}")

        return briefing

    async def get_briefing(self, briefing_id: str) -> Optional[DailyBriefing]:
        """Get briefing by ID"""
        return self._briefings_cache.get(briefing_id)

    async def get_today_briefing(self) -> Optional[DailyBriefing]:
        """Get today's briefing"""
        today = datetime.utcnow().strftime("%Y-%m-%d")
        for briefing in self._briefings_cache.values():
            if briefing.date == today and briefing.briefing_type == BriefingType.MORNING:
                return briefing
        return None

    async def get_briefing_history(
        self,
        days: int = 7,
        briefing_type: Optional[BriefingType] = None
    ) -> List[Dict[str, Any]]:
        """Get briefing history"""
        history = []
        for briefing in self._briefings_cache.values():
            if briefing_type and briefing.briefing_type != briefing_type:
                continue
            history.append({
                "briefing_id": briefing.briefing_id,
                "date": briefing.date,
                "briefing_type": briefing.briefing_type.value,
                "total_items": briefing.total_items,
                "action_required_count": briefing.action_required_count,
                "generated_at": briefing.generated_at.isoformat()
            })

        return sorted(history, key=lambda x: x["generated_at"], reverse=True)[:days]

    async def get_briefing_items(
        self,
        briefing_id: str,
        priority: Optional[BriefingPriority] = None,
        item_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get briefing items with filtering"""
        briefing = self._briefings_cache.get(briefing_id)
        if not briefing:
            return []

        items = briefing.items

        if priority:
            items = [i for i in items if i.priority == priority]

        if item_type:
            items = [i for i in items if i.type == item_type]

        return [
            {
                "id": item.id,
                "type": item.type,
                "title": item.title,
                "description": item.description,
                "priority": item.priority.value,
                "action_required": item.action_required,
                "action_url": item.action_url,
                "metrics": item.metrics,
                "timestamp": item.timestamp.isoformat()
            }
            for item in items
        ]

    async def get_dashboard_summary(self) -> Dict[str, Any]:
        """Get dashboard summary for the day"""
        market_status = self._get_market_status()

        return {
            "date": datetime.utcnow().strftime("%Y-%m-%d"),
            "market_status": market_status,
            "market_open_countdown": self._calculate_market_open_countdown(),
            "total_briefings_today": len([b for b in self._briefings_cache.values() if b.date == datetime.utcnow().strftime("%Y-%m-%d")]),
            "action_items_pending": sum(
                1 for b in self._briefings_cache.values()
                if b.date == datetime.utcnow().strftime("%Y-%m-%d")
                for item in b.items
                if item.action_required
            ),
            "market_summary": {
                "sp500": {"change": random.uniform(-0.5, 1.5), "value": random.uniform(4800, 5200)},
                "nasdaq": {"change": random.uniform(-0.5, 2.0), "value": random.uniform(15000, 17000)},
                "dow": {"change": random.uniform(-0.3, 1.0), "value": random.uniform(37000, 39000)}
            },
            "top_movers": {
                "gainers": [
                    {"symbol": "NVDA", "change": random.uniform(1, 5)},
                    {"symbol": "TSLA", "change": random.uniform(1, 4)},
                    {"symbol": "AMD", "change": random.uniform(0.5, 3)}
                ],
                "losers": [
                    {"symbol": "BA", "change": random.uniform(-3, -1)},
                    {"symbol": "GS", "change": random.uniform(-2, -0.5)},
                    {"symbol": "NKE", "change": random.uniform(-1.5, -0.5)}
                ]
            },
            "upcoming_events": [
                {"time": "08:30", "event": "CPI Data Release", "impact": "HIGH"},
                {"time": "10:00", "event": "ISM Manufacturing PMI", "impact": "MEDIUM"},
                {"time": "14:00", "event": "Fed Speaker Powell", "impact": "HIGH"}
            ]
        }


service = MorningBriefingService()


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


@app.get("/api/v1/briefing/{briefing_id}")
async def get_briefing(briefing_id: str):
    """Get briefing by ID"""
    briefing = await service.get_briefing(briefing_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return briefing


@app.get("/api/v1/briefing/today")
async def get_today_briefing():
    """Get today's briefing"""
    briefing = await service.get_today_briefing()
    if not briefing:
        return await service.generate_morning_briefing()
    return briefing


@app.get("/api/v1/briefing/history")
async def get_briefing_history(
    days: int = Query(7, le=30),
    briefing_type: BriefingType = Query(None)
):
    """Get briefing history"""
    return await service.get_briefing_history(days, briefing_type)


@app.get("/api/v1/briefing/{briefing_id}/items")
async def get_briefing_items(
    briefing_id: str,
    priority: BriefingPriority = Query(None),
    item_type: str = Query(None)
):
    """Get briefing items with filtering"""
    return await service.get_briefing_items(briefing_id, priority, item_type)


@app.get("/api/v1/dashboard/summary")
async def get_dashboard_summary():
    """Get dashboard summary"""
    return await service.get_dashboard_summary()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5170)