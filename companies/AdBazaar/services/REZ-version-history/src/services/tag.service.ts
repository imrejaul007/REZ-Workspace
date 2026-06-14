import { v4 as uuidv4 } from 'uuid';
import { VersionTag, CreateTagSchema } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('TagService');

// In-memory storage
const tags: Map<string, VersionTag> = new Map();
const tagsByContent: Map<string, VersionTag[]> = new Map();

export class TagService {
  async create(
    contentItemId: string,
    versionId: string,
    createdBy: string,
    data: unknown
  ): Promise<VersionTag> {
    const parsed = CreateTagSchema.parse(data);

    // Check if tag with same name already exists for this content
    const existingTags = tagsByContent.get(contentItemId) || [];
    const duplicateName = existingTags.find(t => t.name === parsed.name);
    if (duplicateName) {
      throw new Error(`Tag '${parsed.name}' already exists for this content`);
    }

    const tag: VersionTag = {
      id: uuidv4(),
      contentItemId,
      versionId,
      name: parsed.name,
      description: parsed.description,
      createdBy,
      createdAt: new Date(),
    };

    tags.set(tag.id, tag);

    const contentTags = tagsByContent.get(contentItemId) || [];
    contentTags.push(tag);
    tagsByContent.set(contentItemId, contentTags);

    logger.info('Tag created', { tagId: tag.id, contentItemId, name: tag.name });

    return tag;
  }

  async findById(id: string): Promise<VersionTag | null> {
    return tags.get(id) || null;
  }

  async findByContentItem(contentItemId: string): Promise<VersionTag[]> {
    const contentTags = tagsByContent.get(contentItemId) || [];
    return contentTags.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByVersion(contentItemId: string, versionId: string): Promise<VersionTag[]> {
    const contentTags = tagsByContent.get(contentItemId) || [];
    return contentTags.filter(t => t.versionId === versionId);
  }

  async delete(id: string): Promise<boolean> {
    const tag = tags.get(id);
    if (!tag) {
      return false;
    }

    tags.delete(id);

    const contentTags = tagsByContent.get(tag.contentItemId) || [];
    const remaining = contentTags.filter(t => t.id !== id);
    tagsByContent.set(tag.contentItemId, remaining);

    logger.info('Tag deleted', { tagId: id });

    return true;
  }

  async updateDescription(id: string, description: string): Promise<VersionTag | null> {
    const tag = tags.get(id);
    if (!tag) {
      return null;
    }

    tag.description = description;
    tags.set(id, tag);

    logger.info('Tag description updated', { tagId: id });

    return tag;
  }
}

export const tagService = new TagService();
