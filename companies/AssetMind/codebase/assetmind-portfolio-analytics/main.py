"""
AssetMind Portfolio Analytics Service - Port 5301
Risk-adjusted returns, performance metrics, factor analysis, attribution.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum
import math
import random

app = FastAPI(title="AssetMind Portfolio Analytics", version="1.0.0")
DEFAULT_PORT = 5301


class Position(BaseModel):
    symbol: str
    shares: float
    avg_cost: float
    current_price: float
    sector: Optional[str] = None


class Portfolio(BaseModel):
    portfolio_id: str
    name: Optional[str] = None
    positions: List[Position]
    cash: float = 0
    start_date: str
    end_date: str
    benchmark: Optional[str] = "SPY"


class PerformanceMetrics(BaseModel):
    total_return: float
    annualized_return: float
    volatility: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    win_rate: float


class RiskMetrics(BaseModel):
    beta: float
    alpha: float
    treynor_ratio: float
    correlation: float
    r_squared: float
    var_95: float
    cvar_95: float


class AnalyticsResult(BaseModel):
    portfolio_id: str
    performance: PerformanceMetrics
    risk: RiskMetrics
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)


class FactorExposure(BaseModel):
    factor: str
    exposure: float
    contribution: float


# ============================================================================
# Helper Functions
# ============================================================================

def generate_returns(n_days: int = 252) -> List[float]:
    random.seed(42)
    return [random.gauss(0.0005, 0.015) for _ in range(n_days)]


def annualized_return(returns: List[float], periods: int = 252) -> float:
    if not returns:
        return 0
    total = 1
    for r in returns:
        total *= (1 + r)
    n = len(returns) / periods if periods > 0 else 1
    return (total ** (1 / n)) - 1 if n > 0 else 0


def volatility(returns: List[float]) -> float:
    if len(returns) < 2:
        return 0
    mean = sum(returns) / len(returns)
    variance = sum((r - mean) ** 2 for r in returns) / (len(returns) - 1)
    return math.sqrt(variance * 252)


def sharpe_ratio(returns: List[float], rf: float = 0.04) -> float:
    if len(returns) < 2:
        return 0
    ann_ret = annualized_return(returns)
    vol = volatility(returns)
    return (ann_ret - rf) / vol if vol > 0 else 0


def sortino_ratio(returns: List[float], rf: float = 0.04) -> float:
    if len(returns) < 2:
        return 0
    ann_ret = annualized_return(returns)
    downside = [r for r in returns if r < 0]
    if not downside:
        return 0
    dd = math.sqrt(sum(r**2 for r in downside) / len(downside)) * math.sqrt(252)
    return (ann_ret - rf) / dd if dd > 0 else 0


def max_drawdown(returns: List[float]) -> float:
    if not returns:
        return 0
    cumulative = [1]
    for r in returns:
        cumulative.append(cumulative[-1] * (1 + r))
    max_dd, peak = 0, cumulative[0]
    for val in cumulative:
        if val > peak:
            peak = val
        dd = (peak - val) / peak
        max_dd = max(max_dd, dd)
    return max_dd


def beta(returns: List[float], bench: List[float]) -> float:
    if len(returns) != len(bench) or len(returns) < 2:
        return 1.0
    p_mean, b_mean = sum(returns) / len(returns), sum(bench) / len(bench)
    cov = sum((p - p_mean) * (b - b_mean) for p, b in zip(returns, bench)) / (len(returns) - 1)
    b_var = sum((b - b_mean) ** 2 for b in bench) / (len(bench) - 1)
    return cov / b_var if b_var > 0 else 1.0


def alpha(returns: List[float], bench: List[float], rf: float = 0.04 / 252) -> float:
    if len(returns) < 2:
        return 0
    b = beta(returns, bench)
    return annualized_return(returns) - (rf + b * (annualized_return(bench) - rf))


def correlation(returns1: List[float], returns2: List[float]) -> float:
    if len(returns1) != len(returns2) or len(returns1) < 2:
        return 0
    m1, m2 = sum(returns1) / len(returns1), sum(returns2) / len(returns2)
    num = sum((r1 - m1) * (r2 - m2) for r1, r2 in zip(returns1, returns2))
    d1 = math.sqrt(sum((r - m1) ** 2 for r in returns1))
    d2 = math.sqrt(sum((r - m2) ** 2 for r in returns2))
    return num / (d1 * d2) if d1 * d2 > 0 else 0


def var_cvar(returns: List[float], conf: float = 0.95) -> tuple:
    if not returns:
        return 0, 0
    sorted_ret = sorted(returns)
    idx = int((1 - conf) * len(sorted_ret))
    var = -sorted_ret[idx] if idx < len(sorted_ret) else 0
    tail = sorted_ret[:idx + 1]
    cvar = -sum(tail) / len(tail) if tail else 0
    return var, cvar


# ============================================================================
# Health& Status
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-portfolio-analytics",
        "status": "healthy",
        "version": "1.0.0",
        "port": DEFAULT_PORT,
        "capabilities": {
            "performance_metrics": "active",
            "risk_metrics": "active",
            "factor_analysis": "active",
            "attribution": "active"
        }
    }


@app.get("/status")
async def get_status():
    return {
        "service": "assetmind-portfolio-analytics",
        "version": "1.0.0",
        "capabilities": ["performance", "risk", "factors", "attribution"]
    }


# ============================================================================
# Analytics Endpoints
# ============================================================================

@app.post("/analyze", response_model=AnalyticsResult)
async def analyze_portfolio(portfolio: Portfolio):
    n_days = 252
    returns = generate_returns(n_days)
    bench = generate_returns(n_days, 0.0004, 0.012)

    total_ret = sum(returns)
    ann_ret = annualized_return(returns)
    vol = volatility(returns)
    sharpe = sharpe_ratio(returns)
    sortino = sortino_ratio(returns)
    mdd = max_drawdown(returns)
    win_rate = sum(1 for r in returns if r > 0) / len(returns)

    b = beta(returns, bench)
    a = alpha(returns, bench)
    corr = correlation(returns, bench)
    r2 = corr ** 2
    treynor = ann_ret / b if b != 0 else 0
    var_95, cvar_95 = var_cvar(returns)

    return AnalyticsResult(
        portfolio_id=portfolio.portfolio_id,
        performance=PerformanceMetrics(
            total_return=round(total_ret * 100, 2),
            annualized_return=round(ann_ret * 100, 2),
            volatility=round(vol * 100, 2),
            sharpe_ratio=round(sharpe, 2),
            sortino_ratio=round(sortino, 2),
            max_drawdown=round(mdd * 100, 2),
            win_rate=round(win_rate * 100, 2)
        ),
        risk=RiskMetrics(
            beta=round(b, 2),
            alpha=round(a * 100, 2),
            treynor_ratio=round(treynor, 2),
            correlation=round(corr, 3),
            r_squared=round(r2, 3),
            var_95=round(var_95 * 100, 2),
            cvar_95=round(cvar_95 * 100, 2)
        )
    )


# ============================================================================
# Factor Analysis Endpoints
# ============================================================================

@app.post("/factors")
async def factor_exposure(portfolio: Portfolio, factor_returns: Optional[Dict[str, List[float]]] = None):
    factors = factor_returns or {
        "MOMENTUM": generate_returns(252, 0.0006, 0.012),
        "VALUE": generate_returns(252, 0.0004, 0.010),
        "SIZE": generate_returns(252, 0.0002, 0.014),
        "QUALITY": generate_returns(252, 0.0005, 0.008)
    }

    exposures = []
    for factor, ret in factors.items():
        exposure = sum(ret) / len(ret) if ret else 0
        exposures.append(FactorExposure(
            factor=factor,
            exposure=round(exposure, 4),
            contribution=round(exposure * 100, 2)
        ))

    return {"portfolio_id": portfolio.portfolio_id, "factor_exposures": exposures}


# ============================================================================
# Attribution Analysis Endpoints
# ============================================================================

@app.post("/attribution")
async def attribution_analysis(portfolio: Portfolio, benchmark_alloc: Dict[str, float],
                               sector_returns: Dict[str, float]):
    total_value = sum(p.shares * p.current_price for p in portfolio.positions) + portfolio.cash
    weights = {}
    for p in portfolio.positions:
        sector = p.sector or "OTHER"
        weights[sector] = weights.get(sector, 0) + (p.shares * p.current_price) / total_value

    alloc = sum((weights.get(s, 0) - benchmark_alloc.get(s, 0)) * sector_returns.get(s, 0) for s in sector_returns)
    selection = sum(weights.get(s, 0) * (sector_returns.get(s, 0) - benchmark_alloc.get(s, 0)) for s in sector_returns)
    interaction = sum((weights.get(s, 0) - benchmark_alloc.get(s, 0)) * (sector_returns.get(s, 0) - benchmark_alloc.get(s, 0)) for s in sector_returns)

    return {
        "portfolio_id": portfolio.portfolio_id,
        "total_return": round((alloc + selection + interaction) * 100, 2),
        "allocation_effect": round(alloc * 100, 2),
        "selection_effect": round(selection * 100, 2),
        "interaction_effect": round(interaction * 100, 2),
        "sector_contributions": {s: round(r * 100, 2) for s, r in sector_returns.items()}
    }


# ============================================================================
# Risk Profile Endpoints
# ============================================================================

@app.post("/risk-profile")
async def risk_profile(portfolio: Portfolio):
    total_value = sum(p.shares * p.current_price for p in portfolio.positions) + portfolio.cash
    positions_data = []
    sector_weights = {}

    for p in portfolio.positions:
        value = p.shares * p.current_price
        weight = value / total_value if total_value > 0 else 0
        sector = p.sector or "OTHER"
        sector_weights[sector] = sector_weights.get(sector, 0) + weight
        positions_data.append({"symbol": p.symbol, "value": round(value, 2), "weight": round(weight * 100, 2)})

    weights = [w["weight"] for w in positions_data]
    conc_risk = max(weights) if weights else 0

    return {
        "portfolio_id": portfolio.portfolio_id,
        "total_value": round(total_value, 2),
        "positions": positions_data,
        "concentration_risk": round(conc_risk, 2),
        "diversification_score": round(100 - conc_risk, 2),
        "num_positions": len(positions_data),
        "risk_rating": "LOW" if conc_risk < 20 else "MEDIUM" if conc_risk < 40 else "HIGH"
    }


# ============================================================================
# Portfolio Comparison Endpoints
# ============================================================================

@app.post("/compare")
async def compare_portfolios(portfolio1: Portfolio, portfolio2: Portfolio):
    analysis1 = await analyze_portfolio(portfolio1)
    analysis2 = await analyze_portfolio(portfolio2)

    return {
        "portfolio1": {
            "id": portfolio1.portfolio_id,
            "return": analysis1.performance.total_return,
            "sharpe": analysis1.performance.sharpe_ratio,
            "volatility": analysis1.performance.volatility
        },
        "portfolio2": {
            "id": portfolio2.portfolio_id,
            "return": analysis2.performance.total_return,
            "sharpe": analysis2.performance.sharpe_ratio,
            "volatility": analysis2.performance.volatility
        },
        "comparison": {
            "better_return": portfolio1.portfolio_id if analysis1.performance.total_return > analysis2.performance.total_return else portfolio2.portfolio_id,
            "better_sharpe": portfolio1.portfolio_id if analysis1.performance.sharpe_ratio > analysis2.performance.sharpe_ratio else portfolio2.portfolio_id
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=DEFAULT_PORT)
