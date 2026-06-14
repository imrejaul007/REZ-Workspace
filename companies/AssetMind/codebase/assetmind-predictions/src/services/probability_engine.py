"""
Probability Engine Service
Advanced probability calculations for trading scenarios
Port: 5161
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import math
import random
from collections import defaultdict

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Probability Engine", version="1.0.0", docs_url="/docs")


class ScenarioType(str, Enum):
    PRICE_MOVE = "price_move"
    VOLATILITY_SPIKE = "volatility_spike"
    TREND_REVERSAL = "trend_reversal"
    BREAKOUT = "breakout"
    EARNINGS_BEAT = "earnings_beat"
    CORRELATION = "correlation"
    PORTFOLIO_LOSS = "portfolio_loss"


class ProbabilityLevel(str, Enum):
    VERY_HIGH = "very_high"  # > 85%
    HIGH = "high"  # 65-85%
    MODERATE = "moderate"  # 45-65%
    LOW = "low"  # 25-45%
    VERY_LOW = "very_low"  # < 25%


class ScenarioResult(BaseModel):
    scenario_id: str
    scenario_type: ScenarioType
    description: str
    probability: float = Field(..., ge=0, le=1)
    probability_percent: float = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=1)
    level: ProbabilityLevel
    factors: List[Dict[str, Any]] = Field(default_factory=list)
    simulations_run: int
    expected_outcome: Dict[str, Any]
    risk_indicator: str  # HIGH, MEDIUM, LOW
    created_at: datetime


class ProbabilityDistribution(BaseModel):
    asset_symbol: str
    distribution_type: str  # normal, lognormal, etc.
    parameters: Dict[str, float]
    mean: float
    std_dev: float
    skewness: float
    kurtosis: float
    percentiles: Dict[str, float]  # p5, p25, p50, p75, p95


class CorrelationMatrix(BaseModel):
    symbols: List[str]
    correlations: List[List[float]]
    last_updated: datetime


class ProbabilityEngine:
    """Advanced probability calculations engine"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Probability Engine"
        self.port = 5161
        self.version = "1.0.0"
        self._simulation_cache: Dict[str, List[float]] = {}
        self._correlation_matrices: Dict[str, CorrelationMatrix] = {}
        self._scenario_history: List[ScenarioResult] = []
        self._scenario_count = 0

    def _generate_scenario_id(self) -> str:
        """Generate unique scenario ID"""
        self._scenario_count += 1
        return f"scen_{datetime.utcnow().timestamp()}_{self._scenario_count}"

    def _calculate_probability_level(self, probability: float) -> ProbabilityLevel:
        """Calculate probability level from numeric value"""
        if probability >= 0.85:
            return ProbabilityLevel.VERY_HIGH
        elif probability >= 0.65:
            return ProbabilityLevel.HIGH
        elif probability >= 0.45:
            return ProbabilityLevel.MODERATE
        elif probability >= 0.25:
            return ProbabilityLevel.LOW
        else:
            return ProbabilityLevel.VERY_LOW

    def _calculate_risk_indicator(
        self,
        probability: float,
        impact: float
    ) -> str:
        """Calculate risk indicator"""
        risk_score = probability * impact
        if risk_score >= 0.6:
            return "HIGH"
        elif risk_score >= 0.3:
            return "MEDIUM"
        else:
            return "LOW"

    def _monte_carlo_simulation(
        self,
        initial_value: float,
        mean_return: float,
        volatility: float,
        periods: int,
        simulations: int = 10000
    ) -> List[float]:
        """Run Monte Carlo simulation using geometric Brownian motion"""
        results = []

        for _ in range(simulations):
            value = initial_value
            for _ in range(periods):
                # Generate random return using normal distribution
                random_return = random.gauss(mean_return, volatility)
                value *= (1 + random_return)
            results.append(value)

        return results

    def _calculate_value_at_risk(
        self,
        returns: List[float],
        confidence_levels: List[float] = [0.95, 0.99]
    ) -> Dict[str, float]:
        """Calculate Value at Risk (VaR)"""
        sorted_returns = sorted(returns)
        n = len(sorted_returns)

        var_values = {}
        for conf in confidence_levels:
            index = int((1 - conf) * n)
            var_values[f"VaR_{int(conf*100)}"] = abs(sorted_returns[index])

        # Expected Shortfall (CVaR)
        cvar_95 = sum(sorted_returns[:int(0.05 * n)]) / int(0.05 * n)
        cvar_99 = sum(sorted_returns[:int(0.01 * n)]) / int(0.01 * n)

        return {
            **var_values,
            "CVaR_95": abs(cvar_95),
            "CVaR_99": abs(cvar_99)
        }

    def _calculate_correlation(
        self,
        data1: List[float],
        data2: List[float]
    ) -> float:
        """Calculate Pearson correlation coefficient"""
        if len(data1) != len(data2):
            raise ValueError("Data arrays must have same length")

        n = len(data1)
        mean1 = sum(data1) / n
        mean2 = sum(data2) / n

        covariance = sum((x - mean1) * (y - mean2) for x, y in zip(data1, data2)) / n
        std1 = math.sqrt(sum((x - mean1) ** 2 for x in data1) / n)
        std2 = math.sqrt(sum((x - mean2) ** 2 for x in data2) / n)

        if std1 == 0 or std2 == 0:
            return 0

        return covariance / (std1 * std2)

    async def calculate_scenario_probability(
        self,
        scenario_type: ScenarioType,
        parameters: Dict[str, Any],
        simulations: int = 10000
    ) -> ScenarioResult:
        """Calculate probability for a trading scenario"""
        scenario_id = self._generate_scenario_id()

        # Extract parameters
        initial_price = parameters.get("initial_price", 100)
        expected_return = parameters.get("expected_return", 0.0001)  # Daily return
        volatility = parameters.get("volatility", 0.02)
        periods = parameters.get("periods", 1)
        target_price = parameters.get("target_price", initial_price * 1.05)

        # Run Monte Carlo simulation
        results = self._monte_carlo_simulation(
            initial_value=initial_price,
            mean_return=expected_return,
            volatility=volatility,
            periods=periods,
            simulations=simulations
        )

        # Calculate probability based on scenario type
        if scenario_type == ScenarioType.PRICE_MOVE:
            above_target = sum(1 for r in results if r >= target_price)
            probability = above_target / simulations
            description = f"Probability of price reaching ${target_price:.2f} or higher"
            impact = abs(target_price - initial_price) / initial_price

        elif scenario_type == ScenarioType.VOLATILITY_SPIKE:
            threshold = parameters.get("volatility_threshold", volatility * 2)
            spikes = sum(1 for r in results if abs(r - initial_price) / initial_price > threshold)
            probability = spikes / simulations
            description = f"Probability of volatility spike exceeding {threshold:.1%}"
            impact = threshold

        elif scenario_type == ScenarioType.TREND_REVERSAL:
            reversal_threshold = parameters.get("reversal_threshold", 0.05)
            reversals = sum(1 for r in results if (r - initial_price) / initial_price < -reversal_threshold)
            probability = reversals / simulations
            description = f"Probability of trend reversal (loss > {reversal_threshold:.1%})"
            impact = reversal_threshold

        elif scenario_type == ScenarioType.BREAKOUT:
            breakout_level = parameters.get("breakout_level", initial_price * 1.02)
            breakouts = sum(1 for r in results if r >= breakout_level)
            probability = breakouts / simulations
            description = f"Probability of breakout above ${breakout_level:.2f}"
            impact = abs(breakout_level - initial_price) / initial_price

        elif scenario_type == ScenarioType.EARNINGS_BEAT:
            beat_probability = parameters.get("historical_beat_rate", 0.55)
            probability = random.uniform(beat_probability - 0.1, beat_probability + 0.1)
            description = "Probability of earnings beating expectations"
            impact = 0.05

        elif scenario_type == ScenarioType.PORTFOLIO_LOSS:
            loss_threshold = parameters.get("loss_threshold", 0.10)
            losses = sum(1 for r in results if (r - initial_price) / initial_price < -loss_threshold)
            probability = losses / simulations
            description = f"Probability of portfolio loss exceeding {loss_threshold:.1%}"
            impact = loss_threshold

        else:
            probability = random.uniform(0.3, 0.7)
            description = "Generic probability calculation"
            impact = 0.1

        # Calculate confidence based on number of simulations
        confidence = min(0.95, 0.5 + 0.1 * math.log10(simulations))

        # Generate factors
        factors = [
            {
                "name": "Historical Volatility",
                "value": volatility,
                "impact": volatility * 100,
                "direction": "positive" if volatility < 0.03 else "negative"
            },
            {
                "name": "Expected Return",
                "value": expected_return,
                "impact": expected_return * 100,
                "direction": "positive" if expected_return > 0 else "negative"
            },
            {
                "name": "Time Horizon",
                "value": periods,
                "impact": periods * 2,
                "direction": "neutral"
            },
            {
                "name": "Market Conditions",
                "value": random.uniform(0.4, 0.8),
                "impact": 15,
                "direction": random.choice(["positive", "negative", "neutral"])
            }
        ]

        # Calculate expected outcome
        mean_outcome = sum(results) / len(results)
        expected_outcome = {
            "mean_price": round(mean_outcome, 2),
            "median_price": round(sorted(results)[len(results) // 2], 2),
            "min_price": round(min(results), 2),
            "max_price": round(max(results), 2),
            "std_deviation": round(math.sqrt(sum((r - mean_outcome) ** 2 for r in results) / len(results)), 2)
        }

        # Add VaR calculations
        returns = [(r - initial_price) / initial_price for r in results]
        var_metrics = self._calculate_value_at_risk(returns)
        expected_outcome["risk_metrics"] = var_metrics

        risk_indicator = self._calculate_risk_indicator(probability, impact)

        scenario = ScenarioResult(
            scenario_id=scenario_id,
            scenario_type=scenario_type,
            description=description,
            probability=round(probability, 4),
            probability_percent=round(probability * 100, 2),
            confidence=round(confidence, 3),
            level=self._calculate_probability_level(probability),
            factors=factors,
            simulations_run=simulations,
            expected_outcome=expected_outcome,
            risk_indicator=risk_indicator,
            created_at=datetime.utcnow()
        )

        self._scenario_history.append(scenario)
        logger.info(f"Calculated scenario probability: {scenario_type.value} = {probability:.2%}")

        return scenario

    async def calculate_distribution(
        self,
        symbol: str,
        data_points: List[float],
        distribution_type: str = "lognormal"
    ) -> ProbabilityDistribution:
        """Calculate probability distribution for an asset"""
        n = len(data_points)
        mean = sum(data_points) / n
        variance = sum((x - mean) ** 2 for x in data_points) / n
        std_dev = math.sqrt(variance)

        # Calculate skewness and kurtosis
        if std_dev > 0:
            skewness = sum(((x - mean) / std_dev) ** 3 for x in data_points) / n
            kurtosis = sum(((x - mean) / std_dev) ** 4 for x in data_points) / n - 3
        else:
            skewness = 0
            kurtosis = 0

        # Calculate percentiles
        sorted_data = sorted(data_points)
        percentiles = {
            "p5": sorted_data[int(0.05 * n)],
            "p25": sorted_data[int(0.25 * n)],
            "p50": sorted_data[int(0.50 * n)],
            "p75": sorted_data[int(0.75 * n)],
            "p95": sorted_data[int(0.95 * n)]
        }

        parameters = {
            "mean": mean,
            "std_dev": std_dev,
            "skewness": skewness,
            "kurtosis": kurtosis
        }

        if distribution_type == "lognormal":
            log_data = [math.log(max(x, 0.001)) for x in data_points]
            parameters["log_mean"] = sum(log_data) / n
            parameters["log_std"] = math.sqrt(sum((x - sum(log_data) / n) ** 2 for x in log_data) / n)

        return ProbabilityDistribution(
            asset_symbol=symbol,
            distribution_type=distribution_type,
            parameters=parameters,
            mean=mean,
            std_dev=std_dev,
            skewness=skewness,
            kurtosis=kurtosis,
            percentiles=percentiles
        )

    async def calculate_correlation_matrix(
        self,
        symbols: List[str],
        price_data: Dict[str, List[float]]
    ) -> CorrelationMatrix:
        """Calculate correlation matrix for multiple assets"""
        n = len(symbols)
        correlations = [[0.0] * n for _ in range(n)]

        for i, symbol1 in enumerate(symbols):
            for j, symbol2 in enumerate(symbols):
                if i == j:
                    correlations[i][j] = 1.0
                elif i < j:
                    data1 = price_data.get(symbol1, [])
                    data2 = price_data.get(symbol2, [])

                    if len(data1) == len(data2) and len(data1) > 1:
                        corr = self._calculate_correlation(data1, data2)
                        correlations[i][j] = corr
                        correlations[j][i] = corr
                    else:
                        correlations[i][j] = 0.5
                        correlations[j][i] = 0.5

        matrix = CorrelationMatrix(
            symbols=symbols,
            correlations=correlations,
            last_updated=datetime.utcnow()
        )

        self._correlation_matrices[symbols[0] if symbols else ""] = matrix
        return matrix

    async def calculate_conditional_probability(
        self,
        event_a_probability: float,
        event_b_probability: float,
        joint_probability: float
    ) -> Dict[str, float]:
        """Calculate conditional probabilities"""
        # P(A|B) = P(A and B) / P(B)
        if event_b_probability > 0:
            conditional_a_given_b = joint_probability / event_b_probability
        else:
            conditional_a_given_b = 0

        # P(B|A) = P(A and B) / P(A)
        if event_a_probability > 0:
            conditional_b_given_a = joint_probability / event_a_probability
        else:
            conditional_b_given_a = 0

        # Calculate statistical independence
        expected_joint = event_a_probability * event_b_probability
        is_independent = abs(joint_probability - expected_joint) < 0.001

        return {
            "p_a": event_a_probability,
            "p_b": event_b_probability,
            "p_a_and_b": joint_probability,
            "p_a_given_b": conditional_a_given_b,
            "p_b_given_a": conditional_b_given_a,
            "is_independent": is_independent,
            "correlation": (joint_probability - expected_joint) / math.sqrt(event_a_probability * event_b_probability * (1 - event_a_probability) * (1 - event_b_probability)) if event_a_probability * event_b_probability > 0 else 0
        }

    async def get_scenario_history(
        self,
        scenario_type: Optional[ScenarioType] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get scenario history"""
        scenarios = self._scenario_history

        if scenario_type:
            scenarios = [s for s in scenarios if s.scenario_type == scenario_type]

        scenarios = scenarios[-limit:]

        return [
            {
                "scenario_id": s.scenario_id,
                "scenario_type": s.scenario_type.value,
                "probability_percent": s.probability_percent,
                "confidence": s.confidence,
                "level": s.level.value,
                "risk_indicator": s.risk_indicator,
                "created_at": s.created_at.isoformat()
            }
            for s in scenarios
        ]


service = ProbabilityEngine()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "scenarios_calculated": service._scenario_count
    }


@app.post("/api/v1/scenario/probability")
async def calculate_scenario_probability(
    scenario_type: ScenarioType,
    parameters: Dict[str, Any],
    simulations: int = Query(10000, le=100000)
):
    """Calculate probability for a trading scenario"""
    return await service.calculate_scenario_probability(scenario_type, parameters, simulations)


@app.post("/api/v1/distribution")
async def calculate_distribution(
    symbol: str,
    data_points: List[float],
    distribution_type: str = Query("lognormal")
):
    """Calculate probability distribution for an asset"""
    return await service.calculate_distribution(symbol, data_points, distribution_type)


@app.post("/api/v1/correlation/matrix")
async def calculate_correlation_matrix(
    symbols: List[str],
    price_data: Dict[str, List[float]]
):
    """Calculate correlation matrix for multiple assets"""
    return await service.calculate_correlation_matrix(symbols, price_data)


@app.post("/api/v1/conditional/probability")
async def calculate_conditional_probability(
    event_a_probability: float,
    event_b_probability: float,
    joint_probability: float
):
    """Calculate conditional probabilities"""
    return await service.calculate_conditional_probability(
        event_a_probability,
        event_b_probability,
        joint_probability
    )


@app.get("/api/v1/scenarios/history")
async def get_scenario_history(
    scenario_type: ScenarioType = Query(None),
    limit: int = Query(50, le=200)
):
    """Get scenario history"""
    return await service.get_scenario_history(scenario_type, limit)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5161)