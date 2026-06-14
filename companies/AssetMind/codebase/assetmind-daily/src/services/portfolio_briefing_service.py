"""
Portfolio Briefing Service
Generate personalized briefing for user's portfolio
Port: 5172
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import random

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Portfolio Briefing Service", version="1.0.0", docs_url="/docs")


class PositionStatus(str, Enum):
    GAINING = "gaining"
    LOSING = "losing"
    NEUTRAL = "neutral"
    ACTION_NEEDED = "action_needed"


class PositionAlert(BaseModel):
    alert_id: str
    symbol: str
    alert_type: str
    severity: str
    message: str
    current_value: float
    change_percent: float
    action_required: bool


class PortfolioPosition(BaseModel):
    symbol: str
    quantity: float
    avg_cost: float
    current_price: float
    market_value: float
    cost_basis: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    day_change: float
    day_change_percent: float
    weight: float  # Portfolio weight percentage
    status: PositionStatus
    alerts: List[PositionAlert] = Field(default_factory=list)


class PortfolioMetrics(BaseModel):
    total_value: float
    total_cost: float
    total_pnl: float
    total_pnl_percent: float
    day_change: float
    day_change_percent: float
    cash_balance: float
    buying_power: float
    margin_used: float
    margin_available: float


class RiskMetrics(BaseModel):
    portfolio_beta: float
    sharpe_ratio: float
    volatility: float
    max_drawdown: float
    value_at_risk_95: float
    value_at_risk_99: float
    diversification_score: float


class PortfolioBriefing(BaseModel):
    briefing_id: str
    user_id: Optional[str]
    date: str
    positions: List[PortfolioPosition]
    metrics: PortfolioMetrics
    risk_metrics: RiskMetrics
    summary: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    generated_at: datetime


class PortfolioBriefingService:
    """Generate personalized portfolio briefings"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Portfolio Briefing Service"
        self.port = 5172
        self.version = "1.0.0"
        self._briefings: Dict[str, PortfolioBriefing] = {}
        self._briefing_count = 0

    def _generate_briefing_id(self) -> str:
        """Generate unique briefing ID"""
        self._briefing_count += 1
        return f"portfolio_briefing_{datetime.utcnow().timestamp()}_{self._briefing_count}"

    def _generate_position(
        self,
        symbol: str,
        portfolio_total: float
    ) -> PortfolioPosition:
        """Generate portfolio position data"""
        quantity = random.uniform(10, 500)
        avg_cost = random.uniform(50, 300)
        current_price = avg_cost * random.uniform(0.85, 1.20)
        market_value = quantity * current_price
        cost_basis = quantity * avg_cost
        unrealized_pnl = market_value - cost_basis
        unrealized_pnl_pct = (unrealized_pnl / cost_basis) * 100
        day_change = market_value * random.uniform(-0.03, 0.05)
        day_change_pct = (day_change / market_value) * 100

        # Determine status
        if unrealized_pnl_pct > 2:
            status = PositionStatus.GAINING
        elif unrealized_pnl_pct < -2:
            status = PositionStatus.LOSING
        else:
            status = PositionStatus.NEUTRAL

        # Generate alerts
        alerts = []
        if unrealized_pnl_pct > 15:
            alerts.append(PositionAlert(
                alert_id=f"alert_{symbol}_profit",
                symbol=symbol,
                alert_type="TAKE_PROFIT",
                severity="HIGH",
                message=f"{symbol} up {unrealized_pnl_pct:.1f}%, consider taking profits",
                current_value=market_value,
                change_percent=unrealized_pnl_pct,
                action_required=True
            ))
        elif unrealized_pnl_pct < -10:
            alerts.append(PositionAlert(
                alert_id=f"alert_{symbol}_loss",
                symbol=symbol,
                alert_type="STOP_LOSS",
                severity="CRITICAL",
                message=f"{symbol} down {abs(unrealized_pnl_pct):.1f}%, review position",
                current_value=market_value,
                change_percent=unrealized_pnl_pct,
                action_required=True
            ))
        elif abs(day_change_pct) > 3:
            alerts.append(PositionAlert(
                alert_id=f"alert_{symbol}_move",
                symbol=symbol,
                alert_type="VOLATILITY",
                severity="MEDIUM",
                message=f"{symbol} moved {day_change_pct:.1f}% today",
                current_value=market_value,
                change_percent=day_change_pct,
                action_required=False
            ))

        return PortfolioPosition(
            symbol=symbol,
            quantity=round(quantity, 2),
            avg_cost=round(avg_cost, 2),
            current_price=round(current_price, 2),
            market_value=round(market_value, 2),
            cost_basis=round(cost_basis, 2),
            unrealized_pnl=round(unrealized_pnl, 2),
            unrealized_pnl_percent=round(unrealized_pnl_pct, 2),
            day_change=round(day_change, 2),
            day_change_percent=round(day_change_pct, 2),
            weight=round((market_value / portfolio_total) * 100, 2),
            status=status,
            alerts=alerts
        )

    def _generate_metrics(self, positions: List[PortfolioPosition]) -> PortfolioMetrics:
        """Calculate portfolio metrics"""
        total_value = sum(p.market_value for p in positions)
        total_cost = sum(p.cost_basis for p in positions)
        total_pnl = total_value - total_cost
        total_pnl_pct = (total_pnl / total_cost) * 100 if total_cost > 0 else 0
        day_change = sum(p.day_change for p in positions)
        day_change_pct = (day_change / total_value) * 100 if total_value > 0 else 0

        return PortfolioMetrics(
            total_value=round(total_value, 2),
            total_cost=round(total_cost, 2),
            total_pnl=round(total_pnl, 2),
            total_pnl_percent=round(total_pnl_pct, 2),
            day_change=round(day_change, 2),
            day_change_percent=round(day_change_pct, 2),
            cash_balance=random.uniform(10000, 100000),
            buying_power=random.uniform(20000, 200000),
            margin_used=random.uniform(0, total_value * 0.3),
            margin_available=random.uniform(10000, 100000)
        )

    def _generate_risk_metrics(self) -> RiskMetrics:
        """Generate risk metrics"""
        return RiskMetrics(
            portfolio_beta=round(random.uniform(0.8, 1.4), 2),
            sharpe_ratio=round(random.uniform(0.5, 2.5), 2),
            volatility=round(random.uniform(10, 30), 2),
            max_drawdown=round(random.uniform(5, 20), 2),
            value_at_risk_95=round(random.uniform(1000, 10000), 2),
            value_at_risk_99=round(random.uniform(2000, 20000), 2),
            diversification_score=round(random.uniform(60, 95), 1)
        )

    async def generate_briefing(
        self,
        positions: List[Dict[str, Any]],
        user_id: Optional[str] = None
    ) -> PortfolioBriefing:
        """Generate portfolio briefing"""
        briefing_id = self._generate_briefing_id()

        # Calculate portfolio total first
        portfolio_positions = []
        for pos in positions:
            symbol = pos.get("symbol", "UNKNOWN")
            quantity = pos.get("quantity", 0)
            avg_cost = pos.get("avg_cost", 100)
            current_price = pos.get("current_price", avg_cost * 1.05)
            market_value = quantity * current_price
            portfolio_positions.append({
                "symbol": symbol,
                "quantity": quantity,
                "avg_cost": avg_cost,
                "current_price": current_price,
                "market_value": market_value
            })

        total_portfolio_value = sum(p["market_value"] for p in portfolio_positions)

        # Generate position objects
        pos_objects = []
        for p in portfolio_positions:
            position = self._generate_position(p["symbol"], total_portfolio_value)
            position.quantity = p["quantity"]
            position.avg_cost = p["avg_cost"]
            position.current_price = p["current_price"]
            position.market_value = p["market_value"]
            position.cost_basis = p["quantity"] * p["avg_cost"]
            position.unrealized_pnl = position.market_value - position.cost_basis
            position.unrealized_pnl_percent = (position.unrealized_pnl / position.cost_basis) * 100 if position.cost_basis > 0 else 0
            position.weight = (position.market_value / total_portfolio_value) * 100
            pos_objects.append(position)

        # Calculate metrics
        metrics = self._generate_metrics(pos_objects)
        risk_metrics = self._generate_risk_metrics()

        # Generate recommendations
        recommendations = []

        # Concentration warning
        top_position = max(pos_objects, key=lambda p: p.weight)
        if top_position.weight > 25:
            recommendations.append({
                "type": "REBALANCE",
                "priority": "HIGH",
                "title": "Portfolio Concentration Risk",
                "description": f"{top_position.symbol} represents {top_position.weight:.1f}% of portfolio. Consider rebalancing.",
                "action": "Review and potentially reduce position"
            })

        # Loss leaders
        losing_positions = [p for p in pos_objects if p.status == PositionStatus.LOSING and p.unrealized_pnl_percent < -5]
        if losing_positions:
            recommendations.append({
                "type": "REVIEW_LOSSES",
                "priority": "MEDIUM",
                "title": "Review Losing Positions",
                "description": f"{len(losing_positions)} positions showing significant losses",
                "action": "Assess whether to hold, sell, or average down"
            })

        # Cash position
        cash_percent = (metrics.cash_balance / (metrics.total_value + metrics.cash_balance)) * 100
        if cash_percent > 20:
            recommendations.append({
                "type": "DEPLOY_CASH",
                "priority": "MEDIUM",
                "title": "High Cash Position",
                "description": f"{cash_percent:.1f}% of capital in cash. Consider deployment.",
                "action": "Identify investment opportunities"
            })

        # Summary
        summary = {
            "total_positions": len(pos_objects),
            "winning_positions": len([p for p in pos_objects if p.status == PositionStatus.GAINING]),
            "losing_positions": len([p for p in pos_objects if p.status == PositionStatus.LOSING]),
            "positions_requiring_action": len([p for p in pos_objects if p.status == PositionStatus.ACTION_NEEDED]),
            "overall_status": "PROFITABLE" if metrics.total_pnl > 0 else "LOSING"
        }

        briefing = PortfolioBriefing(
            briefing_id=briefing_id,
            user_id=user_id,
            date=datetime.utcnow().strftime("%Y-%m-%d"),
            positions=pos_objects,
            metrics=metrics,
            risk_metrics=risk_metrics,
            summary=summary,
            recommendations=recommendations,
            generated_at=datetime.utcnow()
        )

        self._briefings[briefing_id] = briefing
        logger.info(f"Generated portfolio briefing: {briefing_id}")

        return briefing

    async def get_briefing(self, briefing_id: str) -> Optional[PortfolioBriefing]:
        """Get briefing by ID"""
        return self._briefings.get(briefing_id)


service = PortfolioBriefingService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "briefings_generated": service._briefing_count
    }


@app.post("/api/v1/briefing")
async def generate_briefing(request: Dict[str, Any]):
    """Generate portfolio briefing"""
    return await service.generate_briefing(
        positions=request["positions"],
        user_id=request.get("user_id")
    )


@app.get("/api/v1/briefing/{briefing_id}")
async def get_briefing(briefing_id: str):
    """Get briefing by ID"""
    briefing = await service.get_briefing(briefing_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return briefing


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5172)