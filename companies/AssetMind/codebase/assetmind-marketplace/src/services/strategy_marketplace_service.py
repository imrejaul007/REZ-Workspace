"""
Strategy Marketplace Service
Trading strategies marketplace
Port: 5233
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum
import logging
import random

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Strategy Marketplace", version="1.0.0", docs_url="/docs")


class StrategyType(str, Enum):
    MOMENTUM = "momentum"
    MEAN_REVERSION = "mean_reversion"
    BREAKOUT = "breakout"
    SCALPING = "scalping"
    SWING = "swing"
    POSITION = "position"
    OPTIONS = "options"


class Strategy(BaseModel):
    strategy_id: str
    name: str
    description: str
    strategy_type: StrategyType
    timeframe: str  # intraday, daily, weekly
    assets: List[str]  # stocks, options, forex, crypto
    creator: str
    creator_id: str
    price: float
    win_rate: float
    profit_factor: float
    avg_trade: float
    max_drawdown: float
    sharpe_ratio: float
    rating: float = Field(0, ge=0, le=5)
    review_count: int = 0
    subscription_count: int = 0
    tags: List[str] = Field(default_factory=list)
    created_at: datetime


class StrategyMarketplaceService:
    """Trading strategies marketplace"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Strategy Marketplace"
        self.port = 5233
        self.version = "1.0.0"
        self._strategies: Dict[str, Strategy] = {}
        self._initialize_data()

    def _initialize_data(self):
        """Initialize with sample strategies"""
        strategies = [
            {"name": "Momentum Breakout Pro", "type": StrategyType.BREAKOUT, "win_rate": 0.68, "price": 99.99},
            {"name": "Mean Reversion Bot", "type": StrategyType.MEAN_REVERSION, "win_rate": 0.72, "price": 79.99},
            {"name": "Swing Trading System", "type": StrategyType.SWING, "win_rate": 0.65, "price": 149.99},
            {"name": "Intraday Scalper", "type": StrategyType.SCALPING, "win_rate": 0.58, "price": 59.99},
            {"name": "Options Iron Condor", "type": StrategyType.OPTIONS, "win_rate": 0.75, "price": 129.99}
        ]

        for i, s in enumerate(strategies):
            strategy_id = f"strategy_{i+1}"
            self._strategies[strategy_id] = Strategy(
                strategy_id=strategy_id,
                name=s["name"],
                description=f"Professional {s['type'].value.replace('_', ' ')} trading strategy",
                strategy_type=s["type"],
                timeframe="daily",
                assets=["stocks", "ETFs"],
                creator=f"Trader {i+1}",
                creator_id=f"creator_{i+1}",
                price=s["price"],
                win_rate=s["win_rate"],
                profit_factor=round(random.uniform(1.3, 2.5), 2),
                avg_trade=round(random.uniform(0.5, 3.0), 2),
                max_drawdown=round(random.uniform(5, 15), 1),
                sharpe_ratio=round(random.uniform(1.0, 3.0), 2),
                rating=round(random.uniform(4.0, 5.0), 1),
                review_count=random.randint(10, 100),
                subscription_count=random.randint(20, 200),
                tags=["featured", "verified"],
                created_at=datetime.utcnow()
            )

    async def get_strategies(
        self,
        strategy_type: Optional[StrategyType] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        sort_by: str = "subscriptions",
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get strategies with filtering"""
        strategies = list(self._strategies.values())

        if strategy_type:
            strategies = [s for s in strategies if s.strategy_type == strategy_type]
        if min_price is not None:
            strategies = [s for s in strategies if s.price >= min_price]
        if max_price is not None:
            strategies = [s for s in strategies if s.price <= max_price]

        if sort_by == "win_rate":
            strategies = sorted(strategies, key=lambda x: x.win_rate, reverse=True)
        elif sort_by == "price":
            strategies = sorted(strategies, key=lambda x: x.price)
        elif sort_by == "rating":
            strategies = sorted(strategies, key=lambda x: x.rating, reverse=True)
        else:
            strategies = sorted(strategies, key=lambda x: x.subscription_count, reverse=True)

        return [
            {
                "strategy_id": s.strategy_id,
                "name": s.name,
                "description": s.description,
                "strategy_type": s.strategy_type.value,
                "timeframe": s.timeframe,
                "creator": s.creator,
                "price": s.price,
                "win_rate": s.win_rate,
                "profit_factor": s.profit_factor,
                "max_drawdown": s.max_drawdown,
                "sharpe_ratio": s.sharpe_ratio,
                "rating": s.rating,
                "subscription_count": s.subscription_count
            }
            for s in strategies[:limit]
        ]

    async def get_strategy(self, strategy_id: str) -> Optional[Dict[str, Any]]:
        """Get strategy by ID"""
        strategy = self._strategies.get(strategy_id)
        if not strategy:
            return None

        return {
            "strategy_id": strategy.strategy_id,
            "name": strategy.name,
            "description": strategy.description,
            "strategy_type": strategy.strategy_type.value,
            "timeframe": strategy.timeframe,
            "assets": strategy.assets,
            "creator": strategy.creator,
            "price": strategy.price,
            "win_rate": strategy.win_rate,
            "profit_factor": strategy.profit_factor,
            "avg_trade": strategy.avg_trade,
            "max_drawdown": strategy.max_drawdown,
            "sharpe_ratio": strategy.sharpe_ratio,
            "rating": strategy.rating,
            "review_count": strategy.review_count,
            "subscription_count": strategy.subscription_count,
            "tags": strategy.tags
        }


service = StrategyMarketplaceService()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": service.name, "port": service.port, "version": service.version}


@app.get("/api/v1/strategies")
async def get_strategies(
    strategy_type: StrategyType = Query(None),
    sort_by: str = Query("subscriptions"),
    limit: int = Query(50, le=100)
):
    return await service.get_strategies(strategy_type, sort_by=sort_by, limit=limit)


@app.get("/api/v1/strategies/{strategy_id}")
async def get_strategy(strategy_id: str):
    strategy = await service.get_strategy(strategy_id)
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strategy


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5233)