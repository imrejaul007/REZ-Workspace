import { logger } from '../../shared/logger';
/**
 * Hospital Management Routes for RisaCare
 * REST API endpoints for hospital operations
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  hospitalService,
  patientService,
  admissionService,
  bedService,
  operationService,
  staffService,
} from '../services/index.js';
import {
  Gender,
  BloodType,
  BedType,
  BedStatus,
  AdmissionStatus,
  OperationStatus,
  StaffRole,
  StaffStatus,
} from '../models/hospital.js';

const router = Router();

// Validation schemas
const CreateHospitalSchema = z.object({
  name: z.string().min(1),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(5),
    country: z.string().default('India'),
  }),
  phone: z.string().min(10),
  email: z.string().email(),
  icuBeds: z.number().optional(),
  totalBeds: z.number().optional(),
});

const UpdateHospitalSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(5),
    country: z.string(),
  }).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  icuBeds: z.number().optional(),
  totalBeds: z.number().optional(),
});

const CreateDepartmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  headDoctorId: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  phone: z.string().min(10),
  email: z.string().email().optional(),
});

const RegisterPatientSchema = z.object({
  name: z.string().min(1),
  dob: z.string().datetime().transform(s => new Date(s)),
  gender: z.nativeEnum(Gender),
  bloodType: z.nativeEnum(BloodType).optional(),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(5),
    country: z.string().default('India'),
  }),
  allergies: z.array(z.string()).optional(),
  emergencyContact: z.object({
    name: z.string().min(1),
    relationship: z.string().min(1),
    phone: z.string().min(10),
    email: z.string().email().optional(),
  }),
  insuranceId: z.string().optional(),
  insuranceProvider: z.string().optional(),
});

const AdmitPatientSchema = z.object({
  patientId: z.string().min(1),
  departmentId: z.string().min(1),
  bedId: z.string().optional(),
  diagnosis: z.string().min(1),
  treatmentPlan: z.string().optional(),
  attendingDoctorId: z.string().min(1),
  notes: z.string().optional(),
});

const DischargePatientSchema = z.object({
  admissionId: z.string().min(1),
  dischargeNotes: z.string().optional(),
  followUpDate: z.string().datetime().optional().transform(s => s ? new Date(s) : undefined),
});

const TransferPatientSchema = z.object({
  admissionId: z.string().min(1),
  targetDepartmentId: z.string().min(1),
  targetBedId: z.string().optional(),
  transferReason: z.string().min(1),
  notes: z.string().optional(),
});

const AllocateBedSchema = z.object({
  patientId: z.string().min(1),
  admissionId: z.string().min(1),
  bedId: z.string().min(1),
});

const ScheduleOperationSchema = z.object({
  patientId: z.string().min(1),
  surgeonId: z.string().min(1),
  operationType: z.string().min(1),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().transform(s => new Date(s)),
  duration: z.number().min(1),
  operatingRoomId: z.string().min(1),
  anesthesiologistId: z.string().optional(),
  assistantSurgeonIds: z.array(z.string()).optional(),
  preOpInstructions: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const UpdateOperationSchema = z.object({
  status: z.nativeEnum(OperationStatus).optional(),
  scheduledAt: z.string().datetime().optional().transform(s => s ? new Date(s) : undefined),
  duration: z.number().min(1).optional(),
  operatingRoomId: z.string().optional(),
  complications: z.string().optional(),
  notes: z.string().optional(),
});

const AddStaffSchema = z.object({
  name: z.string().min(1),
  role: z.nativeEnum(StaffRole),
  departmentId: z.string().optional(),
  specialization: z.array(z.string()),
  schedule: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isAvailable: z.boolean().default(true),
  })),
  contact: z.object({
    phone: z.string().min(10),
    email: z.string().email(),
    emergencyPhone: z.string().min(10).optional(),
  }),
  salary: z.number().min(0),
  qualifications: z.array(z.string()),
  licenseNumber: z.string().optional(),
});

const UpdateScheduleSchema = z.object({
  staffId: z.string().min(1),
  schedule: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isAvailable: z.boolean().default(true),
  })),
});

// Helper function to handle errors
function handleError(res: Response, error: unknown, message = 'An error occurred') {
  logger.error(message, error);
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.errors,
    });
  }
  return res.status(500).json({
    success: false,
    error: message,
  });
}

// ============== HOSPITAL ROUTES ==============

/**
 * POST /hospital
 * Create a new hospital
 */
router.post('/hospital', async (req: Request, res: Response) => {
  try {
    const input = CreateHospitalSchema.parse(req.body);
    const hospital = await hospitalService.createHospital(input);
    res.status(201).json({
      success: true,
      data: hospital,
      message: 'Hospital created successfully',
    });
  } catch (error) {
    handleError(res, error, 'Failed to create hospital');
  }
});

/**
 * GET /hospital
 * Get hospital information
 */
router.get('/hospital', async (_req: Request, res: Response) => {
  try {
    const hospital = await hospitalService.getHospital();
    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Hospital not found',
      });
    }
    res.json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get hospital');
  }
});

/**
 * PUT /hospital
 * Update hospital information
 */
router.put('/hospital', async (req: Request, res: Response) => {
  try {
    const input = UpdateHospitalSchema.parse(req.body);
    const hospital = await hospitalService.updateHospital(input);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Hospital not found',
      });
    }
    res.json({
      success: true,
      data: hospital,
      message: 'Hospital updated successfully',
    });
  } catch (error) {
    handleError(res, error, 'Failed to update hospital');
  }
});

/**
 * GET /hospital/stats
 * Get hospital statistics
 */
router.get('/hospital/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await hospitalService.getHospitalStats();
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Hospital not found',
      });
    }
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get hospital stats');
  }
});

// ============== DEPARTMENT ROUTES ==============

/**
 * GET /departments
 * List all departments
 */
router.get('/departments', async (_req: Request, res: Response) => {
  try {
    const departments = await hospitalService.getDepartments();
    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get departments');
  }
});

/**
 * POST /departments
 * Add a new department
 */
router.post('/departments', async (req: Request, res: Response) => {
  try {
    const input = CreateDepartmentSchema.parse(req.body);
    const department = await hospitalService.addDepartment(input);
    if (!department) {
      return res.status(400).json({
        success: false,
        error: 'Hospital not initialized',
      });
    }
    res.status(201).json({
      success: true,
      data: department,
      message: 'Department added successfully',
    });
  } catch (error) {
    handleError(res, error, 'Failed to add department');
  }
});

/**
 * GET /departments/:departmentId
 * Get department by ID
 */
router.get('/departments/:departmentId', async (req: Request, res: Response) => {
  try {
    const department = await hospitalService.getDepartmentById(req.params.departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }
    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get department');
  }
});

// ============== PATIENT ROUTES ==============

/**
 * POST /patients
 * Register a new patient
 */
router.post('/patients', async (req: Request, res: Response) => {
  try {
    const input = RegisterPatientSchema.parse(req.body);
    const patient = await patientService.registerPatient(input);
    res.status(201).json({
      success: true,
      data: patient,
      message: 'Patient registered successfully',
    });
  } catch (error) {
    handleError(res, error, 'Failed to register patient');
  }
});

/**
 * GET /patients/:patientId
 * Get patient by ID
 */
router.get('/patients/:patientId', async (req: Request, res: Response) => {
  try {
    const patient = await patientService.getPatient(req.params.patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
      });
    }
    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get patient');
  }
});

/**
 * GET /patients/search
 * Search patients
 */
router.get('/patients/search', async (req: Request, res: Response) => {
  try {
    const { query, gender, bloodType, hasInsurance, page, limit } = req.query;
    const result = await patientService.searchPatients({
      query: query as string,
      gender: gender ? Gender[gender as keyof typeof Gender] : undefined,
      bloodType: bloodType ? BloodType[bloodType as keyof typeof BloodType] : undefined,
      hasInsurance: hasInsurance ? hasInsurance === 'true' : undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.json({
      success: true,
      data: result.patients,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to search patients');
  }
});

/**
 * GET /patients/stats
 * Get patient statistics
 */
router.get('/patients/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await patientService.getPatientStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get patient stats');
  }
});

// ============== ADMISSION ROUTES ==============

/**
 * POST /admissions
 * Admit a patient
 */
router.post('/admissions', async (req: Request, res: Response) => {
  try {
    const input = AdmitPatientSchema.parse(req.body);
    const admission = await admissionService.admitPatient(input);
    res.status(201).json({
      success: true,
      data: admission,
      message: 'Patient admitted successfully',
    });
  } catch (error) {
    handleError(res, error, 'Failed to admit patient');
  }
});

/**
 * GET /admissions
 * Get admissions with filters
 */
router.get('/admissions', async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      departmentId,
      status,
      startDate,
      endDate,
      attendingDoctorId,
      page,
      limit,
    } = req.query;

    const result = await admissionService.getAdmissions({
      patientId: patientId as string,
      departmentId: departmentId as string,
      status: status ? AdmissionStatus[status as keyof typeof AdmissionStatus] : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      attendingDoctorId: attendingDoctorId as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.admissions,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to get admissions');
  }
});

/**
 * GET /admissions/active
 * Get active admissions
 */
router.get('/admissions/active', async (req: Request, res: Response) => {
  try {
    const { departmentId, page, limit } = req.query;
    const result = await admissionService.getActiveAdmissions({
      departmentId: departmentId as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.admissions,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to get active admissions');
  }
});

/**
 * GET /admissions/:admissionId
 * Get admission by ID
 */
router.get('/admissions/:admissionId', async (req: Request, res: Response) => {
  try {
    const admission = await admissionService.getAdmission(req.params.admissionId);
    if (!admission) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found',
      });
    }
    res.json({
      success: true,
      data: admission,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get admission');
  }
});

/**
 * PUT /admissions/:admissionId/discharge
 * Discharge a patient
 */
router.put('/admissions/:admissionId/discharge', async (req: Request, res: Response) => {
  try {
    const input = DischargePatientSchema.parse({
      ...req.body,
      admissionId: req.params.admissionId,
    });
    const admission = await admissionService.dischargePatient(input);
    if (!admission) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found',
      });
    }
    res.json({
      success: true,
      data: admission,
      message: 'Patient discharged successfully',
    });
  } catch (error) {
    handleError(res, error, 'Failed to discharge patient');
  }
});

/**
 * POST /admissions/transfer
 * Transfer a patient
 */
router.post('/admissions/transfer', async (req: Request, res: Response) => {
  try {
    const input = TransferPatientSchema.parse(req.body);
    const admission = await admissionService.transferPatient(input);
    if (!admission) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found',
      });
    }
    res.json({
      success: true,
      data: admission,
      message: 'Patient transferred successfully',
    });
  } catch (error) {
    handleError(res, error, 'Failed to transfer patient');
  }
});

/**
 * GET /admissions/stats
 * Get admission statistics
 */
router.get('/admissions/stats', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await admissionService.getAdmissionStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get admission stats');
  }
});

// ============== BED ROUTES ==============

/**
 * GET /beds
 * Get all beds
 */
router.get('/beds', async (req: Request, res: Response) => {
  try {
    const { wardId, bedType, status, floor } = req.query;
    const beds = await bedService.getBeds({
      wardId: wardId as string,
      bedType: bedType ? BedType[bedType as keyof typeof BedType] : undefined,
      status: status ? BedStatus[status as keyof typeof BedStatus] : undefined,
      floor: floor ? parseInt(floor as string, 10) : undefined,
    });
    res.json({
      success: true,
      data: beds,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get beds');
  }
});

/**
 * GET /beds/available
 * Get available beds
 */
router.get('/beds/available', async (req: Request, res: Response) => {
  try {
    const { wardId, bedType, floor } = req.query;
    const beds = await bedService.getAvailableBeds({
      wardId: wardId as string,
      bedType: bedType ? BedType[bedType as keyof typeof BedType] : undefined,
      floor: floor ? parseInt(floor as string, 10) : undefined,
    });
    res.json({
      success: true,
      data: beds,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get available beds');
  }
});

/**
 * GET /beds/stats
 * Get bed statistics
 */
router.get('/beds/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await bedService.getBedStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get bed stats');
  }
});

/**
 * GET /beds/wards
 * Get all wards with occupancy
 */
router.get('/beds/wards', async (_req: Request, res: Response) => {
  try {
    const wards = await bedService.getAllWardOccupancy();
    res.json({
      success: true,
      data: wards,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get wards');
  }
});

/**
 * GET /beds/wards/:wardId
 * Get ward occupancy
 */
router.get('/beds/wards/:wardId', async (req: Request, res: Response) => {
  try {
    const occupancy = await bedService.getWardOccupancy(req.params.wardId);
    if (!occupancy) {
      return res.status(404).json({
        success: false,
        error: 'Ward not found',
      });
    }
    res.json({
      success: true,
      data: occupancy,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get ward occupancy');
  }
});

/**
 * POST /beds/allocate
 * Allocate a bed
 */
router.post('/beds/allocate', async (req: Request, res: Response) => {
  try {
    const input = AllocateBedSchema.parse(req.body);
    const bed = await bedService.allocateBed(input);
    if (!bed) {
      return res.status(400).json({
        success: false,
        error: 'Bed not available or not found',
      });
    }
    res.json({
      success: true,
      data: bed,
      message: 'Bed allocated successfully',
    });
  } catch (error) {
    handleError(res, error, 'Failed to allocate bed');
  }
});

/**
 * POST /beds/release
 * Release a bed
 */
router.post('/beds/release', async (req: Request, res: Response) => {
  try {
    const { bedId } = req.body;
    if (!bedId) {
      return res.status(400).json({
        success: false,
        error: 'bedId is required',
      });
    }
    const bed = await bedService.releaseBed(bedId);
    if (!bed) {
      return res.status(404).json({
        success: false,
        error: 'Bed not found',
      });
    }
    res.json({
      success: true,
      data: bed,
      message: 'Bed released successfully',
    });
  } catch (error) {
    handleError(res, error, 'Failed to release bed');
  }
});

// ============== OPERATION ROUTES ==============

/**
 * GET /operations
 * List operations
 */
router.get('/operations', async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      surgeonId,
      status,
      startDate,
      endDate,
      operatingRoomId,
      page,
      limit,
    } = req.query;

    const result = await operationService.getOperations({
      patientId: patientId as string,
      surgeonId: surgeonId as string,
      status: status ? OperationStatus[status as keyof typeof OperationStatus] : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      operatingRoomId: operatingRoomId as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.operations,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to get operations');
  }
});

/**
 * POST /operations
 * Schedule an operation
 */
router.post('/operations', async (req: Request, res: Response) => {
  try {
    const input = ScheduleOperationSchema.parse(req.body);

    // Check if operating room is available
    const isAvailable = await operationService.isOperatingRoomAvailable(
      input.operatingRoomId,
      input.scheduledAt,
      input.duration
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Operating room is not available at the requested time',
      });
    }

    const operation = await operationService.scheduleOperation(input);
    res.status(201).json({
      success: true,
      data: operation,
      message: 'Operation scheduled successfully',
    });
  } catch (error) {
    handleError(res, error, 'Failed to schedule operation');
  }
});

/**
 * GET /operations/:operationId
 * Get operation by ID
 */
router.get('/operations/:operationId', async (req: Request, res: Response) => {
  try {
    const operation = await operationService.getOperation(req.params.operationId);
    if (!operation) {
      return res.status(404).json({
        success: false,
        error: 'Operation not found',
      });
    }
    res.json({
      success: true,
      data: operation,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get operation');
  }
});

/**
 * PUT /operations/:operationId
 * Update an operation
 */
router.put('/operations/:operationId', async (req: Request, res: Response) => {
  try {
    const input = UpdateOperationSchema.parse(req.body);
    const operation = await operationService.updateOperation(
      req.params.operationId,
      input
    );
    if (!operation) {
      return res.status(404).json({
        success: false,
        error: 'Operation not found or invalid status transition',
      });
    }
    res.json({
      success: true,
      data: operation,
      message: 'Operation updated successfully',
    });
  } catch (error) {
    handleError(res, error, 'Failed to update operation');
  }
});

/**
 * POST /operations/:operationId/start
 * Start an operation
 */
router.post('/operations/:operationId/start', async (req: Request, res: Response) => {
  try {
    const operation = await operationService.startOperation(req.params.operationId);
    if (!operation) {
      return res.status(404).json({
        success: false,
        error: 'Operation not found',
      });
    }
    res.json({
      success: true,
      data: operation,
      message: 'Operation started',
    });
  } catch (error) {
    handleError(res, error, 'Failed to start operation');
  }
});

/**
 * POST /operations/:operationId/complete
 * Complete an operation
 */
router.post('/operations/:operationId/complete', async (req: Request, res: Response) => {
  try {
    const { complications, postOpInstructions } = req.body;
    const operation = await operationService.completeOperation(
      req.params.operationId,
      complications,
      postOpInstructions
    );
    if (!operation) {
      return res.status(404).json({
        success: false,
        error: 'Operation not found',
      });
    }
    res.json({
      success: true,
      data: operation,
      message: 'Operation completed',
    });
  } catch (error) {
    handleError(res, error, 'Failed to complete operation');
  }
});

/**
 * POST /operations/:operationId/cancel
 * Cancel an operation
 */
router.post('/operations/:operationId/cancel', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Cancellation reason is required',
      });
    }
    const operation = await operationService.cancelOperation(
      req.params.operationId,
      reason
    );
    if (!operation) {
      return res.status(404).json({
        success: false,
        error: 'Operation not found or cannot be cancelled',
      });
    }
    res.json({
      success: true,
      data: operation,
      message: 'Operation cancelled',
    });
  } catch (error) {
    handleError(res, error, 'Failed to cancel operation');
  }
});

/**
 * GET /operations/stats
 * Get operation statistics
 */
router.get('/operations/stats', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await operationService.getOperationStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get operation stats');
  }
});

// ============== STAFF ROUTES ==============

/**
 * GET /staff
 * List staff
 */
router.get('/staff', async (req: Request, res: Response) => {
  try {
    const { role, departmentId, status, specialization, page, limit } = req.query;
    const result = await staffService.getAllStaff({
      role: role ? StaffRole[role as keyof typeof StaffRole] : undefined,
      departmentId: departmentId as string,
      status: status ? StaffStatus[status as keyof typeof StaffStatus] : undefined,
      specialization: specialization as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.staff,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to get staff');
  }
});

/**
 * POST /staff
 * Add staff
 */
router.post('/staff', async (req: Request, res: Response) => {
  try {
    const input = AddStaffSchema.parse(req.body);
    const staff = await staffService.addStaff(input);
    res.status(201).json({
      success: true,
      data: staff,
      message: 'Staff added successfully',
    });
  } catch (error) {
    handleError(res, error, 'Failed to add staff');
  }
});

/**
 * GET /staff/:staffId
 * Get staff by ID
 */
router.get('/staff/:staffId', async (req: Request, res: Response) => {
  try {
    const staff = await staffService.getStaff(req.params.staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff not found',
      });
    }
    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get staff');
  }
});

/**
 * GET /staff/:staffId/schedule
 * Get staff schedule
 */
router.get('/staff/:staffId/schedule', async (req: Request, res: Response) => {
  try {
    const schedule = await staffService.getStaffSchedule(req.params.staffId);
    if (schedule === null) {
      return res.status(404).json({
        success: false,
        error: 'Staff not found',
      });
    }
    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get staff schedule');
  }
});

/**
 * PUT /staff/:staffId/schedule
 * Update staff schedule
 */
router.put('/staff/:staffId/schedule', async (req: Request, res: Response) => {
  try {
    const input = UpdateScheduleSchema.parse({
      ...req.body,
      staffId: req.params.staffId,
    });
    const staff = await staffService.updateSchedule(input);
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff not found or invalid schedule',
      });
    }
    res.json({
      success: true,
      data: staff,
      message: 'Schedule updated successfully',
    });
  } catch (error) {
    handleError(res, error, 'Failed to update schedule');
  }
});

/**
 * GET /staff/doctors
 * Get all doctors
 */
router.get('/staff/doctors', async (req: Request, res: Response) => {
  try {
    const { departmentId, specialization } = req.query;
    const doctors = await staffService.getDoctors({
      departmentId: departmentId as string,
      specialization: specialization as string,
    });
    res.json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get doctors');
  }
});

/**
 * GET /staff/nurses
 * Get all nurses
 */
router.get('/staff/nurses', async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.query;
    const nurses = await staffService.getNurses(departmentId as string);
    res.json({
      success: true,
      data: nurses,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get nurses');
  }
});

/**
 * GET /staff/stats
 * Get staff statistics
 */
router.get('/staff/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await staffService.getStaffStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    handleError(res, error, 'Failed to get staff stats');
  }
});

/**
 * GET /staff/search
 * Search staff
 */
router.get('/staff/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter q is required',
      });
    }
    const staff = await staffService.searchStaff(q as string);
    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    handleError(res, error, 'Failed to search staff');
  }
});

export default router;
