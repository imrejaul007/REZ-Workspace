"""
AssetMind - Event Intelligence Engine
Port: 5051

The biggest missing capability in financial intelligence.

Every market move starts with an event. This engine:

1. DETECTS events in real-time
2. ASSESSES impact on assets
3. PREDICTS outcomes
4. MONITORS results
5. LEARNS from accuracy

Event Types:
- Fed Rate Hike → Bonds, Banks, REITs, Crypto
- AI Regulation → Tech, Semiconductors
- China Sanctions → Semiconductors, Rare Earth
- Oil Shock → Airlines, Logistics, Inflation
- War → Defense, Energy, Safe Havens
- Product Launch → Apple, Tesla, etc.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timedelta
from enum import Enum
import uuid


app = FastAPI(title="AssetMind Event Intelligence", version="1.0.0")


# =============================================================================
# EVENT DEFINITIONS
# =============================================================================

class EventType(str, Enum):
    """Types of market events"""
    # Central Bank
    RATE_HIKE = "rate_hike"
    RATE_CUT = "rate_cut"
    QE_ANNOUNCEMENT = "qe_announcement"
    QT_ANNOUNCEMENT = "qt_announcement"
    FOMC_MINUTES = "fomc_minutes"

    # Economic Data
    CPI = "cpi"
    PPI = "ppi"
    GDP = "gdp"
    JOBS_REPORT = "jobs_report"
    ISM = "ism"
    RETAIL_SALES = "retail_sales"

    # Corporate
    EARNINGS = "earnings"
    GUIDANCE = "guidance"
    M&A = "m&a"
    IPO = "ipo"
    BANKRUPTCY = "bankruptcy"

    # Geopolitical
    WAR = "war"
    SANCTIONS = "sanctions"
    ELECTION = "election"
    TREATY = "treaty"
    SUMMIT = "summit"
    TRADE_DEAL = "trade_deal"

    # Industry
    PRODUCT_LAUNCH = "product_launch"
    PATENT = "patent"
    REGULATION = "regulation"
    PATENT_DISPUTE = "patent_dispute"

    # Market
    SHORT_SQUEEZE = "short_squeeze"
    MARGIN_CALL = "margin_call"
    DELISTING = "delisting"
    CREDIT_DOWNGRADE = "credit_downgrade"


class ImpactDirection(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    MIXED = "mixed"


class ImpactMagnitude(str, Enum):
    CRITICAL = "critical"  # >10% move
    HIGH = "high"          # 5-10% move
    MODERATE = "moderate" # 2-5% move
    LOW = "low"            # <2% move


# =============================================================================
# EVENT MODEL
# =============================================================================

class MarketEvent(BaseModel):
    """A market event that affects assets"""
    event_id: str
    event_type: EventType

    # What
    title: str
    description: str

    # When
    scheduled_time: Optional[datetime] = None
    actual_time: Optional[datetime] = None

    # Who affected
    affected_assets: List[str] = Field(default_factory=list)
    affected_sectors: List[str] = Field(default_factory=list)
    affected_companies: List[str] = Field(default_factory=list)
    affected_geographies: List[str] = Field(default_factory=list)

    # Impact assessment
    expected_direction: ImpactDirection
    expected_magnitude: ImpactMagnitude
    confidence: float = Field(default=0.5, ge=0, le=1)

    # Historical precedent
    similar_events: List[Dict] = Field(default_factory=list)

    # Outcome tracking
    actual_direction: Optional[ImpactDirection] = None
    actual_magnitude: Optional[float] = None  # Actual % move
    accuracy_score: Optional[float] = None

    # Learning
    lessons: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EventImpact(BaseModel):
    """Impact of an event on an asset"""
    event_id: str
    asset: str

    # Predicted
    predicted_return: float  # Expected % return
    confidence: float
    time_horizon: str  # "1d", "1w", "1m"

    # Historical comparison
    similar_impacts: List[Dict] = Field(default_factory=list)

    # Reasoning
    impact_chain: List[str] = Field(default_factory=list)
    key_factors: List[str] = Field(default_factory=list)


# =============================================================================
# EVENT IMPACT MATRIX
# =============================================================================

# Define how events affect asset classes

IMPACT_MATRIX = {
    EventType.RATE_HIKE: {
        "affected_classes": ["stock", "bond", "crypto", "real_estate"],
        "sector_impact": {
            "banking": "positive",  # Net interest margin
            "financials": "positive",
            "technology": "negative",  # Valuation pressure
            "real_estate": "negative",  # Higher rates
            "utilities": "negative",  # Higher yields
            "energy": "mixed",
        },
        "asset_impact": {
            "TLT": "negative",  # Long bonds
            "GLD": "negative",  # Competes with yields
            "BTC": "negative",  # Risk off
            "SPY": "negative",  # Market selloff
        },
        "historical_avg_move": -2.5,  # Average S&P 500 move on rate hike
    },
    EventType.RATE_CUT: {
        "affected_classes": ["stock", "bond", "crypto", "real_estate"],
        "sector_impact": {
            "banking": "negative",  # Net interest margin
            "financials": "mixed",
            "technology": "positive",  # Growth stocks rally
            "real_estate": "positive",  # Lower rates
            "utilities": "positive",
        },
        "asset_impact": {
            "TLT": "positive",
            "GLD": "positive",
            "BTC": "positive",
            "SPY": "positive",
        },
        "historical_avg_move": 1.5,
    },
    EventType.CPI: {
        "affected_classes": ["stock", "bond"],
        "sector_impact": {
            "energy": "positive",  # Inflation hedge
            "materials": "positive",
            "consumer_staples": "mixed",
            "technology": "negative",  # Rate concerns
            "real_estate": "negative",
        },
        "historical_avg_move": 0.8,
    },
    EventType.JOBS_REPORT: {
        "affected_classes": ["stock", "bond", "forex"],
        "sector_impact": {
            "financials": "positive",  # Strong economy
            "consumer_discretionary": "positive",
            "technology": "positive",
        },
        "historical_avg_move": 1.0,
    },
    EventType.EARNINGS: {
        "affected_classes": ["stock"],
        "sector_impact": {},  # Company-specific
        "asset_impact": {},  # Company-specific
        "historical_avg_move": 5.0,  # Individual stock earnings
    },
    EventType.M&A: {
        "affected_classes": ["stock"],
        "sector_impact": {},  # Deal-specific
        "asset_impact": {},  # Deal-specific
        "historical_avg_move": 15.0,  # Acquirer typically down, target up
    },
    EventType.WAR: {
        "affected_classes": ["stock", "crypto", "commodity"],
        "sector_impact": {
            "defense": "positive",
            "energy": "positive",  # Geopolitical risk premium
            "airlines": "negative",
            "travel": "negative",
            "luxury": "negative",
        },
        "asset_impact": {
            "GLD": "positive",  # Safe haven
            "BTC": "mixed",
            "SPY": "negative",
            "XLE": "positive",  # Energy
        },
        "historical_avg_move": -3.0,
    },
    EventType.SANCTIONS: {
        "affected_classes": ["stock", "crypto"],
        "sector_impact": {
            "semiconductors": "negative",  # China exposure
            "technology": "negative",
            "energy": "mixed",  # Russia vs others
        },
        "historical_avg_move": -2.0,
    },
    EventType.PRODUCT_LAUNCH: {
        "affected_classes": ["stock"],
        "sector_impact": {},
        "asset_impact": {},
        "historical_avg_move": 3.0,
    },
    EventType.REGULATION: {
        "affected_classes": ["stock"],
        "sector_impact": {
            "big_tech": "negative",
            "fintech": "negative",
            "crypto": "negative",
        },
        "historical_avg_move": -5.0,  # Significant regulation
    },
}


# =============================================================================
# EVENT DATABASE
# =============================================================================

EVENTS: Dict[str, MarketEvent] = {}
EVENT_HISTORY: List[MarketEvent] = []  # Completed events with outcomes


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-event-intelligence",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5051,
        "tracked_events": len(EVENTS),
        "historical_events": len(EVENT_HISTORY)
    }


@app.get("/")
async def root():
    return {
        "service": "AssetMind Event Intelligence",
        "description": "Understand how events move markets",
        "event_types": [e.value for e in EventType],
        "impact_matrix": list(IMPACT_MATRIX.keys())
    }


# =============================================================================
# Event Creation & Tracking
# =============================================================================

@app.post("/events", status_code=201)
async def create_event(event: MarketEvent):
    """Create and track a market event"""
    EVENTS[event.event_id] = event
    return {"event_id": event.event_id, "created": True}


@app.get("/events/{event_id}")
async def get_event(event_id: str):
    """Get event by ID"""
    if event_id not in EVENTS:
        raise HTTPException(status_code=404, detail="Event not found")
    return EVENTS[event_id]


@app.get("/events")
async def list_events(
    event_type: Optional[EventType] = None,
    status: Optional[str] = None,  # "upcoming", "occurred"
    limit: int = 50
):
    """List tracked events"""
    results = list(EVENTS.values())

    if event_type:
        results = [e for e in results if e.event_type == event_type]

    if status == "upcoming":
        results = [e for e in results if not e.actual_time]
    elif status == "occurred":
        results = [e for e in results if e.actual_time]

    results.sort(key=lambda e: e.scheduled_time or e.created_at, reverse=True)

    return {"events": results[:limit], "total": len(results)}


@app.get("/events/upcoming")
async def get_upcoming_events(days: int = 7):
    """Get upcoming events that may move markets"""
    cutoff = datetime.utcnow() + timedelta(days=days)

    upcoming = [
        e for e in EVENTS.values()
        if e.scheduled_time and e.scheduled_time <= cutoff
    ]

    upcoming.sort(key=lambda e: e.scheduled_time)

    return {"events": upcoming, "total": len(upcoming)}


# =============================================================================
# Impact Assessment
# =============================================================================

@app.post("/assess/{event_type}")
async def assess_event_impact(
    event_type: EventType,
    details: Dict[str, Any]
):
    """
    Assess the impact of an event.

    Example: Rate hike on S&P 500, Tech, Banks
    """
    if event_type not in IMPACT_MATRIX:
        return {"message": f"Event type {event_type} not in impact matrix"}

    impact_data = IMPACT_MATRIX[event_type]

    assessment = {
        "event_type": event_type.value,
        "affected_classes": impact_data.get("affected_classes", []),
        "sector_impact": impact_data.get("sector_impact", {}),
        "asset_impact": impact_data.get("asset_impact", {}),
        "historical_avg_move": impact_data.get("historical_avg_move", 0),
        "confidence": 0.75,
        "reasoning": [
            f"{event_type.value} historically causes {impact_data.get('historical_avg_move', 0):.1f}% move",
            "Sector impact based on rate sensitivity",
            "Asset impact based on historical patterns"
        ]
    }

    return assessment


@app.post("/assess/bulk")
async def bulk_assessment(event_types: List[EventType]):
    """Assess impact of multiple events"""
    results = []

    for event_type in event_types:
        if event_type in IMPACT_MATRIX:
            impact_data = IMPACT_MATRIX[event_type]
            results.append({
                "event_type": event_type.value,
                "expected_move": impact_data.get("historical_avg_move", 0),
                "sectors_affected": list(impact_data.get("sector_impact", {}).keys())
            })

    return {"assessments": results}


@app.post("/assess/custom")
async def assess_custom_event(
    event_description: str,
    affected_assets: List[str],
    affected_sectors: List[str]
):
    """
    Assess a custom event using AI reasoning.

    This would integrate with RexMind for intelligent assessment.
    """
    # Mock AI assessment
    return {
        "event_description": event_description,
        "affected_assets": affected_assets,
        "affected_sectors": affected_sectors,
        "expected_direction": "negative" if len(affected_sectors) > 3 else "mixed",
        "expected_magnitude": "moderate",
        "confidence": 0.65,
        "reasoning": [
            "Based on similar historical events",
            "Sector exposure analysis",
            "Correlation with market events"
        ],
        "similar_events": [
            {"type": "Regulation", "avg_move": -3.5},
            {"type": "Sanctions", "avg_move": -2.0}
        ]
    }


# =============================================================================
# Event Impact on Specific Asset
# =============================================================================

@app.post("/impact/{symbol}")
async def predict_impact(symbol: str, event_type: EventType):
    """
    Predict how an event type affects a specific asset.

    Example: What happens to NVIDIA if Fed hikes rates?
    """
    if event_type not in IMPACT_MATRIX:
        return {"message": f"No impact data for {event_type}"}

    impact_data = IMPACT_MATRIX[event_type]

    # Check sector impact
    sector_impact = impact_data.get("sector_impact", {})

    # Mock sector determination
    sector = "technology"  # Would come from asset metadata

    predicted_direction = sector_impact.get(sector, "mixed")
    predicted_magnitude = abs(impact_data.get("historical_avg_move", 0))

    # Adjust based on sector sensitivity
    if predicted_direction == "positive":
        adjustment = 1.2  # 20% more positive
    elif predicted_direction == "negative":
        adjustment = 1.2  # 20% more negative
    else:
        adjustment = 1.0

    return {
        "symbol": symbol,
        "event_type": event_type.value,
        "predicted_return": predicted_magnitude * adjustment / 100,
        "direction": predicted_direction,
        "confidence": 0.70,
        "time_horizon": "1-5 days",
        "impact_chain": [
            f"{event_type.value} occurs",
            "Interest rates rise",
            f"{sector} sector affected",
            f"{symbol} moves {predicted_direction}"
        ],
        "key_factors": [
            f"{symbol} sector: {sector}",
            "Current market regime",
            "Historical precedent"
        ]
    }


# =============================================================================
# Event Outcome Tracking & Learning
# =============================================================================

@app.post("/events/{event_id}/outcome")
async def record_outcome(
    event_id: str,
    actual_return: float,
    actual_direction: ImpactDirection
):
    """
    Record the actual outcome of an event.

    This is how AssetMind learns to predict better.
    """
    if event_id not in EVENTS:
        raise HTTPException(status_code=404, detail="Event not found")

    event = EVENTS[event_id]
    event.actual_direction = actual_direction
    event.actual_magnitude = actual_return

    # Calculate accuracy
    expected_moves = {
        ImpactDirection.POSITIVE: abs(event.expected_magnitude.value),
        ImpactDirection.NEGATIVE: -abs(event.expected_magnitude.value),
        ImpactDirection.NEUTRAL: 0,
        ImpactDirection.MIXED: 0
    }

    expected_move = expected_moves.get(event.expected_direction, 0)
    accuracy = 1 - abs(actual_return - expected_move) / 100
    accuracy = max(0, min(1, accuracy))  # Clamp 0-1

    event.accuracy_score = accuracy

    # Add to history
    EVENT_HISTORY.append(event)
    del EVENTS[event_id]

    # Learn from outcome
    if accuracy < 0.7:
        event.lessons.append(
            f"Prediction off by {abs(actual_return - expected_move):.1f}%"
        )

    return {
        "event_id": event_id,
        "actual_return": actual_return,
        "accuracy": accuracy,
        "lessons": event.lessons
    }


@app.get("/learning/accuracy")
async def get_learning_accuracy():
    """Get event prediction accuracy by type"""
    if not EVENT_HISTORY:
        return {"message": "No historical events to analyze"}

    by_type = {}
    for event in EVENT_HISTORY:
        et = event.event_type.value
        if et not in by_type:
            by_type[et] = {"count": 0, "total_accuracy": 0}

        by_type[et]["count"] += 1
        if event.accuracy_score:
            by_type[et]["total_accuracy"] += event.accuracy_score

    results = []
    for et, data in by_type.items():
        avg_acc = data["total_accuracy"] / data["count"] if data["count"] > 0 else 0
        results.append({
            "event_type": et,
            "count": data["count"],
            "avg_accuracy": avg_acc
        })

    return {"event_accuracies": results}


@app.get("/learning/similar-events/{event_type}")
async def get_similar_events(event_type: EventType):
    """Get historical events of same type"""
    similar = [e for e in EVENT_HISTORY if e.event_type == event_type]

    if not similar:
        return {"events": [], "message": "No historical events"}

    avg_return = sum(e.actual_magnitude or 0 for e in similar) / len(similar)
    avg_accuracy = sum(e.accuracy_score or 0 for e in similar) / len(similar)

    return {
        "event_type": event_type.value,
        "count": len(similar),
        "avg_return": avg_return,
        "avg_accuracy": avg_accuracy,
        "events": [
            {
                "title": e.title,
                "actual_return": e.actual_magnitude,
                "accuracy": e.accuracy_score,
                "date": e.actual_time.isoformat() if e.actual_time else None
            }
            for e in similar[-10:]  # Last 10
        ]
    }


# =============================================================================
# Event Monitoring
# =============================================================================

@app.get("/monitoring/alerts")
async def get_event_alerts():
    """Get active event monitoring alerts"""
    alerts = []

    # Generate mock alerts
    alerts.append({
        "alert_id": "alert-1",
        "type": "earnings",
        "symbol": "NVDA",
        "message": "NVDA earnings in 5 days",
        "severity": "high",
        "action": "Review position sizing"
    })

    alerts.append({
        "alert_id": "alert-2",
        "type": "economic",
        "data": "CPI",
        "message": "CPI release in 3 days",
        "severity": "medium",
        "action": "Review rate-sensitive positions"
    })

    alerts.append({
        "alert_id": "alert-3",
        "type": "geopolitical",
        "location": "Taiwan Strait",
        "message": "Military exercises scheduled",
        "severity": "high",
        "action": "Monitor semiconductor exposure"
    })

    return {"alerts": alerts}


@app.post("/monitoring/watch")
async def watch_event(event_id: str):
    """Add event to watch list"""
    return {
        "event_id": event_id,
        "watching": True,
        "alerts_enabled": True
    }


# =============================================================================
# Event Calendar
# =============================================================================

@app.get("/calendar")
async def get_event_calendar(months: int = 1):
    """Get upcoming events calendar"""
    events = []

    # Mock calendar entries
    now = datetime.utcnow()

    # Fed meetings
    for i in range(4):
        events.append({
            "date": (now + timedelta(days=i*30)).strftime("%Y-%m-%d"),
            "event": "FOMC Meeting",
            "type": "central_bank",
            "impact": "critical",
            "assets_affected": ["SPY", "TLT", "GLD", "BTC"]
        })

    # Major earnings
    events.append({
        "date": (now + timedelta(days=5)).strftime("%Y-%m-%d"),
        "event": "NVDA Earnings",
        "type": "earnings",
        "impact": "critical",
        "assets_affected": ["NVDA", "AMD", "INTC"]
    })

    # Economic data
    events.append({
        "date": (now + timedelta(days=3)).strftime("%Y-%m-%d"),
        "event": "CPI Release",
        "type": "economic_data",
        "impact": "high",
        "assets_affected": ["SPY", "TLT", "GLD"]
    })

    return {"events": events, "total": len(events)}


# =============================================================================
# Scenario Analysis
# =============================================================================

@app.post("/scenario")
async def analyze_scenario(scenario: Dict):
    """
    Analyze a hypothetical scenario.

    Example: "What if oil reaches $150?"
    """
    scenario_type = scenario.get("type", "commodity_shock")
    scenario_trigger = scenario.get("trigger", "")

    if scenario_type == "commodity_shock":
        return {
            "scenario": scenario_trigger,
            "cascading_effects": [
                {"sector": "airlines", "impact": "negative", "magnitude": -15},
                {"sector": "logistics", "impact": "negative", "magnitude": -10},
                {"sector": "inflation", "impact": "negative", "magnitude": 5},
                {"sector": "energy", "impact": "positive", "magnitude": 20},
                {"sector": "defense", "impact": "positive", "magnitude": 5},
                {"sector": "interest_rates", "impact": "negative", "magnitude": 3},
            ],
            "portfolio_impact": "negative",
            "hedging_assets": ["GLD", "TLT", "OIL"]
        }

    return {"scenario": scenario_trigger, "cascading_effects": []}


# =============================================================================
# Bootstrap Sample Events
# =============================================================================

@app.post("/bootstrap")
async def bootstrap_events():
    """Create sample tracked events"""
    events = [
        MarketEvent(
            event_id="evt-001",
            event_type=EventType.RATE_HIKE,
            title="Fed Rate Hike Expected",
            description="Federal Reserve expected to raise rates by 25bps",
            scheduled_time=datetime.utcnow() + timedelta(days=3),
            affected_sectors=["technology", "real_estate", "banking"],
            affected_assets=["SPY", "QQQ", "TLT"],
            expected_direction=ImpactDirection.NEGATIVE,
            expected_magnitude=ImpactMagnitude.MODERATE,
            confidence=0.75
        ),
        MarketEvent(
            event_id="evt-002",
            event_type=EventType.CPI,
            title="CPI Release",
            description="Consumer Price Index for May",
            scheduled_time=datetime.utcnow() + timedelta(days=5),
            affected_assets=["SPY", "TLT"],
            expected_direction=ImpactDirection.MIXED,
            expected_magnitude=ImpactMagnitude.MODERATE,
            confidence=0.70
        ),
        MarketEvent(
            event_id="evt-003",
            event_type=EventType.EARNINGS,
            title="NVDA Earnings",
            description="NVIDIA Q2 earnings report",
            scheduled_time=datetime.utcnow() + timedelta(days=7),
            affected_assets=["NVDA", "AMD", "INTC"],
            expected_direction=ImpactDirection.POSITIVE,
            expected_magnitude=ImpactMagnitude.HIGH,
            confidence=0.80
        ),
    ]

    for event in events:
        EVENTS[event.event_id] = event

    return {
        "message": "Events bootstrapped",
        "events_created": len(events)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5051)