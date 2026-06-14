import { Router, Request, Response, NextFunction } from 'express';
import { Employee, Store } from '../models';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/employees - List all employees
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, role, isActive } = req.query;

    const query: any = {};
    if (storeId) query.storeId = storeId;
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const employees = await Employee.find(query)
      .populate('storeId', 'name code')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: employees,
      count: employees.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/employees/:id - Get single employee
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('storeId', 'name code address');

    if (!employee) {
      res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
      return;
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/employees/employeeId/:employeeId - Get by employee ID
router.get('/employeeId/:employeeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.employeeId.toUpperCase() })
      .populate('storeId', 'name code address');

    if (!employee) {
      res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
      return;
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/employees - Create employee
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify store exists
    const store = await Store.findById(req.body.storeId);
    if (!store) {
      res.status(400).json({
        success: false,
        error: 'Store not found',
      });
      return;
    }

    // Generate employee ID if not provided
    const employeeId = req.body.employeeId || `EMP-${uuidv4().slice(0, 8).toUpperCase()}`;

    const existingEmployee = await Employee.findOne({ employeeId });
    if (existingEmployee) {
      res.status(409).json({
        success: false,
        error: 'Employee with this ID already exists',
      });
      return;
    }

    const employee = new Employee({
      ...req.body,
      employeeId: employeeId.toUpperCase(),
    });
    await employee.save();

    logger.info('Employee created', { employeeId: employee.employeeId, name: employee.name });

    res.status(201).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!employee) {
      res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
      return;
    }

    logger.info('Employee updated', { employeeId: employee.employeeId });

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/employees/:id - Deactivate employee
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!employee) {
      res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
      return;
    }

    logger.info('Employee deactivated', { employeeId: employee.employeeId });

    res.json({
      success: true,
      message: 'Employee deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;