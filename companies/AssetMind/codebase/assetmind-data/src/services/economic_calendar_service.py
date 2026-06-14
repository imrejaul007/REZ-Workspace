"""
AssetMind - Economic Calendar Service
Port: 5023
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta


app = FastAPI(title="AssetMind Economic Calendar Service", version="1.0.0")


class EconomicEvent(BaseModel):
    id: str
    name: str
    country: str
    date: datetime
    time: str  # "08:30 EST"
    importance: str = "MEDIUM"  # LOW, MEDIUM, HIGH
    impact: str = "MEDIUM"  # LOW, MEDIUM, HIGH
    previous: float
    forecast: float
    actual: Optional[float] = None
    unit: str = "%"
    description: str = ""


# Mock calendar data
MOCK_CALENDAR = [
    EconomicEvent(
        id="us-cpi", name="US CPI YoY", country="US",
        date=datetime.utcnow() + timedelta(days=1), time="08:30 EST",
        importance="HIGH", impact="HIGH", previous=3.4, forecast=3.2,
        unit="%", description="Consumer Price Index year-over-year"
    ),
    EconomicEvent(
        id="us-ppi", name="US PPI YoY", country="US",
        date=datetime.utcnow() + timedelta(days=2), time="08:30 EST",
        importance="MEDIUM", impact="MEDIUM", previous=2.3, forecast=2.1,
        unit="%", description="Producer Price Index year-over-year"
    ),
    EconomicEvent(
        id="us-jobs", name="Non-Farm Payrolls", country="US",
        date=datetime.utcnow() + timedelta(days=5), time="08:30 EST",
        importance="HIGH", impact="HIGH", previous=272000, forecast=185000,
        unit="K", description="Change in non-farm payrolls"
    ),
    EconomicEvent(
        id="us-unemployment", name="Unemployment Rate", country="US",
        date=datetime.utcnow() + timedelta(days=5), time="08:30 EST",
        importance="HIGH", impact="HIGH", previous=3.9, forecast=4.0,
        unit="%", description="Unemployment rate"
    ),
    EconomicEvent(
        id="us-fed-rate", name="Fed Interest Rate Decision", country="US",
        date=datetime.utcnow() + timedelta(days=14), time="14:00 EST",
        importance="HIGH", impact="HIGH", previous=5.25, forecast=5.25,
        unit="%", description="Federal Reserve interest rate decision"
    ),
    EconomicEvent(
        id="eu-gdp", name="EU GDP QoQ", country="EU",
        date=datetime.utcnow() + timedelta(days=3), time="10:00 CET",
        importance="HIGH", impact="HIGH", previous=0.3, forecast=0.2,
        unit="%", description="European Union GDP quarterly growth"
    ),
    EconomicEvent(
        id="china-pmi", name="China Caixin Manufacturing PMI", country="CN",
        date=datetime.utcnow() + timedelta(days=4), time="02:45 CST",
        importance="MEDIUM", impact="MEDIUM", previous=51.7, forecast=51.5,
        unit="", description="China manufacturing PMI"
    ),
    EconomicEvent(
        id="eu-inflation", name="EU CPI YoY", country="EU",
        date=datetime.utcnow() + timedelta(days=6), time="10:00 CET",
        importance="HIGH", impact="HIGH", previous=2.6, forecast=2.5,
        unit="%", description="European Union inflation rate"
    ),
]


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-economic-calendar",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5023
    }


@app.get("/calendar")
async def get_calendar(days: int = 7):
    today = datetime.utcnow().date()
    end_date = today + timedelta(days=days)
    events = [e for e in MOCK_CALENDAR if today <= e.date.date() <= end_date]
    return {"events": events, "count": len(events)}


@app.get("/calendar/today")
async def get_today_events():
    today = datetime.utcnow().date()
    events = [e for e in MOCK_CALENDAR if e.date.date() == today]
    return {"events": events, "count": len(events)}


@app.get("/calendar/high-impact")
async def get_high_impact_events(days: int = 7):
    today = datetime.utcnow().date()
    end_date = today + timedelta(days=days)
    events = [
        e for e in MOCK_CALENDAR
        if today <= e.date.date() <= end_date and e.impact == "HIGH"
    ]
    return {"events": events, "count": len(events)}


@app.get("/calendar/{country}")
async def get_country_events(country: str, days: int = 7):
    today = datetime.utcnow().date()
    end_date = today + timedelta(days=days)
    events = [
        e for e in MOCK_CALENDAR
        if e.country.upper() == country.upper()
        and today <= e.date.date() <= end_date
    ]
    return {"events": events, "country": country.upper(), "count": len(events)}


@app.get("/calendar/event/{event_id}")
async def get_event(event_id: str):
    for e in MOCK_CALENDAR:
        if e.id == event_id:
            return e
    return {"error": "Event not found"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5023)
