/**
 * Cursor-based pagination utility for rez-order-service.
 *
 * M2 FIX: Provides efficient cursor-based pagination for large datasets.
 *
 * Usage:
 * ```
 * const { filter, hasMore, nextCursor } = parseCursor({
 *   query: req.query,
 *   sortField: 'createdAt',
 *   sortDirection: -1,
 *   limit: 20,
 * });
 * const data = await collection.find(filter).sort({ createdAt: -1 }).limit(limit + 1).toArray();
 * const result = buildPaginatedResponse(data, limit, sortField);
 * ```
 */

import mongoose from 'mongoose';

export interface CursorPaginationOptions {
  /** The raw query string parameters from the request */
  query: Record<string, unknown>;
  /** Field to use for cursor (must be indexed, typically createdAt or _id) */
  sortField: string;
  /** Sort direction: 1 for ascending, -1 for descending */
  sortDirection: -1 | 1;
  /** Default page size */
  limit?: number;
  /** Max allowed page size */
  maxLimit?: number;
}

export interface CursorFilter {
  filter: Record<string, unknown>;
  hasMore: boolean;
  nextCursor?: string;
  limit: number;
}

/**
 * Parse cursor from query parameters.
 * Supports both cursor-based (?cursor=xxx) and page-based (?page=1) for backward compat.
 */
export function parseCursor(options: CursorPaginationOptions): CursorFilter {
  const {
    query,
    sortField,
    sortDirection = -1,
    limit = 20,
    maxLimit = 100,
  } = options;

  const cursor = query.cursor as string | undefined;
  const pageLimit = Math.min(maxLimit, Math.max(1, parseInt((query.limit as string) || String(limit), 10)));

  if (!cursor) {
    return {
      filter: {},
      hasMore: false,
      limit: pageLimit,
    };
  }

  // Decode cursor: base64(createdAt,_id)
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    const parts = decoded.split(',');
    if (parts.length !== 2) {
      return { filter: {}, hasMore: false, limit: pageLimit };
    }

    const [cursorDate, cursorId] = parts;
    const cursorTime = new Date(cursorDate);

    if (isNaN(cursorTime.getTime()) || !mongoose.Types.ObjectId.isValid(cursorId)) {
      return { filter: {}, hasMore: false, limit: pageLimit };
    }

    // Build filter for cursor: items after the cursor
    // For descending sort: createdAt < cursorTime OR (createdAt == cursorTime AND _id < cursorId)
    // For ascending sort: createdAt > cursorTime OR (createdAt == cursorTime AND _id > cursorId)
    const filter: Record<string, unknown> = sortDirection === -1
      ? {
          $or: [
            { [sortField]: { $lt: cursorTime } },
            { [sortField]: cursorTime, _id: { $lt: new mongoose.Types.ObjectId(cursorId) } },
          ],
        }
      : {
          $or: [
            { [sortField]: { $gt: cursorTime } },
            { [sortField]: cursorTime, _id: { $gt: new mongoose.Types.ObjectId(cursorId) } },
          ],
        };

    return { filter, hasMore: false, limit: pageLimit };
  } catch {
    return { filter: {}, hasMore: false, limit: pageLimit };
  }
}

/**
 * Build paginated response from data array.
 * Call with (data, limit, sortField) to get hasMore and nextCursor.
 */
export function buildPaginatedResponse<T extends Record<string, unknown>>(
  data: T[],
  limit: number,
  sortField: string,
  sortDirection: -1 | 1 = -1
): { data: T[]; hasMore: boolean; nextCursor?: string } {
  if (data.length <= limit) {
    return { data, hasMore: false };
  }

  const result = data.slice(0, limit);
  const last = data[limit - 1];

  if (!last) {
    return { data: result, hasMore: false };
  }

  const cursorValue = sortField === '_id'
    ? String((last as unknown)._id)
    : `${last[sortField] instanceof Date ? (last[sortField] as Date).toISOString() : last[sortField]},${String((last as unknown)._id)}`;

  return {
    data: result,
    hasMore: true,
    nextCursor: Buffer.from(cursorValue).toString('base64'),
  };
}
