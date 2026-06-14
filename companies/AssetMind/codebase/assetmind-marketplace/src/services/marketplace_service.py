"""
Marketplace Service
Main marketplace service for AssetMind
Port: 5230
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum
import logging
import random
import uuid

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Marketplace Service", version="1.0.0", docs_url="/docs")


class ListingStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING_REVIEW = "pending_review"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class ListingType(str, Enum):
    RESEARCH_REPORT = "research_report"
    MODEL = "model"
    STRATEGY = "strategy"
    DATASET = "dataset"
    AGENT = "agent"
    TEMPLATE = "template"
    INDICATOR = "indicator"
    ALERT = "alert"


class Listing(BaseModel):
    listing_id: str
    name: str
    description: str
    listing_type: ListingType
    status: ListingStatus
    seller_id: str
    seller_name: str
    price: float
    currency: str = "USD"
    rating: float = Field(0, ge=0, le=5)
    review_count: int = 0
    download_count: int = 0
    preview_available: bool = True
    tags: List[str] = Field(default_factory=list)
    category: str
    subcategory: Optional[str] = None
    compatibility: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    version: str = "1.0.0"


class Category(BaseModel):
    name: str
    slug: str
    description: str
    listing_count: int
    subcategories: List[str] = Field(default_factory=list)


class MarketplaceBrief(BaseModel):
    total_listings: int
    active_listings: int
    categories: List[Category]
    featured_listings: List[Dict[str, Any]]
    trending_listings: List[Dict[str, Any]]
    recent_additions: List[Dict[str, Any]]
    stats: Dict[str, Any]


class MarketplaceService:
    """Main marketplace service"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Marketplace Service"
        self.port = 5230
        self.version = "1.0.0"
        self._listings: Dict[str, Listing] = {}
        self._categories: Dict[str, Category] = {}
        self._initialize_data()

    def _initialize_data(self):
        """Initialize with sample data"""
        # Initialize categories
        categories = [
            Category(name="Research Reports", slug="research-reports", description="Detailed market research", listing_count=45, subcategories=["Daily Reports", "Sector Analysis", "Company Reports"]),
            Category(name="AI Models", slug="ai-models", description="Machine learning models", listing_count=32, subcategories=["Price Prediction", "Sentiment Analysis", "Pattern Recognition"]),
            Category(name="Trading Strategies", slug="strategies", description="Ready-to-use strategies", listing_count=28, subcategories=["Momentum", "Mean Reversion", "Breakout"]),
            Category(name="Datasets", slug="datasets", description="Market and alternative data", listing_count=51, subcategories=["Price History", "Fundamental", "Alternative"]),
            Category(name="AI Agents", slug="agents", description="Autonomous trading agents", listing_count=15, subcategories=["Execution", "Research", "Risk Management"]),
            Category(name="Templates", slug="templates", description="Trading templates", listing_count=23, subcategories=["Technical Analysis", "Portfolio", "Risk Management"])
        ]

        for cat in categories:
            self._categories[cat.slug] = cat

        # Initialize sample listings
        sample_listings = [
            {"name": "Tech Sector Deep Dive Q4 2024", "description": "Comprehensive analysis of technology sector", "type": ListingType.RESEARCH_REPORT, "category": "research-reports", "price": 49.99, "seller": "Alpha Analytics"},
            {"name": "LSTM Price Prediction Model", "description": "Deep learning model for price prediction", "type": ListingType.MODEL, "category": "ai-models", "price": 199.99, "seller": "ML Traders"},
            {"name": "Momentum Breakout Strategy", "description": "High probability breakout trading", "type": ListingType.STRATEGY, "category": "strategies", "price": 79.99, "seller": "Quant Masters"},
            {"name": "5-Year Stock Price Dataset", "description": "Cleaned and normalized price data", "type": ListingType.DATASET, "category": "datasets", "price": 29.99, "seller": "DataHub Pro"},
            {"name": "Auto-Trading Agent", "description": "Fully autonomous trading agent", "type": ListingType.AGENT, "category": "agents", "price": 299.99, "seller": "AI Trading Co"},
            {"name": "Technical Analysis Template", "description": "Complete technical analysis framework", "type": ListingType.TEMPLATE, "category": "templates", "price": 19.99, "seller": "ChartMaster"}
        ]

        for i, item in enumerate(sample_listings):
            listing_id = f"listing_{i+1}"
            self._listings[listing_id] = Listing(
                listing_id=listing_id,
                name=item["name"],
                description=item["description"],
                listing_type=item["type"],
                status=ListingStatus.ACTIVE,
                seller_id=f"seller_{i+1}",
                seller_name=item["seller"],
                price=item["price"],
                rating=round(random.uniform(3.5, 5.0), 1),
                review_count=random.randint(5, 100),
                download_count=random.randint(10, 500),
                tags=["popular", "trending"],
                category=item["category"],
                compatibility=["AssetMind API", "Python SDK"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )

    def _generate_listing_id(self) -> str:
        """Generate unique listing ID"""
        return f"listing_{uuid.uuid4().hex[:12]}"

    async def create_listing(
        self,
        name: str,
        description: str,
        listing_type: ListingType,
        seller_id: str,
        seller_name: str,
        price: float,
        category: str,
        tags: List[str] = None,
        subcategory: str = None,
        compatibility: List[str] = None
    ) -> Listing:
        """Create a new listing"""
        listing_id = self._generate_listing_id()

        listing = Listing(
            listing_id=listing_id,
            name=name,
            description=description,
            listing_type=listing_type,
            status=ListingStatus.PENDING_REVIEW,
            seller_id=seller_id,
            seller_name=seller_name,
            price=price,
            tags=tags or [],
            category=category,
            subcategory=subcategory,
            compatibility=compatibility or [],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        self._listings[listing_id] = listing

        # Update category count
        if category in self._categories:
            self._categories[category].listing_count += 1

        logger.info(f"Created listing: {listing_id}")
        return listing

    async def get_listing(self, listing_id: str) -> Optional[Listing]:
        """Get listing by ID"""
        return self._listings.get(listing_id)

    async def get_listings(
        self,
        category: Optional[str] = None,
        listing_type: Optional[ListingType] = None,
        status: Optional[ListingStatus] = None,
        seller_id: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get listings with filtering"""
        listings = list(self._listings.values())

        # Apply filters
        if category:
            listings = [l for l in listings if l.category == category]
        if listing_type:
            listings = [l for l in listings if l.listing_type == listing_type]
        if status:
            listings = [l for l in listings if l.status == status]
        if seller_id:
            listings = [l for l in listings if l.seller_id == seller_id]
        if min_price is not None:
            listings = [l for l in listings if l.price >= min_price]
        if max_price is not None:
            listings = [l for l in listings if l.price <= max_price]

        # Sort
        if sort_by == "price":
            listings = sorted(listings, key=lambda x: x.price, reverse=(sort_order == "desc"))
        elif sort_by == "rating":
            listings = sorted(listings, key=lambda x: x.rating, reverse=(sort_order == "desc"))
        elif sort_by == "downloads":
            listings = sorted(listings, key=lambda x: x.download_count, reverse=True)
        else:
            listings = sorted(listings, key=lambda x: x.created_at, reverse=(sort_order == "desc"))

        total = len(listings)
        listings = listings[offset:offset + limit]

        return {
            "listings": [self._listing_to_dict(l) for l in listings],
            "total": total,
            "limit": limit,
            "offset": offset
        }

    def _listing_to_dict(self, listing: Listing) -> Dict[str, Any]:
        """Convert listing to dictionary"""
        return {
            "listing_id": listing.listing_id,
            "name": listing.name,
            "description": listing.description,
            "listing_type": listing.listing_type.value,
            "status": listing.status.value,
            "seller_id": listing.seller_id,
            "seller_name": listing.seller_name,
            "price": listing.price,
            "currency": listing.currency,
            "rating": listing.rating,
            "review_count": listing.review_count,
            "download_count": listing.download_count,
            "tags": listing.tags,
            "category": listing.category,
            "subcategory": listing.subcategory,
            "created_at": listing.created_at.isoformat(),
            "updated_at": listing.updated_at.isoformat()
        }

    async def update_listing(
        self,
        listing_id: str,
        **updates
    ) -> Listing:
        """Update listing"""
        if listing_id not in self._listings:
            raise ValueError("Listing not found")

        listing = self._listings[listing_id]

        for key, value in updates.items():
            if hasattr(listing, key):
                setattr(listing, key, value)

        listing.updated_at = datetime.utcnow()
        return listing

    async def get_categories(self) -> List[Dict[str, Any]]:
        """Get all categories"""
        return [
            {
                "name": cat.name,
                "slug": cat.slug,
                "description": cat.description,
                "listing_count": cat.listing_count,
                "subcategories": cat.subcategories
            }
            for cat in self._categories.values()
        ]

    async def get_brief(self) -> MarketplaceBrief:
        """Get marketplace brief"""
        active = [l for l in self._listings.values() if l.status == ListingStatus.ACTIVE]

        return MarketplaceBrief(
            total_listings=len(self._listings),
            active_listings=len(active),
            categories=list(self._categories.values()),
            featured_listings=[self._listing_to_dict(l) for l in active[:3]],
            trending_listings=sorted(active, key=lambda x: x.download_count, reverse=True)[:5],
            recent_additions=sorted(active, key=lambda x: x.created_at, reverse=True)[:5],
            stats={
                "total_value": sum(l.price for l in active),
                "avg_price": sum(l.price for l in active) / len(active) if active else 0,
                "total_downloads": sum(l.download_count for l in active),
                "total_reviews": sum(l.review_count for l in active)
            }
        )

    async def search(
        self,
        query: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search listings"""
        query_lower = query.lower()
        results = []

        for listing in self._listings.values():
            if listing.status != ListingStatus.ACTIVE:
                continue

            # Simple text matching
            if (query_lower in listing.name.lower() or
                query_lower in listing.description.lower() or
                any(query_lower in tag.lower() for tag in listing.tags)):
                results.append(self._listing_to_dict(listing))

        return results[:limit]


service = MarketplaceService()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "total_listings": len(service._listings)
    }


@app.get("/api/v1/brief")
async def get_brief():
    """Get marketplace brief"""
    return await service.get_brief()


@app.get("/api/v1/listings")
async def get_listings(
    category: str = Query(None),
    listing_type: ListingType = Query(None),
    status: ListingStatus = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0)
):
    """Get listings"""
    return await service.get_listings(
        category=category,
        listing_type=listing_type,
        status=status,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset
    )


@app.get("/api/v1/listings/{listing_id}")
async def get_listing(listing_id: str):
    """Get listing by ID"""
    listing = await service.get_listing(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return service._listing_to_dict(listing)


@app.post("/api/v1/listings")
async def create_listing(request: Dict[str, Any]):
    """Create a new listing"""
    try:
        return await service.create_listing(
            name=request["name"],
            description=request["description"],
            listing_type=ListingType(request["listing_type"]),
            seller_id=request["seller_id"],
            seller_name=request["seller_name"],
            price=request["price"],
            category=request["category"],
            tags=request.get("tags"),
            subcategory=request.get("subcategory"),
            compatibility=request.get("compatibility")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/v1/categories")
async def get_categories():
    """Get all categories"""
    return await service.get_categories()


@app.get("/api/v1/search")
async def search(query: str, limit: int = Query(20, le=50)):
    """Search listings"""
    return await service.search(query, limit)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5230)