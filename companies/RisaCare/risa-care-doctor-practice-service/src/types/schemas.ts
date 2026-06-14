import { z } from 'zod';

// Enums as Zod schemas
export const PracticeTypeSchema = z.enum(['solo', 'group', 'clinic']);
export const AppointmentTypeSchema = z.enum(['new', 'follow_up', 'procedure']);
export const AppointmentStatusSchema = z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']);
export const PaymentMethodSchema = z.enum(['cash', 'card', 'upi', 'insurance', 'wallet']);
export const BillingStatusSchema = z.enum(['pending', 'paid', 'partial', 'refunded']);

// Address Schema
export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string().default('India'),
  coordinates: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
});

// Operating Hours Schema
export const OperatingHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  open: z.string(),
  close: z.string(),
  isOpen: z.boolean().default(true),
});

// Service Schema
export const ServiceSchema = z.object({
  serviceId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  duration: z.number(), // in minutes
  fee: z.number(),
  isActive: z.boolean().default(true),
});

// Availability Schema
export const AvailabilitySlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  slotDuration: z.number().default(30), // in minutes
});

// Appointment Schema
export const AppointmentSchema = z.object({
  appointmentId: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  scheduledAt: z.string().datetime(),
  duration: z.number().default(30),
  type: AppointmentTypeSchema,
  status: AppointmentStatusSchema.default('scheduled'),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Patient Medical Record Schema
export const MedicalRecordSchema = z.object({
  recordId: z.string(),
  date: z.string().datetime(),
  diagnosis: z.string(),
  treatment: z.string().optional(),
  doctorId: z.string(),
  notes: z.string().optional(),
});

// Medicine Schema
export const MedicineSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
  instructions: z.string().optional(),
});

// Prescription Schema
export const PrescriptionSchema = z.object({
  prescriptionId: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  appointmentId: z.string().optional(),
  medicines: z.array(MedicineSchema),
  diagnosis: z.string(),
  instructions: z.string().optional(),
  validUntil: z.string().datetime(),
  createdAt: z.string().datetime(),
});

// Billing Item Schema
export const BillingItemSchema = z.object({
  itemId: z.string(),
  description: z.string(),
  quantity: z.number().default(1),
  unitPrice: z.number(),
  total: z.number(),
});

// Billing Schema
export const BillingSchema = z.object({
  billingId: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  appointmentId: z.string().optional(),
  items: z.array(BillingItemSchema),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
  discount: z.number().default(0),
  paymentMethod: PaymentMethodSchema.optional(),
  status: BillingStatusSchema.default('pending'),
  paidAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

// Patient Schema
export const PatientSchema = z.object({
  patientId: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  dob: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  medicalHistory: z.array(MedicalRecordSchema).default([]),
  medications: z.array(MedicineSchema).default([]),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relation: z.string().optional(),
  }).optional(),
  address: AddressSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Doctor Schema
export const DoctorSchema = z.object({
  doctorId: z.string(),
  name: z.string(),
  specialty: z.string(),
  qualifications: z.array(z.string()),
  registrationNumber: z.string(),
  experience: z.number(), // years
  consultationFee: z.number(),
  languages: z.array(z.string()).default(['English']),
  availability: z.array(AvailabilitySlotSchema).default([]),
  profileImage: z.string().optional(),
  bio: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Practice Schema
export const PracticeSchema = z.object({
  practiceId: z.string(),
  name: z.string(),
  type: PracticeTypeSchema,
  specialty: z.string(),
  address: AddressSchema,
  doctors: z.array(z.string()).default([]), // doctor IDs
  staff: z.array(z.object({
    staffId: z.string(),
    name: z.string(),
    role: z.string(),
    phone: z.string().optional(),
  })).default([]),
  operatingHours: z.array(OperatingHoursSchema).default([]),
  services: z.array(ServiceSchema).default([]),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logo: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Type exports
export type PracticeType = z.infer<typeof PracticeTypeSchema>;
export type AppointmentType = z.infer<typeof AppointmentTypeSchema>;
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type BillingStatus = z.infer<typeof BillingStatusSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type OperatingHours = z.infer<typeof OperatingHoursSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type MedicalRecord = z.infer<typeof MedicalRecordSchema>;
export type Medicine = z.infer<typeof MedicineSchema>;
export type Prescription = z.infer<typeof PrescriptionSchema>;
export type BillingItem = z.infer<typeof BillingItemSchema>;
export type Billing = z.infer<typeof BillingSchema>;
export type Patient = z.infer<typeof PatientSchema>;
export type Doctor = z.infer<typeof DoctorSchema>;
export type Practice = z.infer<typeof PracticeSchema>;

// Input schemas for API requests
export const CreatePracticeInputSchema = PracticeSchema.omit({ practiceId: true, doctors: true, createdAt: true, updatedAt: true });
export const CreateDoctorInputSchema = DoctorSchema.omit({ doctorId: true, createdAt: true, updatedAt: true });
export const CreatePatientInputSchema = PatientSchema.omit({ patientId: true, medicalHistory: true, medications: true, createdAt: true, updatedAt: true });
export const BookAppointmentInputSchema = AppointmentSchema.omit({ appointmentId: true, status: true, createdAt: true, updatedAt: true });
export const CreatePrescriptionInputSchema = PrescriptionSchema.omit({ prescriptionId: true, createdAt: true });
export const CreateBillingInputSchema = BillingSchema.omit({ billingId: true, status: true, paidAt: true, createdAt: true });
export const SetAvailabilityInputSchema = z.object({
  doctorId: z.string(),
  slots: z.array(AvailabilitySlotSchema),
});

export type CreatePracticeInput = z.infer<typeof CreatePracticeInputSchema>;
export type CreateDoctorInput = z.infer<typeof CreateDoctorInputSchema>;
export type CreatePatientInput = z.infer<typeof CreatePatientInputSchema>;
export type BookAppointmentInput = z.infer<typeof BookAppointmentInputSchema>;
export type CreatePrescriptionInput = z.infer<typeof CreatePrescriptionInputSchema>;
export type CreateBillingInput = z.infer<typeof CreateBillingInputSchema>;
export type SetAvailabilityInput = z.infer<typeof SetAvailabilityInputSchema>;
