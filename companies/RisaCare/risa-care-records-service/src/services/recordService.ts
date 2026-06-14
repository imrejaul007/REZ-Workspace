// RisaCare Records Service - Record Service

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import {
  HealthRecord,
  HealthRecordSchema,
  HealthDocumentType,
  HealthCategory
} from '@risa-care/shared/types';
import {
  RecordNotFoundError,
  RecordUploadError,
  InvalidDocumentTypeError,
  FileTooLargeError,
  UnsupportedFormatError
} from '@risa-care/shared/errors';
import {
  generateRecordId,
  now,
  logger,
  isValidUUID,
  isValidFileType,
  isValidFileSize,
  MAX_FILE_SIZE
} from '@risa-care/shared/utils';

const COLLECTION_NAME = 'health-records';

// ============================================
// DATABASE CONNECTION
// ============================================

let db: Db | null = null;
let recordsCollection: Collection | null = null;

export async function connectDatabase(): Promise<Db> {
  if (db) return db;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(mongoUri);

  await client.connect();
  db = client.db('risa_care');
  recordsCollection = db.collection(COLLECTION_NAME);

  // Create indexes
  await createIndexes();

  logger.info('Records service connected to MongoDB');
  return db;
}

async function createIndexes(): Promise<void> {
  if (!recordsCollection) return;

  await recordsCollection.createIndex({ recordId: 1 }, { unique: true });
  await recordsCollection.createIndex({ userId: 1, profileId: 1 });
  await recordsCollection.createIndex({ profileId: 1, type: 1 });
  await recordsCollection.createIndex({ profileId: 1, 'extracted.date': -1 });
  await recordsCollection.createIndex({ profileId: 1, category: 1 });
  await recordsCollection.createIndex({ 'extracted.biomarkers.name': 1 });
  await recordsCollection.createIndex({ tags: 1 });
  await recordsCollection.createIndex({ createdAt: -1 });
}

export function getRecordsCollection(): Collection {
  if (!recordsCollection) {
    throw new Error('Database not connected');
  }
  return recordsCollection;
}

// ============================================
// RECORD SERVICE
// ============================================

export class RecordService {
  async createRecord(data: {
    userId: string;
    profileId: string;
    type: HealthDocumentType;
    title: string;
    description?: string;
    file: {
      url: string;
      filename: string;
      mimeType: string;
      size: number;
      storageKey: string;
    };
    metadata?: Record<string, unknown>;
  }): Promise<HealthRecord> {
    const recordId = generateRecordId();
    const timestamp = now();

    const record: HealthRecord = {
      id: recordId,
      userId: data.userId,
      profileId: data.profileId,
      type: data.type,
      title: data.title,
      description: data.description,
      file: data.file,
      processing: {
        status: 'pending',
        startedAt: timestamp
      },
      tags: [],
      isAbnormal: false,
      hasFollowUpRequired: false,
      sharing: {
        isShared: false,
        sharedWith: []
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: data.userId,
      lastAccessedAt: timestamp
    };

    const collection = getRecordsCollection();
    await collection.insertOne({
      ...record,
      _id: new ObjectId()
    });

    logger.info(`Created record ${recordId} for user ${data.userId}`);

    return record;
  }

  async getRecord(recordId: string, userId: string): Promise<HealthRecord> {
    const collection = getRecordsCollection();
    const record = await collection.findOne({
      recordId,
      userId
    });

    if (!record) {
      throw new RecordNotFoundError(recordId);
    }

    // Update last accessed
    await collection.updateOne(
      { recordId },
      { $set: { lastAccessedAt: now() } }
    );

    return this.mapToRecord(record);
  }

  async listRecords(params: {
    userId: string;
    profileId?: string;
    type?: HealthDocumentType;
    category?: HealthCategory;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ records: HealthRecord[]; total: number }> {
    const collection = getRecordsCollection();

    const filter: Record<string, unknown> = { userId: params.userId };

    if (params.profileId) {
      filter.profileId = params.profileId;
    }

    if (params.type) {
      filter.type = params.type;
    }

    if (params.category) {
      filter.category = params.category;
    }

    if (params.startDate || params.endDate) {
      filter['extracted.date'] = {};
      if (params.startDate) {
        (filter['extracted.date'] as Record<string, unknown>).$gte = params.startDate;
      }
      if (params.endDate) {
        (filter['extracted.date'] as Record<string, unknown>).$lte = params.endDate;
      }
    }

    if (params.search) {
      filter.$or = [
        { title: { $regex: params.search, $options: 'i' } },
        { 'extracted.doctorName': { $regex: params.search, $options: 'i' } },
        { 'extracted.hospitalName': { $regex: params.search, $options: 'i' } },
        { 'extracted.labName': { $regex: params.search, $options: 'i' } }
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    const sortField = params.sortBy || 'createdAt';
    sort[sortField] = params.sortOrder === 'asc' ? 1 : -1;

    const limit = params.limit || 20;
    const offset = params.offset || 0;

    const [records, total] = await Promise.all([
      collection
        .find(filter)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter)
    ]);

    return {
      records: records.map(r => this.mapToRecord(r)),
      total
    };
  }

  async updateRecord(recordId: string, userId: string, updates: Partial<HealthRecord>): Promise<HealthRecord> {
    const collection = getRecordsCollection();

    const result = await collection.findOneAndUpdate(
      { recordId, userId },
      {
        $set: {
          ...updates,
          updatedAt: now()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new RecordNotFoundError(recordId);
    }

    return this.mapToRecord(result);
  }

  async deleteRecord(recordId: string, userId: string): Promise<void> {
    const collection = getRecordsCollection();

    const result = await collection.deleteOne({ recordId, userId });

    if (result.deletedCount === 0) {
      throw new RecordNotFoundError(recordId);
    }

    logger.info(`Deleted record ${recordId} for user ${userId}`);
  }

  async updateProcessingStatus(
    recordId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    details?: {
      ocrJobId?: string;
      ocrStatus?: string;
      extractionStatus?: string;
      error?: string;
      completedAt?: string;
    }
  ): Promise<void> {
    const collection = getRecordsCollection();

    const update: Record<string, unknown> = {
      'processing.status': status,
      updatedAt: now()
    };

    if (details) {
      if (details.ocrJobId) update['processing.ocrJobId'] = details.ocrJobId;
      if (details.ocrStatus) update['processing.ocrStatus'] = details.ocrStatus;
      if (details.extractionStatus) update['processing.extractionStatus'] = details.extractionStatus;
      if (details.error) update['processing.error'] = details.error;
      if (details.completedAt) update['processing.completedAt'] = details.completedAt;
    }

    if (status === 'completed') {
      update['processing.completedAt'] = details?.completedAt || now();
    }

    await collection.updateOne({ recordId }, { $set: update });
  }

  async updateExtractedData(
    recordId: string,
    data: {
      date?: string;
      doctorName?: string;
      hospitalName?: string;
      labName?: string;
      biomarkers?: HealthRecord['extracted']['biomarkers'];
      diagnosis?: string[];
      icdCodes?: string[];
      medications?: Array<{ name: string; dosage?: string; frequency?: string }>;
      rawText?: string;
      ocrConfidence?: number;
      aiConfidence?: number;
    }
  ): Promise<void> {
    const collection = getRecordsCollection();

    const extractedUpdate: Record<string, unknown> = {};
    if (data.date) extractedUpdate['extracted.date'] = data.date;
    if (data.doctorName) extractedUpdate['extracted.doctorName'] = data.doctorName;
    if (data.hospitalName) extractedUpdate['extracted.hospitalName'] = data.hospitalName;
    if (data.labName) extractedUpdate['extracted.labName'] = data.labName;
    if (data.biomarkers) extractedUpdate['extracted.biomarkers'] = data.biomarkers;
    if (data.diagnosis) extractedUpdate['extracted.diagnosis'] = data.diagnosis;
    if (data.icdCodes) extractedUpdate['extracted.icdCodes'] = data.icdCodes;
    if (data.medications) extractedUpdate['extracted.medications'] = data.medications;
    if (data.rawText !== undefined) extractedUpdate['extracted.rawText'] = data.rawText;
    if (data.ocrConfidence !== undefined) extractedUpdate['extracted.ocrConfidence'] = data.ocrConfidence;
    if (data.aiConfidence !== undefined) extractedUpdate['extracted.aiConfidence'] = data.aiConfidence;

    await collection.updateOne(
      { recordId },
      {
        $set: {
          ...extractedUpdate,
          'processing.extractionStatus': 'completed',
          'processing.status': 'completed',
          'processing.completedAt': now(),
          updatedAt: now()
        }
      }
    );
  }

  async updateCategorization(
    recordId: string,
    data: {
      category?: HealthCategory;
      tags?: string[];
      isAbnormal?: boolean;
      hasFollowUpRequired?: boolean;
      abnormalBiomarkers?: string[];
    }
  ): Promise<void> {
    const collection = getRecordsCollection();

    const update: Record<string, unknown> = {};
    if (data.category) update.category = data.category;
    if (data.tags) update.tags = data.tags;
    if (data.isAbnormal !== undefined) update.isAbnormal = data.isAbnormal;
    if (data.hasFollowUpRequired !== undefined) update.hasFollowUpRequired = data.hasFollowUpRequired;
    if (data.abnormalBiomarkers) update.abnormalBiomarkers = data.abnormalBiomarkers;

    await collection.updateOne({ recordId }, { $set: { ...update, updatedAt: now() } });
  }

  async getBiomarkerHistory(
    profileId: string,
    biomarkerName: string,
    limit: number = 10
  ): Promise<Array<{ value: string | number; date: string; recordId: string }>> {
    const collection = getRecordsCollection();

    const records = await collection
      .find({
        profileId,
        'extracted.biomarkers.name': biomarkerName
      })
      .sort({ 'extracted.date': -1 })
      .limit(limit)
      .toArray();

    const results: Array<{ value: string | number; date: string; recordId: string }> = [];

    for (const record of records) {
      if (record.extracted?.biomarkers) {
        const biomarker = record.extracted.biomarkers.find(
          (b: { name: string }) => b.name.toLowerCase() === biomarkerName.toLowerCase()
        );
        if (biomarker) {
          results.push({
            value: biomarker.value,
            date: record.extracted.date || record.createdAt,
            recordId: record.recordId
          });
        }
      }
    }

    return results;
  }

  async shareRecord(
    recordId: string,
    userId: string,
    shareData: {
      entityType: 'doctor' | 'lab' | 'hospital';
      entityId: string;
      expiresAt?: string;
      consentId?: string;
    }
  ): Promise<void> {
    const collection = getRecordsCollection();

    await collection.updateOne(
      { recordId, userId },
      {
        $set: {
          'sharing.isShared': true,
          updatedAt: now()
        },
        $push: {
          'sharing.sharedWith': {
            ...shareData,
            sharedAt: now()
          }
        }
      }
    );
  }

  async revokeShare(recordId: string, userId: string, entityId: string): Promise<void> {
    const collection = getRecordsCollection();

    await collection.updateOne(
      { recordId, userId },
      {
        $pull: {
          'sharing.sharedWith': { entityId }
        },
        $set: { updatedAt: now() }
      }
    );

    // Check if any shares remain
    const record = await collection.findOne({ recordId, userId });
    if (record && record.sharing.sharedWith.length === 0) {
      await collection.updateOne(
        { recordId, userId },
        { $set: { 'sharing.isShared': false, updatedAt: now() } }
      );
    }
  }

  private mapToRecord(doc: any): HealthRecord {
    return {
      id: doc.recordId,
      userId: doc.userId,
      profileId: doc.profileId,
      type: doc.type,
      title: doc.title,
      description: doc.description,
      file: doc.file,
      processing: doc.processing,
      extracted: doc.extracted,
      category: doc.category,
      tags: doc.tags,
      isAbnormal: doc.isAbnormal,
      hasFollowUpRequired: doc.hasFollowUpRequired,
      abnormalBiomarkers: doc.abnormalBiomarkers,
      sharing: doc.sharing,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      createdBy: doc.createdBy,
      lastAccessedAt: doc.lastAccessedAt
    };
  }
}

// Singleton instance
let recordService: RecordService | null = null;

export function getRecordService(): RecordService {
  if (!recordService) {
    recordService = new RecordService();
  }
  return recordService;
}
