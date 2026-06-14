/**
 * Cursor Pagination Migration Guide
 *
 * This file documents how to migrate existing routes from offset-based
 * pagination to cursor-based pagination using the utility functions.
 *
 * Benefits:
 * - Consistent performance regardless of dataset size
 * - No missed/duplicate items when data changes between pages
 * - Better database index utilization
 */

import { parseCursor, buildPaginatedResponse, CursorPaginationOptions } from './cursorPagination';

/**
 * Example: Converting a GET /orders route
 *
 * BEFORE (offset-based):
 * ```
 * router.get('/orders', async (req, res) => {
 *   const page = parseInt(req.query.page as string) || 1;
 *   const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
 *   const skip = (page - 1) * limit;
 *
 *   const [orders, total] = await Promise.all([
 *     Order.find({ merchantId }).skip(skip).limit(limit).sort({ createdAt: -1 }),
 *     Order.countDocuments({ merchantId }),
 *   ]);
 *
 *   res.json({ orders, page, limit, total, totalPages: Math.ceil(total / limit) });
 * });
 * ```
 *
 * AFTER (cursor-based):
 * ```
 * router.get('/orders', async (req, res) => {
 *   const { filter, hasMore: _ignore, limit } = parseCursor({
 *     query: req.query,
 *     sortField: 'createdAt',
 *     sortDirection: -1,
 *     limit: 20,
 *     maxLimit: 100,
 *   });
 *
 *   // Combine pagination filter with existing filters
 *   const query = { merchantId, ...filter };
 *
 *   // Fetch one extra to determine hasMore
 *   const orders = await Order.find(query)
 *     .sort({ createdAt: -1, _id: -1 })
 *     .limit(limit + 1)
 *     .lean();
 *
 *   const { data, hasMore, nextCursor } = buildPaginatedResponse(
 *     orders,
 *     limit,
 *     'createdAt'
 *   );
 *
 *   res.json({ orders: data, hasMore, nextCursor });
 * });
 * ```
 */

/**
 * Helper to build cursor pagination options from common parameters.
 */
export function createOrderPaginationOptions(query: Record<string, unknown>): CursorPaginationOptions {
  return {
    query,
    sortField: 'createdAt',
    sortDirection: -1,
    limit: 20,
    maxLimit: 100,
  };
}

/**
 * Helper for transactions with _id-based cursoring.
 * Use this when sorting by _id (e.g., for stable ordering of transactions).
 */
export function createTransactionPaginationOptions(query: Record<string, unknown>): CursorPaginationOptions {
  return {
    query,
    sortField: '_id',
    sortDirection: -1,
    limit: 50,
    maxLimit: 200,
  };
}

/**
 * Migration checklist for routes:
 *
 * 1. Replace offset/limit with cursor parsing
 * 2. Update MongoDB query to include cursor filter
 * 3. Fetch limit + 1 to determine hasMore
 * 4. Use buildPaginatedResponse to generate response
 * 5. Update response format in API documentation
 * 6. Update client code to handle cursor pagination
 *
 * Client migration example:
 *
 * // BEFORE
 * const response = await fetch(`/api/orders?page=${page}&limit=20`);
 * const { orders, totalPages } = await response.json();
 *
 * // AFTER
 * let cursor = null;
 * const orders = [];
 * while (true) {
 *   const url = cursor
 *     ? `/api/orders?cursor=${cursor}&limit=20`
 *     : `/api/orders?limit=20`;
 *   const response = await fetch(url);
 *   const { data, hasMore, nextCursor } = await response.json();
 *   orders.push(...data);
 *   if (!hasMore) break;
 *   cursor = nextCursor;
 * }
 */

/**
 * Routes that should use cursor pagination:
 *
 * 1. GET /orders - List orders (use createdAt cursor)
 * 2. GET /orders/:orderId/transactions - Transaction history (use _id cursor)
 * 3. GET /merchants/:merchantId/orders - Merchant orders (use createdAt cursor)
 * 4. GET /stores/:storeId/orders - Store orders (use createdAt cursor)
 *
 * Routes that should NOT use cursor pagination:
 *
 * 1. Search results - Offset-based is fine for search
 * 2. Admin listing - May need total count for pagination UI
 * 3. Reports - May need arbitrary page jumping
 */
