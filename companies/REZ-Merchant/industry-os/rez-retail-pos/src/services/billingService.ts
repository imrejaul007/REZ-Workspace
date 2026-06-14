import { ISaleItem } from '../models/SaleItem';

export interface BillCalculation {
  subtotal: number;
  totalTax: number;
  tax: {
    cgst: number;
    sgst: number;
    igst: number;
  };
  totalDiscount: number;
  total: number;
  items: CalculatedItem[];
}

export interface CalculatedItem extends ISaleItem {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface GSTRateConfig {
  rate: number; // e.g., 5, 12, 18, 28
  cgst: number;
  sgst: number;
  igst: number;
}

// Default GST rates in India
const GST_RATES: Record<number, GSTRateConfig> = {
  0: { rate: 0, cgst: 0, sgst: 0, igst: 0 },
  5: { rate: 5, cgst: 2.5, sgst: 2.5, igst: 5 },
  12: { rate: 12, cgst: 6, sgst: 6, igst: 12 },
  18: { rate: 18, cgst: 9, sgst: 9, igst: 18 },
  28: { rate: 28, cgst: 14, sgst: 14, igst: 28 }
};

export function getGSTConfig(rate: number): GSTRateConfig {
  return GST_RATES[rate] || { rate, cgst: rate / 2, sgst: rate / 2, igst: rate };
}

export function calculateTax(
  taxableAmount: number,
  taxRate: number,
  useIGST: boolean = false
): { cgst: number; sgst: number; igst: number; totalTax: number } {
  const config = getGSTConfig(taxRate);

  if (useIGST) {
    const igst = Math.round(taxableAmount * config.igst) / 100;
    return { cgst: 0, sgst: 0, igst, totalTax: igst };
  }

  const cgst = Math.round(taxableAmount * config.cgst) / 100;
  const sgst = Math.round(taxableAmount * config.sgst) / 100;
  return { cgst, sgst, igst: 0, totalTax: cgst + sgst };
}

export function calculateItemTotals(item: ISaleItem, useIGST: boolean = false): CalculatedItem {
  const taxableAmount = item.quantity * item.unitPrice;
  const itemDiscount = item.discount;
  const afterDiscount = taxableAmount - itemDiscount;

  const taxBreakdown = calculateTax(afterDiscount, item.taxRate, useIGST);

  return {
    ...item,
    taxableAmount: afterDiscount,
    cgst: taxBreakdown.cgst,
    sgst: taxBreakdown.sgst,
    igst: taxBreakdown.igst,
    taxAmount: taxBreakdown.totalTax,
    total: afterDiscount + taxBreakdown.totalTax
  };
}

export function calculateBill(
  items: ISaleItem[],
  globalDiscount: number = 0,
  useIGST: boolean = false
): BillCalculation {
  const calculatedItems: CalculatedItem[] = items.map(item =>
    calculateItemTotals(item, useIGST)
  );

  const subtotal = calculatedItems.reduce((sum, item) => sum + item.taxableAmount, 0);
  const totalTaxAmount = calculatedItems.reduce((sum, item) => sum + item.taxAmount, 0);

  const totalDiscount = calculatedItems.reduce((sum, item) => sum + item.discount, 0) + globalDiscount;
  const afterDiscount = subtotal;

  const cgstTotal = calculatedItems.reduce((sum, item) => sum + item.cgst, 0);
  const sgstTotal = calculatedItems.reduce((sum, item) => sum + item.sgst, 0);
  const igstTotal = calculatedItems.reduce((sum, item) => sum + item.igst, 0);

  const total = afterDiscount + totalTaxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalTax: Math.round(totalTaxAmount * 100) / 100,
    tax: {
      cgst: Math.round(cgstTotal * 100) / 100,
      sgst: Math.round(sgstTotal * 100) / 100,
      igst: Math.round(igstTotal * 100) / 100
    },
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    total: Math.round(total * 100) / 100,
    items: calculatedItems
  };
}

export function applyDiscount(
  bill: BillCalculation,
  discountAmount: number,
  discountType: 'percentage' | 'fixed' = 'fixed'
): BillCalculation {
  let discountValue = discountAmount;

  if (discountType === 'percentage') {
    discountValue = (bill.subtotal * discountAmount) / 100;
  }

  const newSubtotal = Math.max(0, bill.subtotal - discountValue);
  const discountRatio = bill.subtotal > 0 ? newSubtotal / bill.subtotal : 1;

  const scaledItems = bill.items.map(item => ({
    ...item,
    taxableAmount: item.taxableAmount * discountRatio,
    cgst: item.cgst * discountRatio,
    sgst: item.sgst * discountRatio,
    igst: item.igst * discountRatio,
    taxAmount: item.taxAmount * discountRatio,
    total: item.taxableAmount * discountRatio + item.taxAmount * discountRatio
  }));

  return {
    subtotal: Math.round(newSubtotal * 100) / 100,
    totalTax: Math.round(bill.totalTax * discountRatio * 100) / 100,
    tax: {
      cgst: Math.round(bill.tax.cgst * discountRatio * 100) / 100,
      sgst: Math.round(bill.tax.sgst * discountRatio * 100) / 100,
      igst: Math.round(bill.tax.igst * discountRatio * 100) / 100
    },
    totalDiscount: bill.totalDiscount + discountValue,
    total: Math.round((newSubtotal + bill.totalTax * discountRatio) * 100) / 100,
    items: scaledItems
  };
}

export function generateReceiptData(sale): ReceiptData {
  const receiptNumber = `RCP-${sale.receiptNumber}`;
  const date = new Date(sale.createdAt);

  return {
    receiptNumber,
    invoiceNumber: sale.invoiceNumber,
    date: date.toISOString(),
    storeId: sale.storeId,
    merchantId: sale.merchantId,
    customerId: sale.customerId,
    items: sale.items.map((item: ISaleItem) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      hsnCode: item.hsnCode,
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
      total: item.total
    })),
    subtotal: sale.subtotal,
    tax: sale.tax,
    discount: sale.discount,
    total: sale.total,
    paymentMethod: sale.paymentMethod,
    paymentStatus: sale.paymentStatus,
    gstin: sale.gstin
  };
}

export interface ReceiptData {
  receiptNumber: string;
  invoiceNumber: string;
  date: string;
  storeId: string;
  merchantId: string;
  customerId?: string;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    hsnCode: string;
    taxRate: number;
    taxAmount: number;
    total: number;
  }>;
  subtotal: number;
  tax: { cgst: number; sgst: number; igst: number };
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  gstin?: string;
}

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toFixed(2)}`;
}

export function printReceipt(receipt: ReceiptData): string {
  const lines: string[] = [];
  const width = 48;

  lines.push('='.repeat(width));
  lines.push('RETAIL POS RECEIPT'.padStart(width / 2 + 10));
  lines.push('='.repeat(width));
  lines.push(`Receipt #: ${receipt.receiptNumber}`);
  lines.push(`Invoice #: ${receipt.invoiceNumber}`);
  lines.push(`Date: ${new Date(receipt.date).toLocaleString()}`);
  lines.push('-'.repeat(width));

  if (receipt.gstin) {
    lines.push(`GSTIN: ${receipt.gstin}`);
  }
  lines.push(`Store: ${receipt.storeId}`);
  lines.push(`Merchant: ${receipt.merchantId}`);
  lines.push('-'.repeat(width));

  lines.push('ITEMS:');
  receipt.items.forEach(item => {
    lines.push(`${item.quantity}x ${item.name}`.substring(0, 30));
    lines.push(`  ${formatCurrency(item.unitPrice)} each`.padStart(35));
    if (item.discount > 0) {
      lines.push(`  Discount: -${formatCurrency(item.discount)}`.padStart(35));
    }
    lines.push(`  Total: ${formatCurrency(item.total)}`.padStart(40));
    lines.push(`  HSN: ${item.hsnCode} @ ${item.taxRate}%`.padStart(40));
  });

  lines.push('-'.repeat(width));
  lines.push(`Subtotal: ${formatCurrency(receipt.subtotal)}`.padStart(width));

  if (receipt.tax.cgst > 0 || receipt.tax.sgst > 0) {
    lines.push(`CGST: ${formatCurrency(receipt.tax.cgst)}`.padStart(width));
    lines.push(`SGST: ${formatCurrency(receipt.tax.sgst)}`.padStart(width));
  }
  if (receipt.tax.igst > 0) {
    lines.push(`IGST: ${formatCurrency(receipt.tax.igst)}`.padStart(width));
  }

  if (receipt.discount > 0) {
    lines.push(`Discount: -${formatCurrency(receipt.discount)}`.padStart(width));
  }

  lines.push('='.repeat(width));
  lines.push(`TOTAL: ${formatCurrency(receipt.total)}`.padStart(width));
  lines.push(`Payment: ${receipt.paymentMethod.toUpperCase()}`.padStart(width));
  lines.push(`Status: ${receipt.paymentStatus.toUpperCase()}`);
  lines.push('='.repeat(width));
  lines.push('Thank you for your purchase!');

  return lines.join('\n');
}
