import crypto from 'crypto-js';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { DataUpload, IDataUpload } from '../models';
import { UploadDataRequest, DataFormat, HashAlgorithm, IdentifierType } from '../types';
import logger from '../config/logger';

export class DataIngestionService {
  /**
   * Hash a value using the specified algorithm
   */
  private hashValue(value: string, algorithm: HashAlgorithm): string {
    const normalized = value.toLowerCase().trim();

    switch (algorithm) {
      case 'SHA256':
        return crypto.SHA256(normalized).toString();
      case 'SHA1':
        return crypto.SHA1(normalized).toString();
      case 'MD5':
        return crypto.MD5(normalized).toString();
      default:
        return crypto.SHA256(normalized).toString();
    }
  }

  /**
   * Parse data based on format
   */
  private parseData(data: string, format: DataFormat): Array<Record<string, string>> {
    try {
      switch (format) {
        case 'csv':
        case 'tsv':
          return parse(data, {
            columns: true,
            skip_empty_lines: true,
            delimiter: format === 'tsv' ? '\t' : ',',
          });

        case 'json':
          const parsed = JSON.parse(data);
          return Array.isArray(parsed) ? parsed : [parsed];

        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      logger.error('Data parsing failed', { error });
      throw new Error('Failed to parse data format');
    }
  }

  /**
   * Extract identifiers from parsed data
   */
  private extractIdentifiers(
    records: Array<Record<string, string>>,
    identifierConfig: Array<{ type: IdentifierType; column?: string }>,
    hashAlgorithm: HashAlgorithm
  ): Array<{
    identifier: string;
    identifierType: IdentifierType;
    hashedValue: string;
    segment?: string;
  }> {
    const results: Array<{
      identifier: string;
      identifierType: IdentifierType;
      hashedValue: string;
      segment?: string;
    }> = [];

    for (const record of records) {
      for (const config of identifierConfig) {
        const value = config.column ? record[config.column] : record[config.type];

        if (value && value.trim()) {
          results.push({
            identifier: value,
            identifierType: config.type,
            hashedValue: this.hashValue(value, hashAlgorithm),
            segment: record.segment || record.segment_name || record['segment-name'],
          });
        }
      }
    }

    return results;
  }

  /**
   * Upload and process brand data
   */
  async uploadData(request: UploadDataRequest): Promise<IDataUpload> {
    const startTime = Date.now();
    logger.info('Starting data upload', {
      brandId: request.brandId,
      dataFormat: request.dataFormat,
    });

    try {
      // Generate upload ID
      const uploadId = uuidv4();

      // Parse the data
      const parsedRecords = this.parseData(request.data, request.dataFormat);

      // Extract identifiers and hash them
      const processedRecords = this.extractIdentifiers(
        parsedRecords,
        request.identifiers,
        request.hashAlgorithm || 'SHA256'
      );

      // Extract unique segments
      const segments = [...new Set(
        processedRecords
          .map(r => r.segment)
          .filter((s): s is string => !!s)
      )];

      // Create upload record
      const upload = new DataUpload({
        uploadId,
        brandId: request.brandId,
        campaignId: request.campaignId,
        dataFormat: request.dataFormat,
        hashAlgorithm: request.hashAlgorithm || 'SHA256',
        identifiers: request.identifiers,
        recordCount: parsedRecords.length,
        processedCount: processedRecords.length,
        hashedCount: processedRecords.length,
        status: 'completed',
        segments,
        metadata: {
          name: request.metadata.name,
          description: request.metadata.description,
          uploadedAt: new Date(),
          fileSize: Buffer.byteLength(request.data, 'utf8'),
        },
        records: processedRecords.map(r => ({
          identifier: r.identifier,
          identifierType: r.identifierType,
          hashedValue: r.hashedValue,
          segment: r.segment,
        })),
      });

      await upload.save();

      const processingTime = Date.now() - startTime;
      logger.info('Data upload completed', {
        uploadId,
        brandId: request.brandId,
        recordCount: parsedRecords.length,
        processingTimeMs: processingTime,
      });

      return upload;
    } catch (error) {
      logger.error('Data upload failed', {
        brandId: request.brandId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get upload by ID
   */
  async getUpload(uploadId: string): Promise<IDataUpload | null> {
    return DataUpload.findOne({ uploadId });
  }

  /**
   * Get uploads by brand ID
   */
  async getUploadsByBrand(brandId: string, limit = 50): Promise<IDataUpload[]> {
    return DataUpload.find({ brandId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Delete upload
   */
  async deleteUpload(uploadId: string): Promise<boolean> {
    const result = await DataUpload.deleteOne({ uploadId });
    return result.deletedCount > 0;
  }

  /**
   * Get upload statistics
   */
  async getUploadStats(brandId: string): Promise<{
    totalUploads: number;
    totalRecords: number;
    averageMatchRate: number;
  }> {
    const stats = await DataUpload.aggregate([
      { $match: { brandId } },
      {
        $group: {
          _id: null,
          totalUploads: { $sum: 1 },
          totalRecords: { $sum: '$recordCount' },
        },
      },
    ]);

    return {
      totalUploads: stats[0]?.totalUploads || 0,
      totalRecords: stats[0]?.totalRecords || 0,
      averageMatchRate: 0, // Will be calculated from match jobs
    };
  }
}

export const dataIngestionService = new DataIngestionService();