import { Staff, Shift, IStaff, IShift, StaffRole } from '../models';
import { Types } from 'mongoose';
import { shiftService } from './shiftService';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface StaffingRequirement {
  role: StaffRole;
  minStaff: number;
  preferredStaff: number;
  timeSlots: TimeSlot[];
}

interface ShiftTemplate {
  date: Date;
  startTime: string;
  endTime: string;
  role: StaffRole;
  assignedStaffId?: string;
}

interface SchedulingConfig {
  merchantId: string;
  startDate: Date;
  endDate: Date;
  staffingRequirements: StaffingRequirement[];
  excludeStaffIds?: string[];
  preferRoles?: Record<string, StaffRole>;
}

interface ScheduleGenerationResult {
  success: boolean;
  shifts: Array<{
    shift: IShift;
    staff: IStaff;
  }>;
  unassigned: Array<{
    date: Date;
    role: StaffRole;
    reason: string;
  }>;
  coverage: {
    totalSlots: number;
    coveredSlots: number;
    coverageRate: number;
  };
}

interface DemandPrediction {
  date: Date;
  predictedDemand: 'low' | 'medium' | 'high';
  recommendedStaffCount: number;
  byRole: Record<StaffRole, number>;
}

export class SchedulingService {
  private readonly DEFAULT_TIME_SLOTS: TimeSlot[] = [
    { startTime: '06:00', endTime: '14:00' },  // Morning
    { startTime: '14:00', endTime: '22:00' },  // Evening
    { startTime: '10:00', endTime: '18:00' },  // Mid-day
    { startTime: '18:00', endTime: '02:00' },  // Night (next day)
  ];

  private readonly ROLE_PRIORITY: Record<StaffRole, number> = {
    manager: 1,
    chef: 2,
    cashier: 3,
    waiter: 4,
    kitchen: 5,
    delivery: 6,
  };

  /**
   * Generate schedule for a date range based on staffing requirements
   */
  async generateSchedule(config: SchedulingConfig): Promise<ScheduleGenerationResult> {
    const shifts: Array<{ shift: IShift; staff: IStaff }> = [];
    const unassigned: Array<{ date: Date; role: StaffRole; reason: string }> = [];
    let totalSlots = 0;
    let coveredSlots = 0;

    // Get all active staff for the merchant
    const staffList = await Staff.find({
      merchantId: config.merchantId,
      status: 'active',
      ...(config.excludeStaffIds && {
        _id: { $nin: config.excludeStaffIds.map((id) => new Types.ObjectId(id)) },
      }),
    });

    if (staffList.length === 0) {
      return {
        success: false,
        shifts: [],
        unassigned: [],
        coverage: { totalSlots: 0, coveredSlots: 0, coverageRate: 0 },
      };
    }

    // Group staff by role
    const staffByRole = this.groupStaffByRole(staffList);

    // Generate dates in range
    const dates = this.getDateRange(config.startDate, config.endDate);

    // Process each day
    for (const date of dates) {
      for (const requirement of config.staffingRequirements) {
        for (const slot of requirement.timeSlots) {
          totalSlots++;

          // Find available staff for this slot
          const availableStaff = this.findAvailableStaff(
            staffByRole[requirement.role],
            date,
            slot,
            shifts.map((s) => s.staff._id.toString())
          );

          if (availableStaff.length > 0) {
            // Select best staff based on criteria
            const selectedStaff = this.selectBestStaff(
              availableStaff,
              date,
              requirement.role
            );

            try {
              const shift = await shiftService.createShift({
                merchantId: config.merchantId,
                staffId: selectedStaff._id.toString(),
                date: new Date(date),
                startTime: slot.startTime,
                endTime: slot.endTime,
                role: requirement.role,
                breakMinutes: 30,
              });

              shifts.push({ shift, staff: selectedStaff });
              coveredSlots++;
            } catch (error) {
              unassigned.push({
                date: new Date(date),
                role: requirement.role,
                reason: error instanceof Error ? error.message : 'Failed to create shift',
              });
            }
          } else {
            unassigned.push({
              date: new Date(date),
              role: requirement.role,
              reason: `No available ${requirement.role} staff`,
            });
          }
        }
      }
    }

    return {
      success: coveredSlots === totalSlots,
      shifts,
      unassigned,
      coverage: {
        totalSlots,
        coveredSlots,
        coverageRate: totalSlots > 0 ? Math.round((coveredSlots / totalSlots) * 100) : 0,
      },
    };
  }

  /**
   * Optimize staffing based on historical data and predictions
   */
  async optimizeStaffing(
    merchantId: string,
    targetDate: Date
  ): Promise<StaffingRequirement[]> {
    // Predict demand for the date
    const prediction = await this.predictNeeds(merchantId, targetDate);

    // Map demand to staffing requirements
    const baseRequirements: StaffingRequirement[] = [
      {
        role: 'manager',
        minStaff: 1,
        preferredStaff: prediction.recommendedStaffCount > 20 ? 2 : 1,
        timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
      },
      {
        role: 'chef',
        minStaff: 2,
        preferredStaff: prediction.byRole.chef,
        timeSlots: this.getShiftsForDemand(prediction.predictedDemand),
      },
      {
        role: 'waiter',
        minStaff: 2,
        preferredStaff: prediction.byRole.waiter,
        timeSlots: this.getShiftsForDemand(prediction.predictedDemand),
      },
      {
        role: 'cashier',
        minStaff: 1,
        preferredStaff: prediction.recommendedStaffCount > 10 ? 2 : 1,
        timeSlots: [{ startTime: '08:00', endTime: '20:00' }],
      },
      {
        role: 'kitchen',
        minStaff: 2,
        preferredStaff: prediction.byRole.kitchen,
        timeSlots: this.getShiftsForDemand(prediction.predictedDemand),
      },
      {
        role: 'delivery',
        minStaff: 1,
        preferredStaff: prediction.byRole.delivery,
        timeSlots: [{ startTime: '11:00', endTime: '23:00' }],
      },
    ];

    return baseRequirements;
  }

  /**
   * Predict staffing needs based on historical patterns
   */
  async predictNeeds(
    merchantId: string,
    targetDate: Date
  ): Promise<DemandPrediction> {
    const dayOfWeek = targetDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Get historical shift data for the same day of week
    const fourWeeksAgo = new Date(targetDate);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const historicalShifts = await Shift.find({
      merchantId,
      date: {
        $gte: fourWeeksAgo,
        $lte: new Date(targetDate.getTime() - 24 * 60 * 60 * 1000), // Exclude target date
      },
      $expr: {
        $eq: [{ $dayOfWeek: '$date' }, dayOfWeek + 1], // MongoDB dayOfWeek is 1-7 (Sun-Sat)
      },
    });

    // Calculate average staffing per role
    const roleCounts: Record<StaffRole, number[]> = {
      manager: [],
      chef: [],
      waiter: [],
      cashier: [],
      kitchen: [],
      delivery: [],
    };

    const shiftsPerWeek: Record<string, number> = {};

    historicalShifts.forEach((shift) => {
      const weekKey = this.getWeekKey(shift.date);
      if (!shiftsPerWeek[weekKey]) {
        shiftsPerWeek[weekKey] = 0;
      }
      shiftsPerWeek[weekKey]++;
      const role = shift.role as StaffRole;
      if (roleCounts[role]) {
        roleCounts[role].push(1);
      }
    });

    const weekCount = Object.keys(shiftsPerWeek).length || 1;

    // Determine demand level
    let predictedDemand: 'low' | 'medium' | 'high';
    const avgShiftsPerDay = Object.values(shiftsPerWeek).reduce((a, b) => a + b, 0) / weekCount;

    if (avgShiftsPerDay >= 15 || isWeekend) {
      predictedDemand = 'high';
    } else if (avgShiftsPerDay >= 8) {
      predictedDemand = 'medium';
    } else {
      predictedDemand = 'low';
    }

    // Calculate recommended staff counts
    const recommendedStaffCount = Math.ceil(avgShiftsPerDay * 1.2); // 20% buffer

    const byRole: Record<StaffRole, number> = {
      manager: 1,
      chef: Math.max(2, Math.round(roleCounts.chef.length / weekCount * 1.2)),
      waiter: Math.max(3, Math.round(roleCounts.waiter.length / weekCount * 1.2)),
      cashier: Math.max(1, Math.round(roleCounts.cashier.length / weekCount * 1.2)),
      kitchen: Math.max(2, Math.round(roleCounts.kitchen.length / weekCount * 1.2)),
      delivery: Math.max(1, Math.round(roleCounts.delivery.length / weekCount * 1.2)),
    };

    return {
      date: targetDate,
      predictedDemand,
      recommendedStaffCount,
      byRole,
    };
  }

  /**
   * Auto-generate weekly schedule
   */
  async autoGenerateWeeklySchedule(
    merchantId: string,
    weekStartDate: Date
  ): Promise<ScheduleGenerationResult> {
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Optimize staffing for a typical weekday first
    const staffingRequirements = await this.optimizeStaffing(merchantId, weekStartDate);

    return this.generateSchedule({
      merchantId,
      startDate: weekStartDate,
      endDate: weekEnd,
      staffingRequirements,
    });
  }

  /**
   * Suggest shift swaps to improve coverage
   */
  async suggestShiftSwaps(
    merchantId: string,
    targetDate: Date
  ): Promise<Array<{
    shift1: IShift;
    shift2: IShift;
    improvement: string;
  }>> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const shifts = await Shift.find({
      merchantId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate('staffId', 'name role');

    const suggestions: Array<{
      shift1: IShift;
      shift2: IShift;
      improvement: string;
    }> = [];

    // Find understaffed roles
    const roleCount: Record<string, number> = {};
    shifts.forEach((shift) => {
      roleCount[shift.role] = (roleCount[shift.role] || 0) + 1;
    });

    // Compare with recommended staffing
    const prediction = await this.predictNeeds(merchantId, targetDate);

    for (const [role, count] of Object.entries(roleCount)) {
      const recommended = prediction.byRole[role as StaffRole] || 1;
      if (count < recommended) {
        // Find overstaffed roles that could swap
        for (const [otherRole, otherCount] of Object.entries(roleCount)) {
          if (otherRole !== role && otherCount > 1) {
            // Find shifts that could be swapped
            const understaffedShifts = shifts.filter(
              (s) => s.role === role
            );
            const overstaffedShifts = shifts.filter(
              (s) => s.role === otherRole && s.staffId
            );

            if (understaffedShifts.length > 0 && overstaffedShifts.length > 0) {
              suggestions.push({
                shift1: understaffedShifts[0],
                shift2: overstaffedShifts[0],
                improvement: `Swap to ensure ${role} coverage (current: ${count}, recommended: ${recommended})`,
              });
            }
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Validate schedule coverage
   */
  async validateSchedule(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    isValid: boolean;
    issues: Array<{
      date: Date;
      role: StaffRole;
      issue: string;
      severity: 'warning' | 'critical';
    }>;
    coverageRate: number;
  }> {
    const dates = this.getDateRange(startDate, endDate);
    const issues: Array<{
      date: Date;
      role: StaffRole;
      issue: string;
      severity: 'warning' | 'critical';
    }> = [];
    let totalRequired = 0;
    let totalCovered = 0;

    for (const date of dates) {
      const prediction = await this.predictNeeds(merchantId, date);
      const staffingReqs = await this.optimizeStaffing(merchantId, date);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const dayShifts = await Shift.find({
        merchantId,
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      for (const req of staffingReqs) {
        totalRequired += req.preferredStaff;

        const roleShifts = dayShifts.filter((s) => s.role === req.role);
        totalCovered += roleShifts.length;

        if (roleShifts.length < req.minStaff) {
          issues.push({
            date: new Date(date),
            role: req.role,
            issue: `Understaffed: ${roleShifts.length}/${req.minStaff} minimum staff`,
            severity: 'critical',
          });
        } else if (roleShifts.length < req.preferredStaff) {
          issues.push({
            date: new Date(date),
            role: req.role,
            issue: `Below optimal: ${roleShifts.length}/${req.preferredStaff} preferred staff`,
            severity: 'warning',
          });
        }
      }
    }

    return {
      isValid: issues.filter((i) => i.severity === 'critical').length === 0,
      issues,
      coverageRate: totalRequired > 0 ? Math.round((totalCovered / totalRequired) * 100) : 100,
    };
  }

  // Helper methods

  private groupStaffByRole(staffList: IStaff[]): Record<StaffRole, IStaff[]> {
    const grouped: Record<StaffRole, IStaff[]> = {
      manager: [],
      chef: [],
      waiter: [],
      cashier: [],
      kitchen: [],
      delivery: [],
    };

    staffList.forEach((staff) => {
      if (grouped[staff.role]) {
        grouped[staff.role].push(staff);
      }
    });

    return grouped;
  }

  private getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  private findAvailableStaff(
    staffOfRole: IStaff[],
    date: Date,
    slot: TimeSlot,
    alreadyAssigned: string[]
  ): IStaff[] {
    return staffOfRole.filter((staff) => {
      // Check if already assigned this slot
      if (alreadyAssigned.includes(staff._id.toString())) {
        return false;
      }

      // Check for conflicting shifts
      // (This would query the database in a real implementation)
      return true;
    });
  }

  private selectBestStaff(
    availableStaff: IStaff[],
    date: Date,
    role: StaffRole
  ): IStaff {
    // Score each staff member based on various factors
    const scored = availableStaff.map((staff) => {
      let score = 100;

      // Prefer staff with fewer shifts this week
      // This would be calculated from actual shift data
      score -= staff.get('shiftsThisWeek') as number || 0;

      // Prefer staff who haven't worked recently
      const daysSinceLastShift = this.getDaysSinceLastShift(staff._id.toString());
      score += Math.min(daysSinceLastShift, 10); // Max 10 points for rest

      // Prefer staff with good attendance record
      // This would be calculated from attendance data
      const attendanceScore = staff.get('attendanceScore') as number || 50;
      score += attendanceScore / 10; // 0-10 points

      return { staff, score };
    });

    // Sort by score and return the best
    scored.sort((a, b) => b.score - a.score);
    return scored[0].staff;
  }

  private getDaysSinceLastShift(staffId: string): number {
    // Placeholder - would query shift history
    return 2;
  }

  private getShiftsForDemand(demand: 'low' | 'medium' | 'high'): TimeSlot[] {
    switch (demand) {
      case 'high':
        return [
          { startTime: '06:00', endTime: '14:00' },
          { startTime: '14:00', endTime: '22:00' },
        ];
      case 'medium':
        return [{ startTime: '10:00', endTime: '18:00' }];
      case 'low':
        return [{ startTime: '11:00', endTime: '19:00' }];
      default:
        return [{ startTime: '10:00', endTime: '18:00' }];
    }
  }

  private getWeekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  }
}

export const schedulingService = new SchedulingService();
