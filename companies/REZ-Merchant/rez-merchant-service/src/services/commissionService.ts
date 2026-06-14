import mongoose, { Types } from 'mongoose';
import { StaffCommission, IStaffCommission } from '../models/StaffCommission';
import { ServiceBooking } from '../models/ServiceBooking';
import { Service } from '../models/Service';
import { MerchantUser } from '../models/MerchantUser';

// Default commission rate when no custom rate is set
const DEFAULT_COMMISSION_PERCENT = parseFloat(process.env.DEFAULT_STAFF_COMMISSION_RATE || '20');

/**
 * Commission Report for a store in a given month/year
 */
export interface CommissionReport {
  storeId: string;
  month: number;
  year: number;
  totalCommissions: number;
  pendingAmount: number;
  paidAmount: number;
  staffCount: number;
  serviceCount: number;
  commissions: Array<{
    staffId: string;
    staffName: string;
    totalEarnings: number;
    pendingAmount: number;
    paidAmount: number;
    serviceBreakdown: Array<{
      serviceId: string;
      serviceName: string;
      count: number;
      totalEarnings: number;
    }>;
  }>;
}

/**
 * Individual commission rate configuration for a staff member
 */
interface StaffCommissionRate {
  staffId: string;
  serviceId: string;
  percent: number;
}

// In-memory cache for commission rates (in production, use Redis)
const commissionRateCache = new Map<string, number>();

/**
 * CommissionService - Handles all commission-related operations for salon staff.
 * Manages commission calculation, tracking, payment marking, and reporting.
 */
export class CommissionService {
  /**
   * Calculate and create commission record for a completed booking.
   * Called when a booking is marked as completed.
   */
  async calculateCommission(bookingId: string): Promise<IStaffCommission> {
    // Fetch the booking with service details
    const booking = await ServiceBooking.findById(bookingId).lean();
    if (!booking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }

    // Get service details
    const service = await Service.findById((booking as unknown).serviceId).lean();
    if (!service) {
      throw new Error(`Service not found: ${(booking as unknown).serviceId}`);
    }

    const staffId = (booking as unknown).staffId;
    const storeId = (booking as unknown).store;
    const serviceId = (booking as unknown).serviceId;
    const serviceName = service.name;
    const amount = service.price;

    // Get commission rate for this staff/service combination
    const commissionPercent = this.getCommissionRate(staffId.toString(), serviceId.toString());
    const commissionAmount = Math.round(amount * (commissionPercent / 100) * 100) / 100;

    // Check if commission already exists for this booking/service
    const existingCommission = await StaffCommission.findOne({
      staffId,
      bookingId: new Types.ObjectId(bookingId),
      serviceId,
    });

    if (existingCommission) {
      return existingCommission;
    }

    // Create commission record
    const commission = await StaffCommission.create({
      staffId,
      storeId,
      bookingId: new Types.ObjectId(bookingId),
      serviceId,
      serviceName,
      amount,
      commissionPercent,
      commissionAmount,
      status: 'pending',
    });

    return commission;
  }

  /**
   * Get all commissions for a staff member in a specific month/year.
   */
  async getStaffCommissions(
    staffId: string,
    month: number,
    year: number,
  ): Promise<IStaffCommission[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return StaffCommission.find({
      staffId: new Types.ObjectId(staffId),
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get total earnings breakdown for a staff member.
   * Returns total, pending, and paid amounts.
   */
  async getStaffEarnings(
    staffId: string,
    month: number,
    year: number,
  ): Promise<{ total: number; pending: number; paid: number }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await StaffCommission.aggregate([
      {
        $match: {
          staffId: new Types.ObjectId(staffId),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$commissionAmount' },
        },
      },
    ]);

    const earnings = { total: 0, pending: 0, paid: 0 };

    for (const item of result) {
      if (item._id === 'pending') {
        earnings.pending = item.total;
      } else if (item._id === 'paid') {
        earnings.paid = item.total;
      }
      earnings.total += item.total;
    }

    return earnings;
  }

  /**
   * Mark multiple commissions as paid.
   * Updates status and sets paidAt timestamp.
   */
  async markAsPaid(commissionIds: string[]): Promise<void> {
    if (commissionIds.length === 0) {
      return;
    }

    const objectIds = commissionIds.map((id) => new Types.ObjectId(id));

    await StaffCommission.updateMany(
      { _id: { $in: objectIds }, status: 'pending' },
      { $set: { status: 'paid', paidAt: new Date() } },
    );
  }

  /**
   * Generate commission report for a store in a specific month/year.
   * Includes breakdown by staff and service.
   */
  async getCommissionReport(
    storeId: string,
    month: number,
    year: number,
  ): Promise<CommissionReport> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all commissions for the store in the period
    const commissions = await StaffCommission.find({
      storeId: new Types.ObjectId(storeId),
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ staffId: 1, createdAt: -1 })
      .lean();

    // Get staff details
    const staffIds = [...new Set(commissions.map((c) => c.staffId.toString()))];
    const staffMembers = await MerchantUser.find({ _id: { $in: staffIds } })
      .select('name firstName lastName')
      .lean();
    const staffMap = new Map(staffMembers.map((s) => [s._id.toString(), s]));

    // Group by staff
    const staffBreakdown = new Map<
      string,
      {
        staffId: string;
        staffName: string;
        totalEarnings: number;
        pendingAmount: number;
        paidAmount: number;
        serviceBreakdown: Map<
          string,
          { serviceId: string; serviceName: string; count: number; totalEarnings: number }
        >;
      }
    >();

    let totalCommissions = 0;
    let pendingAmount = 0;
    let paidAmount = 0;

    for (const commission of commissions) {
      const staffId = commission.staffId.toString();
      const staff = staffMap.get(staffId);
      const staffName = staff
        ? `${staff.name || ''} ${staff.firstName || ''} ${staff.lastName || ''}`.trim() ||
          'Unknown Staff'
        : 'Unknown Staff';

      if (!staffBreakdown.has(staffId)) {
        staffBreakdown.set(staffId, {
          staffId,
          staffName,
          totalEarnings: 0,
          pendingAmount: 0,
          paidAmount: 0,
          serviceBreakdown: new Map(),
        });
      }

      const staffData = staffBreakdown.get(staffId)!;
      staffData.totalEarnings += commission.commissionAmount;

      if (commission.status === 'pending') {
        staffData.pendingAmount += commission.commissionAmount;
        pendingAmount += commission.commissionAmount;
      } else {
        staffData.paidAmount += commission.commissionAmount;
        paidAmount += commission.commissionAmount;
      }
      totalCommissions += commission.commissionAmount;

      // Track by service
      const serviceId = commission.serviceId.toString();
      if (!staffData.serviceBreakdown.has(serviceId)) {
        staffData.serviceBreakdown.set(serviceId, {
          serviceId,
          serviceName: commission.serviceName,
          count: 0,
          totalEarnings: 0,
        });
      }
      const serviceData = staffData.serviceBreakdown.get(serviceId)!;
      serviceData.count += 1;
      serviceData.totalEarnings += commission.commissionAmount;
    }

    // Convert to final format
    const report: CommissionReport = {
      storeId,
      month,
      year,
      totalCommissions: Math.round(totalCommissions * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
      staffCount: staffBreakdown.size,
      serviceCount: new Set(commissions.map((c) => c.serviceId.toString())).size,
      commissions: Array.from(staffBreakdown.values()).map((staff) => ({
        staffId: staff.staffId,
        staffName: staff.staffName,
        totalEarnings: Math.round(staff.totalEarnings * 100) / 100,
        pendingAmount: Math.round(staff.pendingAmount * 100) / 100,
        paidAmount: Math.round(staff.paidAmount * 100) / 100,
        serviceBreakdown: Array.from(staff.serviceBreakdown.values()).map((service) => ({
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          count: service.count,
          totalEarnings: Math.round(service.totalEarnings * 100) / 100,
        })),
      })),
    };

    return report;
  }

  /**
   * Set custom commission rate for a staff/service combination.
   * Stores in memory cache (in production, use database or Redis).
   */
  async setCommissionRate(staffId: string, serviceId: string, percent: number): Promise<void> {
    if (percent < 0 || percent > 100) {
      throw new Error('Commission percent must be between 0 and 100');
    }

    const key = `${staffId}:${serviceId}`;
    commissionRateCache.set(key, percent);
  }

  /**
   * Get commission rate for a staff/service combination.
   * Checks custom rate first, falls back to default rate.
   */
  private getCommissionRate(staffId: string, serviceId: string): number {
    const key = `${staffId}:${serviceId}`;
    return commissionRateCache.get(key) ?? DEFAULT_COMMISSION_PERCENT;
  }

  /**
   * Clear commission rate from cache.
   */
  clearCommissionRate(staffId: string, serviceId: string): void {
    const key = `${staffId}:${serviceId}`;
    commissionRateCache.delete(key);
  }

  /**
   * Bulk calculate commissions for multiple bookings.
   * Used for retroactive commission calculation.
   */
  async bulkCalculateCommissions(bookingIds: string[]): Promise<IStaffCommission[]> {
    const commissions: IStaffCommission[] = [];
    const errors: string[] = [];

    for (const bookingId of bookingIds) {
      try {
        const commission = await this.calculateCommission(bookingId);
        commissions.push(commission);
      } catch (error) {
        errors.push(`${bookingId}: ${(error as Error).message}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Bulk commission calculation errors:', errors);
    }

    return commissions;
  }

  /**
   * Reverse pending commissions for a cancelled booking.
   */
  async reverseCommissionsForBooking(bookingId: string): Promise<void> {
    await StaffCommission.deleteMany({
      bookingId: new Types.ObjectId(bookingId),
      status: 'pending',
    });
  }

  /**
   * Get commission summary statistics for a date range.
   */
  async getCommissionStats(
    storeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalEarnings: number;
    pendingCount: number;
    paidCount: number;
    averageCommission: number;
    topServices: Array<{ serviceName: string; total: number }>;
  }> {
    const result = await StaffCommission.aggregate([
      {
        $match: {
          storeId: new Types.ObjectId(storeId),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                total: { $sum: '$commissionAmount' },
              },
            },
          ],
          topServices: [
            {
              $group: {
                _id: '$serviceName',
                total: { $sum: '$commissionAmount' },
              },
            },
            { $sort: { total: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]);

    const summary = result[0]?.summary || [];
    const topServices = result[0]?.topServices || [];

    let pendingCount = 0;
    let paidCount = 0;
    let totalEarnings = 0;

    for (const item of summary) {
      if (item._id === 'pending') {
        pendingCount = item.count;
      } else if (item._id === 'paid') {
        paidCount = item.count;
      }
      totalEarnings += item.total;
    }

    const totalCount = pendingCount + paidCount;
    const averageCommission = totalCount > 0 ? totalEarnings / totalCount : 0;

    return {
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      pendingCount,
      paidCount,
      averageCommission: Math.round(averageCommission * 100) / 100,
      topServices: topServices.map((s) => ({
        serviceName: s._id,
        total: s.total,
      })),
    };
  }
}

export default new CommissionService();
