import {
  DataRequestType,
  DataRequestStatus,
  PaginationParams,
  PaginatedResponse
} from '../types';

export interface DataRequest {
  id: string;
  userId: string;
  type: DataRequestType;
  status: DataRequestStatus;
  requestedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  processor?: string;
  dataCategories: string[];
  reason?: string;
  notes?: string;
  attachments?: string[];
  estimatedCompletionDate?: Date;
  rejectionReason?: string;
  metadata?: Record<string, unknown>;
}

export interface DataRequestCreateInput {
  userId: string;
  type: DataRequestType;
  dataCategories?: string[];
  reason?: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
}

export interface DataRequestUpdateInput {
  status?: DataRequestStatus;
  processor?: string;
  notes?: string;
  rejectionReason?: string;
  estimatedCompletionDate?: Date;
  metadata?: Record<string, unknown>;
}

export interface DataRequestQuery {
  userId?: string;
  type?: DataRequestType;
  status?: DataRequestStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export class DataRequestModel {
  private requests: Map<string, DataRequest> = new Map();

  async create(input: DataRequestCreateInput): Promise<DataRequest> {
    const id = this.generateId();
    const now = new Date();

    const request: DataRequest = {
      id,
      userId: input.userId,
      type: input.type,
      status: DataRequestStatus.PENDING,
      requestedAt: now,
      updatedAt: now,
      dataCategories: input.dataCategories || ['personal_data'],
      reason: input.reason,
      attachments: input.attachments,
      metadata: input.metadata,
      estimatedCompletionDate: this.calculateEstimatedDate(input.type)
    };

    this.requests.set(id, request);
    return request;
  }

  async findById(id: string): Promise<DataRequest | null> {
    return this.requests.get(id) || null;
  }

  async findByUserId(
    userId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<DataRequest>> {
    const userRequests = Array.from(this.requests.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

    return this.paginate(userRequests, pagination);
  }

  async findByQuery(
    query: DataRequestQuery,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<DataRequest>> {
    let filtered = Array.from(this.requests.values());

    if (query.userId) {
      filtered = filtered.filter(r => r.userId === query.userId);
    }
    if (query.type) {
      filtered = filtered.filter(r => r.type === query.type);
    }
    if (query.status) {
      filtered = filtered.filter(r => r.status === query.status);
    }
    if (query.dateFrom) {
      filtered = filtered.filter(r => r.requestedAt >= query.dateFrom!);
    }
    if (query.dateTo) {
      filtered = filtered.filter(r => r.requestedAt <= query.dateTo!);
    }

    filtered.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

    return this.paginate(filtered, pagination);
  }

  async update(id: string, input: DataRequestUpdateInput): Promise<DataRequest | null> {
    const request = this.requests.get(id);
    if (!request) {
      return null;
    }

    const now = new Date();
    const updated: DataRequest = {
      ...request,
      ...input,
      updatedAt: now
    };

    if (input.status === DataRequestStatus.COMPLETED) {
      updated.completedAt = now;
    }

    this.requests.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.requests.delete(id);
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    byType: Record<DataRequestType, number>;
  }> {
    const all = Array.from(this.requests.values());

    return {
      total: all.length,
      pending: all.filter(r => r.status === DataRequestStatus.PENDING).length,
      inProgress: all.filter(r => r.status === DataRequestStatus.IN_PROGRESS).length,
      completed: all.filter(r => r.status === DataRequestStatus.COMPLETED).length,
      byType: {
        [DataRequestType.ACCESS]: all.filter(r => r.type === DataRequestType.ACCESS).length,
        [DataRequestType.ERASURE]: all.filter(r => r.type === DataRequestType.ERASURE).length,
        [DataRequestType.RECTIFICATION]: all.filter(r => r.type === DataRequestType.RECTIFICATION).length,
        [DataRequestType.PORTABILITY]: all.filter(r => r.type === DataRequestType.PORTABILITY).length,
        [DataRequestType.RESTRICTION]: all.filter(r => r.type === DataRequestType.RESTRICTION).length,
        [DataRequestType.OBJECTION]: all.filter(r => r.type === DataRequestType.OBJECTION).length
      }
    };
  }

  private paginate(
    items: DataRequest[],
    pagination?: PaginationParams
  ): PaginatedResponse<DataRequest> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = items.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages
    };
  }

  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateEstimatedDate(type: DataRequestType): Date {
    const now = new Date();
    const daysMap: Record<DataRequestType, number> = {
      [DataRequestType.ACCESS]: 30,
      [DataRequestType.ERASURE]: 30,
      [DataRequestType.RECTIFICATION]: 30,
      [DataRequestType.PORTABILITY]: 30,
      [DataRequestType.RESTRICTION]: 30,
      [DataRequestType.OBJECTION]: 30
    };
    const days = daysMap[type];
    now.setDate(now.getDate() + days);
    return now;
  }
}

export const dataRequestModel = new DataRequestModel();
