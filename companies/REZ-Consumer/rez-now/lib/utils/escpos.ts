/**
 * ESC/POS Receipt Generator (R6 Feature B)
 *
 * Builds a raw ESC/POS byte array for thermal receipt printers.
 * Supports: bold, double-height/width, alignment, feed, cut, QR code, barcode.
 *
 * Compatible with most ESC/POS thermal printers including:
 *   - Epson TM series
 *   - Star TSP series
 *   - Citizen CT-E series
 *   - Generic Bluetooth thermal printers
 */

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
}

export interface ReceiptData {
  storeName: string;
  orderNumber: string;
  createdAt: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  taxPercent?: number;
  total: number;
  paymentId?: string;
  customerName?: string;
  tableNumber?: string;
  /** For KOT variant: no prices, items only */
  variant?: 'receipt' | 'kot';
}

// ── ESC/POS Command Constants ─────────────────────────────────────────────────

const ESC = 0x1b;
const GS = 0x1d;

// Text formatting
const INIT = [ESC, 0x40]; // Initialise printer
const BOLD_ON = [ESC, 0x45, 0x01];
const BOLD_OFF = [ESC, 0x45, 0x00];
const DOUBLE_HEIGHT = [ESC, 0x21, 0x10];
const DOUBLE_SIZE = [ESC, 0x21, 0x30]; // double height + width
const NORMAL_SIZE = [ESC, 0x21, 0x00];

// Alignment
const ALIGN_LEFT = [ESC, 0x61, 0x00];
const ALIGN_CENTER = [ESC, 0x61, 0x01];

// Feed and cut
const FEED_LINES = (n: number) => [ESC, 0x64, n]; // Feed n lines
const PARTIAL_CUT = [GS, 0x56, 0x01]; // Partial cut

// QR code (GS ( k)
const QR_INIT = (size: number, ecc: number) => [
  GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, size, ecc,
];
const QR_DATA = (data: string) => {
  const bytes = Array.from(new TextEncoder().encode(data));
  const pL = bytes.length % 256;
  const pH = Math.floor(bytes.length / 256);
  return [GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...bytes];
};
const QR_PRINT = [GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30];

// ── Utility helpers ────────────────────────────────────────────────────────────

/** Convert a number array to Uint8Array */
function toBytes(cmds: number[]): Uint8Array {
  return new Uint8Array(cmds);
}

/** Convert string to ESC/POS bytes */
function strToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Pad or truncate a string to a given width, aligned */
function pad(str: string, width: number, align: 'left' | 'right' = 'left'): string {
  const s = str.length > width ? str.slice(0, width - 1) + '>' : str;
  if (align === 'right') return s.padStart(width);
  return s.padEnd(width);
}

/** Format a number as INR currency string */
function formatCurrency(amount: number): string {
  return `\u20b9${amount.toFixed(2)}`;
}

/** Format date/time for receipt */
function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const day = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${day}, ${time}`;
  } catch {
    return isoString;
  }
}

/** Build a separator line (returns number[] for safe spreading in toBytes args) */
function separator(char = '-', width = 32): number[] {
  return Array.from(strToBytes(char.repeat(width)));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Build a complete ESC/POS receipt byte array.
 *
 * For 'receipt' variant:
 *   STORE NAME (centered, double height)
 *   Order #123 (left)
 *   Date: 14 Apr 2026, 7:30 PM
 *   --------------------------------
 *   Item x2           Rs 599.00
 *   Item x1           Rs 199.00
 *   --------------------------------
 *   Subtotal:         Rs 798.00
 *   Tax (5%):          Rs 39.90
 *   TOTAL:            Rs 837.90
 *   [QR: paymentId]
 *   [cut]
 *
 * For 'kot' variant (Kitchen Order Ticket):
 *   *** KITCHEN ORDER ***
 *   Table 5
 *   #1234
 *   --------------------
 *   2x Margherita Pizza
 *   1x Garlic Bread
 *   --------------------
 *   Time: 7:35 PM
 *   [cut]
 */
export function buildReceipt(data: ReceiptData): Uint8Array {
  const parts: Uint8Array[] = [];
  const variant = data.variant ?? 'receipt';
  const WIDTH = 32; // characters per line (standard 58mm thermal paper)

  // 1. Initialise printer
  parts.push(toBytes(INIT));

  // ── Receipt Variant ──────────────────────────────────────────────────────
  if (variant === 'receipt') {
    // Store name — centred, double size
    parts.push(toBytes([...ALIGN_CENTER, ...DOUBLE_SIZE]));
    parts.push(strToBytes(data.storeName));
    parts.push(toBytes([...NORMAL_SIZE, ...FEED_LINES(1)]));

    // Order number
    parts.push(toBytes([...ALIGN_LEFT, ...BOLD_ON]));
    parts.push(strToBytes(`Order #${data.orderNumber}`));
    parts.push(toBytes([...BOLD_OFF, ...FEED_LINES(1)]));

    // Date/time
    parts.push(strToBytes(`Date: ${formatDateTime(data.createdAt)}`));
    parts.push(toBytes(FEED_LINES(1)));

    // Customer name (if present)
    if (data.customerName) {
      parts.push(strToBytes(`Customer: ${data.customerName}`));
      parts.push(toBytes(FEED_LINES(1)));
    }

    // Separator
    parts.push(toBytes([...separator(), ...FEED_LINES(1)]));

    // Line items
    for (const item of data.items) {
      const lineLeft = `${item.qty}x ${pad(item.name, WIDTH - 14)}`;
      const lineRight = formatCurrency(item.price * item.qty);
      parts.push(strToBytes(`${pad(lineLeft, WIDTH - lineRight.length)}${lineRight}`));
      parts.push(toBytes(FEED_LINES(1)));
    }

    // Separator
    parts.push(toBytes([...separator(), ...FEED_LINES(1)]));

    // Totals
    parts.push(
      strToBytes(`${pad('Subtotal:', 20)}${formatCurrency(data.subtotal).padStart(WIDTH - 20)}`),
    );
    parts.push(toBytes(FEED_LINES(1)));

    const taxPct = data.taxPercent ?? 5;
    parts.push(
      strToBytes(
        `${pad(`Tax (${taxPct}%):`, 20)}${formatCurrency(data.tax).padStart(WIDTH - 20)}`,
      ),
    );
    parts.push(toBytes(FEED_LINES(1)));

    // Total — bold, double height
    parts.push(toBytes([...BOLD_ON, ...DOUBLE_HEIGHT]));
    parts.push(
      strToBytes(`${pad('TOTAL:', 20)}${formatCurrency(data.total).padStart(WIDTH - 20)}`),
    );
    parts.push(toBytes([...NORMAL_SIZE, ...BOLD_OFF, ...FEED_LINES(2)]));

    // Payment ID as QR code (if present)
    if (data.paymentId) {
      parts.push(toBytes([...ALIGN_CENTER, ...FEED_LINES(1)]));
      parts.push(toBytes(QR_INIT(6, 4))); // size=6, ECC-L
      parts.push(toBytes(QR_DATA(data.paymentId)));
      parts.push(toBytes(QR_PRINT));
      parts.push(toBytes([...ALIGN_LEFT, ...FEED_LINES(1)]));
    }
  }

  // ── KOT Variant ───────────────────────────────────────────────────────────
  if (variant === 'kot') {
    // Header
    parts.push(toBytes([...ALIGN_CENTER, ...BOLD_ON, ...DOUBLE_SIZE]));
    parts.push(strToBytes('*** KITCHEN ORDER ***'));
    parts.push(toBytes([...NORMAL_SIZE, ...BOLD_OFF, ...FEED_LINES(1)]));

    if (data.tableNumber) {
      parts.push(toBytes([...ALIGN_LEFT, ...BOLD_ON]));
      parts.push(strToBytes(`Table ${data.tableNumber}`));
      parts.push(toBytes([...BOLD_OFF, ...FEED_LINES(1)]));
    }

    parts.push(toBytes([...BOLD_ON, ...DOUBLE_HEIGHT]));
    parts.push(strToBytes(`#${data.orderNumber}`));
    parts.push(toBytes([...NORMAL_SIZE, ...BOLD_OFF, ...FEED_LINES(1)]));

    parts.push(toBytes([...separator('-', WIDTH), ...FEED_LINES(1)]));

    // Items only — no prices
    for (const item of data.items) {
      parts.push(strToBytes(`${item.qty}x ${item.name}`));
      parts.push(toBytes(FEED_LINES(1)));
    }

    parts.push(toBytes([...separator('-', WIDTH), ...FEED_LINES(1)]));

    // Time
    parts.push(toBytes([...BOLD_ON]));
    parts.push(strToBytes(`Time: ${new Date(data.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`));
    parts.push(toBytes([...BOLD_OFF, ...FEED_LINES(2)]));
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  parts.push(toBytes([...FEED_LINES(3), ...PARTIAL_CUT]));

  // Concatenate all parts
  const totalLength = parts.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}
