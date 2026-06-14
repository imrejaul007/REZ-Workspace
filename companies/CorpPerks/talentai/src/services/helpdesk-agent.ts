/**
 * Helpdesk AI Agent - Port 4015
 * Answer employee queries, process requests
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Knowledge base
const knowledgeBase = {
  leave: {
    casual: 'You get 12 casual leaves per year. Balance: 8 days.',
    sick: 'You get 6 sick leaves per year. Balance: 2 days.',
    earned: 'Earned leaves are accrued at 1.5 days per month of worked.',
    policy: 'Leave policy: CL and SL can be taken any time. EL requires 3 months notice.',
  },
  payroll: {
    salary: 'Salaries are processed on the 28th of every month.',
    pf: 'PF deduction is 12% of basic salary (max ₹1800).',
    esi: 'ESI applies if gross salary is below ₹21,000.',
    tax: 'TDS is calculated on annual taxable income as per IT slabs.',
  },
  benefits: {
    health: 'Health insurance covers ₹5L for self + family.',
    life: 'Life insurance covers ₹10L.',
    meal: 'Meal allowance: ₹2,000/month.',
    learning: 'Learning budget: ₹10,000/year.',
  },
  policies: {
    wfh: 'Work from home is allowed 2 days/week with manager approval.',
    timing: 'Flexible hours: 9 AM - 6 PM with 1 hour lunch.',
    dress: 'Smart casual dress code in office.',
  },
  it: {
    laptop: 'Standard laptop: MacBook Pro 14" or Dell XPS.',
    software: 'Request software via IT portal.',
    vpn: 'VPN is required for remote access. Contact IT.',
  },
};

// Tickets
const tickets: Map<string, any> = new Map();
let ticketCounter = 1000;

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', agent: 'helpdesk', port: 4015 }));

// Query knowledge base
app.get('/kb/:category', (req, res) => {
  const category = req.params.category as keyof typeof knowledgeBase;
  if (!knowledgeBase[category]) {
    return res.status(404).json({ error: 'Category not found', categories: Object.keys(knowledgeBase) });
  }
  res.json({ category, data: knowledgeBase[category] });
});

// Get all categories
app.get('/kb', (_, res) => {
  res.json({ categories: Object.keys(knowledgeBase) });
});

// Chat with helpdesk AI
app.post('/chat', (req, res) => {
  const { employeeId, message } = req.body;

  const lowerMsg = message.toLowerCase();
  let response = "I'm here to help! Ask about leave, payroll, benefits, policies, or IT.";

  // Match keywords
  if (lowerMsg.includes('leave') || lowerMsg.includes('holiday') || lowerMsg.includes('pto')) {
    if (lowerMsg.includes('balance') || lowerMsg.includes('how many')) {
      response = knowledgeBase.leave.casual + '\n' + knowledgeBase.leave.sick;
    } else {
      response = knowledgeBase.leave.policy;
    }
  } else if (lowerMsg.includes('salary') || lowerMsg.includes('pay') || lowerMsg.includes('payroll')) {
    response = knowledgeBase.payroll.salary + '\n' + knowledgeBase.payroll.pf + '\n' + knowledgeBase.payroll.tax;
  } else if (lowerMsg.includes('insurance') || lowerMsg.includes('health') || lowerMsg.includes('benefit')) {
    response = knowledgeBase.benefits.health + '\n' + knowledgeBase.benefits.life + '\n' + knowledgeBase.benefits.meal;
  } else if (lowerMsg.includes('wfh') || lowerMsg.includes('remote') || lowerMsg.includes('work from')) {
    response = knowledgeBase.policies.wfh;
  } else if (lowerMsg.includes('laptop') || lowerMsg.includes('software') || lowerMsg.includes('it')) {
    response = knowledgeBase.it.laptop + '\n' + knowledgeBase.it.software;
  } else if (lowerMsg.includes('timing') || lowerMsg.includes('hours') || lowerMsg.includes('dress')) {
    response = knowledgeBase.policies.timing + '\n' + knowledgeBase.policies.dress;
  }

  res.json({ response, agent: 'helpdesk' });
});

// Create ticket
app.post('/ticket', (req, res) => {
  const { employeeId, category, subject, description, priority = 'medium' } = req.body;

  if (!employeeId || !subject) {
    return res.status(400).json({ error: 'Employee ID and subject required' });
  }

  const ticketId = `TKT${++ticketCounter}`;
  const ticket = {
    id: ticketId,
    employeeId,
    category: category || 'general',
    subject,
    description,
    priority,
    status: 'open',
    createdAt: new Date(),
    assignedTo: null,
    responses: [],
  };

  tickets.set(ticketId, ticket);

  res.json({
    ticket,
    message: `Ticket ${ticketId} created. We'll respond within 24 hours.`,
  });
});

// Get ticket status
app.get('/ticket/:id', (req, res) => {
  const ticket = tickets.get(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  res.json({ ticket });
});

// Update ticket
app.put('/ticket/:id', (req, res) => {
  const ticket = tickets.get(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const { status, response, assignedTo } = req.body;

  if (status) ticket.status = status;
  if (assignedTo) ticket.assignedTo = assignedTo;
  if (response) {
    ticket.responses.push({ text: response, timestamp: new Date() });
  }

  res.json({ ticket });
});

// List tickets
app.get('/tickets', (req, res) => {
  const employeeId = req.query.employeeId as string;

  let ticketList = Array.from(tickets.values());
  if (employeeId) {
    ticketList = ticketList.filter(t => t.employeeId === employeeId);
  }

  res.json({ tickets: ticketList });
});

// Leave request
app.post('/leave/request', (req, res) => {
  const { employeeId, type, startDate, endDate, reason } = req.body;

  if (!employeeId || !type || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const requestId = `LR${++ticketCounter}`;
  const request = {
    id: requestId,
    employeeId,
    type,
    startDate,
    endDate,
    reason,
    status: 'pending',
    createdAt: new Date(),
  };

  res.json({
    request,
    message: `Leave request ${requestId} submitted for approval.`,
    nextSteps: 'Your manager will be notified for approval.',
  });
});

const PORT = 4015;
app.listen(PORT, () => logger.info(`Helpdesk Agent running on port ${PORT}`));
