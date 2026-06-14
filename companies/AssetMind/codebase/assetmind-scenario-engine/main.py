"""
AssetMind Scenario Engine
Scenario analysis and stress testing service
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid
import random
import numpy as np
from collections import defaultdict

app = FastAPI(
    title="AssetMind Scenario Engine",
    description="Scenario analysis and stress testing for portfolio risk",
    version="1.0.0"
)


# Enums
class ScenarioType(str, Enum):
    HISTORICAL = "historical"
    HYPOTHETICAL = "hypothetical"
    MONTE_CARLO = "monte_carlo"
    STRESS_TEST = "stress_test"
    WHAT_IF = "what_if"


class MarketShock(str, Enum):
    MARKET_CRASH = "market_crash"
    INTEREST_RATE_SPIKE = "interest_rate_spike"
    LIQUIDITY_CRISIS = "liquidity_crisis"
    CURRENCY_DEVALUATION = "currency_devaluation"
    SECTOR_ROTATION = "sector_rotation"
    BLACK_SWAN = "black_swan"
    FLASH_CRASH = "flash_crash"
    BOND_MARKET_SELL_OFF = "bond_market_sell_off"


class AssetClass(str, Enum):
    EQUITY = "equity"
    FIXED_INCOME = "fixed_income"
    COMMODITY = "commodity"
    FOREX = "forex"
    CRYPTO = "crypto"
    REAL_ESTATE = "real_estate"
    OPTIONS = "options"
    FUTURES = "futures"


class TimeHorizon(str, Enum):
    INTRADAY = "intraday"
    ONE_WEEK = "1w"
    ONE_MONTH = "1m"
    THREE_MONTHS = "3m"
    SIX_MONTHS = "6m"
    ONE_YEAR = "1y"
    FIVE_YEARS = "5y"


class SeverityLevel(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    EXTREME = "extreme"
    CATASTROPHIC = "catastrophic"


# Pydantic Models
class Portfolio(BaseModel):
    """Portfolio for scenario analysis."""
    portfolio_id: str
    name: str
    positions: Dict[str, float]  # symbol -> value
    total_value: float
    cash: float
    leverage: float = 1.0


class ScenarioConfig(BaseModel):
    """Scenario analysis configuration."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    scenario_type: ScenarioType
    time_horizon: TimeHorizon
    confidence_level: float = Field(default=0.95, ge=0.5, le=0.999)
    num_simulations: int = Field(default=10000, ge=100, le=100000)
    correlation_matrix: Optional[Dict[str, Dict[str, float]]] = None
    volatility_scaling: float = Field(default=1.0, ge=0.1, le=5.0)
    include_tail_risk: bool = Field(default=True)


class MarketShockConfig(BaseModel):
    """Market shock scenario configuration."""
    shock_type: MarketShock
    severity: SeverityLevel
    affected_assets: List[AssetClass] = Field(default_factory=lambda: [AssetClass.EQUITY])
    duration_days: int = Field(default=10, ge=1)
    recovery_days: Optional[int] = None
    custom_parameters: Dict[str, float] = Field(default_factory=dict)


class WhatIfScenario(BaseModel):
    """What-if scenario definition."""
    name: str
    assumptions: Dict[str, Any]
    expected_returns: Dict[str, float]  # symbol -> expected return
    expected_volatility: Dict[str, float]  # symbol -> volatility
    correlations: Dict[str, Dict[str, float]]


class ScenarioResult(BaseModel):
    """Scenario analysis result."""
    scenario_id: str
    name: str
    scenario_type: ScenarioType
    created_at: datetime
    completed_at: Optional[datetime] = None

    # Risk metrics
    expected_return: float
    expected_volatility: float
    value_at_risk: float  # VaR
    conditional_var: float  # CVaR / Expected Shortfall
    max_drawdown: float
    sharpe_ratio: Optional[float]

    # Distribution metrics
    percentile_5: float
    percentile_25: float
    percentile_50: float
    percentile_75: float
    percentile_95: float

    # Portfolio impact
    initial_value: float
    final_value_mean: float
    final_value_std: float
    probability_of_loss: float
    expected_shortfall: float


class ShockImpact(BaseModel):
    """Impact analysis for a market shock."""
    shock_id: str
    shock_type: MarketShock
    severity: SeverityLevel

    # Impact metrics
    portfolio_impact: float  # Percentage impact
    absolute_loss: float
    recovery_time_days: Optional[int]
    max_loss: float
    probability_of_ruin: float

    # Asset-level impacts
    asset_impacts: Dict[str, Dict[str, float]]

    # Recommendations
    hedging_recommendations: List[str]
    risk_reduction_strategies: List[str]


class MonteCarloResult(BaseModel):
    """Monte Carlo simulation result."""
    simulation_id: str
    num_simulations: int
    time_horizon: TimeHorizon

    # Paths
    equity_curves: List[List[float]]  # Sample paths
    final_values: List[float]

    # Statistics
    mean_final_value: float
    median_final_value: float
    std_final_value: float
    var_95: float
    cvar_95: float

    # Probabilities
    prob_profit: float
    prob_loss_10pct: float
    prob_loss_25pct: float
    prob_ruin: float


class CorrelationStress(BaseModel):
    """Correlation stress test result."""
    baseline_correlation: Dict[str, Dict[str, float]]
    stressed_correlation: Dict[str, Dict[str, float]]
    diversification_benefit_lost: float
    portfolio_beta_change: float


class RiskFactor(BaseModel):
    """Risk factor for analysis."""
    name: str
    asset_class: AssetClass
    current_value: float
    volatility: float
    beta: float = 1.0
    correlation_to_portfolio: float = 0.0


class ScenarioComparison(BaseModel):
    """Comparison of multiple scenarios."""
    comparison_id: str
    scenarios: List[Dict[str, Any]]
    ranked_by: str
    best_scenario: str
    worst_scenario: str
    recommendations: List[str]


# In-memory storage
scenarios: Dict[str, ScenarioResult] = {}
shock_analyses: Dict[str, ShockImpact] = {}
monte_carlo_results: Dict[str, MonteCarloResult] = {}
portfolios: Dict[str, Portfolio] = {}


def calculate_var(returns: np.ndarray, confidence: float = 0.95) -> float:
    """Calculate Value at Risk."""
    return np.percentile(returns, (1 - confidence) * 100)


def calculate_cvar(returns: np.ndarray, confidence: float = 0.95) -> float:
    """Calculate Conditional VaR (Expected Shortfall)."""
    var = calculate_var(returns, confidence)
    return np.mean(returns[returns <= var])


def generate_correlated_returns(n_simulations: int, n_assets: int,
                                volatility: float = 0.02) -> np.ndarray:
    """Generate correlated returns for Monte Carlo simulation."""
    # Generate base correlated returns using Cholesky decomposition
    cov_matrix = np.eye(n_assets) * volatility ** 2
    L = np.linalg.cholesky(cov_matrix)

    uncorrelated = np.random.standard_normal((n_simulations, n_assets))
    correlated = uncorrelated @ L.T

    return correlated


def get_shock_parameters(shock_type: MarketShock, severity: SeverityLevel) -> Dict[str, float]:
    """Get shock parameters based on type and severity."""
    base_params = {
        MarketShock.MARKET_CRASH: {"mean_return": -0.20, "volatility": 0.05, "duration": 30},
        MarketShock.INTEREST_RATE_SPIKE: {"mean_return": -0.10, "volatility": 0.02, "duration": 60},
        MarketShock.LIQUIDITY_CRISIS: {"mean_return": -0.15, "volatility": 0.08, "duration": 20},
        MarketShock.CURRENCY_DEVALUATION: {"mean_return": -0.25, "volatility": 0.10, "duration": 90},
        MarketShock.SECTOR_ROTATION: {"mean_return": -0.05, "volatility": 0.03, "duration": 45},
        MarketShock.BLACK_SWAN: {"mean_return": -0.35, "volatility": 0.15, "duration": 60},
        MarketShock.FLASH_CRASH: {"mean_return": -0.10, "volatility": 0.20, "duration": 1},
        MarketShock.BOND_MARKET_SELL_OFF: {"mean_return": -0.08, "volatility": 0.03, "duration": 30},
    }

    severity_multipliers = {
        SeverityLevel.MILD: 0.25,
        SeverityLevel.MODERATE: 0.5,
        SeverityLevel.SEVERE: 1.0,
        SeverityLevel.EXTREME: 2.0,
        SeverityLevel.CATASTROPHIC: 4.0,
    }

    params = base_params.get(shock_type, {"mean_return": -0.10, "volatility": 0.05, "duration": 30})
    mult = severity_multipliers.get(severity, 1.0)

    return {
        "mean_return": params["mean_return"] * mult,
        "volatility": params["volatility"] * mult,
        "duration": int(params["duration"] / max(mult, 0.5)),
    }


# Routes
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-scenario-engine",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "scenarios_analyzed": len(scenarios),
        "shock_analyses": len(shock_analyses)
    }


@app.post("/scenarios", response_model=ScenarioResult, status_code=201)
async def create_scenario(config: ScenarioConfig, background_tasks: BackgroundTasks):
    """Create and run a scenario analysis."""
    scenario_id = str(uuid.uuid4())

    async def run_scenario():
        await background_tasks.add_task(lambda: None)  # Ensure async context

        # Simulate scenario analysis
        import asyncio
        await asyncio.sleep(1)

        n_sims = config.num_simulations
        returns = generate_correlated_returns(n_sims, 10, volatility=0.02 * config.volatility_scaling)
        portfolio_returns = returns.mean(axis=1)

        initial_value = 100000
        final_values = initial_value * (1 + portfolio_returns)

        result = ScenarioResult(
            scenario_id=scenario_id,
            name=config.name,
            scenario_type=config.scenario_type,
            created_at=datetime.now(),
            completed_at=datetime.now(),
            expected_return=float(np.mean(portfolio_returns) * 252 * 100),
            expected_volatility=float(np.std(portfolio_returns) * np.sqrt(252) * 100),
            value_at_risk=float(calculate_var(portfolio_returns) * initial_value),
            conditional_var=float(calculate_cvar(portfolio_returns) * initial_value),
            max_drawdown=float(np.min(portfolio_returns) * 100),
            sharpe_ratio=random.uniform(0.5, 2.0),
            percentile_5=float(np.percentile(final_values, 5)),
            percentile_25=float(np.percentile(final_values, 25)),
            percentile_50=float(np.percentile(final_values, 50)),
            percentile_75=float(np.percentile(final_values, 75)),
            percentile_95=float(np.percentile(final_values, 95)),
            initial_value=initial_value,
            final_value_mean=float(np.mean(final_values)),
            final_value_std=float(np.std(final_values)),
            probability_of_loss=float(np.mean(portfolio_returns < 0)),
            expected_shortfall=float(np.mean(portfolio_returns[portfolio_returns < np.percentile(portfolio_returns, 5)]) * initial_value)
        )

        scenarios[scenario_id] = result

    asyncio.create_task(run_scenario())

    return ScenarioResult(
        scenario_id=scenario_id,
        name=config.name,
        scenario_type=config.scenario_type,
        created_at=datetime.now(),
        expected_return=0,
        expected_volatility=0,
        value_at_risk=0,
        conditional_var=0,
        max_drawdown=0,
        percentile_5=0,
        percentile_25=0,
        percentile_50=0,
        percentile_75=0,
        percentile_95=0,
        initial_value=100000,
        final_value_mean=100000,
        final_value_std=0,
        probability_of_loss=0,
        expected_shortfall=0
    )


@app.get("/scenarios/{scenario_id}", response_model=ScenarioResult)
async def get_scenario(scenario_id: str):
    """Get scenario result."""
    if scenario_id not in scenarios:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenarios[scenario_id]


@app.get("/scenarios", response_model=List[ScenarioResult])
async def list_scenarios(
    scenario_type: Optional[ScenarioType] = None,
    limit: int = Query(default=20, ge=1, le=100)
):
    """List all scenarios."""
    results = list(scenarios.values())
    if scenario_type:
        results = [s for s in results if s.scenario_type == scenario_type]
    results.sort(key=lambda x: x.created_at, reverse=True)
    return results[:limit]


@app.post("/shocks/analyze", response_model=ShockImpact, status_code=201)
async def analyze_market_shock(config: MarketShockConfig, portfolio_value: float = 100000):
    """Analyze portfolio impact of a market shock."""
    shock_id = str(uuid.uuid4())
    params = get_shock_parameters(config.shock_type, config.severity)

    # Calculate impact
    shock_return = params["mean_return"]
    shock_vol = params["volatility"]
    impact = shock_return * portfolio_value
    max_loss = (shock_return - 2 * shock_vol) * portfolio_value

    # Generate asset-level impacts
    asset_impacts = {}
    for asset_class in config.affected_assets:
        class_return = shock_return * random.uniform(0.8, 1.2)
        asset_impacts[asset_class.value] = {
            "expected_return": class_return,
            "volatility": shock_vol,
            "loss": class_return * portfolio_value * 0.2
        }

    # Generate recommendations
    recommendations = []
    if abs(shock_return) > 0.15:
        recommendations.append("Consider reducing exposure to affected assets immediately")
        recommendations.append("Implement stop-loss orders to limit downside")
    if shock_vol > 0.10:
        recommendations.append("Increase cash position for potential opportunities")
        recommendations.append("Consider volatility-targeting strategies")
    recommendations.append("Review correlation assumptions in stressed market conditions")

    result = ShockImpact(
        shock_id=shock_id,
        shock_type=config.shock_type,
        severity=config.severity,
        portfolio_impact=shock_return * 100,
        absolute_loss=abs(impact),
        recovery_time_days=params["duration"],
        max_loss=abs(max_loss),
        probability_of_ruin=random.uniform(0.01, 0.10),
        asset_impacts=asset_impacts,
        hedging_recommendations=recommendations[:2],
        risk_reduction_strategies=recommendations[2:]
    )

    shock_analyses[shock_id] = result
    return result


@app.post("/monte-carlo", response_model=MonteCarloResult, status_code=201)
async def run_monte_carlo(
    portfolio_value: float = 100000,
    expected_return: float = 0.08,
    volatility: float = 0.20,
    time_horizon: TimeHorizon = TimeHorizon.ONE_YEAR,
    num_simulations: int = 10000
):
    """Run Monte Carlo simulation."""
    sim_id = str(uuid.uuid4())

    # Convert time horizon to trading days
    horizon_days = {
        TimeHorizon.INTRADAY: 1,
        TimeHorizon.ONE_WEEK: 5,
        TimeHorizon.ONE_MONTH: 21,
        TimeHorizon.THREE_MONTHS: 63,
        TimeHorizon.SIX_MONTHS: 126,
        TimeHorizon.ONE_YEAR: 252,
        TimeHorizon.FIVE_YEARS: 1260,
    }
    days = horizon_days.get(time_horizon, 252)

    # Generate random walks
    dt = 1 / 252
    drift = (expected_return - 0.5 * volatility ** 2) * dt
    diffusion = volatility * np.sqrt(dt)

    final_values = []
    sample_curves = []

    for i in range(num_simulations):
        returns = np.random.normal(drift, diffusion, days)
        path = portfolio_value * np.cumprod(1 + returns)
        final_values.append(path[-1])

        # Keep sample of curves for visualization
        if i < 100:
            sample_curves.append(path.tolist())

    final_values = np.array(final_values)

    result = MonteCarloResult(
        simulation_id=sim_id,
        num_simulations=num_simulations,
        time_horizon=time_horizon,
        equity_curves=sample_curves,
        final_values=final_values.tolist(),
        mean_final_value=float(np.mean(final_values)),
        median_final_value=float(np.median(final_values)),
        std_final_value=float(np.std(final_values)),
        var_95=float(np.percentile(final_values, 5)),
        cvar_95=float(np.mean(final_values[final_values <= np.percentile(final_values, 5)])),
        prob_profit=float(np.mean(final_values > portfolio_value)),
        prob_loss_10pct=float(np.mean(final_values < portfolio_value * 0.9)),
        prob_loss_25pct=float(np.mean(final_values < portfolio_value * 0.75)),
        prob_ruin=float(np.mean(final_values < portfolio_value * 0.5))
    )

    monte_carlo_results[sim_id] = result
    return result


@app.get("/monte-carlo/{sim_id}", response_model=MonteCarloResult)
async def get_monte_carlo(sim_id: str):
    """Get Monte Carlo simulation result."""
    if sim_id not in monte_carlo_results:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return monte_carlo_results[sim_id]


@app.post("/what-if", response_model=ScenarioResult, status_code=201)
async def run_what_if(scenario: WhatIfScenario):
    """Run what-if scenario analysis."""
    scenario_id = str(uuid.uuid4())

    # Calculate expected portfolio return
    expected_returns = list(scenario.expected_returns.values())
    portfolio_return = np.mean(expected_returns) if expected_returns else 0.0

    # Calculate portfolio volatility
    vols = list(scenario.expected_volatility.values())
    portfolio_vol = np.mean(vols) if vols else 0.1

    result = ScenarioResult(
        scenario_id=scenario_id,
        name=scenario.name,
        scenario_type=ScenarioType.WHAT_IF,
        created_at=datetime.now(),
        completed_at=datetime.now(),
        expected_return=portfolio_return * 100,
        expected_volatility=portfolio_vol * 100,
        value_at_risk=portfolio_vol * 1.65 * 100000,  # 95% VaR approximation
        conditional_var=portfolio_vol * 2.33 * 100000,  # 99% CVaR approximation
        max_drawdown=portfolio_vol * 3 * 100,
        sharpe_ratio=portfolio_return / portfolio_vol if portfolio_vol > 0 else 0,
        percentile_5=100000 * (1 + portfolio_return - 1.65 * portfolio_vol),
        percentile_25=100000 * (1 + portfolio_return - 0.67 * portfolio_vol),
        percentile_50=100000 * (1 + portfolio_return),
        percentile_75=100000 * (1 + portfolio_return + 0.67 * portfolio_vol),
        percentile_95=100000 * (1 + portfolio_return + 1.65 * portfolio_vol),
        initial_value=100000,
        final_value_mean=100000 * (1 + portfolio_return),
        final_value_std=100000 * portfolio_vol,
        probability_of_loss=0.5 if portfolio_return < 0 else 0.3,
        expected_shortfall=100000 * portfolio_return * 0.5
    )

    scenarios[scenario_id] = result
    return result


@app.post("/compare", response_model=ScenarioComparison)
async def compare_scenarios(scenario_ids: List[str], ranked_by: str = "expected_return"):
    """Compare multiple scenarios."""
    comparison_id = str(uuid.uuid4())

    results = []
    for sid in scenario_ids:
        if sid in scenarios:
            results.append(scenarios[sid].model_dump())

    if not results:
        raise HTTPException(status_code=400, detail="No valid scenarios found")

    # Sort by ranking criteria
    results.sort(key=lambda x: x.get(ranked_by, 0), reverse=(ranked_by != "value_at_risk"))

    return ScenarioComparison(
        comparison_id=comparison_id,
        scenarios=results,
        ranked_by=ranked_by,
        best_scenario=results[0]["scenario_id"] if results else "",
        worst_scenario=results[-1]["scenario_id"] if results else "",
        recommendations=[
            "Diversify across uncorrelated asset classes",
            "Consider hedging significant tail risks",
            "Review leverage during high volatility periods"
        ]
    )


@app.get("/shocks/templates")
async def list_shock_templates():
    """List available market shock templates."""
    return {
        "shocks": [
            {"type": s.value, "name": s.value.replace("_", " ").title()}
            for s in MarketShock
        ],
        "severities": [
            {"level": s.value, "multiplier": {"mild": 0.25, "moderate": 0.5, "severe": 1.0, "extreme": 2.0, "catastrophic": 4.0}[s.value]}
            for s in SeverityLevel
        ]
    }


@app.get("/historical/2008_crisis")
async def get_2008_crisis_scenario():
    """Get 2008 financial crisis scenario data."""
    return {
        "name": "2008 Financial Crisis",
        "date": "2008-09-15",
        "market_drop": -56.8,
        "duration_days": 517,
        "recovery_days": 1506,
        "peak_to_trough": "2007-10-09 to 2009-03-09",
        "affected_assets": ["equity", "fixed_income", "real_estate"],
        "key_events": [
            "Lehman Brothers bankruptcy",
            "Bear Stearns collapse",
            "AIG bailout",
            "TARP passage"
        ]
    }


@app.get("/historical/2020_covid")
async def get_2020_covid_scenario():
    """Get 2020 COVID crash scenario data."""
    return {
        "name": "2020 COVID Crash",
        "date": "2020-02-19",
        "market_drop": -33.9,
        "duration_days": 33,
        "recovery_days": 161,
        "peak_to_trough": "2020-02-19 to 2020-03-23",
        "affected_assets": ["equity", "commodity", "forex"],
        "key_events": [
            "WHO declares pandemic",
            "Global lockdowns",
            "Fed emergency rate cuts",
            "CARES Act stimulus"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5105)
