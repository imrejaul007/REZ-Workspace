import { v4 as uuidv4 } from 'uuid';
import { PhotoCollection, CreateCollectionSchema, UpdateCollectionSchema } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('CollectionService');

// In-memory storage
const collections: Map<string, PhotoCollection> = new Map();

export class CollectionService {
  async create(tenantId: string, data: unknown): Promise<PhotoCollection> {
    const parsed = CreateCollectionSchema.parse(data);

    // Check for duplicate name within tenant
    const existing = Array.from(collections.values()).find(
      c => c.tenantId === tenantId && c.name === parsed.name
    );
    if (existing) {
      throw new Error(`Collection with name '${parsed.name}' already exists`);
    }

    const collection: PhotoCollection = {
      id: uuidv4(),
      tenantId,
      name: parsed.name,
      description: parsed.description,
      photoIds: parsed.photoIds,
      isPublic: parsed.isPublic,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    collections.set(collection.id, collection);
    logger.info('Collection created', { collectionId: collection.id, tenantId, name: collection.name });

    return collection;
  }

  async findById(tenantId: string, id: string): Promise<PhotoCollection | null> {
    const collection = collections.get(id);
    if (!collection || collection.tenantId !== tenantId) {
      return null;
    }
    return collection;
  }

  async findAll(tenantId: string): Promise<PhotoCollection[]> {
    return Array.from(collections.values())
      .filter(c => c.tenantId === tenantId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async findPublic(): Promise<PhotoCollection[]> {
    return Array.from(collections.values())
      .filter(c => c.isPublic)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async update(tenantId: string, id: string, data: unknown): Promise<PhotoCollection | null> {
    const existing = collections.get(id);
    if (!existing || existing.tenantId !== tenantId) {
      return null;
    }

    const parsed = UpdateCollectionSchema.parse(data);

    // Check for duplicate name if name is being updated
    if (parsed.name && parsed.name !== existing.name) {
      const existingByName = Array.from(collections.values()).find(
        c => c.tenantId === tenantId && c.name === parsed.name && c.id !== id
      );
      if (existingByName) {
        throw new Error(`Collection with name '${parsed.name}' already exists`);
      }
    }

    const updated: PhotoCollection = {
      ...existing,
      ...parsed,
      id: existing.id,
      tenantId: existing.tenantId,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };

    collections.set(id, updated);
    logger.info('Collection updated', { collectionId: id, tenantId });

    return updated;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const collection = collections.get(id);
    if (!collection || collection.tenantId !== tenantId) {
      return false;
    }

    const deleted = collections.delete(id);
    if (deleted) {
      logger.info('Collection deleted', { collectionId: id, tenantId });
    }
    return deleted;
  }

  async addPhoto(tenantId: string, collectionId: string, photoId: string): Promise<PhotoCollection | null> {
    const collection = collections.get(collectionId);
    if (!collection || collection.tenantId !== tenantId) {
      return null;
    }

    if (!collection.photoIds.includes(photoId)) {
      collection.photoIds.push(photoId);
      collection.updatedAt = new Date();
      collections.set(collectionId, collection);
      logger.info('Photo added to collection', { collectionId, photoId, tenantId });
    }

    return collection;
  }

  async removePhoto(tenantId: string, collectionId: string, photoId: string): Promise<PhotoCollection | null> {
    const collection = collections.get(collectionId);
    if (!collection || collection.tenantId !== tenantId) {
      return null;
    }

    collection.photoIds = collection.photoIds.filter(id => id !== photoId);
    collection.updatedAt = new Date();
    collections.set(collectionId, collection);
    logger.info('Photo removed from collection', { collectionId, photoId, tenantId });

    return collection;
  }

  async getPhotoIds(tenantId: string, collectionId: string): Promise<string[]> {
    const collection = await this.findById(tenantId, collectionId);
    return collection?.photoIds || [];
  }
}

export const collectionService = new CollectionService();
