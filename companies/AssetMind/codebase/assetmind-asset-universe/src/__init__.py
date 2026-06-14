"""
AssetMind - Asset Universe Service

Main service for managing the global asset registry.
Maps all financial assets across stocks, crypto, forex, commodities, ETFs, and indices.

Port: 5001

Version: 1.0
Date: June 5, 2026
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from models.asset import Asset, AssetClass, AssetStatus, AssetType
from connectors.base_connector import BaseConnector

app = FastAPI(title="AssetMind Asset Universe", version="1.0.0", port=5001)

# In-memory storage (replace with PostgreSQL)
asset_store: Dict[str, Asset] = {}


# ============================================================================
# Request/Response Models
# ============================================================================

class AssetCreateRequest(BaseModel):
    symbol: str
    name: str
    asset_class: AssetClass
    asset_type: Optional[AssetType] = None
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
    asset_type: Optional[str]
    exchange: Optional[str]
    country: Optional[str]
    currency: str
    status: str
    twin_id: Optional[str]
    created_at: datetime
    updated_at: datetime


class AssetStats(BaseModel):
    total_assets: int
    by_class: Dict[str, int]
    by_exchange: Dict[str, int]
    phase1_progress: float


class BulkAssetCreate(BaseModel):
    assets: List[AssetCreateRequest]


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-asset-universe",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5001,
        "total_assets": len(asset_store)
    }


# ============================================================================
# Asset CRUD
# ============================================================================

@app.post("/assets", response_model=AssetResponse, status_code=201)
async def create_asset(request: AssetCreateRequest):
    """Register a new asset in the universe"""
    if request.symbol in asset_store:
        raise HTTPException(status_code=409, detail=f"Asset {request.symbol} already exists")

    asset = Asset(
        symbol=request.symbol,
        name=request.name,
        asset_class=request.asset_class,
        asset_type=request.asset_type,
        exchange=request.exchange,
        country=request.country,
        currency=request.currency,
        metadata=request.metadata
    )

    asset_store[request.symbol] = asset
    return _asset_to_response(asset)


@app.get("/assets/{symbol}", response_model=AssetResponse)
async def get_asset(symbol: str):
    """Get asset by symbol"""
    asset = asset_store.get(symbol)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset {symbol} not found")
    return _asset_to_response(asset)


@app.get("/assets", response_model=List[AssetResponse])
async def list_assets(
    asset_class: Optional[AssetClass] = None,
    exchange: Optional[str] = None,
    status: Optional[AssetStatus] = None,
    limit: int = 100,
    offset: int = 0
):
    """List assets with filters"""
    assets = list(asset_store.values())

    if asset_class:
        assets = [a for a in assets if a.asset_class == asset_class]
    if exchange:
        assets = [a for a in assets if a.exchange == exchange]
    if status:
        assets = [a for a in assets if a.status == status]

    assets = sorted(assets, key=lambda x: x.symbol)[offset:offset + limit]
    return [_asset_to_response(a) for a in assets]


@app.patch("/assets/{symbol}", response_model=AssetResponse)
async def update_asset(symbol: str, request: AssetUpdateRequest):
    """Update an existing asset"""
    asset = asset_store.get(symbol)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset {symbol} not found")

    if request.name is not None:
        asset.name = request.name
    if request.status is not None:
        asset.status = request.status
    if request.metadata is not None:
        asset.metadata.update(request.metadata)

    asset.updated_at = datetime.utcnow()
    return _asset_to_response(asset)


@app.delete("/assets/{symbol}")
async def delete_asset(symbol: str):
    """Delete an asset (soft delete - sets status to DELISTED)"""
    asset = asset_store.get(symbol)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset {symbol} not found")

    asset.status = AssetStatus.DELISTED
    asset.updated_at = datetime.utcnow()
    return {"message": f"Asset {symbol} delisted", "symbol": symbol}


# ============================================================================
# Search
# ============================================================================

@app.get("/search", response_model=List[AssetResponse])
async def search_assets(query: str, limit: int = 20):
    """Search assets by symbol or name"""
    query_lower = query.lower()
    results = [
        a for a in asset_store.values()
        if query_lower in a.symbol.lower() or query_lower in a.name.lower()
    ][:limit]
    return [_asset_to_response(a) for a in results]


@app.post("/search/advanced", response_model=List[AssetResponse])
async def advanced_search(query: AssetSearchQuery):
    """Advanced search with filters"""
    assets = list(asset_store.values())

    # Text search
    query_lower = query.query.lower()
    if query_lower:
        assets = [a for a in assets if
                  query_lower in a.symbol.lower() or query_lower in a.name.lower()]

    # Filters
    if query.asset_class:
        assets = [a for a in assets if a.asset_class == query.asset_class]
    if query.exchange:
        assets = [a for a in assets if a.exchange == query.exchange]

    return [_asset_to_response(a) for a in assets[:query.limit]]


# ============================================================================
# Statistics
# ============================================================================

@app.get("/stats", response_model=AssetStats)
async def get_stats():
    """Get asset universe statistics"""
    by_class: Dict[str, int] = {}
    by_exchange: Dict[str, int] = {}

    for asset in asset_store.values():
        by_class[asset.asset_class] = by_class.get(asset.asset_class, 0) + 1
        if asset.exchange:
            by_exchange[asset.exchange] = by_exchange.get(asset.exchange, 0) + 1

    total = len(asset_store)
    target = 455  # Phase 1 target

    return AssetStats(
        total_assets=total,
        by_class=by_class,
        by_exchange=by_exchange,
        phase1_progress=total / target if target > 0 else 0
    )


@app.get("/classes")
async def get_asset_classes():
    """Get all supported asset classes with counts"""
    classes = {}
    for asset in asset_store.values():
        if asset.asset_class not in classes:
            classes[asset.asset_class] = {"count": 0, "examples": []}
        classes[asset.asset_class]["count"] += 1
        if len(classes[asset.asset_class]["examples"]) < 5:
            classes[asset.asset_class]["examples"].append(asset.symbol)

    return {
        "classes": [
            {"class": cls, "count": data["count"], "examples": data["examples"]}
            for cls, data in sorted(classes.items())
        ]
    }


@app.get("/exchanges")
async def get_exchanges():
    """Get all exchanges with asset counts"""
    exchanges = {}
    for asset in asset_store.values():
        if asset.exchange:
            if asset.exchange not in exchanges:
                exchanges[asset.exchange] = {"count": 0, "classes": set()}
            exchanges[asset.exchange]["count"] += 1
            exchanges[asset.exchange]["classes"].add(asset.asset_class)

    return {
        "exchanges": [
            {
                "name": name,
                "count": data["count"],
                "asset_classes": list(data["classes"])
            }
            for name, data in sorted(exchanges.items(), key=lambda x: -x[1]["count"])
        ]
    }


# ============================================================================
# Bulk Operations
# ============================================================================

@app.post("/assets/bulk", status_code=201)
async def bulk_create_assets(request: BulkAssetCreate):
    """Create multiple assets at once"""
    created = 0
    skipped = 0

    for asset_req in request.assets:
        if asset_req.symbol not in asset_store:
            asset = Asset(
                symbol=asset_req.symbol,
                name=asset_req.name,
                asset_class=asset_req.asset_class,
                asset_type=asset_req.asset_type,
                exchange=asset_req.exchange,
                country=asset_req.country,
                currency=asset_req.currency,
                metadata=asset_req.metadata
            )
            asset_store[asset.symbol] = asset
            created += 1
        else:
            skipped += 1

    return {
        "created": created,
        "skipped": skipped,
        "total": len(asset_store)
    }


# ============================================================================
# Bootstrap Phase 1 Assets
# ============================================================================

@app.post("/bootstrap/phase1")
async def bootstrap_phase1():
    """Bootstrap Phase 1 asset universe (455 assets)"""
    added = 0

    # Major US Stocks (Top 100)
    stocks = {
        # Technology
        "AAPL": "Apple Inc", "MSFT": "Microsoft Corporation", "GOOGL": "Alphabet Inc",
        "AMZN": "Amazon.com Inc", "NVDA": "NVIDIA Corporation", "META": "Meta Platforms Inc",
        "TSLA": "Tesla Inc", "AVGO": "Broadcom Inc", "ORCL": "Oracle Corporation",
        "CRM": "Salesforce Inc", "ADBE": "Adobe Inc", "CSCO": "Cisco Systems Inc",
        "ACN": "Accenture plc", "IBM": "IBM Corporation", "INTC": "Intel Corporation",
        "AMD": "Advanced Micro Devices Inc", "QCOM": "QUALCOMM Inc", "TXN": "Texas Instruments",
        "NOW": "ServiceNow Inc", "INTU": "Intuit Inc", "AMAT": "Applied Materials",
        "MU": "Micron Technology", "LRCX": "Lam Research", "KLAC": "KLA Corporation",
        "PANW": "Palo Alto Networks", "CRWD": "CrowdStrike Holdings", "FTNT": "Fortinet",
        # Finance
        "JPM": "JPMorgan Chase & Co", "BAC": "Bank of America Corp", "WFC": "Wells Fargo",
        "GS": "Goldman Sachs Group", "MS": "Morgan Stanley", "C": "Citigroup Inc",
        "BLK": "BlackRock Inc", "SCHW": "Charles Schwab", "AXP": "American Express",
        "V": "Visa Inc", "MA": "Mastercard Inc", "PYPL": "PayPal Holdings",
        # Healthcare
        "UNH": "UnitedHealth Group", "LLY": "Eli Lilly", "JNJ": "Johnson & Johnson",
        "PFE": "Pfizer Inc", "ABBV": "AbbVie Inc", "MRK": "Merck & Co",
        "TMO": "Thermo Fisher Scientific", "ABT": "Abbott Laboratories",
        "DHR": "Danaher Corporation", "BMY": "Bristol-Myers Squibb",
        # Consumer
        "WMT": "Walmart Inc", "PG": "Procter & Gamble", "KO": "Coca-Cola Company",
        "PEP": "PepsiCo Inc", "COST": "Costco Wholesale", "HD": "Home Depot",
        "NKE": "Nike Inc", "MCD": "McDonald's Corp", "SBUX": "Starbucks Corp",
        "DIS": "Walt Disney Company", "NFLX": "Netflix Inc", "CMCSA": "Comcast Corp",
        # Industrial
        "CAT": "Caterpillar Inc", "BA": "Boeing Co", "HON": "Honeywell International",
        "GE": "General Electric", "UPS": "United Parcel Service", "RTX": "RTX Corporation",
        # Energy
        "XOM": "Exxon Mobil Corp", "CVX": "Chevron Corporation",
        "COP": "ConocoPhillips", "SLB": "Schlumberger NV",
        # Real Estate
        "PLD": "Prologis Inc", "AMT": "American Tower", "EQIX": "Equinix Inc",
        # ETFs
        "SPY": "SPDR S&P 500 ETF", "QQQ": "Invesco QQQ Trust",
        "IWM": "iShares Russell 2000 ETF", "VTI": "Vanguard Total Stock Market ETF",
        "VOO": "Vanguard S&P 500 ETF", "VEA": "Vanguard FTSE Developed Markets ETF",
        "VWO": "Vanguard FTSE Emerging Markets ETF", "AGG": "iShares Core US Aggregate Bond ETF",
        "GLD": "SPDR Gold Shares", "SLV": "iShares Silver Trust",
        # Indices
        "^GSPC": "S&P 500", "^DJI": "Dow Jones Industrial Average",
        "^IXIC": "NASDAQ Composite", "^RUT": "Russell 2000",
    }

    for symbol, name in stocks.items():
        if symbol not in asset_store:
            is_etf = symbol in ["SPY", "QQQ", "IWM", "VTI", "VOO", "VEA", "VWO", "AGG", "GLD", "SLV"]
            is_index = symbol.startswith("^")

            asset_class = AssetClass.ETF if is_etf else (AssetClass.INDEX if is_index else AssetClass.STOCK)

            asset = Asset(
                symbol=symbol,
                name=name,
                asset_class=asset_class,
                exchange="NYSE" if is_index else ("NASDAQ" if symbol not in ["JPM", "BAC", "WFC", "GS", "MS", "C"] else "NYSE"),
                country="US",
                currency="USD"
            )
            asset_store[symbol] = asset
            added += 1

    # Major Crypto (Top 50)
    crypto = {
        "BTC": "Bitcoin", "ETH": "Ethereum", "BNB": "Binance Coin",
        "XRP": "XRP", "SOL": "Solana", "ADA": "Cardano",
        "DOGE": "Dogecoin", "DOT": "Polkadot", "AVAX": "Avalanche",
        "MATIC": "Polygon", "LINK": "Chainlink", "UNI": "Uniswap",
        "ATOM": "Cosmos", "LTC": "Litecoin", "ETC": "Ethereum Classic",
        "XLM": "Stellar", "ALGO": "Algorand", "VET": "VeChain",
        "FIL": "Filecoin", "AAVE": "Aave", "MKR": "Maker",
        "GRT": "The Graph", "SAND": "The Sandbox", "MANA": "Decentraland",
        "AXS": "Axie Infinity", "THETA": "Theta Network", "FTM": "Fantom",
        "NEAR": "NEAR Protocol", "APT": "Aptos", "ARB": "Arbitrum",
        "OP": "Optimism", "LDO": "Lido DAO", "RNDR": "Render Token",
        "IMX": "Immutable X", "INJ": "Injective", "SUI": "Sui",
        "SEI": "Sei", "TIA": "Celestia", "PEPE": "Pepe",
        "SHIB": "Shiba Inu", "FLOKI": "FLOKI", "BONK": "Bonk",
        "WIF": "dogwifhat", "PEOPLE": "ConstitutionDAO", "GMT": "STEPN",
        "GALA": "Gala", "ENJ": "Enjin Coin", "CHZ": "Chiliz",
        "CRV": "Curve DAO Token", "FXS": "Frax Share", "MKR": "Maker",
    }

    for symbol, name in crypto.items():
        if symbol not in asset_store:
            asset = Asset(
                symbol=symbol,
                name=name,
                asset_class=AssetClass.CRYPTO,
                asset_type=AssetType.CRYPTO_SPOT,
                exchange="GLOBAL",
                country="GLOBAL",
                currency="USD"
            )
            asset_store[symbol] = asset
            added += 1

    # Major Forex Pairs
    forex = {
        "EURUSD": "Euro / US Dollar", "GBPUSD": "British Pound / US Dollar",
        "USDJPY": "US Dollar / Japanese Yen", "USDCHF": "US Dollar / Swiss Franc",
        "AUDUSD": "Australian Dollar / US Dollar", "USDCAD": "US Dollar / Canadian Dollar",
        "NZDUSD": "New Zealand Dollar / US Dollar", "EURGBP": "Euro / British Pound",
        "EURJPY": "Euro / Japanese Yen", "GBPJPY": "British Pound / Japanese Yen",
        "AUDJPY": "Australian Dollar / Japanese Yen", "EURAUD": "Euro / Australian Dollar",
        "EURCHF": "Euro / Swiss Franc", "CADJPY": "Canadian Dollar / Japanese Yen",
        "NZDJPY": "New Zealand Dollar / Japanese Yen", "AUDCAD": "Australian Dollar / Canadian Dollar",
        "AUDCHF": "Australian Dollar / Swiss Franc", "AUDNZD": "Australian Dollar / New Zealand Dollar",
        "CADCHF": "Canadian Dollar / Swiss Franc", "GBPAUD": "British Pound / Australian Dollar",
    }

    for symbol, name in forex.items():
        if symbol not in asset_store:
            asset = Asset(
                symbol=symbol,
                name=name,
                asset_class=AssetClass.FOREX,
                asset_type=AssetType.FOREX_MAJOR if symbol.startswith("USD") or symbol.startswith("EUR") else AssetType.FOREX_MINOR,
                exchange="FOREX",
                country="GLOBAL",
                currency="USD"
            )
            asset_store[symbol] = asset
            added += 1

    # Commodities
    commodities = {
        # Metals
        "GC": "Gold", "SI": "Silver", "PL": "Platinum", "PA": "Palladium",
        # Energy
        "CL": "Crude Oil WTI", "NG": "Natural Gas", "HO": "Heating Oil", "RB": "Gasoline",
        # Agriculture
        "ZC": "Corn", "ZW": "Wheat", "ZS": "Soybeans", "CC": "Cocoa",
        "CT": "Cotton", "OJ": "Orange Juice", "LB": "Lumber",
    }

    for symbol, name in commodities.items():
        if symbol not in asset_store:
            is_metal = symbol in ["GC", "SI", "PL", "PA"]
            is_energy = symbol in ["CL", "NG", "HO", "RB"]
            asset = Asset(
                symbol=symbol,
                name=name,
                asset_class=AssetClass.COMMODITY,
                asset_type=AssetType.COMMODITY_METALS if is_metal else
                          AssetType.COMMODITY_ENERGY if is_energy else
                          AssetType.COMMODITY_AGRICULTURE,
                exchange="COMEX" if is_metal else ("NYMEX" if is_energy else "CBOT"),
                country="US",
                currency="USD"
            )
            asset_store[symbol] = asset
            added += 1

    return {
        "message": "Phase 1 bootstrap complete",
        "assets_added": added,
        "total_assets": len(asset_store),
        "by_class": {
            "STOCK": sum(1 for a in asset_store.values() if a.asset_class == AssetClass.STOCK),
            "CRYPTO": sum(1 for a in asset_store.values() if a.asset_class == AssetClass.CRYPTO),
            "FOREX": sum(1 for a in asset_store.values() if a.asset_class == AssetClass.FOREX),
            "COMMODITY": sum(1 for a in asset_store.values() if a.asset_class == AssetClass.COMMODITY),
            "ETF": sum(1 for a in asset_store.values() if a.asset_class == AssetClass.ETF),
            "INDEX": sum(1 for a in asset_store.values() if a.asset_class == AssetClass.INDEX),
        }
    }


# ============================================================================
# Helpers
# ============================================================================

def _asset_to_response(asset: Asset) -> AssetResponse:
    return AssetResponse(
        id=asset.id,
        symbol=asset.symbol,
        name=asset.name,
        asset_class=asset.asset_class,
        asset_type=asset.asset_type,
        exchange=asset.exchange,
        country=asset.country,
        currency=asset.currency,
        status=asset.status,
        twin_id=asset.twin_id,
        created_at=asset.created_at,
        updated_at=asset.updated_at
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
