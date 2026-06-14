import { v4 as uuidv4 } from 'uuid'

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'

export interface Table {
  id: string
  number: string
  name?: string
  capacity: number
  status: TableStatus
  currentOrderId?: string
  currentGuests?: number
  occupiedSince?: Date
  reservedFor?: string
  reservedAt?: Date
  section?: string
  position?: { x: number; y: number }
}

export interface TableSection {
  id: string
  name: string
  color: string
  tables: string[] // table IDs
}

export interface Reservation {
  id: string
  customerName: string
  customerPhone: string
  partySize: number
  tableId?: string
  dateTime: Date
  duration: number // minutes
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  createdAt: Date
}

export interface TableStats {
  total: number
  available: number
  occupied: number
  reserved: number
  cleaning: number
  avgTurnTime: number // minutes
  currentOccupancy: number // percentage
}

export class TableService {
  private tables: Map<string, Table> = new Map()
  private sections: Map<string, TableSection> = new Map()
  private reservations: Map<string, Reservation> = new Map()

  constructor() {
    // Initialize with default tables
    this.initializeDefaultTables()
  }

  private initializeDefaultTables(): void {
    // Add some default tables
    for (let i = 1; i <= 10; i++) {
      const id = `table-${i}`
      this.tables.set(id, {
        id,
        number: String(i),
        capacity: i <= 4 ? 4 : i <= 8 ? 6 : 8,
        status: 'available'
      })
    }

    // Add default sections
    this.sections.set('main', {
      id: 'main',
      name: 'Main Hall',
      color: '#3B82F6',
      tables: Array.from(this.tables.keys())
    })
  }

  // Add a new table
  addTable(table: Omit<Table, 'id'>): Table {
    const id = `table-${uuidv4().substring(0, 8)}`
    const newTable: Table = { ...table, id }
    this.tables.set(id, newTable)

    // Add to section if specified
    if (table.section && this.sections.has(table.section)) {
      this.sections.get(table.section)!.tables.push(id)
    }

    return newTable
  }

  // Remove a table
  removeTable(tableId: string): boolean {
    const table = this.tables.get(tableId)
    if (!table) return false

    // Remove from section
    if (table.section) {
      const section = this.sections.get(table.section)
      if (section) {
        section.tables = section.tables.filter(id => id !== tableId)
      }
    }

    return this.tables.delete(tableId)
  }

  // Get table by ID
  getTable(tableId: string): Table | undefined {
    return this.tables.get(tableId)
  }

  // Get all tables
  getAllTables(): Table[] {
    return Array.from(this.tables.values())
  }

  // Get tables by section
  getTablesBySection(sectionId: string): Table[] {
    const section = this.sections.get(sectionId)
    if (!section) return []
    return section.tables
      .map(id => this.tables.get(id))
      .filter((t): t is Table => t !== undefined)
  }

  // Get available tables
  getAvailableTables(capacity?: number): Table[] {
    return Array.from(this.tables.values()).filter(t => {
      if (t.status !== 'available') return false
      if (capacity && t.capacity < capacity) return false
      return true
    })
  }

  // Update table status
  updateTableStatus(
    tableId: string,
    status: TableStatus,
    orderId?: string
  ): Table | undefined {
    const table = this.tables.get(tableId)
    if (!table) return undefined

    table.status = status

    if (status === 'occupied') {
      table.occupiedSince = new Date()
      if (orderId) table.currentOrderId = orderId
    } else {
      table.occupiedSince = undefined
      table.currentOrderId = undefined
      table.currentGuests = undefined
    }

    return table
  }

  // Seat guests at table
  seatGuests(
    tableId: string,
    guests: number,
    orderId: string
  ): Table | undefined {
    const table = this.tables.get(tableId)
    if (!table || table.status !== 'available') return undefined

    table.status = 'occupied'
    table.currentGuests = guests
    table.currentOrderId = orderId
    table.occupiedSince = new Date()

    return table
  }

  // Clear table (mark for cleaning)
  clearTable(tableId: string): Table | undefined {
    const table = this.tables.get(tableId)
    if (!table) return undefined

    table.status = 'cleaning'
    table.currentOrderId = undefined
    table.currentGuests = undefined
    table.occupiedSince = undefined

    return table
  }

  // Mark table as available
  markAvailable(tableId: string): Table | undefined {
    const table = this.tables.get(tableId)
    if (!table) return undefined

    table.status = 'available'
    table.currentOrderId = undefined
    table.currentGuests = undefined
    table.occupiedSince = undefined

    return table
  }

  // Reserve table
  reserveTable(
    tableId: string,
    customerName: string,
    partySize: number,
    dateTime: Date
  ): Reservation | undefined {
    const table = this.tables.get(tableId)
    if (!table || table.status === 'occupied') return undefined

    const reservation: Reservation = {
      id: `res-${uuidv4().substring(0, 8)}`,
      customerName,
      customerPhone: '', // Should be passed in
      partySize,
      tableId,
      dateTime,
      duration: 90, // Default 90 minutes
      status: 'confirmed',
      createdAt: new Date()
    }

    this.reservations.set(reservation.id, reservation)
    table.reservedFor = customerName
    table.reservedAt = new Date()
    table.status = 'reserved'

    return reservation
  }

  // Create reservation without table assignment
  createReservation(data: {
    customerName: string
    customerPhone: string
    partySize: number
    dateTime: Date
    duration?: number
    notes?: string
    tableId?: string
  }): Reservation {
    const reservation: Reservation = {
      id: `res-${uuidv4().substring(0, 8)}`,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      partySize: data.partySize,
      tableId: data.tableId,
      dateTime: data.dateTime,
      duration: data.duration || 90,
      status: 'pending',
      notes: data.notes,
      createdAt: new Date()
    }

    this.reservations.set(reservation.id, reservation)

    if (data.tableId) {
      this.reserveTable(data.tableId, data.customerName, data.partySize, data.dateTime)
    }

    return reservation
  }

  // Get reservation
  getReservation(reservationId: string): Reservation | undefined {
    return this.reservations.get(reservationId)
  }

  // Get reservations for today
  getTodayReservations(): Reservation[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return Array.from(this.reservations.values()).filter(r => {
      const resDate = new Date(r.dateTime)
      return resDate >= today
    }).sort((a, b) =>
      new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    )
  }

  // Get reservations for a specific time slot
  getReservationsForTime(dateTime: Date): Reservation[] {
    const target = new Date(dateTime)
    const start = new Date(target)
    start.setMinutes(start.getMinutes() - 30)
    const end = new Date(target)
    end.setMinutes(end.getMinutes() + 30)

    return Array.from(this.reservations.values()).filter(r => {
      const resDate = new Date(r.dateTime)
      return resDate >= start && resDate <= end
    })
  }

  // Confirm reservation
  confirmReservation(reservationId: string): Reservation | undefined {
    const reservation = this.reservations.get(reservationId)
    if (!reservation) return undefined
    reservation.status = 'confirmed'
    return reservation
  }

  // Seat reservation
  seatReservation(reservationId: string): Table | undefined {
    const reservation = this.reservations.get(reservationId)
    if (!reservation || !reservation.tableId) return undefined

    const table = this.seatGuests(
      reservation.tableId,
      reservation.partySize,
      `order-${uuidv4().substring(0, 8)}` // Would be actual order ID
    )

    if (table) {
      reservation.status = 'seated'
    }

    return table
  }

  // Cancel reservation
  cancelReservation(reservationId: string): boolean {
    const reservation = this.reservations.get(reservationId)
    if (!reservation) return false

    // Free the table if assigned
    if (reservation.tableId) {
      const table = this.tables.get(reservation.tableId)
      if (table) {
        table.status = 'available'
        table.reservedFor = undefined
        table.reservedAt = undefined
      }
    }

    reservation.status = 'cancelled'
    return true
  }

  // Get table statistics
  getStats(): TableStats {
    const tables = Array.from(this.tables.values())
    const occupied = tables.filter(t => t.status === 'occupied')
    const occupiedWithTime = occupied.filter(t => t.occupiedSince)

    // Calculate average turn time (time from occupied to available)
    const turnTimes = occupiedWithTime.map(t => {
      const now = new Date()
      return (now.getTime() - t.occupiedSince!.getTime()) / 60000 // minutes
    })

    const avgTurnTime = turnTimes.length > 0
      ? turnTimes.reduce((a, b) => a + b, 0) / turnTimes.length
      : 0

    return {
      total: tables.length,
      available: tables.filter(t => t.status === 'available').length,
      occupied: occupied.length,
      reserved: tables.filter(t => t.status === 'reserved').length,
      cleaning: tables.filter(t => t.status === 'cleaning').length,
      avgTurnTime: Math.round(avgTurnTime),
      currentOccupancy: tables.length > 0
        ? Math.round((occupied.length / tables.length) * 100)
        : 0
    }
  }

  // Get section
  getSection(sectionId: string): TableSection | undefined {
    return this.sections.get(sectionId)
  }

  // Get all sections
  getAllSections(): TableSection[] {
    return Array.from(this.sections.values())
  }

  // Add section
  addSection(section: Omit<TableSection, 'tables'>): TableSection {
    const newSection: TableSection = { ...section, tables: [] }
    this.sections.set(section.id, newSection)
    return newSection
  }

  // Update table position (for floor layout)
  updateTablePosition(
    tableId: string,
    position: { x: number; y: number }
  ): Table | undefined {
    const table = this.tables.get(tableId)
    if (!table) return undefined
    table.position = position
    return table
  }

  // Find best available table for party size
  findBestTable(partySize: number): Table | undefined {
    const available = this.getAvailableTables(partySize)

    if (available.length === 0) return undefined

    // Sort by capacity (closest match first)
    available.sort((a, b) => a.capacity - b.capacity)

    return available[0]
  }
}

export const tableService = new TableService()
