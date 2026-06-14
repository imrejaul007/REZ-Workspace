"""
AssetMind Execution Service
Order execution and trade automation
Port: 5250
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
import logging
import uuid
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AssetMind Execution",
    description="Order execution and trade automation service",
    version="1.0.0",
)


# Enums
class ExecutionStatus(str, Enum):
    PENDING = "pending"
    ROUTING = "routing"
    FILLED = "filled"
    PARTIAL = "partial"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    FAILED = "failed"


class ExecutionType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"
    TRAILING_STOP = "trailing_stop"
    TWAP = "twap"
    VWAP = "vwap"
    POV = "pov"


class Broker(str, Enum):
    ALPACA = "alpaca"
    INTERACTIVE_BROKERS = "interactive_brokers"
    TRADING_VIEW = "trading_view"
    BINANCE = "binance"
    COINBASE = "coinbase"


class AutomationRule(str, Enum):
    PRICE_TRIGGER = "price_trigger"
    TIME_TRIGGER = "time_trigger"
    VOLUME_TRIGGER = "volume_trigger"
    INDICATOR_CROSSOVER = "indicator_crossover"
    PORTFOLIO_REBALANCE = "portfolio_rebalance"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"


# Pydantic Models
class ExecutionOrder(BaseModel):
    execution_id: str
    original_order_id: str
    user_id: str
    symbol: str
    side: str
    quantity: float
    execution_type: ExecutionType
    limit_price: Optional[float] = None
    stop_price: Optional[float] = None
    status: ExecutionStatus
    filled_quantity: float = 0.0
    avg_fill_price: Optional[float] = None
    commission: float = 0.0
    slippage: float = 0.0
    broker: Broker
    route_time_ms: int = 0
    created_at: datetime
    filled_at: Optional[datetime] = None


class ExecutionResult(BaseModel):
    execution_id: str
    success: bool
    status: ExecutionStatus
    filled_quantity: float
    fill_price: float
    commission: float
    slippage: float
    message: str
    timestamp: datetime


class AutomationRule(BaseModel):
    rule_id: str
    user_id: str
    name: str
    rule_type: AutomationRule
    conditions: Dict[str, Any]
    actions: List[Dict[str, Any]]
    enabled: bool = True
    last_triggered: Optional[datetime] = None
    created_at: datetime


class AutomationTrigger(BaseModel):
    trigger_id: str
    rule_id: str
    triggered_at: datetime
    conditions_matched: Dict[str, Any]
    actions_executed: List[Dict[str, Any]]
    success: bool


class BrokerConnection(BaseModel):
    broker: Broker
    connected: bool
    account_id: str
    account_name: str
    api_key_hash: str
    permissions: List[str]
    last_sync: Optional[datetime] = None
    status: str


class ExecutionReport(BaseModel):
    report_id: str
    period_start: datetime
    period_end: datetime
    total_executions: int
    total_volume: float
    total_commission: float
    avg_slippage: float
    fill_rate: float
    by_broker: Dict[str, Any]
    by_symbol: Dict[str, Any]
    errors: List[Dict[str, Any]]


class PaperTrade(BaseModel):
    trade_id: str
    user_id: str
    symbol: str
    side: str
    quantity: float
    price: float
    total_value: float
    commission: float
    strategy: str
    timestamp: datetime
    realized_pnl: Optional[float] = None


# In-memory storage
executions_db: Dict[str, ExecutionOrder] = {}
rules_db: Dict[str, AutomationRule] = {}
triggers_db: Dict[str, AutomationTrigger] = {}
paper_trades_db: Dict[str, PaperTrade] = {}
broker_connections: Dict[str, BrokerConnection] = {}


def simulate_execution(order: ExecutionOrder) -> ExecutionResult:
    """Simulate order execution"""
    execution_price = order.limit_price or (order.limit_price * 0.995 if order.side == "buy" else order.limit_price * 1.005)
    slippage = abs(execution_price - order.limit_price) if order.limit_price else random.uniform(0.01, 0.05)

    return ExecutionResult(
        execution_id=str(uuid.uuid4()),
        success=True,
        status=ExecutionStatus.FILLED,
        filled_quantity=order.quantity,
        fill_price=execution_price,
        commission=order.quantity * 0.001,
        slippage=slippage,
        message="Order filled successfully",
        timestamp=datetime.utcnow(),
    )


# API Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AssetMind Execution",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/api/v1/execute")
async def execute_order(
    user_id: str,
    original_order_id: str,
    symbol: str,
    side: str,
    quantity: float,
    execution_type: ExecutionType,
    broker: Broker,
    limit_price: Optional[float] = None,
    stop_price: Optional[float] = None
) -> ExecutionOrder:
    """Execute an order through broker"""
    execution_id = str(uuid.uuid4())

    order = ExecutionOrder(
        execution_id=execution_id,
        original_order_id=original_order_id,
        user_id=user_id,
        symbol=symbol,
        side=side,
        quantity=quantity,
        execution_type=execution_type,
        limit_price=limit_price,
        stop_price=stop_price,
        status=ExecutionStatus.PENDING,
        broker=broker,
        created_at=datetime.utcnow(),
    )

    executions_db[execution_id] = order

    result = simulate_execution(order)
    order.status = result.status
    order.filled_quantity = result.filled_quantity
    order.avg_fill_price = result.fill_price
    order.commission = result.commission
    order.slippage = result.slippage
    order.filled_at = result.timestamp

    return order


@app.get("/api/v1/executions/{user_id}")
async def get_executions(
    user_id: str,
    status: Optional[ExecutionStatus] = None,
    symbol: Optional[str] = None,
    limit: int = 50
) -> List[ExecutionOrder]:
    """Get execution history"""
    executions = [e for e in executions_db.values() if e.user_id == user_id]

    if status:
        executions = [e for e in executions if e.status == status]
    if symbol:
        executions = [e for e in executions if e.symbol == symbol]

    return sorted(executions, key=lambda x: x.created_at, reverse=True)[:limit]


@app.get("/api/v1/executions/detail/{execution_id}")
async def get_execution(execution_id: str) -> ExecutionOrder:
    """Get execution details"""
    if execution_id not in executions_db:
        raise HTTPException(status_code=404, detail="Execution not found")
    return executions_db[execution_id]


@app.post("/api/v1/executions/{execution_id}/cancel")
async def cancel_execution(execution_id: str) -> ExecutionOrder:
    """Cancel an execution"""
    if execution_id not in executions_db:
        raise HTTPException(status_code=404, detail="Execution not found")

    order = executions_db[execution_id]
    if order.status in [ExecutionStatus.FILLED, ExecutionStatus.CANCELLED, ExecutionStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Cannot cancel execution in current state")

    order.status = ExecutionStatus.CANCELLED
    return order


@app.get("/api/v1/automation/rules/{user_id}")
async def get_automation_rules(user_id: str) -> List[AutomationRule]:
    """Get user's automation rules"""
    return [r for r in rules_db.values() if r.user_id == user_id]


@app.post("/api/v1/automation/rules")
async def create_automation_rule(user_id: str, rule: AutomationRule) -> AutomationRule:
    """Create new automation rule"""
    rule.rule_id = str(uuid.uuid4())
    rule.user_id = user_id
    rule.created_at = datetime.utcnow()
    rules_db[rule.rule_id] = rule
    return rule


@app.put("/api/v1/automation/rules/{rule_id}")
async def update_automation_rule(rule_id: str, rule: AutomationRule) -> AutomationRule:
    """Update automation rule"""
    if rule_id not in rules_db:
        raise HTTPException(status_code=404, detail="Rule not found")
    rules_db[rule_id] = rule
    return rule


@app.delete("/api/v1/automation/rules/{rule_id}")
async def delete_automation_rule(rule_id: str) -> Dict[str, Any]:
    """Delete automation rule"""
    if rule_id not in rules_db:
        raise HTTPException(status_code=404, detail="Rule not found")
    del rules_db[rule_id]
    return {"rule_id": rule_id, "deleted": True}


@app.post("/api/v1/automation/rules/{rule_id}/trigger")
async def trigger_rule(rule_id: str) -> AutomationTrigger:
    """Manually trigger automation rule"""
    if rule_id not in rules_db:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule = rules_db[rule_id]
    trigger = AutomationTrigger(
        trigger_id=str(uuid.uuid4()),
        rule_id=rule_id,
        triggered_at=datetime.utcnow(),
        conditions_matched=rule.conditions,
        actions_executed=rule.actions,
        success=True,
    )

    triggers_db[trigger.trigger_id] = trigger
    rule.last_triggered = datetime.utcnow()
    rules_db[rule_id] = rule

    return trigger


@app.get("/api/v1/brokers")
async def get_brokers() -> List[Broker]:
    """List available brokers"""
    return list(Broker)


@app.post("/api/v1/brokers/connect")
async def connect_broker(
    broker: Broker,
    api_key: str,
    api_secret: str,
    user_id: str
) -> BrokerConnection:
    """Connect to broker"""
    connection = BrokerConnection(
        broker=broker,
        connected=True,
        account_id=f"acc_{str(uuid.uuid4())[:8]}",
        account_name=f"{broker.value} Trading Account",
        api_key_hash=api_key[:8] + "...",
        permissions=["read", "trade", "account"],
        last_sync=datetime.utcnow(),
        status="active",
    )

    broker_connections[f"{user_id}_{broker.value}"] = connection
    return connection


@app.get("/api/v1/brokers/{user_id}")
async def get_user_brokers(user_id: str) -> List[BrokerConnection]:
    """Get user's broker connections"""
    return [c for k, c in broker_connections.items() if k.startswith(user_id)]


@app.delete("/api/v1/brokers/{user_id}/{broker}")
async def disconnect_broker(user_id: str, broker: Broker) -> Dict[str, Any]:
    """Disconnect broker"""
    key = f"{user_id}_{broker.value}"
    if key in broker_connections:
        del broker_connections[key]
    return {"broker": broker.value, "disconnected": True}


@app.post("/api/v1/paper-trade")
async def execute_paper_trade(
    user_id: str,
    symbol: str,
    side: str,
    quantity: float,
    price: float,
    strategy: str
) -> PaperTrade:
    """Execute paper trade"""
    trade = PaperTrade(
        trade_id=str(uuid.uuid4()),
        user_id=user_id,
        symbol=symbol,
        side=side,
        quantity=quantity,
        price=price,
        total_value=quantity * price,
        commission=quantity * price * 0.001,
        strategy=strategy,
        timestamp=datetime.utcnow(),
    )

    paper_trades_db[trade.trade_id] = trade
    return trade


@app.get("/api/v1/paper-trades/{user_id}")
async def get_paper_trades(
    user_id: str,
    symbol: Optional[str] = None,
    limit: int = 50
) -> List[PaperTrade]:
    """Get paper trades"""
    trades = [t for t in paper_trades_db.values() if t.user_id == user_id]
    if symbol:
        trades = [t for t in trades if t.symbol == symbol]
    return sorted(trades, key=lambda x: x.timestamp, reverse=True)[:limit]


@app.get("/api/v1/execution-report")
async def get_execution_report(
    period_start: datetime,
    period_end: datetime
) -> ExecutionReport:
    """Generate execution report"""
    executions = [e for e in executions_db.values()
                  if period_start <= e.created_at <= period_end]

    return ExecutionReport(
        report_id=str(uuid.uuid4()),
        period_start=period_start,
        period_end=period_end,
        total_executions=len(executions),
        total_volume=sum(e.quantity * (e.avg_fill_price or 0) for e in executions),
        total_commission=sum(e.commission for e in executions),
        avg_slippage=sum(e.slippage for e in executions) / len(executions) if executions else 0,
        fill_rate=len([e for e in executions if e.status == ExecutionStatus.FILLED]) / len(executions) if executions else 0,
        by_broker={"alpaca": 45, "binance": 23},
        by_symbol={"AAPL": 15, "MSFT": 12, "GOOGL": 8},
        errors=[],
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5250)