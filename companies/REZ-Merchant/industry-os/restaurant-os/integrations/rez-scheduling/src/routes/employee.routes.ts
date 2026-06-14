/**
 * Employee Routes
 */

import { Router, Request, Response } from 'express';
import { Employee } from '../models';
import { requireRoles } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// Create employee
router.post('/', requireRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const employeeId = `EMP${Date.now()}${crypto.randomUUID().split('-')[0]}`;
    const employee = new Employee({
      employeeId,
      ...req.body,
    });
    await employee.save();
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create employee' });
  }
});

// Get all employees
router.get('/', async (req: Request, res: Response) => {
  try {
    const { restaurantId, status, role } = req.query;
    const query: unknown = {};
    if (restaurantId) query.restaurantId = restaurantId;
    if (status) query.status = status;
    if (role) query.role = role;

    const employees = await Employee.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch employees' });
  }
});

// Get employee by ID
router.get('/:employeeId', async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.employeeId });
    if (!employee) {
      res.status(404).json({ success: false, error: 'Employee not found' });
      return;
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch employee' });
  }
});

// Update employee
router.put('/:employeeId', requireRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { employeeId: req.params.employeeId },
      req.body,
      { new: true }
    );
    if (!employee) {
      res.status(404).json({ success: false, error: 'Employee not found' });
      return;
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update employee' });
  }
});

// Delete employee
router.delete('/:employeeId', requireRoles('admin'), async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { employeeId: req.params.employeeId },
      { status: 'terminated' },
      { new: true }
    );
    if (!employee) {
      res.status(404).json({ success: false, error: 'Employee not found' });
      return;
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete employee' });
  }
});

export { router as employeeRoutes };
