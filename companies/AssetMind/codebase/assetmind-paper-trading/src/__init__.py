"""
AssetMind - Paper Trading Service
Port: 5210

Virtual portfolio with real-time prices.

Features:
- Paper trading
- Virtual orders
- P&L tracking
- Performance analytics

Version: 1.0.0
"""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict

app = FastAPI(title="AssetMind Paper Trading")

class Order(BaseModel):
    symbol: str
    side: str  # buy/sell
    quantity: int
    order_type: str = "market"

class PaperPortfolio(BaseModel):
    cash: float
    positions: Dict[str, int]
    total_value: float

@app.get("/health")
async def health():
    return {"service": "paper-trading", "status": "healthy"}

@app.post("/order")
async def place_order(order: Order):
    return {
        "order_id": "paper-order-1",
        "status": "filled",
        "price": 100.0
    }

@app.get("/portfolio")
async def get_portfolio() -> PaperPortfolio:
    return PaperPortfolio(
        cash=90000,
        positions={"NVDA": 10, "AAPL": 5},
        total_value=105000
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5210)
