import { ShiftCoverage, Shift } from '../models';
import { CreateCoverageInput, UpdateCoverageInput } from '../types/schemas';
import { IShiftCoverage } from '../types';

export class CoverageService {
  /**
   * Create coverage requirement for a shift
   */
  async createCoverage(input: CreateCoverageInput): Promise<IShiftCoverage> {
    // Validate shift exists
    const shift = await Shift.findById(input.shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }

    const coverage = new ShiftCoverage({
      shiftId: input.shiftId,
      date: input.date,
      required: input.required,
      assigned: input.assigned || 0,
    });

    await coverage.save();
    return coverage;
  }

  /**
   * Get coverage by ID
   */
  async getCoverageById(id: string): Promise<IShiftCoverage | null> {
    return ShiftCoverage.findById(id).populate('shiftId');
  }

  /**
   * Get coverage for a specific date
   */
  async getCoverageByDate(date: string): Promise<IShiftCoverage[]> {
    return ShiftCoverage.find({ date })
      .populate({
        path: 'shiftId',
        populate: { path: 'templateId' },
      })
      .sort({ createdAt: -1 });
  }

  /**
   * Get coverage by shift ID
   */
  async getCoverageByShiftId(shiftId: string): Promise<IShiftCoverage[]> {
    return ShiftCoverage.find({ shiftId }).sort({ date: -1 });
  }

  /**
   * Update coverage
   */
  async updateCoverage(
    id: string,
    input: UpdateCoverageInput
  ): Promise<IShiftCoverage | null> {
    const coverage = await ShiftCoverage.findById(id);
    if (!coverage) {
      return null;
    }

    if (input.required !== undefined) {
      coverage.required = input.required;
    }

    if (input.assigned !== undefined) {
      coverage.assigned = input.assigned;
    }

    await coverage.save();
    return coverage;
  }

  /**
   * Delete coverage
   */
  async deleteCoverage(id: string): Promise<boolean> {
    const result = await ShiftCoverage.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Get coverage summary for a date
   */
  async getCoverageSummary(date: string): Promise<{
    date: string;
    totalRequired: number;
    totalAssigned: number;
    coveragePercentage: number;
    understaffed: IShiftCoverage[];
    overstaffed: IShiftCoverage[];
    fullyStaffed: IShiftCoverage[];
  }> {
    const coverages = await this.getCoverageByDate(date);

    let totalRequired = 0;
    let totalAssigned = 0;
    const understaffed: IShiftCoverage[] = [];
    const overstaffed: IShiftCoverage[] = [];
    const fullyStaffed: IShiftCoverage[] = [];

    for (const coverage of coverages) {
      totalRequired += coverage.required;
      totalAssigned += coverage.assigned;

      if (coverage.assigned < coverage.required) {
        understaffed.push(coverage);
      } else if (coverage.assigned > coverage.required) {
        overstaffed.push(coverage);
      } else {
        fullyStaffed.push(coverage);
      }
    }

    const coveragePercentage =
      totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 100;

    return {
      date,
      totalRequired,
      totalAssigned,
      coveragePercentage,
      understaffed,
      overstaffed,
      fullyStaffed,
    };
  }

  /**
   * Update coverage based on shift employees
   * (Recalculate assigned count from actual shift)
   */
  async syncCoverageWithShift(shiftId: string): Promise<IShiftCoverage[]> {
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }

    const coverages = await ShiftCoverage.find({ shiftId });

    for (const coverage of coverages) {
      coverage.assigned = shift.employees.length;
      await coverage.save();
    }

    return coverages;
  }

  /**
   * Create or update coverage for a shift
   */
  async upsertCoverage(
    shiftId: string,
    date: string,
    required: number
  ): Promise<IShiftCoverage> {
    let coverage = await ShiftCoverage.findOne({ shiftId, date });

    if (coverage) {
      coverage.required = required;
      await coverage.save();
    } else {
      coverage = new ShiftCoverage({
        shiftId,
        date,
        required,
        assigned: 0,
      });
      await coverage.save();
    }

    return coverage;
  }

  /**
   * Get coverage for a date range
   */
  async getCoverageByDateRange(
    startDate: string,
    endDate: string
  ): Promise<IShiftCoverage[]> {
    return ShiftCoverage.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .populate({
        path: 'shiftId',
        populate: { path: 'templateId' },
      })
      .sort({ date: 1 });
  }

  /**
   * Get days with understaffing
   */
  async getUnderstaffedDays(
    startDate: string,
    endDate: string
  ): Promise<Array<{
    date: string;
    coverages: IShiftCoverage[];
    shortfall: number;
  }>> {
    const coverages = await this.getCoverageByDateRange(startDate, endDate);

    // Group by date
    const byDate = new Map<string, IShiftCoverage[]>();
    for (const coverage of coverages) {
      const existing = byDate.get(coverage.date) || [];
      existing.push(coverage);
      byDate.set(coverage.date, existing);
    }

    // Filter for understaffed days
    const understaffedDays: Array<{
      date: string;
      coverages: IShiftCoverage[];
      shortfall: number;
    }> = [];

    for (const [date, dayCoverages] of byDate) {
      const shortfall = dayCoverages.reduce(
        (sum, c) => sum + Math.max(0, c.required - c.assigned),
        0
      );

      if (shortfall > 0) {
        understaffedDays.push({
          date,
          coverages: dayCoverages.filter((c) => c.assigned < c.required),
          shortfall,
        });
      }
    }

    return understaffedDays.sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const coverageService = new CoverageService();
