// Prescription Service - Prescription validation and dispensing
import {
  Prescription,
  PrescriptionItem,
  PrescriptionStatus,
  Dispense,
  DispensedMedicine,
  Medicine,
} from '../types/pharmacy.js';
import * as pharmacyModel from '../models/pharmacy.js';

interface PrescriptionInput {
  patientId: string;
  doctorId: string;
  doctorName: string;
  medicines: PrescriptionItem[];
  diagnosis?: string;
  notes?: string;
  validDays?: number; // How many days the prescription is valid
}

interface DispenseInput {
  prescriptionId: string;
  medicines: Array<{
    medicineId: string;
    quantity: number;
  }>;
  dispensedBy: string;
  patientId: string;
  notes?: string;
  paymentStatus?: 'paid' | 'pending' | 'insurance';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canDispense: boolean;
  details: {
    expired: boolean;
    alreadyDispensed: boolean;
    missingMedicines: string[];
    insufficientStock: Array<{ medicineId: string; required: number; available: number }>;
    requiresPrescription: string[];
  };
}

export class PrescriptionService {
  /**
   * Create a new prescription
   */
  createPrescription(input: PrescriptionInput): Prescription {
    // Validation
    if (!input.patientId) {
      throw new Error('Patient ID is required');
    }
    if (!input.doctorId) {
      throw new Error('Doctor ID is required');
    }
    if (!input.doctorName || input.doctorName.trim().length < 2) {
      throw new Error('Doctor name is required');
    }
    if (!input.medicines || input.medicines.length === 0) {
      throw new Error('At least one medicine is required');
    }

    // Validate each medicine exists
    const missingMedicines: string[] = [];
    for (const item of input.medicines) {
      if (!item.medicineId) {
        throw new Error('Medicine ID is required for all items');
      }
      const medicine = pharmacyModel.getMedicine(item.medicineId);
      if (!medicine) {
        missingMedicines.push(item.medicineId);
      }
      if (item.quantity <= 0) {
        throw new Error(`Invalid quantity for medicine ${item.medicineId}`);
      }
    }

    if (missingMedicines.length > 0) {
      throw new Error(`Medicines not found: ${missingMedicines.join(', ')}`);
    }

    // Calculate validity period (default 30 days)
    const validDays = input.validDays || 30;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    return pharmacyModel.createPrescription({
      patientId: input.patientId,
      doctorId: input.doctorId,
      doctorName: input.doctorName.trim(),
      medicines: input.medicines,
      issuedAt: new Date(),
      validUntil,
      pharmacyId: undefined,
      diagnosis: input.diagnosis?.trim(),
      notes: input.notes?.trim(),
    });
  }

  /**
   * Get prescription by ID
   */
  getPrescription(prescriptionId: string): Prescription | null {
    if (!prescriptionId) {
      throw new Error('Prescription ID is required');
    }
    return pharmacyModel.getPrescription(prescriptionId) || null;
  }

  /**
   * Get prescriptions with filters
   */
  getPrescriptions(filters?: {
    status?: PrescriptionStatus;
    patientId?: string;
    pharmacyId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Prescription[] {
    let prescriptions = pharmacyModel.getAllPrescriptions({
      status: filters?.status,
      patientId: filters?.patientId,
      pharmacyId: filters?.pharmacyId,
    });

    // Filter by date range
    if (filters?.startDate) {
      prescriptions = prescriptions.filter((p) => p.issuedAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      prescriptions = prescriptions.filter((p) => p.issuedAt <= filters.endDate!);
    }

    return prescriptions;
  }

  /**
   * Get pending prescriptions (for a pharmacy to fulfill)
   */
  getPendingPrescriptions(pharmacyId?: string): Prescription[] {
    return pharmacyModel.getAllPrescriptions({
      status: 'pending',
      pharmacyId,
    });
  }

  /**
   * Get validated prescriptions ready for dispensing
   */
  getValidatedPrescriptions(pharmacyId?: string): Prescription[] {
    return pharmacyModel.getAllPrescriptions({
      status: 'validated',
      pharmacyId,
    });
  }

  /**
   * Validate a prescription for dispensing
   */
  validatePrescription(
    prescriptionId: string,
    pharmacyId?: string
  ): ValidationResult {
    const prescription = pharmacyModel.getPrescription(prescriptionId);

    if (!prescription) {
      return {
        isValid: false,
        errors: ['Prescription not found'],
        warnings: [],
        canDispense: false,
        details: {
          expired: false,
          alreadyDispensed: false,
          missingMedicines: [],
          insufficientStock: [],
          requiresPrescription: [],
        },
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const missingMedicines: string[] = [];
    const insufficientStock: Array<{ medicineId: string; required: number; available: number }> = [];
    const requiresPrescription: string[] = [];

    // Check if already dispensed
    if (prescription.status === 'dispensed') {
      errors.push('Prescription has already been fully dispensed');
    }

    // Check if cancelled
    if (prescription.status === 'cancelled') {
      errors.push('Prescription has been cancelled');
    }

    // Check expiration
    const now = new Date();
    if (now > prescription.validUntil) {
      errors.push(`Prescription expired on ${prescription.validUntil.toLocaleDateString()}`);
    }

    // Validate each medicine
    for (const item of prescription.medicines) {
      const medicine = pharmacyModel.getMedicine(item.medicineId);

      if (!medicine) {
        missingMedicines.push(item.medicineId);
        errors.push(`Medicine ${item.medicineName} not found in catalog`);
        continue;
      }

      // Check stock
      if (medicine.currentStock < item.quantity) {
        insufficientStock.push({
          medicineId: item.medicineId,
          required: item.quantity,
          available: medicine.currentStock,
        });
        if (medicine.currentStock === 0) {
          errors.push(`${medicine.name} is out of stock`);
        } else {
          warnings.push(
            `Insufficient stock for ${medicine.name}. Required: ${item.quantity}, Available: ${medicine.currentStock}`
          );
        }
      }

      // Check prescription requirement
      if (medicine.requiresPrescription) {
        requiresPrescription.push(medicine.name);
      }

      // Check expiry of available stock
      const inventory = pharmacyModel.getInventory(item.medicineId);
      if (inventory) {
        const expiredBatches = inventory.batches.filter(
          (b) => b.expiryDate <= now
        );
        if (expiredBatches.length > 0) {
          warnings.push(
            `Warning: Some stock of ${medicine.name} may be expired`
          );
        }
      }
    }

    // Update prescription status to validated if it's pending and valid
    if (prescription.status === 'pending' && errors.length === 0) {
      pharmacyModel.validatePrescription(prescriptionId);
      if (pharmacyId) {
        const updated = pharmacyModel.getPrescription(prescriptionId);
        if (updated) {
          updated.pharmacyId = pharmacyId;
          pharmacyModel.prescriptions.set(prescriptionId, updated);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canDispense:
        errors.length === 0 &&
        prescription.status !== 'dispensed' &&
        now <= prescription.validUntil,
      details: {
        expired: now > prescription.validUntil,
        alreadyDispensed: prescription.status === 'dispensed',
        missingMedicines,
        insufficientStock,
        requiresPrescription,
      },
    };
  }

  /**
   * Dispense medicines from a prescription
   */
  dispensePrescription(input: DispenseInput): Dispense | null {
    // First validate the prescription
    const validation = this.validatePrescription(input.prescriptionId);
    if (!validation.canDispense) {
      throw new Error(
        `Cannot dispense: ${validation.errors.join(', ')}`
      );
    }

    const prescription = pharmacyModel.getPrescription(input.prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    // Prepare dispensed medicines with batch info
    const dispensedMedicines: DispensedMedicine[] = [];
    let totalAmount = 0;

    for (const item of input.medicines) {
      const medicine = pharmacyModel.getMedicine(item.medicineId);
      if (!medicine) {
        throw new Error(`Medicine ${item.medicineId} not found`);
      }

      if (medicine.currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${medicine.name}. Available: ${medicine.currentStock}`
        );
      }

      // Get a valid batch (FIFO - oldest expiry first)
      const inventory = pharmacyModel.getInventory(item.medicineId);
      let batchNumber = 'N/A';
      let expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      if (inventory && inventory.batches.length > 0) {
        const validBatches = inventory.batches
          .filter((b) => b.expiryDate > new Date())
          .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
        if (validBatches.length > 0) {
          batchNumber = validBatches[0].batchNumber;
          expiryDate = validBatches[0].expiryDate;
        }
      }

      // Deduct stock
      pharmacyModel.updateMedicineStock(item.medicineId, -item.quantity);

      dispensedMedicines.push({
        medicineId: item.medicineId,
        medicineName: medicine.name,
        quantity: item.quantity,
        price: medicine.price,
        batchNumber,
        expiryDate,
      });

      totalAmount += medicine.price * item.quantity;
    }

    // Create dispense record
    const dispense = pharmacyModel.createDispense({
      prescriptionId: input.prescriptionId,
      medicines: dispensedMedicines,
      dispensedAt: new Date(),
      dispensedBy: input.dispensedBy,
      patientId: input.patientId,
      notes: input.notes,
      totalAmount,
      paymentStatus: input.paymentStatus || 'paid',
    });

    // Update prescription status
    pharmacyModel.updatePrescriptionStatus(input.prescriptionId, 'dispensed');

    return dispense;
  }

  /**
   * Get dispense history for a prescription
   */
  getDispenseHistory(prescriptionId: string): Dispense[] {
    if (!prescriptionId) {
      throw new Error('Prescription ID is required');
    }
    return pharmacyModel.getDispensesByPrescription(prescriptionId);
  }

  /**
   * Get dispense history for a patient
   */
  getPatientDispenseHistory(patientId: string): Dispense[] {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }
    return pharmacyModel.getDispensesByPatient(patientId);
  }

  /**
   * Cancel a prescription
   */
  cancelPrescription(prescriptionId: string, reason?: string): Prescription | null {
    const prescription = pharmacyModel.getPrescription(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (prescription.status === 'dispensed') {
      throw new Error('Cannot cancel a prescription that has been dispensed');
    }

    prescription.notes = prescription.notes
      ? `${prescription.notes}\n[Cancelled: ${reason || 'No reason provided'}]`
      : `[Cancelled: ${reason || 'No reason provided'}]`;

    const updated = pharmacyModel.updatePrescriptionStatus(prescriptionId, 'cancelled');
    return updated || null;
  }

  /**
   * Renew an expired prescription
   */
  renewPrescription(prescriptionId: string, validDays?: number): Prescription | null {
    const prescription = pharmacyModel.getPrescription(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (prescription.status !== 'expired' && prescription.status !== 'cancelled') {
      throw new Error('Can only renew expired or cancelled prescriptions');
    }

    const days = validDays || 30;
    const newValidUntil = new Date();
    newValidUntil.setDate(newValidUntil.getDate() + days);

    prescription.validUntil = newValidUntil;
    prescription.status = 'pending';
    prescription.updatedAt = new Date();

    pharmacyModel.prescriptions.set(prescriptionId, prescription);
    return prescription;
  }

  /**
   * Get prescription statistics
   */
  getPrescriptionStats(pharmacyId?: string): {
    total: number;
    pending: number;
    validated: number;
    dispensed: number;
    expired: number;
    cancelled: number;
    byDoctor: Record<string, number>;
    averageValidityDays: number;
  } {
    const prescriptions = pharmacyModel.getAllPrescriptions({ pharmacyId });

    const stats = {
      total: prescriptions.length,
      pending: 0,
      validated: 0,
      dispensed: 0,
      expired: 0,
      cancelled: 0,
      byDoctor: {} as Record<string, number>,
      averageValidityDays: 0,
    };

    let totalDays = 0;

    for (const prescription of prescriptions) {
      switch (prescription.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'validated':
          stats.validated++;
          break;
        case 'dispensed':
          stats.dispensed++;
          break;
        case 'expired':
          stats.expired++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }

      stats.byDoctor[prescription.doctorName] =
        (stats.byDoctor[prescription.doctorName] || 0) + 1;

      const validityDays = Math.ceil(
        (prescription.validUntil.getTime() - prescription.issuedAt.getTime()) /
          (24 * 60 * 60 * 1000)
      );
      totalDays += validityDays;
    }

    stats.averageValidityDays =
      prescriptions.length > 0 ? Math.round(totalDays / prescriptions.length) : 0;

    return stats;
  }
}

export const prescriptionService = new PrescriptionService();
