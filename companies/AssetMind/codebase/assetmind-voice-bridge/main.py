"""
AssetMind Voice Bridge Service
Connects VoiceOS to AssetMind Twin Hub for voice-controlled trading

Port: 5265

Version: 1.0.0
"""

import uuid
import random
import re
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
import uvicorn

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind Voice Bridge",
    description="Voice interface connecting VoiceOS to AssetMind twins",
    version="1.0.0",
)

# ============================================================================
# Enums
# ============================================================================

class IntentType(str, Enum):
    PORTFOLIO_STATUS = "portfolio_status"
    GET_RECOMMENDATION = "get_recommendation"
    SIMULATE_INVESTMENT = "simulate_investment"
    CHECK_STOCK = "check_stock"
    CHECK_RISK = "check_risk"
    CHECK_NEWS = "check_news"
    UNKNOWN = "unknown"

class CommandStatus(str, Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"

# ============================================================================
# Pydantic Models - Intent Detection
# ============================================================================

class IntentPattern(BaseModel):
    intent: IntentType
    patterns: List[str] = []

INTENT_PATTERNS = [
    IntentPattern(
        intent=IntentType.PORTFOLIO_STATUS,
        patterns=[
            r"how (am i|are we) doing",
            r"my portfolio",
            r"portfolio status",
            r"how('s| is) my (portfolio|portfolio doing)",
            r"(show|check|tell me) my (portfolio|gains|losses)",
        ],
    ),
    IntentPattern(
        intent=IntentType.GET_RECOMMENDATION,
        patterns=[
            r"should i (buy|sell|hold)",
            r"recommend",
            r"(any|what) opportunities",
            r"what do you think about",
            r"(buy|sell|hold) (me )?(aapl|msft|goog|nvda|tsla)",
        ],
    ),
    IntentPattern(
        intent=IntentType.SIMULATE_INVESTMENT,
        patterns=[
            r"should i invest",
            r"what if i invest",
            r"simulate",
            r"(invest|put) (.*) (in|into)",
            r"allocate (.*) to",
        ],
    ),
    IntentPattern(
        intent=IntentType.CHECK_STOCK,
        patterns=[
            r"how('s| is| about) (.*)",
            r"what about (.*)",
            r"(check|look at|analyze) (.*)",
            r"(.*) (stock|share|price)",
        ],
    ),
    IntentPattern(
        intent=IntentType.CHECK_RISK,
        patterns=[
            r"(what('s| is)|check) (my )?risk",
            r"risk (profile|level)",
            r"volatility",
            r"(diversif|exposure)",
        ],
    ),
    IntentPattern(
        intent=IntentType.CHECK_NEWS,
        patterns=[
            r"(what('s| is)|any) news",
            r"market (update|news)",
            r"(anything|what) happening",
            r"headlines",
        ],
    ),
]

# ============================================================================
# Pydantic Models - Commands and Responses
# ============================================================================

class TwinResult(BaseModel):
    twin_name: str
    result: Dict[str, Any]
    success: bool = True
    error: Optional[str] = None

class VoiceCommand(BaseModel):
    command_id: str = Field(default_factory=lambda: f"cmd-{uuid.uuid4().hex[:8]}")
    text: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    intent: IntentType = IntentType.UNKNOWN
    confidence: float = 0.0
    entities: Dict[str, Any] = {}

class VoiceResponse(BaseModel):
    request_id: str
    command: str
    intent: IntentType
    twins_called: List[str]
    voice_summary: str
    confidence: float
    status: CommandStatus
    details: Dict[str, Any] = {}

class ConnectedTwin(BaseModel):
    name: str
    port: int
    description: str
    intents_supported: List[IntentType]

# ============================================================================
# Pydantic Models - Requests
# ============================================================================

class CommandRequest(BaseModel):
    text: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class SimulationRequest(BaseModel):
    amount: float
    symbol: Optional[str] = None
    asset_class: Optional[str] = None

# ============================================================================
# In-Memory Storage
# ============================================================================

command_history: List[VoiceCommand] = []
connected_twins = [
    ConnectedTwin(name="portfolio-twin", port=5004, description="Portfolio analytics",
                 intents_supported=[IntentType.PORTFOLIO_STATUS, IntentType.CHECK_RISK]),
    ConnectedTwin(name="investor-twin", port=5005, description="Investor profile analysis",
                 intents_supported=[IntentType.GET_RECOMMENDATION, IntentType.SIMULATE_INVESTMENT]),
    ConnectedTwin(name="asset-twin", port=5002, description="Asset/Stock analysis",
                 intents_supported=[IntentType.CHECK_STOCK, IntentType.GET_RECOMMENDATION]),
    ConnectedTwin(name="risk-engine", port=5252, description="Risk assessment",
                 intents_supported=[IntentType.CHECK_RISK, IntentType.SIMULATE_INVESTMENT]),
    ConnectedTwin(name="news-intelligence", port=5210, description="Market news",
                 intents_supported=[IntentType.CHECK_NEWS]),
]

# ============================================================================
# Intent Detection Functions
# ============================================================================

def detect_intent(text: str) -> tuple[IntentType, float]:
    """Detect intent from voice command text."""
    text_lower = text.lower().strip()

    best_intent = IntentType.UNKNOWN
    best_confidence = 0.0

    for intent_pattern in INTENT_PATTERNS:
        for pattern in intent_pattern.patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                confidence = random.uniform(0.75, 0.95)
                if confidence > best_confidence:
                    best_intent = intent_pattern.intent
                    best_confidence = confidence

    # If no pattern matched, check for stock symbols
    if best_intent == IntentType.UNKNOWN:
        stock_pattern = r"\b([A-Z]{2,5})\b"
        symbols = re.findall(stock_pattern, text)
        if symbols:
            best_intent = IntentType.CHECK_STOCK
            best_confidence = 0.6

    return best_intent, best_confidence

def extract_entities(text: str, intent: IntentType) -> Dict[str, Any]:
    """Extract entities from voice command."""
    entities = {}

    # Extract symbols
    symbols = re.findall(r"\b([A-Z]{2,5})\b", text)
    if symbols:
        entities["symbols"] = symbols

    # Extract amounts
    amount_pattern = r"\$?([\d,]+(?:\.\d+)?)\s*(k|m|b|l(?:ak)?)?"
    amounts = re.findall(amount_pattern, text.lower())
    if amounts:
        parsed_amounts = []
        for value, suffix in amounts:
            num_value = float(value.replace(",", ""))
            if suffix == "k":
                num_value *= 1000
            elif suffix == "m":
                num_value *= 1e6
            elif suffix == "b":
                num_value *= 1e9
            elif suffix == "l" or suffix == "lak":
                num_value *= 100000
            parsed_amounts.append(num_value)
        entities["amounts"] = parsed_amounts

    return entities

def get_twins_for_intent(intent: IntentType) -> List[str]:
    """Get list of twins to call for a specific intent."""
    intent_twin_map = {
        IntentType.PORTFOLIO_STATUS: ["portfolio-twin", "investor-twin"],
        IntentType.GET_RECOMMENDATION: ["investor-twin", "asset-twin"],
        IntentType.SIMULATE_INVESTMENT: ["investor-twin", "risk-engine"],
        IntentType.CHECK_STOCK: ["asset-twin", "analyst-twin"],
        IntentType.CHECK_RISK: ["risk-engine", "portfolio-twin"],
        IntentType.CHECK_NEWS: ["news-intelligence"],
    }
    return intent_twin_map.get(intent, [])

# ============================================================================
# Response Generation Functions
# ============================================================================

def generate_portfolio_response(twins_results: List[TwinResult]) -> str:
    """Generate voice response for portfolio status."""
    # Simulate aggregated portfolio data
    portfolio_value = random.uniform(100000, 500000)
    daily_change = random.uniform(-5000, 10000)
    daily_change_pct = (daily_change / portfolio_value) * 100

    response = f"Your portfolio is worth ${portfolio_value:,.0f}, "
    response += f"{'up' if daily_change > 0 else 'down'} ${abs(daily_change):,.0f} "
    response += f"or {abs(daily_change_pct):.1f}% today."

    return response

def generate_recommendation_response(twins_results: List[TwinResult]) -> str:
    """Generate voice response for recommendations."""
    recommendations = ["AAPL looks like a strong buy", "Consider taking profits in TSLA",
                      "Hold MSFT for now", "NVDA has good upside potential"]

    response = random.choice(recommendations)
    confidence = random.uniform(0.7, 0.9)

    if confidence > 0.8:
        response += ". I'm very confident in this recommendation."
    else:
        response += ". This is based on current market conditions."

    return response

def generate_stock_response(twins_results: List[TwinResult]) -> str:
    """Generate voice response for stock check."""
    prices = {
        "AAPL": (178.50, 1.2),
        "GOOGL": (141.20, -0.8),
        "MSFT": (378.90, 0.5),
        "NVDA": (875.30, 2.1),
        "TSLA": (245.60, -1.5),
    }

    symbol = twins_results[0].result.get("symbol", "the stock") if twins_results else "the stock"
    price, change = prices.get(symbol.upper(), (100.0, 0.0))

    response = f"{symbol} is trading at ${price:.2f}, "
    response += f"{'up' if change > 0 else 'down'} {abs(change):.1f}% today."

    return response

def generate_risk_response(twins_results: List[TwinResult]) -> str:
    """Generate voice response for risk check."""
    risk_level = random.choice(["low", "moderate", "medium", "high"])
    volatility = random.uniform(10, 25)

    response = f"Your portfolio risk level is {risk_level}. "
    response += f"Current volatility is {volatility:.1f}%. "

    if risk_level in ["low", "moderate"]:
        response += "Your portfolio is well diversified."
    else:
        response += "Consider rebalancing to reduce exposure."

    return response

def generate_news_response(twins_results: List[TwinResult]) -> str:
    """Generate voice response for news."""
    headlines = [
        "Fed signals potential rate cut for next quarter",
        "Tech stocks rally on strong earnings reports",
        "Oil prices stabilize amid geopolitical tensions",
        "AI sector sees continued growth momentum",
    ]

    response = "Here are today's top market headlines: "
    response += ". ".join(random.sample(headlines, min(3, len(headlines))))

    return response

def generate_simulate_response(amount: float, twins_results: List[TwinResult]) -> str:
    """Generate voice response for investment simulation."""
    expected_return = random.uniform(5, 20)
    risk_adjusted = expected_return * random.uniform(0.7, 0.9)

    response = f"If you invested ${amount:,.0f}, "
    response += f"you could expect a {expected_return:.1f}% return over a year. "
    response += f"Risk-adjusted, that's approximately {risk_adjusted:.1f}%."

    return response

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-voice-bridge",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {
            "connected_twins": len(connected_twins),
            "commands_processed": len(command_history),
        },
    }

# ============================================================================
# Intent Endpoints
# ============================================================================

@app.get("/intents", response_model=List[Dict[str, Any]])
async def list_intents():
    """List all supported voice intents."""
    return [
        {"intent": intent.value, "name": intent.name.replace("_", " ").title()}
        for intent in IntentType
    ]

@app.get("/twins", response_model=List[ConnectedTwin])
async def list_connected_twins():
    """List all twins connected to the voice bridge."""
    return connected_twins

# ============================================================================
# Voice Command Endpoints
# ============================================================================

@app.post("/command", response_model=VoiceResponse)
async def process_command(request: CommandRequest):
    """Process a voice command and return a voice summary."""
    request_id = f"req-{uuid.uuid4().hex[:8]}"

    # Detect intent
    intent, confidence = detect_intent(request.text)

    # Extract entities
    entities = extract_entities(request.text, intent)

    # Get twins to call
    twins_to_call = get_twins_for_intent(intent)

    # Simulate twin results
    twin_results = []
    for twin_name in twins_to_call:
        twin = next((t for t in connected_twins if t.name == twin_name), None)
        if twin:
            twin_results.append(TwinResult(
                twin_name=twin_name,
                result={"status": "success", "data": {}},
            ))

    # Generate appropriate response based on intent
    if intent == IntentType.PORTFOLIO_STATUS:
        voice_summary = generate_portfolio_response(twin_results)
    elif intent == IntentType.GET_RECOMMENDATION:
        voice_summary = generate_recommendation_response(twin_results)
    elif intent == IntentType.SIMULATE_INVESTMENT:
        amount = entities.get("amounts", [100000])[0] if entities.get("amounts") else 100000
        voice_summary = generate_simulate_response(amount, twin_results)
    elif intent == IntentType.CHECK_STOCK:
        voice_summary = generate_stock_response(twin_results)
    elif intent == IntentType.CHECK_RISK:
        voice_summary = generate_risk_response(twin_results)
    elif intent == IntentType.CHECK_NEWS:
        voice_summary = generate_news_response(twin_results)
    else:
        voice_summary = "I'm not sure how to help with that. Try asking about your portfolio or a specific stock."
        confidence = 0.3

    # Store command in history
    command = VoiceCommand(
        text=request.text,
        user_id=request.user_id,
        session_id=request.session_id,
        intent=intent,
        confidence=confidence,
        entities=entities,
    )
    command_history.append(command)

    # Keep only last 100 commands
    if len(command_history) > 100:
        command_history = command_history[-100:]

    return VoiceResponse(
        request_id=request_id,
        command=request.text,
        intent=intent,
        twins_called=twins_to_call,
        voice_summary=voice_summary,
        confidence=confidence,
        status=CommandStatus.SUCCESS if confidence > 0.6 else CommandStatus.PARTIAL,
        details={
            "entities": entities,
            "twin_results": [{"name": r.twin_name, "success": r.success} for r in twin_results],
        },
    )

@app.get("/command/history")
async def get_command_history(
    limit: int = Query(10, ge=1, le=100),
    user_id: Optional[str] = None,
):
    """Get recent voice command history."""
    history = command_history

    if user_id:
        history = [c for c in history if c.user_id == user_id]

    return {
        "commands": history[-limit:],
        "total": len(history),
    }

# ============================================================================
# Simulation Endpoints
# ============================================================================

@app.post("/simulate/investment", response_model=Dict[str, Any])
async def simulate_investment(request: SimulationRequest):
    """Simulate an investment and return analysis."""
    twins_to_call = ["investor-twin", "risk-engine"]

    expected_return = random.uniform(8, 25)
    risk_score = random.uniform(20, 80)
    sharpe_ratio = random.uniform(0.5, 2.0)

    scenarios = [
        {"name": "Bull Case", "return": expected_return * 1.5, "probability": 0.25},
        {"name": "Base Case", "return": expected_return, "probability": 0.50},
        {"name": "Bear Case", "return": expected_return * -0.5, "probability": 0.25},
    ]

    return {
        "amount": request.amount,
        "symbol": request.symbol,
        "asset_class": request.asset_class,
        "expected_return": expected_return,
        "risk_score": risk_score,
        "sharpe_ratio": sharpe_ratio,
        "scenarios": scenarios,
        "twins_called": twins_to_call,
    }

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    print("Starting AssetMind Voice Bridge on port 5265")
    uvicorn.run(app, host="0.0.0.0", port=5265)
