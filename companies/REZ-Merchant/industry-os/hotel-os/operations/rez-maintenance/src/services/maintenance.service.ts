/**
 * Maintenance Service - MongoDB-backed
 */
import { MaintenanceIssue } from '../models/MaintenanceIssue';
import { MaintenanceLog } from '../models/MaintenanceLog';
import { logger } from '../config/logger';
import axios from 'axios';

const log = (msg: string, meta?) => logger.info(`[maintenance] ${msg}`, meta);
const HOTEL_SERVICE_URL = process.env.HOTEL_SERVICE_URL || 'http://localhost:4020';

function generateId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

export const maintenanceService = {
  async createIssue(hotelId: string, input: any) {
    const issueId = generateId('MI');
    const issue = new MaintenanceIssue({ issueId, hotelId, ...input, status: 'reported', notes: [] });
    await issue.save();
    log('Issue created', { issueId, hotelId });
    return issue;
  },

  async getIssue(issueId: string) {
    return MaintenanceIssue.findOne({ issueId });
  },

  async getIssues(hotelId: string, filters?: { status?: string; category?: string; priority?: string }) {
    const query: Record<string, unknown> = { hotelId };
    if (filters?.status) query.status = filters.status;
    if (filters?.category) query.category = filters.category;
    if (filters?.priority) query.priority = filters.priority;
    return MaintenanceIssue.find(query).sort({ createdAt: -1 });
  },

  async updateIssue(issueId: string, input: any) {
    const updates: Record<string, unknown> = {};
    if (input.status) {
      updates.status = input.status;
      if (input.status === 'resolved') updates.resolvedAt = new Date();
      if (input.status === 'closed') updates.closedAt = new Date();
    }
    if (input.priority) updates.priority = input.priority;
    if (input.assignedTo) updates.assignedTo = input.assignedTo;
    if (input.notes) updates.notes = input.notes;

    const issue = await MaintenanceIssue.findOneAndUpdate({ issueId }, { $set: updates }, { new: true });
    if (issue) {
      log('Issue updated', { issueId, updates });
      if (issue.roomId && input.status === 'resolved') {
        try {
          await axios.patch(`${HOTEL_SERVICE_URL}/api/rooms/${issue.roomId}/status`, { status: 'available' }, { timeout: 5000 });
        } catch (e: any) { log('Notify failed', { error: e.message }); }
      }
    }
    return issue;
  },

  async addNote(issueId: string, note: string, performedBy: string) {
    const logId = generateId('ML');
    await MaintenanceLog.create({ logId, issueId, action: 'note_added', performedBy, details: note });
    await MaintenanceIssue.findOneAndUpdate({ issueId }, { $push: { notes: note } });
    return this.getIssue(issueId);
  },

  async assignIssue(issueId: string, staffId: string) {
    return this.updateIssue(issueId, { assignedTo: staffId, status: 'in_progress' });
  },

  async resolveIssue(issueId: string, performedBy: string) {
    const logId = generateId('ML');
    await MaintenanceLog.create({ logId, issueId, action: 'issue_resolved', performedBy });
    return this.updateIssue(issueId, { status: 'resolved' });
  },

  async closeIssue(issueId: string, performedBy: string) {
    const logId = generateId('ML');
    await MaintenanceLog.create({ logId, issueId, action: 'issue_closed', performedBy });
    return this.updateIssue(issueId, { status: 'closed' });
  },

  async getLogs(issueId: string) {
    return MaintenanceLog.find({ issueId }).sort({ createdAt: -1 });
  },

  async getStats(hotelId: string) {
    const issues = await MaintenanceIssue.find({ hotelId });
    const stats = { total: issues.length, byStatus: {} as Record<string, number>, byCategory: {} as Record<string, number>, avgResolutionTime: 0 };
    let totalResolutionTime = 0, resolvedCount = 0;

    for (const issue of issues) {
      stats.byStatus[issue.status] = (stats.byStatus[issue.status] || 0) + 1;
      stats.byCategory[issue.category] = (stats.byCategory[issue.category] || 0) + 1;
      if (issue.status === 'resolved' && issue.resolvedAt) {
        totalResolutionTime += issue.resolvedAt.getTime() - issue.createdAt.getTime();
        resolvedCount++;
      }
    }
    stats.avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount / 3600000 : 0;
    return stats;
  }
};
