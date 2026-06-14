"""
AssetMind Financial Memory Service
Persistent memory storage for financial insights, decisions, and learnings
Port: 5031
"""

import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("assetmind-financial-memory")


class MemoryCategory(str, Enum):
    TRADE_HISTORY = "trade_history"
    DECISION = "decision"
    OUTCOME = "outcome"
    PATTERN = "pattern"
    RESEARCH = "research"
    INSIGHT = "insight"


class AssetType(str, Enum):
    STOCK = "stock"
    CRYPTO = "crypto"
    FOREX = "forex"
    COMMODITY = "commodity"
    ETF = "etf"


class OutcomeType(str, Enum):
    PROFIT = "profit"
    LOSS = "loss"
    BREAKEVEN = "breakeven"
    PENDING = "pending"


class FinancialMemory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    category: MemoryCategory
    asset_type: Optional[AssetType] = None
    symbol: Optional[str] = None
    title: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    source: str = "system"
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    importance: int = Field(default=5, ge=1, le=10)
    linked_memories: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MemoryCreate(BaseModel):
    category: MemoryCategory
    asset_type: Optional[AssetType] = None
    symbol: Optional[str] = None
    title: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    source: str = "api"
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    importance: int = Field(default=5, ge=1, le=10)


class TradeMemory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    trade_id: str
    symbol: str
    entry_price: float
    exit_price: Optional[float] = None
    quantity: float
    side: str
    entry_time: datetime
    exit_time: Optional[datetime] = None
    pnl: Optional[float] = None
    pnl_percent: Optional[float] = None
    reasoning: str
    outcome: OutcomeType = OutcomeType.PENDING


class TradeCreate(BaseModel):
    symbol: str
    entry_price: float
    quantity: float
    side: str
    reasoning: str
    tags: List[str] = Field(default_factory=list)


class MemorySearch(BaseModel):
    query: str
    categories: Optional[List[MemoryCategory]] = None
    symbols: Optional[List[str]] = None
    min_confidence: Optional[float] = None
    days_back: Optional[int] = None
    limit: int = Field(default=20, ge=1, le=100)


class FinancialMemoryState:
    def __init__(self):
        self.memories: Dict[str, FinancialMemory] = {}
        self.trades: Dict[str, TradeMemory] = {}
        self.start_time = datetime.utcnow()

    def create_memory(self, request: MemoryCreate) -> FinancialMemory:
        memory = FinancialMemory(
            category=request.category, asset_type=request.asset_type, symbol=request.symbol,
            title=request.title, content=request.content, metadata=request.metadata,
            tags=request.tags, source=request.source, confidence=request.confidence, importance=request.importance,
        )
        self.memories[memory.id] = memory
        logger.info(f"Created memory: {memory.id}")
        return memory

    def search_memories(self, search: MemorySearch) -> List[FinancialMemory]:
        results = list(self.memories.values())
        if search.query:
            q = search.query.lower()
            results = [m for m in results if q in m.content.lower() or q in m.title.lower() or any(q in t.lower() for t in m.tags)]
        if search.categories:
            results = [m for m in results if m.category in search.categories]
        if search.symbols:
            results = [m for m in results if m.symbol in search.symbols]
        if search.min_confidence:
            results = [m for m in results if m.confidence >= search.min_confidence]
        if search.days_back:
            cutoff = datetime.utcnow() - timedelta(days=search.days_back)
            results = [m for m in results if m.created_at >= cutoff]
        results.sort(key=lambda m: m.importance * m.confidence, reverse=True)
        return results[:search.limit]

    def create_trade(self, request: TradeCreate) -> TradeMemory:
        trade = TradeMemory(trade_id=str(uuid4()), symbol=request.symbol, entry_price=request.entry_price,
                           quantity=request.quantity, side=request.side, entry_time=datetime.utcnow(), reasoning=request.reasoning)
        self.trades[trade.trade_id] = trade
        self.create_memory(MemoryCreate(category=MemoryCategory.TRADE_HISTORY, symbol=request.symbol,
                                        title=f"Trade: {request.side.upper()} {request.symbol}",
                                        content=f"{request.side.upper()} {request.quantity} {request.symbol} @ ${request.entry_price}"))
        logger.info(f"Created trade: {trade.trade_id}")
        return trade

    def close_trade(self, trade_id: str, exit_price: float) -> Optional[TradeMemory]:
        trade = self.trades.get(trade_id)
        if not trade:
            return None
        trade.exit_price = exit_price
        trade.exit_time = datetime.utcnow()
        trade.pnl = (exit_price - trade.entry_price) * trade.quantity if trade.side.lower() == "buy" else (trade.entry_price - exit_price) * trade.quantity
        trade.pnl_percent = (trade.pnl / (trade.entry_price * trade.quantity)) * 100
        trade.outcome = OutcomeType.PROFIT if trade.pnl > 0 else OutcomeType.LOSS if trade.pnl < 0 else OutcomeType.BREAKEVEN
        return trade


state = FinancialMemoryState()

app = FastAPI(title="AssetMind Financial Memory", description="Persistent memory for financial data", version="1.0.0")


@app.get("/health")
async def health_check():
    return {"service": "assetmind-financial-memory", "status": "healthy", "version": "1.0.0", "port": 5031,
            "total_memories": len(state.memories), "total_trades": len(state.trades)}


@app.get("/health/live")
async def liveness():
    return {"status": "alive"}


@app.get("/health/ready")
async def readiness():
    return {"status": "ready", "memories_loaded": len(state.memories)}


memory_router = APIRouter(prefix="/api/memory")


@memory_router.post("/store", response_model=FinancialMemory, status_code=201)
async def create_memory(request: MemoryCreate):
    return state.create_memory(request)


@memory_router.get("/", response_model=List[FinancialMemory])
async def list_memories(category: Optional[MemoryCategory] = None, symbol: Optional[str] = None, limit: int = Query(50, ge=1, le=200)):
    results = list(state.memories.values())
    if category:
        results = [m for m in results if m.category == category]
    if symbol:
        results = [m for m in results if m.symbol == symbol]
    return sorted(results, key=lambda m: m.created_at, reverse=True)[:limit]


@memory_router.post("/search", response_model=List[FinancialMemory])
async def search_memories(search: MemorySearch):
    return state.search_memories(search)


app.include_router(memory_router)

trade_router = APIRouter(prefix="/api/trades")


@trade_router.post("/", response_model=TradeMemory, status_code=201)
async def create_trade(request: TradeCreate):
    return state.create_trade(request)


@trade_router.get("/", response_model=List[TradeMemory])
async def list_trades(symbol: Optional[str] = None, outcome: Optional[OutcomeType] = None, limit: int = Query(50, ge=1, le=200)):
    results = list(state.trades.values())
    if symbol:
        results = [t for t in results if t.symbol == symbol]
    if outcome:
        results = [t for t in results if t.outcome == outcome]
    return sorted(results, key=lambda t: t.entry_time, reverse=True)[:limit]


@trade_router.post("/{trade_id}/close", response_model=TradeMemory)
async def close_trade(trade_id: str, exit_price: float):
    trade = state.close_trade(trade_id, exit_price)
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trade


app.include_router(trade_router)


@app.get("/api/statistics")
async def get_statistics():
    by_category = {}
    for m in state.memories.values():
        by_category[m.category.value] = by_category.get(m.category.value, 0) + 1
    closed = [t for t in state.trades.values() if t.pnl is not None]
    return {
        "total_memories": len(state.memories),
        "by_category": by_category,
        "total_trades": len(state.trades),
        "profitable_trades": len([t for t in closed if t.pnl and t.pnl > 0]),
        "avg_pnl": sum(t.pnl for t in closed if t.pnl) / len(closed) if closed else 0.0,
    }


@app.get("/")
async def root():
    return {"service": "AssetMind Financial Memory", "version": "1.0.0", "port": 5031}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5031)