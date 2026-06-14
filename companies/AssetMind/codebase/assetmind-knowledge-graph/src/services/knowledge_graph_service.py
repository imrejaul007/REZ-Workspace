"""
Knowledge Graph Service
Neo4j-backed financial knowledge graph
Port: 5040
"""

from fastapi import FastAPI
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Knowledge Graph Service", version="1.0.0")


class KnowledgeGraphService:
    """Financial knowledge graph with Neo4j"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Knowledge Graph"
        self.port = 5040
        self.nodes = {}
        self.relationships = []

    async def create_node(
        self,
        node_type: str,
        properties: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new node"""
        node_id = f"{node_type.lower()}_{properties.get('id', len(self.nodes))}"

        node = {
            "node_id": node_id,
            "type": node_type,
            "properties": properties,
            "created_at": datetime.utcnow().isoformat(),
        }

        self.nodes[node_id] = node
        return node

    async def create_relationship(
        self,
        from_node_id: str,
        to_node_id: str,
        relationship_type: str,
        properties: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Create a relationship between nodes"""
        rel = {
            "from": from_node_id,
            "to": to_node_id,
            "type": relationship_type,
            "properties": properties or {},
            "created_at": datetime.utcnow().isoformat(),
        }

        self.relationships.append(rel)
        return rel

    async def get_relationships(
        self,
        node_id: str,
        relationship_type: Optional[str] = None,
        direction: str = "both"
    ) -> List[Dict[str, Any]]:
        """Get relationships for a node"""
        rels = []

        for rel in self.relationships:
            if relationship_type and rel["type"] != relationship_type:
                continue

            if direction == "outgoing" and rel["from"] == node_id:
                rels.append(rel)
            elif direction == "incoming" and rel["to"] == node_id:
                rels.append(rel)
            elif direction == "both" and (rel["from"] == node_id or rel["to"] == node_id):
                rels.append(rel)

        return rels

    async def traverse(
        self,
        start_node_id: str,
        max_depth: int = 3
    ) -> Dict[str, Any]:
        """Traverse the graph from a node"""
        visited = {start_node_id}
        frontier = [start_node_id]
        depth = 0

        while frontier and depth < max_depth:
            next_frontier = []
            for node_id in frontier:
                rels = await self.get_relationships(node_id)
                for rel in rels:
                    next_id = rel["to"] if rel["from"] == node_id else rel["from"]
                    if next_id not in visited:
                        visited.add(next_id)
                        next_frontier.append(next_id)

            frontier = next_frontier
            depth += 1

        return {
            "start_node": start_node_id,
            "depth": depth,
            "visited_nodes": list(visited),
            "visited_count": len(visited),
        }


service = KnowledgeGraphService()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Knowledge Graph", "port": 5040}


@app.post("/api/v1/nodes")
async def create_node(request: Dict[str, Any]):
    return await service.create_node(request["node_type"], request["properties"])


@app.post("/api/v1/relationships")
async def create_relationship(request: Dict[str, Any]):
    return await service.create_relationship(
        request["from"],
        request["to"],
        request["type"],
        request.get("properties")
    )


@app.get("/api/v1/nodes/{node_id}/relationships")
async def get_relationships(
    node_id: str,
    relationship_type: str = None,
    direction: str = "both"
):
    return await service.get_relationships(node_id, relationship_type, direction)


@app.post("/api/v1/traverse")
async def traverse(request: Dict[str, Any]):
    return await service.traverse(request["start_node"], request.get("max_depth", 3))
