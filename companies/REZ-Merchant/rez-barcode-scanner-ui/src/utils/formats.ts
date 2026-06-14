import { BarcodeFormat } from '../types';

/**
 * Format display names for barcode formats
 */
export const formatDisplayNames: Record<BarcodeFormat, string> = {
  ean_13: 'EAN-13',
  ean_8: 'EAN-8',
  upc_a: 'UPC-A',
  upc_e: 'UPC-E',
  code_128: 'Code 128',
  code_39: 'Code 39',
  qr_code: 'QR Code',
  code_93: 'Code 93',
  codabar: 'Codabar',
  itf: 'Interleaved 2 of 5 (ITF)',
  data_matrix: 'Data Matrix',
  aztec: 'Aztec',
  pdf417: 'PDF417',
};

/**
 * Validate barcode format based on value
 */
export const validateBarcode = (barcode: string, format?: BarcodeFormat): boolean => {
  if (!barcode || barcode.length === 0) return false;

  // Remove any spaces or dashes
  const cleanedBarcode = barcode.replace(/[\s-]/g, '');

  if (format) {
    switch (format) {
      case 'ean_13':
        return /^\d{13}$/.test(cleanedBarcode) && validateEAN13Checksum(cleanedBarcode);
      case 'ean_8':
        return /^\d{8}$/.test(cleanedBarcode) && validateEAN8Checksum(cleanedBarcode);
      case 'upc_a':
        return /^\d{12}$/.test(cleanedBarcode) && validateUPCAChecksum(cleanedBarcode);
      case 'upc_e':
        return /^\d{8}$/.test(cleanedBarcode) && validateUPCEChecksum(cleanedBarcode);
      case 'code_128':
      case 'code_39':
      case 'code_93':
      case 'codabar':
        return /^[A-Z0-9\-\.\/\+\$\%\s]+$/i.test(cleanedBarcode);
      case 'qr_code':
      case 'data_matrix':
      case 'aztec':
      case 'pdf417':
        return cleanedBarcode.length > 0;
      case 'itf':
        return /^\d+$/.test(cleanedBarcode) && cleanedBarcode.length % 2 === 0;
      default:
        return true;
    }
  }

  // Auto-detect format if not specified
  return autoDetectBarcodeFormat(cleanedBarcode) !== null;
};

/**
 * Calculate EAN-13 checksum
 */
const calculateEAN13Checksum = (barcode: string): number => {
  const digits = barcode.slice(0, 12).split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
};

/**
 * Validate EAN-13 checksum
 */
const validateEAN13Checksum = (barcode: string): boolean => {
  if (barcode.length !== 13) return false;
  return parseInt(barcode[12], 10) === calculateEAN13Checksum(barcode);
};

/**
 * Calculate EAN-8 checksum
 */
const calculateEAN8Checksum = (barcode: string): number => {
  const digits = barcode.slice(0, 7).split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
};

/**
 * Validate EAN-8 checksum
 */
const validateEAN8Checksum = (barcode: string): boolean => {
  if (barcode.length !== 8) return false;
  return parseInt(barcode[7], 10) === calculateEAN8Checksum(barcode);
};

/**
 * Calculate UPC-A checksum
 */
const calculateUPCAChecksum = (barcode: string): number => {
  const digits = barcode.slice(0, 11).split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
};

/**
 * Validate UPC-A checksum
 */
const validateUPCAChecksum = (barcode: string): boolean => {
  if (barcode.length !== 12) return false;
  return parseInt(barcode[11], 10) === calculateUPCAChecksum(barcode);
};

/**
 * Validate UPC-E checksum
 */
const validateUPCEChecksum = (barcode: string): boolean => {
  if (barcode.length !== 8) return false;
  // Expand UPC-E to UPC-A and validate
  const expanded = expandUPCE(barcode);
  return validateUPCAChecksum(expanded);
};

/**
 * Expand UPC-E to UPC-A format
 */
const expandUPCE = (upcE: string): string => {
  const numberSystem = upcE[0];
  const checkDigit = upcE[7];
  const middle = upcE.slice(1, 7);

  let manufacturer: string;
  let product: string;

  switch (middle[5]) {
    case '0':
    case '1':
    case '2':
      manufacturer = middle.slice(0, 2) + middle[5] + '00';
      product = '00' + middle.slice(2, 5);
      break;
    case '3':
      manufacturer = middle.slice(0, 3) + '00';
      product = '000' + middle.slice(3, 5);
      break;
    case '4':
      manufacturer = middle.slice(0, 4) + '0';
      product = '0000' + middle[4];
      break;
    default:
      manufacturer = middle.slice(0, 5);
      product = '0000' + middle[5];
      break;
  }

  return numberSystem + manufacturer + product + checkDigit;
};

/**
 * Auto-detect barcode format from value
 */
export const autoDetectBarcodeFormat = (barcode: string): BarcodeFormat | null => {
  const cleanedBarcode = barcode.replace(/[\s-]/g, '');

  // EAN-13
  if (/^\d{13}$/.test(cleanedBarcode) && validateEAN13Checksum(cleanedBarcode)) {
    return 'ean_13';
  }

  // EAN-8
  if (/^\d{8}$/.test(cleanedBarcode) && validateEAN8Checksum(cleanedBarcode)) {
    return 'ean_8';
  }

  // UPC-A
  if (/^\d{12}$/.test(cleanedBarcode) && validateUPCAChecksum(cleanedBarcode)) {
    return 'upc_a';
  }

  // UPC-E
  if (/^\d{8}$/.test(cleanedBarcode) && validateUPCEChecksum(cleanedBarcode)) {
    return 'upc_e';
  }

  // ITF (even number of digits)
  if (/^\d+$/.test(cleanedBarcode) && cleanedBarcode.length % 2 === 0 && cleanedBarcode.length >= 2) {
    return 'itf';
  }

  // QR Code (alphanumeric)
  if (/^[A-Z0-9\-\.\/\+\$\%\*\@\#\s]+$/i.test(cleanedBarcode) && cleanedBarcode.length <= 4296) {
    return 'qr_code';
  }

  // Code 128
  if (/^[A-Z0-9\-\.\/\+\$\%\s]+$/i.test(cleanedBarcode) && cleanedBarcode.length > 0) {
    return 'code_128';
  }

  // Code 39
  if (/^[A-Z0-9\-\.\/\+\$\%\s]+$/i.test(cleanedBarcode)) {
    return 'code_39';
  }

  return null;
};

/**
 * Format barcode for display
 */
export const formatBarcodeDisplay = (barcode: string, format?: BarcodeFormat): string => {
  if (!barcode) return '';

  switch (format) {
    case 'ean_13':
    case 'upc_a':
      // Add space in the middle for readability
      const midPoint = Math.ceil(barcode.length / 2);
      return `${barcode.slice(0, midPoint)} ${barcode.slice(midPoint)}`;
    case 'upc_e':
      return `${barcode[0]} ${barcode.slice(1, 7)} ${barcode[7]}`;
    default:
      return barcode;
  }
};

/**
 * Get supported formats for html5-qrcode
 */
export const getHtml5QrcodeFormats = (formats: BarcodeFormat[]): string[] => {
  const formatMap: Record<BarcodeFormat, string> = {
    ean_13: 'EAN_13',
    ean_8: 'EAN_8',
    upc_a: 'UPC_A',
    upc_e: 'UPC_E',
    code_128: 'CODE_128',
    code_39: 'CODE_39',
    qr_code: 'QR_CODE',
    code_93: 'CODE_93',
    codabar: 'CODABAR',
    itf: 'ITF',
    data_matrix: 'DATA_MATRIX',
    aztec: 'AZTEC',
    pdf417: 'PDF417',
  };

  return formats.map((f) => formatMap[f]).filter(Boolean);
};

/**
 * Generate a unique scan ID
 * FIX (security): Replaced Math.random() with crypto
 */
export const generateScanId = (): string => {
  const timestamp = Date.now().toString(36);
  let randomPart: string;

  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    const array = new Uint8Array(6);
    globalThis.crypto.getRandomValues(array);
    randomPart = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Node.js fallback
    try {
      const { randomBytes } = require('crypto');
      randomPart = randomBytes(6).toString('hex');
    } catch {
      randomPart = Math.random().toString(36).substring(2, 9);
    }
  }
  return `scan_${timestamp}_${randomPart}`;
};

/**
 * Parse barcode value - strip non-printable characters
 */
export const parseBarcodeValue = (rawValue: string): string => {
  return rawValue
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
};
