import { z } from 'zod';

export interface Product {
  _id: string;
  name: string;
  description: string;
  sku: string;
  collectionId: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  salePrice?: number;
  currency: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  material: string;
  careInstructions: string[];
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: Date;
  updatedAt: Date;
}

export interface SKU {
  _id: string;
  sku: string;
  productId: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  sku: z.string().min(1),
  collectionId: z.string(),
  category: z.string(),
  subcategory: z.string(),
  brand: z.string(),
  price: z.number().min(0),
  salePrice: z.number().min(0).optional(),
  currency: z.string().default('INR'),
  images: z.array(z.string()).optional(),
  sizes: z.array(z.string()),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })),
  material: z.string(),
  careInstructions: z.array(z.string()).optional()
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
