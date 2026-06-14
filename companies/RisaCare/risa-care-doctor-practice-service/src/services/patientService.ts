import { v4 as uuidv4 } from 'uuid';
import type {
  Patient,
  MedicalRecord,
  Medicine,
  CreatePatientInput,
} from '../types/schemas.js';
import {
  getPatient,
  getAllPatients,
  createPatient,
  updatePatient,
  getAppointmentsByPatient,
} from '../models/store.js';

export class PatientService {
  /**
   * Register a new patient
   */
  async registerPatient(input: CreatePatientInput): Promise<Patient> {
    const now = new Date().toISOString();
    const patient: Patient = {
      patientId: uuidv4(),
      name: input.name,
      phone: input.phone,
      email: input.email,
      dob: input.dob,
      gender: input.gender,
      bloodType: input.bloodType,
      allergies: input.allergies || [],
      medicalHistory: [],
      medications: [],
      emergencyContact: input.emergencyContact,
      address: input.address,
      createdAt: now,
      updatedAt: now,
    };

    return createPatient(patient);
  }

  /**
   * Get patient by ID
   */
  async getPatient(patientId: string): Promise<Patient | null> {
    return getPatient(patientId) || null;
  }

  /**
   * Get all patients
   */
  async getAllPatients(): Promise<Patient[]> {
    return getAllPatients();
  }

  /**
   * Update patient information
   */
  async updatePatient(patientId: string, updates: Partial<CreatePatientInput>): Promise<Patient | null> {
    const existing = getPatient(patientId);
    if (!existing) return null;

    return updatePatient(patientId, updates) || null;
  }

  /**
   * Add allergy to patient
   */
  async addAllergy(patientId: string, allergy: string): Promise<Patient | null> {
    const patient = getPatient(patientId);
    if (!patient) return null;

    if (!patient.allergies.includes(allergy)) {
      return updatePatient(patientId, {
        allergies: [...patient.allergies, allergy],
      }) || null;
    }

    return patient;
  }

  /**
   * Add to medical history
   */
  async addToMedicalHistory(
    patientId: string,
    record: Omit<MedicalRecord, 'recordId' | 'date'>
  ): Promise<Patient | null> {
    const patient = getPatient(patientId);
    if (!patient) return null;

    const medicalRecord: MedicalRecord = {
      recordId: uuidv4(),
      date: new Date().toISOString(),
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      doctorId: record.doctorId,
      notes: record.notes,
    };

    return updatePatient(patientId, {
      medicalHistory: [...patient.medicalHistory, medicalRecord],
    }) || null;
  }

  /**
   * Add medication to current medications list
   */
  async addMedication(patientId: string, medication: Medicine): Promise<Patient | null> {
    const patient = getPatient(patientId);
    if (!patient) return null;

    return updatePatient(patientId, {
      medications: [...patient.medications, medication],
    }) || null;
  }

  /**
   * Remove medication from current medications list
   */
  async removeMedication(patientId: string, medicineName: string): Promise<Patient | null> {
    const patient = getPatient(patientId);
    if (!patient) return null;

    return updatePatient(patientId, {
      medications: patient.medications.filter(m => m.name !== medicineName),
    }) || null;
  }

  /**
   * Get patient records (appointments + medical history)
   */
  async getPatientRecords(patientId: string): Promise<{
    patient: Patient | null;
    appointments: ReturnType<typeof getAppointmentsByPatient>;
    medicalHistory: MedicalRecord[];
    currentMedications: Medicine[];
  } | null> {
    const patient = getPatient(patientId);
    if (!patient) return null;

    return {
      patient,
      appointments: getAppointmentsByPatient(patientId),
      medicalHistory: patient.medicalHistory,
      currentMedications: patient.medications,
    };
  }

  /**
   * Search patients by name or phone
   */
  async searchPatients(query: string): Promise<Patient[]> {
    const patients = getAllPatients();
    const lowerQuery = query.toLowerCase();

    return patients.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.phone.includes(query) ||
      (p.email && p.email.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get patient appointment history
   */
  async getPatientHistory(patientId: string): Promise<{
    past: ReturnType<typeof getAppointmentsByPatient>;
    upcoming: ReturnType<typeof getAppointmentsByPatient>;
  } | null> {
    const patient = getPatient(patientId);
    if (!patient) return null;

    const now = new Date();
    const appointments = getAppointmentsByPatient(patientId);

    const past = appointments.filter(a => {
      const appointmentDate = new Date(a.scheduledAt);
      return appointmentDate < now || a.status === 'completed';
    });

    const upcoming = appointments.filter(a => {
      const appointmentDate = new Date(a.scheduledAt);
      return appointmentDate >= now && a.status !== 'cancelled' && a.status !== 'completed';
    });

    return { past, upcoming };
  }

  /**
   * Update emergency contact
   */
  async updateEmergencyContact(
    patientId: string,
    contact: Patient['emergencyContact']
  ): Promise<Patient | null> {
    return updatePatient(patientId, { emergencyContact: contact }) || null;
  }

  /**
   * Update patient address
   */
  async updateAddress(
    patientId: string,
    address: Patient['address']
  ): Promise<Patient | null> {
    return updatePatient(patientId, { address }) || null;
  }

  /**
   * Calculate patient age from DOB
   */
  calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Get patients by age range
   */
  async getPatientsByAgeRange(minAge: number, maxAge: number): Promise<Patient[]> {
    const patients = getAllPatients();

    return patients.filter(p => {
      if (!p.dob) return false;
      const age = this.calculateAge(p.dob);
      return age >= minAge && age <= maxAge;
    });
  }

  /**
   * Get patient summary
   */
  async getPatientSummary(patientId: string): Promise<{
    patient: Patient | null;
    age?: number;
    totalVisits: number;
    lastVisit?: string;
    upcomingAppointments: number;
    activePrescriptions: number;
  } | null> {
    const patient = getPatient(patientId);
    if (!patient) return null;

    const appointments = getAppointmentsByPatient(patientId);
    const now = new Date();

    const pastVisits = appointments.filter(a =>
      a.status === 'completed' || new Date(a.scheduledAt) < now
    );

    const upcomingAppointments = appointments.filter(a =>
      new Date(a.scheduledAt) >= now && a.status !== 'cancelled'
    ).length;

    return {
      patient,
      age: patient.dob ? this.calculateAge(patient.dob) : undefined,
      totalVisits: pastVisits.length,
      lastVisit: pastVisits.length > 0
        ? pastVisits.sort((a, b) =>
            new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
          )[0].scheduledAt
        : undefined,
      upcomingAppointments,
      activePrescriptions: 0, // Would come from prescription service
    };
  }
}

// Export singleton instance
export const patientService = new PatientService();
