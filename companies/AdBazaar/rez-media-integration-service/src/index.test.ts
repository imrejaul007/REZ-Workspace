import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from './index';
import http from 'http';

describe('REZ Media Integration Service', () => {
  let server: http.Server;

  beforeAll(() => {
    server = app.listen(0);
  });

  afterAll(() => {
    server.close();
  });

  describe('Health Endpoint', () => {
    it('should return healthy status', async () => {
      const res = await fetch(`http://localhost:${(server.address() as any).port}/health`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('rez-media-integration-service');
      expect(data.version).toBe('1.0.0');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Media Endpoints', () => {
    it('should list media with pagination', async () => {
      const res = await fetch(`http://localhost:${(server.address() as any).port}/api/media?page=1&limit=2`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.items).toBeDefined();
      expect(Array.isArray(data.data.items)).toBe(true);
      expect(data.data.pagination).toBeDefined();
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(2);
    });

    it('should filter media by tag', async () => {
      const res = await fetch(`http://localhost:${(server.address() as any).port}/api/media?tag=banner`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.items.length).toBeGreaterThan(0);
      data.data.items.forEach((item: any) => {
        expect(item.tags.some((tag: string) => tag.includes('banner'))).toBe(true);
      });
    });

    it('should get single media by id', async () => {
      // First get the list to find an id
      const listRes = await fetch(`http://localhost:${(server.address() as any).port}/api/media?limit=1`);
      const listData = await listRes.json();
      const mediaId = listData.data.items[0].id;

      const res = await fetch(`http://localhost:${(server.address() as any).port}/api/media/${mediaId}`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(mediaId);
    });

    it('should return 404 for non-existent media', async () => {
      const res = await fetch(`http://localhost:${(server.address() as any).port}/api/media/non-existent-id`);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should upload new media', async () => {
      const res = await fetch(`http://localhost:${(server.address() as any).port}/api/media/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: 'test-image.jpg',
          mimeType: 'image/jpeg',
          size: 12345,
          width: 800,
          height: 600,
          tags: ['test'],
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
      expect(data.data.originalFilename).toBe('test-image.jpg');
      expect(data.data.filename).toContain('test-image.jpg');
    });

    it('should reject upload without required fields', async () => {
      const res = await fetch(`http://localhost:${(server.address() as any).port}/api/media/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_FIELDS');
    });
  });

  describe('Transformation Endpoints', () => {
    it('should transform media', async () => {
      // Get a media id first
      const listRes = await fetch(`http://localhost:${(server.address() as any).port}/api/media?limit=1`);
      const listData = await listRes.json();
      const mediaId = listData.data.items[0].id;

      const res = await fetch(`http://localhost:${(server.address() as any).port}/api/media/${mediaId}/transform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'resize',
          params: { width: 400, height: 300 },
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.original).toBeDefined();
      expect(data.data.transformed).toBeDefined();
      expect(data.data.transformed.transformations.length).toBeGreaterThan(0);
    });

    it('should reject invalid transformation type', async () => {
      const listRes = await fetch(`http://localhost:${(server.address() as any).port}/api/media?limit=1`);
      const listData = await listRes.json();
      const mediaId = listData.data.items[0].id;

      const res = await fetch(`http://localhost:${(server.address() as any).port}/api/media/${mediaId}/transform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invalid_transform',
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_TRANSFORMATION_TYPE');
    });
  });

  describe('Integration Status', () => {
    it('should return integration status', async () => {
      const res = await fetch(`http://localhost:${(server.address() as any).port}/api/integration/status`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.service).toBe('rez-media-integration-service');
      expect(data.data.status).toBe('connected');
      expect(data.data.capabilities).toBeDefined();
      expect(Array.isArray(data.data.capabilities)).toBe(true);
      expect(data.data.stats).toBeDefined();
      expect(data.data.stats.totalMediaItems).toBeGreaterThan(0);
    });
  });
});
