import { v4 as uuidv4 } from 'uuid';
import { ISale } from '../models/SaleItem';
import { formatCurrency } from './billingService';

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  saleId: string;
  merchantId: string;
  storeId: string;
  customerId?: string;
  billingAddress?: BillingAddress;
  shippingAddress?: BillingAddress;
  gstin?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: InvoiceTax;
  discount: number;
  total: number;
  paymentMethod: string;
  terms?: string;
}

export interface InvoiceItem {
  description: string;
  sku: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  taxableValue: number;
  taxRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface InvoiceTax {
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export interface BillingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
}

let invoiceCounter = 0;
let lastInvoiceDate = '';

function getCurrentDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

export function generateInvoiceNumber(merchantId?: string, storeId?: string): string {
  const dateString = getCurrentDateString();

  if (dateString !== lastInvoiceDate) {
    invoiceCounter = 0;
    lastInvoiceDate = dateString;
  }

  invoiceCounter++;

  const merchantPrefix = merchantId ? merchantId.substring(0, 4).toUpperCase() : 'MCHT';
  const storePrefix = storeId ? storeId.substring(0, 4).toUpperCase() : 'STR0';
  const sequence = String(invoiceCounter).padStart(6, '0');
  const random = uuidv4().substring(0, 4).toUpperCase();

  return `INV-${merchantPrefix}-${storePrefix}-${dateString}-${sequence}-${random}`;
}

export function generateReceiptNumber(merchantId?: string, storeId?: string): string {
  const dateString = getCurrentDateString();

  const merchantPrefix = merchantId ? merchantId.substring(0, 4).toUpperCase() : 'MCHT';
  const storePrefix = storeId ? storeId.substring(0, 4).toUpperCase() : 'STR0';
  const sequence = String(Date.now()).slice(-6);
  const random = uuidv4().substring(0, 4).toUpperCase();

  return `RCP-${merchantPrefix}-${storePrefix}-${dateString}-${sequence}-${random}`;
}

export function validateGSTIN(gstin: string): ValidationResult {
  if (!gstin) {
    return { valid: false, error: 'GSTIN is required' };
  }

  const cleaned = gstin.toUpperCase().trim();

  if (cleaned.length !== 15) {
    return { valid: false, error: 'GSTIN must be exactly 15 characters' };
  }

  const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!gstinPattern.test(cleaned)) {
    return { valid: false, error: 'Invalid GSTIN format' };
  }

  const stateCodes = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
    '31', '32', '33', '34', '35', '36', '37'
  ];

  const firstTwo = cleaned.substring(0, 2);
  if (!stateCodes.includes(firstTwo)) {
    return { valid: false, error: 'Invalid state code in GSTIN' };
  }

  const checkCharPosition = 14;
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const hashMap: Record<string, number> = {};

  for (let i = 65; i <= 90; i++) {
    hashMap[String.fromCharCode(i)] = i - 64 + 10;
  }

  let sum = 0;
  for (let i = 0; i < checkCharPosition; i++) {
    const char = cleaned[i];
    sum += hashMap[char] * weights[i];
  }

  const checkChar = cleaned[checkCharPosition];
  const remainder = sum % 11;
  let expectedChar: string;

  switch (remainder) {
    case 0:
      expectedChar = '0';
      break;
    case 1:
      expectedChar = checkChar;
      break;
    default:
      expectedChar = String(11 - remainder);
  }

  if (checkChar !== expectedChar) {
    return { valid: false, error: 'Invalid check character' };
  }

  return { valid: true };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function createGSTInvoice(sale: ISale): InvoiceData {
  const invoiceItems: InvoiceItem[] = sale.items.map(item => ({
    description: item.name,
    sku: item.sku,
    hsnCode: item.hsnCode,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    taxableValue: item.quantity * item.unitPrice - item.discount,
    taxRate: item.taxRate,
    cgst: sale.tax.cgst > 0 ? item.taxAmount / 2 : 0,
    sgst: sale.tax.sgst > 0 ? item.taxAmount / 2 : 0,
    igst: sale.tax.igst > 0 ? item.taxAmount : 0,
    total: item.total
  }));

  return {
    invoiceNumber: sale.invoiceNumber,
    invoiceDate: sale.createdAt.toISOString(),
    saleId: sale._id.toString(),
    merchantId: sale.merchantId,
    storeId: sale.storeId,
    customerId: sale.customerId,
    gstin: sale.gstin,
    items: invoiceItems,
    subtotal: sale.subtotal,
    tax: {
      cgst: sale.tax.cgst,
      sgst: sale.tax.sgst,
      igst: sale.tax.igst,
      totalTax: sale.tax.cgst + sale.tax.sgst + sale.tax.igst
    },
    discount: sale.discount,
    total: sale.total,
    paymentMethod: sale.paymentMethod,
    terms: 'Payment due within 30 days'
  };
}

export function formatInvoiceForPrint(invoice: InvoiceData): string {
  const lines: string[] = [];
  const width = 80;

  lines.push('='.repeat(width));
  lines.push('GST INVOICE'.padStart(width / 2 + 5));
  lines.push('='.repeat(width));
  lines.push('');

  lines.push(`Invoice Number: ${invoice.invoiceNumber}`);
  lines.push(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`);
  lines.push(`Sale ID: ${invoice.saleId}`);
  lines.push('');

  if (invoice.gstin) {
    lines.push(`Seller GSTIN: ${invoice.gstin}`);
  }
  lines.push(`Merchant ID: ${invoice.merchantId}`);
  lines.push(`Store ID: ${invoice.storeId}`);
  lines.push('');

  if (invoice.customerId) {
    lines.push(`Customer ID: ${invoice.customerId}`);
    lines.push('');
  }

  lines.push('-'.repeat(width));
  lines.push('| ' + 'Description'.padEnd(20) +
    ' | ' + 'HSN'.padEnd(10) +
    ' | ' + 'Qty'.padStart(4) +
    ' | ' + 'Rate'.padStart(10) +
    ' | ' + 'Taxable'.padStart(12) +
    ' | ' + 'Tax'.padStart(6) +
    ' | ' + 'Total'.padStart(12) + ' |');
  lines.push('-'.repeat(width));

  invoice.items.forEach(item => {
    lines.push('| ' + item.description.substring(0, 20).padEnd(20) +
      ' | ' + item.hsnCode.padEnd(10) +
      ' | ' + String(item.quantity).padStart(4) +
      ' | ' + formatCurrency(item.unitPrice).padStart(10) +
      ' | ' + formatCurrency(item.taxableValue).padStart(12) +
      ' | ' + `${item.taxRate}%`.padStart(6) +
      ' | ' + formatCurrency(item.total).padStart(12) + ' |');
  });

  lines.push('-'.repeat(width));
  lines.push('');

  lines.push(`Subtotal: ${formatCurrency(invoice.subtotal)}`.padStart(width - 20));
  lines.push(`Total Discount: -${formatCurrency(invoice.discount)}`.padStart(width - 20));

  if (invoice.tax.cgst > 0) {
    lines.push(`CGST: ${formatCurrency(invoice.tax.cgst)}`.padStart(width - 20));
  }
  if (invoice.tax.sgst > 0) {
    lines.push(`SGST: ${formatCurrency(invoice.tax.sgst)}`.padStart(width - 20));
  }
  if (invoice.tax.igst > 0) {
    lines.push(`IGST: ${formatCurrency(invoice.tax.igst)}`.padStart(width - 20));
  }

  lines.push('');
  lines.push('='.repeat(width));
  lines.push(`TOTAL: ${formatCurrency(invoice.total)}`.padStart(width));
  lines.push('='.repeat(width));

  lines.push('');
  lines.push(`Payment Method: ${invoice.paymentMethod.toUpperCase()}`);
  if (invoice.terms) {
    lines.push(`Terms: ${invoice.terms}`);
  }

  return lines.join('\n');
}

export function extractStateFromGSTIN(gstin: string): string | null {
  if (!gstin || gstin.length < 2) return null;

  const stateCodes: Record<string, string> = {
    '01': 'Jammu and Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '25': 'Daman and Diu',
    '26': 'Dadra and Nagar Haveli',
    '27': 'Maharashtra',
    '28': 'Andhra Pradesh',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman and Nicobar Islands',
    '36': 'Telangana',
    '37': 'Jharkhand'
  };

  return stateCodes[gstin.substring(0, 2)] || null;
}
