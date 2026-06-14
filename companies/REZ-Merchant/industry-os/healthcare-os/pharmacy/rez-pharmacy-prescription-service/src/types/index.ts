import { z } from 'zod';

export const PrescriptionStatusEnum = z.enum(['pending', 'verified', 'rejected', 'dispensed', 'expired']);
export type PrescriptionStatus = z.infer<typeof PrescriptionStatusEnum>;

export interface Prescription {
  _id: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorLicense: string;
  imageUrl: string;
  medicines: { name: string; dosage: string; quantity: number }[];
  diagnosis?: string;
  validUntil: Date;
  status: PrescriptionStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Verification {
  _id: string;
  prescriptionId: string;
  verifiedBy: string;
  verifiedAt: Date;
  notes?: string;
  isValid: boolean;
  createdAt: Date;
}

export const CreatePrescriptionSchema = z.object({
  patientId: z.string(),
  patientName: z.string(),
  doctorName: z.string(),
  doctorLicense: z.string(),
  imageUrl: z.string().optional(),
  medicines: z.array(z.object({ name: z.string(), dosage: z.string(), quantity: z.number() })),
  diagnosis: z.string().optional(),
  validUntil: z.string()
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
