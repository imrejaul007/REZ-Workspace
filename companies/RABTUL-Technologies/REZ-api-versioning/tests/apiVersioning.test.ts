/**
 * API Versioning Middleware - Test Suite
 * Tests all functionality of the versioning system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express, { Express, Request, Response, NextFunction } from 'express';
import {
  createApiVersioningMiddleware,
  registerVersion,
  createVersionedRouter,
  getServices,
  resetRouteRegistry,
  resetDeprecationManager,
  requireVersion,
  getVersionCompatibility,
} from '../src/index.js';

describe('API Versioning Middleware', () => {
  let app: Express;
  let registry: ReturnType<typeof getServices>['registry'];
  let deprecationManager: ReturnType<typeof getServices>['deprecationManager'];

  beforeEach(() => {
    // Reset singletons for clean test state
    resetRouteRegistry();
    resetDeprecationManager();

    // Create fresh app
    app = express();
    app.use(express.json());

    // Register test versions
    registerVersion({
      version: 'v1.0.0',
      isActive: true,
      breakingChanges: [],
    });

    registerVersion({
      version: 'v2.0.0',
      isActive: true,
      breakingChanges: [
        {
          type: 'changed_response_schema',
          description: 'User object restructured',
          migrationGuide: 'Update client to handle new format',
        },
      ],
    });

    registerVersion({
      version: 'v3.0.0',
      isActive: true,
      deprecationDate: new Date('2025-01-01'),
      sunsetDate: new Date('2025-12-31'),
      breakingChanges: [],
    });

    const services = getServices();
    registry = services.registry;
    deprecationManager = services.deprecationManager;
  });

  afterEach(() => {
    resetRouteRegistry();
    resetDeprecationManager();
  });

  describe('Version Extraction', () => {
    it('should extract version from URL path', async () => {
      app.use(createApiVersioningMiddleware());

      app.get('/api/v1/test', (req, res) => {
        res.json({ version: req.apiVersion });
      });

      app.get('/api/v2/test', (req, res) => {
        res.json({ version: req.apiVersion });
      });

      const request = await makeRequest(app, 'GET', '/api/v1/test');
      expect(request.body.version).toBe('v1.0.0');

      const request2 = await makeRequest(app, 'GET', '/api/v2/test');
      expect(request2.body.version).toBe('v2.0.0');
    });

    it('should extract version from Accept header', async () => {
      app.use(createApiVersioningMiddleware());

      app.get('/test', (req, res) => {
        res.json({ version: req.apiVersion });
      });

      const request = await makeRequest(app, 'GET', '/test', {
        'Accept': 'application/vnd.rez.v1+json',
      });
      expect(request.body.version).toBe('v1.0.0');
    });

    it('should extract version from custom header', async () => {
      app.use(createApiVersioningMiddleware({ headerName: 'X-API-Version' }));

      app.get('/test', (req, res) => {
        res.json({ version: req.apiVersion });
      });

      const request = await makeRequest(app, 'GET', '/test', {
        'X-API-Version': 'v2.0.0',
      });
      expect(request.body.version).toBe('v2.0.0');
    });

    it('should use default version when no version specified', async () => {
      app.use(createApiVersioningMiddleware({ defaultVersion: 'v1.0.0' }));

      app.get('/test', (req, res) => {
        res.json({ version: req.apiVersion });
      });

      const request = await makeRequest(app, 'GET', '/test');
      expect(request.body.version).toBe('v1.0.0');
    });

    it('should prioritize URL version over header version', async () => {
      app.use(createApiVersioningMiddleware());

      app.get('/api/v2/test', (req, res) => {
        res.json({ version: req.apiVersion });
      });

      const request = await makeRequest(app, 'GET', '/api/v2/test', {
        'Accept': 'application/vnd.rez.v1+json',
      });
      expect(request.body.version).toBe('v2.0.0');
    });
  });

  describe('Version Validation', () => {
    it('should return 404 for unsupported version', async () => {
      app.use(createApiVersioningMiddleware({ validateVersions: true }));

      const request = await makeRequest(app, 'GET', '/api/v9.9.9/test');
      expect(request.status).toBe(404);
      expect(request.body.error).toBe('VERSION_NOT_FOUND');
    });

    it('should allow custom onVersionNotFound handler', async () => {
      app.use(createApiVersioningMiddleware({
        validateVersions: true,
        onVersionNotFound: (req, res, version) => {
          res.status(400).json({ custom: true, version });
        },
      }));

      const request = await makeRequest(app, 'GET', '/api/v9.9.9/test');
      expect(request.status).toBe(400);
      expect(request.body.custom).toBe(true);
      expect(request.body.version).toBe('v9.9.9');
    });
  });

  describe('Deprecation Handling', () => {
    it('should add deprecation headers for deprecated versions', async () => {
      app.use(createApiVersioningMiddleware({ includeDeprecationHeaders: true }));

      app.get('/api/v3/test', (req, res) => {
        res.json({ version: req.apiVersion });
      });

      const request = await makeRequest(app, 'GET', '/api/v3/test');
      expect(request.headers['deprecation']).toBeDefined();
      expect(request.headers['sunset']).toBeDefined();
      expect(request.headers['x-api-version']).toBe('v3.0.0');
    });

    it('should return 410 for sunset versions', async () => {
      // Force sunset by updating the version config
      registry.updateVersion('v3.0.0', {
        sunsetDate: new Date('2020-01-01'), // Past date
      });
      deprecationManager.registerFromConfig(registry.getVersionConfig('v3.0.0')!);

      app.use(createApiVersioningMiddleware({ includeDeprecationHeaders: true }));

      app.get('/api/v3/test', (req, res) => {
        res.json({ version: req.apiVersion });
      });

      const request = await makeRequest(app, 'GET', '/api/v3/test');
      expect(request.status).toBe(410);
      expect(request.body.error).toBe('VERSION_DEPRECATED');
    });

    it('should set isDeprecated flag on request', async () => {
      app.use(createApiVersioningMiddleware({ includeDeprecationHeaders: true }));

      app.get('/api/v3/test', (req, res) => {
        res.json({
          version: req.apiVersion,
          isDeprecated: req.isDeprecated,
        });
      });

      const request = await makeRequest(app, 'GET', '/api/v3/test');
      expect(request.body.isDeprecated).toBe(true);
    });
  });

  describe('Versioned Routers', () => {
    it('should create and register routes for specific version', async () => {
      const v1 = createVersionedRouter('v1.0.0');
      const v2 = createVersionedRouter('v2.0.0');

      v1.get('/users', (req, res) => {
        res.json({ format: 'v1', data: [] });
      });

      v2.get('/users', (req, res) => {
        res.json({ format: 'v2', data: [], meta: {} });
      });

      app.use('/api/v1', v1);
      app.use('/api/v2', v2);

      const v1Request = await makeRequest(app, 'GET', '/api/v1/users');
      expect(v1Request.body.format).toBe('v1');

      const v2Request = await makeRequest(app, 'GET', '/api/v2/users');
      expect(v2Request.body.format).toBe('v2');
    });

    it('should support all HTTP methods', async () => {
      const v1 = createVersionedRouter('v1.0.0');

      v1.get('/resource', (req, res) => res.json({ method: 'GET' }));
      v1.post('/resource', (req, res) => res.status(201).json({ method: 'POST' }));
      v1.put('/resource', (req, res) => res.json({ method: 'PUT' }));
      v1.patch('/resource', (req, res) => res.json({ method: 'PATCH' }));
      v1.delete('/resource', (req, res) => res.status(204).send());
      v1.options('/resource', (req, res) => res.json({ method: 'OPTIONS' }));

      app.use('/api/v1', v1);

      expect((await makeRequest(app, 'GET', '/api/v1/resource')).body.method).toBe('GET');
      expect((await makeRequest(app, 'POST', '/api/v1/resource')).body.method).toBe('POST');
      expect((await makeRequest(app, 'PUT', '/api/v1/resource')).body.method).toBe('PUT');
      expect((await makeRequest(app, 'PATCH', '/api/v1/resource')).body.method).toBe('PATCH');
      expect((await makeRequest(app, 'DELETE', '/api/v1/resource')).status).toBe(204);
      expect((await makeRequest(app, 'OPTIONS', '/api/v1/resource')).body.method).toBe('OPTIONS');
    });
  });

  describe('requireVersion middleware', () => {
    it('should allow access for sufficient version', async () => {
      app.use(createApiVersioningMiddleware());
      app.get('/test', requireVersion('v1.0.0'), (req, res) => {
        res.json({ ok: true });
      });

      const request = await makeRequest(app, 'GET', '/api/v1/test');
      expect(request.status).toBe(200);
      expect(request.body.ok).toBe(true);
    });

    it('should reject access for insufficient version', async () => {
      app.use(createApiVersioningMiddleware());
      app.get('/test', requireVersion('v2.0.0'), (req, res) => {
        res.json({ ok: true });
      });

      const request = await makeRequest(app, 'GET', '/api/v1/test');
      expect(request.status).toBe(426);
      expect(request.body.error).toBe('VERSION_UPGRADE_REQUIRED');
      expect(request.body.minimumVersion).toBe('v2.0.0');
    });
  });

  describe('Breaking Change Detection', () => {
    it('should detect breaking changes for a version', () => {
      const breakingChanges = registry.getBreakingChanges('v2.0.0');
      expect(breakingChanges.length).toBe(1);
      expect(breakingChanges[0]?.type).toBe('changed_response_schema');
    });

    it('should provide version compatibility info', () => {
      const compatibility = getVersionCompatibility('v1.0.0', 'v2.0.0');
      expect(compatibility.isCompatible).toBe(false);
      expect(compatibility.breakingChanges.length).toBe(1);
      expect(compatibility.requiresMigration).toBe(true);
      expect(compatibility.migrationSteps.length).toBe(1);
    });

    it('should call onBreakingChange callback', async () => {
      let callbackCalled = false;
      let changes: unknown[] = [];

      app.use(createApiVersioningMiddleware({
        onBreakingChange: (req, res, breakingChanges) => {
          callbackCalled = true;
          changes = breakingChanges;
        },
      }));

      app.get('/api/v2/test', (req, res) => {
        res.json({ ok: true });
      });

      const request = await makeRequest(app, 'GET', '/api/v2/test');
      expect(request.status).toBe(200);
      expect(callbackCalled).toBe(true);
      expect(changes.length).toBe(1);
    });
  });

  describe('Route Registry', () => {
    it('should track registered versions', () => {
      const versions = registry.getVersions();
      expect(versions).toContain('v1.0.0');
      expect(versions).toContain('v2.0.0');
      expect(versions).toContain('v3.0.0');
    });

    it('should identify latest version', () => {
      expect(registry.getLatestVersion()).toBe('v3.0.0');
    });

    it('should identify default version', () => {
      expect(registry.getDefaultVersion()).toBe('v1.0.0');
    });

    it('should update default version', () => {
      registry.setDefaultVersion('v2.0.0');
      expect(registry.getDefaultVersion()).toBe('v2.0.0');
    });

    it('should check version existence', () => {
      expect(registry.hasVersion('v1.0.0')).toBe(true);
      expect(registry.hasVersion('v9.9.9')).toBe(false);
    });

    it('should check version active status', () => {
      expect(registry.isVersionActive('v1.0.0')).toBe(true);
      expect(registry.isVersionActive('v2.0.0')).toBe(true);
    });
  });

  describe('Deprecation Manager', () => {
    it('should identify deprecated versions', () => {
      expect(deprecationManager.isDeprecated('v1.0.0')).toBe(false);
      expect(deprecationManager.isDeprecated('v3.0.0')).toBe(true);
    });

    it('should identify sunset versions', () => {
      // v3.0.0 has sunset date in 2025, which is in the past from test perspective
      expect(deprecationManager.isSunset('v3.0.0')).toBe(true);
      expect(deprecationManager.isSunset('v1.0.0')).toBe(false);
    });

    it('should generate deprecation headers', () => {
      const headers = deprecationManager.generateHeaders('v3.0.0');
      expect(headers['Deprecation']).toBeDefined();
      expect(headers['Sunset']).toBeDefined();
      expect(headers['X-API-Version']).toBe('v3.0.0');
    });

    it('should list active deprecations', () => {
      const deprecations = deprecationManager.getActiveDeprecations();
      expect(deprecations.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// Test Utilities
// ============================================

async function makeRequest(
  app: Express,
  method: string,
  path: string,
  headers: Record<string, string> = {}
): Promise<{
  status: number;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}> {
  return new Promise((resolve) => {
    const http = require('http');
    const server = app.listen(0, () => {
      const port = (server.address() as { port: number }).port;
      const options = {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      const req = http.request(options, (res: import('http').IncomingMessage) => {
        let data = '';
        res.on('data', (chunk: Buffer) => data += chunk);
        res.on('end', () => {
          server.close();
          resolve({
            status: res.statusCode ?? 0,
            body: data ? JSON.parse(data) : {},
            headers: res.headers as Record<string, string>,
          });
        });
      });

      req.end();
    });
  });
}
