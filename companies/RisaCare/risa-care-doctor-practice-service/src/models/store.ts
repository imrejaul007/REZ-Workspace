// In-memory data store for doctor practice service
// In production, this would be replaced with a database (PostgreSQL/MongoDB)

import type {
  Practice,
  Doctor,
  Patient,
  Appointment,
  Prescription,
  Billing,
  AvailabilitySlot,
} from '../types/schemas.js';

// In-memory storage
const practices = new Map<string, Practice>();
const doctors = new Map<string, Doctor>();
const patients = new Map<string, Patient>();
const appointments = new Map<string, Appointment>();
const prescriptions = new Map<string, Prescription>();
const billings = new Map<string, Billing>();
const doctorAvailability = new Map<string, AvailabilitySlot[]>();

// Store exports
export const store = {
  practices,
  doctors,
  patients,
  appointments,
  prescriptions,
  billings,
  doctorAvailability,
};

// Helper functions for CRUD operations
export function getPractice(practiceId: string): Practice | undefined {
  return practices.get(practiceId);
}

export function getAllPractices(): Practice[] {
  return Array.from(practices.values());
}

export function createPractice(practice: Practice): Practice {
  practices.set(practice.practiceId, practice);
  return practice;
}

export function updatePractice(practiceId: string, updates: Partial<Practice>): Practice | undefined {
  const practice = practices.get(practiceId);
  if (!practice) return undefined;
  const updated = { ...practice, ...updates, updatedAt: new Date().toISOString() };
  practices.set(practiceId, updated);
  return updated;
}

export function getDoctor(doctorId: string): Doctor | undefined {
  return doctors.get(doctorId);
}

export function getAllDoctors(): Doctor[] {
  return Array.from(doctors.values());
}

export function getDoctorsByPractice(practiceId: string): Doctor[] {
  const practice = practices.get(practiceId);
  if (!practice) return [];
  return practice.doctors.map(id => doctors.get(id)).filter((d): d is Doctor => d !== undefined);
}

export function createDoctor(doctor: Doctor): Doctor {
  doctors.set(doctor.doctorId, doctor);
  return doctor;
}

export function updateDoctor(doctorId: string, updates: Partial<Doctor>): Doctor | undefined {
  const doctor = doctors.get(doctorId);
  if (!doctor) return undefined;
  const updated = { ...doctor, ...updates, updatedAt: new Date().toISOString() };
  doctors.set(doctorId, updated);
  return updated;
}

export function getPatient(patientId: string): Patient | undefined {
  return patients.get(patientId);
}

export function getAllPatients(): Patient[] {
  return Array.from(patients.values());
}

export function createPatient(patient: Patient): Patient {
  patients.set(patient.patientId, patient);
  return patient;
}

export function updatePatient(patientId: string, updates: Partial<Patient>): Patient | undefined {
  const patient = patients.get(patientId);
  if (!patient) return undefined;
  const updated = { ...patient, ...updates, updatedAt: new Date().toISOString() };
  patients.set(patientId, updated);
  return updated;
}

export function getAppointment(appointmentId: string): Appointment | undefined {
  return appointments.get(appointmentId);
}

export function getAllAppointments(): Appointment[] {
  return Array.from(appointments.values());
}

export function getAppointmentsByDoctor(doctorId: string): Appointment[] {
  return Array.from(appointments.values()).filter(a => a.doctorId === doctorId);
}

export function getAppointmentsByPatient(patientId: string): Appointment[] {
  return Array.from(appointments.values()).filter(a => a.patientId === patientId);
}

export function createAppointment(appointment: Appointment): Appointment {
  appointments.set(appointment.appointmentId, appointment);
  return appointment;
}

export function updateAppointment(appointmentId: string, updates: Partial<Appointment>): Appointment | undefined {
  const appointment = appointments.get(appointmentId);
  if (!appointment) return undefined;
  const updated = { ...appointment, ...updates, updatedAt: new Date().toISOString() };
  appointments.set(appointmentId, updated);
  return updated;
}

export function getPrescription(prescriptionId: string): Prescription | undefined {
  return prescriptions.get(prescriptionId);
}

export function getPrescriptionsByPatient(patientId: string): Prescription[] {
  return Array.from(prescriptions.values()).filter(p => p.patientId === patientId);
}

export function getPrescriptionsByDoctor(doctorId: string): Prescription[] {
  return Array.from(prescriptions.values()).filter(p => p.doctorId === doctorId);
}

export function createPrescription(prescription: Prescription): Prescription {
  prescriptions.set(prescription.prescriptionId, prescription);
  return prescription;
}

export function updatePrescription(prescriptionId: string, updates: Partial<Prescription>): Prescription | undefined {
  const prescription = prescriptions.get(prescriptionId);
  if (!prescription) return undefined;
  const updated = { ...prescription, ...updates };
  prescriptions.set(prescriptionId, updated);
  return updated;
}

export function getBilling(billingId: string): Billing | undefined {
  return billings.get(billingId);
}

export function getBillingsByPatient(patientId: string): Billing[] {
  return Array.from(billings.values()).filter(b => b.patientId === patientId);
}

export function getBillingsByDoctor(doctorId: string): Billing[] {
  return Array.from(billings.values()).filter(b => b.doctorId === doctorId);
}

export function getAllBillings(): Billing[] {
  return Array.from(billings.values());
}

export function createBilling(billing: Billing): Billing {
  billings.set(billing.billingId, billing);
  return billing;
}

export function updateBilling(billingId: string, updates: Partial<Billing>): Billing | undefined {
  const billing = billings.get(billingId);
  if (!billing) return undefined;
  const updated = { ...billing, ...updates };
  billings.set(billingId, updated);
  return updated;
}

export function getDoctorAvailability(doctorId: string): AvailabilitySlot[] {
  return doctorAvailability.get(doctorId) || [];
}

export function setDoctorAvailability(doctorId: string, slots: AvailabilitySlot[]): AvailabilitySlot[] {
  doctorAvailability.set(doctorId, slots);
  return slots;
}

export function blockTimeSlot(doctorId: string, date: string, startTime: string, endTime: string): void {
  // Implementation would store blocked time slots
  // For now, this is a placeholder
  const key = `${doctorId}:${date}:${startTime}:${endTime}`;
  doctorAvailability.set(key as unknown as string, []);
}
