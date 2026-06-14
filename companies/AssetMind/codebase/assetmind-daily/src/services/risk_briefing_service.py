"""
Risk Briefing Service
Risk analysis and alerts briefing
Port: 5175
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import random

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Risk Briefing Service", version="1.0.0", docs_url="/docs")


class RiskLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class RiskCategory(str, Enum):
    MARKET = "market"
    CREDIT = "credit"
    LIQUIDITY = "liquidity"
    OPERATIONAL = "operational"
    GEOPOLITICAL = "geopolitical"
    SECTOR = "sector"
    CONCENTRATION = "concentration"
    VOLATILITY = "volatility"


class RiskAlert(BaseModel):
    alert_id: str
    risk_category: RiskCategory
    title: str
    description: str
    severity: RiskLevel
    affected_symbols: List[str] = Field(default_factory=list)
    impact_score: float  # 0-100
    probability: float  # 0-1
    time_horizon: str  # IMMEDIATE, SHORT, MEDIUM, LONG
    mitigation_suggestions: List[str]
    timestamp: datetime


class RiskMetric(BaseModel):
    metric_name: str
    current_value: float
    threshold: float
    status: RiskLevel
    trend: str  # IMPROVING, STABLE, WORSENING


class RiskBriefing(BaseModel):
    briefing_id: str
    date: str
    overall_risk_score: float  # 0-100
    risk_level: RiskLevel
    alerts: List[RiskAlert]
    metrics: List[RiskMetric]
    sector_risks: Dict[str, float]
    portfolio_risk_summary: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    generated_at: datetime


class RiskBriefingService:
    """Generate risk analysis briefings"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Risk Briefing Service"
        self.port = 5175
        self.version = "1.0.0"
        self._briefings: Dict[str, RiskBriefing] = {}
        self._briefing_count = 0

    def _generate_briefing_id(self) -> str:
        """Generate unique briefing ID"""
        self._briefing_count += 1
        return f"risk_briefing_{datetime.utcnow().timestamp()}_{self._briefing_count}"

    def _generate_alert(
        self,
        category: RiskCategory,
        severity: RiskLevel
    ) -> RiskAlert:
        """Generate risk alert"""
        alert_templates = {
            RiskCategory.MARKET: [
                ("Market Volatility Spike", "VIX elevated, expect increased market swings"),
                ("Sector Rotation Alert", "Money flowing from growth to value sectors"),
                ("Sentiment Extreme", "Fear/greed index showing extreme readings")
            ],
            RiskCategory.CREDIT: [
                ("Credit Spread Widening", "Corporate bond spreads expanding"),
                ("High Yield Stress", "Junk bond prices declining"),
                ("Counterparty Risk", "Increased default probability detected")
            ],
            RiskCategory.LIQUIDITY: [
                ("Low Volume Alert", "Trading volumes below average"),
                ("Bid-Ask Spread Widening", "Reduced liquidity in certain assets"),
                ("Market Depth Declining", "Order book depth decreasing")
            ],
            RiskCategory.GEOPOLITICAL: [
                ("Trade Tension Alert", "New tariffs announced"),
                ("Political Uncertainty", "Election/policy changes ahead"),
                ("Regional Conflict", "Geopolitical tensions affecting markets")
            ],
            RiskCategory.SECTOR: [
                ("Tech Sector Concentration", "Technology sector overweight detected"),
                ("Energy Price Risk", "Oil price volatility affecting energy stocks"),
                ("Financial Sector Exposure", "Elevated risk in financial holdings")
            ],
            RiskCategory.CONCENTRATION: [
                ("Portfolio Concentration", "Single stock exceeds safe weight"),
                ("Sector Concentration", "Overweight in volatile sector"),
                ("Geographic Concentration", "Heavy exposure to single region")
            ],
            RiskCategory.VOLATILITY: [
                ("High Volatility Alert", "Options markets pricing in large moves"),
                ("Gamma Squeeze Risk", "Potential for volatile price action"),
                ("Tail Risk Elevated", "Black swan probability increased")
            ]
        }

        templates = alert_templates.get(category, alert_templates[RiskCategory.MARKET])
        title, description = random.choice(templates)

        symbols = []
        if category == RiskCategory.SECTOR:
            symbols = [f"SECTOR_{random.randint(1, 5)}"]
        elif category == RiskCategory.CONCENTRATION:
            symbols = ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA"][:random.randint(1, 3)]

        return RiskAlert(
            alert_id=f"risk_{self._briefing_count}_{random.randint(1000, 9999)}",
            risk_category=category,
            title=title,
            description=description,
            severity=severity,
            affected_symbols=symbols,
            impact_score=random.uniform(30, 100) if severity == RiskLevel.CRITICAL else random.uniform(20, 80),
            probability=random.uniform(0.3, 0.9),
            time_horizon=random.choice(["IMMEDIATE", "SHORT", "MEDIUM", "LONG"]),
            mitigation_suggestions=[
                "Review position sizing",
                "Consider hedging strategies",
                "Diversify exposure",
                "Set stop-loss orders"
            ][:random.randint(2, 4)],
            timestamp=datetime.utcnow()
        )

    def _generate_metric(
        self,
        name: str,
        current: float,
        threshold: float,
        lower_is_worse: bool = True
    ) -> RiskMetric:
        """Generate risk metric"""
        if lower_is_worse:
            status = RiskLevel.CRITICAL if current > threshold * 1.5 else (
                RiskLevel.HIGH if current > threshold else (
                    RiskLevel.MEDIUM if current > threshold * 0.8 else RiskLevel.LOW
                )
            )
        else:
            status = RiskLevel.CRITICAL if current < threshold * 0.5 else (
                RiskLevel.HIGH if current < threshold else (
                    RiskLevel.MEDIUM if current < threshold * 1.2 else RiskLevel.LOW
                )
            )

        trend = random.choice(["IMPROVING", "STABLE", "WORSENING"])

        return RiskMetric(
            metric_name=name,
            current_value=round(current, 2),
            threshold=threshold,
            status=status,
            trend=trend
        )

    async def generate_briefing(self) -> RiskBriefing:
        """Generate risk briefing"""
        briefing_id = self._generate_briefing_id()

        # Generate alerts
        alerts = []

        # Critical alerts
        for _ in range(random.randint(0, 2)):
            alerts.append(self._generate_alert(
                random.choice(list(RiskCategory)),
                RiskLevel.CRITICAL
            ))

        # High alerts
        for _ in range(random.randint(1, 3)):
            alerts.append(self._generate_alert(
                random.choice(list(RiskCategory)),
                RiskLevel.HIGH
            ))

        # Medium alerts
        for _ in range(random.randint(2, 4)):
            alerts.append(self._generate_alert(
                random.choice(list(RiskCategory)),
                RiskLevel.MEDIUM
            ))

        # Sort by severity
        severity_order = {RiskLevel.CRITICAL: 0, RiskLevel.HIGH: 1, RiskLevel.MEDIUM: 2, RiskLevel.LOW: 3}
        alerts = sorted(alerts, key=lambda x: severity_order[x.severity])

        # Generate metrics
        metrics = [
            self._generate_metric("Portfolio Beta", random.uniform(0.8, 1.5), 1.2),
            self._generate_metric("Value at Risk (95%)", random.uniform(2, 8), 5),
            self._generate_metric("Sharpe Ratio", random.uniform(0.5, 2.5), 1.0, False),
            self._generate_metric("Max Drawdown", random.uniform(5, 25), 15, True),
            self._generate_metric("Volatility", random.uniform(10, 35), 20),
            self._generate_metric("Correlation to Market", random.uniform(0.5, 0.95), 0.7),
            self._generate_metric("Diversification Score", random.uniform(40, 90), 70, False)
        ]

        # Sector risks
        sectors = ["Technology", "Healthcare", "Financials", "Consumer", "Energy", "Industrial"]
        sector_risks = {s: round(random.uniform(20, 80), 1) for s in sectors}

        # Portfolio risk summary
        portfolio_risk_summary = {
            "overall_score": round(random.uniform(30, 70), 1),
            "concentration_risk": round(random.uniform(20, 60), 1),
            "market_beta": round(random.uniform(0.9, 1.3), 2),
            "expected_volatility": round(random.uniform(12, 25), 1),
            "tail_risk": round(random.uniform(5, 20), 1),
            "liquidity_score": round(random.uniform(60, 95), 1)
        }

        # Calculate overall risk score
        critical_alerts = len([a for a in alerts if a.severity == RiskLevel.CRITICAL])
        high_alerts = len([a for a in alerts if a.severity == RiskLevel.HIGH])
        medium_alerts = len([a for a in alerts if a.severity == RiskLevel.MEDIUM])

        overall_score = min(100, (
            critical_alerts * 15 +
            high_alerts * 8 +
            medium_alerts * 3 +
            sum(m.current_value for m in metrics if m.status in [RiskLevel.HIGH, RiskLevel.CRITICAL]) / len(metrics)
        ))

        risk_level = RiskLevel.CRITICAL if overall_score > 70 else (
            RiskLevel.HIGH if overall_score > 50 else (
                RiskLevel.MEDIUM if overall_score > 30 else RiskLevel.LOW
            )
        )

        # Recommendations
        recommendations = []
        if critical_alerts > 0:
            recommendations.append({
                "priority": "CRITICAL",
                "action": "Review critical risk alerts immediately",
                "details": f"{critical_alerts} critical alerts require attention"
            })
        if any(m.status in [RiskLevel.HIGH, RiskLevel.CRITICAL] for m in metrics):
            recommendations.append({
                "priority": "HIGH",
                "action": "Risk metrics exceeding thresholds",
                "details": "Consider rebalancing or hedging"
            })
        recommendations.append({
            "priority": "MEDIUM",
            "action": "Review position sizing",
            "details": "Ensure portfolio aligns with risk tolerance"
        })

        briefing = RiskBriefing(
            briefing_id=briefing_id,
            date=datetime.utcnow().strftime("%Y-%m-%d"),
            overall_risk_score=round(overall_score, 1),
            risk_level=risk_level,
            alerts=alerts,
            metrics=metrics,
            sector_risks=sector_risks,
            portfolio_risk_summary=portfolio_risk_summary,
            recommendations=recommendations,
            generated_at=datetime.utcnow()
        )

        self._briefings[briefing_id] = briefing
        logger.info(f"Generated risk briefing: {briefing_id}")

        return briefing

    async def get_briefing(self, briefing_id: str) -> Optional[RiskBriefing]:
        """Get briefing by ID"""
        return self._briefings.get(briefing_id)


service = RiskBriefingService()


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
async def generate_briefing():
    """Generate risk briefing"""
    return await service.generate_briefing()


@app.get("/api/v1/briefing/{briefing_id}")
async def get_briefing(briefing_id: str):
    """Get briefing by ID"""
    briefing = await service.get_briefing(briefing_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return briefing


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5175)