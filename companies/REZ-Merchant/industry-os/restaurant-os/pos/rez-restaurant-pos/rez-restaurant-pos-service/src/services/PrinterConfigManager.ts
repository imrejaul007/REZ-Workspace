import logger from './utils/logger';

/**
 * Printer Configuration Manager
 * Manage printer network with real IPs
 */

import { v4 as uuidv4 } from 'uuid'
import net from 'net'

export type PrinterType = 'receipt' | 'kot' | 'label' | 'barcode'
export type PrinterModel = 'epson-tm82' | 'epson-tm88' | 'epson-t20' | 'pos-80' | 'custom'

export interface PrinterNetworkConfig {
  id: string
  name: string
  type: PrinterType
  model: PrinterModel
  ip: string
  port: number
  storeId?: string
  station?: string // e.g., 'grill', 'fry'
  isDefault: boolean
  isOnline: boolean
  lastSeen?: Date
  lastPrint?: Date
  settings: {
    encoding: 'utf8' | 'windows1252' | 'ascii'
    paperWidth: 58 | 80 // mm
    cutAfterPrint: boolean
    openDrawerOnPrint: boolean
    soundOnPrint: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface PrintJob {
  id: string
  printerId: string
  type: 'receipt' | 'kot' | 'label'
  content: string
  copies: number
  status: 'queued' | 'printing' | 'completed' | 'failed'
  error?: string
  createdAt: Date
  completedAt?: Date
}

export interface PrinterGroup {
  id: string
  name: string
  printerIds: string[]
  autoFailover: boolean // If primary fails, use secondary
}

export class PrinterConfigManager {
  private printers: Map<string, PrinterNetworkConfig> = new Map()
  private groups: Map<string, PrinterGroup> = new Map()
  private jobQueue: PrintJob[] = []
  private onUpdateCallbacks: Set<(printers: PrinterNetworkConfig[]) => void> = new Set()

  constructor() {
    this.initializeDefaultPrinters()
  }

  private initializeDefaultPrinters(): void {
    this.addPrinter({
      name: 'Receipt Printer (Main)',
      type: 'receipt',
      model: 'epson-tm82',
      ip: '192.168.1.100',
      port: 9100,
      isDefault: true,
      settings: {
        encoding: 'utf8',
        paperWidth: 80,
        cutAfterPrint: true,
        openDrawerOnPrint: true,
        soundOnPrint: true
      }
    })

    this.addPrinter({
      name: 'Kitchen KOT Printer',
      type: 'kot',
      model: 'pos-80',
      ip: '192.168.1.101',
      port: 9100,
      station: 'main',
      isDefault: true,
      settings: {
        encoding: 'utf8',
        paperWidth: 80,
        cutAfterPrint: false,
        openDrawerOnPrint: false,
        soundOnPrint: true
      }
    })

    this.addPrinter({
      name: 'Bar Printer (Desserts)',
      type: 'kot',
      model: 'epson-t20',
      ip: '192.168.1.102',
      port: 9100,
      station: 'dessert',
      isDefault: true,
      settings: {
        encoding: 'utf8',
        paperWidth: 58,
        cutAfterPrint: false,
        openDrawerOnPrint: false,
        soundOnPrint: false
      }
    })
  }

  // ============ PRINTER MANAGEMENT ============

  addPrinter(data: Omit<PrinterNetworkConfig, 'id' | 'isOnline' | 'createdAt' | 'updatedAt'>): PrinterNetworkConfig {
    const id = `printer-${uuidv4().substring(0, 8)}`
    const printer: PrinterNetworkConfig = {
      ...data,
      id,
      isOnline: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.printers.set(id, printer)
    this.notifyUpdate()

    // Test connection asynchronously
    this.testConnection(id)

    return printer
  }

  updatePrinter(id: string, updates: Partial<PrinterNetworkConfig>): PrinterNetworkConfig | undefined {
    const printer = this.printers.get(id)
    if (!printer) return undefined

    const updated = {
      ...printer,
      ...updates,
      id: printer.id, // Don't allow ID change
      createdAt: printer.createdAt,
      updatedAt: new Date()
    }

    this.printers.set(id, updated)
    this.notifyUpdate()

    return updated
  }

  removePrinter(id: string): boolean {
    const deleted = this.printers.delete(id)
    if (deleted) this.notifyUpdate()
    return deleted
  }

  getPrinter(id: string): PrinterNetworkConfig | undefined {
    return this.printers.get(id)
  }

  getAllPrinters(): PrinterNetworkConfig[] {
    return Array.from(this.printers.values())
  }

  getPrintersByType(type: PrinterType): PrinterNetworkConfig[] {
    return this.getAllPrinters().filter(p => p.type === type)
  }

  getPrintersByStation(station: string): PrinterNetworkConfig[] {
    return this.getAllPrinters().filter(p => p.station === station)
  }

  getDefaultPrinter(type: PrinterType): PrinterNetworkConfig | undefined {
    return this.getAllPrinters().find(p => p.type === type && p.isDefault && p.isOnline)
  }

  getOnlinePrinters(): PrinterNetworkConfig[] {
    return this.getAllPrinters().filter(p => p.isOnline)
  }

  // ============ PRINTER GROUPS ============

  createGroup(name: string, printerIds: string[], autoFailover = true): PrinterGroup {
    const id = `group-${uuidv4().substring(0, 8)}`
    const group: PrinterGroup = { id, name, printerIds, autoFailover }
    this.groups.set(id, group)
    return group
  }

  addPrinterToGroup(groupId: string, printerId: string): boolean {
    const group = this.groups.get(groupId)
    if (!group) return false
    if (!group.printerIds.includes(printerId)) {
      group.printerIds.push(printerId)
    }
    return true
  }

  removePrinterFromGroup(groupId: string, printerId: string): boolean {
    const group = this.groups.get(groupId)
    if (!group) return false
    group.printerIds = group.printerIds.filter(id => id !== printerId)
    return true
  }

  getGroup(id: string): PrinterGroup | undefined {
    return this.groups.get(id)
  }

  getAllGroups(): PrinterGroup[] {
    return Array.from(this.groups.values())
  }

  // ============ CONNECTION MANAGEMENT ============

  async testConnection(id: string): Promise<boolean> {
    const printer = this.printers.get(id)
    if (!printer) return false

    return new Promise((resolve) => {
      const client = new net.Socket()
      const timeout = setTimeout(() => {
        client.destroy()
        this.updatePrinter(id, { isOnline: false })
        resolve(false)
      }, 3000)

      client.connect(printer.port, printer.ip, () => {
        clearTimeout(timeout)
        client.destroy()
        this.updatePrinter(id, {
          isOnline: true,
          lastSeen: new Date()
        })
        resolve(true)
      })

      client.on('error', () => {
        clearTimeout(timeout)
        client.destroy()
        this.updatePrinter(id, { isOnline: false })
        resolve(false)
      })
    })
  }

  async testAllConnections(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>()
    for (const printer of this.printers.values()) {
      const isOnline = await this.testConnection(printer.id)
      results.set(printer.id, isOnline)
    }
    return results
  }

  async scanNetwork(): Promise<PrinterNetworkConfig[]> {
    // Scan common IP ranges for printers
    const baseIp = '192.168.1.'
    const discovered: PrinterNetworkConfig[] = []

    for (let i = 100; i <= 110; i++) {
      const ip = `${baseIp}${i}`
      const isOpen = await this.testPort(ip, 9100)
      if (isOpen) {
        const existing = Array.from(this.printers.values()).find(p => p.ip === ip)
        if (!existing) {
          discovered.push({
            id: '',
            name: `Discovered Printer (${ip})`,
            type: 'receipt',
            model: 'custom',
            ip,
            port: 9100,
            isDefault: false,
            isOnline: true,
            lastSeen: new Date(),
            settings: {
              encoding: 'utf8',
              paperWidth: 80,
              cutAfterPrint: true,
              openDrawerOnPrint: false,
              soundOnPrint: false
            },
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      }
    }

    return discovered
  }

  private testPort(ip: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const client = new net.Socket()
      const timeout = setTimeout(() => {
        client.destroy()
        resolve(false)
      }, 500)

      client.connect(port, ip, () => {
        clearTimeout(timeout)
        client.destroy()
        resolve(true)
      })

      client.on('error', () => {
        clearTimeout(timeout)
        client.destroy()
        resolve(false)
      })
    })
  }

  // ============ PRINTING ============

  async print(printerId: string, content: string, copies = 1): Promise<PrintJob> {
    const printer = this.printers.get(printerId)
    if (!printer) throw new Error(`Printer not found: ${printerId}`)

    const job: PrintJob = {
      id: `job-${uuidv4().substring(0, 8)}`,
      printerId,
      type: printer.type as 'receipt' | 'kot' | 'label',
      content,
      copies,
      status: 'queued',
      createdAt: new Date()
    }

    this.jobQueue.push(job)

    try {
      job.status = 'printing'
      await this.sendToPrinter(printer, content, copies)
      job.status = 'completed'
      job.completedAt = new Date()

      this.updatePrinter(printerId, { lastPrint: new Date() })
    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Print failed'

      // Try failover if enabled
      const group = this.findGroupWithPrinter(printerId)
      if (group?.autoFailover) {
        const failover = group.printerIds.find(id => id !== printerId && this.printers.get(id)?.isOnline)
        if (failover) {
          logger.info(`[Printer] Failing over to ${failover}`)
          return this.print(failover, content, copies)
        }
      }
    }

    return job
  }

  private async sendToPrinter(printer: PrinterNetworkConfig, content: string, copies: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket()
      const timeout = setTimeout(() => {
        client.destroy()
        reject(new Error('Print timeout'))
      }, 10000)

      client.connect(printer.port, printer.ip, () => {
        clearTimeout(timeout)
        for (let i = 0; i < copies; i++) {
          client.write(Buffer.from(content, printer.settings.encoding === 'utf8' ? 'utf8' : 'binary'))
        }
        client.end()
        resolve()
      })

      client.on('error', (error) => {
        clearTimeout(timeout)
        client.destroy()
        reject(error)
      })
    })
  }

  private findGroupWithPrinter(printerId: string): PrinterGroup | undefined {
    return Array.from(this.groups.values()).find(g => g.printerIds.includes(printerId)
  }

  // ============ PRINT JOBS ============

  getJobQueue(): PrintJob[] {
    return this.jobQueue.slice(-50)
  }

  getPrinterJobs(printerId: string): PrintJob[] {
    return this.jobQueue.filter(j => j.printerId === printerId)
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobQueue.find(j => j.id === jobId)
    if (!job || job.status === 'completed' || job.status === 'failed') return false
    job.status = 'failed'
    job.error = 'Cancelled by user'
    return true
  }

  clearCompletedJobs(): void {
    this.jobQueue = this.jobQueue.filter(j => j.status !== 'completed')
  }

  // ============ HELPERS ============

  private notifyUpdate(): void {
    const printers = this.getAllPrinters()
    this.onUpdateCallbacks.forEach(cb => cb(printers))
  }

  onUpdate(callback: (printers: PrinterNetworkConfig[]) => void): () => void {
    this.onUpdateCallbacks.add(callback)
    return () => this.onUpdateCallbacks.delete(callback)
  }

  // Get statistics
  getStats(): {
    total: number
    online: number
    offline: number
    byType: Record<PrinterType, number>
    totalJobs: number
    failedJobs: number
  } {
    const printers = this.getAllPrinters()
    return {
      total: printers.length,
      online: printers.filter(p => p.isOnline).length,
      offline: printers.filter(p => !p.isOnline).length,
      byType: {
        receipt: printers.filter(p => p.type === 'receipt').length,
        kot: printers.filter(p => p.type === 'kot').length,
        label: printers.filter(p => p.type === 'label').length,
        barcode: printers.filter(p => p.type === 'barcode').length
      },
      totalJobs: this.jobQueue.length,
      failedJobs: this.jobQueue.filter(j => j.status === 'failed').length
    }
  }

  // Export configuration
  exportConfig(): {
    printers: PrinterNetworkConfig[]
    groups: PrinterGroup[]
  } {
    return {
      printers: this.getAllPrinters(),
      groups: this.getAllGroups()
    }
  }

  // Import configuration
  importConfig(config: { printers: PrinterNetworkConfig[]; groups: PrinterGroup[] }): void {
    for (const printer of config.printers) {
      const { id, createdAt, updatedAt, ...data } = printer
      this.addPrinter(data)
    }
    for (const group of config.groups) {
      const { id, printerIds, ...data } = group
      const newGroup = this.createGroup(data.name, [], data.autoFailover)
      for (const pid of printerIds) {
        this.addPrinterToGroup(newGroup.id, pid)
      }
    }
  }
}

export const printerConfigManager = new PrinterConfigManager()
