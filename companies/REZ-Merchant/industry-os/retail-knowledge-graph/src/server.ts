/**
 * REZ Retail Knowledge Graph Service
 * Port: 4300
 *
 * Graph-based retail intelligence connecting products, customers, stores,
 * suppliers, and all retail relationships for AI-powered insights.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const PORT = process.env.PORT || 4300;
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-retail-kg';

// Types
interface KnowledgeNode {
  id: string;
  type: 'product' | 'customer' | 'store' | 'supplier' | 'category' | 'brand' | 'campaign' | 'employee';
  properties: Record<string, any>;
  labels: string[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
  };
}

interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  type: 'purchased' | 'viewed' | 'searched' | 'reviewed' | 'wishlisted' | 'compared' | 'supplied' | 'located_in' | 'belongs_to' | 'competes_with' | 'similar_to' | 'replaced_by' | 'upsold' | 'cross_sold' | 'follows';
  properties: Record<string, any>;
  weight: number;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
  };
}

interface GraphQuery {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
  depth?: number;
}

interface PathResult {
  path: KnowledgeNode[];
  edges: KnowledgeEdge[];
  totalWeight: number;
}

interface Recommendation {
  nodeId: string;
  node: KnowledgeNode;
  score: number;
  reason: string;
}

// In-memory graph store (for when Neo4j is not available)
class InMemoryGraph {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private edges: Map<string, KnowledgeEdge> = new Map();
  private adjacencyList: Map<string, Map<string, KnowledgeEdge>> = new Map();

  addNode(node: KnowledgeNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, new Map());
    }
  }

  addEdge(edge: KnowledgeEdge): void {
    this.edges.set(edge.id, edge);

    if (!this.adjacencyList.has(edge.source)) {
      this.adjacencyList.set(edge.source, new Map());
    }
    this.adjacencyList.get(edge.source)!.set(edge.target, edge);

    if (!this.adjacencyList.has(edge.target)) {
      this.adjacencyList.set(edge.target, new Map());
    }
    this.adjacencyList.get(edge.target)!.set(edge.source, edge);
  }

  getNode(id: string): KnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): KnowledgeEdge | undefined {
    return this.edges.get(id);
  }

  getNeighbors(nodeId: string, edgeType?: string): { node: KnowledgeNode; edge: KnowledgeEdge }[] {
    const neighbors: { node: KnowledgeNode; edge: KnowledgeEdge }[] = [];
    const adj = this.adjacencyList.get(nodeId);

    if (adj) {
      adj.forEach((edge, neighborId) => {
        if (!edgeType || edge.type === edgeType) {
          const neighbor = this.nodes.get(neighborId);
          if (neighbor) {
            neighbors.push({ node: neighbor, edge });
          }
        }
      });
    }

    return neighbors;
  }

  searchNodes(type: string, properties: Record<string, any>): KnowledgeNode[] {
    return Array.from(this.nodes.values()).filter(node => {
      if (node.type !== type) return false;
      return Object.entries(properties).every(([key, value]) =>
        node.properties[key] === value
      );
    });
  }

  findPath(startId: string, endId: string, maxDepth: number = 5): PathResult | null {
    const visited = new Set<string>();
    const queue: { nodeId: string; path: KnowledgeNode[]; edges: KnowledgeEdge[]; weight: number }[] = [
      { nodeId: startId, path: [this.nodes.get(startId)!], edges: [], weight: 0 }
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.nodeId === endId) {
        return {
          path: current.path,
          edges: current.edges,
          totalWeight: current.weight
        };
      }

      if (current.path.length > maxDepth) continue;
      if (visited.has(current.nodeId)) continue;
      visited.add(current.nodeId);

      const neighbors = this.getNeighbors(current.nodeId);
      for (const { node, edge } of neighbors) {
        if (!visited.has(node.id)) {
          queue.push({
            nodeId: node.id,
            path: [...current.path, node],
            edges: [...current.edges, edge],
            weight: current.weight + edge.weight
          });
        }
      }
    }

    return null;
  }

  getRecommendations(nodeId: string, limit: number = 10): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const node = this.nodes.get(nodeId);
    if (!node) return recommendations;

    // Get nodes connected by similar_to edges
    const similar = this.getNeighbors(nodeId, 'similar_to');
    similar.forEach(({ node: n }) => {
      recommendations.push({
        nodeId: n.id,
        node: n,
        score: 0.9,
        reason: 'Similar to items you viewed'
      });
    });

    // Get nodes purchased together
    const purchased = this.getNeighbors(nodeId, 'purchased');
    purchased.forEach(({ node: n }) => {
      recommendations.push({
        nodeId: n.id,
        node: n,
        score: 0.8,
        reason: 'Frequently purchased together'
      });
    });

    // Get upsell opportunities
    const upsells = this.getNeighbors(nodeId, 'upsold');
    upsells.forEach(({ node: n }) => {
      recommendations.push({
        nodeId: n.id,
        node: n,
        score: 0.7,
        reason: 'Premium alternative'
      });
    });

    // Get cross-sell opportunities
    const crossSells = this.getNeighbors(nodeId, 'cross_sold');
    crossSells.forEach(({ node: n }) => {
      recommendations.push({
        nodeId: n.id,
        node: n,
        score: 0.6,
        reason: 'Complementary product'
      });
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getStats(): { nodes: number; edges: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    this.nodes.forEach(node => {
      byType[node.type] = (byType[node.type] || 0) + 1;
    });

    return {
      nodes: this.nodes.size,
      edges: this.edges.size,
      byType
    };
  }
}

// Create graph instance
const graph = new InMemoryGraph();

// Seed with sample data
function seedGraph(): void {
  // Products
  const products = [
    { id: 'PROD-001', name: 'iPhone 15 Pro', category: 'Electronics', brand: 'Apple', price: 119900 },
    { id: 'PROD-002', name: 'Samsung Galaxy S24', category: 'Electronics', brand: 'Samsung', price: 79999 },
    { id: 'PROD-003', name: 'MacBook Air M3', category: 'Electronics', brand: 'Apple', price: 114900 },
    { id: 'PROD-004', name: 'AirPods Pro', category: 'Electronics', brand: 'Apple', price: 24900 },
    { id: 'PROD-005', name: 'Nike Air Max', category: 'Fashion', brand: 'Nike', price: 8995 },
    { id: 'PROD-006', name: 'Adidas Ultraboost', category: 'Fashion', brand: 'Adidas', price: 11999 },
    { id: 'PROD-007', name: 'Levi\'s 501 Jeans', category: 'Fashion', brand: 'Levi\'s', price: 3999 },
    { id: 'PROD-008', name: 'Coffee Maker', category: 'Home', brand: 'Phillips', price: 5999 },
    { id: 'PROD-009', name: 'Air Fryer', category: 'Home', brand: 'Philips', price: 7999 },
    { id: 'PROD-010', name: 'Smart Watch', category: 'Electronics', brand: 'Samsung', price: 29999 }
  ];

  products.forEach(p => {
    graph.addNode({
      id: p.id,
      type: 'product',
      properties: p,
      labels: [p.category, p.brand],
      metadata: { createdAt: new Date(), updatedAt: new Date(), version: 1 }
    });
  });

  // Customers
  const customers = [
    { id: 'CUST-001', name: 'Rahul Sharma', email: 'rahul@example.com', tier: 'gold' },
    { id: 'CUST-002', name: 'Priya Patel', email: 'priya@example.com', tier: 'silver' },
    { id: 'CUST-003', name: 'Amit Kumar', email: 'amit@example.com', tier: 'bronze' },
    { id: 'CUST-004', name: 'Sneha Gupta', email: 'sneha@example.com', tier: 'platinum' }
  ];

  customers.forEach(c => {
    graph.addNode({
      id: c.id,
      type: 'customer',
      properties: c,
      labels: [c.tier],
      metadata: { createdAt: new Date(), updatedAt: new Date(), version: 1 }
    });
  });

  // Stores
  const stores = [
    { id: 'STORE-001', name: 'REZ Mall - Bangalore', city: 'Bangalore', type: 'flagship' },
    { id: 'STORE-002', name: 'REZ Store - Mumbai', city: 'Mumbai', type: 'regular' },
    { id: 'STORE-003', name: 'REZ Store - Delhi', city: 'Delhi', type: 'regular' }
  ];

  stores.forEach(s => {
    graph.addNode({
      id: s.id,
      type: 'store',
      properties: s,
      labels: [s.type],
      metadata: { createdAt: new Date(), updatedAt: new Date(), version: 1 }
    });
  });

  // Suppliers
  const suppliers = [
    { id: 'SUP-001', name: 'Apple India', category: 'Electronics', rating: 4.8 },
    { id: 'SUP-002', name: 'Samsung India', category: 'Electronics', rating: 4.5 },
    { id: 'SUP-003', name: 'Nike India', category: 'Fashion', rating: 4.6 }
  ];

  suppliers.forEach(s => {
    graph.addNode({
      id: s.id,
      type: 'supplier',
      properties: s,
      labels: [s.category],
      metadata: { createdAt: new Date(), updatedAt: new Date(), version: 1 }
    });
  });

  // Create relationships
  // Similar products
  graph.addEdge({
    id: 'EDGE-001',
    source: 'PROD-001',
    target: 'PROD-002',
    type: 'similar_to',
    properties: {},
    weight: 0.85,
    metadata: { createdAt: new Date(), updatedAt: new Date() }
  });

  graph.addEdge({
    id: 'EDGE-002',
    source: 'PROD-001',
    target: 'PROD-003',
    type: 'similar_to',
    properties: {},
    weight: 0.75,
    metadata: { createdAt: new Date(), updatedAt: new Date() }
  });

  // Frequently purchased together
  graph.addEdge({
    id: 'EDGE-003',
    source: 'PROD-001',
    target: 'PROD-004',
    type: 'purchased',
    properties: { frequency: 150, revenue: 21710000 },
    weight: 0.9,
    metadata: { createdAt: new Date(), updatedAt: new Date() }
  });

  graph.addEdge({
    id: 'EDGE-004',
    source: 'PROD-003',
    target: 'PROD-004',
    type: 'purchased',
    properties: { frequency: 80, revenue: 11104000 },
    weight: 0.7,
    metadata: { createdAt: new Date(), updatedAt: new Date() }
  });

  // Customer purchases
  graph.addEdge({
    id: 'EDGE-005',
    source: 'CUST-001',
    target: 'PROD-001',
    type: 'purchased',
    properties: { date: '2024-01-15', amount: 119900 },
    weight: 1.0,
    metadata: { createdAt: new Date(), updatedAt: new Date() }
  });

  graph.addEdge({
    id: 'EDGE-006',
    source: 'CUST-001',
    target: 'PROD-004',
    type: 'purchased',
    properties: { date: '2024-01-15', amount: 24900 },
    weight: 1.0,
    metadata: { createdAt: new Date(), updatedAt: new Date() }
  });

  graph.addEdge({
    id: 'EDGE-007',
    source: 'CUST-004',
    target: 'PROD-003',
    type: 'purchased',
    properties: { date: '2024-02-01', amount: 114900 },
    weight: 1.0,
    metadata: { createdAt: new Date(), updatedAt: new Date() }
  });

  // Customer wishlists
  graph.addEdge({
    id: 'EDGE-008',
    source: 'CUST-002',
    target: 'PROD-002',
    type: 'wishlisted',
    properties: { addedAt: '2024-02-10' },
    weight: 0.5,
    metadata: { createdAt: new Date(), updatedAt: new Date() }
  });

  // Upsell relationships
  graph.addEdge({
    id: 'EDGE-009',
    source: 'PROD-002',
    target: 'PROD-001',
    type: 'upsold',
    properties: { conversionRate: 0.15 },
    weight: 0.6,
    metadata: { createdAt: new Date(), updatedAt: new Date() }
  });

  // Cross-sell relationships
  graph.addEdge({
    id: 'EDGE-010',
    source: 'PROD-001',
    target: 'PROD-010',
    type: 'cross_sold',
    properties: { conversionRate: 0.25 },
    weight: 0.7,
    metadata: { createdAt: new Date(), updatedAt: new Date() }
  });

  // Product located in stores
  graph.addEdge({
    id: 'EDGE-011',
    source: 'PROD-001',
    target: 'STORE-001',
    type: 'located_in',
    properties: { stock: 50 },
    weight: 1.0,
    metadata: { createdAt: new Date(), updatedAt: new Date() }
  });

  // Supplier supplies product
  graph.addEdge({
    id: 'EDGE-012',
    source: 'SUP-001',
    target: 'PROD-001',
    type: 'supplied',
    properties: { leadTime: 7, minOrder: 100 },
    weight: 1.0,
    metadata: { createdAt: new Date(), updatedAt: new Date() }
  });

  console.log('Graph seeded with sample data');
}

// Express App
const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ Retail Knowledge Graph',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    stats: graph.getStats()
  });
});

// ============================================
// NODE ENDPOINTS
// ============================================

// Create node
app.post('/api/nodes', (req: Request, res: Response) => {
  const { id, type, properties, labels } = req.body;

  const node: KnowledgeNode = {
    id: id || uuidv4(),
    type,
    properties: properties || {},
    labels: labels || [],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }
  };

  graph.addNode(node);
  res.status(201).json({ success: true, data: node });
});

// Get node by ID
app.get('/api/nodes/:id', (req: Request, res: Response) => {
  const node = graph.getNode(req.params.id);

  if (!node) {
    return res.status(404).json({ success: false, error: 'Node not found' });
  }

  res.json({ success: true, data: node });
});

// Search nodes
app.post('/api/nodes/search', (req: Request, res: Response) => {
  const { type, properties, limit } = req.body;

  let nodes = Array.from(graph['nodes'].values());

  if (type) {
    nodes = nodes.filter(n => n.type === type);
  }

  if (properties) {
    nodes = nodes.filter(n =>
      Object.entries(properties).every(([key, value]) =>
        n.properties[key] === value
      )
    );
  }

  if (limit) {
    nodes = nodes.slice(0, limit);
  }

  res.json({ success: true, data: nodes, count: nodes.length });
});

// Update node
app.put('/api/nodes/:id', (req: Request, res: Response) => {
  const node = graph.getNode(req.params.id);

  if (!node) {
    return res.status(404).json({ success: false, error: 'Node not found' });
  }

  const { properties, labels } = req.body;

  node.properties = { ...node.properties, ...properties };
  if (labels) node.labels = labels;
  node.metadata.updatedAt = new Date();
  node.metadata.version++;

  res.json({ success: true, data: node });
});

// ============================================
// EDGE ENDPOINTS
// ============================================

// Create edge
app.post('/api/edges', (req: Request, res: Response) => {
  const { source, target, type, properties, weight } = req.body;

  const edge: KnowledgeEdge = {
    id: uuidv4(),
    source,
    target,
    type,
    properties: properties || {},
    weight: weight || 1.0,
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };

  graph.addEdge(edge);
  res.status(201).json({ success: true, data: edge });
});

// Get edge by ID
app.get('/api/edges/:id', (req: Request, res: Response) => {
  const edge = graph.getEdge(req.params.id);

  if (!edge) {
    return res.status(404).json({ success: false, error: 'Edge not found' });
  }

  res.json({ success: true, data: edge });
});

// Get neighbors
app.get('/api/nodes/:id/neighbors', (req: Request, res: Response) => {
  const { type } = req.query;
  const neighbors = graph.getNeighbors(req.params.id, type as string);

  res.json({
    success: true,
    data: neighbors,
    count: neighbors.length
  });
});

// ============================================
// GRAPH QUERY ENDPOINTS
// ============================================

// Find path between nodes
app.get('/api/graph/path/:source/:target', (req: Request, res: Response) => {
  const { depth } = req.query;
  const path = graph.findPath(req.params.source, req.params.target, Number(depth) || 5);

  if (!path) {
    return res.status(404).json({ success: false, error: 'No path found' });
  }

  res.json({ success: true, data: path });
});

// Get recommendations
app.get('/api/recommendations/:nodeId', (req: Request, res: Response) => {
  const { limit } = req.query;
  const recommendations = graph.getRecommendations(
    req.params.nodeId,
    Number(limit) || 10
  );

  res.json({ success: true, data: recommendations });
});

// ============================================
// RETAIL-SPECIFIC ENDPOINTS
// ============================================

// Get customer 360 view
app.get('/api/retail/customer/:customerId/360', (req: Request, res: Response) => {
  const customer = graph.getNode(req.params.customerId);

  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  // Get all purchases
  const purchases = graph.getNeighbors(req.params.customerId, 'purchased');
  const wishlists = graph.getNeighbors(req.params.customerId, 'wishlisted');
  const views = graph.getNeighbors(req.params.customerId, 'viewed');

  // Calculate customer value
  const totalSpent = purchases.reduce((sum, { edge }) =>
    sum + (edge.properties.amount || 0), 0
  );

  // Find similar customers
  const similarCustomers: Recommendation[] = [];
  graph['nodes'].forEach((node, nodeId) => {
    if (node.type === 'customer' && nodeId !== req.params.customerId) {
      const commonProducts = graph.getNeighbors(req.params.customerId, 'purchased')
        .filter(p1 =>
          graph.getNeighbors(nodeId, 'purchased')
            .some(p2 => p2.node.id === p1.node.id)
        );

      if (commonProducts.length >= 2) {
        similarCustomers.push({
          nodeId,
          node,
          score: commonProducts.length / Math.max(purchases.length, 1),
          reason: `${commonProducts.length} common products`
        });
      }
    }
  });

  res.json({
    success: true,
    data: {
      customer,
      summary: {
        totalSpent,
        purchaseCount: purchases.length,
        wishlistCount: wishlists.length,
        avgOrderValue: purchases.length > 0 ? totalSpent / purchases.length : 0
      },
      recentPurchases: purchases.slice(0, 10),
      wishlist: wishlists,
      productViews: views.slice(0, 10),
      similarCustomers: similarCustomers.sort((a, b) => b.score - a.score).slice(0, 5)
    }
  });
});

// Get product insights
app.get('/api/retail/product/:productId/insights', (req: Request, res: Response) => {
  const product = graph.getNode(req.params.productId);

  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const similar = graph.getNeighbors(req.params.productId, 'similar_to');
  const frequentlyBought = graph.getNeighbors(req.params.productId, 'purchased');
  const upsells = graph.getNeighbors(req.params.productId, 'upsold');
  const crossSells = graph.getNeighbors(req.params.productId, 'cross_sold');
  const suppliers = graph.getNeighbors(req.params.productId, 'supplied');
  const stores = graph.getNeighbors(req.params.productId, 'located_in');

  // Find customers who bought this
  const customersWhoBought: string[] = [];
  graph['edges'].forEach(edge => {
    if (edge.type === 'purchased' &&
        (edge.source === req.params.productId || edge.target === req.params.productId)) {
      const customerId = edge.source === req.params.productId ? edge.target : edge.source;
      const customer = graph.getNode(customerId);
      if (customer?.type === 'customer') {
        customersWhoBought.push(customerId);
      }
    }
  });

  res.json({
    success: true,
    data: {
      product,
      insights: {
        similarProducts: similar,
        frequentlyBoughtWith: frequentlyBought,
        upsellOpportunities: upsells,
        crossSellOpportunities: crossSells,
        suppliers,
        availableIn: stores,
        customerCount: customersWhoBought.length,
        customerSegments: {
          gold: customersWhoBought.filter(id => {
            const c = graph.getNode(id);
            return c?.properties.tier === 'gold';
          }).length,
          platinum: customersWhoBought.filter(id => {
            const c = graph.getNode(id);
            return c?.properties.tier === 'platinum';
          }).length,
          silver: customersWhoBought.filter(id => {
            const c = graph.getNode(id);
            return c?.properties.tier === 'silver';
          }).length
        }
      }
    }
  });
});

// ============================================
// STATISTICS ENDPOINT
// ============================================

app.get('/api/stats', (req: Request, res: Response) => {
  const stats = graph.getStats();

  // Count edges by type
  const edgesByType: Record<string, number> = {};
  graph['edges'].forEach(edge => {
    edgesByType[edge.type] = (edgesByType[edge.type] || 0) + 1;
  });

  res.json({
    success: true,
    data: {
      ...stats,
      edgesByType,
      connectedComponents: 1, // Simplified
      avgDegree: stats.edges / stats.nodes || 0
    }
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'REZ Retail Knowledge Graph',
    version: '1.0.0',
    description: 'Graph-based retail intelligence for products, customers, and stores',
    port: PORT,
    endpoints: {
      health: '/health',
      nodes: '/api/nodes',
      edges: '/api/edges',
      search: '/api/nodes/search',
      path: '/api/graph/path/:source/:target',
      recommendations: '/api/recommendations/:nodeId',
      customer360: '/api/retail/customer/:id/360',
      productInsights: '/api/retail/product/:id/insights',
      stats: '/api/stats'
    }
  });
});

// Start server
seedGraph();

app.listen(PORT, () => {
  console.log(`REZ Retail Knowledge Graph running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;