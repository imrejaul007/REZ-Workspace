/**
 * Test Utilities for AdBazaar Services
 * Usage: import { describe, it, expect, mockLogger } from '../shared/test-utils';
 */

export { describe, it, expect } from '@jest/globals';

// Mock logger for tests
export function mockLogger() {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
}

// Test fixtures
export const fixtures = {
  validCampaign: {
    id: 'test-campaign-1',
    name: 'Test Campaign',
    budget: 10000,
    status: 'draft',
  },
  validScreen: {
    id: 'test-screen-1',
    type: 'billboard',
    location: { lat: 0, lng: 0 },
    price: 500,
  },
};

// Helper to create mock request
export function mockRequest(data: Record<string, unknown> = {}) {
  return {
    body: data,
    params: {},
    query: {},
    headers: {},
    ...data,
  };
}

// Helper to create mock response
export function mockResponse() {
  const res: Record<string, Function> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  return res;
}
