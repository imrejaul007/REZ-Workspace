"""
AssetMind - Data Connectors
Port: 5010

Real-time and historical market data.

Connectors:
- Yahoo Finance
- Alpha Vantage
- News API
- SEC EDGAR
- FRED

Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI(title="AssetMind Data Connectors")

class Candle(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: int

@app.get("/health")
async def health():
    return {"service": "data-connectors", "status": "healthy"}

@app.get("/stock/{symbol}/candles")
async def get_candles(symbol: str, interval: str = "1d") -> List[Candle]:
    # Mock candles
    return [
        Candle(timestamp="2024-01-01", open=100, high=105, low=98, close=103, volume=1000000)
    ]

@app.get("/stock/{symbol}/quote")
async def get_quote(symbol: str):
    return {
        "symbol": symbol,
        "price": 150.25,
        "change": 2.5,
        "change_percent": 1.7
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5010)
