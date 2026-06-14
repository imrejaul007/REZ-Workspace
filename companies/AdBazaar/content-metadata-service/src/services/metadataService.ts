import { v4 as uuidv4 } from 'uuid';
import { Metadata, IMetadata } from '../models/Metadata';
import { Tag } from '../models/Tag';
import { logger } from 'utils/logger.js';
import { recordMetadataOperation } from '../utils/metrics';

export interface CreateMetadataInput {
  contentId: string;
  contentType: string;
  tags?: string[];
  categories?: string[];
  attributes?: Record<string, any>;
  language?: string;
  region?: string;
  audience?: string[];
  customFields?: Record<string, any>;
  seo?: { title?: string; description?: string; keywords?: string[] };
  visibility?: 'public' | 'private' | 'restricted';
  createdBy: string;
}

export interface UpdateMetadataInput extends Partial<CreateMetadataInput> {
  updatedBy: string;
}

export class MetadataService {
  async create(input: CreateMetadataInput): Promise<IMetadata> {
    try {
      const metadataId = `meta-${uuidv4()}`;
      const metadata = new Metadata({
        metadataId,
        ...input,
        updatedBy: input.createdBy
      });
      await metadata.save();
      await this.updateTagCounts(input.tags || [], 'increment');
      recordMetadataOperation('create', 'success');
      logger.info('Metadata created', { metadataId, contentId: input.contentId });
      return metadata;
    } catch (error) {
      recordMetadataOperation('create', 'error');
      logger.error('Failed to create metadata', { error, input });
      throw error;
    }
  }

  async findByContentId(contentId: string): Promise<IMetadata | null> {
    try {
      const metadata = await Metadata.findOne({ contentId });
      recordMetadataOperation('read', metadata ? 'success' : 'not_found');
      return metadata;
    } catch (error) {
      recordMetadataOperation('read', 'error');
      throw error;
    }
  }

  async update(contentId: string, input: UpdateMetadataInput): Promise<IMetadata | null> {
    try {
      const existing = await Metadata.findOne({ contentId });
      if (existing) {
        await this.updateTagCounts(existing.tags, 'decrement');
      }

      const metadata = await Metadata.findOneAndUpdate(
        { contentId },
        { $set: { ...input, version: existing ? existing.version + 1 : 1 } },
        { new: true, runValidators: true }
      );

      if (metadata) {
        await this.updateTagCounts(metadata.tags, 'increment');
        recordMetadataOperation('update', 'success');
        logger.info('Metadata updated', { contentId });
      } else {
        recordMetadataOperation('update', 'not_found');
      }
      return metadata;
    } catch (error) {
      recordMetadataOperation('update', 'error');
      logger.error('Failed to update metadata', { error, contentId, input });
      throw error;
    }
  }

  async search(filters: {
    tags?: string[];
    categories?: string[];
    language?: string;
    region?: string;
    visibility?: string;
    contentType?: string;
    query?: string;
    page?: number;
    limit?: number;
  }): Promise<{ results: IMetadata[]; total: number }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const query: any = {};

      if (filters.tags?.length) query.tags = { $all: filters.tags };
      if (filters.categories?.length) query.categories = { $in: filters.categories };
      if (filters.language) query.language = filters.language;
      if (filters.region) query.region = filters.region;
      if (filters.visibility) query.visibility = filters.visibility;
      if (filters.contentType) query.contentType = filters.contentType;
      if (filters.query) query.$text = { $search: filters.query };

      const [results, total] = await Promise.all([
        Metadata.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
        Metadata.countDocuments(query)
      ]);

      recordMetadataOperation('search', 'success');
      return { results, total };
    } catch (error) {
      recordMetadataOperation('search', 'error');
      throw error;
    }
  }

  async delete(contentId: string): Promise<boolean> {
    try {
      const existing = await Metadata.findOne({ contentId });
      if (existing) {
        await this.updateTagCounts(existing.tags, 'decrement');
      }
      const result = await Metadata.deleteOne({ contentId });
      recordMetadataOperation('delete', result.deletedCount > 0 ? 'success' : 'not_found');
      return result.deletedCount > 0;
    } catch (error) {
      recordMetadataOperation('delete', 'error');
      throw error;
    }
  }

  private async updateTagCounts(tags: string[], operation: 'increment' | 'decrement'): Promise<void> {
    if (!tags?.length) return;
    const update = operation === 'increment' ? 1 : -1;
    await Tag.updateMany({ name: { $in: tags } }, { $inc: { contentCount: update } });
  }
}

export const metadataService = new MetadataService();