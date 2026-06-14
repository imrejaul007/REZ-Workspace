export interface Supplier {
  id: string;
  name: string;
  code: string;
  type: 'manufacturer' | 'distributor' | 'wholesaler';
  email: string;
  phone: string;
  address: Address;
  GSTIN?: string;
  PAN?: string;
  categories: string[];
  rating: number;
  verified: boolean;
  status: 'active' | 'suspended' | 'pending';
  bankDetails?: BankDetails;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  IFSC: string;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  title: string;
  description: string;
  buyerId: string;
  category: string;
  items: RFQItem[];
  quantity: number;
  unit: string;
  targetPrice?: number;
  currency: string;
  deliveryLocation: Address;
  deliveryDate: string;
  validityDays: number;
  status: 'draft' | 'published' | 'closed' | 'awarded' | 'cancelled';
  responses: number;
  createdAt: string;
  updatedAt: string;
}

export interface RFQItem {
  itemId: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  specifications?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  items: QuoteItem[];
  totalAmount: number;
  currency: string;
  validUntil: string;
  paymentTerms: string;
  deliveryTime: number;
  warranty?: string;
  notes?: string;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected';
  rank?: number;
  createdAt: string;
}

export interface QuoteItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  quoteId: string;
  rfqId: string;
  buyerId: string;
  supplierId: string;
  items: POItem[];
  subtotal: number;
  GST: number;
  total: number;
  status: 'created' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  expectedDelivery: string;
  actualDelivery?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface POItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  deliveredQuantity?: number;
}

export interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  buyerId: string;
  supplierId: string;
  value: number;
  currency: string;
  startDate: string;
  endDate: string;
  renewalDate?: string;
  terms: string;
  status: 'active' | 'expiring' | 'expired' | 'terminated';
  autoRenew: boolean;
  createdAt: string;
}
