import mongoose, { ClientSession } from 'mongoose';
import { Supplier, GST_REGEX, PAN_REGEX } from '../models/Supplier';
import { PurchaseOrder } from '../models/PurchaseOrder';

export interface CreditSummary {
  supplierId: string;
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  outstandingPOs: number;
  outstandingAmount: number;
}

export interface AgingBucket {
  range: string;
  count: number;
  amount: number;
}

export interface SupplierAging {
  supplierId: string;
  buckets: AgingBucket[];
  totalOutstanding: number;
  oldestPOAge: number; // in days
}

/**
 * Validates GST number format (15 characters)
 * Pattern: ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
 */
export function validateGstNumber(gst: string): { valid: boolean; error?: string } {
  if (!gst || typeof gst !== 'string') {
    return { valid: false, error: 'GST number is required' };
  }

  const cleanedGst = gst.trim().toUpperCase();

  if (cleanedGst.length !== 15) {
    return { valid: false, error: 'GST number must be exactly 15 characters' };
  }

  if (!GST_REGEX.test(cleanedGst)) {
    return { valid: false, error: 'Invalid GST number format. Expected format: 27AABCU9603R1ZM' };
  }

  return { valid: true };
}

/**
 * Validates PAN number format (10 characters)
 * Pattern: ^[A-Z]{5}[0-9]{4}[A-Z]{1}$
 */
export function validatePan(pan: string): { valid: boolean; error?: string } {
  if (!pan || typeof pan !== 'string') {
    return { valid: false, error: 'PAN number is required' };
  }

  const cleanedPan = pan.trim().toUpperCase();

  if (cleanedPan.length !== 10) {
    return { valid: false, error: 'PAN number must be exactly 10 characters' };
  }

  if (!PAN_REGEX.test(cleanedPan)) {
    return { valid: false, error: 'Invalid PAN format. Expected format: ABCDE1234F' };
  }

  return { valid: true };
}

/**
 * Validates phone number (10 digits)
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  const cleanedPhone = phone.trim();

  if (!/^[0-9]{10}$/.test(cleanedPhone)) {
    return { valid: false, error: 'Phone number must be exactly 10 digits' };
  }

  return { valid: true };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const cleanedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(cleanedEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

/**
 * Validates credit limit
 */
export function validateCreditLimit(limit: number): { valid: boolean; error?: string } {
  if (typeof limit !== 'number' || isNaN(limit)) {
    return { valid: false, error: 'Credit limit must be a number' };
  }

  if (limit < 0) {
    return { valid: false, error: 'Credit limit cannot be negative' };
  }

  if (limit > 999999999) {
    return { valid: false, error: 'Credit limit cannot exceed 999,999,999' };
  }

  return { valid: true };
}

/**
 * Checks credit availability for a supplier
 * Returns the current credit status
 */
export async function checkCreditAvailability(
  supplierId: string,
  amount?: number
): Promise<{
  available: boolean;
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  sufficientForAmount?: boolean;
  shortfall?: number;
}> {
  const supplier = await Supplier.findById(supplierId)
    .select('creditLimit creditUsed')
    .lean();

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  const creditAvailable = Math.max(0, supplier.creditLimit - supplier.creditUsed);

  const result = {
    available: supplier.creditLimit > supplier.creditUsed,
    creditLimit: supplier.creditLimit,
    creditUsed: supplier.creditUsed,
    creditAvailable,
  };

  if (amount !== undefined) {
    result.sufficientForAmount = creditAvailable >= amount;
    result.shortfall = amount > creditAvailable ? amount - creditAvailable : undefined;
  }

  return result;
}

/**
 * Gets supplier credit summary including outstanding POs
 */
export async function getSupplierCreditSummary(supplierId: string): Promise<CreditSummary> {
  const supplier = await Supplier.findById(supplierId)
    .select('creditLimit creditUsed')
    .lean();

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  // Count outstanding POs (approved, partially received, etc.)
  const outstandingPOs = await PurchaseOrder.countDocuments({
    supplier: new mongoose.Types.ObjectId(supplierId),
    status: { $in: ['approved', 'partial', 'received'] },
  });

  // Calculate total outstanding amount from POs
  const outstandingPODocs = await PurchaseOrder.find({
    supplier: new mongoose.Types.ObjectId(supplierId),
    status: { $in: ['approved', 'partial', 'received'] },
  }).lean();

  let outstandingAmount = 0;
  for (const po of outstandingPODocs) {
    // Sum up the PO value (assuming total is calculated from items)
    const poData = po as unknown;
    if (poData.total !== undefined) {
      outstandingAmount += poData.total;
    }
  }

  return {
    supplierId,
    creditLimit: supplier.creditLimit,
    creditUsed: supplier.creditUsed,
    creditAvailable: Math.max(0, supplier.creditLimit - supplier.creditUsed),
    outstandingPOs,
    outstandingAmount,
  };
}

/**
 * Gets supplier aging buckets based on PO due dates
 * Buckets: 0-30 days, 30-60 days, 60-90 days, 90+ days
 */
export async function getSupplierAging(supplierId: string): Promise<SupplierAging> {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Get all approved/received POs with payment terms
  const pos = await PurchaseOrder.find({
    supplier: new mongoose.Types.ObjectId(supplierId),
    status: { $in: ['approved', 'partial', 'received'] },
    paymentTerms: { $exists: true },
  }).lean();

  const buckets: AgingBucket[] = [
    { range: '0-30', count: 0, amount: 0 },
    { range: '30-60', count: 0, amount: 0 },
    { range: '60-90', count: 0, amount: 0 },
    { range: '90+', count: 0, amount: 0 },
  ];

  let totalOutstanding = 0;
  let oldestDate: Date | null = null;

  for (const po of pos) {
    const poData = po as unknown;
    const poDate = new Date(po.createdAt);
    const poAmount = poData.total || 0;

    totalOutstanding += poAmount;

    // Track oldest PO
    if (!oldestDate || poDate < oldestDate) {
      oldestDate = poDate;
    }

    // Determine aging bucket based on PO date
    if (poDate >= thirtyDaysAgo) {
      buckets[0].count++;
      buckets[0].amount += poAmount;
    } else if (poDate >= sixtyDaysAgo) {
      buckets[1].count++;
      buckets[1].amount += poAmount;
    } else if (poDate >= ninetyDaysAgo) {
      buckets[2].count++;
      buckets[2].amount += poAmount;
    } else {
      buckets[3].count++;
      buckets[3].amount += poAmount;
    }
  }

  const oldestPOAge = oldestDate
    ? Math.floor((today.getTime() - oldestDate.getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  return {
    supplierId,
    buckets,
    totalOutstanding,
    oldestPOAge,
  };
}

/**
 * Updates supplier credit used atomically
 * Used when creating or updating POs
 */
export async function updateSupplierCredit(
  supplierId: string,
  amountDelta: number,
  session?: ClientSession
): Promise<{ success: boolean; creditUsed: number; creditAvailable: number }> {
  // First, fetch the current state
  const supplier = await Supplier.findById(supplierId).session(session || null);
  if (!supplier) {
    throw new Error('Supplier not found');
  }

  const newCreditUsed = supplier.creditUsed + amountDelta;

  // Validate credit limit not exceeded (for increases)
  if (amountDelta > 0 && newCreditUsed > supplier.creditLimit) {
    throw new Error(
      `Credit limit exceeded. Current used: ${supplier.creditUsed}, Limit: ${supplier.creditLimit}, Requested: ${amountDelta}`
    );
  }

  // Validate credit used doesn't go negative (for decreases)
  if (newCreditUsed < 0) {
    throw new Error('Credit used cannot be negative');
  }

  // Update atomically
  const updated = await Supplier.findByIdAndUpdate(
    supplierId,
    {
      $inc: { creditUsed: amountDelta },
    },
    { new: true, session: session || undefined }
  ).lean();

  if (!updated) {
    throw new Error('Failed to update supplier credit');
  }

  return {
    success: true,
    creditUsed: updated.creditUsed,
    creditAvailable: Math.max(0, updated.creditLimit - updated.creditUsed),
  };
}

/**
 * Resets credit used for a supplier (e.g., after full payment)
 * Only resets to 0 if all POs are settled
 */
export async function resetSupplierCredit(
  supplierId: string,
  session?: ClientSession
): Promise<{ success: boolean; creditUsed: number }> {
  // Check if there are any outstanding POs
  const outstandingCount = await PurchaseOrder.countDocuments({
    supplier: new mongoose.Types.ObjectId(supplierId),
    status: { $in: ['approved', 'partial', 'received'] },
  });

  if (outstandingCount > 0) {
    throw new Error(`Cannot reset credit: ${outstandingCount} outstanding POs exist`);
  }

  const updated = await Supplier.findByIdAndUpdate(
    supplierId,
    { $set: { creditUsed: 0 } },
    { new: true, session: session || undefined }
  ).lean();

  if (!updated) {
    throw new Error('Failed to reset supplier credit');
  }

  return {
    success: true,
    creditUsed: 0,
  };
}

/**
 * Gets supplier statistics for a merchant
 */
export async function getSupplierStats(merchantId: string): Promise<{
  totalSuppliers: number;
  activeSuppliers: number;
  pendingSuppliers: number;
  blockedSuppliers: number;
  totalCreditLimit: number;
  totalCreditUsed: number;
  averageCreditLimit: number;
}> {
  const stats = await Supplier.aggregate([
    {
      $match: {
        merchantId: merchantId,
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: null,
        totalSuppliers: { $sum: 1 },
        activeSuppliers: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
        },
        pendingSuppliers: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        blockedSuppliers: {
          $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] },
        },
        totalCreditLimit: { $sum: '$creditLimit' },
        totalCreditUsed: { $sum: '$creditUsed' },
        avgCreditLimit: { $avg: '$creditLimit' },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalSuppliers: 0,
      activeSuppliers: 0,
      pendingSuppliers: 0,
      blockedSuppliers: 0,
      totalCreditLimit: 0,
      totalCreditUsed: 0,
      averageCreditLimit: 0,
    };
  }

  const s = stats[0];
  return {
    totalSuppliers: s.totalSuppliers,
    activeSuppliers: s.activeSuppliers,
    pendingSuppliers: s.pendingSuppliers,
    blockedSuppliers: s.blockedSuppliers,
    totalCreditLimit: s.totalCreditLimit,
    totalCreditUsed: s.totalCreditUsed,
    averageCreditLimit: Math.round(s.avgCreditLimit || 0),
  };
}

/**
 * Searches suppliers by various criteria
 */
export async function searchSuppliers(
  merchantId: string,
  options: {
    query?: string;
    status?: string;
    isActive?: boolean;
    tags?: string[];
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  items: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const { query, status, isActive, tags, page = 1, limit = 20 } = options;

  const filter: unknown = {
    merchantId,
    isDeleted: { $ne: true },
  };

  if (query) {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escapedQuery, $options: 'i' } },
      { phone: { $regex: escapedQuery, $options: 'i' } },
      { gstNumber: { $regex: escapedQuery, $options: 'i' } },
      { email: { $regex: escapedQuery, $options: 'i' } },
      { contactPerson: { $regex: escapedQuery, $options: 'i' } },
    ];
  }

  if (status) {
    filter.status = status;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  if (tags && tags.length > 0) {
    filter.tags = { $in: tags };
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Supplier.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Supplier.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Gets all unique tags for a merchant's suppliers
 */
export async function getSupplierTags(merchantId: string): Promise<string[]> {
  const suppliers = await Supplier.find({
    merchantId,
    isDeleted: { $ne: true },
    tags: { $exists: true, $ne: [] },
  })
    .select('tags')
    .lean();

  const tagSet = new Set<string>();
  for (const supplier of suppliers) {
    for (const tag of supplier.tags || []) {
      tagSet.add(tag);
    }
  }

  return Array.from(tagSet).sort();
}
