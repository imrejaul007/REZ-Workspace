import {
  DataRequestType,
  DataRequestStatus,
  ErasureRequest,
  DataExport,
  AuditEntry
} from '../types';
import { dataRequestModel, DataRequest } from '../models/DataRequest';
import { auditService } from './auditService';

export interface UserData {
  userId: string;
  profile?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  activity?: Array<Record<string, unknown>>;
  transactions?: Array<Record<string, unknown>>;
  communications?: Array<Record<string, unknown>>;
  uploads?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
}

export interface ErasureResult {
  requestId: string;
  userId: string;
  erasedCategories: string[];
  erasureMethod: 'full' | 'anonymized' | 'pseudonymized';
  completedAt: Date;
  backupDeletedAt?: Date;
  verificationHash: string;
}

export interface ExportResult {
  exportId: string;
  userId: string;
  requestId: string;
  format: 'json' | 'csv' | 'xml';
  data: UserData;
  generatedAt: Date;
  expiresAt: Date;
  size: number;
  checksum: string;
}

class ErasureService {
  private userDataStore: Map<string, UserData> = new Map();
  private erasureRecords: Map<string, ErasureResult> = new Map();
  private exports: Map<string, ExportResult> = new Map();

  async requestErasure(
    userId: string,
    dataCategories: string[],
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<DataRequest> {
    const request = await dataRequestModel.create({
      userId,
      type: DataRequestType.ERASURE,
      dataCategories,
      reason,
      metadata: { erasureCategories: dataCategories }
    });

    await auditService.log({
      action: 'ERASURE_REQUEST_CREATED',
      userId,
      requestId: request.id,
      details: {
        dataCategories,
        reason,
        estimatedCompletion: request.estimatedCompletionDate
      },
      ipAddress,
      userAgent,
      result: 'success'
    });

    return request;
  }

  async processErasure(
    requestId: string,
    erasureMethod: 'full' | 'anonymized' | 'pseudonymized' = 'full',
    processorId?: string,
    ipAddress?: string
  ): Promise<ErasureResult | null> {
    const request = await dataRequestModel.findById(requestId);

    if (!request) {
      await auditService.log({
        action: 'ERASURE_PROCESS_FAILED',
        requestId,
        details: { error: 'Request not found' },
        ipAddress,
        result: 'failure',
        errorMessage: 'Erasure request not found'
      });
      return null;
    }

    if (request.type !== DataRequestType.ERASURE) {
      await auditService.log({
        action: 'ERASURE_PROCESS_FAILED',
        requestId,
        details: { error: 'Invalid request type' },
        ipAddress,
        result: 'failure',
        errorMessage: 'Request type mismatch'
      });
      return null;
    }

    await dataRequestModel.update(requestId, {
      status: DataRequestStatus.IN_PROGRESS,
      processor: processorId
    });

    try {
      const userData = this.userDataStore.get(request.userId);
      const erasedCategories: string[] = [];

      if (userData) {
        for (const category of request.dataCategories) {
          switch (category) {
            case 'profile':
              if (erasureMethod === 'full') {
                userData.profile = undefined;
              } else if (erasureMethod === 'anonymized') {
                userData.profile = this.anonymizeData(userData.profile);
              }
              erasedCategories.push('profile');
              break;

            case 'preferences':
              if (erasureMethod === 'full') {
                userData.preferences = undefined;
              } else {
                userData.preferences = {};
              }
              erasedCategories.push('preferences');
              break;

            case 'activity':
              if (erasureMethod === 'full') {
                userData.activity = undefined;
              } else {
                userData.activity = [];
              }
              erasedCategories.push('activity');
              break;

            case 'transactions':
              if (erasureMethod === 'full') {
                userData.transactions = undefined;
              } else {
                userData.transactions = [];
              }
              erasedCategories.push('transactions');
              break;

            case 'communications':
              if (erasureMethod === 'full') {
                userData.communications = undefined;
              } else {
                userData.communications = [];
              }
              erasedCategories.push('communications');
              break;

            case 'uploads':
              if (erasureMethod === 'full') {
                userData.uploads = undefined;
              } else {
                userData.uploads = [];
              }
              erasedCategories.push('uploads');
              break;

            case 'all':
              if (erasureMethod === 'full') {
                this.userDataStore.delete(request.userId);
              } else {
                userData.profile = this.anonymizeData(userData.profile);
                userData.preferences = {};
                userData.activity = [];
                userData.transactions = [];
                userData.communications = [];
                userData.uploads = [];
              }
              erasedCategories.push('all');
              break;
          }
        }

        if (erasureMethod !== 'full') {
          this.userDataStore.set(request.userId, userData);
        }
      }

      const verificationHash = this.generateHash(requestId, request.userId, erasedCategories);

      const result: ErasureResult = {
        requestId,
        userId: request.userId,
        erasedCategories,
        erasureMethod,
        completedAt: new Date(),
        verificationHash
      };

      this.erasureRecords.set(requestId, result);

      await dataRequestModel.update(requestId, {
        status: DataRequestStatus.COMPLETED,
        notes: `Erasure completed using ${erasureMethod} method. Categories: ${erasedCategories.join(', ')}`
      });

      await auditService.log({
        action: 'ERASURE_COMPLETED',
        userId: request.userId,
        requestId,
        details: {
          erasedCategories,
          erasureMethod,
          verificationHash
        },
        ipAddress,
        result: 'success'
      });

      return result;

    } catch (error) {
      await auditService.log({
        action: 'ERASURE_PROCESS_FAILED',
        userId: request.userId,
        requestId,
        details: { error: (error as Error).message },
        ipAddress,
        result: 'failure',
        errorMessage: (error as Error).message
      });
      return null;
    }
  }

  async exportUserData(
    userId: string,
    format: 'json' | 'csv' | 'xml' = 'json',
    ipAddress?: string,
    userAgent?: string
  ): Promise<ExportResult> {
    const request = await dataRequestModel.create({
      userId,
      type: DataRequestType.PORTABILITY,
      dataCategories: ['all']
    });

    const userData = this.userDataStore.get(userId) || this.generateSampleData(userId);

    const processedData = this.processDataForExport(userData, format);

    const generatedAt = new Date();
    const expiresAt = new Date(generatedAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    const checksum = this.generateChecksum(processedData);

    const result: ExportResult = {
      exportId: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      requestId: request.id,
      format,
      data: userData,
      generatedAt,
      expiresAt,
      size: Buffer.byteLength(JSON.stringify(processedData), 'utf8'),
      checksum
    };

    this.exports.set(result.exportId, result);

    await dataRequestModel.update(request.id, {
      status: DataRequestStatus.COMPLETED,
      notes: `Data export generated in ${format} format`
    });

    await auditService.log({
      action: 'DATA_EXPORT_GENERATED',
      userId,
      requestId: request.id,
      details: {
        exportId: result.exportId,
        format,
        size: result.size
      },
      ipAddress,
      userAgent,
      result: 'success'
    });

    return result;
  }

  async getExport(exportId: string): Promise<ExportResult | null> {
    return this.exports.get(exportId) || null;
  }

  async getExportableData(userId: string): Promise<UserData> {
    return this.userDataStore.get(userId) || this.generateSampleData(userId);
  }

  async verifyErasure(requestId: string): Promise<{
    verified: boolean;
    erasureResult?: ErasureResult;
    dataRemaining?: string[];
  }> {
    const erasureResult = this.erasureRecords.get(requestId);

    if (!erasureResult) {
      return { verified: false };
    }

    const userData = this.userDataStore.get(erasureResult.userId);
    const dataRemaining: string[] = [];

    if (userData) {
      if (userData.profile) dataRemaining.push('profile');
      if (userData.preferences) dataRemaining.push('preferences');
      if (userData.activity?.length) dataRemaining.push('activity');
      if (userData.transactions?.length) dataRemaining.push('transactions');
      if (userData.communications?.length) dataRemaining.push('communications');
      if (userData.uploads?.length) dataRemaining.push('uploads');
    }

    const verified = dataRemaining.length === 0;

    await auditService.log({
      action: verified ? 'ERASURE_VERIFICATION_PASSED' : 'ERASURE_VERIFICATION_FAILED',
      requestId,
      details: {
        verified,
        dataRemaining,
        erasureMethod: erasureResult.erasureMethod
      },
      result: verified ? 'success' : 'failure'
    });

    return { verified, erasureResult, dataRemaining: dataRemaining.length > 0 ? dataRemaining : undefined };
  }

  async getErasureStats(): Promise<{
    totalRequests: number;
    completed: number;
    pending: number;
    inProgress: number;
    byMethod: Record<string, number>;
    averageCompletionTime: number;
  }> {
    const all = Array.from(this.erasureRecords.values());

    const completionTimes = all
      .filter(e => e.completedAt)
      .map(e => e.completedAt.getTime());

    const avgTime = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

    const byMethod: Record<string, number> = {};
    for (const record of all) {
      byMethod[record.erasureMethod] = (byMethod[record.erasureMethod] || 0) + 1;
    }

    return {
      totalRequests: all.length,
      completed: all.filter(e => e.completedAt).length,
      pending: (await dataRequestModel.findByQuery({ type: DataRequestType.ERASURE, status: DataRequestStatus.PENDING })).total,
      inProgress: (await dataRequestModel.findByQuery({ type: DataRequestType.ERASURE, status: DataRequestStatus.IN_PROGRESS })).total,
      byMethod,
      averageCompletionTime: avgTime
    };
  }

  async scheduleBackupDeletion(
    requestId: string,
    daysAfterErasure: number = 30
  ): Promise<Date> {
    const erasureResult = this.erasureRecords.get(requestId);

    if (!erasureResult) {
      throw new Error('Erasure record not found');
    }

    const backupDate = new Date(erasureResult.completedAt);
    backupDate.setDate(backupDate.getDate() + daysAfterErasure);

    erasureResult.backupDeletedAt = backupDate;
    this.erasureRecords.set(requestId, erasureResult);

    await auditService.log({
      action: 'BACKUP_DELETION_SCHEDULED',
      requestId,
      details: { scheduledDate: backupDate, daysAfterErasure },
      result: 'success'
    });

    return backupDate;
  }

  storeUserData(userId: string, data: UserData): void {
    this.userDataStore.set(userId, data);
  }

  private anonymizeData(data: Record<string, unknown> | undefined): Record<string, unknown> {
    if (!data) return {};

    const anonymized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (key === 'id' || key === 'email') {
        anonymized[key] = '[REDACTED]';
      } else if (key === 'phone') {
        anonymized[key] = '***-***-****';
      } else if (key === 'address') {
        anonymized[key] = '[REDACTED]';
      } else if (Array.isArray(value)) {
        anonymized[key] = [];
      } else if (typeof value === 'object' && value !== null) {
        anonymized[key] = this.anonymizeData(value as Record<string, unknown>);
      } else {
        anonymized[key] = value;
      }
    }

    return anonymized;
  }

  private processDataForExport(data: UserData, format: 'json' | 'csv' | 'xml'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);

      case 'csv':
        return this.convertToCSV(data);

      case 'xml':
        return this.convertToXML(data);

      default:
        return JSON.stringify(data);
    }
  }

  private convertToCSV(data: UserData): string {
    const rows: string[] = ['Category,Field,Value'];

    const flattenObject = (obj: Record<string, unknown>, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const fieldName = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flattenObject(value as Record<string, unknown>, fieldName);
        } else if (Array.isArray(value)) {
          rows.push(`"${fieldName}","[${value.length} items]"`);
        } else {
          rows.push(`"${fieldName}","${String(value).replace(/"/g, '""')}"`);
        }
      }
    };

    if (data.profile) flattenObject(data.profile, 'profile');
    if (data.preferences) flattenObject(data.preferences, 'preferences');
    if (data.metadata) flattenObject(data.metadata, 'metadata');

    return rows.join('\n');
  }

  private convertToXML(data: UserData): string {
    const escapeXml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const objectToXml = (obj: unknown, name: string): string => {
      if (obj === null || obj === undefined) {
        return `<${name}/>`;
      }
      if (typeof obj !== 'object') {
        return `<${name}>${escapeXml(String(obj))}</${name}>`;
      }
      if (Array.isArray(obj)) {
        return obj.map(item => objectToXml(item, 'item')).join('\n');
      }
      const children = Object.entries(obj as Record<string, unknown>)
        .map(([key, value]) => objectToXml(value, key))
        .join('\n');
      return `<${name}>\n${children}\n</${name}>`;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>\n<userData>\n${objectToXml(data, 'data')}\n</userData>`;
  }

  private generateHash(...parts: string[]): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(parts.join(':')).digest('hex');
  }

  private generateChecksum(data: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(data).digest('hex');
  }

  private generateSampleData(userId: string): UserData {
    return {
      userId,
      profile: {
        id: userId,
        email: `${userId}@example.com`,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      },
      preferences: {
        language: 'en',
        timezone: 'UTC',
        notifications: true
      },
      activity: [
        { action: 'login', timestamp: new Date().toISOString() }
      ],
      metadata: {
        source: 'sample',
        version: '1.0'
      }
    };
  }
}

export const erasureService = new ErasureService();
