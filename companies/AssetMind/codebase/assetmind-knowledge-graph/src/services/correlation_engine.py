"""
Correlation Engine
Maps asset dependencies and calculates cascade impacts
Port: 5043

This engine maps relationships between assets, companies, and events to calculate
correlation coefficients and identify dependencies and cascades. It answers questions like:
- "NVIDIA depends on TSMC → TSMC depends on Taiwan → geopolitical stability"
- "What happens to Semiconductors if Taiwan tensions rise?"
- "Which assets are at risk if oil hits $150?"
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Set, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import asyncio
import numpy as np
from collections import defaultdict

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Correlation Engine", version="1.0.0", docs_url="/docs")


class RelationshipType(str, Enum):
    """Types of relationships between entities"""
    SUPPLIER = "supplier" # X supplies Y
    CUSTOMER = "customer"           # X buys from Y
    COMPETITOR = "competitor"       # X competes with Y
    REGULATORY = "regulatory"       # X regulates Y
    GEOGRAPHIC = "geographic"       # X is located in Y
    SECTOR = "sector"              # X is in sector Y
    PARENT = "parent"              # X owns Y
    SUBSIDIARY = "subsidiary" # X is owned by Y
    INPUT_DEPENDENCY = "input" # X requires Y as input
    OUTPUT_DEPENDENCY = "output"    # X's output is Y's input
    CORRELATED = "correlated"       # X and Y move together
    ANTI_CORRELATED = "anti_correlated"  # X and Y move opposite
    NARRATIVE = "narrative"          # X is affected by Y's narrative


class CascadeDirection(str, Enum):
    UPSTREAM = "upstream"           # Effects flow upstream (supplier affected)
    DOWNSTREAM = "downstream"       # Effects flow downstream (customer affected)
    LATERAL = "lateral"             # Effects flow to competitors
    SECTOR = "sector"               # Effects flow to sector peers


class Entity(BaseModel):
    """An entity in the correlation graph"""
    entity_id: str
    name: str
    entity_type: str  # company, country, sector, commodity, index
    metadata: Dict[str, Any] = Field(default_factory=dict)
    risk_factors: List[str] = Field(default_factory=list)
    exposure_scores: Dict[str, float] = Field(default_factory=dict)


class Relationship(BaseModel):
    """A relationship between two entities"""
    relationship_id: str
    from_entity: str
    to_entity: str
    relationship_type: RelationshipType
    strength: float = Field(ge=0, le=1)  # 0-1 strength
    confidence: float = Field(ge=0, le=1)  # 0-1 confidence
    latency_hours: int = 0  # How long until effect materializes
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CorrelationResult(BaseModel):
    """Result of correlation analysis"""
    entity_id: str
    correlation_id: str
    related_entities: List[Dict[str, Any]]
    cascade_risk: float = Field(ge=0, le=100)
    systemic_importance: float = Field(ge=0, le=100)
    chain_of_effects: List[Dict[str, Any]]
    calculated_at: datetime


class CascadeScenario(BaseModel):
    """A cascade scenario from an initial event"""
    scenario_id: str
    trigger_entity: str
    trigger_event: str
    affected_entities: List[Dict[str, Any]]
    total_impact_score: float
    confidence: float
    timeline_hours: List[int]
    recommendations: List[str]


class CorrelationEngine:
    """
    Maps asset dependencies and calculates cascade impacts.

    Key capabilities:
    - Build dependency graphs between entities
    - Calculate correlation coefficients
    - Identify cascade paths
    - Propagate impacts through the graph
    - Real-time correlation updates
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Correlation Engine"
        self.port = 5043
        self.version = "1.0.0"

        # Core data structures
        self.entities: Dict[str, Entity] = {}
        self.relationships: Dict[str, List[Relationship]] = defaultdict(list)
        self.price_history: Dict[str, List[Tuple[datetime, float]]] = defaultdict(list)
        self.correlation_cache: Dict[str, float] = {}
 self.last_calculation: Dict[str, datetime] = {}

        # Initialize with known relationships
        self._initialize_knowledge_graph()

    def _initialize_knowledge_graph(self):
        """Initialize the knowledge graph with known entity relationships"""

        # Semiconductor supply chain
        semiconductor_entities = [
            Entity(entity_id="NVDA", name="NVIDIA", entity_type="company",
                   metadata={"sector": "semiconductors", "market_cap": 2.17e12},
                   risk_factors=["TSMC dependency", "China market exposure"]),
            Entity(entity_id="AMD", name="AMD", entity_type="company",
                   metadata={"sector": "semiconductors", "market_cap": 280e9},
                   risk_factors=["TSMC dependency"]),
            Entity(entity_id="INTC", name="Intel", entity_type="company",
                   metadata={"sector": "semiconductors", "market_cap": 180e9},
                   risk_factors=["Competition", "Manufacturing issues"]),
            Entity(entity_id="TSMC", name="TSMC", entity_type="company",
                   metadata={"sector": "semiconductor_manufacturing", "market_cap": 800e9},
                   risk_factors=["Taiwan geopolitics", "Water availability"]),
            Entity(entity_id="ASML", name="ASML", entity_type="company",
                   metadata={"sector": "semiconductor_equipment", "market_cap": 380e9},
                   risk_factors=["EUV technology monopoly"]),
 ]

        # Geographic entities
        geographic_entities = [
            Entity(entity_id="TAIWAN", name="Taiwan", entity_type="country",
                   metadata={"region": "Asia-Pacific", "gdp": 800e9},
                   risk_factors=["China tensions", "Natural disasters"]),
            Entity(entity_id="CHINA", name="China", entity_type="country",
                   metadata={"region": "Asia-Pacific", "gdp": 18e12},
                   risk_factors=["Policy uncertainty", "Demographics"]),
            Entity(entity_id="USA", name="United States", entity_type="country",
                   metadata={"region": "North America", "gdp": 25e12},
                   risk_factors=["Political division", "Debt levels"]),
            Entity(entity_id="S_KOREA", name="South Korea", entity_type="country",
                   metadata={"region": "Asia-Pacific", "gdp": 1.7e12},
                   risk_factors=["North Korea", "Export dependency"]),
        ]

        # Sector entities
        sector_entities = [
            Entity(entity_id="SEMICONDUCTORS", name="Semiconductor Sector", entity_type="sector",
                   metadata={"index": "SOX", "market_cap": 3.5e12},
                   risk_factors=["Cycles", "CapEx requirements"]),
            Entity(entity_id="TECH", name="Technology Sector", entity_type="sector",
                   metadata={"index": "XLK", "market_cap": 5e12},
                   risk_factors=["Regulation", "Talent competition"]),
            Entity(entity_id="ENERGY", name="Energy Sector", entity_type="sector",
                   metadata={"index": "XLE", "market_cap": 1.2e12},
                   risk_factors=["Oil prices", "Energy transition"]),
            Entity(entity_id="FINANCE", name="Financial Sector", entity_type="sector",
                   metadata={"index": "XLF", "market_cap": 1.5e12},
                   risk_factors=["Interest rates", "Credit risk"]),
        ]

        # Commodity entities
        commodity_entities = [
            Entity(entity_id="OIL", name="Crude Oil", entity_type="commodity",
                   metadata={"unit": "USD/barrel", "基准": "WTI"},
                   risk_factors=["OPEC", "Demand cycles", "Geopolitics"]),
            Entity(entity_id="GOLD", name="Gold", entity_type="commodity",
                   metadata={"unit": "USD/oz"},
                   risk_factors=["Inflation", "Safe haven flows"]),
            Entity(entity_id="COPPER", name="Copper", entity_type="commodity",
                   metadata={"unit": "USD/pound", "alias": "Dr. Copper"},
                   risk_factors=["China demand", "Green energy transition"]),
        ]

        # Register all entities
        for entity in semiconductor_entities + geographic_entities + sector_entities + commodity_entities:
            self.entities[entity.entity_id] = entity

        # Build known relationships
        self._add_relationship("NVDA", "TSMC", RelationshipType.SUPPLIER, 0.95, 0.99, 0)
        self._add_relationship("AMD", "TSMC", RelationshipType.SUPPLIER, 0.90, 0.99, 0)
        self._add_relationship("INTC", "TSMC", RelationshipType.SUPPLIER, 0.30, 0.95, 0)
        self._add_relationship("TSMC", "TAIWAN", RelationshipType.GEOGRAPHIC, 1.0, 1.0, 0)
        self._add_relationship("ASML", "TSMC", RelationshipType.CUSTOMER, 0.85, 0.95, 0)

        # Sector relationships
        self._add_relationship("NVDA", "SEMICONDUCTORS", RelationshipType.SECTOR, 0.80, 0.95, 0)
        self._add_relationship("AMD", "SEMICONDUCTORS", RelationshipType.SECTOR, 0.75, 0.95, 0)
        self._add_relationship("INTC", "SEMICONDUCTORS", RelationshipType.SECTOR, 0.70, 0.95, 0)
        self._add_relationship("SEMICONDUCTORS", "TECH", RelationshipType.SECTOR, 0.90, 0.90, 0)

        # Geographic relationships
        self._add_relationship("CHINA", "TAIWAN", RelationshipType.REGULATORY, 0.80, 0.85, 24)
        self._add_relationship("NVDA", "CHINA", RelationshipType.CUSTOMER, 0.25, 0.90, 0)
        self._add_relationship("NVDA", "USA", RelationshipType.GEOGRAPHIC, 1.0, 1.0, 0)

        # Cross-sector correlations
        self._add_relationship("OIL", "ENERGY", RelationshipType.SECTOR, 1.0, 1.0, 0)
        self._add_relationship("OIL", "COPPER", RelationshipType.CORRELATED, 0.65, 0.80, 0)
        self._add_relationship("GOLD", "FINANCE", RelationshipType.CORRELATED, 0.40, 0.75, 0)

        logger.info(f"Initialized knowledge graph with {len(self.entities)} entities")

    def _add_relationship(
        self,
        from_entity: str,
        to_entity: str,
        rel_type: RelationshipType,
        strength: float,
        confidence: float,
        latency_hours: int
    ):
        """Add a relationship to the graph"""
        rel_id = f"{from_entity}_{to_entity}_{rel_type.value}"
        rel = Relationship(
            relationship_id=rel_id,
            from_entity=from_entity,
            to_entity=to_entity,
            relationship_type=rel_type,
            strength=strength,
            confidence=confidence,
            latency_hours=latency_hours
        )
        self.relationships[from_entity].append(rel)

    async def add_entity(self, entity: Entity) -> Entity:
        """Add a new entity to the graph"""
        self.entities[entity.entity_id] = entity
        logger.info(f"Added entity: {entity.entity_id}")
        return entity

    async def add_relationship(
        self,
        from_entity: str,
        to_entity: str,
        relationship_type: RelationshipType,
        strength: float = 0.5,
        confidence: float = 0.5,
        latency_hours: int = 0,
        metadata: Dict[str, Any] = None
    ) -> Relationship:
        """Add a relationship between two entities"""
        if from_entity not in self.entities:
            raise HTTPException(status_code=404, detail=f"Entity {from_entity} not found")
        if to_entity not in self.entities:
            raise HTTPException(status_code=404, detail=f"Entity {to_entity} not found")

        rel_id = f"{from_entity}_{to_entity}_{relationship_type.value}"
        rel = Relationship(
            relationship_id=rel_id,
            from_entity=from_entity,
            to_entity=to_entity,
            relationship_type=relationship_type,
            strength=strength,
            confidence=confidence,
            latency_hours=latency_hours,
            metadata=metadata or {}
        )
        self.relationships[from_entity].append(rel)
        logger.info(f"Added relationship: {rel_id}")
        return rel

    async def get_entity_relationships(
        self,
        entity_id: str,
        relationship_type: Optional[RelationshipType] = None
    ) -> List[Relationship]:
        """Get all relationships for an entity"""
        if entity_id not in self.entities:
            raise HTTPException(status_code=404, detail=f"Entity {entity_id} not found")

        rels = self.relationships.get(entity_id, [])
        if relationship_type:
            rels = [r for r in rels if r.relationship_type == relationship_type]
        return rels

    async def calculate_correlation(
        self,
        entity_a: str,
        entity_b: str,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Calculate correlation coefficient between two entities"""
        cache_key = f"{entity_a}_{entity_b}_{period_days}"

        if cache_key in self.correlation_cache:
            return {
                "entity_a": entity_a,
                "entity_b": entity_b,
                "correlation": self.correlation_cache[cache_key],
                "source": "cache",
                "calculated_at": self.last_calculation.get(cache_key)
            }

        # Get price history for both entities
        prices_a = self.price_history.get(entity_a, [])
        prices_b = self.price_history.get(entity_b, [])

        if len(prices_a) < 10 or len(prices_b) < 10:
            # Use known correlations from relationships
            rels = self.relationships.get(entity_a, [])
            for rel in rels:
                if rel.to_entity == entity_b:
                    correlation = rel.strength * rel.confidence
                    self.correlation_cache[cache_key] = correlation
                    self.last_calculation[cache_key] = datetime.utcnow()
                    return {
                        "entity_a": entity_a,
                        "entity_b": entity_b,
                        "correlation": correlation,
                        "source": "relationship",
                        "relationship_type": rel.relationship_type.value,
                        "confidence": rel.confidence
                    }

            return {
                "entity_a": entity_a,
                "entity_b": entity_b,
                "correlation": 0.0,
                "source": "insufficient_data"
            }

        # Calculate actual correlation from price history
        returns_a = self._calculate_returns([p[1] for p in prices_a])
        returns_b = self._calculate_returns([p[1] for p in prices_b])

        min_len = min(len(returns_a), len(returns_b))
        correlation = np.corrcoef(returns_a[-min_len:], returns_b[-min_len:])[0, 1]

        self.correlation_cache[cache_key] = correlation
        self.last_calculation[cache_key] = datetime.utcnow()

        return {
            "entity_a": entity_a,
            "entity_b": entity_b,
            "correlation": float(correlation),
            "source": "price_history",
            "sample_size": min_len
        }

    def _calculate_returns(self, prices: List[float]) -> List[float]:
        """Calculate returns from prices"""
        if len(prices) < 2:
            return []
        return [(prices[i] / prices[i-1]) - 1 for i in range(1, len(prices))]

    async def propagate_impact(
        self,
        source_entity: str,
        impact_magnitude: float,
        direction: CascadeDirection = CascadeDirection.DOWNSTREAM,
        max_depth: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Propagate an impact through the dependency graph.

        Args:
            source_entity: The entity experiencing the impact
            impact_magnitude: The magnitude of the impact (-1 to 1)
            direction: Which direction to propagate
            max_depth: Maximum depth of propagation

        Returns:
            List of affected entities with impact scores
        """
        affected = []
        visited: Set[str] = set()
        queue = [(source_entity, impact_magnitude, 0)]

        while queue:
            current, current_impact, depth = queue.pop(0)

            if current in visited or depth > max_depth:
                continue
            visited.add(current)

            if current != source_entity:
                affected.append({
                    "entity_id": current,
                    "entity_name": self.entities.get(current, Entity(
                        entity_id=current, name=current, entity_type="unknown"
                    )).name,
                    "impact_score": current_impact,
                    "depth": depth,
                    "direction": direction.value
                })

            # Get relationships for this entity
            rels = self.relationships.get(current, [])

            for rel in rels:
                next_entity = rel.to_entity if direction == CascadeDirection.DOWNSTREAM else rel.from_entity

                if next_entity in visited:
                    continue

                # Calculate propagated impact
                propagation_factor = rel.strength * rel.confidence
                latency = rel.latency_hours

                propagated_impact = current_impact * propagation_factor

                # Adjust for latency (impacts diminish over time horizon)
                if latency > 0:
                    time_decay = max(0.5, 1 - (latency / 168))  # Decay over1 week
                    propagated_impact *= time_decay

                queue.append((next_entity, propagated_impact, depth + 1))

        # Sort by impact magnitude
        affected.sort(key=lambda x: abs(x["impact_score"]), reverse=True)
        return affected

    async def analyze_cascade_risk(
        self,
        entity_id: str,
        stress_scenario: str
    ) -> CascadeScenario:
        """Analyze cascade risk for an entity under stress"""
        scenario_id = f"cascade_{entity_id}_{datetime.utcnow().timestamp()}"

        # Determine direction based on scenario
        if "Taiwan" in stress_scenario or "geopolitical" in stress_scenario.lower():
            direction = CascadeDirection.UPSTREAM
            trigger_entity = "TAIWAN"
        elif "oil" in stress_scenario.lower() or "energy" in stress_scenario.lower():
            direction = CascadeDirection.DOWNSTREAM
            trigger_entity = "OIL"
        else:
            direction = CascadeDirection.DOWNSTREAM
            trigger_entity = entity_id

        # Calculate impact magnitude
        impact_magnitude = 0.8 if "critical" in stress_scenario.lower() else 0.5

        # Propagate impact
        affected = await self.propagate_impact(
            source_entity=trigger_entity,
            impact_magnitude=impact_magnitude,
            direction=direction,
            max_depth=4
        )

        # Calculate total impact score
        total_impact = sum(abs(a["impact_score"]) for a in affected)

        # Generate timeline
        timeline_hours = sorted(list(set(a["depth"] * 24 for a in affected)))

        # Generate recommendations
        recommendations = self._generate_recommendations(entity_id, affected)

        return CascadeScenario(
            scenario_id=scenario_id,
            trigger_entity=trigger_entity,
            trigger_event=stress_scenario,
            affected_entities=affected,
            total_impact_score=total_impact,
            confidence=0.85,
            timeline_hours=timeline_hours,
            recommendations=recommendations
        )

    def _generate_recommendations(
        self,
        entity_id: str,
        affected: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate recommendations based on cascade analysis"""
        recommendations = []

        high_impact = [a for a in affected if abs(a["impact_score"]) > 0.5]

        if high_impact:
            recommendations.append(
                f"Alert: {len(high_impact)} entities at high risk from cascade effects"
            )

        # Check for specific risk patterns
        affected_ids = [a["entity_id"] for a in affected]

        if "TSMC" in affected_ids:
            recommendations.append(
                "CRITICAL: TSMC in cascade path - consider hedging semiconductor exposure"
            )

        if "TAIWAN" in affected_ids:
            recommendations.append(
                "WARNING: Taiwan exposure significant - monitor geopolitical developments"
            )

        if "OIL" in affected_ids:
            recommendations.append(
                "Energy sector in cascade path - review energy-related positions"
            )

        if not recommendations:
            recommendations.append("Monitor affected entities for momentum changes")

        return recommendations

    async def get_systemic_importance(self, entity_id: str) -> float:
        """Calculate how systemically important an entity is"""
        if entity_id not in self.entities:
            return 0.0

        # Count how many entities depend on this one
        incoming_rels = 0
        total_strength = 0.0

        for entity, rels in self.relationships.items():
            for rel in rels:
                if rel.to_entity == entity_id:
                    incoming_rels += 1
                    total_strength += rel.strength

        # Count geographic/sector reach
        geo_sector_count = 0
        for entity, rels in self.relationships.items():
            for rel in rels:
                if rel.from_entity == entity_id:
                    if rel.relationship_type in [RelationshipType.GEOGRAPHIC, RelationshipType.SECTOR]:
                        geo_sector_count += 1

        # Calculate systemic importance score
        importance = (incoming_rels * 10 + total_strength * 50 + geo_sector_count * 15)
        return min(100, importance)

    async def find_dependency_chain(
        self,
        from_entity: str,
        to_entity: str
    ) -> List[Dict[str, Any]]:
        """Find the dependency chain between two entities"""
        visited: Set[str] = set()
        path: List[Dict[str, Any]] = []

        def dfs(current: str, target: str, chain: List[Dict[str, Any]]) -> bool:
            if current == target:
                path.extend(chain)
                return True

            if current in visited:
                return False

            visited.add(current)

            for rel in self.relationships.get(current, []):
                next_entity = rel.to_entity
                chain_step = {
                    "from": current,
                    "to": next_entity,
                    "relationship": rel.relationship_type.value,
                    "strength": rel.strength
                }

                if dfs(next_entity, target, chain + [chain_step]):
                    return True

            return False

        if dfs(from_entity, to_entity, []):
            return path

        return []

    async def get_related_entities(
        self,
        entity_id: str,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """Get entities related to a given entity"""
        if entity_id not in self.entities:
            raise HTTPException(status_code=404, detail=f"Entity {entity_id} not found")

        related = []

        for rel in self.relationships.get(entity_id, []):
            related_entity = self.entities.get(rel.to_entity)
            if related_entity:
                related.append({
                    "entity": related_entity.model_dump(),
                    "relationship": rel.relationship_type.value,
                    "strength": rel.strength,
                    "confidence": rel.confidence
                })

        # Sort by strength
        related.sort(key=lambda x: x["strength"], reverse=True)
        return related[:max_results]

    async def get_correlation_matrix(
        self,
        entity_ids: List[str],
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Get correlation matrix for a list of entities"""
        matrix = {}

        for entity_a in entity_ids:
            matrix[entity_a] = {}
            for entity_b in entity_ids:
                if entity_a == entity_b:
                    matrix[entity_a][entity_b] = 1.0
                else:
                    result = await self.calculate_correlation(entity_a, entity_b, period_days)
                    matrix[entity_a][entity_b] = result["correlation"]

        return {
            "entities": entity_ids,
            "matrix": matrix,
            "period_days": period_days,
            "calculated_at": datetime.utcnow().isoformat()
        }

    async def add_price_data(
        self,
        entity_id: str,
        timestamp: datetime,
        price: float
    ):
        """Add price data for correlation calculation"""
        self.price_history[entity_id].append((timestamp, price))

        # Keep only last 365 days
        cutoff = datetime.utcnow() - timedelta(days=365)
        self.price_history[entity_id] = [
            (ts, p) for ts, p in self.price_history[entity_id]
            if ts > cutoff
        ]

        # Clear correlation cache for this entity
        keys_to_clear = [k for k in self.correlation_cache if entity_id in k]
        for key in keys_to_clear:
            del self.correlation_cache[key]


# Initialize service
service = CorrelationEngine()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "entities_count": len(service.entities),
        "relationships_count": sum(len(r) for r in service.relationships.values())
    }


@app.post("/api/v1/entities")
async def create_entity(entity: Entity):
    """Add a new entity to the graph"""
    return await service.add_entity(entity)


@app.get("/api/v1/entities/{entity_id}")
async def get_entity(entity_id: str):
    """Get entity details"""
    if entity_id not in service.entities:
        raise HTTPException(status_code=404, detail="Entity not found")
    return service.entities[entity_id]


@app.get("/api/v1/entities/{entity_id}/relationships")
async def get_entity_relationships(
    entity_id: str,
    relationship_type: RelationshipType = None
):
    """Get relationships for an entity"""
    return await service.get_entity_relationships(entity_id, relationship_type)


@app.post("/api/v1/relationships")
async def create_relationship(
    from_entity: str,
    to_entity: str,
    relationship_type: RelationshipType,
    strength: float = 0.5,
    confidence: float = 0.5,
    latency_hours: int = 0
):
    """Add a relationship between entities"""
    return await service.add_relationship(
        from_entity, to_entity, relationship_type,
        strength, confidence, latency_hours
    )


@app.get("/api/v1/correlation/{entity_a}/{entity_b}")
async def calculate_correlation(
    entity_a: str,
    entity_b: str,
    period_days: int = 30
):
    """Calculate correlation between two entities"""
    return await service.calculate_correlation(entity_a, entity_b, period_days)


@app.get("/api/v1/correlation/matrix")
async def get_correlation_matrix(entity_ids: str, period_days: int = 30):
    """Get correlation matrix for entities"""
    ids = [e.strip() for e in entity_ids.split(",")]
    return await service.get_correlation_matrix(ids, period_days)


@app.post("/api/v1/impact/propagate")
async def propagate_impact(
    source_entity: str,
    impact_magnitude: float,
    direction: CascadeDirection = CascadeDirection.DOWNSTREAM,
    max_depth: int = 3
):
    """Propagate impact through the dependency graph"""
    return await service.propagate_impact(
        source_entity, impact_magnitude, direction, max_depth
    )


@app.post("/api/v1/cascade/{entity_id}")
async def analyze_cascade_risk(entity_id: str, stress_scenario: str):
    """Analyze cascade risk for an entity"""
    return await service.analyze_cascade_risk(entity_id, stress_scenario)


@app.get("/api/v1/systemic/{entity_id}")
async def get_systemic_importance(entity_id: str):
    """Get systemic importance score for an entity"""
    score = await service.get_systemic_importance(entity_id)
    return {
        "entity_id": entity_id,
        "systemic_importance": score,
        "category": "critical" if score > 70 else "important" if score > 40 else "moderate"
    }


@app.get("/api/v1/chain/{from_entity}/{to_entity}")
async def find_dependency_chain(from_entity: str, to_entity: str):
    """Find dependency chain between two entities"""
    return await service.find_dependency_chain(from_entity, to_entity)


@app.get("/api/v1/related/{entity_id}")
async def get_related_entities(entity_id: str, max_results: int = 10):
    """Get related entities"""
    return await service.get_related_entities(entity_id, max_results)


@app.post("/api/v1/prices")
async def add_price_data(entity_id: str, timestamp: datetime, price: float):
    """Add price data for correlation tracking"""
    await service.add_price_data(entity_id, timestamp, price)
    return {"status": "added", "entity_id": entity_id}


@app.get("/api/v1/graph/summary")
async def get_graph_summary():
    """Get summary of the knowledge graph"""
    entity_types = defaultdict(int)
    relationship_types = defaultdict(int)

    for entity in service.entities.values():
        entity_types[entity.entity_type] += 1

    for entity, rels in service.relationships.items():
        for rel in rels:
            relationship_types[rel.relationship_type.value] += 1

    return {
        "total_entities": len(service.entities),
        "total_relationships": sum(len(r) for r in service.relationships.values()),
        "entity_types": dict(entity_types),
        "relationship_types": dict(relationship_types),
        "cached_correlations": len(service.correlation_cache)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5043)
