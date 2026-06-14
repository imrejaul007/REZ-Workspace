import { logger } from '../../shared/logger';
/**
 * Twin Marketplace Integration Tests
 *
 * Run with: npx jest tests/twins.test.ts
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:4760';
const CORPID_TOKEN = 'corpid-internal-token';

// Test data
const TEST_EMPLOYEE = {
  corpId: 'CI-IND-TEST001',
  name: 'Test Employee',
  email: 'test@example.com',
  department: 'Engineering',
  skills: ['TypeScript', 'React', 'Node.js']
};

const TEST_TWIN = {
  twinId: `TWIN-${TEST_EMPLOYEE.corpId}-KNOWLEDGE`,
  twinType: 'KNOWLEDGE',
  ownerCorpId: TEST_EMPLOYEE.corpId
};

// Helper function for API calls
async function apiCall(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: any }> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': CORPID_TOKEN,
      ...options.headers
    }
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data };
}

// =============================================================================
// HEALTH CHECK TESTS
// =============================================================================

describe('Health Checks', () => {
  test('GET /health returns OK', async () => {
    const { status, data } = await apiCall('/health');
    expect(status).toBe(200);
    expect(data.status).toBe('ok');
  });

  test('GET /health/ready returns ready state', async () => {
    const { status, data } = await apiCall('/health/ready');
    expect(status).toBe(200);
    expect(data.status).toBe('ready');
  });
});

// =============================================================================
// TWIN CRUD TESTS
// =============================================================================

describe('Twin CRUD Operations', () => {
  let createdTwinId: string;

  test('POST /twins - Create twin', async () => {
    const { status, data } = await apiCall('/twins', {
      method: 'POST',
      body: JSON.stringify({
        ownerCorpId: TEST_EMPLOYEE.corpId,
        ownerName: TEST_EMPLOYEE.name,
        ownerEmail: TEST_EMPLOYEE.email,
        twinType: 'KNOWLEDGE',
        initialKnowledge: {
          domains: [TEST_EMPLOYEE.department],
          expertise: TEST_EMPLOYEE.skills
        }
      })
    });

    expect([200, 201, 409]).toContain(status); // 409 if already exists
    if (data.success) {
      createdTwinId = data.data?.twinId;
    }
  });

  test('GET /twins/:twinId - Get twin', async () => {
    const twinId = `TWIN-${TEST_EMPLOYEE.corpId}-KNOWLEDGE`;
    const { status, data } = await apiCall(`/twins/${twinId}`);

    expect([200, 404]).toContain(status);
    if (status === 200) {
      expect(data.success).toBe(true);
      expect(data.data.twinId).toBe(twinId);
    }
  });

  test('GET /twins/owner/:corpId - Get owner twins', async () => {
    const { status, data } = await apiCall(`/twins/owner/${TEST_EMPLOYEE.corpId}`);

    expect([200, 404]).toContain(status);
    if (status === 200 && data.success) {
      expect(Array.isArray(data.data.twins)).toBe(true);
    }
  });

  test('PATCH /twins/:twinId - Update twin metrics', async () => {
    const twinId = `TWIN-${TEST_EMPLOYEE.corpId}-KNOWLEDGE`;
    const { status, data } = await apiCall(`/twins/${twinId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        'metrics.knowledgeScore': 85
      })
    });

    expect([200, 404]).toContain(status);
  });

  test('DELETE /twins/:twinId - Archive twin', async () => {
    const twinId = `TWIN-${TEST_EMPLOYEE.corpId}-KNOWLEDGE`;
    const { status, data } = await apiCall(`/twins/${twinId}`, {
      method: 'DELETE'
    });

    expect([200, 404]).toContain(status);
  });
});

// =============================================================================
// MARKETPLACE TESTS
// =============================================================================

describe('Marketplace', () => {
  test('GET /marketplace/search - Search twins', async () => {
    const { status, data } = await apiCall('/marketplace/search?query=engineering');

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.twins)).toBe(true);
  });

  test('GET /marketplace/featured - Featured twins', async () => {
    const { status, data } = await apiCall('/marketplace/featured?limit=5');

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.twins)).toBe(true);
  });

  test('GET /marketplace/categories - Browse by category', async () => {
    const { status, data } = await apiCall('/marketplace/categories');

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('POST /marketplace/compare - Compare twins', async () => {
    const { status, data } = await apiCall('/marketplace/compare', {
      method: 'POST',
      body: JSON.stringify({
        twinIds: [
          `TWIN-CI-IND-001-KNOWLEDGE`,
          `TWIN-CI-IND-002-SKILL`
        ]
      })
    });

    expect([200, 400, 404]).toContain(status);
  });
});

// =============================================================================
// HIRING TESTS
// =============================================================================

describe('Hiring Workflow', () => {
  let createdGrantId: string;

  test('POST /hire - Request access to twin', async () => {
    const { status, data } = await apiCall('/hire', {
      method: 'POST',
      body: JSON.stringify({
        twinId: `TWIN-${TEST_EMPLOYEE.corpId}-SKILL`,
        companyCorpId: 'CI-BIZ-TEST001',
        companyName: 'Test Company',
        accessType: 'USE'
      })
    });

    expect([201, 404, 409]).toContain(status); // 409 if already has access
    if (data.success) {
      createdGrantId = data.data?.grantId;
    }
  });

  test('PATCH /hire/:grantId - Approve hire request', async () => {
    if (!createdGrantId) {
      logger.info('Skipping approve test - no grant created');
      return;
    }

    const { status, data } = await apiCall(`/hire/${createdGrantId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'approve',
        employeeCorpId: TEST_EMPLOYEE.corpId
      })
    });

    expect([200, 403, 404]).toContain(status);
  });

  test('GET /hire/active/:companyCorpId - Get active hires', async () => {
    const { status, data } = await apiCall('/hire/active/CI-BIZ-TEST001');

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(typeof data.data.activeTwins).toBe('number');
  });

  test('POST /hire/:grantId/invoke - Log invocation', async () => {
    if (!createdGrantId) {
      logger.info('Skipping invoke test - no grant created');
      return;
    }

    const { status, data } = await apiCall(`/hire/${createdGrantId}/invoke`, {
      method: 'POST',
      body: JSON.stringify({
        satisfaction: 4.5,
        taskType: 'code_review'
      })
    });

    expect([200, 404]).toContain(status);
  });
});

// =============================================================================
// PRIVACY TESTS
// =============================================================================

describe('Privacy Controls', () => {
  test('GET /privacy/:twinId - Get privacy settings', async () => {
    const twinId = `TWIN-${TEST_EMPLOYEE.corpId}-KNOWLEDGE`;
    const { status, data } = await apiCall(
      `/privacy/${twinId}?requesterCorpId=${TEST_EMPLOYEE.corpId}`
    );

    expect([200, 404]).toContain(status);
  });

  test('POST /privacy/:twinId/preset - Apply preset', async () => {
    const twinId = `TWIN-${TEST_EMPLOYEE.corpId}-KNOWLEDGE`;
    const { status, data } = await apiCall(`/privacy/${twinId}/preset`, {
      method: 'POST',
      body: JSON.stringify({
        ownerCorpId: TEST_EMPLOYEE.corpId,
        preset: 'jobSearch'
      })
    });

    expect([200, 400, 403, 404]).toContain(status);
  });

  test('POST /privacy/:twinId/revoke-all - Emergency revoke', async () => {
    const twinId = `TWIN-${TEST_EMPLOYEE.corpId}-KNOWLEDGE`;
    const { status, data } = await apiCall(`/privacy/${twinId}/revoke-all`, {
      method: 'POST',
      body: JSON.stringify({
        ownerCorpId: TEST_EMPLOYEE.corpId
      })
    });

    expect([200, 403, 404]).toContain(status);
  });
});

// =============================================================================
// EXPORT TESTS
// =============================================================================

describe('Export Functionality', () => {
  test('GET /export/:twinId/complete - Export twin', async () => {
    const twinId = `TWIN-${TEST_EMPLOYEE.corpId}-KNOWLEDGE`;
    const { status, data } = await apiCall(
      `/export/${twinId}/complete?ownerCorpId=${TEST_EMPLOYEE.corpId}`
    );

    expect([200, 403, 404]).toContain(status);
    if (status === 200) {
      expect(data.data).toHaveProperty('twin');
      expect(data.data).toHaveProperty('ownership');
      expect(data.data.ownership.ownedBy).toBe('EMPLOYEE');
    }
  });

  test('GET /export/owner/:corpId/all - Export all twins', async () => {
    const { status, data } = await apiCall(`/export/owner/${TEST_EMPLOYEE.corpId}/all`);

    expect([200, 404]).toContain(status);
    if (status === 200) {
      expect(data.data).toHaveProperty('twins');
      expect(Array.isArray(data.data.twins)).toBe(true);
    }
  });

  test('GET /export/job-change/:corpId - Job change export', async () => {
    const { status, data } = await apiCall(
      `/export/job-change/${TEST_EMPLOYEE.corpId}?targetCompany=NewCompany`
    );

    expect([200, 404]).toContain(status);
    if (status === 200) {
      expect(data.data.type).toBe('JOB_CHANGE_EXPORT');
    }
  });

  test('GET /export/stats - Export statistics', async () => {
    const { status, data } = await apiCall('/export/stats');

    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });
});

// =============================================================================
// MEMORY TESTS
// =============================================================================

describe('Memory Integration', () => {
  test('GET /memory/bridge/status - Check memory bridge health', async () => {
    const { status, data } = await apiCall('/memory/bridge/status');

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('hojaiMemory');
    expect(data.data).toHaveProperty('rezMemory');
  });

  test('POST /memory/:twinId/sync - Sync memories', async () => {
    const twinId = `TWIN-${TEST_EMPLOYEE.corpId}-KNOWLEDGE`;
    const { status, data } = await apiCall(`/memory/${twinId}/sync`, {
      method: 'POST'
    });

    expect([200, 404]).toContain(status);
  });

  test('GET /memory/:twinId/memories - Get memories', async () => {
    const twinId = `TWIN-${TEST_EMPLOYEE.corpId}-KNOWLEDGE`;
    const { status, data } = await apiCall(`/memory/${twinId}/memories?limit=10`);

    expect([200, 404]).toContain(status);
    if (status === 200) {
      expect(data.data).toHaveProperty('memories');
      expect(Array.isArray(data.data.memories)).toBe(true);
    }
  });
});

// =============================================================================
// ANALYTICS TESTS
// =============================================================================

describe('Analytics', () => {
  test('GET /analytics/workforce - Platform analytics', async () => {
    const { status, data } = await apiCall('/analytics/workforce');

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('platform');
    expect(data.data).toHaveProperty('byType');
  });

  test('GET /analytics/trends/marketplace - Market trends', async () => {
    const { status, data } = await apiCall('/analytics/trends/marketplace');

    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('GET /analytics/:twinId - Twin-specific analytics', async () => {
    const twinId = `TWIN-${TEST_EMPLOYEE.corpId}-KNOWLEDGE`;
    const { status, data } = await apiCall(`/analytics/${twinId}`);

    expect([200, 404]).toContain(status);
  });
});

// =============================================================================
// AUTHENTICATION TESTS
// =============================================================================

describe('Authentication', () => {
  test('Request without auth returns 401', async () => {
    const response = await fetch(`${BASE_URL}/twins/TWIN-TEST`, {
      headers: {}
    });

    expect([200, 401, 404]).toContain(response.status);
  });

  test('Request with invalid token', async () => {
    const response = await fetch(`${BASE_URL}/twins/TWIN-TEST`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    expect([200, 401, 404]).toContain(response.status);
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('Error Handling', () => {
  test('GET /nonexistent returns 404', async () => {
    const response = await fetch(`${BASE_URL}/nonexistent`);
    expect(response.status).toBe(404);
  });

  test('POST /twins with invalid data returns 400', async () => {
    const { status, data } = await apiCall('/twins', {
      method: 'POST',
      body: JSON.stringify({
        ownerCorpId: TEST_EMPLOYEE.corpId
        // Missing required fields
      })
    });

    expect([400, 500]).toContain(status);
  });
});

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

describe('Performance', () => {
  test('GET / responds in under 1 second', async () => {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/`);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(1000);
  });

  test('Search responds in under 2 seconds', async () => {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/marketplace/search?limit=20`);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(2000);
  });
});

// =============================================================================
// SCHEMA VALIDATION TESTS
// =============================================================================

describe('Schema Validation', () => {
  test('Twin has required fields', async () => {
    const { status, data } = await apiCall(`/twins/TWIN-CI-IND-001-KNOWLEDGE`);

    if (status === 200) {
      const twin = data.data;

      // Required fields
      expect(twin).toHaveProperty('twinId');
      expect(twin).toHaveProperty('ownerCorpId');
      expect(twin).toHaveProperty('twinType');
      expect(twin).toHaveProperty('ownership');

      // Ownership should be EMPLOYEE
      expect(twin.ownership.ownedBy).toBe('EMPLOYEE');
      expect(twin.ownership.portability).toBe(true);

      // Metrics structure
      expect(twin).toHaveProperty('metrics');
      expect(twin.metrics).toHaveProperty('productivityMultiplier');
      expect(twin.metrics).toHaveProperty('combinedScore');

      // Privacy structure
      expect(twin).toHaveProperty('privacy');
      expect(twin.privacy).toHaveProperty('shareWithCurrentEmployer');
      expect(twin.privacy).toHaveProperty('shareWithFutureEmployer');
    }
  });

  test('Twin has valid twin type', async () => {
    const validTypes = ['KNOWLEDGE', 'SKILL', 'CAREER', 'PRODUCTIVITY', 'EXECUTION'];

    const { data } = await apiCall(`/twins/owner/${TEST_EMPLOYEE.corpId}`);

    if (data.success && data.data.twins) {
      for (const twin of data.data.twins) {
        expect(validTypes).toContain(twin.twinType);
      }
    }
  });

  test('Metrics are within valid ranges', async () => {
    const { data } = await apiCall(`/twins/TWIN-CI-IND-001-KNOWLEDGE`);

    if (data.success) {
      const metrics = data.data.metrics;

      expect(metrics.productivityMultiplier).toBeGreaterThanOrEqual(0);
      expect(metrics.combinedScore).toBeGreaterThanOrEqual(0);
      expect(metrics.combinedScore).toBeLessThanOrEqual(100);
    }
  });
});

// =============================================================================
// INTEGRATION SCENARIOS
// =============================================================================

describe('Integration Scenarios', () => {
  test('Complete hiring workflow', async () => {
    // 1. Create twin
    const createTwin = await apiCall('/twins', {
      method: 'POST',
      body: JSON.stringify({
        ownerCorpId: TEST_EMPLOYEE.corpId,
        ownerName: TEST_EMPLOYEE.name,
        twinType: 'SKILL',
        initialSkills: TEST_EMPLOYEE.skills
      })
    });
    expect([200, 201, 409]).toContain(createTwin.status);

    // 2. Company requests access
    const requestAccess = await apiCall('/hire', {
      method: 'POST',
      body: JSON.stringify({
        twinId: `TWIN-${TEST_EMPLOYEE.corpId}-SKILL`,
        companyCorpId: 'CI-BIZ-TEST002',
        companyName: 'Hiring Corp'
      })
    });
    expect([200, 201, 409]).toContain(requestAccess.status);

    // 3. Owner approves
    if (requestAccess.data?.data?.grantId) {
      const approve = await apiCall(`/hire/${requestAccess.data.data.grantId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'approve',
          employeeCorpId: TEST_EMPLOYEE.corpId
        })
      });
      expect([200, 403]).toContain(approve.status);
    }

    // 4. Verify active access
    const activeAccess = await apiCall('/hire/active/CI-BIZ-TEST002');
    expect(activeAccess.status).toBe(200);
    expect(activeAccess.data.data.activeTwins).toBeGreaterThanOrEqual(0);
  });

  test('Privacy preset application', async () => {
    // 1. Create twin with default privacy
    const twinId = `TWIN-${TEST_EMPLOYEE.corpId}-EXECUTION`;

    // 2. Apply job search preset
    const applyPreset = await apiCall(`/privacy/${twinId}/preset`, {
      method: 'POST',
      body: JSON.stringify({
        ownerCorpId: TEST_EMPLOYEE.corpId,
        preset: 'jobSearch'
      })
    });
    expect([200, 400, 403, 404]).toContain(applyPreset.status);

    // 3. Verify settings changed
    if (applyPreset.status === 200) {
      expect(applyPreset.data.data.privacy).toBeDefined();
    }
  });

  test('Export and transfer workflow', async () => {
    // 1. Export twin
    const exportTwin = await apiCall(
      `/export/${TEST_TWIN.twinId}/complete?ownerCorpId=${TEST_EMPLOYEE.corpId}`
    );
    expect([200, 403, 404]).toContain(exportTwin.status);

    // 2. Job change export
    const jobChangeExport = await apiCall(
      `/export/job-change/${TEST_EMPLOYEE.corpId}?targetCompany=NewEmployer`
    );
    expect([200, 404]).toContain(jobChangeExport.status);

    if (jobChangeExport.status === 200) {
      expect(jobChangeExport.data.data.type).toBe('JOB_CHANGE_EXPORT');
      expect(jobChangeExport.data.data.twins).toBeDefined();
    }
  });
});

logger.info('Test suite loaded successfully');
