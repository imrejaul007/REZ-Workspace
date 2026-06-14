import mongoose, { Types } from 'mongoose';
import { ConciergeRequest, IConciergeRequest, CONCIERGE_REQUEST_STATUSES } from '../models/ConciergeRequest';
import { logger } from '../config/logger';

export interface ConciergeInput {
  storeId: string;
  roomId: string;
  guestName: string;
  guestPhone: string;
  type: 'room_service' | 'taxi' | 'restaurant' | 'spa' | 'tour' | 'other';
  description: string;
  preferredTime?: Date;
  notes?: string;
}

export class ConciergeService {
  /**
   * Create a new concierge request
   */
  async createRequest(data: ConciergeInput): Promise<IConciergeRequest> {
    const request = new ConciergeRequest({
      storeId: new Types.ObjectId(data.storeId),
      roomId: data.roomId,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      type: data.type,
      description: data.description,
      preferredTime: data.preferredTime,
      notes: data.notes,
      status: 'pending',
    });

    await request.save();

    logger.info('[Concierge] Request created', {
      requestId: request._id,
      storeId: data.storeId,
      roomId: data.roomId,
      guestName: data.guestName,
      type: data.type,
    });

    return request;
  }

  /**
   * Get requests for a store, optionally filtered by status
   */
  async getRequests(storeId: string, status?: string): Promise<IConciergeRequest[]> {
    const query: Record<string, unknown> = {
      storeId: new Types.ObjectId(storeId),
    };

    if (status && CONCIERGE_REQUEST_STATUSES.includes(status as 'pending' | 'in_progress' | 'completed' | 'cancelled')) {
      query.status = status;
    }

    const requests = await ConciergeRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return requests;
  }

  /**
   * Assign a request to a staff member
   */
  async assignRequest(requestId: string, staffId: string): Promise<void> {
    const request = await ConciergeRequest.findById(requestId);
    if (!request) {
      throw new Error('Concierge request not found');
    }

    if (request.status === 'completed' || request.status === 'cancelled') {
      throw new Error('Cannot assign to a completed or cancelled request');
    }

    request.assignedTo = new Types.ObjectId(staffId);
    request.status = 'in_progress';
    await request.save();

    logger.info('[Concierge] Request assigned', {
      requestId,
      staffId,
    });
  }

  /**
   * Complete a concierge request
   */
  async completeRequest(requestId: string, notes?: string): Promise<void> {
    const request = await ConciergeRequest.findById(requestId);
    if (!request) {
      throw new Error('Concierge request not found');
    }

    if (request.status === 'completed' || request.status === 'cancelled') {
      throw new Error('Request is already completed or cancelled');
    }

    request.status = 'completed';
    request.completedAt = new Date();
    if (notes) {
      request.notes = notes;
    }
    await request.save();

    logger.info('[Concierge] Request completed', {
      requestId,
      completedAt: request.completedAt,
    });
  }

  /**
   * Add feedback and rating to a completed request
   */
  async addFeedback(requestId: string, rating: number, feedback?: string): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const request = await ConciergeRequest.findById(requestId);
    if (!request) {
      throw new Error('Concierge request not found');
    }

    if (request.status !== 'completed') {
      throw new Error('Can only add feedback to completed requests');
    }

    request.rating = rating;
    if (feedback) {
      request.feedback = feedback;
    }
    await request.save();

    logger.info('[Concierge] Feedback added', {
      requestId,
      rating,
      hasFeedback: !!feedback,
    });
  }

  /**
   * Get guest request history by phone number
   */
  async getGuestHistory(guestPhone: string): Promise<IConciergeRequest[]> {
    const requests = await ConciergeRequest.find({ guestPhone })
      .sort({ createdAt: -1 })
      .lean();

    return requests;
  }

  /**
   * Get requests assigned to a specific staff member
   */
  async getStaffRequests(staffId: string, status?: string): Promise<IConciergeRequest[]> {
    const query: Record<string, unknown> = {
      assignedTo: new Types.ObjectId(staffId),
    };

    if (status && CONCIERGE_REQUEST_STATUSES.includes(status as 'pending' | 'in_progress' | 'completed' | 'cancelled')) {
      query.status = status;
    }

    const requests = await ConciergeRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return requests;
  }

  /**
   * Cancel a concierge request
   */
  async cancelRequest(requestId: string, reason?: string): Promise<void> {
    const request = await ConciergeRequest.findById(requestId);
    if (!request) {
      throw new Error('Concierge request not found');
    }

    if (request.status === 'completed') {
      throw new Error('Cannot cancel a completed request');
    }

    request.status = 'cancelled';
    if (reason) {
      request.notes = reason;
    }
    await request.save();

    logger.info('[Concierge] Request cancelled', {
      requestId,
      reason,
    });
  }
}

// Factory function
export function createConciergeService(): ConciergeService {
  return new ConciergeService();
}

// Default instance
export const conciergeService = new ConciergeService();
