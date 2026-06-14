/**
 * REZ Grapp.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-ID', (req as any).requestId);
  next();
});

  aph Service - Express Entry Point
 * Port: 4129
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { commerceGraph, GraphNode, GraphQuery, PathQuery, NodeType, RelationshipType } from './commerceGraph';

const app = express();
const PORT = process.env.PORT || 4129;

// Middleware
app.use(helmet());

// Rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests' }
});
app.use(rateLimiter);
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'graph-service', timestamp: new Date().toISOString() });
});

// ============================================
// Node Routes
// ============================================

// Create node
app.post('/nodes', async (req: Request, res: Response) => {
  try {
    const { type, properties, id, labels } = req.body;
    const node = await commerceGraph.addUser({ id: id || '', name: '', ...req.body });
    res.status(201).json({ success: true, data: node });
  } catch (error) {
    console.error('Error creating node:', error);
    res.status(500).json({ success: false, error: 'Failed to create node' });
  }
});

// Get node
app.get('/nodes/:id', async (req: Request, res: Response) => {
  try {
    const node = await commerceGraph['store'].getNode(req.params.id);
    if (!node) {
      return res.status(404).json({ success: false, error: 'Node not found' });
    }
    res.json({ success: true, data: node });
  } catch (error) {
    console.error('Error getting node:', error);
    res.status(500).json({ success: false, error: 'Failed to get node' });
  }
});

// Delete node
app.delete('/nodes/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await commerceGraph['store'].deleteNode(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Node not found' });
    }
    res.json({ success: true, message: 'Node deleted' });
  } catch (error) {
    console.error('Error deleting node:', error);
    res.status(500).json({ success: false, error: 'Failed to delete node' });
  }
});

// Get nodes by type
app.get('/nodes', async (req: Request, res: Response) => {
  try {
    const { type, limit } = req.query;
    if (!type) {
      return res.status(400).json({ success: false, error: 'Type is required' });
    }
    const nodes = await commerceGraph['store'].getNodesByType(type as NodeType, Number(limit) || 100);
    res.json({ success: true, data: nodes, count: nodes.length });
  } catch (error) {
    console.error('Error getting nodes:', error);
    res.status(500).json({ success: false, error: 'Failed to get nodes' });
  }
});

// ============================================
// User Routes
// ============================================

app.post('/users', async (req: Request, res: Response) => {
  try {
    const { id, name, email, phone, tier, metadata } = req.body;
    if (!id || !name) {
      return res.status(400).json({ success: false, error: 'id and name are required' });
    }
    const user = await commerceGraph.addUser({ id, name, email, phone, tier, metadata });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

app.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const node = await commerceGraph['store'].getNode(req.params.id);
    if (!node || node.type !== 'user') {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: node });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

app.get('/users/:id/merchants', async (req: Request, res: Response) => {
  try {
    const merchants = await commerceGraph.getUserMerchants(req.params.id);
    res.json({ success: true, data: merchants });
  } catch (error) {
    console.error('Error getting user merchants:', error);
    res.status(500).json({ success: false, error: 'Failed to get user merchants' });
  }
});

app.get('/users/:id/network', async (req: Request, res: Response) => {
  try {
    const network = await commerceGraph.getUserNetwork(req.params.id);
    res.json({ success: true, data: network });
  } catch (error) {
    console.error('Error getting user network:', error);
    res.status(500).json({ success: false, error: 'Failed to get user network' });
  }
});

// ============================================
// Merchant Routes
// ============================================

app.post('/merchants', async (req: Request, res: Response) => {
  try {
    const { id, name, category, rating, location, metadata } = req.body;
    if (!id || !name || !category) {
      return res.status(400).json({ success: false, error: 'id, name, and category are required' });
    }
    const merchant = await commerceGraph.addMerchant({ id, name, category, rating, location, metadata });
    res.status(201).json({ success: true, data: merchant });
  } catch (error) {
    console.error('Error creating merchant:', error);
    res.status(500).json({ success: false, error: 'Failed to create merchant' });
  }
});

app.get('/merchants/:id', async (req: Request, res: Response) => {
  try {
    const node = await commerceGraph['store'].getNode(req.params.id);
    if (!node || node.type !== 'merchant') {
      return res.status(404).json({ success: false, error: 'Merchant not found' });
    }
    res.json({ success: true, data: node });
  } catch (error) {
    console.error('Error getting merchant:', error);
    res.status(500).json({ success: false, error: 'Failed to get merchant' });
  }
});

app.get('/merchants/:id/customers', async (req: Request, res: Response) => {
  try {
    const customers = await commerceGraph.getMerchantCustomers(req.params.id);
    res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error getting merchant customers:', error);
    res.status(500).json({ success: false, error: 'Failed to get merchant customers' });
  }
});

// ============================================
// Relationship Routes
// ============================================

// Record purchase
app.post('/relationships/purchase', async (req: Request, res: Response) => {
  try {
    const { userId, merchantId, orderId, amount, items, location } = req.body;
    if (!userId || !merchantId || !orderId || !amount) {
      return res.status(400).json({ success: false, error: 'userId, merchantId, orderId, and amount are required' });
    }
    const relationship = await commerceGraph.recordPurchase({ userId, merchantId, orderId, amount, items, location });
    res.status(201).json({ success: true, data: relationship });
  } catch (error) {
    console.error('Error recording purchase:', error);
    res.status(500).json({ success: false, error: 'Failed to record purchase' });
  }
});

// Link users
app.post('/relationships/users/link', async (req: Request, res: Response) => {
  try {
    const { sourceUserId, targetUserId, linkType } = req.body;
    if (!sourceUserId || !targetUserId || !linkType) {
      return res.status(400).json({ success: false, error: 'sourceUserId, targetUserId, and linkType are required' });
    }
    const relationship = await commerceGraph.linkUsers(sourceUserId, targetUserId, linkType);
    res.status(201).json({ success: true, data: relationship });
  } catch (error) {
    console.error('Error linking users:', error);
    res.status(500).json({ success: false, error: 'Failed to link users' });
  }
});

// Get neighbors
app.get('/nodes/:id/neighbors', async (req: Request, res: Response) => {
  try {
    const { relationshipTypes, direction, limit } = req.query;
    const neighbors = await commerceGraph['store'].getNeighbors(req.params.id, {
      relationshipTypes: relationshipTypes ? relationshipTypes.toString().split(',') as RelationshipType[] : undefined,
      direction: direction as 'outgoing' | 'incoming' | 'unknown' || 'unknown',
      limit: limit ? Number(limit) : 50
    });
    res.json({ success: true, data: neighbors });
  } catch (error) {
    console.error('Error getting neighbors:', error);
    res.status(500).json({ success: false, error: 'Failed to get neighbors' });
  }
});

// ============================================
// Graph Operations
// ============================================

// Find path
app.get('/graph/path/:source/:target', async (req: Request, res: Response) => {
  try {
    const { source, target } = req.params;
    const { maxDepth } = req.query;
    const path = await commerceGraph['store'].findPath({
      startNodeId: source,
      endNodeId: target,
      maxDepth: maxDepth ? Number(maxDepth) : 5
    });
    res.json({ success: true, data: path });
  } catch (error) {
    console.error('Error finding path:', error);
    res.status(500).json({ success: false, error: 'Failed to find path' });
  }
});

// Query graph
app.post('/graph/query', async (req: Request, res: Response) => {
  try {
    const result = await commerceGraph.query(req.body as GraphQuery);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error querying graph:', error);
    res.status(500).json({ success: false, error: 'Failed to query graph' });
  }
});

// Detect communities
app.get('/graph/communities', async (req: Request, res: Response) => {
  try {
    const communities = await commerceGraph.detectCustomerCommunities();
    const result: Record<string, string[]> = {};
    communities.forEach((members, id) => {
      result[id] = members;
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error detecting communities:', error);
    res.status(500).json({ success: false, error: 'Failed to detect communities' });
  }
});

// Influence scores
app.get('/graph/influence', async (req: Request, res: Response) => {
  try {
    const { type, limit } = req.query;
    const scores = await commerceGraph.findInfluenceLeaders(type as NodeType | undefined, limit ? Number(limit) : 10);
    res.json({ success: true, data: scores });
  } catch (error) {
    console.error('Error calculating influence:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate influence' });
  }
});

// ============================================
// Statistics
// ============================================

app.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await commerceGraph.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] REZ Graph Service started on port ${PORT}`);
});

export default app;
