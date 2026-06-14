import { z } from 'zod';

export interface Inventory {
  _id: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  maxStockLevel: number;
  costPrice: number;
  sellingPrice: number;
  supplierId?: string;
  expiryDate?: Date;
  batchNumber?: string;
  location: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export const CreateInventorySchema = z.object({
  productId: z.string(),
  productName: z.string(),
  sku: z.string(),
  category: z.string(),
  quantity: z.number().min(0),
  unit: z.string(),
  minStockLevel: z.number().min(0).default(10),
  maxStockLevel: z.number().min(0).default(100),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  supplierId: z.string().optional(),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
  location: z.string()
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
