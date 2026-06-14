"""
AssetMind Copilot Service
Personal AI investment assistant

Port: 5295

Provides natural language interface for investment queries, portfolio analysis,
recommendations, and actionable insights. Acts as a personal AI assistant
for investors.

Version: 1.0.0
"""

import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
import random

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind Copilot",
    description="Personal AI investment assistant",
    version="1.0.0",
)


# ============================================================================
# Enums
# ============================================================================

class ActionType(str, Enum):
    RESEARCH = "research"
    MONITOR = "monitor"
    TRADE = "trade"
    ALERT = "alert"
    REVIEW = "review"
    LEARN = "learn"


class ActionPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ActionStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DISMISSED = "dismissed"


class InsightType(str, Enum):
    OPPORTUNITY = "opportunity"
    RISK = "risk"
    RECOMMENDATION = "recommendation"
    ALERT = "alert"
    NEWS = "news"
    ANALYSIS = "analysis"


class QueryCategory(str, Enum):
    PORTFOLIO = "portfolio"
    STOCK = "stock"
    MARKET = "market"
    NEWS = "news"
    ALERTS = "alerts"
    GENERAL = "general"


# ============================================================================
# Pydantic Models - Actions
# ============================================================================

class ActionItem(BaseModel):
    """An actionable item for the user."""
    action_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ActionType
    title: str
    description: str
    priority: ActionPriority = ActionPriority.MEDIUM
    status: ActionStatus = ActionStatus.PENDING

    # Details
    symbol: Optional[str] = None
    action_details: Dict[str, Any] = {}

    # Timing
    due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    # Learning
    learning_context: Optional[str] = None

    class Config:
        from_attributes = True


class ActionCompletionRequest(BaseModel):
    """Request to complete an action."""
    action_id: str
    notes: Optional[str] = None


# ============================================================================
# Pydantic Models - Insights
# ============================================================================

class Insight(BaseModel):
    """An insight or recommendation."""
    insight_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: InsightType
    title: str
    content: str
    confidence: float = Field(..., ge=0.0, le=1.0)

    # Context
    symbol: Optional[str] = None
    category: QueryCategory = QueryCategory.GENERAL
    tags: List[str] = []

    # Actions
    suggested_actions: List[str] = []
    related_symbols: List[str] = []

    # Metadata
    source: str = "copilot"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# Pydantic Models - Dashboard
# ============================================================================

class PortfolioSummary(BaseModel):
    """Portfolio summary for dashboard."""
    total_value: float
    daily_change: float
    daily_change_pct: float
    ytd_return: float

    # Allocation
    stocks_pct: float = 0.0
    bonds_pct: float = 0.0
    cash_pct: float = 0.0
    crypto_pct: float = 0.0
    other_pct: float = 0.0

    # Risk
    portfolio_beta: float = 1.0
    volatility: float = 0.0
    sharpe_ratio: float = 0.0

    # Positions
    total_positions: int = 0
    top_performers: List[Dict[str, Any]] = []
    underperformers: List[Dict[str, Any]] = []


class MarketOverview(BaseModel):
    """Market overview for dashboard."""
    market_status: str = "open"
    major_indices: List[Dict[str, Any]] = []
    sector_performance: List[Dict[str, Any]] = []
    top_movers: List[Dict[str, Any]] = []
    vix: float = 15.0
    fear_greed: str = "neutral"


class AlertSummary(BaseModel):
    """Alert summary for dashboard."""
    total_alerts: int = 0
    urgent: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    recent_alerts: List[Dict[str, Any]] = []


class DashboardData(BaseModel):
    """Complete dashboard data."""
    user_id: Optional[str] = None
    portfolio: PortfolioSummary
    market: MarketOverview
    alerts: AlertSummary

    # Quick stats
    watchlist_count: int = 0
    pending_actions: int = 0
    insights_count: int = 0

    # Timestamp
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Pydantic Models - Copilot Queries
# ============================================================================

class CopilotQuery(BaseModel):
    """User query to copilot."""
    query_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    query: str
    category: QueryCategory = QueryCategory.GENERAL

    # Context
    context: Optional[Dict[str, Any]] = None
    include_actions: bool = True
    include_insights: bool = True

    # Response
    response: Optional[str] = None
    confidence: float = 0.0
    actions: List[ActionItem] = []
    related_insights: List[Insight] = []

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    response_time_ms: int = 0

    class Config:
        from_attributes = True


# ============================================================================
# Request/Response Models
# ============================================================================

class QueryRequest(BaseModel):
    """Request for copilot query."""
    query: str = Field(..., min_length=1, max_length=500)
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class InsightRequest(BaseModel):
    """Request for specific insights."""
    insight_type: Optional[InsightType] = None
    symbol: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=100)


# ============================================================================
# In-Memory Storage
# ============================================================================

# Storage
actions_db: Dict[str, ActionItem] = {}
insights_db: Dict[str, Insight] = {}
queries_db: Dict[str, CopilotQuery] = {}

# Initialize sample data
def init_sample_data():
    """Initialize sample actions and insights."""
    # Sample actions
    sample_actions = [
        ActionItem(
            type=ActionType.REVIEW,
            title="Review NVDA earnings results",
            description="Q4 earnings beat expectations. Review position sizing.",
            priority=ActionPriority.HIGH,
            symbol="NVDA",
            due_date=datetime.utcnow() + timedelta(days=1),
        ),
        ActionItem(
            type=ActionType.MONITOR,
            title="Watch MSFT support level",
            description="Monitor $380 support for potential entry.",
            priority=ActionPriority.MEDIUM,
            symbol="MSFT",
            due_date=datetime.utcnow() + timedelta(days=3),
        ),
        ActionItem(
            type=ActionType.RESEARCH,
            title="Research AI semiconductor sector",
            description="Understand key players and trends in AI chips.",
            priority=ActionPriority.LOW,
            due_date=datetime.utcnow() + timedelta(days=7),
        ),
        ActionItem(
            type=ActionType.TRADE,
            title="Rebalance portfolio",
            description="Tech allocation exceeded target by 5%. Consider rebalancing.",
            priority=ActionPriority.HIGH,
            due_date=datetime.utcnow() + timedelta(hours=12),
        ),
    ]

    for action in sample_actions:
        actions_db[action.action_id] = action

    # Sample insights
    sample_insights = [
        Insight(
            type=InsightType.OPPORTUNITY,
            title="NVDA momentum building",
            content="Strong earnings and AI tailwinds support continued upside.",
            confidence=0.82,
            symbol="NVDA",
            category=QueryCategory.STOCK,
            tags=["earnings", "AI", "momentum"],
            suggested_actions=["Consider adding to position", "Set price alerts"],
        ),
        Insight(
            type=InsightType.RISK,
            title="Interest rate concerns",
            content="Fed meeting next week could impact growth stocks.",
            confidence=0.75,
            category=QueryCategory.MARKET,
            tags=["macro", "Fed", "risk"],
            suggested_actions=["Review sector exposure", "Consider hedging"],
        ),
        Insight(
            type=InsightType.RECOMMENDATION,
            title="Diversify into healthcare",
            content="Healthcare sector showing strength. Consider adding exposure.",
            confidence=0.70,
            category=QueryCategory.PORTFOLIO,
            tags=["sectors", "healthcare", "allocation"],
            suggested_actions=["Research healthcare ETFs", "Review sector allocation"],
        ),
        Insight(
            type=InsightType.NEWS,
            title="Merger announced in tech",
            content="Major acquisition could impact sector dynamics.",
            confidence=0.85,
            symbol="TECH",
            category=QueryCategory.NEWS,
            tags=["M&A", "tech", "news"],
            suggested_actions=["Monitor related holdings"],
        ),
    ]

    for insight in sample_insights:
        insights_db[insight.insight_id] = insight


# Initialize on module load
init_sample_data()


# ============================================================================
# Helper Functions
# ============================================================================

def generate_response(query: str, context: Optional[Dict[str, Any]]) -> tuple[str, float]:
    """Generate a response to a query."""
    query_lower = query.lower()

    if any(kw in query_lower for kw in ["portfolio", "my investments", "holdings"]):
        return "Based on your portfolio, you have a balanced allocation with 65% stocks, 25% bonds, and 10% cash. Your tech exposure is concentrated in AAPL, MSFT, and NVDA. Consider diversifying into healthcare and energy sectors.", 0.88

    elif any(kw in query_lower for kw in ["buy", "invest", "stock"]):
        return "Looking at current market conditions and your risk profile, I'd recommend researching NVDA for its AI momentum, AAPL for stability, and AMZN for e-commerce strength. Each aligns differently with your investment goals.", 0.82

    elif any(kw in query_lower for kw in ["risk", "volatility", "concern"]):
        return "Your portfolio shows moderate risk with a beta of 1.15. Consider reducing tech concentration and adding defensive positions. Monitor VIX levels for market stress signals.", 0.85

    elif any(kw in query_lower for kw in ["market", "market conditions", "economy"]):
        return "Current market is in a bull phase with low volatility (VIX at 14.25). Growth stocks are outperforming. Monitor Fed policy and interest rate signals for potential rotation.", 0.80

    else:
        return f"I've analyzed your query about '{query[:50]}...'. Based on available data, I recommend monitoring key indicators and reviewing your portfolio allocation. Would you like more specific recommendations?", 0.75


def generate_suggested_actions(query: str) -> List[ActionItem]:
    """Generate suggested action items based on query."""
    actions = []
    query_lower = query.lower()

    if "buy" in query_lower or "invest" in query_lower:
        actions.append(ActionItem(
            type=ActionType.RESEARCH,
            title="Research recommended stocks",
            description="Review fundamentals and technicals before investing",
            priority=ActionPriority.MEDIUM,
        ))

    if "portfolio" in query_lower:
        actions.append(ActionItem(
            type=ActionType.REVIEW,
            title="Review portfolio allocation",
            description="Ensure alignment with investment goals",
            priority=ActionPriority.HIGH,
        ))

    if "risk" in query_lower:
        actions.append(ActionItem(
            type=ActionType.ALERT,
            title="Set risk alerts",
            description="Monitor portfolio volatility and drawdowns",
            priority=ActionPriority.MEDIUM,
        ))

    return actions[:3]


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    pending_actions = sum(1 for a in actions_db.values() if a.status == ActionStatus.PENDING)
    return {
        "status": "healthy",
        "service": "assetmind-copilot",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "total_actions": len(actions_db),
        "pending_actions": pending_actions,
        "total_insights": len(insights_db),
        "total_queries": len(queries_db),
    }


# ============================================================================
# Dashboard Endpoints
# ============================================================================

@app.get("/api/dashboard", response_model=DashboardData)
async def get_dashboard(user_id: Optional[str] = None):
    """Get complete dashboard data."""
    # Generate portfolio summary
    portfolio = PortfolioSummary(
        total_value=125000.00,
        daily_change=1250.00,
        daily_change_pct=1.01,
        ytd_return=18.5,
        stocks_pct=65.0,
        bonds_pct=25.0,
        cash_pct=10.0,
        portfolio_beta=1.15,
        volatility=16.5,
        sharpe_ratio=1.25,
        total_positions=12,
        top_performers=[
            {"symbol": "NVDA", "change_pct": 5.2},
            {"symbol": "AAPL", "change_pct": 2.1},
        ],
        underperformers=[
            {"symbol": "META", "change_pct": -1.8},
        ],
    )

    # Market overview
    market = MarketOverview(
        market_status="open",
        major_indices=[
            {"symbol": "SPX", "price": 5234.18, "change": 0.29},
            {"symbol": "NDX", "price": 18345.67, "change": -0.25},
        ],
        sector_performance=[
            {"sector": "Technology", "change": 1.2},
            {"sector": "Healthcare", "change": -0.3},
        ],
        top_movers=[
            {"symbol": "NVDA", "change_pct": 5.2},
            {"symbol": "AMD", "change_pct": 3.8},
        ],
        vix=14.25,
        fear_greed="greed",
    )

    # Alerts summary
    alerts = AlertSummary(
        total_alerts=5,
        urgent=0,
        high=2,
        medium=2,
        low=1,
        recent_alerts=[
            {"type": "price", "symbol": "NVDA", "message": "Up 5% today"},
            {"type": "earnings", "symbol": "MSFT", "message": "Earnings next week"},
        ],
    )

    return DashboardData(
        user_id=user_id,
        portfolio=portfolio,
        market=market,
        alerts=alerts,
        watchlist_count=8,
        pending_actions=sum(1 for a in actions_db.values() if a.status == ActionStatus.PENDING),
        insights_count=len(insights_db),
    )


@app.get("/api/portfolio-summary", response_model=PortfolioSummary)
async def get_portfolio_summary(user_id: Optional[str] = None):
    """Get portfolio summary."""
    return PortfolioSummary(
        total_value=125000.00,
        daily_change=1250.00,
        daily_change_pct=1.01,
        ytd_return=18.5,
        stocks_pct=65.0,
        bonds_pct=25.0,
        cash_pct=10.0,
        portfolio_beta=1.15,
        volatility=16.5,
        sharpe_ratio=1.25,
        total_positions=12,
        top_performers=[{"symbol": "NVDA", "change_pct": 5.2}],
        underperformers=[{"symbol": "META", "change_pct": -1.8}],
    )


@app.get("/api/market-overview", response_model=MarketOverview)
async def get_market_overview():
    """Get market overview."""
    return MarketOverview(
        market_status="open",
        major_indices=[
            {"symbol": "SPX", "price": 5234.18, "change": 0.29},
            {"symbol": "NDX", "price": 18345.67, "change": -0.25},
            {"symbol": "DJI", "price": 39127.14, "change": 0.23},
        ],
        sector_performance=[
            {"sector": "Technology", "change": 1.2},
            {"sector": "Healthcare", "change": -0.3},
            {"sector": "Financials", "change": 0.8},
        ],
        top_movers=[
            {"symbol": "NVDA", "change_pct": 5.2},
            {"symbol": "AMD", "change_pct": 3.8},
        ],
        vix=14.25,
        fear_greed="greed",
    )


# ============================================================================
# Action Item Endpoints
# ============================================================================

@app.get("/api/action-items", response_model=List[ActionItem])
async def get_action_items(
    status: Optional[ActionStatus] = None,
    priority: Optional[ActionPriority] = None,
    symbol: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """Get action items."""
    results = list(actions_db.values())

    if status:
        results = [a for a in results if a.status == status]
    if priority:
        results = [a for a in results if a.priority == priority]
    if symbol:
        results = [a for a in results if a.symbol == symbol.upper()]

    results.sort(key=lambda a: (a.priority.value, a.created_at))
    return results[:limit]


@app.post("/api/action-items", response_model=ActionItem, status_code=201)
async def create_action_item(action: ActionItem):
    """Create a new action item."""
    actions_db[action.action_id] = action
    return action


@app.put("/api/action-items/{action_id}/complete", response_model=ActionItem)
async def complete_action(action_id: str, request: ActionCompletionRequest):
    """Mark an action as completed."""
    if action_id not in actions_db:
        raise HTTPException(status_code=404, detail="Action not found")

    action = actions_db[action_id]
    action.status = ActionStatus.COMPLETED
    action.completed_at = datetime.utcnow()
    if request.notes:
        action.action_details["completion_notes"] = request.notes

    return action


@app.delete("/api/action-items/{action_id}", status_code=204)
async def delete_action_item(action_id: str):
    """Delete an action item."""
    if action_id not in actions_db:
        raise HTTPException(status_code=404, detail="Action not found")
    del actions_db[action_id]


# ============================================================================
# Insights Endpoints
# ============================================================================

@app.get("/api/insights", response_model=List[Insight])
async def get_insights(
    insight_type: Optional[InsightType] = None,
    symbol: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """Get insights."""
    results = list(insights_db.values())

    if insight_type:
        results = [i for i in results if i.type == insight_type]
    if symbol:
        results = [i for i in results if i.symbol == symbol.upper()]

    results.sort(key=lambda i: i.created_at, reverse=True)
    return results[:limit]


@app.post("/api/insights", response_model=Insight, status_code=201)
async def create_insight(insight: Insight):
    """Create a new insight."""
    insights_db[insight.insight_id] = insight
    return insight


# ============================================================================
# Query Endpoints
# ============================================================================

@app.post("/api/query", response_model=CopilotQuery, status_code=201)
async def process_query(request: QueryRequest):
    """Process a user query."""
    start_time = datetime.utcnow()

    # Generate response
    response, confidence = generate_response(request.query, request.context)

    # Generate suggested actions
    actions = generate_suggested_actions(request.query)
    for action in actions:
        actions_db[action.action_id] = action

    # Create query record
    query = CopilotQuery(
        user_id=request.user_id,
        query=request.query,
        context=request.context,
        response=response,
        confidence=confidence,
        actions=actions,
    )

    end_time = datetime.utcnow()
    query.response_time_ms = int((end_time - start_time).total_seconds() * 1000)

    queries_db[query.query_id] = query
    return query


@app.get("/api/queries", response_model=List[CopilotQuery])
async def get_query_history(limit: int = Query(20, ge=1, le=100)):
    """Get query history."""
    results = sorted(queries_db.values(), key=lambda q: q.created_at, reverse=True)
    return results[:limit]


@app.get("/api/queries/{query_id}", response_model=CopilotQuery)
async def get_query(query_id: str):
    """Get a specific query."""
    if query_id not in queries_db:
        raise HTTPException(status_code=404, detail="Query not found")
    return queries_db[query_id]


# ============================================================================
# Watchlist Endpoints
# ============================================================================

@app.get("/api/watchlist")
async def get_watchlist():
    """Get user's watchlist."""
    return [
        {"symbol": "NVDA", "name": "NVIDIA", "added_at": "2024-01-15"},
        {"symbol": "AAPL", "name": "Apple", "added_at": "2024-01-10"},
        {"symbol": "MSFT", "name": "Microsoft", "added_at": "2024-01-08"},
        {"symbol": "AMD", "name": "AMD", "added_at": "2024-01-05"},
        {"symbol": "GOOGL", "name": "Alphabet", "added_at": "2024-01-02"},
    ]


@app.post("/api/watchlist/{symbol}")
async def add_to_watchlist(symbol: str):
    """Add symbol to watchlist."""
    return {"symbol": symbol.upper(), "added_at": datetime.utcnow().isoformat()}


@app.delete("/api/watchlist/{symbol}")
async def remove_from_watchlist(symbol: str):
    """Remove symbol from watchlist."""
    return {"removed": symbol.upper()}


# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    print("Starting AssetMind Copilot Service on port 5295")
    uvicorn.run(app, host="0.0.0.0", port=5295)
