"""
AssetMind Scoring Service
Multi-dimensional asset scoring (health, opportunity, risk, etc.)
Port: 5070
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import random

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AssetMind Scoring Service",
    version="1.0.0",
    docs_url="/docs",
    description="Multi-dimensional asset scoring: health, opportunity, risk, and more"
)


class ScoreType(str, Enum):
    HEALTH = "health"
    OPPORTUNITY = "opportunity"
    RISK = "risk"
    CONVICTION = "conviction"
    INSTITUTIONAL = "institutional"
    SENTIMENT = "sentiment"
    FINANCIAL = "financial"
    TECHNICAL = "technical"
    MOMENTUM = "momentum"


class ScoreLevel(str, Enum):
    VERY_WEAK = "very_weak"    # 0-20
    WEAK = "weak"              # 20-40
    NEUTRAL = "neutral"        # 40-60
    STRONG = "strong"          # 60-80
    VERY_STRONG = "very_strong"  # 80-100


class ScoreRequest(BaseModel):
    symbol: str
    score_type: Optional[ScoreType] = None
    time_horizon: str = "medium"  # short, medium, long


class Score(BaseModel):
    symbol: str
    score_type: ScoreType
    score: int = Field(..., ge=0, le=100)
    score_name: str
    score_level: ScoreLevel
    time_horizon: str
    confidence: float = Field(..., ge=0, le=1)
    factors: Dict[str, Any]
    timestamp: datetime


class CompositeScore(BaseModel):
    symbol: str
    overall_score: int
    overall_level: ScoreLevel
    scores: List[Score]
    timestamp: datetime


class ScoringService:
    """Multi-dimensional asset scoring service"""

    def __init__(self):
        self.name = "Scoring Service"
        self.port = 5070
        self.version = "1.0.0"
        self._score_cache: Dict[str, Dict[str, Any]] = {}
        self._score_count = 0

    def _generate_score_id(self) -> str:
        """Generate unique score ID"""
        self._score_count += 1
        return f"score_{datetime.utcnow().timestamp()}_{self._score_count}"

    def _get_score_level(self, score: int) -> ScoreLevel:
        """Convert numeric score to level"""
        if score >= 80:
            return ScoreLevel.VERY_STRONG
        elif score >= 60:
            return ScoreLevel.STRONG
        elif score >= 40:
            return ScoreLevel.NEUTRAL
        elif score >= 20:
            return ScoreLevel.WEAK
        else:
            return ScoreLevel.VERY_WEAK

    def _generate_factors(self, score_type: ScoreType) -> Dict[str, Any]:
        """Generate score-influencing factors based on type"""
        if score_type == ScoreType.HEALTH:
            return {
                "financial_health": random.randint(50, 95),
                "technical_health": random.randint(40, 90),
                "sentiment_health": random.randint(45, 85),
                "market_position": random.randint(30, 80),
                "liquidity": random.randint(50, 90)
            }
        elif score_type == ScoreType.OPPORTUNITY:
            return {
                "growth_potential": random.randint(40, 90),
                "market_size": random.randint(50, 85),
                "competitive_advantage": random.randint(35, 80),
                "innovation_score": random.randint(45, 85),
                "expansion_ability": random.randint(40, 80)
            }
        elif score_type == ScoreType.RISK:
            return {
                "market_risk": random.randint(20, 70),
                "credit_risk": random.randint(15, 60),
                "liquidity_risk": random.randint(20, 65),
                "operational_risk": random.randint(15, 55),
                "regulatory_risk": random.randint(20, 70)
            }
        elif score_type == ScoreType.CONVICTION:
            return {
                "earnings_quality": random.randint(55, 90),
                "management_quality": random.randint(60, 95),
                "business_durability": random.randint(50, 85),
                "valuation_appeal": random.randint(40, 80),
                "catalyst_visibility": random.randint(35, 75)
            }
        elif score_type == ScoreType.INSTITUTIONAL:
            return {
                "institutional_ownership": random.randint(40, 85),
                "analyst_coverage": random.randint(30, 80),
                "fund_flow": random.randint(30, 75),
                "smart_money_indicator": random.randint(45, 85),
                "insider_activity": random.randint(35, 80)
            }
        elif score_type == ScoreType.SENTIMENT:
            return {
                "news_sentiment": random.randint(30, 80),
                "social_media_buzz": random.randint(25, 75),
                "analyst_sentiment": random.randint(40, 85),
                "short_interest": random.randint(20, 70),
                "option_sentiment": random.randint(35, 80)
            }
        elif score_type == ScoreType.FINANCIAL:
            return {
                "profitability": random.randint(50, 95),
                "leverage": random.randint(40, 85),
                "liquidity_ratio": random.randint(45, 90),
                "cash_flow": random.randint(50, 90),
                "asset_turnover": random.randint(40, 80)
            }
        elif score_type == ScoreType.TECHNICAL:
            return {
                "trend_strength": random.randint(35, 85),
                "momentum_indicator": random.randint(30, 80),
                "relative_strength": random.randint(40, 85),
                "volume_profile": random.randint(35, 75),
                "chart_pattern": random.randint(40, 80)
            }
        else:  # MOMENTUM
            return {
                "price_momentum": random.randint(30, 85),
                "volume_momentum": random.randint(25, 75),
                "earnings_momentum": random.randint(35, 80),
                "revenue_momentum": random.randint(30, 75),
                "sector_momentum": random.randint(25, 70)
            }

    async def calculate_score(
        self,
        symbol: str,
        score_type: ScoreType,
        time_horizon: str = "medium"
    ) -> Score:
        """Calculate a specific score for a symbol"""
        factors = self._generate_factors(score_type)

        # Calculate weighted score
        weights = {
            "financial_health": 0.30, "technical_health": 0.25, "sentiment_health": 0.20,
            "market_position": 0.15, "liquidity": 0.10, "growth_potential": 0.30,
            "market_size": 0.25, "competitive_advantage": 0.20, "innovation_score": 0.15,
            "expansion_ability": 0.10, "market_risk": 0.35, "credit_risk": 0.25,
            "liquidity_risk": 0.20, "operational_risk": 0.12, "regulatory_risk": 0.08,
            "earnings_quality": 0.30, "management_quality": 0.25, "business_durability": 0.20,
            "valuation_appeal": 0.15, "catalyst_visibility": 0.10, "institutional_ownership": 0.35,
            "analyst_coverage": 0.25, "fund_flow": 0.20, "smart_money_indicator": 0.12,
            "insider_activity": 0.08, "news_sentiment": 0.30, "social_media_buzz": 0.20,
            "analyst_sentiment": 0.25, "short_interest": 0.15, "option_sentiment": 0.10,
            "profitability": 0.35, "leverage": 0.20, "liquidity_ratio": 0.20,
            "cash_flow": 0.15, "asset_turnover": 0.10, "trend_strength": 0.30,
            "momentum_indicator": 0.25, "relative_strength": 0.20, "volume_profile": 0.15,
            "chart_pattern": 0.10, "price_momentum": 0.30, "volume_momentum": 0.25,
            "earnings_momentum": 0.20, "revenue_momentum": 0.15, "sector_momentum": 0.10
        }

        total_weight = 0
        weighted_sum = 0
        for factor, value in factors.items():
            weight = weights.get(factor, 0.10)
            weighted_sum += value * weight
            total_weight += weight

        score = int(weighted_sum / total_weight) if total_weight > 0 else 50

        # For risk scores, invert the logic
        if score_type == ScoreType.RISK:
            score = 100 - score

        confidence = random.uniform(0.65, 0.90)

        return Score(
            symbol=symbol.upper(),
            score_type=score_type,
            score=score,
            score_name=score_type.value,
            score_level=self._get_score_level(score),
            time_horizon=time_horizon,
            confidence=round(confidence, 2),
            factors=factors,
            timestamp=datetime.utcnow()
        )

    async def calculate_composite(
        self,
        symbol: str,
        time_horizon: str = "medium"
    ) -> CompositeScore:
        """Calculate composite score from all dimensions"""
        scores = []
        total_score = 0

        score_types = list(ScoreType)
        weights = {
            ScoreType.HEALTH: 0.15,
            ScoreType.OPPORTUNITY: 0.15,
            ScoreType.RISK: 0.15,
            ScoreType.CONVICTION: 0.15,
            ScoreType.INSTITUTIONAL: 0.10,
            ScoreType.SENTIMENT: 0.10,
            ScoreType.FINANCIAL: 0.10,
            ScoreType.TECHNICAL: 0.05,
            ScoreType.MOMENTUM: 0.05
        }

        for score_type in score_types:
            score = await self.calculate_score(symbol, score_type, time_horizon)
            scores.append(score)
            total_score += score.score * weights.get(score_type, 0.10)

        overall_score = int(total_score)

        return CompositeScore(
            symbol=symbol.upper(),
            overall_score=overall_score,
            overall_level=self._get_score_level(overall_score),
            scores=scores,
            timestamp=datetime.utcnow()
        )

    async def get_score_comparison(
        self,
        symbols: List[str],
        score_type: ScoreType = ScoreType.HEALTH
    ) -> Dict[str, Any]:
        """Compare scores across multiple symbols"""
        results = []
        for symbol in symbols:
            score = await self.calculate_score(symbol, score_type)
            results.append({
                "symbol": score.symbol,
                "score": score.score,
                "level": score.score_level.value,
                "confidence": score.confidence
            })

        results.sort(key=lambda x: x["score"], reverse=True)

        return {
            "score_type": score_type.value,
            "rankings": results,
            "average": round(sum(r["score"] for r in results) / len(results), 1) if results else 0,
            "generated_at": datetime.utcnow().isoformat()
        }

    async def get_historical_scores(
        self,
        symbol: str,
        score_type: ScoreType,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get historical scores for a symbol"""
        history = []
        current_date = datetime.utcnow()

        for i in range(days):
            date = current_date - timedelta(days=i)
            base_score = random.randint(40, 75)
            variation = random.randint(-10, 10)

            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "score": max(0, min(100, base_score + variation)),
                "level": self._get_score_level(max(0, min(100, base_score + variation))).value
            })

        return sorted(history, key=lambda x: x["date"])

    async def get_top_opportunities(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top opportunities across all score dimensions"""
        symbols = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "NVDA", "META", "AMD", "INTC", "NFLX"]
        opportunities = []

        for symbol in symbols:
            composite = await self.calculate_composite(symbol)
            opportunities.append({
                "symbol": symbol,
                "overall_score": composite.overall_score,
                "overall_level": composite.overall_level.value,
                "top_scores": [
                    {"type": s.score_type.value, "score": s.score}
                    for s in sorted(composite.scores, key=lambda x: x.score, reverse=True)[:3]
                ]
            })

        return sorted(opportunities, key=lambda x: x["overall_score"], reverse=True)[:limit]


# Initialize service
service = ScoringService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "scores_calculated": service._score_count
    }


@app.get("/api/v1/score/{symbol}")
async def get_score(
    symbol: str,
    score_type: ScoreType = Query(ScoreType.HEALTH),
    time_horizon: str = Query("medium")
):
    """Calculate a specific score for a symbol"""
    return await service.calculate_score(symbol.upper(), score_type, time_horizon)


@app.get("/api/v1/composite/{symbol}")
async def get_composite(symbol: str, time_horizon: str = Query("medium")):
    """Calculate composite score for a symbol"""
    return await service.calculate_composite(symbol.upper(), time_horizon)


@app.post("/api/v1/composite/batch")
async def get_composite_batch(symbols: List[str], time_horizon: str = "medium"):
    """Calculate composite scores for multiple symbols"""
    results = []
    for symbol in symbols:
        composite = await service.calculate_composite(symbol.upper(), time_horizon)
        results.append(composite)
    return {"composites": results, "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/v1/compare/{score_type}")
async def compare_scores(
    score_type: ScoreType = Query(ScoreType.HEALTH),
    symbols: str = Query("AAPL,GOOGL,MSFT,AMZN,TSLA")
):
    """Compare scores across multiple symbols"""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    return await service.get_score_comparison(symbol_list, score_type)


@app.get("/api/v1/history/{symbol}/{score_type}")
async def get_historical_scores(
    symbol: str,
    score_type: ScoreType = Query(ScoreType.HEALTH),
    days: int = Query(30, le=365)
):
    """Get historical scores for a symbol"""
    return await service.get_historical_scores(symbol.upper(), score_type, days)


@app.get("/api/v1/top/opportunities")
async def get_top_opportunities(limit: int = Query(10, le=50)):
    """Get top opportunities across all dimensions"""
    return await service.get_top_opportunities(limit)


@app.get("/api/v1/score-types")
async def get_score_types():
    """Get all available score types"""
    return {
        "score_types": [
            {"type": st.value, "description": f"{st.value.replace('_', ' ').title()} score"}
            for st in ScoreType
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5070)