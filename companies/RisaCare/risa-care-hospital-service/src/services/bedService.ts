/**
 * Bed Service for RisaCare Hospital Management
 * Handles bed allocation, release, and occupancy management
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Bed,
  BedType,
  BedStatus,
  AllocateBedInput,
  Ward,
} from '../models/hospital.js';
import { hospitalService } from './hospitalService.js';

class BedService {
  private beds: Map<string, Bed> = new Map();
  private wards: Map<string, Ward> = new Map();
  private bedCounter = 1000;

  constructor() {
    this.initializeBeds();
  }

  /**
   * Initialize default beds for the hospital
   */
  private async initializeBeds(): Promise<void> {
    const hospital = await hospitalService.getHospital();

    if (hospital && hospital.wards.length > 0) {
      // Use hospital's ward configuration
      for (const ward of hospital.wards) {
        this.wards.set(ward.wardId, ward);
        await this.createBedsForWard(ward, ward.bedCount);
      }
    } else {
      // Create default wards and beds
      const defaultWards: Omit<Ward, 'wardId'>[] = [
        { name: 'General Ward', floor: 1, bedCount: 20 },
        { name: 'Private Ward', floor: 2, bedCount: 10 },
        { name: 'ICU', floor: 3, bedCount: 10 },
        { name: 'Semi-Private Ward', floor: 2, bedCount: 15 },
        { name: 'Emergency Ward', floor: 1, bedCount: 12 },
      ];

      for (const wardData of defaultWards) {
        const ward: Ward = {
          wardId: uuidv4(),
          ...wardData,
        };
        this.wards.set(ward.wardId, ward);
        await this.createBedsForWard(ward, ward.bedCount);
      }
    }
  }

  /**
   * Create beds for a ward
   */
  private async createBedsForWard(ward: Ward, count: number): Promise<void> {
    for (let i = 1; i <= count; i++) {
      const bedId = uuidv4();
      const bed: Bed = {
        bedId,
        wardId: ward.wardId,
        bedNumber: `${ward.name.substring(0, 3).toUpperCase()}-${i.toString().padStart(3, '0')}`,
        floor: ward.floor,
        bedType: this.getBedTypeFromWard(ward.name),
        status: BedStatus.AVAILABLE,
        pricePerDay: this.getPriceForBedType(this.getBedTypeFromWard(ward.name)),
        amenities: this.getAmenitiesForBedType(this.getBedTypeFromWard(ward.name)),
      };
      this.beds.set(bedId, bed);
    }
  }

  /**
   * Determine bed type from ward name
   */
  private getBedTypeFromWard(wardName: string): BedType {
    const name = wardName.toLowerCase();
    if (name.includes('icu') || name.includes('critical')) {
      return BedType.ICU;
    }
    if (name.includes('private')) {
      return BedType.PRIVATE;
    }
    if (name.includes('semi')) {
      return BedType.SEMI_PRIVATE;
    }
    return BedType.GENERAL;
  }

  /**
   * Get price based on bed type
   */
  private getPriceForBedType(bedType: BedType): number {
    switch (bedType) {
      case BedType.ICU:
        return 15000;
      case BedType.PRIVATE:
        return 8000;
      case BedType.SEMI_PRIVATE:
        return 5000;
      case BedType.GENERAL:
      default:
        return 2000;
    }
  }

  /**
   * Get amenities based on bed type
   */
  private getAmenitiesForBedType(bedType: BedType): string[] {
    const baseAmenities = ['Nurse Call Button', 'Oxygen Outlet', 'Bedside Table'];

    switch (bedType) {
      case BedType.ICU:
        return [...baseAmenities, 'Ventilator', 'Cardiac Monitor', 'Infusion Pump', 'Defibrillator'];
      case BedType.PRIVATE:
        return [...baseAmenities, 'TV', 'AC', 'Private Bathroom', 'Attendant Couch'];
      case BedType.SEMI_PRIVATE:
        return [...baseAmenities, 'TV', 'AC', 'Shared Bathroom'];
      case BedType.GENERAL:
      default:
        return baseAmenities;
    }
  }

  /**
   * Allocate a bed to a patient
   */
  async allocateBed(input: AllocateBedInput): Promise<Bed | null> {
    return this.allocateBedToPatient(input.bedId, input.patientId, input.admissionId);
  }

  /**
   * Internal method to allocate bed to patient
   */
  async allocateBedToPatient(
    bedId: string,
    patientId: string,
    admissionId: string
  ): Promise<Bed | null> {
    const bed = this.beds.get(bedId);

    if (!bed) {
      return null;
    }

    if (bed.status !== BedStatus.AVAILABLE) {
      return null; // Bed is not available
    }

    const updatedBed: Bed = {
      ...bed,
      status: BedStatus.OCCUPIED,
      currentPatientId: patientId,
      currentAdmissionId: admissionId,
    };

    this.beds.set(bedId, updatedBed);

    return updatedBed;
  }

  /**
   * Release a bed (make it available again)
   */
  async releaseBed(bedId: string): Promise<Bed | null> {
    const bed = this.beds.get(bedId);

    if (!bed) {
      return null;
    }

    const updatedBed: Bed = {
      ...bed,
      status: BedStatus.AVAILABLE,
      currentPatientId: undefined,
      currentAdmissionId: undefined,
    };

    this.beds.set(bedId, updatedBed);

    return updatedBed;
  }

  /**
   * Set bed to maintenance mode
   */
  async setBedMaintenance(bedId: string): Promise<Bed | null> {
    const bed = this.beds.get(bedId);

    if (!bed) {
      return null;
    }

    const updatedBed: Bed = {
      ...bed,
      status: BedStatus.MAINTENANCE,
    };

    this.beds.set(bedId, updatedBed);

    return updatedBed;
  }

  /**
   * Reserve a bed for a patient
   */
  async reserveBed(bedId: string, patientId: string): Promise<Bed | null> {
    const bed = this.beds.get(bedId);

    if (!bed) {
      return null;
    }

    if (bed.status !== BedStatus.AVAILABLE) {
      return null;
    }

    const updatedBed: Bed = {
      ...bed,
      status: BedStatus.RESERVED,
      currentPatientId: patientId,
    };

    this.beds.set(bedId, updatedBed);

    return updatedBed;
  }

  /**
   * Get all beds
   */
  async getBeds(filters?: {
    wardId?: string;
    bedType?: BedType;
    status?: BedStatus;
    floor?: number;
  }): Promise<Bed[]> {
    let beds = Array.from(this.beds.values());

    if (filters) {
      if (filters.wardId) {
        beds = beds.filter(b => b.wardId === filters.wardId);
      }
      if (filters.bedType) {
        beds = beds.filter(b => b.bedType === filters.bedType);
      }
      if (filters.status) {
        beds = beds.filter(b => b.status === filters.status);
      }
      if (filters.floor !== undefined) {
        beds = beds.filter(b => b.floor === filters.floor);
      }
    }

    return beds;
  }

  /**
   * Get available beds
   */
  async getAvailableBeds(filters?: {
    wardId?: string;
    bedType?: BedType;
    floor?: number;
  }): Promise<Bed[]> {
    return this.getBeds({
      ...filters,
      status: BedStatus.AVAILABLE,
    });
  }

  /**
   * Get bed by ID
   */
  async getBedById(bedId: string): Promise<Bed | null> {
    return this.beds.get(bedId) || null;
  }

  /**
   * Get bed status for a specific bed
   */
  async getBedStatus(bedId: string): Promise<{
    bed: Bed | null;
    isOccupied: boolean;
    patientId?: string;
    admissionId?: string;
  }> {
    const bed = this.beds.get(bedId);

    if (!bed) {
      return { bed: null, isOccupied: false };
    }

    return {
      bed,
      isOccupied: bed.status === BedStatus.OCCUPIED,
      patientId: bed.currentPatientId,
      admissionId: bed.currentAdmissionId,
    };
  }

  /**
   * Get occupancy for a specific ward
   */
  async getWardOccupancy(wardId: string): Promise<{
    ward: Ward | null;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    maintenanceBeds: number;
    reservedBeds: number;
    occupancyRate: number;
    beds: Bed[];
  } | null> {
    const ward = this.wards.get(wardId);

    if (!ward) {
      return null;
    }

    const wardBeds = Array.from(this.beds.values()).filter(b => b.wardId === wardId);

    const occupiedBeds = wardBeds.filter(b => b.status === BedStatus.OCCUPIED).length;
    const availableBeds = wardBeds.filter(b => b.status === BedStatus.AVAILABLE).length;
    const maintenanceBeds = wardBeds.filter(b => b.status === BedStatus.MAINTENANCE).length;
    const reservedBeds = wardBeds.filter(b => b.status === BedStatus.RESERVED).length;

    return {
      ward,
      totalBeds: wardBeds.length,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      reservedBeds,
      occupancyRate: wardBeds.length > 0 ? Math.round((occupiedBeds / wardBeds.length) * 100) : 0,
      beds: wardBeds,
    };
  }

  /**
   * Get all wards with occupancy
   */
  async getAllWardOccupancy(): Promise<Array<{
    ward: Ward;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyRate: number;
  }>> {
    const occupancyList = [];

    for (const ward of this.wards.values()) {
      const occupancy = await this.getWardOccupancy(ward.wardId);
      if (occupancy) {
        occupancyList.push({
          ward: occupancy.ward,
          totalBeds: occupancy.totalBeds,
          occupiedBeds: occupancy.occupiedBeds,
          availableBeds: occupancy.availableBeds,
          occupancyRate: occupancy.occupancyRate,
        });
      }
    }

    return occupancyList;
  }

  /**
   * Get overall bed statistics
   */
  async getBedStats(): Promise<{
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    maintenanceBeds: number;
    reservedBeds: number;
    overallOccupancyRate: number;
    byType: Record<BedType, { total: number; occupied: number; available: number }>;
    byWard: Array<{ wardId: string; wardName: string; occupancyRate: number }>;
  }> {
    const beds = Array.from(this.beds.values());

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === BedStatus.OCCUPIED).length;
    const availableBeds = beds.filter(b => b.status === BedStatus.AVAILABLE).length;
    const maintenanceBeds = beds.filter(b => b.status === BedStatus.MAINTENANCE).length;
    const reservedBeds = beds.filter(b => b.status === BedStatus.RESERVED).length;

    // By type
    const byType: Record<BedType, { total: number; occupied: number; available: number }> = {
      [BedType.GENERAL]: { total: 0, occupied: 0, available: 0 },
      [BedType.PRIVATE]: { total: 0, occupied: 0, available: 0 },
      [BedType.ICU]: { total: 0, occupied: 0, available: 0 },
      [BedType.SEMI_PRIVATE]: { total: 0, occupied: 0, available: 0 },
    };

    for (const bed of beds) {
      byType[bed.bedType].total++;
      if (bed.status === BedStatus.OCCUPIED) {
        byType[bed.bedType].occupied++;
      }
      if (bed.status === BedStatus.AVAILABLE) {
        byType[bed.bedType].available++;
      }
    }

    // By ward
    const byWard: Array<{ wardId: string; wardName: string; occupancyRate: number }> = [];
    for (const ward of this.wards.values()) {
      const occupancy = await this.getWardOccupancy(ward.wardId);
      if (occupancy) {
        byWard.push({
          wardId: ward.wardId,
          wardName: ward.name,
          occupancyRate: occupancy.occupancyRate,
        });
      }
    }

    return {
      totalBeds,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      reservedBeds,
      overallOccupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      byType,
      byWard,
    };
  }

  /**
   * Add a new bed to a ward
   */
  async addBed(
    wardId: string,
    bedNumber: string,
    bedType: BedType,
    floor: number
  ): Promise<Bed | null> {
    const ward = this.wards.get(wardId);

    if (!ward) {
      return null;
    }

    const bed: Bed = {
      bedId: uuidv4(),
      wardId,
      bedNumber,
      floor,
      bedType,
      status: BedStatus.AVAILABLE,
      pricePerDay: this.getPriceForBedType(bedType),
      amenities: this.getAmenitiesForBedType(bedType),
    };

    this.beds.set(bed.bedId, bed);

    // Update ward bed count
    ward.bedCount++;

    return bed;
  }

  /**
   * Add a new ward
   */
  async addWard(name: string, floor: number, bedCount: number): Promise<Ward> {
    const ward: Ward = {
      wardId: uuidv4(),
      name,
      floor,
      bedCount: 0, // Will be updated after beds are created
    };

    this.wards.set(ward.wardId, ward);
    await this.createBedsForWard(ward, bedCount);

    // Update ward with correct bed count
    ward.bedCount = bedCount;

    return ward;
  }

  /**
   * Get all wards
   */
  async getWards(): Promise<Ward[]> {
    return Array.from(this.wards.values());
  }
}

export const bedService = new BedService();
