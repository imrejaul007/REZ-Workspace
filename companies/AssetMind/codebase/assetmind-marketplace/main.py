"""
AssetMind Marketplace - Agent/Service Marketplace
FastAPI Main Application
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(title="AssetMind Marketplace", description="Agent and Service Marketplace", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ============================================================================
# Enums
# ============================================================================


class ServiceCategory(str, Enum):
    TRADING = "trading"
    ANALYSIS = "analysis"
    RESEARCH = "research"
    PORTFOLIO = "portfolio"
    RISK = "risk"
    COMPLIANCE = "compliance"
    REPORTING = "reporting"


class ServiceStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEPRECATED = "deprecated"
    BETA = "beta"


class PricingModel(str, Enum):
    FREE = "free"
    SUBSCRIPTION = "subscription"
    PER_USE = "per_use"
    ENTERPRISE = "enterprise"


# ============================================================================
# Pydantic Models
# ============================================================================


class ServiceProvider(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    company: str
    email: str
    verified: bool = False
    rating: float = Field(default=0.0, ge=0.0, le=5.0)
    total_services: int = 0


class ServicePricing(BaseModel):
    model: PricingModel
    price: Optional[float] = Field(default=None, ge=0)
    currency: str = "USD"
    trial_days: int = 0


class ServiceMetrics(BaseModel):
    total_users: int = 0
    active_users: int = 0
    avg_rating: float = 0.0
    total_reviews: int = 0
    uptime_percentage: float = 100.0


class MarketplaceService(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: str
    provider: ServiceProvider
    category: ServiceCategory
    status: ServiceStatus = ServiceStatus.ACTIVE
    pricing: ServicePricing
    version: str = "1.0.0"
    tags: list[str] = []
    metrics: ServiceMetrics = Field(default_factory=ServiceMetrics)
    documentation_url: Optional[str] = None
    api_endpoint: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ServiceReview(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    service_id: str
    user_id: str
    rating: float = Field(ge=0.0, le=5.0)
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ServiceSearchQuery(BaseModel):
    query: str
    category: Optional[ServiceCategory] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    tags: list[str] = []


# ============================================================================
# In-Memory Storage
# ============================================================================

services_db: dict[str, MarketplaceService] = {}
providers_db: dict[str, ServiceProvider] = {}
reviews_db: list[ServiceReview] = []


# ============================================================================
# Health Check
# ============================================================================


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "assetmind-marketplace",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {"total_services": len(services_db), "total_providers": len(providers_db)},
    }


# ============================================================================
# Provider Endpoints
# ============================================================================


@app.post("/providers", response_model=ServiceProvider, status_code=201)
async def create_provider(provider: ServiceProvider):
    providers_db[provider.id] = provider
    return provider


@app.get("/providers/{provider_id}", response_model=ServiceProvider)
async def get_provider(provider_id: str):
    if provider_id not in providers_db:
        raise HTTPException(status_code=404, detail="Provider not found")
    return providers_db[provider_id]


@app.get("/providers", response_model=list[ServiceProvider])
async def list_providers(verified: Optional[bool] = Query(None), limit: int = Query(20, ge=1, le=100)):
    providers = list(providers_db.values())
    if verified is not None:
        providers = [p for p in providers if p.verified == verified]
    return providers[:limit]


# ============================================================================
# Service Endpoints
# ============================================================================


@app.post("/services", response_model=MarketplaceService, status_code=201)
async def register_service(service: MarketplaceService):
    services_db[service.id] = service
    if service.provider.id in providers_db:
        providers_db[service.provider.id].total_services += 1
    return service


@app.get("/services/{service_id}", response_model=MarketplaceService)
async def get_service(service_id: str):
    if service_id not in services_db:
        raise HTTPException(status_code=404, detail="Service not found")
    return services_db[service_id]


@app.get("/services", response_model=list[MarketplaceService])
async def list_services(
    category: Optional[ServiceCategory] = Query(None),
    status: Optional[ServiceStatus] = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    services = list(services_db.values())
    if category:
        services = [s for s in services if s.category == category]
    if status:
        services = [s for s in services if s.status == status]
    return services[:limit]


@app.put("/services/{service_id}", response_model=MarketplaceService)
async def update_service(service_id: str, service: MarketplaceService):
    if service_id not in services_db:
        raise HTTPException(status_code=404, detail="Service not found")
    service.updated_at = datetime.utcnow()
    services_db[service_id] = service
    return service


@app.delete("/services/{service_id}", status_code=204)
async def delete_service(service_id: str):
    if service_id not in services_db:
        raise HTTPException(status_code=404, detail="Service not found")
    del services_db[service_id]


# ============================================================================
# Search Endpoints
# ============================================================================


@app.post("/services/search", response_model=list[MarketplaceService])
async def search_services(search_query: ServiceSearchQuery):
    results = list(services_db.values())
    if search_query.category:
        results = [s for s in results if s.category == search_query.category]
    if search_query.min_price is not None:
        results = [s for s in results if s.pricing.price and s.pricing.price >= search_query.min_price]
    if search_query.max_price is not None:
        results = [s for s in results if s.pricing.price and s.pricing.price <= search_query.max_price]
    if search_query.min_rating:
        results = [s for s in results if s.metrics.avg_rating >= search_query.min_rating]
    if search_query.tags:
        results = [s for s in results if any(tag in s.tags for tag in search_query.tags)]
    return results


@app.get("/services/featured", response_model=list[MarketplaceService])
async def get_featured_services(limit: int = Query(10, ge=1, le=50)):
    services = list(services_db.values())
    services.sort(key=lambda s: s.metrics.avg_rating + min(s.metrics.total_users / 100, 5), reverse=True)
    return services[:limit]


# ============================================================================
# Review Endpoints
# ============================================================================


@app.post("/services/{service_id}/reviews", response_model=ServiceReview, status_code=201)
async def create_review(service_id: str, review: ServiceReview):
    if service_id not in services_db:
        raise HTTPException(status_code=404, detail="Service not found")
    review.service_id = service_id
    reviews_db.append(review)
    service = services_db[service_id]
    service_reviews = [r for r in reviews_db if r.service_id == service_id]
    service.metrics.avg_rating = sum(r.rating for r in service_reviews) / len(service_reviews)
    service.metrics.total_reviews = len(service_reviews)
    return review


@app.get("/services/{service_id}/reviews", response_model=list[ServiceReview])
async def get_service_reviews(service_id: str, limit: int = Query(20, ge=1, le=100)):
    reviews = [r for r in reviews_db if r.service_id == service_id]
    return reviews[:limit]


# ============================================================================
# Analytics Endpoints
# ============================================================================


@app.get("/analytics/popular")
async def get_popular_services():
    services = list(services_db.values())
    popular = sorted(services, key=lambda s: s.metrics.active_users, reverse=True)
    return [{"service_id": s.id, "name": s.name, "active_users": s.metrics.active_users} for s in popular[:10]]


@app.get("/analytics/categories")
async def get_category_distribution():
    distribution = {c.value: 0 for c in ServiceCategory}
    for service in services_db.values():
        distribution[service.category.value] += 1
    return distribution


# ============================================================================
# Entry Point
# ============================================================================


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5050)