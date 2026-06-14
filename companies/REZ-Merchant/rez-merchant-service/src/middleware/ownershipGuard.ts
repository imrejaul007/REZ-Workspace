/**
 * IDOR (Insecure Direct Object Reference) protection middleware.
 *
 * H3 FIX: This middleware provides standardized ownership verification for routes
 * that accept resource IDs. It ensures users can only access resources they own.
 *
 * Usage:
 * ```
 * router.get('/:orderId', ownershipGuard('orderId', Order, 'merchantId'), handler);
 * ```
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { errorResponse, errors } from '../utils/response';

/**
 * Middleware factory that verifies resource ownership before allowing access.
 * Returns 404 (not 403) to avoid leaking information about resource existence.
 */
export function ownershipGuard(
  /** Name of the param containing the resource ID */
  paramName: string,
  /** Mongoose model to query */
  model: mongoose.Model<unknown>,
  /** Field name that holds the owner ID */
  ownerField: string,
  /** Optional: field to select from the model (default: _id only) */
  select?: string
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const resourceId = req.params[paramName];

    if (!resourceId) {
      return errorResponse(res, errors.missingField(paramName));
    }

    // Get the owner's ID from the authenticated request
    const ownerId = req.merchantId || req.merchantUserId;

    if (!ownerId) {
      return errorResponse(res, errors.authTokenMissing());
    }

    try {
      const query = { _id: resourceId, [ownerField]: ownerId };
      const projection = select ? { [select]: 1 } : { _id: 1 };
      const resource = await model.findOne(query).select(projection).lean();

      if (!resource) {
        // Return 404 to avoid leaking information about resource existence
        return errorResponse(res, errors.notFound('Resource'));
      }

      // Attach resource to request for use in handlers
      (req as unknown as Record<string, unknown>).resource = resource;

      next();
    } catch (err) {
      const requestId = (req as unknown as { res?: { locals?: { requestId?: string } }).res?.locals?.requestId;
      return errorResponse(res, errors.internalError({ requestId }));
    }
  };
}

/**
 * Verify ownership filter helper for use in queries.
 * Returns a filter that scopes results to the authenticated owner.
 */
export function verifyOwnershipFilter(ownerId: string | undefined, ownerField: string = 'merchantId') {
  if (!ownerId) {
    throw new Error('Owner ID is required for ownership verification');
  }

  // For backward compat with documents that may have legacy owner fields,
  // use $or to check both the canonical field and any legacy fields
  return {
    $or: [
      { [ownerField]: ownerId },
      // Legacy field mappings - add as needed during migration
    ],
  };
}
