/**
 * Batch Query Utilities
 *
 * Provides utilities to avoid N+1 query patterns by batching database operations.
 *
 * Usage:
 *   import { batchByChunk, aggregateLookup } from '@rez/shared/batch-queries';
 *
 *   // BAD: N+1
 *   for (const order of orders) {
 *     const user = await User.findById(order.userId);  // N queries!
 *   }
 *
 *   // GOOD: Batch
 *   const users = await batchByChunk(orders, 'userId',
 *     ids => User.find({ _id: { $in: ids } })
 *   );
 */

import mongoose, { PipelineStage, Model } from 'mongoose';

/**
 * Chunk an array into smaller batches
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Batch query by extracting IDs and fetching in one query
 *
 * @param items - Array of objects containing an ID field
 * @param idField - The field name containing the ID (e.g., 'userId', 'orderId')
 * @param fetcher - Async function that takes array of IDs and returns documents
 * @param chunkSize - Number of IDs per batch (default: 100)
 * @param idFieldInResult - Field name in the result to match against (default: same as idField)
 *
 * @example
 * const orders = await Order.find({ userId });
 * const users = await batchByChunk(orders, 'userId',
 *   ids => User.find({ _id: { $in: ids } }).lean()
 * );
 * // Returns Map<userId, User>
 */
export async function batchByChunk<T, R>(
  items: T[],
  idField: keyof T,
  fetcher: (ids: string[]) => Promise<R[]>,
  chunkSize: number = 100,
  idFieldInResult: string = idField as string
): Promise<Map<string, R>> {
  const result = new Map<string, R>();

  if (!items || items.length === 0) {
    return result;
  }

  // Extract unique IDs
  const ids = [...new Set(items.map(item => String(item[idField])))];

  // Process in chunks
  const chunks = chunkArray(ids, chunkSize);

  for (const chunk of chunks) {
    const fetchedItems = await fetcher(chunk);
    for (const item of fetchedItems) {
      const key = String((item as unknown)[idFieldInResult]);
      result.set(key, item);
    }
  }

  return result;
}

/**
 * Batch query with parallel chunks (faster but more load)
 *
 * @param items - Array of objects containing an ID field
 * @param idField - The field name containing the ID
 * @param fetcher - Async function that takes array of IDs and returns documents
 * @param chunkSize - Number of IDs per batch (default: 100)
 * @param concurrency - Number of concurrent chunk requests (default: 5)
 */
export async function batchByChunkParallel<T, R>(
  items: T[],
  idField: keyof T,
  fetcher: (ids: string[]) => Promise<R[]>,
  chunkSize: number = 100,
  concurrency: number = 5
): Promise<Map<string, R>> {
  const result = new Map<string, R>();

  if (!items || items.length === 0) {
    return result;
  }

  const ids = [...new Set(items.map(item => String(item[idField])))];
  const chunks = chunkArray(ids, chunkSize);

  // Process chunks with concurrency limit
  const queue = [...chunks];
  const running: Promise<void>[] = [];

  while (queue.length > 0 || running.length > 0) {
    while (running.length < concurrency && queue.length > 0) {
      const chunk = queue.shift()!;
      const promise = fetcher(chunk).then(fetchedItems => {
        for (const item of fetchedItems) {
          result.set(String((item as unknown)[idField]), item);
        }
      });
      running.push(promise);
    }

    if (running.length > 0) {
      await Promise.race(running);
      // Remove completed promises
      for (let i = running.length - 1; i >= 0; i--) {
        const settled = await Promise.race([
          running[i].then(() => true),
          Promise.resolve(false),
        ]);
        if (settled) {
          running.splice(i, 1);
        }
      }
    }
  }

  return result;
}

/**
 * Simple parallel execution with concurrency limit
 */
export async function parallelMap<T, R>(
  items: T[],
  mapper: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const queue = items.entries();
  const running: Promise<void>[] = [];

  const processNext = async (index: number, item: T): Promise<void> => {
    results[index] = await mapper(item);
  };

  while (true) {
    const next = queue.next();
    if (next.done) break;

    if (running.length >= concurrency) {
      await Promise.race(running);
      // Remove completed
      for (let i = running.length - 1; i >= 0; i--) {
        const settled = await Promise.race([
          running[i].then(() => true),
          Promise.resolve(false),
        ]);
        if (settled) {
          running.splice(i, 1);
        }
      }
    } else {
      const [index, item] = next.value;
      running.push(processNext(index, item));
    }
  }

  await Promise.all(running);
  return results;
}

/**
 * Aggregation pipeline builder for $lookup with batch
 */
export function buildLookupPipeline(
  from: string,
  localField: string,
  foreignField: string,
  as: string,
  pipeline: PipelineStage[] = []
): PipelineStage[] {
  return [
    {
      $lookup: {
        from,
        let: { localField: `$${localField}` },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: [`$${foreignField}`, '$$localField'] }],
              },
            },
            ...(pipeline.length > 0 && { $match: { $expr: { $and: [{ $eq: [`$${foreignField}`, '$$localField`] }, ...pipeline.map(p => p.$match)] } } }),
          },
          ...pipeline,
        ],
        as,
      },
    },
  ];
}

/**
 * Optimized aggregation with $lookup and $unwind
 */
export function buildLookupUnwindPipeline(
  from: string,
  localField: string,
  foreignField: string,
  as: string,
  preserveNullAndEmptyArrays: boolean = false
): PipelineStage[] {
  return [
    {
      $lookup: {
        from,
        localField,
        foreignField,
        as,
      },
    },
    {
      $unwind: {
        path: `$${as}`,
        preserveNullAndEmptyArrays,
      },
    },
  ];
}

/**
 * Batch populate utility - resolves references in a single query per collection
 */
export async function batchPopulate<T extends Record<string, unknown>>(
  items: T[],
  populateConfig: Array<{
    field: keyof T;
    model: Model<unknown>;
    select?: string;
  }>
): Promise<T[]> {
  if (!items || items.length === 0) {
    return items;
  }

  // Group by model to minimize queries
  const modelGroups = new Map<string, { field: keyof T; ids: string[] }>();

  for (const config of populateConfig) {
    const ids = items
      .map(item => String(item[config.field]))
      .filter(id => id && id !== 'undefined');

    if (ids.length > 0) {
      const existing = modelGroups.get(config.model.modelName) || { field: config.field, ids: [] };
      existing.ids.push(...ids);
      modelGroups.set(config.model.modelName, existing);
    }
  }

  // Fetch all related documents in batch
  const fetchedDocs = new Map<string, Map<string, unknown>>();

  for (const [modelName, group] of modelGroups) {
    const model = populateConfig.find(c => c.model.modelName === modelName)?.model;
    if (!model) continue;

    const uniqueIds = [...new Set(group.ids)];
    const docs = await model
      .find({ _id: { $in: uniqueIds } })
      .select(populateConfig.find(c => c.model.modelName === modelName)?.select || '')
      .lean();

    const docMap = new Map<string, unknown>();
    for (const doc of docs) {
      docMap.set(String(doc._id), doc);
    }
    fetchedDocs.set(modelName, docMap);
  }

  // Merge results back into items
  return items.map(item => {
    const result = { ...item };
    for (const config of populateConfig) {
      const docs = fetchedDocs.get(config.model.modelName);
      if (docs) {
        (result as unknown)[config.field] = docs.get(String(item[config.field])) || null;
      }
    }
    return result;
  });
}

/**
 * Count with cursor-based pagination info
 */
export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

export async function paginateWithCount<T>(
  model: Model<T>,
  query: Record<string, unknown>,
  options: { page?: number; limit?: number; sort?: Record<string, 1 | -1> }
): Promise<PaginationResult<T>> {
  const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;

  const [data, total] = await Promise.all([
    model
      .find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    model.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

/**
 * Cursor-based pagination (more efficient for large datasets)
 */
export async function paginateWithCursor<T>(
  model: Model<T>,
  query: Record<string, unknown>,
  options: {
    limit?: number;
    sort?: Record<string, 1 | -1>;
    cursor?: string;
    cursorField?: string;
  }
): Promise<PaginationResult<T>> {
  const { limit = 20, sort = { createdAt: -1 }, cursor, cursorField = '_id' } = options;

  // Add cursor to query
  if (cursor) {
    const cursorDirection = sort[cursorField] === 1 ? '$gt' : '$lt';
    query[cursorField] = { [cursorDirection]: new mongoose.Types.ObjectId(cursor) };
  }

  const data = await model
    .find(query)
    .sort(sort)
    .limit(limit + 1) // Fetch one extra to determine hasMore
    .lean();

  const hasMore = data.length > limit;
  if (hasMore) {
    data.pop(); // Remove extra item
  }

  const nextCursor = hasMore && data.length > 0
    ? String((data[data.length - 1] as unknown)[cursorField])
    : undefined;

  return {
    data,
    pagination: {
      page: 1, // Cursor-based doesn't use traditional pages
      limit,
      total: -1, // Unknown with cursor pagination
      totalPages: -1,
      hasMore,
      nextCursor,
    },
  };
}
