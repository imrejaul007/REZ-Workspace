"""
AssetMind - Financial Council
Port: 5195

The Blackbox "Chairman" but much bigger.

A multi-agent debate system where specialized analysts
collaborate to reach investment decisions.

Council Members:
- Bull Analyst: Argues for buying
- Bear Analyst: Argues for selling
- Macro Analyst: Economy & rates perspective
- Risk Analyst: Risk assessment
- Quant Analyst: Technical & data perspective
- Portfolio Manager: Portfolio fit
- Event Analyst: Catalysts & events
- Value Analyst: Valuation perspective

They debate.
They reason.
They decide.

Output:
- Decision: BUY/HOLD/SELL
- Confidence: 0-100%
- Bull Case
- Bear Case
- Major Risks
- Expected Return

This is the core intelligence orchestrator.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum
import uuid


app = FastAPI(
    title="AssetMind Financial Council",
    version="1.0.0",
    description="The Investment Decision Engine - Multi-agent debate system"
)


# =============================================================================
# COUNCIL MEMBERS
# =============================================================================

class CouncilRole(str, Enum):
    """Council member roles"""
    BULL_ANALYST = "bull_analyst"
    BEAR_ANALYST = "bear_analyst"
    MACRO_ANALYST = "macro_analyst"
    RISK_ANALYST = "risk_analyst"
    QUANT_ANALYST = "quant_analyst"
    PORTFOLIO_MANAGER = "portfolio_manager"
    EVENT_ANALYST = "event_analyst"
    VALUE_ANALYST = "value_analyst"
    SENTIMENT_ANALYST = "sentiment_analyst"
    INSIDER_ANALYST = "insider_analyst"


class Decision(str, Enum):
    STRONG_BUY = "strong_buy"
    BUY = "buy"
    HOLD = "hold"
    SELL = "sell"
    STRONG_SELL = "strong_sell"


class Conviction(str, Enum):
    LOW = "low"           # 0-40%
    MEDIUM = "medium"      # 40-70%
    HIGH = "high"          # 70-90%
    VERY_HIGH = "very_high" # 90-100%


# =============================================================================
# ANALYST MODELS
# =============================================================================

class AnalystOpinion(BaseModel):
    """Single analyst's opinion"""
    role: CouncilRole
    analyst_name: str
    stance: Decision
    conviction: Conviction
    confidence: float = Field(ge=0, le=1)
    reasoning: List[str] = Field(default_factory=list)
    supporting_evidence: List[str] = Field(default_factory=list)
    opposing_evidence: List[str] = Field(default_factory=list)
    key_factors: List[str] = Field(default_factory=list)
    target_price: Optional[float] = None
    expected_return: Optional[float] = None  # %
    time_horizon: str = "12 months"
    concerns: List[str] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)


class DebateRound(BaseModel):
    """Single debate round"""
    round_number: int
    speaker: CouncilRole
    topic: str
    argument: str
    evidence: List[str] = Field(default_factory=list)
    counter_arguments: List[str] = Field(default_factory=list)
    timestamp: datetime


class CouncilDecision(BaseModel):
    """Final council decision"""
    decision_id: str
    symbol: str
    company_name: str

    # Decision
    final_decision: Decision
    confidence: float
    conviction: Conviction
    decision_score: float = Field(ge=0, le=100)  # 0-100

    # Breakdown
    bull_case: List[str] = Field(default_factory=list)
    bear_case: List[str] = Field(default_factory=list)
    consensus_view: str = ""

    # Risks
    major_risks: List[str] = Field(default_factory=list)
    risk_score: float = Field(ge=0, le=100)

    # Catalysts
    catalysts: List[str] = Field(default_factory=list)
    headwinds: List[str] = Field(default_factory=list)

    # Timing
    current_price: Optional[float] = None
    target_price: Optional[float] = None
    expected_return: Optional[float] = None
    time_horizon: str = "12 months"

    # Analyst votes
    analyst_opinions: List[AnalystOpinion] = Field(default_factory=list)
    vote_breakdown: Dict[str, int] = Field(default_factory=dict)

    # Debate log
    debate_log: List[DebateRound] = Field(default_factory=list)

    # Meta
    triggered_by: str = "user_query"
    created_at: datetime


# =============================================================================
# ANALYST IMPLEMENTATIONS
# =============================================================================

ANALYSTS = {
    CouncilRole.BULL_ANALYST: {
        "name": "Alexandra Chen",
        "title": "Senior Bull Analyst",
        "expertise": ["growth", "momentum", "innovation"],
        "bias": "bullish",
        "style": "Focuses on growth opportunities and upside scenarios"
    },
    CouncilRole.BEAR_ANALYST: {
        "name": "Marcus Williams",
        "title": "Senior Bear Analyst",
        "expertise": ["risk", "valuation", "competition"],
        "bias": "bearish",
        "style": "Conservative, focuses on risks and downside"
    },
    CouncilRole.MACRO_ANALYST: {
        "name": "Sarah Thompson",
        "title": "Chief Macro Strategist",
        "expertise": ["rates", "inflation", "GDP", "central banks"],
        "bias": "neutral",
        "style": "Connects macro trends to individual stocks"
    },
    CouncilRole.RISK_ANALYST: {
        "name": "David Park",
        "title": "Head of Risk Analysis",
        "expertise": ["volatility", "tail risk", "drawdowns"],
        "bias": "cautious",
        "style": "Quantifies and manages downside"
    },
    CouncilRole.QUANT_ANALYST: {
        "name": "James Liu",
        "title": "Quantitative Strategist",
        "expertise": ["technical", "momentum", "patterns"],
        "bias": "data_driven",
        "style": "Let the data speak"
    },
    CouncilRole.PORTFOLIO_MANAGER: {
        "name": "Emily Rodriguez",
        "title": "Portfolio Construction Lead",
        "expertise": ["allocation", "diversification", "rebalancing"],
        "bias": "balanced",
        "style": "Portfolio fit and risk-adjusted returns"
    },
    CouncilRole.EVENT_ANALYST: {
        "name": "Michael Zhang",
        "title": "Events & Catalysts Analyst",
        "expertise": ["earnings", "M&A", "product launches"],
        "bias": "catalyst_focused",
        "style": "What events will drive the stock"
    },
    CouncilRole.VALUE_ANALYST: {
        "name": "Jennifer Walsh",
        "title": "Value Investing Specialist",
        "expertise": ["DCF", "comparable", "intrinsic value"],
        "bias": "value",
        "style": "Price vs. intrinsic value"
    },
    CouncilRole.SENTIMENT_ANALYST: {
        "name": "Robert Kim",
        "title": "Sentiment & Psychology Analyst",
        "expertise": ["social", "analyst ratings", "options"],
        "bias": "sentiment_tracking",
        "style": "Market psychology and positioning"
    },
    CouncilRole.INSIDER_ANALYST: {
        "name": "Amanda Foster",
        "title": "Insider & Institutional Analyst",
        "expertise": ["13F", "insider buying", "institutional"],
        "bias": "informed",
        "style": "Follows smart money"
    }
}


# =============================================================================
# COUNCIL DATABASE
# =============================================================================

COUNCIL_DECISIONS: Dict[str, CouncilDecision] = {}
DEBATES: List[DebateRound] = []


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_analyst(name: str) -> Dict:
    """Get analyst by role"""
    for role, analyst in ANALYSTS.items():
        if analyst["name"] == name:
            return analyst
    return None


def calculate_decision_score(opinions: List[AnalystOpinion]) -> float:
    """Calculate overall decision score"""
    scores = {
        Decision.STRONG_BUY: 95,
        Decision.BUY: 75,
        Decision.HOLD: 50,
        Decision.SELL: 25,
        Decision.STRONG_SELL: 5
    }

    total_score = 0
    total_weight = 0

    for opinion in opinions:
        score = scores.get(opinion.stance, 50)
        weight = opinion.confidence
        total_score += score * weight
        total_weight += weight

    if total_weight == 0:
        return 50

    return total_score / total_weight


def determine_conviction(score: float) -> Conviction:
    """Determine conviction level"""
    if score >= 90:
        return Conviction.VERY_HIGH
    elif score >= 70:
        return Conviction.HIGH
    elif score >= 40:
        return Conviction.MEDIUM
    else:
        return Conviction.LOW


def aggregate_opinions(opinions: List[AnalystOpinion]) -> Dict:
    """Aggregate analyst opinions into decision"""
    bull_case = []
    bear_case = []
    major_risks = []
    catalysts = []

    for opinion in opinions:
        if opinion.stance in [Decision.BUY, Decision.STRONG_BUY]:
            bull_case.extend(opinion.opportunities)
            catalysts.extend(opinion.key_factors)
        else:
            bear_case.extend(opinion.concerns)
            major_risks.extend(opinion.concerns)

    # Deduplicate
    bull_case = list(dict.fromkeys(bull_case))[:5]
    bear_case = list(dict.fromkeys(bear_case))[:5]
    major_risks = list(dict.fromkeys(major_risks))[:5]
    catalysts = list(dict.fromkeys(catalysts))[:5]

    return {
        "bull_case": bull_case,
        "bear_case": bear_case,
        "major_risks": major_risks,
        "catalysts": catalysts
    }


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-council",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5195,
        "analysts": len(ANALYSTS),
        "decisions": len(COUNCIL_DECISIONS)
    }


@app.get("/")
async def root():
    return {
        "service": "AssetMind Financial Council",
        "description": "Multi-agent debate system for investment decisions",
        "council_size": len(ANALYSTS),
        "members": [
            {"role": role.value, "name": a["name"], "title": a["title"]}
            for role, a in ANALYSTS.items()
        ]
    }


@app.get("/analysts")
async def list_analysts():
    """List all council members"""
    return {
        "analysts": [
            {
                "role": role.value,
                "name": a["name"],
                "title": a["title"],
                "expertise": a["expertise"],
                "bias": a["bias"]
            }
            for role, a in ANALYSTS.items()
        ]
    }


@app.get("/analysts/{role}")
async def get_analyst_details(role: CouncilRole):
    """Get specific analyst details"""
    if role not in ANALYSTS:
        raise HTTPException(status_code=404, detail="Analyst not found")

    analyst = ANALYSTS[role]
    return {
        "role": role.value,
        "name": analyst["name"],
        "title": analyst["title"],
        "expertise": analyst["expertise"],
        "bias": analyst["bias"],
        "style": analyst["style"]
    }


# =============================================================================
# COUNCIL SESSION
# =============================================================================

class CouncilSessionRequest(BaseModel):
    """Request to convene the council"""
    symbol: str
    company_name: Optional[str] = None
    question: str = "Should we invest in this company?"
    context: Dict[str, Any] = Field(default_factory=dict)
    include_analysts: Optional[List[CouncilRole]] = None


@app.post("/council/convene", response_model=CouncilDecision)
async def convene_council(request: CouncilSessionRequest):
    """
    Convene the full council to debate and decide.

    This is the main endpoint - call this to get a full investment decision.
    """
    decision_id = str(uuid.uuid4())

    # Determine which analysts to include
    if request.include_analysts:
        included_analysts = request.include_analysts
    else:
        included_analysts = list(CounILSTS.keys())

    # Gather analyst opinions
    opinions = []

    for role in included_analysts:
        analyst = ANALYSTS.get(role)
        if not analyst:
            continue

        # Generate analyst opinion based on context
        opinion = generate_analyst_opinion(role, analyst, request.symbol, request.context)
        opinions.append(opinion)

    # Aggregate into decision
    decision_score = calculate_decision_score(opinions)
    conviction = determine_conviction(decision_score)

    # Determine final decision
    if decision_score >= 85:
        final_decision = Decision.STRONG_BUY
    elif decision_score >= 65:
        final_decision = Decision.BUY
    elif decision_score >= 35:
        final_decision = Decision.HOLD
    elif decision_score >= 15:
        final_decision = Decision.SELL
    else:
        final_decision = Decision.STRONG_SELL

    # Aggregate views
    aggregated = aggregate_opinions(opinions)

    # Calculate vote breakdown
    vote_breakdown = {}
    for opinion in opinions:
        stance = opinion.stance.value
        vote_breakdown[stance] = vote_breakdown.get(stance, 0) + 1

    # Calculate risk score (inverse of conviction)
    risk_score = 100 - decision_score

    # Generate debate log
    debate_log = generate_debate_log(opinions)

    # Create decision
    decision = CouncilDecision(
        decision_id=decision_id,
        symbol=request.symbol.upper(),
        company_name=request.company_name or request.symbol.upper(),
        final_decision=final_decision,
        confidence=decision_score / 100,
        conviction=conviction,
        decision_score=decision_score,
        bull_case=aggregated["bull_case"],
        bear_case=aggregated["bear_case"],
        major_risks=aggregated["major_risks"],
        risk_score=risk_score,
        catalysts=aggregated["catalysts"],
        headwinds=aggregated["bear_case"][:3],
        analyst_opinions=opinions,
        vote_breakdown=vote_breakdown,
        debate_log=debate_log,
        triggered_by="council_convene",
        created_at=datetime.utcnow()
    )

    # Calculate expected return
    if decision.target_price and decision.current_price:
        decision.expected_return = (
            (decision.target_price - decision.current_price) / decision.current_price * 100
        )

    COUNCIL_DECISIONS[decision_id] = decision
    return decision


def generate_analyst_opinion(
    role: CouncilRole,
    analyst: Dict,
    symbol: str,
    context: Dict
) -> AnalystOpinion:
    """Generate an analyst's opinion based on their bias"""

    # Mock opinions based on analyst bias
    biases = {
        "bullish": (Decision.BUY, 0.75, ["Strong growth trajectory", "Market leader", "Innovation pipeline"]),
        "bearish": (Decision.SELL, 0.65, ["Valuation stretched", "Competition increasing", "Market saturation"]),
        "neutral": (Decision.HOLD, 0.55, ["Wait for clarity", "Monitor for entry", "Balanced risk/reward"]),
        "cautious": (Decision.HOLD, 0.50, ["Volatility concerns", "Macro headwinds", "Uncertain outlook"]),
        "data_driven": (Decision.HOLD, 0.60, ["Technical setup neutral", "RSI at 55", "Volume declining"]),
        "balanced": (Decision.HOLD, 0.55, ["Good diversification", "Acceptable risk", "Moderate conviction"]),
        "catalyst_focused": (Decision.BUY, 0.70, ["Earnings beat expected", "Product launch ahead", "Partnership announcement"]),
        "value": (Decision.HOLD, 0.55, ["PE reasonable", "DCF shows upside", "FCF strong"]),
        "sentiment_tracking": (Decision.HOLD, 0.50, ["Retail interest rising", "Short interest mixed", "Options flow neutral"]),
        "informed": (Decision.BUY, 0.72, ["Insider buying", "Institutional accumulation", "Smart money moving"])
    }

    bias_data = biases.get(analyst["bias"], biases["neutral"])

    opinion = AnalystOpinion(
        role=role,
        analyst_name=analyst["name"],
        stance=bias_data[0],
        conviction=bias_data[2],
        confidence=bias_data[1],
        reasoning=[
            f"Based on {analyst['title']} analysis",
            f"Expertise: {', '.join(analyst['expertise'][:2])}",
            f"Investment style: {analyst['style']}"
        ],
        supporting_evidence=bias_data[3][:2],
        opposing_evidence=[],
        key_factors=bias_data[3],
        target_price=850.0 if symbol == "NVDA" else 200.0,  # Mock
        expected_return=15.0,  # Mock
        concerns=["Market volatility", "Competition risk", "Macro uncertainty"] if bias_data[0] in [Decision.SELL, Decision.STRONG_SELL] else [],
        opportunities=bias_data[3] if bias_data[0] in [Decision.BUY, Decision.STRONG_BUY] else []
    )

    return opinion


def generate_debate_log(opinions: List[AnalystOpinion]) -> List[DebateRound]:
    """Generate mock debate log between analysts"""
    log = []

    # Opening statements
    for opinion in opinions[:3]:
        log.append(DebateRound(
            round_number=1,
            speaker=opinion.role,
            topic="Opening",
            argument=f"{opinion.analyst_name} presents {opinion.stance.value} case",
            evidence=opinion.supporting_evidence[:2],
            timestamp=datetime.utcnow()
        ))

    # Cross-examination
    log.append(DebateRound(
        round_number=2,
        speaker=CouncilRole.BEAR_ANALYST,
        topic="Challenge",
        argument="What are the main risks to this thesis?",
        evidence=[],
        counter_arguments=["Valuation concerns", "Competitive threats"],
        timestamp=datetime.utcnow()
    ))

    # Response
    log.append(DebateRound(
        round_number=3,
        speaker=CouncilRole.BULL_ANALYST,
        topic="Defense",
        argument="Addressing the bear concerns",
        evidence=["Growth metrics strong", "Market position defensible"],
        counter_arguments=[],
        timestamp=datetime.utcnow()
    ))

    return log


@app.get("/decisions/{decision_id}")
async def get_decision(decision_id: str):
    """Get a specific council decision"""
    if decision_id not in COUNCIL_DECISIONS:
        raise HTTPException(status_code=404, detail="Decision not found")
    return COUNCIL_DECISIONS[decision_id]


@app.get("/decisions/{decision_id}/debate")
async def get_debate_log(decision_id: str):
    """Get full debate log for a decision"""
    if decision_id not in COUNCIL_DECISIONS:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision = COUNCIL_DECISIONS[decision_id]
    return {
        "decision_id": decision_id,
        "symbol": decision.symbol,
        "final_decision": decision.final_decision.value,
        "debate_log": decision.debate_log
    }


@app.get("/decisions/history")
async def get_decision_history(symbol: Optional[str] = None, limit: int = 20):
    """Get council decision history"""
    decisions = list(COUNCIL_DECISIONS.values())

    if symbol:
        decisions = [d for d in decisions if d.symbol == symbol.upper()]

    decisions.sort(key=lambda d: d.created_at, reverse=True)

    return {
        "decisions": decisions[:limit],
        "total": len(decisions)
    }


# =============================================================================
# INDIVIDUAL ANALYST CONSULTATION
# =============================================================================

@app.post("/analysts/{role}/opinion")
async def get_analyst_opinion(role: CouncilRole, symbol: str):
    """Get single analyst's opinion on a symbol"""
    if role not in ANALYSTS:
        raise HTTPException(status_code=404, detail="Analyst not found")

    analyst = ANALYSTS[role]
    opinion = generate_analyst_opinion(role, analyst, symbol, {})

    return {
        "analyst": analyst,
        "opinion": opinion
    }


# =============================================================================
# QUICK DECISION
# =============================================================================

@app.post("/quick-decision")
async def quick_decision(symbol: str):
    """
    Quick decision without full debate.

    For simple queries where speed matters more than depth.
    """
    # Run only essential analysts
    essential_roles = [
        CouncilRole.BULL_ANALYST,
        CouncilRole.BEAR_ANALYST,
        CouncilRole.MACRO_ANALYST,
        CouncilRole.RISK_ANALYST
    ]

    opinions = []
    for role in essential_roles:
        analyst = ANALYSTS.get(role)
        if analyst:
            opinion = generate_analyst_opinion(role, analyst, symbol, {})
            opinions.append(opinion)

    decision_score = calculate_decision_score(opinions)

    if decision_score >= 70:
        final = Decision.BUY
    elif decision_score <= 30:
        final = Decision.SELL
    else:
        final = Decision.HOLD

    return {
        "symbol": symbol.upper(),
        "decision": final.value,
        "confidence": decision_score,
        "analysts_consulted": len(opinions),
        "timestamp": datetime.utcnow().isoformat()
    }


# =============================================================================
# COMPARATIVE ANALYSIS
# =============================================================================

@app.post("/compare")
async def compare_symbols(symbols: List[str]):
    """
    Compare multiple symbols through council debate.
    """
    comparisons = []

    for symbol in symbols:
        # Quick decision for each
        essential_roles = [
            CouncilRole.BULL_ANALYST,
            CouncilRole.BEAR_ANALYST,
            CouncilRole.RISK_ANALYST
        ]

        opinions = []
        for role in essential_roles:
            analyst = ANALYSTS.get(role)
            if analyst:
                opinion = generate_analyst_opinion(role, analyst, symbol, {})
                opinions.append(opinion)

        score = calculate_decision_score(opinions)
        comparisons.append({
            "symbol": symbol.upper(),
            "score": score,
            "decision": "BUY" if score >= 65 else ("SELL" if score <= 35 else "HOLD"),
            "bull_analyst": opinions[0].expected_return if opinions else 0
        })

    # Sort by score
    comparisons.sort(key=lambda x: x["score"], reverse=True)

    return {
        "rankings": comparisons,
        "best_pick": comparisons[0] if comparisons else None,
        "timestamp": datetime.utcnow().isoformat()
    }


# =============================================================================
# SECTOR COUNCIL
# =============================================================================

@app.post("/sector/opinion")
async def get_sector_opinion(sector: str):
    """
    Get council opinion on an entire sector.

    Example: "Technology", "Healthcare", "Energy"
    """
    sector_analysts = [
        CouncilRole.MACRO_ANALYST,
        CouncilRole.RISK_ANALYST,
        CouncilRole.QUANT_ANALYST
    ]

    opinions = []
    for role in sector_analysts:
        analyst = ANALYSTS.get(role)
        if analyst:
            opinion = generate_analyst_opinion(role, analyst, sector, {"sector": sector})
            opinions.append(opinion)

    score = calculate_decision_score(opinions)

    return {
        "sector": sector,
        "decision": "POSITIVE" if score >= 60 else ("NEGATIVE" if score <= 40 else "NEUTRAL"),
        "confidence": score,
        "analysts": [
            {"name": o.analyst_name, "stance": o.stance.value}
            for o in opinions
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5195)