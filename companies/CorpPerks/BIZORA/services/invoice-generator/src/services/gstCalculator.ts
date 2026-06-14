// GST rates by category
export const GST_RATES = {
  EXEMPT: 0,
  ZERO: 0,
  NIL: 0,
  CGST: 2.5,    // CGST is half of total GST for intrastate
  SGST: 2.5,
  IGST: 5,      // For intrastate transactions, IGST = CGST + SGST
  CGST_6: 6,
  SGST_6: 6,
  IGST_12: 12,
  CGST_9: 9,
  SGST_9: 9,
  IGST_18: 18,
  CGST_14: 14,
  SGST_14: 14,
  IGST_28: 28
} as const;

// Indian states with codes for GST
export const STATE_CODES: Record<string, string> = {
  'JAMMU AND KASHMIR': '01',
  'LAKSHADWEEP': '02',
  'DAMAN AND DIU': '03',
  'DADRA AND NAGAR HAVELI': '04',
  'CHANDIGARH': '05',
  'PUNJAB': '06',
  'HIMACHAL PRADESH': '07',
  'GUJARAT': '04', // Updated code
  'ANDAMAN AND NICOBAR ISLANDS': '35',
  'ANDHRA PRADESH': '37',
  'KARNATAKA': '29',
  'KERALA': '32',
  'LAKSHADWEEP': '02', // Updated
  'MADHYA PRADESH': '23',
  'MAHARASHTRA': '27',
  'ODISHA': '21',
  'RAJASTHAN': '08',
  'TAMIL NADU': '33',
  'TELANGANA': '36',
  'UTTAR PRADESH': '09',
  'WEST BENGAL': '19',
  'DELHI': '07', // Updated
  'PUDUCHERRY': '34',
  'GOA': '30',
  'SIKKIM': '11',
  'ARUNACHAL PRADESH': '12',
  'NAGALAND': '13',
  'MANIPUR': '14',
  'MIZORAM': '15',
  'TRIPURA': '16',
  'MEGHALAYA': '17',
  'ASSAM': '18',
  'BIHAR': '10',
  'JHARKHAND': '20',
  'CHHATTISGARH': '22',
  'UTTARAKHAND': '05',
  'HARYANA': '06',
  'JAMMU& KASHMIR': '01',
  'LADAKH': '38'
};

// Reverse charge applicability thresholds
export const REVERSE_CHARGE_THRESHOLD = 5000; // INR

export interface LineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  hsnCode?: string;
  gstRate?: number;
}

export interface GSTCalculationResult {
  taxableAmount: number;
  discount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTaxAmount: number;
  total: number;
}

export interface InvoiceGSTSummary {
  subtotal: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTaxableAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
  totalInWords: string;
  isIntrastate: boolean;
}

/**
 * Check if transaction is intrastate (same state)
 */
export function isIntrastate(sellerStateCode: string, buyerStateCode: string): boolean {
  return sellerStateCode === buyerStateCode;
}

/**
 * Calculate GST for a single line item
 */
export function calculateLineItemGST(
  item: LineItemInput,
  sellerStateCode: string,
  buyerStateCode: string
): GSTCalculationResult {
  const quantity = item.quantity;
  const unitPrice = item.unitPrice;
  const discount = item.discount || 0;

  // Calculate taxable amount (after discount)
  const grossAmount = quantity * unitPrice;
  const taxableAmount = grossAmount - discount;

  // Determine GST rates based on intrastate/interstate
  const intrastate = isIntrastate(sellerStateCode, buyerStateCode);
  const gstRate = item.gstRate || GST_RATES.IGST_18; // Default18%

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (intrastate) {
    // Intrastate: CGST + SGST (each half of total GST)
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = (taxableAmount * cgstRate) / 100;
    sgstAmount = (taxableAmount * sgstRate) / 100;
  } else {
    // Interstate: IGST
    igstRate = gstRate;
    igstAmount = (taxableAmount * igstRate) / 100;
  }

  const totalTaxAmount = cgstAmount + sgstAmount + igstAmount;
  const total = taxableAmount + totalTaxAmount;

  return {
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    cgstRate: Math.round(cgstRate * 100) / 100,
    cgstAmount: Math.round(cgstAmount * 100) / 100,
    sgstRate: Math.round(sgstRate * 100) / 100,
    sgstAmount: Math.round(sgstAmount * 100) / 100,
    igstRate: Math.round(igstRate * 100) / 100,
    igstAmount: Math.round(igstAmount * 100) / 100,
    totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

/**
 * Calculate GST for all line items
 */
export function calculateInvoiceGST(
  lineItems: LineItemInput[],
  sellerStateCode: string,
  buyerStateCode: string
): InvoiceGSTSummary {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalTaxableAmount = 0;

  for (const item of lineItems) {
    const result = calculateLineItemGST(item, sellerStateCode, buyerStateCode);
    subtotal += item.quantity * item.unitPrice;
    totalDiscount += result.discount;
    totalCgst += result.cgstAmount;
    totalSgst += result.sgstAmount;
    totalIgst += result.igstAmount;
    totalTaxableAmount += result.taxableAmount;
  }

  const totalTaxAmount = totalCgst + totalSgst + totalIgst;
  const grandTotal = totalTaxableAmount + totalTaxAmount;
  const totalInWords = numberToWords(Math.round(grandTotal));

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    totalCgst: Math.round(totalCgst * 100) / 100,
    totalSgst: Math.round(totalSgst * 100) / 100,
    totalIgst: Math.round(totalIgst * 100) / 100,
    totalTaxableAmount: Math.round(totalTaxableAmount * 100) / 100,
    totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    totalInWords,
    isIntrastate: isIntrastate(sellerStateCode, buyerStateCode)
  };
}

/**
 * Convert number to words (Indian format)
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertToWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertToWords(n % 100) : '');
    if (n < 100000) return convertToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertToWords(n % 1000) : '');
    if (n < 10000000) return convertToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertToWords(n % 100000) : '');
    return convertToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convertToWords(n % 10000000) : '');
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = convertToWords(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convertToWords(paise) + ' Paise';
  }
  result += ' Only';

  return result;
}

/**
 * Get state code from state name
 */
export function getStateCode(stateName: string): string {
  const normalized = stateName.toUpperCase().trim();
  return STATE_CODES[normalized] || '';
}

/**
 * Check if reverse charge is applicable
 */
export function isReverseChargeApplicable(totalAmount: number): boolean {
  return totalAmount >= REVERSE_CHARGE_THRESHOLD;
}

/**
 * Validate GSTIN format
 */
export function validateGSTIN(gstin: string): boolean {
  // GSTIN format:2 characters (state code) + 10 characters (pan) + 1 character (entity number) + 1 character (Z) + 1 character (checksum)
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.toUpperCase());
}

/**
 * Get state code from GSTIN
 */
export function getStateCodeFromGSTIN(gstin: string): string {
  if (gstin.length >= 2) {
    return gstin.substring(0, 2);
  }
  return '';
}
