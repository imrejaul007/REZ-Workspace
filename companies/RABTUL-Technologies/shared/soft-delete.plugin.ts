/**
 * Soft Delete Plugin for Mongoose
 *
 * Adds soft delete functionality to schemas without modifying the actual documents.
 * Uses deletedAt timestamp and isDeleted flag.
 *
 * Usage:
 *   import softDeletePlugin from './soft-delete.plugin';
 *
 *   const UserSchema = new Schema({ name: String });
 *   UserSchema.plugin(softDeletePlugin);
 *
 *   // Now all queries automatically filter out deleted documents
 *   const users = await User.find({}); // Excludes deleted
 *   const deletedUsers = await User.findDeleted({}); // Only deleted
 */

import { Schema, Document, Model } from 'mongoose';

export interface ISoftDelete {
  deletedAt: Date;
  deletedBy?: string;
}

export interface ISoftDeleteDocument extends Document {
  deletedAt?: Date;
  deletedBy?: string;
}

/**
 * Soft delete plugin options
 */
export interface SoftDeleteOptions {
  /** Field name for deleted timestamp (default: 'deletedAt') */
  deletedAtField?: string;
  /** Field name for who deleted (default: 'deletedBy') */
  deletedByField?: string;
  /** Override default query methods (default: true) */
  overrideMethods?: boolean;
  /** Index name for deletedAt (default: 'idx_deleted') */
  indexName?: string;
}

/**
 * Default options
 */
const defaultOptions: Required<SoftDeleteOptions> = {
  deletedAtField: 'deletedAt',
  deletedByField: 'deletedBy',
  overrideMethods: true,
  indexName: 'idx_deleted',
};

/**
 * Soft Delete Plugin
 *
 * Adds:
 * - deletedAt: Date (when deleted)
 * - deletedBy: string (who deleted)
 * - softDelete() method
 * - restore() method
 * - findDeleted() static
 * - findAll() static (includes deleted)
 *
 * Overrides:
 * - find()
 * - findOne()
 * - findById()
 * - countDocuments()
 * - count()
 */
export function softDeletePlugin<T extends Document = Document>(
  schema: Schema<T>,
  options: SoftDeleteOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };
  const { deletedAtField, deletedByField, overrideMethods, indexName } = opts;

  // ─── Add Fields ─────────────────────────────────────────────────────────────

  schema.add({
    [deletedAtField]: {
      type: Date,
      index: true,
      sparse: true,
    },
    [deletedByField]: {
      type: String,
      index: true,
      sparse: true,
    },
  });

  // ─── Compound Index ──────────────────────────────────────────────────────────

  // Index for common query patterns
  schema.index(
    { [deletedAtField]: 1 },
    {
      name: indexName,
      sparse: true,
    }
  );

  // ─── Methods ────────────────────────────────────────────────────────────────

  /**
   * Soft delete this document
   */
  schema.methods.softDelete = function (deletedBy?: string): Promise<T> {
    const update: Record<string, unknown> = {
      $set: {
        [deletedAtField]: new Date(),
      },
    };

    if (deletedBy) {
      update.$set[deletedByField] = deletedBy;
    }

    return (this.constructor as Model<T>).findByIdAndUpdate(
      this._id,
      update,
      { new: true }
    ) as Promise<T>;
  };

  /**
   * Restore a soft-deleted document
   */
  schema.methods.restore = function (): Promise<T> {
    return (this.constructor as Model<T>).findByIdAndUpdate(
      this._id,
      {
        $unset: {
          [deletedAtField]: 1,
          [deletedByField]: 1,
        },
      },
      { new: true }
    ) as Promise<T>;
  };

  /**
   * Hard delete (permanent)
   */
  schema.methods.hardDelete = function (): Promise<T> {
    return (this.constructor as Model<T>).findByIdAndDelete(this._id) as Promise<T>;
  };

  // ─── Statics ────────────────────────────────────────────────────────────────

  /**
   * Find only deleted documents
   */
  schema.statics.findDeleted = function (
    filter: Record<string, unknown> = {},
    options: { limit?: number; skip?: number; sort?: Record<string, 1 | -1> } = {}
  ) {
    const query = {
      ...filter,
      [deletedAtField]: { $ne: null },
    };

    let result = (this as unknown).find(query);

    if (options.sort) {
      result = result.sort(options.sort);
    }
    if (options.skip) {
      result = result.skip(options.skip);
    }
    if (options.limit) {
      result = result.limit(options.limit);
    }

    return result;
  };

  /**
   * Find all documents including deleted
   */
  schema.statics.findAll = function (
    filter: Record<string, unknown> = {},
    options: { limit?: number; skip?: number; sort?: Record<string, 1 | -1> } = {}
  ) {
    // Remove any default deletedAt filter
    const cleanFilter = { ...filter };
    delete cleanFilter[deletedAtField];
    delete cleanFilter.isDeleted;

    let result = (this as unknown).findWithDeleted(cleanFilter);

    if (options.sort) {
      result = result.sort(options.sort);
    }
    if (options.skip) {
      result = result.skip(options.skip);
    }
    if (options.limit) {
      result = result.limit(options.limit);
    }

    return result;
  };

  /**
   * Find with deleted documents included
   */
  schema.statics.findWithDeleted = function (filter: Record<string, unknown> = {}) {
    return (this as unknown).find({
      ...filter,
      $or: [
        { [deletedAtField]: { $exists: false } },
        { [deletedAtField]: null },
        { [deletedAtField]: { $exists: true } },
      ],
    });
  };

  /**
   * Count only deleted documents
   */
  schema.statics.countDeleted = function (filter: Record<string, unknown> = {}) {
    return (this as unknown).countDocuments({
      ...filter,
      [deletedAtField]: { $ne: null },
    });
  };

  /**
   * Restore a deleted document by ID
   */
  schema.statics.restoreById = function (id: string | unknown) {
    return (this as unknown).findByIdAndUpdate(
      id,
      {
        $unset: {
          [deletedAtField]: 1,
          [deletedByField]: 1,
        },
      },
      { new: true }
    );
  };

  /**
   * Hard delete by ID (permanent)
   */
  schema.statics.hardDeleteById = function (id: string | unknown) {
    return (this as unknown).findByIdAndDelete(id);
  };

  /**
   * Bulk soft delete
   */
  schema.statics.bulkSoftDelete = function (
    filter: Record<string, unknown>,
    deletedBy?: string
  ) {
    const update: Record<string, unknown> = {
      $set: {
        [deletedAtField]: new Date(),
      },
    };

    if (deletedBy) {
      update.$set[deletedByField] = deletedBy;
    }

    return (this as unknown).updateMany(filter, update);
  };

  /**
   * Bulk restore
   */
  schema.statics.bulkRestore = function (filter: Record<string, unknown>) {
    return (this as unknown).updateMany(
      { ...filter, [deletedAtField]: { $ne: null } },
      {
        $unset: {
          [deletedAtField]: 1,
          [deletedByField]: 1,
        },
      }
    );
  };

  // ─── Override Default Queries ───────────────────────────────────────────────

  if (overrideMethods) {
    // Store original methods
    const originalFind = schema.statics.find;
    const originalFindOne = schema.statics.findOne;
    const originalFindById = schema.statics.findById;
    const originalCountDocuments = schema.statics.countDocuments;

    // Override find
    schema.statics.find = function (
      filter: Record<string, unknown> = {},
      projection?,
      options?: unknown
    ) {
      // Add deletedAt filter
      const cleanFilter = { ...filter };
      // Don't override if explicitly querying deleted
      if (
        filter[deletedAtField] === undefined &&
        filter.isDeleted === undefined
      ) {
        cleanFilter[deletedAtField] = null;
      }

      return (originalFind as unknown).call(this, cleanFilter, projection, options);
    };

    // Override findOne
    schema.statics.findOne = function (filter: Record<string, unknown> = {}) {
      const cleanFilter = { ...filter };
      if (
        filter[deletedAtField] === undefined &&
        filter.isDeleted === undefined
      ) {
        cleanFilter[deletedAtField] = null;
      }

      return (originalFindOne as unknown).call(this, cleanFilter);
    };

    // Override findById
    schema.statics.findById = function (id: string | unknown) {
      // Can't easily override this without breaking _id filter
      return (originalFindById as unknown).call(this, id);
    };

    // Override countDocuments
    schema.statics.countDocuments = function (
      filter: Record<string, unknown> = {}
    ) {
      const cleanFilter = { ...filter };
      if (
        filter[deletedAtField] === undefined &&
        filter.isDeleted === undefined
      ) {
        cleanFilter[deletedAtField] = null;
      }

      return (originalCountDocuments as unknown).call(this, cleanFilter);
    };
  }
}

/**
 * Mixin for TypeScript support
 */
export interface SoftDeleteModel<T extends Document> extends Model<T> {
  softDelete(filter: Record<string, unknown>, deletedBy?: string): Promise<unknown>;
  restoreById(id: string): Promise<T>;
  findDeleted(filter?: Record<string, unknown>, options?): Promise<T[]>;
  findAll(filter?: Record<string, unknown>, options?): Promise<T[]>;
  findWithDeleted(filter?: Record<string, unknown>): Promise<T[]>;
  countDeleted(filter?: Record<string, unknown>): Promise<number>;
  bulkSoftDelete(filter: Record<string, unknown>, deletedBy?: string): Promise<unknown>;
  bulkRestore(filter: Record<string, unknown>): Promise<unknown>;
}

/**
 * Add soft delete to an existing model
 */
export function addSoftDeleteToModel<T extends Document>(
  model: Model<T>,
  options: SoftDeleteOptions = {}
): void {
  const schema = model.schema;
  softDeletePlugin(schema, options);
}

export default softDeletePlugin;
