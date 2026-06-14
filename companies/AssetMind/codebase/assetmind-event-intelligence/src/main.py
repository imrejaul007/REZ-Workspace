"""
AssetMind Event Intelligence Service
Event analysis and market impact assessment
Port: 5200
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
    title="AssetMind Event Intelligence",
    description="Event analysis and market impact assessment",
    version="1.0.0",
    docs_url="/docs"
)


class EventType(str, Enum):
    EARNINGS = "earnings"
    ECONOMIC = "economic"
    CORPORATE = "corporate"
    GEOPOLITICAL = "geopolitical"
    REGULATORY = "regulatory"
    TECHNICAL = "technical"
    SECTOR = "sector"


class ImpactLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class SentimentDirection(str, Enum):
    VERY_BULLISH = "very_bullish"
    BULLISH = "bullish"
    NEUTRAL = "neutral"
    BEARISH = "bearish"
    VERY_BEARISH = "very_bearish"


class EventImpact(BaseModel):
    event_id: str
    asset_id: str
    impact_level: ImpactLevel
    price_change_expected: float
    volatility_expected: float
    affected_sectors: List[str]
    time_horizon: str
    historical_precedent: Optional[str] = None


class MarketEvent(BaseModel):
    event_id: str
    event_type: EventType
    title: str
    description: str
    date: datetime
    impact_level: ImpactLevel
    affected_assets: List[str]
    sentiment: SentimentDirection
    expected_magnitude: float
    confidence: float
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EventAnalysis(BaseModel):
    analysis_id: str
    event: MarketEvent
    pre_event_analysis: Dict[str, Any]
    post_event_analysis: Optional[Dict[str, Any]] = None
    historical_comparables: List[Dict[str, Any]]
    impact_assessment: EventImpact
    trading_recommendations: List[Dict[str, Any]]
    risk_factors: List[str]
    created_at: datetime


class EarningsEvent(BaseModel):
    symbol: str
    company_name: str
    report_date: datetime
    eps_estimate: float
    eps_actual: Optional[float] = None
    revenue_estimate: float
    revenue_actual: Optional[float] = None
    guidance: Optional[str] = None
    beat_miss: Optional[str] = None


class EconomicEvent(BaseModel):
    event_name: str
    country: str
    release_time: datetime
    previous_value: Optional[str] = None
    forecast_value: Optional[str] = None
    actual_value: Optional[str] = None
    impact: ImpactLevel
    market_expectation: str


class EventCalendar(BaseModel):
    date: str
    events: List[Dict[str, Any]]
    total_events: int
    high_impact_count: int


class EventIntelligenceService:
    """Event intelligence and analysis service"""

    def __init__(self):
        self.name = "Event Intelligence"
        self.port = 5200
        self.version = "1.0.0"
        self._events_cache: Dict[str, MarketEvent] = {}
        self._analysis_cache: Dict[str, EventAnalysis] = {}
        self._event_count = 0

    def _generate_id(self) -> str:
        """Generate unique ID"""
        self._event_count += 1
        return f"event_{datetime.utcnow().timestamp()}_{self._event_count}"

    async def analyze_event(
        self,
        event_type: EventType,
        title: str,
        description: str,
        affected_assets: List[str],
        event_date: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> EventAnalysis:
        """Analyze a market event"""
        event = MarketEvent(
            event_id=self._generate_id(),
            event_type=event_type,
            title=title,
            description=description,
            date=event_date or datetime.utcnow(),
            impact_level=self._determine_impact(event_type, affected_assets),
            affected_assets=affected_assets,
            sentiment=self._determine_sentiment(event_type, metadata),
            expected_magnitude=random.uniform(2, 10),
            confidence=random.uniform(0.6, 0.9),
            metadata=metadata or {}
        )

        self._events_cache[event.event_id] = event

        # Pre-event analysis
        pre_analysis = {
            "market_positioning": "Neutral to slightly bullish",
            "sentiment_indicators": {
                "social_media": random.uniform(0.4, 0.8),
                "news_flow": random.uniform(0.5, 0.9),
                "analyst_tone": random.choice(["positive", "neutral", "negative"])
            },
            "options_flow": {
                "call_volume": random.randint(1000, 5000),
                "put_volume": random.randint(1000, 5000),
                "skew": random.uniform(-0.1, 0.1)
            }
        }

        # Historical comparables
        comparables = [
            {
                "similar_event": f"Previous {event_type.value} event",
                "price_impact": round(random.uniform(-5, 8), 2),
                "recovery_time": f"{random.randint(1, 5)} days",
                "volatility_spike": round(random.uniform(1.2, 2.5), 1)
            }
        ]

        # Impact assessment
        impact = EventImpact(
            event_id=event.event_id,
            asset_id=affected_assets[0] if affected_assets else "SPY",
            impact_level=event.impact_level,
            price_change_expected=random.uniform(-5, 8) if event.impact_level != ImpactLevel.LOW else random.uniform(-2, 2),
            volatility_expected=random.uniform(1.2, 2.5) if event.impact_level != ImpactLevel.LOW else random.uniform(1.0, 1.3),
            affected_sectors=self._get_affected_sectors(affected_assets),
            time_horizon=self._get_time_horizon(event.event_type),
            historical_precedent="Similar events have caused3-7% moves"
        )

        # Trading recommendations
        recommendations = []
        if event.impact_level in [ImpactLevel.HIGH, ImpactLevel.CRITICAL]:
            recommendations.append({
                "action": "REDUCE_EXPOSURE",
                "rationale": "High impact event, reduce risk before event",
                "entry_timing": "Before event if possible"
            })
        recommendations.append({
            "action": "VOLATILITY_STRATEGY",
            "rationale": "Consider options straddle/strangle",
            "entry_timing": "1-2 days before event"
        })

        # Risk factors
        risk_factors = [
            "Event timing uncertainty",
            "Market-wide correlation",
            "Sector-specific factors"
        ]
        if event.event_type == EventType.EARNINGS:
            risk_factors.append("Guidance revision risk")

        analysis = EventAnalysis(
            analysis_id=self._generate_id(),
            event=event,
            pre_event_analysis=pre_analysis,
            historical_comparables=comparables,
            impact_assessment=impact,
            trading_recommendations=recommendations,
            risk_factors=risk_factors,
            created_at=datetime.utcnow()
        )

        self._analysis_cache[analysis.analysis_id] = analysis
        logger.info(f"Analyzed event: {event.title}")
        return analysis

    def _determine_impact(self, event_type: EventType, assets: List[str]) -> ImpactLevel:
        """Determine event impact level"""
        if event_type == EventType.EARNINGS:
            return ImpactLevel.HIGH
        elif event_type == EventType.ECONOMIC:
            return ImpactLevel.MEDIUM
        elif event_type == EventType.GEOPOLITICAL:
            return ImpactLevel.CRITICAL
        elif event_type == EventType.REGULATORY:
            return ImpactLevel.HIGH
        return ImpactLevel.MEDIUM

    def _determine_sentiment(self, event_type: EventType, metadata: Optional[Dict[str, Any]]) -> SentimentDirection:
        """Determine event sentiment"""
        if metadata and metadata.get("sentiment"):
            return SentimentDirection(metadata["sentiment"])
        sentiments = [SentimentDirection.BULLISH, SentimentDirection.BEARISH, SentimentDirection.NEUTRAL]
        return random.choice(sentiments)

    def _get_affected_sectors(self, assets: List[str]) -> List[str]:
        """Get sectors affected by assets"""
        sector_map = {
            "AAPL": "Technology", "MSFT": "Technology", "GOOGL": "Technology",
            "NVDA": "Technology", "AMD": "Technology",
            "JPM": "Financials", "BAC": "Financials", "GS": "Financials",
            "JNJ": "Healthcare", "PFE": "Healthcare", "UNH": "Healthcare",
            "XOM": "Energy", "CVX": "Energy",
            "AMZN": "Consumer", "TSLA": "Consumer"
        }
        sectors = set()
        for asset in assets:
            sector = sector_map.get(asset.upper(), "Mixed")
            sectors.add(sector)
        return list(sectors) if sectors else ["Mixed"]

    def _get_time_horizon(self, event_type: EventType) -> str:
        """Get expected time horizon for event impact"""
        horizons = {
            EventType.EARNINGS: "1-3 days",
            EventType.ECONOMIC: "1-5 days",
            EventType.CORPORATE: "1-2 weeks",
            EventType.GEOPOLITICAL: "1-4 weeks",
            EventType.REGULATORY: "1-3 months"
        }
        return horizons.get(event_type, "1 week")

    async def get_earnings_calendar(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        symbols: Optional[List[str]] = None
    ) -> List[EarningsEvent]:
        """Get upcoming earnings events"""
        if start_date is None:
            start_date = datetime.utcnow()
        if end_date is None:
            end_date = start_date + timedelta(days=7)

        all_earnings = [
            EarningsEvent(symbol="AAPL", company_name="Apple Inc.", report_date=start_date + timedelta(days=1),
 eps_estimate=2.10, revenue_estimate=89.5e9),
            EarningsEvent(symbol="MSFT", company_name="Microsoft Corp", report_date=start_date + timedelta(days=2),
                         eps_estimate=2.93, revenue_estimate=62.0e9),
            EarningsEvent(symbol="GOOGL", company_name="Alphabet Inc.", report_date=start_date + timedelta(days=3),
                         eps_estimate=1.85, revenue_estimate=80.5e9),
            EarningsEvent(symbol="AMZN", company_name="Amazon.com Inc.", report_date=start_date + timedelta(days=4),
                         eps_estimate=1.08, revenue_estimate=143.0e9),
            EarningsEvent(symbol="META", company_name="Meta Platforms", report_date=start_date + timedelta(days=5),
                         eps_estimate=5.31, revenue_estimate=36.5e9),
        ]

        earnings = all_earnings
        if symbols:
            earnings = [e for e in earnings if e.symbol in symbols]

        return earnings

    async def get_economic_calendar(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[EconomicEvent]:
        """Get economic calendar events"""
        if start_date is None:
            start_date = datetime.utcnow()
        if end_date is None:
            end_date = start_date + timedelta(days=5)

        events = [
            EconomicEvent(
                event_name="CPI (Consumer Price Index)",
                country="United States",
                release_time=start_date + timedelta(days=1, hours=8.5),
                previous_value="3.2%",
                forecast_value="3.3%",
                impact=ImpactLevel.HIGH,
                market_expectation="Core inflation remains sticky"
            ),
            EconomicEvent(
                event_name="PPI (Producer Price Index)",
                country="United States",
                release_time=start_date + timedelta(days=2, hours=8.5),
                previous_value="1.6%",
                forecast_value="1.4%",
                impact=ImpactLevel.MEDIUM,
                market_expectation="Wholesale inflation cooling"
            ),
            EconomicEvent(
                event_name="Non-Farm Payrolls",
                country="United States",
                release_time=start_date + timedelta(days=3, hours=8.5),
                previous_value="187K",
                forecast_value="170K",
                impact=ImpactLevel.CRITICAL,
                market_expectation="Labor market moderating"
            ),
            EconomicEvent(
                event_name="FOMC Meeting Minutes",
                country="United States",
                release_time=start_date + timedelta(days=4, hours=14),
                impact=ImpactLevel.HIGH,
                market_expectation="Fed policy guidance"
            ),
            EconomicEvent(
                event_name="GDP Growth Rate",
                country="United States",
                release_time=start_date + timedelta(days=5, hours=8.5),
                previous_value="2.1%",
                forecast_value="1.9%",
                impact=ImpactLevel.HIGH,
                market_expectation="Economic growth slowing"
            ),
        ]

        return events

    async def get_event_calendar(
        self,
        date: Optional[str] = None
    ) -> EventCalendar:
        """Get combined event calendar for a date"""
        if date is None:
            date = datetime.utcnow().strftime("%Y-%m-%d")

        events = []
        high_impact = 0

        # Add some mock events
        events.append({
            "type": "earnings",
            "title": "AAPL Earnings",
            "time": "16:30",
            "impact": "HIGH",
            "symbol": "AAPL"
        })
        events.append({
            "type": "economic",
            "title": "CPI Release",
            "time": "08:30",
            "impact": "HIGH",
            "country": "US"
        })
        events.append({
            "type": "corporate",
            "title": "M&A Announcement",
            "time": "09:00",
            "impact": "MEDIUM",
            "company": "Unknown"
        })

        high_impact = sum(1 for e in events if e.get("impact") == "HIGH")

        return EventCalendar(
            date=date,
            events=events,
            total_events=len(events),
            high_impact_count=high_impact
        )


service = EventIntelligenceService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "events_analyzed": service._event_count
    }


@app.post("/api/v1/events/analyze", response_model=EventAnalysis)
async def analyze_event(
    event_type: EventType,
    title: str,
    description: str,
    affected_assets: List[str],
    event_date: Optional[datetime] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    """Analyze a market event"""
    return await service.analyze_event(event_type, title, description, affected_assets, event_date, metadata)


@app.get("/api/v1/events/{event_id}")
async def get_event(event_id: str):
    """Get event by ID"""
    if event_id not in service._events_cache:
        raise HTTPException(status_code=404, detail="Event not found")
    return service._events_cache[event_id]


@app.get("/api/v1/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    """Get event analysis by ID"""
    if analysis_id not in service._analysis_cache:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return service._analysis_cache[analysis_id]


@app.get("/api/v1/calendar/earnings")
async def get_earnings_calendar(
    symbols: Optional[List[str]] = None,
    days: int = Query(7, le=30)
):
    """Get earnings calendar"""
    end_date = datetime.utcnow() + timedelta(days=days)
    return await service.get_earnings_calendar(None, end_date, symbols)


@app.get("/api/v1/calendar/economic")
async def get_economic_calendar(
    days: int = Query(7, le=30)
):
    """Get economic calendar"""
    end_date = datetime.utcnow() + timedelta(days=days)
    return await service.get_economic_calendar(None, end_date)


@app.get("/api/v1/calendar/events")
async def get_event_calendar(date: Optional[str] = None):
    """Get combined event calendar"""
    return await service.get_event_calendar(date)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5200)
