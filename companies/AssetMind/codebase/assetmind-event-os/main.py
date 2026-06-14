"""
AssetMind Event Operating System
Central event intelligence hub for financial events
Port: 5052
"""

import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("assetmind-event-os")


class EventCategory(str, Enum):
    EARNINGS = "earnings"
    ECONOMIC = "economic"
    CORPORATE = "corporate"
    REGULATORY = "regulatory"
    MARKET = "market"
    GLOBAL = "global"


class EventImpact(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EventStatus(str, Enum):
    UPCOMING = "upcoming"
    LIVE = "live"
    COMPLETED = "completed"


class AlertPriority(str, Enum):
    INFO = "info"
    WARNING = "warning"
    URGENT = "urgent"
    CRITICAL = "critical"


class CalendarEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    description: Optional[str] = None
    category: EventCategory
    event_date: datetime
    end_date: Optional[datetime] = None
    symbols: List[str] = Field(default_factory=list)
    impact: EventImpact = EventImpact.MEDIUM
    status: EventStatus = EventStatus.UPCOMING
    source: str
    url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: EventCategory
    event_date: datetime
    end_date: Optional[datetime] = None
    symbols: List[str] = Field(default_factory=list)
    impact: EventImpact = EventImpact.MEDIUM
    source: str
    url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ImpactAnalysis(BaseModel):
    event_id: str
    symbol: str
    expected_price_move: float
    expected_volume_change: float
    confidence: float = Field(ge=0.0, le=1.0)
    risk_factors: List[str] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)


class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    message: str
    priority: AlertPriority
    event_id: Optional[str] = None
    symbols: List[str] = Field(default_factory=list)
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AlertCreate(BaseModel):
    title: str
    message: str
    priority: AlertPriority
    event_id: Optional[str] = None
    symbols: List[str] = Field(default_factory=list)


class ResearchNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    event_id: str
    symbol: Optional[str] = None
    title: str
    content: str
    author: str = "system"
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ResearchNoteCreate(BaseModel):
    event_id: str
    symbol: Optional[str] = None
    title: str
    content: str
    author: str = "system"
    tags: List[str] = Field(default_factory=list)


class EventOSState:
    def __init__(self):
        self.events: Dict[str, CalendarEvent] = {}
        self.alerts: Dict[str, Alert] = {}
        self.research_notes: Dict[str, ResearchNote] = {}
        self.impact_analyses: Dict[str, ImpactAnalysis] = {}
        self.start_time = datetime.utcnow()

    def create_event(self, request: EventCreate) -> CalendarEvent:
        event = CalendarEvent(title=request.title, description=request.description, category=request.category,
                             event_date=request.event_date, end_date=request.end_date, symbols=request.symbols,
                             impact=request.impact, source=request.source, url=request.url, metadata=request.metadata)
        self.events[event.id] = event
        if request.impact in [EventImpact.HIGH, EventImpact.CRITICAL]:
            self.alerts[alert_id := str(uuid4())] = Alert(
                title=f"High Impact Event: {request.title}", message=f"{request.category.value} event on {request.event_date.strftime('%Y-%m-%d')}",
                priority=AlertPriority.URGENT if request.impact == EventImpact.CRITICAL else AlertPriority.WARNING,
                event_id=event.id, symbols=request.symbols)
        logger.info(f"Created event: {event.id}")
        return event

    def analyze_impact(self, event_id: str, symbol: str) -> ImpactAnalysis:
        event = self.events.get(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        base_impact = {EventCategory.EARNINGS: 0.05, EventCategory.ECONOMIC: 0.02, EventCategory.CORPORATE: 0.03,
                      EventCategory.REGULATORY: 0.04, EventCategory.MARKET: 0.02, EventCategory.GLOBAL: 0.03}
        mult = {EventImpact.LOW: 0.5, EventImpact.MEDIUM: 1.0, EventImpact.HIGH: 2.0, EventImpact.CRITICAL: 3.0}

        base = base_impact.get(event.category, 0.02)
        affected = symbol in event.symbols if event.symbols else False
        expected_move = base * mult.get(event.impact, 1.0) * (1.5 if affected else 0.5)

        risk_factors, opportunities = [], []
        if event.impact in [EventImpact.HIGH, EventImpact.CRITICAL]:
            risk_factors.append("High impact event may cause volatility")
            opportunities.append("Potential breakout trading opportunities")
        if event.category == EventCategory.EARNINGS:
            risk_factors.append("Earnings surprise risk")
            opportunities.append("Post-earnings momentum plays")

        analysis = ImpactAnalysis(event_id=event_id, symbol=symbol, expected_price_move=expected_move * 100,
                                 expected_volume_change=expected_move * 500, confidence=0.75, risk_factors=risk_factors, opportunities=opportunities)
        self.impact_analyses[f"{event_id}_{symbol}"] = analysis
        return analysis

    def create_alert(self, request: AlertCreate) -> Alert:
        alert = Alert(title=request.title, message=request.message, priority=request.priority,
                     event_id=request.event_id, symbols=request.symbols)
        self.alerts[alert.id] = alert
        return alert

    def create_research_note(self, request: ResearchNoteCreate) -> ResearchNote:
        note = ResearchNote(event_id=request.event_id, symbol=request.symbol, title=request.title,
                           content=request.content, author=request.author, tags=request.tags)
        self.research_notes[note.id] = note
        return note

    def get_upcoming_events(self, days: int = 7) -> List[CalendarEvent]:
        now, future = datetime.utcnow(), datetime.utcnow() + timedelta(days=days)
        return [e for e in self.events.values() if now <= e.event_date <= future]

    def get_day_summary(self, date: Optional[datetime] = None) -> dict:
        target_date = (date or datetime.utcnow()).date()
        day_events = [e for e in self.events.values() if e.event_date.date() == target_date]
        by_category = {}
        for e in day_events:
            by_category[e.category.value] = by_category.get(e.category.value, 0) + 1
        high_impact = [e for e in day_events if e.impact in [EventImpact.HIGH, EventImpact.CRITICAL]]
        all_symbols = list(set(sym for e in day_events for sym in e.symbols))[:20]
        return {"date": target_date.isoformat(), "total_events": len(day_events), "by_category": by_category,
                "high_impact_events": high_impact, "symbols_affected": all_symbols, "market_open": True}


state = EventOSState()

app = FastAPI(title="AssetMind Event Operating System", description="Central event intelligence hub", version="1.0.0")


@app.get("/health")
async def health_check():
    return {"service": "assetmind-event-os", "status": "healthy", "version": "1.0.0", "port": 5052,
            "total_events": len(state.events), "total_alerts": len(state.alerts)}


@app.get("/health/live")
async def liveness():
    return {"status": "alive"}


@app.get("/health/ready")
async def readiness():
    return {"status": "ready", "events_loaded": len(state.events)}


calendar_router = APIRouter(prefix="/api/calendar")


@calendar_router.get("/", response_model=List[CalendarEvent])
async def list_events(category: Optional[EventCategory] = None, symbol: Optional[str] = None, days: int = Query(7, ge=1, le=90)):
    events = state.get_upcoming_events(days)
    if category:
        events = [e for e in events if e.category == category]
    if symbol:
        events = [e for e in events if symbol in e.symbols]
    return events


@calendar_router.get("/today", response_model=List[CalendarEvent])
async def get_today_events():
    return [e for e in state.events.values() if e.event_date.date() == datetime.utcnow().date()]


@calendar_router.get("/summary")
async def get_day_summary(date: Optional[str] = None):
    return state.get_day_summary(datetime.fromisoformat(date) if date else None)


@calendar_router.post("/", response_model=CalendarEvent, status_code=201)
async def create_event(request: EventCreate):
    return state.create_event(request)


app.include_router(calendar_router)


@app.post("/api/impact/{event_id}/{symbol}", response_model=ImpactAnalysis)
async def analyze_impact(event_id: str, symbol: str):
    return state.analyze_impact(event_id, symbol)


alert_router = APIRouter(prefix="/api/alerts")


@alert_router.get("/", response_model=List[Alert])
async def list_alerts(priority: Optional[AlertPriority] = None, unread_only: bool = False, limit: int = Query(50, ge=1, le=100)):
    alerts = list(state.alerts.values())
    if priority:
        alerts = [a for a in alerts if a.priority == priority]
    if unread_only:
        alerts = [a for a in alerts if not a.read]
    return sorted(alerts, key=lambda a: a.created_at, reverse=True)[:limit]


@alert_router.post("/", response_model=Alert, status_code=201)
async def create_alert(request: AlertCreate):
    return state.create_alert(request)


@alert_router.patch("/{alert_id}/read", response_model=Alert)
async def mark_alert_read(alert_id: str):
    alert = state.alerts.get(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.read = True
    return alert


app.include_router(alert_router)


@app.post("/api/research", response_model=ResearchNote, status_code=201)
async def create_research_note(request: ResearchNoteCreate):
    return state.create_research_note(request)


@app.get("/api/research", response_model=List[ResearchNote])
async def list_research_notes(event_id: Optional[str] = None, symbol: Optional[str] = None, limit: int = Query(50, ge=1, le=100)):
    notes = list(state.research_notes.values())
    if event_id:
        notes = [n for n in notes if n.event_id == event_id]
    if symbol:
        notes = [n for n in notes if n.symbol == symbol]
    return sorted(notes, key=lambda n: n.created_at, reverse=True)[:limit]


@app.get("/")
async def root():
    return {"service": "AssetMind Event Operating System", "version": "1.0.0", "port": 5052}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5052)