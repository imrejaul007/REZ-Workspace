"""
AssetMind Intelligence Hub
Central orchestration layer for all AssetMind services

Port: 5298

Routes queries to appropriate services and chains responses together.
Provides unified access to investment decisions, research, trading, and portfolio
management across the AssetMind ecosystem.

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
    title="AssetMind Intelligence Hub",
    description="Central orchestration layer for all AssetMind services",
    version="1.0.0",
)


# ============================================================================
# Enums
# ============================================================================

class QueryIntent(str, Enum):
    INVESTMENT = "investment"
    RESEARCH = "research"
    TRADE = "trade"
    PORTFOLIO = "portfolio"
    RISK = "risk"
    GENERAL = "general"


class ServiceStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"
    UNKNOWN = "unknown"


class Recommendation(str, Enum):
    STRONG_BUY = "strong_buy"
    BUY = "buy"
    HOLD = "hold"
    SELL = "sell"
    STRONG_SELL = "strong_sell"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# ============================================================================
# Pydantic Models - Service Registry
# ============================================================================

class ServiceEndpoint(BaseModel):
    """Represents a connected service."""
    name: str
    port: int
    status: ServiceStatus = ServiceStatus.UNKNOWN
    last_health_check: Optional[datetime] = None
    response_time_ms: int = 0
    requests_total: int = 0
    errors_total: int = 0


class ConnectedServices(BaseModel):
    """Status of all connected services."""
    services: Dict[str, ServiceEndpoint] = {}
    healthy_count: int = 0
    degraded_count: int = 0
    down_count: int = 0


# ============================================================================
# Pydantic Models - Queries & Responses
# ============================================================================

class QueryRequest(BaseModel):
    """Unified query request."""
    query: str = Field(..., min_length=1, max_length=500)
    context: Optional[Dict[str, Any]] = None
    include_reasoning: bool = True
    max_services: int = Field(default=5, ge=1, le=10)


class ServiceResponse(BaseModel):
    """Response from a single service."""
    service_name: str
    port: int
    response: Dict[str, Any]
    response_time_ms: int
    success: bool
    error: Optional[str] = None


class QueryResponse(BaseModel):
    """Unified query response."""
    query_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    original_query: str

    # Intent
    detected_intent: QueryIntent
    confidence: float = 0.0

    # Service responses
    service_responses: List[ServiceResponse] = []

    # Aggregated response
    decision: Optional[Recommendation] = None
    confidence: float = 0.0
    key_insights: List[str] = []
    suggested_actions: List[Dict[str, Any]] = []

    # Metadata
    processed_at: datetime = Field(default_factory=datetime.utcnow)
    total_processing_time_ms: int = 0

    class Config:
        from_attributes = True


class ChainRequest(BaseModel):
    """Request to chain multiple services."""
    services: List[str]  # Service names to chain
    symbol: Optional[str] = None
    parameters: Dict[str, Any] = {}


class ChainStep(BaseModel):
    """A step in service chaining."""
    step_number: int
    service_name: str
    input_from_previous: Optional[str] = None
    output: Optional[Dict[str, Any]] = None
    status: str = "pending"
    duration_ms: int = 0


class ChainResponse(BaseModel):
    """Response from service chaining."""
    chain_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    steps: List[ChainStep] = []
    final_output: Optional[Dict[str, Any]] = None
    total_duration_ms: int = 0


# ============================================================================
# Pydantic Models - Recommendations
# ============================================================================

class RecommendationSource(BaseModel):
    """Source of a recommendation."""
    service: str
    service_name: str
    confidence: float
    reasoning: str


class SymbolRecommendation(BaseModel):
    """Comprehensive recommendations for a symbol."""
    symbol: str
    recommendation: Recommendation
    confidence: float
    target_price: Optional[float] = None
    time_horizon: str = "medium"  # short, medium, long

    # Sources
    sources: List[RecommendationSource] = []

    # Key factors
    bull_case: List[str] = []
    bear_case: List[str] = []
    risks: List[str] = []

    # Actions
    suggested_actions: List[Dict[str, Any]] = []

    # Metadata
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    valid_until: datetime


# ============================================================================
# Request/Response Models
# ============================================================================

class UnifiedQueryRequest(BaseModel):
    """Request for unified query processing."""
    query: str
    user_id: Optional[str] = None
    portfolio_id: Optional[str] = None


class RecommendationRequest(BaseModel):
    """Request recommendations for a symbol."""
    symbol: str = Field(..., min_length=1, max_length=20)
    include_sources: bool = True


# ============================================================================
# In-Memory Storage & State
# ============================================================================

# Service registry
SERVICES = {
    "council": ServiceEndpoint(name="Council", port=5195),
    "rexmind": ServiceEndpoint(name="RexMind", port=5160),
    "reasoning": ServiceEndpoint(name="Reasoning Engine", port=5055),
    "event_os": ServiceEndpoint(name="Event OS", port=5052),
    "copilot": ServiceEndpoint(name="Copilot", port=5295),
    "market_twin": ServiceEndpoint(name="Market Twin", port=5006),
    "portfolio_twin": ServiceEndpoint(name="Portfolio Twin", port=5004),
    "asset_twin": ServiceEndpoint(name="Asset Twin", port=5002),
    "investor_twin": ServiceEndpoint(name="Investor Twin", port=5005),
    "trading_engine": ServiceEndpoint(name="Trading Engine", port=5102),
}

# Query history
queries_db: Dict[str, QueryResponse] = {}
chains_db: Dict[str, ChainResponse] = {}
recommendations_db: Dict[str, SymbolRecommendation] = {}

# Intent keywords mapping
INTENT_KEYWORDS = {
    QueryIntent.INVESTMENT: ["invest", "buy", "sell", "stock", "should", "recommendation", "position"],
    QueryIntent.RESEARCH: ["research", "analyze", "understand", "what is", "tell me", "explain"],
    QueryIntent.TRADE: ["trade", "execute", "order", "buy now", "sell now", "market order"],
    QueryIntent.PORTFOLIO: ["portfolio", "allocation", "diversify", "rebalance", "holdings"],
    QueryIntent.RISK: ["risk", "volatility", "exposure", "drawdown", "loss", "safety"],
}


# ============================================================================
# Helper Functions
# ============================================================================

def detect_intent(query: str) -> tuple[QueryIntent, float]:
    """Detect the intent of a query."""
    query_lower = query.lower()
    scores = {}

    for intent, keywords in INTENT_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in query_lower)
        scores[intent] = score

    if not scores or max(scores.values()) == 0:
        return QueryIntent.GENERAL, 0.5

    best_intent = max(scores, key=scores.get)
    confidence = min(scores[best_intent] / 3, 1.0)
    return best_intent, confidence


def route_to_services(intent: QueryIntent, query: str) -> List[str]:
    """Determine which services to route to based on intent."""
    routing_map = {
        QueryIntent.INVESTMENT: ["council", "rexmind", "market_twin"],
        QueryIntent.RESEARCH: ["reasoning", "event_os", "asset_twin"],
        QueryIntent.TRADE: ["trading_engine", "council"],
        QueryIntent.PORTFOLIO: ["portfolio_twin", "investor_twin", "copilot"],
        QueryIntent.RISK: ["rexmind", "event_os", "portfolio_twin"],
        QueryIntent.GENERAL: ["council", "copilot", "reasoning"],
    }
    return routing_map.get(intent, ["council"])


def simulate_service_call(service_name: str, query: str) -> ServiceResponse:
    """Simulate calling a service and getting a response."""
    response_times = {
        "council": 250,
        "rexmind": 180,
        "reasoning": 320,
        "event_os": 150,
        "copilot": 200,
        "market_twin": 120,
        "portfolio_twin": 180,
        "asset_twin": 150,
        "investor_twin": 200,
        "trading_engine": 100,
    }

    response_time = response_times.get(service_name, 200)

    # Simulate service responses
    responses = {
        "council": {
            "decision": random.choice(["buy", "hold", "sell"]),
            "confidence": random.uniform(0.6, 0.9),
            "votes": {"buy": 7, "hold": 2, "sell": 1},
        },
        "rexmind": {
            "signal": random.choice(["bullish", "bearish", "neutral"]),
            "strength": random.uniform(0.5, 0.9),
        },
        "reasoning": {
            "causal_chain": ["Market conditions", "Earnings growth", "Price appreciation"],
            "confidence": random.uniform(0.6, 0.85),
        },
        "event_os": {
            "events": [{"type": "earnings", "impact": "positive"}],
            "sentiment": "positive",
        },
        "copilot": {
            "actions": [{"action": "Add to watchlist", "priority": "high"}],
        },
        "market_twin": {
            "market_phase": "bull",
            "trend": "bullish",
        },
        "portfolio_twin": {
            "current_allocation": {"stocks": 70, "bonds": 30},
        },
        "asset_twin": {
            "fair_value": random.uniform(150, 200),
            "upside": random.uniform(5, 25),
        },
        "investor_twin": {
            "risk_profile": "moderate",
            "suitability": "suitable",
        },
        "trading_engine": {
            "order_status": "ready",
            "bid": random.uniform(150, 160),
            "ask": random.uniform(160, 165),
        },
    }

    return ServiceResponse(
        service_name=SERVICES[service_name].name,
        port=SERVICES[service_name].port,
        response=responses.get(service_name, {"status": "ok"}),
        response_time_ms=response_time,
        success=True,
    )


def aggregate_responses(responses: List[ServiceResponse], intent: QueryIntent) -> Dict[str, Any]:
    """Aggregate responses from multiple services."""
    decisions = []
    confidences = []

    for resp in responses:
        if "decision" in resp.response:
            decisions.append(resp.response["decision"])
        if "confidence" in resp.response:
            confidences.append(resp.response["confidence"])
        if "strength" in resp.response:
            confidences.append(resp.response["strength"])

    # Determine final decision
    if decisions:
        buy_count = decisions.count("buy") + decisions.count("bullish")
        sell_count = decisions.count("sell") + decisions.count("bearish")

        if buy_count > sell_count + 1:
            final_decision = Recommendation.BUY
        elif sell_count > buy_count + 1:
            final_decision = Recommendation.SELL
        else:
            final_decision = Recommendation.HOLD
    else:
        final_decision = Recommendation.HOLD

    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.7

    return {
        "decision": final_decision,
        "confidence": avg_confidence,
        "insights": [f"Response from {r.service_name}: {r.response.get('signal', r.response.get('decision', 'processed'))}" for r in responses[:3]],
    }


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check with connected services status."""
    healthy = sum(1 for s in SERVICES.values() if s.status == ServiceStatus.HEALTHY)
    return {
        "status": "healthy",
        "service": "assetmind-intelligence-hub",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "connected_services": len(SERVICES),
        "healthy_services": healthy,
        "total_queries": len(queries_db),
    }


@app.get("/health/services", response_model=ConnectedServices)
async def get_services_status():
    """Get status of all connected services."""
    connected = ConnectedServices(services=SERVICES)

    for service in SERVICES.values():
        if service.status == ServiceStatus.HEALTHY:
            connected.healthy_count += 1
        elif service.status == ServiceStatus.DEGRADED:
            connected.degraded_count += 1
        elif service.status == ServiceStatus.DOWN:
            connected.down_count += 1

    return connected


# ============================================================================
# Query Endpoints
# ============================================================================

@app.post("/query", response_model=QueryResponse, status_code=201)
async def process_query(request: QueryRequest):
    """Process a unified query through the intelligence hub."""
    start_time = datetime.utcnow()

    # Detect intent
    intent, intent_confidence = detect_intent(request.query)

    # Route to services
    service_names = route_to_services(intent, request.query)
    if len(service_names) > request.max_services:
        service_names = service_names[:request.max_services]

    # Call services
    responses = []
    for svc in service_names:
        if svc in SERVICES:
            resp = simulate_service_call(svc, request.query)
            responses.append(resp)

    # Aggregate responses
    aggregated = aggregate_responses(responses, intent)

    # Build query response
    query_resp = QueryResponse(
        original_query=request.query,
        detected_intent=intent,
        confidence=intent_confidence,
        service_responses=responses,
        decision=aggregated.get("decision"),
        confidence=aggregated.get("confidence", 0.7),
        key_insights=aggregated.get("insights", []),
        suggested_actions=[
            {"action": "Monitor position", "priority": Priority.MEDIUM.value},
            {"action": "Review in 24 hours", "priority": Priority.LOW.value},
        ],
    )

    end_time = datetime.utcnow()
    query_resp.total_processing_time_ms = int((end_time - start_time).total_seconds() * 1000)

    queries_db[query_resp.query_id] = query_resp
    return query_resp


@app.get("/query/history", response_model=List[QueryResponse])
async def get_query_history(limit: int = Query(20, ge=1, le=100)):
    """Get query history."""
    results = sorted(queries_db.values(), key=lambda q: q.processed_at, reverse=True)
    return results[:limit]


@app.get("/query/{query_id}", response_model=QueryResponse)
async def get_query(query_id: str):
    """Get a specific query."""
    if query_id not in queries_db:
        raise HTTPException(status_code=404, detail="Query not found")
    return queries_db[query_id]


# ============================================================================
# Chain Endpoints
# ============================================================================

@app.post("/chain", response_model=ChainResponse, status_code=201)
async def chain_services(request: ChainRequest):
    """Chain multiple services together."""
    start_time = datetime.utcnow()
    steps = []

    for i, service_name in enumerate(request.services):
        step = ChainStep(
            step_number=i + 1,
            service_name=service_name,
            input_from_previous=request.parameters.get("previous_output") if i > 0 else None,
        )

        if service_name in SERVICES:
            svc_resp = simulate_service_call(service_name, str(request.parameters))
            step.output = svc_resp.response
            step.status = "completed"
            step.duration_ms = svc_resp.response_time_ms
        else:
            step.status = "failed"
            step.output = {"error": "Service not found"}

        steps.append(step)

    # Build final output
    successful_steps = [s for s in steps if s.status == "completed"]
    final_output = successful_steps[-1].output if successful_steps else None

    chain_resp = ChainResponse(
        steps=steps,
        final_output=final_output,
        total_duration_ms=int((datetime.utcnow() - start_time).total_seconds() * 1000),
    )

    chains_db[chain_resp.chain_id] = chain_resp
    return chain_resp


@app.get("/chain/{chain_id}", response_model=ChainResponse)
async def get_chain(chain_id: str):
    """Get a specific chain execution."""
    if chain_id not in chains_db:
        raise HTTPException(status_code=404, detail="Chain not found")
    return chains_db[chain_id]


# ============================================================================
# Recommendation Endpoints
# ============================================================================

@app.get("/recommendations/{symbol}", response_model=SymbolRecommendation)
async def get_recommendations(symbol: str):
    """Get comprehensive recommendations for a symbol."""
    symbol_upper = symbol.upper()

    # Check cache
    if symbol_upper in recommendations_db:
        return recommendations_db[symbol_upper]

    # Generate recommendations
    confidence = random.uniform(0.6, 0.85)
    rec = random.choice([Recommendation.STRONG_BUY, Recommendation.BUY, Recommendation.HOLD])

    recommendation = SymbolRecommendation(
        symbol=symbol_upper,
        recommendation=rec,
        confidence=confidence,
        target_price=random.uniform(150, 250),
        time_horizon="medium",
        sources=[
            RecommendationSource(
                service="council",
                service_name="Financial Council",
                confidence=confidence,
                reasoning="Multi-agent analysis supports position",
            ),
            RecommendationSource(
                service="rexmind",
                service_name="RexMind Engine",
                confidence=random.uniform(0.6, 0.8),
                reasoning="Technical and fundamental signals align",
            ),
        ],
        bull_case=["Strong earnings growth", "Market leadership position", "Favorable industry trends"],
        bear_case=["Valuation concerns", "Competitive pressure", "Macro headwinds"],
        risks=["Interest rate sensitivity", "Market volatility", "Execution risk"],
        suggested_actions=[
            {"action": "Add to watchlist", "priority": Priority.HIGH.value},
            {"action": "Monitor for entry point", "priority": Priority.MEDIUM.value},
        ],
        valid_until=datetime.utcnow(),
    )

    recommendations_db[symbol_upper] = recommendation
    return recommendation


@app.get("/recommendations")
async def list_recommendations(limit: int = Query(20, ge=1, le=100)):
    """List all cached recommendations."""
    return list(recommendations_db.values())[:limit]


# ============================================================================
# Connected Services Info
# ============================================================================

@app.get("/services")
async def list_services():
    """List all available services."""
    return [
        {
            "name": svc.name,
            "port": svc.port,
            "status": svc.status.value,
        }
        for svc in SERVICES.values()
    ]


@app.get("/services/{service_name}")
async def get_service(service_name: str):
    """Get details for a specific service."""
    if service_name not in SERVICES:
        raise HTTPException(status_code=404, detail="Service not found")
    svc = SERVICES[service_name]
    return {
        "name": svc.name,
        "port": svc.port,
        "status": svc.status.value,
        "requests_total": svc.requests_total,
        "errors_total": svc.errors_total,
        "avg_response_time_ms": svc.response_time_ms,
        "last_health_check": svc.last_health_check.isoformat() if svc.last_health_check else None,
    }


# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    print("Starting AssetMind Intelligence Hub on port 5298")
    uvicorn.run(app, host="0.0.0.0", port=5298)