import { v4 as uuidv4 } from 'uuid';
import { ConversionImport, OfflineConversion, IConversionImport } from '../models';
import { ImportConversionInput, CreateConversionInput } from '../utils/validation';
import { logger } from '../utils';
import { conversionImportTotal, conversionImportRecords } from '../utils/metrics';
import { databaseOperationDuration } from '../utils/metrics';

export class ImportService {
  /**
   * Create import record
   */
  async createImport(input: ImportConversionInput, importedBy?: string): Promise<IConversionImport> {
    const startTime = Date.now();

    try {
      const importRecord = new ConversionImport({
        fileId: uuidv4(),
        fileName: input.fileName,
        fileType: input.fileType,
        fileSize: input.fileSize,
        status: 'uploading',
        totalRecords: 0,
        processedRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        errors: [],
        campaignId: input.campaignId,
        importType: input.importType,
        source: input.source,
        importedBy
      });

      await importRecord.save();

      logger.info('Import record created', {
        fileId: importRecord.fileId,
        fileName: input.fileName,
        importedBy
      });

      return importRecord;
    } finally {
      databaseOperationDuration.observe({ operation: 'create', collection: 'imports' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Get import by ID
   */
  async getImport(fileId: string): Promise<IConversionImport | null> {
    const startTime = Date.now();

    try {
      return await ConversionImport.findOne({ fileId });
    } finally {
      databaseOperationDuration.observe({ operation: 'read', collection: 'imports' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Process import file
   */
  async processImport(
    fileId: string,
    records: Array<CreateConversionInput>,
    campaignId?: string
  ): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const startTime = Date.now();

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>
    };

    try {
      // Update import status to processing
      await ConversionImport.findOneAndUpdate(
        { fileId },
        {
          status: 'processing',
          totalRecords: records.length,
          startedAt: new Date()
        }
      );

      // Process records
      for (let i = 0; i < records.length; i++) {
        try {
          const record = records[i];

          const conversion = new OfflineConversion({
            campaignId: campaignId || record.campaignId,
            userId: record.userId,
            type: record.type,
            value: record.value || 0,
            currency: record.currency || 'INR',
            date: record.date,
            source: record.source,
            medium: record.medium,
            device: record.device,
            location: record.location,
            metadata: record.metadata,
            status: 'pending',
            importId: fileId
          });

          await conversion.save();
          results.successful++;

          // Update progress
          await ConversionImport.findOneAndUpdate(
            { fileId },
            {
              processedRecords: i + 1,
              successfulRecords: results.successful
            }
          );
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: error.message
          });

          // Update error count
          await ConversionImport.findOneAndUpdate(
            { fileId },
            {
              processedRecords: i + 1,
              failedRecords: results.failed,
              $push: {
                errors: {
                  row: i + 1,
                  error: error.message,
                  data: records[i]
                }
              }
            }
          );
        }
      }

      // Update final status
      const status = results.failed === 0 ? 'completed' :
                     results.successful === 0 ? 'failed' : 'partial';

      await ConversionImport.findOneAndUpdate(
        { fileId },
        {
          status,
          completedAt: new Date()
        }
      );

      // Update metrics
      conversionImportTotal.inc({ status });
      conversionImportRecords.set({ import_id: fileId }, records.length);

      logger.info('Import processed', {
        fileId,
        successful: results.successful,
        failed: results.failed
      });

      return results;
    } finally {
      databaseOperationDuration.observe({ operation: 'process_import', collection: 'imports' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Parse CSV data
   */
  parseCSV(csvData: string, headers: string[]): CreateConversionInput[] {
    const records: CreateConversionInput[] = [];
    const lines = csvData.trim().split('\n');

    if (lines.length < 2) {
      return records;
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));

      const record: any = {};
      headers.forEach((header, index) => {
        const key = header.toLowerCase().replace(/\s+/g, '_');
        let value = values[index];

        // Type conversions
        if (key === 'value' && value) {
          value = parseFloat(value);
        } else if (key === 'date' && value) {
          value = new Date(value);
        }

        record[key] = value;
      });

      // Map common column names
      if (record.conversion_type || record.type) {
        record.type = record.conversion_type || record.type;
      }
      if (record.campaign_id || record.campaignid) {
        record.campaignId = record.campaign_id || record.campaignid;
      }

      if (record.campaignid && record.type && record.date) {
        records.push(record as CreateConversionInput);
      }
    }

    return records;
  }

  /**
   * Parse JSON data
   */
  parseJSON(jsonData: string): CreateConversionInput[] {
    try {
      const data = JSON.parse(jsonData);
      const records = Array.isArray(data) ? data : data.conversions || data.records || [];
      return records as CreateConversionInput[];
    } catch (error) {
      logger.error('JSON parse error', { error });
      return [];
    }
  }

  /**
   * Get imports by campaign
   */
  async getImportsByCampaign(
    campaignId: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    imports: IConversionImport[];
    total: number;
    page: number;
    limit: number;
  }> {
    const startTime = Date.now();

    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      const [imports, total] = await Promise.all([
        ConversionImport.find({ campaignId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        ConversionImport.countDocuments({ campaignId })
      ]);

      return {
        imports,
        total,
        page,
        limit
      };
    } finally {
      databaseOperationDuration.observe({ operation: 'find', collection: 'imports' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Get import statistics
   */
  async getImportStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
  }> {
    const startTime = Date.now();

    try {
      const stats = await ConversionImport.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byStatus: { $push: '$status' },
            totalRecords: { $sum: '$totalRecords' },
            successfulRecords: { $sum: '$successfulRecords' },
            failedRecords: { $sum: '$failedRecords' }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            totalRecords: 1,
            successfulRecords: 1,
            failedRecords: 1
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          total: 0,
          byStatus: {},
          totalRecords: 0,
          successfulRecords: 0,
          failedRecords: 0
        };
      }

      const result = stats[0];

      // Count by status
      const byStatus: Record<string, number> = {};
      if (stats[0].byStatus) {
        stats[0].byStatus.forEach((status: string) => {
          byStatus[status] = (byStatus[status] || 0) + 1;
        });
      }

      return {
        total: result.total,
        byStatus,
        totalRecords: result.totalRecords,
        successfulRecords: result.successfulRecords,
        failedRecords: result.failedRecords
      };
    } finally {
      databaseOperationDuration.observe({ operation: 'aggregate', collection: 'imports' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Retry failed import
   */
  async retryImport(fileId: string): Promise<IConversionImport | null> {
    const startTime = Date.now();

    try {
      const importRecord = await ConversionImport.findOne({ fileId });

      if (!importRecord) {
        return null;
      }

      if (importRecord.status !== 'failed' && importRecord.status !== 'partial') {
        logger.warn('Import cannot be retried', { fileId, status: importRecord.status });
        return importRecord;
      }

      // Reset status and counters
      importRecord.status = 'uploading';
      importRecord.processedRecords = 0;
      importRecord.successfulRecords = 0;
      importRecord.failedRecords = 0;
      importRecord.errors = [];
      importRecord.startedAt = undefined;
      importRecord.completedAt = undefined;

      await importRecord.save();

      logger.info('Import retry initiated', { fileId });

      return importRecord;
    } finally {
      databaseOperationDuration.observe({ operation: 'update', collection: 'imports' }, (Date.now() - startTime) / 1000);
    }
  }

  /**
   * Delete import and associated conversions
   */
  async deleteImport(fileId: string): Promise<boolean> {
    const startTime = Date.now();

    try {
      // Delete associated conversions
      await OfflineConversion.deleteMany({ importId: fileId });

      // Delete import record
      const result = await ConversionImport.findOneAndDelete({ fileId });

      if (result) {
        logger.info('Import deleted', { fileId });
        return true;
      }

      return false;
    } finally {
      databaseOperationDuration.observe({ operation: 'delete', collection: 'imports' }, (Date.now() - startTime) / 1000);
    }
  }
}

export const importService = new ImportService();