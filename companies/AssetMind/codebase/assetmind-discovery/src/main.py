"""
AssetMind Discovery Service
Asset discovery and management platform
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind Discovery",
    description="Asset discovery and management service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Enums
# ============================================================================

class AssetType(str, Enum):
    TANGIBLE = "tangible"          # Physical assets (property, equipment)
    FINANCIAL = "financial"         # Stocks, bonds, funds
    DIGITAL = "digital"            # Crypto, tokens, NFTs
    INTANGIBLE = "intangible"      # Patents, trademarks, goodwill
    COMMODITY = "commodity"       # Gold, oil, agricultural

class AssetStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    VALUING = "valuing"
    LISTED = "listed"
    SOLD = "sold"
    ARCHIVED = "archived"

class DiscoverySource(str, Enum):
    API = "api"
    MANUAL = "manual"
    AUTOMATED = "automated"
    ACQUISITION = "acquisition"
    PARTNERSHIP = "partnership"

# ============================================================================
# Pydantic Models
# ============================================================================

class Location(BaseModel):
    country: str
    region: Optional[str] = None
    city: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None

class ValuationEstimate(BaseModel):
    amount: float
    currency: str = "USD"
    methodology: str
    confidence: float = Field(ge=0.0, le=1.0)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class AssetMetadata(BaseModel):
    tags: List[str] = []
    sector: Optional[str] = None
    industry: Optional[str] = None
    risk_class: Optional[str] = None
    sustainability_score: Optional[float] = None

class Asset(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    asset_type: AssetType
    status: AssetStatus = AssetStatus.PENDING

    # Ownership
    owner_id: str
    owner_name: str
    acquisition_date: Optional[datetime] = None
    acquisition_value: Optional[float] = None

    # Location
    location: Optional[Location] = None

    # Valuation
    current_value: Optional[float] = None
    valuation: Optional[ValuationEstimate] = None

    # Metadata
    metadata: AssetMetadata = Field(default_factory=AssetMetadata)

    # Discovery
    source: DiscoverySource = DiscoverySource.API
    discovered_at: datetime = Field(default_factory=datetime.utcnow)
    verified: bool = False

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AssetCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    asset_type: AssetType
    owner_id: str
    owner_name: str
    location: Optional[Location] = None
    acquisition_value: Optional[float] = None
    metadata: Optional[AssetMetadata] = None
    source: DiscoverySource = DiscoverySource.MANUAL

class AssetUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[AssetStatus] = None
    current_value: Optional[float] = None
    location: Optional[Location] = None
    metadata: Optional[AssetMetadata] = None

class AssetSearchRequest(BaseModel):
    query: Optional[str] = None
    asset_types: Optional[List[AssetType]] = None
    status: Optional[AssetStatus] = None
    owner_id: Optional[str] = None
    sector: Optional[str] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    tags: Optional[List[str]] = None
    limit: int = Field(default=50, le=500)
    offset: int = 0

class AssetSearchResponse(BaseModel):
    total: int
    assets: List[Asset]
    aggregations: Dict[str, Any]

class PortfolioSummary(BaseModel):
    owner_id: str
    total_assets: int
    total_value: float
    by_type: Dict[str, int]
    by_status: Dict[str, int]
    value_distribution: Dict[str, float]

# ============================================================================
# In-Memory Storage (Replace with actual database)
# ============================================================================

assets_db: Dict[str, Asset] = {}

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "assetmind-discovery",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "assets_count": len(assets_db)
    }

@app.get("/ready")
async def readiness_check():
    """Readiness check for orchestration"""
    return {"ready": True}

# ============================================================================
# Asset Discovery Endpoints
# ============================================================================

@app.post("/api/v1/assets", response_model=Asset, status_code=201)
async def create_asset(request: AssetCreateRequest):
    """Discover and register a new asset"""
    asset = Asset(
        name=request.name,
        description=request.description,
        asset_type=request.asset_type,
        owner_id=request.owner_id,
        owner_name=request.owner_name,
        location=request.location,
        acquisition_value=request.acquisition_value,
        metadata=request.metadata or AssetMetadata(),
        source=request.source,
        current_value=request.acquisition_value
    )
    assets_db[asset.id] = asset
    return asset

@app.get("/api/v1/assets/{asset_id}", response_model=Asset)
async def get_asset(asset_id: str):
    """Get asset details by ID"""
    if asset_id not in assets_db:
        raise HTTPException(status_code=404, detail="Asset not found")
    return assets_db[asset_id]

@app.put("/api/v1/assets/{asset_id}", response_model=Asset)
async def update_asset(asset_id: str, request: AssetUpdateRequest):
    """Update asset information"""
    if asset_id not in assets_db:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset = assets_db[asset_id]
    update_data = request.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None:
            setattr(asset, field, value)

    asset.updated_at = datetime.utcnow()
    assets_db[asset_id] = asset
    return asset

@app.delete("/api/v1/assets/{asset_id}", status_code=204)
async def delete_asset(asset_id: str):
    """Archive an asset (soft delete)"""
    if asset_id not in assets_db:
        raise HTTPException(status_code=404, detail="Asset not found")

    assets_db[asset_id].status = AssetStatus.ARCHIVED
    assets_db[asset_id].updated_at = datetime.utcnow()

@app.post("/api/v1/assets/search", response_model=AssetSearchResponse)
async def search_assets(request: AssetSearchRequest):
    """Search assets with filters"""
    results = list(assets_db.values())

    # Apply filters
    if request.query:
        query_lower = request.query.lower()
        results = [a for a in results if
                   query_lower in a.name.lower() or
                   (a.description and query_lower in a.description.lower())]

    if request.asset_types:
        results = [a for a in results if a.asset_type in request.asset_types]

    if request.status:
        results = [a for a in results if a.status == request.status]

    if request.owner_id:
        results = [a for a in results if a.owner_id == request.owner_id]

    if request.sector:
        results = [a for a in results if a.metadata.sector == request.sector]

    if request.min_value is not None:
        results = [a for a in results if a.current_value and a.current_value >= request.min_value]

    if request.max_value is not None:
        results = [a for a in results if a.current_value and a.current_value <= request.max_value]

    if request.tags:
        results = [a for a in results if any(tag in a.metadata.tags for tag in request.tags)]

    total = len(results)
    results = results[request.offset:request.offset + request.limit]

    # Aggregations
    by_type = {}
    by_status = {}
    for asset in results:
        by_type[asset.asset_type.value] = by_type.get(asset.asset_type.value, 0) + 1
        by_status[asset.status.value] = by_status.get(asset.status.value, 0) + 1

    return AssetSearchResponse(
        total=total,
        assets=results,
        aggregations={"by_type": by_type, "by_status": by_status}
    )

# ============================================================================
# Portfolio Endpoints
# ============================================================================

@app.get("/api/v1/portfolios/{owner_id}/summary", response_model=PortfolioSummary)
async def get_portfolio_summary(owner_id: str):
    """Get portfolio summary for an owner"""
    owner_assets = [a for a in assets_db.values() if a.owner_id == owner_id]

    if not owner_assets:
        raise HTTPException(status_code=404, detail="No assets found for owner")

    by_type: Dict[str, int] = {}
    by_status: Dict[str, int] = {}
    total_value = 0.0

    for asset in owner_assets:
        by_type[asset.asset_type.value] = by_type.get(asset.asset_type.value, 0) + 1
        by_status[asset.status.value] = by_status.get(asset.status.value, 0) + 1
        total_value += asset.current_value or 0

    return PortfolioSummary(
        owner_id=owner_id,
        total_assets=len(owner_assets),
        total_value=total_value,
        by_type=by_type,
        by_status=by_status,
        value_distribution={k: v * 100 / total_value if total_value else 0
                           for k, v in by_type.items()}
    )

@app.get("/api/v1/portfolios/{owner_id}/assets", response_model=List[Asset])
async def get_portfolio_assets(
    owner_id: str,
    asset_type: Optional[AssetType] = None,
    limit: int = Query(default=50, le=500)
):
    """Get all assets for a portfolio owner"""
    assets = [a for a in assets_db.values() if a.owner_id == owner_id]

    if asset_type:
        assets = [a for a in assets if a.asset_type == asset_type]

    return assets[:limit]

# ============================================================================
# Batch Operations
# ============================================================================

@app.post("/api/v1/assets/batch", status_code=201)
async def batch_create_assets(requests: List[AssetCreateRequest]):
    """Batch create multiple assets"""
    created = []
    for req in requests:
        asset = Asset(
            name=req.name,
            description=req.description,
            asset_type=req.asset_type,
            owner_id=req.owner_id,
            owner_name=req.owner_name,
            location=req.location,
            acquisition_value=req.acquisition_value,
            metadata=req.metadata or AssetMetadata(),
            source=req.source,
            current_value=req.acquisition_value
        )
        assets_db[asset.id] = asset
        created.append(asset)

    return {"created": len(created), "assets": created}

@app.post("/api/v1/assets/verify/{asset_id}", response_model=Asset)
async def verify_asset(asset_id: str):
    """Mark asset as verified"""
    if asset_id not in assets_db:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset = assets_db[asset_id]
    asset.verified = True
    asset.updated_at = datetime.utcnow()
    return asset

# ============================================================================
# Statistics
# ============================================================================

@app.get("/api/v1/stats")
async def get_discovery_stats():
    """Get discovery service statistics"""
    total = len(assets_db)
    by_type = {}
    by_status = {}
    verified_count = 0
    total_value = 0.0

    for asset in assets_db.values():
        by_type[asset.asset_type.value] = by_type.get(asset.asset_type.value, 0) + 1
        by_status[asset.status.value] = by_status.get(asset.status.value, 0) + 1
        if asset.verified:
            verified_count += 1
        total_value += asset.current_value or 0

    return {
        "total_assets": total,
        "verified_assets": verified_count,
        "total_value": total_value,
        "by_type": by_type,
        "by_status": by_status,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# Run with uvicorn
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)