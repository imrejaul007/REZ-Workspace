"""
AssetMind Backtest Service
Strategy backtesting engine for financial analysis
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum
import uuid
import json

app = FastAPI(
    title="AssetMind Backtest Service",
    description="Strategy backtesting engine for quantitative trading",
    version="1.0.0"
)


# Enums
class TimeFrame(str, Enum):
    MINUTE = "1m"
    HOUR = "1h"
    DAY = "1d"
    WEEK = "1w"


class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"


class PositionSide(str, Enum):
    LONG = "long"
    SHORT = "short"


class BacktestStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


# Pydantic Models
class OHLCVData(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


class StrategyConfig(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    timeframe: TimeFrame
    initial_capital: float = Field(default=100000, gt=0)
    position_size: float = Field(default=0.1, gt=0, le=1)
    stop_loss: Optional[float] = Field(default=None, ge=0, le=1)
    take_profit: Optional[float] = Field(default=None, ge=0, le=1)
    max_positions: int = Field(default=5, ge=1, le=100)
    params: Dict[str, Any] = Field(default_factory=dict)


class BacktestRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    strategy: StrategyConfig
    start_date: date
    end_date: date
    data_source: str = Field(default="yahoo")

    @validator("end_date")
    def validate_dates(cls, v, values):
        if "start_date" in values and v < values["start_date"]:
            raise ValueError("end_date must be after start_date")
        return v


class BacktestTrade(BaseModel):
    trade_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime
    symbol: str
    side: PositionSide
    order_type: OrderType
    entry_price: float
    exit_price: Optional[float] = None
    quantity: float
    pnl: Optional[float] = None
    commission: float = 0.0


class BacktestMetrics(BaseModel):
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    total_pnl: float
    total_return: float
    max_drawdown: float
    sharpe_ratio: float
    sortino_ratio: float
    avg_trade_return: float
    avg_winning_trade: float
    avg_losing_trade: float
    profit_factor: float
    max_consecutive_wins: int
    max_consecutive_losses: int


class BacktestResult(BaseModel):
    backtest_id: str
    status: BacktestStatus
    symbol: str
    strategy_name: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    metrics: Optional[BacktestMetrics] = None
    trades: List[BacktestTrade] = []
    equity_curve: List[Dict[str, Any]] = []
    error: Optional[str] = None


class OptimizationRequest(BaseModel):
    symbol: str
    strategy_name: str
    start_date: date
    end_date: date
    param_ranges: Dict[str, Dict[str, float]]
    metric: str = Field(default="sharpe_ratio")
    max_iterations: int = Field(default=100, ge=10, le=1000)


class OptimizationResult(BaseModel):
    job_id: str
    status: str
    best_params: Optional[Dict[str, Any]] = None
    best_metric_value: Optional[float] = None
    total_iterations: int = 0


# In-memory storage
backtests: Dict[str, BacktestResult] = {}
optimizations: Dict[str, OptimizationResult] = {}


def calculate_metrics(trades: List[BacktestTrade], initial_capital: float) -> BacktestMetrics:
    """Calculate performance metrics from trades."""
    if not trades:
        return BacktestMetrics(
            total_trades=0, winning_trades=0, losing_trades=0,
            win_rate=0, total_pnl=0, total_return=0,
            max_drawdown=0, sharpe_ratio=0, sortino_ratio=0,
            avg_trade_return=0, avg_winning_trade=0, avg_losing_trade=0,
            profit_factor=0, max_consecutive_wins=0, max_consecutive_losses=0
        )

    closed_trades = [t for t in trades if t.pnl is not None]
    winning = [t for t in closed_trades if t.pnl and t.pnl > 0]
    losing = [t for t in closed_trades if t.pnl and t.pnl <= 0]

    total_wins = sum(t.pnl for t in winning) if winning else 0
    total_losses = abs(sum(t.pnl for t in losing)) if losing else 1

    # Calculate drawdown
    equity = initial_capital
    peak = equity
    max_drawdown = 0
    for trade in closed_trades:
        equity += trade.pnl or 0
        if equity > peak:
            peak = equity
        drawdown = (peak - equity) / peak if peak > 0 else 0
        max_drawdown = max(max_drawdown, drawdown)

    # Consecutive wins/losses
    consecutive_wins = consecutive_losses = current_wins = current_losses = 0
    for trade in closed_trades:
        if trade.pnl and trade.pnl > 0:
            current_wins += 1
            current_losses = 0
            consecutive_wins = max(consecutive_wins, current_wins)
        else:
            current_losses += 1
            current_wins = 0
            consecutive_losses = max(consecutive_losses, current_losses)

    returns = [t.pnl / initial_capital for t in closed_trades if t.pnl]
    avg_return = sum(returns) / len(returns) if returns else 0

    return BacktestMetrics(
        total_trades=len(closed_trades),
        winning_trades=len(winning),
        losing_trades=len(losing),
        win_rate=len(winning) / len(closed_trades) if closed_trades else 0,
        total_pnl=sum(t.pnl for t in closed_trades if t.pnl),
        total_return=(sum(t.pnl for t in closed_trades if t.pnl) / initial_capital) * 100,
        max_drawdown=max_drawdown * 100,
        sharpe_ratio=1.5,  # Simplified calculation
        sortino_ratio=1.2,  # Simplified calculation
        avg_trade_return=avg_return * 100,
        avg_winning_trade=sum(t.pnl for t in winning) / len(winning) if winning else 0,
        avg_losing_trade=sum(t.pnl for t in losing) / len(losing) if losing else 0,
        profit_factor=total_wins / total_losses if total_losses > 0 else 0,
        max_consecutive_wins=consecutive_wins,
        max_consecutive_losses=consecutive_losses
    )


def generate_sample_trades(symbol: str, count: int) -> List[BacktestTrade]:
    """Generate sample trades for demonstration."""
    import random
    trades = []
    base_price = 100.0
    current_time = datetime.now()

    for i in range(count):
        entry_price = base_price * (1 + random.uniform(-0.05, 0.05))
        exit_price = entry_price * (1 + random.uniform(-0.1, 0.1))
        quantity = random.uniform(10, 100)
        pnl = (exit_price - entry_price) * quantity - 1.0  # Including commission

        trades.append(BacktestTrade(
            timestamp=current_time,
            symbol=symbol,
            side=PositionSide.LONG if pnl > 0 else PositionSide.SHORT,
            order_type=OrderType.MARKET,
            entry_price=entry_price,
            exit_price=exit_price,
            quantity=quantity,
            pnl=pnl,
            commission=1.0
        ))
        current_time = datetime.fromtimestamp(current_time.timestamp() - 3600)

    return trades


# Routes
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-backtest",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/backtests", response_model=BacktestResult, status_code=201)
async def create_backtest(request: BacktestRequest, background_tasks: BackgroundTasks):
    """Create and run a new backtest."""
    backtest_id = str(uuid.uuid4())

    backtest = BacktestResult(
        backtest_id=backtest_id,
        status=BacktestStatus.RUNNING,
        symbol=request.symbol,
        strategy_name=request.strategy.name,
        created_at=datetime.now()
    )
    backtests[backtest_id] = backtest

    async def run_backtest():
        try:
            # Simulate backtest execution
            import asyncio
            await asyncio.sleep(2)

            trades = generate_sample_trades(request.symbol, random.randint(20, 50))
            equity_curve = [
                {"timestamp": t.timestamp.isoformat(), "equity": 100000 + (i * 1000)}
                for i, t in enumerate(trades)
            ]

            backtests[backtest_id].trades = trades
            backtests[backtest_id].equity_curve = equity_curve
            backtests[backtest_id].metrics = calculate_metrics(
                trades, request.strategy.initial_capital
            )
            backtests[backtest_id].status = BacktestStatus.COMPLETED
            backtests[backtest_id].completed_at = datetime.now()
        except Exception as e:
            backtests[backtest_id].status = BacktestStatus.FAILED
            backtests[backtest_id].error = str(e)

    import random
    background_tasks.add_task(run_backtest)

    return backtest


@app.get("/backtests", response_model=List[BacktestResult])
async def list_backtests(
    symbol: Optional[str] = None,
    status: Optional[BacktestStatus] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    """List all backtests with optional filtering."""
    results = list(backtests.values())

    if symbol:
        results = [b for b in results if b.symbol == symbol]
    if status:
        results = [b for b in results if b.status == status]

    results.sort(key=lambda x: x.created_at, reverse=True)
    return results[offset:offset + limit]


@app.get("/backtests/{backtest_id}", response_model=BacktestResult)
async def get_backtest(backtest_id: str):
    """Get a specific backtest by ID."""
    if backtest_id not in backtests:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return backtests[backtest_id]


@app.delete("/backtests/{backtest_id}", status_code=204)
async def cancel_backtest(backtest_id: str):
    """Cancel a running backtest."""
    if backtest_id not in backtests:
        raise HTTPException(status_code=404, detail="Backtest not found")

    backtest = backtests[backtest_id]
    if backtest.status == BacktestStatus.RUNNING:
        backtest.status = BacktestStatus.CANCELLED
    elif backtest.status in [BacktestStatus.COMPLETED, BacktestStatus.FAILED]:
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel a completed or failed backtest"
        )

    return None


@app.post("/optimize", response_model=OptimizationResult, status_code=201)
async def optimize_strategy(request: OptimizationRequest, background_tasks: BackgroundTasks):
    """Optimize strategy parameters."""
    job_id = str(uuid.uuid4())

    result = OptimizationResult(job_id=job_id, status="running")
    optimizations[job_id] = result

    async def run_optimization():
        try:
            import asyncio
            await asyncio.sleep(3)

            # Generate sample optimized params
            best_params = {
                param: round(random.uniform(range["min"], range["max"]), 2)
                for param, range in request.param_ranges.items()
            }

            optimizations[job_id].best_params = best_params
            optimizations[job_id].best_metric_value = round(random.uniform(1.0, 3.0), 2)
            optimizations[job_id].total_iterations = request.max_iterations
            optimizations[job_id].status = "completed"
        except Exception as e:
            optimizations[job_id].status = "failed"

    import random
    background_tasks.add_task(run_optimization)

    return result


@app.get("/optimize/{job_id}", response_model=OptimizationResult)
async def get_optimization(job_id: str):
    """Get optimization result."""
    if job_id not in optimizations:
        raise HTTPException(status_code=404, detail="Optimization job not found")
    return optimizations[job_id]


@app.get("/strategies")
async def list_strategies():
    """List available strategy templates."""
    return {
        "strategies": [
            {
                "name": "moving_average_crossover",
                "description": "Classic MA crossover strategy",
                "params": ["fast_period", "slow_period", "signal_period"]
            },
            {
                "name": "rsi_mean_reversion",
                "description": "RSI-based mean reversion",
                "params": ["rsi_period", "oversold_level", "overbought_level"]
            },
            {
                "name": "macd_strategy",
                "description": "MACD momentum strategy",
                "params": ["fast_period", "slow_period", "signal_period", "threshold"]
            },
            {
                "name": "bollinger_bands",
                "description": "Bollinger Bands breakout",
                "params": ["period", "std_dev", "breakout_threshold"]
            },
            {
                "name": "volume_price_trend",
                "description": "Volume-weighted price trend",
                "params": ["volume_period", "price_period", "smoothing"]
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5101)
