import { v4 as uuidv4 } from 'uuid';
import {
  db,
  Prescription,
  Medicine,
  CreatePrescriptionRequest,
} from '../models/teleconsult.js';

export class PrescriptionService {
  /**
   * Create a new prescription for a consultation
   */
  async createPrescription(
    sessionId: string,
    request: CreatePrescriptionRequest
  ): Promise<Prescription> {
    // Verify session exists
    const session = db.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const now = new Date().toISOString();

    const prescription: Prescription = {
      sessionId,
      medicines: request.medicines,
      notes: request.notes,
      createdAt: now,
      updatedAt: now,
    };

    db.prescriptions.set(sessionId, prescription);

    return prescription;
  }

  /**
   * Get prescription for a session
   */
  getPrescription(sessionId: string): Prescription | undefined {
    return db.prescriptions.get(sessionId);
  }

  /**
   * Update prescription
   */
  async updatePrescription(
    sessionId: string,
    updates: Partial<Omit<Prescription, 'sessionId' | 'createdAt'>>
  ): Promise<Prescription> {
    const prescription = db.prescriptions.get(sessionId);
    if (!prescription) {
      throw new Error(`Prescription not found for session: ${sessionId}`);
    }

    const now = new Date().toISOString();

    const updated: Prescription = {
      ...prescription,
      ...updates,
      updatedAt: now,
    };

    db.prescriptions.set(sessionId, updated);

    return updated;
  }

  /**
   * Add a medicine to existing prescription
   */
  async addMedicine(
    sessionId: string,
    medicine: Medicine
  ): Promise<Prescription> {
    let prescription = db.prescriptions.get(sessionId);

    if (!prescription) {
      // Create new prescription with this medicine
      const now = new Date().toISOString();
      prescription = {
        sessionId,
        medicines: [medicine],
        createdAt: now,
        updatedAt: now,
      };
    } else {
      prescription.medicines.push(medicine);
      prescription.updatedAt = new Date().toISOString();
    }

    db.prescriptions.set(sessionId, prescription);

    return prescription;
  }

  /**
   * Remove a medicine from prescription
   */
  async removeMedicine(
    sessionId: string,
    medicineIndex: number
  ): Promise<Prescription> {
    const prescription = db.prescriptions.get(sessionId);
    if (!prescription) {
      throw new Error(`Prescription not found for session: ${sessionId}`);
    }

    if (medicineIndex < 0 || medicineIndex >= prescription.medicines.length) {
      throw new Error(`Invalid medicine index: ${medicineIndex}`);
    }

    prescription.medicines.splice(medicineIndex, 1);
    prescription.updatedAt = new Date().toISOString();

    db.prescriptions.set(sessionId, prescription);

    return prescription;
  }

  /**
   * Update a specific medicine in the prescription
   */
  async updateMedicine(
    sessionId: string,
    medicineIndex: number,
    updates: Partial<Medicine>
  ): Promise<Prescription> {
    const prescription = db.prescriptions.get(sessionId);
    if (!prescription) {
      throw new Error(`Prescription not found for session: ${sessionId}`);
    }

    if (medicineIndex < 0 || medicineIndex >= prescription.medicines.length) {
      throw new Error(`Invalid medicine index: ${medicineIndex}`);
    }

    prescription.medicines[medicineIndex] = {
      ...prescription.medicines[medicineIndex],
      ...updates,
    };
    prescription.updatedAt = new Date().toISOString();

    db.prescriptions.set(sessionId, prescription);

    return prescription;
  }

  /**
   * Get prescriptions for a patient
   */
  getPatientPrescriptions(patientId: string): Prescription[] {
    const prescriptions: Prescription[] = [];

    db.sessions.forEach(session => {
      if (session.patientId === patientId) {
        const prescription = db.prescriptions.get(session.sessionId);
        if (prescription) {
          prescriptions.push(prescription);
        }
      }
    });

    return prescriptions.sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  /**
   * Get prescriptions for a doctor
   */
  getDoctorPrescriptions(doctorId: string): Prescription[] {
    const prescriptions: Prescription[] = [];

    db.sessions.forEach(session => {
      if (session.doctorId === doctorId) {
        const prescription = db.prescriptions.get(session.sessionId);
        if (prescription) {
          prescriptions.push(prescription);
        }
      }
    });

    return prescriptions.sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  /**
   * Generate prescription PDF data (stub for PDF generation)
   */
  async generatePrescriptionPdfData(sessionId: string): Promise<{
    prescriptionId: string;
    sessionId: string;
    patientId: string;
    doctorId: string;
    medicines: Medicine[];
    notes?: string;
    issuedAt: string;
  }> {
    const prescription = db.prescriptions.get(sessionId);
    if (!prescription) {
      throw new Error(`Prescription not found for session: ${sessionId}`);
    }

    const session = db.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return {
      prescriptionId: `RX-${sessionId.substring(0, 8).toUpperCase()}`,
      sessionId,
      patientId: session.patientId,
      doctorId: session.doctorId,
      medicines: prescription.medicines,
      notes: prescription.notes,
      issuedAt: prescription.createdAt!,
    };
  }

  /**
   * Validate prescription data
   */
  validatePrescription(request: CreatePrescriptionRequest): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.medicines || request.medicines.length === 0) {
      errors.push('At least one medicine is required');
    }

    request.medicines?.forEach((medicine, index) => {
      if (!medicine.name || medicine.name.trim() === '') {
        errors.push(`Medicine ${index + 1}: Name is required`);
      }
      if (!medicine.dosage || medicine.dosage.trim() === '') {
        errors.push(`Medicine ${index + 1}: Dosage is required`);
      }
      if (!medicine.frequency || medicine.frequency.trim() === '') {
        errors.push(`Medicine ${index + 1}: Frequency is required`);
      }
      if (!medicine.duration || medicine.duration.trim() === '') {
        errors.push(`Medicine ${index + 1}: Duration is required`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const prescriptionService = new PrescriptionService();
