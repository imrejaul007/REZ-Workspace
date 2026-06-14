// RisaCare Records Service - Record Controller

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getRecordService } from '../services/recordService';
import { getStorageService } from '../services/storageService';
import { getOCRService } from '../services/ocrService';
import {
  HealthDocumentTypeSchema,
  HealthCategorySchema,
  PaginationQuerySchema,
  ApiResponse,
  PaginationMeta
} from '@risa-care/shared/types';
import { RisaCareError } from '@risa-care/shared/errors';
import { logger, now } from '@risa-care/shared/utils';
import { EVENT_TYPES, RecordUploadedEventSchema } from '@risa-care/shared/events';

// ============================================
// REQUEST SCHEMAS
// ============================================

const UploadRecordSchema = z.object({
  profileId: z.string().uuid(),
  type: HealthDocumentTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional()
});

const GetRecordsQuerySchema = PaginationQuerySchema.extend({
  profileId: z.string().uuid().optional(),
  type: HealthDocumentTypeSchema.optional(),
  category: HealthCategorySchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().max(100).optional()
});

const GetTimelineQuerySchema = PaginationQuerySchema.extend({
  profileId: z.string().uuid().optional(),
  types: z.string().optional(),
  categories: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

const ShareRecordSchema = z.object({
  entityType: z.enum(['doctor', 'lab', 'hospital']),
  entityId: z.string().min(1),
  expiresInDays: z.number().int().min(1).max(365).optional(),
  accessScope: z.enum(['full', 'summary']).default('summary')
});

// ============================================
// CONTROLLER
// ============================================

export class RecordController {
  private recordService = getRecordService();
  private storageService = getStorageService();
  private ocrService = getOCRService();

  async uploadRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
        });
        return;
      }

      // Validate body
      const bodyValidation = UploadRecordSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: bodyValidation.error.flatten()
          }
        });
        return;
      }

      const { profileId, type, title, description } = bodyValidation.data;

      // Handle file upload
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { code: 'FILE_REQUIRED', message: 'No file uploaded' }
        });
        return;
      }

      const file = req.file;

      // Upload to storage
      const { url, storageKey } = await this.storageService.uploadFile(
        file.buffer,
        userId,
        profileId,
        file.originalname,
        file.mimetype
      );

      // Create record
      const record = await this.recordService.createRecord({
        userId,
        profileId,
        type,
        title,
        description,
        file: {
          url,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          storageKey
        }
      });

      // Start OCR processing asynchronously
      this.processRecordAsync(record.id, record.userId, profileId, file.buffer, file.mimetype, type);

      logger.info(`Record uploaded: ${record.id}`, { userId, profileId });

      res.status(201).json({
        success: true,
        data: record,
        meta: {
          requestId: req.requestId,
          timestamp: now()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  private async processRecordAsync(
    recordId: string,
    userId: string,
    profileId: string,
    fileBuffer: Buffer,
    mimeType: string,
    documentType: string
  ): Promise<void> {
    try {
      // Update status to processing
      await this.recordService.updateProcessingStatus(recordId, 'processing');

      // OCR
      const ocrResult = await this.ocrService.processDocument(recordId, fileBuffer, mimeType, documentType);

      // Update OCR status
      await this.recordService.updateProcessingStatus(recordId, 'processing', {
        ocrStatus: 'completed'
      });

      // Extract structured data
      const extractionResult = await this.ocrService.extractStructuredData(
        recordId,
        ocrResult.text,
        documentType
      );

      // Update record with extracted data
      await this.recordService.updateExtractedData(recordId, {
        date: extractionResult.date,
        doctorName: extractionResult.doctorName,
        hospitalName: extractionResult.hospitalName,
        labName: extractionResult.labName,
        biomarkers: extractionResult.biomarkers,
        diagnosis: extractionResult.diagnosis,
        medications: extractionResult.medications,
        rawText: extractionResult.rawText,
        ocrConfidence: ocrResult.confidence,
        aiConfidence: extractionResult.confidence
      });

      // Categorize
      const categorization = this.ocrService.categorizeDocument(
        extractionResult.rawText,
        documentType
      );

      await this.recordService.updateCategorization(recordId, {
        category: categorization.category as any,
        tags: categorization.tags,
        isAbnormal: categorization.isAbnormal,
        abnormalBiomarkers: categorization.abnormalBiomarkers
      });

      logger.info(`Record processing completed: ${recordId}`);
    } catch (error) {
      logger.error(`Record processing failed: ${recordId}`, error as Error);
      await this.recordService.updateProcessingStatus(recordId, 'failed', {
        error: (error as Error).message
      });
    }
  }

  async getRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const record = await this.recordService.getRecord(id, userId);

      res.json({
        success: true,
        data: record,
        meta: { requestId: req.requestId, timestamp: now() }
      });
    } catch (error) {
      next(error);
    }
  }

  async listRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;

      const queryValidation = GetRecordsQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryValidation.error.flatten()
          }
        });
        return;
      }

      const query = queryValidation.data;

      const { records, total } = await this.recordService.listRecords({
        userId,
        profileId: query.profileId,
        type: query.type,
        category: query.category,
        startDate: query.startDate,
        endDate: query.endDate,
        search: query.search,
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      });

      res.json({
        success: true,
        data: records,
        meta: {
          ...PaginationMeta(total, query.page, query.limit),
          requestId: req.requestId,
          timestamp: now()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Get record first for cleanup
      const record = await this.recordService.getRecord(id, userId);

      // Delete from storage
      await this.storageService.deleteFile(record.file.storageKey);

      // Delete from database
      await this.recordService.deleteRecord(id, userId);

      logger.info(`Record deleted: ${id}`, { userId });

      res.json({
        success: true,
        data: { deleted: true, recordId: id },
        meta: { requestId: req.requestId, timestamp: now() }
      });
    } catch (error) {
      next(error);
    }
  }

  async getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;

      const queryValidation = GetTimelineQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters'
          }
        });
        return;
      }

      const query = queryValidation.data;

      // For now, return records as timeline events
      const { records, total } = await this.recordService.listRecords({
        userId,
        profileId: query.profileId,
        startDate: query.startDate,
        endDate: query.endDate,
        limit: query.limit || 50,
        offset: (query.page - 1) * (query.limit || 50)
      });

      // Transform to timeline format
      const timeline = records.map(record => ({
        id: `evt_${record.id}`,
        date: record.extracted?.date || record.createdAt,
        type: 'record_uploaded' as const,
        title: record.title,
        description: record.description,
        category: record.category,
        relatedRecordId: record.id,
        isAbnormal: record.isAbnormal,
        metadata: {
          type: record.type,
          labName: record.extracted?.labName,
          doctorName: record.extracted?.doctorName
        }
      }));

      res.json({
        success: true,
        data: timeline,
        meta: {
          ...PaginationMeta(total, query.page, query.limit || 50),
          requestId: req.requestId,
          timestamp: now()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async shareRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const bodyValidation = ShareRecordSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body'
          }
        });
        return;
      }

      const { entityType, entityId, expiresInDays, accessScope } = bodyValidation.data;

      // Calculate expiration
      let expiresAt: string | undefined;
      if (expiresInDays) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + expiresInDays);
        expiresAt = expDate.toISOString();
      }

      await this.recordService.shareRecord(id, userId, {
        entityType,
        entityId,
        expiresAt,
        consentId: `consent_${Date.now()}`
      });

      logger.info(`Record ${id} shared with ${entityType} ${entityId}`, { userId });

      res.json({
        success: true,
        data: {
          shared: true,
          recordId: id,
          entityType,
          entityId,
          expiresAt
        },
        meta: { requestId: req.requestId, timestamp: now() }
      });
    } catch (error) {
      next(error);
    }
  }

  async getBiomarkerHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { biomarkerName } = req.params;
      const profileId = req.query.profileId as string;

      if (!profileId) {
        res.status(400).json({
          success: false,
          error: { code: 'PROFILE_ID_REQUIRED', message: 'profileId query parameter is required' }
        });
        return;
      }

      const history = await this.recordService.getBiomarkerHistory(profileId, biomarkerName);

      res.json({
        success: true,
        data: {
          biomarker: biomarkerName,
          profileId,
          values: history
        },
        meta: { requestId: req.requestId, timestamp: now() }
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton
export const recordController = new RecordController();
