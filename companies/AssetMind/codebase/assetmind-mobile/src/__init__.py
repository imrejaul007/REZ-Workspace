"""
AssetMind Mobile API
Expo React Native mobile app backend.
Provides data endpoints for mobile app.
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


app = FastAPI(title="AssetMind Mobile API", version="1.0.0")


class NotificationType(str, Enum):
    PRICE_ALERT = "price_alert"
    PORTFOLIO_ALERT = "portfolio_alert"
    NEWS_ALERT = "news_alert"
    AI_RECOMMENDATION = "ai_recommendation"


class Device(BaseModel):
    device_id: str
    user_id: str
    platform: str  # "ios" or "android"
    push_token: str
    registered_at: str


class Notification(BaseModel):
    notification_id: str
    device_id: str
    title: str
    body: str
    data: Dict[str, Any]
    sent_at: str


class Alert(BaseModel):
    alert_id: str
    symbol: str
    condition: str  # "above", "below", "change_pct"
    value: float
    triggered: bool = False
    triggered_at: Optional[str] = None


# In-memory storage
devices: Dict[str, Device] = {}
notifications: List[Notification] = []
alerts: Dict[str, Alert] = {}
notification_counter = 0


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "mobile-api", "version": "1.0.0"}


@app.post("/devices/register")
async def register_device(device: Device):
    """Register a device for push notifications."""
    devices[device.device_id] = device
    return {"status": "registered", "device_id": device.device_id}


@app.delete("/devices/{device_id}")
async def unregister_device(device_id: str):
    """Unregister a device."""
    if device_id in devices:
        del devices[device_id]
        return {"status": "unregistered"}
    raise HTTPException(status_code=404, detail="Device not found")


@app.get("/dashboard")
async def get_mobile_dashboard(user_id: str):
    """Get dashboard data for mobile app."""
    return {
        "user_id": user_id,
        "portfolio_value": 12545000,
        "day_change": 15200,
        "day_change_pct": 1.2,
        "alerts_count": 3,
        "ai_insights": [
            {"title": "Portfolio Update", "message": "You're up 1.2% today", "type": "positive"},
            {"title": "RELIANCE Update", "message": "Breaking resistance at ₹2800", "type": "neutral"},
            {"title": "Weekly Summary", "message": "Your best week in 2 months", "type": "positive"}
        ],
        "quick_actions": [
            {"action": "portfolio", "label": "Portfolio", "icon": "briefcase"},
            {"action": "watchlist", "label": "Watchlist", "icon": "eye"},
            {"action": "ai", "label": "AI Insights", "icon": "sparkles"},
            {"action": "settings", "label": "Settings", "icon": "cog"}
        ],
        "top_holdings": [
            {"symbol": "RELIANCE", "value": 3500000, "change": 3.5},
            {"symbol": "TCS", "value": 2200000, "change": 1.2},
            {"symbol": "HDFCBANK", "value": 2800000, "change": -0.8}
        ]
    }


@app.get("/portfolio")
async def get_mobile_portfolio(user_id: str):
    """Get detailed portfolio for mobile."""
    return {
        "total_value": 12545000,
        "cash": 250000,
        "invested": 12295000,
        "returns": {
            "day": {"value": 15200, "pct": 1.2},
            "week": {"value": 45000, "pct": 3.6},
            "month": {"value": 125000, "pct": 10.1},
            "year": {"value": 850000, "pct": 7.2}
        },
        "positions": [
            {
                "symbol": "RELIANCE",
                "shares": 100,
                "avg_price": 3400,
                "current_price": 3500,
                "value": 350000,
                "pnl": 10000,
                "pnl_pct": 2.9
            },
            {
                "symbol": "TCS",
                "shares": 50,
                "avg_price": 3200,
                "current_price": 3400,
                "value": 170000,
                "pnl": 10000,
                "pnl_pct": 6.3
            }
        ],
        "asset_allocation": [
            {"type": "Stocks", "value": 10000000, "pct": 80},
            {"type": "ETFs", "value": 1500000, "pct": 12},
            {"type": "Cash", "value": 1045000, "pct": 8}
        ]
    }


@app.get("/watchlist")
async def get_watchlist(user_id: str):
    """Get user's watchlist."""
    return {
        "symbols": [
            {"symbol": "RELIANCE", "price": 3500, "change": 3.5, "alert_set": True},
            {"symbol": "TCS", "price": 3400, "change": 1.2, "alert_set": False},
            {"symbol": "INFY", "price": 1450, "change": -0.5, "alert_set": True},
            {"symbol": "HDFCBANK", "price": 1650, "change": 2.1, "alert_set": False},
            {"symbol": "ICICIBANK", "price": 980, "change": 1.8, "alert_set": True}
        ]
    }


@app.post("/alerts")
async def create_alert(alert: Alert):
    """Create a price alert."""
    alerts[alert.alert_id] = alert
    return alert


@app.get("/alerts")
async def get_alerts(user_id: str, active_only: bool = True):
    """Get user's alerts."""
    result = list(alerts.values())
    if active_only:
        result = [a for a in result if not a.triggered]
    return {"alerts": result}


@app.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    """Delete an alert."""
    if alert_id in alerts:
        del alerts[alert_id]
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Alert not found")


@app.post("/notifications/send")
async def send_notification(
    device_id: str,
    title: str,
    body: str,
    data: Dict[str, Any] = None
):
    """Send push notification to device."""
    global notification_counter

    if device_id not in devices:
        raise HTTPException(status_code=404, detail="Device not registered")

    notification_counter += 1
    notification = Notification(
        notification_id=f"notif-{notification_counter:06d}",
        device_id=device_id,
        title=title,
        body=body,
        data=data or {},
        sent_at=datetime.now().isoformat()
    )

    notifications.append(notification)
    return {"status": "sent", "notification": notification}


@app.get("/notifications")
async def get_notifications(device_id: str, limit: int = 50):
    """Get notification history."""
    result = [n for n in notifications if n.device_id == device_id]
    result.sort(key=lambda x: x.sent_at, reverse=True)
    return {"notifications": result[:limit]}


@app.get("/ai/insights")
async def get_ai_insights(user_id: str):
    """Get AI-generated insights."""
    return {
        "insights": [
            {
                "id": "ins-001",
                "type": "opportunity",
                "title": "Tech Sector Momentum",
                "message": "IT stocks showing strong momentum. Consider increasing allocation.",
                "confidence": 78,
                "action_required": False
            },
            {
                "id": "ins-002",
                "type": "warning",
                "title": "Banking Sector Alert",
                "message": "Bank Nifty approaching key resistance. Monitor closely.",
                "confidence": 82,
                "action_required": True
            },
            {
                "id": "ins-003",
                "type": "rebalance",
                "title": "Portfolio Rebalance",
                "message": "Tech allocation exceeds target by 5%. Consider rebalancing.",
                "confidence": 90,
                "action_required": True
            }
        ]
    }


@app.post("/voice/command")
async def voice_command(command: str, user_id: str):
    """Process voice command."""
    command_lower = command.lower()

    if "portfolio" in command_lower or "value" in command_lower:
        return {
            "action": "show_portfolio",
            "response": "Your portfolio is worth ₹12,54,500. You're up 1.2% today."
        }
    elif "buy" in command_lower or "sell" in command_lower:
        return {
            "action": "trade",
            "response": "I can help with trading. Which stock would you like to trade?"
        }
    elif "alert" in command_lower or "notify" in command_lower:
        return {
            "action": "set_alert",
            "response": "Sure, what price alert would you like to set?"
        }
    else:
        return {
            "action": "search",
            "response": "I can help with portfolio, trading, alerts, and more."
        }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3001)
