/**
 * Hardware Integration Service
 * Support for printers, scales, barcode scanners, cash drawers
 */

import { EventEmitter } from 'events';

// ── Hardware Types ─────────────────────────────────────────────────────────────

export type PrinterType = 'receipt' | 'kitchen' | 'label' | 'kiosk';
export type PrinterBrand = 'epson' | 'star' | 'diebold' | 'generic';

export interface PrinterConfig {
  id: string;
  name: string;
  type: PrinterType;
  brand: PrinterBrand;
  connection: 'usb' | 'bluetooth' | 'network' | 'serial';
  address?: string; // IP for network, port for serial
  port?: number;
  status: 'online' | 'offline' | 'error';
  capabilities: {
    cut?: boolean;
    cashDrawer?: boolean;
    beep?: boolean;
    doubleHeight?: boolean;
    doubleWidth?: boolean;
    bold?: boolean;
  };
}

export interface ScaleConfig {
  id: string;
  name: string;
  connection: 'usb' | 'serial' | 'network' | 'bluetooth';
  address?: string;
  port?: number;
  baudRate?: number;
  status: 'online' | 'offline' | 'error';
  maxWeight: number; // in grams
  precision: number; // decimal places
  unit: 'g' | 'kg' | 'oz' | 'lb';
}

export interface BarcodeScannerConfig {
  id: string;
  name: string;
  connection: 'usb' | 'bluetooth' | 'serial';
  address?: string;
  status: 'online' | 'offline' | 'error';
  supportedFormats: ('ean13' | 'ean8' | 'upca' | 'upce' | 'code128' | 'code39' | 'qr' | 'datamatrix')[];
}

export interface CashDrawerConfig {
  id: string;
  name: string;
  connection: 'printer' | 'usb' | 'serial';
  linkedPrinter?: string; // Printer ID if connected via printer
  status: 'online' | 'offline' | 'error';
}

export interface HardwareStatus {
  printer: PrinterConfig[];
  scale: ScaleConfig[];
  scanner: BarcodeScannerConfig[];
  cashDrawer: CashDrawerConfig[];
}

// ── ESC/POS Commands ─────────────────────────────────────────────────────────────

const ESC = '\x1B';
const GS = '\x1D';

const Commands = {
  // Text formatting
  INIT: `${ESC}@`, // Initialize printer
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  DOUBLE_HEIGHT_ON: `${GS}!\x10`,
  DOUBLE_HEIGHT_OFF: `${GS}!\x00`,
  DOUBLE_WIDTH_ON: `${GS}!\x20`,
  DOUBLE_WIDTH_OFF: `${GS}!\x00`,
  UNDERLINE_ON: `${ESC}-\x01`,
  UNDERLINE_OFF: `${ESC}-\x00`,
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,

  // Paper handling
  CUT: `${GS}V\x00`, // Full cut
  PARTIAL_CUT: `${GS}V\x01`,
  FEED_LINES: (n: number) => `${ESC}d${String.fromCharCode(n)}`,

  // Cash drawer
  OPEN_CASH_DRAWER: `${ESC}p\x00\x19\xFA`, // Pin 2
  OPEN_CASH_DRAWER_2: `${ESC}p\x01\x19\xFA`, // Pin 5

  // Beep
  BEEP: `${ESC}B\x03`, // 3 beeps

  // Status
  AUTO_STATUS: `${GS}v\x00`, // Request printer status
};

// ── Receipt Template ─────────────────────────────────────────────────────────────

export interface ReceiptData {
  merchantName: string;
  merchantAddress?: string;
  merchantPhone?: string;
  merchantGstin?: string;
  orderNumber: string;
  orderDate: string;
  orderTime: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
    modifiers?: string[];
  }>;
  subtotal: number;
  taxBreakdown: Array<{ name: string; rate: number; amount: number }>;
  discount?: { name: string; amount: number };
  total: number;
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending' | 'refunded';
  footerMessage?: string;
  qrCode?: string;
}

// ── Hardware Service ─────────────────────────────────────────────────────────────

class HardwareService extends EventEmitter {
  private printers: Map<string, PrinterConfig> = new Map();
  private scales: Map<string, ScaleConfig> = new Map();
  private scanners: Map<string, BarcodeScannerConfig> = new Map();
  private cashDrawers: Map<string, CashDrawerConfig> = new Map();
  private printerConnections: Map<string, any> = new Map();

  constructor() {
    super();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRINTER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Register a printer
   */
  registerPrinter(config: PrinterConfig): void {
    this.printers.set(config.id, config);
    console.log(`[Hardware] Printer registered: ${config.name} (${config.type})`);
    this.emit('printer:registered', config);
  }

  /**
   * Get printer by ID
   */
  getPrinter(id: string): PrinterConfig | undefined {
    return this.printers.get(id);
  }

  /**
   * Get all printers
   */
  getAllPrinters(): PrinterConfig[] {
    return Array.from(this.printers.values());
  }

  /**
   * Update printer status
   */
  updatePrinterStatus(id: string, status: PrinterConfig['status']): void {
    const printer = this.printers.get(id);
    if (printer) {
      printer.status = status;
      this.emit('printer:status', { id, status });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRINTING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Print receipt
   */
  async printReceipt(printerId: string, data: ReceiptData): Promise<boolean> {
    const printer = this.printers.get(printerId);
    if (!printer) {
      throw new Error(`Printer ${printerId} not found`);
    }

    try {
      const receipt = this.buildReceipt(data, printer);
      await this.sendToPrinter(printer, receipt);
      this.emit('receipt:printed', { printerId, orderNumber: data.orderNumber });
      return true;
    } catch (error) {
      console.error(`[Hardware] Receipt print failed:`, error);
      this.updatePrinterStatus(printerId, 'error');
      throw error;
    }
  }

  /**
   * Print kitchen ticket
   */
  async printKitchenTicket(printerId: string, ticket: {
    orderNumber: string;
    tableNumber?: string;
    orderType: string;
    items: Array<{ name: string; quantity: number; notes?: string; modifiers?: string[] }>;
    priority: 'normal' | 'rush' | 'vip';
    time: string;
  }): Promise<boolean> {
    const printer = this.printers.get(printerId);
    if (!printer || printer.type !== 'kitchen') {
      throw new Error(`Kitchen printer ${printerId} not found`);
    }

    try {
      const ticketText = this.buildKitchenTicket(ticket, printer);
      await this.sendToPrinter(printer, ticketText);
      this.emit('ticket:printed', { printerId, orderNumber: ticket.orderNumber });
      return true;
    } catch (error) {
      console.error(`[Hardware] Kitchen ticket print failed:`, error);
      this.updatePrinterStatus(printerId, 'error');
      throw error;
    }
  }

  /**
   * Build receipt text
   */
  private buildReceipt(data: ReceiptData, printer: PrinterConfig): string {
    const lines: string[] = [];
    const width = 48; // Standard receipt width

    // Header
    lines.push(Commands.INIT);
    lines.push(Commands.ALIGN_CENTER);
    lines.push(Commands.BOLD_ON);
    lines.push(Commands.DOUBLE_HEIGHT_ON);
    lines.push(Commands.DOUBLE_WIDTH_ON);
    lines.push(this.centerText(data.merchantName, width));
    lines.push(Commands.DOUBLE_HEIGHT_OFF);
    lines.push(Commands.DOUBLE_WIDTH_OFF);
    lines.push(Commands.BOLD_OFF);

    if (data.merchantAddress) {
      lines.push(this.centerText(data.merchantAddress, width));
    }
    if (data.merchantPhone) {
      lines.push(this.centerText(`Tel: ${data.merchantPhone}`, width));
    }
    if (data.merchantGstin) {
      lines.push(this.centerText(`GSTIN: ${data.merchantGstin}`, width));
    }

    lines.push(Commands.FEED_LINES(1));

    // Order info
    lines.push(Commands.ALIGN_LEFT);
    lines.push(this.line(`Order #: ${data.orderNumber}`, width));
    lines.push(this.line(`Date: ${data.orderDate}`, width));
    lines.push(this.line(`Time: ${data.orderTime}`, width));
    if (data.orderType !== 'dine-in') {
      lines.push(this.line(`Type: ${data.orderType.toUpperCase()}`, width));
    }
    if (data.customerName) {
      lines.push(this.line(`Customer: ${data.customerName}`, width));
    }

    lines.push(Commands.FEED_LINES(1));
    lines.push(this.separator(width));

    // Items header
    lines.push(this.line('Item                    Qty    Amount', width));
    lines.push(this.separator(width));

    // Items
    data.items.forEach((item) => {
      const itemLine = `${item.name.substring(0, 20).padEnd(20)} ${String(item.quantity).padStart(3)} ${String(item.total.toFixed(2)).padStart(10)}`;
      lines.push(this.line(itemLine, width));

      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach((mod) => {
          lines.push(this.line(`   + ${mod}`, width));
        });
      }
    });

    lines.push(this.separator(width));

    // Totals
    lines.push(this.line(`Subtotal:              ${data.subtotal.toFixed(2).padStart(10)}`, width));

    data.taxBreakdown.forEach((tax) => {
      lines.push(this.line(`${tax.name} (${tax.rate}%):          ${tax.amount.toFixed(2).padStart(10)}`, width));
    });

    if (data.discount) {
      lines.push(this.line(`Discount (${data.discount.name}):  -${data.discount.amount.toFixed(2).padStart(10)}`, width));
    }

    lines.push(Commands.BOLD_ON);
    lines.push(this.line(`TOTAL:                 ${data.total.toFixed(2).padStart(10)}`, width));
    lines.push(Commands.BOLD_OFF);

    lines.push(this.separator(width));

    // Payment info
    lines.push(this.line(`Payment: ${data.paymentMethod.toUpperCase()}`, width));
    lines.push(this.line(`Status: ${data.paymentStatus.toUpperCase()}`, width));

    // QR Code if provided
    if (data.qrCode) {
      lines.push(Commands.FEED_LINES(1));
      lines.push(Commands.ALIGN_CENTER);
      lines.push(`[QR: ${data.qrCode}]`);
    }

    // Footer
    lines.push(Commands.FEED_LINES(2));
    lines.push(Commands.ALIGN_CENTER);
    if (data.footerMessage) {
      lines.push(data.footerMessage);
      lines.push(Commands.FEED_LINES(1));
    }
    lines.push('Thank you for dining with us!');
    lines.push(Commands.FEED_LINES(4));

    // Cut paper
    if (printer.capabilities.cut) {
      lines.push(Commands.CUT);
    }

    return lines.join('\n');
  }

  /**
   * Build kitchen ticket text
   */
  private buildKitchenTicket(ticket: any, printer: PrinterConfig): string {
    const lines: string[] = [];
    const width = 48;

    lines.push(Commands.INIT);
    lines.push(Commands.ALIGN_CENTER);

    // Priority banner
    if (ticket.priority === 'rush') {
      lines.push(Commands.BEEP);
      lines.push(Commands.BOLD_ON);
      lines.push(Commands.DOUBLE_HEIGHT_ON);
      lines.push(Commands.DOUBLE_WIDTH_ON);
      lines.push('*** RUSH ***');
      lines.push(Commands.DOUBLE_HEIGHT_OFF);
      lines.push(Commands.DOUBLE_WIDTH_OFF);
      lines.push(Commands.BOLD_OFF);
    } else if (ticket.priority === 'vip') {
      lines.push(Commands.BOLD_ON);
      lines.push('** VIP **');
      lines.push(Commands.BOLD_OFF);
    }

    // Order header
    lines.push(Commands.DOUBLE_HEIGHT_ON);
    lines.push(`ORDER #${ticket.orderNumber}`);
    lines.push(Commands.DOUBLE_HEIGHT_OFF);

    if (ticket.tableNumber) {
      lines.push(`Table: ${ticket.tableNumber}`);
    }
    lines.push(`Type: ${ticket.orderType.toUpperCase()}`);
    lines.push(`Time: ${ticket.time}`);
    lines.push(Commands.FEED_LINES(1));

    lines.push(Commands.ALIGN_LEFT);
    lines.push(this.separator(width));

    // Items
    ticket.items.forEach((item: any) => {
      lines.push(Commands.BOLD_ON);
      lines.push(Commands.DOUBLE_HEIGHT_ON);
      lines.push(`${item.quantity}x ${item.name}`);
      lines.push(Commands.DOUBLE_HEIGHT_OFF);
      lines.push(Commands.BOLD_OFF);

      if (item.notes) {
        lines.push(`   NOTE: ${item.notes}`);
      }
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach((mod: string) => {
          lines.push(`   + ${mod}`);
        });
      }
      lines.push('');
    });

    lines.push(Commands.FEED_LINES(4));

    if (printer.capabilities.cut) {
      lines.push(Commands.PARTIAL_CUT);
    }

    return lines.join('\n');
  }

  /**
   * Send data to printer
   */
  private async sendToPrinter(printer: PrinterConfig, data: string): Promise<void> {
    // In production, this would connect via USB, Bluetooth, or Network
    console.log(`[Hardware] Sending to printer ${printer.name} (${printer.connection})`);

    switch (printer.connection) {
      case 'network':
        await this.sendNetwork(printer, data);
        break;
      case 'bluetooth':
        await this.sendBluetooth(printer, data);
        break;
      case 'usb':
        await this.sendUSB(printer, data);
        break;
      default:
        console.log(`[Hardware] Would print: ${data.substring(0, 100)}...`);
    }

    this.updatePrinterStatus(printer.id, 'online');
  }

  private async sendNetwork(printer: PrinterConfig, data: string): Promise<void> {
    // Mock implementation - would use net.Socket in production
    console.log(`[Hardware] Network print to ${printer.address}:${printer.port}`);
  }

  private async sendBluetooth(printer: PrinterConfig, data: string): Promise<void> {
    // Mock implementation - would use bluetooth-serial-port in production
    console.log(`[Hardware] Bluetooth print to ${printer.address}`);
  }

  private async sendUSB(printer: PrinterConfig, data: string): Promise<void> {
    // Mock implementation - would use usb in production
    console.log(`[Hardware] USB print to ${printer.address}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CASH DRAWER
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Register cash drawer
   */
  registerCashDrawer(config: CashDrawerConfig): void {
    this.cashDrawers.set(config.id, config);
    console.log(`[Hardware] Cash drawer registered: ${config.name}`);
  }

  /**
   * Open cash drawer
   */
  async openCashDrawer(drawerId: string): Promise<boolean> {
    const drawer = this.cashDrawers.get(drawerId);
    if (!drawer) {
      throw new Error(`Cash drawer ${drawerId} not found`);
    }

    try {
      if (drawer.linkedPrinter) {
        const printer = this.printers.get(drawer.linkedPrinter);
        if (printer) {
          await this.sendToPrinter(printer, Commands.OPEN_CASH_DRAWER);
        }
      } else if (drawer.connection === 'usb') {
        // Direct USB control
        console.log(`[Hardware] Opening cash drawer ${drawerId}`);
      }

      this.emit('drawer:opened', { drawerId });
      return true;
    } catch (error) {
      console.error(`[Hardware] Failed to open cash drawer:`, error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BARCODE SCANNER
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Register barcode scanner
   */
  registerScanner(config: BarcodeScannerConfig): void {
    this.scanners.set(config.id, config);
    console.log(`[Hardware] Scanner registered: ${config.name}`);
  }

  /**
   * Get scanner by ID
   */
  getScanner(id: string): BarcodeScannerConfig | undefined {
    return this.scanners.get(id);
  }

  /**
   * Process scanned barcode
   */
  async processScan(scannerId: string, barcode: string): Promise<{
    format: string;
    data: any;
  } | null> {
    const scanner = this.scanners.get(scannerId);
    if (!scanner) {
      throw new Error(`Scanner ${scannerId} not found`);
    }

    // Determine barcode format
    const format = this.detectBarcodeFormat(barcode);
    if (!scanner.supportedFormats.includes(format)) {
      console.warn(`[Hardware] Unsupported format ${format} from scanner ${scannerId}`);
      return null;
    }

    // Parse barcode data
    const data = this.parseBarcode(format, barcode);

    this.emit('scan:processed', { scannerId, barcode, format, data });
    return { format, data };
  }

  /**
   * Detect barcode format from string
   */
  private detectBarcodeFormat(barcode: string): string {
    if (/^\d{13}$/.test(barcode)) return 'ean13';
    if (/^\d{8}$/.test(barcode)) return 'ean8';
    if (/^\d{12}$/.test(barcode)) return 'upca';
    if (/^\d{6}$/.test(barcode)) return 'upce';
    if (barcode.startsWith('{{')) return 'qr'; // QR codes
    return 'code128'; // Default
  }

  /**
   * Parse barcode data
   */
  private parseBarcode(format: string, barcode: string): any {
    switch (format) {
      case 'ean13':
      case 'ean8':
      case 'upca':
      case 'upce':
        return { type: 'product', sku: barcode };
      case 'qr':
        // Parse QR data as JSON or URL
        try {
          return JSON.parse(barcode);
        } catch {
          return { type: 'url', url: barcode };
        }
      default:
        return { type: 'raw', value: barcode };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCALE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Register scale
   */
  registerScale(config: ScaleConfig): void {
    this.scales.set(config.id, config);
    console.log(`[Hardware] Scale registered: ${config.name}`);
  }

  /**
   * Get weight from scale
   */
  async getWeight(scaleId: string): Promise<{
    weight: number;
    unit: string;
    stable: boolean;
    timestamp: Date;
  }> {
    const scale = this.scales.get(scaleId);
    if (!scale) {
      throw new Error(`Scale ${scaleId} not found`);
    }

    // In production, this would read from serial/USB
    // Mock implementation
    const weight = Math.random() * scale.maxWeight;
    return {
      weight: Math.round(weight * Math.pow(10, scale.precision)) / Math.pow(10, scale.precision),
      unit: scale.unit,
      stable: true,
      timestamp: new Date(),
    };
  }

  /**
   * Tare scale (zero out)
   */
  async tareScale(scaleId: string): Promise<boolean> {
    const scale = this.scales.get(scaleId);
    if (!scale) {
      throw new Error(`Scale ${scaleId} not found`);
    }

    console.log(`[Hardware] Taring scale ${scaleId}`);
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Center text within width
   */
  private centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  /**
   * Pad line to width
   */
  private line(text: string, width: number): string {
    if (text.length >= width) {
      return text.substring(0, width);
    }
    return text + ' '.repeat(width - text.length);
  }

  /**
   * Create separator line
   */
  private separator(width: number): string {
    return '-'.repeat(width);
  }

  /**
   * Get full hardware status
   */
  getStatus(): HardwareStatus {
    return {
      printer: this.getAllPrinters(),
      scale: Array.from(this.scales.values()),
      scanner: Array.from(this.scanners.values()),
      cashDrawer: Array.from(this.cashDrawers.values()),
    };
  }

  /**
   * Check if all hardware is online
   */
  isAllOnline(): boolean {
    const printersOnline = Array.from(this.printers.values()).every((p) => p.status === 'online');
    const scalesOnline = Array.from(this.scales.values()).every((s) => s.status === 'online');
    const scannersOnline = Array.from(this.scanners.values()).every((s) => s.status === 'online');
    return printersOnline && scalesOnline && scannersOnline;
  }
}

export const hardwareService = new HardwareService();
export default hardwareService;
