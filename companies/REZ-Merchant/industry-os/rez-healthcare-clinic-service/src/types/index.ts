import { z } from 'zod';

export interface Clinic {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  departments: string[];
  operatingHours: { dayOfWeek: number; open: string; close: string; isOpen: boolean }[];
  facilities: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Department {
  _id: string;
  name: string;
  description: string;
  headDoctor?: string;
  doctors: string[];
  services: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
}

export const CreateClinicSchema = z.object({
  name: z.string().min(1),
  address: z.string(),
  phone: z.string(),
  email: z.string().email(),
  departments: z.array(z.string()).optional(),
  facilities: z.array(z.string()).optional()
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
