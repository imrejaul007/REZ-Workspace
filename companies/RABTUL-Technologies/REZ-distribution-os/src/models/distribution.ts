export interface Distributor {
  id: string;
  name: string;
  code: string;
  type: 'wholesaler' | 'distributor' | 'sub-distributor';
  email: string;
  phone: string;
  address: Address;
  GSTIN?: string;
  PAN?: string;
  creditLimit: number;
  currentBalance: number;
  status: 'active' | 'suspended' | 'inactive';
  territories: string[];
  retailers: string[];
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

export interface Order {
  id: string;
  orderNumber: string;
  distributorId: string;
  type: 'purchase' | 'return' | 'transfer';
  items: OrderItem[];
  subtotal: number;
  GST: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentDueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  SKU: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Inventory {
  id: string;
  distributorId: string;
  productId: string;
  SKU: string;
  productName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  unit: string;
  warehouseLocation: string;
  lastRestocked: string;
  expiryDate?: string;
  batchNumber?: string;
}

export interface Retailer {
  id: string;
  name: string;
  code: string;
  distributorId: string;
  type: 'retailer' | 'stockist';
  email: string;
  phone: string;
  address: Address;
  creditLimit: number;
  currentBalance: number;
  status: 'active' | 'suspended' | 'inactive';
  createdAt: string;
}
