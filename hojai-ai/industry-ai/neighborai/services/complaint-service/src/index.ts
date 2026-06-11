/**
 * Complaint Service - Grievance Management Backend
 * Part of NEIGHBORAI - Society Management AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface Complaint {
  id: string;
  complainantId: string;
  complainantFlat: string;
  againstId?: string;
  againstFlat?: string;
  category: 'noise' | 'parking' | 'cleanliness' | 'safety' | 'maintenance' | 'bill' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  status: 'submitted' | 'acknowledged' | 'in-progress' | 'resolved' | 'escalated' | 'closed';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  resolution?: string;
  attachments?: string[];
}

export interface ResolutionAction {
  id: string;
  complaintId: string;
  action: string;
  takenBy: string;
  timestamp: string;
  notes?: string;
}

export class ComplaintService {
  private complaints: Map<string, Complaint> = new Map();
  private actions: Map<string, ResolutionAction> = new Map();

  async create(data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>): Promise<Complaint> {
    const complaint: Complaint = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.complaints.set(complaint.id, complaint);
    return complaint;
  }

  async getById(id: string): Promise<Complaint | undefined> {
    return this.complaints.get(id);
  }

  async getAll(filters?: { status?: string; category?: string; priority?: string }): Promise<Complaint[]> {
    let result = Array.from(this.complaints.values());

    if (filters?.status) result = result.filter(c => c.status === filters.status);
    if (filters?.category) result = result.filter(c => c.category === filters.category);
    if (filters?.priority) result = result.filter(c => c.priority === filters.priority);

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async update(id: string, updates: Partial<Complaint>): Promise<Complaint | undefined> {
    const complaint = this.complaints.get(id);
    if (!complaint) return undefined;

    Object.assign(complaint, updates, { updatedAt: new Date().toISOString() });
    this.complaints.set(id, complaint);
    return complaint;
  }

  async addAction(complaintId: string, action: Omit<ResolutionAction, 'id' | 'complaintId' | 'timestamp'>): Promise<ResolutionAction> {
    const record: ResolutionAction = {
      ...action,
      id: uuidv4(),
      complaintId,
      timestamp: new Date().toISOString()
    };

    this.actions.set(record.id, record);
    return record;
  }

  async getActions(complaintId: string): Promise<ResolutionAction[]> {
    return Array.from(this.actions.values())
      .filter(a => a.complaintId === complaintId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async resolve(id: string, resolution: string): Promise<Complaint | undefined> {
    const complaint = this.complaints.get(id);
    if (!complaint) return undefined;

    complaint.status = 'resolved';
    complaint.resolution = resolution;
    complaint.resolvedAt = new Date().toISOString();
    complaint.updatedAt = new Date().toISOString();

    this.complaints.set(id, complaint);
    return complaint;
  }

  async escalate(id: string, reason: string): Promise<Complaint | undefined> {
    const complaint = this.complaints.get(id);
    if (!complaint) return undefined;

    complaint.status = 'escalated';
    complaint.priority = 'high';
    complaint.updatedAt = new Date().toISOString();

    await this.addAction(id, { action: `Escalated: ${reason}`, takenBy: 'System' });

    this.complaints.set(id, complaint);
    return complaint;
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    avgResolutionHours: number;
    satisfactionScore: number;
  }> {
    const complaints = Array.from(this.complaints.values());

    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    complaints.forEach(c => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    });

    const resolved = complaints.filter(c => c.status === 'resolved' && c.resolvedAt);
    const avgResolutionHours = resolved.length > 0
      ? resolved.reduce((sum, c) => {
          const created = new Date(c.createdAt).getTime();
          const resolved = new Date(c.resolvedAt!).getTime();
          return sum + (resolved - created) / (1000 * 60 * 60);
        }, 0) / resolved.length
      : 0;

    return {
      total: complaints.length,
      byStatus,
      byCategory,
      avgResolutionHours: Math.round(avgResolutionHours),
      satisfactionScore: 4.2
    };
  }
}

export default ComplaintService;