/**
 * Complaint AI - Grievance Management Agent
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
}

export interface ResolutionAction {
  id: string;
  complaintId: string;
  action: string;
  takenBy: string;
  timestamp: string;
}

export class ComplaintAI {
  private complaints: Map<string, Complaint> = new Map();
  private actions: Map<string, ResolutionAction> = new Map();

  async submitComplaint(data: Omit<Complaint, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Complaint> {
    const complaint: Complaint = {
      ...data,
      id: uuidv4(),
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.complaints.set(complaint.id, complaint);
    return complaint;
  }

  async acknowledgeComplaint(complaintId: string): Promise<Complaint | undefined> {
    const complaint = this.complaints.get(complaintId);
    if (!complaint) return undefined;

    complaint.status = 'acknowledged';
    complaint.updatedAt = new Date().toISOString();
    this.complaints.set(complaintId, complaint);
    return complaint;
  }

  async assignComplaint(complaintId: string, assignedTo: string): Promise<Complaint | undefined> {
    const complaint = this.complaints.get(complaintId);
    if (!complaint) return undefined;

    complaint.assignedTo = assignedTo;
    complaint.status = 'in-progress';
    complaint.updatedAt = new Date().toISOString();
    this.complaints.set(complaintId, complaint);
    return complaint;
  }

  async resolveComplaint(complaintId: string, resolution: string): Promise<Complaint | undefined> {
    const complaint = this.complaints.get(complaintId);
    if (!complaint) return undefined;

    complaint.status = 'resolved';
    complaint.resolution = resolution;
    complaint.resolvedAt = new Date().toISOString();
    complaint.updatedAt = new Date().toISOString();
    this.complaints.set(complaintId, complaint);
    return complaint;
  }

  async escalateComplaint(complaintId: string, reason: string): Promise<Complaint | undefined> {
    const complaint = this.complaints.get(complaintId);
    if (!complaint) return undefined;

    complaint.status = 'escalated';
    complaint.priority = 'high';
    complaint.updatedAt = new Date().toISOString();

    const action: ResolutionAction = {
      id: uuidv4(),
      complaintId,
      action: `Escalated: ${reason}`,
      takenBy: 'System',
      timestamp: new Date().toISOString()
    };
    this.actions.set(action.id, action);

    this.complaints.set(complaintId, complaint);
    return complaint;
  }

  async getComplaints(filters?: { status?: Complaint['status']; category?: string; flatNumber?: string }): Promise<Complaint[]> {
    let result = Array.from(this.complaints.values());

    if (filters?.status) result = result.filter(c => c.status === filters.status);
    if (filters?.category) result = result.filter(c => c.category === filters.category);
    if (filters?.flatNumber) result = result.filter(c => c.complainantFlat === filters.flatNumber);

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getComplaintAnalytics(period: 'week' | 'month' | 'quarter'): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    avgResolutionTime: number;
    satisfactionScore: number;
    trends: { period: string; count: number }[];
  }> {
    return {
      total: Math.floor(Math.random() * 50) + 10,
      byStatus: { resolved: 60, 'in-progress': 20, pending: 15, escalated: 5 },
      byCategory: { noise: 25, parking: 20, maintenance: 30, cleanliness: 15, other: 10 },
      avgResolutionTime: 48,
      satisfactionScore: 4.2,
      trends: [
        { period: 'Week 1', count: 12 },
        { period: 'Week 2', count: 8 },
        { period: 'Week 3', count: 15 },
        { period: 'Week 4', count: 10 }
      ]
    };
  }

  async autoCategorize(description: string): Promise<Complaint['category']> {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('noise') || lowerDesc.includes('loud') || lowerDesc.includes('party')) return 'noise';
    if (lowerDesc.includes('parking') || lowerDesc.includes('car') || lowerDesc.includes('vehicle')) return 'parking';
    if (lowerDesc.includes('clean') || lowerDesc.includes('dirty') || lowerDesc.includes('garbage')) return 'cleanliness';
    if (lowerDesc.includes('safety') || lowerDesc.includes('security') || lowerDesc.includes('lock')) return 'safety';
    if (lowerDesc.includes('maintenance') || lowerDesc.includes('repair') || lowerDesc.includes('leak')) return 'maintenance';
    if (lowerDesc.includes('bill') || lowerDesc.includes('maintenance charge') || lowerDesc.includes('due')) return 'bill';

    return 'other';
  }
}

export default ComplaintAI;