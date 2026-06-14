"""
AssetMind - On-Chain Data Service
Port: 5017
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


app = FastAPI(title="AssetMind On-Chain Data Service", version="1.0.0")


class OnChainMetrics(BaseModel):
    symbol: str
    # Bitcoin specific
    hash_rate: Optional[float] = None
    difficulty: Optional[float] = None
    wallet_growth: Optional[float] = None
    # Ethereum specific
    gas_price_gwei: Optional[float] = None
    staking_rewards: Optional[float] = None
    # General
    active_addresses: Optional[int] = None
    transaction_count: Optional[int] = None
    volume_24h: Optional[float] = None
    exchange_inflow: Optional[float] = None
    exchange_outflow: Optional[float] = None
    whale_transactions: Optional[int] = None
    # DeFi
    tvl: Optional[float] = None
    dex_volume: Optional[float] = None
    # On-chain score
    on_chain_score: float = Field(50, ge=0, le=100)


MOCK_ONCHAIN = {
    "BTC": OnChainMetrics(
        symbol="BTC", hash_rate=580, difficulty=86.4e12,
        active_addresses=1_050_000, transaction_count=325_000,
        volume_24h=28.5e9, whale_transactions=45,
        exchange_inflow=8500, exchange_outflow=9200,
        on_chain_score=72
    ),
    "ETH": OnChainMetrics(
        symbol="ETH", gas_price_gwei=18.5, staking_rewards=3.8,
        active_addresses=480_000, transaction_count=1_200_000,
        volume_24h=12.8e9, whale_transactions=32,
        tvl=52e9, dex_volume=1.8e9,
        on_chain_score=68
    ),
    "SOL": OnChainMetrics(
        symbol="SOL", active_addresses=850_000, transaction_count=35_000_000,
        volume_24h=2.5e9, whale_transactions=15,
        tvl=3.8e9, dex_volume=450e6,
        on_chain_score=75
    ),
}


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-onchain",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5017,
        "sources": ["dune", "defillama", "glassnode"]
    }


@app.get("/onchain/{symbol}")
async def get_onchain_metrics(symbol: str):
    return MOCK_ONCHAIN.get(symbol.upper(), OnChainMetrics(symbol=symbol.upper()))


@app.get("/whale-activity")
async def get_whale_activity():
    """Get overall whale activity"""
    total_whales = sum(m.whale_transactions or 0 for m in MOCK_ONCHAIN.values())
    return {
        "total_whale_transactions": total_whales,
        "interpretation": "HIGH_ACTIVITY" if total_whales > 100 else "NORMAL",
        "assets": [
            {"symbol": m.symbol, "whale_tx": m.whale_transactions}
            for m in MOCK_ONCHAIN.values()
            if m.whale_transactions
        ]
    }


@app.get("/defi-metrics")
async def get_defi_metrics():
    """Get DeFi metrics"""
    total_tvl = sum(m.tvl or 0 for m in MOCK_ONCHAIN.values())
    total_dex = sum(m.dex_volume or 0 for m in MOCK_ONCHAIN.values())

    return {
        "total_tvl": total_tvl,
        "total_dex_volume_24h": total_dex,
        "assets": [
            {"symbol": m.symbol, "tvl": m.tvl, "dex_volume": m.dex_volume}
            for m in MOCK_ONCHAIN.values()
            if m.tvl or m.dex_volume
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5017)
