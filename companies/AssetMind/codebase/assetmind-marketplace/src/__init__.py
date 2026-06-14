"""
AssetMind - Marketplace Service
Port: 5270

Data and model marketplace for financial intelligence.
Buy/sell datasets, models, and research reports.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


app = FastAPI(title="AssetMind Marketplace", version="1.0.0")


class ItemType(str, Enum):
    DATASET = "dataset"
    MODEL = "model"
    REPORT = "report"
    INDICATOR = "indicator"


class PriceType(str, Enum):
    ONE_TIME = "one_time"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    FREE = "free"


class MarketplaceItem(BaseModel):
    item_id: str
    name: str
    description: str
    item_type: ItemType
    price: float
    price_type: PriceType
    vendor: str
    rating: float
    downloads: int
    tags: List[str]
    preview: Optional[str] = None


class PurchaseRequest(BaseModel):
    item_id: str
    payment_method: str = "card"


class ReviewRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-marketplace",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5270
    }


@app.get("/items")
async def list_items(
    item_type: Optional[ItemType] = None,
    search: Optional[str] = None,
    limit: int = 20
):
    """List marketplace items"""
    items = [
        MarketplaceItem(
            item_id="ds-001", name="Alternative Data Bundle", description="10 premium datasets",
            item_type=ItemType.DATASET, price=499, price_type=PriceType.ONE_TIME,
            vendor="DataVendor", rating=4.8, downloads=1250,
            tags=["alternative_data", "premium", "finance"]
        ),
        MarketplaceItem(
            item_id="md-001", name="Technical Analysis ML Model", description="ML-based technical patterns",
            item_type=ItemType.MODEL, price=99, price_type=PriceType.MONTHLY,
            vendor="QuantLab", rating=4.5, downloads=890,
            tags=["ml", "technical", "patterns"]
        ),
        MarketplaceItem(
            item_id="rp-001", name="Q2 2026 Market Outlook", description="Comprehensive market analysis",
            item_type=ItemType.REPORT, price=0, price_type=PriceType.FREE,
            vendor="AssetMind Research", rating=4.9, downloads=5000,
            tags=["research", "outlook", "2026"]
        ),
    ]
    return {"items": items[:limit], "total": len(items)}


@app.get("/items/{item_id}")
async def get_item(item_id: str):
    items = {
        "ds-001": MarketplaceItem(
            item_id="ds-001", name="Alternative Data Bundle", description="10 premium datasets including satellite imagery, credit card transactions, and social sentiment",
            item_type=ItemType.DATASET, price=499, price_type=PriceType.ONE_TIME,
            vendor="DataVendor", rating=4.8, downloads=1250,
            tags=["alternative_data", "premium", "finance"]
        )
    }
    if item_id not in items:
        raise HTTPException(status_code=404, detail="Item not found")
    return items[item_id]


@app.post("/purchase")
async def purchase_item(request: PurchaseRequest):
    """Purchase an item"""
    return {
        "purchase_id": str(uuid.uuid4()),
        "item_id": request.item_id,
        "status": "completed",
        "access_token": str(uuid.uuid4()),
        "purchased_at": datetime.utcnow()
    }


@app.post("/items/{item_id}/review")
async def submit_review(item_id: str, request: ReviewRequest):
    """Submit a review"""
    return {
        "review_id": str(uuid.uuid4()),
        "item_id": item_id,
        "rating": request.rating,
        "comment": request.comment,
        "submitted_at": datetime.utcnow()
    }


@app.get("/categories")
async def get_categories():
    """Get item categories"""
    return {
        "categories": [
            {"name": "Datasets", "count": 45, "icon": "database"},
            {"name": "Models", "count": 32, "icon": "brain"},
            {"name": "Reports", "count": 120, "icon": "document"},
            {"name": "Indicators", "count": 89, "icon": "chart"},
        ]
    }


@app.get("/featured")
async def get_featured():
    """Get featured items"""
    return {
        "featured": [
            {"item_id": "ds-001", "reason": "Top Seller"},
            {"item_id": "rp-001", "reason": "Editor's Choice"},
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5270)