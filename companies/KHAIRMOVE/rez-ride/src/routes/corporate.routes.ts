import { Router, Request, Response } from 'express';
import { CorporateService } from '../services/corporate.service';

const router = Router();
const corporateService = new CorporateService();

// ===========================================
// CORPORATE ACCOUNTS
// ===========================================

/**
 * @route POST /api/corporate/accounts
 * @desc Create corporate account
 */
router.post('/accounts', async (req: Request, res: Response) => {
  try {
    const { companyName, domain, email, phone, plan, gstIn } = req.body;

    if (!companyName || !domain || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const account = await corporateService.createCorporateAccount({
      companyName,
      domain,
      email,
      phone,
      plan,
      gstIn,
    });

    res.json({ success: true, account });
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as { code: number }).code === 11000) {
      return res.status(400).json({ error: 'Domain already registered' });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route GET /api/corporate/accounts/domain/:domain
 * @desc Get account by domain
 */
router.get('/accounts/domain/:domain', async (req: Request, res: Response) => {
  try {
    const account = await corporateService.getAccountByDomain(req.params.domain);

    if (!account) {
      return res.status(404).json({ error: 'Corporate account not found' });
    }

    res.json({ success: true, account });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route GET /api/corporate/accounts/:id
 * @desc Get account by ID
 */
router.get('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const account = await corporateService.getAccountById(req.params.id);

    if (!account) {
      return res.status(404).json({ error: 'Corporate account not found' });
    }

    res.json({ success: true, account });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route PATCH /api/corporate/accounts/:id
 * @desc Update corporate account
 */
router.patch('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const account = await corporateService.updateAccount(req.params.id, req.body);

    if (!account) {
      return res.status(404).json({ error: 'Corporate account not found' });
    }

    res.json({ success: true, account });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route POST /api/corporate/accounts/:id/budget
 * @desc Add budget to account
 */
router.post('/accounts/:id/budget', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const account = await corporateService.addBudget(req.params.id, amount);

    if (!account) {
      return res.status(404).json({ error: 'Corporate account not found' });
    }

    res.json({ success: true, account });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ===========================================
// EMPLOYEES
// ===========================================

/**
 * @route POST /api/corporate/employees
 * @desc Enroll employee
 */
router.post('/employees', async (req: Request, res: Response) => {
  try {
    const { corporateAccountId, name, email, phone, department, designation, level } = req.body;

    if (!corporateAccountId || !name || !email || !phone || !department) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const employee = await corporateService.enrollEmployee({
      corporateAccountId,
      name,
      email,
      phone,
      department,
      designation,
      level,
    });

    res.json({ success: true, employee });
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as { code: number }).code === 11000) {
      return res.status(400).json({ error: 'Employee already enrolled' });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route POST /api/corporate/employees/bulk
 * @desc Bulk enroll employees
 */
router.post('/employees/bulk', async (req: Request, res: Response) => {
  try {
    const { corporateAccountId, employees } = req.body;

    if (!corporateAccountId || !employees || !Array.isArray(employees)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const result = await corporateService.bulkEnrollEmployees(corporateAccountId, employees);

    res.json({
      success: result.failed === 0,
      successCount: result.success,
      failedCount: result.failed,
      errors: result.errors
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route GET /api/corporate/employees/:id
 * @desc Get employee by ID
 */
router.get('/employees/:id', async (req: Request, res: Response) => {
  try {
    const employee = await corporateService.getEmployeeById(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ success: true, employee });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route GET /api/corporate/employees/email/:email
 * @desc Get employee by email
 */
router.get('/employees/email/:email', async (req: Request, res: Response) => {
  try {
    const employee = await corporateService.getEmployeeByEmail(req.params.email);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ success: true, employee });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route GET /api/corporate/accounts/:id/employees
 * @desc Get employees for account
 */
router.get('/accounts/:id/employees', async (req: Request, res: Response) => {
  try {
    const employees = await corporateService.getAccountEmployees(req.params.id);
    res.json({ success: true, employees });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route PATCH /api/corporate/employees/:id
 * @desc Update employee
 */
router.patch('/employees/:id', async (req: Request, res: Response) => {
  try {
    const employee = await corporateService.updateEmployee(req.params.id, req.body);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ success: true, employee });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route POST /api/corporate/employees/:id/suspend
 * @desc Suspend employee
 */
router.post('/employees/:id/suspend', async (req: Request, res: Response) => {
  try {
    await corporateService.suspendEmployee(req.params.id);
    res.json({ success: true, message: 'Employee suspended' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ===========================================
// CORPORATE RIDES
// ===========================================

/**
 * @route POST /api/corporate/rides
 * @desc Book corporate ride
 */
router.post('/rides', async (req: Request, res: Response) => {
  try {
    const { rideId, corporateAccountId, employeeId, amount, purpose, projectCode } = req.body;

    if (!rideId || !corporateAccountId || !employeeId || !amount || !purpose) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ride = await corporateService.bookCorporateRide({
      rideId,
      corporateAccountId,
      employeeId,
      amount,
      purpose,
      projectCode,
    });

    res.json({ success: true, ride });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

/**
 * @route GET /api/corporate/rides/:id/approve
 * @desc Approve corporate ride
 */
router.post('/rides/:id/approve', async (req: Request, res: Response) => {
  try {
    const { approverEmail, approvedAmount } = req.body;

    const ride = await corporateService.approveRide(
      req.params.id,
      approverEmail,
      approvedAmount
    );

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json({ success: true, ride });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route GET /api/corporate/accounts/:id/rides
 * @desc Get corporate ride history
 */
router.get('/accounts/:id/rides', async (req: Request, res: Response) => {
  try {
    const { employeeId, department, startDate, endDate, status, page, limit } = req.query;

    const result = await corporateService.getCorporateRideHistory(req.params.id, {
      employeeId: employeeId as string,
      department: department as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ===========================================
// INVOICES
// ===========================================

/**
 * @route GET /api/corporate/accounts/:id/invoice
 * @desc Generate invoice
 */
router.get('/accounts/:id/invoice', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate required' });
    }

    const invoice = await corporateService.generateInvoice(
      req.params.id,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({ success: true, invoice });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

// ===========================================
// ANALYTICS
// ===========================================

/**
 * @route GET /api/corporate/accounts/:id/analytics
 * @desc Get account analytics
 */
router.get('/accounts/:id/analytics', async (req: Request, res: Response) => {
  try {
    const analytics = await corporateService.getAccountAnalytics(req.params.id);
    res.json({ success: true, analytics });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
