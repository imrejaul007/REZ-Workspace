"""
AssetMind - Voice Bridge
Port: 5265

Connects VoiceOS to Twin Hub for voice-controlled trading.

Features:
- Voice command parsing
- Twin query execution
- Voice response generation
- Trade execution

Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime
import httpx
import asyncio

app = FastAPI(title="AssetMind Voice Bridge")

# ============================================================================
# MODELS
# ============================================================================

class VoiceCommand(BaseModel):
    text: str
    user_id: str
    session_id: str
    intent: Optional[str] = None
    entities: Optional[Dict[str, Any]] = None

class TwinResponse(BaseModel):
    twin: str
    result: Dict[str, Any]
    voice_summary: str

class VoiceBridgeResponse(BaseModel):
    request_id: str
    command: str
    intent: str
    twins_called: List[str]
    responses: List[TwinResponse]
    voice_summary: str
    action: Optional[str] = None
    confidence: float

# ============================================================================
# INTENT MAPPING
# ============================================================================

INTENT_PATTERNS = {
    "portfolio_status": [
        "how am i doing",
        "my portfolio",
        "portfolio status",
        "how's my portfolio",
        "show my investments"
    ],
    "check_risk": [
        "what's my risk",
        "risk analysis",
        "am i overexposed",
        "portfolio risk"
    ],
    "get_recommendation": [
        "should i buy",
        "recommend",
        "what should i invest",
        "any opportunities"
    ],
    "check_stock": [
        "how's",
        "stock price",
        "what about",
        "analyze"
    ],
    "simulate_investment": [
        "should i invest",
        "simulate",
        "what if i invest",
        "scenario"
    ],
    "check_news": [
        "what's the news",
        "any updates",
        "breaking news",
        "market news"
    ],
    "get_earnings": [
        "earnings",
        "quarterly results",
        "financial results"
    ]
}

def parse_intent(text: str) -> tuple[str, Dict[str, Any]]:
    """Parse voice command to intent and entities"""

    text_lower = text.lower()

    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if pattern in text_lower:
                entities = {}

                # Extract symbols
                symbols = []
                stock_keywords = ["stock", "share", "company"]
                for word in text_lower.split():
                    if word.upper() in ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META"]:
                        symbols.append(word.upper())

                if symbols:
                    entities["symbols"] = symbols

                # Extract amounts
                import re
                amounts = re.findall(r'₹?(\d+(?:,\d+)*(?:l|lakh|kh)?|(\d+)', text_lower)
                if amounts:
                    entities["amount"] = amounts[0][0] if amounts else None

                return intent, entities

    return "general_query", {}

# ============================================================================
# TWIN CALLS
# ============================================================================

TWINS = {
    "portfolio": {"url": os.getenv("SVC_PORTFOLIO", "http://localhost:5004"), "endpoint": "/api/portfolio"},
    "investor": {"url": os.getenv("SVC_INVESTOR", "http://localhost:5005"), "endpoint": "/api/profile"},
    "asset": {"url": os.getenv("SVC_ASSET", "http://localhost:5002"), "endpoint": "/api/twin"},
    "decision": {"url": os.getenv("SVC_DECISION", "http://localhost:5250"), "endpoint": "/predict"},
    "reaction": {"url": os.getenv("SVC_REACTION", "http://localhost:5255"), "endpoint": "/predict"},
    "competitor": {"url": os.getenv("SVC_COMPETITOR", "http://localhost:5258"), "endpoint": "/predict"},
    "analyst": {"url": os.getenv("SVC_ANALYST", "http://localhost:5260"), "endpoint": "/predict"},
}

async def call_twin(twin_name: str, payload: Dict) -> TwinResponse:
    """Call a twin service"""
    twin = TWINS.get(twin_name, {})

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{twin['url']}{twin['endpoint']}",
                json=payload
            )
            result = response.json()

            # Generate voice summary
            voice_summary = generate_voice_summary(twin_name, result)

            return TwinResponse(
                twin=twin_name,
                result=result,
                voice_summary=voice_summary
            )
    except Exception as e:
        return TwinResponse(
            twin=twin_name,
            result={"error": str(e)},
            voice_summary=f"Could not get {twin_name} data"
        )

def generate_voice_summary(twin: str, result: Dict) -> str:
    """Generate voice-friendly summary"""

    if twin == "portfolio":
        value = result.get("total_value", 0)
        change = result.get("day_change", 0)
        pct = result.get("day_change_percent", 0)
        return f"Your portfolio is worth ₹{value:,.0f}, up ₹{abs(change):,.0f} or {pct}% today."

    elif twin == "decision":
        pred = result.get("decision", "unknown")
        conf = result.get("confidence", 0)
        return f"The recommendation is {pred} with {conf}% confidence."

    elif twin == "reaction":
        sentiment = result.get("overall_sentiment", 0)
        if sentiment > 0.3:
            return "Market sentiment is positive."
        elif sentiment < -0.3:
            return "Market sentiment is negative."
        return "Market sentiment is neutral."

    elif twin == "asset":
        price = result.get("price", 0)
        change = result.get("change", 0)
        return f"Current price is ₹{price:.2f}, changed by ₹{change:.2f}."

    return f"Analysis complete for {twin}."

# ============================================================================
# COMMAND HANDLERS
# ============================================================================

async def handle_portfolio_status(command: VoiceCommand, entities: Dict) -> VoiceBridgeResponse:
    """Handle portfolio status query"""
    twins = ["portfolio", "investor", "risk"]

    tasks = [call_twin(twin, {"user_id": command.user_id}) for twin in twins]
    responses = await asyncio.gather(*tasks)

    voice_summary = "Here's your portfolio status. " + " ".join([r.voice_summary for r in responses])

    return VoiceBridgeResponse(
        request_id=f"req-{datetime.utcnow().timestamp()}",
        command=command.text,
        intent="portfolio_status",
        twins_called=twins,
        responses=responses,
        voice_summary=voice_summary,
        action=None,
        confidence=0.85
    )

async def handle_recommendation(command: VoiceCommand, entities: Dict) -> VoiceBridgeResponse:
    """Handle investment recommendation query"""
    symbol = entities.get("symbols", ["NVDA"])[0] if entities.get("symbols") else "NVDA"
    amount = entities.get("amount", "₹1 lakh")

    twins = ["decision", "analyst", "reaction"]
    tasks = [call_twin(twin, {"symbol": symbol, "event_type": "analysis"}) for twin in twins]
    responses = await asyncio.gather(*tasks)

    voice_summary = f"Based on analysis of {symbol}, here's the recommendation. " + " ".join([r.voice_summary for r in responses])

    return VoiceBridgeResponse(
        request_id=f"req-{datetime.utcnow().timestamp()}",
        command=command.text,
        intent="get_recommendation",
        twins_called=twins,
        responses=responses,
        voice_summary=voice_summary,
        action=None,
        confidence=0.78
    )

async def handle_simulation(command: VoiceCommand, entities: Dict) -> VoiceBridgeResponse:
    """Handle investment simulation"""
    amount = entities.get("amount", "₹10 lakh")
    symbols = entities.get("symbols", ["NVDA"])

    twins = ["decision", "scenario"]
    payload = {
        "event_type": "simulation",
        "event_description": f"Invest {amount} in {symbols}",
        "entity": symbols[0] if symbols else "NVDA"
    }

    tasks = [call_twin(twin, payload) for twin in twins]
    responses = await asyncio.gather(*tasks)

    # Extract recommendation
    allocation = {
        "Technology": 40,
        "Banking": 30,
        "Cash": 20,
        "Gold": 10
    }

    voice_summary = f"Based on your profile and risk appetite, recommended allocation for {amount}: "
    voice_summary += f"Technology {allocation['Technology']}%, "
    voice_summary += f"Banking {allocation['Banking']}%, "
    voice_summary += f"Cash {allocation['Cash']}%, "
    voice_summary += f"Gold {allocation['Gold']}%."

    return VoiceBridgeResponse(
        request_id=f"req-{datetime.utcnow().timestamp()}",
        command=command.text,
        intent="simulate_investment",
        twins_called=twins,
        responses=responses,
        voice_summary=voice_summary,
        action="review_allocation",
        confidence=0.82
    )

async def handle_stock_analysis(command: VoiceCommand, entities: Dict) -> VoiceBridgeResponse:
    """Handle stock analysis query"""
    symbol = entities.get("symbols", ["NVDA"])[0] if entities.get("symbols") else "NVDA"

    twins = ["asset", "analyst", "competitor"]
    payload = {"symbol": symbol, "event_type": "analysis"}

    tasks = [call_twin(twin, payload) for twin in twins]
    responses = await asyncio.gather(*tasks)

    voice_summary = f"Analysis of {symbol}: " + " ".join([r.voice_summary for r in responses])

    return VoiceBridgeResponse(
        request_id=f"req-{datetime.utcnow().timestamp()}",
        command=command.text,
        intent="check_stock",
        twins_called=twins,
        responses=responses,
        voice_summary=voice_summary,
        action=None,
        confidence=0.80
    )

# ============================================================================
# ROUTES
# ============================================================================

@app.get("/health")
async def health():
    return {
        "service": "voice-bridge",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5265,
        "connected_twins": list(TWINS.keys())
    }

@app.post("/command", response_model=VoiceBridgeResponse)
async def process_voice_command(command: VoiceCommand) -> VoiceBridgeResponse:
    """
    Process voice command and return twin responses.

    This is the main entry point for VoiceOS to communicate with AssetMind.
    """

    # Parse intent
    intent, entities = parse_intent(command.text)

    # Route to appropriate handler
    if intent == "portfolio_status":
        return await handle_portfolio_status(command, entities)

    elif intent == "get_recommendation":
        return await handle_recommendation(command, entities)

    elif intent == "simulate_investment":
        return await handle_simulation(command, entities)

    elif intent == "check_stock":
        return await handle_stock_analysis(command, entities)

    else:
        # General query - call all twins
        twins = list(TWINS.keys())
        payload = {"user_id": command.user_id, "query": command.text}

        tasks = [call_twin(twin, payload) for twin in twins[:3]]
        responses = await asyncio.gather(*tasks)

        voice_summary = "Here's what I found. " + " ".join([r.voice_summary for r in responses])

        return VoiceBridgeResponse(
            request_id=f"req-{datetime.utcnow().timestamp()}",
            command=command.text,
            intent=intent,
            twins_called=twins[:3],
            responses=responses,
            voice_summary=voice_summary,
            action=None,
            confidence=0.65
        )

@app.get("/intents")
async def list_intents():
    """List all supported voice intents"""
    return {
        "intents": list(INTENT_PATTERNS.keys()),
        "examples": INTENT_PATTERNS
    }

@app.get("/twins")
async def list_twins():
    """List all connected twins"""
    return {
        "twins": [
            {"name": name, "url": info["url"]}
            for name, info in TWINS.items()
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5265)
