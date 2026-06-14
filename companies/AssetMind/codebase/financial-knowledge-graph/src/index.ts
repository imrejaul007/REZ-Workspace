/**
 * AssetMind Financial Knowledge Graph
 * Port: 5040
 *
 * Neo4j-based knowledge graph for financial entity relationships
 * Maps supply chains, competitors, correlations, and market relationships
 */

import express, { Request, Response } from 'express';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const PORT = process.env.PORT || 5040;
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

const app = express();
app.use(express.json());

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

let driver: Driver;

async function connectNeo4j(): Promise<void> {
  try {
    driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
    await driver.verifyConnectivity();
    logger.info('Connected to Neo4j', { uri: NEO4J_URI });
  } catch (error) {
    logger.warn('Neo4j not available, using in-memory mode');
    driver = null as any;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE GRAPH OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Entity Types
const ENTITY_TYPES = {
  COMPANY: 'Company',
  STOCK: 'Stock',
  ETF: 'ETF',
  CRYPTO: 'Crypto',
  COMMODITY: 'Commodity',
  FOREX: 'Forex',
  INDEX: 'Index',
  SECTOR: 'Sector',
  COUNTRY: 'Country',
  PERSON: 'Person',
  EVENT: 'Event',
};

// Relationship Types
const RELATIONSHIPS = {
  OWNS: 'OWNS',
  SUPPLIES: 'SUPPLIES',
  COMPETES_WITH: 'COMPETES_WITH',
  ACQUIRES: 'ACQUIRES',
  PART_OF: 'PART_OF',
  LOCATED_IN: 'LOCATED_IN',
  AFFECTS: 'AFFECTS',
  CORRELATES_WITH: 'CORRELATES_WITH',
  DERIVED_FROM: 'DERIVED_FROM',
  TRACKS: 'TRACKS',
};

// Create entity
async function createEntity(type: string, properties: Record<string, any>): Promise<any> {
  if (!driver) return { id: uuidv4(), type, ...properties, _inMemory: true };

  const session = driver.session();
  try {
    const query = `
      CREATE (e:${type} $props)
      RETURN e
    `;
    const result = await session.run(query, { props: { ...properties, id: uuidv4() } });
    return result.records[0]?.get('e').properties;
  } finally {
    await session.close();
  }
}

// Create relationship
async function createRelationship(fromId: string, toId: string, type: string, properties: Record<string, any> = {}): Promise<any> {
  if (!driver) return { from: fromId, to: toId, type, ...properties, _inMemory: true };

  const session = driver.session();
  try {
    const query = `
      MATCH (a), (b)
      WHERE a.id = $fromId AND b.id = $toId
      CREATE (a)-[r:${type} $props]->(b)
      RETURN r
    `;
    const result = await session.run(query, { fromId, toId, props: properties });
    return result.records[0]?.get('r').properties;
  } finally {
    await session.close();
  }
}

// Find related entities
async function findRelated(entityId: string, depth: number = 1): Promise<any[]> {
  if (!driver) return [];

  const session = driver.session();
  try {
    const query = `
      MATCH (start {id: $entityId})-[*1..${depth}]-(related)
      RETURN start, related, relationships(start) as rels
    `;
    const result = await session.run(query, { entityId });
    return result.records.map(r => ({
      start: r.get('start').properties,
      related: r.get('related').properties,
      relationship: r.get('rels')[0]?.type
    }));
  } finally {
    await session.close();
  }
}

// Get supply chain
async function getSupplyChain(companyId: string): Promise<any> {
  if (!driver) return { companyId, suppliers: [], customers: [] };

  const session = driver.session();
  try {
    // Suppliers (2 levels up)
    const supplierQuery = `
      MATCH path = (supplier)<-[:SUPPLIES*1..2]-(company {id: $companyId})
      RETURN DISTINCT supplier, length(path) as depth
      ORDER BY depth
    `;
    const supplierResult = await session.run(supplierQuery, { companyId });
 const suppliers = supplierResult.records.map(r => ({
      ...r.get('supplier').properties,
      depth: r.get('depth')
    }));

    // Customers (2 levels down)
    const customerQuery = `
      MATCH path = (company {id: $companyId})-[:SUPPLIES*1..2]->(customer)
      RETURN DISTINCT customer, length(path) as depth
      ORDER BY depth
    `;
    const customerResult = await session.run(customerQuery, { companyId });
    const customers = customerResult.records.map(r => ({
      ...r.get('customer').properties,
      depth: r.get('depth')
    }));

    return { companyId, suppliers, customers };
  } finally {
    await session.close();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'knowledge-graph',
    neo4j: driver ? 'connected' : 'in-memory',
    timestamp: new Date().toISOString()
  });
});

// Create entity
app.post('/api/entities', async (req: Request, res: Response) => {
  try {
    const { type, properties } = req.body;
    if (!type || !properties) {
      return res.status(400).json({ success: false, error: 'type and properties required' });
    }
    const entity = await createEntity(type, properties);
    res.status(201).json({ success: true, data: entity });
  } catch (error) {
    logger.error('Failed to create entity', { error });
    res.status(500).json({ success: false, error: 'Failed to create entity' });
  }
});

// Create relationship
app.post('/api/relationships', async (req: Request, res: Response) => {
  try {
    const { fromId, toId, type, properties } = req.body;
    if (!fromId || !toId || !type) {
      return res.status(400).json({ success: false, error: 'fromId, toId, and type required' });
    }
    const relationship = await createRelationship(fromId, toId, type, properties);
    res.status(201).json({ success: true, data: relationship });
  } catch (error) {
    logger.error('Failed to create relationship', { error });
    res.status(500).json({ success: false, error: 'Failed to create relationship' });
  }
});

// Get entity
app.get('/api/entities/:id', async (req: Request, res: Response) => {
  if (!driver) return res.status(503).json({ success: false, error: 'Neo4j not available' });

  const session = driver.session();
  try {
    const result = await session.run('MATCH (e) WHERE e.id = $id RETURN e', { id: req.params.id });
    if (result.records.length === 0) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }
    res.json({ success: true, data: result.records[0].get('e').properties });
  } finally {
    await session.close();
  }
});

// Find related entities
app.get('/api/entities/:id/related', async (req: Request, res: Response) => {
  try {
    const depth = parseInt(req.query.depth as string) || 1;
    const related = await findRelated(req.params.id, depth);
    res.json({ success: true, data: related });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to find related entities' });
  }
});

// Get supply chain
app.get('/api/entities/:id/supply-chain', async (req: Request, res: Response) => {
  try {
    const chain = await getSupplyChain(req.params.id);
    res.json({ success: true, data: chain });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get supply chain' });
  }
});

// Search entities
app.get('/api/search', async (req: Request, res: Response) => {
  if (!driver) return res.status(503).json({ success: false, error: 'Neo4j not available' });

  const { q, type } = req.query;
  const session = driver.session();
  try {
    let query = 'MATCH (e) WHERE e.name CONTAINS $q OR e.ticker CONTAINS $q';
    if (type) query += ` AND e:${type}`;
    query += ' RETURN e LIMIT 20';

    const result = await session.run(query, { q: q as string });
    const entities = result.records.map(r => r.get('e').properties);
    res.json({ success: true, data: entities, count: entities.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Search failed' });
  } finally {
    await session.close();
  }
});

// Get entity types
app.get('/api/types', (_req: Request, res: Response) => {
  res.json({ success: true, data: ENTITY_TYPES });
});

// Get relationship types
app.get('/api/relationship-types', (_req: Request, res: Response) => {
  res.json({ success: true, data: RELATIONSHIPS });
});

// Seed sample data
app.post('/api/seed', async (_req: Request, res: Response) => {
  if (!driver) return res.status(503).json({ success: false, error: 'Neo4j not available' });

  const session = driver.session();
  try {
    // Clear existing data
    await session.run('MATCH (n) DETACH DELETE n');

    // Create NVIDIA
    await session.run('CREATE (n:Company {id: "NVDA", name: "NVIDIA", ticker: "NVDA", sector: "Technology"})');
    await session.run('CREATE (n:Stock {id: "NVDA-STOCK", ticker: "NVDA", price: 500, marketCap: 1200000000000})');

    // Create TSMC
    await session.run('CREATE (t:Company {id: "TSMC", name: "TSMC", ticker: "TSM", sector: "Semiconductors"})');

    // Create Taiwan
    await session.run('CREATE (c:Country {id: "TW", name: "Taiwan", region: "Asia Pacific"})');

    // Create relationships
    await session.run('MATCH (n:Company {id: "NVDA"}), (t:Company {id: "TSMC"}) CREATE (n)-[:SUPPLIES {since: 2018}]->(t)');
    await session.run('MATCH (t:Company {id: "TSMC"}), (c:Country {id: "TW"}) CREATE (t)-[:LOCATED_IN]->(c)');
    await session.run('MATCH (n:Company {id: "NVDA"}), (c:Country {id: "TW"}) CREATE (n)-[:AFFECTS {risk: "High"}]->(c)');

    // Create AMD (competitor)
    await session.run('CREATE (a:Company {id: "AMD", name: "AMD", ticker: "AMD", sector: "Technology"})');
    await session.run('MATCH (n:Company {id: "NVDA"}), (a:Company {id: "AMD"}) CREATE (n)-[:COMPETES_WITH]->(a)');

    // Create AI sector
    await session.run('CREATE (s:Sector {id: "AI", name: "Artificial Intelligence"})');
    await session.run('MATCH (n:Company {id: "NVDA"}), (s:Sector {id: "AI"}) CREATE (n)-[:PART_OF]->(s)');

    res.json({ success: true, message: 'Sample data seeded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to seed data' });
  } finally {
    await session.close();
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════════════

async function start(): Promise<void> {
  await connectNeo4j();

  app.listen(PORT, () => {
    logger.info(
╔═══════════════════════════════════════════════════════╗
║     AssetMind Financial Knowledge Graph v1.0     ║
╠═══════════════════════════════════════════════════════╣
║  Port:     ${PORT} ║
║  Neo4j:    ${driver ? '✅ Connected' : '⚠️ In-Memory'} ║
║  Routes:   /api/entities, /api/relationships     ║
╚═══════════════════════════════════════════════════════╝
    `);
 });
}

start();

export default app;