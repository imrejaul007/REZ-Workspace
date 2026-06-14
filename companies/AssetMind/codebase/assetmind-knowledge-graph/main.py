"""
AssetMind Knowledge Graph Service
Entity relationship management for financial knowledge

This service provides:
- Entity management (companies, people, assets, events)
- Relationship tracking between entities
- Graph traversal and queries
- Path finding between entities
- Entity clustering and analysis

Port: 5031

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
logger = logging.getLogger("assetmind-knowledge-graph")

# ============================================================================
# Enums
# ============================================================================

class EntityType(str, Enum):
    """Entity type enumeration"""
    COMPANY = "company"
    PERSON = "person"
    ASSET = "asset"
    EVENT = "event"
    CONCEPT = "concept"
    SECTOR = "sector"
    EXCHANGE = "exchange"
    COUNTRY = "country"
    PRODUCT = "product"
    INDUSTRY = "industry"


class RelationshipType(str, Enum):
    """Relationship type enumeration"""
    OWNS = "owns"
    ACQUIRES = "acquires"
    PARTNERS_WITH = "partners_with"
    COMPETES_WITH = "competes_with"
    SUPPLIES = "supplies"
    CUSTOMER_OF = "customer_of"
    INVESTED_BY = "invested_by"
    ACQUIRED_BY = "acquired_by"
    MERGED_WITH = "merged_with"
    DERIVES_FROM = "derives_from"
    AFFECTS = "affects"
    LEADS = "leads"
    FOLLOWS = "follows"
    SIMILAR_TO = "similar_to"
    LOCATED_IN = "located_in"
    TRACKED_BY = "tracked_by"


class EntityStatus(str, Enum):
    """Entity status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ACQUIRED = "acquired"
    BANKRUPT = "bankrupt"
    MERGED = "merged"


class QueryDirection(str, Enum):
    """Graph query direction"""
    OUTGOING = "outgoing"
    INCOMING = "incoming"
    BOTH = "both"

# ============================================================================
# Pydantic Models
# ============================================================================

class Entity(BaseModel):
    """Entity model"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    entity_type: EntityType
    name: str
    symbol: Optional[str] = None  # For assets
    description: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    properties: Dict[str, Any] = Field(default_factory=dict)
    status: EntityStatus = EntityStatus.ACTIVE
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class EntityCreate(BaseModel):
    """Entity creation request"""
    entity_type: EntityType
    name: str
    symbol: Optional[str] = None
    description: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    properties: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)


class EntityUpdate(BaseModel):
    """Entity update request"""
    name: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    properties: Optional[Dict[str, Any]] = None
    status: Optional[EntityStatus] = None
    tags: Optional[List[str]] = None


class Relationship(BaseModel):
    """Relationship model"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    source_id: str
    target_id: str
    relationship_type: RelationshipType
    weight: float = Field(default=1.0, ge=0.0, le=1.0)
    properties: Dict[str, Any] = Field(default_factory=dict)
    bidirectional: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RelationshipCreate(BaseModel):
    """Relationship creation request"""
    source_id: str
    target_id: str
    relationship_type: RelationshipType
    weight: float = Field(default=1.0, ge=0.0, le=1.0)
    properties: Dict[str, Any] = Field(default_factory=dict)
    bidirectional: bool = False


class GraphQuery(BaseModel):
    """Graph query request"""
    entity_id: Optional[str] = None
    entity_name: Optional[str] = None
    depth: int = Field(default=2, ge=1, le=5)
    relationship_types: Optional[List[RelationshipType]] = None
    entity_types: Optional[List[EntityType]] = None
    direction: QueryDirection = QueryDirection.BOTH
    limit: int = Field(default=50, ge=1, le=200)


class PathQuery(BaseModel):
    """Path finding query"""
    source_id: str
    target_id: str
    max_depth: int = Field(default=4, ge=1, le=10)
    relationship_types: Optional[List[RelationshipType]] = None


class PathResult(BaseModel):
    """Path finding result"""
    source_id: str
    target_id: str
    path: List[Dict[str, Any]]
    length: int
    total_weight: float


class ClusterResult(BaseModel):
    """Entity cluster result"""
    cluster_id: str
    entities: List[Dict[str, Any]]
    shared_relationships: List[str]
    density: float


class GraphStatistics(BaseModel):
    """Graph statistics"""
    total_entities: int
    total_relationships: int
    by_type: Dict[str, int]
    by_entity_type: Dict[str, int]
    avg_relationships_per_entity: float
    most_connected_entities: List[Dict[str, Any]]

# ============================================================================
# Application State
# ============================================================================

class KnowledgeGraphState:
    """Application state for knowledge graph"""

    def __init__(self):
        self.entities: Dict[str, Entity] = {}
        self.relationships: Dict[str, Relationship] = {}
        self.entity_index: Dict[str, List[str]] = {}  # name -> entity_ids
        self.symbol_index: Dict[str, str] = {}  # symbol -> entity_id
        self.start_time = time.time()

    def create_entity(self, request: EntityCreate) -> Entity:
        """Create a new entity"""
        entity = Entity(
            entity_type=request.entity_type,
            name=request.name,
            symbol=request.symbol,
            description=request.description,
            metadata=request.metadata,
            properties=request.properties,
            tags=request.tags,
        )

        self.entities[entity.id] = entity

        # Update indexes
        name_lower = request.name.lower()
        if name_lower not in self.entity_index:
            self.entity_index[name_lower] = []
        self.entity_index[name_lower].append(entity.id)

        if request.symbol:
            self.symbol_index[request.symbol.upper()] = entity.id

        return entity

    def get_entity(self, entity_id: str) -> Optional[Entity]:
        """Get entity by ID"""
        return self.entities.get(entity_id)

    def get_entity_by_symbol(self, symbol: str) -> Optional[Entity]:
        """Get entity by symbol"""
        entity_id = self.symbol_index.get(symbol.upper())
        return self.entities.get(entity_id) if entity_id else None

    def update_entity(self, entity_id: str, update: EntityUpdate) -> Optional[Entity]:
        """Update an entity"""
        entity = self.entities.get(entity_id)
        if not entity:
            return None

        if update.name is not None:
            entity.name = update.name
        if update.description is not None:
            entity.description = update.description
        if update.metadata is not None:
            entity.metadata.update(update.metadata)
        if update.properties is not None:
            entity.properties.update(update.properties)
        if update.status is not None:
            entity.status = update.status
        if update.tags is not None:
            entity.tags = update.tags

        entity.updated_at = datetime.utcnow()
        return entity

    def create_relationship(self, request: RelationshipCreate) -> Relationship:
        """Create a relationship between entities"""
        # Verify entities exist
        if request.source_id not in self.entities:
            raise HTTPException(status_code=404, detail=f"Source entity {request.source_id} not found")
        if request.target_id not in self.entities:
            raise HTTPException(status_code=404, detail=f"Target entity {request.target_id} not found")

        relationship = Relationship(
            source_id=request.source_id,
            target_id=request.target_id,
            relationship_type=request.relationship_type,
            weight=request.weight,
            properties=request.properties,
            bidirectional=request.bidirectional,
        )

        self.relationships[relationship.id] = relationship
        return relationship

    def get_relationships(
        self,
        entity_id: str,
        direction: QueryDirection = QueryDirection.BOTH,
        relationship_types: Optional[List[RelationshipType]] = None,
    ) -> List[Relationship]:
        """Get relationships for an entity"""
        results = []

        for rel in self.relationships.values():
            if relationship_types and rel.relationship_type not in relationship_types:
                continue

            if direction == QueryDirection.OUTGOING:
                if rel.source_id == entity_id:
                    results.append(rel)
            elif direction == QueryDirection.INCOMING:
                if rel.target_id == entity_id:
                    results.append(rel)
            else:  # BOTH
                if rel.source_id == entity_id or rel.target_id == entity_id:
                    results.append(rel)

        return results

    def traverse_graph(self, query: GraphQuery) -> Dict[str, Any]:
        """Traverse the graph from an entity"""
        # Find starting entity
        start_id = query.entity_id
        if not start_id and query.entity_name:
            matches = self.entity_index.get(query.entity_name.lower(), [])
            start_id = matches[0] if matches else None

        if not start_id or start_id not in self.entities:
            raise HTTPException(status_code=404, detail="Starting entity not found")

        visited: Set[str] = set()
        results: List[Dict[str, Any]] = []
        queue = [(start_id, 0)]

        while queue and len(results) < query.limit:
            current_id, depth = queue.pop(0)

            if current_id in visited or depth > query.depth:
                continue

            visited.add(current_id)
            entity = self.entities[current_id]

            # Filter by entity type
            if query.entity_types and entity.entity_type not in query.entity_types:
                continue

            results.append({
                "entity": entity,
                "depth": depth,
            })

            # Get connected entities
            for rel in self.get_relationships(current_id, query.direction, query.relationship_types):
                neighbor_id = rel.target_id if rel.source_id == current_id else rel.source_id
                if neighbor_id not in visited:
                    queue.append((neighbor_id, depth + 1))

        return {
            "start_entity": start_id,
            "entities": results,
            "total": len(results),
 }

    def find_path(self, query: PathQuery) -> PathResult:
        """Find shortest path between entities"""
        if query.source_id not in self.entities:
            raise HTTPException(status_code=404, detail="Source entity not found")
        if query.target_id not in self.entities:
            raise HTTPException(status_code=404, detail="Target entity not found")

        # BFS for shortest path
        visited: Set[str] = {query.source_id}
        queue = [(query.source_id, [])]

        while queue:
            current_id, path = queue.pop(0)

            if current_id == query.target_id:
                return PathResult(
                    source_id=query.source_id,
                    target_id=query.target_id,
                    path=path,
                    length=len(path),
                    total_weight=sum(p.get("weight", 1) for p in path),
                )

            if len(path) >= query.max_depth:
                continue

            for rel in self.get_relationships(current_id, QueryDirection.BOTH, query.relationship_types):
                neighbor_id = rel.target_id if rel.source_id == current_id else rel.source_id
                if neighbor_id not in visited:
                    visited.add(neighbor_id)
                    new_path = path + [{
                        "from": current_id,
                        "to": neighbor_id,
                        "relationship": rel.relationship_type.value,
                        "weight": rel.weight,
                    }]
                    queue.append((neighbor_id, new_path))

        raise HTTPException(status_code=404, detail="No path found between entities")

    def get_statistics(self) -> GraphStatistics:
        """Get graph statistics"""
        by_type: Dict[str, int] = {}
        by_entity_type: Dict[str, int] = {}
        connection_counts: Dict[str, int] = {}

        for rel in self.relationships.values():
            by_type[rel.relationship_type.value] = by_type.get(rel.relationship_type.value, 0) + 1
            connection_counts[rel.source_id] = connection_counts.get(rel.source_id, 0) + 1
            connection_counts[rel.target_id] = connection_counts.get(rel.target_id, 0) + 1

        for entity in self.entities.values():
            by_entity_type[entity.entity_type.value] = by_entity_type.get(entity.entity_type.value, 0) + 1

        # Most connected entities
        most_connected = sorted(
            [
                {"entity_id": eid, "connections": count, "name": self.entities[eid].name}
                for eid, count in connection_counts.items()
            ],
            key=lambda x: x["connections"],
            reverse=True
        )[:10]

        avg_connections = sum(connection_counts.values()) / max(len(connection_counts), 1)

        return GraphStatistics(
            total_entities=len(self.entities),
            total_relationships=len(self.relationships),
            by_type=by_type,
            by_entity_type=by_entity_type,
            avg_relationships_per_entity=avg_connections,
            most_connected_entities=most_connected,
        )


# Global state
state = KnowledgeGraphState()

# ============================================================================
# Lifespan Manager
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("AssetMind Knowledge Graph Service starting up...")

    # Create sample entities
    sample_entities = [
        EntityCreate(entity_type=EntityType.COMPANY, name="Apple Inc", symbol="AAPL",
 description="Technology company", tags=["tech", "consumer electronics"]),
        EntityCreate(entity_type=EntityType.COMPANY, name="Microsoft Corp", symbol="MSFT",
                    description="Software and cloud services", tags=["tech", "software"]),
        EntityCreate(entity_type=EntityType.COMPANY, name="NVIDIA Corp", symbol="NVDA",
                    description="GPU and AI chip manufacturer", tags=["tech", "semiconductor"]),
        EntityCreate(entity_type=EntityType.SECTOR, name="Technology Sector",
                    description="Technology companies", tags=["tech"]),
        EntityCreate(entity_type=EntityType.EXCHANGE, name="NASDAQ",
                    description="Stock exchange", tags=["exchange", "us"]),
    ]

    created = {}
    for req in sample_entities:
        entity = state.create_entity(req)
        created[req.name] = entity.id

    # Create sample relationships
    relationships = [
        RelationshipCreate(source_id=created["Apple Inc"], target_id=created["Technology Sector"],
                          relationship_type=RelationshipType.DERIVES_FROM),
        RelationshipCreate(source_id=created["Microsoft Corp"], target_id=created["Technology Sector"],
                          relationship_type=RelationshipType.DERIVES_FROM),
        RelationshipCreate(source_id=created["NVIDIA Corp"], target_id=created["Technology Sector"],
                          relationship_type=RelationshipType.DERIVES_FROM),
        RelationshipCreate(source_id=created["Apple Inc"], target_id=created["Microsoft Corp"],
                          relationship_type=RelationshipType.COMPETES_WITH, weight=0.8),
    ]

    for rel in relationships:
        state.create_relationship(rel)

    logger.info(f"Knowledge Graph ready with {len(state.entities)} entities and {len(state.relationships)} relationships")
    yield
    logger.info("AssetMind Knowledge Graph Service shutting down...")

# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="AssetMind Knowledge Graph",
    description="""
    ## AssetMind Knowledge Graph Service

    Entity relationship management for financial knowledge:
    - Entity management (companies, people, assets, events)
    - Relationship tracking between entities
    - Graph traversal and queries
    - Path finding between entities
    - Entity clustering and analysis

    ### Entity Types
    - COMPANY: Corporate entities
    - PERSON: Individuals
    - ASSET: Financial assets
    - EVENT: Market events
    - CONCEPT: Abstract concepts
    - SECTOR: Industry sectors
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
        "service": "assetmind-knowledge-graph",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5031,
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
    entity_type: Optional[EntityType] = None,
    status: Optional[EntityStatus] = None,
    tag: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
):
    """List entities with filters"""
    results = list(state.entities.values())

    if entity_type:
        results = [e for e in results if e.entity_type == entity_type]
    if status:
        results = [e for e in results if e.status == status]
    if tag:
        results = [e for e in results if tag in e.tags]

    return results[:limit]


@entity_router.get("/search", response_model=List[Entity])
async def search_entities(
    q: str = Query(..., description="Search query"),
    entity_type: Optional[EntityType] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """Search entities by name"""
    query_lower = q.lower()
    results = [
        e for e in state.entities.values()
        if query_lower in e.name.lower() or query_lower in (e.symbol or "").lower()
    ]

    if entity_type:
        results = [e for e in results if e.entity_type == entity_type]

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


@entity_router.patch("/{entity_id}", response_model=Entity)
async def update_entity(entity_id: str, update: EntityUpdate):
    """Update an entity"""
    entity = state.update_entity(entity_id, update)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity


@entity_router.delete("/{entity_id}", status_code=204)
async def delete_entity(entity_id: str):
    """Delete an entity and its relationships"""
    if entity_id not in state.entities:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Delete related relationships
    to_delete = [
        rid for rid, rel in state.relationships.items()
        if rel.source_id == entity_id or rel.target_id == entity_id
    ]
    for rid in to_delete:
        del state.relationships[rid]

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
    entity_id: Optional[str] = None,
    relationship_type: Optional[RelationshipType] = None,
    limit: int = Query(100, ge=1, le=500),
):
    """List relationships"""
    results = list(state.relationships.values())

    if entity_id:
        results = [
            r for r in results
            if r.source_id == entity_id or r.target_id == entity_id
        ]
    if relationship_type:
        results = [r for r in results if r.relationship_type == relationship_type]

    return results[:limit]


@relationship_router.get("/{entity_id}", response_model=List[Relationship])
async def get_entity_relationships(
    entity_id: str,
    direction: QueryDirection = QueryDirection.BOTH,
    relationship_type: Optional[RelationshipType] = None,
):
    """Get relationships for an entity"""
    types = [relationship_type] if relationship_type else None
    return state.get_relationships(entity_id, direction, types)


@relationship_router.delete("/{relationship_id}", status_code=204)
async def delete_relationship(relationship_id: str):
    """Delete a relationship"""
    if relationship_id not in state.relationships:
        raise HTTPException(status_code=404, detail="Relationship not found")
    del state.relationships[relationship_id]


app.include_router(relationship_router)

# ============================================================================
# Graph Query Endpoints
# ============================================================================

@app.post("/graph/traverse", tags=["Graph"])
async def traverse_graph(query: GraphQuery):
    """Traverse the graph from an entity"""
    return state.traverse_graph(query)


@app.post("/graph/path", tags=["Graph"])
async def find_path(query: PathQuery):
    """Find shortest path between entities"""
    return state.find_path(query)


@app.get("/graph/neighbors/{entity_id}", tags=["Graph"])
async def get_neighbors(
    entity_id: str,
    depth: int = Query(1, ge=1, le=3),
    relationship_type: Optional[RelationshipType] = None,
):
    """Get neighboring entities"""
    if entity_id not in state.entities:
        raise HTTPException(status_code=404, detail="Entity not found")

    visited: Set[str] = {entity_id}
    results: List[Dict[str, Any]] = []
    queue = [(entity_id, 0)]

    while queue and len(results) < 100:
        current_id, current_depth = queue.pop(0)

        if current_depth >= depth:
            continue

        for rel in state.get_relationships(current_id):
            if relationship_type and rel.relationship_type != relationship_type:
                continue

            neighbor_id = rel.target_id if rel.source_id == current_id else rel.source_id
            if neighbor_id not in visited:
                visited.add(neighbor_id)
                neighbor = state.entities[neighbor_id]
                results.append({
                    "entity": neighbor,
                    "relationship": rel.relationship_type.value,
                    "depth": current_depth + 1,
                })
                queue.append((neighbor_id, current_depth + 1))

    return {"entity_id": entity_id, "neighbors": results, "total": len(results)}


# ============================================================================
# Statistics Endpoints
# ============================================================================

@app.get("/statistics", response_model=GraphStatistics, tags=["Statistics"])
async def get_statistics():
    """Get graph statistics"""
    return state.get_statistics()


@app.get("/statistics/types", tags=["Statistics"])
async def get_type_breakdown():
    """Get breakdown by type"""
    return {
        "entities": state.get_statistics().by_entity_type,
        "relationships": state.get_statistics().by_type,
    }


# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint"""
    return {
        "service": "AssetMind Knowledge Graph",
        "version": "1.0.0",
        "port": 5031,
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5031)
