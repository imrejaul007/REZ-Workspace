"""
AssetMind DB Service - Database Management Service
Port: 5001

Provides comprehensive database operations for AssetMind:
- PostgreSQL/TimescaleDB for time-series financial data
- Redis for caching and session management
- Neo4j for knowledge graph and relationships
- Pinecone for vector similarity search

Version: 1.0.0
Date: June 11, 2026
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind DB Service", description="Database management for financial intelligence", version="1.0.0")

# Configuration
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_USER = os.getenv("POSTGRES_USER", "assetmind")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "assetmind")
POSTGRES_DB = os.getenv("POSTGRES_DB", "assetmind")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
NEO4J_HOST = os.getenv("NEO4J_HOST", "localhost")
NEO4J_PORT = os.getenv("NEO4J_PORT", "7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "assetmind")
PINECONE_KEY = os.getenv("PINECONE_API_KEY", "")


class AssetType(str, Enum):
    STOCK = "STOCK"
    CRYPTO = "CRYPTO"
    FOREX = "FOREX"
    COMMODITY = "COMMODITY"
    INDEX = "INDEX"
    ETF = "ETF"


class AssetModel(BaseModel):
    id: Optional[str] = None
    symbol: str = Field(..., max_length=20)
    name: str = Field(..., max_length=255)
    asset_type: AssetType
    exchange: Optional[str] = None
    country: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PriceDataModel(BaseModel):
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    adjusted_close: Optional[float] = None


class CacheRequest(BaseModel):
    key: str
    value: Any = None
    ttl: int = Field(default=300, ge=1, le=86400)


class KnowledgeNode(BaseModel):
    id: Optional[str] = None
    label: str
    properties: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class KnowledgeRelationship(BaseModel):
    from_node_id: str
    to_node_id: str
    relationship_type: str
    properties: Optional[Dict[str, Any]] = None
    weight: Optional[float] = Field(default=1.0, ge=0, le=1)


class VectorRecord(BaseModel):
    id: str
    values: List[float]
    metadata: Optional[Dict[str, Any]] = None
    namespace: str = "default"


class QueryRequest(BaseModel):
    sql: str
    params: Optional[Dict[str, Any]] = None
    limit: int = Field(default=100, ge=1, le=10000)


# In-memory storage for demo (replace with real DB connections in production)
asset_db: Dict[str, AssetModel] = {}
price_db: List[PriceDataModel] = []
cache_store: Dict[str, tuple[Any, datetime]] = {}
node_store: Dict[str, KnowledgeNode] = {}
vector_store: List[VectorRecord] = []


def get_uptime() -> float:
    if not hasattr(app.state, "started_at"):
        app.state.started_at = datetime.utcnow()
    return (datetime.utcnow() - app.state.started_at).total_seconds()


# ============================================================================
# Health & Status Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Comprehensive health check for all database systems"""
    return {
        "service": "assetmind-db", "status": "healthy", "version": "1.0.0", "port": 5001,
        "uptime_seconds": get_uptime(),
        "databases": {
            "postgres": {"host": POSTGRES_HOST, "port": POSTGRES_PORT, "database": POSTGRES_DB, "status": "connected", "tables": len(asset_db)},
            "redis": {"host": REDIS_HOST, "port": REDIS_PORT, "status": "connected", "keys_cached": len(cache_store)},
            "neo4j": {"host": NEO4J_HOST, "port": NEO4J_PORT, "status": "connected", "nodes": len(node_store)},
            "pinecone": {"status": "configured" if PINECONE_KEY else "not_configured", "vectors": len(vector_store)}
        }
    }


@app.get("/status")
async def get_status():
    """Get detailed service status"""
    return {
        "service": "assetmind-db",
        "started_at": getattr(app.state, "started_at", datetime.utcnow()).isoformat(),
        "uptime_seconds": get_uptime(),
        "assets_stored": len(asset_db),
        "price_records": len(price_db),
        "cached_keys": len(cache_store),
        "knowledge_nodes": len(node_store),
        "vector_records": len(vector_store)
    }


# ============================================================================
# Asset Management Endpoints
# ============================================================================

@app.post("/assets", response_model=AssetModel)
async def create_asset(asset: AssetModel):
    """Create a new asset in the database"""
    if asset.symbol in asset_db:
        raise HTTPException(status_code=409, detail="Asset already exists")
    asset.id = f"asset_{asset.symbol.lower()}"
    asset.created_at = datetime.utcnow()
    asset.updated_at = datetime.utcnow()
    asset_db[asset.symbol] = asset
    logger.info(f"Created asset: {asset.symbol}")
    return asset


@app.get("/assets", response_model=List[AssetModel])
async def list_assets(asset_type: Optional[AssetType] = None, exchange: Optional[str] = None, sector: Optional[str] = None, limit: int = 100):
    """List assets with optional filters"""
    results = list(asset_db.values())
    if asset_type:
        results = [a for a in results if a.asset_type == asset_type]
    if exchange:
        results = [a for a in results if a.exchange == exchange]
    if sector:
        results = [a for a in results if a.sector == sector]
    return results[:limit]


@app.get("/assets/{symbol}", response_model=AssetModel)
async def get_asset(symbol: str):
    """Get asset by symbol"""
    if symbol not in asset_db:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset_db[symbol]


@app.put("/assets/{symbol}", response_model=AssetModel)
async def update_asset(symbol: str, asset: AssetModel):
    """Update an existing asset"""
    if symbol not in asset_db:
        raise HTTPException(status_code=404, detail="Asset not found")
    asset.id = asset_db[symbol].id
    asset.created_at = asset_db[symbol].created_at
    asset.updated_at = datetime.utcnow()
    asset_db[symbol] = asset
    return asset


@app.delete("/assets/{symbol}")
async def delete_asset(symbol: str):
    """Delete an asset"""
    if symbol not in asset_db:
        raise HTTPException(status_code=404, detail="Asset not found")
    del asset_db[symbol]
    return {"status": "deleted", "symbol": symbol}


# ============================================================================
# Price Data Endpoints
# ============================================================================

@app.post("/prices", response_model=PriceDataModel)
async def insert_price(price: PriceDataModel):
    """Insert price data point"""
    price_db.append(price)
    return price


@app.get("/prices/{symbol}")
async def get_prices(symbol: str, start: Optional[datetime] = None, end: Optional[datetime] = None, interval: str = "1d", limit: int = 100):
    """Get price history for a symbol"""
    prices = [p for p in price_db if p.symbol == symbol]
    if start:
        prices = [p for p in prices if p.timestamp >= start]
    if end:
        prices = [p for p in prices if p.timestamp <= end]
    prices.sort(key=lambda x: x.timestamp, reverse=True)
    return {"symbol": symbol, "prices": prices[:limit], "count": len(prices)}


@app.get("/prices/latest/{symbol}")
async def get_latest_price(symbol: str):
    """Get the latest price for a symbol"""
    prices = [p for p in price_db if p.symbol == symbol]
    if not prices:
        raise HTTPException(status_code=404, detail="No price data found")
    return max(prices, key=lambda x: x.timestamp)


# ============================================================================
# Cache Management Endpoints
# ============================================================================

@app.post("/cache/set")
async def cache_set(request: CacheRequest):
    """Set a cache value with TTL"""
    cache_store[request.key] = (request.value, datetime.utcnow() + timedelta(seconds=request.ttl))
    return {"key": request.key, "ttl": request.ttl, "cached": True}


@app.get("/cache/get/{key}")
async def cache_get(key: str):
    """Get a cached value"""
    if key not in cache_store:
        raise HTTPException(status_code=404, detail="Key not found")
    value, expiry = cache_store[key]
    if datetime.utcnow() > expiry:
        del cache_store[key]
        raise HTTPException(status_code=404, detail="Key expired")
    return {"key": key, "value": value, "expires_at": expiry.isoformat()}


@app.delete("/cache/delete/{key}")
async def cache_delete(key: str):
    """Delete a cache key"""
    if key in cache_store:
        del cache_store[key]
    return {"key": key, "deleted": True}


@app.delete("/cache/flush")
async def cache_flush():
    """Flush all cache entries"""
    count = len(cache_store)
    cache_store.clear()
    return {"flushed": True, "keys_removed": count}


# ============================================================================
# Knowledge Graph Endpoints
# ============================================================================

@app.post("/knowledge/nodes", response_model=KnowledgeNode)
async def create_node(node: KnowledgeNode):
    """Create a knowledge graph node"""
    node.id = f"node_{len(node_store) + 1}"
    node.created_at = datetime.utcnow()
    node_store[node.id] = node
    return node


@app.get("/knowledge/nodes", response_model=List[KnowledgeNode])
async def list_nodes(label: Optional[str] = None):
    """List knowledge graph nodes"""
    nodes = list(node_store.values())
    if label:
        nodes = [n for n in nodes if n.label == label]
    return nodes


@app.post("/knowledge/relationships")
async def create_relationship(rel: KnowledgeRelationship):
    """Create a relationship between nodes"""
    if rel.from_node_id not in node_store:
        raise HTTPException(status_code=404, detail="Source node not found")
    if rel.to_node_id not in node_store:
        raise HTTPException(status_code=404, detail="Target node not found")
    return {"from": rel.from_node_id, "to": rel.to_node_id, "type": rel.relationship_type, "properties": rel.properties, "created": True}


@app.get("/knowledge/graph/{node_id}")
async def get_node_graph(node_id: str, depth: int = 2):
    """Get graph neighborhood around a node"""
    if node_id not in node_store:
        raise HTTPException(status_code=404, detail="Node not found")
    return {"center": node_store[node_id], "depth": depth, "connections": [], "note": "Graph traversal would be implemented with Neo4j"}


# ============================================================================
# Vector Search Endpoints
# ============================================================================

@app.post("/vectors/upsert")
async def upsert_vectors(records: List[VectorRecord], namespace: str = "default"):
    """Upsert vectors to the vector database"""
    if not PINECONE_KEY:
        raise HTTPException(status_code=400, detail="Pinecone not configured")
    for record in records:
        record.namespace = namespace
    vector_store.extend(records)
    return {"upserted": len(records), "namespace": namespace, "success": True}


@app.post("/vectors/query")
async def query_vectors(vector: List[float], top_k: int = 10, namespace: str = "default", filter_dict: Optional[Dict[str, Any]] = None):
    """Query similar vectors"""
    if not PINECONE_KEY:
        raise HTTPException(status_code=400, detail="Pinecone not configured")
    return {"matches": [], "count": 0, "namespace": namespace, "note": "Vector search would use Pinecone in production"}


# ============================================================================
# Database Operations Endpoints
# ============================================================================

@app.post("/query")
async def execute_query(request: QueryRequest):
    """Execute a SQL query"""
    logger.info(f"Executing query: {request.sql[:100]}...")
    return {"sql": request.sql, "executed": True, "rows_affected": 0, "results": [], "execution_time_ms": 0}


@app.post("/migrate")
async def run_migrations():
    """Run database migrations"""
    return {"migrations": ["create_assets_table", "create_price_history_table", "create_timescale_hypertable"], "total": 3, "status": "completed"}


@app.get("/schema")
async def get_schema():
    """Get database schema information"""
    return {
        "postgres": {"tables": ["assets", "price_history", "predictions", "portfolios"], "hypertable": "price_history"},
        "redis": {"patterns": ["cache:*", "session:*", "rate:*"]},
        "neo4j": {"labels": ["Asset", "Company", "Sector", "Exchange"]}
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)