"""
AssetMind - Asset Universe Service
Main service for managing the asset registry

Port: 5001

Version: 1.0
Date: June 5, 2026
"""

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from models.asset import (
    Asset, AssetClass, AssetStatus,
    PHASE1_ASSET_UNIVERSE, YAHOO_FINANCE_SYMBOLS,
    COINGECKO_SYMBOLS, FOREX_PAIRS, COMMODITIES
)

app = FastAPI(title="AssetMind Asset Universe Service", version="1.0.0")

# In-memory storage (replace with PostgreSQL in production)
asset_store: Dict[str, Asset] = {}


# ============================================================================
# Pydantic Models
# ============================================================================

class AssetCreateRequest(BaseModel):
    symbol: str
    name: str
    asset_class: AssetClass
    sub_type: Optional[str] = None
    exchange: Optional[str] = None
    country: Optional[str] = None
    currency: str = "USD"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AssetUpdateRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[AssetStatus] = None
    metadata: Optional[Dict[str, Any]] = None


class AssetSearchQuery(BaseModel):
    query: str
    asset_class: Optional[AssetClass] = None
    exchange: Optional[str] = None
    limit: int = 20


class AssetResponse(BaseModel):
    id: str
    symbol: str
    name: str
    asset_class: str
    sub_type: Optional[str]
    exchange: Optional[str]
    country: Optional[str]
    currency: str
    status: str
    twin_id: Optional[str]
    created_at: datetime
    updated_at: datetime


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "service": "assetmind-asset-universe",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5001,
        "total_assets": len(asset_store)
    }


# ============================================================================
# Asset CRUD Operations
# ============================================================================

@app.post("/assets", response_model=AssetResponse, status_code=201)
async def create_asset(request: AssetCreateRequest):
    """Register a new asset in the universe"""

    # Check if already exists
    if request.symbol in asset_store:
        raise HTTPException(
            status_code=409,
            detail=f"Asset with symbol {request.symbol} already exists"
        )

    # Create asset
    asset = Asset(
        symbol=request.symbol,
        name=request.name,
        asset_class=request.asset_class,
        sub_type=request.sub_type,
        exchange=request.exchange,
        country=request.country,
        currency=request.currency,
        metadata=request.metadata
    )

    asset_store[asset.symbol] = asset

    return AssetResponse(
        id=asset.id,
        symbol=asset.symbol,
        name=asset.name,
        asset_class=asset.asset_class,
        sub_type=asset.sub_type,
        exchange=asset.exchange,
        country=asset.country,
        currency=asset.currency,
        status=asset.status,
        twin_id=asset.twin_id,
        created_at=asset.created_at,
        updated_at=asset.updated_at
    )


@app.get("/assets/{symbol}", response_model=AssetResponse)
async def get_asset(symbol: str):
    """Get asset by symbol"""

    asset = asset_store.get(symbol)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    return AssetResponse(
        id=asset.id,
        symbol=asset.symbol,
        name=asset.name,
        asset_class=asset.asset_class,
        sub_type=asset.sub_type,
        exchange=asset.exchange,
        country=asset.country,
        currency=asset.currency,
        status=asset.status,
        twin_id=asset.twin_id,
        created_at=asset.created_at,
        updated_at=asset.updated_at
    )


@app.get("/assets", response_model=List[AssetResponse])
async def list_assets(
    asset_class: Optional[AssetClass] = None,
    exchange: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """List assets with optional filters"""

    assets = list(asset_store.values())

    # Apply filters
    if asset_class:
        assets = [a for a in assets if a.asset_class == asset_class]
    if exchange:
        assets = [a for a in assets if a.exchange == exchange]

    # Apply pagination
    assets = assets[offset:offset + limit]

    return [
        AssetResponse(
            id=a.id,
            symbol=a.symbol,
            name=a.name,
            asset_class=a.asset_class,
            sub_type=a.sub_type,
            exchange=a.exchange,
            country=a.country,
            currency=a.currency,
            status=a.status,
            twin_id=a.twin_id,
            created_at=a.created_at,
            updated_at=a.updated_at
        )
        for a in assets
    ]


@app.patch("/assets/{symbol}", response_model=AssetResponse)
async def update_asset(symbol: str, request: AssetUpdateRequest):
    """Update an existing asset"""

    asset = asset_store.get(symbol)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Update fields
    if request.name is not None:
        asset.name = request.name
    if request.status is not None:
        asset.status = request.status
    if request.metadata is not None:
        asset.metadata.update(request.metadata)

    asset.updated_at = datetime.utcnow()

    return AssetResponse(
        id=asset.id,
        symbol=asset.symbol,
        name=asset.name,
        asset_class=asset.asset_class,
        sub_type=asset.sub_type,
        exchange=asset.exchange,
        country=asset.country,
        currency=asset.currency,
        status=asset.status,
        twin_id=asset.twin_id,
        created_at=asset.created_at,
        updated_at=asset.updated_at
    )


@app.get("/search", response_model=List[AssetResponse])
async def search_assets(query: str, limit: int = 20):
    """Search assets by symbol or name"""

    query_lower = query.lower()
    results = [
        a for a in asset_store.values()
        if query_lower in a.symbol.lower() or query_lower in a.name.lower()
    ][:limit]

    return [
        AssetResponse(
            id=a.id,
            symbol=a.symbol,
            name=a.name,
            asset_class=a.asset_class,
            sub_type=a.sub_type,
            exchange=a.exchange,
            country=a.country,
            currency=a.currency,
            status=a.status,
            twin_id=a.twin_id,
            created_at=a.created_at,
            updated_at=a.updated_at
        )
        for a in results
    ]


# ============================================================================
# Statistics
# ============================================================================

@app.get("/stats")
async def get_stats():
    """Get asset universe statistics"""

    by_class = {}
    for asset in asset_store.values():
        asset_class = asset.asset_class
        by_class[asset_class] = by_class.get(asset_class, 0) + 1

    return {
        "total_assets": len(asset_store),
        "by_asset_class": by_class,
        "phase1_target": PHASE1_ASSET_UNIVERSE,
        "phase1_progress": len(asset_store) / PHASE1_ASSET_UNIVERSE["total"]
    }


# ============================================================================
# Bootstrap Phase 1 Assets
# ============================================================================

@app.post("/bootstrap/phase1")
async def bootstrap_phase1():
    """Bootstrap Phase 1 asset universe"""

    added = 0

    # Add stocks
    for symbol, name in YAHOO_FINANCE_SYMBOLS.items():
        if symbol not in asset_store:
            asset = Asset(
                symbol=symbol,
                name=name,
                asset_class=AssetClass.STOCK,
                exchange="NASDAQ" if symbol not in ["BRK.B"] else "NYSE",
                country="US",
                currency="USD"
            )
            asset_store[symbol] = asset
            added += 1

    # Add crypto
    for symbol, name in COINGECKO_SYMBOLS.items():
        if symbol not in asset_store:
            asset = Asset(
                symbol=symbol,
                name=name,
                asset_class=AssetClass.CRYPTO,
                sub_type="SPOT",
                exchange="GLOBAL",
                country="GLOBAL",
                currency="USD"
            )
            asset_store[symbol] = asset
            added += 1

    # Add forex
    for symbol, name in FOREX_PAIRS.items():
        if symbol not in asset_store:
            asset = Asset(
                symbol=symbol,
                name=name,
                asset_class=AssetClass.FOREX,
                sub_type="MAJOR" if symbol.startswith("USD") or symbol.startswith("EUR") else "MINOR",
                exchange="FOREX",
                country="GLOBAL",
                currency="USD"
            )
            asset_store[symbol] = asset
            added += 1

    # Add commodities
    for symbol, name in COMMODITIES.items():
        if symbol not in asset_store:
            asset = Asset(
                symbol=symbol,
                name=name,
                asset_class=AssetClass.COMMODITY,
                exchange="COMEX" if symbol in ["GC", "SI", "PL", "PA"] else "NYMEX",
                country="US",
                currency="USD"
            )
            asset_store[symbol] = asset
            added += 1

    return {
        "message": f"Bootstrap complete",
        "assets_added": added,
        "total_assets": len(asset_store)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
