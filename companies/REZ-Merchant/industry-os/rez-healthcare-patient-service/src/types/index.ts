import { z } from 'zod';

export interface Patient {
  _id: string;
  patientId: string;
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  bloodGroup?: string;
  allergies: string[];
  emergencyContact: { name: string; phone: string; relation: string };
  insuranceProvider?: string;
  insuranceNumber?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface MedicalRecord {
  _id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  diagnosis: string;
  symptoms: string[];
  treatment: string;
  prescription?: string;
  notes?: string;
  attachments: string[];
  createdAt: Date;
}

export const CreatePatientSchema = z.object({
  name: z.string().min(1),
  dateOfBirth: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string(),
  email: z.string().email(),
  address: z.string(),
  bloodGroup: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  emergencyContact: z.object({ name: z.string(), phone: z.string(), relation: z.string() }),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional()
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
