"""
AssetMind - Financial Knowledge Graph Service
Port: 5040

Neo4j-based knowledge graph for financial entities.
Maps relationships between companies, sectors, countries, and assets.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

app = FastAPI(title="AssetMind Knowledge Graph", version="1.0.0")

# In-memory storage (replace with Neo4j in production)
nodes: Dict[str, Dict] = {}
edges: List[Dict] = []


class NodeType(str, Enum):
    COMPANY = "company"
    SECTOR = "sector"
    COUNTRY = "country"
    ASSET = "asset"
    INDEX = "index"


class RelationshipType(str, Enum):
    SUPPLIES_TO = "supplies_to"
    COMPETES_WITH = "competes_with"
    PART_OF = "part_of"
    ACQUIRES = "acquires"
    AFFECTS = "affects"
    CORRELATED_WITH = "correlated_with"
    LOCATED_IN = "located_in"


class NodeCreate(BaseModel):
    id: Optional[str] = None
    type: NodeType
    name: str
    properties: Dict[str, Any] = Field(default_factory=dict)


class EdgeCreate(BaseModel):
    source_id: str
    target_id: str
    relationship: RelationshipType
    weight: float = 1.0


class GraphQuery(BaseModel):
    center_node_id: str
    depth: int = Field(1, ge=1, le=5)


class PathQuery(BaseModel):
    source_id: str
    target_id: str
    max_depth: int = Field(3, ge=1, le=5)


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-knowledge-graph",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5040,
        "nodes": len(nodes),
        "edges": len(edges)
    }


@app.post("/nodes", status_code=201)
async def create_node(request: NodeCreate):
    node_id = request.id or str(uuid.uuid4())
    if node_id in nodes:
        raise HTTPException(status_code=409, detail="Node already exists")

    node = {
        "id": node_id,
        "type": request.type.value,
        "name": request.name,
        "properties": request.properties,
        "relationships": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    nodes[node_id] = node
    return {"message": "Node created", "node": node}


@app.get("/nodes/{node_id}")
async def get_node(node_id: str):
    if node_id not in nodes:
        raise HTTPException(status_code=404, detail="Node not found")

    node_relationships = [e for e in edges if e["source_id"] == node_id or e["target_id"] == node_id]
    return {**nodes[node_id], "relationships": node_relationships}


@app.post("/edges", status_code=201)
async def create_edge(request: EdgeCreate):
    if request.source_id not in nodes:
        raise HTTPException(status_code=404, detail="Source node not found")
    if request.target_id not in nodes:
        raise HTTPException(status_code=404, detail="Target node not found")

    edge = {
        "id": str(uuid.uuid4()),
        "source_id": request.source_id,
        "target_id": request.target_id,
        "relationship": request.relationship.value,
        "weight": request.weight,
        "created_at": datetime.utcnow()
    }
    edges.append(edge)
    return {"message": "Edge created", "edge": edge}


@app.post("/query")
async def query_graph(request: GraphQuery):
    if request.center_node_id not in nodes:
        raise HTTPException(status_code=404, detail="Center node not found")

    visited = {request.center_node_id}
    current_level = {request.center_node_id}

    for _ in range(request.depth):
        next_level = set()
        for edge in edges:
            if edge["source_id"] in current_level and edge["target_id"] not in visited:
                next_level.add(edge["target_id"])
            elif edge["target_id"] in current_level and edge["source_id"] not in visited:
                next_level.add(edge["source_id"])
        visited.update(next_level)
        current_level = next_level

    result_nodes = [nodes[nid] for nid in visited if nid in nodes]
    result_edges = [e for e in edges if e["source_id"] in visited and e["target_id"] in visited]

    return {
        "center_node": nodes[request.center_node_id],
        "nodes": result_nodes,
        "edges": result_edges,
        "stats": {"total_nodes": len(result_nodes), "total_edges": len(result_edges)}
    }


@app.post("/path")
async def find_path(request: PathQuery):
    if request.source_id not in nodes or request.target_id not in nodes:
        raise HTTPException(status_code=404, detail="Node not found")

    queue = [(request.source_id, [request.source_id])]
    visited = {request.source_id}

    while queue:
        node_id, path = queue.pop(0)
        if node_id == request.target_id:
            path_edges = []
            for i in range(len(path) - 1):
                edge = next((e for e in edges if
                    (e["source_id"] == path[i] and e["target_id"] == path[i + 1]) or
                    (e["target_id"] == path[i] and e["source_id"] == path[i + 1])
                ), None)
                if edge:
                    path_edges.append(edge)
            return {"path": path, "edges": path_edges, "length": len(path) - 1}

        if len(path) - 1 >= request.max_depth:
            continue

        for edge in edges:
            neighbor = edge["target_id"] if edge["source_id"] == node_id else edge["source_id"] if edge["target_id"] == node_id else None
            if neighbor and neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))

    return {"path": [], "edges": [], "length": -1, "message": "No path found"}


@app.get("/supply-chain/{symbol}")
async def get_supply_chain(symbol: str):
    company_node = next((n for n in nodes.values() if n["properties"].get("symbol") == symbol or n["name"].lower() == symbol.lower()), None)
    if not company_node:
        raise HTTPException(status_code=404, detail="Symbol not found")

    supply_chain = []
    visited = {company_node["id"]}
    queue = [(company_node["id"], "")]

    while queue:
        node_id, _ = queue.pop(0)
        for edge in edges:
            if edge["relationship"] == "supplies_to":
                if edge["source_id"] == node_id and edge["target_id"] not in visited:
                    supplier = nodes.get(edge["target_id"])
                    if supplier:
                        supply_chain.append({"from": nodes[node_id]["name"], "to": supplier["name"], "relationship": "supplies_to"})
                        visited.add(edge["target_id"])
                        queue.append((edge["target_id"], "supplies_to"))
                elif edge["target_id"] == node_id and edge["source_id"] not in visited:
                    supplier = nodes.get(edge["source_id"])
                    if supplier:
                        supply_chain.append({"from": supplier["name"], "to": nodes[node_id]["name"], "relationship": "supplies_to"})
                        visited.add(edge["source_id"])
                        queue.append((edge["source_id"], "supplies_to"))

    return {"symbol": symbol, "company": company_node["name"], "supply_chain": supply_chain, "depth": len(supply_chain)}


@app.get("/stats")
async def get_stats():
    node_types = {}
    relationship_types = {}
    for node in nodes.values():
        node_types[node["type"]] = node_types.get(node["type"], 0) + 1
    for edge in edges:
        relationship_types[edge["relationship"]] = relationship_types.get(edge["relationship"], 0) + 1
    return {"total_nodes": len(nodes), "total_edges": len(edges), "node_types": node_types, "relationship_types": relationship_types}


@app.post("/bootstrap")
async def bootstrap_knowledge():
    """Bootstrap initial financial knowledge graph"""
    added = 0

    tech_companies = [
        {"id": "nvda", "name": "NVIDIA", "properties": {"symbol": "NVDA", "sector": "Technology"}},
        {"id": "tsmc", "name": "TSMC", "properties": {"symbol": "TSMC", "sector": "Technology"}},
        {"id": "apple", "name": "Apple", "properties": {"symbol": "AAPL", "sector": "Technology"}},
        {"id": "microsoft", "name": "Microsoft", "properties": {"symbol": "MSFT", "sector": "Technology"}},
    ]

    for company in tech_companies:
        if company["id"] not in nodes:
            nodes[company["id"]] = {"id": company["id"], "type": "company", "name": company["name"], "properties": company["properties"], "relationships": [], "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
            added += 1

    sectors = [
        {"id": "tech", "name": "Technology"}, {"id": "finance", "name": "Financial Services"},
        {"id": "healthcare", "name": "Healthcare"}, {"id": "energy", "name": "Energy"},
    ]
    for sector in sectors:
        if sector["id"] not in nodes:
            nodes[sector["id"]] = {"id": sector["id"], "type": "sector", "name": sector["name"], "properties": {}, "relationships": [], "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
            added += 1

    countries = [
        {"id": "usa", "name": "United States"}, {"id": "taiwan", "name": "Taiwan"},
        {"id": "china", "name": "China"}, {"id": "india", "name": "India"},
    ]
    for country in countries:
        if country["id"] not in nodes:
            nodes[country["id"]] = {"id": country["id"], "type": "country", "name": country["name"], "properties": {}, "relationships": [], "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
            added += 1

    supply_edges = [
        {"source_id": "nvda", "target_id": "tsmc", "relationship": "supplies_to"},
        {"source_id": "tsmc", "target_id": "taiwan", "relationship": "located_in"},
        {"source_id": "nvda", "target_id": "usa", "relationship": "located_in"},
        {"source_id": "amd", "target_id": "tsmc", "relationship": "supplies_to"},
        {"source_id": "apple", "target_id": "tsmc", "relationship": "supplies_to"},
        {"source_id": "nvda", "target_id": "tech", "relationship": "part_of"},
    ]

    for edge_data in supply_edges:
        exists = any(e["source_id"] == edge_data["source_id"] and e["target_id"] == edge_data["target_id"] for e in edges)
        if not exists:
            edges.append({"id": str(uuid.uuid4()), "source_id": edge_data["source_id"], "target_id": edge_data["target_id"], "relationship": edge_data["relationship"], "weight": 1.0, "created_at": datetime.utcnow()})
            added += 1

    return {"message": "Bootstrap complete", "nodes_added": added, "total_nodes": len(nodes), "total_edges": len(edges)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5040)