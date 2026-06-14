/**
 * Model Helper - Centralized model access with proper typing
 * Use these functions instead of direct model imports to avoid type issues
 */

import mongoose, { Schema, Model, Document, Query, SortOrder } from 'mongoose';

// Generic model helper type
type MongooseModel<T extends Document> = Model<T> & {
  find(): Query<T[], T, Record<string, unknown>>;
  findOne(): Query<T | null, T, Record<string, unknown>>;
  findById(): Query<T | null, T, Record<string, unknown>>;
};

// Filter type for queries
type QueryFilter = Record<string, unknown>;

// Sort options type
type SortOptions = Record<string, SortOrder>;

/**
 * Get or create a model with proper typing
 * Use this instead of mongoose.models.X || mongoose.model(...)
 */
export function getOrCreateModel<T extends Document>(
  name: string,
  schema: Schema,
  collection?: string
): MongooseModel<T> {
  return (mongoose.models[name] as MongooseModel<T>) || mongoose.model<T, MongooseModel<T>>(name, schema, collection);
}

/**
 * Cast unknown model to properly typed version
 */
export function castModel<T extends Document>(model: unknown): MongooseModel<T> {
  return model as MongooseModel<T>;
}

/**
 * Helper for queries that return arrays
 */
export async function findAll<T extends Document>(
  model: MongooseModel<T>,
  filter: QueryFilter,
  options?: { sort?: SortOptions; skip?: number; limit?: number }
): Promise<T[]> {
  let query = model.find(filter);
  if (options?.sort) query = query.sort(options.sort);
  if (options?.skip) query = query.skip(options.skip);
  if (options?.limit) query = query.limit(options.limit);
  return query.lean() as Promise<T[]>;
}

/**
 * Helper for queries that return single document
 */
export async function findOne<T extends Document>(
  model: MongooseModel<T>,
  filter: QueryFilter
): Promise<T | null> {
  return model.findOne(filter).lean() as Promise<T | null>;
}
