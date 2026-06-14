/**
 * Hospital Service for RisaCare Hospital Management
 * Handles hospital-level operations and department management
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Hospital,
  Department,
  CreateHospitalInput,
  UpdateHospitalInput,
  CreateDepartmentInput,
  Address,
  OperatingRoom,
  EmergencyRoom,
  Ward,
} from '../models/hospital.js';

class HospitalService {
  private hospital: Hospital | null = null;

  /**
   * Initialize hospital with basic info
   */
  async createHospital(input: CreateHospitalInput): Promise<Hospital> {
    const now = new Date();

    // Create default operating rooms
    const operatingRooms: OperatingRoom[] = [];
    for (let i = 1; i <= 5; i++) {
      operatingRooms.push({
        orId: uuidv4(),
        orNumber: `OR-${i.toString().padStart(2, '0')}`,
        name: `Operating Room ${i}`,
        floor: Math.ceil(i / 2),
        equipment: ['Anesthesia Machine', 'Surgical Lights', 'Monitor', 'Ventilator'],
        status: 'available',
      });
    }

    // Create default emergency rooms
    const emergencyRooms: EmergencyRoom[] = [];
    for (let i = 1; i <= 3; i++) {
      emergencyRooms.push({
        erId: uuidv4(),
        name: `Emergency Bay ${i}`,
        capacity: 4,
        currentOccupancy: 0,
        status: 'available',
      });
    }

    // Create default wards
    const wards: Ward[] = [
      { wardId: uuidv4(), name: 'General Ward', floor: 1, bedCount: 20 },
      { wardId: uuidv4(), name: 'Private Ward', floor: 2, bedCount: 10 },
      { wardId: uuidv4(), name: 'ICU', floor: 3, bedCount: input.icuBeds || 10 },
      { wardId: uuidv4(), name: 'Semi-Private Ward', floor: 2, bedCount: 15 },
      { wardId: uuidv4(), name: 'Emergency Ward', floor: 1, bedCount: 12 },
    ];

    this.hospital = {
      hospitalId: uuidv4(),
      name: input.name,
      address: input.address,
      phone: input.phone,
      email: input.email,
      departments: [],
      beds: [],
      operatingRooms,
      emergencyRooms,
      icuBeds: input.icuBeds || 10,
      totalBeds: input.totalBeds || 100,
      staff: [],
      licenses: [],
      certifications: [],
      wards,
      createdAt: now,
      updatedAt: now,
    };

    return this.hospital;
  }

  /**
   * Get hospital information
   */
  async getHospital(): Promise<Hospital | null> {
    return this.hospital;
  }

  /**
   * Update hospital information
   */
  async updateHospital(input: UpdateHospitalInput): Promise<Hospital | null> {
    if (!this.hospital) {
      return null;
    }

    this.hospital = {
      ...this.hospital,
      ...(input.name && { name: input.name }),
      ...(input.address && { address: input.address }),
      ...(input.phone && { phone: input.phone }),
      ...(input.email && { email: input.email }),
      ...(input.icuBeds !== undefined && { icuBeds: input.icuBeds }),
      ...(input.totalBeds !== undefined && { totalBeds: input.totalBeds }),
      updatedAt: new Date(),
    };

    return this.hospital;
  }

  /**
   * Add a new department to the hospital
   */
  async addDepartment(input: CreateDepartmentInput): Promise<Department | null> {
    if (!this.hospital) {
      return null;
    }

    const department: Department = {
      departmentId: uuidv4(),
      name: input.name,
      description: input.description,
      headDoctorId: input.headDoctorId,
      doctors: [],
      nurses: [],
      beds: [],
      specializations: input.specializations || [],
      phone: input.phone,
      email: input.email,
      status: 'active',
      createdAt: new Date(),
    };

    this.hospital.departments.push(department);
    this.hospital.updatedAt = new Date();

    return department;
  }

  /**
   * Get all departments
   */
  async getDepartments(): Promise<Department[]> {
    if (!this.hospital) {
      return [];
    }
    return this.hospital.departments;
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(departmentId: string): Promise<Department | null> {
    if (!this.hospital) {
      return null;
    }
    return this.hospital.departments.find(d => d.departmentId === departmentId) || null;
  }

  /**
   * Update department
   */
  async updateDepartment(
    departmentId: string,
    updates: Partial<CreateDepartmentInput>
  ): Promise<Department | null> {
    if (!this.hospital) {
      return null;
    }

    const deptIndex = this.hospital.departments.findIndex(
      d => d.departmentId === departmentId
    );

    if (deptIndex === -1) {
      return null;
    }

    this.hospital.departments[deptIndex] = {
      ...this.hospital.departments[deptIndex],
      ...updates,
    };

    this.hospital.updatedAt = new Date();

    return this.hospital.departments[deptIndex];
  }

  /**
   * Delete department (soft delete - sets status to inactive)
   */
  async deleteDepartment(departmentId: string): Promise<boolean> {
    if (!this.hospital) {
      return false;
    }

    const deptIndex = this.hospital.departments.findIndex(
      d => d.departmentId === departmentId
    );

    if (deptIndex === -1) {
      return false;
    }

    this.hospital.departments[deptIndex]!.status = 'inactive';
    this.hospital.updatedAt = new Date();

    return true;
  }

  /**
   * Add operating room
   */
  async addOperatingRoom(
    orNumber: string,
    name: string,
    floor: number,
    equipment: string[]
  ): Promise<OperatingRoom | null> {
    if (!this.hospital) {
      return null;
    }

    const operatingRoom: OperatingRoom = {
      orId: uuidv4(),
      orNumber,
      name,
      floor,
      equipment,
      status: 'available',
    };

    this.hospital.operatingRooms.push(operatingRoom);
    this.hospital.updatedAt = new Date();

    return operatingRoom;
  }

  /**
   * Get hospital statistics
   */
  async getHospitalStats(): Promise<{
    totalDepartments: number;
    activeDepartments: number;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    totalOperatingRooms: number;
    availableOperatingRooms: number;
    emergencyRooms: number;
    occupancyRate: number;
  } | null> {
    if (!this.hospital) {
      return null;
    }

    const occupiedBeds = this.hospital.beds.filter(
      b => b.status === 'occupied'
    ).length;
    const availableBeds = this.hospital.beds.filter(
      b => b.status === 'available'
    ).length;

    return {
      totalDepartments: this.hospital.departments.length,
      activeDepartments: this.hospital.departments.filter(
        d => d.status === 'active'
      ).length,
      totalBeds: this.hospital.totalBeds,
      occupiedBeds,
      availableBeds,
      totalOperatingRooms: this.hospital.operatingRooms.length,
      availableOperatingRooms: this.hospital.operatingRooms.filter(
        or => or.status === 'available'
      ).length,
      emergencyRooms: this.hospital.emergencyRooms.length,
      occupancyRate:
        this.hospital.totalBeds > 0
          ? Math.round((occupiedBeds / this.hospital.totalBeds) * 100)
          : 0,
    };
  }
}

export const hospitalService = new HospitalService();
