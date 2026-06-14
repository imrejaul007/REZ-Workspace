/**
 * Staff Management Service
 * Employee management, shifts, attendance, and payroll
 */

import { v4 as uuidv4 } from 'uuid'

export type Role = 'owner' | 'manager' | 'captain' | 'server' | 'chef' | 'kitchen' | 'helper' | 'cashier'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave'

export type ShiftStatus = 'scheduled' | 'in_progress' | 'completed' | 'missed'

export interface Staff {
  id: string
  employeeId: string
  name: string
  phone: string
  email?: string
  role: Role
  department?: string
  hireDate: Date
  salary: number
  isActive: boolean
  pin?: string // For attendance
  permissions: string[]
  emergencyContact?: {
    name: string
    phone: string
    relation: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Shift {
  id: string
  staffId: string
  date: Date
  startTime: string // HH:mm
  endTime: string // HH:mm
  breakMinutes: number
  status: ShiftStatus
  checkIn?: Date
  checkOut?: Date
  breakTaken: number // actual minutes
  notes?: string
}

export interface Attendance {
  id: string
  staffId: string
  date: Date
  status: AttendanceStatus
  shifts: Shift[]
  totalHours: number
  overtimeHours: number
  notes?: string
}

export interface PayrollPeriod {
  id: string
  startDate: Date
  endDate: Date
  staffId: string
  shifts: number
  hours: number
  overtimeHours: number
  baseSalary: number
  overtimePay: number
  bonuses: number
  deductions: number
  advances: number
  netPay: number
  status: 'pending' | 'processed' | 'paid'
  processedAt?: Date
  paidAt?: Date
}

export interface DailyStaffing {
  date: Date
  required: number
  scheduled: number
  checkedIn: number
  gaps: number
}

export class StaffService {
  private staff: Map<string, Staff> = new Map()
  private shifts: Map<string, Shift> = new Map()
  private attendance: Map<string, Attendance> = new Map()
  private payroll: Map<string, PayrollPeriod> = new Map()

  constructor() {
    this.initializeDefaultStaff()
  }

  private initializeDefaultStaff(): void {
    this.addStaff({
      name: 'Rajesh Kumar',
      phone: '+919876543210',
      role: 'owner',
      hireDate: new Date('2020-01-01'),
      salary: 50000,
      permissions: ['all']
    })

    this.addStaff({
      name: 'Priya Sharma',
      phone: '+919876543211',
      role: 'manager',
      hireDate: new Date('2021-03-15'),
      salary: 35000,
      permissions: ['orders', 'staff', 'reports']
    })

    this.addStaff({
      name: 'Amit Singh',
      phone: '+919876543212',
      role: 'chef',
      hireDate: new Date('2021-06-01'),
      salary: 25000,
      permissions: ['kds']
    })

    this.addStaff({
      name: 'Sunita Devi',
      phone: '+919876543213',
      role: 'server',
      hireDate: new Date('2022-01-10'),
      salary: 15000,
      permissions: ['orders']
    })
  }

  // ============ STAFF ============

  addStaff(data: Omit<Staff, 'id' | 'employeeId' | 'isActive' | 'createdAt' | 'updatedAt'>): Staff {
    const id = `staff-${uuidv4().substring(0, 8)}`
    const employeeId = `EMP${String(this.staff.size + 1).padStart(4, '0')}`

    const staff: Staff = {
      ...data,
      id,
      employeeId,
      isActive: true,
      permissions: data.permissions || this.getDefaultPermissions(data.role),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.staff.set(id, staff)
    return staff
  }

  updateStaff(id: string, updates: Partial<Staff>): Staff | undefined {
    const staff = this.staff.get(id)
    if (!staff) return undefined

    const updated = {
      ...staff,
      ...updates,
      id: staff.id, // Don't allow ID change
      employeeId: staff.employeeId,
      updatedAt: new Date()
    }

    this.staff.set(id, updated)
    return updated
  }

  getStaff(id: string): Staff | undefined {
    return this.staff.get(id)
  }

  getAllStaff(includeInactive = false): Staff[] {
    return Array.from(this.staff.values()).filter(
      s => includeInactive || s.isActive
    )
  }

  getStaffByRole(role: Role): Staff[] {
    return this.getAllStaff().filter(s => s.role === role)
  }

  deactivateStaff(id: string): boolean {
    const staff = this.staff.get(id)
    if (!staff) return false
    staff.isActive = false
    staff.updatedAt = new Date()
    return true
  }

  setPin(staffId: string, pin: string): boolean {
    const staff = this.staff.get(staffId)
    if (!staff) return false
    staff.pin = pin
    staff.updatedAt = new Date()
    return true
  }

  verifyPin(staffId: string, pin: string): boolean {
    const staff = this.staff.get(staffId)
    return !!staff && staff.pin === pin
  }

  // ============ SHIFTS ============

  scheduleShift(data: {
    staffId: string
    date: Date
    startTime: string
    endTime: string
    breakMinutes?: number
    notes?: string
  }): Shift | undefined {
    const staff = this.staff.get(data.staffId)
    if (!staff) return undefined

    const id = `shift-${uuidv4().substring(0, 8)}`

    const shift: Shift = {
      id,
      staffId: data.staffId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      breakMinutes: data.breakMinutes || 30,
      status: 'scheduled',
      breakTaken: 0,
      notes: data.notes
    }

    this.shifts.set(id, shift)
    return shift
  }

  getShift(id: string): Shift | undefined {
    return this.shifts.get(id)
  }

  getStaffShifts(staffId: string, startDate?: Date, endDate?: Date): Shift[] {
    return Array.from(this.shifts.values()).filter(s => {
      if (s.staffId !== staffId) return false
      if (startDate && s.date < startDate) return false
      if (endDate && s.date > endDate) return false
      return true
    })
  }

  getDayShifts(date: Date): Shift[] {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    return Array.from(this.shifts.values()).filter(s => {
      const shiftDate = new Date(s.date)
      return shiftDate >= dayStart && shiftDate <= dayEnd
    })
  }

  checkIn(shiftId: string): Shift | undefined {
    const shift = this.shifts.get(shiftId)
    if (!shift || shift.status !== 'scheduled') return undefined

    const now = new Date()
    const shiftStart = this.parseTime(shift.startTime, shift.date)

    shift.checkIn = now
    shift.status = 'in_progress'

    // Check if late
    if (now > shiftStart) {
      shift.notes = (shift.notes || '') + ' [LATE]'
    }

    return shift
  }

  checkOut(shiftId: string): Shift | undefined {
    const shift = this.shifts.get(shiftId)
    if (!shift || shift.status !== 'in_progress' || !shift.checkIn) return undefined

    shift.checkOut = new Date()
    shift.status = 'completed'

    // Calculate break taken
    const start = shift.checkIn.getTime()
    const end = shift.checkOut.getTime()
    const totalMinutes = (end - start) / 60000
    shift.breakTaken = shift.breakMinutes // Simplified

    return shift
  }

  // ============ ATTENDANCE ============

  getAttendance(staffId: string, date: Date): Attendance | undefined {
    const key = `${staffId}-${this.formatDate(date)}`
    return this.attendance.get(key)
  }

  markAttendance(
    staffId: string,
    date: Date,
    status: AttendanceStatus,
    notes?: string
  ): Attendance {
    const key = `${staffId}-${this.formatDate(date)}`
    const shifts = this.getStaffShifts(staffId, date, date)

    // Calculate hours
    let totalHours = 0
    let overtimeHours = 0

    for (const shift of shifts) {
      if (shift.status === 'completed' && shift.checkIn && shift.checkOut) {
        const minutes = (shift.checkOut.getTime() - shift.checkIn.getTime()) / 60000 - shift.breakTaken
        const hours = minutes / 60
        totalHours += hours

        // Overtime after 8 hours
        if (hours > 8) {
          overtimeHours += hours - 8
        }
      }
    }

    const attendance: Attendance = {
      id: `att-${uuidv4().substring(0, 8)}`,
      staffId,
      date,
      status,
      shifts,
      totalHours,
      overtimeHours,
      notes
    }

    this.attendance.set(key, attendance)
    return attendance
  }

  getMonthlyAttendance(staffId: string, year: number, month: number): Attendance[] {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)

    const results: Attendance[] = []

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const attendance = this.getAttendance(staffId, d)
      if (attendance) {
        results.push(attendance)
      }
    }

    return results
  }

  // ============ PAYROLL ============

  calculatePayroll(staffId: string, startDate: Date, endDate: Date): PayrollPeriod {
    const staff = this.staff.get(staffId)
    if (!staff) throw new Error('Staff not found')

    const shifts = this.getStaffShifts(staffId, startDate, endDate)
      .filter(s => s.status === 'completed')

    let totalHours = 0
    let overtimeHours = 0

    for (const shift of shifts) {
      if (shift.checkIn && shift.checkOut) {
        const minutes = (shift.checkOut.getTime() - shift.checkIn.getTime()) / 60000 - shift.breakTaken
        const hours = minutes / 60
        totalHours += hours
        if (hours > 8) overtimeHours += hours - 8
      }
    }

    const dailyRate = staff.salary / 26 // Assuming 26 working days
    const hourlyRate = dailyRate / 8
    const overtimeRate = hourlyRate * 1.5

    const baseSalary = Math.round(dailyRate * shifts.length * 100) / 100
    const overtimePay = Math.round(overtimeHours * overtimeRate * 100) / 100

    const payroll: PayrollPeriod = {
      id: `pay-${uuidv4().substring(0, 8)}`,
      startDate,
      endDate,
      staffId,
      shifts: shifts.length,
      hours: Math.round(totalHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      baseSalary,
      overtimePay,
      bonuses: 0,
      deductions: 0,
      advances: 0,
      netPay: baseSalary + overtimePay,
      status: 'pending'
    }

    this.payroll.set(payroll.id, payroll)
    return payroll
  }

  getPayroll(id: string): PayrollPeriod | undefined {
    return this.payroll.get(id)
  }

  getStaffPayroll(staffId: string): PayrollPeriod[] {
    return Array.from(this.payroll.values())
      .filter(p => p.staffId === staffId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
  }

  markPayrollPaid(id: string): PayrollPeriod | undefined {
    const payroll = this.payroll.get(id)
    if (!payroll) return undefined

    payroll.status = 'paid'
    payroll.paidAt = new Date()
    return payroll
  }

  // ============ STAFFING ============

  getDailyStaffing(date: Date, required: number): DailyStaffing {
    const shifts = this.getDayShifts(date)
    const scheduled = shifts.length
    const checkedIn = shifts.filter(s => s.status === 'in_progress' || s.status === 'completed').length

    return {
      date,
      required,
      scheduled,
      checkedIn,
      gaps: Math.max(0, required - checkedIn)
    }
  }

  getWeeklyStaffing(startDate: Date): DailyStaffing[] {
    const result: DailyStaffing[] = []
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      result.push(this.getDailyStaffing(new Date(d), 5)) // Required 5 staff per day
    }

    return result
  }

  // ============ HELPERS ============

  private getDefaultPermissions(role: Role): string[] {
    const base = ['view:own_schedule']

    switch (role) {
      case 'owner':
        return ['all']
      case 'manager':
        return ['manage:staff', 'manage:shifts', 'view:payroll', 'view:reports', ...base]
      case 'captain':
        return ['manage:orders', 'view:reports', ...base]
      case 'server':
        return ['view:orders', 'manage:own_orders', ...base]
      case 'chef':
      case 'kitchen':
        return ['view:kds', 'manage:kds', ...base]
      case 'cashier':
        return ['view:pos', 'manage:pos', 'view:reports', ...base]
      case 'helper':
        return ['view:orders', ...base]
      default:
        return base
    }
  }

  private parseTime(time: string, date: Date): Date {
    const [hours, minutes] = time.split(':').map(Number)
    const result = new Date(date)
    result.setHours(hours || 0, minutes || 0, 0, 0)
    return result
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  // Get staff count by role
  getStaffingSummary(): Record<Role, number> {
    const summary: Record<Role, number> = {
      owner: 0, manager: 0, captain: 0, server: 0,
      chef: 0, kitchen: 0, helper: 0, cashier: 0
    }

    for (const staff of this.getAllStaff()) {
      summary[staff.role]++
    }

    return summary
  }

  // Get upcoming shifts for next N days
  getUpcomingShifts(days = 7): Shift[] {
    const now = new Date()
    const end = new Date(now)
    end.setDate(end.getDate() + days)

    return Array.from(this.shifts.values())
      .filter(s => s.status === 'scheduled' && new Date(s.date) >= now && new Date(s.date) <= end)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }
}

export const staffService = new StaffService()
