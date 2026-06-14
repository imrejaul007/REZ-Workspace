import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { staffService, CreateStaffDTO, UpdateStaffDTO, StaffRole, StaffStatus } from '../services';

const router = Router();

// Validation schemas
const createStaffSchema = Joi.object({
  merchantId: Joi.string().required(),
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).required(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid('manager', 'chef', 'waiter', 'cashier', 'kitchen', 'delivery').required(),
  hireDate: Joi.date().required(),
  salary: Joi.number().min(0).required(),
  permissions: Joi.array().items(Joi.string()).optional(),
});

const updateStaffSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).optional(),
  email: Joi.string().email().optional().allow(null, ''),
  role: Joi.string().valid('manager', 'chef', 'waiter', 'cashier', 'kitchen', 'delivery').optional(),
  status: Joi.string().valid('active', 'inactive', 'on_leave').optional(),
  salary: Joi.number().min(0).optional(),
  permissions: Joi.array().items(Joi.string()).optional(),
});

const listStaffSchema = Joi.object({
  merchantId: Joi.string().required(),
  role: Joi.string().valid('manager', 'chef', 'waiter', 'cashier', 'kitchen', 'delivery').optional(),
  status: Joi.string().valid('active', 'inactive', 'on_leave').optional(),
  search: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// Validation middleware
const validate = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((d) => d.message),
      });
    }
    next();
  };
};

/**
 * POST /api/staff
 * Create a new staff member
 */
router.post('/', validate(createStaffSchema), async (req: Request, res: Response) => {
  try {
    const data: CreateStaffDTO = req.body;
    const staff = await staffService.createStaff(data);

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: staff,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create staff';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/staff
 * List staff with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { error, value } = listStaffSchema.validate(req.query, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((d) => d.message),
      });
    }

    const result = await staffService.listStaff(value, value.page, value.limit);

    res.json({
      success: true,
      data: result.staff,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list staff';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/staff/:id
 * Get staff by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const staff = await staffService.getStaffById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get staff';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/staff/employee/:employeeId
 * Get staff by employee ID
 */
router.get('/employee/:employeeId', async (req: Request, res: Response) => {
  try {
    const staff = await staffService.getStaffByEmployeeId(req.params.employeeId);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get staff';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * PUT /api/staff/:id
 * Update staff member
 */
router.put('/:id', validate(updateStaffSchema), async (req: Request, res: Response) => {
  try {
    const data: UpdateStaffDTO = req.body;
    const staff = await staffService.updateStaff(req.params.id, data);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    res.json({
      success: true,
      message: 'Staff updated successfully',
      data: staff,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update staff';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * DELETE /api/staff/:id
 * Delete staff member
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await staffService.deleteStaff(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    res.json({
      success: true,
      message: 'Staff deleted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete staff';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * PATCH /api/staff/:id/deactivate
 * Deactivate staff (soft delete)
 */
router.patch('/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const staff = await staffService.deactivateStaff(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    res.json({
      success: true,
      message: 'Staff deactivated successfully',
      data: staff,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to deactivate staff';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/staff/:id/statistics
 * Get staff statistics
 */
router.get('/:id/statistics', async (req: Request, res: Response) => {
  try {
    const staff = await staffService.getStaffById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    const stats = await staffService.getStaffStatistics(staff.merchantId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get statistics';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/staff/merchant/:merchantId/role-count
 * Get staff count by role for a merchant
 */
router.get('/merchant/:merchantId/role-count', async (req: Request, res: Response) => {
  try {
    const counts = await staffService.getStaffCountByRole(req.params.merchantId);

    res.json({
      success: true,
      data: counts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get role counts';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/staff/merchant/:merchantId/available
 * Get available staff for a specific role and date
 */
router.get('/merchant/:merchantId/available', async (req: Request, res: Response) => {
  try {
    const { role, date } = req.query;

    if (!role || !date) {
      return res.status(400).json({
        success: false,
        message: 'Role and date are required',
      });
    }

    const staff = await staffService.getAvailableStaff(
      req.params.merchantId,
      role as StaffRole,
      new Date(date as string)
    );

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get available staff';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

export default router;
