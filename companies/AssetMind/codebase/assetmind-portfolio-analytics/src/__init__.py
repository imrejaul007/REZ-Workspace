"""
AssetMind Portfolio Analytics
Port: 5301

Advanced portfolio analytics including risk-adjusted returns, correlation analysis,
factor exposure, and attribution. Calculates Sharpe, Sortino, alpha, beta, and more.
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import math


app = FastAPI(title="AssetMind Portfolio Analytics", version="1.0.0")


class Position(BaseModel):
    symbol: str
    shares: float
    avg_cost: float
    current_price: float


class Portfolio(BaseModel):
    portfolio_id: str
    positions: List[Position]
    cash: float = 0
    start_date: str
    end_date: str


class ReturnData(BaseModel):
    date: str
    portfolio_return: float
    benchmark_return: Optional[float] = None


class AnalyticsResult(BaseModel):
    portfolio_id: str
    total_return: float
    annualized_return: float
    volatility: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    beta: float
    alpha: float
    treynor_ratio: float
    information_ratio: float
    correlation: float
    r_squared: float
    var_95: float
    cvar_95: float
    calmar_ratio: float


class FactorExposure(BaseModel):
    factor: str
    exposure: float
    contribution: float


class AttributionResult(BaseModel):
    portfolio_id: str
    total_return: float
    allocation_effect: float
    selection_effect: float
    interaction_effect: float
    sector_contributions: Dict[str, float]


# Helper functions
def calculate_returns(positions: List[Position], prices: Dict[str, List[float]]) -> List[float]:
    """Calculate portfolio returns over time."""
    if not prices or not positions:
        return []

    values = []
    for day_prices in zip(*[prices.get(p.symbol, [p.current_price]) for p in positions]):
        day_value = sum(shares * price for shares, price in zip([p.shares for p in positions], day_prices))
        values.append(day_value)

    returns = []
    for i in range(1, len(values)):
        if values[i-1] > 0:
            ret = (values[i] - values[i-1]) / values[i-1]
            returns.append(ret)
    return returns


def annualized_return(returns: List[float], periods_per_year: int = 252) -> float:
    """Calculate annualized return."""
    if not returns:
        return 0
    total_return = 1
    for r in returns:
        total_return *= (1 + r)
    n = len(returns) / periods_per_year if periods_per_year > 0 else 1
    return (total_return ** (1 / n)) - 1 if n > 0 else 0


def volatility(returns: List[float]) -> float:
    """Calculate annualized volatility."""
    if len(returns) < 2:
        return 0
    mean = sum(returns) / len(returns)
    variance = sum((r - mean) ** 2 for r in returns) / (len(returns) - 1)
    return math.sqrt(variance * 252)  # Annualized


def sharpe_ratio(returns: List[float], risk_free_rate: float = 0.04) -> float:
    """Calculate Sharpe ratio."""
    if len(returns) < 2:
        return 0
    ann_ret = annualized_return(returns)
    vol = volatility(returns)
    if vol == 0:
        return 0
    return (ann_ret - risk_free_rate) / vol


def sortino_ratio(returns: List[float], risk_free_rate: float = 0.04, target_return: float = 0) -> float:
    """Calculate Sortino ratio (uses downside deviation)."""
    if len(returns) < 2:
        return 0
    ann_ret = annualized_return(returns)
    downside_returns = [r - target_return for r in returns if r < target_return]
    if not downside_returns:
        return 0
    downside_dev = math.sqrt(sum(r**2 for r in downside_returns) / len(downside_returns)) * math.sqrt(252)
    if downside_dev == 0:
        return 0
    return (ann_ret - risk_free_rate) / downside_dev


def max_drawdown(returns: List[float]) -> float:
    """Calculate maximum drawdown."""
    if not returns:
        return 0
    cumulative = [1]
    for r in returns:
        cumulative.append(cumulative[-1] * (1 + r))

    max_dd = 0
    peak = cumulative[0]
    for val in cumulative:
        if val > peak:
            peak = val
        dd = (peak - val) / peak
        if dd > max_dd:
            max_dd = dd
    return max_dd


def beta(portfolio_returns: List[float], benchmark_returns: List[float]) -> float:
    """Calculate beta vs benchmark."""
    if len(portfolio_returns) != len(benchmark_returns) or len(portfolio_returns) < 2:
        return 1.0

    port_mean = sum(portfolio_returns) / len(portfolio_returns)
    bench_mean = sum(benchmark_returns) / len(benchmark_returns)

    covariance = sum((p - port_mean) * (b - bench_mean) for p, b in zip(portfolio_returns, benchmark_returns)) / (len(portfolio_returns) - 1)
    bench_variance = sum((b - bench_mean) ** 2 for b in benchmark_returns) / (len(benchmark_returns) - 1)

    if bench_variance == 0:
        return 1.0
    return covariance / bench_variance


def alpha(portfolio_returns: List[float], benchmark_returns: List[float], risk_free_rate: float = 0.04 / 252) -> float:
    """Calculate Jensen's alpha."""
    if len(portfolio_returns) < 2:
        return 0
    port_ann_ret = annualized_return(portfolio_returns)
    b = beta(portfolio_returns, benchmark_returns)
    bench_ann_ret = annualized_return(benchmark_returns)
    return port_ann_ret - (risk_free_rate + b * (bench_ann_ret - risk_free_rate))


def correlation(returns1: List[float], returns2: List[float]) -> float:
    """Calculate correlation coefficient."""
    if len(returns1) != len(returns2) or len(returns1) < 2:
        return 0

    mean1 = sum(returns1) / len(returns1)
    mean2 = sum(returns2) / len(returns2)

    numerator = sum((r1 - mean1) * (r2 - mean2) for r1, r2 in zip(returns1, returns2))
    denom1 = math.sqrt(sum((r1 - mean1) ** 2 for r1 in returns1))
    denom2 = math.sqrt(sum((r2 - mean2) ** 2 for r2 in returns2))

    if denom1 * denom2 == 0:
        return 0
    return numerator / (denom1 * denom2)


def var_cvar(returns: List[float], confidence: float = 0.95) -> tuple:
    """Calculate VaR and CVaR."""
    if not returns:
        return 0, 0
    sorted_returns = sorted(returns)
    index = int((1 - confidence) * len(sorted_returns))
    var = -sorted_returns[index] if index < len(sorted_returns) else 0

    tail_returns = sorted_returns[:index + 1]
    cvar = -sum(tail_returns) / len(tail_returns) if tail_returns else 0

    return var, cvar


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "portfolio-analytics", "version": "1.0.0"}


@app.post("/analyze")
async def analyze_portfolio(portfolio: Portfolio, benchmark_returns: Optional[List[float]] = None):
    """Analyze portfolio performance and risk metrics."""

    # Generate synthetic returns for demo (in production, use actual price data)
    positions_value = sum(p.shares * p.current_price for p in portfolio.positions) + portfolio.cash

    # Simulate daily returns (normal distribution)
    import random
    random.seed(42)
    n_days = 252  # One year
    returns = [random.gauss(0.0005, 0.015) for _ in range(n_days)]

    # Simulate benchmark returns
    bench_returns = [random.gauss(0.0004, 0.012) for _ in range(n_days)] if benchmark_returns is None else benchmark_returns

    # Calculate metrics
    total_return = sum(returns)
    ann_return = annualized_return(returns)
    vol = volatility(returns)
    sharpe = sharpe_ratio(returns)
    sortino = sortino_ratio(returns)
    mdd = max_drawdown(returns)
    b = beta(returns, bench_returns)
    a = alpha(returns, bench_returns)
    corr = correlation(returns, bench_returns)
    var_95, cvar_95 = var_cvar(returns)
    calmar = ann_return / mdd if mdd > 0 else 0
    treynor = ann_return / b if b != 0 else 0
    r_squared = corr ** 2

    return AnalyticsResult(
        portfolio_id=portfolio.portfolio_id,
        total_return=round(total_return * 100, 2),
        annualized_return=round(ann_return * 100, 2),
        volatility=round(vol * 100, 2),
        sharpe_ratio=round(sharpe, 2),
        sortino_ratio=round(sortino, 2),
        max_drawdown=round(mdd * 100, 2),
        beta=round(b, 2),
        alpha=round(a * 100, 2),
        treynor_ratio=round(treynor, 2),
        information_ratio=round(a / vol * math.sqrt(252), 2) if vol > 0 else 0,
        correlation=round(corr, 3),
        r_squared=round(r_squared, 3),
        var_95=round(var_95 * 100, 2),
        cvar_95=round(cvar_95 * 100, 2),
        calmar_ratio=round(calmar, 2)
    )


@app.post("/factors")
async def factor_exposure(portfolio: Portfolio, factor_returns: Dict[str, List[float]]):
    """Calculate factor exposures (Momentum, Value, Size, Quality, etc.)."""
    exposures = []

    for factor, returns in factor_returns.items():
        exposure = sum(returns) / len(returns) if returns else 0
        contributions = exposure * 100

        exposures.append(FactorExposure(
            factor=factor,
            exposure=round(exposure, 4),
            contribution=round(contributions, 2)
        ))

    return {"portfolio_id": portfolio.portfolio_id, "factor_exposures": exposures}


@app.post("/attribution")
async def attribution_analysis(
    portfolio: Portfolio,
    benchmark_allocation: Dict[str, float],
    sector_returns: Dict[str, float]
):
    """Perform portfolio attribution analysis."""

    # Calculate portfolio weights
    total_value = sum(p.shares * p.current_price for p in portfolio.positions) + portfolio.cash
    weights = {}
    for p in portfolio.positions:
        weights[p.symbol] = (p.shares * p.current_price) / total_value

    # Calculate sector contributions
    sector_contrib = {}
    for sector, ret in sector_returns.items():
        sector_contrib[sector] = round(ret * 100, 2)

    # Allocation effect: benchmark weight vs actual weight * benchmark return
    alloc_effect = sum((weights.get(s, 0) - benchmark_allocation.get(s, 0)) * sector_returns.get(s, 0) for s in sector_returns)

    # Selection effect: actual weight * (actual return - benchmark return)
    selection_effect = sum(weights.get(s, 0) * (sector_returns.get(s, 0) - benchmark_allocation.get(s, 0)) for s in sector_returns)

    # Interaction effect
    interaction_effect = sum((weights.get(s, 0) - benchmark_allocation.get(s, 0)) * (sector_returns.get(s, 0) - benchmark_allocation.get(s, 0)) for s in sector_returns)

    total_return = alloc_effect + selection_effect + interaction_effect

    return AttributionResult(
        portfolio_id=portfolio.portfolio_id,
        total_return=round(total_return * 100, 2),
        allocation_effect=round(alloc_effect * 100, 2),
        selection_effect=round(selection_effect * 100, 2),
        interaction_effect=round(interaction_effect * 100, 2),
        sector_contributions=sector_contrib
    )


@app.post("/risk-profile")
async def risk_profile(portfolio: Portfolio):
    """Generate comprehensive risk profile."""
    total_value = sum(p.shares * p.current_price for p in portfolio.positions) + portfolio.cash

    # Calculate position weights
    positions_with_weight = []
    for p in portfolio.positions:
        value = p.shares * p.current_price
        weight = value / total_value * 100
        pnl = (p.current_price - p.avg_cost) * p.shares
        pnl_pct = (p.current_price - p.avg_cost) / p.avg_cost * 100
        positions_with_weight.append({
            "symbol": p.symbol,
            "value": round(value, 2),
            "weight": round(weight, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2)
        })

    # Risk scores
    concentration_risk = max(w["weight"] for w in positions_with_weight) if positions_with_weight else 0
    diversification_score = 100 - concentration_risk

    return {
        "portfolio_id": portfolio.portfolio_id,
        "total_value": round(total_value, 2),
        "positions": positions_with_weight,
        "concentration_risk": round(concentration_risk, 2),
        "diversification_score": round(diversification_score, 2),
        "num_positions": len(positions_with_weight),
        "risk_rating": "LOW" if concentration_risk < 20 else "MEDIUM" if concentration_risk < 40 else "HIGH"
    }


@app.post("/compare")
async def compare_portfolios(portfolio1: Portfolio, portfolio2: Portfolio):
    """Compare two portfolios."""
    analysis1 = await analyze_portfolio(portfolio1, None)
    analysis2 = await analyze_portfolio(portfolio2, None)

    return {
        "portfolio1": {
            "id": portfolio1.portfolio_id,
            "return": analysis1.total_return,
            "sharpe": analysis1.sharpe_ratio,
            "volatility": analysis1.volatility,
            "max_drawdown": analysis1.max_drawdown
        },
        "portfolio2": {
            "id": portfolio2.portfolio_id,
            "return": analysis2.total_return,
            "sharpe": analysis2.sharpe_ratio,
            "volatility": analysis2.volatility,
            "max_drawdown": analysis2.max_drawdown
        },
        "comparison": {
            "better_return": portfolio1.portfolio_id if analysis1.total_return > analysis2.total_return else portfolio2.portfolio_id,
            "better_sharpe": portfolio1.portfolio_id if analysis1.sharpe_ratio > analysis2.sharpe_ratio else portfolio2.portfolio_id,
            "lower_risk": portfolio1.portfolio_id if analysis1.volatility < analysis2.volatility else portfolio2.portfolio_id
        }
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5301)