import { Router, Response } from 'express';
import { z } from 'zod';
import { Employee, User } from '../../models/index.js';
import { authenticate, authorize, asyncHandler, AppError } from '../../middleware/index.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { getCorpIdService } from '../../services/corpIdService.js';
import { config } from '../../config/index.js';

const router = Router();

// Initialize CorpID service
const corpIdService = getCorpIdService();

const createEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  joiningDate: z.string(),
  department: z.string().min(1),
  designation: z.string().min(1),
  managerId: z.string().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).default('full_time'),
  employeeId: z.string().optional(),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

/**
 * Helper: Get manager's CorpID from manager's employee ID
 */
async function getManagerCorpId(managerId: string | undefined): Promise<string | undefined> {
  if (!managerId) return undefined;

  // First check if we already have the manager's CorpID from their employee record
  const manager = await Employee.findOne({ employeeId: managerId, isDeleted: false });
  if (manager?.corpId) {
    return manager.corpId;
  }

  // If not, try to get it from CorpID directly
  const managerCorpId = await corpIdService.getCorpIdByEmployeeId(managerId);
  return managerCorpId || undefined;
}

/**
 * Helper: Sync employee to CorpID
 */
async function syncEmployeeToCorpId(employee: any, action: 'create' | 'update' | 'delete'): Promise<void> {
  if (!config.corpId.syncOnCreate && action === 'create') return;
  if (!config.corpId.syncOnUpdate && action === 'update') return;
  if (!config.corpId.syncOnDelete && action === 'delete') return;

  try {
    if (action === 'delete' || action === 'update') {
      if (employee.corpId) {
        // For delete, we could soft-delete or update status
        // For update, sync the latest metadata
        await corpIdService.updateCorpIdMetadata(employee.corpId, {
          status: action === 'delete' ? 'terminated' : undefined,
          department: employee.department,
          designation: employee.designation,
          email: employee.email,
          lastSyncedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    logger.error(`CorpID sync error on ${action}:`, error);
    // Don't throw - we don't want to fail the main operation
  }
}

/**
 * Helper: Create REPORTS_TO relationship with manager
 */
async function createManagerRelationship(employee: any): Promise<void> {
  if (!employee.corpId || !employee.managerId) return;

  try {
    const managerCorpId = await getManagerCorpId(employee.managerId);
    if (managerCorpId) {
      // Update employee's corpIdManager field
      employee.corpIdManager = managerCorpId;
      await employee.save();

      // Create the relationship in trust-graph service
      await corpIdService.createRelationship({
        fromCorpId: employee.corpId,
        toCorpId: managerCorpId,
        type: 'REPORTS_TO',
        verified: true,
        metadata: {
          since: new Date().toISOString(),
          source: 'corpperks_employee',
        },
      });
    }
  } catch (error) {
    logger.error('Error creating manager relationship:', error);
    // Don't throw - relationship creation is secondary
  }
}

// GET /api/employees
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const department = req.query.department as string;
    const status = req.query.status as string;

    const filter: any = {
      tenantId: req.tenantId,
      isDeleted: false,
    };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) filter.department = department;
    if (status) filter.status = status;

    const [employees, total] = await Promise.all([
      Employee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Employee.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/employees/:id
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const employee = await Employee.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      isDeleted: false,
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    res.json({
      success: true,
      data: employee,
    });
  })
);

// POST /api/employees
router.post(
  '/',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = createEmployeeSchema.parse(req.body);

    const existing = await Employee.findOne({
      tenantId: req.tenantId,
      email: data.email,
      isDeleted: false,
    });

    if (existing) {
      throw new AppError('Employee with this email already exists', 400);
    }

    const employeeId = data.employeeId || `EMP-${Date.now()}`;

    // Get manager's CorpID before creating employee
    const managerCorpId = await getManagerCorpId(data.managerId);

    // Create employee record first
    const employee = await Employee.create({
      ...data,
      tenantId: req.tenantId,
      employeeId,
      joiningDate: new Date(data.joiningDate),
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      corpIdSyncStatus: 'pending',
    });

    // Link to CorpID (if sync is enabled)
    if (config.corpId.syncOnCreate) {
      try {
        const linkResult = await corpIdService.linkEmployee({
          employeeId: employee.employeeId,
          email: employee.email,
          firstName: employee.firstName,
          lastName: employee.lastName,
          department: employee.department,
          designation: employee.designation,
          managerCorpId: managerCorpId,
          metadata: {
            tenantId: employee.tenantId,
            employmentType: employee.employmentType,
            joiningDate: employee.joiningDate.toISOString(),
          },
        });

        // Update employee with CorpID
        employee.corpId = linkResult.corpId;
        employee.corpIdManager = managerCorpId;
        employee.corpIdSyncStatus = 'synced';
        employee.lastSyncedAt = new Date();
        await employee.save();

        // Create manager relationship if applicable
        if (managerCorpId && !linkResult.preExisting) {
          await createManagerRelationship(employee);
        }
      } catch (error) {
        logger.error('Failed to link employee to CorpID:', error);
        employee.corpIdSyncStatus = 'error';
        await employee.save();
        // Don't fail the request - CorpID linking is async
      }
    }

    res.status(201).json({
      success: true,
      data: employee,
    });
  })
);

// PUT /api/employees/:id
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = updateEmployeeSchema.parse(req.body);

    // Get existing employee first
    const existingEmployee = await Employee.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      isDeleted: false,
    });

    if (!existingEmployee) {
      throw new AppError('Employee not found', 404);
    }

    // Check if manager is changing
    const managerChanging = data.managerId !== undefined && data.managerId !== existingEmployee.managerId;

    // Update employee
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, isDeleted: false },
      { ...data, joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined },
      { new: true, runValidators: true }
    );

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Sync to CorpID (if enabled)
    if (config.corpId.syncOnUpdate && employee.corpId) {
      try {
        // Update CorpID metadata
        await corpIdService.updateCorpIdMetadata(employee.corpId, {
          department: employee.department,
          designation: employee.designation,
          email: employee.email,
          status: employee.status,
          lastSyncedAt: new Date().toISOString(),
        });

        // Handle manager change
        if (managerChanging) {
          const newManagerCorpId = await getManagerCorpId(employee.managerId);
          if (newManagerCorpId) {
            employee.corpIdManager = newManagerCorpId;
            await employee.save();

            // Create new REPORTS_TO relationship
            await corpIdService.createRelationship({
              fromCorpId: employee.corpId,
              toCorpId: newManagerCorpId,
              type: 'REPORTS_TO',
              verified: true,
              metadata: {
                since: new Date().toISOString(),
                source: 'corpperks_employee',
                reason: 'manager_change',
              },
            });
          }
        }

        employee.corpIdSyncStatus = 'synced';
        employee.lastSyncedAt = new Date();
        await employee.save();
      } catch (error) {
        logger.error('Failed to sync employee update to CorpID:', error);
        employee.corpIdSyncStatus = 'error';
        await employee.save();
      }
    }

    res.json({
      success: true,
      data: employee,
    });
  })
);

// DELETE /api/employees/:id
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Get existing employee first
    const existingEmployee = await Employee.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      isDeleted: false,
    });

    if (!existingEmployee) {
      throw new AppError('Employee not found', 404);
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      {
        isDeleted: true,
        status: 'terminated',
        terminatedAt: new Date(),
        corpIdSyncStatus: 'pending'
      },
      { new: true }
    );

    // Sync termination to CorpID (if enabled)
    if (config.corpId.syncOnDelete && employee?.corpId) {
      try {
        await corpIdService.updateCorpIdMetadata(employee.corpId, {
          status: 'terminated',
          terminatedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
        });

        // Note: We don't delete the CorpID - we mark it as terminated
        // This preserves the employee history for reporting

        employee.corpIdSyncStatus = 'synced';
        employee.lastSyncedAt = new Date();
        await employee.save();
      } catch (error) {
        logger.error('Failed to sync employee termination to CorpID:', error);
        employee.corpIdSyncStatus = 'error';
        await employee.save();
      }
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully',
      data: {
        corpId: employee?.corpId,
        terminated: true,
      },
    });
  })
);

// GET /api/employees/:id/leave-balance
router.get(
  '/:id/leave-balance',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const employee = await Employee.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      isDeleted: false,
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    res.json({
      success: true,
      data: employee.leaveBalance,
    });
  })
);

export default router;
