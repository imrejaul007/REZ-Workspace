import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class UploadsService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
  }

  async uploadFile(file: Express.Multer.File, folder: string, userId: string) {
    try {
      this.validateFile(file, folder);

      const fileExtension = path.extname(file.originalname);
      const filename = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
      const key = `${folder}/${userId}/${filename}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      const url = `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;

      return { url, key, filename: file.originalname, size: file.size, mimeType: file.mimetype };
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  async uploadMultipleFiles(files: Express.Multer.File[], folder: string, userId: string) {
    return Promise.all(files.map(file => this.uploadFile(file, folder, userId)));
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({ Bucket: this.bucketName, Key: key });
      await this.s3Client.send(command);
    } catch (error) {
      throw new BadRequestException(`File deletion failed: ${error.message}`);
    }
  }

  private validateFile(file: Express.Multer.File, folder: string): void {
    const allowedTypes = {
      'profile-pictures': ['image/jpeg', 'image/png', 'image/webp'],
      'documents': ['application/pdf', 'image/jpeg', 'image/png'],
      'resumes': ['application/pdf', 'application/msword'],
      'restaurant-images': ['image/jpeg', 'image/png', 'image/webp'],
      'product-images': ['image/jpeg', 'image/png', 'image/webp'],
    }[folder] || ['image/jpeg', 'image/png', 'application/pdf'];

    const maxSizes = {
      'profile-pictures': 5 * 1024 * 1024, // 5MB
      'documents': 10 * 1024 * 1024, // 10MB
      'resumes': 5 * 1024 * 1024,
      'restaurant-images': 8 * 1024 * 1024,
      'product-images': 8 * 1024 * 1024,
    }[folder] || 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSizes) {
      throw new BadRequestException(`File too large. Max: ${maxSizes / 1024 / 1024}MB`);
    }
  }
}