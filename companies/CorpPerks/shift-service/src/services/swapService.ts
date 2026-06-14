import { ShiftSwap, Shift } from '../models';
import { CreateSwapRequestInput, ApproveSwapInput } from '../types/schemas';
import { IShiftSwap, SwapStatus } from '../types';

export class SwapService {
  /**
   * Create a swap request
   */
  async createSwapRequest(input: CreateSwapRequestInput): Promise<IShiftSwap> {
    // Validate shift exists
    const shift = await Shift.findById(input.shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }

    // Check if requester is assigned to this shift
    if (!shift.employees.includes(input.requesterId)) {
      throw new Error('Requester is not assigned to this shift');
    }

    // Check if requester already has a pending swap for this shift
    const existingSwap = await ShiftSwap.findOne({
      requesterId: input.requesterId,
      shiftId: input.shiftId,
      status: SwapStatus.PENDING,
    });

    if (existingSwap) {
      throw new Error('A pending swap request already exists for this shift');
    }

    const swapRequest = new ShiftSwap({
      requesterId: input.requesterId,
      targetId: input.targetId,
      shiftId: input.shiftId,
      reason: input.reason,
      status: SwapStatus.PENDING,
    });

    await swapRequest.save();
    return swapRequest;
  }

  /**
   * Get swap requests by requester
   */
  async getSwapRequestsByRequester(
    requesterId: string,
    status?: SwapStatus
  ): Promise<IShiftSwap[]> {
    const query: Record<string, unknown> = { requesterId };
    if (status) {
      query.status = status;
    }

    return ShiftSwap.find(query)
      .populate('shiftId')
      .sort({ createdAt: -1 });
  }

  /**
   * Get swap requests for target (pending approvals)
   */
  async getPendingSwapRequestsForTarget(targetId: string): Promise<IShiftSwap[]> {
    return ShiftSwap.find({
      targetId,
      status: SwapStatus.PENDING,
    })
      .populate('shiftId')
      .sort({ createdAt: -1 });
  }

  /**
   * Approve or reject a swap request
   */
  async processSwapRequest(
    swapId: string,
    action: 'approve' | 'reject',
    approverId: string
  ): Promise<IShiftSwap | null> {
    const swap = await ShiftSwap.findById(swapId);
    if (!swap) {
      return null;
    }

    if (swap.status !== SwapStatus.PENDING) {
      throw new Error('Swap request is not pending');
    }

    if (action === 'approve') {
      // Update swap status
      swap.status = SwapStatus.APPROVED;
      swap.approvedBy = approverId;
      swap.approvedAt = new Date();

      // Perform the actual swap in the shift
      const shift = await Shift.findById(swap.shiftId);
      if (shift) {
        // Replace requester with target in the shift
        const employeeIndex = shift.employees.indexOf(swap.requesterId);
        if (employeeIndex !== -1) {
          shift.employees.splice(employeeIndex, 1);

          // Add target if not already in shift
          if (!shift.employees.includes(swap.targetId)) {
            shift.employees.push(swap.targetId);
          }

          await shift.save();
        }
      }
    } else {
      swap.status = SwapStatus.REJECTED;
      swap.approvedBy = approverId;
      swap.approvedAt = new Date();
    }

    await swap.save();
    return swap;
  }

  /**
   * Cancel a swap request
   */
  async cancelSwapRequest(swapId: string, userId: string): Promise<IShiftSwap | null> {
    const swap = await ShiftSwap.findById(swapId);
    if (!swap) {
      return null;
    }

    // Only requester can cancel their own request
    if (swap.requesterId !== userId) {
      throw new Error('Only the requester can cancel this swap request');
    }

    if (swap.status !== SwapStatus.PENDING) {
      throw new Error('Only pending requests can be cancelled');
    }

    swap.status = SwapStatus.CANCELLED;
    await swap.save();
    return swap;
  }

  /**
   * Get swap request by ID
   */
  async getSwapRequestById(id: string): Promise<IShiftSwap | null> {
    return ShiftSwap.findById(id).populate('shiftId');
  }

  /**
   * Get all swap requests for a date range
   */
  async getSwapRequestsByDateRange(
    startDate: string,
    endDate: string,
    status?: SwapStatus
  ): Promise<IShiftSwap[]> {
    const shifts = await Shift.find({
      date: { $gte: startDate, $lte: endDate },
    }).select('_id');

    const shiftIds = shifts.map((s) => s._id);

    const query: Record<string, unknown> = {
      shiftId: { $in: shiftIds },
    };

    if (status) {
      query.status = status;
    }

    return ShiftSwap.find(query)
      .populate('shiftId')
      .sort({ createdAt: -1 });
  }
}

export const swapService = new SwapService();
