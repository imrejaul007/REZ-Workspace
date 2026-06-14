"""
AssetMind - Analyst Twin Engine
Port: 5260

Predicts analyst sentiment and recommendations.

Features:
- Analyst profiling
- Sentiment prediction
- Recommendation forecasting
- Rating changes

Version: 1.0.0
"""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime
from enum import Enum
import random

app = FastAPI(title="Analyst Twin")

# ============================================================================
# MODELS
# ============================================================================

class Rating(str, Enum):
    BUY = "buy"
    HOLD = "hold"
    SELL = "sell"
    OUTPERFORM = "outperform"
    UNDERPERFORM = "underperform"

class AnalystProfile(BaseModel):
    id: str
    name: str
    firm: str
    accuracy: float  # Historical accuracy %
    bullishness: float  # 0-1 (1 = very bullish)
    coverage: List[str]  # Symbols they cover

class AnalystOpinion(BaseModel):
    analyst: str
    firm: str
    current_rating: Rating
    predicted_rating: Rating
    confidence: float
    target_price: float
    upside_pct: float
    reasoning: str

class AnalystPrediction(BaseModel):
    symbol: str
    timestamp: str
    opinions: List[AnalystOpinion]
    consensus_rating: Rating
    consensus_target: float
    bullish_count: int
    bearish_count: int
    neutral_count: int

# ============================================================================
# ANALYST DATABASE
# ============================================================================

ANALYSTS = [
    AnalystProfile(
        id="analyst-1",
        name="John Smith",
        firm="Goldman Sachs",
        accuracy=72.5,
        bullishness=0.65,
        coverage=["NVDA", "AMD", "INTC"]
    ),
    AnalystProfile(
        id="analyst-2",
        name="Sarah Johnson",
        firm="Morgan Stanley",
        accuracy=68.2,
        bullishness=0.55,
        coverage=["AAPL", "MSFT", "GOOGL"]
    ),
    AnalystProfile(
        id="analyst-3",
        name="Mike Chen",
        firm="JP Morgan",
        accuracy=75.0,
        bullishness=0.70,
        coverage=["NVDA", "TSLA", "META"]
    ),
    AnalystProfile(
        id="analyst-4",
        name="Emily Davis",
        firm="Bank of America",
        accuracy=65.5,
        bullishness=0.45,
        coverage=["AMZN", "NFLX", "DIS"]
    ),
    AnalystProfile(
        id="analyst-5",
        name="Robert Wilson",
        firm="Citi",
        accuracy=70.0,
        bullishness=0.60,
        coverage=["NVDA", "AAPL", "MSFT"]
    )
]

# ============================================================================
# PREDICTION ENGINE
# ============================================================================

def predict_analyst_opinion(analyst: AnalystProfile, symbol: str, event_sentiment: float) -> AnalystOpinion:
    """Predict how an analyst will rate a stock"""

    # Base rating on bullishness
    if analyst.bullishness > 0.65:
        current_rating = Rating.OUTPERFORM if random.random() > 0.5 else Rating.BUY
    elif analyst.bullishness > 0.45:
        current_rating = Rating.HOLD
    else:
        current_rating = Rating.UNDERPERFORM if random.random() > 0.5 else Rating.SELL

    # Predict rating change based on event
    adjusted_bullishness = analyst.bullishness + (event_sentiment * 0.2)
    adjusted_bullishness = max(0, min(1, adjusted_bullishness))

    if adjusted_bullishness > 0.65:
        predicted_rating = Rating.OUTPERFORM
    elif adjusted_bullishness > 0.55:
        predicted_rating = Rating.BUY
    elif adjusted_bullishness > 0.45:
        predicted_rating = Rating.HOLD
    elif adjusted_bullishness > 0.35:
        predicted_rating = Rating.UNDERPERFORM
    else:
        predicted_rating = Rating.SELL

    # Target price (mock)
    base_price = 100 + (analyst.bullishness * 50)
    target_price = base_price + (event_sentiment * 20)

    return AnalystOpinion(
        analyst=analyst.name,
        firm=analyst.firm,
        current_rating=current_rating,
        predicted_rating=predicted_rating,
        confidence=analyst.accuracy / 100,
        target_price=round(target_price, 2),
        upside_pct=round((target_price / 100 - 1) * 100, 1),
        reasoning=f"Based on {analyst.firm}'s track record ({analyst.accuracy}% accuracy) and current market conditions"
    )

# ============================================================================
# ROUTES
# ============================================================================

@app.get("/health")
async def health():
    return {
        "service": "analyst-twin",
        "status": "healthy",
        "analysts": len(ANALYSTS)
    }

@app.get("/analysts")
async def list_analysts():
    return {"analysts": [a.dict() for a in ANALYSTS]}

@app.post("/predict/{symbol}", response_model=AnalystPrediction)
async def predict_analyst_consensus(
    symbol: str,
    event_sentiment: float = 0.0
) -> AnalystPrediction:
    """
    Predict analyst consensus for a symbol.

    Args:
        symbol: Stock symbol
        event_sentiment: Sentiment from event (-1 to 1)
    """

    # Get covering analysts
    covering = [a for a in ANALYSTS if symbol in a.coverage]
    if not covering:
        covering = ANALYSTS[:3]  # Default to first 3

    # Predict opinions
    opinions = [predict_analyst_opinion(a, symbol, event_sentiment) for a in covering]

    # Calculate consensus
    buy_count = sum(1 for o in opinions if o.predicted_rating in [Rating.BUY, Rating.OUTPERFORM])
    sell_count = sum(1 for o in opinions if o.predicted_rating in [Rating.SELL, Rating.UNDERPERFORM])
    hold_count = sum(1 for o in opinions if o.predicted_rating == Rating.HOLD)

    if buy_count > sell_count + hold_count:
        consensus = Rating.OUTPERFORM
    elif sell_count > buy_count + hold_count:
        consensus = Rating.UNDERPERFORM
    else:
        consensus = Rating.HOLD

    avg_target = sum(o.target_price for o in opinions) / len(opinions)

    return AnalystPrediction(
        symbol=symbol,
        timestamp=datetime.utcnow().isoformat(),
        opinions=opinions,
        consensus_rating=consensus,
        consensus_target=round(avg_target, 2),
        bullish_count=buy_count,
        bearish_count=sell_count,
        neutral_count=hold_count
    )

@app.get("/consensus/{symbol}")
async def get_consensus(symbol: str):
    """Get current analyst consensus"""
    result = await predict_analyst_consensus(symbol)
    return {
        "symbol": symbol,
        "consensus": result.consensus_rating.value,
        "target": result.consensus_target,
        "bullish": result.bullish_count,
        "bearish": result.bearish_count,
        "neutral": result.neutral_count
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5260)
