import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RezClientModule } from '@restopapa/rez-client';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { FileStorageService } from './file-storage.service';
import { ShiftSyncService } from './shift-sync.service';
import { ShiftWebhookController } from './shift-webhook.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    RezClientModule,
    MulterModule.register({
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        // File type validation
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/gif'
        ];

        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      }
    })
  ],
  controllers: [JobsController, ShiftWebhookController],
  providers: [JobsService, FileStorageService, ShiftSyncService],
  exports: [JobsService, FileStorageService, ShiftSyncService]
})
export class JobsModule {}
