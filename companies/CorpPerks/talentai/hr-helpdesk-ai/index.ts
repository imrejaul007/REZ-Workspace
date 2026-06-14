import { logger } from '../../shared/logger';
/**
 * MyTalent HR Helpdesk AI Service
 * Port: 4004
 */

import express from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4004;

// FAQ Handler
app.post('/api/helpdesk/query', (req, res) => {
  const { question } = req.body;
  const q = question.toLowerCase();

  const answers = {
    leave: {
      policy: '15 days CL, 12 days SL, 5 days PL (women)',
      process: 'Apply via app → Manager approval → HR confirmation'
    },
    'policy': {
      wfh: 'Hybrid work available 2 days/week',
      office: '3 days/week mandatory',
      timing: '10 AM - 7 PM'
    },
    'salary': {
      payslip: 'Generated 5th of month',
      hike: 'Annual review in April',
      bonus: '1 month (eligible > 1 year'
    }
  };

  let answer = 'I\'ll connect you with HR';

  if (q.includes('leave') || q.includes('holiday')) {
    answer = answers.leave.policy + '\n\n' + answers.leave.process;
  } else if (q.includes('policy') || q.includes('wfh') || q.includes('office')) {
    answer = answers.policy.wfh + '\n' + answers.policy.timing;
  } else if (q.includes('salary') || q.includes('pay') || q.includes('bonus')) {
    answer = answers.salary.payslip + '\n' + answers.salary.hike;
  }

  res.json({ answer, category: 'hr_policy' });
});

// Leave Application
app.post('/api/helpdesk/leave', (req, res) => {
  const { employeeId, type, dates } = req.body;

  res.json({
    applicationId: `LV-${Date.now()}`,
    employeeId,
    type,
    dates,
    status: 'pending_approval',
    managerNotified: true
  });
});

// Grievance
app.post('/api/helpdesk/grievance', (req, res) => {
  const { employeeId, issue } = req.body;

  res.json({
    ticketId: `TKT-${Date.now()}`,
    employeeId,
    issue,
    status: 'logged',
    sla: '24 hours'
  });
});

app.listen(PORT, () => {
  logger.info(`HR Helpdesk AI on port ${PORT}`);
});

export default app;
