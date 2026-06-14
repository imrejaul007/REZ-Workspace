/**
 * REZ Forms - File Upload Service
 * Handle file uploads for form submissions
 */

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface UploadConfig {
  maxSize: number; // in MB
  allowedTypes: string[];
  uploadDir: string;
}

// Default config
const defaultConfig: UploadConfig = {
  maxSize: 10, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/zip',
  ],
  uploadDir: process.env.UPLOAD_DIR || './uploads',
};

/**
 * Initialize upload directory
 */
export async function initUploadDir(config: UploadConfig = defaultConfig): Promise<void> {
  try {
    await fs.mkdir(config.uploadDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
  }
}

/**
 * Validate file
 */
export function validateFile(
  file: { mimetype: string; size: number },
  config: UploadConfig = defaultConfig
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > config.maxSize * 1024 * 1024) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${config.maxSize}MB`,
    };
  }

  // Check file type
  if (!config.allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Generate unique filename
 */
function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const id = uuidv4();
  const timestamp = Date.now();
  return `${id}-${timestamp}${ext}`;
}

/**
 * Upload file from buffer
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  config: UploadConfig = defaultConfig
): Promise<UploadedFile> {
  // Validate
  const validation = validateFile({ mimetype: mimeType, size: buffer.length }, config);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate filename and path
  const filename = generateFilename(originalName);
  const filePath = path.join(config.uploadDir, filename);

  // Ensure directory exists
  await fs.mkdir(config.uploadDir, { recursive: true });

  // Write file
  await fs.writeFile(filePath, buffer);

  // Generate URL (in production, this would be a CDN URL)
  const baseUrl = process.env.FILE_BASE_URL || 'https://files.rez.money';
  const url = `${baseUrl}/uploads/${filename}`;

  return {
    id: uuidv4(),
    filename,
    originalName,
    mimeType,
    size: buffer.length,
    url,
    uploadedAt: new Date(),
  };
}

/**
 * Delete uploaded file
 */
export async function deleteFile(filename: string, config: UploadConfig = defaultConfig): Promise<boolean> {
  try {
    const filePath = path.join(config.uploadDir, filename);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

/**
 * Get file info
 */
export async function getFileInfo(filename: string, config: UploadConfig = defaultConfig): Promise<UploadedFile | null> {
  try {
    const filePath = path.join(config.uploadDir, filename);
    const stats = await fs.stat(filePath);

    const baseUrl = process.env.FILE_BASE_URL || 'https://files.rez.money';
    const url = `${baseUrl}/uploads/${filename}`;

    return {
      id: uuidv4(),
      filename,
      originalName: filename,
      mimeType: getMimeType(filename),
      size: stats.size,
      url,
      uploadedAt: stats.birthtime,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
    '.zip': 'application/zip',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Clean up old files (run periodically)
 */
export async function cleanupOldFiles(daysOld: number = 7, config: UploadConfig = defaultConfig): Promise<number> {
  let deletedCount = 0;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    const files = await fs.readdir(config.uploadDir);

    for (const file of files) {
      const filePath = path.join(config.uploadDir, file);
      const stats = await fs.stat(filePath);

      if (stats.birthtime < cutoffDate) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }

  return deletedCount;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}