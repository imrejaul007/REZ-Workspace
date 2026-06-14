import { z } from 'zod';

// Enums
export const TestCategory = z.enum([
  'hematology',
  'biochemistry',
  'microbiology',
  'pathology',
  'imaging'
]);
export type TestCategory = z.infer<typeof TestCategory>;

export const SampleStatus = z.enum([
  'collected',
  'in_transit',
  'received',
  'processing',
  'completed'
]);
export type SampleStatus = z.infer<typeof SampleStatus>;

export const ResultStatus = z.enum(['normal', 'low', 'high', 'critical']);
export type ResultStatus = z.infer<typeof ResultStatus>;

// Parameter Schema
export const ParameterSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  referenceRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  method: z.string().optional(),
});

export type Parameter = z.infer<typeof ParameterSchema>;

// Lab Schema
export const LabSchema = z.object({
  labId: z.string(),
  name: z.string().min(1),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    country: z.string().default('India'),
  }),
  certifications: z.array(z.string()).default([]),
  accreditations: z.array(z.string()).default([]),
  tests: z.array(z.string()).default([]), // testIds
  collectionCenters: z.array(z.string()).default([]), // centerIds
  contact: z.object({
    phone: z.string(),
    email: z.string().email(),
    emergency: z.string().optional(),
  }),
  workingHours: z.object({
    start: z.string(),
    end: z.string(),
    days: z.array(z.string()).default(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Lab = z.infer<typeof LabSchema>;

// Test Schema
export const TestSchema = z.object({
  testId: z.string(),
  name: z.string().min(1),
  category: TestCategory,
  description: z.string().optional(),
  parameters: z.array(ParameterSchema).default([]),
  sampleType: z.string().min(1),
  containerType: z.string().optional(),
  volume: z.string().optional(), // e.g., "5ml"
  turnaroundTime: z.number().min(1), // in hours
  price: z.number().min(0),
  equipment: z.array(z.string()).default([]),
  preparation: z.string().optional(),
  fastingRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Test = z.infer<typeof TestSchema>;

// Collection Center Schema
export const CollectionCenterSchema = z.object({
  centerId: z.string(),
  name: z.string().min(1),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
  }),
  contact: z.object({
    phone: z.string(),
    email: z.string().email().optional(),
  }),
  hours: z.object({
    start: z.string(),
    end: z.string(),
  }),
  isActive: z.boolean().default(true),
});

export type CollectionCenter = z.infer<typeof CollectionCenterSchema>;

// Sample Schema
export const SampleSchema = z.object({
  sampleId: z.string(),
  patientId: z.string(),
  testIds: z.array(z.string()),
  collectedAt: z.string(),
  collectedBy: z.string(),
  receivedAt: z.string().optional(),
  receivedBy: z.string().optional(),
  status: SampleStatus,
  containerType: z.string(),
  volume: z.string().optional(),
  barcode: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).default('routine'),
});

export type Sample = z.infer<typeof SampleSchema>;

// Result Schema
export const ResultSchema = z.object({
  resultId: z.string(),
  testId: z.string(),
  parameterName: z.string(),
  value: z.union([z.string(), z.number()]),
  unit: z.string(),
  referenceRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  status: ResultStatus,
  method: z.string().optional(),
  instrument: z.string().optional(),
  notes: z.string().optional(),
  verifiedAt: z.string().optional(),
  verifiedBy: z.string().optional(),
});

export type Result = z.infer<typeof ResultSchema>;

// Report Schema
export const ReportSchema = z.object({
  reportId: z.string(),
  sampleId: z.string(),
  patientId: z.string(),
  orderedBy: z.string(), // doctorId
  tests: z.array(z.object({
    testId: z.string(),
    testName: z.string(),
  })),
  results: z.array(ResultSchema).default([]),
  interpretation: z.string().optional(),
  pathologistId: z.string().optional(),
  pathologistName: z.string().optional(),
  releasedAt: z.string().optional(),
  status: z.enum(['draft', 'verified', 'released', 'cancelled']),
  pdfUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Report = z.infer<typeof ReportSchema>;

// Order Schema
export const OrderSchema = z.object({
  orderId: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  tests: z.array(z.object({
    testId: z.string(),
    testName: z.string(),
    price: z.number(),
  })),
  priority: z.enum(['routine', 'urgent', 'stat']).default('routine'),
  status: z.enum(['pending', 'sample_collected', 'processing', 'completed', 'cancelled']),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  samples: z.array(z.string()).default([]), // sampleIds
  reports: z.array(z.string()).default([]), // reportIds
  totalAmount: z.number().default(0),
  paidAmount: z.number().default(0),
  paymentStatus: z.enum(['pending', 'partial', 'paid', 'refunded']).default('pending'),
  orderedAt: z.string(),
  updatedAt: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;

// Patient Schema (simplified)
export const PatientSchema = z.object({
  patientId: z.string(),
  name: z.string().min(1),
  age: z.number(),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string(),
  email: z.string().email().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  bloodGroup: z.string().optional(),
  createdAt: z.string(),
});

export type Patient = z.infer<typeof PatientSchema>;
