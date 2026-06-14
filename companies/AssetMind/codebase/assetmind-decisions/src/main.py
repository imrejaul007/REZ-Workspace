"""
AssetMind Decisions Service
Decision engine for actionable investment decisions
Port: 5150
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum
import logging
import random
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AssetMind Decisions Service",
    description="Decision engine for actionable investment decisions",
    version="1.0.0",
    docs_url="/docs"
)


class DecisionType(str, Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"
    REDUCE = "reduce"
    ACCUMULATE = "accumulate"
    EXIT = "exit"
    WATCH = "watch"


class DecisionConfidence(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class RiskProfile(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"


class FactorWeight(BaseModel):
    factor: str
    weight: float
    value: float
    contribution: float


class DecisionContext(BaseModel):
    user_id: Optional[str] = None
    portfolio_id: Optional[str] = None
    risk_profile: RiskProfile = RiskProfile.MODERATE
    investment_horizon: str = "medium"  # short, medium, long
    max_position_size: float = 10.0


class InvestmentDecision(BaseModel):
    decision_id: str
    asset_id: str
    asset_name: str
    decision: DecisionType
    confidence: DecisionConfidence
    confidence_score: float
    reasoning: List[str]
    factors: List[FactorWeight]
    price_target: Optional[float] = None
    stop_loss: Optional[float] = None
    position_size: Optional[float] = None
    timeframe: str
    risk_reward_ratio: Optional[float] = None
    alternatives: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime


class BatchDecisionRequest(BaseModel):
    asset_ids: List[str]
    context: DecisionContext


class PortfolioRecommendation(BaseModel):
    recommendation_id: str
    user_id: str
    current_allocation: Dict[str, float]
    target_allocation: Dict[str, float]
    changes: List[Dict[str, Any]]
    rebalance_priority: str
    rationale: str
    created_at: datetime


class ReasoningChain(BaseModel):
    chain_id: str
    prediction_id: str
    steps: List[Dict[str, Any]]
    conclusion: str
    confidence: float
    timestamp: datetime


class DecisionsService:
    """Decision engine service for investment decisions"""

    def __init__(self):
        self.name = "Decisions Service"
        self.port = 5150
        self.version = "1.0.0"
        self._decisions_cache: Dict[str, InvestmentDecision] = {}
        self._decision_count = 0

    def _generate_id(self) -> str:
        """Generate unique ID"""
        self._decision_count += 1
        return f"decision_{datetime.utcnow().timestamp()}_{self._decision_count}"

    def _get_asset_data(self, asset_id: str) -> Dict[str, Any]:
        """Get mock asset data"""
        assets = {
            "AAPL": {"name": "Apple Inc.", "sector": "Technology", "price": 178.50},
            "MSFT": {"name": "Microsoft Corp", "sector": "Technology", "price": 415.20},
            "GOOGL": {"name": "Alphabet Inc.", "sector": "Technology", "price": 142.80},
            "NVDA": {"name": "NVIDIA Corp", "sector": "Technology", "price": 875.30},
            "TSLA": {"name": "Tesla Inc.", "sector": "Consumer", "price": 245.60},
            "JPM": {"name": "JPMorgan Chase", "sector": "Financials", "price": 195.40},
 }
        return assets.get(asset_id.upper(), {"name": asset_id, "sector": "Unknown", "price": 100.0})

    async def make_decision(
        self,
        asset_id: str,
        context: Optional[DecisionContext] = None
    ) -> InvestmentDecision:
        """Make investment decision for an asset"""
        asset = self._get_asset_data(asset_id)
        current_price = asset["price"]

        # Generate decision factors
        factors = []
        momentum = random.uniform(0.3, 0.9)
        valuation = random.uniform(0.4, 0.8)
        sentiment = random.uniform(0.3, 0.85)
        risk = random.uniform(0.2, 0.7)

        factors.append(FactorWeight(
            factor="Price Momentum",
            weight=0.3,
            value=momentum,
            contribution=round(momentum * 0.3, 3)
        ))
        factors.append(FactorWeight(
            factor="Valuation",
            weight=0.25,
            value=valuation,
            contribution=round(valuation * 0.25, 3)
        ))
        factors.append(FactorWeight(
            factor="Market Sentiment",
            weight=0.25,
            value=sentiment,
            contribution=round(sentiment * 0.25, 3)
        ))
        factors.append(FactorWeight(
            factor="Risk Score",
            weight=0.2,
            value=risk,
            contribution=round((1 - risk) * 0.2, 3)
        ))

        # Calculate composite score
        composite = sum(f.contribution for f in factors)

        # Determine decision
        if composite > 0.65:
            decision = DecisionType.BUY if composite > 0.75 else DecisionType.ACCUMULATE
        elif composite > 0.45:
            decision = DecisionType.HOLD
        else:
            decision = DecisionType.SELL if composite < 0.35 else DecisionType.REDUCE

        # Generate reasoning
        reasoning = []
        if momentum > 0.7:
            reasoning.append(f"Strong price momentum detected ({momentum:.0%})")
        if valuation > 0.7:
            reasoning.append("Attractive valuation metrics")
        if sentiment > 0.7:
            reasoning.append("Positive market sentiment indicators")
        if risk < 0.4:
            reasoning.append("Low risk profile supports position")
        reasoning.append(f"Composite score: {composite:.2f}")

        # Calculate price target and stop loss
        if decision in [DecisionType.BUY, DecisionType.ACCUMULATE]:
            target_pct = random.uniform(0.10, 0.25)
            price_target = current_price * (1 + target_pct)
            stop_loss = current_price * (1 - random.uniform(0.05, 0.10))
            risk_reward = target_pct / (1 - stop_loss / current_price)
        else:
            price_target = None
            stop_loss = None
            risk_reward = None

        # Determine confidence
        if composite > 0.8 or composite < 0.2:
            confidence = DecisionConfidence.HIGH
            confidence_score = random.uniform(0.85, 0.95)
        elif composite > 0.6 or composite < 0.4:
            confidence = DecisionConfidence.MEDIUM
            confidence_score = random.uniform(0.65, 0.80)
        else:
            confidence = DecisionConfidence.LOW
            confidence_score = random.uniform(0.45, 0.65)

        # Generate alternatives
        alternatives = []
        if decision != DecisionType.BUY:
            alternatives.append({
                "decision": DecisionType.BUY.value,
                "rationale": "Higher conviction alternative",
                "confidence_boost": "If more data confirms trend"
            })
        if decision != DecisionType.HOLD:
            alternatives.append({
                "decision": DecisionType.HOLD.value,
                "rationale": "More conservative approach",
                "confidence_boost": "Reduce exposure to uncertainty"
            })

        decision_obj = InvestmentDecision(
            decision_id=self._generate_id(),
            asset_id=asset_id.upper(),
            asset_name=asset["name"],
            decision=decision,
            confidence=confidence,
            confidence_score=round(confidence_score, 2),
            reasoning=reasoning,
            factors=factors,
            price_target=round(price_target, 2) if price_target else None,
            stop_loss=round(stop_loss, 2) if stop_loss else None,
            position_size=random.uniform(2, 10) if decision in [DecisionType.BUY, DecisionType.ACCUMULATE] else None,
            timeframe="2-4 weeks",
            risk_reward_ratio=round(risk_reward, 2) if risk_reward else None,
            alternatives=alternatives,
            created_at=datetime.utcnow()
        )

        self._decisions_cache[decision_obj.decision_id] = decision_obj
        logger.info(f"Generated decision for {asset_id}: {decision.value}")
        return decision_obj

    async def make_batch_decisions(
        self,
        request: BatchDecisionRequest
    ) -> List[InvestmentDecision]:
        """Make decisions for multiple assets"""
        decisions = []
        for asset_id in request.asset_ids:
            decision = await self.make_decision(asset_id, request.context)
            decisions.append(decision)
        return decisions

    async def get_reasoning_chain(
        self,
        decision_id: str
    ) -> ReasoningChain:
        """Get explainable reasoning chain for a decision"""
        if decision_id not in self._decisions_cache:
            raise ValueError(f"Decision not found: {decision_id}")

        decision = self._decisions_cache[decision_id]

        steps = []
        for i, factor in enumerate(decision.factors, 1):
            steps.append({
                "step": i,
                "factor": factor.factor,
                "weight": factor.weight,
                "value": factor.value,
                "contribution": factor.contribution,
                "interpretation": f"{factor.factor} scored {factor.value:.0%}, contributing {factor.contribution:.2f} to decision"
            })

        steps.append({
            "step": len(steps) + 1,
            "factor": "Composite Score",
            "weight": 1.0,
            "value": decision.confidence_score,
            "contribution": decision.confidence_score,
            "interpretation": f"Overall confidence: {decision.confidence_score:.0%}"
        })

        return ReasoningChain(
            chain_id=self._generate_id(),
            prediction_id=decision_id,
            steps=steps,
            conclusion=f"Recommendation: {decision.decision.value.upper()} {decision.asset_id} with {decision.confidence.value.upper()} confidence",
            confidence=decision.confidence_score,
            timestamp=datetime.utcnow()
        )

    async def generate_portfolio_recommendation(
        self,
        user_id: str,
        holdings: List[Dict[str, Any]],
        target_allocation: Optional[Dict[str, float]] = None
    ) -> PortfolioRecommendation:
        """Generate portfolio rebalancing recommendations"""
        total_value = sum(h.get("value", 0) for h in holdings)
        current_allocation = {}

        for holding in holdings:
            symbol = holding.get("symbol")
            value = holding.get("value", 0)
            weight = (value / total_value * 100) if total_value > 0 else 0
            current_allocation[symbol] = round(weight, 2)

        if target_allocation is None:
            target_allocation = {k: 100.0 / len(current_allocation) for k in current_allocation.keys()}

        changes = []
        for symbol, target_weight in target_allocation.items():
            current_weight = current_allocation.get(symbol, 0)
            diff = target_weight - current_weight

            if abs(diff) > 1:
                changes.append({
                    "symbol": symbol,
                    "current_weight": current_weight,
                    "target_weight": target_weight,
                    "change_pct": round(diff, 2),
                    "action": "ADD" if diff > 0 else "REDUCE",
                    "priority": "HIGH" if abs(diff) > 5 else "MEDIUM"
                })

        changes.sort(key=lambda x: abs(x["change_pct"]), reverse=True)

        return PortfolioRecommendation(
            recommendation_id=self._generate_id(),
            user_id=user_id,
            current_allocation=current_allocation,
            target_allocation=target_allocation,
            changes=changes,
            rebalance_priority="HIGH" if len(changes) > 3 else "MEDIUM",
            rationale=f"Portfolio requires rebalancing with {len(changes)} position changes",
            created_at=datetime.utcnow()
        )


service = DecisionsService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "decisions_made": service._decision_count
    }


@app.post("/api/v1/decide/{asset_id}", response_model=InvestmentDecision)
async def make_decision(asset_id: str, context: Optional[DecisionContext] = None):
    """Make investment decision for an asset"""
    return await service.make_decision(asset_id, context)


@app.post("/api/v1/decide/batch", response_model=List[InvestmentDecision])
async def make_batch_decisions(request: BatchDecisionRequest):
    """Make decisions for multiple assets"""
    return await service.make_batch_decisions(request)


@app.get("/api/v1/decisions/{decision_id}")
async def get_decision(decision_id: str):
    """Get decision by ID"""
    if decision_id not in service._decisions_cache:
        raise HTTPException(status_code=404, detail="Decision not found")
    return service._decisions_cache[decision_id]


@app.get("/api/v1/decisions/{decision_id}/reasoning", response_model=ReasoningChain)
async def get_reasoning_chain(decision_id: str):
    """Get explainable reasoning chain for a decision"""
    return await service.get_reasoning_chain(decision_id)


@app.post("/api/v1/portfolio/recommend", response_model=PortfolioRecommendation)
async def get_portfolio_recommendation(
    user_id: str,
    holdings: List[Dict[str, Any]],
    target_allocation: Optional[Dict[str, float]] = None
):
    """Generate portfolio rebalancing recommendations"""
    return await service.generate_portfolio_recommendation(user_id, holdings, target_allocation)


@app.get("/api/v1/assets/{asset_id}/info")
async def get_asset_info(asset_id: str):
    """Get asset information"""
    return service._get_asset_data(asset_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5150)
