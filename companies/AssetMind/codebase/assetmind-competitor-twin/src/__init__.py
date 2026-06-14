"""
AssetMind - Competitor Twin Engine
Port: 5258

Predicts competitor responses to market events.

Features:
- Competitor analysis
- Response prediction
- Timing estimation
- Impact assessment

Version: 1.0.0
"""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime
from enum import Enum

app = FastAPI(title="Competitor Twin")

# ============================================================================
# MODELS
# ============================================================================

class ResponseType(str, Enum):
    PRICE_WAR = "price_war"
    NEW_PRODUCT = "new_product"
    MARKETING_PUSH = "marketing_push"
    PARTNERSHIP = "partnership"
    ACQUISITION = "acquisition"
    NO_RESPONSE = "no_response"

class CompetitorProfile(BaseModel):
    id: str
    name: str
    market_share: float
    financial_health: str  # strong, moderate, weak
    aggression: float  # 0-1
    strengths: List[str]
    weaknesses: List[str]

class CompetitorResponse(BaseModel):
    competitor: str
    response_type: ResponseType
    probability: float
    confidence: float
    timing: str  # immediate, short_term, medium_term
    impact: str  # high, medium, low
    reasoning: str

class TwinPrediction(BaseModel):
    event: str
    timestamp: str
    competitors_analyzed: int
    responses: List[CompetitorResponse]
    overall_impact: str
    recommended_actions: List[str]

# ============================================================================
# COMPETITOR DATABASE
# ============================================================================

COMPETITORS = [
    CompetitorProfile(
        id="comp-1",
        name="Competitor A",
        market_share=25.0,
        financial_health="strong",
        aggression=0.7,
        strengths=["Brand", "Distribution"],
        weaknesses=["Innovation", "Pricing"]
    ),
    CompetitorProfile(
        id="comp-2",
        name="Competitor B",
        market_share=20.0,
        financial_health="moderate",
        aggression=0.5,
        strengths=["Technology", "Innovation"],
        weaknesses=["Scale", "Brand"]
    ),
    CompetitorProfile(
        id="comp-3",
        name="Competitor C",
        market_share=15.0,
        financial_health="weak",
        aggression=0.3,
        strengths=["Price", "Value"],
        weaknesses=["Quality", "Service"]
    )
]

# ============================================================================
# PREDICTION ENGINE
# ============================================================================

def predict_response(competitor: CompetitorProfile, event_type: str, event_desc: str) -> CompetitorResponse:
    """Predict how a competitor will respond"""

    desc_lower = event_desc.lower()

    # Determine response type based on competitor profile
    if "price" in desc_lower or "discount" in desc_lower:
        if competitor.aggression > 0.6:
            response_type = ResponseType.PRICE_WAR
            probability = 0.8
        else:
            response_type = ResponseType.MARKETING_PUSH
            probability = 0.6
    elif "launch" in desc_lower or "new" in desc_lower:
        if "Technology" in competitor.strengths or "Innovation" in competitor.strengths:
            response_type = ResponseType.NEW_PRODUCT
            probability = 0.75
        else:
            response_type = ResponseType.MARKETING_PUSH
            probability = 0.5
    elif "partnership" in desc_lower:
        response_type = ResponseType.PARTNERSHIP
        probability = 0.6
    else:
        response_type = ResponseType.NO_RESPONSE
        probability = 0.3

    # Adjust based on aggression
    probability = min(1.0, probability + (competitor.aggression - 0.5) * 0.3)

    # Determine timing
    if competitor.aggression > 0.7:
        timing = "immediate"
    elif competitor.aggression > 0.4:
        timing = "short_term"
    else:
        timing = "medium_term"

    return CompetitorResponse(
        competitor=competitor.name,
        response_type=response_type,
        probability=round(probability, 2),
        confidence=round(0.7 + (1 - competitor.aggression) * 0.2, 2),
        timing=timing,
        impact="high" if competitor.market_share > 20 else "medium",
        reasoning=f"Based on {competitor.name}'s {competitor.financial_health} financial health and {competitor.aggression * 100}% aggression"
    )

# ============================================================================
# ROUTES
# ============================================================================

@app.get("/health")
async def health():
    return {
        "service": "competitor-twin",
        "status": "healthy",
        "competitors": len(COMPETITORS)
    }

@app.get("/competitors")
async def list_competitors():
    return {"competitors": [c.dict() for c in COMPETITORS]}

@app.post("/predict", response_model=TwinPrediction)
async def predict_competitor_response(
    event_type: str,
    event_description: str,
    competitor_ids: List[str] = None
) -> TwinPrediction:
    """
    Predict how competitors will respond to an event.
    """

    # Select competitors
    if competitor_ids:
        target_competitors = [c for c in COMPETITORS if c.id in competitor_ids]
    else:
        target_competitors = COMPETITORS

    # Predict responses
    responses = [predict_response(c, event_type, event_description) for c in target_competitors]

    # Calculate overall impact
    high_impact = sum(1 for r in responses if r.impact == "high")
    if high_impact > len(responses) / 2:
        overall_impact = "high"
    elif high_impact > 0:
        overall_impact = "medium"
    else:
        overall_impact = "low"

    # Generate recommendations
    actions = []
    if any(r.response_type == ResponseType.PRICE_WAR for r in responses):
        actions.append("Prepare pricing strategy - competitor likely to match or undercut")
        actions.append("Consider value-added services instead of price competition")
    if any(r.response_type == ResponseType.NEW_PRODUCT for r in responses):
        actions.append("Accelerate product development timeline")
        actions.append("Differentiate on unique features")
    if any(r.timing == "immediate" for r in responses):
        actions.append("Act quickly - competitors responding fast")

    return TwinPrediction(
        event=event_description,
        timestamp=datetime.utcnow().isoformat(),
        competitors_analyzed=len(responses),
        responses=responses,
        overall_impact=overall_impact,
        recommended_actions=actions
    )

@app.get("/competitor/{competitor_id}")
async def get_competitor(competitor_id: str):
    competitor = next((c for c in COMPETITORS if c.id == competitor_id), None)
    if not competitor:
        return {"error": "Competitor not found"}
    return competitor.dict()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5258)
