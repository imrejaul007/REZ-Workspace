/**
 * Patient Service for RisaCare Hospital Management
 * Handles patient registration, search, and history management
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Patient,
  RegisterPatientInput,
  UpdatePatientInput,
  Admission,
  Gender,
  BloodType,
} from '../models/hospital.js';

class PatientService {
  private patients: Map<string, Patient> = new Map();
  private mrnCounter = 1000;

  /**
   * Generate unique Medical Record Number
   */
  private generateMRN(): string {
    this.mrnCounter++;
    const year = new Date().getFullYear();
    return `MRN${year}${this.mrnCounter.toString().padStart(6, '0')}`;
  }

  /**
   * Register a new patient
   */
  async registerPatient(input: RegisterPatientInput): Promise<Patient> {
    const now = new Date();

    const patient: Patient = {
      patientId: uuidv4(),
      mrn: this.generateMRN(),
      name: input.name,
      dob: input.dob,
      gender: input.gender,
      bloodType: input.bloodType,
      phone: input.phone,
      email: input.email,
      address: input.address,
      allergies: input.allergies || [],
      emergencyContact: input.emergencyContact,
      insuranceId: input.insuranceId,
      insuranceProvider: input.insuranceProvider,
      admissionHistory: [],
      medicalHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    this.patients.set(patient.patientId, patient);
    return patient;
  }

  /**
   * Get patient by ID
   */
  async getPatient(patientId: string): Promise<Patient | null> {
    return this.patients.get(patientId) || null;
  }

  /**
   * Get patient by MRN
   */
  async getPatientByMRN(mrn: string): Promise<Patient | null> {
    for (const patient of this.patients.values()) {
      if (patient.mrn === mrn) {
        return patient;
      }
    }
    return null;
  }

  /**
   * Update patient information
   */
  async updatePatient(
    patientId: string,
    input: UpdatePatientInput
  ): Promise<Patient | null> {
    const patient = this.patients.get(patientId);

    if (!patient) {
      return null;
    }

    const updatedPatient: Patient = {
      ...patient,
      ...(input.name && { name: input.name }),
      ...(input.phone && { phone: input.phone }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.address && { address: input.address }),
      ...(input.allergies !== undefined && { allergies: input.allergies }),
      ...(input.emergencyContact && { emergencyContact: input.emergencyContact }),
      ...(input.insuranceId !== undefined && { insuranceId: input.insuranceId }),
      ...(input.insuranceProvider !== undefined && {
        insuranceProvider: input.insuranceProvider,
      }),
      updatedAt: new Date(),
    };

    this.patients.set(patientId, updatedPatient);
    return updatedPatient;
  }

  /**
   * Search patients by various criteria
   */
  async searchPatients(params: {
    query?: string;
    gender?: Gender;
    bloodType?: BloodType;
    hasInsurance?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    patients: Patient[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { query, gender, bloodType, hasInsurance, page = 1, limit = 20 } = params;

    let filteredPatients = Array.from(this.patients.values());

    // Filter by query (name, mrn, phone, email)
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredPatients = filteredPatients.filter(
        p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.mrn.toLowerCase().includes(lowerQuery) ||
          p.phone.includes(query) ||
          p.email?.toLowerCase().includes(lowerQuery)
      );
    }

    // Filter by gender
    if (gender) {
      filteredPatients = filteredPatients.filter(p => p.gender === gender);
    }

    // Filter by blood type
    if (bloodType) {
      filteredPatients = filteredPatients.filter(p => p.bloodType === bloodType);
    }

    // Filter by insurance status
    if (hasInsurance !== undefined) {
      filteredPatients = filteredPatients.filter(p =>
        hasInsurance ? p.insuranceId : !p.insuranceId
      );
    }

    const total = filteredPatients.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedPatients = filteredPatients.slice(
      startIndex,
      startIndex + limit
    );

    return {
      patients: paginatedPatients,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get patient admission history
   */
  async getPatientHistory(patientId: string): Promise<Admission[]> {
    const patient = this.patients.get(patientId);

    if (!patient) {
      return [];
    }

    // In a real system, this would query the admission service
    // For now, return empty array - will be populated from admissionService
    return [];
  }

  /**
   * Add admission to patient history
   */
  async addAdmissionToHistory(patientId: string, admissionId: string): Promise<boolean> {
    const patient = this.patients.get(patientId);

    if (!patient) {
      return false;
    }

    patient.admissionHistory.push(admissionId);
    patient.updatedAt = new Date();

    return true;
  }

  /**
   * Add medical history entry
   */
  async addMedicalHistory(patientId: string, entry: string): Promise<Patient | null> {
    const patient = this.patients.get(patientId);

    if (!patient) {
      return null;
    }

    patient.medicalHistory.push(entry);
    patient.updatedAt = new Date();

    return patient;
  }

  /**
   * Add allergy to patient
   */
  async addAllergy(patientId: string, allergy: string): Promise<Patient | null> {
    const patient = this.patients.get(patientId);

    if (!patient) {
      return null;
    }

    if (!patient.allergies.includes(allergy)) {
      patient.allergies.push(allergy);
      patient.updatedAt = new Date();
    }

    return patient;
  }

  /**
   * Remove allergy from patient
   */
  async removeAllergy(patientId: string, allergy: string): Promise<Patient | null> {
    const patient = this.patients.get(patientId);

    if (!patient) {
      return null;
    }

    patient.allergies = patient.allergies.filter(a => a !== allergy);
    patient.updatedAt = new Date();

    return patient;
  }

  /**
   * Get all patients count
   */
  async getPatientCount(): Promise<number> {
    return this.patients.size;
  }

  /**
   * Get patient statistics
   */
  async getPatientStats(): Promise<{
    totalPatients: number;
    byGender: Record<Gender, number>;
    byBloodType: Record<BloodType, number>;
    insuredPatients: number;
    uninsuredPatients: number;
  }> {
    const patients = Array.from(this.patients.values());

    const byGender: Record<Gender, number> = {
      [Gender.MALE]: 0,
      [Gender.FEMALE]: 0,
      [Gender.OTHER]: 0,
    };

    const byBloodType: Record<BloodType, number> = {
      [BloodType.A_POSITIVE]: 0,
      [BloodType.A_NEGATIVE]: 0,
      [BloodType.B_POSITIVE]: 0,
      [BloodType.B_NEGATIVE]: 0,
      [BloodType.AB_POSITIVE]: 0,
      [BloodType.AB_NEGATIVE]: 0,
      [BloodType.O_POSITIVE]: 0,
      [BloodType.O_NEGATIVE]: 0,
    };

    let insuredPatients = 0;

    for (const patient of patients) {
      byGender[patient.gender]++;
      if (patient.bloodType) {
        byBloodType[patient.bloodType]++;
      }
      if (patient.insuranceId) {
        insuredPatients++;
      }
    }

    return {
      totalPatients: patients.length,
      byGender,
      byBloodType,
      insuredPatients,
      uninsuredPatients: patients.length - insuredPatients,
    };
  }
}

export const patientService = new PatientService();
