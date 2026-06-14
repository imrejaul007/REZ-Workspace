/**
 * Unit Tests for Workflow Routes
 */

import express from 'express';
import request from 'supertest';

// Mock dependencies
jest.mock('../../src/config/database', () => ({
  connectMongoDB: jest.fn().mockResolvedValue({}),
  disconnectMongoDB: jest.fn().mockResolvedValue({}),
  connectRedis: jest.fn().mockResolvedValue({}),
  disconnectRedis: jest.fn().mockResolvedValue({}),
  isMongoConnected: jest.fn().mockReturnValue(true),
  getRedisClient: jest.fn().mockReturnValue({
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    isOpen: true,
  }),
}));

jest.mock('../../src/hub-client', () => ({
  rezWorkspaceHub: {
    createWorkflow: jest.fn().mockResolvedValue({ id: 'wf-test' }),
    executeWorkflow: jest.fn().mockResolvedValue({ success: true }),
    trackEvent: jest.fn().mockResolvedValue({}),
  },
}));

import workflowRoutes from '../../src/routes/workflow';

describe('Workflow Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/workflows', workflowRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/workflows', () => {
    it('should list all workflows', async () => {
      const response = await request(app).get('/api/workflows');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.workflows)).toBe(true);
    });

    it('should filter by workspace', async () => {
      const response = await request(app)
        .get('/api/workflows')
        .query({ workspaceId: 'ws-1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter active workflows', async () => {
      const response = await request(app)
        .get('/api/workflows')
        .query({ status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/workflows/:id', () => {
    it('should get workflow by id', async () => {
      const response = await request(app).get('/api/workflows/wf-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.workflow).toBeDefined();
    });

    it('should return 404 for non-existent workflow', async () => {
      const response = await request(app).get('/api/workflows/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/workflows', () => {
    it('should create a new workflow', async () => {
      const workflowData = {
        name: 'Test Workflow',
        trigger: { type: 'manual' },
        actions: [{ type: 'notify', config: { message: 'Hello' } }],
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.workflow).toBeDefined();
      expect(response.body.workflow.name).toBe('Test Workflow');
    });

    it('should require name', async () => {
      const workflowData = {
        trigger: { type: 'manual' },
        actions: [{ type: 'notify', config: { message: 'Hello' } }],
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require trigger', async () => {
      const workflowData = {
        name: 'Test Workflow',
        actions: [{ type: 'notify', config: { message: 'Hello' } }],
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require at least one action', async () => {
      const workflowData = {
        name: 'Test Workflow',
        trigger: { type: 'manual' },
        actions: [],
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/workflows/:id', () => {
    it('should update workflow', async () => {
      const updateData = {
        name: 'Updated Workflow Name',
      };

      const response = await request(app)
        .put('/api/workflows/wf-1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent workflow', async () => {
      const response = await request(app)
        .put('/api/workflows/non-existent')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/workflows/:id', () => {
    it('should delete workflow', async () => {
      const response = await request(app)
        .delete('/api/workflows/wf-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent workflow', async () => {
      const response = await request(app)
        .delete('/api/workflows/non-existent');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/workflows/:id/toggle', () => {
    it('should toggle workflow active status', async () => {
      const response = await request(app)
        .patch('/api/workflows/wf-1/toggle');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(typeof response.body.isActive).toBe('boolean');
    });
  });

  describe('POST /api/workflows/:id/trigger', () => {
    it('should trigger workflow manually', async () => {
      const response = await request(app)
        .post('/api/workflows/wf-1/trigger')
        .send({ data: { test: 'data' } });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.run).toBeDefined();
    });

    it('should return 404 for non-existent workflow', async () => {
      const response = await request(app)
        .post('/api/workflows/non-existent/trigger')
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/workflows/:id/runs', () => {
    it('should get workflow runs', async () => {
      const response = await request(app)
        .get('/api/workflows/wf-1/runs');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.runs)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/workflows/wf-1/runs')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/workflows/templates/list', () => {
    it('should return workflow templates', async () => {
      const response = await request(app)
        .get('/api/workflows/templates/list');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.templates)).toBe(true);
    });
  });

  describe('GET /api/workflows/triggers/list', () => {
    it('should return available triggers', async () => {
      const response = await request(app)
        .get('/api/workflows/triggers/list');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.triggers)).toBe(true);
    });
  });

  describe('GET /api/workflows/actions/list', () => {
    it('should return available actions', async () => {
      const response = await request(app)
        .get('/api/workflows/actions/list');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.actions)).toBe(true);
    });
  });

  describe('GET /api/workflows/corpperks/hr-workflows', () => {
    it('should return HR workflows', async () => {
      const response = await request(app)
        .get('/api/workflows/corpperks/hr-workflows');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.workflows)).toBe(true);
    });
  });

  describe('POST /api/workflows/corpperks/hr-workflows', () => {
    it('should create HR workflow', async () => {
      const hrWorkflowData = {
        name: 'New Employee Onboarding',
        description: 'Automated onboarding sequence',
        trigger: { type: 'event', event: 'employee.created' },
        actions: [
          { type: 'notify', config: { channel: 'hr', message: 'New employee' } },
        ],
      };

      const response = await request(app)
        .post('/api/workflows/corpperks/hr-workflows')
        .send(hrWorkflowData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.workflow.type).toBe('hr-workflow');
    });
  });

  describe('POST /api/workflows/corpperks/sync', () => {
    it('should sync workflows with CorpPerks', async () => {
      const response = await request(app)
        .post('/api/workflows/corpperks/sync')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('synced');
    });
  });
});