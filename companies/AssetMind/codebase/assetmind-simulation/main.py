"""
AssetMind Simulation Service - Port 5200
Monte Carlo simulations, stress testing, backtesting, what-if analysis.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import numpy as np
import random

app = FastAPI(title="AssetMind Simulation Service", version="1.0.0")
DEFAULT_PORT = 5200


class ScenarioType(str, Enum):
    MONTE_CARLO = "monte_carlo"
    STRESS_TEST = "stress_test"
    WHAT_IF = "what_if"
    BACKTEST = "backtest"


class SimulationEngine(str, Enum):
    GEOMETRIC_BROWNIAN = "geometric_brownian"
    MEAN_REVERTING = "mean_reverting"
    JUMP_DIFFUSION = "jump_diffusion"


class PortfolioPosition(BaseModel):
    symbol: str
    shares: float
    entry_price: float
    current_price: float


class SimulationRequest(BaseModel):
    scenario_type: ScenarioType
    positions: List[PortfolioPosition]
    initial_capital: float
    time_horizon_days: int = Field(default=252, ge=1, le=2520)
    num_simulations: int = Field(default=1000, ge=100, le=10000)
    engine: SimulationEngine = SimulationEngine.GEOMETRIC_BROWNIAN


class StressTestScenario(BaseModel):
    name: str
    market_shock: float
    recovery_days: int
    severity: str


# ============================================================================
# Helper Functions
# ============================================================================

def simulate_gbm(initial: float, days: int, mu: float = 0.0003, sigma: float = 0.015) -> List[float]:
    dt = 1 / 252
    drift = (mu - 0.5 * sigma ** 2) * dt
    diffusion = sigma * np.sqrt(dt) * np.random.normal(0, 1, days)
    prices = initial * np.exp(np.cumsum(drift + diffusion))
    return [initial] + list(prices)


def simulate_mean_reverting(initial: float, days: int, mean: float, theta: float = 0.1, sigma: float = 0.01) -> List[float]:
    prices = [initial]
    for _ in range(days):
        drift = theta * (mean - prices[-1])
        prices.append(prices[-1] + drift + sigma * np.random.normal())
    return prices


def simulate_jump_diffusion(initial: float, days: int, mu: float = 0.0003, sigma: float = 0.015,
                            lam: float = 0.1, jump_mean: float = -0.05) -> List[float]:
    prices = [initial]
    for _ in range(days):
        diffusion = sigma * np.random.normal()
        jump = np.random.normal(jump_mean, 0.1) if np.random.random() < lam else 0
        prices.append(prices[-1] * np.exp(mu + diffusion + jump))
    return prices


def calculate_metrics(values: List[float], initial: float) -> Dict[str, float]:
    returns = [(v - initial) / initial for v in values]
    sorted_vals = sorted(values)
    return {
        "mean": float(np.mean(values)),
        "median": float(np.median(values)),
        "std": float(np.std(values)),
        "percentile_5": float(np.percentile(sorted_vals, 5)),
        "percentile_95": float(np.percentile(sorted_vals, 95)),
        "mean_return": float(np.mean(returns)),
        "prob_loss": sum(1 for r in returns if r < 0) / len(returns)
    }


# ============================================================================
# Health & Status
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-simulation",
        "status": "healthy",
        "version": "1.0.0",
        "port": DEFAULT_PORT,
        "capabilities": {
            "monte_carlo": "active",
            "stress_testing": "active",
            "backtesting": "active",
            "what_if_analysis": "active"
        }
    }


@app.get("/status")
async def get_status():
    return {
        "service": "assetmind-simulation",
        "version": "1.0.0",
        "engines": [e.value for e in SimulationEngine],
        "scenario_types": [s.value for s in ScenarioType]
    }


# ============================================================================
# Monte Carlo Simulation
# ============================================================================

@app.post("/simulate")
async def run_simulation(request: SimulationRequest):
    num_sims = request.num_simulations
    days = request.time_horizon_days
    initial = sum(p.shares * p.current_price for p in request.positions)

    final_values = []
    max_drawdowns = []

    for _ in range(num_sims):
        if request.engine == SimulationEngine.GEOMETRIC_BROWNIAN:
            path = simulate_gbm(initial, days)
        elif request.engine == SimulationEngine.MEAN_REVERTING:
            path = simulate_mean_reverting(initial, days, initial)
        elif request.engine == SimulationEngine.JUMP_DIFFUSION:
            path = simulate_jump_diffusion(initial, days)
        else:
            path = simulate_gbm(initial, days)

        final_values.append(path[-1])
        peak = path[0]
        max_dd = 0
        for val in path:
            peak = max(peak, val)
            dd = (peak - val) / peak if peak > 0 else 0
            max_dd = max(max_dd, dd)
        max_drawdowns.append(max_dd)

    returns = [(v - initial) / initial for v in final_values]

    return {
        "simulation_id": f"sim-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "scenario_type": request.scenario_type.value,
        "initial_value": initial,
        "num_simulations": num_sims,
        "time_horizon_days": days,
        "final_value_stats": calculate_metrics(final_values, initial),
        "risk_metrics": {
            "max_drawdown_mean": round(float(np.mean(max_drawdowns)) * 100, 2),
            "max_drawdown_worst": round(float(np.max(max_drawdowns)) * 100, 2)
        },
        "probability_of_loss": round(sum(1 for r in returns if r < 0) / len(returns), 3)
    }


# ============================================================================
# Stress Test Endpoints
# ============================================================================

@app.get("/scenarios")
async def list_scenarios():
    return {
        "scenarios": [
            {"name": "2008 Financial Crisis", "shock": -0.50, "recovery": 365, "severity": "extreme"},
            {"name": "COVID Crash", "shock": -0.34, "recovery": 90, "severity": "high"},
            {"name": "Dot-com Bubble", "shock": -0.45, "recovery": 730, "severity": "extreme"},
            {"name": "Black Monday", "shock": -0.22, "recovery": 60, "severity": "high"},
            {"name": "Interest Rate Shock", "shock": -0.15, "recovery": 180, "severity": "medium"},
            {"name": "Recession", "shock": -0.30, "recovery": 365, "severity": "high"}
        ]
    }


@app.post("/stress-test")
async def run_stress_test(request: SimulationRequest):
    scenarios = [
        {"name": "2008 Financial Crisis", "shock": -0.50, "recovery": 365},
        {"name": "COVID Crash", "shock": -0.34, "recovery": 90},
        {"name": "Dot-com Bubble", "shock": -0.45, "recovery": 730},
        {"name": "Black Monday", "shock": -0.22, "recovery": 60}
    ]

    initial = sum(p.shares * p.current_price for p in request.positions)
    results = []

    for s in scenarios:
        shocked = initial * (1 + s["shock"])
        recovery = shocked
        for _ in range(s["recovery"]):
            recovery *= (1 + np.random.normal(0.0005, 0.010))

        results.append({
            "scenario": s["name"],
            "initial_value": initial,
            "shocked_value": shocked,
            "final_value": recovery,
            "max_loss": round((shocked - initial) / initial * 100, 2),
            "recovery_return": round((recovery - shocked) / shocked * 100, 2)
        })

    return {"initial_portfolio_value": initial, "scenarios": results}


# ============================================================================
# Backtest Endpoints
# ============================================================================

@app.post("/backtest")
async def run_backtest(positions: List[PortfolioPosition], initial_capital: float,
                      strategy: str = "buy_and_hold"):
    n_days = 252
    returns = [random.gauss(0.0005, 0.015) for _ in range(n_days)]
    bench = [random.gauss(0.0004, 0.012) for _ in range(n_days)]

    portfolio_values = [initial_capital]
    for r in returns:
        portfolio_values.append(portfolio_values[-1] * (1 + r))

    benchmark_values = [initial_capital]
    for r in bench:
        benchmark_values.append(benchmark_values[-1] * (1 + r))

    final = portfolio_values[-1]
    bench_final = benchmark_values[-1]

    total_ret = (final - initial_capital) / initial_capital
    ann_ret = (final / initial_capital) ** (252 / n_days) - 1

    peak = portfolio_values[0]
    max_dd = 0
    for val in portfolio_values:
        peak = max(peak, val)
        max_dd = max(max_dd, (peak - val) / peak)

    mean_ret = sum(returns) / len(returns)
    std_ret = (sum((r - mean_ret) ** 2 for r in returns) / (len(returns) - 1)) ** 0.5
    sharpe = (mean_ret * 252 - 0.04) / (std_ret * (252 ** 0.5)) if std_ret > 0 else 0

    return {
        "backtest_id": f"bt-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "strategy": strategy,
        "initial_capital": initial_capital,
        "final_value": final,
        "total_return": round(total_ret * 100, 2),
        "annualized_return": round(ann_ret * 100, 2),
        "max_drawdown": round(max_dd * 100, 2),
        "sharpe_ratio": round(sharpe, 2),
        "win_rate": round(sum(1 for r in returns if r > 0) / len(returns) * 100, 2),
        "benchmark_return": round((bench_final - initial_capital) / initial_capital * 100, 2)
    }


# ============================================================================
# What-If Analysis
# ============================================================================

@app.post("/what-if")
async def what_if_analysis(positions: List[PortfolioPosition], scenario_name: str,
                          price_change: float = 0, volatility_change: float = 0):
    original = sum(p.shares * p.current_price for p in positions)
    simulated = original * (1 + price_change)

    impact = {}
    for p in positions:
        pos_val = p.shares * p.current_price
        impact[p.symbol] = {
            "original": round(pos_val, 2),
            "simulated": round(pos_val * (1 + price_change), 2),
            "change": round(pos_val * price_change, 2)
        }

    return {
        "scenario": scenario_name,
        "original_value": original,
        "simulated_value": simulated,
        "value_change": round(simulated - original, 2),
        "change_pct": round(price_change * 100, 2),
        "impact_by_position": impact
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=DEFAULT_PORT)
