/**
 * Example: Complete Express Application with API Versioning
 * Demonstrates all features of the REZ API Versioning Middleware
 */

import express, { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import {
  createApiVersioningMiddleware,
  registerVersion,
  createVersionedRouter,
  createVersionManagementRoutes,
  getServices,
  requireVersion,
  initializeDefaultVersions,
} from '../src/index.js';

// Initialize Express app
const app = express();
app.use(express.json());

// ============================================
// STEP 1: Register API Versions
// ============================================

// Register v1.0.0 - Stable version
registerVersion({
  version: 'v1.0.0',
  isActive: true,
  breakingChanges: [],
});

// Register v1.1.0 - Minor update, backward compatible
registerVersion({
  version: 'v1.1.0',
  isActive: true,
  breakingChanges: [],
});

// Register v2.0.0 - Breaking changes
registerVersion({
  version: 'v2.0.0',
  isActive: true,
  deprecationDate: new Date('2025-06-01'),
  sunsetDate: new Date('2026-06-01'),
  breakingChanges: [
    {
      type: 'changed_response_schema',
      description: 'User response now includes metadata object',
      migrationGuide: 'Update client to handle new response format with data[] and meta{} objects',
    },
    {
      type: 'changed_request_schema',
      description: 'User creation now requires email field',
      migrationGuide: 'Add email field to user creation requests',
    },
    {
      type: 'removed_parameter',
      description: 'username parameter removed from user endpoints',
      migrationGuide: 'Use id or email instead of username',
    },
  ],
});

// Register v3.0.0 - Latest version
registerVersion({
  version: 'v3.0.0',
  isActive: true,
  breakingChanges: [
    {
      type: 'changed_behavior',
      description: 'Pagination now uses cursor-based instead of offset',
      migrationGuide: 'Use next_cursor and prev_cursor instead of page and limit',
    },
  ],
});

// ============================================
// STEP 2: Apply Versioning Middleware
// ============================================

app.use(createApiVersioningMiddleware({
  defaultVersion: 'v1.0.0',
  includeDeprecationHeaders: true,
  onVersionDeprecated: (req, res, info) => {
    logger.info(`[DEPRECATION WARNING] Version ${info.version} is deprecated`);
    logger.info(`  Sunset date: ${info.sunsetDate.toISOString()}`);
    logger.info(`  Message: ${info.message}`);
  },
  onBreakingChange: (req, res, changes) => {
    logger.info(`[BREAKING CHANGES] Version ${req.apiVersion} has ${changes.length} breaking changes`);
    changes.forEach(c => logger.info(`  - ${c.type}: ${c.description}`));
  },
}));

// ============================================
// STEP 3: Create Versioned Routes
// ============================================

// v1.0.0 Router
const v1 = createVersionedRouter('v1.0.0');

// Health check for v1
v1.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: req.apiVersion,
    timestamp: new Date().toISOString(),
  });
});

// Users list for v1 - returns { users: [] }
v1.get('/users', (req, res) => {
  res.json({
    users: [
      { id: 1, username: 'john_doe', name: 'John Doe' },
      { id: 2, username: 'jane_smith', name: 'Jane Smith' },
    ],
  });
});

// Create user for v1 - no email required
v1.post('/users', (req, res) => {
  const { username, name } = req.body;
  res.status(201).json({
    // STATISTICAL: mock ID generation for example/demo purposes
    id: Math.floor(Math.random() * 1000),
    username,
    name,
  });
});

// v1.1.0 Router
const v1_1 = createVersionedRouter('v1.1.0');

// Health check for v1.1
v1_1.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: req.apiVersion,
    build: 'v1.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Users list for v1.1 - same as v1 but with additional field
v1_1.get('/users', (req, res) => {
  res.json({
    users: [
      { id: 1, username: 'john_doe', name: 'John Doe', created_at: '2024-01-15' },
      { id: 2, username: 'jane_smith', name: 'Jane Smith', created_at: '2024-02-20' },
    ],
    count: 2,
  });
});

// v2.0.0 Router
const v2 = createVersionedRouter('v2.0.0');

// Health check for v2
v2.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: req.apiVersion,
    build: 'v2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Users list for v2 - NEW RESPONSE FORMAT
v2.get('/users', (req, res) => {
  res.json({
    data: [
      { id: 1, email: 'john@example.com', name: 'John Doe', createdAt: '2024-01-15T10:00:00Z' },
      { id: 2, email: 'jane@example.com', name: 'Jane Smith', createdAt: '2024-02-20T14:30:00Z' },
    ],
    meta: {
      total: 2,
      page: 1,
      perPage: 20,
    },
  });
});

// Create user for v2 - email REQUIRED
v2.post('/users', (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'email field is required',
      details: { email: 'This field is required in v2' },
    });
    return;
  }

  res.status(201).json({
    data: {
      // STATISTICAL: mock ID generation for example/demo purposes
      id: Math.floor(Math.random() * 1000),
      email,
      name,
      createdAt: new Date().toISOString(),
    },
    meta: {},
  });
});

// v3.0.0 Router
const v3 = createVersionedRouter('v3.0.0');

// Health check for v3
v3.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: req.apiVersion,
    build: 'v3.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Users list for v3 - CURSOR-BASED PAGINATION
v3.get('/users', (req, res) => {
  const { cursor, limit = 20 } = req.query;

  res.json({
    data: [
      { id: 3, email: 'bob@example.com', name: 'Bob Wilson', createdAt: '2024-03-10T09:00:00Z' },
      { id: 4, email: 'alice@example.com', name: 'Alice Johnson', createdAt: '2024-03-15T11:00:00Z' },
    ],
    meta: {
      next_cursor: 'eyJpZCI6NH0=',
      prev_cursor: cursor ? 'eyJpZCI6MX0=' : null,
      has_more: true,
    },
  });
});

// ============================================
// STEP 4: Mount Routes with Version Prefixes
// ============================================

// Mount v1 routes at /api/v1
app.use('/api/v1', v1);

// Mount v1.1 routes at /api/v1.1
app.use('/api/v1.1', v1_1);

// Mount v2 routes at /api/v2
app.use('/api/v2', v2);

// Mount v3 routes at /api/v3
app.use('/api/v3', v3);

// ============================================
// STEP 5: Version Management Endpoints
// ============================================

const { registry, deprecationManager } = getServices();
const mgmtRoutes = createVersionManagementRoutes(registry, deprecationManager);

app.get('/api/versions', (req, res, next) => {
  const route = mgmtRoutes.find(r => r.path === '/versions');
  if (route) route.handler(req, res, next);
});

app.get('/api/deprecations', (req, res, next) => {
  const route = mgmtRoutes.find(r => r.path === '/deprecations');
  if (route) route.handler(req, res, next);
});

// ============================================
// STEP 6: Endpoints Requiring Minimum Version
// ============================================

// Cursor pagination requires v3.0.0
app.get('/api/orders', requireVersion('v3.0.0'), (req, res) => {
  res.json({
    data: [
      { id: 1, total: 99.99, status: 'completed' },
      { id: 2, total: 149.99, status: 'pending' },
    ],
    meta: {
      next_cursor: 'eyJpZCI6Mn0=',
      prev_cursor: null,
      has_more: false,
    },
  });
});

// Advanced analytics requires v2.0.0
app.get('/api/analytics', requireVersion('v2.0.0'), (req, res) => {
  res.json({
    data: {
      total_users: 1542,
      active_orders: 87,
      revenue: 45230.50,
    },
    meta: {
      generated_at: new Date().toISOString(),
    },
  });
});

// ============================================
// STEP 7: Error Handling
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Version not found handler
app.use((req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: `API version not found. Supported versions: ${registry.getSupportedVersions().join(', ')}`,
      supportedVersions: registry.getSupportedVersions(),
    });
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║          REZ API Versioning - Server Started               ║
╠═══════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                 ║
║                                                           ║
║  Registered Versions:                                    ║
${registry.getVersions().map(v => `║    - ${v}).join('\n')}
║                                                           ║
║  Management Endpoints:                                    ║
║    GET /api/versions      - List all versions             ║
║    GET /api/deprecations  - List active deprecations       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `, { registry.getVersions().map(v => `║    - ${v });
});

export default app;
