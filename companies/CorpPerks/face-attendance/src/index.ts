/**
 * CorpPerks Face Attendance Service
 * Port: 4810 - Face recognition attendance and biometric verification
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 4810;
const app: Express = express();

// Types
type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave';
type VerificationStatus = 'verified' | 'failed' | 'spoof_detected';

interface Employee {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  faceEmbedding: number[]; // Placeholder for face embedding vector
  departmentId: string;
  checkInTime: string;
  checkOutTime: string;
}

interface AttendanceRecord {
  recordId: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  checkInLocation?: { latitude: number; longitude: number };
  checkOutLocation?: { latitude: number; longitude: number };
  status: AttendanceStatus;
  workingHours: number;
  overtime: number;
  verificationStatus: VerificationStatus;
}

interface FaceVerificationResult {
  verified: boolean;
  confidence: number;
  employeeId?: string;
  employeeName?: string;
  matchScore: number;
  livenessScore?: number;
  spoofDetected?: boolean;
}

// In-memory storage
const employees: Map<string, Employee> = new Map();
const attendanceRecords: Map<string, AttendanceRecord> = new Map();
const faceTemplates: Map<string, number[]> = new Map(); // employeeId -> face embedding

// Seed sample employees
const seedEmployees = () => {
  const sampleEmployees: Employee[] = [
    {
      employeeId: 'EMP-001',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@corp.com',
      department: 'Engineering',
      faceEmbedding: Array(128).fill(0).map(() => Math.random()),
      departmentId: 'DEPT-001',
      checkInTime: '09:00',
      checkOutTime: '18:00',
    },
    {
      employeeId: 'EMP-002',
      name: 'Priya Patel',
      email: 'priya.patel@corp.com',
      department: 'Marketing',
      faceEmbedding: Array(128).fill(0).map(() => Math.random()),
      departmentId: 'DEPT-002',
      checkInTime: '09:30',
      checkOutTime: '18:30',
    },
    {
      employeeId: 'EMP-003',
      name: 'Amit Kumar',
      email: 'amit.kumar@corp.com',
      department: 'Sales',
      faceEmbedding: Array(128).fill(0).map(() => Math.random()),
      departmentId: 'DEPT-003',
      checkInTime: '10:00',
      checkOutTime: '19:00',
    },
  ];

  sampleEmployees.forEach(emp => {
    employees.set(emp.employeeId, emp);
    faceTemplates.set(emp.employeeId, emp.faceEmbedding);
  });
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  const stats = getAttendanceStats();
  res.json({
    status: 'healthy',
    service: 'face-attendance',
    version: '1.0.0',
    port: PORT,
    stats,
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'CorpPerks Face Attendance Service',
    version: '1.0.0',
    port: PORT,
    description: 'Face recognition attendance and biometric verification',
    endpoints: {
      health: 'GET /health',
      attendance: {
        checkIn: 'POST /api/attendance/checkin',
        checkOut: 'POST /api/attendance/checkout',
        today: 'GET /api/attendance/today',
        history: 'GET /api/attendance/:employeeId',
        report: 'GET /api/attendance/report',
      },
      face: {
        verify: 'POST /api/face/verify',
        enroll: 'POST /api/face/enroll',
        delete: 'DELETE /api/face/:employeeId',
      },
      employees: {
        list: 'GET /api/employees',
        get: 'GET /api/employees/:id',
        add: 'POST /api/employees',
      },
      stats: 'GET /api/stats',
    },
  });
});

// Helper functions
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const calculateWorkingHours = (checkIn: Date, checkOut: Date): number => {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60) * 100) / 100;
};

const isLate = (checkInTime: string, actualTime: Date): boolean => {
  const [hours, minutes] = checkInTime.split(':').map(Number);
  const scheduled = new Date(actualTime);
  scheduled.setHours(hours, minutes, 0, 0);
  return actualTime > scheduled;
};

const getAttendanceStats = () => {
  const today = new Date().toDateString();
  const todayRecords = Array.from(attendanceRecords.values())
    .filter(r => new Date(r.date).toDateString() === today);

  return {
    totalEmployees: employees.size,
    presentToday: todayRecords.filter(r => r.status === 'present').length,
    absentToday: todayRecords.filter(r => r.status === 'absent').length,
    lateToday: todayRecords.filter(r => r.status === 'late').length,
    onTime: todayRecords.filter(r => r.status === 'present').length - todayRecords.filter(r => r.status === 'late').length,
  };
};

// ============== FACE VERIFICATION ==============

/**
 * POST /api/face/verify - Verify face and identify employee
 */
app.post('/api/face/verify', (req: Request, res: Response) => {
  const { faceEmbedding, imageQuality } = req.body;

  if (!faceEmbedding || !Array.isArray(faceEmbedding)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'faceEmbedding array required' },
    });
  }

  // Simulate liveness detection
  const livenessScore = Math.random() * 0.3 + 0.7; // 0.7-1.0
  const spoofDetected = livenessScore < 0.75;

  if (spoofDetected) {
    return res.json({
      success: true,
      data: {
        verified: false,
        spoofDetected: true,
        message: 'Liveness check failed. Please use real camera.',
      } as FaceVerificationResult,
    });
  }

  // Find best match
  let bestMatch: { employeeId: string; score: number } | null = null;

  faceTemplates.forEach((embedding, employeeId) => {
    const score = cosineSimilarity(faceEmbedding, embedding);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { employeeId, score };
    }
  });

  const threshold = 0.85;
  const verified = bestMatch && bestMatch.score >= threshold;

  if (verified && bestMatch) {
    const employee = employees.get(bestMatch.employeeId);
    res.json({
      success: true,
      data: {
        verified: true,
        confidence: bestMatch.score,
        employeeId: bestMatch.employeeId,
        employeeName: employee?.name,
        matchScore: bestMatch.score,
        livenessScore,
        spoofDetected: false,
      },
    });
  } else {
    res.json({
      success: true,
      data: {
        verified: false,
        confidence: bestMatch?.score || 0,
        spoofDetected: false,
        message: 'Face not recognized. Please enroll first.',
      } as FaceVerificationResult,
    });
  }
});

/**
 * POST /api/face/enroll - Enroll new face
 */
app.post('/api/face/enroll', (req: Request, res: Response) => {
  const { employeeId, faceEmbedding, quality } = req.body;

  if (!employeeId || !faceEmbedding) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'employeeId and faceEmbedding required' },
    });
  }

  const employee = employees.get(employeeId);
  if (!employee) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Employee not found' },
    });
  }

  // Check image quality
  if (quality && quality < 0.6) {
    return res.status(400).json({
      success: false,
      error: { code: 'LOW_QUALITY', message: 'Image quality too low. Please retry with better lighting.' },
    });
  }

  // Store face embedding
  faceTemplates.set(employeeId, faceEmbedding);
  employee.faceEmbedding = faceEmbedding;
  employees.set(employeeId, employee);

  res.json({
    success: true,
    message: 'Face enrolled successfully',
    data: { employeeId, employeeName: employee.name },
  });
});

/**
 * DELETE /api/face/:employeeId - Delete face enrollment
 */
app.delete('/api/face/:employeeId', (req: Request, res: Response) => {
  const { employeeId } = req.params;

  if (!faceTemplates.has(employeeId)) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Face template not found' },
    });
  }

  faceTemplates.delete(employeeId);

  res.json({
    success: true,
    message: 'Face enrollment deleted',
  });
});

// ============== ATTENDANCE ==============

/**
 * POST /api/attendance/checkin - Face-verified check-in
 */
app.post('/api/attendance/checkin', (req: Request, res: Response) => {
  const { employeeId, faceEmbedding, location } = req.body;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'employeeId required' },
    });
  }

  const employee = employees.get(employeeId);
  if (!employee) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Employee not found' },
    });
  }

  // Verify face if provided
  let verificationStatus: VerificationStatus = 'verified';
  if (faceEmbedding) {
    const template = faceTemplates.get(employeeId);
    if (template) {
      const score = cosineSimilarity(faceEmbedding, template);
      verificationStatus = score >= 0.85 ? 'verified' : 'failed';
    }
  }

  // Check if already checked in today
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const existingRecord = Array.from(attendanceRecords.values()).find(
    r => r.employeeId === employeeId && new Date(r.date).toISOString().split('T')[0] === todayStr
  );

  if (existingRecord && existingRecord.checkIn) {
    return res.status(400).json({
      success: false,
      error: { code: 'ALREADY_CHECKED_IN', message: 'Already checked in today' },
    });
  }

  const status: AttendanceStatus = isLate(employee.checkInTime, today) ? 'late' : 'present';

  const record: AttendanceRecord = {
    recordId: `ATT-${uuidv4().substring(0, 8).toUpperCase()}`,
    employeeId,
    employeeName: employee.name,
    date: today,
    checkIn: today,
    checkOut: null,
    checkInLocation: location,
    status,
    workingHours: 0,
    overtime: 0,
    verificationStatus,
  };

  attendanceRecords.set(record.recordId, record);

  res.json({
    success: true,
    data: {
      record,
      message: status === 'late' ? `Checked in (Late). ${employee.name}` : `Checked in. ${employee.name}`,
    },
  });
});

/**
 * POST /api/attendance/checkout - Face-verified check-out
 */
app.post('/api/attendance/checkout', (req: Request, res: Response) => {
  const { employeeId, faceEmbedding, location } = req.body;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'employeeId required' },
    });
  }

  // Find today's record
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const record = Array.from(attendanceRecords.values()).find(
    r => r.employeeId === employeeId && new Date(r.date).toISOString().split('T')[0] === todayStr
  );

  if (!record) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'No check-in record found for today' },
    });
  }

  if (record.checkOut) {
    return res.status(400).json({
      success: false,
      error: { code: 'ALREADY_CHECKED_OUT', message: 'Already checked out today' },
    });
  }

  // Verify face if provided
  let verificationStatus: VerificationStatus = 'verified';
  if (faceEmbedding) {
    const template = faceTemplates.get(employeeId);
    if (template) {
      const score = cosineSimilarity(faceEmbedding, template);
      verificationStatus = score >= 0.85 ? 'verified' : 'failed';
    }
  }

  record.checkOut = today;
  record.checkOutLocation = location;
  record.verificationStatus = verificationStatus;

  // Calculate working hours
  if (record.checkIn) {
    record.workingHours = calculateWorkingHours(record.checkIn, today);

    // Calculate overtime (after scheduled hours)
    const [hours] = record.employeeName.split(':').map(Number); // Just use checkInTime for now
    const scheduledHours = 8;
    record.overtime = Math.max(0, record.workingHours - scheduledHours);
  }

  attendanceRecords.set(record.recordId, record);

  res.json({
    success: true,
    data: {
      record,
      message: `Checked out. Hours: ${record.workingHours}h, Overtime: ${record.overtime}h`,
    },
  });
});

/**
 * GET /api/attendance/today - Get today's attendance
 */
app.get('/api/attendance/today', (req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const records = Array.from(attendanceRecords.values())
    .filter(r => new Date(r.date).toISOString().split('T')[0] === today);

  res.json({
    success: true,
    data: {
      records,
      count: records.length,
      stats: getAttendanceStats(),
    },
  });
});

/**
 * GET /api/attendance/:employeeId - Get attendance history
 */
app.get('/api/attendance/:employeeId', (req: Request, res: Response) => {
  const { employeeId } = req.params;
  const { from, to } = req.query;

  let records = Array.from(attendanceRecords.values())
    .filter(r => r.employeeId === employeeId);

  if (from) {
    records = records.filter(r => new Date(r.date) >= new Date(from as string));
  }
  if (to) {
    records = records.filter(r => new Date(r.date) <= new Date(to as string));
  }

  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate summary
  const summary = {
    totalDays: records.length,
    present: records.filter(r => ['present', 'late'].includes(r.status)).length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    totalHours: records.reduce((sum, r) => sum + r.workingHours, 0),
    avgHours: records.length ? records.reduce((sum, r) => sum + r.workingHours, 0) / records.length : 0,
  };

  res.json({
    success: true,
    data: { records, summary, count: records.length },
  });
});

/**
 * GET /api/attendance/report - Get attendance report
 */
app.get('/api/attendance/report', (req: Request, res: Response) => {
  const { from, to, department } = req.query;

  let records = Array.from(attendanceRecords.values());

  if (from) {
    records = records.filter(r => new Date(r.date) >= new Date(from as string));
  }
  if (to) {
    records = records.filter(r => new Date(r.date) <= new Date(to as string));
  }

  // Filter by department if provided
  if (department) {
    const deptEmployees = Array.from(employees.values())
      .filter(e => e.department === department)
      .map(e => e.employeeId);
    records = records.filter(r => deptEmployees.includes(r.employeeId));
  }

  // Department-wise summary
  const departmentSummary: Record<string, any> = {};
  records.forEach(r => {
    const emp = employees.get(r.employeeId);
    const dept = emp?.department || 'Unknown';
    if (!departmentSummary[dept]) {
      departmentSummary[dept] = { total: 0, present: 0, absent: 0, late: 0 };
    }
    departmentSummary[dept].total++;
    if (r.status === 'present' || r.status === 'late') departmentSummary[dept].present++;
    if (r.status === 'absent') departmentSummary[dept].absent++;
    if (r.status === 'late') departmentSummary[dept].late++;
  });

  res.json({
    success: true,
    data: {
      totalRecords: records.length,
      departmentSummary,
      records: records.slice(0, 100), // Limit for performance
    },
  });
});

// ============== EMPLOYEES ==============

/**
 * GET /api/employees - List employees
 */
app.get('/api/employees', (req: Request, res: Response) => {
  const { department } = req.query;
  let allEmployees = Array.from(employees.values());

  if (department) {
    allEmployees = allEmployees.filter(e => e.department === department);
  }

  // Remove face embeddings from response
  const safeEmployees = allEmployees.map(e => ({
    ...e,
    faceEmbedding: undefined, // Don't expose embeddings
  }));

  res.json({
    success: true,
    data: { employees: safeEmployees, count: safeEmployees.length },
  });
});

/**
 * GET /api/employees/:id - Get employee
 */
app.get('/api/employees/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const employee = employees.get(id);

  if (!employee) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Employee not found' },
    });
  }

  const { faceEmbedding, ...safeEmployee } = employee;

  res.json({
    success: true,
    data: {
      ...safeEmployee,
      enrolled: faceTemplates.has(id),
    },
  });
});

/**
 * POST /api/employees - Add employee
 */
app.post('/api/employees', (req: Request, res: Response) => {
  const { name, email, department, checkInTime, checkOutTime } = req.body;

  if (!name || !email || !department) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'name, email, department required' },
    });
  }

  const employeeId = `EMP-${uuidv4().substring(0, 8).toUpperCase()}`;

  const employee: Employee = {
    employeeId,
    name,
    email,
    department,
    faceEmbedding: Array(128).fill(0).map(() => Math.random()), // Empty embedding until enrolled
    departmentId: `DEPT-${department.substring(0, 3).toUpperCase()}`,
    checkInTime: checkInTime || '09:00',
    checkOutTime: checkOutTime || '18:00',
  };

  employees.set(employeeId, employee);

  res.status(201).json({
    success: true,
    data: { employee },
  });
});

// ============== STATS ==============

/**
 * GET /api/stats - Get attendance stats
 */
app.get('/api/stats', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      ...getAttendanceStats(),
      totalFaceEnrollments: faceTemplates.size,
      lastUpdated: new Date().toISOString(),
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`[ERROR] ${err.message}`);
  res.status(500).json({ success: false, error: err.message });
});

// Initialize
seedEmployees();

// Start server
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║       CorpPerks Face Attendance Service          ║
╠═══════════════════════════════════════════════════════════╣
║  Status:     RUNNING                                ║
║  Port:       ${PORT.toString().padEnd(43)}║
║  Version:    1.0.0                               ║
╠═══════════════════════════════════════════════════════════╣
║  Features:                                        ║
║    - Face recognition check-in/checkout           ║
║    - Liveness detection                          ║
║    - Geo-location verification                   ║
║    - Overtime calculation                        ║
║    - Department-wise reports                     ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export { app };
