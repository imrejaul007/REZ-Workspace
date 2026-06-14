import mongoose, { Document, Schema } from 'mongoose';

export enum DrugCategory {
  ANALGESIC = 'ANALGESIC',
  ANTIBIOTIC = 'ANTIBIOTIC',
  ANTIVIRAL = 'ANTIVIRAL',
  ANTIFUNGAL = 'ANTIFUNGAL',
  ANTIHISTAMINE = 'ANTIHISTAMINE',
  ANTIHYPERTENSIVE = 'ANTIHYPERTENSIVE',
  ANTIDIABETIC = 'ANTIDIABETIC',
  ANTIDEPRESSANT = 'ANTIDEPRESSANT',
  ANTIINFLAMMATORY = 'ANTIINFLAMMATORY',
  BRONCHODILATOR = 'BRONCHODILATOR',
  DIURETIC = 'DIURETIC',
  VITAMIN_MINERAL = 'VITAMIN_MINERAL',
  VACCINE = 'VACCINE',
  HORMONE = 'HORMONE',
  OTHER = 'OTHER'
}

export enum MedicineStatus {
  ACTIVE = 'ACTIVE',
  DISCONTINUED = 'DISCONTINUED',
  RECALL = 'RECALL',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export enum StorageCondition {
  ROOM_TEMPERATURE = 'ROOM_TEMPERATURE',
  REFRIGERATED = 'REFRIGERATED',
  FROZEN = 'FROZEN',
  PROTECTED_FROM_LIGHT = 'PROTECTED_FROM_LIGHT'
}

export interface IDrugInteraction {
  drugId: string;
  drugName: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  description: string;
}

export interface IMedicine extends Document {
  medicineId: string;
  name: string;
  genericName: string;
  brandName?: string;
  category: DrugCategory;
  description: string;
  composition: string[];
  dosageForm: 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'CREAM' | 'DROPS' | 'INHALER' | 'PATCH' | 'SUPPOSITORY';
  strength: string;
  manufacturer: string;
  batchNumber: string;
  batchCode: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  stock: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderLevel: number;
  expiryDate: Date;
  manufacturingDate: Date;
  shelfLocation: string;
  storageCondition: StorageCondition;
  requiresPrescription: boolean;
  controlledSubstance: boolean;
  schedule?: 'SCHEDULE_H1' | 'SCHEDULE_H2' | 'SCHEDULE_H3' | 'SCHEDULE_H4' | 'SCHEDULE_X';
  drugInteractions: IDrugInteraction[];
  sideEffects: string[];
  contraindications: string[];
  status: MedicineStatus;
  barcode?: string;
  ndc?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DrugInteractionSchema = new Schema<IDrugInteraction>({
  drugId: { type: String, required: true },
  drugName: { type: String, required: true },
  severity: { type: String, enum: ['MILD', 'MODERATE', 'SEVERE'], required: true },
  description: { type: String, required: true }
}, { _id: false });

const MedicineSchema = new Schema<IMedicine>({
  medicineId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  genericName: { type: String, required: true, index: true },
  brandName: { type: String },
  category: { type: String, enum: DrugCategory, required: true, index: true },
  description: { type: String, required: true },
  composition: [{ type: String }],
  dosageForm: {
    type: String,
    enum: ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'CREAM', 'DROPS', 'INHALER', 'PATCH', 'SUPPOSITORY'],
    required: true
  },
  strength: { type: String, required: true },
  manufacturer: { type: String, required: true },
  batchNumber: { type: String, required: true },
  batchCode: { type: String },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  mrp: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  minStockLevel: { type: Number, default: 10 },
  maxStockLevel: { type: Number, default: 1000 },
  reorderLevel: { type: Number, default: 20 },
  expiryDate: { type: Date, required: true, index: true },
  manufacturingDate: { type: Date, required: true },
  shelfLocation: { type: String },
  storageCondition: { type: String, enum: StorageCondition, default: StorageCondition.ROOM_TEMPERATURE },
  requiresPrescription: { type: Boolean, default: true },
  controlledSubstance: { type: Boolean, default: false },
  schedule: { type: String, enum: ['SCHEDULE_H1', 'SCHEDULE_H2', 'SCHEDULE_H3', 'SCHEDULE_H4', 'SCHEDULE_X'] },
  drugInteractions: [DrugInteractionSchema],
  sideEffects: [{ type: String }],
  contraindications: [{ type: String }],
  status: { type: String, enum: MedicineStatus, default: MedicineStatus.ACTIVE, index: true },
  barcode: { type: String, index: true },
  ndc: { type: String }
}, {
  timestamps: true,
  collection: 'medicines'
});

// Indexes for common queries
MedicineSchema.index({ category: 1, status: 1 });
MedicineSchema.index({ expiryDate: 1, status: 1 });
MedicineSchema.index({ stock: 1, reorderLevel: 1 });
MedicineSchema.index({ genericName: 'text', name: 'text', description: 'text' });

// Virtual for checking if medicine is expired
MedicineSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Virtual for checking if medicine needs reorder
MedicineSchema.virtual('needsReorder').get(function() {
  return this.stock <= this.reorderLevel;
});

export const Medicine = mongoose.model<IMedicine>('Medicine', MedicineSchema);
