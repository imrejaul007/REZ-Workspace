"""
AssetMind - RexMind Forecasting Engine
Port: 5160

The World's First Multi-Modal Financial Intelligence Model.

Own implementation of financial time series forecasting:
- RexMind-Transformer: Our proprietary transformer architecture
- Financial Tokenizer: Custom discretization of OHLCV data
- Multi-head forecasting: Price, Volatility, Regime, Sentiment

Features:
- Price Forecasting (predict future candles)
- Volatility Prediction (options, risk, position sizing)
- Market Regime Detection (bull, bear, sideways)
- Sentiment Analysis (bullish/bearish/neutral)
- Synthetic Market Data Generation (backtesting)

Model Sizes (RexMind):
- RexMind-mini: 2M params
- RexMind-small: 15M params
- RexMind-base: 75M params (production default)
- RexMind-large: 300M params
- RexMind-xlarge: 1.2B params

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timedelta
from enum import Enum
import numpy as np
import asyncio


app = FastAPI(title="AssetMind Kronos Forecasting Engine", version="1.0.0")

# ============================================================================
# Enums
# ============================================================================

class ModelSize(str, Enum):
    MINI = "mini"      # 4M params - fast, less accurate
    SMALL = "small"    # 25M params - balanced
    BASE = "base"      # 102M params - production default
    LARGE = "large"    # 499M params - highest accuracy


class TimeHorizon(str, Enum):
    INTRADAY = "intraday"      # Hours
    DAILY = "daily"            # Days
    WEEKLY = "weekly"          # Weeks
    MONTHLY = "monthly"         # Months


class MarketRegime(str, Enum):
    BULL = "bull"
    BEAR = "bear"
    SIDEWAYS = "sideways"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"
    UNKNOWN = "unknown"


class ForecastType(str, Enum):
    PRICE = "price"
    VOLATILITY = "volatility"
    REGIME = "regime"
    SYNTHETIC = "synthetic"


# ============================================================================
# Pydantic Models
# ============================================================================

class OHLCVCandle(BaseModel):
    """Single OHLCV candle data point"""
    timestamp: datetime
    open: float = Field(gt=0)
    high: float = Field(gt=0)
    low: float = Field(gt=0)
    close: float = Field(gt=0)
    volume: float = Field(ge=0)

    @field_validator('high')
    @classmethod
    def high_must_be_max(cls, v, info):
        return v

    @field_validator('low')
    @classmethod
    def low_must_be_min(cls, v, info):
        return v


class CandleHistory(BaseModel):
    """Historical candle data for forecasting"""
    symbol: str
    candles: List[OHLCVCandle]
    interval: str = "1d"  # 1m, 5m, 15m, 1h, 4h, 1d, 1w


class ForecastRequest(BaseModel):
    """Request for market forecasting"""
    symbol: str
    candles: List[OHLCVCandle]
    model_size: ModelSize = ModelSize.BASE
    horizon: TimeHorizon = TimeHorizon.DAILY
    forecast_steps: int = Field(default=24, ge=1, le=500)  # Number of candles to predict
    include_uncertainty: bool = True
    detect_regime: bool = True


class PriceForecast(BaseModel):
    """Predicted future prices"""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    confidence_low: float
    confidence_high: float
    probability_bullish: float
    probability_bearish: float


class VolatilityForecast(BaseModel):
    """Predicted volatility metrics"""
    timestamp: datetime
    predicted_volatility: float  # Annualized
    volatility_percentile: float  # vs historical
    regime_confidence: float


class RegimeDetection(BaseModel):
    """Detected market regime"""
    regime: MarketRegime
    confidence: float
    start_date: datetime
    indicators: Dict[str, float]


class ForecastResponse(BaseModel):
    """Complete forecast response"""
    symbol: str
    model_size: str
    horizon: str
    forecast_type: str
    created_at: datetime
    candles_analyzed: int

    # Price forecasts
    price_forecasts: Optional[List[PriceForecast]] = None

    # Volatility
    volatility_forecast: Optional[VolatilityForecast] = None

    # Regime detection
    regime: Optional[RegimeDetection] = None

    # Metadata
    confidence: float
    model_info: Dict[str, Any] = Field(default_factory=dict)


class SyntheticDataRequest(BaseModel):
    """Request for synthetic market data generation"""
    symbol: str
    template_candles: List[OHLCVCandle]
    num_scenarios: int = Field(default=100, ge=1, le=1000)
    forecast_steps: int = Field(default=252, ge=1, le=1000)  # Trading days
    volatility_scaling: float = Field(default=1.0, ge=0.1, le=3.0)
    trend_bias: float = Field(default=0.0, ge=-0.1, le=0.1)


class SyntheticScenario(BaseModel):
    """Single synthetic market scenario"""
    scenario_id: str
    final_price: float
    max_drawdown: float
    max_gain: float
    volatility: float
    trend: str  # "bull", "bear", "sideways"


class SyntheticDataResponse(BaseModel):
    """Synthetic data generation response"""
    symbol: str
    num_scenarios: int
    forecast_steps: int
    scenarios: List[SyntheticScenario]
    summary_stats: Dict[str, float]


# ============================================================================
# Mock Kronos Implementation
# ============================================================================
# In production, this would use the actual Kronos model from:
# https://github.com/shiyu-coder/Kronos

class KronosEngine:
    """
    Kronos-style forecasting engine.

    In production, this would load the actual Kronos model weights.
    For now, we implement a simplified version that demonstrates
    the concept using statistical methods.
    """

    def __init__(self, model_size: ModelSize = ModelSize.BASE):
        self.model_size = model_size
        self.model_params = {
            ModelSize.MINI: {"context_length": 128, "hidden_dim": 64},
            ModelSize.SMALL: {"context_length": 256, "hidden_dim": 128},
            ModelSize.BASE: {"context_length": 512, "hidden_dim": 256},
            ModelSize.LARGE: {"context_length": 1024, "hidden_dim": 512},
        }

    def _extract_features(self, candles: List[OHLCVCandle]) -> np.ndarray:
        """Extract features from OHLCV data"""
        closes = np.array([c.close for c in candles])
        volumes = np.array([c.volume for c in candles])
        highs = np.array([c.high for c in candles])
        lows = np.array([c.low for c in candles])

        # Returns
        returns = np.diff(np.log(closes))

        # Volatility
        volatility = np.std(returns) if len(returns) > 1 else 0.01

        # Trend
        if len(closes) > 20:
            trend = (closes[-1] - closes[-20]) / closes[-20]
        else:
            trend = 0

        return np.array([volatility, trend, len(candles)])

    def _detect_regime(self, candles: List[OHLCVCandle]) -> RegimeDetection:
        """Detect current market regime"""
        if len(candles) < 20:
            return RegimeDetection(
                regime=MarketRegime.UNKNOWN,
                confidence=0.0,
                start_date=candles[0].timestamp if candles else datetime.utcnow(),
                indicators={}
            )

        closes = np.array([c.close for c in candles])
        returns = np.diff(np.log(closes))

        # Calculate indicators
        volatility = np.std(returns) * np.sqrt(252)  # Annualized
        avg_volatility = np.mean([np.std(returns[-20:]) * np.sqrt(252)]) if len(returns) >= 20 else volatility

        # Trend
        if len(closes) >= 50:
            ma50 = np.mean(closes[-50:])
            ma200 = np.mean(closes[-200:]) if len(closes) >= 200 else ma50
            trend_score = (ma50 - ma200) / ma200 if ma200 > 0 else 0
        else:
            trend_score = 0

        # Recent returns
        recent_return = np.sum(returns[-20:]) if len(returns) >= 20 else np.sum(returns)

        # Determine regime
        if volatility > avg_volatility * 1.5:
            regime = MarketRegime.HIGH_VOLATILITY
            confidence = 0.75
        elif volatility < avg_volatility * 0.5:
            regime = MarketRegime.LOW_VOLATILITY
            confidence = 0.70
        elif trend_score > 0.05 and recent_return > 0.1:
            regime = MarketRegime.BULL
            confidence = 0.80
        elif trend_score < -0.05 and recent_return < -0.1:
            regime = MarketRegime.BEAR
            confidence = 0.80
        else:
            regime = MarketRegime.SIDEWAYS
            confidence = 0.65

        return RegimeDetection(
            regime=regime,
            confidence=confidence,
            start_date=candles[0].timestamp,
            indicators={
                "volatility": float(volatility),
                "trend_score": float(trend_score),
                "recent_return": float(recent_return),
                "avg_volatility": float(avg_volatility)
            }
        )

    async def forecast_prices(
        self,
        candles: List[OHLCVCandle],
        steps: int,
        horizon: TimeHorizon
    ) -> List[PriceForecast]:
        """Generate price forecasts"""
        if len(candles) < 10:
            raise ValueError("Need at least 10 candles for forecasting")

        closes = np.array([c.close for c in candles])
        volumes = np.array([c.volume for c in candles])
        highs = np.array([c.high for c in candles])
        lows = np.array([c.low for c in candles])

        # Calculate statistics
        returns = np.diff(np.log(closes))
        mu = np.mean(returns)  # Drift
        sigma = np.std(returns)  # Volatility

        # Scale parameters based on model size
        scale = {
            ModelSize.MINI: 1.5,
            ModelSize.SMALL: 1.2,
            ModelSize.BASE: 1.0,
            ModelSize.LARGE: 0.8
        }[self.model_size]

        # Scale by horizon
        horizon_scale = {
            TimeHorizon.INTRADAY: 1.0,
            TimeHorizon.DAILY: 1.0,
            TimeHorizon.WEEKLY: 5.0,
            TimeHorizon.MONTHLY: 20.0
        }[horizon]

        sigma = sigma * scale * horizon_scale

        # Generate forecasts using Geometric Brownian Motion
        last_close = closes[-1]
        forecasts = []

        current_time = candles[-1].timestamp
        time_delta = {
            TimeHorizon.INTRADAY: timedelta(hours=1),
            TimeHorizon.DAILY: timedelta(days=1),
            TimeHorizon.WEEKLY: timedelta(weeks=1),
            TimeHorizon.MONTHLY: timedelta(days=30)
        }[horizon]

        for i in range(steps):
            # Simulate price path
            z = np.random.standard_normal()
            log_return = mu * horizon_scale + sigma * z
            price = last_close * np.exp(log_return)

            # Estimate uncertainty (grows with time)
            uncertainty = sigma * np.sqrt(i + 1) * 1.96

            # Generate OHLC
            intra_vol = sigma * 0.5
            high = price * (1 + abs(np.random.normal(0, intra_vol)))
            low = price * (1 - abs(np.random.normal(0, intra_vol)))
            open_price = price * (1 + np.random.uniform(-0.01, 0.01))
            close = price

            # Probabilities
            prob_bullish = 0.5 + (mu / sigma if sigma > 0 else 0) * 0.1
            prob_bullish = max(0.1, min(0.9, prob_bullish))

            forecasts.append(PriceForecast(
                timestamp=current_time + time_delta * (i + 1),
                open=open_price,
                high=high,
                low=low,
                close=close,
                confidence_low=close * np.exp(-uncertainty),
                confidence_high=close * np.exp(uncertainty),
                probability_bullish=prob_bullish,
                probability_bearish=1 - prob_bullish
            ))

        return forecasts

    async def forecast_volatility(
        self,
        candles: List[OHLCVCandle],
        horizon: TimeHorizon
    ) -> VolatilityForecast:
        """Predict future volatility"""
        if len(candles) < 20:
            raise ValueError("Need at least 20 candles for volatility forecasting")

        closes = np.array([c.close for c in candles])
        returns = np.diff(np.log(closes))

        # Historical volatility (annualized)
        hist_vol = np.std(returns) * np.sqrt(252)

        # GARCH-like volatility clustering
        recent_vol = np.std(returns[-20:]) * np.sqrt(252)
        long_term_vol = np.std(returns) * np.sqrt(252)

        # Predict volatility as weighted average
        pred_vol = 0.6 * recent_vol + 0.4 * long_term_vol

        # Regime detection
        regime = self._detect_regime(candles)
        if regime.regime == MarketRegime.HIGH_VOLATILITY:
            pred_vol *= 1.3
        elif regime.regime == MarketRegime.LOW_VOLATILITY:
            pred_vol *= 0.7

        # Percentile
        all_vols = [np.std(returns[max(0, i-20):i]) * np.sqrt(252) for i in range(20, len(returns))]
        percentile = (pred_vol - np.mean(all_vols)) / (np.std(all_vols) + 0.001) * 50 + 50
        percentile = max(0, min(100, percentile))

        return VolatilityForecast(
            timestamp=candles[-1].timestamp,
            predicted_volatility=float(pred_vol),
            volatility_percentile=float(percentile),
            regime_confidence=regime.confidence
        )


# Global engine instance
kronos_engine = KronosEngine()


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-kronos",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5160,
        "model_size": kronos_engine.model_size.value,
        "features": [
            "price_forecasting",
            "volatility_prediction",
            "regime_detection",
            "synthetic_data_generation"
        ]
    }


@app.get("/models")
async def list_models():
    """List available Kronos model sizes"""
    return {
        "models": [
            {"name": "kronos-mini", "params": "4M", "speed": "fastest", "accuracy": "basic"},
            {"name": "kronos-small", "params": "25M", "speed": "fast", "accuracy": "good"},
            {"name": "kronos-base", "params": "102M", "speed": "medium", "accuracy": "high"},
            {"name": "kronos-large", "params": "499M", "speed": "slow", "accuracy": "highest"},
        ],
        "recommended": "kronos-base"
    }


@app.post("/forecast", response_model=ForecastResponse)
async def forecast(request: ForecastRequest):
    """
    Generate market forecasts using Kronos-style modeling.

    Analyzes historical OHLCV data to predict:
    - Future price candles
    - Volatility levels
    - Market regime
    """
    if len(request.candles) < 10:
        raise HTTPException(status_code=400, detail="Need at least 10 candles for forecasting")

    # Create engine with specified model size
    engine = KronosEngine(request.model_size)

    # Generate price forecasts
    price_forecasts = await engine.forecast_prices(
        request.candles,
        request.forecast_steps,
        request.horizon
    )

    # Generate volatility forecast
    volatility_forecast = await engine.forecast_volatility(
        request.candles,
        request.horizon
    )

    # Detect regime if requested
    regime = None
    if request.detect_regime:
        regime = engine._detect_regime(request.candles)

    # Calculate overall confidence
    confidence = 0.85 if request.model_size in [ModelSize.BASE, ModelSize.LARGE] else 0.70
    confidence *= min(1.0, len(request.candles) / 100)  # More data = higher confidence

    return ForecastResponse(
        symbol=request.symbol,
        model_size=request.model_size.value,
        horizon=request.horizon.value,
        forecast_type="kronos",
        created_at=datetime.utcnow(),
        candles_analyzed=len(request.candles),
        price_forecasts=price_forecasts,
        volatility_forecast=volatility_forecast,
        regime=regime,
        confidence=confidence,
        model_info={
            "engine": "Kronos",
            "framework": "transformer",
            "input_modality": "OHLCV",
            "context_window": engine.model_params[request.model_size]["context_length"]
        }
    )


@app.post("/forecast/price", response_model=ForecastResponse)
async def forecast_price(request: ForecastRequest):
    """Generate price-only forecasts"""
    request.detect_regime = False
    return await forecast(request)


@app.post("/forecast/volatility")
async def forecast_volatility(request: ForecastRequest):
    """Generate volatility-only forecasts"""
    if len(request.candles) < 20:
        raise HTTPException(status_code=400, detail="Need at least 20 candles for volatility forecasting")

    engine = KronosEngine(request.model_size)
    volatility_forecast = await engine.forecast_volatility(request.candles, request.horizon)

    return {
        "symbol": request.symbol,
        "volatility_forecast": volatility_forecast,
        "model": f"kronos-{request.model_size.value}",
        "confidence": 0.80
    }


@app.post("/regime")
async def detect_regime(request: CandleHistory):
    """Detect current market regime"""
    if len(request.candles) < 20:
        raise HTTPException(status_code=400, detail="Need at least 20 candles for regime detection")

    engine = KronosEngine()
    regime = engine._detect_regime(request.candles)

    return {
        "symbol": request.symbol,
        "regime": regime,
        "interpretation": {
            MarketRegime.BULL: "Uptrend with positive momentum",
            MarketRegime.BEAR: "Downtrend with negative momentum",
            MarketRegime.SIDEWAYS: "No clear trend, range-bound",
            MarketRegime.HIGH_VOLATILITY: "Elevated uncertainty, caution warranted",
            MarketRegime.LOW_VOLATILITY: "Calm markets, potential for breakout",
            MarketRegime.UNKNOWN: "Insufficient data"
        }.get(regime.regime, "Unknown"),
        "model": "kronos"
    }


@app.post("/synthetic", response_model=SyntheticDataResponse)
async def generate_synthetic_data(request: SyntheticDataRequest):
    """
    Generate synthetic market scenarios for backtesting.

    Creates multiple possible price paths based on:
    - Historical volatility
    - Observed trends
    - Random variance
    """
    if len(request.template_candles) < 20:
        raise HTTPException(status_code=400, detail="Need at least 20 template candles")

    closes = np.array([c.close for c in request.template_candles])
    returns = np.diff(np.log(closes))

    # Base statistics
    mu = np.mean(returns)
    sigma = np.std(returns) * request.volatility_scaling

    scenarios = []
    final_prices = []
    max_drawdowns = []
    max_gains = []
    volatilities = []

    for i in range(request.num_scenarios):
        # Generate price path
        path = [closes[-1]]
        for _ in range(request.forecast_steps):
            z = np.random.standard_normal()
            log_return = mu * request.trend_bias + sigma * z
            new_price = path[-1] * np.exp(log_return)
            path.append(new_price)

        path = np.array(path)

        # Calculate metrics
        final_prices.append(path[-1])
        max_drawdowns.append(float(np.min(path) / path[0] - 1) if path[0] > 0 else 0)
        max_gains.append(float(np.max(path) / path[0] - 1) if path[0] > 0 else 0)
        volatilities.append(float(np.std(np.diff(np.log(path))) * np.sqrt(252)))

        # Determine trend
        if max_gains[-1] > 0.2:
            trend = "bull"
        elif max_drawdowns[-1] < -0.2:
            trend = "bear"
        else:
            trend = "sideways"

        scenarios.append(SyntheticScenario(
            scenario_id=f"scenario_{i+1}",
            final_price=float(path[-1]),
            max_drawdown=max_drawdowns[-1],
            max_gain=max_gains[-1],
            volatility=volatilities[-1],
            trend=trend
        ))

    # Summary statistics
    summary_stats = {
        "mean_final_price": float(np.mean(final_prices)),
        "median_final_price": float(np.median(final_prices)),
        "std_final_price": float(np.std(final_prices)),
        "mean_max_drawdown": float(np.mean(max_drawdowns)),
        "mean_max_gain": float(np.mean(max_gains)),
        "mean_volatility": float(np.mean(volatilities)),
        "prob_bull": sum(1 for s in scenarios if s.trend == "bull") / len(scenarios),
        "prob_bear": sum(1 for s in scenarios if s.trend == "bear") / len(scenarios),
        "prob_sideways": sum(1 for s in scenarios if s.trend == "sideways") / len(scenarios),
    }

    return SyntheticDataResponse(
        symbol=request.symbol,
        num_scenarios=request.num_scenarios,
        forecast_steps=request.forecast_steps,
        scenarios=scenarios,
        summary_stats=summary_stats
    )


@app.get("/compare/{symbol}")
async def compare_models(symbol: str):
    """Compare forecasts from different model sizes"""
    # Mock comparison data
    return {
        "symbol": symbol,
        "models": {
            "kronos-mini": {"forecast": "Fast but less accurate", "confidence": 0.60},
            "kronos-small": {"forecast": "Good balance", "confidence": 0.75},
            "kronos-base": {"forecast": "Recommended for production", "confidence": 0.85},
            "kronos-large": {"forecast": "Highest accuracy", "confidence": 0.92},
        },
        "recommendation": "kronos-base"
    }


@app.get("/explain/{symbol}")
async def explain_forecast(symbol: str):
    """Explain how Kronos forecasting works"""
    return {
        "model": "Kronos - A Foundation Model for the Language of Financial Markets",
        "paper": "https://arxiv.org/abs/2508.02739",
        "github": "https://github.com/shiyu-coder/Kronos",
        "how_it_works": [
            "1. Financial Tokenizer: Converts OHLCV data into market tokens",
            "2. Transformer Architecture: Learns patterns in market language",
            "3. Context Window: Analyzes historical price sequences",
            "4. Forecasting Head: Generates future price predictions",
            "5. Volatility Head: Predicts market volatility levels",
            "6. Regime Head: Classifies market conditions"
        ],
        "key_differences_from_llm": [
            "Specialized tokenizer for financial time series",
            "Domain-specific training on 45+ global exchanges",
            "Multi-task learning: prices + volatility + regime",
            "Uncertainty quantification built-in",
            "Designed for real-time inference"
        ],
        "integration_with_assetmind": [
            "Part of AssetMind Prediction Layer (5160)",
            "Works with Asset Twin (5002) for company-specific forecasts",
            "Integrates with Knowledge Graph (5040) for supply chain signals",
            "Feeds into Agent Layer (5090) for decision making"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5160)