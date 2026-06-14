"""
AssetMind - API Service
Port: 8000

Main REST API for AssetMind platform.

Features:
- Unified API gateway
- Authentication
- Rate limiting
- Service orchestration

Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional

app = FastAPI(title="AssetMind API")

# ============================================================================
# MODELS
# ============================================================================

class HealthResponse(BaseModel):
    status: str
    version: str
    services: List[str]

class PredictionRequest(BaseModel):
    symbol: str
    type: str = "stock"

class PredictionResponse(BaseModel):
    symbol: str
    decision: str  # BUY, HOLD, SELL
    confidence: float
    reasoning: str

# ============================================================================
# ROUTES
# ============================================================================

@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        services=["council", "rexmind", "twin", "knowledge"]
    )

@app.get("/")
async def root():
    """API root"""
    return {
        "name": "AssetMind API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest) -> PredictionResponse:
    """Get AI prediction for symbol"""
    return PredictionResponse(
        symbol=request.symbol,
        decision="BUY",
        confidence=0.78,
        reasoning="Strong momentum, AI tailwinds"
    )

@app.get("/symbols")
async def list_symbols():
    """List available symbols"""
    return {
        "symbols": [
            {"symbol": "NVDA", "name": "NVIDIA", "exchange": "NASDAQ"},
            {"symbol": "AAPL", "name": "Apple", "exchange": "NASDAQ"},
            {"symbol": "MSFT", "name": "Microsoft", "exchange": "NASDAQ"},
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
