import { v4 as uuidv4 } from 'uuid';
import type {
  Prescription,
  Medicine,
  CreatePrescriptionInput,
} from '../types/schemas.js';
import {
  getPrescription,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
  createPrescription,
  updatePrescription,
  getPatient,
} from '../models/store.js';

export class PrescriptionService {
  /**
   * Create a new prescription
   */
  async createPrescription(input: CreatePrescriptionInput): Promise<Prescription> {
    const prescription: Prescription = {
      prescriptionId: uuidv4(),
      patientId: input.patientId,
      doctorId: input.doctorId,
      appointmentId: input.appointmentId,
      medicines: input.medicines,
      diagnosis: input.diagnosis,
      instructions: input.instructions,
      validUntil: input.validUntil,
      createdAt: new Date().toISOString(),
    };

    return createPrescription(prescription);
  }

  /**
   * Get prescription by ID
   */
  async getPrescription(prescriptionId: string): Promise<Prescription | null> {
    return getPrescription(prescriptionId) || null;
  }

  /**
   * Get all prescriptions for a patient
   */
  async getPrescriptionsByPatientId(patientId: string): Promise<Prescription[]> {
    return getPrescriptionsByPatient(patientId);
  }

  /**
   * Get all prescriptions by a doctor
   */
  async getPrescriptionsByDoctorId(doctorId: string): Promise<Prescription[]> {
    return getPrescriptionsByDoctor(doctorId);
  }

  /**
   * Renew a prescription
   */
  async renewPrescription(prescriptionId: string, newValidUntil: string): Promise<Prescription | null> {
    const prescription = getPrescription(prescriptionId);
    if (!prescription) return null;

    // Create a new prescription with renewed validity
    const renewedPrescription: Prescription = {
      prescriptionId: uuidv4(),
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      appointmentId: prescription.appointmentId,
      medicines: prescription.medicines,
      diagnosis: `${prescription.diagnosis} (Renewed)`,
      instructions: prescription.instructions,
      validUntil: newValidUntil,
      createdAt: new Date().toISOString(),
    };

    return createPrescription(renewedPrescription);
  }

  /**
   * Add medicine to existing prescription
   */
  async addMedicine(prescriptionId: string, medicine: Medicine): Promise<Prescription | null> {
    const prescription = getPrescription(prescriptionId);
    if (!prescription) return null;

    return updatePrescription(prescriptionId, {
      medicines: [...prescription.medicines, medicine],
    }) || null;
  }

  /**
   * Remove medicine from prescription
   */
  async removeMedicine(prescriptionId: string, medicineName: string): Promise<Prescription | null> {
    const prescription = getPrescription(prescriptionId);
    if (!prescription) return null;

    return updatePrescription(prescriptionId, {
      medicines: prescription.medicines.filter(m => m.name !== medicineName),
    }) || null;
  }

  /**
   * Update prescription instructions
   */
  async updateInstructions(prescriptionId: string, instructions: string): Promise<Prescription | null> {
    return updatePrescription(prescriptionId, { instructions }) || null;
  }

  /**
   * Get active prescriptions for a patient
   */
  async getActivePrescriptions(patientId: string): Promise<Prescription[]> {
    const prescriptions = getPrescriptionsByPatient(patientId);
    const now = new Date();

    return prescriptions.filter(p => {
      const validUntil = new Date(p.validUntil);
      return validUntil >= now;
    });
  }

  /**
   * Get expired prescriptions for a patient
   */
  async getExpiredPrescriptions(patientId: string): Promise<Prescription[]> {
    const prescriptions = getPrescriptionsByPatient(patientId);
    const now = new Date();

    return prescriptions.filter(p => {
      const validUntil = new Date(p.validUntil);
      return validUntil < now;
    });
  }

  /**
   * Get prescriptions expiring soon (within N days)
   */
  async getExpiringPrescriptions(patientId: string, days: number = 7): Promise<Prescription[]> {
    const prescriptions = getPrescriptionsByPatient(patientId);
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return prescriptions.filter(p => {
      const validUntil = new Date(p.validUntil);
      return validUntil >= now && validUntil <= futureDate;
    });
  }

  /**
   * Get prescription history for a specific medicine
   */
  async getMedicineHistory(patientId: string, medicineName: string): Promise<Prescription[]> {
    const prescriptions = getPrescriptionsByPatient(patientId);
    const lowerName = medicineName.toLowerCase();

    return prescriptions.filter(p =>
      p.medicines.some(m => m.name.toLowerCase().includes(lowerName))
    );
  }

  /**
   * Get all unique medicines prescribed to a patient
   */
  async getPatientMedicines(patientId: string): Promise<Medicine[]> {
    const prescriptions = getPrescriptionsByPatient(patientId);
    const medicineMap = new Map<string, Medicine>();

    for (const prescription of prescriptions) {
      for (const medicine of prescription.medicines) {
        if (!medicineMap.has(medicine.name)) {
          medicineMap.set(medicine.name, medicine);
        }
      }
    }

    return Array.from(medicineMap.values());
  }

  /**
   * Search prescriptions by diagnosis
   */
  async searchByDiagnosis(patientId: string, diagnosis: string): Promise<Prescription[]> {
    const prescriptions = getPrescriptionsByPatient(patientId);
    const lowerDiagnosis = diagnosis.toLowerCase();

    return prescriptions.filter(p =>
      p.diagnosis.toLowerCase().includes(lowerDiagnosis)
    );
  }

  /**
   * Get prescription with patient details
   */
  async getPrescriptionWithPatient(prescriptionId: string): Promise<{
    prescription: Prescription | null;
    patient: ReturnType<typeof getPatient>;
  } | null> {
    const prescription = getPrescription(prescriptionId);
    if (!prescription) return null;

    return {
      prescription,
      patient: getPatient(prescription.patientId),
    };
  }

  /**
   * Generate prescription text for printing
   */
  async generatePrescriptionText(prescriptionId: string): Promise<string | null> {
    const prescription = getPrescription(prescriptionId);
    if (!prescription) return null;

    const patient = getPatient(prescription.patientId);
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════');
    lines.push('            MEDICAL PRESCRIPTION            ');
    lines.push('═══════════════════════════════════════════');
    lines.push('');
    lines.push(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`);
    lines.push(`Valid Until: ${new Date(prescription.validUntil).toLocaleDateString()}`);
    lines.push('');
    lines.push('───────────────────────────────────────────');
    lines.push('PATIENT INFORMATION');
    lines.push('───────────────────────────────────────────');
    if (patient) {
      lines.push(`Name: ${patient.name}`);
      lines.push(`Phone: ${patient.phone}`);
      if (patient.dob) {
        lines.push(`DOB: ${new Date(patient.dob).toLocaleDateString()}`);
      }
    }
    lines.push('');
    lines.push('───────────────────────────────────────────');
    lines.push('DIAGNOSIS');
    lines.push('───────────────────────────────────────────');
    lines.push(prescription.diagnosis);
    lines.push('');
    lines.push('───────────────────────────────────────────');
    lines.push('MEDICINES');
    lines.push('───────────────────────────────────────────');

    prescription.medicines.forEach((medicine, index) => {
      lines.push(`${index + 1}. ${medicine.name}`);
      lines.push(`   Dosage: ${medicine.dosage}`);
      lines.push(`   Frequency: ${medicine.frequency}`);
      lines.push(`   Duration: ${medicine.duration}`);
      if (medicine.instructions) {
        lines.push(`   Instructions: ${medicine.instructions}`);
      }
      lines.push('');
    });

    if (prescription.instructions) {
      lines.push('───────────────────────────────────────────');
      lines.push('ADDITIONAL INSTRUCTIONS');
      lines.push('───────────────────────────────────────────');
      lines.push(prescription.instructions);
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════');
    lines.push('        This prescription is valid until     ');
    lines.push(`        ${new Date(prescription.validUntil).toLocaleDateString()}         `);
    lines.push('═══════════════════════════════════════════');

    return lines.join('\n');
  }
}

// Export singleton instance
export const prescriptionService = new PrescriptionService();
