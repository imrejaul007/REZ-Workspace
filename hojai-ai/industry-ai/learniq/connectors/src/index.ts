import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3030;

app.use(express.json());

// In-memory stores
const connectors: Map<string, any> = new Map();
const integrations: Map<string, any> = new Map();
const syncLogs: Map<string, any> = new Map();

// Initialize sample connectors
const sampleConnectors = [
  {
    id: 'lms-default',
    name: 'Learning Management System',
    type: 'lms',
    status: 'connected',
    config: { apiVersion: 'v2', baseUrl: 'https://lms.example.com' }
  },
  {
    id: 'payment-stripe',
    name: 'Payment Gateway',
    type: 'payment',
    status: 'connected',
    config: { provider: 'stripe', mode: 'test' }
  },
  {
    id: 'calendar-google',
    name: 'Google Calendar',
    type: 'calendar',
    status: 'active',
    config: { calendarId: 'primary', syncInterval: 15 }
  },
  {
    id: 'email-sendgrid',
    name: 'Email Service',
    type: 'email',
    status: 'active',
    config: { provider: 'sendgrid', dailyLimit: 1000 }
  }
];

sampleConnectors.forEach(c => connectors.set(c.id, c));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'connectors', timestamp: new Date().toISOString() });
});

// Get all connectors
app.get('/api/connectors', (_req: Request, res: Response) => {
  const connectorList = Array.from(connectors.values());
  res.json({ success: true, count: connectorList.length, data: connectorList });
});

// Get connector by ID
app.get('/api/connectors/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const connector = connectors.get(id);

  if (!connector) {
    res.status(404).json({ success: false, error: 'Connector not found' });
    return;
  }

  res.json({ success: true, data: connector });
});

// Create connector
app.post('/api/connectors', (req: Request, res: Response) => {
  const { name, type, config } = req.body;

  if (!name || !type) {
    res.status(400).json({ success: false, error: 'name and type are required' });
    return;
  }

  const connector = {
    id: uuidv4(),
    name,
    type,
    status: 'pending',
    config: config || {},
    createdAt: new Date().toISOString()
  };

  connectors.set(connector.id, connector);
  res.status(201).json({ success: true, data: connector });
});

// Update connector status
app.patch('/api/connectors/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, config } = req.body;

  if (!status) {
    res.status(400).json({ success: false, error: 'status is required' });
    return;
  }

  const connector = connectors.get(id);
  if (!connector) {
    res.status(404).json({ success: false, error: 'Connector not found' });
    return;
  }

  connector.status = status;
  if (config) {
    connector.config = { ...connector.config, ...config };
  }
  connector.updatedAt = new Date().toISOString();

  connectors.set(id, connector);
  res.json({ success: true, data: connector });
});

// Create integration
app.post('/api/integrations', (req: Request, res: Response) => {
  const { name, sourceConnectorId, targetConnectorId, mappingRules, syncSchedule } = req.body;

  if (!name || !sourceConnectorId || !targetConnectorId) {
    res.status(400).json({ success: false, error: 'name, sourceConnectorId, and targetConnectorId are required' });
    return;
  }

  const source = connectors.get(sourceConnectorId);
  const target = connectors.get(targetConnectorId);

  if (!source || !target) {
    res.status(404).json({ success: false, error: 'Source or target connector not found' });
    return;
  }

  const integration = {
    id: uuidv4(),
    name,
    sourceConnectorId,
    sourceConnectorName: source.name,
    targetConnectorId,
    targetConnectorName: target.name,
    mappingRules: mappingRules || [],
    syncSchedule: syncSchedule || { interval: 60, enabled: true },
    status: 'active',
    lastSync: null,
    createdAt: new Date().toISOString()
  };

  integrations.set(integration.id, integration);
  res.status(201).json({ success: true, data: integration });
});

// Get all integrations
app.get('/api/integrations', (req: Request, res: Response) => {
  const { status, connectorId } = req.query;
  let filtered = Array.from(integrations.values());

  if (status) {
    filtered = filtered.filter((i: any) => i.status === status);
  }
  if (connectorId) {
    filtered = filtered.filter((i: any) => i.sourceConnectorId === connectorId || i.targetConnectorId === connectorId);
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Trigger sync
app.post('/api/integrations/:id/sync', (req: Request, res: Response) => {
  const { id } = req.params;
  const integration = integrations.get(id);

  if (!integration) {
    res.status(404).json({ success: false, error: 'Integration not found' });
    return;
  }

  const syncLog = {
    id: uuidv4(),
    integrationId: id,
    integrationName: integration.name,
    status: 'running',
    startedAt: new Date().toISOString(),
    recordsProcessed: 0,
    errors: []
  };

  syncLogs.set(syncLog.id, syncLog);

  // Simulate sync completion (in production, this would be async)
  setTimeout(() => {
    syncLog.status = 'completed';
    syncLog.completedAt = new Date().toISOString();
    syncLog.recordsProcessed = Math.floor(Math.random() * 100);
    syncLogs.set(syncLog.id, syncLog);

    integration.lastSync = new Date().toISOString();
    integrations.set(id, integration);
  }, 100);

  res.status(201).json({ success: true, data: { syncLog } });
});

// Get sync logs
app.get('/api/sync-logs', (req: Request, res: Response) => {
  const { integrationId, status } = req.query;
  let filtered = Array.from(syncLogs.values());

  if (integrationId) {
    filtered = filtered.filter((l: any) => l.integrationId === integrationId);
  }
  if (status) {
    filtered = filtered.filter((l: any) => l.status === status);
  }

  // Sort by startedAt descending
  filtered.sort((a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Get connector statistics
app.get('/api/stats', (_req: Request, res: Response) => {
  const allConnectors = Array.from(connectors.values());
  const allIntegrations = Array.from(integrations.values());

  res.json({
    success: true,
    data: {
      totalConnectors: allConnectors.length,
      connectedConnectors: allConnectors.filter((c: any) => c.status === 'connected' || c.status === 'active').length,
      totalIntegrations: allIntegrations.length,
      activeIntegrations: allIntegrations.filter((i: any) => i.status === 'active').length,
      totalSyncLogs: syncLogs.size,
      byType: allConnectors.reduce((acc: any, c: any) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      }, {})
    }
  });
});

app.listen(PORT, () => {
  console.log(`Connectors service running on port ${PORT}`);
});

export default app;