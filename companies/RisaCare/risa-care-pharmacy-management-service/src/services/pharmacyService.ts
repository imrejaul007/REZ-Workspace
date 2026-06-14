// Pharmacy Service - Core pharmacy management operations
import {
  Pharmacy,
  Pharmacist,
  Address,
  OperatingHours,
  PharmacyType,
} from '../types/pharmacy.js';
import * as pharmacyModel from '../models/pharmacy.js';

// Validation schemas using Zod-like patterns
interface PharmacyInput {
  name: string;
  type: PharmacyType;
  address: Address;
  licenseNumber: string;
  contactPhone: string;
  contactEmail?: string;
  gstNumber?: string;
  is24Hours?: boolean;
  operatingHours?: OperatingHours[];
}

interface PharmacistInput {
  name: string;
  licenseNumber: string;
  phone: string;
  email?: string;
  shift: 'morning' | 'evening' | 'night';
}

const DEFAULT_OPERATING_HOURS: OperatingHours[] = [
  { dayOfWeek: 0, openTime: '09:00', closeTime: '21:00', isClosed: false }, // Sunday
  { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00', isClosed: false }, // Monday
  { dayOfWeek: 2, openTime: '08:00', closeTime: '22:00', isClosed: false }, // Tuesday
  { dayOfWeek: 3, openTime: '08:00', closeTime: '22:00', isClosed: false }, // Wednesday
  { dayOfWeek: 4, openTime: '08:00', closeTime: '22:00', isClosed: false }, // Thursday
  { dayOfWeek: 5, openTime: '08:00', closeTime: '22:00', isClosed: false }, // Friday
  { dayOfWeek: 6, openTime: '08:00', closeTime: '22:00', isClosed: false }, // Saturday
];

export class PharmacyService {
  /**
   * Setup a new pharmacy
   */
  setupPharmacy(input: PharmacyInput): Pharmacy {
    // Validate required fields
    if (!input.name || input.name.trim().length < 2) {
      throw new Error('Pharmacy name must be at least 2 characters');
    }
    if (!input.licenseNumber || input.licenseNumber.trim().length < 3) {
      throw new Error('Valid license number is required');
    }
    if (!input.contactPhone || input.contactPhone.length < 10) {
      throw new Error('Valid contact phone is required');
    }
    if (!input.address || !input.address.city || !input.address.state) {
      throw new Error('Complete address with city and state is required');
    }

    // Check for duplicate license number
    const existingPharmacies = Array.from(pharmacyModel.pharmacies.values());
    const existing = existingPharmacies.find((p) => p.licenseNumber === input.licenseNumber);
    if (existing) {
      throw new Error(`Pharmacy with license ${input.licenseNumber} already exists`);
    }

    const pharmacy = pharmacyModel.createPharmacy({
      name: input.name.trim(),
      type: input.type,
      address: input.address,
      licenseNumber: input.licenseNumber.trim().toUpperCase(),
      pharmacists: [],
      operatingHours: input.operatingHours || DEFAULT_OPERATING_HOURS,
      is24Hours: input.is24Hours || false,
      contactPhone: input.contactPhone.trim(),
      contactEmail: input.contactEmail?.trim(),
      gstNumber: input.gstNumber?.trim().toUpperCase(),
    });

    return pharmacy;
  }

  /**
   * Get pharmacy by ID
   */
  getPharmacy(pharmacyId: string): Pharmacy | null {
    if (!pharmacyId) {
      throw new Error('Pharmacy ID is required');
    }
    return pharmacyModel.getPharmacy(pharmacyId) || null;
  }

  /**
   * Get all pharmacies
   */
  getAllPharmacies(): Pharmacy[] {
    return pharmacyModel.getAllPharmacies();
  }

  /**
   * Update pharmacy details
   */
  updatePharmacy(
    pharmacyId: string,
    updates: Partial<{
      name: string;
      address: Address;
      licenseNumber: string;
      is24Hours: boolean;
      operatingHours: OperatingHours[];
      contactPhone: string;
      contactEmail: string;
      gstNumber: string;
    }>
  ): Pharmacy | null {
    if (!pharmacyId) {
      throw new Error('Pharmacy ID is required');
    }

    const existing = pharmacyModel.getPharmacy(pharmacyId);
    if (!existing) {
      throw new Error(`Pharmacy ${pharmacyId} not found`);
    }

    // Validate license number uniqueness if changed
    if (updates.licenseNumber && updates.licenseNumber !== existing.licenseNumber) {
      const existingPharmacies = Array.from(pharmacyModel.pharmacies.values());
      const duplicate = existingPharmacies.find(
        (p) =>
          p.licenseNumber === updates.licenseNumber && p.pharmacyId !== pharmacyId
      );
      if (duplicate) {
        throw new Error(`License number ${updates.licenseNumber} already in use`);
      }
    }

    const updated = pharmacyModel.updatePharmacy(pharmacyId, {
      ...updates,
      licenseNumber: updates.licenseNumber?.toUpperCase(),
      gstNumber: updates.gstNumber?.toUpperCase(),
    });

    return updated || null;
  }

  /**
   * Add a pharmacist to the pharmacy
   */
  addPharmacist(pharmacyId: string, pharmacist: PharmacistInput): Pharmacy | null {
    if (!pharmacyId) {
      throw new Error('Pharmacy ID is required');
    }

    const existing = pharmacyModel.getPharmacy(pharmacyId);
    if (!existing) {
      throw new Error(`Pharmacy ${pharmacyId} not found`);
    }

    // Validate pharmacist input
    if (!pharmacist.name || pharmacist.name.trim().length < 2) {
      throw new Error('Pharmacist name must be at least 2 characters');
    }
    if (!pharmacist.licenseNumber || pharmacist.licenseNumber.trim().length < 3) {
      throw new Error('Valid license number is required');
    }
    if (!pharmacist.phone || pharmacist.phone.length < 10) {
      throw new Error('Valid phone number is required');
    }

    // Check for duplicate license number
    const duplicateLicense = existing.pharmacists.find(
      (p) => p.licenseNumber === pharmacist.licenseNumber.trim().toUpperCase()
    );
    if (duplicateLicense) {
      throw new Error(`Pharmacist with license ${pharmacist.licenseNumber} already exists`);
    }

    const newPharmacist: Pharmacist = {
      pharmacistId: pharmacyModel.generateId('PHR'),
      name: pharmacist.name.trim(),
      licenseNumber: pharmacist.licenseNumber.trim().toUpperCase(),
      phone: pharmacist.phone.trim(),
      email: pharmacist.email?.trim(),
      shift: pharmacist.shift,
      isActive: true,
    };

    return pharmacyModel.addPharmacist(pharmacyId, newPharmacist) || null;
  }

  /**
   * Remove a pharmacist
   */
  removePharmacist(pharmacyId: string, pharmacistId: string): Pharmacy | null {
    if (!pharmacyId || !pharmacistId) {
      throw new Error('Pharmacy ID and Pharmacist ID are required');
    }
    return pharmacyModel.removePharmacist(pharmacyId, pharmacistId) || null;
  }

  /**
   * Update pharmacist status (active/inactive)
   */
  updatePharmacistStatus(
    pharmacyId: string,
    pharmacistId: string,
    isActive: boolean
  ): Pharmacy | null {
    const pharmacy = pharmacyModel.getPharmacy(pharmacyId);
    if (!pharmacy) {
      throw new Error(`Pharmacy ${pharmacyId} not found`);
    }

    const pharmacist = pharmacy.pharmacists.find((p) => p.pharmacistId === pharmacistId);
    if (!pharmacist) {
      throw new Error(`Pharmacist ${pharmacistId} not found`);
    }

    pharmacist.isActive = isActive;
    pharmacyModel.pharmacies.set(pharmacyId, pharmacy);
    return pharmacy || null;
  }

  /**
   * Get pharmacists for a pharmacy
   */
  getPharmacists(pharmacyId: string): Pharmacist[] {
    const pharmacy = pharmacyModel.getPharmacy(pharmacyId);
    if (!pharmacy) {
      throw new Error(`Pharmacy ${pharmacyId} not found`);
    }
    return pharmacy.pharmacists;
  }

  /**
   * Check if pharmacy is currently open
   */
  isPharmacyOpen(pharmacyId: string): { isOpen: boolean; nextChange?: string } {
    const pharmacy = pharmacyModel.getPharmacy(pharmacyId);
    if (!pharmacy) {
      throw new Error(`Pharmacy ${pharmacyId} not found`);
    }

    if (pharmacy.is24Hours) {
      return { isOpen: true };
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const todayHours = pharmacy.operatingHours.find((h) => h.dayOfWeek === dayOfWeek);

    if (!todayHours || todayHours.isClosed) {
      // Find next opening
      let nextDay = (dayOfWeek + 1) % 7;
      let daysChecked = 0;
      while (daysChecked < 7) {
        const nextHours = pharmacy.operatingHours.find((h) => h.dayOfWeek === nextDay);
        if (nextHours && !nextHours.isClosed) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return { isOpen: false, nextChange: `${dayNames[nextDay]} ${nextHours.openTime}` };
        }
        nextDay = (nextDay + 1) % 7;
        daysChecked++;
      }
      return { isOpen: false };
    }

    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const isOpen = currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;

    return { isOpen };
  }
}

export const pharmacyService = new PharmacyService();
