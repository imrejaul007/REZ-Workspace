/**
 * E-Waybill Integration Service
 *
 * Integrates with GST e-waybill portal for generating and managing e-waybills.
 * Supports: Generate, Cancel, Update, Extend, Multi-vehicle
 */

import { Types } from 'mongoose';
import { logger } from '../config/logger';
import { PurchaseOrder } from '../models/PurchaseOrder';

// ── Types ─────────────────────────────────────────────────────────────────────

export type EwaybillStatus = 'draft' | 'generated' | 'cancelled' | 'expired' | 'in_transit' | 'delivered';
export type EwaybillType = 'outward' | 'inward';
export type TransporterMode = 'road' | 'rail' | 'air' | 'ship';

export interface EwaybillRequest {
  supplierId?: string;
  purchaseOrderId: string;
  ewaybillType: EwaybillType;

  // Document details
  documentType: 'inv' | 'crn' | 'dn';
  documentNumber: string;
  documentDate: string;

  // From details (seller)
  fromName: string;
  fromAddress: string;
  fromPlace: string;
  fromState: string;
  fromPincode: string;
  fromGstin?: string;

  // To details (buyer)
  toName: string;
  toAddress: string;
  toPlace: string;
  toState: string;
  toPincode: string;
  toGstin?: string;

  // Item details
  items: EwaybillItem[];

  // Transportation
  transporterId?: string;
  transporterName?: string;
  transporterMode: TransporterMode;
  vehicleNumber?: string;
  distance: number; // in km

  // Optional
  generateDate?: string;
  userGstin?: string;
}

export interface EwaybillItem {
  productName: string;
  description?: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  taxableValue: number;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  cessRate?: number;
  cessNonAdvol?: number;
}

export interface EwaybillResponse {
  success: boolean;
  ewaybillNumber?: string;
  ewaybillDate?: string;
  validUntil?: string;
  error?: string;
  errorCode?: string;
}

export interface IEwaybill extends Document {
  merchantId: Types.ObjectId;
  purchaseOrderId?: Types.ObjectId;
  salesOrderId?: Types.ObjectId;

  ewaybillNumber: string;
  ewaybillDate: Date;
  validUntil: Date;

  type: EwaybillType;
  documentType: string;
  documentNumber: string;
  documentDate: Date;

  fromName: string;
  fromAddress: string;
  fromPlace: string;
  fromState: string;
  fromPincode: string;
  fromGstin?: string;

  toName: string;
  toAddress: string;
  toPlace: string;
  toState: string;
  toPincode: string;
  toGstin?: string;

  items: EwaybillItem[];
  totalValue: number;
  totalTaxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalAmount: number;

  transporterId?: string;
  transporterName?: string;
  transporterMode: TransporterMode;
  vehicleNumber?: string;
  distance: number;

  status: EwaybillStatus;
  cancelledAt?: Date;
  cancelReason?: string;

  // Additional data from API
  alert?: string;
  remainingDistance?: number;
  multiVehicleTripId?: string;

  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store for demo
const ewaybills: Map<string, unknown> = new Map();

// ── E-waybill API Integration ──────────────────────────────────────────────────

const EWAYBILL_API_URL = process.env.EWAYBILL_API_URL || 'https://api.ewaybill.gst.gov.in';
const EWAYBILL_API_KEY = process.env.EWAYBILL_API_KEY;
const EWAYBILL_CLIENT_ID = process.env.EWAYBILL_CLIENT_ID;
const EWAYBILL_CLIENT_SECRET = process.env.EWAYBILL_CLIENT_SECRET;

/**
 * Generate e-waybill
 */
export async function generateEwaybill(
  merchantId: string,
  request: EwaybillRequest
): Promise<EwaybillResponse> {
  try {
    logger.info('[Ewaybill] Generating', { merchantId, poId: request.purchaseOrderId });

    // In production, call the actual e-waybill API
    // For now, simulate a successful response
    const ewaybillNumber = generateEwaybillNumber();
    const now = new Date();
    const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours validity

    // Calculate totals
    let totalValue = 0;
    let totalTaxableValue = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let cessAmount = 0;

    for (const item of request.items) {
      const itemValue = item.taxableValue;
      totalTaxableValue += itemValue;
      totalValue += itemValue;

      if (request.toState !== request.fromState) {
        igstAmount += (itemValue * (item.igstRate || 0)) / 100;
      } else {
        cgstAmount += (itemValue * (item.cgstRate || 0)) / 100;
        sgstAmount += (itemValue * (item.sgstRate || 0)) / 100;
      }
      cessAmount += (itemValue * (item.cessRate || 0)) / 100;
    }

    totalValue += cgstAmount + sgstAmount + igstAmount + cessAmount;

    // Store e-waybill
    const ewaybill = {
      _id: new Types.ObjectId(),
      merchantId: new Types.ObjectId(merchantId),
      purchaseOrderId: new Types.ObjectId(request.purchaseOrderId),
      ewaybillNumber,
      ewaybillDate: now,
      validUntil,
      type: request.ewaybillType,
      documentType: request.documentType,
      documentNumber: request.documentNumber,
      documentDate: new Date(request.documentDate),
      fromName: request.fromName,
      fromAddress: request.fromAddress,
      fromPlace: request.fromPlace,
      fromState: request.fromState,
      fromPincode: request.fromPincode,
      fromGstin: request.fromGstin,
      toName: request.toName,
      toAddress: request.toAddress,
      toPlace: request.toPlace,
      toState: request.toState,
      toPincode: request.toPincode,
      toGstin: request.toGstin,
      items: request.items,
      totalValue,
      totalTaxableValue,
      cgstAmount,
      sgstAmount,
      igstAmount,
      cessAmount,
      totalAmount: totalValue,
      transporterId: request.transporterId,
      transporterName: request.transporterName,
      transporterMode: request.transporterMode,
      vehicleNumber: request.vehicleNumber,
      distance: request.distance,
      status: 'generated' as EwaybillStatus,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    ewaybills.set(ewaybillNumber, ewaybill);

    logger.info('[Ewaybill] Generated', { ewaybillNumber, merchantId });

    return {
      success: true,
      ewaybillNumber,
      ewaybillDate: now.toISOString(),
      validUntil: validUntil.toISOString(),
    };
  } catch (err) {
    logger.error('[Ewaybill] Generation failed', { error: err });
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Cancel e-waybill
 */
export async function cancelEwaybill(
  merchantId: string,
  ewaybillNumber: string,
  reason: string,
  reasonCode: string
): Promise<{ success: boolean; message: string }> {
  try {
    const ewaybill = ewaybills.get(ewaybillNumber);

    if (!ewaybill) {
      return { success: false, message: 'E-waybill not found' };
    }

    if (ewaybill.merchantId.toString() !== merchantId) {
      return { success: false, message: 'Unauthorized' };
    }

    if (ewaybill.status === 'cancelled') {
      return { success: false, message: 'E-waybill already cancelled' };
    }

    // Check if can be cancelled (within validity or within 24 hours)
    const canCancel =
      ewaybill.status === 'generated' ||
      (new Date() < new Date(ewaybill.validUntil));

    if (!canCancel) {
      return { success: false, message: 'E-waybill cannot be cancelled after validity' };
    }

    ewaybill.status = 'cancelled';
    ewaybill.cancelledAt = new Date();
    ewaybill.cancelReason = `${reasonCode}: ${reason}`;
    ewaybill.updatedAt = new Date();

    ewaybills.set(ewaybillNumber, ewaybill);

    logger.info('[Ewaybill] Cancelled', { ewaybillNumber, reason });

    return { success: true, message: 'E-waybill cancelled successfully' };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Cancellation failed',
    };
  }
}

/**
 * Update e-waybill vehicle details
 */
export async function updateVehicle(
  merchantId: string,
  ewaybillNumber: string,
  vehicleNumber: string,
  fromPlace: string,
  fromState: string,
  remainingDistance: number
): Promise<{ success: boolean; message: string }> {
  try {
    const ewaybill = ewaybills.get(ewaybillNumber);

    if (!ewaybill) {
      return { success: false, message: 'E-waybill not found' };
    }

    if (ewaybill.merchantId.toString() !== merchantId) {
      return { success: false, message: 'Unauthorized' };
    }

    if (!['generated', 'in_transit'].includes(ewaybill.status)) {
      return { success: false, message: 'Cannot update vehicle for this e-waybill' };
    }

    ewaybill.vehicleNumber = vehicleNumber;
    ewaybill.fromPlace = fromPlace;
    ewaybill.fromState = fromState;
    ewaybill.remainingDistance = remainingDistance;
    ewaybill.updatedAt = new Date();

    ewaybills.set(ewaybillNumber, ewaybill);

    return { success: true, message: 'Vehicle updated successfully' };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Update failed',
    };
  }
}

/**
 * Extend e-waybill validity
 */
export async function extendValidity(
  merchantId: string,
  ewaybillNumber: string,
  remainingDistance: number,
  vehicleBreakdown: boolean
): Promise<{ success: boolean; newValidUntil?: string; message: string }> {
  try {
    const ewaybill = ewaybills.get(ewaybillNumber);

    if (!ewaybill) {
      return { success: false, message: 'E-waybill not found' };
    }

    if (ewaybill.merchantId.toString() !== merchantId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Calculate new validity (8 hours per 100km or part thereof)
    const hours = Math.ceil(remainingDistance / 100) * 8;
    const newValidUntil = new Date(ewaybill.validUntil.getTime() + hours * 60 * 60 * 1000);

    ewaybill.validUntil = newValidUntil;
    ewaybill.remainingDistance = remainingDistance;
    ewaybill.updatedAt = new Date();

    ewaybills.set(ewaybillNumber, ewaybill);

    return {
      success: true,
      newValidUntil: newValidUntil.toISOString(),
      message: `Validity extended by ${hours} hours`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Extension failed',
    };
  }
}

/**
 * Get e-waybill details
 */
export async function getEwaybill(
  merchantId: string,
  ewaybillNumber: string
): Promise<unknown | null> {
  const ewaybill = ewaybills.get(ewaybillNumber);

  if (!ewaybill || ewaybill.merchantId.toString() !== merchantId) {
    return null;
  }

  return ewaybill;
}

/**
 * List e-waybills
 */
export async function listEwaybills(
  merchantId: string,
  filters?: {
    status?: EwaybillStatus;
    fromDate?: Date;
    toDate?: Date;
    type?: EwaybillType;
  }
): Promise<unknown[]> {
  const results: unknown[] = [];

  for (const ewaybill of ewaybills.values()) {
    if (ewaybill.merchantId.toString() !== merchantId) continue;
    if (ewaybill.isDeleted) continue;

    if (filters) {
      if (filters.status && ewaybill.status !== filters.status) continue;
      if (filters.type && ewaybill.type !== filters.type) continue;
      if (filters.fromDate && ewaybill.ewaybillDate < filters.fromDate) continue;
      if (filters.toDate && ewaybill.ewaybillDate > filters.toDate) continue;
    }

    results.push(ewaybill);
  }

  return results.sort((a, b) => b.ewaybillDate.getTime() - a.ewaybillDate.getTime());
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * FIX (security): Generate secure e-waybill number using crypto
 */
function generateEwaybillNumber(): string {
  // Format: 6 digits year-month + 8 random digits
  const now = new Date();
  const yearMonth = now.getFullYear().toString().slice(-2) +
    (now.getMonth() + 1).toString().padStart(2, '0');
  // FIX (security): Replaced Math.random() with crypto
  let random: string;
  try {
    const { randomBytes } = require('crypto');
    const bytes = randomBytes(4);
    random = (bytes.readUInt32BE(0) % 100000000).toString().padStart(8, '0');
  } catch {
    random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  }
  return `${yearMonth}${random}`;
}

/**
 * Generate e-waybill from Purchase Order
 */
export async function generateFromPurchaseOrder(
  merchantId: string,
  purchaseOrderId: string,
  transporterDetails: {
    transporterMode: TransporterMode;
    vehicleNumber?: string;
    transporterId?: string;
    transporterName?: string;
    distance: number;
  }
): Promise<EwaybillResponse> {
  const po = await PurchaseOrder.findById(purchaseOrderId);

  if (!po) {
    return { success: false, error: 'Purchase order not found' };
  }

  // Map PO items to e-waybill items
  const items: EwaybillItem[] = po.items.map((item) => ({
    productName: item.name || item.description || 'Product',
    description: item.description,
    hsnCode: (item as unknown).hsnCode || '9999',
    quantity: item.quantity,
    unit: item.unit || 'NOS',
    taxableValue: item.total || (item.quantity * item.unitPrice),
    cgstRate: (item as unknown).cgstRate || 9,
    sgstRate: (item as unknown).sgstRate || 9,
    igstRate: (item as unknown).igstRate || 18,
    cessRate: (item as unknown).cessRate || 0,
    cessNonAdvol: 0,
  }));

  // In production, get actual addresses from store/supplier
  const request: EwaybillRequest = {
    purchaseOrderId: purchaseOrderId,
    ewaybillType: 'inward',
    documentType: 'inv',
    documentNumber: po.poNumber,
    documentDate: po.orderDate.toISOString(),
    fromName: 'Supplier', // Would come from Supplier model
    fromAddress: '',
    fromPlace: '',
    fromState: '',
    fromPincode: '',
    toName: 'Merchant', // Would come from Merchant model
    toAddress: '',
    toPlace: '',
    toState: 'Maharashtra',
    toPincode: '400001',
    items,
    ...transporterDetails,
  };

  return generateEwaybill(merchantId, request);
}
