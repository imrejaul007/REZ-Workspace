"""
Prediction Service
Main prediction service for asset price and trend predictions
Port: 5160
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import random
import asyncio

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Prediction Service", version="1.0.0", docs_url="/docs")


class PredictionType(str, Enum):
    PRICE = "price"
    TREND = "trend"
    VOLATILITY = "volatility"
    VOLUME = "volume"
    RETURNS = "returns"
    RISK = "risk"


class TimeHorizon(str, Enum):
    INTRADAY = "intraday"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class PredictionConfidence(str, Enum):
    VERY_HIGH = "very_high"  # > 90%
    HIGH = "high"  # 75-90%
    MEDIUM = "medium"  # 60-75%
    LOW = "low"  # 45-60%
    VERY_LOW = "very_low"  # < 45%


class Prediction(BaseModel):
    prediction_id: str
    asset_symbol: str
    prediction_type: PredictionType
    time_horizon: TimeHorizon
    current_value: float
    predicted_value: float
    confidence: PredictionConfidence
    confidence_score: float = Field(..., ge=0, le=1)
    direction: str  # UP, DOWN, STABLE
    change_percent: float
    change_absolute: float
    factors: List[Dict[str, Any]] = Field(default_factory=list)
    model_version: str
    created_at: datetime
    valid_until: datetime


class PredictionRequest(BaseModel):
    symbol: str
    prediction_type: PredictionType
    time_horizon: TimeHorizon
    lookback_days: int = 30


class PredictionService:
    """Main prediction service for asset price and trend predictions"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Prediction Service"
        self.port = 5160
        self.version = "1.0.0"
        self._prediction_cache: Dict[str, List[Prediction]] = {}
        self._models = {
            "price_lstm_v2": "1.2.0",
            "trend_classifier_v3": "1.0.0",
            "volatility_garch_v1": "1.1.0",
            "volume_lstm_v2": "1.0.0",
        }
        self._prediction_count = 0

    def _generate_prediction_id(self) -> str:
        """Generate unique prediction ID"""
        self._prediction_count += 1
        return f"pred_{datetime.utcnow().timestamp()}_{self._prediction_count}"

    def _calculate_confidence(self, metrics: Dict[str, float]) -> tuple:
        """Calculate confidence score and level"""
        score = 0.0

        # Model accuracy contribution
        if "model_accuracy" in metrics:
            score += metrics["model_accuracy"] * 0.4

        # Data quality contribution
        if "data_quality" in metrics:
            score += metrics["data_quality"] * 0.3

        # Historical fit contribution
        if "historical_fit" in metrics:
            score += metrics["historical_fit"] * 0.3

        # Determine confidence level
        if score >= 0.90:
            confidence = PredictionConfidence.VERY_HIGH
        elif score >= 0.75:
            confidence = PredictionConfidence.HIGH
        elif score >= 0.60:
            confidence = PredictionConfidence.MEDIUM
        elif score >= 0.45:
            confidence = PredictionConfidence.LOW
        else:
            confidence = PredictionConfidence.VERY_LOW

        return score, confidence

    def _get_technical_factors(self, symbol: str) -> List[Dict[str, Any]]:
        """Generate technical analysis factors"""
        # Simulated technical factors
        factors = [
            {
                "type": "technical",
                "indicator": "RSI",
                "value": random.uniform(30, 70),
                "signal": random.choice(["oversold", "neutral", "overbought"]),
                "weight": 0.25
            },
            {
                "type": "technical",
                "indicator": "MACD",
                "value": random.uniform(-2, 2),
                "signal": random.choice(["bullish", "bearish", "neutral"]),
                "weight": 0.25
            },
            {
                "type": "technical",
                "indicator": "Moving Average",
                "value": random.uniform(0.95, 1.05),
                "signal": random.choice(["above", "below", "at"]),
                "weight": 0.20
            },
            {
                "type": "technical",
                "indicator": "Bollinger Bands",
                "value": random.uniform(0.8, 1.2),
                "signal": random.choice(["lower", "middle", "upper"]),
                "weight": 0.15
            },
            {
                "type": "technical",
                "indicator": "Volume Profile",
                "value": random.uniform(0.5, 1.5),
                "signal": random.choice(["increasing", "stable", "decreasing"]),
                "weight": 0.15
            }
        ]
        return factors

    def _get_fundamental_factors(self, symbol: str) -> List[Dict[str, Any]]:
        """Generate fundamental analysis factors"""
        factors = [
            {
                "type": "fundamental",
                "metric": "P/E Ratio",
                "value": random.uniform(10, 50),
                "sector_average": random.uniform(15, 35),
                "signal": random.choice(["undervalued", "fair", "overvalued"]),
                "weight": 0.30
            },
            {
                "type": "fundamental",
                "metric": "Revenue Growth",
                "value": random.uniform(-10, 50),
                "unit": "percent",
                "signal": random.choice(["strong", "moderate", "weak"]),
                "weight": 0.25
            },
            {
                "type": "fundamental",
                "metric": "Earnings Yield",
                "value": random.uniform(2, 15),
                "unit": "percent",
                "signal": random.choice(["high", "average", "low"]),
                "weight": 0.20
            },
            {
                "type": "fundamental",
                "metric": "Debt/Equity",
                "value": random.uniform(0.1, 2.0),
                "signal": random.choice(["low", "moderate", "high"]),
                "weight": 0.15
            },
            {
                "type": "fundamental",
                "metric": "Market Sentiment",
                "value": random.uniform(-1, 1),
                "signal": random.choice(["positive", "neutral", "negative"]),
                "weight": 0.10
            }
        ]
        return factors

    async def predict(
        self,
        symbol: str,
        prediction_type: PredictionType = PredictionType.PRICE,
        time_horizon: TimeHorizon = TimeHorizon.DAILY,
        lookback_days: int = 30
    ) -> Prediction:
        """Generate prediction for an asset"""
        # Simulate current price (in production, fetch from data service)
        current_value = random.uniform(50, 500)

        # Calculate prediction based on type
        if prediction_type == PredictionType.PRICE:
            change_pct = random.uniform(-0.05, 0.08)
        elif prediction_type == PredictionType.TREND:
            change_pct = random.uniform(-0.02, 0.04)
        elif prediction_type == PredictionType.VOLATILITY:
            change_pct = random.uniform(-0.10, 0.10)
        elif prediction_type == PredictionType.VOLUME:
            change_pct = random.uniform(-0.20, 0.30)
        elif prediction_type == PredictionType.RETURNS:
            change_pct = random.uniform(-0.08, 0.12)
        else:  # RISK
            change_pct = random.uniform(-0.03, 0.03)

        predicted_value = current_value * (1 + change_pct)
        change_absolute = predicted_value - current_value

        # Calculate direction
        if change_pct > 0.01:
            direction = "UP"
        elif change_pct < -0.01:
            direction = "DOWN"
        else:
            direction = "STABLE"

        # Calculate confidence
        metrics = {
            "model_accuracy": random.uniform(0.65, 0.95),
            "data_quality": random.uniform(0.70, 0.99),
            "historical_fit": random.uniform(0.60, 0.90)
        }
        confidence_score, confidence = self._calculate_confidence(metrics)

        # Get influencing factors
        factors = []
        factors.extend(self._get_technical_factors(symbol))
        factors.extend(self._get_fundamental_factors(symbol))

        # Create prediction
        prediction = Prediction(
            prediction_id=self._generate_prediction_id(),
            asset_symbol=symbol.upper(),
            prediction_type=prediction_type,
            time_horizon=time_horizon,
            current_value=round(current_value, 2),
            predicted_value=round(predicted_value, 2),
            confidence=confidence,
            confidence_score=round(confidence_score, 3),
            direction=direction,
            change_percent=round(change_pct * 100, 2),
            change_absolute=round(change_absolute, 2),
            factors=sorted(factors, key=lambda x: x.get("weight", 0), reverse=True),
            model_version=self._models.get("price_lstm_v2", "1.0.0"),
            created_at=datetime.utcnow(),
            valid_until=datetime.utcnow() + timedelta(hours=24)
        )

        # Cache prediction
        cache_key = f"{symbol}_{prediction_type}_{time_horizon}"
        if cache_key not in self._prediction_cache:
            self._prediction_cache[cache_key] = []
        self._prediction_cache[cache_key].append(prediction)

        logger.info(f"Generated prediction for {symbol}: {direction} {prediction.change_percent}%")
        return prediction

    async def predict_batch(
        self,
        symbols: List[str],
        prediction_type: PredictionType = PredictionType.PRICE,
        time_horizon: TimeHorizon = TimeHorizon.DAILY
    ) -> List[Prediction]:
        """Generate predictions for multiple assets"""
        tasks = [
            self.predict(symbol, prediction_type, time_horizon)
            for symbol in symbols
        ]
        return await asyncio.gather(*tasks)

    async def get_prediction_history(
        self,
        symbol: str,
        prediction_type: PredictionType = PredictionType.PRICE,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get prediction history for an asset"""
        cache_key = f"{symbol}_{prediction_type}_{TimeHorizon.DAILY}"
        predictions = self._prediction_cache.get(cache_key, [])[-limit:]

        return [
            {
                "prediction_id": p.prediction_id,
                "asset_symbol": p.asset_symbol,
                "prediction_type": p.prediction_type.value,
                "current_value": p.current_value,
                "predicted_value": p.predicted_value,
                "confidence": p.confidence.value,
                "confidence_score": p.confidence_score,
                "direction": p.direction,
                "change_percent": p.change_percent,
                "created_at": p.created_at.isoformat(),
                "valid_until": p.valid_until.isoformat()
            }
            for p in predictions
        ]

    async def compare_predictions(
        self,
        symbol: str,
        horizons: List[TimeHorizon] = None
    ) -> Dict[str, Any]:
        """Compare predictions across different time horizons"""
        if horizons is None:
            horizons = [TimeHorizon.INTRADAY, TimeHorizon.DAILY, TimeHorizon.WEEKLY, TimeHorizon.MONTHLY]

        predictions = []
        for horizon in horizons:
            pred = await self.predict(symbol, PredictionType.PRICE, horizon)
            predictions.append({
                "time_horizon": horizon.value,
                "predicted_value": pred.predicted_value,
                "change_percent": pred.change_percent,
                "confidence": pred.confidence.value,
                "confidence_score": pred.confidence_score
            })

        return {
            "symbol": symbol,
            "current_price": predictions[0]["predicted_value"] / (1 + predictions[0]["change_percent"] / 100) if predictions else 0,
            "predictions": predictions
        }

    async def get_accuracy_metrics(self, symbol: str) -> Dict[str, Any]:
        """Get historical accuracy metrics for predictions"""
        # Simulated accuracy metrics
        return {
            "symbol": symbol,
            "period": "last_30_days",
            "total_predictions": random.randint(20, 100),
            "correct_direction": random.uniform(0.55, 0.75),
            "correct_magnitude": random.uniform(0.45, 0.65),
            "mean_absolute_error": random.uniform(2, 8),
            "root_mean_square_error": random.uniform(3, 12),
            "mean_absolute_percentage_error": random.uniform(3, 10),
            "directional_accuracy": random.uniform(0.55, 0.80),
            "model_version": self._models.get("price_lstm_v2", "1.0.0"),
            "last_updated": datetime.utcnow().isoformat()
        }


service = PredictionService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "models": service._models
    }


@app.post("/api/v1/predict", response_model=Prediction)
async def predict(request: PredictionRequest):
    """Generate prediction for an asset"""
    return await service.predict(
        symbol=request.symbol,
        prediction_type=request.prediction_type,
        time_horizon=request.time_horizon,
        lookback_days=request.lookback_days
    )


@app.post("/api/v1/predict/batch")
async def predict_batch(
    symbols: List[str],
    prediction_type: PredictionType = Query(PredictionType.PRICE),
    time_horizon: TimeHorizon = Query(TimeHorizon.DAILY)
):
    """Generate predictions for multiple assets"""
    return await service.predict_batch(symbols, prediction_type, time_horizon)


@app.get("/api/v1/predictions/{symbol}/history")
async def get_prediction_history(
    symbol: str,
    prediction_type: PredictionType = Query(PredictionType.PRICE),
    limit: int = Query(50, le=100)
):
    """Get prediction history for an asset"""
    return await service.get_prediction_history(symbol, prediction_type, limit)


@app.get("/api/v1/predictions/{symbol}/compare")
async def compare_predictions(
    symbol: str,
    horizons: str = Query(None)
):
    """Compare predictions across different time horizons"""
    horizon_list = None
    if horizons:
        horizon_list = [TimeHorizon(h) for h in horizons.split(",")]
    return await service.compare_predictions(symbol, horizon_list)


@app.get("/api/v1/predictions/{symbol}/accuracy")
async def get_accuracy_metrics(symbol: str):
    """Get prediction accuracy metrics"""
    return await service.get_accuracy_metrics(symbol)


@app.get("/api/v1/models")
async def get_models():
    """Get available prediction models"""
    return {
        "models": service._models,
        "version": service.version
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5160)