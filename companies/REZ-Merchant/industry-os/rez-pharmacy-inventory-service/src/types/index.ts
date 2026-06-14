import { z } from 'zod';

export interface Batch {
  _id: string;
  batchNumber: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  manufactureDate: Date;
  expiryDate: Date;
  supplierId?: string;
  status: 'active' | 'expired' | 'recalled';
  createdAt: Date;
}

export interface Supplier {
  _id: string;
  name: string;
  licenseNumber: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export const CreateBatchSchema = z.object({
  batchNumber: z.string(),
  medicineId: z.string(),
  medicineName: z.string(),
  quantity: z.number().min(0),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  manufactureDate: z.string(),
  expiryDate: z.string(),
  supplierId: z.string().optional()
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
