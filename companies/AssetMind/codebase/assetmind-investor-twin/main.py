"""
AssetMind Investor Twin Service
Individual investor behavior analysis

Port: 5005

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
    title="AssetMind Investor Twin",
    description="Individual investor behavior analysis service",
    version="1.0.0",
)

# ============================================================================
# Enums
# ============================================================================

class InvestorType(str, Enum):
    RETAIL = "retail"
    INSTITUTIONAL = "institutional"
    HEDGE_FUND = "hedge_fund"
    PENSION_FUND = "pension_fund"
    SOVEREIGN_WEALTH = "sovereign_wealth"
    FAMILY_OFFICE = "family_office"
    ANNUITY = "annuity"
    INSURANCE = "insurance"

class RiskTolerance(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    SPECULATIVE = "speculative"

class InvestmentHorizon(str, Enum):
    SHORT_TERM = "short_term"  # < 1 year
    MEDIUM_TERM = "medium_term"  # 1-5 years
    LONG_TERM = "long_term"  # 5-10 years
    VERY_LONG_TERM = "very_long_term"  # 10+ years

class TradingStyle(str, Enum):
    DAY_TRADER = "day_trader"
    SWING_TRADER = "swing_trader"
    POSITION_TRADER = "position_trader"
    VALUE_INVESTOR = "value_investor"
    GROWTH_INVESTOR = "growth_investor"
    INDEX_TRACKER = "index_tracker"
    QUANTITATIVE = "quantitative"

# ============================================================================
# Pydantic Models - Profile
# ============================================================================

class InvestmentPreferences(BaseModel):
    sectors: List[str] = []
    asset_classes: List[str] = []
    excluded_sectors: List[str] = []
    max_position_size: float = 10.0  # % of portfolio
    preferred_countries: List[str] = ["US"]
    esg_preference: bool = False
    thematic_interests: List[str] = []

class RiskProfile(BaseModel):
    risk_tolerance: RiskTolerance = RiskTolerance.MODERATE
    investment_horizon: InvestmentHorizon = InvestmentHorizon.LONG_TERM
    max_loss_tolerance: float = 20.0  # % willing to lose
    target_return: float = 10.0  # % annual target
    liquidity_need: str = "medium"  # low, medium, high

class BrokerageInfo(BaseModel):
    broker_name: str
    account_type: str
    margin_enabled: bool = False
    options_approved: bool = False
    crypto_enabled: bool = False

# ============================================================================
# Pydantic Models - Behavior Analysis
# ============================================================================

class TradingMetrics(BaseModel):
    total_trades: int = 0
    trades_per_month: float = 0.0
    win_rate: float = 0.0
    avg_holding_period: int = 0  # days
    avg_profit_per_trade: float = 0.0
    avg_loss_per_trade: float = 0.0
    profit_factor: float = 0.0
    largest_win: float = 0.0
    largest_loss: float = 0.0

class BehavioralMetrics(BaseModel):
    patience_score: float = 0.0  # 0-100
    risk_appetite: float = 0.0  # 0-100
    discipline_score: float = 0.0  # 0-100
    overconfidence_index: float = 0.0  # 0-100
    herding_tendency: float = 0.0  # 0-100
    loss_aversion: float = 0.0  # 0-100
    recency_bias: float = 0.0  # 0-100

class SectorAllocation(BaseModel):
    sector: str
    weight: float
    avg_holding_period: int = 0
    success_rate: float = 0.0

class TopHolding(BaseModel):
    symbol: str
    name: str
    weight: float
    avg_cost: float
    current_price: float
    unrealized_pnl: float
    unrealized_pnl_pct: float

# ============================================================================
# Pydantic Models - Investor Twin Entity
# ============================================================================

class PerformanceHistory(BaseModel):
    period: str  # 1m, 3m, 6m, 1y, 3y, 5y
    return_pct: float
    benchmark_return: float
    excess_return: float

class Goal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    target_amount: float
    current_amount: float
    target_date: datetime
    priority: str = "medium"  # low, medium, high
    progress_pct: float = 0.0

class InvestorTwin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str

    # Classification
    investor_type: InvestorType = InvestorType.RETAIL
    trading_style: TradingStyle = TradingStyle.POSITION_TRADER

    # Profile
    risk_profile: RiskProfile = Field(default_factory=RiskProfile)
    preferences: InvestmentPreferences = Field(default_factory=InvestmentPreferences)
    brokerage: Optional[BrokerageInfo] = None

    # Portfolio
    total_value: float = 0.0
    cash_balance: float = 0.0
    top_holdings: List[TopHolding] = []
    sector_allocations: List[SectorAllocation] = []

    # Performance
    performance_history: List[PerformanceHistory] = []
    total_return: float = 0.0
    total_return_pct: float = 0.0
    ytd_return: float = 0.0

    # Behavior
    trading_metrics: TradingMetrics = Field(default_factory=TradingMetrics)
    behavioral_metrics: BehavioralMetrics = Field(default_factory=BehavioralMetrics)

    # Goals
    goals: List[Goal] = []

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

# ============================================================================
# Request/Response Models
# ============================================================================

class InvestorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str
    investor_type: InvestorType = InvestorType.RETAIL
    trading_style: TradingStyle = TradingStyle.POSITION_TRADER
    initial_value: float = Field(default=0.0, ge=0)

class InvestorUpdate(BaseModel):
    name: Optional[str] = None
    investor_type: Optional[InvestorType] = None
    trading_style: Optional[TradingStyle] = None
    risk_tolerance: Optional[RiskTolerance] = None
    investment_horizon: Optional[InvestmentHorizon] = None

class AnalysisRequest(BaseModel):
    investor_id: str
    analysis_type: str = "behavior"  # behavior, performance, risk, recommendations

class Recommendation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # allocation, rebalancing, risk, tax
    title: str
    description: str
    priority: str  # low, medium, high
    expected_impact: str
    action_items: List[str] = []

# ============================================================================
# In-Memory Storage
# ============================================================================

investors_db: Dict[str, InvestorTwin] = {}

def create_sample_investor(name: str, investor_type: InvestorType, trading_style: TradingStyle, initial: float) -> InvestorTwin:
    """Create a sample investor twin."""
    top_holdings = [
        TopHolding(symbol="AAPL", name="Apple Inc.", weight=25.0, avg_cost=150.00,
                   current_price=178.50, unrealized_pnl=2850.00, unrealized_pnl_pct=19.0),
        TopHolding(symbol="MSFT", name="Microsoft Corp.", weight=20.0, avg_cost=320.00,
                   current_price=378.90, unrealized_pnl=4417.50, unrealized_pnl_pct=18.41),
        TopHolding(symbol="GOOGL", name="Alphabet Inc.", weight=15.0, avg_cost=130.00,
                   current_price=141.20, unrealized_pnl=560.00, unrealized_pnl_pct=8.62),
        TopHolding(symbol="BTC", name="Bitcoin", weight=10.0, avg_cost=45000.00,
                   current_price=67500.00, unrealized_pnl=11250.00, unrealized_pnl_pct=50.0),
        TopHolding(symbol="ETH", name="Ethereum", weight=8.0, avg_cost=2800.00,
                   current_price=3450.00, unrealized_pnl=3250.00, unrealized_pnl_pct=23.21),
    ]

    sector_allocations = [
        SectorAllocation(sector="Technology", weight=60.0, avg_holding_period=90, success_rate=0.72),
        SectorAllocation(sector="Crypto", weight=18.0, avg_holding_period=45, success_rate=0.65),
        SectorAllocation(sector="Healthcare", weight=12.0, avg_holding_period=120, success_rate=0.68),
        SectorAllocation(sector="Finance", weight=10.0, avg_holding_period=60, success_rate=0.70),
    ]

    performance_history = [
        PerformanceHistory(period="1m", return_pct=2.5, benchmark_return=2.1, excess_return=0.4),
        PerformanceHistory(period="3m", return_pct=5.8, benchmark_return=5.2, excess_return=0.6),
        PerformanceHistory(period="6m", return_pct=12.3, benchmark_return=10.5, excess_return=1.8),
        PerformanceHistory(period="1y", return_pct=22.5, benchmark_return=18.0, excess_return=4.5),
        PerformanceHistory(period="3y", return_pct=45.2, benchmark_return=38.0, excess_return=7.2),
    ]

    goals = [
        Goal(name="Retirement Fund", target_amount=1000000.0, current_amount=350000.0,
             target_date=datetime.utcnow() + timedelta(days=3650), priority="high", progress_pct=35.0),
        Goal(name="House Down Payment", target_amount=150000.0, current_amount=85000.0,
             target_date=datetime.utcnow() + timedelta(days=730), priority="medium", progress_pct=56.7),
        Goal(name="Emergency Fund", target_amount=50000.0, current_amount=50000.0,
             target_date=datetime.utcnow() + timedelta(days=180), priority="high", progress_pct=100.0),
    ]

    investor = InvestorTwin(
        name=name,
        email=f"{name.lower().replace(' ', '.')}@example.com",
        investor_type=investor_type,
        trading_style=trading_style,
        risk_profile=RiskProfile(
            risk_tolerance=RiskTolerance.AGGRESSIVE,
            investment_horizon=InvestmentHorizon.LONG_TERM,
            max_loss_tolerance=25.0,
            target_return=15.0,
        ),
        preferences=InvestmentPreferences(
            sectors=["Technology", "Healthcare", "Crypto"],
            asset_classes=["stocks", "crypto", "etf"],
            max_position_size=25.0,
            thematic_interests=["AI", "Clean Energy", "Fintech"],
        ),
        total_value=initial or 150000.0,
        cash_balance=15000.0,
        top_holdings=top_holdings,
        sector_allocations=sector_allocations,
        performance_history=performance_history,
        total_return=28500.0,
        total_return_pct=19.0,
        ytd_return=12.5,
        trading_metrics=TradingMetrics(
            total_trades=156,
            trades_per_month=8.5,
            win_rate=0.62,
            avg_holding_period=45,
            avg_profit_per_trade=850.0,
            avg_loss_per_trade=420.0,
            profit_factor=2.02,
            largest_win=12500.0,
            largest_loss=-3500.0,
        ),
        behavioral_metrics=BehavioralMetrics(
            patience_score=65.0,
            risk_appetite=78.0,
            discipline_score=72.0,
            overconfidence_index=45.0,
            herding_tendency=35.0,
            loss_aversion=55.0,
            recency_bias=40.0,
        ),
        goals=goals,
    )

    investors_db[investor.id] = investor
    return investor

# Initialize sample investors
sample_investors = [
    ("John Smith", InvestorType.RETAIL, TradingStyle.POSITION_TRADER, 150000),
    ("Sarah Johnson", InvestorType.INSTITUTIONAL, TradingStyle.QUANTITATIVE, 5000000),
    ("Mike Chen", InvestorType.FAMILY_OFFICE, TradingStyle.VALUE_INVESTOR, 2500000),
]

for name, itype, style, initial in sample_investors:
    create_sample_investor(name, itype, style, initial)

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-investor-twin",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {
            "total_investors": len(investors_db),
            "total_aum": sum(inv.total_value for inv in investors_db.values()),
        },
    }

# ============================================================================
# Investor CRUD Endpoints
# ============================================================================

@app.post("/api/investors", response_model=InvestorTwin, status_code=201)
async def create_investor(request: InvestorCreate):
    """Create a new investor twin."""
    investor = InvestorTwin(
        name=request.name,
        email=request.email,
        investor_type=request.investor_type,
        trading_style=request.trading_style,
        total_value=request.initial_value,
        cash_balance=request.initial_value,
    )
    investors_db[investor.id] = investor
    return investor

@app.get("/api/investors", response_model=List[InvestorTwin])
async def list_investors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    investor_type: Optional[InvestorType] = None,
    trading_style: Optional[TradingStyle] = None,
):
    """List all investors with optional filtering."""
    investors = list(investors_db.values())

    if investor_type:
        investors = [i for i in investors if i.investor_type == investor_type]
    if trading_style:
        investors = [i for i in investors if i.trading_style == trading_style]

    return investors[skip : skip + limit]

@app.get("/api/investors/{investor_id}", response_model=InvestorTwin)
async def get_investor(investor_id: str):
    """Get investor details."""
    if investor_id not in investors_db:
        raise HTTPException(status_code=404, detail="Investor not found")
    return investors_db[investor_id]

@app.put("/api/investors/{investor_id}", response_model=InvestorTwin)
async def update_investor(investor_id: str, update: InvestorUpdate):
    """Update investor profile."""
    if investor_id not in investors_db:
        raise HTTPException(status_code=404, detail="Investor not found")

    investor = investors_db[investor_id]
    update_data = update.model_dump(exclude_unset=True)

    if "investor_type" in update_data:
        investor.investor_type = update_data["investor_type"]
    if "trading_style" in update_data:
        investor.trading_style = update_data["trading_style"]
    if "name" in update_data:
        investor.name = update_data["name"]
    if "risk_tolerance" in update_data:
        investor.risk_profile.risk_tolerance = update_data["risk_tolerance"]
    if "investment_horizon" in update_data:
        investor.risk_profile.investment_horizon = update_data["investment_horizon"]

    investor.updated_at = datetime.utcnow()
    return investor

@app.delete("/api/investors/{investor_id}", status_code=204)
async def delete_investor(investor_id: str):
    """Delete an investor."""
    if investor_id not in investors_db:
        raise HTTPException(status_code=404, detail="Investor not found")
    del investors_db[investor_id]

# ============================================================================
# Profile Endpoints
# ============================================================================

@app.get("/api/investors/{investor_id}/profile")
async def get_investor_profile(investor_id: str):
    """Get investor profile summary."""
    investor = await get_investor(investor_id)

    return {
        "id": investor.id,
        "name": investor.name,
        "type": investor.investor_type.value,
        "trading_style": investor.trading_style.value,
        "risk_profile": {
            "tolerance": investor.risk_profile.risk_tolerance.value,
            "horizon": investor.risk_profile.investment_horizon.value,
            "max_loss": investor.risk_profile.max_loss_tolerance,
        },
        "performance": {
            "total_return": investor.total_return,
            "total_return_pct": investor.total_return_pct,
            "ytd_return": investor.ytd_return,
        },
        "behavior": {
            "patience_score": investor.behavioral_metrics.patience_score,
            "risk_appetite": investor.behavioral_metrics.risk_appetite,
            "discipline_score": investor.behavioral_metrics.discipline_score,
        },
    }

@app.get("/api/investors/{investor_id}/behavior", response_model=BehavioralMetrics)
async def get_behavior_analysis(investor_id: str):
    """Get behavioral analysis metrics."""
    investor = await get_investor(investor_id)
    return investor.behavioral_metrics

@app.get("/api/investors/{investor_id}/trading", response_model=TradingMetrics)
async def get_trading_metrics(investor_id: str):
    """Get trading metrics."""
    investor = await get_investor(investor_id)
    return investor.trading_metrics

@app.get("/api/investors/{investor_id}/goals")
async def get_goals(investor_id: str):
    """Get investor goals."""
    investor = await get_investor(investor_id)
    return investor.goals

# ============================================================================
# Analysis Endpoints
# ============================================================================

@app.post("/api/analyze", response_model=Dict[str, Any])
async def analyze_investor(request: AnalysisRequest):
    """Analyze investor behavior and provide insights."""
    investor = await get_investor(request.investor_id)

    insights = {
        "investor_id": investor.id,
        "analysis_type": request.analysis_type,
        "insights": [],
        "recommendations": [],
    }

    # Behavioral insights
    if investor.behavioral_metrics.overconfidence_index > 60:
        insights["insights"].append({
            "type": "behavioral",
            "message": "High overconfidence detected - may be taking excessive risks",
            "severity": "warning",
        })

    if investor.behavioral_metrics.herding_tendency > 50:
        insights["insights"].append({
            "type": "behavioral",
            "message": "Strong herding tendency - consider independent research",
            "severity": "info",
        })

    if investor.trading_metrics.win_rate < 0.5:
        insights["insights"].append({
            "type": "performance",
            "message": "Win rate below 50% - review trading strategy",
            "severity": "warning",
        })

    # Recommendations
    if investor.cash_balance / investor.total_value < 0.05:
        insights["recommendations"].append({
            "category": "allocation",
            "title": "Low Cash Reserves",
            "description": "Consider maintaining 5-10% cash for opportunities",
            "priority": "medium",
        })

    if investor.behavioral_metrics.patience_score < 50:
        insights["recommendations"].append({
            "category": "behavior",
            "title": "Improve Patience",
            "description": "Consider longer holding periods for quality stocks",
            "priority": "medium",
        })

    insights["timestamp"] = datetime.utcnow().isoformat()
    return insights

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting AssetMind Investor Twin Service on port 5005")
    uvicorn.run(app, host="0.0.0.0", port=5005)