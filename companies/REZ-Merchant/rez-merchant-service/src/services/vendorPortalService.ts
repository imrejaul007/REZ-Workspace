/**
 * Vendor Self-Service Portal Service
 *
 * Provides suppliers with a portal to:
 * - View their orders and invoices
 * - Submit quotations
 * - Track payments
 * - Download documents
 */

import { Types } from 'mongoose';
import { Supplier } from '../models/Supplier';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { SupplierLedger } from '../models/SupplierLedger';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VendorPortalConfig {
  enabledModules: ('orders' | 'invoices' | 'payments' | 'documents' | 'quotes')[];
  requireApproval: boolean;
  allowPartialDelivery: boolean;
  autoRemindPayments: boolean;
}

export interface VendorPortalAccess {
  supplierId: string;
  supplierName: string;
  merchantId: string;
  email: string;
  phone: string;
  accessToken: string;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface VendorOrder {
  id: string;
  poNumber: string;
  orderDate: Date;
  expectedDelivery?: Date;
  deliveredDate?: Date;
  status: string;
  items: {
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    receivedQuantity?: number;
  }[];
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: string;
}

export interface VendorInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  lineItems: {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
}

export interface VendorPayment {
  id: string;
  paymentDate: Date;
  amount: number;
  reference: string;
  method: 'upi' | 'bank_transfer' | 'cash' | 'cheque' | 'neft' | 'rtgs';
  status: 'pending' | 'completed' | 'failed';
  remarks?: string;
}

// ── Access Management ──────────────────────────────────────────────────────────

const vendorAccessStore: Map<string, VendorPortalAccess> = new Map();

/**
 * Generate vendor portal access
 */
export async function generateVendorAccess(
  supplierId: string,
  merchantId: string
): Promise<{ access: VendorPortalAccess; tempPassword?: string }> {
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    throw new Error('Supplier not found');
  }

  // Generate access token
  const accessToken = generateAccessToken();
  const tempPassword = generateTempPassword();

  const access: VendorPortalAccess = {
    supplierId,
    supplierName: supplier.name,
    merchantId,
    email: supplier.email || '',
    phone: supplier.phone,
    accessToken,
    createdAt: new Date(),
    isActive: true,
  };

  vendorAccessStore.set(accessToken, access);

  logger.info('[VendorPortal] Access generated', { supplierId, merchantId });

  return { access, tempPassword };
}

/**
 * Validate vendor access token
 */
export async function validateVendorAccess(
  accessToken: string
): Promise<VendorPortalAccess | null> {
  const access = vendorAccessStore.get(accessToken);

  if (!access || !access.isActive) {
    return null;
  }

  // Update last login
  access.lastLoginAt = new Date();
  vendorAccessStore.set(accessToken, access);

  return access;
}

/**
 * Revoke vendor access
 */
export async function revokeVendorAccess(accessToken: string): Promise<boolean> {
  const access = vendorAccessStore.get(accessToken);

  if (!access) {
    return false;
  }

  access.isActive = false;
  vendorAccessStore.set(accessToken, access);

  logger.info('[VendorPortal] Access revoked', { supplierId: access.supplierId });

  return true;
}

// ── Dashboard Data ─────────────────────────────────────────────────────────────

/**
 * Get vendor dashboard summary
 */
export async function getVendorDashboard(
  supplierId: string,
  merchantId: string
): Promise<{
  totalOrders: number;
  pendingOrders: number;
  totalInvoiceValue: number;
  outstandingAmount: number;
  nextPaymentDue?: Date;
  recentActivity: {
    type: 'order' | 'payment' | 'document';
    title: string;
    date: Date;
    description: string;
  }[];
}> {
  // Get orders
  const orders = await PurchaseOrder.find({
    merchantId: new Types.ObjectId(merchantId),
    supplierId: new Types.ObjectId(supplierId),
  });

  // Get ledger
  const ledger = await SupplierLedger.find({
    merchantId: new Types.ObjectId(merchantId),
    supplierId: new Types.ObjectId(supplierId),
  }).sort({ createdAt: -1 });

  const pendingOrders = orders.filter(
    (o) => !['delivered', 'paid', 'cancelled'].includes(o.status)
  ).length;

  const totalInvoiceValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const outstandingAmount = ledger
    .filter((e) => e.type === 'debit')
    .reduce((sum, e) => sum + e.amount, 0);

  // Find next payment due
  const nextPaymentDue = orders
    .filter((o) => o.dueDate && o.dueDate > new Date())
    .sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0))[0]
    ?.dueDate;

  // Recent activity
  const recentActivity = [
    ...orders.slice(0, 3).map((o) => ({
      type: 'order' as const,
      title: `Order ${o.poNumber}`,
      date: o.orderDate,
      description: `Status: ${o.status}`,
    })),
    ...ledger.slice(0, 3).map((e) => ({
      type: 'payment' as const,
      title: e.type === 'credit' ? 'Payment Received' : 'Invoice',
      date: e.createdAt,
      description: `₹${e.amount.toLocaleString()} - ${e.description || e.reference || 'N/A'}`,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  return {
    totalOrders: orders.length,
    pendingOrders,
    totalInvoiceValue,
    outstandingAmount,
    nextPaymentDue,
    recentActivity,
  };
}

// ── Orders ─────────────────────────────────────────────────────────────────────

/**
 * Get vendor's orders
 */
export async function getVendorOrders(
  supplierId: string,
  merchantId: string,
  options?: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }
): Promise<{ orders: VendorOrder[]; total: number }> {
  const query: unknown = {
    merchantId: new Types.ObjectId(merchantId),
    supplierId: new Types.ObjectId(supplierId),
  };

  if (options?.status) {
    query.status = options.status;
  }

  if (options?.fromDate || options?.toDate) {
    query.orderDate = {};
    if (options.fromDate) query.orderDate.$gte = options.fromDate;
    if (options.toDate) query.orderDate.$lte = options.toDate;
  }

  const orders = await PurchaseOrder.find(query)
    .sort({ orderDate: -1 })
    .skip(((options?.page || 1) - 1) * (options?.limit || 20))
    .limit(options?.limit || 20);

  const total = await PurchaseOrder.countDocuments(query);

  const vendorOrders: VendorOrder[] = orders.map((order) => ({
    id: order._id.toString(),
    poNumber: order.poNumber,
    orderDate: order.orderDate,
    expectedDelivery: order.dueDate,
    deliveredDate: (order as unknown).deliveredDate,
    status: order.status,
    items: order.items.map((item) => ({
      name: item.name || item.description || 'Item',
      quantity: item.quantity,
      unit: item.unit || 'NOS',
      unitPrice: item.unitPrice,
      receivedQuantity: (item as unknown).receivedQuantity,
    })),
    totalAmount: order.totalAmount,
    paidAmount: order.paidAmount || 0,
    outstandingAmount: order.totalAmount - (order.paidAmount || 0),
    paymentStatus: getPaymentStatus(order),
  }));

  return { orders: vendorOrders, total };
}

/**
 * Get single order details
 */
export async function getVendorOrderDetails(
  supplierId: string,
  merchantId: string,
  orderId: string
): Promise<VendorOrder | null> {
  const order = await PurchaseOrder.findOne({
    _id: new Types.ObjectId(orderId),
    merchantId: new Types.ObjectId(merchantId),
    supplierId: new Types.ObjectId(supplierId),
  });

  if (!order) return null;

  return {
    id: order._id.toString(),
    poNumber: order.poNumber,
    orderDate: order.orderDate,
    expectedDelivery: order.dueDate,
    deliveredDate: (order as unknown).deliveredDate,
    status: order.status,
    items: order.items.map((item) => ({
      name: item.name || item.description || 'Item',
      quantity: item.quantity,
      unit: item.unit || 'NOS',
      unitPrice: item.unitPrice,
      receivedQuantity: (item as unknown).receivedQuantity,
    })),
    totalAmount: order.totalAmount,
    paidAmount: order.paidAmount || 0,
    outstandingAmount: order.totalAmount - (order.paidAmount || 0),
    paymentStatus: getPaymentStatus(order),
  };
}

// ── Payments ───────────────────────────────────────────────────────────────────

/**
 * Get vendor's payment history
 */
export async function getVendorPayments(
  supplierId: string,
  merchantId: string,
  options?: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }
): Promise<{ payments: VendorPayment[]; total: number; summary: { totalPaid: number; pendingAmount: number } }> {
  const ledger = await SupplierLedger.find({
    merchantId: new Types.ObjectId(merchantId),
    supplierId: new Types.ObjectId(supplierId),
    type: 'credit',
  })
    .sort({ createdAt: -1 })
    .skip(((options?.page || 1) - 1) * (options?.limit || 20))
    .limit(options?.limit || 20);

  const total = await SupplierLedger.countDocuments({
    merchantId: new Types.ObjectId(merchantId),
    supplierId: new Types.ObjectId(supplierId),
    type: 'credit',
  });

  const payments: VendorPayment[] = ledger.map((entry) => ({
    id: entry._id.toString(),
    paymentDate: entry.createdAt,
    amount: entry.amount,
    reference: entry.reference || entry.transactionId || 'N/A',
    method: (entry as unknown).paymentMethod || 'bank_transfer',
    status: 'completed' as const,
    remarks: entry.description,
  }));

  // Calculate summary
  const allCredits = await SupplierLedger.find({
    merchantId: new Types.ObjectId(merchantId),
    supplierId: new Types.ObjectId(supplierId),
    type: 'credit',
  });

  const allDebits = await SupplierLedger.find({
    merchantId: new Types.ObjectId(merchantId),
    supplierId: new Types.ObjectId(supplierId),
    type: 'debit',
  });

  const totalPaid = allCredits.reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = allDebits.reduce((sum, e) => sum + e.amount, 0) - totalPaid;

  return {
    payments,
    total,
    summary: { totalPaid, pendingAmount: Math.max(0, pendingAmount) },
  };
}

// ── Documents ─────────────────────────────────────────────────────────────────

/**
 * Get available documents for vendor
 */
export async function getVendorDocuments(
  supplierId: string,
  merchantId: string
): Promise<{
  documents: {
    type: 'invoice' | 'delivery_challan' | 'grn' | 'payment_receipt' | 'ewaybill';
    title: string;
    reference: string;
    date: Date;
    downloadUrl: string;
  }[];
}> {
  const orders = await PurchaseOrder.find({
    merchantId: new Types.ObjectId(merchantId),
    supplierId: new Types.ObjectId(supplierId),
  })
    .select('poNumber orderDate status')
    .sort({ orderDate: -1 });

  const documents = orders.map((order) => ({
    type: 'delivery_challan' as const,
    title: `Delivery Challan - ${order.poNumber}`,
    reference: order.poNumber,
    date: order.orderDate,
    downloadUrl: `/api/vendor/documents/challan/${order._id}`,
  }));

  return { documents };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getPaymentStatus(order: PurchaseOrder): string {
  const paid = order.paidAmount || 0;
  const total = order.totalAmount;

  if (paid === 0) return 'unpaid';
  if (paid >= total) return 'paid';
  return 'partial';
}

/**
 * FIX (security): Generate secure access token using crypto
 */
function generateAccessToken(): string {
  try {
    const { randomUUID } = require('crypto');
    return `vpt_${Date.now().toString(36)}${randomUUID().replace(/-/g, '')}`;
  } catch {
    // Legacy fallback (only for environments without crypto)
    return `vpt_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * FIX (security): Generate secure temp password using crypto
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  try {
    const { randomBytes } = require('crypto');
    const bytes = randomBytes(8);
    return Array.from(bytes, b => chars[b % chars.length]).join('');
  } catch {
    // Legacy fallback (only for environments without crypto)
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
