import { v4 as uuidv4 } from 'uuid';
import { Prescription, IPrescription } from '../models/Prescription';
import { logger } from '../config/logger';
import { IntentGraphClient } from './IntentGraphClient';

export interface MedicationItem {
  medicationId: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  category: string;
  dosageForm: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'topical' | 'inhaler' | 'patch';
  strength: string;
  unit: string;
  description?: string;
}

export interface InventoryItem {
  itemId: string;
  medicationId: string;
  medication: MedicationItem;
  pharmacyId: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  batchNumber?: string;
  expirationDate?: Date;
  location?: string;
  lastUpdated: Date;
}

export interface CreatePrescriptionInput {
  patientId: string;
  appointmentId?: string;
  providerId: string;
  providerName: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity: number;
    refills?: number;
  }>;
  diagnosis: string;
  notes?: string;
  pharmacyId?: string;
  pharmacyName?: string;
  startDate?: Date;
  endDate?: Date;
}

export class PharmacyService {
  private intentGraphClient: IntentGraphClient;
  private pharmacyInventory: Map<string, InventoryItem> = new Map();

  constructor() {
    this.intentGraphClient = new IntentGraphClient();
  }

  async createPrescription(input: CreatePrescriptionInput): Promise<IPrescription> {
    try {
      const prescriptionId = `RX-${uuidv4().substring(0, 8).toUpperCase()}`;
      const startDate = input.startDate || new Date();

      const medications = input.medications.map((med) => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || '',
        quantity: med.quantity,
        refills: med.refills || 0,
        refillsRemaining: med.refills || 0,
      }));

      const prescription = new Prescription({
        prescriptionId,
        patientId: input.patientId,
        appointmentId: input.appointmentId,
        providerId: input.providerId,
        providerName: input.providerName,
        medications,
        diagnosis: input.diagnosis,
        notes: input.notes,
        pharmacyId: input.pharmacyId,
        pharmacyName: input.pharmacyName,
        status: 'active',
        startDate,
        endDate: input.endDate,
      });

      await prescription.save();
      logger.info('Prescription created', { prescriptionId, patientId: input.patientId });

      // Track intent
      await this.intentGraphClient.trackIntent({
        userId: input.patientId,
        intent: 'prescription_created',
        entities: {
          prescriptionId,
          medications: input.medications.map((m) => m.name),
          diagnosis: input.diagnosis,
        },
        metadata: {
          service: 'rez-healthcare-service',
        },
      });

      return prescription.toObject();
    } catch (error) {
      logger.error('Failed to create prescription', { error, patientId: input.patientId });
      throw error;
    }
  }

  async getPrescriptionById(prescriptionId: string): Promise<IPrescription | null> {
    try {
      const prescription = await Prescription.findOne({ prescriptionId });
      return prescription?.toObject() || null;
    } catch (error) {
      logger.error('Failed to get prescription', { error, prescriptionId });
      throw error;
    }
  }

  async getPatientPrescriptions(
    patientId: string,
    options?: {
      status?: IPrescription['status'];
      page?: number;
      limit?: number;
    }
  ): Promise<{ prescriptions: IPrescription[]; total: number }> {
    try {
      const { status, page = 1, limit = 20 } = options || {};
      const filter: Record<string, unknown> = { patientId };

      if (status) {
        filter.status = status;
      }

      const [prescriptions, total] = await Promise.all([
        Prescription.find(filter)
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ createdAt: -1 }),
        Prescription.countDocuments(filter),
      ]);

      return { prescriptions: prescriptions.map((p) => p.toObject()), total };
    } catch (error) {
      logger.error('Failed to get patient prescriptions', { error, patientId });
      throw error;
    }
  }

  async cancelPrescription(prescriptionId: string): Promise<IPrescription | null> {
    try {
      const prescription = await Prescription.findOneAndUpdate(
        { prescriptionId, status: 'active' },
        { $set: { status: 'cancelled' } },
        { new: true }
      );

      if (prescription) {
        logger.info('Prescription cancelled', { prescriptionId });
      }

      return prescription?.toObject() || null;
    } catch (error) {
      logger.error('Failed to cancel prescription', { error, prescriptionId });
      throw error;
    }
  }

  async refillPrescription(
    prescriptionId: string,
    medicationIndex: number
  ): Promise<IPrescription | null> {
    try {
      const prescription = await Prescription.findOne({ prescriptionId, status: 'active' });
      if (!prescription) {
        return null;
      }

      const medication = prescription.medications[medicationIndex];
      if (!medication) {
        throw new Error('Medication not found in prescription');
      }

      if (medication.refillsRemaining <= 0) {
        throw new Error('No refills remaining');
      }

      // Decrement refills remaining
      const updatedMedications = [...prescription.medications];
      updatedMedications[medicationIndex] = {
        ...updatedMedications[medicationIndex],
        refillsRemaining: updatedMedications[medicationIndex].refillsRemaining - 1,
      };

      const updated = await Prescription.findOneAndUpdate(
        { prescriptionId },
        { $set: { medications: updatedMedications } },
        { new: true }
      );

      logger.info('Prescription refilled', {
        prescriptionId,
        medicationIndex,
        refillsRemaining: updated?.medications[medicationIndex]?.refillsRemaining,
      });

      return updated?.toObject() || null;
    } catch (error) {
      logger.error('Failed to refill prescription', { error, prescriptionId });
      throw error;
    }
  }

  async checkMedicationAvailability(
    medicationName: string,
    pharmacyId?: string
  ): Promise<InventoryItem[]> {
    try {
      const items: InventoryItem[] = [];
      this.pharmacyInventory.forEach((item) => {
        if (
          item.medication.name.toLowerCase().includes(medicationName.toLowerCase()) &&
          item.quantity > 0 &&
          (!pharmacyId || item.pharmacyId === pharmacyId)
        ) {
          items.push(item);
        }
      });
      return items;
    } catch (error) {
      logger.error('Failed to check medication availability', { error, medicationName });
      throw error;
    }
  }

  async updateInventory(
    itemId: string,
    quantityChange: number
  ): Promise<InventoryItem | null> {
    try {
      const item = this.pharmacyInventory.get(itemId);
      if (!item) {
        return null;
      }

      item.quantity = Math.max(0, item.quantity + quantityChange);
      item.lastUpdated = new Date();

      logger.info('Inventory updated', {
        itemId,
        quantityChange,
        newQuantity: item.quantity,
      });

      return item;
    } catch (error) {
      logger.error('Failed to update inventory', { error, itemId });
      throw error;
    }
  }

  async getLowStockItems(pharmacyId?: string): Promise<InventoryItem[]> {
    const lowStock: InventoryItem[] = [];

    this.pharmacyInventory.forEach((item) => {
      if (
        item.quantity <= item.reorderLevel &&
        (!pharmacyId || item.pharmacyId === pharmacyId)
      ) {
        lowStock.push(item);
      }
    });

    return lowStock;
  }
}
