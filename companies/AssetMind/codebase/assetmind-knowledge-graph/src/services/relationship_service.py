"""
Relationship Service
Maps and manages asset relationships
Port: 5041
"""

from fastapi import FastAPI
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Relationship Service", version="1.0.0")


class RelationshipService:
    """Maps financial relationships between entities"""

    RELATIONSHIP_TYPES = [
        "SUPPLIES_TO",
        "CUSTOMER_OF",
        "COMPETES_WITH",
        "PARTNERED_WITH",
        "ACQUIRED",
        "AFFECTED_BY_RATE",
        "AFFECTED_BY_INFLATION",
        "LOCATED_IN",
        "AFFECTED_BY_GEO",
        "LEADS_THEME",
        "BELONGS_TO_SECTOR",
        "SIMILAR_TO",
        "SECTOR_ROTATION",
        "INVESTS_IN",
        "DERIVED_FROM",
    ]

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Relationship Service"
        self.port = 5041
        self.relationships = {}

    async def map_relationship(
        self,
        source_id: str,
        target_id: str,
        rel_type: str,
        strength: float = 1.0,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Map a relationship between two entities"""
        rel_key = f"{source_id}|{rel_type}|{target_id}"

        relationship = {
            "relationship_id": rel_key,
            "source_id": source_id,
            "target_id": target_id,
            "type": rel_type,
            "strength": strength,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat(),
        }

        self.relationships[rel_key] = relationship
        return relationship

    async def get_related(
        self,
        entity_id: str,
        rel_types: List[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get all entities related to this entity"""
        results = []

        for rel in self.relationships.values():
            if rel["source_id"] == entity_id or rel["target_id"] == entity_id:
                if rel_types is None or rel["type"] in rel_types:
                    results.append(rel)

        return sorted(results, key=lambda x: x["strength"], reverse=True)[:limit]

    async def get_competitors(self, entity_id: str) -> List[Dict[str, Any]]:
        """Get competitors of an entity"""
        return await self.get_related(entity_id, ["COMPETES_WITH"])

    async def get_supply_chain(self, entity_id: str) -> List[Dict[str, Any]]:
        """Get supply chain of an entity"""
        return await self.get_related(entity_id, ["SUPPLIES_TO", "CUSTOMER_OF"])

    async def get_themes(self, entity_id: str) -> List[Dict[str, Any]]:
        """Get themes related to an entity"""
        return await self.get_related(entity_id, ["LEADS_THEME", "AFFECTED_BY_GEO"])


service = RelationshipService()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Relationship", "port": 5041}


@app.get("/api/v1/types")
async def get_types():
    return {"types": RelationshipService.RELATIONSHIP_TYPES}


@app.post("/api/v1/map")
async def map_relationship(request: Dict[str, Any]):
    return await service.map_relationship(
        request["source_id"],
        request["target_id"],
        request["type"],
        request.get("strength", 1.0),
        request.get("metadata")
    )


@app.get("/api/v1/related/{entity_id}")
async def get_related(
    entity_id: str,
    rel_types: str = None,
    limit: int = 100
):
    types = rel_types.split(",") if rel_types else None
    return await service.get_related(entity_id, types, limit)


@app.get("/api/v1/competitors/{entity_id}")
async def get_competitors(entity_id: str):
    return await service.get_competitors(entity_id)


@app.get("/api/v1/supply-chain/{entity_id}")
async def get_supply_chain(entity_id: str):
    return await service.get_supply_chain(entity_id)


@app.get("/api/v1/themes/{entity_id}")
async def get_themes(entity_id: str):
    return await service.get_themes(entity_id)
