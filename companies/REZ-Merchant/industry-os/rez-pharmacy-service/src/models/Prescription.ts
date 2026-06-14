import mongoose, { Document, Schema } from 'mongoose';

export enum PrescriptionStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  FLAGGED = 'FLAGGED',
  REJECTED = 'REJECTED'
}

export interface IPrescriptionItem {
  medicineId: string;
  medicineName: string;
  prescribedDosage: string;
  dosageForm: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  refillsAllowed: number;
  refillsRemaining: number;
  filledQuantity: number;
}

export interface IPrescription extends Document {
  prescriptionId: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  doctorRegistrationNumber: string;
  doctorSpecialization: string;
  hospitalClinicName?: string;
  diagnosis: string[];
  items: IPrescriptionItem[];
  totalItems: number;
  filledItems: number;
  status: PrescriptionStatus;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  prescriptionDate: Date;
  validFrom: Date;
  validUntil: Date;
  uploadedDocumentUrl?: string;
  documentType: 'DIGITAL' | 'PHYSICAL_UPLOAD' | 'E_PRESCRIPTION';
  notes?: string;
  flags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionItemSchema = new Schema<IPrescriptionItem>({
  medicineId: { type: String, required: true },
  medicineName: { type: String, required: true },
  prescribedDosage: { type: String, required: true },
  dosageForm: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  quantity: { type: Number, required: true },
  instructions: { type: String },
  refillsAllowed: { type: Number, default: 0 },
  refillsRemaining: { type: Number, default: 0 },
  filledQuantity: { type: Number, default: 0 }
}, { _id: false });

const PrescriptionSchema = new Schema<IPrescription>({
  prescriptionId: { type: String, required: true, unique: true, index: true },
  prescriptionNumber: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  patientAge: { type: Number, required: true },
  patientGender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
  patientPhone: { type: String },
  doctorId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  doctorRegistrationNumber: { type: String, required: true },
  doctorSpecialization: { type: String, required: true },
  hospitalClinicName: { type: String },
  diagnosis: [{ type: String }],
  items: [PrescriptionItemSchema],
  totalItems: { type: Number, required: true, default: 0 },
  filledItems: { type: Number, default: 0 },
  status: { type: String, enum: PrescriptionStatus, default: PrescriptionStatus.PENDING, index: true },
  verificationStatus: { type: String, enum: VerificationStatus, default: VerificationStatus.PENDING },
  verificationNotes: { type: String },
  verifiedBy: { type: String },
  verifiedAt: { type: Date },
  prescriptionDate: { type: Date, required: true },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true, index: true },
  uploadedDocumentUrl: { type: String },
  documentType: {
    type: String,
    enum: ['DIGITAL', 'PHYSICAL_UPLOAD', 'E_PRESCRIPTION'],
    default: 'E_PRESCRIPTION'
  },
  notes: { type: String },
  flags: [{ type: String }]
}, {
  timestamps: true,
  collection: 'prescriptions'
});

// Indexes
PrescriptionSchema.index({ prescriptionDate: -1 });
PrescriptionSchema.index({ validUntil: 1, status: 1 });
PrescriptionSchema.index({ patientId: 1, prescriptionDate: -1 });
PrescriptionSchema.index({ doctorId: 1, prescriptionDate: -1 });

// Virtual for checking if prescription is valid
PrescriptionSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.status !== PrescriptionStatus.EXPIRED &&
         this.status !== PrescriptionStatus.CANCELLED &&
         this.status !== PrescriptionStatus.REJECTED &&
         now >= this.validFrom &&
         now <= this.validUntil;
});

// Virtual for checking if fully filled
PrescriptionSchema.virtual('isFullyFilled').get(function() {
  return this.filledItems >= this.totalItems;
});

export const Prescription = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
