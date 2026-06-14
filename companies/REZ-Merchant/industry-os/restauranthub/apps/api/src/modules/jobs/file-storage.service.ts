import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export interface UploadResult {
  filename: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
}

@Injectable()
export class FileStorageService {
  private readonly baseUploadPath: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUploadPath = this.configService.get('UPLOAD_PATH', './uploads');
    this.baseUrl = this.configService.get('BASE_URL', 'http://localhost:3001');
  }

  async uploadFile(
    file: Express.Multer.File,
    subfolder: string,
    allowedTypes: string[],
    maxSize: number
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Supported types: ${allowedTypes.join(', ')}`
      );
    }

    // Validate file size
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`
      );
    }

    // Generate unique filename — derive extension from the validated MIME type,
    // not from the original filename, to prevent directory-traversal attacks.
    const timestamp = Date.now();
    const randomId = randomUUID().replace(/-/g, '').slice(0, 12);
    const mimeToExt: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    const extension = mimeToExt[file.mimetype] ?? 'bin';
    const sanitizedName = file.originalname
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9]/g, '_') // Replace special chars
      .substring(0, 50); // Limit length

    const filename = `${sanitizedName}_${timestamp}_${randomId}.${extension}`;
    // Guard against path traversal in the subfolder argument itself
    const safeSubfolder = subfolder.replace(/[^a-zA-Z0-9_-]/g, '');
    const uploadDir = join(this.baseUploadPath, safeSubfolder);
    const filePath = join(uploadDir, filename);

    try {
      // Ensure upload directory exists
      await fs.mkdir(uploadDir, { recursive: true });

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);

      const result: UploadResult = {
        filename,
        path: filePath,
        url: `${this.baseUrl}/uploads/${safeSubfolder}/${filename}`,
        size: file.size,
        mimetype: file.mimetype
      };

      return result;
    } catch (error) {
      throw new BadRequestException(`Failed to save file: ${(error as unknown).message}`);
    }
  }

  async uploadResume(file: Express.Multer.File): Promise<UploadResult> {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const maxSize = 5 * 1024 * 1024; // 5MB

    return this.uploadFile(file, 'resumes', allowedTypes, maxSize);
  }

  async uploadJobAttachment(file: Express.Multer.File): Promise<UploadResult> {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    return this.uploadFile(file, 'job-attachments', allowedTypes, maxSize);
  }

  async uploadProfileImage(file: Express.Multer.File): Promise<UploadResult> {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    const maxSize = 2 * 1024 * 1024; // 2MB

    return this.uploadFile(file, 'profiles', allowedTypes, maxSize);
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  getFileUrl(filename: string, subfolder: string): string {
    return `${this.baseUrl}/uploads/${subfolder}/${filename}`;
  }

  validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimetype);
  }

  validateFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }

  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 100);
  }
}