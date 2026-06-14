import { z } from 'zod';

export interface Part {
  _id: string;
  partNumber: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  compatibleVehicles: string[];
  supplierId?: string;
  quantity: number;
  minStockLevel: number;
  costPrice: number;
  sellingPrice: number;
  location: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export const CreatePartSchema = z.object({
  partNumber: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(500),
  category: z.string(),
  brand: z.string(),
  compatibleVehicles: z.array(z.string()).optional(),
  supplierId: z.string().optional(),
  quantity: z.number().min(0).default(0),
  minStockLevel: z.number().min(0).default(5),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  location: z.string()
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
