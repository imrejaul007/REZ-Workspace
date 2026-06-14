/**
 * Data Aggregator Tests
 * Tests for data aggregation, caching, and reporting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface DataSource {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
}

interface CacheEntry {
  data: unknown;
  timestamp: Date;
  ttl: number;
}

// Aggregation logic
function aggregateData(data: unknown[], operations: string[]): Record<string, number> {
  const result: Record<string, number> = {};

  for (const op of operations) {
    switch (op) {
      case 'count':
        result.count = data.length;
        break;
      case 'sum':
        result.sum = data.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
        break;
      case 'avg':
        result.avg = data.length > 0
          ? data.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0) / data.length
          : 0;
        break;
      case 'min':
        result.min = Math.min(...data.filter(d => typeof d === 'number') as number[]);
        break;
      case 'max':
        result.max = Math.max(...data.filter(d => typeof d === 'number') as number[]);
        break;
    }
  }

  return result;
}

// Merge multiple sources
function mergeResults(results: { source: string; data: unknown }[]): unknown[] {
  return results.flatMap(r => Array.isArray(r.data) ? r.data : [r.data]);
}

// Group data
function groupData<T extends Record<string, unknown>>(
  data: T[],
  groupBy: keyof T
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  for (const item of data) {
    const key = String(item[groupBy]);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  }

  return grouped;
}

// Cache TTL check
function isCacheValid(entry: CacheEntry): boolean {
  const age = Date.now() - entry.timestamp.getTime();
  return age < entry.ttl;
}

// Filter data
function filterData<T extends Record<string, unknown>>(
  data: T[],
  filters: Partial<T>
): T[] {
  return data.filter(item => {
    for (const [key, value] of Object.entries(filters)) {
      if (item[key] !== value) return false;
    }
    return true;
  });
}

describe('Data Aggregation', () => {
  describe('Basic Operations', () => {
    it('should count items', () => {
      const data = [1, 2, 3, 4, 5];
      const result = aggregateData(data, ['count']);
      expect(result.count).toBe(5);
    });

    it('should sum numbers', () => {
      const data = [10, 20, 30];
      const result = aggregateData(data, ['sum']);
      expect(result.sum).toBe(60);
    });

    it('should calculate average', () => {
      const data = [10, 20, 30];
      const result = aggregateData(data, ['avg']);
      expect(result.avg).toBe(20);
    });

    it('should find minimum', () => {
      const data = [5, 2, 8, 1, 9];
      const result = aggregateData(data, ['min']);
      expect(result.min).toBe(1);
    });

    it('should find maximum', () => {
      const data = [5, 2, 8, 1, 9];
      const result = aggregateData(data, ['max']);
      expect(result.max).toBe(9);
    });

    it('should perform multiple operations', () => {
      const data = [10, 20, 30];
      const result = aggregateData(data, ['count', 'sum', 'avg']);
      expect(result.count).toBe(3);
      expect(result.sum).toBe(60);
      expect(result.avg).toBe(20);
    });
  });

  describe('Empty Data', () => {
    it('should handle empty array', () => {
      const data: number[] = [];
      const result = aggregateData(data, ['count', 'sum', 'avg']);
      expect(result.count).toBe(0);
      expect(result.sum).toBe(0);
    });
  });
});

describe('Result Merging', () => {
  it('should merge arrays from multiple sources', () => {
    const results = [
      { source: 'users', data: [{ id: 1 }, { id: 2 }] },
      { source: 'orders', data: [{ id: 'ord_1' }] },
    ];

    const merged = mergeResults(results);
    expect(merged).toHaveLength(3);
  });

  it('should handle non-array data', () => {
    const results = [
      { source: 'count', data: 42 },
      { source: 'total', data: [1, 2, 3] },
    ];

    const merged = mergeResults(results);
    expect(merged).toHaveLength(4);
  });

  it('should handle empty results', () => {
    const results: { source: string; data: unknown }[] = [];
    const merged = mergeResults(results);
    expect(merged).toHaveLength(0);
  });
});

describe('Data Grouping', () => {
  const data = [
    { category: 'electronics', name: 'Phone', price: 1000 },
    { category: 'electronics', name: 'Laptop', price: 2000 },
    { category: 'clothing', name: 'Shirt', price: 50 },
    { category: 'clothing', name: 'Pants', price: 80 },
  ];

  it('should group by category', () => {
    const grouped = groupData(data, 'category');

    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped['electronics']).toHaveLength(2);
    expect(grouped['clothing']).toHaveLength(2);
  });

  it('should maintain group order', () => {
    const grouped = groupData(data, 'category');

    expect(grouped['electronics'][0].name).toBe('Phone');
    expect(grouped['clothing'][0].name).toBe('Shirt');
  });

  it('should handle missing group key', () => {
    const dataWithMissing = [
      { category: 'a', name: '1' },
      { name: '2' }, // missing category
    ];

    const grouped = groupData(dataWithMissing as any, 'category');
    expect(grouped['undefined']).toHaveLength(1);
  });
});

describe('Cache Management', () => {
  beforeEach(() => {
    // Clear any mocks
  });

  it('should validate fresh cache', () => {
    const entry: CacheEntry = {
      data: { test: true },
      timestamp: new Date(),
      ttl: 60000,
    };

    expect(isCacheValid(entry)).toBe(true);
  });

  it('should invalidate expired cache', () => {
    const entry: CacheEntry = {
      data: { test: true },
      timestamp: new Date(Date.now() - 120000), // 2 minutes ago
      ttl: 60000, // 1 minute TTL
    };

    expect(isCacheValid(entry)).toBe(false);
  });

  it('should handle custom TTL', () => {
    const entry: CacheEntry = {
      data: { test: true },
      timestamp: new Date(Date.now() - 1000), // 1 second ago
      ttl: 5000, // 5 second TTL
    };

    expect(isCacheValid(entry)).toBe(true);
  });
});

describe('Data Filtering', () => {
  const data = [
    { id: 1, status: 'active', type: 'user' },
    { id: 2, status: 'inactive', type: 'user' },
    { id: 3, status: 'active', type: 'admin' },
    { id: 4, status: 'active', type: 'user' },
  ];

  it('should filter by single field', () => {
    const filtered = filterData(data, { status: 'active' });
    expect(filtered).toHaveLength(3);
    expect(filtered.every(d => d.status === 'active')).toBe(true);
  });

  it('should filter by multiple fields', () => {
    const filtered = filterData(data, { status: 'active', type: 'user' });
    expect(filtered).toHaveLength(2);
  });

  it('should return empty array when no matches', () => {
    const filtered = filterData(data, { status: 'nonexistent' });
    expect(filtered).toHaveLength(0);
  });

  it('should return all data when no filters', () => {
    const filtered = filterData(data, {});
    expect(filtered).toHaveLength(4);
  });
});

describe('Data Transformation', () => {
  it('should transform object to array', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const arr = Object.entries(obj).map(([k, v]) => ({ key: k, value: v }));
    expect(arr).toHaveLength(3);
    expect(arr[0]).toEqual({ key: 'a', value: 1 });
  });

  it('should flatten nested arrays', () => {
    const nested = [[1, 2], [3, 4], [5]];
    const flat = nested.flat();
    expect(flat).toEqual([1, 2, 3, 4, 5]);
  });

  it('should pick specific fields', () => {
    const data = [
      { id: 1, name: 'A', extra: 'x' },
      { id: 2, name: 'B', extra: 'y' },
    ];
    const picked = data.map(({ id, name }) => ({ id, name }));
    expect(picked).toEqual([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ]);
  });
});

describe('Data Validation', () => {
  it('should validate required fields', () => {
    const validateRequired = (obj: Record<string, unknown>, fields: string[]) => {
      return fields.filter(f => obj[f] === undefined);
    };

    const obj = { id: 1, name: 'Test' };
    const missing = validateRequired(obj, ['id', 'name', 'email']);
    expect(missing).toEqual(['email']);
  });

  it('should validate data types', () => {
    const validateType = (value: unknown, type: string) => {
      switch (type) {
        case 'string': return typeof value === 'string';
        case 'number': return typeof value === 'number';
        case 'boolean': return typeof value === 'boolean';
        case 'array': return Array.isArray(value);
        case 'object': return typeof value === 'object' && !Array.isArray(value);
        default: return false;
      }
    };

    expect(validateType('hello', 'string')).toBe(true);
    expect(validateType(42, 'number')).toBe(true);
    expect(validateType([1, 2], 'array')).toBe(true);
    expect(validateType({}, 'object')).toBe(true);
    expect(validateType('hello', 'number')).toBe(false);
  });
});
