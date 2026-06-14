/**
 * Staff Service for RisaCare Hospital Management
 * Handles staff management, scheduling, and role assignments
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Staff,
  StaffRole,
  StaffStatus,
  AddStaffInput,
  UpdateScheduleInput,
  Schedule,
} from '../models/hospital.js';

class StaffService {
  private staff: Map<string, Staff> = new Map();
  private employeeIdCounter = 1000;

  /**
   * Generate unique employee ID
   */
  private generateEmployeeId(): string {
    this.employeeIdCounter++;
    const year = new Date().getFullYear();
    return `EMP${year}${this.employeeIdCounter.toString().padStart(5, '0')}`;
  }

  /**
   * Add a new staff member
   */
  async addStaff(input: AddStaffInput): Promise<Staff> {
    const now = new Date();

    const staffMember: Staff = {
      staffId: uuidv4(),
      employeeId: this.generateEmployeeId(),
      name: input.name,
      role: input.role,
      departmentId: input.departmentId,
      specialization: input.specialization,
      schedule: input.schedule,
      contact: input.contact,
      salary: input.salary,
      joinDate: now,
      status: StaffStatus.ACTIVE,
      qualifications: input.qualifications,
      licenseNumber: input.licenseNumber,
      createdAt: now,
      updatedAt: now,
    };

    this.staff.set(staffMember.staffId, staffMember);

    return staffMember;
  }

  /**
   * Get staff by ID
   */
  async getStaff(staffId: string): Promise<Staff | null> {
    return this.staff.get(staffId) || null;
  }

  /**
   * Get staff by employee ID
   */
  async getStaffByEmployeeId(employeeId: string): Promise<Staff | null> {
    for (const staffMember of this.staff.values()) {
      if (staffMember.employeeId === employeeId) {
        return staffMember;
      }
    }
    return null;
  }

  /**
   * Get all staff with optional filters
   */
  async getAllStaff(params?: {
    role?: StaffRole;
    departmentId?: string;
    status?: StaffStatus;
    specialization?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    staff: Staff[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { role, departmentId, status, specialization, page = 1, limit = 50 } = params || {};

    let filteredStaff = Array.from(this.staff.values());

    if (role) {
      filteredStaff = filteredStaff.filter(s => s.role === role);
    }
    if (departmentId) {
      filteredStaff = filteredStaff.filter(s => s.departmentId === departmentId);
    }
    if (status) {
      filteredStaff = filteredStaff.filter(s => s.status === status);
    }
    if (specialization) {
      const lowerSpec = specialization.toLowerCase();
      filteredStaff = filteredStaff.filter(s =>
        s.specialization.some(spec => spec.toLowerCase().includes(lowerSpec))
      );
    }

    // Sort by name
    filteredStaff.sort((a, b) => a.name.localeCompare(b.name));

    const total = filteredStaff.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;

    return {
      staff: filteredStaff.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get doctors (all staff with doctor-related roles)
   */
  async getDoctors(params?: {
    departmentId?: string;
    specialization?: string;
  }): Promise<Staff[]> {
    const doctorRoles = [StaffRole.DOCTOR, StaffRole.SURGEON, StaffRole.SPECIALIST];

    let filteredStaff = Array.from(this.staff.values()).filter(s =>
      doctorRoles.includes(s.role)
    );

    if (params?.departmentId) {
      filteredStaff = filteredStaff.filter(s => s.departmentId === params.departmentId);
    }
    if (params?.specialization) {
      const lowerSpec = params.specialization.toLowerCase();
      filteredStaff = filteredStaff.filter(s =>
        s.specialization.some(spec => spec.toLowerCase().includes(lowerSpec))
      );
    }

    return filteredStaff;
  }

  /**
   * Get nurses
   */
  async getNurses(departmentId?: string): Promise<Staff[]> {
    let filteredStaff = Array.from(this.staff.values()).filter(
      s => s.role === StaffRole.NURSE
    );

    if (departmentId) {
      filteredStaff = filteredStaff.filter(s => s.departmentId === departmentId);
    }

    return filteredStaff;
  }

  /**
   * Update staff details
   */
  async updateStaff(
    staffId: string,
    updates: Partial<Omit<Staff, 'staffId' | 'employeeId' | 'createdAt'>>
  ): Promise<Staff | null> {
    const staffMember = this.staff.get(staffId);

    if (!staffMember) {
      return null;
    }

    const updatedStaff: Staff = {
      ...staffMember,
      ...updates,
      updatedAt: new Date(),
    };

    this.staff.set(staffId, updatedStaff);

    return updatedStaff;
  }

  /**
   * Update staff schedule
   */
  async updateSchedule(input: UpdateScheduleInput): Promise<Staff | null> {
    const staffMember = this.staff.get(input.staffId);

    if (!staffMember) {
      return null;
    }

    // Validate schedule
    for (const schedule of input.schedule) {
      if (schedule.startTime >= schedule.endTime) {
        return null; // Invalid schedule
      }
    }

    const updatedStaff: Staff = {
      ...staffMember,
      schedule: input.schedule,
      updatedAt: new Date(),
    };

    this.staff.set(input.staffId, updatedStaff);

    return updatedStaff;
  }

  /**
   * Add schedule entry
   */
  async addScheduleEntry(staffId: string, schedule: Schedule): Promise<Staff | null> {
    const staffMember = this.staff.get(staffId);

    if (!staffMember) {
      return null;
    }

    const updatedStaff: Staff = {
      ...staffMember,
      schedule: [...staffMember.schedule, schedule],
      updatedAt: new Date(),
    };

    this.staff.set(staffId, updatedStaff);

    return updatedStaff;
  }

  /**
   * Remove schedule entry
   */
  async removeScheduleEntry(staffId: string, dayOfWeek: number): Promise<Staff | null> {
    const staffMember = this.staff.get(staffId);

    if (!staffMember) {
      return null;
    }

    const updatedStaff: Staff = {
      ...staffMember,
      schedule: staffMember.schedule.filter(s => s.dayOfWeek !== dayOfWeek),
      updatedAt: new Date(),
    };

    this.staff.set(staffId, updatedStaff);

    return updatedStaff;
  }

  /**
   * Get staff schedule
   */
  async getStaffSchedule(staffId: string): Promise<Schedule[] | null> {
    const staffMember = this.staff.get(staffId);

    if (!staffMember) {
      return null;
    }

    return staffMember.schedule;
  }

  /**
   * Update staff status
   */
  async updateStatus(staffId: string, status: StaffStatus): Promise<Staff | null> {
    const staffMember = this.staff.get(staffId);

    if (!staffMember) {
      return null;
    }

    const updatedStaff: Staff = {
      ...staffMember,
      status,
      updatedAt: new Date(),
    };

    this.staff.set(staffId, updatedStaff);

    return updatedStaff;
  }

  /**
   * Set staff on leave
   */
  async setOnLeave(staffId: string): Promise<Staff | null> {
    return this.updateStatus(staffId, StaffStatus.ON_LEAVE);
  }

  /**
   * Activate staff (return from leave or reactivate)
   */
  async activateStaff(staffId: string): Promise<Staff | null> {
    return this.updateStatus(staffId, StaffStatus.ACTIVE);
  }

  /**
   * Deactivate staff
   */
  async deactivateStaff(staffId: string): Promise<Staff | null> {
    return this.updateStatus(staffId, StaffStatus.INACTIVE);
  }

  /**
   * Transfer staff to another department
   */
  async transferDepartment(
    staffId: string,
    newDepartmentId: string
  ): Promise<Staff | null> {
    return this.updateStaff(staffId, { departmentId: newDepartmentId });
  }

  /**
   * Add qualification to staff
   */
  async addQualification(staffId: string, qualification: string): Promise<Staff | null> {
    const staffMember = this.staff.get(staffId);

    if (!staffMember) {
      return null;
    }

    if (!staffMember.qualifications.includes(qualification)) {
      return this.updateStaff(staffId, {
        qualifications: [...staffMember.qualifications, qualification],
      });
    }

    return staffMember;
  }

  /**
   * Add specialization to staff
   */
  async addSpecialization(staffId: string, specialization: string): Promise<Staff | null> {
    const staffMember = this.staff.get(staffId);

    if (!staffMember) {
      return null;
    }

    if (!staffMember.specialization.includes(specialization)) {
      return this.updateStaff(staffId, {
        specialization: [...staffMember.specialization, specialization],
      });
    }

    return staffMember;
  }

  /**
   * Get staff availability for a specific time slot
   */
  async getStaffAvailability(staffId: string, date: Date): Promise<boolean> {
    const staffMember = this.staff.get(staffId);

    if (!staffMember) {
      return false;
    }

    if (staffMember.status !== StaffStatus.ACTIVE) {
      return false;
    }

    const dayOfWeek = date.getDay();
    const scheduleForDay = staffMember.schedule.find(s => s.dayOfWeek === dayOfWeek);

    if (!scheduleForDay || !scheduleForDay.isAvailable) {
      return false;
    }

    // Check current time is within schedule
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    return (
      currentTime >= scheduleForDay.startTime && currentTime <= scheduleForDay.endTime
    );
  }

  /**
   * Get staff statistics
   */
  async getStaffStats(): Promise<{
    totalStaff: number;
    byRole: Record<StaffRole, number>;
    byStatus: Record<StaffStatus, number>;
    totalSalary: number;
    averageSalary: number;
    onLeave: number;
    active: number;
  }> {
    const staffMembers = Array.from(this.staff.values());

    const byRole: Record<StaffRole, number> = {
      [StaffRole.DOCTOR]: 0,
      [StaffRole.NURSE]: 0,
      [StaffRole.ADMIN]: 0,
      [StaffRole.TECHNICIAN]: 0,
      [StaffRole.RECEPTIONIST]: 0,
      [StaffRole.SURGEON]: 0,
      [StaffRole.SPECIALIST]: 0,
    };

    const byStatus: Record<StaffStatus, number> = {
      [StaffStatus.ACTIVE]: 0,
      [StaffStatus.ON_LEAVE]: 0,
      [StaffStatus.INACTIVE]: 0,
    };

    let totalSalary = 0;

    for (const staffMember of staffMembers) {
      byRole[staffMember.role]++;
      byStatus[staffMember.status]++;
      totalSalary += staffMember.salary;
    }

    return {
      totalStaff: staffMembers.length,
      byRole,
      byStatus,
      totalSalary,
      averageSalary:
        staffMembers.length > 0 ? Math.round(totalSalary / staffMembers.length) : 0,
      onLeave: byStatus[StaffStatus.ON_LEAVE],
      active: byStatus[StaffStatus.ACTIVE],
    };
  }

  /**
   * Search staff by name or specialization
   */
  async searchStaff(query: string): Promise<Staff[]> {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.staff.values()).filter(
      s =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.employeeId.toLowerCase().includes(lowerQuery) ||
        s.specialization.some(spec => spec.toLowerCase().includes(lowerQuery)) ||
        s.qualifications.some(qual => qual.toLowerCase().includes(lowerQuery))
    );
  }
}

export const staffService = new StaffService();
