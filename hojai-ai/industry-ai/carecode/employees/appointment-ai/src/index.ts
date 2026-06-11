/**
 * CARECODE - Appointment AI Employee
 * AI-powered appointment scheduling, reminders, and management
 * "AI That Never Misses a Patient"
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4854;

app.use(express.json());

// ============================================
// TYPES
// ============================================

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  duration: number; // minutes
  type: 'consultation' | 'follow-up' | 'procedure' | 'checkup' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  reason: string;
  notes?: string;
  remindersSent: number;
  lastReminder?: string;
  createdAt: string;
  updatedAt: string;
  checkInTime?: string;
  completionTime?: string;
}

interface Slot {
  doctorId: string;
  date: string;
  time: string;
  duration: number;
  available: boolean;
  appointmentId?: string;
}

interface Doctor {
  id: string;
  name: string;
  department: string;
  specialty: string;
  availableDays: string[];
  startTime: string;
  endTime: string;
  slotDuration: number; // minutes per slot
  breaks: { start: string; end: string }[];
}

interface ReminderSchedule {
  appointmentId: string;
  schedules: { time: string; sent: boolean; type: 'email' | 'sms' | 'whatsapp' }[];
}

// ============================================
// IN-MEMORY DATABASE
// ============================================

const appointments = new Map<string, Appointment>();
const slots = new Map<string, Slot>();
const doctors = new Map<string, Doctor>();
const reminderSchedules = new Map<string, ReminderSchedule>();

// Add sample doctors
const sampleDoctors: Doctor[] = [
  {
    id: 'doc-001',
    name: 'Dr. Priya Sharma',
    department: 'General Medicine',
    specialty: 'Family Medicine',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    breaks: [{ start: '13:00', end: '14:00' }]
  },
  {
    id: 'doc-002',
    name: 'Dr. Rahul Mehta',
    department: 'Cardiology',
    specialty: 'Interventional Cardiology',
    availableDays: ['Monday', 'Wednesday', 'Friday'],
    startTime: '10:00',
    endTime: '18:00',
    slotDuration: 45,
    breaks: [{ start: '13:00', end: '14:00' }]
  },
  {
    id: 'doc-003',
    name: 'Dr. Anita Patel',
    department: 'Pediatrics',
    specialty: 'General Pediatrics',
    availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
    startTime: '09:00',
    endTime: '16:00',
    slotDuration: 20,
    breaks: [{ start: '12:00', end: '13:00' }]
  }
];

sampleDoctors.forEach(doc => doctors.set(doc.id, doc));

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateTimeSlots(doctor: Doctor, date: string): Slot[] {
  const slots: Slot[] = [];
  const [startHour, startMin] = doctor.startTime.split(':').map(Number);
  const [endHour, endMin] = doctor.endTime.split(':').map(Number);

  let currentTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  while (currentTime < endTime) {
    // Check for break
    const isBreak = doctor.breaks.some(brk => {
      const [brkStartHour, brkStartMin] = brk.start.split(':').map(Number);
      const [brkEndHour, brkEndMin] = brk.end.split(':').map(Number);
      const brkStart = brkStartHour * 60 + brkStartMin;
      const brkEnd = brkEndHour * 60 + brkEndMin;
      return currentTime >= brkStart && currentTime < brkEnd;
    });

    if (!isBreak) {
      const hour = Math.floor(currentTime / 60);
      const minute = currentTime % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      slots.push({
        doctorId: doctor.id,
        date,
        time: timeStr,
        duration: doctor.slotDuration,
        available: true
      });
    }

    currentTime += doctor.slotDuration;
  }

  return slots;
}

function isSlotAvailable(doctor: Doctor, date: string, time: string): boolean {
  // Check if date is an available day
  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

  if (!doctor.availableDays.includes(dayName)) {
    return false;
  }

  // Check if time is within working hours
  const [slotHour, slotMin] = time.split(':').map(Number);
  const [startHour, startMin] = doctor.startTime.split(':').map(Number);
  const [endHour, endMin] = doctor.endTime.split(':').map(Number);

  const slotMinutes = slotHour * 60 + slotMin;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (slotMinutes < startMinutes || slotMinutes + doctor.slotDuration > endMinutes) {
    return false;
  }

  // Check for break conflict
  const isBreak = doctor.breaks.some(brk => {
    const [brkStartHour, brkStartMin] = brk.start.split(':').map(Number);
    const [brkEndHour, brkEndMin] = brk.end.split(':').map(Number);
    const brkStart = brkStartHour * 60 + brkStartMin;
    const brkEnd = brkEndHour * 60 + brkEndMin;
    return slotMinutes >= brkStart && slotMinutes < brkEnd;
  });

  if (isBreak) return false;

  // Check if already booked
  const slotKey = `${doctor.id}-${date}-${time}`;
  const existingSlot = slots.get(slotKey);
  if (existingSlot && !existingSlot.available) {
    return false;
  }

  return true;
}

function calculateNextAvailable(doctorId: string, preferredDate?: string): { date: string; time: string } | null {
  const doctor = doctors.get(doctorId);
  if (!doctor) return null;

  const startDate = preferredDate ? new Date(preferredDate) : new Date();
  const maxDaysToCheck = 14;

  for (let i = 0; i < maxDaysToCheck; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + i);

    const dateStr = checkDate.toISOString().split('T')[0];
    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });

    if (!doctor.availableDays.includes(dayName)) continue;

    const daySlots = generateTimeSlots(doctor, dateStr);
    const availableSlot = daySlots.find(slot =>
      isSlotAvailable(doctor, dateStr, slot.time)
    );

    if (availableSlot) {
      return { date: dateStr, time: availableSlot.time };
    }
  }

  return null;
}

// ============================================
// API ROUTES
// ============================================

/**
 * Get available slots
 */
app.get('/api/slots', (req: Request, res: Response) => {
  try {
    const { doctorId, date, department } = req.query;

    if (!doctorId && !department) {
      return res.status(400).json({ error: 'doctorId or department required' });
    }

    let targetDoctors = Array.from(doctors.values());

    if (doctorId) {
      targetDoctors = targetDoctors.filter(d => d.id === doctorId);
    }
    if (department) {
      targetDoctors = targetDoctors.filter(d =>
        d.department.toLowerCase() === String(department).toLowerCase()
      );
    }

    const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];

    const allSlots: Slot[] = [];
    targetDoctors.forEach(doctor => {
      const doctorSlots = generateTimeSlots(doctor, targetDate);
      doctorSlots.forEach(slot => {
        slot.available = isSlotAvailable(doctor, targetDate, slot.time);
      });
      allSlots.push(...doctorSlots);
    });

    const available = allSlots.filter(s => s.available);

    res.json({
      success: true,
      date: targetDate,
      slots: allSlots,
      availableCount: available.length,
      summary: {
        total: allSlots.length,
        available: available.length,
        booked: allSlots.length - available.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get slots' });
  }
});

/**
 * Book appointment
 */
app.post('/api/appointments', (req: Request, res: Response) => {
  try {
    const { patientId, patientName, patientPhone, doctorId, date, time, type = 'consultation', reason, notes } = req.body;

    if (!patientId || !doctorId || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields: patientId, doctorId, date, time' });
    }

    const doctor = doctors.get(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (!isSlotAvailable(doctor, date, time)) {
      return res.status(400).json({
        error: 'Slot not available',
        suggestion: calculateNextAvailable(doctorId, date)
      });
    }

    const appointment: Appointment = {
      id: `apt-${uuidv4().slice(0, 8)}`,
      patientId,
      patientName,
      patientPhone,
      doctorId,
      doctorName: doctor.name,
      department: doctor.department,
      date,
      time,
      duration: doctor.slotDuration,
      type,
      status: 'scheduled',
      reason: reason || 'General consultation',
      notes,
      remindersSent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    appointments.set(appointment.id, appointment);

    // Mark slot as booked
    const slotKey = `${doctorId}-${date}-${time}`;
    slots.set(slotKey, {
      doctorId,
      date,
      time,
      duration: doctor.slotDuration,
      available: false,
      appointmentId: appointment.id
    });

    // Schedule reminders
    scheduleReminders(appointment);

    res.status(201).json({
      success: true,
      appointment,
      message: `Appointment booked for ${patientName} with ${doctor.name}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

/**
 * Get appointment by ID
 */
app.get('/api/appointments/:id', (req: Request, res: Response) => {
  try {
    const appointment = appointments.get(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get appointment' });
  }
});

/**
 * Get appointments by patient
 */
app.get('/api/appointments/patient/:patientId', (req: Request, res: Response) => {
  try {
    const { status, upcoming } = req.query;
    let result = Array.from(appointments.values())
      .filter(a => a.patientId === req.params.patientId);

    if (status) {
      result = result.filter(a => a.status === status);
    }
    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter(a => a.date >= today && !['cancelled', 'no-show', 'completed'].includes(a.status));
    }

    result.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    res.json({
      success: true,
      appointments: result,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get appointments' });
  }
});

/**
 * Get appointments by doctor
 */
app.get('/api/appointments/doctor/:doctorId', (req: Request, res: Response) => {
  try {
    const { date, status } = req.query;
    let result = Array.from(appointments.values())
      .filter(a => a.doctorId === req.params.doctorId);

    if (date) {
      result = result.filter(a => a.date === date);
    }
    if (status) {
      result = result.filter(a => a.status === status);
    }

    result.sort((a, b) => a.time.localeCompare(b.time));

    res.json({
      success: true,
      appointments: result,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get appointments' });
  }
});

/**
 * Get daily schedule
 */
app.get('/api/schedule/:date', (req: Request, res: Response) => {
  try {
    const { doctorId, department } = req.query;
    const date = req.params.date;

    let result = Array.from(appointments.values())
      .filter(a => a.date === date);

    if (doctorId) {
      result = result.filter(a => a.doctorId === doctorId);
    }
    if (department) {
      result = result.filter(a =>
        a.department.toLowerCase() === String(department).toLowerCase()
      );
    }

    // Group by doctor
    const byDoctor = new Map<string, Appointment[]>();
    result.forEach(apt => {
      if (!byDoctor.has(apt.doctorId)) {
        byDoctor.set(apt.doctorId, []);
      }
      byDoctor.get(apt.doctorId)!.push(apt);
    });

    // Sort each doctor's appointments by time
    byDoctor.forEach((apts, docId) => {
      byDoctor.set(docId, apts.sort((a, b) => a.time.localeCompare(b.time)));
    });

    res.json({
      success: true,
      date,
      appointments: result.sort((a, b) => a.time.localeCompare(b.time)),
      byDoctor: Array.from(byDoctor.entries()).map(([doctorId, apts]) => {
        const doctor = doctors.get(doctorId);
        return {
          doctorId,
          doctorName: doctor?.name || 'Unknown',
          department: doctor?.department || 'Unknown',
          appointments: apts,
          count: apts.length
        };
      }),
      summary: {
        total: result.length,
        byStatus: {
          scheduled: result.filter(a => a.status === 'scheduled').length,
          confirmed: result.filter(a => a.status === 'confirmed').length,
          completed: result.filter(a => a.status === 'completed').length,
          cancelled: result.filter(a => a.status === 'cancelled').length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get schedule' });
  }
});

/**
 * Update appointment status
 */
app.patch('/api/appointments/:id', (req: Request, res: Response) => {
  try {
    const appointment = appointments.get(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const { status, time, date, notes } = req.body;

    if (status) {
      appointment.status = status;
      if (status === 'completed') {
        appointment.completionTime = new Date().toISOString();
      }
    }

    if (time || date) {
      const newDate = date || appointment.date;
      const newTime = time || appointment.time;

      const doctor = doctors.get(appointment.doctorId);
      if (doctor && isSlotAvailable(doctor, newDate, newTime)) {
        appointment.date = newDate;
        appointment.time = newTime;

        // Update slot
        const oldSlotKey = `${appointment.doctorId}-${appointment.date}-${appointment.time}`;
        const newSlotKey = `${appointment.doctorId}-${newDate}-${newTime}`;
        slots.delete(oldSlotKey);
        slots.set(newSlotKey, {
          doctorId: appointment.doctorId,
          date: newDate,
          time: newTime,
          duration: doctor.slotDuration,
          available: false,
          appointmentId: appointment.id
        });
      }
    }

    if (notes) {
      appointment.notes = notes;
    }

    appointment.updatedAt = new Date().toISOString();
    appointments.set(appointment.id, appointment);

    res.json({
      success: true,
      appointment,
      message: `Appointment ${status ? `status updated to ${status}` : 'updated'}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

/**
 * Cancel appointment
 */
app.post('/api/appointments/:id/cancel', (req: Request, res: Response) => {
  try {
    const appointment = appointments.get(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.status = 'cancelled';
    appointment.updatedAt = new Date().toISOString();
    appointments.set(appointment.id, appointment);

    // Free up the slot
    const slotKey = `${appointment.doctorId}-${appointment.date}-${appointment.time}`;
    const slot = slots.get(slotKey);
    if (slot) {
      slot.available = true;
      delete slot.appointmentId;
    }

    res.json({
      success: true,
      appointment,
      message: 'Appointment cancelled'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

/**
 * Check in patient
 */
app.post('/api/appointments/:id/checkin', (req: Request, res: Response) => {
  try {
    const appointment = appointments.get(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot check in - appointment cancelled' });
    }

    appointment.status = 'checked-in';
    appointment.checkInTime = new Date().toISOString();
    appointment.updatedAt = new Date().toISOString();
    appointments.set(appointment.id, appointment);

    res.json({
      success: true,
      appointment,
      message: `Patient ${appointment.patientName} checked in`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check in' });
  }
});

/**
 * Reschedule appointment
 */
app.post('/api/appointments/:id/reschedule', (req: Request, res: Response) => {
  try {
    const { newDate, newTime } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({ error: 'newDate and newTime required' });
    }

    const appointment = appointments.get(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const doctor = doctors.get(appointment.doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (!isSlotAvailable(doctor, newDate, newTime)) {
      return res.status(400).json({
        error: 'Requested slot not available',
        suggestion: calculateNextAvailable(appointment.doctorId, newDate)
      });
    }

    // Free old slot
    const oldSlotKey = `${appointment.doctorId}-${appointment.date}-${appointment.time}`;
    slots.delete(oldSlotKey);

    // Book new slot
    const newSlotKey = `${appointment.doctorId}-${newDate}-${newTime}`;
    slots.set(newSlotKey, {
      doctorId: appointment.doctorId,
      date: newDate,
      time: newTime,
      duration: doctor.slotDuration,
      available: false,
      appointmentId: appointment.id
    });

    appointment.date = newDate;
    appointment.time = newTime;
    appointment.status = 'scheduled';
    appointment.updatedAt = new Date().toISOString();
    appointments.set(appointment.id, appointment);

    res.json({
      success: true,
      appointment,
      message: `Appointment rescheduled to ${newDate} at ${newTime}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reschedule' });
  }
});

/**
 * Send reminder
 */
app.post('/api/appointments/:id/remind', (req: Request, res: Response) => {
  try {
    const { type = 'sms' } = req.body;

    const appointment = appointments.get(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.remindersSent++;
    appointment.lastReminder = new Date().toISOString();
    appointment.updatedAt = new Date().toISOString();
    appointments.set(appointment.id, appointment);

    console.log(`[${new Date().toISOString()}] Reminder sent: ${type} to ${appointment.patientPhone}`);
    console.log(`  Appointment: ${appointment.patientName} with ${appointment.doctorName}`);
    console.log(`  Date: ${appointment.date} at ${appointment.time}`);

    res.json({
      success: true,
      reminder: {
        type,
        sentTo: appointment.patientPhone,
        appointmentId: appointment.id,
        sentAt: appointment.lastReminder
      },
      message: `Reminder sent via ${type}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});

/**
 * Get doctors
 */
app.get('/api/doctors', (req: Request, res: Response) => {
  try {
    const { department, specialty } = req.query;
    let result = Array.from(doctors.values());

    if (department) {
      result = result.filter(d =>
        d.department.toLowerCase().includes(String(department).toLowerCase())
      );
    }
    if (specialty) {
      result = result.filter(d =>
        d.specialty.toLowerCase().includes(String(specialty).toLowerCase())
      );
    }

    res.json({
      success: true,
      doctors: result,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get doctors' });
  }
});

/**
 * Get no-show report
 */
app.get('/api/reports/no-show', (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    let result = Array.from(appointments.values())
      .filter(a => a.status === 'no-show');

    if (startDate) {
      result = result.filter(a => a.date >= String(startDate));
    }
    if (endDate) {
      result = result.filter(a => a.date <= String(endDate));
    }

    const noShowRate = appointments.size > 0
      ? Math.round((result.length / appointments.size) * 100)
      : 0;

    res.json({
      success: true,
      noShows: result,
      totalAppointments: appointments.size,
      noShowRate: `${noShowRate}%`,
      byDoctor: Array.from(new Set(result.map(a => a.doctorId))).map(docId => {
        const docNoShows = result.filter(a => a.doctorId === docId);
        const docTotal = Array.from(appointments.values()).filter(a => a.doctorId === docId);
        const doctor = doctors.get(docId);
        return {
          doctorId: docId,
          doctorName: doctor?.name || 'Unknown',
          noShows: docNoShows.length,
          total: docTotal.length,
          rate: docTotal.length > 0 ? Math.round((docNoShows.length / docTotal.length) * 100) : 0
        };
      })
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get report' });
  }
});

// ============================================
// REMINDER SCHEDULING
// ============================================

function scheduleReminders(appointment: Appointment): void {
  const schedules: ReminderSchedule['schedules'] = [];

  // 24 hours before
  const dayBefore = new Date(appointment.date);
  dayBefore.setDate(dayBefore.getDate() - 1);
  schedules.push({
    time: `${dayBefore.toISOString().split('T')[0]} 10:00`,
    sent: false,
    type: 'sms'
  });

  // 2 hours before
  const twoHoursBefore = new Date(`${appointment.date}T${appointment.time}`);
  twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);
  schedules.push({
    time: twoHoursBefore.toISOString(),
    sent: false,
    type: 'sms'
  });

  reminderSchedules.set(appointment.id, {
    appointmentId: appointment.id,
    schedules
  });
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = Array.from(appointments.values()).filter(a => a.date === today);

  res.json({
    status: 'healthy',
    service: 'appointment-ai',
    version: '1.0.0',
    port: PORT,
    capabilities: [
      'Appointment scheduling',
      'Slot management',
      'Reminders',
      'Rescheduling',
      'Check-in'
    ],
    stats: {
      totalAppointments: appointments.size,
      todayAppointments: todayAppointments.length,
      doctorsCount: doctors.size,
      confirmedToday: todayAppointments.filter(a => a.status === 'confirmed' || a.status === 'checked-in').length
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CARECODE Appointment AI',
    description: 'AI-powered appointment scheduling and management',
    version: '1.0.0',
    endpoints: {
      slots: 'GET /api/slots',
      book: 'POST /api/appointments',
      get: 'GET /api/appointments/:id',
      patient: 'GET /api/appointments/patient/:patientId',
      doctor: 'GET /api/appointments/doctor/:doctorId',
      schedule: 'GET /api/schedule/:date',
      reschedule: 'POST /api/appointments/:id/reschedule',
      checkin: 'POST /api/appointments/:id/checkin',
      remind: 'POST /api/appointments/:id/remind',
      doctors: 'GET /api/doctors'
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              CARECODE APPOINTMENT AI v1.0.0             ║
║                                                         ║
║  Tagline: "AI That Never Misses a Patient"            ║
║  Port: ${PORT}                                               ║
║                                                         ║
║  Capabilities:                                         ║
║  • Smart Slot Availability                             ║
║  • Appointment Scheduling                              ║
║  • Automated Reminders                                 ║
║  • Check-in Management                                 ║
║  • Rescheduling                                        ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export { app, appointments, doctors, isSlotAvailable };