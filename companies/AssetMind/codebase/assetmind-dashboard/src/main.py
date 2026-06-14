"""
AssetMind Dashboard Service
Analytics dashboard for financial intelligence
Port: 5201
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
import logging
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AssetMind Dashboard",
    description="Analytics dashboard for financial intelligence platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Enums
class TimeRange(str, Enum):
    DAY = "1d"
    WEEK = "1w"
    MONTH = "1m"
    QUARTER = "3m"
    YEAR = "1y"
    YTD = "ytd"


class MetricType(str, Enum):
    PORTFOLIO_VALUE = "portfolio_value"
    DAILY_RETURN = "daily_return"
    VOLATILITY = "volatility"
    SHARPE_RATIO = "sharpe_ratio"
    MAX_DRAWDOWN = "max_drawdown"
    WIN_RATE = "win_rate"


# Pydantic Models
class DashboardWidget(BaseModel):
    widget_id: str
    widget_type: str
    title: str
    data: Dict[str, Any]
    refresh_interval: int = 60


class PortfolioSummary(BaseModel):
    total_value: float
    daily_change: float
    daily_change_pct: float
    weekly_change: float
    monthly_change: float
    ytd_return: float
    benchmark_return: float


class PerformanceMetric(BaseModel):
    metric_type: MetricType
    value: float
    timestamp: datetime
    comparison_value: Optional[float] = None


class ChartDataPoint(BaseModel):
    timestamp: datetime
    value: float
    label: Optional[str] = None


class AssetAllocation(BaseModel):
    asset_class: str
    value: float
    percentage: float
    change: float


class WatchlistItem(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_pct: float
    volume: int
    market_cap: Optional[float] = None


class AlertConfig(BaseModel):
    alert_id: str
    metric: str
    condition: str
    threshold: float
    enabled: bool = True


class DashboardLayout(BaseModel):
    layout_id: str
    user_id: str
    widgets: List[DashboardWidget]
    created_at: datetime
    updated_at: datetime


# Mock data generators
def generate_chart_data(
    metric: str,
    time_range: TimeRange,
    base_value: float = 100000
) -> List[ChartDataPoint]:
    """Generate mock chart data"""
    days_map = {
        TimeRange.DAY: 1,
        TimeRange.WEEK: 7,
        TimeRange.MONTH: 30,
        TimeRange.QUARTER: 90,
        TimeRange.YEAR: 365,
        TimeRange.YTD: 160,
    }
    days = days_map.get(time_range, 30)
    data = []
    current_value = base_value

    for i in range(days):
        timestamp = datetime.utcnow() - timedelta(days=days - i)
        change = random.uniform(-0.02, 0.025)
        current_value *= (1 + change)
        data.append(ChartDataPoint(
            timestamp=timestamp,
            value=round(current_value, 2),
            label=timestamp.strftime("%Y-%m-%d")
        ))

    return data


def generate_performance_metrics() -> List[PerformanceMetric]:
    """Generate mock performance metrics"""
    metrics = [
        (MetricType.PORTFOLIO_VALUE, 125000),
        (MetricType.DAILY_RETURN, 0.85),
        (MetricType.VOLATILITY, 12.5),
        (MetricType.SHARPE_RATIO, 1.45),
        (MetricType.MAX_DRAWDOWN, -8.2),
        (MetricType.WIN_RATE, 58.5),
    ]
    return [
        PerformanceMetric(
            metric_type=metric_type,
            value=value,
            timestamp=datetime.utcnow(),
            comparison_value=value * random.uniform(0.9, 1.1)
        )
        for metric_type, value in metrics
    ]


# API Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AssetMind Dashboard",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/api/v1/dashboard/{user_id}")
async def get_dashboard(user_id: str) -> Dict[str, Any]:
    """Get complete dashboard data for user"""
    return {
        "user_id": user_id,
        "summary": {
            "total_value": 125000.00,
            "daily_change": 1050.00,
            "daily_change_pct": 0.85,
            "weekly_change": 3200.00,
            "monthly_change": 8500.00,
            "ytd_return": 15.2,
            "benchmark_return": 12.8,
        },
        "widgets": [],
        "last_updated": datetime.utcnow().isoformat(),
    }


@app.get("/api/v1/portfolio/summary/{user_id}")
async def get_portfolio_summary(user_id: str) -> PortfolioSummary:
    """Get portfolio summary"""
    return PortfolioSummary(
        total_value=125000.00,
        daily_change=1050.00,
        daily_change_pct=0.85,
        weekly_change=3200.00,
        monthly_change=8500.00,
        ytd_return=15.2,
        benchmark_return=12.8,
    )


@app.get("/api/v1/portfolio/chart/{user_id}")
async def get_portfolio_chart(
    user_id: str,
    time_range: TimeRange = Query(default=TimeRange.MONTH),
    metric: str = "value"
) -> List[ChartDataPoint]:
    """Get portfolio chart data"""
    return generate_chart_data(metric, time_range)


@app.get("/api/v1/metrics/{user_id}")
async def get_performance_metrics(user_id: str) -> List[PerformanceMetric]:
    """Get performance metrics"""
    return generate_performance_metrics()


@app.get("/api/v1/allocation/{user_id}")
async def get_asset_allocation(user_id: str) -> List[AssetAllocation]:
    """Get asset allocation breakdown"""
    return [
        AssetAllocation(asset_class="Equities", value=62500, percentage=50.0, change=1.2),
        AssetAllocation(asset_class="Fixed Income", value=31250, percentage=25.0, change=0.3),
        AssetAllocation(asset_class="Real Estate", value=18750, percentage=15.0, change=-0.5),
        AssetAllocation(asset_class="Commodities", value=8125, percentage=6.5, change=2.1),
        AssetAllocation(asset_class="Cash", value=4375, percentage=3.5, change=0.0),
    ]


@app.get("/api/v1/watchlist/{user_id}")
async def get_watchlist(user_id: str) -> List[WatchlistItem]:
    """Get user's watchlist"""
    return [
        WatchlistItem(symbol="AAPL", name="Apple Inc.", price=178.50, change=2.35, change_pct=1.33, volume=52000000, market_cap=2800000000000),
        WatchlistItem(symbol="MSFT", name="Microsoft Corp.", price=415.20, change=-1.80, change_pct=-0.43, volume=21000000, market_cap=3100000000000),
        WatchlistItem(symbol="GOOGL", name="Alphabet Inc.", price=142.80, change=3.20, change_pct=2.29, volume=28000000, market_cap=1800000000000),
        WatchlistItem(symbol="AMZN", name="Amazon.com Inc.", price=185.60, change=4.10, change_pct=2.26, volume=45000000, market_cap=1950000000000),
        WatchlistItem(symbol="NVDA", name="NVIDIA Corp.", price=875.30, change=15.70, change_pct=1.83, volume=38000000, market_cap=2150000000000),
    ]


@app.post("/api/v1/watchlist/{user_id}")
async def add_to_watchlist(user_id: str, symbol: str) -> Dict[str, Any]:
    """Add symbol to watchlist"""
    return {
        "user_id": user_id,
        "symbol": symbol,
        "added_at": datetime.utcnow().isoformat(),
        "success": True,
    }


@app.delete("/api/v1/watchlist/{user_id}/{symbol}")
async def remove_from_watchlist(user_id: str, symbol: str) -> Dict[str, Any]:
    """Remove symbol from watchlist"""
    return {
        "user_id": user_id,
        "symbol": symbol,
        "removed_at": datetime.utcnow().isoformat(),
        "success": True,
    }


@app.get("/api/v1/alerts/{user_id}")
async def get_alerts(user_id: str) -> List[AlertConfig]:
    """Get user's alert configurations"""
    return [
        AlertConfig(alert_id="alert_1", metric="portfolio_value", condition="below", threshold=100000, enabled=True),
        AlertConfig(alert_id="alert_2", metric="daily_return", condition="above", threshold=2.0, enabled=True),
        AlertConfig(alert_id="alert_3", metric="volatility", condition="above", threshold=20.0, enabled=False),
    ]


@app.post("/api/v1/alerts/{user_id}")
async def create_alert(user_id: str, alert: AlertConfig) -> AlertConfig:
    """Create new alert"""
    return alert


@app.put("/api/v1/alerts/{user_id}/{alert_id}")
async def update_alert(user_id: str, alert_id: str, alert: AlertConfig) -> AlertConfig:
    """Update existing alert"""
    return alert


@app.delete("/api/v1/alerts/{user_id}/{alert_id}")
async def delete_alert(user_id: str, alert_id: str) -> Dict[str, Any]:
    """Delete alert"""
    return {"alert_id": alert_id, "deleted": True}


@app.get("/api/v1/layout/{user_id}")
async def get_dashboard_layout(user_id: str) -> DashboardLayout:
    """Get user's dashboard layout"""
    return DashboardLayout(
        layout_id="default",
        user_id=user_id,
        widgets=[],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@app.put("/api/v1/layout/{user_id}")
async def save_dashboard_layout(user_id: str, layout: DashboardLayout) -> DashboardLayout:
    """Save dashboard layout"""
    layout.updated_at = datetime.utcnow()
    return layout


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5201)
