import {
  UserConsent,
  ConsentType,
  ConsentStatus,
  ConsentBanner,
  AuditEntry,
  PaginationParams,
  PaginatedResponse
} from '../types';
import { auditService } from './auditService';
import mongoose, { Schema, Model, Document } from 'mongoose';

// ─── MongoDB Models for Persistence ─────────────────────────────────────────

const consentSchema = new Schema({
  userId: { type: String, required: true, index: true },
  consentType: { type: String, enum: Object.values(ConsentType), required: true },
  status: { type: String, enum: Object.values(ConsentStatus), required: true },
  source: { type: String, enum: ['banner', 'form', 'api', 'settings'] },
  grantedAt: { type: Date, required: true },
  expiresAt: { type: Date },
  ipAddress: { type: String },
  userAgent: { type: String },
  metadata: { type: Schema.Types.Mixed },
  version: { type: Number, default: 1 }
}, { timestamps: true });

// Compound index for user + consent type lookups
consentSchema.index({ userId: 1, consentType: 1 }, { unique: true });

// Index for expiration tracking
consentSchema.index({ expiresAt: 1 }, { sparse: true });

const ConsentModel = mongoose.model<Document & UserConsent>('Consent', consentSchema);

export interface ConsentInput {
  userId: string;
  consentType: ConsentType;
  status: ConsentStatus;
  source?: 'banner' | 'form' | 'api' | 'settings';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface ConsentUpdateInput {
  status?: ConsentStatus;
  metadata?: Record<string, unknown>;
}

class ConsentService {
  // Fallback in-memory cache for performance (backed by MongoDB)
  private consentCache = new Map<string, UserConsent>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  async grantConsent(input: ConsentInput): Promise<UserConsent> {
    const consent = await this.createOrUpdateConsent({
      ...input,
      status: ConsentStatus.GRANTED
    });

    await auditService.log({
      action: 'CONSENT_GRANTED',
      userId: input.userId,
      consentId: consent.id,
      details: { consentType: input.consentType, source: input.source },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      result: 'success'
    });

    // Update cache
    this.consentCache.set(`${input.userId}:${input.consentType}`, consent);

    return consent;
  }

  async denyConsent(input: ConsentInput): Promise<UserConsent> {
    const consent = await this.createOrUpdateConsent({
      ...input,
      status: ConsentStatus.DENIED
    });

    await auditService.log({
      action: 'CONSENT_DENIED',
      userId: input.userId,
      consentId: consent.id,
      details: { consentType: input.consentType, source: input.source },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      result: 'success'
    });

    // Update cache
    this.consentCache.set(`${input.userId}:${input.consentType}`, consent);

    return consent;
  }

  async withdrawConsent(
    userId: string,
    consentType: ConsentType,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserConsent> {
    const consent = await this.findConsent(userId, consentType);

    if (!consent) {
      throw new Error('Consent not found');
    }

    consent.status = ConsentStatus.WITHDRAWN;
    consent.metadata = {
      ...consent.metadata,
      withdrawnAt: new Date().toISOString(),
      withdrawnBy: 'user'
    };

    await consent.save();

    await auditService.log({
      action: 'CONSENT_WITHDRAWN',
      userId,
      consentId: consent.id,
      details: { consentType },
      ipAddress,
      userAgent,
      result: 'success'
    });

    // Update cache
    this.consentCache.delete(`${userId}:${consentType}`);

    return consent;
  }

  async findConsent(
    userId: string,
    consentType: ConsentType
  ): Promise<UserConsent | null> {
    // Check cache first
    const cacheKey = `${userId}:${consentType}`;
    const cached = this.consentCache.get(cacheKey);
    if (cached && Date.now() - new Date(cached.grantedAt).getTime() < this.CACHE_TTL_MS) {
      return cached;
    }

    // Query MongoDB
    const consent = await ConsentModel.findOne({ userId, consentType }).lean();
    if (consent) {
      this.consentCache.set(cacheKey, consent);
    }

    return consent;
  }

  async getUserConsents(userId: string): Promise<UserConsent[]> {
    return ConsentModel.find({ userId }).lean();
  }

  async hasConsent(
    userId: string,
    consentType: ConsentType
  ): Promise<boolean> {
    const consent = await this.findConsent(userId, consentType);
    return consent?.status === ConsentStatus.GRANTED;
  }

  async createOrUpdateConsent(input: ConsentInput): Promise<UserConsent> {
    const existing = await ConsentModel.findOne({
      userId: input.userId,
      consentType: input.consentType
    });

    if (existing) {
      // Update existing consent
      existing.status = input.status;
      existing.source = input.source;
      existing.metadata = {
        ...existing.metadata,
        ...input.metadata
      };
      existing.version += 1;
      await existing.save();
      return existing.toObject();
    }

    // Create new consent
    const consent = await ConsentModel.create({
      userId: input.userId,
      consentType: input.consentType,
      status: input.status,
      source: input.source,
      grantedAt: new Date(),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: input.metadata,
      version: 1
    });

    return consent.toObject();
  }

  async listConsents(
    filters: {
      consentType?: ConsentType;
      status?: ConsentStatus;
      startDate?: Date;
      endDate?: Date;
    },
    pagination: PaginationParams
  ): Promise<PaginatedResponse<UserConsent>> {
    const query: Record<string, unknown> = {};

    if (filters.consentType) query.consentType = filters.consentType;
    if (filters.status) query.status = filters.status;
    if (filters.startDate || filters.endDate) {
      query.grantedAt = {};
      if (filters.startDate) query.grantedAt.$gte = filters.startDate;
      if (filters.endDate) query.grantedAt.$lte = filters.endDate;
    }

    const total = await ConsentModel.countDocuments(query);
    const data = await ConsentModel.find(query)
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .sort({ grantedAt: -1 })
      .lean();

    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    };
  }

  async cleanupExpiredConsents(): Promise<number> {
    const result = await ConsentModel.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    return result.deletedCount;
  }
}

export const consentService = new ConsentService();
