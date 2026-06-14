"""
AssetMind - Market Twin Service
Port: 5003
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


app = FastAPI(title="AssetMind Market Twin Service", version="1.0.0")


class MarketRegime(str, Enum):
    BULL = "BULL"
    BEAR = "BEAR"
    SIDEWAYS = "SIDEWAYS"
    HIGH_VOLATILITY = "HIGH_VOLATILITY"
    LOW_VOLATILITY = "LOW_VOLATILITY"
    CRISIS = "CRISIS"


class RateEnvironment(str, Enum):
    HIKING = "HIKING"
    CUTTING = "CUTTING"
    HOLDING = "HOLDING"


class InflationEnvironment(str, Enum):
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"


class GrowthEnvironment(str, Enum):
    ACCELERATING = "ACCELERATING"
    STABLE = "STABLE"
    DECELERATING = "DECELERATING"


class SectorRanking(BaseModel):
    sector: str
    score: float = Field(..., ge=0, le=100)
    performance_1d: float
    performance_1w: float
    performance_1m: float
    capital_flow: str  # INTO, OUT_OF, NEUTRAL


class MarketTwin(BaseModel):
    """Market Digital Twin"""
    # Global Market
    global_market_score: float = Field(..., ge=0, le=100)
    regime: MarketRegime = MarketRegime.SIDEWAYS
    volatility_index: float = 20  # VIX equivalent
    fear_greed_index: float = Field(50, ge=0, le=100)

    # Regional Markets
    us_market_score: float = Field(..., ge=0, le=100)
    eu_market_score: float = Field(..., ge=0, le=100)
    asia_market_score: float = Field(..., ge=0, le=100)
    em_market_score: float = Field(..., ge=0, le=100)
    india_market_score: float = Field(..., ge=0, le=100)
    china_market_score: float = Field(..., ge=0, le=100)

    # Sector Rotation
    sector_rankings: List[SectorRanking] = Field(default_factory=list)
    capital_flow_direction: str = "NEUTRAL"
    rotation_signals: List[str] = Field(default_factory=list)

    # Macro Context
    interest_rate_environment: RateEnvironment = RateEnvironment.HOLDING
    inflation_environment: InflationEnvironment = InflationEnvironment.MODERATE
    gdp_growth: GrowthEnvironment = GrowthEnvironment.STABLE
    central_bank_stance: str = "NEUTRAL"

    # Crypto Market
    crypto_market_score: float = Field(..., ge=0, le=100)
    bitcoin_dominance: float = 50
    total_crypto_mcap: float = 0

    # Timestamps
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    next_update: Optional[datetime] = None


# In-memory storage
market_twin = MarketTwin(
    global_market_score=65,
    us_market_score=68,
    eu_market_score=60,
    asia_market_score=55,
    em_market_score=50,
    india_market_score=62,
    china_market_score=45,
    sector_rankings=[
        SectorRanking(sector="Technology", score=75, performance_1d=1.2, performance_1w=3.5, performance_1m=8.2, capital_flow="INTO"),
        SectorRanking(sector="Healthcare", score=60, performance_1d=0.3, performance_1w=1.2, performance_1m=4.1, capital_flow="NEUTRAL"),
        SectorRanking(sector="Financials", score=55, performance_1d=-0.2, performance_1w=0.8, performance_1m=3.2, capital_flow="NEUTRAL"),
        SectorRanking(sector="Energy", score=50, performance_1d=-0.8, performance_1w=-1.5, performance_1m=2.1, capital_flow="OUT_OF"),
        SectorRanking(sector="Consumer", score=58, performance_1d=0.1, performance_1w=0.5, performance_1m=2.8, capital_flow="NEUTRAL"),
    ],
    capital_flow_direction="INTO_TECH",
    crypto_market_score=60,
    bitcoin_dominance=52,
    total_crypto_mcap=2.5e12
)


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-market-twin",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5003,
        "regime": market_twin.regime
    }


@app.get("/twin")
async def get_market_twin():
    return market_twin


@app.get("/twin/global")
async def get_global_market():
    return {
        "global_market_score": market_twin.global_market_score,
        "regime": market_twin.regime,
        "volatility_index": market_twin.volatility_index,
        "fear_greed_index": market_twin.fear_greed_index,
    }


@app.get("/twin/regional")
async def get_regional_markets():
    return {
        "us": market_twin.us_market_score,
        "eu": market_twin.eu_market_score,
        "asia": market_twin.asia_market_score,
        "em": market_twin.em_market_score,
        "india": market_twin.india_market_score,
        "china": market_twin.china_market_score,
    }


@app.get("/twin/sectors")
async def get_sector_rankings():
    return {
        "sectors": sorted(market_twin.sector_rankings, key=lambda x: x.score, reverse=True),
        "rotation_signals": market_twin.rotation_signals,
        "capital_flow_direction": market_twin.capital_flow_direction,
    }


@app.get("/twin/macro")
async def get_macro_context():
    return {
        "interest_rate_environment": market_twin.interest_rate_environment,
        "inflation_environment": market_twin.inflation_environment,
        "gdp_growth": market_twin.gdp_growth,
        "central_bank_stance": market_twin.central_bank_stance,
    }


@app.get("/twin/crypto")
async def get_crypto_market():
    return {
        "crypto_market_score": market_twin.crypto_market_score,
        "bitcoin_dominance": market_twin.bitcoin_dominance,
        "total_crypto_mcap": market_twin.total_crypto_mcap,
    }


@app.get("/twin/regime")
async def get_market_regime():
    return {
        "current_regime": market_twin.regime,
        "description": _get_regime_description(market_twin.regime),
        "recommendation": _get_regime_recommendation(market_twin.regime),
    }


def _get_regime_description(regime: MarketRegime) -> str:
    descriptions = {
        MarketRegime.BULL: "Strong upward trend with broad participation. Growth stocks outperform.",
        MarketRegime.BEAR: "Declining prices with increased volatility. Defensive stocks favored.",
        MarketRegime.SIDEWAYS: "Range-bound trading. Sector rotation opportunities.",
        MarketRegime.HIGH_VOLATILITY: "Elevated uncertainty. Reduced position sizes recommended.",
        MarketRegime.LOW_VOLATILITY: "Compressed volatility. Breakout opportunities emerging.",
        MarketRegime.CRISIS: "Extreme stress. Capital preservation priority.",
    }
    return descriptions.get(regime, "Unknown regime")


def _get_regime_recommendation(regime: MarketRegime) -> str:
    recommendations = {
        MarketRegime.BULL: "Overweight growth, momentum stocks. Add exposure on pullbacks.",
        MarketRegime.BEAR: "Defensive positioning. Quality over speculation.",
        MarketRegime.SIDEWAYS: "Sector rotation trades. Mean reversion strategies.",
        MarketRegime.HIGH_VOLATILITY: "Reduce position sizes. Focus on liquid assets.",
        MarketRegime.LOW_VOLATILITY: "Prepare for breakout. Long volatility strategies.",
        MarketRegime.CRISIS: "Cash and bonds. Avoid speculative positions.",
    }
    return recommendations.get(regime, "Maintain balanced allocation.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5003)
