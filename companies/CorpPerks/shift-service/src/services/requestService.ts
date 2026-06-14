import { ShiftRequest } from '../models';
import { CreateShiftRequestInput, ReviewShiftRequestInput } from '../types/schemas';
import { IShiftRequest, ShiftRequestStatus } from '../types';

export class ShiftRequestService {
  /**
   * Create a new shift request
   */
  async createRequest(input: CreateShiftRequestInput): Promise<IShiftRequest> {
    const request = new ShiftRequest({
      employeeId: input.employeeId,
      date: input.date,
      type: input.type,
      reason: input.reason,
      status: ShiftRequestStatus.PENDING,
    });

    await request.save();
    return request;
  }

  /**
   * Get requests by employee ID
   */
  async getRequestsByEmployee(
    employeeId: string,
    status?: ShiftRequestStatus
  ): Promise<IShiftRequest[]> {
    const query: Record<string, unknown> = { employeeId };
    if (status) {
      query.status = status;
    }

    return ShiftRequest.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get all pending requests
   */
  async getPendingRequests(
    page: number = 1,
    limit: number = 20
  ): Promise<{ requests: IShiftRequest[]; total: number }> {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      ShiftRequest.find({ status: ShiftRequestStatus.PENDING })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ShiftRequest.countDocuments({ status: ShiftRequestStatus.PENDING }),
    ]);

    return { requests, total };
  }

  /**
   * Review a shift request (approve or reject)
   */
  async reviewRequest(
    requestId: string,
    action: 'approve' | 'reject',
    reviewerId: string
  ): Promise<IShiftRequest | null> {
    const request = await ShiftRequest.findById(requestId);
    if (!request) {
      return null;
    }

    if (request.status !== ShiftRequestStatus.PENDING) {
      throw new Error('Request is not pending');
    }

    request.status =
      action === 'approve'
        ? ShiftRequestStatus.APPROVED
        : ShiftRequestStatus.REJECTED;
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();

    await request.save();
    return request;
  }

  /**
   * Cancel a shift request
   */
  async cancelRequest(requestId: string, userId: string): Promise<IShiftRequest | null> {
    const request = await ShiftRequest.findById(requestId);
    if (!request) {
      return null;
    }

    // Only the requester can cancel their request
    if (request.employeeId !== userId) {
      throw new Error('Only the requester can cancel this request');
    }

    if (request.status !== ShiftRequestStatus.PENDING) {
      throw new Error('Only pending requests can be cancelled');
    }

    request.status = ShiftRequestStatus.CANCELLED;
    await request.save();
    return request;
  }

  /**
   * Get request by ID
   */
  async getRequestById(id: string): Promise<IShiftRequest | null> {
    return ShiftRequest.findById(id);
  }

  /**
   * Get requests by date range
   */
  async getRequestsByDateRange(
    startDate: string,
    endDate: string,
    status?: ShiftRequestStatus
  ): Promise<IShiftRequest[]> {
    const query: Record<string, unknown> = {
      date: { $gte: startDate, $lte: endDate },
    };

    if (status) {
      query.status = status;
    }

    return ShiftRequest.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get request statistics for an employee
   */
  async getRequestStats(employeeId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const stats = await ShiftRequest.aggregate([
      { $match: { employeeId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    for (const stat of stats) {
      result.total += stat.count;
      switch (stat._id) {
        case ShiftRequestStatus.PENDING:
          result.pending = stat.count;
          break;
        case ShiftRequestStatus.APPROVED:
          result.approved = stat.count;
          break;
        case ShiftRequestStatus.REJECTED:
          result.rejected = stat.count;
          break;
      }
    }

    return result;
  }
}

export const shiftRequestService = new ShiftRequestService();
