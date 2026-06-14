import { Shift, IShift, ShiftStatus, Staff } from '../models';
import { Types } from 'mongoose';

export interface CreateShiftDTO {
  merchantId: string;
  staffId: string;
  date: Date;
  startTime: string;
  endTime: string;
  role: string;
  breakMinutes?: number;
  notes?: string;
}

export interface UpdateShiftDTO {
  date?: Date;
  startTime?: string;
  endTime?: string;
  role?: string;
  status?: ShiftStatus;
  breakMinutes?: number;
  notes?: string;
}

export interface ShiftSwapDTO {
  shiftId1: string;
  shiftId2: string;
}

export interface ScheduleFilters {
  merchantId: string;
  startDate: Date;
  endDate: Date;
  staffId?: string;
  role?: string;
  status?: ShiftStatus;
}

export class ShiftService {
  /**
   * Create a new shift
   */
  async createShift(data: CreateShiftDTO): Promise<IShift> {
    // Validate staff exists
    const staff = await Staff.findById(data.staffId);
    if (!staff) {
      throw new Error('Staff member not found');
    }

    // Check for overlapping shifts
    const overlapping = await this.checkOverlap(
      data.staffId,
      data.date,
      data.startTime,
      data.endTime
    );
    if (overlapping) {
      throw new Error('Shift overlaps with existing shift');
    }

    const shift = new Shift({
      ...data,
      staffId: new Types.ObjectId(data.staffId),
      status: 'scheduled',
    });

    await shift.save();
    return shift;
  }

  /**
   * Get shift by ID
   */
  async getShiftById(id: string): Promise<IShift | null> {
    return Shift.findById(id).populate('staffId');
  }

  /**
   * Update shift
   */
  async updateShift(id: string, data: UpdateShiftDTO): Promise<IShift | null> {
    const shift = await Shift.findById(id);
    if (!shift) {
      return null;
    }

    // Check for overlapping shifts if time is being changed
    if (data.date || data.startTime || data.endTime) {
      const overlapping = await this.checkOverlap(
        shift.staffId.toString(),
        data.date || shift.date,
        data.startTime || shift.startTime,
        data.endTime || shift.endTime,
        id
      );
      if (overlapping) {
        throw new Error('Shift overlaps with existing shift');
      }
    }

    const updatedShift = await Shift.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('staffId');

    return updatedShift;
  }

  /**
   * Delete shift
   */
  async deleteShift(id: string): Promise<boolean> {
    const result = await Shift.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Get schedule for date range with filters
   */
  async getSchedule(filters: ScheduleFilters): Promise<{
    shifts: IShift[];
    total: number;
    summary: {
      totalShifts: number;
      byRole: Record<string, number>;
      byStatus: Record<ShiftStatus, number>;
    };
  }> {
    const query: Record<string, unknown> = {
      merchantId: filters.merchantId,
      date: {
        $gte: new Date(filters.startDate.setHours(0, 0, 0, 0)),
        $lte: new Date(filters.endDate.setHours(23, 59, 59, 999)),
      },
    };

    if (filters.staffId) {
      query.staffId = new Types.ObjectId(filters.staffId);
    }

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const [shifts, total] = await Promise.all([
      Shift.find(query)
        .populate('staffId', 'name employeeId role')
        .sort({ date: 1, startTime: 1 }),
      Shift.countDocuments(query),
    ]);

    // Generate summary
    const summary = {
      totalShifts: shifts.length,
      byRole: {} as Record<string, number>,
      byStatus: {
        scheduled: 0,
        confirmed: 0,
        completed: 0,
        absent: 0,
      } as Record<ShiftStatus, number>,
    };

    shifts.forEach((shift) => {
      summary.byRole[shift.role] = (summary.byRole[shift.role] || 0) + 1;
      summary.byStatus[shift.status]++;
    });

    return { shifts, total, summary };
  }

  /**
   * Swap two shifts between staff members
   */
  async swapShifts(data: ShiftSwapDTO): Promise<{ shift1: IShift; shift2: IShift }> {
    const [shift1, shift2] = await Promise.all([
      Shift.findById(data.shiftId1),
      Shift.findById(data.shiftId2),
    ]);

    if (!shift1 || !shift2) {
      throw new Error('One or both shifts not found');
    }

    // Ensure both shifts belong to the same merchant and date
    if (shift1.merchantId !== shift2.merchantId) {
      throw new Error('Shifts must belong to the same merchant');
    }

    if (shift1.date.toDateString() !== shift2.date.toDateString()) {
      throw new Error('Shifts must be on the same date for swapping');
    }

    // Swap the staff IDs
    const tempStaffId = shift1.staffId;
    shift1.staffId = shift2.staffId;
    shift2.staffId = tempStaffId;

    // Reset statuses to scheduled
    shift1.status = 'scheduled';
    shift2.status = 'scheduled';

    await Promise.all([shift1.save(), shift2.save()]);

    return {
      shift1: (await shift1.populate('staffId', 'name employeeId role')) as IShift,
      shift2: (await shift2.populate('staffId', 'name employeeId role')) as IShift,
    };
  }

  /**
   * Confirm a shift
   */
  async confirmShift(id: string): Promise<IShift | null> {
    return Shift.findByIdAndUpdate(
      id,
      { $set: { status: 'confirmed' } },
      { new: true }
    );
  }

  /**
   * Mark shift as completed
   */
  async completeShift(id: string): Promise<IShift | null> {
    return Shift.findByIdAndUpdate(
      id,
      { $set: { status: 'completed' } },
      { new: true }
    );
  }

  /**
   * Mark shift as absent
   */
  async markAbsent(id: string): Promise<IShift | null> {
    return Shift.findByIdAndUpdate(
      id,
      { $set: { status: 'absent' } },
      { new: true }
    );
  }

  /**
   * Check for overlapping shifts
   */
  private async checkOverlap(
    staffId: string,
    date: Date,
    startTime: string,
    endTime: string,
    excludeShiftId?: string
  ): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query: Record<string, unknown> = {
      staffId: new Types.ObjectId(staffId),
      date: { $gte: startOfDay, $lte: endOfDay },
      $or: [
        // New shift starts during existing shift
        {
          startTime: { $lte: startTime },
          endTime: { $gt: startTime },
        },
        // New shift ends during existing shift
        {
          startTime: { $lt: endTime },
          endTime: { $gte: endTime },
        },
        // New shift completely contains existing shift
        {
          startTime: { $gte: startTime },
          endTime: { $lte: endTime },
        },
      ],
    };

    if (excludeShiftId) {
      query._id = { $ne: new Types.ObjectId(excludeShiftId) };
    }

    const count = await Shift.countDocuments(query);
    return count > 0;
  }

  /**
   * Get shifts for a specific staff member
   */
  async getStaffShifts(
    staffId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IShift[]> {
    return Shift.find({
      staffId: new Types.ObjectId(staffId),
      date: {
        $gte: new Date(startDate.setHours(0, 0, 0, 0)),
        $lte: new Date(endDate.setHours(23, 59, 59, 999)),
      },
    }).sort({ date: 1, startTime: 1 });
  }

  /**
   * Bulk create shifts
   */
  async bulkCreateShifts(shifts: CreateShiftDTO[]): Promise<{ created: IShift[]; failed: { data: CreateShiftDTO; error: string }[] }> {
    const created: IShift[] = [];
    const failed: { data: CreateShiftDTO; error: string }[] = [];

    for (const shiftData of shifts) {
      try {
        const shift = await this.createShift(shiftData);
        created.push(shift);
      } catch (error) {
        failed.push({
          data: shiftData,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { created, failed };
  }
}

export const shiftService = new ShiftService();
