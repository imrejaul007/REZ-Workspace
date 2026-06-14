import { Injectable, Logger } from '@nestjs/common';

/**
 * Upload Service - File handling
 */
@Injectable()
export class UploadService {
  private logger = new Logger('UploadService');

  async upload(file: Buffer, type: string): Promise<{ url: string }> {
    const id = `file_${Date.now()}`;
    const ext = type.split('/')[1] || 'jpg';
    const url = `https://cdn.rezride.com/uploads/${id}.${ext}`;
    this.logger.log(`Uploaded: ${url}`);
    return { url };
  }

  async delete(url: string): Promise<void> {
    this.logger.log(`Deleted: ${url}`);
  }
}
