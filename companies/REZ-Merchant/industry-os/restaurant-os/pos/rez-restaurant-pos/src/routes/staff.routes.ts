/**
 * Staff API Routes
 * Employee management, shifts, attendance, payroll
 */

import { Router, Request, Response } from 'express'
import { staffService } from '../services/StaffService.js'

const router = Router()

// Get all staff
router.get('/', (req: Request, res: Response) => {
  const { role, includeInactive } = req.query

  let staff = staffService.getAllStaff(includeInactive === 'true')

  if (role) {
    staff = staff.filter(s => s.role === role)
  }

  res.json({ success: true, data: staff })
})

// Get single staff
router.get('/:id', (req: Request, res: Response) => {
  const staff = staffService.getStaff(req.params.id)

  if (!staff) {
    return res.status(404).json({ success: false, error: 'Staff not found' })
  }

  res.json({ success: true, data: staff })
})

// Add staff
router.post('/', (req: Request, res: Response) => {
  const { name, phone, email, role, hireDate, salary, permissions, emergencyContact } = req.body

  if (!name || !phone || !role) {
    return res.status(400).json({ success: false, error: 'Name, phone, and role required' })
  }

  const staff = staffService.addStaff({
    name,
    phone,
    email,
    role,
    hireDate: hireDate ? new Date(hireDate) : new Date(),
    salary: salary || 0,
    permissions,
    emergencyContact
  })

  res.status(201).json({ success: true, data: staff })
})

// Update staff
router.patch('/:id', (req: Request, res: Response) => {
  const staff = staffService.updateStaff(req.params.id, req.body)

  if (!staff) {
    return res.status(404).json({ success: false, error: 'Staff not found' })
  }

  res.json({ success: true, data: staff })
})

// Deactivate staff
router.post('/:id/deactivate', (req: Request, res: Response) => {
  const success = staffService.deactivateStaff(req.params.id)

  if (!success) {
    return res.status(404).json({ success: false, error: 'Staff not found' })
  }

  res.json({ success: true })
})

// Set PIN
router.post('/:id/pin', (req: Request, res: Response) => {
  const { pin } = req.body

  if (!pin || pin.length !== 4) {
    return res.status(400).json({ success: false, error: 'PIN must be 4 digits' })
  }

  const success = staffService.setPin(req.params.id, pin)

  if (!success) {
    return res.status(404).json({ success: false, error: 'Staff not found' })
  }

  res.json({ success: true })
})

// Verify PIN
router.post('/:id/verify-pin', (req: Request, res: Response) => {
  const { pin } = req.body

  if (!pin) {
    return res.status(400).json({ success: false, error: 'PIN required' })
  }

  const valid = staffService.verifyPin(req.params.id, pin)
  res.json({ success: true, data: { valid } })
})

// ============ SHIFTS ============

// Schedule shift
router.post('/:id/shifts', (req: Request, res: Response) => {
  const { date, startTime, endTime, breakMinutes, notes } = req.body

  if (!date || !startTime || !endTime) {
    return res.status(400).json({ success: false, error: 'date, startTime, and endTime required' })
  }

  const shift = staffService.scheduleShift({
    staffId: req.params.id,
    date: new Date(date),
    startTime,
    endTime,
    breakMinutes,
    notes
  })

  if (!shift) {
    return res.status(404).json({ success: false, error: 'Staff not found' })
  }

  res.status(201).json({ success: true, data: shift })
})

// Get staff shifts
router.get('/:id/shifts', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query

  const shifts = staffService.getStaffShifts(
    req.params.id,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  )

  res.json({ success: true, data: shifts })
})

// Check in
router.post('/shifts/:shiftId/checkin', (req: Request, res: Response) => {
  const shift = staffService.checkIn(req.params.shiftId)

  if (!shift) {
    return res.status(404).json({ success: false, error: 'Shift not found or already checked in' })
  }

  res.json({ success: true, data: shift })
})

// Check out
router.post('/shifts/:shiftId/checkout', (req: Request, res: Response) => {
  const shift = staffService.checkOut(req.params.shiftId)

  if (!shift) {
    return res.status(404).json({ success: false, error: 'Shift not found or not checked in' })
  }

  res.json({ success: true, data: shift })
})

// Get day shifts
router.get('/shifts/day/:date', (req: Request, res: Response) => {
  const shifts = staffService.getDayShifts(new Date(req.params.date))
  res.json({ success: true, data: shifts })
})

// ============ ATTENDANCE ============

// Get attendance
router.get('/:id/attendance', (req: Request, res: Response) => {
  const { date } = req.query

  if (!date) {
    return res.status(400).json({ success: false, error: 'date required' })
  }

  const attendance = staffService.getAttendance(req.params.id, new Date(date as string))

  if (!attendance) {
    return res.status(404).json({ success: false, error: 'No attendance record found' })
  }

  res.json({ success: true, data: attendance })
})

// Mark attendance
router.post('/:id/attendance', (req: Request, res: Response) => {
  const { date, status, notes } = req.body

  if (!date || !status) {
    return res.status(400).json({ success: false, error: 'date and status required' })
  }

  const attendance = staffService.markAttendance(req.params.id, new Date(date), status, notes)
  res.status(201).json({ success: true, data: attendance })
})

// Get monthly attendance
router.get('/:id/attendance/monthly', (req: Request, res: Response) => {
  const { year, month } = req.query

  if (!year || !month) {
    return res.status(400).json({ success: false, error: 'year and month required' })
  }

  const attendance = staffService.getMonthlyAttendance(
    req.params.id,
    parseInt(year as string),
    parseInt(month as string)
  )

  res.json({ success: true, data: attendance })
})

// ============ PAYROLL ============

// Calculate payroll
router.post('/:id/payroll', (req: Request, res: Response) => {
  const { startDate, endDate } = req.body

  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, error: 'startDate and endDate required' })
  }

  try {
    const payroll = staffService.calculatePayroll(
      req.params.id,
      new Date(startDate),
      new Date(endDate)
    )
    res.status(201).json({ success: true, data: payroll })
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message })
  }
})

// Get payroll history
router.get('/:id/payroll', (req: Request, res: Response) => {
  const payroll = staffService.getStaffPayroll(req.params.id)
  res.json({ success: true, data: payroll })
})

// Mark payroll as paid
router.post('/payroll/:payrollId/paid', (req: Request, res: Response) => {
  const payroll = staffService.markPayrollPaid(req.params.payrollId)

  if (!payroll) {
    return res.status(404).json({ success: false, error: 'Payroll not found' })
  }

  res.json({ success: true, data: payroll })
})

// ============ STAFFING ============

// Get staffing summary
router.get('/summary/staffing', (req: Request, res: Response) => {
  const summary = staffService.getStaffingSummary()
  res.json({ success: true, data: summary })
})

// Get upcoming shifts
router.get('/shifts/upcoming', (req: Request, res: Response) => {
  const { days } = req.query
  const shifts = staffService.getUpcomingShifts(days ? parseInt(days as string) : 7)
  res.json({ success: true, data: shifts })
})

// Get daily staffing
router.get('/staffing/daily', (req: Request, res: Response) => {
  const { date, required } = req.query
  const staffing = staffService.getDailyStaffing(
    new Date(date as string || new Date()),
    required ? parseInt(required as string) : 5
  )
  res.json({ success: true, data: staffing })
})

// Get weekly staffing
router.get('/staffing/weekly', (req: Request, res: Response) => {
  const { startDate } = req.query
  const staffing = staffService.getWeeklyStaffing(
    startDate ? new Date(startDate as string) : new Date()
  )
  res.json({ success: true, data: staffing })
})

export default router
