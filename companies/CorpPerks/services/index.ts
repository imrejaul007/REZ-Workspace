import { logger } from '../../shared/logger';
/**
 * CorpPerks Workforce OS API
 *
 * Workforce OS - Human + Agent + Hybrid Twins
 * Port: 4720
 *
 * Integrations:
 * - Unified Hub (4600) - RABTUL services
 * - HOJAI AI (4500-4590) - Employee intelligence
 * - SUTAR OS (4140-4254) - Employee twins, goals
 * - Genie (4703-4707) - Personal work experiences
 */

import express, { Request, Response } from 'express';
import { corpPerksHub } from './hub-client';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '4720', 10);

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'CorpPerks-Workforce-OS',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  const checks = {
    unifiedHub: false,
    peopleOS: false,
    talentAI: false,
    sutarTwinOS: false,
    genieMemory: false,
  };

  try {
    await corpPerksHub.getWalletBalance('health-check');
    checks.unifiedHub = true;
  } catch {}

  res.json({ status: 'ready', checks });
});

// ============================================
// EMPLOYEE AUTHENTICATION
// ============================================

app.post('/api/employees/auth', async (req: Request, res: Response) => {
  try {
    const { phone, company } = req.body;
    const result = await corpPerksHub.authenticateEmployee(phone, company);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/employees/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const result = await corpPerksHub.verifyEmployee(token);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// EMPLOYEE ONBOARDING
// ============================================

app.post('/api/employees/onboard', async (req: Request, res: Response) => {
  try {
    const employeeData = req.body;

    // Create employee in PeopleOS
    const employee = await corpPerksHub.onboardEmployee(employeeData);

    // Create employee twin
    await corpPerksHub.createEmployeeTwin(employee.id, employeeData);

    // Initialize wallet with welcome bonus
    await corpPerksHub.awardEmployeeBonus(employee.id, 500, 'welcome_bonus');

    // Award loyalty points
    await corpPerksHub.awardPoints(employee.id, 100, 'employee_onboard');

    // Track event
    await corpPerksHub.trackEvent(employee.id, 'employee.onboarded', employeeData);

    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// EMPLOYEE PROFILE
// ============================================

app.get('/api/employees/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    // Get profile from PeopleOS
    const profile = await corpPerksHub.getEmployeeProfile(employeeId);

    // Get employee twin
    const twin = await corpPerksHub.getEmployeeTwin(employeeId);

    // Get insights
    const insights = await corpPerksHub.getEmployeeInsights(employeeId);

    // Get colleagues
    const colleagues = await corpPerksHub.getColleagues(employeeId);

    res.json({ success: true, data: { profile, twin, insights, colleagues } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.patch('/api/employees/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const updates = req.body;

    const profile = await corpPerksHub.updateEmployeeProfile(employeeId, updates);

    // Update twin
    await corpPerksHub.updateEmployeeTwin(employeeId, updates);

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// EMPLOYEE BENEFITS
// ============================================

app.get('/api/employees/:employeeId/benefits', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const benefits = await corpPerksHub.getEmployeeBenefits(employeeId);
    res.json({ success: true, data: benefits });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// LEAVE MANAGEMENT
// ============================================

app.post('/api/leave/apply', async (req: Request, res: Response) => {
  try {
    const { employee_id, leave_type, start_date, end_date, reason } = req.body;

    const leave = await corpPerksHub.applyForLeave(employee_id, {
      leave_type,
      start_date,
      end_date,
      reason,
    });

    // Track event
    await corpPerksHub.trackEvent(employee_id, 'leave.applied', leave);

    res.json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/leave/balance/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const balance = await corpPerksHub.getLeaveBalance(employeeId);
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// EXPENSES
// ============================================

app.post('/api/expenses', async (req: Request, res: Response) => {
  try {
    const { employee_id, amount, category, description, receipt } = req.body;

    const expense = await corpPerksHub.submitExpense(employee_id, {
      amount,
      category,
      description,
      receipt,
    });

    // Track event
    await corpPerksHub.trackEvent(employee_id, 'expense.submitted', expense);

    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// PERFORMANCE & TRAINING
// ============================================

app.get('/api/performance/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const review = await corpPerksHub.getPerformanceReview(employeeId);
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/training/recommendations/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const recommendations = await corpPerksHub.getTrainingRecommendations(employeeId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// AI ASSISTANT
// ============================================

app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { employee_id, message } = req.body;

    // Chat with AI assistant
    const response = await corpPerksHub.chatWithAssistant(employee_id, message);

    // Store interaction
    await corpPerksHub.remember(employee_id, `HR Assistant: ${message}`);

    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// WALLET & PAYMENTS
// ============================================

app.get('/api/employees/:employeeId/wallet', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const balance = await corpPerksHub.getWalletBalance(employeeId);
    const points = await corpPerksHub.getLoyaltyPoints(employeeId);
    res.json({ success: true, data: { balance, points } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/payroll/disburse', async (req: Request, res: Response) => {
  try {
    const { employee_id, amount } = req.body;
    const result = await corpPerksHub.processPayroll(employee_id, amount);

    // Award points for payroll
    await corpPerksHub.awardPoints(employee_id, 50, 'payroll_received');

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// EMPLOYEE GOALS
// ============================================

app.post('/api/goals', async (req: Request, res: Response) => {
  try {
    const { employee_id, goal } = req.body;
    const result = await corpPerksHub.setEmployeeGoal(employee_id, goal);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/goals/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const goals = await corpPerksHub.getEmployeeGoals(employeeId);
    res.json({ success: true, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// GENIE PERSONAL AI
// ============================================

app.post('/api/genie/remember', async (req: Request, res: Response) => {
  try {
    const { employee_id, content } = req.body;
    const memory = await corpPerksHub.remember(employee_id, content);
    res.json({ success: true, data: memory });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/genie/recall', async (req: Request, res: Response) => {
  try {
    const { employee_id, query } = req.body;
    const memories = await corpPerksHub.recall(employee_id, query);
    res.json({ success: true, data: memories });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/genie/colleagues/track', async (req: Request, res: Response) => {
  try {
    const { employee_id, colleague_id, type } = req.body;
    const relationship = await corpPerksHub.trackRelationship(employee_id, colleague_id, type);
    res.json({ success: true, data: relationship });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/genie/colleagues/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const colleagues = await corpPerksHub.getColleagues(employeeId);
    res.json({ success: true, data: colleagues });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/genie/briefing/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const briefing = await corpPerksHub.generateBriefing(employeeId);
    res.json({ success: true, data: briefing });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// ANALYTICS
// ============================================

app.post('/api/analytics/track', async (req: Request, res: Response) => {
  try {
    const { employee_id, event, data } = req.body;
    await corpPerksHub.trackEvent(employee_id, event, data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  logger.info(`\n👥 CORPPERKS WORKFORCE OS (${PORT}) - Running ✅\n`);
  logger.info('Integrations:');
  logger.info(`  Unified Hub: ${process.env.UNIFIED_HUB_URL || 'http://localhost:4600'}`);
  logger.info(`  SUTAR TwinOS: ${process.env.SUTAR_TWIN_OS || 'http://localhost:4142'}`);
  logger.info(`  Genie Memory: ${process.env.GENIE_MEMORY || 'http://localhost:4703'}`);
});

export { app };
export default app;