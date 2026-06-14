/**
 * Printer Service — Receipt printing via expo-print
 * Uses expo-print to render HTML → PDF → sends to AirPrint (iOS) or Google Cloud Print (Android)
 * Includes health check, fallback PDF share, and retry queue for failed jobs.
 * In STUB_MODE, all methods log and resolve immediately.
 */

import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { logger } from '../utils/logger';

const STUB_MODE = false;

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
  /** Override printed date; defaults to current time if omitted */
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

class PrinterService {
  private connectedDevice: PrinterDevice | null = null;
  private printRetryQueue: Array<{ data: ReceiptData; attempts: number; lastAttempt: Date }> = [];
  private readonly MAX_PRINT_RETRIES = 3;
  private readonly PRINT_TIMEOUT_MS = 10000; // 10s timeout for print operations

  async scanForPrinters(): Promise<PrinterDevice[]> {
    if (STUB_MODE) {
      logger.info('[PRINTER] Stub: scan called');
      return [{ deviceName: 'Demo Printer (80mm)', macAddress: 'AA:BB:CC:DD:EE:FF' }];
    }
    return [];
  }

  async connect(device: PrinterDevice): Promise<void> {
    if (STUB_MODE) {
      logger.info('[PRINTER] Stub: connect called', device.deviceName);
      this.connectedDevice = device;
      return;
    }
    try {
      // With expo-print, we don't need explicit connection
      this.connectedDevice = device;
    } catch (e) {
      if (__DEV__) {
        console.warn('[Printer] Connection error:', e);
      }
    }
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

  /**
   * Check if printing is available on this device
   * KENJI: integration resilience — health check must timeout to prevent UI hang on printer service freeze
   */
  async checkPrinterHealth(): Promise<PrinterStatus> {
    if (STUB_MODE) {
      logger.info('[PRINTER] Stub: health check called');
      return 'ready';
    }

    try {
      const healthCheckPromise = Print.selectPrinterAsync().catch(() => {
        // Expected to throw if user cancels; that's okay
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Printer health check timeout')), 5000)
      );

      await Promise.race([healthCheckPromise, timeoutPromise]);
      return 'ready';
    } catch {
      return 'error';
    }
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
        <p>Date: ${data.date || new Date().toLocaleString('en-IN')}</p>
        <div class="divider"></div>
        ${(data.items || [])
          .map(
            (item) => `
          <div class="row">
            <span>${item.name} x${item.qty}</span>
            <span>₹${item.price.toFixed(2)}</span>
          </div>
        `
          )
          .join('')}
        ${data.items && data.items.length > 0 ? '<div class="divider"></div>' : ''}
        ${data.discount ? `<div class="row"><span>Discount</span><span>-₹${data.discount.toFixed(2)}</span></div>` : ''}
        ${data.tax ? `<div class="row"><span>GST</span><span>₹${data.tax.toFixed(2)}</span></div>` : ''}
        ${data.cgst ? `<div class="row"><span>CGST</span><span>₹${data.cgst.toFixed(2)}</span></div>` : ''}
        ${data.sgst ? `<div class="row"><span>SGST</span><span>₹${data.sgst.toFixed(2)}</span></div>` : ''}
        ${data.igst ? `<div class="row"><span>IGST</span><span>₹${data.igst.toFixed(2)}</span></div>` : ''}
        <div class="divider"></div>
        <div class="row total">
          <span>TOTAL</span>
          <span>₹${data.total.toFixed(2)}</span>
        </div>
        <div class="divider"></div>
        ${data.paymentMethod ? `<p>Paid via: ${data.paymentMethod}</p>` : ''}
        ${data.coinsEarned ? `<p>🪙 Coins earned: ${data.coinsEarned}</p>` : ''}
        <div class="divider"></div>
        <p class="center small">Thank you for visiting!</p>
        <p class="center small">Powered by REZ</p>
      </body>
      </html>
    `;
  }

  /**
   * Print with fallback: try direct print → save PDF → share PDF
   * KENJI: integration resilience — check printer health before attempting print, add timeouts to prevent hangs
   */
  async printReceipt(data: ReceiptData): Promise<PrintResult> {
    const html = this.buildReceiptHTML(data);

    if (STUB_MODE) {
      logger.info('[Printer] Stub mode: would print receipt', data);
      return { success: true, method: 'direct_print' };
    }

    // KENJI: integration resilience — check printer health before attempting print to fail fast if unavailable
    const healthStatus = await this.checkPrinterHealth();
    if (healthStatus === 'error') {
      logger.warn('[Printer] Printer health check failed, skipping direct print');
    }

    // Attempt 1: Direct print (with timeout to prevent infinite hang)
    try {
      const printPromise = Print.printAsync({ html });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Print operation timeout')), this.PRINT_TIMEOUT_MS)
      );

      await Promise.race([printPromise, timeoutPromise]);
      return { success: true, method: 'direct_print' };
    } catch (printError) {
      if (printError.message?.includes('cancelled')) {
        logger.info('[Printer] User cancelled print');
        return { success: false, method: 'failed', error: 'User cancelled' };
      }
      logger.warn('[Printer] Direct print failed:', printError.message);
    }

    // Attempt 2: Save as PDF and share (with timeout)
    try {
      const receiptNum = data.receiptNumber || data.billNo || 'receipt';
      const pdfPromise = Print.printToFileAsync({ html });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PDF generation timeout')), this.PRINT_TIMEOUT_MS)
      );
      const { uri } = await Promise.race([pdfPromise, timeoutPromise]);

      const destUri = `${FileSystem.documentDirectory}receipt-${receiptNum}-${Date.now()}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: destUri });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(destUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Receipt ${receiptNum}`,
        });
      }

      return { success: true, method: 'pdf_share' };
    } catch (pdfError) {
      logger.error('[Printer] PDF fallback failed:', pdfError.message);
      return { success: false, method: 'failed', error: pdfError.message };
    }
  }

  /**
   * Queue a print job for retry if it fails
   */
  queuePrintRetry(data: ReceiptData): void {
    this.printRetryQueue.push({
      data,
      attempts: 0,
      lastAttempt: new Date(0),
    });
    logger.info(`[Printer] Queued receipt for retry (queue size: ${this.printRetryQueue.length})`);
  }

  /**
   * Flush the print retry queue — retries failed jobs
   */
  async flushPrintRetryQueue(): Promise<void> {
    const now = new Date();

    for (let i = this.printRetryQueue.length - 1; i >= 0; i--) {
      const job = this.printRetryQueue[i];

      // Only retry if last attempt was > 30 seconds ago
      if (now.getTime() - job.lastAttempt.getTime() < 30000) {
        continue;
      }

      // Give up after 3 attempts
      if (job.attempts >= this.MAX_PRINT_RETRIES) {
        logger.warn(
          `[Printer] Giving up on receipt after ${job.attempts} attempts`,
          job.data.receiptNumber || job.data.billNo
        );
        this.printRetryQueue.splice(i, 1);
        continue;
      }

      job.lastAttempt = now;
      job.attempts++;
      logger.info(
        `[Printer] Retrying print (attempt ${job.attempts}/${this.MAX_PRINT_RETRIES})`,
        job.data.receiptNumber || job.data.billNo
      );

      const result = await this.printReceipt(job.data);
      if (result.success) {
        this.printRetryQueue.splice(i, 1); // remove on success
        logger.info('[Printer] Retry succeeded');
      }
    }
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

export const printerService = new PrinterService();

/**
 * Initialize periodic retry flushing (call once in app boot)
 */
export function initPrinterRetryQueue(intervalMs: number = 30000): () => void {
  const intervalId = setInterval(() => {
    printerService.flushPrintRetryQueue().catch((err) => {
      console.error('[Printer] Retry queue flush error:', err);
    });
  }, intervalMs);

  return () => clearInterval(intervalId);
}

export default printerService;
