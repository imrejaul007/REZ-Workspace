import logger from './utils/logger';

import { v4 as uuidv4 } from 'uuid'

export interface PrinterConfig {
  id: string
  name: string
  type: 'receipt' | 'kot' | 'label' | 'barcode'
  ip?: string
  port?: number
  isDefault?: boolean
}

export interface PrintJob {
  id: string
  printerId: string
  type: 'receipt' | 'kot' | 'label'
  content: string
  copies: number
  status: 'pending' | 'printing' | 'completed' | 'failed'
  createdAt: Date
  completedAt?: Date
  error?: string
}

export interface ReceiptData {
  restaurantName: string
  address: string
  phone: string
  orderNumber: string
  date: Date
  items: Array<{
    name: string
    quantity: number
    price: number
    modifiers?: string[]
  }>
  subtotal: number
  tax: number
  discount?: number
  total: number
  paymentMethod: string
  customerName?: string
  tableNumber?: string
}

export interface KOTData {
  orderNumber: string
  tableNumber?: string
  customerName?: string
  orderType: 'dine_in' | 'takeaway' | 'delivery'
  items: Array<{
    name: string
    quantity: number
    modifiers?: string[]
    notes?: string
  }>
  notes?: string
  priority: 'normal' | 'rush'
  createdAt: Date
}

// ESC/POS Commands
const ESC = '\x1B'
const GS = '\x1D'
const COMMANDS = {
  INIT: ESC + '@',
  BOLD_ON: ESC + 'E\x01',
  BOLD_OFF: ESC + 'E\x00',
  CENTER: ESC + 'a\x01',
  LEFT: ESC + 'a\x00',
  RIGHT: ESC + 'a\x02',
  LARGE_FONT: GS + '!\x30', // Double height + width
  NORMAL_FONT: GS + '!\x00',
  CUT: GS + 'V\x00',
  FEED_AND_CUT: GS + 'V\x01',
  OPEN_DRAWER: ESC + 'p\x00\x19\xFA',
}

export class PrinterService {
  private printers: Map<string, PrinterConfig> = new Map()
  private printQueue: PrintJob[] = []
  private isConnected: Map<string, boolean> = new Map()

  constructor() {
    // Initialize with default printers
    this.addPrinter({
      id: 'receipt-default',
      name: 'Receipt Printer',
      type: 'receipt',
      isDefault: true
    })
    this.addPrinter({
      id: 'kot-default',
      name: 'Kitchen Printer (KOT)',
      type: 'kot',
      isDefault: true
    })
  }

  // Add a printer
  addPrinter(config: PrinterConfig): void {
    this.printers.set(config.id, config)
    logger.info(`Printer added: ${config.name} (${config.type})`)
  }

  // Remove a printer
  removePrinter(printerId: string): void {
    this.printers.delete(printerId)
    this.isConnected.delete(printerId)
  }

  // Get all printers
  getPrinters(): PrinterConfig[] {
    return Array.from(this.printers.values())
  }

  // Get default printer by type
  getDefaultPrinter(type: PrinterConfig['type']): PrinterConfig | undefined {
    return Array.from(this.printers.values()).find(p => p.type === type && p.isDefault)
  }

  // Generate ESC/POS receipt
  generateReceipt(data: ReceiptData): string {
    const lines: string[] = []
    const width = 48 // Standard 80mm thermal paper width

    // Header
    lines.push(COMMANDS.INIT)
    lines.push(COMMANDS.CENTER)
    lines.push(COMMANDS.BOLD_ON)
    lines.push(COMMANDS.LARGE_FONT)
    lines.push(data.restaurantName.padStart(Math.floor((width + data.restaurantName.length) / 2))
    lines.push(COMMANDS.NORMAL_FONT)
    lines.push(COMMANDS.BOLD_OFF)
    lines.push(data.address)
    lines.push(`Tel: ${data.phone}`)
    lines.push('') // Blank line

    // Order info
    lines.push(COMMANDS.LEFT)
    lines.push('-'.repeat(width))
    lines.push(`Order: ${data.orderNumber}`.padEnd(width - 16) + `${data.date.toLocaleDateString()}`)
    lines.push(`Time: ${data.date.toLocaleTimeString()}`)
    if (data.tableNumber) lines.push(`Table: ${data.tableNumber}`)
    if (data.customerName) lines.push(`Customer: ${data.customerName}`)
    lines.push('-'.repeat(width))

    // Items
    lines.push('ITEMS')
    lines.push('-'.repeat(width))
    for (const item of data.items) {
      const itemLine = `${item.quantity}x ${item.name}`
      const priceLine = `₹${item.price}`
      const padding = width - itemLine.length - priceLine.length
      lines.push(itemLine + ' '.repeat(Math.max(1, padding)) + priceLine)

      if (item.modifiers && item.modifiers.length > 0) {
        for (const mod of item.modifiers) {
          lines.push(`   ${mod}`)
        }
      }
    }
    lines.push('-'.repeat(width))

    // Totals
    lines.push(`Subtotal:`.padEnd(width - 12) + `₹${data.subtotal}`)
    lines.push(`Tax (GST):`.padEnd(width - 12) + `₹${data.tax}`)
    if (data.discount) {
      lines.push(`Discount:`.padEnd(width - 12) + `-₹${data.discount}`)
    }
    lines.push('-'.repeat(width))
    lines.push(COMMANDS.BOLD_ON)
    lines.push(`TOTAL:`.padEnd(width - 8) + `₹${data.total}`)
    lines.push(COMMANDS.BOLD_OFF)
    lines.push('-'.repeat(width))

    // Payment
    lines.push(`Paid by: ${data.paymentMethod}`)
    lines.push('')

    // Footer
    lines.push(COMMANDS.CENTER)
    lines.push('Thank you for dining with us!')
    lines.push('Please visit again')
    lines.push('')
    lines.push('')
    lines.push(COMMANDS.FEED_AND_CUT)

    return lines.join('\n')
  }

  // Generate KOT (Kitchen Order Ticket)
  generateKOT(data: KOTData): string {
    const lines: string[] = []
    const width = 48

    // Header
    lines.push(COMMANDS.INIT)
    lines.push(COMMANDS.CENTER)
    lines.push(COMMANDS.BOLD_ON)
    lines.push(COMMANDS.LARGE_FONT)
    lines.push('*** KITCHEN ORDER ***')
    lines.push(COMMANDS.NORMAL_FONT)

    // Order info
    lines.push(COMMANDS.LEFT)
    lines.push('-'.repeat(width))
    lines.push(`#${data.orderNumber}`.padEnd(width - 20) + `${data.orderType.toUpperCase()}`)

    if (data.tableNumber) {
      lines.push(`TABLE: ${data.tableNumber}`)
    }
    if (data.customerName) {
      lines.push(`Customer: ${data.customerName}`)
    }
    lines.push('-'.repeat(width))

    // Priority banner
    if (data.priority === 'rush') {
      lines.push(COMMANDS.BOLD_ON)
      lines.push(COMMANDS.CENTER)
      lines.push('!!! RUSH ORDER !!!')
      lines.push(COMMANDS.BOLD_OFF)
    }

    // Time
    lines.push(`Time: ${data.createdAt.toLocaleTimeString()}`)
    lines.push('-'.repeat(width))

    // Items
    for (const item of data.items) {
      lines.push(COMMANDS.BOLD_ON)
      lines.push(`${item.quantity}x ${item.name.toUpperCase()}`)
      lines.push(COMMANDS.BOLD_OFF)

      if (item.modifiers && item.modifiers.length > 0) {
        for (const mod of item.modifiers) {
          lines.push(`   + ${mod}`)
        }
      }

      if (item.notes) {
        lines.push(`   NOTE: ${item.notes}`)
      }
      lines.push('')
    }

    if (data.notes) {
      lines.push('-'.repeat(width))
      lines.push(`ORDER NOTES: ${data.notes}`)
    }

    lines.push('-'.repeat(width))
    lines.push('')
    lines.push(COMMANDS.FEED_AND_CUT)

    return lines.join('\n')
  }

  // Print a job
  async print(printerId: string, content: string, copies = 1): Promise<PrintJob> {
    const printer = this.printers.get(printerId)
    if (!printer) {
      throw new Error(`Printer not found: ${printerId}`)
    }

    const job: PrintJob = {
      id: `job-${uuidv4().substring(0, 8)}`,
      printerId,
      type: printer.type === 'kot' ? 'kot' : 'receipt',
      content,
      copies,
      status: 'pending',
      createdAt: new Date()
    }

    this.printQueue.push(job)

    try {
      // Simulate printing
      job.status = 'printing'
      logger.info(`[PrinterService] Printing job ${job.id} on ${printer.name}`)
      logger.info(`[PrinterService] Content preview: ${content.substring(0, 100)}...`)

      // In production, this would send to actual printer
      // await this.sendToPrinter(printer, content, copies)

      await this.simulatePrint(job)
      job.status = 'completed'
      job.completedAt = new Date()
    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }

    return job
  }

  // Print receipt
  async printReceipt(data: ReceiptData, printerId?: string): Promise<PrintJob> {
    const printer = printerId
      ? this.printers.get(printerId)
      : this.getDefaultPrinter('receipt')

    if (!printer) {
      throw new Error('No receipt printer configured')
    }

    const content = this.generateReceipt(data)
    return this.print(printer.id, content)
  }

  // Print KOT
  async printKOT(data: KOTData, printerId?: string): Promise<PrintJob> {
    const printer = printerId
      ? this.printers.get(printerId)
      : this.getDefaultPrinter('kot')

    if (!printer) {
      throw new Error('No KOT printer configured')
    }

    const content = this.generateKOT(data)
    return this.print(printer.id, content)
  }

  // Open cash drawer
  async openDrawer(printerId?: string): Promise<void> {
    const printer = printerId
      ? this.printers.get(printerId)
      : this.getDefaultPrinter('receipt')

    if (!printer) {
      throw new Error('No printer configured for drawer')
    }

    logger.info(`[PrinterService] Opening cash drawer on ${printer.name}`)
    // In production: send ESC + OPEN_DRAWER command
    // await this.sendToPrinter(printer, COMMANDS.OPEN_DRAWER, 1)
  }

  // Get print queue status
  getQueueStatus(): { pending: number; printing: number; completed: number; failed: number } {
    return {
      pending: this.printQueue.filter(j => j.status === 'pending').length,
      printing: this.printQueue.filter(j => j.status === 'printing').length,
      completed: this.printQueue.filter(j => j.status === 'completed').length,
      failed: this.printQueue.filter(j => j.status === 'failed').length
    }
  }

  // Clear completed jobs
  clearCompleted(): void {
    this.printQueue = this.printQueue.filter(j => j.status !== 'completed')
  }

  // Simulate printing delay
  private simulatePrint(job: PrintJob): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 500) // 500ms print time
    })
  }

  // In production, this would send to actual printer
  private async sendToPrinter(printer: PrinterConfig, content: string, copies: number): Promise<void> {
    if (!printer.ip || !printer.port) {
      logger.info(`[PrinterService] Would send to ${printer.name} at ${printer.ip}:${printer.port}`)
      return
    }

    // Production implementation would use net.Socket or a printer library
    // const client = new net.Socket()
    // await client.connect(printer.port, printer.ip)
    // for (let i = 0; i < copies; i++) {
    //   client.write(content)
    // }
    // client.end()
  }
}

export const printerService = new PrinterService()
