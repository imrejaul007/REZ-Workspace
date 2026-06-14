/**
 * Service Request Service - Business logic for service requests
 */

import { ServiceRequest, IServiceRequest } from '../models/ServiceRequest';
import { logger } from '../config/logger';
import { ServiceRequestInput, ServiceRequestStatus } from '../types';

export class ServiceRequestService {
  /**
   * Create a new service request
   */
  async createRequest(input: ServiceRequestInput): Promise<IServiceRequest> {
    try {
      const request = new ServiceRequest({
        guestId: input.guestId,
        roomNumber: input.roomNumber?.trim() || '',
        type: input.type,
        description: input.description.trim(),
        status: 'pending',
        priority: input.priority || 'medium',
      });

      await request.save();
      logger.info('Service request created', { requestId: request._id, type: request.type, roomNumber: request.roomNumber });
      return request;
    } catch (error) {
      logger.error('Failed to create service request', { error: (error as Error).message, input });
      throw error;
    }
  }

  /**
   * Get request by ID
   */
  async getRequestById(id: string): Promise<IServiceRequest | null> {
    try {
      const request = await ServiceRequest.findById(id);
      return request;
    } catch (error) {
      logger.error('Failed to get request', { error: (error as Error).message, requestId: id });
      throw error;
    }
  }

  /**
   * Get requests with filters
   */
  async getRequests(filters: {
    status?: ServiceRequestStatus;
    type?: string;
    priority?: string;
    roomNumber?: string;
  }): Promise<{ requests: IServiceRequest[]; count: number }> {
    try {
      const query: Record<string, unknown> = {};

      if (filters.status) query.status = filters.status;
      if (filters.type) query.type = filters.type;
      if (filters.priority) query.priority = filters.priority;
      if (filters.roomNumber) query.roomNumber = filters.roomNumber;

      const requests = await ServiceRequest.find(query)
        .sort({ priority: -1, createdAt: 1 })
        .lean();

      return { requests, count: requests.length };
    } catch (error) {
      logger.error('Failed to get requests', { error: (error as Error).message, filters });
      throw error;
    }
  }

  /**
   * Update request status
   */
  async updateStatus(id: string, status: ServiceRequestStatus): Promise<IServiceRequest | null> {
    try {
      const updateData: Record<string, unknown> = { status };

      if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      const request = await ServiceRequest.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (request) {
        logger.info('Service request status updated', { requestId: id, status });
      }

      return request;
    } catch (error) {
      logger.error('Failed to update request status', { error: (error as Error).message, requestId: id });
      throw error;
    }
  }

  /**
   * Get pending requests count
   */
  async getPendingRequestsCount(): Promise<number> {
    try {
      const count = await ServiceRequest.countDocuments({ status: 'pending' });
      return count;
    } catch (error) {
      logger.error('Failed to get pending requests count', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get requests by type
   */
  async getRequestsByType(): Promise<Record<string, number>> {
    try {
      const results = await ServiceRequest.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]);

      return results.reduce((acc, r) => {
        acc[r._id as string] = r.count;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      logger.error('Failed to get requests by type', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get requests for room
   */
  async getRequestsForRoom(roomNumber: string): Promise<IServiceRequest[]> {
    try {
      const requests = await ServiceRequest.find({ roomNumber: roomNumber.trim() })
        .sort({ createdAt: -1 })
        .lean();
      return requests;
    } catch (error) {
      logger.error('Failed to get requests for room', { error: (error as Error).message, roomNumber });
      throw error;
    }
  }

  /**
   * Get active requests
   */
  async getActiveRequests(): Promise<IServiceRequest[]> {
    try {
      const requests = await ServiceRequest.find({
        status: { $in: ['pending', 'in_progress'] },
      })
        .sort({ priority: -1, createdAt: 1 })
        .lean();
      return requests;
    } catch (error) {
      logger.error('Failed to get active requests', { error: (error as Error).message });
      throw error;
    }
  }
}

export const serviceRequestService = new ServiceRequestService();
export default serviceRequestService;