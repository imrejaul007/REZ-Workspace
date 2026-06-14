"""
AssetMind Frontend - Frontend Application Service
FastAPI Main Application
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(title="AssetMind Frontend", description="Frontend Application Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# ============================================================================
# Enums
# ============================================================================


class UserRole(str, Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    TRADER = "trader"
    VIEWER = "viewer"


class WidgetType(str, Enum):
    CHART = "chart"
    TABLE = "table"
    METRIC = "metric"
    NEWS = "news"
    ALERT = "alert"


class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


# ============================================================================
# Pydantic Models
# ============================================================================


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    email: str
    name: str
    role: UserRole = UserRole.VIEWER
    avatar_url: Optional[str] = None
    preferences: dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None


class DashboardLayout(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    name: str
    widgets: list[dict[str, Any]] = []
    is_default: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Widget(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    type: WidgetType
    title: str
    data_source: str
    config: dict[str, Any] = {}
    position: dict[str, int]
    refresh_interval: int = 60


class WatchlistItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    symbol: str
    name: str
    added_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None


class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    title: str
    condition: str
    triggered: bool = False
    last_triggered: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    type: NotificationType
    title: str
    message: str
    read: bool = False
    data: dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PortfolioSummary(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    name: str
    total_value: float
    day_change: float
    day_change_percent: float
    positions_count: int
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class MarketData(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int
    high: float
    low: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# In-Memory Storage
# ============================================================================

users_db: dict[str, User] = {}
layouts_db: dict[str, DashboardLayout] = {}
watchlists_db: list[WatchlistItem] = []
alerts_db: list[Alert] = []
notifications_db: list[Notification] = []
portfolios_db: dict[str, PortfolioSummary] = {}


# ============================================================================
# Health Check
# ============================================================================


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "assetmind-frontend",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {"total_users": len(users_db), "total_watchlists": len(watchlists_db), "total_alerts": len(alerts_db)},
    }


# ============================================================================
# Authentication Endpoints
# ============================================================================


@app.post("/auth/login", response_model=User)
async def login(email: str, password: str):
    for user in users_db.values():
        if user.email == email:
            user.last_login = datetime.utcnow()
            return user
    new_user = User(email=email, name=email.split("@")[0].title(), role=UserRole.VIEWER)
    users_db[new_user.id] = new_user
    return new_user


@app.get("/auth/me", response_model=User)
async def get_current_user(user_id: str = Query(...)):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[user_id]


# ============================================================================
# Dashboard Endpoints
# ============================================================================


@app.post("/dashboard/layouts", response_model=DashboardLayout, status_code=201)
async def create_layout(layout: DashboardLayout):
    layouts_db[layout.id] = layout
    return layout


@app.get("/dashboard/layouts", response_model=list[DashboardLayout])
async def list_layouts(user_id: str = Query(...)):
    return [l for l in layouts_db.values() if l.user_id == user_id]


@app.get("/dashboard/layouts/{layout_id}", response_model=DashboardLayout)
async def get_layout(layout_id: str):
    if layout_id not in layouts_db:
        raise HTTPException(status_code=404, detail="Layout not found")
    return layouts_db[layout_id]


@app.put("/dashboard/layouts/{layout_id}", response_model=DashboardLayout)
async def update_layout(layout_id: str, layout: DashboardLayout):
    if layout_id not in layouts_db:
        raise HTTPException(status_code=404, detail="Layout not found")
    layout.updated_at = datetime.utcnow()
    layouts_db[layout_id] = layout
    return layout


# ============================================================================
# Widget Endpoints
# ============================================================================


@app.post("/widgets", response_model=Widget, status_code=201)
async def create_widget(widget: Widget):
    return widget


@app.get("/widgets/templates")
async def get_widget_templates():
    return [
        {"type": WidgetType.CHART, "title": "Price Chart", "description": "Interactive price chart", "default_config": {"indicators": ["SMA", "EMA"]}},
        {"type": WidgetType.TABLE, "title": "Data Table", "description": "Sortable data table", "default_config": {"columns": ["Symbol", "Price", "Change"]}},
        {"type": WidgetType.METRIC, "title": "Key Metric", "description": "Display important metric", "default_config": {"format": "currency"}},
        {"type": WidgetType.NEWS, "title": "News Feed", "description": "Latest financial news", "default_config": {"refresh_interval": 300}},
    ]


# ============================================================================
# Watchlist Endpoints
# ============================================================================


@app.post("/watchlist", response_model=WatchlistItem, status_code=201)
async def add_to_watchlist(item: WatchlistItem):
    watchlists_db.append(item)
    return item


@app.get("/watchlist", response_model=list[WatchlistItem])
async def get_watchlist(user_id: str = Query(...)):
    return [w for w in watchlists_db if w.user_id == user_id]


@app.delete("/watchlist/{item_id}", status_code=204)
async def remove_from_watchlist(item_id: str, user_id: str = Query(...)):
    global watchlists_db
    watchlists_db = [w for w in watchlists_db if not (w.id == item_id and w.user_id == user_id)]


@app.get("/watchlist/market-data", response_model=list[MarketData])
async def get_watchlist_market_data(user_id: str = Query(...)):
    items = [w for w in watchlists_db if w.user_id == user_id]
    return [
        MarketData(symbol=item.symbol, name=item.name, price=100.0 + hash(item.symbol) % 500, change=round((hash(item.symbol) % 20) - 10, 2), change_percent=round((hash(item.symbol) % 10) - 5, 2), volume=hash(item.symbol) % 10000000, high=210, low=90)
        for item in items
    ]


# ============================================================================
# Alert Endpoints
# ============================================================================


@app.post("/alerts", response_model=Alert, status_code=201)
async def create_alert(alert: Alert):
    alerts_db.append(alert)
    return alert


@app.get("/alerts", response_model=list[Alert])
async def get_alerts(user_id: str = Query(...), triggered: Optional[bool] = Query(None)):
    alerts = [a for a in alerts_db if a.user_id == user_id]
    if triggered is not None:
        alerts = [a for a in alerts if a.triggered == triggered]
    return alerts


@app.delete("/alerts/{alert_id}", status_code=204)
async def delete_alert(alert_id: str, user_id: str = Query(...)):
    global alerts_db
    alerts_db = [a for a in alerts_db if not (a.id == alert_id and a.user_id == user_id)]


# ============================================================================
# Notification Endpoints
# ============================================================================


@app.get("/notifications", response_model=list[Notification])
async def get_notifications(user_id: str = Query(...), unread_only: bool = Query(False), limit: int = Query(50, ge=1, le=100)):
    notifications = [n for n in notifications_db if n.user_id == user_id]
    if unread_only:
        notifications = [n for n in notifications if not n.read]
    return sorted(notifications, key=lambda x: x.created_at, reverse=True)[:limit]


@app.post("/notifications/mark-read")
async def mark_notifications_read(user_id: str = Query(...), notification_ids: list[str] = Query(...)):
    for n in notifications_db:
        if n.user_id == user_id and n.id in notification_ids:
            n.read = True
    return {"success": True, "count": len(notification_ids)}


# ============================================================================
# Portfolio Endpoints
# ============================================================================


@app.get("/portfolios", response_model=list[PortfolioSummary])
async def get_portfolios(user_id: str = Query(...)):
    return [p for p in portfolios_db.values() if p.user_id == user_id]


@app.post("/portfolios", response_model=PortfolioSummary, status_code=201)
async def create_portfolio(portfolio: PortfolioSummary):
    portfolios_db[portfolio.id] = portfolio
    return portfolio


@app.get("/portfolios/{portfolio_id}/positions")
async def get_portfolio_positions(portfolio_id: str):
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return {"portfolio_id": portfolio_id, "positions": [{"symbol": "AAPL", "shares": 100, "avg_cost": 150.0, "current_price": 175.0, "market_value": 17500.0, "gain_loss": 2500.0}]}


# ============================================================================
# Market Data Endpoints
# ============================================================================


@app.get("/market/search")
async def search_symbols(q: str = Query(..., min_length=1)):
    mock_results = [{"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ"}, {"symbol": "GOOGL", "name": "Alphabet Inc.", "exchange": "NASDAQ"}, {"symbol": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ"}]
    q_lower = q.lower()
    return [r for r in mock_results if q_lower in r["symbol"].lower() or q_lower in r["name"].lower()]


@app.get("/market/quote/{symbol}")
async def get_quote(symbol: str):
    return MarketData(symbol=symbol.upper(), name=f"{symbol.upper()} Inc.", price=150.0 + hash(symbol) % 200, change=round((hash(symbol) % 20) - 10, 2), change_percent=round((hash(symbol) % 10) - 5, 2), volume=hash(symbol) % 10000000, high=200, low=100)


@app.get("/market/chart/{symbol}")
async def get_chart_data(symbol: str, timeframe: str = Query("1d", regex="^(1m|5m|15m|1h|1d|1w)$")):
    import random
    base_price = 150.0 + hash(symbol) % 200
    data = [{"timestamp": datetime.utcnow().timestamp() - (100 - i) * 3600, "open": round(base_price + random.uniform(-5, 5), 2), "close": round(base_price + random.uniform(-5, 5), 2), "volume": random.randint(100000, 1000000)} for i in range(100)]
    return {"symbol": symbol.upper(), "timeframe": timeframe, "data": data}


# ============================================================================
# WebSocket for Real-time Updates
# ============================================================================


@app.websocket("/ws/updates")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"type": "update", "data": data, "timestamp": datetime.utcnow().isoformat()})
    except Exception:
        pass


# ============================================================================
# Entry Point
# ============================================================================


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5054)