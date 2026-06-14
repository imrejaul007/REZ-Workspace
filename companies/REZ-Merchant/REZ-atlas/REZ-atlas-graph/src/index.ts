/**
 * REZ Atlas Graph - Merchant Network Graph
 */
import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5173;

interface Node {
  id: string;
  type: 'merchant' | 'customer' | 'supplier' | 'competitor' | 'brand';
  name: string;
  properties: Record<string, any>;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  properties: Record<string, any>;
}

const nodes: Map<string, Node> = new Map();
const edges: Map<string, Edge> = new Map();

// Seed sample data
const sampleNodes: Node[] = [
  { id: 'm1', type: 'merchant', name: 'Restaurant ABC', properties: { category: 'restaurant', revenue: 50000 } },
  { id: 'm2', type: 'merchant', name: 'Cafe XYZ', properties: { category: 'cafe', revenue: 30000 } },
  { id: 'm3', type: 'merchant', name: 'Hotel 123', properties: { category: 'hotel', revenue: 150000 } }
];
sampleNodes.forEach(n => nodes.set(n.id, n));

const sampleEdges: Edge[] = [
  { id: uuidv4(), source: 'm1', target: 'm2', type: 'competitor', weight: 0.8, properties: { distance: '500m' } },
  { id: uuidv4(), source: 'm1', target: 'm3', type: 'supplier', weight: 0.5, properties: { product: 'vegetables' } }
];
sampleEdges.forEach(e => edges.set(e.id, e));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'REZ-atlas-graph', version: '1.0.0' });
});

app.get('/api/merchant/:merchantId', (req, res) => {
  const { depth = 1 } = req.query;
  const node = nodes.get(req.params.merchantId);
  if (!node) return res.status(404).json({ error: 'Merchant not found' });

  const relatedEdges = Array.from(edges.values()).filter(e => e.source === node.id || e.target === node.id);
  const relatedNodeIds = new Set<string>();
  relatedEdges.forEach(e => {
    relatedNodeIds.add(e.source);
    relatedNodeIds.add(e.target);
  });

  const relatedNodes = Array.from(nodes.values()).filter(n => relatedNodeIds.has(n.id));

  res.json({
    node,
    relationships: relatedEdges,
    connectedNodes: relatedNodes
  });
});

app.get('/api/relationships', (req, res) => {
  const { type, merchantId, limit = 100 } = req.query;
  let filtered = Array.from(edges.values());
  if (type) filtered = filtered.filter(e => e.type === type);
  if (merchantId) filtered = filtered.filter(e => e.source === merchantId || e.target === merchantId);
  res.json({ relationships: filtered.slice(0, Number(limit)), count: filtered.length });
});

app.post('/api/connect', (req, res) => {
  const { source, target, type, weight = 1, properties } = req.body;
  const edge: Edge = {
    id: uuidv4(),
    source,
    target,
    type,
    weight,
    properties: properties || {}
  };
  edges.set(edge.id, edge);
  res.status(201).json({ edge });
});

app.listen(PORT, () => console.log(`🔗 REZ Atlas Graph running on port ${PORT}`));
export default app;