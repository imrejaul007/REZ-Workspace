"""
AssetMind - Simulation Service
Port: 5140

Portfolio simulation and stress testing engine.
Tests portfolio strategies under various market conditions.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import numpy as np
import random


app = FastAPI(title="AssetMind Simulation Service", version="1.0.0")


class ScenarioType(str, Enum):
    HISTORICAL = "historical"
    MONTE_CARLO = "monte_carlo"
    STRESS_TEST = "stress_test"
    WHAT_IF = "what_if"


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


class SimulationResult(BaseModel):
    final_values: List[float]
    max_drawdowns: List[float]
    sharpe_ratios: List[float]
    win_rates: List[float]
    avg_return: float
    median_return: float
    percentile_5: float
    percentile_95: float
    max_drawdown: float
    sharpe_ratio: float


class StressTestScenario(BaseModel):
    name: str
    market_shock: float  # Percentage drop
    recovery_days: int
    correlated_assets: List[str] = []


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-simulation",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5140
    }


@app.post("/simulate")
async def run_simulation(request: SimulationRequest):
    """Run Monte Carlo simulation on portfolio"""
    num_sims = request.num_simulations
    days = request.time_horizon_days

    # Calculate portfolio value
    initial_value = sum(p.shares * p.current_price for p in request.positions)

    # Generate simulated paths
    final_values = []
    max_drawdowns = []

    for _ in range(num_sims):
        value = initial_value
        peak = value
        max_dd = 0

        for _ in range(days):
            # Random daily return (normal distribution)
            daily_return = np.random.normal(0.0003, 0.015)  # ~8% annual, 24% daily vol
            value *= (1 + daily_return)
            peak = max(peak, value)
            drawdown = (peak - value) / peak
            max_dd = max(max_dd, drawdown)

        final_values.append(value)
        max_drawdowns.append(max_dd)

    # Calculate metrics
    returns = [(v - initial_value) / initial_value for v in final_values]

    return {
        "scenario_type": request.scenario_type.value,
        "initial_value": initial_value,
        "num_simulations": num_sims,
        "time_horizon_days": days,
        "final_value": {
            "mean": float(np.mean(final_values)),
            "median": float(np.median(final_values)),
            "percentile_5": float(np.percentile(final_values, 5)),
            "percentile_95": float(np.percentile(final_values, 95)),
        },
        "returns": {
            "mean": float(np.mean(returns)),
            "median": float(np.median(returns)),
            "percentile_5": float(np.percentile(returns, 5)),
            "percentile_95": float(np.percentile(returns, 95)),
        },
        "risk_metrics": {
            "max_drawdown": {
                "mean": float(np.mean(max_drawdowns)),
                "worst": float(np.max(max_drawdowns)),
            }
        },
        "probability_of_loss": sum(1 for r in returns if r < 0) / len(returns)
    }


@app.post("/stress-test")
async def run_stress_test(request: SimulationRequest):
    """Run stress test scenarios"""
    scenarios = [
        {"name": "2008 Financial Crisis", "shock": -0.50, "recovery": 365},
        {"name": "COVID Crash", "shock": -0.34, "recovery": 90},
        {"name": "Dot-com Bubble", "shock": -0.45, "recovery": 730},
        {"name": "Black Monday", "shock": -0.22, "recovery": 60},
    ]

    initial_value = sum(p.shares * p.current_price for p in request.positions)
    results = []

    for scenario in scenarios:
        # Apply shock
        shocked_value = initial_value * (1 + scenario["shock"])
        recovery_days = scenario["recovery"]

        # Simulate recovery
        recovery_value = shocked_value
        for _ in range(recovery_days):
            daily_return = np.random.normal(0.0005, 0.010)
            recovery_value *= (1 + daily_return)

        results.append({
            "scenario": scenario["name"],
            "initial_value": initial_value,
            "shocked_value": shocked_value,
            "final_value": recovery_value,
            "max_loss": (shocked_value - initial_value) / initial_value,
            "recovery_value": (recovery_value - shocked_value) / shocked_value,
            "recovery_days": recovery_days
        })

    return {
        "initial_portfolio_value": initial_value,
        "scenarios": results
    }


@app.get("/scenarios")
async def list_scenarios():
    """List available stress test scenarios"""
    return {
        "scenarios": [
            {"name": "2008 Financial Crisis", "description": "50% market crash", "severity": "extreme"},
            {"name": "COVID Crash", "description": "34% crash with fast recovery", "severity": "high"},
            {"name": "Dot-com Bubble", "description": "45% tech crash", "severity": "extreme"},
            {"name": "Black Monday", "description": "22% single day crash", "severity": "high"},
            {"name": "Interest Rate Shock", "description": "500bp rate increase", "severity": "medium"},
            {"name": "Recession", "description": "12-month economic downturn", "severity": "medium"},
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5140)