/**
 * Hospital Management Models for RisaCare
 * B2B Hospital Operations Management Service
 */

import { z } from 'zod';

// Enums
export enum BedType {
  GENERAL = 'general',
  PRIVATE = 'private',
  ICU = 'icu',
  SEMI_PRIVATE = 'semi-private',
}

export enum BedStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export enum AdmissionStatus {
  ACTIVE = 'active',
  DISCHARGED = 'discharged',
  TRANSFERRED = 'transferred',
}

export enum OperationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

export enum StaffRole {
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  ADMIN = 'admin',
  TECHNICIAN = 'technician',
  RECEPTIONIST = 'receptionist',
  SURGEON = 'surgeon',
  SPECIALIST = 'specialist',
}

export enum StaffStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  INACTIVE = 'inactive',
}

// Schemas for validation
export const EmergencyContactSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional(),
});

export const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(5),
  country: z.string().default('India'),
});

export const ScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isAvailable: z.boolean().default(true),
});

// Interfaces
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Schedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface License {
  licenseId: string;
  type: string;
  issuedDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'pending';
}

export interface Certification {
  certificationId: string;
  name: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate?: Date;
  status: 'active' | 'expired';
}

export interface OperatingRoom {
  orId: string;
  orNumber: string;
  name: string;
  floor: number;
  equipment: string[];
  status: 'available' | 'in_use' | 'maintenance';
}

export interface EmergencyRoom {
  erId: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  status: 'available' | 'full' | 'emergency';
}

export interface Ward {
  wardId: string;
  name: string;
  floor: number;
  departmentId?: string;
  bedCount: number;
}

export interface Hospital {
  hospitalId: string;
  name: string;
  address: Address;
  phone: string;
  email: string;
  departments: Department[];
  beds: Bed[];
  operatingRooms: OperatingRoom[];
  emergencyRooms: EmergencyRoom[];
  icuBeds: number;
  totalBeds: number;
  staff: Staff[];
  licenses: License[];
  certifications: Certification[];
  wards: Ward[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  departmentId: string;
  name: string;
  description?: string;
  headDoctorId?: string;
  doctors: string[];
  nurses: string[];
  beds: string[];
  specializations: string[];
  phone: string;
  email?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Patient {
  patientId: string;
  mrn: string;
  name: string;
  dob: Date;
  gender: Gender;
  bloodType?: BloodType;
  phone: string;
  email?: string;
  address: Address;
  allergies: string[];
  emergencyContact: EmergencyContact;
  insuranceId?: string;
  insuranceProvider?: string;
  admissionHistory: string[];
  medicalHistory: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Admission {
  admissionId: string;
  patientId: string;
  departmentId: string;
  roomId?: string;
  bedId?: string;
  admissionDate: Date;
  dischargeDate?: Date;
  diagnosis: string;
  treatmentPlan?: string;
  attendingDoctorId: string;
  status: AdmissionStatus;
  notes?: string;
  vitals?: VitalSigns;
  prescriptions?: Prescription[];
  procedures?: Procedure[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VitalSigns {
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  recordedAt: Date;
}

export interface Prescription {
  prescriptionId: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedBy: string;
  prescribedAt: Date;
  status: 'active' | 'completed' | 'cancelled';
}

export interface Procedure {
  procedureId: string;
  name: string;
  performedBy?: string;
  performedAt?: Date;
  notes?: string;
  status: 'planned' | 'performed' | 'cancelled';
}

export interface Bed {
  bedId: string;
  wardId: string;
  bedNumber: string;
  floor: number;
  bedType: BedType;
  status: BedStatus;
  currentPatientId?: string;
  currentAdmissionId?: string;
  pricePerDay: number;
  amenities: string[];
}

export interface Operation {
  operationId: string;
  patientId: string;
  surgeonId: string;
  operationType: string;
  description?: string;
  scheduledAt: Date;
  duration: number;
  operatingRoomId: string;
  status: OperationStatus;
  notes?: string;
  complications?: string;
  preOpInstructions?: string[];
  postOpInstructions?: string[];
  anesthesiologistId?: string;
  assistantSurgeonIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff {
  staffId: string;
  employeeId: string;
  name: string;
  role: StaffRole;
  departmentId?: string;
  specialization: string[];
  schedule: Schedule[];
  contact: {
    phone: string;
    email: string;
    emergencyPhone?: string;
  };
  salary: number;
  joinDate: Date;
  status: StaffStatus;
  qualifications: string[];
  licenseNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Input DTOs for validation
export interface CreateHospitalInput {
  name: string;
  address: Address;
  phone: string;
  email: string;
  icuBeds?: number;
  totalBeds?: number;
}

export interface UpdateHospitalInput {
  name?: string;
  address?: Address;
  phone?: string;
  email?: string;
  icuBeds?: number;
  totalBeds?: number;
}

export interface CreateDepartmentInput {
  name: string;
  description?: string;
  headDoctorId?: string;
  specializations?: string[];
  phone: string;
  email?: string;
}

export interface RegisterPatientInput {
  name: string;
  dob: Date;
  gender: Gender;
  bloodType?: BloodType;
  phone: string;
  email?: string;
  address: Address;
  allergies?: string[];
  emergencyContact: EmergencyContact;
  insuranceId?: string;
  insuranceProvider?: string;
}

export interface UpdatePatientInput {
  name?: string;
  phone?: string;
  email?: string;
  address?: Address;
  allergies?: string[];
  emergencyContact?: EmergencyContact;
  insuranceId?: string;
  insuranceProvider?: string;
}

export interface AdmitPatientInput {
  patientId: string;
  departmentId: string;
  bedId?: string;
  diagnosis: string;
  treatmentPlan?: string;
  attendingDoctorId: string;
  notes?: string;
}

export interface DischargePatientInput {
  admissionId: string;
  dischargeNotes?: string;
  followUpDate?: Date;
  prescriptions?: Prescription[];
}

export interface TransferPatientInput {
  admissionId: string;
  targetDepartmentId: string;
  targetBedId?: string;
  transferReason: string;
  notes?: string;
}

export interface AllocateBedInput {
  patientId: string;
  admissionId: string;
  bedId: string;
}

export interface ScheduleOperationInput {
  patientId: string;
  surgeonId: string;
  operationType: string;
  description?: string;
  scheduledAt: Date;
  duration: number;
  operatingRoomId: string;
  anesthesiologistId?: string;
  assistantSurgeonIds?: string[];
  preOpInstructions?: string[];
  notes?: string;
}

export interface UpdateOperationInput {
  status?: OperationStatus;
  scheduledAt?: Date;
  duration?: number;
  operatingRoomId?: string;
  complications?: string;
  notes?: string;
}

export interface AddStaffInput {
  name: string;
  role: StaffRole;
  departmentId?: string;
  specialization: string[];
  schedule: Schedule[];
  contact: {
    phone: string;
    email: string;
    emergencyPhone?: string;
  };
  salary: number;
  qualifications: string[];
  licenseNumber?: string;
}

export interface UpdateScheduleInput {
  staffId: string;
  schedule: Schedule[];
}

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
