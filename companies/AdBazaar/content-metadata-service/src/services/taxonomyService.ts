import { v4 as uuidv4 } from 'uuid';
import { Taxonomy, ITaxonomy } from '../models/Taxonomy';
import { Tag, ITag } from '../models/Tag';
import { Category, ICategory } from '../models/Category';
import { logger } from 'utils/logger.js';
import { taxonomyEntriesGauge } from '../utils/metrics';

export interface CreateTaxonomyInput {
  name: string;
  description?: string;
  type: 'category' | 'genre' | 'topic' | 'industry' | 'custom';
  parentId?: string;
  metadata?: { icon?: string; color?: string; image?: string };
}

export interface CreateTagInput {
  name: string;
  type?: 'content' | 'brand' | 'campaign' | 'audience' | 'custom';
  category?: string;
  color?: string;
  synonyms?: string[];
}

export class TaxonomyService {
  async createTaxonomy(input: CreateTaxonomyInput): Promise<ITaxonomy> {
    try {
      const taxonomyId = `tax-${uuidv4()}`;
      const slug = input.name.toLowerCase().replace(/\s+/g, '-');

      let hierarchy: string[] = [taxonomyId];
      let depth = 0;

      if (input.parentId) {
        const parent = await Taxonomy.findOne({ taxonomyId: input.parentId });
        if (parent) {
          hierarchy = [...parent.hierarchy, taxonomyId];
          depth = parent.depth + 1;
        }
      }

      const taxonomy = new Taxonomy({
        taxonomyId,
        name: input.name,
        slug,
        description: input.description,
        type: input.type,
        parentId: input.parentId,
        hierarchy,
        depth,
        metadata: input.metadata
      });

      await taxonomy.save();

      if (input.parentId) {
        await Taxonomy.findOneAndUpdate({ taxonomyId: input.parentId }, { $push: { children: taxonomyId } });
      }

      await this.updateTaxonomyMetrics();
      logger.info('Taxonomy created', { taxonomyId, name: input.name });
      return taxonomy;
    } catch (error) {
      logger.error('Failed to create taxonomy', { error, input });
      throw error;
    }
  }

  async findAllTaxonomy(type?: string): Promise<ITaxonomy[]> {
    try {
      const query = type ? { type, isActive: true } : { isActive: true };
      return await Taxonomy.find(query).sort({ type: 1, name: 1 });
    } catch (error) {
      logger.error('Failed to list taxonomy', { error, type });
      throw error;
    }
  }

  async findTaxonomyById(taxonomyId: string): Promise<ITaxonomy | null> {
    return await Taxonomy.findOne({ taxonomyId });
  }

  async getTaxonomyTree(type?: string): Promise<ITaxonomy[]> {
    try {
      const query = type ? { type, isActive: true, parentId: null } : { isActive: true, parentId: null };
      return await Taxonomy.find(query).sort({ name: 1 });
    } catch (error) {
      logger.error('Failed to get taxonomy tree', { error });
      throw error;
    }
  }

  async createTag(input: CreateTagInput): Promise<ITag> {
    try {
      const tagId = `tag-${uuidv4()}`;
      const slug = input.name.toLowerCase().replace(/\s+/g, '-');

      const tag = new Tag({
        tagId,
        name: input.name,
        slug,
        type: input.type || 'content',
        category: input.category,
        color: input.color,
        synonyms: input.synonyms || []
      });

      await tag.save();
      logger.info('Tag created', { tagId, name: input.name });
      return tag;
    } catch (error) {
      logger.error('Failed to create tag', { error, input });
      throw error;
    }
  }

  async findAllTags(type?: string): Promise<ITag[]> {
    try {
      const query = type ? { type, isActive: true } : { isActive: true };
      return await Tag.find(query).sort({ contentCount: -1, name: 1 });
    } catch (error) {
      logger.error('Failed to list tags', { error });
      throw error;
    }
  }

  async createCategory(input: {
    name: string;
    description?: string;
    parentId?: string;
    order?: number;
    icon?: string;
    image?: string;
  }): Promise<ICategory> {
    try {
      const categoryId = `cat-${uuidv4()}`;
      const slug = input.name.toLowerCase().replace(/\s+/g, '-');

      let path = `/${slug}`;
      let depth = 0;

      if (input.parentId) {
        const parent = await Category.findOne({ categoryId: input.parentId });
        if (parent) {
          path = `${parent.path}/${slug}`;
          depth = parent.depth + 1;
        }
      }

      const category = new Category({
        categoryId,
        name: input.name,
        slug,
        description: input.description,
        parentId: input.parentId,
        path,
        depth,
        order: input.order || 0,
        icon: input.icon,
        image: input.image
      });

      await category.save();
      logger.info('Category created', { categoryId, name: input.name });
      return category;
    } catch (error) {
      logger.error('Failed to create category', { error, input });
      throw error;
    }
  }

  async findAllCategories(parentId?: string): Promise<ICategory[]> {
    try {
      const query = parentId ? { parentId, isActive: true } : { isActive: true, parentId: null };
      return await Category.find(query).sort({ order: 1, name: 1 });
    } catch (error) {
      logger.error('Failed to list categories', { error });
      throw error;
    }
  }

  private async updateTaxonomyMetrics(): Promise<void> {
    try {
      const counts = await Taxonomy.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
      counts.forEach(({ _id, count }) => taxonomyEntriesGauge.labels(_id).set(count));
    } catch (error) {
      logger.error('Failed to update taxonomy metrics', { error });
    }
  }
}

export const taxonomyService = new TaxonomyService();