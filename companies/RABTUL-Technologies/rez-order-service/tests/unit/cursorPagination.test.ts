// Test cursor pagination utilities
describe('Cursor Pagination', () => {
  interface CursorOptions {
    filter: Record<string, unknown>;
    sortField: string;
    sortDirection: number;
    limit: number;
    cursor: string | null;
  }

  function parseCursor(options: {
    query: Record<string, string | undefined>;
    sortField: string;
    sortDirection: number;
    limit: number;
    maxLimit: number;
  }): CursorOptions {
    const { query, sortField, sortDirection, limit, maxLimit } = options;

    const parsedLimit = Math.min(
      parseInt(query.limit as string) || limit,
      maxLimit
    );

    const filter: Record<string, unknown> = {};

    // Handle cursor-based pagination
    if (query.cursor) {
      try {
        const decoded = Buffer.from(query.cursor, 'base64').toString('utf-8');
        const cursorData = JSON.parse(decoded);
        filter[sortField] = { $lt: cursorData[sortField] };
      } catch {
        // Invalid cursor, ignore
      }
    }

    return {
      filter,
      sortField,
      sortDirection,
      limit: parsedLimit,
      cursor: query.cursor || null,
    };
  }

  function buildPaginatedResponse<T extends Record<string, unknown>>(
    data: T[],
    limit: number,
    sortField: string
  ): { data: T[]; hasMore: boolean; nextCursor: string | null } {
    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore && items.length > 0
      ? Buffer.from(JSON.stringify({ [sortField]: items[items.length - 1][sortField] })).toString('base64')
      : null;

    return { data: items, hasMore, nextCursor };
  }

  describe('parseCursor', () => {
    it('should return default values for empty query', () => {
      const result = parseCursor({
        query: {},
        sortField: 'createdAt',
        sortDirection: -1,
        limit: 20,
        maxLimit: 100,
      });

      expect(result.limit).toBe(20);
      expect(result.cursor).toBeNull();
      expect(result.filter).toEqual({});
    });

    it('should parse limit from query', () => {
      const result = parseCursor({
        query: { limit: '50' },
        sortField: 'createdAt',
        sortDirection: -1,
        limit: 20,
        maxLimit: 100,
      });

      expect(result.limit).toBe(50);
    });

    it('should cap limit at maxLimit', () => {
      const result = parseCursor({
        query: { limit: '200' },
        sortField: 'createdAt',
        sortDirection: -1,
        limit: 20,
        maxLimit: 100,
      });

      expect(result.limit).toBe(100);
    });

    it('should parse valid cursor', () => {
      const cursorData = { createdAt: '2024-01-01T00:00:00.000Z' };
      const cursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');

      const result = parseCursor({
        query: { cursor },
        sortField: 'createdAt',
        sortDirection: -1,
        limit: 20,
        maxLimit: 100,
      });

      expect(result.cursor).toBe(cursor);
      expect(result.filter).toHaveProperty('createdAt');
    });

    it('should handle invalid cursor gracefully', () => {
      const result = parseCursor({
        query: { cursor: 'invalid-base64!' },
        sortField: 'createdAt',
        sortDirection: -1,
        limit: 20,
        maxLimit: 100,
      });

      expect(result.filter).toEqual({});
    });
  });

  describe('buildPaginatedResponse', () => {
    it('should return data with no next cursor when less than limit', () => {
      const data = [
        { id: '1', createdAt: '2024-01-01' },
        { id: '2', createdAt: '2024-01-02' },
      ];

      const result = buildPaginatedResponse(data, 20, 'createdAt');

      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('should return hasMore and nextCursor when data exceeds limit', () => {
      const data = [
        { id: '1', createdAt: '2024-01-01' },
        { id: '2', createdAt: '2024-01-02' },
        { id: '3', createdAt: '2024-01-03' },
      ];

      const result = buildPaginatedResponse(data, 2, 'createdAt');

      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).not.toBeNull();
    });

    it('should decode next cursor correctly', () => {
      const data = [
        { id: '1', createdAt: '2024-01-01' },
        { id: '2', createdAt: '2024-01-02' },
        { id: '3', createdAt: '2024-01-03' },
      ];

      const result = buildPaginatedResponse(data, 2, 'createdAt');

      if (result.nextCursor) {
        const decoded = JSON.parse(Buffer.from(result.nextCursor, 'base64').toString('utf-8'));
        expect(decoded).toHaveProperty('createdAt');
        expect(decoded.createdAt).toBe('2024-01-02');
      }
    });
  });
});
