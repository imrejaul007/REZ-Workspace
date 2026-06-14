import { z } from 'zod';

export const ProductCategoryEnum = z.enum([
  'skincare',
  'haircare',
  'massage_oil',
  'body_lotion',
  'cleaning',
  'equipment',
  'consumable',
  'other'
]);
export type ProductCategory = z.infer<typeof ProductCategoryEnum>;

export interface Product {
  _id: string;
  name: string;
  description: string;
  sku: string;
  category: ProductCategory;
  brand: string;
  supplierId: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  costPrice: number;
  sellingPrice: number;
  expiryDate?: Date;
  batchNumber?: string;
  images: string[];
  status: 'active' | 'inactive' | 'discontinued';
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
  city: string;
  state: string;
  country: string;
  postalCode: string;
  gstin?: string;
  paymentTerms: string;
  rating: number;
  status: 'active' | 'inactive';
  products: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  sku: z.string().min(1).max(50),
  category: ProductCategoryEnum,
  brand: z.string().max(100),
  supplierId: z.string().optional(),
  quantity: z.number().min(0).default(0),
  unit: z.string().max(20).default('pieces'),
  minStockLevel: z.number().min(0).default(10),
  maxStockLevel: z.number().min(0).default(100),
  reorderPoint: z.number().min(0).default(20),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active')
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const CreateSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  contactPerson: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  address: z.string().max(300),
  city: z.string().max(100),
  state: z.string().max(100),
  country: z.string().max(100),
  postalCode: z.string().max(20),
  gstin: z.string().optional(),
  paymentTerms: z.string().max(100).default('NET 30'),
  rating: z.number().min(0).max(5).default(0),
  status: z.enum(['active', 'inactive']).default('active')
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
