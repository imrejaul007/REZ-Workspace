// Purchase Order Types for REZ Ecosystem

export type POStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'sent' | 'acknowledged' | 'in_transit' | 'delivered' | 'cancelled';

export type POItemStatus = 'pending' | 'partial' | 'fulfilled';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  rating: number;
  totalOrders: number;
  categories: string[];
  isVerified: boolean;
}

export interface POItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  tax: number;
  taxRate: number;
  total: number;
  status: POItemStatus;
  deliveredQuantity: number;
  pendingQuantity: number;
}

export interface DeliveryPhoto {
  id: string;
  uri: string;
  timestamp: string;
  type: 'delivery' | 'damage' | 'receiving' | 'signature';
  notes?: string;
}

export interface DeliveryAttempt {
  id: string;
  attemptedAt: string;
  deliveredBy: string;
  receivedBy?: string;
  signature?: string;
  photos: DeliveryPhoto[];
  notes?: string;
  status: 'pending' | 'partial' | 'complete';
}

export interface PriceComparison {
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  minOrderQuantity: number;
  deliveryTime: string;
  rating: number;
  totalPrice: number;
  discount: number;
  isBestPrice: boolean;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: POStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  supplier: Supplier;
  items: POItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  shippingCost: number;
  grandTotal: number;
  notes?: string;
  terms?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  deliveryAddress: Address;
  billingAddress: Address;
  deliveryAttempts: DeliveryAttempt[];
  attachments: Attachment[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  syncStatus: 'synced' | 'pending' | 'failed';
  version: number;
}

export interface Address {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface Attachment {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface CreatePORequest {
  supplierId: string;
  items: CreatePOItem[];
  expectedDeliveryDate?: string;
  notes?: string;
  terms?: string;
  deliveryAddress: Omit<Address, 'id'>;
  billingAddress?: Omit<Address, 'id'>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
}

export interface CreatePOItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

export interface ApprovalAction {
  poId: string;
  action: 'approve' | 'reject';
  reason?: string;
}

export interface POListFilters {
  status?: POStatus[];
  paymentStatus?: PaymentStatus[];
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  search?: string;
}

export interface POListResponse {
  purchaseOrders: PurchaseOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  suppliers: number;
}

export interface SupplierSearchResult {
  suppliers: Supplier[];
  total: number;
}

export interface DashboardStats {
  totalPOs: number;
  pendingApproval: number;
  inTransit: number;
  deliveredThisMonth: number;
  totalValue: number;
  pendingValue: number;
  avgDeliveryTime: number;
  onTimeDeliveryRate: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete' | 'photo';
  entity: 'purchaseOrder' | 'deliveryPhoto';
  data;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

// Navigation Types
export type RootStackParamList = {
  Main: undefined;
  PODetail: { poId: string };
  CreatePO: { supplierId?: string; cloneFromId?: string };
  EditPO: { poId: string };
  SupplierSearch: { onSelect?: (supplier: Supplier) => void };
  ProductSearch: { supplierId: string; onSelect?: (product: ProductSearchResult) => void };
  PriceComparison: { productId: string; quantity: number };
  Camera: { poId: string; type: 'delivery' | 'damage' | 'receiving' | 'signature' };
  DeliveryTracking: { poId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  POList: { filters?: POListFilters };
  Create: undefined;
  Notifications: undefined;
  Settings: undefined;
};
