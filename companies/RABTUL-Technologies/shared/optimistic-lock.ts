/**
 * Optimistic Locking Utilities
 *
 * Provides optimistic locking pattern for MongoDB/Mongoose documents.
 * Prevents lost updates when multiple processes update the same document.
 *
 * Usage:
 *   import { optimisticUpdate, OptimisticLockError } from '@rez/shared/optimistic-lock';
 *
 *   const payment = await Payment.findOne({ paymentId });
 *   const result = await optimisticUpdate(payment, {
 *     update: { $set: { status: 'completed' } },
 *     filter: { status: 'processing' }
 *   });
 *
 *   if (!result.modified) {
 *     // Another process already updated this payment
 *     throw new OptimisticLockError('Payment was modified by another process');
 *   }
 */

import { Document, Model } from 'mongoose';

export class OptimisticLockError extends Error {
  constructor(
    message: string,
    public readonly documentType: string,
    public readonly documentId: string | number
  ) {
    super(message);
    this.name = 'OptimisticLockError';
  }
}

export interface OptimisticUpdateOptions {
  /** Update operations */
  update: Record<string, unknown>;
  /** Optional filter to add to the query */
  filter?: Record<string, unknown>;
  /** Current version (if not using version field) */
  currentVersion?: number;
}

/**
 * Perform optimistic update on a document
 *
 * @param model - Mongoose model
 * @param filter - Filter to find the document
 * @param options - Update options
 * @returns Result with modified count
 */
export async function optimisticUpdate<T extends Document>(
  model: Model<T>,
  filter: Record<string, unknown>,
  options: OptimisticUpdateOptions
): Promise<{ modified: boolean; matched: number; modifiedCount: number }> {
  const { update, filter: additionalFilter } = options;

  // Build the query
  const query: Record<string, unknown> = {
    ...filter,
    ...additionalFilter,
  };

  // Add version check if document has version field
  if (options.currentVersion !== undefined) {
    query.version = options.currentVersion;
  }

  // Perform the update with version increment
  const result = await model.updateOne(query, {
    ...update,
    $inc: { version: 1 },
    $set: {
      ...(update.$set || {}),
      updatedAt: new Date(),
    },
  });

  return {
    modified: result.modifiedCount > 0,
    matched: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
}

/**
 * Find and update with optimistic locking
 *
 * @param model - Mongoose model
 * @param filter - Filter to find the document
 * @param options - Update options
 * @returns Updated document or null
 */
export async function optimisticFindAndUpdate<T extends Document>(
  model: Model<T>,
  filter: Record<string, unknown>,
  options: OptimisticUpdateOptions & {
    returnDocument?: 'after' | 'before';
  }
): Promise<{ success: boolean; document: T | null; version: number }> {
  const { update, filter: additionalFilter, returnDocument = 'after' } = options;

  // Build the query
  const query: Record<string, unknown> = {
    ...filter,
    ...additionalFilter,
  };

  // Add version check
  if (options.currentVersion !== undefined) {
    query.version = options.currentVersion;
  }

  // Perform findAndUpdate
  const doc = await model.findOneAndUpdate(
    query,
    {
      ...update,
      $inc: { version: 1 },
      $set: {
        ...(update.$set || {}),
        updatedAt: new Date(),
      },
    },
    {
      new: returnDocument === 'after',
    }
  );

  return {
    success: doc !== null,
    document: doc as T | null,
    version: doc ? (doc as unknown).version : -1,
  };
}

/**
 * Wrapper for operations that require optimistic locking
 *
 * @param operation - The async operation to perform
 * @param options - Retry options
 * @returns Result of the operation
 *
 * @example
 * const result = await withOptimisticLock(async (currentDoc) => {
 *   currentDoc.status = 'completed';
 *   return currentDoc.save();
 * }, { model: Payment, filter: { paymentId }, maxRetries: 3 });
 */
export async function withOptimisticLock<T>(
  operation: (currentVersion: number) => Promise<T>,
  options: {
    /** Document type name for error messages */
    documentType?: string;
    /** Document ID for error messages */
    documentId?: string | number;
    /** Current version (if known) */
    currentVersion?: number;
    /** Maximum retry attempts (default: 3) */
    maxRetries?: number;
  } = {}
): Promise<T> {
  const {
    documentType = 'Document',
    documentId = 'unknown',
    currentVersion,
    maxRetries = 3,
  } = options;

  let lastError: Error | undefined;
  let version = currentVersion;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation(version || 0);
    } catch (error) {
      if (error instanceof OptimisticLockError) {
        lastError = error;
        version = (error as any).newVersion; // If error contains new version
        continue;
      }

      // Check if it's a write conflict error
      if (
        error &&
        typeof error === 'object' &&
        (error as unknown).message?.includes('write conflict')
      ) {
        lastError = error as Error;
        continue;
      }

      // Non-retryable error
      throw error;
    }
  }

  throw new OptimisticLockError(
    `${documentType} ${documentId} was modified by another process after ${maxRetries} retries`,
    documentType,
    documentId
  );
}

/**
 * Mixin for models that need optimistic locking
 */
export function withOptimisticLockPlugin(schema) {
  // Add version field if not present
  if (!schema.paths.version) {
    schema.add({
      version: {
        type: Number,
        default: 0,
      },
    });
  }

  // Add pre-save hook to increment version
  schema.pre('save', function (next) {
    if (!this.isNew) {
      this.version = (this.version || 0) + 1;
    }
    next();
  });

  // Add method for safe update
  schema.methods.safeUpdate = async function (
    update: Record<string, unknown>
  ): Promise<{ success: boolean; document: unknown }> {
    const currentVersion = this.version;

    const result = await (this.constructor as Model<unknown>).findOneAndUpdate(
      {
        _id: this._id,
        version: currentVersion,
      },
      {
        ...update,
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (result) {
      // Update local document
      Object.assign(this, result.toObject());
    }

    return {
      success: result !== null,
      document: result,
    };
  };
}

/**
 * Payment-specific optimistic locking helpers
 */
export namespace PaymentLock {
  /**
   * Update payment status with optimistic locking
   */
  export async function updateStatus(
    PaymentModel: Model<unknown>,
    paymentId: string,
    expectedStatus: string,
    newStatus: string,
    additionalUpdate: Record<string, unknown> = {}
  ): Promise<{ success: boolean; payment: unknown }> {
    const result = await optimisticFindAndUpdate(
      PaymentModel,
      { paymentId, status: expectedStatus },
      {
        update: {
          $set: {
            status: newStatus,
            ...additionalUpdate,
          },
        },
      }
    );

    return {
      success: result.success,
      payment: result.document,
    };
  }

  /**
   * Complete payment with optimistic locking
   */
  export async function completePayment(
    PaymentModel: Model<unknown>,
    paymentId: string,
    expectedStatus: string
  ): Promise<{ success: boolean; payment: unknown }> {
    return updateStatus(PaymentModel, paymentId, expectedStatus, 'completed', {
      completedAt: new Date(),
    });
  }

  /**
   * Fail payment with optimistic locking
   */
  export async function failPayment(
    PaymentModel: Model<unknown>,
    paymentId: string,
    expectedStatus: string,
    failureReason: string
  ): Promise<{ success: boolean; payment: unknown }> {
    return updateStatus(PaymentModel, paymentId, expectedStatus, 'failed', {
      failedAt: new Date(),
      failureReason,
    });
  }
}
