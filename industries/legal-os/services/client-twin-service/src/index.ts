import express, { Express, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TwinOSClient } from '@legal-os/twinos-sdk';
import { ClioClient } from 'clio-sdk';
import { ClientTwinSchema, ClientTwin, ClientCreateInput, ClientUpdateInput } from './schemas';
import { logger } from './logger';
import { EventEmitter } from 'events';

const app: Express = express();
const events = new EventEmitter();

// TwinOS Client (port 4142)
const twinos = new TwinOSClient({
  baseUrl: process.env.TWINOS_URL || 'http://localhost:4142',
  apiKey: process.env.TWINOS_API_KEY || ''
});

// Clio Practice Management Integration
const clio = new ClioClient({
  clientId: process.env.CLIO_CLIENT_ID || '',
  clientSecret: process.env.CLIO_CLIENT_SECRET || '',
  redirectUri: process.env.CLIO_REDIRECT_URI || ''
});

// REZ CRM Client
interface REZCRMConfig {
  baseUrl: string;
  apiKey: string;
}

const rezCRM: REZCRMConfig = {
  baseUrl: process.env.REZ_CRM_URL || 'http://localhost:4000',
  apiKey: process.env.REZ_CRM_API_KEY || ''
};

app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'client-twin-service', timestamp: new Date().toISOString() });
});

// Create Client Twin
app.post('/clients', async (req: Request, res: Response) => {
  try {
    const input: ClientCreateInput = req.body;

    // Validate input
    const validated = ClientTwinSchema.omit({ clientId: true }).parse(input);

    // Generate client ID
    const clientId = uuidv4();

    // Create Client Twin in TwinOS
    const twinData: ClientTwin = {
      ...validated,
      clientId,
      dateOfOnboarding: new Date().toISOString(),
      relationships: {
        HAS_MATTER: [],
        HAS_DOCUMENT: [],
        WORKS_WITH: []
      }
    };

    const twinResponse = await twinos.createTwin({
      twinId: `4142-C1-${clientId}`,
      type: 'ClientTwin',
      data: twinData
    });

    // Sync to Clio Practice Management
    await syncToClio(clientId, twinData);

    // Sync to REZ CRM
    await syncToREZCRM(clientId, twinData);

    logger.info(`Client Twin created: ${clientId}`);

    res.status(201).json({
      clientId,
      twinId: twinResponse.twinId,
      status: 'created'
    });
  } catch (error) {
    logger.error('Failed to create client twin', { error });
    res.status(400).json({ error: 'Failed to create client twin', details: error });
  }
});

// Get Client Twin
app.get('/clients/:clientId', async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

    const twin = await twinos.getTwin(`4142-C1-${clientId}`);

    if (!twin) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(twin);
  } catch (error) {
    logger.error(`Failed to get client ${req.params.clientId}`, { error });
    res.status(500).json({ error: 'Failed to retrieve client' });
  }
});

// Update Client Twin
app.put('/clients/:clientId', async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const updates: ClientUpdateInput = req.body;

    const validated = ClientTwinSchema.partial().parse(updates);

    const updated = await twinos.updateTwin(`4142-C1-${clientId}`, validated);

    // Sync updates to Clio
    await syncToClio(clientId, updated);

    // Sync updates to REZ CRM
    await syncToREZCRM(clientId, updated);

    logger.info(`Client Twin updated: ${clientId}`);

    res.json(updated);
  } catch (error) {
    logger.error(`Failed to update client ${req.params.clientId}`, { error });
    res.status(400).json({ error: 'Failed to update client' });
  }
});

// List Clients
app.get('/clients', async (req: Request, res: Response) => {
  try {
    const { status, riskProfile, limit = 50, offset = 0 } = req.query;

    const query: Record<string, unknown> = {
      type: 'ClientTwin',
      limit: Number(limit),
      offset: Number(offset)
    };

    if (status) query['data.clientStatus'] = status;
    if (riskProfile) query['data.riskProfile'] = riskProfile;

    const twins = await twinos.queryTwins(query);

    res.json({
      clients: twins.map(t => t.data),
      total: twins.length,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    logger.error('Failed to list clients', { error });
    res.status(500).json({ error: 'Failed to list clients' });
  }
});

// Create relationship (Client -> Matter)
app.post('/clients/:clientId/matters', async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const { matterId } = req.body;

    await twinos.createRelationship({
      sourceTwinId: `4142-C1-${clientId}`,
      targetTwinId: `4142-M1-${matterId}`,
      relationshipType: 'HAS_MATTER'
    });

    events.emit('matter_linked', { clientId, matterId });

    res.json({ status: 'linked', clientId, matterId });
  } catch (error) {
    logger.error('Failed to link matter to client', { error });
    res.status(400).json({ error: 'Failed to link matter' });
  }
});

// Sync to Clio Practice Management
async function syncToClio(clientId: string, data: Partial<ClientTwin>): Promise<void> {
  try {
    const clioMatter = {
      display_number: `CL-${clientId.slice(0, 8)}`,
      description: data.legalName || '',
      client_name: data.legalName || '',
      status: data.clientStatus === 'Active' ? 'open' : 'closed'
    };

    await clio.matters.create(clioMatter);
    logger.info(`Synced client to Clio: ${clientId}`);
  } catch (error) {
    logger.warn(`Clio sync failed for client ${clientId}`, { error });
  }
}

// Sync to REZ CRM
async function syncToREZCRM(clientId: string, data: Partial<ClientTwin>): Promise<void> {
  try {
    const response = await fetch(`${rezCRM.baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': rezCRM.apiKey
      },
      body: JSON.stringify({
        customerId: clientId,
        name: data.legalName,
        type: 'LEGAL_CLIENT',
        attributes: {
          entityType: data.entityType,
          jurisdiction: data.jurisdiction,
          riskProfile: data.riskProfile,
          feeStructure: data.billingInfo?.feeStructure
        }
      })
    });

    if (response.ok) {
      logger.info(`Synced client to REZ CRM: ${clientId}`);
    }
  } catch (error) {
    logger.warn(`REZ CRM sync failed for client ${clientId}`, { error });
  }
}

// Event subscriptions
events.on('matter_linked', async (data: { clientId: string; matterId: string }) => {
  logger.info('Matter linked to client', data);
  // Trigger CRM update for cross-selling opportunities
  await fetch(`${rezCRM.baseUrl}/api/customers/${data.clientId}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': rezCRM.apiKey
    },
    body: JSON.stringify({
      type: 'MATTER_LINKED',
      matterId: data.matterId,
      timestamp: new Date().toISOString()
    })
  });
});

const PORT = process.env.PORT || 4200;

app.listen(PORT, () => {
  logger.info(`Client Twin Service running on port ${PORT}`);
});

export { app, twinos, clio };
