/**
 * Employee Routes
 */

import { Router, Request, Response } from 'express';
import * as selfService from '../services/selfService';

const router = Router();

// Get employee profile
router.get('/:employeeId', async (req: Request, res: Response) => {
  const employee = await selfService.getEmployee(req.params.employeeId);
  if (!employee) {
    res.status(404).json({ success: false, error: 'Employee not found' });
    return;
  }
  res.json({ success: true, data: employee });
});

// Get employee by email
router.get('/email/:email', async (req: Request, res: Response) => {
  const employee = await selfService.getEmployeeByEmail(req.params.email);
  if (!employee) {
    res.status(404).json({ success: false, error: 'Employee not found' });
    return;
  }
  res.json({ success: true, data: employee });
});

// Update employee profile
router.patch('/:employeeId/profile', async (req: Request, res: Response) => {
  const { phone, dateOfBirth } = req.body;
  const employee = await selfService.updateEmployeeProfile(req.params.employeeId, {
    phone,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
  });
  if (!employee) {
    res.status(404).json({ success: false, error: 'Employee not found' });
    return;
  }
  res.json({ success: true, data: employee });
});

// Get employee leave balances
router.get('/:employeeId/leave-balances', async (req: Request, res: Response) => {
  const balances = await selfService.getEmployeeLeaveBalances(req.params.employeeId);
  if (!balances) {
    res.status(404).json({ success: false, error: 'Employee not found' });
    return;
  }
  res.json({ success: true, data: balances });
});

// Get employee dashboard
router.get('/:employeeId/dashboard', async (req: Request, res: Response) => {
  try {
    const dashboard = await selfService.getEmployeeDashboard(req.params.employeeId);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    if (error instanceof Error) {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    throw error;
  }
});

export default router;
