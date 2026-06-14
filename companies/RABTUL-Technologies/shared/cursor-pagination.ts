/**
 * Cursor-Based Pagination Utilities
 *
 * Converts skip-based pagination to cursor-based for better performance.
 *
 * Skip-based: O(n) - skips through all records
 * Cursor-based: O(1) - jumps directly to cursor
 *
 * Usage:
 *   import { paginateCursor } from '@rez/shared/cursor-pagination';
 *
 *   // BAD: Skip-based (slow for large offsets)
 *   const users = await User.find({}).skip(1000).limit(20);
 *
 *   // GOOD: Cursor-based (fast)
 *   const result = await paginateCursor(User, {}, { limit: 20, sort: { createdAt: -1 } });
 */

import mongoose, { Model, Document, SortOrder } from 'mongoose';

/**
 * Pagination cursor options
 */
export interface CursorPaginationOptions<T> {
  /** Number of items per page (default: 20, max: 100) */
  limit?: number;
  /** Sort field and direction */
  sort?: Record<string, SortOrder>;
  /** Cursor - usually _id of the last item from previous page */
  cursor?: string;
  /** Field to use as cursor (default: '_id') */
  cursorField?: string;
  /** Additional query filters */
  filter?: Record<string, unknown>;
}

/**
 * Pagination result
 */
export interface CursorPaginationResult<T> {
  /** Items for current page */
  items: T[];
  /** Pagination metadata */
  meta: {
    /** Has more items after this page */
    hasNextPage: boolean;
    /** Cursor for next page */
    nextCursor?: string;
    /** Items returned */
    count: number;
    /** Items per page */
    limit: number;
  };
}

/**
 * Convert ObjectId to string safely
 */
function toStringId(id): string {
  if (id instanceof mongoose.Types.ObjectId) {
    return id.toString();
  }
  if (typeof id === 'object' && id !== null && id._id) {
    return toStringId(id._id);
  }
  return String(id);
}

/**
 * Cursor-based pagination
 *
 * @param model - Mongoose model
 * @param options - Pagination options
 * @returns Paginated results with cursor
 *
 * @example
 * // First page
 * const { items, meta } = await paginateCursor(User, {
 *   filter: { isActive: true },
 *   sort: { createdAt: -1 },
 *   limit: 20
 * });
 *
 * // Next page (use nextCursor from previous result)
 * const { items, meta } = await paginateCursor(User, {
 *   filter: { isActive: true },
 *   sort: { createdAt: -1 },
 *   limit: 20,
 *   cursor: meta.nextCursor
 * });
 */
export async function paginateCursor<T extends Document>(
  model: Model<T>,
  options: CursorPaginationOptions<T>
): Promise<CursorPaginationResult<T>> {
  const {
    limit = 20,
    sort = { createdAt: -1 },
    cursor,
    cursorField = '_id',
    filter = {},
  } = options;

  // Validate and cap limit
  const safeLimit = Math.min(Math.max(1, limit), 100);

  // Build cursor query
  let cursorQuery: Record<string, unknown> = {};

  if (cursor) {
    const cursorDirection = sort[cursorField] === 1 ? '$gt' : '$lt';

    // Handle ObjectId cursors
    if (cursorField === '_id') {
      cursorQuery = {
        _id: {
          [cursorDirection]: new mongoose.Types.ObjectId(cursor),
        },
      };
    } else {
      cursorQuery = {
        [cursorField]: {
          [cursorDirection]: sort[cursorField] === 1 ? cursor : cursor,
        },
      };
    }
  }

  // Combine filter and cursor query
  const query = {
    ...filter,
    ...cursorQuery,
  };

  // Fetch one extra to determine hasNextPage
  const items = await model
    .find(query)
    .sort(sort)
    .limit(safeLimit + 1)
    .lean() as T[];

  // Determine if there's a next page
  const hasNextPage = items.length > safeLimit;
  if (hasNextPage) {
    items.pop(); // Remove extra item
  }

  // Get cursor from last item
  const lastItem = items[items.length - 1];
  const nextCursor = hasNextPage && lastItem
    ? toStringId((lastItem as unknown)[cursorField])
    : undefined;

  return {
    items,
    meta: {
      hasNextPage,
      nextCursor,
      count: items.length,
      limit: safeLimit,
    },
  };
}

/**
 * Time-based cursor pagination (more efficient for time-series data)
 *
 * Uses (timestamp, _id) compound cursor for unique ordering even with same timestamp.
 *
 * @param model - Mongoose model
 * @param options - Pagination options
 * @returns Paginated results
 *
 * @example
 * const { items, meta } = await paginateTimeCursor(Event, {
 *   filter: { eventType: 'user.login' },
 *   sort: { timestamp: -1 },
 *   limit: 50,
 *   cursor: { timestamp: lastTimestamp, id: lastId }
 * });
 */
export async function paginateTimeCursor<T extends Document>(
  model: Model<T>,
  options: CursorPaginationOptions<T> & {
    timeField?: string;
    cursor?: { timestamp: Date | string; id: string };
  }
): Promise<CursorPaginationResult<T>> {
  const {
    limit = 20,
    sort = { timestamp: -1 },
    cursor,
    timeField = 'timestamp',
    filter = {},
  } = options;

  const safeLimit = Math.min(Math.max(1, limit), 100);

  // Build cursor query for time-based pagination
  let cursorQuery: Record<string, unknown> = {};

  if (cursor) {
    const sortDirection = sort[timeField] === 1 ? '$gt' : '$lt';
    const timestamp = typeof cursor.timestamp === 'string'
      ? new Date(cursor.timestamp)
      : cursor.timestamp;

    if (sort[timeField] === 1) {
      // Ascending: get records after cursor
      cursorQuery = {
        $or: [
          { [timeField]: { [sortDirection]: timestamp } },
          {
            [timeField]: timestamp,
            _id: { $gt: new mongoose.Types.ObjectId(cursor.id) },
          },
        ],
      };
    } else {
      // Descending: get records before cursor
      cursorQuery = {
        $or: [
          { [timeField]: { [sortDirection]: timestamp } },
          {
            [timeField]: timestamp,
            _id: { $lt: new mongoose.Types.ObjectId(cursor.id) },
          },
        ],
      };
    }
  }

  const query = {
    ...filter,
    ...cursorQuery,
  };

  const items = await model
    .find(query)
    .sort(sort)
    .limit(safeLimit + 1)
    .lean() as T[];

  const hasNextPage = items.length > safeLimit;
  if (hasNextPage) {
    items.pop();
  }

  const lastItem = items[items.length - 1];
  const lastTimestamp = (lastItem as unknown)?.[timeField];
  const nextCursor = hasNextPage && lastItem && lastTimestamp
    ? {
        timestamp: lastTimestamp instanceof Date ? lastTimestamp.toISOString() : lastTimestamp,
        id: toStringId((lastItem as unknown)._id),
      }
    : undefined;

  return {
    items,
    meta: {
      hasNextPage,
      nextCursor,
      count: items.length,
      limit: safeLimit,
    },
  };
}

/**
 * Keyset pagination for very large datasets
 *
 * Uses multiple cursor fields for unique ordering.
 *
 * @param model - Mongoose model
 * @param options - Pagination options
 * @returns Paginated results
 *
 * @example
 * const { items, meta } = await paginateKeyset(User, {
 *   filter: { role: 'admin' },
 *   sort: { role: 1, name: 1, _id: 1 },
 *   limit: 50,
 *   keyset: { role: 'admin', name: 'John', _id: 'abc123' }
 * });
 */
export async function paginateKeyset<T extends Document>(
  model: Model<T>,
  options: CursorPaginationOptions<T> & {
    keyset?: Record<string, unknown>;
  }
): Promise<CursorPaginationResult<T>> {
  const {
    limit = 20,
    sort = {},
    keyset,
    filter = {},
  } = options;

  const safeLimit = Math.min(Math.max(1, limit), 100);

  // Build keyset query
  let keysetQuery: Record<string, unknown> = {};

  if (keyset && Object.keys(sort).length > 0) {
    const sortFields = Object.keys(sort);
    const conditions: unknown[] = [];

    for (let i = 0; i < sortFields.length; i++) {
      const field = sortFields[i];
      const direction = sort[field];

      // For first field, use direct comparison based on keyset
      if (i === 0) {
        conditions.push({ [field]: { [direction === 1 ? '$gt' : '$lt']: keyset[field] } });
      } else {
        // For subsequent fields, use $or with previous fields
        const prevFields = sortFields.slice(0, i);
        const prevConditions = prevFields.map((prevField, idx) => {
          const prevDirection = sort[prevField];
          return {
            $and: [
              ...prevFields.slice(0, idx).map(f => ({ [f]: keyset[f] })),
              { [prevField]: prevDirection === 1 ? { $gte: keyset[prevField] } : { $lte: keyset[prevField] } },
            ],
          };
        });

        conditions.push({
          $and: prevFields.map((f, idx) => ({
            [f]: idx === 0
              ? { [sort[f] === 1 ? '$eq' : '$eq']: keyset[f] } // Simplified
              : keyset[f],
          })),
        });
      }
    }

    if (conditions.length > 0) {
      keysetQuery = { $or: conditions };
    }
  }

  const query = {
    ...filter,
    ...keysetQuery,
  };

  const items = await model
    .find(query)
    .sort(sort)
    .limit(safeLimit + 1)
    .lean() as T[];

  const hasNextPage = items.length > safeLimit;
  if (hasNextPage) {
    items.pop();
  }

  // Build keyset from last item
  const lastItem = items[items.length - 1];
  const nextKeyset = hasNextPage && lastItem
    ? Object.fromEntries(
        Object.keys(sort).map(field => [field, (lastItem as unknown)[field]])
      )
    : undefined;

  return {
    items,
    meta: {
      hasNextPage,
      nextCursor: nextKeyset as unknown,
      count: items.length,
      limit: safeLimit,
    },
  };
}
