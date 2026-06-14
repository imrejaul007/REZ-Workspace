// AssetMind Knowledge Graph Schema
// Neo4j Cypher

// ============================================================================
// NODE TYPES
// ============================================================================

// Company node
CREATE CONSTRAINT company_symbol IF NOT EXISTS
FOR (c:Company) REQUIRE c.symbol IS UNIQUE;

CREATE INDEX company_name IF NOT EXISTS
FOR (c:Company) ON (c.name);

// Person node
CREATE CONSTRAINT person_name IF NOT EXISTS
FOR (p:Person) REQUIRE p.name IS UNIQUE;

// Sector node
CREATE CONSTRAINT sector_name IF NOT EXISTS
FOR (s:Sector) REQUIRE s.name IS UNIQUE;

// Country node
CREATE CONSTRAINT country_code IF NOT EXISTS
FOR (c:Country) REQUIRE c.code IS UNIQUE;

// Theme node
CREATE CONSTRAINT theme_name IF NOT EXISTS
FOR (t:Theme) REQUIRE t.name IS UNIQUE;

// Event node
CREATE CONSTRAINT event_id IF NOT EXISTS
FOR (e:Event) REQUIRE e.id IS UNIQUE;

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

// Supply Chain Relationships
CREATE CONSTRAINT supplier_relationship IF NOT EXISTS
FOR ()-[r:SUPPLIES_TO]->() REQUIRE r.strength IS NOT NULL;

// Customer Relationships
CREATE CONSTRAINT customer_relationship IF NOT EXISTS
FOR ()-[r:CUSTOMER_OF]->() REQUIRE r.strength IS NOT NULL;

// Competition
CREATE CONSTRAINT competitor_relationship IF NOT EXISTS
FOR ()-[r:COMPETES_WITH]->() REQUIRE r.strength IS NOT NULL;

// Partnership
CREATE CONSTRAINT partner_relationship IF NOT EXISTS
FOR ()-[r:PARTNERED_WITH]->() REQUIRE r.strength IS NOT NULL;

// Ownership
CREATE CONSTRAINT ownership_relationship IF NOT EXISTS
FOR ()-[r:OWNS]->() REQUIRE r.percentage IS NOT NULL;

// Geographic
CREATE CONSTRAINT location_relationship IF NOT EXISTS
FOR ()-[r:LOCATED_IN]->() REQUIRE true;

// Sector Classification
CREATE CONSTRAINT sector_relationship IF NOT EXISTS
FOR ()-[r:BELONGS_TO_SECTOR]->() REQUIRE true;

// Index Membership
CREATE CONSTRAINT index_relationship IF NOT EXISTS
FOR ()-[r:BELONGS_TO_INDEX]->() REQUIRE r.weight IS NOT NULL;

// Similarity
CREATE CONSTRAINT similar_relationship IF NOT EXISTS
FOR ()-[r:SIMILAR_TO]->() REQUIRE r.similarity IS NOT NULL;

// Theme Leadership
CREATE CONSTRAINT theme_leader IF NOT EXISTS
FOR ()-[r:LEADS_THEME]->() REQUIRE r.strength IS NOT NULL;

// =============================================================================
// SAMPLE DATA
// =============================================================================

// NVIDIA Node
CREATE (nvidia:Company {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Technology',
    industry: 'Semiconductors',
    market_cap: 2100000000000,
    country: 'US',
    founded: 1993
})

// TSMC Node
CREATE (tsmc:Company {
    symbol: 'TSMC',
    name: 'Taiwan Semiconductor Manufacturing Company',
    sector: 'Technology',
    industry: 'Semiconductors',
    market_cap: 550000000000,
    country: 'TW',
    founded: 1987
})

// AMD Node
CREATE (amd:Company {
    symbol: 'AMD',
    name: 'Advanced Micro Devices Inc',
    sector: 'Technology',
    industry: 'Semiconductors',
    market_cap: 280000000000,
    country: 'US',
    founded: 1969
})

// Apple Node
CREATE (apple:Company {
    symbol: 'AAPL',
    name: 'Apple Inc',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    market_cap: 2900000000000,
    country: 'US',
    founded: 1976
})

// Microsoft Node
CREATE (msft:Company {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    industry: 'Software',
    market_cap: 3100000000000,
    country: 'US',
    founded: 1975
})

// Taiwan Node
CREATE (taiwan:Country {
    code: 'TW',
    name: 'Taiwan',
    region: 'Asia'
})

// China Node
CREATE (china:Country {
    code: 'CN',
    name: 'China',
    region: 'Asia'
})

// US Node
CREATE (us:Country {
    code: 'US',
    name: 'United States',
    region: 'North America'
})

// Technology Sector Node
CREATE (tech:Sector {
    name: 'Technology',
    description: 'Technology and semiconductor companies'
})

// Semiconductors Industry Node
CREATE (semi:Industry {
    name: 'Semiconductors',
    description: 'Chip manufacturers and designers'
})

// AI Theme Node
CREATE (ai:Theme {
    name: 'Artificial Intelligence',
    description: 'AI infrastructure and applications',
    momentum: 'ACCELERATING'
})

// =============================================================================
// RELATIONSHIPS
// =============================================================================

// NVIDIA -> TSMC (supplies to)
MATCH (nvidia:Company {symbol: 'NVDA'})
MATCH (tsmc:Company {symbol: 'TSMC'})
CREATE (nvidia)-[:SUPPLIES_TO {strength: 85, type: 'manufacturing'}]->(tsmc);

// NVIDIA <- TSMC (customer)
MATCH (nvidia:Company {symbol: 'NVDA'})
MATCH (tsmc:Company {symbol: 'TSMC'})
CREATE (tsmc)-[:CUSTOMER_OF {strength: 15}]->(nvidia);

// NVIDIA vs AMD (competitors)
MATCH (nvidia:Company {symbol: 'NVDA'})
MATCH (amd:Company {symbol: 'AMD'})
CREATE (nvidia)-[:COMPETES_WITH {strength: 80, type: 'GPU'}]->(amd)
CREATE (amd)-[:COMPETES_WITH {strength: 80, type: 'GPU'}]->(nvidia);

// NVIDIA -> Apple (customer)
MATCH (nvidia:Company {symbol: 'NVDA'})
MATCH (apple:Company {symbol: 'AAPL'})
CREATE (apple)-[:CUSTOMER_OF {strength: 12}]->(nvidia);

// NVIDIA -> Microsoft (customer)
MATCH (nvidia:Company {symbol: 'NVDA'})
MATCH (msft:Company {symbol: 'MSFT'})
CREATE (msft)-[:CUSTOMER_OF {strength: 10}]->(nvidia);

// NVIDIA -> NVIDIA (self reference for dependencies)
MATCH (nvidia:Company {symbol: 'NVDA'})
CREATE (nvidia)-[:DEPENDS_ON {strength: 90}]->(nvidia);

// TSMC -> Taiwan (located in)
MATCH (tsmc:Company {symbol: 'TSMC'})
MATCH (taiwan:Country {code: 'TW'})
CREATE (tsmc)-[:LOCATED_IN]->(taiwan);

// Taiwan -> China (nearby/risky)
MATCH (taiwan:Country {code: 'TW'})
MATCH (china:Country {code: 'CN'})
CREATE (taiwan)-[:AFFECTED_BY_GEO {strength: 85, type: 'political'}]->(china);

// NVIDIA leads AI theme
MATCH (nvidia:Company {symbol: 'NVDA'})
MATCH (ai:Theme {name: 'Artificial Intelligence'})
CREATE (nvidia)-[:LEADS_THEME {strength: 90}]->(ai);

// NVIDIA belongs to Technology sector
MATCH (nvidia:Company {symbol: 'NVDA'})
MATCH (tech:Sector {name: 'Technology'})
CREATE (nvidia)-[:BELONGS_TO_SECTOR]->(tech);

// AMD belongs to Technology sector
MATCH (amd:Company {symbol: 'AMD'})
MATCH (tech:Sector {name: 'Technology'})
CREATE (amd)-[:BELONGS_TO_SECTOR]->(tech);

// Apple belongs to Technology sector
MATCH (apple:Company {symbol: 'AAPL'})
MATCH (tech:Sector {name: 'Technology'})
CREATE (apple)-[:BELONGS_TO_SECTOR]->(tech);

// =============================================================================
// QUERY EXAMPLES
// =============================================================================

// Find all companies that depend on TSMC
MATCH (c:Company)-[:SUPPLIES_TO]->(tsmc:Company {symbol: 'TSMC'})
RETURN c.symbol, c.name;

// Find NVIDIA's supply chain risk
MATCH (nvidia:Company {symbol: 'NVDA'})
OPTIONAL MATCH (nvidia)-[:SUPPLIES_TO]->(supplier)
OPTIONAL MATCH (supplier)-[:LOCATED_IN]->(country)
RETURN nvidia.name AS company,
       supplier.name AS supplier,
       country.name AS location;

// Find competitors
MATCH (nvidia:Company {symbol: 'NVDA'})
MATCH (nvidia)-[:COMPETES_WITH]-(competitor)
RETURN competitor.symbol, competitor.name;

// Find AI leaders
MATCH (company)-[:LEADS_THEME]->(theme:Theme {name: 'Artificial Intelligence'})
RETURN company.symbol, company.name
ORDER BY company.market_cap DESC;

// Find geopolitical risks for semiconductor sector
MATCH (company)-[:BELONGS_TO_SECTOR]->(sector:Sector {name: 'Technology'})
OPTIONAL MATCH (company)-[:LOCATED_IN]->(country)
OPTIONAL MATCH (country)-[:AFFECTED_BY_GEO]->(risk)
RETURN company.symbol, country.name AS location, risk.name AS risk_factor;
