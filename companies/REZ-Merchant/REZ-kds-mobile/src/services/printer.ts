import logger from './utils/logger';

/**
 * KDS Mobile Printer Service
 * Handles kitchen printer integration
 */

import { Platform, NativeModules } from 'react-native';
import { KDSOrder } from '../types';
import { formatDateTime, formatCurrency } from '../utils/helpers';

// Printer interface
export interface PrinterConfig {
  type: 'network' | 'bluetooth' | 'usb';
  name: string;
  address?: string;
  port?: number;
  enabled: boolean;
}

export interface PrintJob {
  id: string;
  order: KDSOrder;
  type: 'ticket' | 'reprint' | 'all_day';
  timestamp: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  retryCount: number;
}

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';
const COMMANDS = {
  INIT: ESC + '@',
  BOLD_ON: ESC + 'E\x01',
  BOLD_OFF: ESC + 'E\x00',
  DOUBLE_HEIGHT_ON: GS + '!\x10',
  DOUBLE_HEIGHT_OFF: GS + '!\x00',
  DOUBLE_WIDTH_ON: GS + '!\x20',
  DOUBLE_WIDTH_OFF: GS + '!\x00',
  ALIGN_CENTER: ESC + 'a\x01',
  ALIGN_LEFT: ESC + 'a\x00',
  ALIGN_RIGHT: ESC + 'a\x02',
  CUT: GS + 'V\x00',
  FEED: '\n',
  FEED_LINES: (n: number) => ESC + 'd' + String.fromCharCode(n),
};

// Character width multipliers
const WIDTH = {
  SINGLE: '\x00',
  DOUBLE: '\x10',
  TRIPLE: '\x20',
};

const HEIGHT = {
  SINGLE: '\x00',
  DOUBLE: '\x01',
};

class KDSPrinterService {
  private printers: PrinterConfig[] = [];
  private printQueue: PrintJob[] = [];
  private isProcessing = false;

  /**
   * Add a printer configuration
   */
  addPrinter(config: PrinterConfig): void {
    const existing = this.printers.findIndex((p) => p.name === config.name);
    if (existing >= 0) {
      this.printers[existing] = config;
    } else {
      this.printers.push(config);
    }
  }

  /**
   * Remove a printer
   */
  removePrinter(name: string): void {
    this.printers = this.printers.filter((p) => p.name !== name);
  }

  /**
   * Get configured printers
   */
  getPrinters(): PrinterConfig[] {
    return [...this.printers];
  }

  /**
   * Check if printer is available
   */
  isPrinterAvailable(name?: string): boolean {
    if (name) {
      const printer = this.printers.find((p) => p.name === name);
      return printer?.enabled ?? false;
    }
    return this.printers.some((p) => p.enabled);
  }

  /**
   * Generate ticket content for an order
   */
  generateTicketContent(order: KDSOrder, type: 'ticket' | 'reprint' = 'ticket'): string {
    const lines: string[] = [];
    const timestamp = formatDateTime(order.createdAt);

    // Header
    lines.push(COMMANDS.INIT);
    lines.push(COMMANDS.ALIGN_CENTER);
    lines.push(COMMANDS.DOUBLE_HEIGHT_ON);
    lines.push(COMMANDS.DOUBLE_WIDTH_ON);
    lines.push('*** KDS ***');
    lines.push(COMMANDS.DOUBLE_HEIGHT_OFF);
    lines.push(COMMANDS.DOUBLE_WIDTH_OFF);
    lines.push(COMMANDS.FEED);

    // Order type indicator
    if (order.isTakeaway) {
      lines.push(COMMANDS.BOLD_ON);
      lines.push('>>> TAKEAWAY <<<');
      lines.push(COMMANDS.BOLD_OFF);
    }

    // Order number and info
    lines.push(COMMANDS.BOLD_ON);
    lines.push(COMMANDS.DOUBLE_HEIGHT_ON);
    lines.push(`#${order.displayNumber}`);
    lines.push(COMMANDS.DOUBLE_HEIGHT_OFF);
    lines.push(COMMANDS.BOLD_OFF);
    lines.push(COMMANDS.FEED);

    // Priority
    if (order.priority !== 'normal') {
      lines.push(COMMANDS.BOLD_ON);
      lines.push(`[${order.priority.toUpperCase()}]`);
      lines.push(COMMANDS.BOLD_OFF);
      lines.push(COMMANDS.FEED);
    }

    // Station
    lines.push(`Station: ${order.station}`);
    lines.push(COMMANDS.FEED);

    // Date/Time
    lines.push(COMMANDS.ALIGN_LEFT);
    lines.push(`Date: ${timestamp}`);
    if (order.tableNumber) {
      lines.push(`Table: ${order.tableNumber}`);
    }
    lines.push(COMMANDS.FEED);

    // Customer
    if (order.customer?.name) {
      lines.push(`Customer: ${order.customer.name}`);
    }
    lines.push(COMMANDS.FEED_LINES(1);

    // Separator
    lines.push('--------------------------------');
    lines.push(COMMANDS.FEED);

    // Items
    lines.push(COMMANDS.BOLD_ON);
    lines.push('ITEMS:');
    lines.push(COMMANDS.BOLD_OFF);
    lines.push(COMMANDS.FEED);

    for (const item of order.items) {
      // Item header
      lines.push(COMMANDS.ALIGN_LEFT);
      lines.push(
        `${item.quantity}x ${item.name.toUpperCase()}`
      );
      lines.push(COMMANDS.FEED);

      // Customizations
      if (item.customizations?.length) {
        lines.push('  ' + item.customizations.join(', '));
        lines.push(COMMANDS.FEED);
      }

      // Notes
      if (item.notes) {
        lines.push(`  NOTE: ${item.notes}`);
        lines.push(COMMANDS.FEED);
      }
    }

    lines.push(COMMANDS.FEED);

    // Special instructions
    if (order.specialInstructions) {
      lines.push('--------------------------------');
      lines.push(COMMANDS.BOLD_ON);
      lines.push('SPECIAL INSTRUCTIONS:');
      lines.push(COMMANDS.BOLD_OFF);
      lines.push(order.specialInstructions);
      lines.push(COMMANDS.FEED);
    }

    // Footer
    lines.push(COMMANDS.FEED_LINES(2));
    lines.push(COMMANDS.ALIGN_CENTER);
    lines.push(COMMANDS.FEED);
    lines.push(type === 'reprint' ? '** REPRINT **' : '** NEW ORDER **');
    lines.push(COMMANDS.FEED_LINES(3));
    lines.push(COMMANDS.CUT);

    return lines.join('\n');
  }

  /**
   * Generate all-day ticket
   */
  generateAllDayContent(items: Array<{ name: string; quantity: number }>): string {
    const lines: string[] = [];

    lines.push(COMMANDS.INIT);
    lines.push(COMMANDS.ALIGN_CENTER);
    lines.push(COMMANDS.DOUBLE_HEIGHT_ON);
    lines.push(COMMANDS.BOLD_ON);
    lines.push('=== ALL DAY ===');
    lines.push(COMMANDS.BOLD_OFF);
    lines.push(COMMANDS.DOUBLE_HEIGHT_OFF);
    lines.push(COMMANDS.FEED);
    lines.push(COMMANDS.FEED);

    lines.push(COMMANDS.ALIGN_LEFT);
    lines.push(COMMANDS.BOLD_ON);
    lines.push('ITEMS:');
    lines.push(COMMANDS.BOLD_OFF);
    lines.push(COMMANDS.FEED);

    for (const item of items) {
      lines.push(`${item.quantity}x ${item.name.toUpperCase()}`);
      lines.push(COMMANDS.FEED);
    }

    lines.push(COMMANDS.FEED_LINES(3));
    lines.push(COMMANDS.CUT);

    return lines.join('\n');
  }

  /**
   * Print order ticket
   */
  async printTicket(order: KDSOrder, type: 'ticket' | 'reprint' = 'ticket'): Promise<boolean> {
    if (!this.isPrinterAvailable()) {
      logger.warn('No printer available');
      return false;
    }

    const content = type === 'ticket'
      ? this.generateTicketContent(order, type)
      : this.generateTicketContent(order, type);

    return this.sendToPrinter(content);
  }

  /**
   * Print all-day ticket
   */
  async printAllDay(items: Array<{ name: string; quantity: number }>): Promise<boolean> {
    if (!this.isPrinterAvailable()) {
      return false;
    }

    const content = this.generateAllDayContent(items);
    return this.sendToPrinter(content);
  }

  /**
   * Send content to printer
   */
  private async sendToPrinter(content: string): Promise<boolean> {
    try {
      // For network printers, send via HTTP to a print server
      // This would typically go through a backend service
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Use native module or HTTP endpoint
        // For demo, we'll use a placeholder
        console.log('Print content:', content);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Print error:', error);
      return false;
    }
  }

  /**
   * Add print job to queue
   */
  queuePrintJob(order: KDSOrder, type: 'ticket' | 'reprint' | 'all_day'): string {
    const job: PrintJob = {
      id: `job-${Date.now()}`,
      order,
      type,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    this.printQueue.push(job);
    this.processQueue();
    return job.id;
  }

  /**
   * Process print queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.printQueue.length === 0) return;

    this.isProcessing = true;

    while (this.printQueue.length > 0) {
      const job = this.printQueue[0];

      try {
        job.status = 'printing';

        let success = false;
        if (job.type === 'all_day') {
          success = await this.printAllDay(job.order.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
          })));
        } else {
          success = await this.printTicket(job.order, job.type);
        }

        if (success) {
          job.status = 'completed';
          this.printQueue.shift();
        } else {
          job.retryCount++;
          if (job.retryCount >= 3) {
            job.status = 'failed';
            this.printQueue.shift();
          }
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Queue processing error:', error);
        job.status = 'failed';
        this.printQueue.shift();
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { pending: number; printing: number; failed: number } {
    return {
      pending: this.printQueue.filter((j) => j.status === 'pending').length,
      printing: this.printQueue.filter((j) => j.status === 'printing').length,
      failed: this.printQueue.filter((j) => j.status === 'failed').length,
    };
  }

  /**
   * Clear failed jobs
   */
  clearFailedJobs(): void {
    this.printQueue = this.printQueue.filter((j) => j.status !== 'failed');
  }
}

// Export singleton instance
export const kdsPrinter = new KDSPrinterService();
export default kdsPrinter;
