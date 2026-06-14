"""
AssetMind Financial Ontology Service
The Foundation Layer - Defines the financial universe

This service provides:
- Complete ontological framework for financial entities
- Entity management (assets, companies, events, risks)
- Relationship tracking between entities
- Graph traversal and path finding
- Sector hierarchy and taxonomy
- Supply chain intelligence

Port: 5045

Version: 1.0.0
Date: June 11, 2026
"""

import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Set
from uuid import uuid4

from fastapi import APIRouter, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ============================================================================
# Logging Configuration
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("assetmind-ontology")

# ============================================================================
# Enums
# ============================================================================

class EntityCategory(str, Enum):
    """Top-level entity categories"""
    ASSET = "asset"
    COMPANY = "company"
    PERSON = "person"
    EVENT = "event"
    RISK = "risk"
    GEOGRAPHY = "geography"
    REGULATION = "regulation"
    CONCEPT = "concept"


class AssetClass(str, Enum):
    """Asset types"""
    STOCK = "stock"
    ETF = "etf"
    INDEX = "index"
    BOND = "bond"
    CRYPTO = "crypto"
    COMMODITY = "commodity"
    FOREX = "forex"
    REAL_ESTATE = "real_estate"
    MUTUAL_FUND = "mutual_fund"
    OPTION = "option"
    FUTURE = "future"


class EventCategory(str, Enum):
    """Event types that affect markets"""
    EARNINGS = "earnings"
    MERGERS_ACQUISITIONS = "mergers_acquisitions"
    DIVIDEND = "dividend"
    IPO = "ipo"
    CENTRAL_BANK = "central_bank"
    ECONOMIC_DATA = "economic_data"
    REGULATION_CHANGE = "regulation_change"
    WAR = "war"
    SANCTIONS = "sanctions"


class RiskCategory(str, Enum):
    """Risk types"""
    MARKET = "market"
    CREDIT = "credit"
    LIQUIDITY = "liquidity"
    OPERATIONAL = "operational"
    REGULATORY = "regulatory"
    GEOPOLITICAL = "geopolitical"
    CYBERSECURITY = "cybersecurity"
    CLIMATE = "climate"


class RelationshipType(str, Enum):
    """Types of relationships between entities"""
    SUPPLIES_TO = "supplies_to"
    CUSTOMER_OF = "customer_of"
    COMPETES_WITH = "competes_with"
    PARTNERS_WITH = "partners_with"
    ACQUIRED_BY = "acquired_by"
    OWNS = "owns"
    ISSUED_BY = "issued_by"
    UNDERLYING_OF = "underlying_of"
    TRACKS = "tracks"
    AFFECTS = "affects"
    EXPOSED_TO = "exposed_to"
    HEDGES_AGAINST = "hedges_against"

# ============================================================================
# Pydantic Models
# ============================================================================

class Entity(BaseModel):
    """Base entity in the financial ontology"""
    entity_id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    category: EntityCategory
    properties: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class EntityCreate(BaseModel):
    """Entity creation request"""
    name: str
    category: EntityCategory
    properties: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)


class Asset(Entity):
    """Any tradeable asset"""
    asset_class: AssetClass
    symbol: Optional[str] = None
    exchange: Optional[str] = None
    currency: str = "USD"
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = None
    price: Optional[float] = None


class Company(Entity):
    """Corporation or business entity"""
    ticker: Optional[str] = None
    exchange: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    jurisdiction: str = "US"
    employees: Optional[int] = None
    revenue: Optional[float] = None
    ebitda: Optional[float] = None


class Event(Entity):
    """Market event"""
    event_type: EventCategory
    timestamp: datetime
    title: str
    description: str
    affected_assets: List[str] = Field(default_factory=list)
    affected_sectors: List[str] = Field(default_factory=list)
    magnitude: Optional[str] = None


class Risk(Entity):
    """Risk factor"""
    risk_type: RiskCategory
    severity: str
    probability: float
    affected_assets: List[str] = Field(default_factory=list)
    hedging_assets: List[str] = Field(default_factory=list)


class Relationship(BaseModel):
    """Relationship between two entities"""
    relationship_id: str = Field(default_factory=lambda: str(uuid4()))
    from_entity: str
    to_entity: str
    relationship_type: RelationshipType
    strength: float = Field(default=1.0, ge=0.0, le=1.0)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    bidirectional: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RelationshipCreate(BaseModel):
    """Relationship creation request"""
    from_entity: str
    to_entity: str
    relationship_type: RelationshipType
    strength: float = Field(default=1.0, ge=0.0, le=1.0)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    bidirectional: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SubgraphQuery(BaseModel):
    """Subgraph query request"""
    entity_id: str
    depth: int = Field(default=2, ge=1, le=5)
    relationship_types: Optional[List[RelationshipType]] = None


class PathQuery(BaseModel):
    """Path finding query"""
    from_entity: str
    to_entity: str
    max_depth: int = Field(default=5, ge=1, le=10)


class OntologyStatistics(BaseModel):
    """Ontology statistics"""
    total_entities: int
    total_relationships: int
    by_category: Dict[str, int]
    by_relationship_type: Dict[str, int]

# ============================================================================
# Application State
# ============================================================================

class OntologyState:
    """Application state for ontology service"""

    def __init__(self):
        self.entities: Dict[str, Entity] = {}
        self.relationships: List[Relationship] = []
        self.adjacency: Dict[str, Dict[str, List[RelationshipType]]] = {}
        self.name_index: Dict[str, List[str]] = {}
        self.symbol_index: Dict[str, str] = {}
        self.start_time = time.time()

    def create_entity(self, request: EntityCreate) -> Entity:
        """Create a new entity"""
        entity = Entity(
            name=request.name,
            category=request.category,
            properties=request.properties,
            metadata=request.metadata,
            tags=request.tags,
        )

        self.entities[entity.entity_id] = entity

        # Update name index
        name_lower = request.name.lower()
        if name_lower not in self.name_index:
            self.name_index[name_lower] = []
        self.name_index[name_lower].append(entity.entity_id)

        # Update symbol index if applicable
        if request.properties.get("symbol"):
            self.symbol_index[request.properties["symbol"].upper()] = entity.entity_id

        return entity

    def get_entity(self, entity_id: str) -> Optional[Entity]:
        """Get entity by ID"""
        return self.entities.get(entity_id)

    def get_entity_by_symbol(self, symbol: str) -> Optional[Entity]:
        """Get entity by symbol"""
        entity_id = self.symbol_index.get(symbol.upper())
        return self.entities.get(entity_id) if entity_id else None

    def create_relationship(self, request: RelationshipCreate) -> Relationship:
        """Create a relationship between entities"""
        if request.from_entity not in self.entities:
            raise HTTPException(status_code=404, detail="Source entity not found")
        if request.to_entity not in self.entities:
            raise HTTPException(status_code=404, detail="Target entity not found")

        relationship = Relationship(
            from_entity=request.from_entity,
            to_entity=request.to_entity,
            relationship_type=request.relationship_type,
            strength=request.strength,
            confidence=request.confidence,
            bidirectional=request.bidirectional,
            metadata=request.metadata,
        )

        self.relationships.append(relationship)

        # Update adjacency list
        if request.from_entity not in self.adjacency:
            self.adjacency[request.from_entity] = {}
        if request.to_entity not in self.adjacency[request.from_entity]:
            self.adjacency[request.from_entity][request.to_entity] = []
        self.adjacency[request.from_entity][request.to_entity].append(request.relationship_type)

        if request.bidirectional:
            if request.to_entity not in self.adjacency:
                self.adjacency[request.to_entity] = {}
            if request.from_entity not in self.adjacency[request.to_entity]:
                self.adjacency[request.to_entity][request.from_entity] = []
            self.adjacency[request.to_entity][request.from_entity].append(request.relationship_type)

        return relationship

    def get_neighbors(self, entity_id: str, depth: int = 1, rel_types: Optional[List[RelationshipType]] = None) -> List[Dict[str, Any]]:
        """Get neighboring entities"""
        if entity_id not in self.adjacency:
            return []

        neighbors = []
        visited: Set[str] = {entity_id}
        queue = [(entity_id, 0)]

        while queue:
            current_id, current_depth = queue.pop(0)

            if current_depth >= depth:
                continue

            if current_id in self.adjacency:
                for neighbor, types in self.adjacency[current_id].items():
                    if neighbor not in visited:
                        if rel_types is None or any(t in rel_types for t in types):
                            visited.add(neighbor)
                            entity = self.entities.get(neighbor)
                            if entity:
                                neighbors.append({
                                    "entity": entity,
                                    "relationship_types": types,
                                    "depth": current_depth + 1,
                                })
 queue.append((neighbor, current_depth + 1))

        return neighbors

    def find_path(self, from_id: str, to_id: str, max_depth: int = 5) -> Dict[str, Any]:
        """Find shortest path between entities using BFS"""
        if from_id not in self.entities:
            raise HTTPException(status_code=404, detail="Source entity not found")
        if to_id not in self.entities:
            raise HTTPException(status_code=404, detail="Target entity not found")

        visited: Set[str] = {from_id}
        queue = [(from_id, [from_id])]

        while queue:
            current, path = queue.pop(0)

            if current == to_id:
                return {"found": True, "path": path, "length": len(path) - 1}

            if len(path) > max_depth:
                continue

            if current in self.adjacency:
                for neighbor in self.adjacency[current]:
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append((neighbor, path + [neighbor]))

        return {"found": False, "path": [], "length": 0}

    def get_statistics(self) -> OntologyStatistics:
        """Get ontology statistics"""
        by_category: Dict[str, int] = {}
        by_relationship_type: Dict[str, int] = {}

        for entity in self.entities.values():
            cat = entity.category.value
            by_category[cat] = by_category.get(cat, 0) + 1

        for rel in self.relationships:
            rt = rel.relationship_type.value
            by_relationship_type[rt] = by_relationship_type.get(rt, 0) + 1

        return OntologyStatistics(
            total_entities=len(self.entities),
            total_relationships=len(self.relationships),
            by_category=by_category,
            by_relationship_type=by_relationship_type,
        )


# Global state
state = OntologyState()

# ============================================================================
# Lifespan Manager
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("AssetMind Financial Ontology Service starting up...")

    # Bootstrap core entities
    core_entities = [
        EntityCreate(name="Technology Sector", category=EntityCategory.CONCEPT,
                    properties={"type": "sector"}, tags=["tech", "sector"]),
        EntityCreate(name="Healthcare Sector", category=EntityCategory.CONCEPT,
                    properties={"type": "sector"}, tags=["healthcare", "sector"]),
        EntityCreate(name="Financials Sector", category=EntityCategory.CONCEPT,
                    properties={"type": "sector"}, tags=["finance", "sector"]),
        EntityCreate(name="Market Risk", category=EntityCategory.RISK,
                    properties={"risk_type": "market"}, tags=["risk", "market"]),
        EntityCreate(name="Credit Risk", category=EntityCategory.RISK,
                    properties={"risk_type": "credit"}, tags=["risk", "credit"]),
    ]

    for req in core_entities:
        state.create_entity(req)

    logger.info(f"Ontology ready with {len(state.entities)} entities")
    yield
    logger.info("AssetMind Financial Ontology Service shutting down...")

# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="AssetMind Financial Ontology",
    description="""
    ## AssetMind Financial Ontology Service

    The Financial Brain - Defines reality for all other systems:
    - Complete ontological framework for financial entities
    - Entity management (assets, companies, events, risks)
    - Relationship tracking between entities
    - Graph traversal and path finding
    - Sector hierarchy and taxonomy

    ### Entity Categories
    - ASSET: Tradeable financial instruments
    - COMPANY: Corporate entities
    - PERSON: Individuals
    - EVENT: Market events
    - RISK: Risk factors
    - GEOGRAPHY: Geographic entities
    - REGULATION: Laws and regulations
    - CONCEPT: Abstract concepts
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Health Check Endpoints
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "service": "assetmind-ontology",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5045,
        "total_entities": len(state.entities),
        "total_relationships": len(state.relationships),
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/health/live", tags=["Health"])
async def liveness():
    """Kubernetes liveness probe"""
    return {"status": "alive"}


@app.get("/health/ready", tags=["Health"])
async def readiness():
    """Kubernetes readiness probe"""
    return {"status": "ready", "entities_loaded": len(state.entities)}

# ============================================================================
# Entity Endpoints
# ============================================================================

entity_router = APIRouter(prefix="/entities", tags=["Entities"])


@entity_router.post("/", response_model=Entity, status_code=201)
async def create_entity(request: EntityCreate):
    """Create a new entity"""
    return state.create_entity(request)


@entity_router.get("/", response_model=List[Entity])
async def list_entities(
    category: Optional[EntityCategory] = None,
    tag: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
):
    """List entities with filters"""
    results = list(state.entities.values())

    if category:
        results = [e for e in results if e.category == category]
    if tag:
        results = [e for e in results if tag in e.tags]

    return results[:limit]


@entity_router.get("/search", response_model=List[Entity])
async def search_entities(
    q: str = Query(..., description="Search query"),
    limit: int = Query(20, ge=1, le=100),
):
    """Search entities by name"""
    query_lower = q.lower()
    results = [e for e in state.entities.values() if query_lower in e.name.lower()]
    return results[:limit]


@entity_router.get("/symbol/{symbol}", response_model=Entity)
async def get_entity_by_symbol(symbol: str):
    """Get entity by symbol"""
    entity = state.get_entity_by_symbol(symbol)
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entity with symbol {symbol} not found")
    return entity


@entity_router.get("/{entity_id}", response_model=Entity)
async def get_entity(entity_id: str):
    """Get entity by ID"""
    entity = state.get_entity(entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity


@entity_router.delete("/{entity_id}", status_code=204)
async def delete_entity(entity_id: str):
    """Delete an entity"""
    if entity_id not in state.entities:
        raise HTTPException(status_code=404, detail="Entity not found")
    del state.entities[entity_id]
    logger.info(f"Deleted entity: {entity_id}")


app.include_router(entity_router)

# ============================================================================
# Relationship Endpoints
# ============================================================================

relationship_router = APIRouter(prefix="/relationships", tags=["Relationships"])


@relationship_router.post("/", response_model=Relationship, status_code=201)
async def create_relationship(request: RelationshipCreate):
    """Create a relationship between entities"""
    return state.create_relationship(request)


@relationship_router.get("/", response_model=List[Relationship])
async def list_relationships(
    from_entity: Optional[str] = None,
    to_entity: Optional[str] = None,
    rel_type: Optional[RelationshipType] = None,
    limit: int = Query(100, ge=1, le=500),
):
    """List relationships with filters"""
    results = list(self.relationships)

    if from_entity:
        results = [r for r in results if r.from_entity == from_entity]
    if to_entity:
        results = [r for r in results if r.to_entity == to_entity]
    if rel_type:
        results = [r for r in results if r.relationship_type == rel_type]

    return results[:limit]


@relationship_router.get("/{entity_id}", response_model=List[Dict[str, Any]])
async def get_entity_relationships(entity_id: str):
    """Get relationships for an entity"""
    return state.get_neighbors(entity_id)


app.include_router(relationship_router)

# ============================================================================
# Graph Endpoints
# ============================================================================

@app.post("/graph/subgraph", tags=["Graph"])
async def get_subgraph(query: SubgraphQuery):
    """Get subgraph around an entity"""
    if query.entity_id not in state.entities:
        raise HTTPException(status_code=404, detail="Entity not found")

    neighbors = state.get_neighbors(query.entity_id, query.depth, query.relationship_types)
    return {
        "center_entity": query.entity_id,
        "neighbors": neighbors,
        "total": len(neighbors),
    }


@app.post("/graph/path", tags=["Graph"])
async def find_path(query: PathQuery):
    """Find shortest path between entities"""
    return state.find_path(query.from_entity, query.to_entity, query.max_depth)


@app.get("/graph/neighbors/{entity_id}", tags=["Graph"])
async def get_neighbors(
    entity_id: str,
    depth: int = Query(1, ge=1, le=3),
):
    """Get neighboring entities"""
    if entity_id not in state.entities:
        raise HTTPException(status_code=404, detail="Entity not found")

    neighbors = state.get_neighbors(entity_id, depth)
    return {"entity_id": entity_id, "neighbors": neighbors, "total": len(neighbors)}

# ============================================================================
# Statistics Endpoints
# ============================================================================

@app.get("/statistics", response_model=OntologyStatistics, tags=["Statistics"])
async def get_statistics():
    """Get ontology statistics"""
    return state.get_statistics()


@app.get("/categories", tags=["Statistics"])
async def get_categories():
    """Get all entity categories"""
    categories = {}
    for entity in state.entities.values():
        cat = entity.category.value
        if cat not in categories:
            categories[cat] = {"count": 0, "examples": []}
        categories[cat]["count"] += 1
        if len(categories[cat]["examples"]) < 3:
            categories[cat]["examples"].append({"id": entity.entity_id, "name": entity.name})
    return {"categories": categories}

# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint"""
    return {
        "service": "AssetMind Financial Ontology",
        "version": "1.0.0",
        "port": 5045,
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5045)
