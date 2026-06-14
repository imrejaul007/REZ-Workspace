import { v4 as uuidv4 } from 'uuid';
import * as Diff from 'diff';
import { ContentVersion, ContentChange, ChangeType, VersionDiff, CreateVersionSchema } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('VersionService');

// In-memory storage
const versions: Map<string, ContentVersion> = new Map();
const versionsByContent: Map<string, ContentVersion[]> = new Map();

export class VersionService {
  // Generate diff between two texts
  private generateChanges(oldContent: string, newContent: string): ContentChange[] {
    const changes: ContentChange[] = [];
    const diffs = Diff.diffWords(oldContent, newContent);

    let position = 0;
    for (const part of diffs) {
      if (part.added) {
        changes.push({
          path: `content[${position}]`,
          type: 'added',
          newValue: part.value,
        });
      } else if (part.removed) {
        changes.push({
          path: `content[${position}]`,
          type: 'removed',
          oldValue: part.value,
        });
      }
      position += part.value.length;
    }

    return changes;
  }

  async createVersion(
    tenantId: string,
    contentItemId: string,
    userId: string,
    data: unknown
  ): Promise<ContentVersion> {
    const parsed = CreateVersionSchema.parse(data);

    // Get existing versions to determine version number
    const existingVersions = await this.findByContentItem(tenantId, contentItemId);
    const maxVersion = existingVersions.length > 0
      ? Math.max(...existingVersions.map(v => v.versionNumber))
      : 0;

    // Get the previous version's content for diff
    const previousVersion = existingVersions.find(v => v.versionNumber === maxVersion);
    const oldContent = previousVersion?.content || '';

    // Generate changes
    const changes = this.generateChanges(oldContent, parsed.content);

    const version: ContentVersion = {
      id: uuidv4(),
      contentItemId,
      tenantId,
      versionNumber: maxVersion + 1,
      content: parsed.content,
      title: parsed.title || '',
      changeType: parsed.changeType,
      changes,
      createdBy: userId,
      createdAt: new Date(),
      message: parsed.message,
    };

    versions.set(version.id, version);

    // Add to content's version list
    const contentVersions = versionsByContent.get(contentItemId) || [];
    contentVersions.push(version);
    versionsByContent.set(contentItemId, contentVersions);

    logger.info('Version created', {
      versionId: version.id,
      contentItemId,
      tenantId,
      versionNumber: version.versionNumber,
    });

    return version;
  }

  async findById(tenantId: string, id: string): Promise<ContentVersion | null> {
    const version = versions.get(id);
    if (!version || version.tenantId !== tenantId) {
      return null;
    }
    return version;
  }

  async findByContentItem(tenantId: string, contentItemId: string): Promise<ContentVersion[]> {
    const contentVersions = versionsByContent.get(contentItemId) || [];
    return contentVersions
      .filter(v => v.tenantId === tenantId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async findByVersionNumber(tenantId: string, contentItemId: string, versionNumber: number): Promise<ContentVersion | null> {
    const versions = await this.findByContentItem(tenantId, contentItemId);
    return versions.find(v => v.versionNumber === versionNumber) || null;
  }

  async getLatestVersion(tenantId: string, contentItemId: string): Promise<ContentVersion | null> {
    const versions = await this.findByContentItem(tenantId, contentItemId);
    return versions[0] || null;
  }

  async getVersionCount(tenantId: string, contentItemId: string): Promise<number> {
    const versions = await this.findByContentItem(tenantId, contentItemId);
    return versions.length;
  }

  async compareVersions(
    tenantId: string,
    contentItemId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<VersionDiff | null> {
    const from = await this.findByVersionNumber(tenantId, contentItemId, fromVersion);
    const to = await this.findByVersionNumber(tenantId, contentItemId, toVersion);

    if (!from || !to) {
      return null;
    }

    const changes = this.generateChanges(from.content, to.content);

    return {
      fromVersion: from.versionNumber,
      toVersion: to.versionNumber,
      changes,
      summary: {
        additions: changes.filter(c => c.type === 'added').length,
        deletions: changes.filter(c => c.type === 'removed').length,
        modifications: changes.filter(c => c.type === 'modified').length,
      },
    };
  }

  async restoreVersion(
    tenantId: string,
    contentItemId: string,
    versionNumber: number,
    userId: string
  ): Promise<ContentVersion | null> {
    const versionToRestore = await this.findByVersionNumber(tenantId, contentItemId, versionNumber);
    if (!versionToRestore) {
      return null;
    }

    // Create a new version that restores the old content
    return this.createVersion(tenantId, contentItemId, userId, {
      content: versionToRestore.content,
      title: versionToRestore.title,
      changeType: 'restore',
      message: `Restored from version ${versionNumber}`,
    });
  }

  async deleteVersionsBefore(tenantId: string, contentItemId: string, beforeVersion: number): Promise<number> {
    const contentVersions = versionsByContent.get(contentItemId) || [];
    const toDelete = contentVersions.filter(
      v => v.tenantId === tenantId && v.versionNumber < beforeVersion
    );

    for (const version of toDelete) {
      versions.delete(version.id);
    }

    const remaining = contentVersions.filter(
      v => !(v.tenantId === tenantId && v.versionNumber < beforeVersion)
    );
    versionsByContent.set(contentItemId, remaining);

    logger.info('Old versions deleted', {
      contentItemId,
      tenantId,
      deletedCount: toDelete.length,
    });

    return toDelete.length;
  }
}

export const versionService = new VersionService();
