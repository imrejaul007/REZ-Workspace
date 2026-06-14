"""
AssetMind - Agent Orchestrator
Port: 5090
Central orchestrator for all AI agents
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum
import asyncio
import uuid


app = FastAPI(title="AssetMind Agent Orchestrator", version="1.0.0")


class QueryType(str, Enum):
    ASSET_ANALYSIS = "ASSET_ANALYSIS"
    MARKET_ANALYSIS = "MARKET_ANALYSIS"
    PORTFOLIO_ANALYSIS = "PORTFOLIO_ANALYSIS"
    OPPORTUNITY_FINDING = "OPPORTUNITY_FINDING"
    RISK_ASSESSMENT = "RISK_ASSESSMENT"
    NEWS_ANALYSIS = "NEWS_ANALYSIS"
    EARNINGS_ANALYSIS = "EARNINGS_ANALYSIS"
    SENTIMENT_ANALYSIS = "SENTIMENT_ANALYSIS"
    RESEARCH_REPORT = "RESEARCH_REPORT"
    COMPARATIVE_ANALYSIS = "COMPARATIVE_ANALYSIS"


class QueryRequest(BaseModel):
    query: str
    query_type: QueryType
    context: Dict[str, Any] = Field(default_factory=dict)
    priority: int = Field(1, ge=1, le=5)


class AgentResponse(BaseModel):
    agent_name: str
    status: str
    result: Dict[str, Any]
    confidence: float
    reasoning: List[str] = Field(default_factory=list)
    execution_time_ms: int


class QueryResponse(BaseModel):
    query_id: str
    query_type: str
    primary_response: Dict[str, Any]
    agent_responses: List[AgentResponse]
    final_recommendation: Dict[str, Any]
    confidence: float
    reasoning_chain: List[str] = Field(default_factory=list)
    timestamp: datetime
    execution_time_ms: int


# Agent registry
AGENTS = {
    "asset_agent": {"port": 5100, "specialty": ["profile", "relationships", "history"]},
    "news_agent": {"port": 5101, "specialty": ["news", "events", "announcements"]},
    "sentiment_agent": {"port": 5102, "specialty": ["social", "sentiment", "trends"]},
    "quant_agent": {"port": 5103, "specialty": ["technical", "patterns", "indicators"]},
    "macro_agent": {"port": 5104, "specialty": ["macro", "rates", "inflation", "GDP"]},
    "risk_agent": {"port": 5105, "specialty": ["risk", "scenarios", "downside"]},
    "portfolio_agent": {"port": 5106, "specialty": ["portfolio", "allocation", "optimization"]},
    "earnings_agent": {"port": 5107, "specialty": ["earnings", "guidance", "beats"]},
    "research_agent": {"port": 5109, "specialty": ["reports", "analysis", "theses"]},
    "discovery_agent": {"port": 5111, "specialty": ["opportunities", "themes", "discovery"]},
}


def route_query(query: QueryRequest) -> List[str]:
    """Determine which agents to invoke"""
    agents = []

    if query.query_type == QueryType.ASSET_ANALYSIS:
        agents = ["asset_agent", "sentiment_agent", "risk_agent", "research_agent"]
    elif query.query_type == QueryType.MARKET_ANALYSIS:
        agents = ["macro_agent", "sentiment_agent", "risk_agent"]
    elif query.query_type == QueryType.RESEARCH_REPORT:
        agents = ["asset_agent", "research_agent", "risk_agent", "macro_agent"]
    elif query.query_type == QueryType.RISK_ASSESSMENT:
        agents = ["risk_agent", "macro_agent"]
    elif query.query_type == QueryType.OPPORTUNITY_FINDING:
        agents = ["discovery_agent", "sentiment_agent", "quant_agent"]
    else:
        agents = ["research_agent"]

    return agents


async def invoke_agent(agent_name: str, query: QueryRequest) -> AgentResponse:
    """Simulate agent invocation"""
    import time
    start = time.time()

    result = {
        "agent": agent_name,
        "summary": f"Analysis from {agent_name}",
        "key_findings": [f"Finding from {agent_name}"],
        "confidence": 75.0,
        "recommendation": "BUY" if agent_name != "risk_agent" else "HOLD"
    }

    return AgentResponse(
        agent_name=agent_name,
        status="COMPLETED",
        result=result,
        confidence=75.0,
        reasoning=[f"Analysis completed by {agent_name}"],
        execution_time_ms=int((time.time() - start) * 1000)
    )


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-agent-orchestrator",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5090,
        "agents": len(AGENTS)
    }


@app.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """Process a user query through the agent system"""
    import time
    start = time.time()

    query_id = str(uuid.uuid4())
    agent_list = route_query(request)

    tasks = [invoke_agent(agent, request) for agent in agent_list]
    agent_responses = await asyncio.gather(*tasks)

    # Synthesize response
    buy_count = sum(1 for r in agent_responses if r.result.get("recommendation") == "BUY")
    sell_count = sum(1 for r in agent_responses if r.result.get("recommendation") == "SELL")

    final_rec = "BUY" if buy_count > sell_count else ("SELL" if sell_count > buy_count else "HOLD")

    synthesis = {
        "recommendation": final_rec,
        "confidence": sum(r.confidence for r in agent_responses) / len(agent_responses),
        "reasoning_chain": [r.reasoning[0] for r in agent_responses if r.reasoning],
        "sources": list(set(sum([r.result.get("sources", []) for r in agent_responses], [])))
    }

    execution_time = int((time.time() - start) * 1000)

    return QueryResponse(
        query_id=query_id,
        query_type=request.query_type.value,
        primary_response=synthesis,
        agent_responses=agent_responses,
        final_recommendation=synthesis,
        confidence=synthesis["confidence"],
        reasoning_chain=synthesis["reasoning_chain"],
        timestamp=datetime.utcnow(),
        execution_time_ms=execution_time
    )


@app.get("/agents")
async def list_agents():
    """List all available agents"""
    return {
        "agents": [
            {"name": name, "port": info["port"], "specialty": info["specialty"]}
            for name, info in AGENTS.items()
        ]
    }


@app.get("/query-types")
async def list_query_types():
    """List supported query types"""
    return {"types": [qt.value for qt in QueryType]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5090)
