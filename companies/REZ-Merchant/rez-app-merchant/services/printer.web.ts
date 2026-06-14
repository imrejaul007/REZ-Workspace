/**
 * Printer Service — Web stub
 * Native printer functionality (expo-print, expo-file-system, expo-sharing) is not
 * available on web. This module provides web-compatible implementations:
 *   - printReceipt: uses window.print() on an injected iframe
 *   - checkPrinterHealth: always returns 'unavailable'
 *   - all other methods: no-ops or informational returns
 */

export type PrinterStatus = 'ready' | 'unavailable' | 'error';

export interface PrintResult {
  success: boolean;
  method: 'direct_print' | 'pdf_share' | 'failed';
  error?: string;
}

export interface PrinterDevice {
  deviceName: string;
  macAddress: string;
}

export interface ReceiptData {
  storeName?: string;
  storeAddress?: string;
  gstin?: string;
  invoiceNo?: string;
  receiptNumber?: string;
  date?: string;
  billNo?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
  subtotal?: number;
  discount?: number;
  tax?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  total: number;
  paymentMethod?: string;
  customerPhone?: string;
  upiId?: string;
  coinsEarned?: number;
}

class PrinterServiceWeb {
  private connectedDevice: PrinterDevice | null = null;

  async scanForPrinters(): Promise<PrinterDevice[]> {
    if (__DEV__) {
      logger.info('[PRINTER WEB] Printer scanning is not available on web.');
    }
    return [];
  }

  async connect(device: PrinterDevice): Promise<void> {
    logger.info(
      '[PRINTER WEB] Bluetooth/AirPrint connection not available on web:',
      device.deviceName
    );
    this.connectedDevice = device;
  }

  async disconnect(): Promise<void> {
    this.connectedDevice = null;
  }

  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  getConnectedDevice(): PrinterDevice | null {
    return this.connectedDevice;
  }

  async checkPrinterHealth(): Promise<PrinterStatus> {
    return 'unavailable';
  }

  private buildReceiptHTML(data: ReceiptData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; }
          h2 { text-align: center; margin: 4px 0; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .total { font-weight: bold; font-size: 14px; }
          .center { text-align: center; }
          .small { font-size: 10px; }
        </style>
      </head>
      <body>
        <h2>${data.storeName || 'REZ Store'}</h2>
        <p class="center small">${data.storeAddress || ''}</p>
        ${data.gstin ? `<p class="center small">GSTIN: ${data.gstin}</p>` : ''}
        <div class="divider"></div>
        <p>Receipt #${data.receiptNumber || data.billNo || ''}</p>
        <p>Date: ${new Date().toLocaleString('en-IN')}</p>
        <div class="divider"></div>
        ${(data.items || [])
          .map(
            (item) => `
          <div class="row">
            <span>${item.name} x${item.qty}</span>
            <span>&#8377;${item.price.toFixed(2)}</span>
          </div>
        `
          )
          .join('')}
        ${data.items && data.items.length > 0 ? '<div class="divider"></div>' : ''}
        ${data.discount ? `<div class="row"><span>Discount</span><span>-&#8377;${data.discount.toFixed(2)}</span></div>` : ''}
        ${data.tax ? `<div class="row"><span>GST</span><span>&#8377;${data.tax.toFixed(2)}</span></div>` : ''}
        ${data.cgst ? `<div class="row"><span>CGST</span><span>&#8377;${data.cgst.toFixed(2)}</span></div>` : ''}
        ${data.sgst ? `<div class="row"><span>SGST</span><span>&#8377;${data.sgst.toFixed(2)}</span></div>` : ''}
        ${data.igst ? `<div class="row"><span>IGST</span><span>&#8377;${data.igst.toFixed(2)}</span></div>` : ''}
        <div class="divider"></div>
        <div class="row total">
          <span>TOTAL</span>
          <span>&#8377;${data.total.toFixed(2)}</span>
        </div>
        <div class="divider"></div>
        ${data.paymentMethod ? `<p>Paid via: ${data.paymentMethod}</p>` : ''}
        ${data.coinsEarned ? `<p>Coins earned: ${data.coinsEarned}</p>` : ''}
        <div class="divider"></div>
        <p class="center small">Thank you for visiting!</p>
        <p class="center small">Powered by REZ</p>
      </body>
      </html>
    `;
  }

  async printReceipt(data: ReceiptData): Promise<PrintResult> {
    if (typeof window === 'undefined') {
      return { success: false, method: 'failed', error: 'Not available on web (no window)' };
    }

    try {
      const html = this.buildReceiptHTML(data);

      // Inject an iframe, write receipt HTML into it, then trigger window.print()
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        document.body.removeChild(iframe);
        return { success: false, method: 'failed', error: 'Could not access iframe document' };
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // Give browser a moment to render before printing
      await new Promise<void>((resolve) => setTimeout(resolve, 300));
      iframe.contentWindow?.print();

      // Clean up after a delay so the print dialog has time to open
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);

      return { success: true, method: 'direct_print' };
    } catch (err: unknown) {
      if (__DEV__) {
        logger.error('[PRINTER WEB] window.print() failed:', err);
      }
      const msg = err instanceof Error ? err.message : 'Print failed';
      return { success: false, method: 'failed', error: msg };
    }
  }

  queuePrintRetry(data: ReceiptData): void {
    logger.info(
      '[PRINTER WEB] Print retry queue is not available on web. Attempting direct print.'
    );
    this.printReceipt(data).catch((err: unknown) => {
      if (__DEV__) {
        logger.error('[PRINTER WEB] Queued print attempt failed:', err);
      }
    });
  }

  async flushPrintRetryQueue(): Promise<void> {
    // No-op on web — queue is not maintained
  }

  async printTestReceipt(): Promise<void> {
    const testData: ReceiptData = {
      storeName: 'Test Store',
      storeAddress: 'Test Address, City',
      gstin: '29ABCDE1234F1Z5',
      receiptNumber: 'TEST-001',
      billNo: 'TEST-001',
      items: [
        { name: 'Test Product 1', qty: 1, price: 100.0 },
        { name: 'Test Product 2', qty: 2, price: 50.0 },
      ],
      total: 236.0,
      paymentMethod: 'UPI',
      customerPhone: '+91 98765 43210',
    };
    const result = await this.printReceipt(testData);
    if (!result.success) {
      throw new Error(result.error || 'Print test failed');
    }
  }
}

export const printerService = new PrinterServiceWeb();

/**
 * Initialize periodic retry flushing — no-op on web, returns a cleanup function
 * for API compatibility with the native module.
 */
export function initPrinterRetryQueue(_intervalMs: number = 30000): () => void {
  return () => {};
}

export default printerService;
import { logger } from '../utils/logger';
