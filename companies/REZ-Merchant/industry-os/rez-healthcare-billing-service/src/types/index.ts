import { z } from 'zod';

export const InvoiceStatusEnum = z.enum(['draft', 'pending', 'paid', 'partial', 'overdue', 'cancelled']);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

export interface Invoice {
  _id: string;
  invoiceId: string;
  patientId: string;
  appointmentId?: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
}

export interface Payment {
  _id: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'insurance' | 'bank_transfer';
  reference?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  processedAt: Date;
  createdAt: Date;
}

export const CreateInvoiceSchema = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0)
  })),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  dueDate: z.string(),
  notes: z.string().optional()
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
