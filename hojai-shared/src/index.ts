/**
 * HOJAI Shared Utilities Service
 * Shared types, validation, and common utilities across HOJAI ecosystem
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 4580;
const app: Express = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// ==================== TYPES & INTERFACES ====================

interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  quota: {
    apiCalls: number;
    storage: number;
    users: number;
  };
  usage: {
    apiCalls: number;
    storage: number;
    users: number;
  };
  status: 'active' | 'suspended' | 'trial';
  createdAt: Date;
}

interface ApiKey {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  permissions: string[];
  expiresAt: Date | null;
  lastUsed: Date | null;
  status: 'active' | 'revoked';
}

interface WebhookConfig {
  id: string;
  tenantId: string;
  url: string;
  events: string[];
  secret: string;
  retries: number;
  status: 'active' | 'inactive';
}

// In-memory storage
const tenants: Map<string, Tenant> = new Map();
const apiKeys: Map<string, ApiKey> = new Map();
const webhooks: Map<string, WebhookConfig> = new Map();

// Middleware
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};

app.use(requestLogger);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'hojai-shared',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ==================== VALIDATION UTILITIES ====================

// Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// URL validation
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// UUID validation
const isValidUuid = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Validate request body against schema
interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

const validateBody = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      if (rule.required && (value === undefined || value === null)) {
        errors.push(`Field '${rule.field}' is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (typeof value !== rule.type) {
          errors.push(`Field '${rule.field}' must be of type ${rule.type}`);
        }

        if (rule.type === 'string') {
          if (rule.min !== undefined && value.length < rule.min) {
            errors.push(`Field '${rule.field}' must be at least ${rule.min} characters`);
          }
          if (rule.max !== undefined && value.length > rule.max) {
            errors.push(`Field '${rule.field}' must be at most ${rule.max} characters`);
          }
          if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(`Field '${rule.field}' format is invalid`);
          }
        }

        if (rule.type === 'number') {
          if (rule.min !== undefined && value < rule.min) {
            errors.push(`Field '${rule.field}' must be at least ${rule.min}`);
          }
          if (rule.max !== undefined && value > rule.max) {
            errors.push(`Field '${rule.field}' must be at most ${rule.max}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
};

// ==================== TENANT MANAGEMENT ====================

// List tenants
app.get('/api/tenants', (_req: Request, res: Response) => {
  const tenantList = Array.from(tenants.values());
  res.json({ tenants: tenantList, count: tenantList.length });
});

// Create tenant
app.post('/api/tenants', validateBody([
  { field: 'name', type: 'string', required: true, min: 2, max: 100 },
  { field: 'plan', type: 'string', required: true }
]), (req: Request, res: Response) => {
  const { name, plan } = req.body;

  const tenant: Tenant = {
    id: uuidv4(),
    name,
    plan: plan || 'free',
    quota: {
      apiCalls: 1000,
      storage: 100,
      users: 5
    },
    usage: {
      apiCalls: 0,
      storage: 0,
      users: 0
    },
    status: 'trial',
    createdAt: new Date()
  };

  tenants.set(tenant.id, tenant);
  res.status(201).json({ tenant });
});

// Get tenant
app.get('/api/tenants/:id', (req: Request, res: Response) => {
  const tenant = tenants.get(req.params.id);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json({ tenant });
});

// Update tenant
app.put('/api/tenants/:id', (req: Request, res: Response) => {
  const tenant = tenants.get(req.params.id);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  const { name, plan, status, quota } = req.body;

  if (name) tenant.name = name;
  if (plan) tenant.plan = plan;
  if (status) tenant.status = status;
  if (quota) tenant.quota = { ...tenant.quota, ...quota };

  res.json({ tenant });
});

// Delete tenant
app.delete('/api/tenants/:id', (req: Request, res: Response) => {
  const deleted = tenants.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json({ success: true });
});

// ==================== API KEY MANAGEMENT ====================

// List API keys
app.get('/api/apikeys', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  let keys = Array.from(apiKeys.values());

  if (tenantId) {
    keys = keys.filter(k => k.tenantId === tenantId);
  }

  res.json({ apiKeys: keys, count: keys.length });
});

// Create API key
app.post('/api/apikeys', validateBody([
  { field: 'tenantId', type: 'string', required: true },
  { field: 'name', type: 'string', required: true, min: 2, max: 50 }
]), (req: Request, res: Response) => {
  const { tenantId, name, permissions } = req.body;

  const apiKey: ApiKey = {
    id: uuidv4(),
    tenantId,
    key: `hk_${uuidv4().replace(/-/g, '')}`,
    name,
    permissions: permissions || ['read'],
    expiresAt: null,
    lastUsed: null,
    status: 'active'
  };

  apiKeys.set(apiKey.id, apiKey);
  res.status(201).json({ apiKey, secret: apiKey.key });
});

// Revoke API key
app.delete('/api/apikeys/:id', (req: Request, res: Response) => {
  const key = apiKeys.get(req.params.id);
  if (!key) {
    return res.status(404).json({ error: 'API key not found' });
  }

  key.status = 'revoked';
  apiKeys.set(key.id, key);
  res.json({ success: true });
});

// ==================== WEBHOOK MANAGEMENT ====================

// List webhooks
app.get('/api/webhooks', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  let hooks = Array.from(webhooks.values());

  if (tenantId) {
    hooks = hooks.filter(w => w.tenantId === tenantId);
  }

  res.json({ webhooks: hooks, count: hooks.length });
});

// Create webhook
app.post('/api/webhooks', validateBody([
  { field: 'tenantId', type: 'string', required: true },
  { field: 'url', type: 'string', required: true },
  { field: 'events', type: 'array', required: true }
]), (req: Request, res: Response) => {
  const { tenantId, url, events } = req.body;

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const webhook: WebhookConfig = {
    id: uuidv4(),
    tenantId,
    url,
    events,
    secret: `whs_${uuidv4().replace(/-/g, '')}`,
    retries: 3,
    status: 'active'
  };

  webhooks.set(webhook.id, webhook);
  res.status(201).json({ webhook });
});

// Delete webhook
app.delete('/api/webhooks/:id', (req: Request, res: Response) => {
  const deleted = webhooks.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  res.json({ success: true });
});

// ==================== UTILITY ENDPOINTS ====================

// Validate endpoint
app.post('/api/validate', (req: Request, res: Response) => {
  const { type, value } = req.body;

  let result = false;
  switch (type) {
    case 'email':
      result = isValidEmail(value);
      break;
    case 'url':
      result = isValidUrl(value);
      break;
    case 'uuid':
      result = isValidUuid(value);
      break;
    default:
      return res.status(400).json({ error: 'Invalid validation type' });
  }

  res.json({ type, value, valid: result });
});

// Generate UUID
app.get('/api/utils/uuid', (_req: Request, res: Response) => {
  res.json({ uuid: uuidv4() });
});

// Health metrics
app.get('/api/stats', (_req: Request, res: Response) => {
  res.json({
    tenants: tenants.size,
    apiKeys: apiKeys.size,
    webhooks: webhooks.size,
    activeKeys: Array.from(apiKeys.values()).filter(k => k.status === 'active').length
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`HOJAI Shared Service running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Utilities: http://localhost:${PORT}/api/utils/*`);
});

export default app;
