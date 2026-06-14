"""
AssetMind Market Intelligence
Port: 5304

Alternative data integration, sentiment analysis, insider tracking, short interest data.
Provides market intelligence beyond traditional price/volume data.
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import json


app = FastAPI(title="AssetMind Market Intelligence", version="1.0.0")


class SentimentSource(str, Enum):
    NEWS = "news"
    SOCIAL = "social"
    SEC_FILINGS = "sec_filings"
    TRANSCRIPT = "transcript"
    ANALYST_RATING = "analyst_rating"


class InsiderTransaction(BaseModel):
    ticker: str
    insider_name: str
    title: str
    transaction_type: str  # BUY, SELL, GRANT, OPTION_EXERCISE
    shares: float
    price: float
    value: float
    date: str


class ShortInterest(BaseModel):
    ticker: str
    short_interest: float
    days_to_cover: float
    previous_short_interest: float
    change_pct: float
    report_date: str


class SentimentData(BaseModel):
    symbol: str
    overall_sentiment: float  # -100 to 100
    sentiment_score: float  # 0-100
    buzz_score: float  # 0-100
    bullish_pct: float
    bearish_pct: float
    neutral_pct: float
    sources_analyzed: int
    date: str


class AlternativeDataSignal(BaseModel):
    symbol: str
    signal_type: str
    signal_strength: float  # 0-100
    description: str
    source: str
    date: str
    actionable: bool


# In-memory storage
sentiment_cache: Dict[str, SentimentData] = {}
insider_transactions: List[InsiderTransaction] = []
short_interest_data: Dict[str, ShortInterest] = {}
alternative_signals: List[AlternativeDataSignal] = []


def calculate_sentiment(text: str) -> Dict[str, float]:
    """Calculate sentiment from text (simplified)."""
    positive_words = ["bullish", "growth", "profit", "beat", "upgrade", "strong", "positive", "up", "high", "buy"]
    negative_words = ["bearish", "loss", "miss", "downgrade", "weak", "negative", "down", "low", "sell", "risk"]

    text_lower = text.lower()
    positive_count = sum(1 for w in positive_words if w in text_lower)
    negative_count = sum(1 for w in negative_words if w in text_lower)

    total = positive_count + negative_count
    if total == 0:
        return {"sentiment": 0, "bullish": 33, "bearish": 33, "neutral": 34}

    bullish_pct = (positive_count / total) * 100
    bearish_pct = (negative_count / total) * 100
    neutral_pct = 100 - bullish_pct - bearish_pct

    sentiment = bullish_pct - bearish_pct

    return {
        "sentiment": sentiment,
        "bullish": bullish_pct,
        "bearish": bearish_pct,
        "neutral": neutral_pct
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "market-intelligence", "version": "1.0.0"}


@app.post("/sentiment")
async def analyze_sentiment(symbol: str, text: str):
    """Analyze sentiment from text."""
    scores = calculate_sentiment(text)

    sentiment_data = SentimentData(
        symbol=symbol,
        overall_sentiment=scores["sentiment"],
        sentiment_score=50 + scores["sentiment"] / 2,
        buzz_score=75,  # Simplified
        bullish_pct=scores["bullish"],
        bearish_pct=scores["bearish"],
        neutral_pct=scores["neutral"],
        sources_analyzed=1,
        date=datetime.now().isoformat()
    )

    sentiment_cache[symbol] = sentiment_data
    return sentiment_data


@app.get("/sentiment/{symbol}")
async def get_sentiment(symbol: str):
    """Get current sentiment for a symbol."""
    if symbol in sentiment_cache:
        return sentiment_cache[symbol]

    # Return mock data if not cached
    return SentimentData(
        symbol=symbol,
        overall_sentiment=15,
        sentiment_score=57,
        buzz_score=45,
        bullish_pct=40,
        bearish_pct=25,
        neutral_pct=35,
        sources_analyzed=10,
        date=datetime.now().isoformat()
    )


@app.post("/sentiment/batch")
async def batch_sentiment(symbols: List[str]):
    """Get sentiment for multiple symbols."""
    results = []
    for symbol in symbols:
        if symbol in sentiment_cache:
            results.append(sentiment_cache[symbol])
        else:
            results.append(SentimentData(
                symbol=symbol,
                overall_sentiment=0,
                sentiment_score=50,
                buzz_score=50,
                bullish_pct=33,
                bearish_pct=33,
                neutral_pct=34,
                sources_analyzed=0,
                date=datetime.now().isoformat()
            ))
    return {"sentiments": results}


@app.post("/insider")
async def add_insider_transaction(transaction: InsiderTransaction):
    """Add an insider transaction."""
    insider_transactions.append(transaction)
    return {"status": "added", "transaction": transaction}


@app.get("/insider/{ticker}")
async def get_insider_activity(ticker: str, days: int = 30):
    """Get insider activity for a ticker."""
    cutoff = (datetime.now() - timedelta(days=days)).isoformat()
    transactions = [t for t in insider_transactions if t.ticker == ticker and t.date >= cutoff]

    if not transactions:
        # Return mock data
        return {
            "ticker": ticker,
            "transactions": [
                InsiderTransaction(
                    ticker=ticker,
                    insider_name="CEO John Smith",
                    title="CEO",
                    transaction_type="BUY",
                    shares=10000,
                    price=150.00,
                    value=1500000,
                    date=(datetime.now() - timedelta(days=5)).isoformat()
                )
            ],
            "total_buys": 1,
            "total_sells": 0,
            "net_activity": "BUYING"
        }

    total_buys = sum(t.value for t in transactions if t.transaction_type == "BUY")
    total_sells = sum(t.value for t in transactions if t.transaction_type == "SELL")

    return {
        "ticker": ticker,
        "transactions": transactions,
        "total_buys": total_buys,
        "total_sells": total_sells,
        "net_activity": "BUYING" if total_buys > total_sells else "SELLING"
    }


@app.get("/short-interest/{ticker}")
async def get_short_interest(ticker: str):
    """Get short interest data for a ticker."""
    if ticker in short_interest_data:
        return short_interest_data[ticker]

    # Return mock data
    return ShortInterest(
        ticker=ticker,
        short_interest=5000000,
        days_to_cover=3.5,
        previous_short_interest=4500000,
        change_pct=11.1,
        report_date=datetime.now().isoformat()
    )


@app.post("/short-interest")
async def update_short_interest(data: ShortInterest):
    """Update short interest data."""
    short_interest_data[data.ticker] = data
    return data


@app.post("/signals")
async def add_signal(signal: AlternativeDataSignal):
    """Add an alternative data signal."""
    alternative_signals.append(signal)
    return signal


@app.get("/signals/{symbol}")
async def get_signals(symbol: str, days: int = 7):
    """Get alternative data signals for a symbol."""
    cutoff = (datetime.now() - timedelta(days=days)).isoformat()
    signals = [s for s in alternative_signals if s.symbol == symbol and s.date >= cutoff]

    if not signals:
        # Return mock signals
        signals = [
            AlternativeDataSignal(
                symbol=symbol,
                signal_type="insider_buying",
                signal_strength=75,
                description="CEO purchased10,000 shares at $150",
                source="SEC Form 4",
                date=datetime.now().isoformat(),
                actionable=True
            ),
            AlternativeDataSignal(
                symbol=symbol,
                signal_type="social_sentiment",
                signal_strength=65,
                description="Bullish mentions increased 40% this week",
                source="Social Media",
                date=datetime.now().isoformat(),
                actionable=False
            )
        ]

    return {"symbol": symbol, "signals": signals}


@app.get("/signals/all")
async def get_all_signals(actionable_only: bool = False, limit: int = 50):
    """Get all recent signals."""
    signals = alternative_signals[-limit:]
    if actionable_only:
        signals = [s for s in signals if s.actionable]
    return {"signals": signals, "total": len(signals)}


@app.post("/aggregate/{symbol}")
async def aggregate_intelligence(symbol: str):
    """Aggregate all intelligence for a symbol."""
    sentiment = await get_sentiment(symbol)
    insider = await get_insider_activity(symbol)
    short = await get_short_interest(symbol)
    signals = await get_signals(symbol)

    # Calculate composite score
    sentiment_weight = 0.3
    insider_weight = 0.3
    short_weight = 0.2
    signal_weight = 0.2

    composite_score = (
        sentiment.sentiment_score * sentiment_weight +
        (75 if insider["net_activity"] == "BUYING" else 25) * insider_weight +
        (60 if short.change_pct < 10 else 40) * short_weight +
        sum(s.signal_strength for s in signals["signals"]) / max(len(signals["signals"]), 1) * signal_weight
    )

    return {
        "symbol": symbol,
        "composite_score": round(composite_score, 1),
        "sentiment": sentiment,
        "insider_activity": insider,
        "short_interest": short,
        "signals": signals["signals"],
        "recommendation": "BULLISH" if composite_score > 60 else "BEARISH" if composite_score < 40 else "NEUTRAL"
    }


@app.get("/trending")
async def get_trending_signals(limit: int = 10):
    """Get trending signals across all symbols."""
    # Aggregate signals by symbol
    symbol_scores: Dict[str, List[float]] = {}

    for signal in alternative_signals[-100:]:
        if signal.symbol not in symbol_scores:
            symbol_scores[signal.symbol] = []
        symbol_scores[signal.symbol].append(signal.signal_strength)

    trending = []
    for symbol, scores in symbol_scores.items():
        avg_score = sum(scores) / len(scores)
        trending.append({
            "symbol": symbol,
            "avg_signal_strength": round(avg_score, 1),
            "signal_count": len(scores)
        })

    trending.sort(key=lambda x: x["avg_signal_strength"], reverse=True)
    return {"trending": trending[:limit]}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5304)