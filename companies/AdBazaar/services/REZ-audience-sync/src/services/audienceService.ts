import { v4 as uuidv4 } from 'uuid';
import {
  Audience,
  AudienceMember,
  CrossDeviceMapping,
  SyncJob,
  DmpProvider,
  AudienceStatus,
  AudienceType,
  SyncDirection,
  IdentifierType,
  CreateAudienceInput,
  UpdateAudienceInput,
  AudienceUploadInput,
  CrossDeviceMatchInput
} from '../types';
import logger from '../utils/logger';

class AudienceService {
  private audiences: Map<string, Audience> = new Map();
  private members: Map<string, AudienceMember> = new Map();
  private crossDeviceMappings: Map<string, CrossDeviceMapping> = new Map();
  private syncJobs: Map<string, SyncJob> = new Map();
  private audienceMembersIndex: Map<string, Set<string>> = new Map();

  // Audience Management
  createAudience(input: CreateAudienceInput, tenantId: string): Audience {
    const id = uuidv4();
    const now = new Date();

    const audience: Audience = {
      id,
      name: input.name,
      description: input.description,
      provider: input.provider,
      audienceType: input.audienceType,
      status: AudienceStatus.PENDING,
      size: 0,
      segmentId: undefined,
      platformIds: {},
      identifiers: input.identifiers ?? [{ type: IdentifierType.EMAIL }],
      lookbackDays: input.lookbackDays ?? 30,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now
    };

    this.audiences.set(`${tenantId}:${id}`, audience);
    logger.info(`Audience created: ${id}, name: ${input.name}, provider: ${input.provider}`);
    return audience;
  }

  getAudience(id: string, tenantId: string): Audience | undefined {
    return this.audiences.get(`${tenantId}:${id}`);
  }

  getAudiences(tenantId: string, options?: {
    provider?: DmpProvider;
    status?: AudienceStatus;
    audienceType?: AudienceType;
    page?: number;
    limit?: number;
  }): { audiences: Audience[]; total: number } {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    let results: Audience[] = [];

    this.audiences.forEach((audience, key) => {
      if (!key.startsWith(`${tenantId}:`)) return;
      if (options?.provider && audience.provider !== options.provider) return;
      if (options?.status && audience.status !== options.status) return;
      if (options?.audienceType && audience.audienceType !== options.audienceType) return;
      results.push(audience);
    });

    const total = results.length;
    results = results
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * limit, page * limit);

    return { audiences: results, total };
  }

  updateAudience(id: string, input: UpdateAudienceInput, tenantId: string): Audience | undefined {
    const key = `${tenantId}:${id}`;
    const audience = this.audiences.get(key);
    if (!audience) return undefined;

    const updated: Audience = {
      ...audience,
      name: input.name ?? audience.name,
      description: input.description ?? audience.description,
      status: input.status ?? audience.status,
      identifiers: input.identifiers ?? audience.identifiers,
      lookbackDays: input.lookbackDays ?? audience.lookbackDays,
      metadata: input.metadata ? { ...audience.metadata, ...input.metadata } : audience.metadata,
      updatedAt: new Date()
    };

    this.audiences.set(key, updated);
    logger.info(`Audience updated: ${id}`);
    return updated;
  }

  deleteAudience(id: string, tenantId: string): boolean {
    const key = `${tenantId}:${id}`;
    const memberIds = this.audienceMembersIndex.get(key) || new Set();
    memberIds.forEach(memberId => this.members.delete(memberId));
    this.audienceMembersIndex.delete(key);
    return this.audiences.delete(key);
  }

  // Audience Members
  uploadMembers(input: AudienceUploadInput, tenantId: string): { success: number; failed: number; errors: string[] } {
    const audience = this.getAudience(input.audienceId, tenantId);
    if (!audience) {
      return { success: 0, failed: 0, errors: ['Audience not found'] };
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    const now = new Date();
    const key = `${tenantId}:${input.audienceId}`;
    const memberIds = this.audienceMembersIndex.get(key) || new Set();

    for (const member of input.members) {
      try {
        const memberId = uuidv4();
        const newMember: AudienceMember = {
          id: memberId,
          audienceId: input.audienceId,
          identifier: member.identifier,
          identifierType: member.identifierType,
          traits: member.traits ?? {},
          firstSeen: now,
          lastSeen: now,
          engagement: 0
        };

        this.members.set(memberId, newMember);
        memberIds.add(memberId);
        success++;
      } catch (error) {
        failed++;
        errors.push(`Failed to process: ${member.identifier}`);
      }
    }

    this.audienceMembersIndex.set(key, memberIds);

    // Update audience size
    audience.size = memberIds.size;
    audience.lastSyncAt = now;
    audience.status = AudienceStatus.ACTIVE;
    this.audiences.set(key, audience);

    logger.info(`Uploaded ${success} members to audience ${input.audienceId}`);
    return { success, failed, errors };
  }

  getMembers(audienceId: string, tenantId: string, options?: {
    page?: number;
    limit?: number;
  }): { members: AudienceMember[]; total: number } {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const key = `${tenantId}:${audienceId}`;
    const memberIds = this.audienceMembersIndex.get(key) || new Set();
    const members: AudienceMember[] = [];

    memberIds.forEach(id => {
      const member = this.members.get(id);
      if (member) members.push(member);
    });

    const total = members.length;
    const sorted = members
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
      .slice((page - 1) * limit, page * limit);

    return { members: sorted, total };
  }

  // Liveramp Integration
  async syncToLiveramp(audienceId: string, tenantId: string): Promise<SyncJob> {
    const audience = this.getAudience(audienceId, tenantId);
    if (!audience) throw new Error('Audience not found');

    const job: SyncJob = {
      id: uuidv4(),
      audienceId,
      direction: SyncDirection.UPLOAD,
      status: 'processing',
      recordsTotal: audience.size,
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsFailed: 0,
      startedAt: new Date(),
      createdAt: new Date()
    };

    this.syncJobs.set(job.id, job);

    // Simulate Liveramp API sync
    audience.status = AudienceStatus.SYNCING;
    audience.platformIds['liveramp'] = `lr_${audienceId.substring(0, 8)}`;
    this.audiences.set(`${tenantId}:${audienceId}`, audience);

    // Process in batches (simulated)
    const batchSize = 1000;
    const totalBatches = Math.ceil(audience.size / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      job.recordsProcessed = Math.min((i + 1) * batchSize, audience.size);
      job.recordsSuccess = Math.floor(job.recordsProcessed * 0.99);
      job.recordsFailed = job.recordsProcessed - job.recordsSuccess;
    }

    job.status = 'completed';
    job.completedAt = new Date();
    audience.status = AudienceStatus.ACTIVE;
    audience.lastSyncAt = new Date();
    this.audiences.set(`${tenantId}:${audienceId}`, audience);

    logger.info(`Liveramp sync completed for audience ${audienceId}`);
    return job;
  }

  // Segment Integration
  async syncToSegment(audienceId: string, tenantId: string): Promise<SyncJob> {
    const audience = this.getAudience(audienceId, tenantId);
    if (!audience) throw new Error('Audience not found');

    const job: SyncJob = {
      id: uuidv4(),
      audienceId,
      direction: SyncDirection.UPLOAD,
      status: 'processing',
      recordsTotal: audience.size,
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsFailed: 0,
      startedAt: new Date(),
      createdAt: new Date()
    };

    this.syncJobs.set(job.id, job);

    // Simulate Segment API sync
    audience.status = AudienceStatus.SYNCING;
    audience.platformIds['segment'] = `seg_${audienceId.substring(0, 8)}`;
    this.audiences.set(`${tenantId}:${audienceId}`, audience);

    // Process in batches (simulated)
    const batchSize = 500;
    const totalBatches = Math.ceil(audience.size / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      job.recordsProcessed = Math.min((i + 1) * batchSize, audience.size);
      job.recordsSuccess = Math.floor(job.recordsProcessed * 0.995);
      job.recordsFailed = job.recordsProcessed - job.recordsSuccess;
    }

    job.status = 'completed';
    job.completedAt = new Date();
    audience.status = AudienceStatus.ACTIVE;
    audience.lastSyncAt = new Date();
    this.audiences.set(`${tenantId}:${audienceId}`, audience);

    logger.info(`Segment sync completed for audience ${audienceId}`);
    return job;
  }

  // Download audience from provider
  async downloadAudience(audienceId: string, provider: DmpProvider, tenantId: string): Promise<SyncJob> {
    const job: SyncJob = {
      id: uuidv4(),
      audienceId,
      direction: SyncDirection.DOWNLOAD,
      status: 'processing',
      recordsTotal: 0,
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsFailed: 0,
      startedAt: new Date(),
      createdAt: new Date()
    };

    this.syncJobs.set(job.id, job);

    // Simulate download (in production, call provider API)
    const simulatedRecords = Math.floor(Math.random() * 5000) + 1000;
    job.recordsTotal = simulatedRecords;

    for (let i = 0; i < simulatedRecords; i += 100) {
      job.recordsProcessed = Math.min(i + 100, simulatedRecords);
      job.recordsSuccess = Math.floor(job.recordsProcessed * 0.98);
      job.recordsFailed = job.recordsProcessed - job.recordsSuccess;
    }

    job.status = 'completed';
    job.completedAt = new Date();

    // Add downloaded members to audience
    const key = `${tenantId}:${audienceId}`;
    const audience = this.audiences.get(key);
    if (audience) {
      const existingIds = this.audienceMembersIndex.get(key) || new Set();
      for (let i = 0; i < job.recordsSuccess; i++) {
        const memberId = uuidv4();
        const member: AudienceMember = {
          id: memberId,
          audienceId,
          identifier: `user_${i}@example.com`,
          identifierType: IdentifierType.EMAIL,
          traits: {},
          firstSeen: new Date(),
          lastSeen: new Date(),
          engagement: Math.random()
        };
        this.members.set(memberId, member);
        existingIds.add(memberId);
      }
      this.audienceMembersIndex.set(key, existingIds);
      audience.size = existingIds.size;
      audience.lastSyncAt = new Date();
      this.audiences.set(key, audience);
    }

    logger.info(`Downloaded ${job.recordsSuccess} records for audience ${audienceId}`);
    return job;
  }

  // Cross-Device Matching
  createCrossDeviceMapping(userId: string, deviceIds: string[], identifiers: Record<string, string[]>, tenantId: string): CrossDeviceMapping {
    const id = uuidv4();
    const now = new Date();

    const mapping: CrossDeviceMapping = {
      id,
      userId,
      deviceIds,
      identifiers,
      confidence: 0.85,
      createdAt: now,
      updatedAt: now
    };

    this.crossDeviceMappings.set(`${tenantId}:${id}`, mapping);
    logger.info(`Cross-device mapping created for user ${userId}`);
    return mapping;
  }

  matchCrossDevice(input: CrossDeviceMatchInput, tenantId: string): CrossDeviceMapping | null {
    // In production, this would call a cross-device matching service
    // Simulated matching based on identifier patterns
    const mappings: CrossDeviceMapping[] = [];
    this.crossDeviceMappings.forEach(mapping => {
      if (mapping.identifiers[input.sourceType]?.includes(input.sourceId)) {
        mappings.push(mapping);
      }
    });

    if (mappings.length === 0) return null;

    // Return the best match
    const bestMatch = mappings.sort((a, b) => b.confidence - a.confidence)[0];
    return bestMatch;
  }

  getCrossDeviceMappings(userId: string, tenantId: string): CrossDeviceMapping[] {
    const mappings: CrossDeviceMapping[] = [];
    this.crossDeviceMappings.forEach(mapping => {
      if (mapping.userId === userId) {
        mappings.push(mapping);
      }
    });
    return mappings;
  }

  // Sync Job Management
  getSyncJob(id: string): SyncJob | undefined {
    return this.syncJobs.get(id);
  }

  getSyncJobs(audienceId?: string): SyncJob[] {
    const jobs: SyncJob[] = [];
    this.syncJobs.forEach(job => {
      if (audienceId && job.audienceId !== audienceId) return;
      jobs.push(job);
    });
    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Statistics
  getStats(tenantId: string): {
    totalAudiences: number;
    activeAudiences: number;
    totalMembers: number;
    totalMappings: number;
    byProvider: Record<string, number>;
    byType: Record<string, number>;
  } {
    let totalAudiences = 0;
    let activeAudiences = 0;
    let totalMembers = 0;
    let totalMappings = 0;
    const byProvider: Record<string, number> = {};
    const byType: Record<string, number> = {};

    this.audiences.forEach((audience, key) => {
      if (!key.startsWith(`${tenantId}:`)) return;
      totalAudiences++;
      if (audience.status === AudienceStatus.ACTIVE) activeAudiences++;
      totalMembers += audience.size;
      byProvider[audience.provider] = (byProvider[audience.provider] || 0) + 1;
      byType[audience.audienceType] = (byType[audience.audienceType] || 0) + 1;
    });

    this.crossDeviceMappings.forEach(() => totalMappings++);

    return { totalAudiences, activeAudiences, totalMembers, totalMappings, byProvider, byType };
  }
}

export default new AudienceService();
