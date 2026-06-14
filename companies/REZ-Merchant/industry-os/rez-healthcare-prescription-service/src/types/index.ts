import { z } from 'zod';

export interface Prescription {
  _id: string;
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  medicines: { medicineId: string; name: string; dosage: string; frequency: string; duration: string; notes?: string }[];
  instructions?: string;
  validUntil: Date;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Medicine {
  _id: string;
  name: string;
  genericName: string;
  category: string;
  dosage: string;
  sideEffects: string[];
  contraindications: string[];
}

export const CreatePrescriptionSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  diagnosis: z.string(),
  medicines: z.array(z.object({
    medicineId: z.string(),
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    notes: z.string().optional()
  })),
  instructions: z.string().optional(),
  validUntil: z.string()
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
