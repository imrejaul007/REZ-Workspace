"""
AssetMind - Financial Copilot
Port: 5295

Your personal AI financial assistant.

Instead of 20 dashboards, user simply asks:

"What should I do today?"

AssetMind responds:

"Portfolio Risk ↑

Suggested Actions:
1. Reduce exposure to NVDA
2. Add defensive positions
3. Monitor CPI release"

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


app = FastAPI(
    title="AssetMind Financial Copilot",
    version="1.0.0",
    description="Your personal AI financial assistant"
)


# =============================================================================
# COPILOT MODELS
# =============================================================================

class QueryType(str, Enum):
    PORTFOLIO = "portfolio"
    TRADE = "trade"
    RESEARCH = "research"
    NEWS = "news"
    GENERAL = "general"


class SuggestionPriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class CopilotSuggestion(BaseModel):
    suggestion_id: str
    category: str
    priority: SuggestionPriority
    title: str
    description: str
    actions: List[str] = Field(default_factory=list)
    confidence: float = 0.5


class CopilotResponse(BaseModel):
    response_id: str
    query: str
    intent: str
    summary: str
    sentiment: str  # positive, negative, neutral

    # Key insights
    key_insights: List[str] = Field(default_factory=list)

    # Suggestions
    suggestions: List[CopilotSuggestion] = Field(default_factory=list)

    # Data points
    data_points: Dict[str, Any] = Field(default_factory=dict)

    # Related actions
    related_queries: List[str] = Field(default_factory=list)

    created_at: datetime


# =============================================================================
# COPILOT BRAIN
# =============================================================================

COPILOT_RESPONSES = {
    "portfolio risk": {
        "summary": "Portfolio risk elevated",
        "insights": [
            "Tech concentration at 45% (threshold: 40%)",
            "Volatility increasing",
            "Correlation across holdings rising"
        ],
        "suggestions": [
            {
                "category": "rebalance",
                "priority": "high",
                "title": "Reduce Tech Exposure",
                "description": "Tech overweight by 5%. Consider reducing.",
                "actions": ["Sell NVDA 10%", "Buy defensive sector"]
            },
            {
                "category": "hedge",
                "priority": "medium",
                "title": "Add Hedges",
                "description": "Consider adding put options or inverse ETFs",
                "actions": ["Buy SPY puts", "Add GLD position"]
            }
        ]
    },
    "earnings today": {
        "summary": "2 earnings releases today",
        "insights": [
            "JPM reporting before open",
            "NFLX reporting after close"
        ],
        "suggestions": [
            {
                "category": "earnings",
                "priority": "high",
                "title": "Watch JPM Earnings",
                "description": "Major bank reporting. Expect volatility.",
                "actions": ["Review position sizing", "Set alerts"]
            }
        ]
    },
    "what to buy": {
        "summary": "Top opportunities today",
        "insights": [
            "NVDA: AI infrastructure demand continues",
            "Defensive sectors showing strength",
            "Value outperforming growth"
        ],
        "suggestions": [
            {
                "category": "opportunity",
                "priority": "high",
                "title": "NVDA Long",
                "description": "Strong momentum, AI theme continues",
                "actions": ["Add to watchlist", "Set entry at $900"]
            },
            {
                "category": "opportunity",
                "priority": "medium",
                "title": "Healthcare Watch",
                "description": "Defensive rotation likely",
                "actions": ["Monitor XLV", "Add on breakout"]
            }
        ]
    },
    "market today": {
        "summary": "Markets slightly positive",
        "insights": [
            "S&P 500 +0.3%",
            "Tech +0.5%, Financials +0.2%",
            "VIX at 14.5 (low volatility)"
        ],
        "suggestions": [
            {
                "category": "status",
                "priority": "low",
                "title": "Low Volatility Environment",
                "description": "Consider selling puts for income",
                "actions": ["Sell cash-secured puts", "Sell covered calls"]
            }
        ]
    }
}


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-copilot",
        "status": "healthy",
        "port": 5295
    }


@app.get("/")
async def root():
    return {
        "service": "AssetMind Financial Copilot",
        "description": "Your personal AI financial assistant"
    }


@app.post("/query")
async def query(query: str):
    """Main copilot query endpoint"""
    query_lower = query.lower()

    # Match intent
    intent = "general"
    for key in COPILOT_RESPONSES:
        if key in query_lower:
            intent = key
            break

    response_data = COPILOT_RESPONSES.get(intent, COPILOT_RESPONSES["general"])

    # Build response
    suggestions = [
        CopilotSuggestion(
            suggestion_id=f"sug_{i}",
            category=s["category"],
            priority=SuggestionPriority(s["priority"]),
            title=s["title"],
            description=s["description"],
            actions=s["actions"],
            confidence=0.75 if s["priority"] == "high" else 0.6
        )
        for i, s in enumerate(response_data.get("suggestions", []))
    ]

    return CopilotResponse(
        response_id="resp_" + str(hash(query))[:8],
        query=query,
        intent=intent,
        summary=response_data["summary"],
        sentiment="neutral",
        key_insights=response_data["insights"],
        suggestions=suggestions,
        data_points={},
        related_queries=[
            "What's my portfolio risk?",
            "Any earnings today?",
            "Top opportunities?"
        ],
        created_at=datetime.utcnow()
    )


@app.get("/dashboard")
async def get_daily_dashboard():
    """Get daily dashboard summary"""
    return {
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "summary": {
            "market": "Slightly positive",
            "portfolio_risk": "Moderate",
            "opportunities": 3,
            "alerts": 2
        },
        "top_moves": [
            {"symbol": "NVDA", "change": "+2.5%"},
            {"symbol": "AAPL", "change": "+1.2%"},
            {"symbol": "TSM", "change": "-0.8%"}
        ],
        "earnings_today": ["JPM", "BAC"],
        "economic_releases": ["CPI Tomorrow"],
        "suggestions": [
            {"priority": "high", "action": "Review NVDA position"},
            {"priority": "medium", "action": "Consider defensive adds"}
        ]
    }


@app.get("/action-items")
async def get_action_items():
    """Get prioritized action items"""
    return {
        "actions": [
            {
                "priority": "critical",
                "category": "earnings",
                "title": "NVDA Earnings in 2 days",
                "action": "Review position sizing"
            },
            {
                "priority": "high",
                "category": "risk",
                "title": "Portfolio tech overweight",
                "action": "Consider rebalancing"
            },
            {
                "priority": "medium",
                "category": "opportunity",
                "title": "Healthcare sector breaking out",
                "action": "Monitor XLV"
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5295)