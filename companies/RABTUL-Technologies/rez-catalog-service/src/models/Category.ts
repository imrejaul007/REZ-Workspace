/**
 * Category model — strict:false so it reads the monolith's 'categories' collection
 * without requiring an exact schema match.
 */

import mongoose, { Schema, Document } from 'mongoose';

// TODO: Migrate to import from '@rez/shared-types'
// Example: import { ICategory } from '@rez/shared-types/entities/catalog';

export interface ICategory extends Document {
  [key: string];
}

const CategorySchema = new Schema({}, { strict: false, collection: 'categories', timestamps: true });

CategorySchema.index({ 'isActive': 1, 'order': 1 });
CategorySchema.index({ 'slug': 1 });

export const Category = mongoose.models['CatalogService_Category']
  ? (mongoose.model('CatalogService_Category') as mongoose.Model<ICategory>)
  : mongoose.model<ICategory>('CatalogService_Category', CategorySchema);
