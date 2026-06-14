// Pharmacy Types for RisaCare Pharmacy Management Service

export type PharmacyType = 'retail' | 'hospital' | 'online';
export type MedicineForm = 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream' | 'ointment' | 'drops' | 'inhaler' | 'patch' | 'suppository';
export type PrescriptionStatus = 'pending' | 'validated' | 'dispensed' | 'expired' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'insurance' | 'credit';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OperatingHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  openTime: string; // HH:mm format
  closeTime: string; // HH:mm format
  isClosed: boolean;
}

export interface Pharmacist {
  pharmacistId: string;
  name: string;
  licenseNumber: string;
  phone: string;
  email?: string;
  shift: 'morning' | 'evening' | 'night';
  isActive: boolean;
}

export interface Pharmacy {
  pharmacyId: string;
  name: string;
  type: PharmacyType;
  address: Address;
  licenseNumber: string;
  pharmacists: Pharmacist[];
  operatingHours: OperatingHours[];
  is24Hours: boolean;
  contactPhone: string;
  contactEmail?: string;
  gstNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Medicine {
  medicineId: string;
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  dosage: string;
  form: MedicineForm;
  packSize: string;
  price: number;
  mrp: number; // Maximum Retail Price
  requiresPrescription: boolean;
  currentStock: number;
  reorderLevel: number;
  hsnCode?: string;
  scheduleCategory?: 'Schedule H' | 'Schedule H1' | 'Schedule X' | 'OTC';
  sideEffects?: string[];
  contraindications?: string[];
  storageInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  quantity: number;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  medicines: PrescriptionItem[];
  issuedAt: Date;
  validUntil: Date;
  status: PrescriptionStatus;
  pharmacyId?: string;
  diagnosis?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DispensedMedicine {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  batchNumber: string;
  expiryDate: Date;
}

export interface Dispense {
  dispenseId: string;
  prescriptionId: string;
  medicines: DispensedMedicine[];
  dispensedAt: Date;
  dispensedBy: string;
  patientId: string;
  notes?: string;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'insurance';
}

export interface InventoryBatch {
  batchId: string;
  batchNumber: string;
  quantity: number;
  purchasePrice: number;
  mrp: number;
  expiryDate: Date;
  receivedDate: Date;
  supplierId: string;
}

export interface Inventory {
  medicineId: string;
  medicineName: string;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  batches: InventoryBatch[];
  lastRestocked: Date;
  averageCost: number;
  mrp: number; // Current MRP for valuation
  updatedAt: Date;
}

export interface Supplier {
  supplierId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: Address;
  medicines: string[]; // medicine IDs they supply
  deliveryTime: string; // e.g., "2-3 days"
  paymentTerms: string; // e.g., "Net 30", "COD"
  rating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  batchNumber?: string;
}

export interface Sale {
  saleId: string;
  patientId?: string;
  patientName?: string;
  medicines: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending' | 'refunded';
  soldAt: Date;
  dispensedBy: string;
  invoiceNumber: string;
  isPrescriptionSale: boolean;
  prescriptionId?: string;
  notes?: string;
}

export interface ReturnItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  reason: string;
  refundAmount: number;
}

export interface Return {
  returnId: string;
  saleId: string;
  items: ReturnItem[];
  totalRefund: number;
  returnedAt: Date;
  returnedBy: string;
  approvedBy?: string;
  notes?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Stock Alert types
export interface StockAlert {
  medicineId: string;
  medicineName: string;
  currentStock: number;
  reorderLevel: number;
  severity: 'low' | 'critical';
}

export interface ExpiryAlert {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  currentStock: number;
  severity: 'warning' | 'critical' | 'expired';
}
