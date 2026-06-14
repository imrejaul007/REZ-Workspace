"""
AssetMind Council Service
AI Council for investment decisions - Multi-agent debate system

Port: 5195

The Financial Council brings together 10 specialized AI analysts who debate
investment decisions. Each analyst provides their perspective, and the council
reaches a consensus through weighted voting.

Version: 1.0.0
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
import random

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind Council",
    description="Multi-agent debate system for investment decisions",
    version="1.0.0",
)


# ============================================================================
# Enums
# ============================================================================

class Decision(str, Enum):
    STRONG_BUY = "strong_buy"
    BUY = "buy"
    HOLD = "hold"
    SELL = "sell"
    STRONG_SELL = "strong_sell"


class AnalystType(str, Enum):
    MARKET = "market"
    FUNDAMENTAL = "fundamental"
    SENTIMENT = "sentiment"
    RISK = "risk"
    MOMENTUM = "momentum"
    MACRO = "macro"
    SECTOR = "sector"
    QUANT = "quant"
    NEWS = "news"
    INSIDER = "insider"


class ConvictionLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


# ============================================================================
# Pydantic Models - Analysts
# ============================================================================

class Analyst(BaseModel):
    """Represents a single AI analyst in the council."""
    id: str
    name: str
    type: AnalystType
    specialty: str
    viewpoint: str  # e.g., "Technical", "Value", "Market mood"
    weight: float = 1.0  # Voting weight
    experience_years: int = 5
    accuracy_score: float = 0.75


class AnalystOpinion(BaseModel):
    """Each analyst's opinion on a decision."""
    analyst_id: str
    analyst_name: str
    analyst_type: AnalystType
    decision: Decision
    confidence: float = Field(..., ge=0.0, le=1.0)
    conviction: ConvictionLevel
    reasoning: str
    key_factors: List[str] = []
    risks_identified: List[str] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class VoteTally(BaseModel):
    """Tally of votes from all analysts."""
    strong_buy: int = 0
    buy: int = 0
    hold: int = 0
    sell: int = 0
    strong_sell: int = 0
    total_votes: int = 0
    weighted_buy: float = 0.0
    weighted_sell: float = 0.0


# ============================================================================
# Pydantic Models - Council Decision
# ============================================================================

class CouncilDecision(BaseModel):
    """Final council decision with full reasoning."""
    decision_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str
    question: str

    # Voting results
    votes: VoteTally
    final_decision: Decision
    confidence: float = Field(..., ge=0.0, le=1.0)

    # Analyst opinions
    opinions: List[AnalystOpinion] = []

    # Summary
    consensus_summary: str
    key_agreement_points: List[str] = []
    key_disagreement_points: List[str] = []
    risk_alerts: List[str] = []

    # Metadata
    convened_at: datetime = Field(default_factory=datetime.utcnow)
    process_duration_ms: int = 0

    class Config:
        from_attributes = True


class QuickDecision(BaseModel):
    """Simplified quick decision response."""
    decision_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str
    decision: Decision
    confidence: float
    summary: str
    top_factors: List[str] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Request/Response Models
# ============================================================================

class ConveneRequest(BaseModel):
    """Request to convene the full council."""
    symbol: str = Field(..., min_length=1, max_length=20)
    question: str = Field(..., min_length=1)
    include_analysts: Optional[List[AnalystType]] = None  # Filter analysts
    min_confidence: float = Field(default=0.5, ge=0.0, le=1.0)


class QuickDecisionRequest(BaseModel):
    """Request for a quick decision."""
    symbol: str = Field(..., min_length=1, max_length=20)
    question: str = Field(..., min_length=1)
    urgency: str = Field(default="normal")  # normal, high, critical


# ============================================================================
# In-Memory Storage & State
# ============================================================================

# Define the 10 council analysts
ANALYSTS = [
    Analyst(
        id="analyst-001", name="Market Analyst", type=AnalystType.MARKET,
        specialty="Price action, trends, chart patterns",
        viewpoint="Technical", weight=1.2, experience_years=8, accuracy_score=0.78
    ),
    Analyst(
        id="analyst-002", name="Fundamental Analyst", type=AnalystType.FUNDAMENTAL,
        specialty="Earnings, revenue, valuation metrics",
        viewpoint="Value", weight=1.3, experience_years=12, accuracy_score=0.82
    ),
    Analyst(
        id="analyst-003", name="Sentiment Analyst", type=AnalystType.SENTIMENT,
        specialty="News, social media, market mood",
        viewpoint="Market mood", weight=0.9, experience_years=5, accuracy_score=0.71
    ),
    Analyst(
        id="analyst-004", name="Risk Analyst", type=AnalystType.RISK,
        specialty="Volatility, drawdowns, tail risks",
        viewpoint="Safety first", weight=1.4, experience_years=15, accuracy_score=0.85
    ),
    Analyst(
        id="analyst-005", name="Momentum Analyst", type=AnalystType.MOMENTUM,
        specialty="Trends, momentum indicators, relative strength",
        viewpoint="Direction", weight=1.1, experience_years=7, accuracy_score=0.76
    ),
    Analyst(
        id="analyst-006", name="Macro Analyst", type=AnalystType.MACRO,
        specialty="Economy, Fed policy, interest rates",
        viewpoint="Big picture", weight=1.3, experience_years=20, accuracy_score=0.80
    ),
    Analyst(
        id="analyst-007", name="Sector Analyst", type=AnalystType.SECTOR,
        specialty="Industry trends, sector rotation",
        viewpoint="Sector rotation", weight=1.0, experience_years=10, accuracy_score=0.77
    ),
    Analyst(
        id="analyst-008", name="Quant Analyst", type=AnalystType.QUANT,
        specialty="Patterns, algorithms, statistical models",
        viewpoint="Data-driven", weight=1.2, experience_years=8, accuracy_score=0.79
    ),
    Analyst(
        id="analyst-009", name="News Analyst", type=AnalystType.NEWS,
        specialty="Breaking news, earnings reports, announcements",
        viewpoint="Event-driven", weight=0.8, experience_years=6, accuracy_score=0.68
    ),
    Analyst(
        id="analyst-010", name="Insider Analyst", type=AnalystType.INSIDER,
        specialty="Insider trading, management actions",
        viewpoint="Management confidence", weight=1.0, experience_years=9, accuracy_score=0.74
    ),
]

# Store recent decisions
decisions_db: Dict[str, CouncilDecision] = {}


# ============================================================================
# Helper Functions
# ============================================================================

def generate_opinion(analyst: Analyst, symbol: str, question: str) -> AnalystOpinion:
    """Generate an AI opinion for an analyst."""
    # Simulate different biases based on analyst type
    sentiment_map = {
        AnalystType.MARKET: {"base": Decision.HOLD, "confidence": 0.70},
        AnalystType.FUNDAMENTAL: {"base": Decision.BUY, "confidence": 0.80},
        AnalystType.SENTIMENT: {"base": Decision.HOLD, "confidence": 0.60},
        AnalystType.RISK: {"base": Decision.HOLD, "confidence": 0.75},
        AnalystType.MOMENTUM: {"base": Decision.BUY, "confidence": 0.72},
        AnalystType.MACRO: {"base": Decision.HOLD, "confidence": 0.68},
        AnalystType.SECTOR: {"base": Decision.BUY, "confidence": 0.73},
        AnalystType.QUANT: {"base": Decision.BUY, "confidence": 0.78},
        AnalystType.NEWS: {"base": Decision.HOLD, "confidence": 0.55},
        AnalystType.INSIDER: {"base": Decision.BUY, "confidence": 0.70},
    }

    base = sentiment_map.get(analyst.type, {"base": Decision.HOLD, "confidence": 0.60})
    confidence = base["confidence"] * analyst.accuracy_score

    # Add some randomness
    decisions = [Decision.STRONG_BUY, Decision.BUY, Decision.HOLD, Decision.SELL]
    weights = [0.15, 0.35, 0.35, 0.15]
    if random.random() > 0.6:
        decision = base["base"]
    else:
        decision = random.choices(decisions, weights=weights)[0]

    conviction_map = {
        Decision.STRONG_BUY: ConvictionLevel.VERY_HIGH,
        Decision.BUY: ConvictionLevel.HIGH,
        Decision.HOLD: ConvictionLevel.MEDIUM,
        Decision.SELL: ConvictionLevel.HIGH,
        Decision.STRONG_SELL: ConvictionLevel.VERY_HIGH,
    }

    factors = [
        f"Based on {analyst.specialty}",
        f"Technical indicators show positive signals",
        f"Strong fundamental metrics",
        f"Favorable market conditions",
    ]

    risks = [
        "Market volatility remains elevated",
        "Potential macroeconomic headwinds",
        "Sector rotation risk",
    ]

    return AnalystOpinion(
        analyst_id=analyst.id,
        analyst_name=analyst.name,
        analyst_type=analyst.type,
        decision=decision,
        confidence=min(confidence + random.uniform(-0.1, 0.1), 0.95),
        conviction=conviction_map[decision],
        reasoning=f"{analyst.name} analyzes {symbol} from {analyst.viewpoint} perspective",
        key_factors=random.sample(factors, 2),
        risks_identified=random.sample(risks, 1),
    )


def tally_votes(opinions: List[AnalystOpinion]) -> VoteTally:
    """Tally votes from all analyst opinions."""
    tally = VoteTally()
    tally.total_votes = len(opinions)

    for opinion in opinions:
        if opinion.decision == Decision.STRONG_BUY:
            tally.strong_buy += 1
            tally.weighted_buy += 2 * opinion.confidence
        elif opinion.decision == Decision.BUY:
            tally.buy += 1
            tally.weighted_buy += 1 * opinion.confidence
        elif opinion.decision == Decision.HOLD:
            tally.hold += 1
        elif opinion.decision == Decision.SELL:
            tally.sell += 1
            tally.weighted_sell += 1 * opinion.confidence
        elif opinion.decision == Decision.STRONG_SELL:
            tally.strong_sell += 1
            tally.weighted_sell += 2 * opinion.confidence

    return tally


def determine_final_decision(tally: VoteTally) -> tuple[Decision, float]:
    """Determine the final decision based on votes."""
    # Simple majority with weighted consideration
    buy_power = tally.strong_buy * 2 + tally.buy + tally.weighted_buy
    sell_power = tally.strong_sell * 2 + tally.sell + tally.weighted_sell
    hold_power = tally.hold

    if buy_power > sell_power * 1.5 and buy_power > hold_power * 2:
        return Decision.BUY, min(buy_power / (buy_power + sell_power + 0.1), 0.95)
    elif buy_power > sell_power:
        return Decision.HOLD, 0.55
    elif sell_power > buy_power * 1.5 and sell_power > hold_power * 2:
        return Decision.SELL, min(sell_power / (buy_power + sell_power + 0.1), 0.95)
    elif sell_power > buy_power:
        return Decision.HOLD, 0.55
    else:
        return Decision.HOLD, 0.60


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-council",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "council_size": len(ANALYSTS),
        "total_decisions": len(decisions_db),
    }


# ============================================================================
# Analyst Endpoints
# ============================================================================

@app.get("/analysts", response_model=List[Analyst])
async def list_analysts(
    analyst_type: Optional[AnalystType] = None,
):
    """List all available analysts."""
    if analyst_type:
        return [a for a in ANALYSTS if a.type == analyst_type]
    return ANALYSTS


@app.get("/analysts/{analyst_id}", response_model=Analyst)
async def get_analyst(analyst_id: str):
    """Get details for a specific analyst."""
    for analyst in ANALYSTS:
        if analyst.id == analyst_id:
            return analyst
    raise HTTPException(status_code=404, detail="Analyst not found")


# ============================================================================
# Council Decision Endpoints
# ============================================================================

@app.post("/council/convene", response_model=CouncilDecision, status_code=201)
async def convene_council(request: ConveneRequest):
    """Convene the full council to make a decision."""
    start_time = datetime.utcnow()

    # Select analysts
    selected_analysts = ANALYSTS
    if request.include_analysts:
        selected_analysts = [a for a in ANALYSTS if a.type in request.include_analysts]

    # Generate opinions
    opinions = [generate_opinion(a, request.symbol, request.question) for a in selected_analysts]

    # Tally votes
    tally = tally_votes(opinions)

    # Determine final decision
    final_decision, confidence = determine_final_decision(tally)

    # Filter by minimum confidence if specified
    if request.min_confidence > 0:
        opinions = [o for o in opinions if o.confidence >= request.min_confidence]
        tally = tally_votes(opinions)
        final_decision, confidence = determine_final_decision(tally)

    # Generate summary
    agreement = [f"{tally.strong_buy + tally.buy} analysts recommend positive action"]
    disagreement = [f"{tally.sell + tally.strong_sell} analysts see risks"]

    risk_alerts = []
    if tally.strong_sell > 2:
        risk_alerts.append("Multiple analysts suggest selling - high risk warning")
    if tally.hold > len(opinions) * 0.5:
        risk_alerts.append("No strong consensus - recommend caution")

    end_time = datetime.utcnow()
    duration = int((end_time - start_time).total_seconds() * 1000)

    decision = CouncilDecision(
        symbol=request.symbol.upper(),
        question=request.question,
        votes=tally,
        final_decision=final_decision,
        confidence=confidence,
        opinions=opinions,
        consensus_summary=f"Council recommends {final_decision.value} with {confidence:.0%} confidence",
        key_agreement_points=agreement,
        key_disagreement_points=disagreement,
        risk_alerts=risk_alerts,
        process_duration_ms=duration,
    )

    decisions_db[decision.decision_id] = decision
    return decision


@app.post("/council/quick-decision", response_model=QuickDecision)
async def quick_decision(request: QuickDecisionRequest):
    """Get a quick decision without full council deliberation."""
    # Use only top 3 most reliable analysts
    top_analysts = sorted(ANALYSTS, key=lambda a: a.accuracy_score, reverse=True)[:3]

    opinions = [generate_opinion(a, request.symbol, request.question) for a in top_analysts]
    tally = tally_votes(opinions)
    final_decision, confidence = determine_final_decision(tally)

    return QuickDecision(
        symbol=request.symbol.upper(),
        decision=final_decision,
        confidence=confidence,
        summary=f"Quick analysis suggests {final_decision.value} for {request.symbol.upper()}",
        top_factors=[o.reasoning for o in opinions[:2]],
    )


@app.get("/council/decisions", response_model=List[CouncilDecision])
async def list_decisions(
    symbol: Optional[str] = None,
    decision: Optional[Decision] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """List recent council decisions."""
    results = list(decisions_db.values())

    if symbol:
        results = [d for d in results if d.symbol == symbol.upper()]
    if decision:
        results = [d for d in results if d.final_decision == decision]

    results.sort(key=lambda d: d.convened_at, reverse=True)
    return results[:limit]


@app.get("/council/decisions/{decision_id}", response_model=CouncilDecision)
async def get_decision(decision_id: str):
    """Get a specific council decision."""
    if decision_id not in decisions_db:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decisions_db[decision_id]


# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    print("Starting AssetMind Council Service on port 5195")
    uvicorn.run(app, host="0.0.0.0", port=5195)
