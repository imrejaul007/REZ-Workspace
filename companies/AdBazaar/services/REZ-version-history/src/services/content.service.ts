import { v4 as uuidv4 } from 'uuid';
import { ContentItem, EntityType, CreateContentSchema, UpdateContentSchema } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('ContentService');

// In-memory storage
const contentItems: Map<string, ContentItem> = new Map();

export class ContentService {
  async create(tenantId: string, data: unknown): Promise<ContentItem> {
    const parsed = CreateContentSchema.parse(data);

    const item: ContentItem = {
      id: uuidv4(),
      tenantId,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      title: parsed.title,
      currentContent: parsed.content,
      metadata: parsed.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    contentItems.set(item.id, item);
    logger.info('Content item created', { contentId: item.id, tenantId, entityType: item.entityType });

    return item;
  }

  async findById(tenantId: string, id: string): Promise<ContentItem | null> {
    const item = contentItems.get(id);
    if (!item || item.tenantId !== tenantId) {
      return null;
    }
    return item;
  }

  async findByEntity(tenantId: string, entityType: EntityType, entityId: string): Promise<ContentItem | null> {
    const item = Array.from(contentItems.values()).find(
      c => c.tenantId === tenantId && c.entityType === entityType && c.entityId === entityId
    );
    return item || null;
  }

  async findAll(tenantId: string, options?: {
    entityType?: EntityType;
    limit?: number;
    offset?: number;
  }): Promise<ContentItem[]> {
    let result = Array.from(contentItems.values())
      .filter(c => c.tenantId === tenantId);

    if (options?.entityType) {
      result = result.filter(c => c.entityType === options.entityType);
    }

    result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    if (options?.offset) {
      result = result.slice(options.offset);
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  async update(tenantId: string, id: string, data: unknown): Promise<ContentItem | null> {
    const existing = contentItems.get(id);
    if (!existing || existing.tenantId !== tenantId) {
      return null;
    }

    const parsed = UpdateContentSchema.parse(data);

    const updated: ContentItem = {
      ...existing,
      title: parsed.title ?? existing.title,
      currentContent: parsed.content ?? existing.currentContent,
      metadata: parsed.metadata ? { ...existing.metadata, ...parsed.metadata } : existing.metadata,
      updatedAt: new Date(),
    };

    contentItems.set(id, updated);
    logger.info('Content item updated', { contentId: id, tenantId });

    return updated;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const item = contentItems.get(id);
    if (!item || item.tenantId !== tenantId) {
      return false;
    }

    const deleted = contentItems.delete(id);
    if (deleted) {
      logger.info('Content item deleted', { contentId: id, tenantId });
    }
    return deleted;
  }

  async updateContent(tenantId: string, id: string, content: string, title?: string): Promise<ContentItem | null> {
    return this.update(tenantId, id, { content, title });
  }
}

export const contentService = new ContentService();
