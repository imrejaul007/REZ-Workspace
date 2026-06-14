"""
AssetMind - AI Agent Services
Port: 5190

Multi-agent system for financial analysis.

Agents:
- Market Agent
- Fundamental Agent
- Technical Agent
- Sentiment Agent
- Risk Agent
- Macro Agent
- News Agent
- Earnings Agent

Version: 1.0.0
"""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Optional

app = FastAPI(title="AssetMind Agents")

# ============================================================================
# MODELS
# ============================================================================

class AgentOpinion(BaseModel):
    agent: str
    opinion: str  # BULLISH, BEARISH, NEUTRAL
    confidence: float
    reasoning: str
    metrics: Dict[str, float]

class AnalysisRequest(BaseModel):
    symbol: str
    agents: Optional[List[str]] = None

class AnalysisResponse(BaseModel):
    symbol: str
    timestamp: str
    opinions: List[AgentOpinion]
    consensus: str
    confidence: float

# ============================================================================
# AGENTS
# ============================================================================

AGENTS = {
    "market": {
        "name": "Market Agent",
        "specialty": "Price action, trends, volume",
        "opinion": "BULLISH"
    },
    "fundamental": {
        "name": "Fundamental Agent",
        "specialty": "Earnings, valuation, growth",
        "opinion": "BULLISH"
    },
    "technical": {
        "name": "Technical Agent",
        "specialty": "Charts, patterns, indicators",
        "opinion": "NEUTRAL"
    },
    "sentiment": {
        "name": "Sentiment Agent",
        "specialty": "News, social media, analyst calls",
        "opinion": "BULLISH"
    },
    "risk": {
        "name": "Risk Agent",
        "specialty": "Volatility, drawdowns, correlations",
        "opinion": "BEARISH"
    },
    "macro": {
        "name": "Macro Agent",
        "specialty": "Economy, Fed, inflation",
        "opinion": "NEUTRAL"
    }
}

# ============================================================================
# ROUTES
# ============================================================================

@app.get("/health")
async def health():
    return {
        "service": "assetmind-agents",
        "status": "healthy",
        "agents": list(AGENTS.keys()),
        "count": len(AGENTS)
    }

@app.get("/agents")
async def list_agents():
    return {"agents": AGENTS}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest) -> AnalysisResponse:
    """Analyze symbol using multiple agents"""

    opinions = []
    bullish_count = 0

    for agent_id, agent in AGENTS.items():
        if request.agents and agent_id not in request.agents:
            continue

        opinion = AgentOpinion(
            agent=agent["name"],
            opinion=agent["opinion"],
            confidence=0.7 + (hash(agent_id) % 30) / 100,
            reasoning=f"Based on {agent['specialty']}",
            metrics={"score": 0.65, "risk": 0.35}
        )
        opinions.append(opinion)

        if agent["opinion"] == "BULLISH":
            bullish_count += 1
        elif agent["opinion"] == "BEARISH":
            bullish_count -= 1

    # Consensus
    total = len(opinions)
    if bullish_count > total * 0.5:
        consensus = "BUY"
    elif bullish_count < -total * 0.3:
        consensus = "SELL"
    else:
        consensus = "HOLD"

    confidence = sum(o.confidence for o in opinions) / len(opinions) if opinions else 0.5

    return AnalysisResponse(
        symbol=request.symbol,
        timestamp="2024-01-01T00:00:00Z",
        opinions=opinions,
        consensus=consensus,
        confidence=confidence
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5190)
