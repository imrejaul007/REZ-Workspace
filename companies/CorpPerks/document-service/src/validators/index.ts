import { z } from 'zod';
import { DocumentType, DocumentStatus, SignatureStatus } from '../types';

// ==================== TEMPLATE VALIDATORS ====================

export const TemplateVariableSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['string', 'number', 'date', 'boolean', 'currency', 'array']),
  required: z.boolean(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  description: z.string().max(500).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
});

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.nativeEnum(DocumentType),
  content: z.string().min(1),
  variables: z.array(TemplateVariableSchema).min(1),
  category: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  isDefault: z.boolean().optional(),
});

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  content: z.string().min(1).optional(),
  variables: z.array(TemplateVariableSchema).min(1).optional(),
  category: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

export const TemplateQuerySchema = z.object({
  companyId: z.string().optional(),
  type: z.nativeEnum(DocumentType).optional(),
  category: z.string().optional(),
  department: z.string().optional(),
  isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().positive().max(100)).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'type']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ==================== DOCUMENT VALIDATORS ====================

export const GenerateDocumentSchema = z.object({
  templateId: z.string().min(1),
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  title: z.string().max(500).optional(),
  data: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
  sendForSignature: z.boolean().optional(),
  signers: z.array(z.object({
    userId: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['employee', 'manager', 'hr', 'legal', 'witness']),
    order: z.number().positive(),
  })).optional(),
});

export const DocumentQuerySchema = z.object({
  companyId: z.string().optional(),
  templateId: z.string().optional(),
  employeeId: z.string().optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
  type: z.nativeEnum(DocumentType).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().positive().max(100)).optional(),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ==================== SIGNATURE VALIDATORS ====================

export const RequestSignatureSchema = z.object({
  documentId: z.string().min(1),
  signers: z.array(z.object({
    userId: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['employee', 'manager', 'hr', 'legal', 'witness']),
    order: z.number().positive(),
  })).min(1),
  expiresInDays: z.number().positive().max(30).optional(),
});

export const SignDocumentSchema = z.object({
  signatureId: z.string().min(1),
  userId: z.string().min(1),
  signatureImageUrl: z.string().url().optional(),
});

export const RejectSignatureSchema = z.object({
  signatureId: z.string().min(1),
  userId: z.string().min(1),
  reason: z.string().min(1).max(500),
});

export const SignatureQuerySchema = z.object({
  companyId: z.string().optional(),
  documentId: z.string().optional(),
  userId: z.string().optional(),
  status: z.nativeEnum(SignatureStatus).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().positive().max(100)).optional(),
});

// ==================== TYPES ====================

export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
export type TemplateQueryInput = z.infer<typeof TemplateQuerySchema>;
export type GenerateDocumentInput = z.infer<typeof GenerateDocumentSchema>;
export type DocumentQueryInput = z.infer<typeof DocumentQuerySchema>;
export type RequestSignatureInput = z.infer<typeof RequestSignatureSchema>;
export type SignDocumentInput = z.infer<typeof SignDocumentSchema>;
export type RejectSignatureInput = z.infer<typeof RejectSignatureSchema>;
export type SignatureQueryInput = z.infer<typeof SignatureQuerySchema>;
