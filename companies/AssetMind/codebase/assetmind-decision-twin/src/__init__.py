"""
AssetMind - Decision Twin Engine
Port: 5250

Universal Twin Intelligence Engine
Predicts business outcomes using digital twins.

Framework: Aiphrodite-style Decision Twin

Features:
- Event analysis
- Twin selection
- Reaction prediction
- Outcome aggregation
- Confidence scoring

Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum

app = FastAPI(title="AssetMind Decision Twin Engine")

# ============================================================================
# MODELS
# ============================================================================

class EventType(str, Enum):
    PRODUCT_LAUNCH = "product_launch"
    PRICING_CHANGE = "pricing_change"
    ACQUISITION = "acquisition"
    EARINGS = "earnings"
    MANAGEMENT_CHANGE = "management_change"
    REGULATORY = "regulatory"
    COMPETITOR_MOVE = "competitor_move"
    MARKET_EVENT = "market_event"
    MACRO_EVENT = "macro_event"

class TwinType(str, Enum):
    ASSET = "asset_twin"
    PORTFOLIO = "portfolio_twin"
    INVESTOR = "investor_twin"
    MARKET = "market_twin"
    CONSUMER = "consumer_twin"
    COMPETITOR = "competitor_twin"
    ANALYST = "analyst_twin"
    REGULATOR = "regulator_twin"
    CUSTOMER = "customer_twin"
    EMPLOYEE = "employee_twin"
    SUPPLIER = "supplier_twin"
    FRANCHISE = "franchise_twin"

class ReactionType(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    MIXED = "mixed"

class Prediction(BaseModel):
    twin_type: TwinType
    prediction: ReactionType
    probability: float  # 0-1
    confidence: float  # 0-1
    timeframe: str  # "immediate", "short_term", "medium_term", "long_term"
    key_factors: List[str]
    sentiment_score: float  # -1 to 1
    impact_magnitude: float  # 0-10

class TwinSimulation(BaseModel):
    twin_type: TwinType
    simulation_id: str
    inputs: Dict[str, Any]
    predictions: List[Prediction]
    overall_sentiment: float
    confidence: float
    reasoning: str

class DecisionRequest(BaseModel):
    event_type: EventType
    event_description: str
    entity: str  # Company, product, etc.
    context: Optional[Dict[str, Any]] = None
    twins_to_simulate: Optional[List[TwinType]] = None  # If None, auto-select

class DecisionResponse(BaseModel):
    decision_id: str
    event: str
    timestamp: str
    twins_simulated: List[TwinType]
    simulations: List[TwinSimulation]
    overall_prediction: Prediction
    recommended_actions: List[str]
    confidence: float
    reasoning: str

# ============================================================================
# TWIN SIMULATION ENGINES
# ============================================================================

class AssetTwinSimulation:
    """Simulate asset/company reactions"""

    def simulate(self, event: DecisionRequest) -> TwinSimulation:
        # Mock simulation
        predictions = [
            Prediction(
                twin_type=TwinType.ASSET,
                prediction=ReactionType.POSITIVE if "launch" in event.event_type.value else ReactionType.NEUTRAL,
                probability=0.75,
                confidence=0.85,
                timeframe="short_term",
                key_factors=["Market position", "Competitive advantage"],
                sentiment_score=0.6,
                impact_magnitude=7.5
            )
        ]

        return TwinSimulation(
            twin_type=TwinType.ASSET,
            simulation_id=f"asset-{datetime.utcnow().timestamp()}",
            inputs={"event": event.event_description},
            predictions=predictions,
            overall_sentiment=0.6,
            confidence=0.85,
            reasoning="Strong market response expected"
        )

class PortfolioTwinSimulation:
    """Simulate portfolio reactions"""

    def simulate(self, event: DecisionRequest) -> TwinSimulation:
        predictions = [
            Prediction(
                twin_type=TwinType.PORTFOLIO,
                prediction=ReactionType.POSITIVE,
                probability=0.7,
                confidence=0.80,
                timeframe="medium_term",
                key_factors=["Diversification", "Sector exposure"],
                sentiment_score=0.5,
                impact_magnitude=6.0
            )
        ]

        return TwinSimulation(
            twin_type=TwinType.PORTFOLIO,
            simulation_id=f"portfolio-{datetime.utcnow().timestamp()}",
            inputs={"event": event.event_description},
            predictions=predictions,
            overall_sentiment=0.5,
            confidence=0.80,
            reasoning="Moderate portfolio impact expected"
        )

class InvestorTwinSimulation:
    """Simulate investor reactions (retail, institutional, algorithmic)"""

    def simulate(self, event: DecisionRequest) -> TwinSimulation:
        predictions = [
            Prediction(
                twin_type=TwinType.INVESTOR,
                prediction=ReactionType.POSITIVE,
                probability=0.65,
                confidence=0.75,
                timeframe="short_term",
                key_factors=["Earnings impact", "Growth potential"],
                sentiment_score=0.4,
                impact_magnitude=5.5
            )
        ]

        return TwinSimulation(
            twin_type=TwinType.INVESTOR,
            simulation_id=f"investor-{datetime.utcnow().timestamp()}",
            inputs={"event": event.event_description},
            predictions=predictions,
            overall_sentiment=0.4,
            confidence=0.75,
            reasoning="Mixed investor sentiment"
        )

class ConsumerTwinSimulation:
    """Simulate consumer reactions - Aiphrodite-style"""

    def simulate(self, event: DecisionRequest) -> TwinSimulation:
        predictions = [
            Prediction(
                twin_type=TwinType.CONSUMER,
                prediction=ReactionType.POSITIVE,
                probability=0.72,
                confidence=0.82,
                timeframe="immediate",
                key_factors=["Brand perception", "Value proposition", "Social proof"],
                sentiment_score=0.55,
                impact_magnitude=7.0
            )
        ]

        return TwinSimulation(
            twin_type=TwinType.CONSUMER,
            simulation_id=f"consumer-{datetime.utcnow().timestamp()}",
            inputs={"event": event.event_description},
            predictions=predictions,
            overall_sentiment=0.55,
            confidence=0.82,
            reasoning="Strong consumer adoption expected"
        )

class CompetitorTwinSimulation:
    """Simulate competitor reactions"""

    def simulate(self, event: DecisionRequest) -> TwinSimulation:
        predictions = [
            Prediction(
                twin_type=TwinType.COMPETITOR,
                prediction=ReactionType.NEGATIVE,
                probability=0.68,
                confidence=0.78,
                timeframe="short_term",
                key_factors=["Market share threat", "Pricing pressure"],
                sentiment_score=-0.4,
                impact_magnitude=6.5
            )
        ]

        return TwinSimulation(
            twin_type=TwinType.COMPETITOR,
            simulation_id=f"competitor-{datetime.utcnow().timestamp()}",
            inputs={"event": event.event_description},
            predictions=predictions,
            overall_sentiment=-0.4,
            confidence=0.78,
            reasoning="Competitors likely to respond aggressively"
        )

class MarketTwinSimulation:
    """Simulate market-wide reactions"""

    def simulate(self, event: DecisionRequest) -> TwinSimulation:
        predictions = [
            Prediction(
                twin_type=TwinType.MARKET,
                prediction=ReactionType.NEUTRAL,
                probability=0.55,
                confidence=0.70,
                timeframe="medium_term",
                key_factors=["Sector trends", "Macro conditions"],
                sentiment_score=0.1,
                impact_magnitude=4.0
            )
        ]

        return TwinSimulation(
            twin_type=TwinType.MARKET,
            simulation_id=f"market-{datetime.utcnow().timestamp()}",
            inputs={"event": event.event_description},
            predictions=predictions,
            overall_sentiment=0.1,
            confidence=0.70,
            reasoning="Limited market-wide impact"
        )

class AnalystTwinSimulation:
    """Simulate analyst reactions"""

    def simulate(self, event: DecisionRequest) -> TwinSimulation:
        predictions = [
            Prediction(
                twin_type=TwinType.ANALYST,
                prediction=ReactionType.POSITIVE,
                probability=0.60,
                confidence=0.72,
                timeframe="short_term",
                key_factors=["Valuation", "Growth outlook"],
                sentiment_score=0.35,
                impact_magnitude=5.0
            )
        ]

        return TwinSimulation(
            twin_type=TwinType.ANALYST,
            simulation_id=f"analyst-{datetime.utcnow().timestamp()}",
            inputs={"event": event.event_description},
            predictions=predictions,
            overall_sentiment=0.35,
            confidence=0.72,
            reasoning="Analysts cautiously optimistic"
        )

# ============================================================================
# TWIN REGISTRY
# ============================================================================

TWINS = {
    TwinType.ASSET: AssetTwinSimulation(),
    TwinType.PORTFOLIO: PortfolioTwinSimulation(),
    TwinType.INVESTOR: InvestorTwinSimulation(),
    TwinType.CONSUMER: ConsumerTwinSimulation(),
    TwinType.COMPETITOR: CompetitorTwinSimulation(),
    TwinType.MARKET: MarketTwinSimulation(),
    TwinType.ANALYST: AnalystTwinSimulation(),
}

# ============================================================================
# TWIN SELECTION LOGIC
# ============================================================================

def select_twins_for_event(event_type: EventType) -> List[TwinType]:
    """Auto-select which twins to simulate based on event type"""

    TWIN_MAP = {
        EventType.PRODUCT_LAUNCH: [
            TwinType.ASSET, TwinType.CONSUMER, TwinType.COMPETITOR, TwinType.INVESTOR
        ],
        EventType.PRICING_CHANGE: [
            TwinType.ASSET, TwinType.CONSUMER, TwinType.COMPETITOR, TwinType.MARKET
        ],
        EventType.ACQUISITION: [
            TwinType.ASSET, TwinType.INVESTOR, TwinType.MARKET, TwinType.ANALYST
        ],
        EventType.EARINGS: [
            TwinType.ASSET, TwinType.INVESTOR, TwinType.ANALYST, TwinType.MARKET
        ],
        EventType.MANAGEMENT_CHANGE: [
            TwinType.ASSET, TwinType.INVESTOR, TwinType.EMPLOYEE, TwinType.ANALYST
        ],
        EventType.REGULATORY: [
            TwinType.ASSET, TwinType.MARKET, TwinType.REGULATOR, TwinType.COMPETITOR
        ],
        EventType.COMPETITOR_MOVE: [
            TwinType.ASSET, TwinType.COMPETITOR, TwinType.CONSUMER, TwinType.MARKET
        ],
        EventType.MARKET_EVENT: [
            TwinType.MARKET, TwinType.PORTFOLIO, TwinType.INVESTOR, TwinType.ASSET
        ],
        EventType.MACRO_EVENT: [
            TwinType.MARKET, TwinType.PORTFOLIO, TwinType.REGULATOR, TwinType.ECONOMIC
        ],
    }

    return TWIN_MAP.get(event_type, [TwinType.ASSET, TwinType.MARKET])

# ============================================================================
# API ROUTES
# ============================================================================

@app.get("/health")
async def health():
    return {
        "service": "decision-twin-engine",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5250,
        "available_twins": [t.value for t in TwinType],
        "event_types": [e.value for e in EventType]
    }

@app.post("/predict", response_model=DecisionResponse)
async def predict_outcome(request: DecisionRequest) -> DecisionResponse:
    """
    Main prediction endpoint.

    Analyzes an event and predicts outcomes across all relevant twins.
    """

    # Select twins
    twins_to_simulate = request.twins_to_simulate or select_twins_for_event(request.event_type)

    # Run simulations
    simulations = []
    for twin_type in twins_to_simulate:
        if twin_type in TWINS:
            twin_sim = TWINS[twin_type]
            sim_result = twin_sim.simulate(request)
            simulations.append(sim_result)

    # Aggregate predictions
    avg_sentiment = sum(s.overall_sentiment for s in simulations) / len(simulations) if simulations else 0
    avg_confidence = sum(s.confidence for s in simulations) / len(simulations) if simulations else 0

    # Overall prediction
    if avg_sentiment > 0.2:
        overall_pred = ReactionType.POSITIVE
    elif avg_sentiment < -0.2:
        overall_pred = ReactionType.NEGATIVE
    else:
        overall_pred = ReactionType.NEUTRAL

    # Generate recommendations
    recommendations = []
    if avg_sentiment > 0.5:
        recommendations.append("Proceed with event - positive reception expected")
    elif avg_sentiment < -0.3:
        recommendations.append("Consider delaying - negative reception likely")
    else:
        recommendations.append("Monitor closely - mixed reception expected")

    if TwinType.COMPETITOR in twins_to_simulate:
        recommendations.append("Prepare competitor response strategy")

    if TwinType.INVESTOR in twins_to_simulate:
        recommendations.append("Prepare investor communications")

    return DecisionResponse(
        decision_id=f"dec-{datetime.utcnow().timestamp()}",
        event=request.event_description,
        timestamp=datetime.utcnow().isoformat(),
        twins_simulated=twins_to_simulate,
        simulations=simulations,
        overall_prediction=Prediction(
            twin_type=TwinType.ASSET,
            prediction=overall_pred,
            probability=abs(avg_sentiment),
            confidence=avg_confidence,
            timeframe="short_term",
            key_factors=["Twin analysis", "Market conditions"],
            sentiment_score=avg_sentiment,
            impact_magnitude=abs(avg_sentiment) * 10
        ),
        recommended_actions=recommendations,
        confidence=avg_confidence,
        reasoning=f"Aggregated {len(simulations)} twin simulations"
    )

@app.get("/twins")
async def list_twins():
    """List all available twins"""
    return {
        "twins": [
            {"type": t.value, "status": "active", "description": DESC.get(t, "")}
            for t in TwinType
        ]
    }

@app.get("/twins/{twin_type}/predict")
async def predict_single_twin(twin_type: TwinType, event: str):
    """Predict using a single twin"""
    if twin_type not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")

    request = DecisionRequest(
        event_type=EventType.MARKET_EVENT,
        event_description=event,
        entity="Unknown"
    )

    sim = TWINS[twin_type].simulate(request)
    return sim


# ============================================================================
# DESCRIPTIONS
# ============================================================================

DESC = {
    TwinType.ASSET: "Asset/Company digital twin",
    TwinType.PORTFOLIO: "Investment portfolio twin",
    TwinType.INVESTOR: "Investor behavior twin",
    TwinType.MARKET: "Market conditions twin",
    TwinType.CONSUMER: "Consumer reaction twin (Aiphrodite-style)",
    TwinType.COMPETITOR: "Competitor response twin",
    TwinType.ANALYST: "Analyst sentiment twin",
    TwinType.REGULATOR: "Regulatory impact twin",
    TwinType.CUSTOMER: "Customer behavior twin",
    TwinType.EMPLOYEE: "Employee reaction twin",
    TwinType.SUPPLIER: "Supplier behavior twin",
    TwinType.FRANCHISE: "Franchise decision twin",
}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5250)
