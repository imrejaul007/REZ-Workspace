import { Shift, ShiftTemplate } from '../models';
import { CreateShiftInput, UpdateShiftInput, BulkCreateShiftsInput } from '../types/schemas';
import { IShift, ShiftStatus } from '../types';
import mongoose from 'mongoose';

export class ShiftService {
  /**
   * Create a new shift
   */
  async createShift(input: CreateShiftInput): Promise<IShift> {
    // Validate template exists
    const template = await ShiftTemplate.findById(input.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const shift = new Shift({
      date: input.date,
      templateId: input.templateId,
      employees: input.employees,
      status: input.status || ShiftStatus.DRAFT,
      notes: input.notes,
    });

    await shift.save();
    return shift;
  }

  /**
   * Get shifts for a specific date
   */
  async getShiftsByDate(
    date: string,
    includeDetails: boolean = false
  ): Promise<IShift[]> {
    const query = Shift.find({ date }).sort({ 'templateId': 1 });

    if (includeDetails) {
      query.populate('templateId');
    }

    return query;
  }

  /**
   * Get shift by ID
   */
  async getShiftById(id: string, includeDetails: boolean = false): Promise<IShift | null> {
    const query = Shift.findById(id);
    if (includeDetails) {
      query.populate('templateId');
    }
    return query;
  }

  /**
   * Update a shift
   */
  async updateShift(id: string, input: UpdateShiftInput): Promise<IShift | null> {
    const shift = await Shift.findById(id);
    if (!shift) {
      return null;
    }

    if (input.templateId !== undefined) {
      const template = await ShiftTemplate.findById(input.templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      shift.templateId = new mongoose.Types.ObjectId(input.templateId) as any;
    }

    if (input.employees !== undefined) {
      shift.employees = input.employees;
    }

    if (input.status !== undefined) {
      shift.status = input.status as ShiftStatus;
    }

    if (input.notes !== undefined) {
      shift.notes = input.notes;
    }

    await shift.save();
    return shift;
  }

  /**
   * Delete a shift
   */
  async deleteShift(id: string): Promise<boolean> {
    const result = await Shift.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Bulk create shifts for a date range
   */
  async bulkCreateShifts(input: BulkCreateShiftsInput): Promise<{ created: number; shifts: IShift[] }> {
    const shifts: IShift[] = [];
    const errors: string[] = [];

    // Parse dates
    const startDate = new Date(input.dateRange.startDate);
    const endDate = new Date(input.dateRange.endDate);

    // Validate date range
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    // Iterate through each date
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      for (const templateConfig of input.templates) {
        try {
          // Validate template exists
          const template = await ShiftTemplate.findById(templateConfig.templateId);
          if (!template) {
            errors.push(`Template ${templateConfig.templateId} not found for date ${dateStr}`);
            continue;
          }

          const shift = new Shift({
            date: dateStr,
            templateId: templateConfig.templateId,
            employees: templateConfig.employees || [],
            status: input.status || ShiftStatus.DRAFT,
          });

          await shift.save();
          shifts.push(shift);
        } catch (err) {
          const error = err as Error;
          errors.push(`Error creating shift for ${dateStr}: ${error.message}`);
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      created: shifts.length,
      shifts,
    };
  }

  /**
   * Assign employee to shift
   */
  async assignEmployee(shiftId: string, employeeId: string): Promise<IShift | null> {
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return null;
    }

    if (!shift.employees.includes(employeeId)) {
      shift.employees.push(employeeId);
      await shift.save();
    }

    return shift;
  }

  /**
   * Remove employee from shift
   */
  async removeEmployee(shiftId: string, employeeId: string): Promise<IShift | null> {
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return null;
    }

    shift.employees = shift.employees.filter((e) => e !== employeeId);
    await shift.save();
    return shift;
  }

  /**
   * Get shifts by employee ID
   */
  async getShiftsByEmployee(
    employeeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<IShift[]> {
    const query: Record<string, unknown> = { employees: employeeId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        (query.date as Record<string, string>).$gte = startDate;
      }
      if (endDate) {
        (query.date as Record<string, string>).$lte = endDate;
      }
    }

    return Shift.find(query).populate('templateId').sort({ date: 1 });
  }

  /**
   * Update shift status
   */
  async updateStatus(id: string, status: ShiftStatus): Promise<IShift | null> {
    return Shift.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  }
}

export const shiftService = new ShiftService();
