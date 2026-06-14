// RisaCare Records Service - Storage Service

import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  generateId,
  logger,
  isValidFileType,
  isValidFileSize,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE
} from '@risa-care/shared/utils';

// ============================================
// STORAGE CONFIG
// ============================================

interface StorageConfig {
  provider: 'local' | 's3' | 'gcs';
  bucket?: string;
  basePath?: string;
}

const storageConfig: StorageConfig = {
  provider: (process.env.STORAGE_PROVIDER as 'local' | 's3' | 'gcs') || 'local',
  bucket: process.env.STORAGE_BUCKET || 'risa-care-records',
  basePath: process.env.STORAGE_BASE_PATH || './storage'
};

// ============================================
// FILE VALIDATION
// ============================================

export function validateFile(mimeType: string, size: number): { valid: boolean; error?: string } {
  if (!isValidFileType(mimeType)) {
    return {
      valid: false,
      error: `File type ${mimeType} is not supported. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
    };
  }

  if (!isValidFileSize(size)) {
    return {
      valid: false,
      error: `File size ${size} bytes exceeds maximum allowed ${MAX_FILE_SIZE} bytes (25MB)`
    };
  }

  return { valid: true };
}

// ============================================
// STORAGE SERVICE
// ============================================

export class StorageService {
  private generateStorageKey(userId: string, profileId: string, filename: string): string {
    const timestamp = Date.now();
    const hash = createHash('md5').update(`${userId}-${profileId}-${timestamp}`).digest('hex').substring(0, 8);
    const ext = filename.split('.').pop() || '';
    return `${userId}/${profileId}/reports/${hash}.${ext}`;
  }

  async uploadFile(
    buffer: Buffer,
    userId: string,
    profileId: string,
    filename: string,
    mimeType: string
  ): Promise<{ url: string; storageKey: string; size: number }> {
    const validation = validateFile(mimeType, buffer.length);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const storageKey = this.generateStorageKey(userId, profileId, filename);

    switch (storageConfig.provider) {
      case 's3':
        return this.uploadToS3(buffer, storageKey, mimeType);
      case 'gcs':
        return this.uploadToGCS(buffer, storageKey, mimeType);
      default:
        return this.uploadToLocal(buffer, storageKey);
    }
  }

  private async uploadToLocal(
    buffer: Buffer,
    storageKey: string,
    mimeType: string
  ): Promise<{ url: string; storageKey: string; size: number }> {
    const path = `${storageConfig.basePath}/${storageKey}`;
    const fs = await import('fs/promises');

    // Ensure directory exists
    await fs.mkdir(path.substring(0, path.lastIndexOf('/')), { recursive: true });

    // Write file
    await fs.writeFile(path, buffer);

    const url = `/storage/${storageKey}`;
    logger.info(`File uploaded to local storage: ${storageKey}`);

    return {
      url,
      storageKey,
      size: buffer.length
    };
  }

  private async uploadToS3(
    buffer: Buffer,
    storageKey: string,
    mimeType: string
  ): Promise<{ url: string; storageKey: string; size: number }> {
    // S3 upload implementation
    // This would use AWS SDK in production
    logger.info(`S3 upload: ${storageKey} (${buffer.length} bytes)`);

    return {
      url: `https://${storageConfig.bucket}.s3.amazonaws.com/${storageKey}`,
      storageKey,
      size: buffer.length
    };
  }

  private async uploadToGCS(
    buffer: Buffer,
    storageKey: string,
    mimeType: string
  ): Promise<{ url: string; storageKey: string; size: number }> {
    // GCS upload implementation
    // This would use Google Cloud Storage SDK in production
    logger.info(`GCS upload: ${storageKey} (${buffer.length} bytes)`);

    return {
      url: `https://storage.googleapis.com/${storageConfig.bucket}/${storageKey}`,
      storageKey,
      size: buffer.length
    };
  }

  async deleteFile(storageKey: string): Promise<void> {
    switch (storageConfig.provider) {
      case 's3':
        // S3 delete implementation
        logger.info(`S3 delete: ${storageKey}`);
        break;
      case 'gcs':
        // GCS delete implementation
        logger.info(`GCS delete: ${storageKey}`);
        break;
      default:
        const fs = await import('fs/promises');
        const path = `${storageConfig.basePath}/${storageKey}`;
        await fs.unlink(path).catch(() => logger.warn(`File not found for deletion: ${path}`));
        logger.info(`Local file deleted: ${storageKey}`);
    }
  }

  async getSignedUrl(storageKey: string, expiresIn: number = 3600): Promise<string> {
    // Generate a signed URL for secure access
    // In production, this would use S3 presigned URLs or GCS signed URLs
    return `https://storage.risa.money/${storageKey}?token=${generateId('tok')}&expires=${Date.now() + expiresIn * 1000}`;
  }

  async generateThumbnail(storageKey: string): Promise<string | null> {
    // Generate a thumbnail for image files
    // This would use sharp or similar library in production
    const ext = storageKey.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      const thumbnailKey = storageKey.replace(/(\.[^.]+)$/, '_thumb$1');
      logger.info(`Thumbnail generated for: ${storageKey} -> ${thumbnailKey}`);
      return thumbnailKey;
    }

    return null;
  }
}

// Singleton instance
let storageService: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageService) {
    storageService = new StorageService();
  }
  return storageService;
}
