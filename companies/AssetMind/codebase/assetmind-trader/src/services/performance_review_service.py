"""
Performance Review Service
Trading performance tracking with comprehensive analytics
Port: 5213
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import random
from collections import defaultdict

logger = logging.getLogger(__name__)

app = FastAPI(title="Performance Review Service", version="1.0.0", docs_url="/docs")


class PerformancePeriod(str, Enum):
    DAY = "1d"
    WEEK = "1w"
    MONTH = "1m"
    QUARTER = "3m"
    YEAR = "1y"
    ALL = "all"


class TradeRecord(BaseModel):
    trade_id: str
    symbol: str
    direction: str  # LONG, SHORT
    entry_price: float
    exit_price: Optional[float]
    quantity: float
    entry_time: datetime
    exit_time: Optional[datetime]
    pnl: float
    pnl_percent: float
    status: str  # OPEN, CLOSED
    strategy: Optional[str] = None


class PerformanceMetrics(BaseModel):
    period: str
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    avg_win: float
    avg_loss: float
    profit_factor: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    max_drawdown_percent: float
    calmar_ratio: float
    total_return: float
    total_return_percent: float
    expectancy: float
    risk_reward_ratio: float
    avg_holding_period: str
    largest_win: float
    largest_loss: float
    streak_wins: int
    streak_losses: int


class StrategyPerformance(BaseModel):
    strategy_name: str
    total_trades: int
    win_rate: float
    total_return: float
    sharpe_ratio: float
    max_drawdown: float


class PerformanceReviewService:
    """Tracks trading performance with comprehensive analytics"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Performance Review Service"
        self.port = 5213
        self.version = "1.0.0"
        self._trades: Dict[str, TradeRecord] = {}
        self._user_performance: Dict[str, Dict[str, Any]] = {}
        self._initialize_mock_data()

    def _initialize_mock_data(self):
        """Initialize with mock trade data"""
        symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA", "AMZN", "META"]
        strategies = ["Momentum", "Mean Reversion", "Breakout", "Scalping", "Swing"]

        for i in range(50):
            symbol = random.choice(symbols)
            entry_price = random.uniform(50, 500)
            quantity = random.uniform(10, 200)
            direction = random.choice(["LONG", "SHORT"])

            # 70% closed trades, 30% open
            is_closed = random.random() > 0.3

            if is_closed:
                exit_price = entry_price * random.uniform(0.85, 1.25)
                if direction == "LONG":
                    pnl = (exit_price - entry_price) * quantity
                else:
                    pnl = (entry_price - exit_price) * quantity
                pnl_percent = (pnl / (entry_price * quantity)) * 100
                exit_time = datetime.utcnow() - timedelta(days=random.randint(1, 30))
            else:
                exit_price = None
                pnl = 0
                pnl_percent = 0
                exit_time = None

            trade = TradeRecord(
                trade_id=f"trade_{i+1}",
                symbol=symbol,
                direction=direction,
                entry_price=round(entry_price, 2),
                exit_price=round(exit_price, 2) if exit_price else None,
                quantity=round(quantity, 2),
                entry_time=datetime.utcnow() - timedelta(days=random.randint(1, 60)),
                exit_time=exit_time,
                pnl=round(pnl, 2),
                pnl_percent=round(pnl_percent, 2),
                status="CLOSED" if is_closed else "OPEN",
                strategy=random.choice(strategies)
            )

            self._trades[f"trade_{i+1}"] = trade

    def _calculate_period_dates(self, period: PerformancePeriod) -> tuple:
        """Calculate start and end dates for period"""
        now = datetime.utcnow()

        if period == PerformancePeriod.DAY:
            start = now - timedelta(days=1)
        elif period == PerformancePeriod.WEEK:
            start = now - timedelta(weeks=1)
        elif period == PerformancePeriod.MONTH:
            start = now - timedelta(days=30)
        elif period == PerformancePeriod.QUARTER:
            start = now - timedelta(days=90)
        elif period == PerformancePeriod.YEAR:
            start = now - timedelta(days=365)
        else:
            start = datetime.min

        return start, now

    async def get_performance(
        self,
        user_id: str,
        period: PerformancePeriod = PerformancePeriod.MONTH
    ) -> PerformanceMetrics:
        """Get comprehensive performance metrics"""
        start_date, end_date = self._calculate_period_dates(period)

        # Filter trades by period
        trades = [
            t for t in self._trades.values()
            if t.entry_time >= start_date and t.status == "CLOSED"
        ]

        if not trades:
            return PerformanceMetrics(
                period=period.value,
                total_trades=0,
                winning_trades=0,
                losing_trades=0,
                win_rate=0,
                avg_win=0,
                avg_loss=0,
                profit_factor=0,
                sharpe_ratio=0,
                sortino_ratio=0,
                max_drawdown=0,
                max_drawdown_percent=0,
                calmar_ratio=0,
                total_return=0,
                total_return_percent=0,
                expectancy=0,
                risk_reward_ratio=0,
                avg_holding_period="0h",
                largest_win=0,
                largest_loss=0,
                streak_wins=0,
                streak_losses=0
            )

        # Calculate metrics
        total_trades = len(trades)
        winning_trades = [t for t in trades if t.pnl > 0]
        losing_trades = [t for t in trades if t.pnl < 0]
        win_rate = len(winning_trades) / total_trades if total_trades > 0 else 0

        wins = [t.pnl for t in winning_trades]
        losses = [abs(t.pnl) for t in losing_trades]

        avg_win = sum(wins) / len(wins) if wins else 0
        avg_loss = sum(losses) / len(losses) if losses else 0

        total_pnl = sum(t.pnl for t in trades)
        profit_factor = sum(wins) / sum(losses) if losses and sum(losses) > 0 else 0

        # Calculate returns for Sharpe ratio
        returns = [t.pnl_percent for t in trades]
        avg_return = sum(returns) / len(returns) if returns else 0
        std_return = (sum((r - avg_return) ** 2 for r in returns) / len(returns)) ** 0.5 if returns else 0

        sharpe_ratio = (avg_return / std_return) if std_return > 0 else 0

        # Sortino ratio (downside deviation)
        downside_returns = [r for r in returns if r < 0]
        downside_std = (sum(r ** 2 for r in downside_returns) / len(downside_returns)) ** 0.5 if downside_returns else 0
        sortino_ratio = (avg_return / downside_std) if downside_std > 0 else 0

        # Max drawdown
        cumulative_pnl = 0
        peak =0
        max_drawdown = 0
        max_drawdown_pct = 0

        sorted_trades = sorted(trades, key=lambda x: x.exit_time or x.entry_time)
        for trade in sorted_trades:
            cumulative_pnl += trade.pnl
            if cumulative_pnl > peak:
                peak = cumulative_pnl
            drawdown = peak - cumulative_pnl
            if drawdown > max_drawdown:
                max_drawdown = drawdown
                max_drawdown_pct = (drawdown / peak * 100) if peak > 0 else 0

        # Calmar ratio
        calmar_ratio = (total_pnl / 365) / max_drawdown if max_drawdown > 0 else 0

        # Streaks
        sorted_by_time = sorted(trades, key=lambda x: x.exit_time or x.entry_time)
        current_streak = 0
        max_streak_wins = 0
        max_streak_losses = 0

        for trade in sorted_by_time:
            if trade.pnl > 0:
                if current_streak > 0:
                    current_streak += 1
                else:
                    current_streak = 1
                max_streak_wins = max(max_streak_wins, current_streak)
            else:
                if current_streak < 0:
                    current_streak -= 1
                else:
                    current_streak = -1
                max_streak_losses = max(max_streak_losses, abs(current_streak))

        # Average holding period
        holding_periods = []
        for trade in trades:
            if trade.exit_time:
                duration = (trade.exit_time - trade.entry_time).total_seconds() / 3600
                holding_periods.append(duration)

        avg_hours = sum(holding_periods) / len(holding_periods) if holding_periods else 0
        if avg_hours < 24:
            avg_holding = f"{int(avg_hours)}h"
        else:
            avg_holding = f"{int(avg_hours / 24)}d"

        return PerformanceMetrics(
            period=period.value,
            total_trades=total_trades,
            winning_trades=len(winning_trades),
            losing_trades=len(losing_trades),
            win_rate=round(win_rate, 3),
            avg_win=round(avg_win, 2),
            avg_loss=round(avg_loss, 2),
            profit_factor=round(profit_factor, 2),
            sharpe_ratio=round(sharpe_ratio, 2),
            sortino_ratio=round(sortino_ratio, 2),
            max_drawdown=round(max_drawdown, 2),
            max_drawdown_percent=round(max_drawdown_pct, 2),
            calmar_ratio=round(calmar_ratio, 2),
            total_return=round(total_pnl, 2),
            total_return_percent=round(sum(returns), 2),
            expectancy=round((win_rate * avg_win) - ((1 - win_rate) * avg_loss), 2),
            risk_reward_ratio=round(avg_win / avg_loss, 2) if avg_loss > 0 else 0,
            avg_holding_period=avg_holding,
            largest_win=round(max(wins) if wins else 0, 2),
            largest_loss=round(-min(losses) if losses else 0, 2),
            streak_wins=max_streak_wins,
            streak_losses=max_streak_losses
        )

    async def get_trades(
        self,
        user_id: str,
        symbol: Optional[str] = None,
        status: Optional[str] = None,
        strategy: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get trade history"""
        trades = list(self._trades.values())

        if symbol:
            trades = [t for t in trades if t.symbol == symbol.upper()]
        if status:
            trades = [t for t in trades if t.status == status.upper()]
        if strategy:
            trades = [t for t in trades if t.strategy == strategy]

        trades = sorted(trades, key=lambda x: x.entry_time, reverse=True)[:limit]

        return [
            {
                "trade_id": t.trade_id,
                "symbol": t.symbol,
                "direction": t.direction,
                "entry_price": t.entry_price,
                "exit_price": t.exit_price,
                "quantity": t.quantity,
                "pnl": t.pnl,
                "pnl_percent": t.pnl_percent,
                "status": t.status,
                "strategy": t.strategy,
                "entry_time": t.entry_time.isoformat(),
                "exit_time": t.exit_time.isoformat() if t.exit_time else None
            }
            for t in trades
        ]

    async def get_strategy_performance(
        self,
        user_id: str
    ) -> List[StrategyPerformance]:
        """Get performance by strategy"""
        strategy_trades = defaultdict(list)

        for trade in self._trades.values():
            if trade.strategy and trade.status == "CLOSED":
                strategy_trades[trade.strategy].append(trade)

        results = []
        for strategy, trades in strategy_trades.items():
            wins = [t for t in trades if t.pnl > 0]
            total_return = sum(t.pnl for t in trades)

            results.append(StrategyPerformance(
                strategy_name=strategy,
                total_trades=len(trades),
                win_rate=len(wins) / len(trades) if trades else 0,
                total_return=round(total_return, 2),
                sharpe_ratio=round(random.uniform(0.5, 2.5), 2),
                max_drawdown=round(random.uniform(5, 20), 1)
            ))

        return sorted(results, key=lambda x: x.total_return, reverse=True)

    async def get_symbol_performance(
        self,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Get performance by symbol"""
        symbol_trades = defaultdict(list)

        for trade in self._trades.values():
            if trade.status == "CLOSED":
                symbol_trades[trade.symbol].append(trade)

        results = []
        for symbol, trades in symbol_trades.items():
            wins = [t for t in trades if t.pnl > 0]
            total_return = sum(t.pnl for t in trades)

            results.append({
                "symbol": symbol,
                "total_trades": len(trades),
                "win_rate": round(len(wins) / len(trades), 3) if trades else 0,
                "total_return": round(total_return, 2),
                "avg_pnl": round(total_return / len(trades), 2) if trades else 0
            })

        return sorted(results, key=lambda x: x["total_return"], reverse=True)


service = PerformanceReviewService()


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "total_trades": len(service._trades)
    }


@app.get("/api/v1/performance/{user_id}")
async def get_performance(
    user_id: str,
    period: PerformancePeriod = Query(PerformancePeriod.MONTH)
):
    return await service.get_performance(user_id, period)


@app.get("/api/v1/trades/{user_id}")
async def get_trades(
    user_id: str,
    symbol: str = Query(None),
    status: str = Query(None),
    strategy: str = Query(None),
    limit: int = Query(50, le=100)
):
    return await service.get_trades(user_id, symbol, status, strategy, limit)


@app.get("/api/v1/performance/{user_id}/strategies")
async def get_strategy_performance(user_id: str):
    return await service.get_strategy_performance(user_id)


@app.get("/api/v1/performance/{user_id}/symbols")
async def get_symbol_performance(user_id: str):
    return await service.get_symbol_performance(user_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5213)