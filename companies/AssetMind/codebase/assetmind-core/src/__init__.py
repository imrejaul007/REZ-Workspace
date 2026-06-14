"""
AssetMind - Core Service
Port: 5000

Core business logic and shared utilities.

Features:
- Common models
- Shared utilities
- Base classes

Version: 1.0.0
"""

from fastapi import FastAPI

app = FastAPI(title="AssetMind Core")

# ============================================================================
# MODELS
# ============================================================================

class Symbol(BaseModel):
    symbol: str
    name: str
    exchange: str
    sector: str
    price: float
    change: float
    change_percent: float

class Portfolio(BaseModel):
    id: str
    name: str
    holdings: List[dict]
    total_value: float
    day_change: float

class Recommendation(BaseModel):
    symbol: str
    action: str  # BUY, HOLD, SELL
    confidence: float
    target_price: float
    reasoning: str

# ============================================================================
# ROUTES
# ============================================================================

@app.get("/health")
async def health():
    return {"service": "assetmind-core", "status": "healthy"}

@app.get("/symbols")
async def get_symbols():
    return {
        "symbols": [
            {"symbol": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "sector": "Technology", "price": 920.50},
            {"symbol": "AAPL", "name": "Apple Inc", "exchange": "NASDAQ", "sector": "Technology", "price": 185.25},
            {"symbol": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ", "sector": "Technology", "price": 425.50},
        ]
    }

@app.get("/recommendations")
async def get_recommendations():
    return {
        "recommendations": [
            {"symbol": "NVDA", "action": "BUY", "confidence": 0.82, "target": 1050},
            {"symbol": "AAPL", "action": "HOLD", "confidence": 0.65, "target": 200},
            {"symbol": "MSFT", "action": "BUY", "confidence": 0.75, "target": 500},
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
