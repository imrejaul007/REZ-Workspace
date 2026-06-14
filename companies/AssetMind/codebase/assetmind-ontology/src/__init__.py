"""
AssetMind - Financial Ontology Layer
Port: 5045

The Foundation Layer - Defines the financial universe.

This is NOT just a knowledge graph. This is the complete
ontological framework that defines:
- What every entity IS
- How entities relate to each other
- What properties entities have
- How events affect entities

This becomes the "Financial Brain" that powers everything else.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal, Set
from datetime import datetime
from enum import Enum
import uuid


app = FastAPI(
    title="AssetMind Financial Ontology",
    version="1.0.0",
    description="The Financial Brain - Defines reality for all other systems"
)


# =============================================================================
# CORE ONTOLOGY - What Everything IS
# =============================================================================

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
    # Equity
    STOCK = "stock"
    ETF = "etf"
    INDEX = "index"
    MUTUAL_FUND = "mutual_fund"

    # Fixed Income
    BOND = "bond"
    TREASURY = "treasury"
    MUNICIPAL = "municipal"
    CORPORATE_BOND = "corporate_bond"

    # Derivatives
    OPTION = "option"
    FUTURE = "future"
    SWAP = "swap"
    WARRANT = "warrant"

    # Crypto
    CRYPTO = "crypto"
    TOKEN = "token"
    STABLECOIN = "stablecoin"

    # Commodities
    COMMODITY = "commodity"
    PRECIOUS_METAL = "precious_metal"
    ENERGY = "energy"
    AGRICULTURAL = "agricultural"

    # Currencies
    FOREX = "forex"
    FIAT = "fiat"
    DIGITAL_FX = "digital_fx"

    # Real Assets
    REAL_ESTATE = "real_estate"
    COMMODITY_REAL = "commodity_real"
    INFRASTRUCTURE = "infrastructure"

    # Alternative
    HEDGE_FUND = "hedge_fund"
    PRIVATE_EQUITY = "private_equity"
    VENTURE_CAPITAL = "venture_capital"


class EventCategory(str, Enum):
    """Event types that affect markets"""
    # Corporate
    EARNINGS = "earnings"
    MERGERS_ACQUISITIONS = "mergers_acquisitions"
    DIVIDEND = "dividend"
    SPLIT = "split"
    BUYBACK = "buyback"
    IPO = "ipo"
    SPAC = "spac"

    # Economic
    ECONOMIC_DATA = "economic_data"
    CENTRAL_BANK = "central_bank"
    GDP = "gdp"
    CPI = "cpi"
    EMPLOYMENT = "employment"
    TRADE = "trade"

    # Geopolitical
    WAR = "war"
    SANCTIONS = "sanctions"
    ELECTION = "election"
    TREATY = "treaty"
    summit = "summit"

    # Industry
    REGULATION_CHANGE = "regulation_change"
    PRODUCT_LAUNCH = "product_launch"
    PATENT = "patent"
    MERGER_RUMOR = "merger_rumor"
    BANKRUPTCY = "bankruptcy"

    # Market
    SHORT_SQUEEZE = "short_squeeze"
    INSIDER_TRADING = "insider_trading"
    DIVIDEND_CUT = "dividend_cut"
    CREDIT_DOWNGRADE = "credit_downgrade"
    DELISTING = "delisting"


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
    REPUTATIONAL = "reputational"
    SUPPLY_CHAIN = "supply_chain"


# =============================================================================
# ONTOLOGY ENTITIES
# =============================================================================

class Entity(BaseModel):
    """Base entity in the financial ontology"""
    entity_id: str
    name: str
    category: EntityCategory
    properties: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Asset(Entity):
    """Any tradeable asset"""
    category: Literal[EntityCategory.ASSET] = EntityCategory.ASSET
    asset_class: AssetClass
    symbol: Optional[str] = None
    exchange: Optional[str] = None
    currency: str = "USD"
    isin: Optional[str] = None  # International Securities Identification Number
    cusip: Optional[str] = None  # Committee on Uniform Securities Identification Procedures

    # Market data
    market_cap: Optional[float] = None
    price: Optional[float] = None
    volume: Optional[float] = None

    # Relationships
    issuer: Optional[str] = None  # Company that issued this asset
    underlying: Optional[str] = None  # For derivatives
    sector: Optional[str] = None
    industry: Optional[str] = None


class Company(Entity):
    """Corporation or business entity"""
    category: Literal[EntityCategory.COMPANY] = EntityCategory.COMPANY

    # Identity
    ticker: Optional[str] = None
    exchange: Optional[str] = None
    lei: Optional[str] = None  # Legal Entity Identifier
    jurisdiction: str = "US"

    # Business
    sector: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None

    # Financial
    employees: Optional[int] = None
    founded: Optional[int] = None
    headquarters: Optional[str] = None

    # Products & Services
    products: List[str] = Field(default_factory=list)
    services: List[str] = Field(default_factory=list)

    # Financial metrics
    revenue: Optional[float] = None
    ebitda: Optional[float] = None
    net_income: Optional[float] = None
    total_debt: Optional[float] = None
    cash: Optional[float] = None


class Person(Entity):
    """Individual (CEO, CFO, Investor, etc.)"""
    category: Literal[EntityCategory.PERSON] = EntityCategory.PERSON

    # Identity
    role: str  # CEO, CFO, Founder, Investor, Analyst, etc.
    company: Optional[str] = None
    title: Optional[str] = None

    # Contact
    email: Optional[str] = None
    linkedin: Optional[str] = None

    # Net worth
    net_worth: Optional[float] = None


class Event(Entity):
    """Market event"""
    category: Literal[EntityCategory.EVENT] = EntityCategory.EVENT

    event_type: EventCategory
    timestamp: datetime
    title: str
    description: str

    # Impact
    affected_assets: List[str] = Field(default_factory=list)
    affected_sectors: List[str] = Field(default_factory=list)
    affected_companies: List[str] = Field(default_factory=list)

    # Magnitude
    magnitude: Optional[str] = None  # "major", "moderate", "minor"
    expected_impact: Optional[str] = None

    # Outcome (filled later)
    actual_outcome: Optional[str] = None
    lessons: List[str] = Field(default_factory=list)


class Risk(Entity):
    """Risk factor"""
    category: Literal[EntityCategory.RISK] = EntityCategory.RISK

    risk_type: RiskCategory
    severity: str  # "critical", "high", "medium", "low"
    probability: float  # 0-1

    # Exposure
    affected_assets: List[str] = Field(default_factory=list)
    affected_sectors: List[str] = Field(default_factory=list)
    affected_companies: List[str] = Field(default_factory=list)

    # Mitigation
    hedging_assets: List[str] = Field(default_factory=list)


class Geography(Entity):
    """Country, Region, City"""
    category: Literal[EntityCategory.GEOGRAPHY] = EntityCategory.GEOGRAPHY

    location_type: str  # "country", "region", "city"
    country_code: Optional[str] = None  # ISO 3166-1
    timezone: Optional[str] = None

    # Economic data
    gdp: Optional[float] = None
    population: Optional[int] = None
    currency: Optional[str] = None


class Regulation(Entity):
    """Law, regulation, compliance requirement"""
    category: Literal[EntityCategory.REGULATION] = EntityCategory.REGULATION

    regulation_type: str  # "SEC", "FED", "EU", "GDPR", "SOX", etc.
    title: str
    effective_date: Optional[datetime] = None

    # Impact
    affected_industries: List[str] = Field(default_factory=list)
    affected_companies: List[str] = Field(default_factory=list)
    compliance_cost: Optional[float] = None


class Concept(Entity):
    """Abstract financial concept"""
    category: Literal[EntityCategory.CONCEPT] = EntityCategory.CONCEPT

    concept_type: str  # "metric", "ratio", "strategy", "theory"
    definition: str
    formula: Optional[str] = None


# =============================================================================
# ONTOLOGY RELATIONSHIPS
# =============================================================================

class RelationshipType(str, Enum):
    """Types of relationships between entities"""

    # Company relationships
    SUPPLIES_TO = "supplies_to"
    CUSTOMER_OF = "customer_of"
    COMPETES_WITH = "competes_with"
    PARTNERS_WITH = "partners_with"
    ACQUIRED_BY = "acquired_by"
    OWNS = "owns"  # Subsidiary

    # Asset relationships
    ISSUED_BY = "issued_by"
    UNDERLYING_OF = "underlying_of"
    TRACKS = "tracks"  # ETF tracks index
    HOLDERS = "holders"  # Who owns this asset

    # Person relationships
    CEO_OF = "ceo_of"
    CFO_OF = "cfo_of"
    BOARD_MEMBER = "board_member"
    MAJOR_SHAREHOLDER = "major_shareholder"
    ANALYST_AT = "analyst_at"

    # Event relationships
    AFFECTS = "affects"
    CAUSED_BY = "caused_by"
    LEADS_TO = "leads_to"
    PREDICTS = "predicts"

    # Geographic relationships
    LOCATED_IN = "located_in"
    HEADQUARTERS_IN = "headquarters_in"

    # Risk relationships
    EXPOSED_TO = "exposed_to"
    HEDGES_AGAINST = "hedges_against"


class Relationship(BaseModel):
    """Relationship between two entities"""
    relationship_id: str
    from_entity: str  # Entity ID
    to_entity: str  # Entity ID
    relationship_type: RelationshipType

    # Properties
    strength: float = 1.0  # 0-1, how strong is this relationship
    confidence: float = 1.0  # 0-1, how confident are we
    bidirectional: bool = False

    # Context
    source: str = "ontology"  # Where did this relationship come from
    metadata: Dict[str, Any] = Field(default_factory=dict)


# =============================================================================
# ONTOLOGY QUERIES
# =============================================================================

class OntologyQuery(BaseModel):
    query: str
    entity_types: Optional[List[EntityCategory]] = None
    limit: int = 20


class SubgraphQuery(BaseModel):
    entity_id: str
    depth: int = Field(default=1, ge=1, le=5)
    relationship_types: Optional[List[RelationshipType]] = None


class PathQuery(BaseModel):
    from_entity: str
    to_entity: str
    max_depth: int = Field(default=5, ge=1, le=10)
    relationship_types: Optional[List[RelationshipType]] = None


# =============================================================================
# IN-MEMORY ONTOLOGY STORE
# =============================================================================

# Entity storage
ENTITIES: Dict[str, Entity] = {}

# Relationship storage
RELATIONSHIPS: List[Relationship] = []

# Graph for traversal
ADJACENCY: Dict[str, Dict[str, List[RelationshipType]]] = {}


def add_entity(entity: Entity):
    """Add entity to ontology"""
    ENTITIES[entity.entity_id] = entity

    if entity.entity_id not in ADJACENCY:
        ADJACENCY[entity.entity_id] = {}


def add_relationship(relationship: Relationship):
    """Add relationship to ontology"""
    RELATIONSHIPS.append(relationship)

    # Update adjacency list
    if relationship.from_entity not in ADJACENCY:
        ADJACENCY[relationship.from_entity] = {}

    if relationship.to_entity not in ADJACENCY[relationship.from_entity]:
        ADJACENCY[relationship.from_entity][relationship.to_entity] = []

    ADJACENCY[relationship.from_entity][relationship.to_entity].append(
        relationship.relationship_type
    )


# =============================================================================
# BOOTSTRAP CORE ONTOLOGY
# =============================================================================

def bootstrap_core_ontology():
    """Initialize with fundamental financial entities and relationships"""

    # Core Asset Classes
    asset_classes = [
        ("STOCK", "Stock", AssetClass.STOCK),
        ("ETF", "Exchange Traded Fund", AssetClass.ETF),
        ("BOND", "Bond", AssetClass.BOND),
        ("CRYPTO", "Cryptocurrency", AssetClass.CRYPTO),
        ("COMMODITY", "Commodity", AssetClass.COMMODITY),
        ("FOREX", "Foreign Exchange", AssetClass.FOREX),
    ]

    for code, name, asset_class in asset_classes:
        add_entity(Entity(
            entity_id=f"ASSET_CLASS_{code}",
            name=name,
            category=EntityCategory.ASSET,
            properties={"asset_class": asset_class.value}
        ))

    # Core Event Types
    event_types = [
        ("EARNINGS", "Earnings Announcement", EventCategory.EARNINGS),
        ("RATE_DECISION", "Interest Rate Decision", EventCategory.CENTRAL_BANK),
        ("M&A", "Merger or Acquisition", EventCategory.MERGERS_ACQUISITIONS),
        ("IPO", "Initial Public Offering", EventCategory.IPO),
        ("SANCTIONS", "Sanctions Announcement", EventCategory.SANCTIONS),
        ("REGULATION", "New Regulation", EventCategory.REGULATION_CHANGE),
    ]

    for code, name, event_type in event_types:
        add_entity(Entity(
            entity_id=f"EVENT_{code}",
            name=name,
            category=EntityCategory.EVENT,
            properties={"event_type": event_type.value}
        ))

    # Core Risk Types
    risk_types = [
        ("MARKET_RISK", "Market Risk", RiskCategory.MARKET),
        ("CREDIT_RISK", "Credit Risk", RiskCategory.CREDIT),
        ("LIQUIDITY_RISK", "Liquidity Risk", RiskCategory.LIQUIDITY),
        ("GEO_RISK", "Geopolitical Risk", RiskCategory.GEOPOLITICAL),
        ("CYBER_RISK", "Cybersecurity Risk", RiskCategory.CYBERSECURITY),
        ("CLIMATE_RISK", "Climate Risk", RiskCategory.CLIMATE),
    ]

    for code, name, risk_type in risk_types:
        add_entity(Entity(
            entity_id=f"RISK_{code}",
            name=name,
            category=EntityCategory.RISK,
            properties={"risk_type": risk_type.value}
        ))

    # Key Concepts
    concepts = [
        ("GDP", "Gross Domestic Product", "Total value of goods produced"),
        ("INFLATION", "Inflation Rate", "Rate of price increase"),
        ("INTEREST_RATE", "Interest Rate", "Cost of borrowing money"),
        ("VOLATILITY", "Market Volatility", "Rate of price fluctuations"),
        ("LIQUIDITY", "Market Liquidity", "Ease of buying/selling"),
        ("DIVERSIFICATION", "Diversification", "Spreading risk across assets"),
    ]

    for code, name, definition in concepts:
        add_entity(Entity(
            entity_id=f"CONCEPT_{code}",
            name=name,
            category=EntityCategory.CONCEPT,
            properties={"definition": definition}
        ))


# Bootstrap on import
bootstrap_core_ontology()


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-ontology",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5045,
        "entities": len(ENTITIES),
        "relationships": len(RELATIONSHIPS)
    }


@app.get("/")
async def root():
    return {
        "service": "AssetMind Financial Ontology",
        "description": "The Financial Brain - Defines reality for all systems",
        "categories": [c.value for c in EntityCategory],
        "asset_classes": [c.value for c in AssetClass],
        "event_categories": [c.value for c in EventCategory],
        "risk_categories": [c.value for c in RiskCategory],
        "relationship_types": [r.value for r in RelationshipType]
    }


# =============================================================================
# Entity Endpoints
# =============================================================================

@app.post("/entities", status_code=201)
async def create_entity(entity: Entity):
    """Create a new entity in the ontology"""
    add_entity(entity)
    return {"entity_id": entity.entity_id, "created": True}


@app.get("/entities/{entity_id}")
async def get_entity(entity_id: str):
    """Get entity by ID"""
    if entity_id not in ENTITIES:
        raise HTTPException(status_code=404, detail="Entity not found")
    return ENTITIES[entity_id]


@app.get("/entities")
async def list_entities(
    category: Optional[EntityCategory] = None,
    limit: int = 100
):
    """List entities with optional filter"""
    entities = list(ENTITIES.values())

    if category:
        entities = [e for e in entities if e.category == category]

    return {
        "entities": entities[:limit],
        "total": len(entities)
    }


@app.get("/entities/search/{query}")
async def search_entities(query: str, limit: int = 20):
    """Search entities by name"""
    query_lower = query.lower()
    results = [
        e for e in ENTITIES.values()
        if query_lower in e.name.lower()
    ]
    return {"results": results[:limit], "total": len(results)}


@app.delete("/entities/{entity_id}")
async def delete_entity(entity_id: str):
    """Delete entity"""
    if entity_id not in ENTITIES:
        raise HTTPException(status_code=404, detail="Entity not found")
    del ENTITIES[entity_id]
    return {"deleted": True}


# =============================================================================
# Relationship Endpoints
# =============================================================================

@app.post("/relationships", status_code=201)
async def create_relationship(relationship: Relationship):
    """Create a new relationship"""
    add_relationship(relationship)
    return {"relationship_id": relationship.relationship_id, "created": True}


@app.get("/relationships")
async def list_relationships(
    from_entity: Optional[str] = None,
    to_entity: Optional[str] = None,
    rel_type: Optional[RelationshipType] = None,
    limit: int = 100
):
    """List relationships with optional filters"""
    results = RELATIONSHIPS

    if from_entity:
        results = [r for r in results if r.from_entity == from_entity]
    if to_entity:
        results = [r for r in results if r.to_entity == to_entity]
    if rel_type:
        results = [r for r in results if r.relationship_type == rel_type]

    return {"relationships": results[:limit], "total": len(results)}


@app.get("/relationships/{relationship_id}")
async def get_relationship(relationship_id: str):
    """Get relationship by ID"""
    for r in RELATIONSHIPS:
        if r.relationship_id == relationship_id:
            return r
    raise HTTPException(status_code=404, detail="Relationship not found")


# =============================================================================
# Graph Traversal
# =============================================================================

@app.post("/graph/subgraph")
async def get_subgraph(query: SubgraphQuery):
    """Get subgraph around an entity"""
    visited = set()
    entities_in_subgraph = {}
    relationships_in_subgraph = []

    def traverse(entity_id: str, depth: int):
        if depth > query.depth or entity_id in visited:
            return
        visited.add(entity_id)

        if entity_id in ENTITIES:
            entities_in_subgraph[entity_id] = ENTITIES[entity_id]

        # Get outgoing relationships
        if entity_id in ADJACENCY:
            for target, rel_types in ADJACENCY[entity_id].items():
                for rel_type in rel_types:
                    if query.relationship_types is None or rel_type in query.relationship_types:
                        relationships_in_subgraph.append({
                            "from": entity_id,
                            "to": target,
                            "type": rel_type
                        })
                traverse(target, depth + 1)

    traverse(query.entity_id, 0)

    return {
        "center_entity": query.entity_id,
        "entities": list(entities_in_subgraph.values()),
        "relationships": relationships_in_subgraph,
        "depth": query.depth
    }


@app.post("/graph/path")
async def find_path(query: PathQuery):
    """Find path between two entities (BFS)"""
    if query.from_entity not in ENTITIES or query.to_entity not in ENTITIES:
        raise HTTPException(status_code=404, detail="Entity not found")

    # BFS for shortest path
    queue = [(query.from_entity, [query.from_entity])]
    visited = {query.from_entity}

    while queue:
        current, path = queue.pop(0)

        if current == query.to_entity:
            # Found path, now get relationships
            path_relationships = []
            for i in range(len(path) - 1):
                from_e, to_e = path[i], path[i + 1]
                if from_e in ADJACENCY and to_e in ADJACENCY[from_e]:
                    path_relationships.append({
                        "from": from_e,
                        "to": to_e,
                        "types": ADJACENCY[from_e][to_e]
                    })
            return {
                "found": True,
                "path": path,
                "relationships": path_relationships,
                "length": len(path) - 1
            }

        if len(path) > query.max_depth:
            continue

        if current in ADJACENCY:
            for neighbor in ADJACENCY[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))

    return {"found": False, "path": [], "relationships": []}


@app.get("/graph/{entity_id}/neighbors")
async def get_neighbors(
    entity_id: str,
    depth: int = 1,
    rel_types: Optional[str] = None  # comma-separated
):
    """Get direct neighbors of an entity"""
    if entity_id not in ADJACENCY:
        return {"neighbors": []}

    neighbors = []
    allowed_types = set(rel_types.split(",")) if rel_types else None

    for neighbor, rel_type_list in ADJACENCY[entity_id].items():
        for rel_type in rel_type_list:
            if allowed_types is None or rel_type in allowed_types:
                neighbors.append({
                    "entity_id": neighbor,
                    "relationship_types": rel_type_list
                })

    return {
        "entity_id": entity_id,
        "neighbors": neighbors,
        "total": len(neighbors)
    }


# =============================================================================
# Ontology Analysis
# =============================================================================

@app.get("/ontology/stats")
async def get_ontology_stats():
    """Get ontology statistics"""
    by_category = {}
    for entity in ENTITIES.values():
        cat = entity.category.value
        by_category[cat] = by_category.get(cat, 0) + 1

    by_rel_type = {}
    for rel in RELATIONSHIPS:
        rt = rel.relationship_type.value
        by_rel_type[rt] = by_rel_type.get(rt, 0) + 1

    return {
        "total_entities": len(ENTITIES),
        "total_relationships": len(RELATIONSHIPS),
        "entities_by_category": by_category,
        "relationships_by_type": by_rel_type
    }


@app.get("/ontology/categories")
async def get_categories():
    """Get all entity categories with examples"""
    categories = {}

    for entity in ENTITIES.values():
        cat = entity.category.value
        if cat not in categories:
            categories[cat] = {"count": 0, "examples": []}
        categories[cat]["count"] += 1
        if len(categories[cat]["examples"]) < 3:
            categories[cat]["examples"].append({
                "id": entity.entity_id,
                "name": entity.name
            })

    return {"categories": categories}


# =============================================================================
# Inference Engine
# =============================================================================

@app.post("/ontology/infer")
async def infer_relationships(entity_id: str):
    """
    Infer potential relationships based on entity properties.

    Example: If A is located in China, and China is at war with X,
    then A might be affected by sanctions from X.
    """
    if entity_id not in ENTITIES:
        raise HTTPException(status_code=404, detail="Entity not found")

    entity = ENTITIES[entity_id]
    inferred = []

    # Rule 1: If company in sector, connected to sector
    if entity.category == EntityCategory.COMPANY:
        company = Company(**entity.properties) if hasattr(entity, 'properties') else None
        if company and company.sector:
            inferred.append({
                "inference": f"Part of {company.sector} sector",
                "confidence": 0.9,
                "rule": "sector_membership"
            })

    # Rule 2: If asset issued by company, connected to company
    if entity.category == EntityCategory.ASSET:
        asset = Asset(**entity.properties) if hasattr(entity, 'properties') else None
        if asset and asset.issuer:
            inferred.append({
                "inference": f"Issued by {asset.issuer}",
                "confidence": 0.95,
                "rule": "asset_issuer"
            })

    return {
        "entity_id": entity_id,
        "entity_name": entity.name,
        "inferred_relationships": inferred
    }


# =============================================================================
# Sector Hierarchy
# =============================================================================

@app.get("/ontology/sectors")
async def get_sector_hierarchy():
    """Get hierarchical sector/industry taxonomy"""
    return {
        "sectors": [
            {
                "name": "Technology",
                "industries": ["Semiconductors", "Software", "Hardware", "Cloud", "AI"],
                "key_companies": ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN"]
            },
            {
                "name": "Healthcare",
                "industries": ["Pharma", "Biotech", "Medical Devices", "Healthcare Services"],
                "key_companies": ["LLY", "JNJ", "UNH", "PFE", "ABBV"]
            },
            {
                "name": "Financials",
                "industries": ["Banking", "Insurance", "Asset Management", "Fintech"],
                "key_companies": ["JPM", "BAC", "GS", "MS", "V"]
            },
            {
                "name": "Consumer",
                "industries": ["Retail", "Food & Beverage", "Automotive", "Luxury"],
                "key_companies": ["WMT", "AMZN", "TSLA", "KO", "PG"]
            },
            {
                "name": "Energy",
                "industries": ["Oil & Gas", "Renewables", "Utilities", "Pipelines"],
                "key_companies": ["XOM", "CVX", "NEE", "DUK", "SO"]
            },
            {
                "name": "Industrials",
                "industries": ["Aerospace", "Defense", "Machinery", "Transportation"],
                "key_companies": ["BA", "CAT", "DE", "UPS", "HON"]
            }
        ]
    }


# =============================================================================
# Supply Chain Intelligence
# =============================================================================

@app.get("/ontology/supply-chain/{symbol}")
async def get_supply_chain(symbol: str):
    """
    Get supply chain for a symbol.

    Example: NVIDIA -> TSMC -> Suppliers -> Countries
    """
    # This would connect to the knowledge graph
    # For now, return template

    supply_chain = {
        "symbol": symbol,
        "tier1_suppliers": [],  # Direct suppliers
        "tier2_suppliers": [],  # Suppliers to tier1
        "tier1_customers": [],  # Direct customers
        "tier2_customers": [],  # Customers of tier1
        "raw_materials": [],
        "countries": [],
        "risks": []
    }

    return supply_chain


# =============================================================================
# Bootstrap Full Ontology
# =============================================================================

@app.post("/bootstrap")
async def bootstrap_ontology():
    """Populate with comprehensive financial ontology"""

    # Add major tech companies
    tech_companies = [
        ("NVDA", "NVIDIA Corporation", "Technology", "Semiconductors"),
        ("AAPL", "Apple Inc.", "Technology", "Consumer Electronics"),
        ("MSFT", "Microsoft Corporation", "Technology", "Software"),
        ("GOOGL", "Alphabet Inc.", "Technology", "Internet"),
        ("AMZN", "Amazon.com Inc.", "Consumer Discretionary", "E-Commerce"),
        ("TSM", "Taiwan Semiconductor", "Technology", "Semiconductors"),
        ("AMD", "Advanced Micro Devices", "Technology", "Semiconductors"),
        ("INTC", "Intel Corporation", "Technology", "Semiconductors"),
    ]

    for ticker, name, sector, industry in tech_companies:
        company = Company(
            entity_id=f"COMPANY_{ticker}",
            name=name,
            ticker=ticker,
            sector=sector,
            industry=industry
        )
        add_entity(company)

        # Also add as asset
        asset = Asset(
            entity_id=f"ASSET_{ticker}",
            name=name,
            asset_class=AssetClass.STOCK,
            symbol=ticker,
            sector=sector,
            issuer=f"COMPANY_{ticker}"
        )
        add_entity(asset)

    # Add key relationships
    relationships = [
        ("COMPANY_NVDA", "COMPANY_TSM", RelationshipType.SUPPLIES_TO),
        ("COMPANY_NVDA", "COMPANY_AMD", RelationshipType.COMPETES_WITH),
        ("COMPANY_AAPL", "COMPANY_TSM", RelationshipType.SUPPLIES_TO),
        ("COMPANY_MSFT", "COMPANY_NVDA", RelationshipType.CUSTOMER_OF),
        ("ASSET_NVDA", "COMPANY_NVDA", RelationshipType.ISSUED_BY),
        ("ASSET_AAPL", "COMPANY_AAPL", RelationshipType.ISSUED_BY),
    ]

    for from_e, to_e, rel_type in relationships:
        add_relationship(Relationship(
            relationship_id=str(uuid.uuid4()),
            from_entity=from_e,
            to_entity=to_e,
            relationship_type=rel_type
        ))

    return {
        "message": "Ontology bootstrapped",
        "entities": len(ENTITIES),
        "relationships": len(RELATIONSHIPS)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5045)