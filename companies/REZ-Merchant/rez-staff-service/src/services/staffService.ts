import { Staff, IStaff, StaffRole, StaffStatus } from '../models';
import { v4 as uuidv4 } from 'uuid';

export interface CreateStaffDTO {
  merchantId: string;
  name: string;
  phone: string;
  email?: string;
  role: StaffRole;
  hireDate: Date;
  salary: number;
  permissions?: string[];
}

export interface UpdateStaffDTO {
  name?: string;
  phone?: string;
  email?: string;
  role?: StaffRole;
  status?: StaffStatus;
  salary?: number;
  permissions?: string[];
}

/**
 * Data from merchant service to sync staff
 */
export interface MerchantStaffSyncData {
  merchantId: string;
  storeId?: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface StaffFilters {
  merchantId: string;
  role?: StaffRole;
  status?: StaffStatus;
  search?: string;
}

export class StaffService {
  /**
   * Create a new staff member
   */
  async createStaff(data: CreateStaffDTO): Promise<IStaff> {
    const employeeId = `EMP-${uuidv4().substring(0, 8).toUpperCase()}`;

    const staff = new Staff({
      ...data,
      employeeId,
      status: 'active',
      permissions: data.permissions || [],
    });

    await staff.save();
    return staff;
  }

  /**
   * Get staff by ID
   */
  async getStaffById(id: string): Promise<IStaff | null> {
    return Staff.findById(id);
  }

  /**
   * Get staff by employee ID
   */
  async getStaffByEmployeeId(employeeId: string): Promise<IStaff | null> {
    return Staff.findOne({ employeeId });
  }

  /**
   * Update staff member
   */
  async updateStaff(id: string, data: UpdateStaffDTO): Promise<IStaff | null> {
    const staff = await Staff.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    return staff;
  }

  /**
   * Delete staff member
   */
  async deleteStaff(id: string): Promise<boolean> {
    const result = await Staff.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * List staff with filters and pagination
   */
  async listStaff(
    filters: StaffFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ staff: IStaff[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, unknown> = { merchantId: filters.merchantId };

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { employeeId: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [staff, total] = await Promise.all([
      Staff.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Staff.countDocuments(query),
    ]);

    return {
      staff,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get staff count by role for a merchant
   */
  async getStaffCountByRole(merchantId: string): Promise<Record<StaffRole, number>> {
    const result = await Staff.aggregate([
      { $match: { merchantId, status: 'active' } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const counts: Record<StaffRole, number> = {
      manager: 0,
      chef: 0,
      waiter: 0,
      cashier: 0,
      kitchen: 0,
      delivery: 0,
    };

    result.forEach((item) => {
      counts[item._id as StaffRole] = item.count;
    });

    return counts;
  }

  /**
   * Get available staff for a specific role on a date
   */
  async getAvailableStaff(
    merchantId: string,
    role: StaffRole,
    date: Date
  ): Promise<IStaff[]> {
    const { Shift } = await import('../models');

    // Get all active staff with the specified role
    const staff = await Staff.find({
      merchantId,
      role,
      status: 'active',
    });

    // Get scheduled shifts for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const scheduledStaffIds = await Shift.distinct('staffId', {
      merchantId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    // Filter out already scheduled staff
    return staff.filter(
      (s) => !scheduledStaffIds.some(
        (id) => id.toString() === s._id.toString()
      )
    );
  }

  /**
   * Deactivate staff (soft delete)
   */
  async deactivateStaff(id: string): Promise<IStaff | null> {
    return this.updateStaff(id, { status: 'inactive' });
  }

  /**
   * Update staff permissions
   */
  async updatePermissions(id: string, permissions: string[]): Promise<IStaff | null> {
    return this.updateStaff(id, { permissions });
  }

  /**
   * Get staff statistics for a merchant
   */
  async getStaffStatistics(merchantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
    byRole: Record<StaffRole, number>;
    averageSalary: number;
  }> {
    const stats = await Staff.aggregate([
      { $match: { merchantId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          onLeave: { $sum: { $cond: [{ $eq: ['$status', 'on_leave'] }, 1, 0] } },
          averageSalary: { $avg: '$salary' },
        },
      },
    ]);

    const byRole = await this.getStaffCountByRole(merchantId);

    if (stats.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        onLeave: 0,
        byRole,
        averageSalary: 0,
      };
    }

    return {
      total: stats[0].total,
      active: stats[0].active,
      inactive: stats[0].inactive,
      onLeave: stats[0].onLeave,
      byRole,
      averageSalary: Math.round(stats[0].averageSalary || 0),
    };
  }

  /**
   * Sync staff from merchant service
   * Creates or updates staff member based on merchant data
   */
  async syncFromMerchant(data: MerchantStaffSyncData): Promise<IStaff | null> {
    try {
      // Try to find existing staff by userId
      let staff = await Staff.findOne({ userId: data.userId, merchantId: data.merchantId });

      if (staff) {
        // Update existing staff
        const updates: Partial<IStaff> = {};

        if (data.name) {
          updates.name = data.name;
        }
        if (data.firstName || data.lastName) {
          updates.name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        }
        if (data.email) {
          updates.email = data.email;
        }
        if (data.phone) {
          updates.phone = data.phone;
        }
        if (data.role) {
          updates.role = data.role as StaffRole;
        }
        if (data.permissions) {
          updates.permissions = data.permissions;
        }

        return await this.updateStaff(staff._id.toString(), updates);
      } else {
        // Create new staff
        const name = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown';
        const role = data.role as StaffRole || 'other';

        return await this.createStaff({
          merchantId: data.merchantId,
          name,
          phone: data.phone || '',
          email: data.email,
          role,
          hireDate: new Date(),
          salary: 0,
          permissions: data.permissions,
        });
      }
    } catch (error) {
      console.error('[StaffService] Error syncing from merchant:', error);
      return null;
    }
  }

  /**
   * Deactivate staff from merchant service
   */
  async deactivateFromMerchant(userId: string, merchantId: string): Promise<IStaff | null> {
    try {
      const staff = await Staff.findOne({ userId, merchantId });

      if (!staff) {
        console.warn('[StaffService] Staff not found for deactivation', { userId, merchantId });
        return null;
      }

      return await this.deactivateStaff(staff._id.toString());
    } catch (error) {
      console.error('[StaffService] Error deactivating from merchant:', error);
      return null;
    }
  }
}

export const staffService = new StaffService();
