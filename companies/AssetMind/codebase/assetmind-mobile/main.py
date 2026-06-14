"""
AssetMind Mobile - Mobile App Backend Service
Port: 5005
Provides mobile-optimized APIs for iOS and Android apps.
"""

import os
import uuid
from datetime import datetime
from typing import Optional, List
from enum import Enum

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from loguru import logger

app = FastAPI(title="AssetMind Mobile", description="Mobile App Backend", version="1.0.0")

# CORS Configuration - Only allow specified origins in production
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

class DeviceType(str, Enum):
    IOS = "ios"
    ANDROID = "android"
    WEB = "web"

class NotificationType(str, Enum):
    PRICE_ALERT = "price_alert"
    PORTFOLIO_UPDATE = "portfolio_update"
    NEWS = "news"
    TRADE_EXECUTION = "trade_execution"

class PushStatus(str, Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    OPENED = "opened"

# ============================================================================
# Pydantic Models
# ============================================================================

class NotificationSettings(BaseModel):
    price_alerts: bool = True
    portfolio_updates: bool = True
    news: bool = True
    trade_confirmations: bool = True

class DisplaySettings(BaseModel):
    currency: str = "USD"
    theme: str = "dark"
    chart_type: str = "candlestick"
    language: str = "en"

class UserPreferences(BaseModel):
    notifications: NotificationSettings = NotificationSettings()
    display: DisplaySettings = DisplaySettings()
    biometric_enabled: bool = False

class WatchlistItem(BaseModel):
    symbol: str
    added_at: datetime = Field(default_factory=datetime.utcnow)

class MobileUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    preferences: UserPreferences = UserPreferences()
    watchlist: List[WatchlistItem] = []
    device_token: Optional[str] = None
    device_type: Optional[DeviceType] = None
    last_active: datetime = Field(default_factory=datetime.utcnow)

class PortfolioSummary(BaseModel):
    id: str
    name: str
    total_value: float
    day_change: float
    day_change_pct: float
    positions_count: int

class PositionSummary(BaseModel):
    symbol: str
    name: str
    quantity: float
    current_price: float
    value: float
    day_change: float
    day_change_pct: float
    pnl: float
    pnl_pct: float

class SimpleOrder(BaseModel):
    symbol: str
    side: str
    quantity: float
    order_type: str = "market"
    limit_price: Optional[float] = None

class OrderConfirmation(BaseModel):
    order_id: str
    symbol: str
    side: str
    quantity: float
    price: float
    total: float
    status: str
    executed_at: Optional[datetime] = None

class MobileQuote(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_pct: float
    high: float
    low: float
    volume: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class MarketOverview(BaseModel):
    indices: List[MobileQuote] = []
    top_gainers: List[MobileQuote] = []
    top_losers: List[MobileQuote] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PriceAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    symbol: str
    condition: str
    target_value: float
    triggered: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PushNotification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: NotificationType
    title: str
    body: str
    status: PushStatus = PushStatus.SENT
    sent_at: datetime = Field(default_factory=datetime.utcnow)

class LoginRequest(BaseModel):
    email: str
    password: str
    device_type: DeviceType
    device_token: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: MobileUser
    expires_in: int = 3600

# ============================================================================
# In-Memory Storage
# ============================================================================

users_db: dict[str, MobileUser] = {}
portfolios_db: dict[str, PortfolioSummary] = {}
price_alerts_db: dict[str, PriceAlert] = {}
notifications_db: dict[str, PushNotification] = {}

# Initialize sample data - Only in development mode
# In production, set APP_ENV=production to disable demo data
if os.getenv("APP_ENV") != "production":
    demo_email = os.getenv("MOBILE_DEMO_EMAIL", "demo@assetmind.io")
    demo_watchlist = os.getenv("MOBILE_DEMO_WATCHLIST", "AAPL,GOOGL,MSFT").split(",")
    users_db["user-001"] = MobileUser(
        id="user-001",
        email=demo_email,
        name="Demo User",
        watchlist=[WatchlistItem(symbol=s.strip()) for s in demo_watchlist]
    )
    portfolios_db["portfolio-001"] = PortfolioSummary(
        id="portfolio-001",
        name="Growth Portfolio",
        total_value=125430.50,
        day_change=1250.00,
        day_change_pct=1.01,
        positions_count=8
    )
    logger.info(f"Demo mode enabled with email: {demo_email}")
else:
    logger.info("Production mode - demo data disabled")

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "assetmind-mobile",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {"users": len(users_db), "portfolios": len(portfolios_db), "price_alerts": len(price_alerts_db)}
    }

# ============================================================================
# Authentication Endpoints
# ============================================================================

@app.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    user = None
    for u in users_db.values():
        if u.email == request.email:
            user = u
            break
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user.device_type = request.device_type
    user.device_token = request.device_token
    user.last_active = datetime.utcnow()
    return AuthResponse(access_token=f"mob_{uuid.uuid4().hex}", refresh_token=f"ref_{uuid.uuid4().hex}", user=user)

@app.post("/auth/refresh", response_model=AuthResponse)
async def refresh_token(refresh_token: str):
    # In production, validate refresh token against database
    # For demo mode, return a new token if demo user exists
    if os.getenv("APP_ENV") != "production" and "user-001" in users_db:
        demo_user = users_db["user-001"]
        return AuthResponse(
            access_token=f"new_{uuid.uuid4().hex}",
            refresh_token=refresh_token,
            user=demo_user
        )
    raise HTTPException(status_code=401, detail="Invalid refresh token")

# ============================================================================
# Portfolio Endpoints
# ============================================================================

@app.get("/portfolios", response_model=List[PortfolioSummary])
async def get_portfolios(user_id: str):
    return list(portfolios_db.values())

@app.get("/portfolios/{portfolio_id}/summary", response_model=PortfolioSummary)
async def get_portfolio_summary(portfolio_id: str):
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolios_db[portfolio_id]

@app.get("/portfolios/{portfolio_id}/positions", response_model=List[PositionSummary])
async def get_positions(portfolio_id: str):
    if portfolio_id not in portfolios_db:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return [
        PositionSummary(symbol="AAPL", name="Apple Inc.", quantity=50, current_price=178.50, value=8925.00, day_change=2.35, day_change_pct=1.33, pnl=1425.00, pnl_pct=18.97),
        PositionSummary(symbol="GOOGL", name="Alphabet Inc.", quantity=25, current_price=141.20, value=3530.00, day_change=-1.50, day_change_pct=-0.42, pnl=280.00, pnl_pct=8.61),
    ]

# ============================================================================
# Trading Endpoints
# ============================================================================

@app.post("/orders/preview", response_model=OrderConfirmation)
async def preview_order(portfolio_id: str, order: SimpleOrder):
    price = order.limit_price or 150.0
    return OrderConfirmation(order_id=str(uuid.uuid4()), symbol=order.symbol, side=order.side, quantity=order.quantity, price=price, total=order.quantity * price, status="pending")

@app.post("/orders/execute", response_model=OrderConfirmation)
async def execute_order(portfolio_id: str, order: SimpleOrder):
    price = order.limit_price or 150.0
    confirmation = OrderConfirmation(order_id=str(uuid.uuid4()), symbol=order.symbol, side=order.side, quantity=order.quantity, price=price, total=order.quantity * price, status="executed", executed_at=datetime.utcnow())
    logger.info(f"Order executed: {confirmation.order_id}")
    return confirmation

# ============================================================================
# Market Data Endpoints
# ============================================================================

@app.get("/market/overview", response_model=MarketOverview)
async def get_market_overview():
    return MarketOverview(
        indices=[MobileQuote(symbol="SPX", name="S&P 500", price=5234.18, change=15.3, change_pct=0.29, high=5250, low=5210, volume=2500000000)],
        top_gainers=[MobileQuote(symbol="NVDA", name="NVIDIA", price=878.35, change=25.4, change_pct=2.98, high=885, low=850, volume=35000000)],
        top_losers=[MobileQuote(symbol="META", name="Meta", price=502.30, change=-12.8, change_pct=-2.48, high=515, low=500, volume=18000000)],
    )

@app.get("/market/quote/{symbol}", response_model=MobileQuote)
async def get_quote(symbol: str):
    return MobileQuote(symbol=symbol.upper(), name=f"{symbol.upper()} Inc.", price=150.0, change=2.5, change_pct=1.69, high=155.0, low=148.0, volume=10000000)

# ============================================================================
# Watchlist Endpoints
# ============================================================================

@app.get("/watchlist", response_model=List[MobileQuote])
async def get_watchlist(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    user = users_db[user_id]
    return [MobileQuote(symbol=item.symbol, name=f"{item.symbol} Inc.", price=150.0, change=2.5, change_pct=1.69, high=155.0, low=148.0, volume=10000000) for item in user.watchlist]

@app.post("/watchlist/{symbol}", response_model=MobileUser)
async def add_to_watchlist(user_id: str, symbol: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    user = users_db[user_id]
    for item in user.watchlist:
        if item.symbol == symbol.upper():
            raise HTTPException(status_code=400, detail="Symbol already in watchlist")
    user.watchlist.append(WatchlistItem(symbol=symbol.upper()))
    return user

@app.delete("/watchlist/{symbol}", response_model=MobileUser)
async def remove_from_watchlist(user_id: str, symbol: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    user = users_db[user_id]
    user.watchlist = [w for w in user.watchlist if w.symbol != symbol.upper()]
    return user

# ============================================================================
# Price Alerts Endpoints
# ============================================================================

@app.post("/alerts", response_model=PriceAlert, status_code=201)
async def create_price_alert(user_id: str, symbol: str, condition: str, target_value: float):
    alert = PriceAlert(user_id=user_id, symbol=symbol.upper(), condition=condition, target_value=target_value)
    price_alerts_db[alert.id] = alert
    return alert

@app.get("/alerts", response_model=List[PriceAlert])
async def get_price_alerts(user_id: str):
    return [a for a in price_alerts_db.values() if a.user_id == user_id and not a.triggered]

@app.delete("/alerts/{alert_id}", status_code=204)
async def delete_price_alert(alert_id: str):
    if alert_id not in price_alerts_db:
        raise HTTPException(status_code=404, detail="Alert not found")
    del price_alerts_db[alert_id]

# ============================================================================
# User Preferences Endpoints
# ============================================================================

@app.get("/preferences", response_model=UserPreferences)
async def get_preferences(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[user_id].preferences

@app.put("/preferences", response_model=UserPreferences)
async def update_preferences(user_id: str, preferences: UserPreferences):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    users_db[user_id].preferences = preferences
    return preferences

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting AssetMind Mobile on port 5005")
    uvicorn.run(app, host="0.0.0.0", port=5005)
