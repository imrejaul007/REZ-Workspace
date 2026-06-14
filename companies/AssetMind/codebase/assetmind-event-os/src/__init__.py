"""
AssetMind - Event Operating System
Port: 5052

The Center of AssetMind - Everything starts with events.

Every event creates:
- Impact Graph
- Affected Assets
- Affected Sectors
- Affected Portfolios
- Scenarios

This becomes your Bloomberg Terminal killer.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid


app = FastAPI(
    title="AssetMind Event Operating System",
    version="1.0.0",
    description="The Center of Intelligence - Everything starts with events"
)


# =============================================================================
# EVENT TYPES
# =============================================================================

class EventType(str, Enum):
    # Corporate Events
    EARNINGS = "earnings"
    GUIDANCE = "guidance"
    DIVIDEND = "dividend"
    BUYBACK = "buyback"
    M_AND_A = "m_and_a"
    IPO = "ipo"
    BANKRUPTCY = "bankruptcy"

    # Economic Events
    CPI = "cpi"
    GDP = "gdp"
    JOBS = "jobs"
    RATE_DECISION = "rate_decision"
    FOMC = "fomc"
    TREASURY_AUCTION = "treasury_auction"

    # Geopolitical Events
    WAR = "war"
    SANCTIONS = "sanctions"
    ELECTION = "election"
    SUMMIT = "summit"
    TREATY = "treaty"

    # Industry Events
    REGULATION = "regulation"
    PATENT = "patent"
    PRODUCT_LAUNCH = "product_launch"
    MERGER_RUMOR = "merger_rumor"

    # Market Events
    SHORT_SQUEEZE = "short_squeeze"
    INSIDER = "insider"
    CREDIT_DOWNGRADE = "credit_downgrade"
    DELISTING = "delisting"


class EventPriority(str, Enum):
    CRITICAL = "critical"  # >5% expected move
    HIGH = "high"          # 2-5% expected move
    MEDIUM = "medium"      # 1-2% expected move
    LOW = "low"           # <1% expected move


# =============================================================================
# EVENT MODEL
# =============================================================================

class MarketEvent(BaseModel):
    """A market event"""
    event_id: str
    event_type: EventType

    # What
    title: str
    description: str
    importance: str = "medium"

    # Who
    entities: List[str] = Field(default_factory=list)  # Companies, countries
    sectors: List[str] = Field(default_factory=list)
    regions: List[str] = Field(default_factory=list)

    # When
    scheduled_time: Optional[datetime] = None
    actual_time: Optional[datetime] = None
    is_scheduled: bool = True

    # Priority
    priority: EventPriority = EventPriority.MEDIUM
    expected_move: Optional[float] = None  # %

    # Impact
    impact_score: float = 0  # 0-100
    affected_assets: List[str] = Field(default_factory=list)
    affected_sectors: List[str] = Field(default_factory=list)

    # Status
    status: str = "scheduled"  # scheduled, occurred, completed
    outcomes: Dict[str, Any] = Field(default_factory=dict)

    created_at: datetime


class ImpactGraph(BaseModel):
    """Impact graph created by event"""
    graph_id: str
    event_id: str

    # Nodes
    nodes: List[Dict] = Field(default_factory=list)

    # Edges (impacts)
    edges: List[Dict] = Field(default_factory=list)

    # Aggregates
    total_affected: int = 0
    biggest_winners: List[str] = Field(default_factory=list)
    biggest_losers: List[str] = Field(default_factory=list)

    depth: int = 1
    confidence: float = 0.5


class EventCalendar(BaseModel):
    """Calendar of upcoming events"""
    date: str  # YYYY-MM-DD
    events: List[MarketEvent] = Field(default_factory=list)
    impact_day_score: float = 0


# =============================================================================
# EVENT DATABASE
# =============================================================================

EVENTS: Dict[str, MarketEvent] = {}
IMPACT_GRAPHS: Dict[str, ImpactGraph] = {}


# =============================================================================
# IMPACT MATRIX
# =============================================================================

IMPACT_MATRIX = {
    # Fed Events
    EventType.RATE_DECISION: {
        "priority": EventPriority.CRITICAL,
        "expected_move": 2.5,
        "affected_sectors": ["banks", "real_estate", "utilities", "tech"],
        "affected_assets": ["SPY", "TLT", "GLD", "BTC"]
    },
    EventType.FOMC: {
        "priority": EventPriority.CRITICAL,
        "expected_move": 1.5,
        "affected_sectors": ["all"],
        "affected_assets": ["SPY", "QQQ", "TLT"]
    },
    EventType.CPI: {
        "priority": EventPriority.HIGH,
        "expected_move": 1.0,
        "affected_sectors": ["all"],
        "affected_assets": ["SPY", "TLT"]
    },
    EventType.GDP: {
        "priority": EventPriority.HIGH,
        "expected_move": 0.8,
        "affected_sectors": ["financials", "tech", "consumer"],
        "affected_assets": ["SPY"]
    },
    EventType.JOBS: {
        "priority": EventPriority.HIGH,
        "expected_move": 0.5,
        "affected_sectors": ["all"],
        "affected_assets": ["SPY", "DIA"]
    },

    # Corporate Events
    EventType.EARNINGS: {
        "priority": EventPriority.HIGH,
        "expected_move": 5.0,
        "affected_assets": ["{symbol}"]
    },
    EventType.M_AND_A: {
        "priority": EventPriority.HIGH,
        "expected_move": 15.0,
        "affected_assets": ["{acquirer}", "{target}"]
    },
    EventType.GUIDANCE: {
        "priority": EventPriority.MEDIUM,
        "expected_move": 3.0,
        "affected_assets": ["{symbol}"]
    },

    # Geopolitical
    EventType.WAR: {
        "priority": EventPriority.CRITICAL,
        "expected_move": 5.0,
        "affected_sectors": ["defense", "energy", "airlines"],
        "affected_assets": ["GLD", "BTC", "XLE"]
    },
    EventType.SANCTIONS: {
        "priority": EventPriority.HIGH,
        "expected_move": 3.0,
        "affected_sectors": ["tech", "semiconductors"],
        "affected_assets": ["{country}_etf"]
    },
    EventType.ELECTION: {
        "priority": EventPriority.HIGH,
        "expected_move": 2.0,
        "affected_sectors": ["all"],
        "affected_assets": ["SPY"]
    },

    # Industry
    EventType.PRODUCT_LAUNCH: {
        "priority": EventPriority.MEDIUM,
        "expected_move": 5.0,
        "affected_assets": ["{company}"]
    },
    EventType.REGULATION: {
        "priority": EventPriority.HIGH,
        "expected_move": 5.0,
        "affected_sectors": ["{industry}"],
        "affected_assets": ["{affected}"]
    },

    # Market
    EventType.INSIDER: {
        "priority": EventPriority.LOW,
        "expected_move": 1.0,
        "affected_assets": ["{company}"]
    },
    EventType.SHORT_SQUEEZE: {
        "priority": EventPriority.HIGH,
        "expected_move": 10.0,
        "affected_assets": ["{stock}"]
    }
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def generate_impact_graph(event: MarketEvent) -> ImpactGraph:
    """Generate impact graph from event"""
    graph_id = str(uuid.uuid4())

    # Get impact template
    template = IMPACT_MATRIX.get(event.event_type, {})

    nodes = []
    edges = []
    affected_assets = []
    affected_sectors = []

    # Add primary entities
    for entity in event.entities:
        nodes.append({
            "id": entity,
            "type": "entity",
            "name": entity,
            "impact": 1.0
        })
        affected_assets.append(entity)

    # Add affected sectors
    for sector in template.get("affected_sectors", []):
        if sector == "all":
            sector = "general_market"
        nodes.append({
            "id": sector,
            "type": "sector",
            "name": sector,
            "impact": 0.5
        })
        affected_sectors.append(sector)

        edges.append({
            "from": event.event_id,
            "to": sector,
            "impact": 0.3,
            "confidence": 0.7
        })

    # Add affected assets
    for asset in template.get("affected_assets", []):
        asset = asset.replace("{symbol}", event.entities[0] if event.entities else "SPY")
        asset = asset.replace("{company}", event.entities[0] if event.entities else "SPY")

        nodes.append({
            "id": asset,
            "type": "asset",
            "name": asset,
            "impact": 0.7
        })
        affected_assets.append(asset)

        edges.append({
            "from": event.event_id,
            "to": asset,
            "impact": 0.5,
            "confidence": 0.8
        })

    # Calculate winners/losers
    winners = [a for a in affected_assets if "+" in str(template.get("expected_move", 0))]
    losers = [a for a in affected_assets if "-" in str(template.get("expected_move", 0))]

    return ImpactGraph(
        graph_id=graph_id,
        event_id=event.event_id,
        nodes=nodes,
        edges=edges,
        total_affected=len(affected_assets),
        biggest_winners=winners[:5],
        biggest_losers=losers[:5],
        depth=1,
        confidence=template.get("expected_move", 0.5) / 10
    )


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-event-os",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5052,
        "tracked_events": len(EVENTS),
        "event_types": len(IMPACT_MATRIX)
    }


@app.get("/")
async def root():
    return {
        "service": "AssetMind Event Operating System",
        "description": "The Center of Intelligence - Everything starts with events",
        "event_types": [e.value for e in EventType],
        "supported_events": len(IMPACT_MATRIX)
    }


# =============================================================================
# EVENT CRUD
# =============================================================================

@app.post("/events", status_code=201)
async def create_event(event: MarketEvent):
    """Create a new event"""
    EVENTS[event.event_id] = event

    # Generate impact graph
    if event.status == "scheduled":
        impact_graph = generate_impact_graph(event)
        IMPACT_GRAPHS[impact_graph.graph_id] = impact_graph

    return {
        "event_id": event.event_id,
        "impact_graph_id": impact_graph.graph_id if event.status == "scheduled" else None,
        "created": True
    }


@app.get("/events/{event_id}")
async def get_event(event_id: str):
    if event_id not in EVENTS:
        raise HTTPException(status_code=404, detail="Event not found")
    return EVENTS[event_id]


@app.get("/events")
async def list_events(
    event_type: Optional[EventType] = None,
    status: Optional[str] = None,
    priority: Optional[EventPriority] = None,
    limit: int = 50
):
    results = list(EVENTS.values())

    if event_type:
        results = [e for e in results if e.event_type == event_type]
    if status:
        results = [e for e in results if e.status == status]
    if priority:
        results = [e for e in results if e.priority == priority]

    results.sort(key=lambda e: e.scheduled_time or e.created_at, reverse=True)

    return {"events": results[:limit], "total": len(results)}


@app.patch("/events/{event_id}/occur")
async def mark_event_occurred(event_id: str):
    """Mark event as occurred"""
    if event_id not in EVENTS:
        raise HTTPException(status_code=404, detail="Event not found")

    EVENTS[event_id].status = "occurred"
    EVENTS[event_id].actual_time = datetime.utcnow()

    return {"event_id": event_id, "occurred": True}


# =============================================================================
# EVENT CALENDAR
# =============================================================================

@app.get("/calendar")
async def get_event_calendar(days: int = 30):
    """Get upcoming events calendar"""
    events_by_date = {}
    now = datetime.utcnow()

    for event in EVENTS.values():
        if event.scheduled_time and event.scheduled_time > now:
            date_key = event.scheduled_time.strftime("%Y-%m-%d")
            if date_key not in events_by_date:
                events_by_date[date_key] = []
            events_by_date[date_key].append(event)

    # Calculate impact scores per day
    calendar = []
    for i in range(days):
        date = (now + timedelta(days=i)).strftime("%Y-%m-%d")
        day_events = events_by_date.get(date, [])

        impact_score = sum(
            IMPACT_MATRIX.get(e.event_type, {}).get("expected_move", 0)
            for e in day_events
        )

        calendar.append(EventCalendar(
            date=date,
            events=day_events,
            impact_day_score=impact_score
        ))

    # Sort by impact
    calendar.sort(key=lambda x: x.impact_day_score, reverse=True)

    return {"calendar": calendar, "days": days}


@app.get("/calendar/today")
async def get_today_events():
    """Get today's high-impact events"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    tomorrow = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")

    today_events = [
        e for e in EVENTS.values()
        if e.scheduled_time and
        today <= e.scheduled_time.strftime("%Y-%m-%d") < tomorrow
    ]

    # Sort by priority
    priority_order = {
        EventPriority.CRITICAL: 0,
        EventPriority.HIGH: 1,
        EventPriority.MEDIUM: 2,
        EventPriority.LOW: 3
    }

    today_events.sort(key=lambda e: priority_order.get(e.priority, 3))

    return {
        "date": today,
        "events": today_events,
        "high_impact": len([e for e in today_events if e.priority == EventPriority.CRITICAL])
    }


# =============================================================================
# IMPACT ANALYSIS
# =============================================================================

@app.post("/impact")
async def analyze_event_impact(event_type: EventType, entities: List[str]):
    """Analyze impact of an event"""
    template = IMPACT_MATRIX.get(event_type, {})

    if not template:
        raise HTTPException(status_code=404, detail="Event type not supported")

    # Generate impact graph
    event = MarketEvent(
        event_id=str(uuid.uuid4()),
        event_type=event_type,
        title=f"Custom {event_type.value} analysis",
        entities=entities,
        priority=template.get("priority", EventPriority.MEDIUM),
        expected_move=template.get("expected_move")
    )

    graph = generate_impact_graph(event)

    return {
        "event_type": event_type.value,
        "entities": entities,
        "expected_move": template.get("expected_move"),
        "priority": template.get("priority").value,
        "impact_graph": graph
    }


@app.get("/impact/graph/{event_id}")
async def get_impact_graph(event_id: str):
    """Get impact graph for an event"""
    for graph in IMPACT_GRAPHS.values():
        if graph.event_id == event_id:
            return graph

    # Generate if not exists
    if event_id in EVENTS:
        event = EVENTS[event_id]
        graph = generate_impact_graph(event)
        IMPACT_GRAPHS[graph.graph_id] = graph
        return graph

    raise HTTPException(status_code=404, detail="Event not found")


@app.post("/impact/portfolio")
async def analyze_portfolio_impact(holdings: List[Dict], event_type: EventType):
    """Analyze portfolio impact of an event"""
    template = IMPACT_MATRIX.get(event_type, {})
    expected_move = template.get("expected_move", 1.0)

    impacts = []
    total_exposure = 0

    for holding in holdings:
        symbol = holding.get("symbol")
        weight = holding.get("weight", 0)

        # Calculate exposure
        affected = symbol in template.get("affected_assets", [])
        sector = holding.get("sector")
        sector_affected = sector in template.get("affected_sectors", ["all"])

        if affected or sector_affected or "all" in template.get("affected_sectors", []):
            impact = expected_move * weight / 100
            impacts.append({
                "symbol": symbol,
                "weight": weight,
                "impact": impact,
                "reason": "direct" if affected else "sector"
            })
            total_exposure += impact

    return {
        "event_type": event_type.value,
        "holdings_impacted": len(impacts),
        "total_portfolio_impact": total_exposure,
        "impacts": impacts
    }


# =============================================================================
# EARNINGS TRACKING
# =============================================================================

@app.get("/earnings/upcoming")
async def get_upcoming_earnings(days: int = 14):
    """Get upcoming earnings with impact scores"""
    upcoming = []
    now = datetime.utcnow()
    cutoff = now + timedelta(days=days)

    for event in EVENTS.values():
        if event.event_type == EventType.EARNINGS:
            if event.scheduled_time and event.scheduled_time <= cutoff:
                upcoming.append(event)

    upcoming.sort(key=lambda e: e.scheduled_time)

    return {
        "earnings": upcoming,
        "total": len(upcoming),
        "high_impact": len([e for e in upcoming if e.priority == EventPriority.HIGH])
    }


@app.post("/earnings/scan")
async def scan_for_earnings(symbols: List[str]):
    """Scan for earnings dates (mock)"""
    earnings = []

    for symbol in symbols:
        # Mock earnings data
        earnings.append({
            "symbol": symbol,
            "next_earnings": (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "expected_eps": round(5 + hash(symbol) % 10, 2),
            "consensus": round(5 + hash(symbol) % 10, 2),
            "surprise_probability": 70
        })

    return {"earnings": earnings}


# =============================================================================
# ECONOMIC EVENTS
# =============================================================================

@app.get("/economic/today")
async def get_today_economic():
    """Get today's economic releases"""
    today = datetime.utcnow().strftime("%Y-%m-%d")

    # Mock economic releases
    releases = [
        {
            "time": "08:30 AM EST",
            "release": "Initial Jobless Claims",
            "previous": "215K",
            "forecast": "220K",
            "impact": "medium"
        },
        {
            "time": "10:00 AM EST",
            "release": "Existing Home Sales",
            "previous": "5.32M",
            "forecast": "5.40M",
            "impact": "medium"
        }
    ]

    return {
        "date": today,
        "releases": releases,
        "count": len(releases)
    }


# =============================================================================
# ALERTS
# =============================================================================

@app.get("/alerts")
async def get_active_alerts():
    """Get active event alerts"""
    alerts = []

    for event in EVENTS.values():
        if event.status == "scheduled":
            if event.priority in [EventPriority.CRITICAL, EventPriority.HIGH]:
                alerts.append({
                    "alert_id": event.event_id,
                    "title": event.title,
                    "priority": event.priority.value,
                    "scheduled_time": event.scheduled_time.isoformat() if event.scheduled_time else None,
                    "affected": event.affected_assets[:3]
                })

    return {
        "alerts": alerts,
        "count": len(alerts),
        "critical": len([a for a in alerts if a["priority"] == "critical"])
    }


# =============================================================================
# EVENT RESEARCH
# =============================================================================

@app.get("/research/{symbol}")
async def get_symbol_events(symbol: str):
    """Get all events related to a symbol"""
    related_events = [
        e for e in EVENTS.values()
        if symbol in e.entities or symbol in e.affected_assets
    ]

    related_events.sort(key=lambda e: e.created_at, reverse=True)

    return {
        "symbol": symbol,
        "events": related_events,
        "total": len(related_events),
        "upcoming": len([e for e in related_events if e.status == "scheduled"]),
        "occurred": len([e for e in related_events if e.status == "occurred"])
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5052)