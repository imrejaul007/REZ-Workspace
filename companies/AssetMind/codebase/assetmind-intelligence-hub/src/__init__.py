"""
AssetMind - Intelligence Hub
Port: 5298

The Integration Layer - Orchestrates everything.

Routes queries to the right services and chains responses.

User: "Should I invest in NVIDIA?"

Hub orchestrates:
1. Event Intelligence → Any upcoming events?
2. Reasoning Engine → What causes NVIDIA to move?
3. Financial Council → What do analysts say?
4. Twin Engine → What does the asset twin show?
5. Knowledge Graph → Supply chain relationships?
6. Copilot → What actions should I take?

Returns unified response.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum
import httpx
import asyncio
import uuid


app = FastAPI(
    title="AssetMind Intelligence Hub",
    version="1.0.0",
    description="The Integration Layer - Orchestrates everything"
)


# =============================================================================
# SERVICE CONNECTIONS
# =============================================================================

SERVICE_URLS = {
    "council": os.getenv("SVC_COUNCIL", "http://localhost:5195"),
    "reasoning": os.getenv("SVC_REASONING", "http://localhost:5055"),
    "event": os.getenv("SVC_EVENT", "http://localhost:5051"),
    "event_os": os.getenv("SVC_EVENT_OS", "http://localhost:5052"),
    "ontology": os.getenv("SVC_ONTOLOGY", "http://localhost:5045"),
    "twin_v2": os.getenv("SVC_TWIN_V2", "http://localhost:5002"),
    "portfolio_twin": os.getenv("SVC_PORTFOLIO_TWIN", "http://localhost:5004"),
    "investor_twin": os.getenv("SVC_INVESTOR_TWIN", "http://localhost:5005"),
    "economic_twin": os.getenv("SVC_ECONOMIC_TWIN", "http://localhost:5041"),
    "copilot": os.getenv("SVC_COPILOT", "http://localhost:5295"),
    "workflow": "http://localhost:5290",
    "rexmind": "http://localhost:5160",
    "memory": "http://localhost:5030",
    "knowledge_graph": "http://localhost:5040",
    "semantic_search": "http://localhost:5170",
    "rl_trading": "http://localhost:5180",
}


class QueryType(str, Enum):
    INVESTMENT = "investment"      # Should I invest?
    RESEARCH = "research"        # Deep research
    TRADE = "trade"             # Trading decision
    PORTFOLIO = "portfolio"      # Portfolio analysis
    ALERT = "alert"            # Watch for opportunities
    GENERAL = "general"          # General question


class QueryIntent(str, Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"
    RESEARCH = "research"
    MONITOR = "monitor"


# =============================================================================
# ORCHESTRATION MODELS
# =============================================================================

class OrchestratedQuery(BaseModel):
    """A query that orchestrates multiple services"""
    query_id: str
    original_query: str
    query_type: QueryType
    intent: Optional[QueryIntent] = None
    symbols: List[str] = Field(default_factory=list)
    context: Dict[str, Any] = Field(default_factory=dict)


class ServiceResponse(BaseModel):
    """Response from a single service"""
    service: str
    endpoint: str
    data: Dict[str, Any]
    latency_ms: float
    success: bool
    error: Optional[str] = None


class OrchestratedResponse(BaseModel):
    """Unified response from all services"""
    query_id: str
    original_query: str
    query_type: QueryType
    intent: Optional[QueryIntent] = None

    # Unified decision
    decision: str = "HOLD"
    confidence: float = 0.5
    summary: str = ""

    # Service responses
    service_responses: List[ServiceResponse] = Field(default_factory=list)

    # Key insights
    key_insights: List[str] = Field(default_factory=list)

    # Actions
    suggested_actions: List[Dict] = Field(default_factory=list)

    # Data
    primary_data: Dict[str, Any] = Field(default_factory=dict)

    # Metadata
    total_latency_ms: float = 0
    services_called: int = 0
    created_at: datetime


# =============================================================================
# ROUTING LOGIC
# =============================================================================

QUERY_ROUTING = {
    QueryType.INVESTMENT: {
        "services": ["council", "twin_v2", "reasoning", "event_os"],
        "priority": ["council", "twin_v2"]
    },
    QueryType.RESEARCH: {
        "services": ["semantic_search", "council", "knowledge_graph"],
        "priority": ["semantic_search", "council"]
    },
    QueryType.TRADE: {
        "services": ["rexmind", "council", "reasoning"],
        "priority": ["rexmind", "council"]
    },
    QueryType.PORTFOLIO: {
        "services": ["portfolio_twin", "copilot", "workflow"],
        "priority": ["portfolio_twin", "copilot"]
    },
    QueryType.ALERT: {
        "services": ["event_os", "workflow", "copilot"],
        "priority": ["event_os"]
    },
    QueryType.GENERAL: {
        "services": ["copilot", "reasoning"],
        "priority": ["copilot"]
    }
}


def detect_query_type(query: str) -> QueryType:
    """Detect what type of query this is"""
    query_lower = query.lower()

    # Investment queries
    if any(word in query_lower for word in ["invest", "buy", "sell", "should i", "position"]):
        return QueryType.INVESTMENT

    # Research queries
    if any(word in query_lower for word in ["research", "analyze", "deep dive", "compare"]):
        return QueryType.RESEARCH

    # Trading queries
    if any(word in query_lower for word in ["trade", "entry", "exit", "stop loss", "target"]):
        return QueryType.TRADE

    # Portfolio queries
    if any(word in query_lower for word in ["portfolio", "allocation", "rebalance", "exposure"]):
        return QueryType.PORTFOLIO

    # Alert queries
    if any(word in query_lower for word in ["alert", "watch", "notify", "when"]):
        return QueryType.ALERT

    return QueryType.GENERAL


def extract_symbols(query: str) -> List[str]:
    """Extract stock symbols from query"""
    # Common symbols
    symbols = []

    known_symbols = {
        "nvidia": "NVDA",
        "apple": "AAPL",
        "microsoft": "MSFT",
        "google": "GOOGL",
        "alphabet": "GOOGL",
        "amazon": "AMZN",
        "meta": "META",
        "tesla": "TSLA",
        "tsmc": "TSM",
        "amd": "AMD",
        "intel": "INTC",
        "netflix": "NFLX",
        "jpmorgan": "JPM",
        "jpm": "JPM",
        "goldman": "GS",
        "goldman sachs": "GS",
        "visa": "V",
        "mastercard": "MA",
    }

    query_lower = query.lower()
    for word, symbol in known_symbols.items():
        if word in query_lower:
            if symbol not in symbols:
                symbols.append(symbol)

    return symbols


def detect_intent(query: str) -> Optional[QueryIntent]:
    """Detect buy/sell/hold intent"""
    query_lower = query.lower()

    if any(word in query_lower for word in ["buy", "long", "invest in", "add to"]):
        return QueryIntent.BUY
    if any(word in query_lower for word in ["sell", "short", "exit", "reduce"]):
        return QueryIntent.SELL
    if any(word in query_lower for word in ["hold", "watch", "monitor"]):
        return QueryIntent.HOLD
    if any(word in query_lower for word in ["research", "analyze", "understand"]):
        return QueryIntent.RESEARCH
    if any(word in query_lower for word in ["watch", "alert", "notify"]):
        return QueryIntent.MONITOR

    return None


# =============================================================================
# SERVICE CALLERS
# =============================================================================

async def call_service(service: str, endpoint: str, data: Dict = None) -> ServiceResponse:
    """Call a service with timeout"""
    start = datetime.utcnow()

    try:
        url = f"{SERVICE_URLS.get(service, f'http://localhost:5000')}{endpoint}"

        async with httpx.AsyncClient(timeout=5.0) as client:
            if data:
                response = await client.post(url, json=data)
            else:
                response = await client.get(url)

            latency = (datetime.utcnow() - start).total_seconds() * 1000

            return ServiceResponse(
                service=service,
                endpoint=endpoint,
                data=response.json() if response.status_code == 200 else {},
                latency_ms=latency,
                success=True
            )

    except Exception as e:
        latency = (datetime.utcnow() - start).total_seconds() * 1000
        return ServiceResponse(
            service=service,
            endpoint=endpoint,
            data={},
            latency_ms=latency,
            success=False,
            error=str(e)
        )


async def orchestrate_query(
    query: str,
    query_type: QueryType = None,
    symbols: List[str] = None
) -> OrchestratedResponse:
    """Orchestrate a query across multiple services"""

    query_id = str(uuid.uuid4())

    # Detect query type if not provided
    if query_type is None:
        query_type = detect_query_type(query)

    # Extract symbols
    if symbols is None:
        symbols = extract_symbols(query)

    # Detect intent
    intent = detect_intent(query)

    # Get routing config
    routing = QUERY_ROUTING.get(query_type, QUERY_ROUTING[QueryType.GENERAL])
    services_to_call = routing["services"]

    # Call services in parallel
    tasks = []

    # Build service calls based on query type
    if query_type == QueryType.INVESTMENT and symbols:
        # Investment query
        symbol = symbols[0] if symbols else "NVDA"

        # Council
        tasks.append(call_service("council", "/quick-decision", {"symbol": symbol}))

        # Twin
        tasks.append(call_service("twin_v2", f"/twins/symbol/{symbol}/summary"))

        # Reasoning
        tasks.append(call_service("reasoning", "/", {}))
        tasks.append(call_service("reasoning", "/knowledge-base"))

        # Event
        tasks.append(call_service("event_os", "/calendar"))

        # Memory
        tasks.append(call_service("memory", "/learnings"))

    elif query_type == QueryType.RESEARCH:
        # Research query
        if symbols:
            symbol = symbols[0]
            tasks.append(call_service("semantic_search", f"/search/entities/{symbol}"))
            tasks.append(call_service("council", "/analysts/market"))

    elif query_type == QueryType.TRADE:
        # Trading query
        if symbols:
            symbol = symbols[0]
            tasks.append(call_service("rexmind", "/health"))
            tasks.append(call_service("council", "/quick-decision", {"symbol": symbol}))
            tasks.append(call_service("reasoning", "/knowledge-base"))

    elif query_type == QueryType.PORTFOLIO:
        # Portfolio query
        tasks.append(call_service("portfolio_twin", "/health"))
        tasks.append(call_service("copilot", "/dashboard"))

    else:
        # General query
        tasks.append(call_service("copilot", "/action-items"))
        tasks.append(call_service("event_os", "/calendar/today"))

    # Execute all service calls
    responses = await asyncio.gather(*tasks, return_exceptions=True)

    # Process responses
    service_responses = []
    key_insights = []
    suggested_actions = []
    total_latency = 0

    for resp in responses:
        if isinstance(resp, ServiceResponse):
            service_responses.append(resp)
            total_latency += resp.latency_ms

            # Extract insights
            if resp.success and resp.data:
                if "summary" in resp.data:
                    key_insights.append(resp.data["summary"])
                if "decisions" in resp.data:
                    for d in resp.data["decisions"][:2]:
                        key_insights.append(str(d))
                if "events" in resp.data:
                    for e in resp.data["events"][:2]:
                        key_insights.append(str(e))

    # Generate unified decision
    decision = "HOLD"
    confidence = 0.5

    # Analyze responses for decision
    buy_count = 0
    sell_count = 0

    for resp in service_responses:
        if resp.success and resp.data:
            data_str = str(resp.data).lower()
            if "buy" in data_str:
                buy_count += 1
            if "sell" in data_str:
                sell_count += 1

    if buy_count > sell_count * 2:
        decision = "BUY"
        confidence = 0.75
    elif sell_count > buy_count * 2:
        decision = "SELL"
        confidence = 0.75
    elif buy_count > sell_count:
        decision = "BUY"
        confidence = 0.6
    elif sell_count > buy_count:
        decision = "SELL"
        confidence = 0.6

    # Build summary
    if symbols:
        summary = f"Analysis of {', '.join(symbols)}: {decision}"
    else:
        summary = f"Analysis complete: {decision}"

    # Generate suggested actions
    if decision == "BUY":
        suggested_actions = [
            {"action": "Add to watchlist", "priority": "high"},
            {"action": "Set entry alerts", "priority": "medium"},
            {"action": "Review position sizing", "priority": "medium"}
        ]
    elif decision == "SELL":
        suggested_actions = [
            {"action": "Review stop loss", "priority": "high"},
            {"action": "Consider reducing exposure", "priority": "high"},
            {"action": "Monitor for exit opportunity", "priority": "medium"}
        ]
    else:
        suggested_actions = [
            {"action": "Continue monitoring", "priority": "medium"},
            {"action": "Wait for clearer signal", "priority": "low"}
        ]

    return OrchestratedResponse(
        query_id=query_id,
        original_query=query,
        query_type=query_type,
        intent=intent,
        decision=decision,
        confidence=confidence,
        summary=summary,
        service_responses=service_responses,
        key_insights=key_insights[:5],
        suggested_actions=suggested_actions,
        primary_data={"symbols": symbols} if symbols else {},
        total_latency_ms=total_latency,
        services_called=len(service_responses),
        created_at=datetime.utcnow()
    )


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/health")
async def health_check():
    """Check hub health and connected services"""
    services_health = {}

    for service, url in SERVICE_URLS.items():
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                response = await client.get(f"{url}/health")
                services_health[service] = {
                    "status": "healthy" if response.status_code == 200 else "degraded",
                    "latency_ms": 0
                }
        except:
            services_health[service] = {"status": "unavailable", "latency_ms": 0}

    healthy_count = sum(1 for s in services_health.values() if s["status"] == "healthy")

    return {
        "service": "assetmind-intelligence-hub",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5298,
        "connected_services": len(SERVICE_URLS),
        "healthy_services": healthy_count,
        "services": services_health
    }


@app.get("/")
async def root():
    return {
        "service": "AssetMind Intelligence Hub",
        "description": "Orchestrates all services for unified responses",
        "query_types": [q.value for q in QueryType],
        "services": list(SERVICE_URLS.keys())
    }


@app.post("/query", response_model=OrchestratedResponse)
async def unified_query(
    query: str,
    query_type: Optional[QueryType] = None,
    symbols: Optional[List[str]] = None
):
    """
    Main orchestration endpoint.

    Submit a natural language query and get a unified response
    from all relevant services.
    """
    result = await orchestrate_query(query, query_type, symbols)
    return result


@app.post("/query/async")
async def unified_query_async(
    query: str,
    query_type: Optional[QueryType] = None,
    symbols: Optional[List[str]] = None
):
    """
    Async version - returns immediately with query_id for polling.
    """
    query_id = str(uuid.uuid4())

    # Start orchestration in background
    asyncio.create_task(
        orchestrate_query(query, query_type, symbols)
    )

    return {
        "query_id": query_id,
        "status": "processing",
        "endpoints": {
            "status": f"/query/{query_id}/status",
            "result": f"/query/{query_id}/result"
        }
    }


@app.get("/query/{query_id}/status")
async def query_status(query_id: str):
    """Get query processing status"""
    return {
        "query_id": query_id,
        "status": "completed",
        "progress": 100
    }


@app.get("/services")
async def list_services():
    """List all connected services"""
    services = []

    for name, url in SERVICE_URLS.items():
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                response = await client.get(f"{url}/")
                data = response.json() if response.status_code == 200 else {}
                services.append({
                    "name": name,
                    "url": url,
                    "status": "healthy",
                    "info": data
                })
        except:
            services.append({
                "name": name,
                "url": url,
                "status": "unavailable"
            })

    return {"services": services, "total": len(services)}


@app.post("/chain")
async def chain_services(
    services: List[str],
    symbol: str
):
    """
    Chain services for sequential processing.

    Example: Council → Reasoning → Workflow → Alert
    """
    results = []

    for service in services:
        if service == "council":
            resp = await call_service("council", "/quick-decision", {"symbol": symbol})
        elif service == "reasoning":
            resp = await call_service("reasoning", "/")
        elif service == "workflow":
            resp = await call_service("workflow", "/health")
        elif service == "copilot":
            resp = await call_service("copilot", "/dashboard")
        else:
            resp = ServiceResponse(
                service=service,
                endpoint="/",
                data={},
                latency_ms=0,
                success=False,
                error="Unknown service"
            )

        results.append(resp)

        # Short circuit on failure
        if not resp.success:
            break

    return {
        "chain": services,
        "symbol": symbol,
        "results": [r.dict() for r in results],
        "completed": len(results),
        "failed": sum(1 for r in results if not r.success)
    }


@app.get("/recommendations/{symbol}")
async def get_symbol_recommendations(symbol: str):
    """
    Get complete recommendation for a symbol from all services.
    """
    tasks = [
        call_service("council", "/quick-decision", {"symbol": symbol}),
        call_service("twin_v2", f"/twins/symbol/{symbol}/summary"),
        call_service("rexmind", "/health"),
        call_service("event_os", f"/research/{symbol}"),
    ]

    responses = await asyncio.gather(*tasks, return_exceptions=True)

    # Aggregate
    recommendations = {
        "symbol": symbol.upper(),
        "timestamp": datetime.utcnow().isoformat(),
        "sources": []
    }

    for resp in responses:
        if isinstance(resp, ServiceResponse) and resp.success:
            recommendations["sources"].append(resp.service)
            recommendations[resp.service] = resp.data

    # Generate consensus
    buy_count = 0
    sell_count = 0

    for resp in responses:
        if isinstance(resp, ServiceResponse) and resp.success:
            data_str = str(resp.data).lower()
            if "buy" in data_str:
                buy_count += 1
            if "sell" in data_str:
                sell_count += 1

    if buy_count > sell_count:
        recommendations["consensus"] = "BUY"
        recommendations["confidence"] = buy_count / max(1, buy_count + sell_count)
    elif sell_count > buy_count:
        recommendations["consensus"] = "SELL"
        recommendations["confidence"] = sell_count / max(1, buy_count + sell_count)
    else:
        recommendations["consensus"] = "HOLD"
        recommendations["confidence"] = 0.5

    return recommendations


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5298)