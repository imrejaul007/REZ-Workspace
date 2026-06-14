'use client';

/**
 * Thermal Printer Component
 * Supports ESC/POS compatible thermal printers via Web Bluetooth
 *
 * @example
 * ```tsx
 * <ThermalPrinter order={order} onPrint={handlePrint} />
 * ```
 */

import { useState, useCallback } from 'react';
import type { WebOrder } from '@/lib/types';

// ─── ESC/POS Commands ────────────────────────────────────────────────────────────

const ESC_POS = {
  INIT: '\x1B\x40', // Initialize printer
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_RIGHT: '\x1B\x61\x02',
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  DOUBLE_HEIGHT_ON: '\x1B\x21\x10',
  DOUBLE_WIDTH_ON: '\x1B\x21\x20',
  DOUBLE_SIZE_ON: '\x1B\x21\x30',
  NORMAL_SIZE: '\x1B\x21\x00',
  UNDERLINE_ON: '\x1B\x2D\x01',
  UNDERLINE_OFF: '\x1B\x2D\x00',
  CUT: '\x1D\x56\x00', // Full cut
  PARTIAL_CUT: '\x1D\x56\x01',
  FEED_3_LINES: '\x1B\x64\x03',
  FEED_5_LINES: '\x1B\x64\x05',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PrintReceiptProps {
  order: WebOrder;
  storeName: string;
  onPrint?: () => void;
  onError?: (error: string) => void;
}

interface PrinterDevice {
  name: string;
  address: string;
}

// ─── ESC/POS Builder ────────────────────────────────────────────────────────────

class ESCPOSBuilder {
  private buffer: string = '';

  init(): this {
    this.buffer += ESC_POS.INIT;
    return this;
  }

  text(value: string): this {
    this.buffer += value;
    return this;
  }

  textLine(value: string): this {
    this.buffer += value + '\n';
    return this;
  }

  center(): this {
    this.buffer += ESC_POS.ALIGN_CENTER;
    return this;
  }

  left(): this {
    this.buffer += ESC_POS.ALIGN_LEFT;
    return this;
  }

  right(): this {
    this.buffer += ESC_POS.ALIGN_RIGHT;
    return this;
  }

  bold(): this {
    this.buffer += ESC_POS.BOLD_ON;
    return this;
  }

  boldOff(): this {
    this.buffer += ESC_POS.BOLD_OFF;
    return this;
  }

  doubleHeight(): this {
    this.buffer += ESC_POS.DOUBLE_HEIGHT_ON;
    return this;
  }

  doubleWidth(): this {
    this.buffer += ESC_POS.DOUBLE_WIDTH_ON;
    return this;
  }

  doubleSize(): this {
    this.buffer += ESC_POS.DOUBLE_SIZE_ON;
    return this;
  }

  normal(): this {
    this.buffer += ESC_POS.NORMAL_SIZE;
    return this;
  }

  underline(): this {
    this.buffer += ESC_POS.UNDERLINE_ON;
    return this;
  }

  underlineOff(): this {
    this.buffer += ESC_POS.UNDERLINE_OFF;
    return this;
  }

  feed(lines: number): this {
    this.buffer += `\x1B\x64${String.fromCharCode(lines)}`;
    return this;
  }

  cut(): this {
    this.buffer += ESC_POS.CUT;
    return this;
  }

  feedAndCut(): this {
    this.buffer += ESC_POS.FEED_3_LINES;
    this.buffer += ESC_POS.PARTIAL_CUT;
    return this;
  }

  toUint8Array(): Uint8Array {
    // Convert string to bytes, handling UTF-8 encoding
    const encoder = new TextEncoder();
    return encoder.encode(this.buffer);
  }

  toString(): string {
    return this.buffer;
  }
}

// ─── Format Helpers ─────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `₹${(amount / 100).toFixed(2)}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function padRight(str: string, length: number): string {
  return str.padEnd(length).substring(0, length);
}

function padLeft(str: string, length: number): string {
  return str.padStart(length).substring(0, length);
}

function divider(width: number = 32): string {
  return '-'.repeat(width);
}

// ─── Receipt Builder ──────────────────────────────────────────────────────────

function buildReceipt(order: WebOrder, storeName: string): string {
  const WIDTH = 32;
  const pos = (l: number, r: number, val: string) => {
    const spaces = Math.max(1, WIDTH - l - r);
    return padRight('', l) + val + ' '.repeat(spaces - val.length) + padLeft('', r);
  };

  const b = new ESCPOSBuilder();

  // Header
  b.init()
    .center()
    .doubleSize()
    .bold()
    .textLine(storeName.toUpperCase())
    .normal()
    .boldOff()
    .feed(1)
    .center()
    .textLine('REZ NOW')
    .textLine(formatDate(order.createdAt))
    .feed(1);

  // Order info
  b.left()
    .bold()
    .textLine(`Order: ${order.orderNumber}`)
    .boldOff()
    .textLine(divider());

  // Items
  b.bold().textLine('ITEMS').boldOff().textLine(divider());

  for (const item of order.items) {
    const qty = `x${item.quantity}`;
    const price = formatCurrency(item.price * item.quantity);
    b.text(`${item.name}`);
    if (item.customizations) {
      for (const [groupId, options] of Object.entries(item.customizations)) {
        b.text(`\n  + ${options.join(', ')}`);
      }
    }
    b.textLine(` ${qty} ${price}`);
  }

  b.textLine(divider());

  // Totals
  b.textLine(pos(0, 0, 'Subtotal:') + formatCurrency(order.subtotal));
  if (order.gst > 0) {
    b.textLine(pos(0, 0, 'GST:') + formatCurrency(order.gst));
  }
  if (order.discount > 0) {
    b.textLine(pos(0, 0, 'Discount:') + '-' + formatCurrency(order.discount));
  }
  if (order.tip > 0) {
    b.textLine(pos(0, 0, 'Tip:') + formatCurrency(order.tip));
  }
  if (order.deliveryFee && order.deliveryFee > 0) {
    b.textLine(pos(0, 0, 'Delivery:') + formatCurrency(order.deliveryFee));
  }

  b.textLine(divider())
    .bold()
    .textLine(pos(0, 0, 'TOTAL:') + formatCurrency(order.total))
    .boldOff()
    .feed(1);

  // Payment status
  b.center()
    .bold()
    .textLine(`PAID - ${(order.paymentStatus || 'COMPLETED').toUpperCase()}`)
    .boldOff()
    .feed(2);

  // Footer
  b.center()
    .underline()
    .textLine('Thank you for dining with us!')
    .underlineOff()
    .textLine('Powered by REZ')
    .feed(3)
    .feedAndCut();

  return b.toString();
}

// ─── Component ────────────────────────────────────────────────────────────────

// Web Bluetooth type assertion helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getBluetooth = () => (navigator as unknown).bluetooth;

export default function ThermalPrinter({
  order,
  storeName,
  onPrint,
  onError,
}: PrintReceiptProps) {
  const [printer, setPrinter] = useState<{ name?: string } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [lastPrinted, setLastPrinted] = useState<Date | null>(null);

  // Check if Bluetooth is supported
  const isBluetoothSupported =
    typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  // Connect to thermal printer
  const connectPrinter = useCallback(async () => {
    const bluetooth = getBluetooth();
    if (!isBluetoothSupported || !bluetooth) {
      onError?.('Bluetooth is not supported on this device');
      return;
    }

    setConnecting(true);
    try {
      const device = await bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Thermal' },
          { namePrefix: 'POS' },
          { namePrefix: 'Printer' },
          { namePrefix: 'Star' },
          { namePrefix: 'Epson' },
        ],
        optionalServices: ['00001101-0000-1000-8000-00805f9b34fb'],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gatt = (device as unknown).gatt;
      const server = gatt ? await gatt.connect() : null;
      if (!server) {
        throw new Error('Failed to connect to printer');
      }

      setPrinter(device);
      onPrint?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      onError?.(message);
    } finally {
      setConnecting(false);
    }
  }, [isBluetoothSupported, onPrint, onError]);

  // Print receipt
  const printReceipt = useCallback(async () => {
    if (!printer) {
      await connectPrinter();
      if (!printer) return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gatt = (printer as unknown).gatt;
      if (!gatt) {
        await connectPrinter();
        return;
      }
      const server = await gatt.connect();
      const service = await server.getPrimaryService(
        '00001101-0000-1000-8000-00805f9b34fb'
      );
      const characteristic = await service.getCharacteristic(
        '00001101-0000-1000-8000-00805f9b34fb'
      );

      const receipt = buildReceipt(order, storeName);
      const bytes = new TextEncoder().encode(receipt);
      await characteristic.writeValue(bytes);

      setLastPrinted(new Date());
      onPrint?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Print failed';
      onError?.(message);
    }
  }, [printer, order, storeName, connectPrinter, onPrint, onError]);

  // Disconnect printer
  const disconnect = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (printer as unknown)?.gatt?.disconnect();
    setPrinter(null);
  }, [printer]);

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Thermal Printer</h3>

      {!isBluetoothSupported ? (
        <p className="text-sm text-gray-500">
          Bluetooth printing is not supported on this device.
        </p>
      ) : (printer && (printer as unknown).gatt?.connected) ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">{printer.name || 'Thermal Printer'}</span>
          </div>

          <button
            onClick={printReceipt}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700"
          >
            Print Receipt
          </button>

          <button
            onClick={disconnect}
            className="w-full text-gray-600 py-2 text-sm hover:text-gray-800"
          >
            Disconnect Printer
          </button>

          {lastPrinted && (
            <p className="text-xs text-gray-500 text-center">
              Last printed: {lastPrinted.toLocaleTimeString()}
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={connectPrinter}
          disabled={connecting}
          className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
        >
          {connecting ? 'Connecting...' : 'Connect Thermal Printer'}
        </button>
      )}

      {/* Fallback: Download Receipt */}
      <div className="mt-4 pt-4 border-t">
        <button
          onClick={() => {
            // Create printable HTML receipt
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Receipt - ${order.orderNumber}</title>
                  <style>
                    body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .right { text-align: right; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    @media print { body { padding: 0; } }
                  </style>
                </head>
                <body>
                  <div class="center bold">${storeName.toUpperCase()}</div>
                  <div class="center">REZ NOW</div>
                  <div class="center">${formatDate(order.createdAt)}</div>
                  <br/>
                  <div><strong>Order:</strong> ${order.orderNumber}</div>
                  <div class="divider"></div>
                  ${order.items.map(item => `
                    <div>${item.name} x${item.quantity} <span class="right">${formatCurrency(item.price * item.quantity)}</span></div>
                  `).join('')}
                  <div class="divider"></div>
                  <div>Subtotal: <span class="right">${formatCurrency(order.subtotal)}</span></div>
                  ${order.gst > 0 ? `<div>GST: <span class="right">${formatCurrency(order.gst)}</span></div>` : ''}
                  ${order.discount > 0 ? `<div>Discount: <span class="right">-${formatCurrency(order.discount)}</span></div>` : ''}
                  ${order.tip > 0 ? `<div>Tip: <span class="right">${formatCurrency(order.tip)}</span></div>` : ''}
                  <div class="divider"></div>
                  <div class="bold">TOTAL: <span class="right">${formatCurrency(order.total)}</span></div>
                  <br/>
                  <div class="center">PAID</div>
                  <br/>
                  <div class="center">Thank you!</div>
                  <div class="center" style="font-size: 12px;">Powered by REZ</div>
                </body>
                </html>
              `);
              printWindow.document.close();
              printWindow.print();
            }
          }}
          className="w-full text-indigo-600 py-2 text-sm hover:text-indigo-700"
        >
          Download/Print Receipt
        </button>
      </div>
    </div>
  );
}

export { ThermalPrinter, buildReceipt, ESCPOSBuilder };
